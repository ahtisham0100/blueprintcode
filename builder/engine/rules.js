// Blueprint Builder rules engine.
// Pure functions, no dependencies. Runs in the browser, a Cloudflare Worker and Node.
// Structured rules and catalogue data are the source of truth; nothing here calls AI.

/* ------------------------------------------------------------------ constants */

const RULE_TYPES = [
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'compatibility', label: 'Compatibility' },
  { id: 'recommendation', label: 'Recommendation' },
  { id: 'calculation', label: 'Calculation' },
  { id: 'price', label: 'Price' },
  { id: 'stock', label: 'Stock and region' },
  { id: 'approval', label: 'Approval' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'fallback', label: 'Fallback' },
];
const STATUSES = [
  { id: 'active', label: 'Active' },
  { id: 'disabled', label: 'Disabled' },
  { id: 'suggested', label: 'Suggested' },
];
const SOURCES = [
  { id: 'client', label: 'Client' },
  { id: 'bpc', label: 'BPC recommendation' },
  { id: 'ai', label: 'AI suggestion' },
];
const OPS = {
  eq: { label: 'is', types: ['number'] },
  ne: { label: 'is not', types: ['number'] },
  gt: { label: 'is more than', types: ['number'] },
  gte: { label: 'is at least', types: ['number'] },
  lt: { label: 'is less than', types: ['number'] },
  lte: { label: 'is at most', types: ['number'] },
  between: { label: 'is between', types: ['number'] },
  is: { label: 'is', types: ['enum', 'text'] },
  is_not: { label: 'is not', types: ['enum', 'text'] },
  in: { label: 'is any of', types: ['enum'] },
  not_in: { label: 'is none of', types: ['enum'] },
  contains: { label: 'includes', types: ['list', 'text'] },
  not_contains: { label: "doesn't include", types: ['list', 'text'] },
  contains_any: { label: 'includes any of', types: ['list'] },
  exists: { label: 'is filled in', types: ['enum', 'text', 'number', 'list'] },
  missing: { label: 'is empty', types: ['enum', 'text', 'number', 'list'] },
};
const ACTIONS = {
  exclude: { label: 'Exclude it', hardCapable: true },
  include: { label: 'Include it anyway' },
  boost: { label: 'Rank it higher' },
  demote: { label: 'Rank it lower' },
  adjust_price: { label: 'Adjust the price' },
  quote_only: { label: 'Make it quote-only' },
  require_approval: { label: 'Require staff approval' },
  calculate: { label: 'Calculate a value' },
  message: { label: 'Show a message' },
  handoff: { label: 'Hand to staff' },
  relax: { label: 'Relax a requirement (fallback)' },
};
const PRICE_ROUNDING = { none: 'No rounding', '0.01': 'Nearest penny', '1': 'Nearest pound', '5': 'Nearest £5', '0.99': 'Down to .99' };
const CALC_ROUNDING = { none: 'No rounding', up: 'Round up', down: 'Round down', nearest: 'Round to nearest' };

const STOP = new Set(('show me all the a an and or in for with some any find i want need please looking of only items ' +
  'products that are which what have has do you your our we us my get see give list something things stuff but also ' +
  'either both from range').split(' '));
const NEG = new Set(['not', 'no', 'without', 'except', 'excluding', 'exclude', 'excl', 'non']);

/* ------------------------------------------------------------------ helpers */

const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[’']/g, "'").trim();
const clone = (o) => JSON.parse(JSON.stringify(o));
const isNum = (v) => typeof v === 'number' && isFinite(v);
const asArray = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);

function fieldMap(cat) {
  const m = {};
  (cat.fields || []).forEach((f) => { m[f.id] = f; });
  return m;
}
function contextMap(cat) {
  const m = {};
  (cat.context || []).forEach((f) => { m[f.id] = f; });
  return m;
}
function fieldValues(cat, fieldId) {
  const f = fieldMap(cat)[fieldId];
  if (f && f.values) return f.values.slice();
  const s = new Set();
  (cat.items || []).forEach((it) => asArray(it[fieldId]).forEach((v) => { if (v !== '' && v != null) s.add(String(v)); }));
  return [...s].sort();
}
function priceField(cat) {
  const f = (cat.fields || []).find((x) => x.price) || (cat.fields || []).find((x) => x.id === 'price');
  return f ? f.id : null;
}
function labelOf(cat, fieldId, scope) {
  const f = scope === 'request' ? contextMap(cat)[fieldId] || fieldMap(cat)[fieldId] : fieldMap(cat)[fieldId];
  return f ? f.label : fieldId;
}

/* ------------------------------------------------------------------ vocabulary and request parsing */

function buildVocab(cat) {
  const vocab = new Map();
  const add = (phrase, field, value, prefix) => {
    const k = norm(phrase);
    if (!k) return;
    const arr = vocab.get(k) || [];
    if (!arr.some((x) => x.field === field && x.value === value)) arr.push({ field, value, prefix });
    vocab.set(k, arr);
  };
  (cat.fields || []).filter((f) => (f.type === 'enum' || f.type === 'list') && f.parse_priority != null).forEach((f) => {
    const prefix = f.parse_prefix || null;
    fieldValues(cat, f.id).forEach((v) => {
      const n = norm(v);
      const needsPrefix = prefix && n.length <= 2 ? prefix : null;
      add(n, f.id, v, needsPrefix);
      if (n.length > 2) {
        if (!n.endsWith('s')) { add(n + 's', f.id, v); if (/(sh|ch|x|z)$/.test(n)) add(n + 'es', f.id, v); }
        else if (!n.endsWith('ss')) add(n.slice(0, -1), f.id, v);
      }
      asArray((f.synonyms || {})[v]).forEach((syn) => add(syn, f.id, v));
    });
  });
  return vocab;
}

function extractNumbers(text, cat) {
  const pf = priceField(cat);
  const out = [];
  let t = ' ' + text + ' ';
  const money = '(?:£|\\$|€)?\\s*(\\d+(?:\\.\\d+)?)';
  const take = (re, fn) => {
    t = t.replace(re, (...m) => { const c = fn(m); if (c) out.push(c); return ' '; });
  };
  if (pf) {
    take(new RegExp('\\bbetween\\s+' + money + '\\s+(?:and|to|-)\\s+' + money, 'gi'),
      (m) => ({ field: pf, op: 'between', value: [+m[1], +m[2]].sort((a, b) => a - b), text: m[0].trim() }));
    take(new RegExp('(?:£|\\$|€)\\s*(\\d+(?:\\.\\d+)?)\\s*(?:-|to)\\s*(?:£|\\$|€)?\\s*(\\d+(?:\\.\\d+)?)', 'gi'),
      (m) => ({ field: pf, op: 'between', value: [+m[1], +m[2]].sort((a, b) => a - b), text: m[0].trim() }));
    take(new RegExp('\\b(under|below|less than|cheaper than)\\s+' + money, 'gi'),
      (m) => ({ field: pf, op: 'lt', value: +m[2], text: m[0].trim() }));
    take(new RegExp('\\b(up to|max|maximum|no more than)\\s+' + money, 'gi'),
      (m) => ({ field: pf, op: 'lte', value: +m[2], text: m[0].trim() }));
    take(new RegExp('\\b(over|above|more than)\\s+' + money, 'gi'),
      (m) => ({ field: pf, op: 'gt', value: +m[2], text: m[0].trim() }));
    take(new RegExp('\\b(at least|from|minimum)\\s+' + money, 'gi'),
      (m) => ({ field: pf, op: 'gte', value: +m[2], text: m[0].trim() }));
  }
  Object.entries(cat.phrases || {}).forEach(([phrase, c]) => {
    take(new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'),
      () => ({ field: c.field, op: c.op, value: c.value, text: phrase }));
  });
  return { numeric: out, rest: t };
}

/**
 * Turn a free-text request into structured constraints.
 * Values within a field are OR'd; fields are AND'd; negated values are excluded.
 */
function parseRequest(cat, text) {
  const vocab = buildVocab(cat);
  const fm = fieldMap(cat);
  const { numeric, rest } = extractNumbers(norm(text), cat);
  const matched = [];
  const unresolved = [];
  const ambiguous = [];
  const clauses = rest.split(/[,;.!?]+/);
  const maxN = 3;
  const prefixes = new Set((cat.fields || []).flatMap((f) => f.parse_prefix || []));
  const CONJ = new Set(['and', 'or', 'plus', '&']);
  let seg = 0;

  clauses.forEach((clause) => {
    seg++;
    const tokens = clause.split(/[^a-z0-9£$€&-]+/).filter(Boolean);
    let negField = null;
    let negPending = false;
    for (let i = 0; i < tokens.length;) {
      const tok = tokens[i];
      if (CONJ.has(tok)) { seg++; i++; continue; }
      if (NEG.has(tok)) { negPending = true; negField = null; i++; continue; }
      let hit = null;
      let len = 0;
      for (let n = Math.min(maxN, tokens.length - i); n >= 1; n--) {
        const phrase = tokens.slice(i, i + n).join(' ');
        const opts = vocab.get(phrase);
        if (opts) {
          const usable = opts.filter((o) => !o.prefix || (i > 0 && o.prefix.includes(tokens[i - 1])));
          if (usable.length) { hit = { phrase, opts: usable }; len = n; break; }
        }
      }
      if (!hit) {
        if (!STOP.has(tok) && !/^\d+$/.test(tok) && !prefixes.has(tok)) unresolved.push(tok);
        i++;
        continue;
      }
      const sorted = hit.opts.slice().sort((a, b) => (fm[a.field].parse_priority || 99) - (fm[b.field].parse_priority || 99));
      const pick = sorted[0];
      if (sorted.length > 1) ambiguous.push({ phrase: hit.phrase, chosen: pick, options: sorted });
      let negative = false;
      if (negPending) { negative = true; negField = pick.field; negPending = false; }
      else if (negField && negField === pick.field) negative = true;
      else negField = null;
      matched.push({ phrase: hit.phrase, field: pick.field, value: pick.value, negative, seg });
      i += len;
    }
  });

  // Group segments. A segment starts a new group when it names its own product type
  // with its own attributes and the current group already has a product type.
  // Otherwise attributes are shared: "blue and green linen shirts and trousers" is one group.
  const primary = (cat.fields || []).filter((f) => f.parse_priority != null).sort((a, b) => a.parse_priority - b.parse_priority)[0];
  const segs = [];
  matched.forEach((m) => { let sg = segs.find((x) => x.seg === m.seg); if (!sg) { sg = { seg: m.seg, items: [] }; segs.push(sg); } sg.items.push(m); });
  const groups = [];
  let cur = null;
  segs.forEach((sg) => {
    const hasPrimary = primary && sg.items.some((m) => m.field === primary.id && !m.negative);
    const hasOther = sg.items.some((m) => !primary || m.field !== primary.id);
    const curHasPrimary = cur && primary && cur.some((m) => m.field === primary.id && !m.negative);
    if (!cur || (hasPrimary && hasOther && curHasPrimary)) { cur = []; groups.push(cur); }
    sg.items.forEach((m) => cur.push(m));
  });
  const toCons = (list) => {
    const c = {};
    list.forEach((m) => {
      const x = (c[m.field] = c[m.field] || { in: [], not_in: [] });
      const b = m.negative ? x.not_in : x.in;
      if (!b.includes(m.value)) b.push(m.value);
    });
    return c;
  };
  const groupCons = groups.length ? groups.map(toCons) : [{}];
  const constraints = {};
  groupCons.forEach((g) => Object.entries(g).forEach(([f, c]) => {
    const x = (constraints[f] = constraints[f] || { in: [], not_in: [] });
    c.in.forEach((v) => { if (!x.in.includes(v)) x.in.push(v); });
    c.not_in.forEach((v) => { if (!x.not_in.includes(v)) x.not_in.push(v); });
  }));
  return { text, constraints, groups: groupCons, numeric, matched, unresolved: [...new Set(unresolved)], ambiguous };
}

function describeConstraints(cat, parsed) {
  const lines = [];
  const groups = parsed.groups && parsed.groups.length ? parsed.groups : [parsed.constraints];
  groups.forEach((g, gi) => {
    const tag = groups.length > 1 ? `Request ${gi + 1}: ` : '';
    const parts = [];
    Object.entries(g).forEach(([f, c]) => {
      const label = labelOf(cat, f);
      if (c.in.length) parts.push({ field: f, group: gi, text: `${tag}${label}: ${c.in.join(' or ')}` });
      if (c.not_in.length) parts.push({ field: f, group: gi, text: `${tag}${label}: not ${c.not_in.join(' or ')}`, negative: true });
    });
    lines.push(...parts);
  });
  parsed.numeric.forEach((n) => lines.push({ field: n.field, text: `${labelOf(cat, n.field)} ${OPS[n.op].label} ${Array.isArray(n.value) ? n.value.join(' and ') : n.value}` }));
  return lines;
}

/* ------------------------------------------------------------------ matching */

function numericOk(v, op, value) {
  if (!isNum(v)) return false;
  switch (op) {
    case 'eq': return v === value;
    case 'ne': return v !== value;
    case 'gt': return v > value;
    case 'gte': return v >= value;
    case 'lt': return v < value;
    case 'lte': return v <= value;
    case 'between': return v >= value[0] && v <= value[1];
    default: return false;
  }
}

function groupFailures(cat, item, constraints) {
  const fm = fieldMap(cat);
  const fails = [];
  Object.entries(constraints).forEach(([f, c]) => {
    const vals = asArray(item[f]).map(String);
    if (c.in.length && !c.in.some((v) => vals.includes(String(v)))) fails.push(`${fm[f] ? fm[f].label : f} isn't ${c.in.join(' or ')}`);
    if (c.not_in.length && c.not_in.some((v) => vals.includes(String(v)))) fails.push(`${fm[f] ? fm[f].label : f} is ${c.not_in.filter((v) => vals.includes(String(v))).join(', ')}`);
  });
  return fails;
}

/** An item matches if it satisfies any request group and every numeric constraint. */
function requestFailures(cat, item, groups, numeric) {
  const list = Array.isArray(groups) ? groups : [groups];
  let best = null;
  for (const g of (list.length ? list : [{}])) {
    const f = groupFailures(cat, item, g);
    if (!best || f.length < best.length) best = f;
    if (!f.length) break;
  }
  const fails = best.slice();
  numeric.forEach((n) => {
    if (!numericOk(item[n.field], n.op, n.value)) fails.push(`${labelOf(cat, n.field)} doesn't meet "${n.text}"`);
  });
  return fails;
}

function resolveValue(v, item, req, computed) {
  if (v && typeof v === 'object' && !Array.isArray(v) && v.ref) {
    const [scope, f] = v.ref.split('.');
    if (scope === 'request') return req ? req[f] : undefined;
    if (scope === 'item') return computed && f in computed ? computed[f] : item ? item[f] : undefined;
  }
  return v;
}

/** Evaluate a condition or group. optimistic=true treats request-dependent conditions as satisfiable (used for analysis). */
function condTrue(cond, item, req, computed, optimistic) {
  if (cond.items) {
    const active = cond.items.filter((c) => !c.disabled);
    if (!active.length) return true;
    return cond.op === 'any'
      ? active.some((c) => condTrue(c, item, req, computed, optimistic))
      : active.every((c) => condTrue(c, item, req, computed, optimistic));
  }
  const refIsRequest = cond.value && cond.value.ref && cond.value.ref.startsWith('request.');
  if (optimistic && (cond.scope === 'request' || refIsRequest)) return true;
  let left;
  if (cond.scope === 'request') left = req ? req[cond.field] : undefined;
  else {
    if (!item) return false;
    left = computed && cond.field in computed ? computed[cond.field] : item[cond.field];
  }
  const right = resolveValue(cond.value, item, req, computed);
  const L = asArray(left).map((x) => (typeof x === 'number' ? x : norm(x)));
  const R = asArray(right).map((x) => (typeof x === 'number' ? x : norm(x)));
  switch (cond.op) {
    case 'eq': case 'ne': case 'gt': case 'gte': case 'lt': case 'lte':
      return numericOk(typeof left === 'number' ? left : parseFloat(left), cond.op, +right);
    case 'between': return numericOk(typeof left === 'number' ? left : parseFloat(left), 'between', asArray(right).map(Number));
    case 'is': return L.length > 0 && R.length > 0 && L.includes(R[0]);
    case 'is_not': return !(L.length > 0 && R.length > 0 && L.includes(R[0]));
    case 'in': case 'contains_any': return L.some((x) => R.includes(x));
    case 'not_in': return !L.some((x) => R.includes(x));
    case 'contains':
      if (typeof left === 'string') return norm(left).includes(R[0]);
      return R.length > 0 && R.every((x) => L.includes(x));
    case 'not_contains':
      if (typeof left === 'string') return !norm(left).includes(R[0]);
      return !(R.length > 0 && R.every((x) => L.includes(x)));
    case 'exists': return L.length > 0;
    case 'missing': return L.length === 0;
    default: return false;
  }
}

/* ------------------------------------------------------------------ calculations */

function evalExpr(expr, vars) {
  const src = String(expr);
  const toks = [];
  const re = /\s*(\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|[-+*/(),])/y;
  let m;
  re.lastIndex = 0;
  while (re.lastIndex < src.length) {
    const before = re.lastIndex;
    m = re.exec(src);
    if (!m) { if (/^\s*$/.test(src.slice(before))) break; throw new Error(`Can't read "${src.slice(before).trim()}"`); }
    toks.push(m[1]);
  }
  let p = 0;
  const FN = { min: Math.min, max: Math.max, round: Math.round, ceil: Math.ceil, floor: Math.floor, abs: Math.abs };
  const peek = () => toks[p];
  const next = () => toks[p++];
  function expression() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const o = next(); const r = term(); v = o === '+' ? v + r : v - r; }
    return v;
  }
  function term() {
    let v = factor();
    while (peek() === '*' || peek() === '/') { const o = next(); const r = factor(); v = o === '*' ? v * r : v / r; }
    return v;
  }
  function factor() {
    const t = next();
    if (t === undefined) throw new Error('The formula ends too early');
    if (t === '-') return -factor();
    if (t === '(') { const v = expression(); if (next() !== ')') throw new Error('Missing )'); return v; }
    if (/^\d/.test(t)) return parseFloat(t);
    if (peek() === '(') {
      if (!FN[t]) throw new Error(`Unknown function ${t}`);
      next();
      const args = [];
      if (peek() !== ')') { args.push(expression()); while (peek() === ',') { next(); args.push(expression()); } }
      if (next() !== ')') throw new Error('Missing )');
      return FN[t](...args);
    }
    if (!(t in vars)) throw new Error(`Unknown field "${t}"`);
    const v = parseFloat(vars[t]);
    if (!isFinite(v)) throw new Error(`"${t}" isn't a number`);
    return v;
  }
  const v = expression();
  if (p < toks.length) throw new Error(`Unexpected "${toks[p]}"`);
  return v;
}

function roundCalc(v, mode) {
  if (mode === 'up') return Math.ceil(v);
  if (mode === 'down') return Math.floor(v);
  if (mode === 'nearest') return Math.round(v);
  return v;
}
function roundPrice(v, mode) {
  switch (String(mode)) {
    case '0.01': return Math.round(v * 100) / 100;
    case '1': return Math.round(v);
    case '5': return Math.round(v / 5) * 5;
    case '0.99': return Math.max(0, Math.floor(v) - 0.01);
    default: return v;
  }
}
function interpolate(text, item, req, computed) {
  return String(text || '').replace(/\{([a-z_.]+)\}/gi, (_, k) => {
    if (k.startsWith('request.')) return req ? asArray(req[k.slice(8)]).join(', ') : '';
    if (computed && k in computed) return computed[k];
    if (item && k in item) return asArray(item[k]).join(', ');
    return '{' + k + '}';
  });
}

/* ------------------------------------------------------------------ evaluation */

const byPriority = (a, b) => (a.priority || 0) - (b.priority || 0) || String(a.id).localeCompare(String(b.id));

function buildRequestContext(cat, parsed, context) {
  const req = {};
  (cat.context || []).forEach((c) => { req[c.id] = context && context[c.id] !== undefined && context[c.id] !== '' ? context[c.id] : c.default; });
  (cat.context || []).forEach((c) => { if (c.type === 'number') req[c.id] = parseFloat(req[c.id]) || 0; });
  Object.entries(parsed.constraints).forEach(([f, c]) => { req[f] = c.in.slice(); });
  return req;
}

function applicableRules(rules, opts) {
  return rules.filter((r) => r.status === 'active' || (opts && opts.previewSuggestions && r.status === 'suggested')).sort(byPriority);
}

function runRules(cat, items, rules, req, groups, numeric) {
  const pf = priceField(cat);
  const out = [];
  items.forEach((item) => {
    const st = {
      item, price: pf ? item[pf] : null, basePrice: pf ? item[pf] : null, score: 0, computed: {}, messages: [],
      approval: [], quoteOnly: false, handoff: [], trace: [], exclusions: [], inclusions: [], errors: [],
      requestFails: requestFailures(cat, item, groups, numeric),
    };
    rules.forEach((rule) => {
      let fires = false;
      try { fires = condTrue(rule.when, item, req, st.computed, false); } catch (e) { st.errors.push({ rule: rule.id, text: e.message }); }
      if (!fires) return;
      const effects = [];
      (rule.then || []).forEach((a) => {
        try {
          switch (a.action) {
            case 'exclude':
              st.exclusions.push({ rule, message: interpolate(a.message || 'Excluded', item, req, st.computed) });
              effects.push('Excluded' + (a.message ? ': ' + interpolate(a.message, item, req, st.computed) : ''));
              break;
            case 'include':
              st.inclusions.push({ rule, message: interpolate(a.message || '', item, req, st.computed) });
              effects.push('Asked to include');
              break;
            case 'boost': st.score += +a.amount || 0; effects.push(`Ranked +${+a.amount || 0}`); break;
            case 'demote': st.score -= +a.amount || 0; effects.push(`Ranked −${+a.amount || 0}`); break;
            case 'adjust_price': {
              if (st.price == null) break;
              const before = st.price;
              const amt = +a.amount || 0;
              st.price = roundPrice(a.mode === 'percent' ? st.price * (1 + amt / 100) : st.price + amt, a.round);
              effects.push(`Price ${before} → ${st.price}`);
              break;
            }
            case 'quote_only': st.quoteOnly = true; if (a.message) st.messages.push(interpolate(a.message, item, req, st.computed)); effects.push('Quote only'); break;
            case 'require_approval': st.approval.push(interpolate(a.message || 'Needs staff approval', item, req, st.computed)); effects.push('Needs approval'); break;
            case 'handoff': st.handoff.push(interpolate(a.message || 'Handed to staff', item, req, st.computed)); effects.push('Handed to staff'); break;
            case 'calculate': {
              const v = roundCalc(evalExpr(a.expr, Object.assign({}, item, st.computed)), a.round);
              st.computed[a.target] = v;
              effects.push(`${a.target} = ${v}`);
              break;
            }
            case 'message': st.messages.push(interpolate(a.text, item, req, st.computed)); effects.push('Message'); break;
            default: break;
          }
        } catch (e) {
          st.errors.push({ rule: rule.id, text: e.message });
          effects.push('Error: ' + e.message);
        }
      });
      st.trace.push({ rule: rule.id, name: rule.name, effects });
    });

    // Resolve exclusions and inclusions independently of order.
    const hard = st.exclusions.filter((x) => x.rule.hard);
    const soft = st.exclusions.filter((x) => !x.rule.hard);
    st.blocked = [];
    if (hard.length) {
      st.excludedBy = hard[0];
      st.inclusions.forEach((inc) => st.blocked.push({ rule: inc.rule.id, over: hard[0].rule.id,
        text: `${inc.rule.id} can't override hard rule ${hard[0].rule.id}` }));
    } else if (soft.length) {
      const inc = st.inclusions[0];
      if (inc) { st.excludedBy = null; st.reincludedBy = inc.rule.id; st.overrode = soft.map((s) => s.rule.id); }
      else st.excludedBy = soft[0];
    } else st.excludedBy = null;
    out.push(st);
  });
  return out;
}

function sortResults(list) {
  return list.sort((a, b) => b.score - a.score || (a.price == null ? 1 : 0) - (b.price == null ? 1 : 0) || (a.price || 0) - (b.price || 0) || String(a.item.name || '').localeCompare(String(b.item.name || '')));
}

function coverage(cat, parsed, states) {
  const fm = fieldMap(cat);
  const groups = parsed.groups && parsed.groups.length ? parsed.groups : [parsed.constraints];
  const cells = [];
  let dims = [];
  groups.forEach((g, gi) => {
    const fields = Object.keys(g).filter((f) => g[f].in.length);
    if (!fields.length) return;
    const multi = fields.filter((f) => g[f].in.length > 1);
    if (gi === 0) dims = multi;
    const combos = multi.reduce((acc, f) => acc.flatMap((c) => g[f].in.map((v) => Object.assign({}, c, { [f]: v }))), [{}]);
    const phraseFields = fields.slice().sort((a, b) => ((fm[a] && fm[a].phrase_order) || 0) - ((fm[b] && fm[b].phrase_order) || 0));
    combos.forEach((combo) => {
      const cons = {};
      Object.entries(g).forEach(([f, c]) => { cons[f] = { in: combo[f] !== undefined ? [combo[f]] : c.in.slice(), not_in: c.not_in.slice() }; });
      const inCat = states.filter((s) => requestFailures(cat, s.item, [cons], parsed.numeric).length === 0);
      const shown = inCat.filter((s) => !s.excludedBy);
      const label = phraseFields.map((f) => (combo[f] !== undefined ? combo[f] : g[f].in.join('/'))).join(' ');
      const excludedRules = [...new Set(inCat.filter((s) => s.excludedBy).map((s) => s.excludedBy.rule.id))];
      let explain;
      if (!inCat.length) explain = `No ${label} in the catalogue.`;
      else if (!shown.length) explain = `${inCat.length} ${label} in the catalogue, but all excluded by ${excludedRules.join(', ')}.`;
      else explain = `${shown.length} shown` + (inCat.length > shown.length ? `, ${inCat.length - shown.length} excluded by ${excludedRules.join(', ')}` : '') + '.';
      cells.push({ group: gi, combo, label, inCatalogue: inCat.length, shown: shown.length, excludedRules, explain, gap: shown.length === 0 });
    });
  });
  return { dims, groups: groups.length, cells };
}

/**
 * Evaluate a request against the catalogue and rules.
 * Returns interpreted constraints, results with rule traces, exclusions, coverage gaps and fallbacks used.
 */
function evaluate(cat, rules, requestText, context, opts) {
  opts = opts || {};
  const parsed = opts.parsed || parseRequest(cat, requestText);
  const req = buildRequestContext(cat, parsed, context);
  const active = applicableRules(rules, opts);
  const normal = active.filter((r) => r.type !== 'fallback');
  const fallbacks = active.filter((r) => r.type === 'fallback');

  let groups = clone(parsed.groups && parsed.groups.length ? parsed.groups : [parsed.constraints]);
  let states = runRules(cat, cat.items || [], normal, req, groups, parsed.numeric);
  const pick = () => sortResults(states.filter((s) => !s.requestFails.length && !s.excludedBy));
  let results = pick();
  const fallbackUsed = [];
  if (!results.length) {
    for (const fb of fallbacks) {
      if (!condTrue(fb.when, null, req, {}, false)) continue;
      const notes = [];
      let relaxed = false;
      (fb.then || []).forEach((a) => {
        if (a.action === 'relax' && groups.some((g) => g[a.field])) { groups.forEach((g) => { delete g[a.field]; }); relaxed = true; notes.push(`Dropped the ${labelOf(cat, a.field).toLowerCase()} requirement`); }
        if (a.action === 'message') notes.push(interpolate(a.text, null, req, {}));
        if (a.action === 'handoff') notes.push(interpolate(a.message || 'Handed to staff', null, req, {}));
      });
      if (relaxed) { states = runRules(cat, cat.items || [], normal, req, groups, parsed.numeric); results = pick(); }
      fallbackUsed.push({ rule: fb.id, name: fb.name, notes, relaxed, results: results.length });
      if (results.length) break;
    }
  }

  const excluded = states.filter((s) => !s.requestFails.length && s.excludedBy).map((s) => ({
    item: s.item, rule: s.excludedBy.rule.id, hard: !!s.excludedBy.rule.hard, message: s.excludedBy.message, blocked: s.blocked,
  }));
  const blocked = [];
  states.forEach((s) => (s.blocked || []).forEach((b) => blocked.push(Object.assign({ sku: s.item.sku, name: s.item.name }, b))));
  const triggered = {};
  states.filter((s) => !s.requestFails.length).forEach((s) => s.trace.forEach((t) => { triggered[t.rule] = (triggered[t.rule] || 0) + 1; }));
  const approvals = [...new Set(results.flatMap((s) => s.approval))];
  const handoffs = [...new Set(results.flatMap((s) => s.handoff))];
  const errors = [];
  states.forEach((s) => s.errors.forEach((e) => { if (!errors.some((x) => x.rule === e.rule && x.text === e.text)) errors.push(e); }));

  return {
    parsed, request: req, interpretation: describeConstraints(cat, parsed),
    results, excluded, blocked, fallbackUsed, triggered, approvals, handoffs, errors,
    coverage: coverage(cat, parsed, states),
    notMatchingRequest: states.filter((s) => s.requestFails.length).length,
    sample: !!cat.sample,
  };
}

/* ------------------------------------------------------------------ rule analysis */

function allFieldTypes(cat) {
  const t = {};
  (cat.fields || []).forEach((f) => { t['item.' + f.id] = f.type; });
  (cat.context || []).forEach((f) => { t['request.' + f.id] = f.type; });
  (cat.fields || []).filter((f) => f.type === 'enum' || f.type === 'list').forEach((f) => { t['request.' + f.id] = t['request.' + f.id] || 'list'; });
  return t;
}
function eachCondition(group, fn, path) {
  (group.items || []).forEach((c, i) => {
    const p = (path || []).concat(i);
    if (c.items) eachCondition(c, fn, p); else fn(c, p);
  });
}
function conditionFields(rule) {
  const s = [];
  eachCondition(rule.when || { items: [] }, (c) => s.push((c.scope || 'item') + '.' + c.field));
  return s;
}

function analyseRules(cat, rules) {
  const issues = [];
  const types = allFieldTypes(cat);
  const add = (level, rule, text) => issues.push({ level, rule: rule ? rule.id : null, text });
  const ids = new Set();
  rules.forEach((r) => {
    if (ids.has(r.id)) add('error', r, `Duplicate rule ID ${r.id}.`);
    ids.add(r.id);
    if (!r.name || !String(r.name).trim()) add('warning', r, 'Give the rule a name.');
    if (!r.then || !r.then.length) add('error', r, 'Add at least one THEN action.');
    if (!r.because || !String(r.because).trim()) add('warning', r, 'Add a BECAUSE reason so the team knows why this rule exists.');
    if (r.type !== 'fallback' && (!r.when || !(r.when.items || []).length)) add('warning', r, 'No WHEN conditions, so this rule applies to everything.');
    eachCondition(r.when || { items: [] }, (c) => {
      const key = (c.scope || 'item') + '.' + c.field;
      const type = types[key];
      if (!type) { add('error', r, `Unknown field "${c.field}". Add it to the catalogue or choose another.`); return; }
      if (!OPS[c.op]) add('error', r, `Unknown comparison "${c.op}".`);
      else if (!OPS[c.op].types.includes(type)) add('error', r, `"${OPS[c.op].label}" doesn't work with ${labelOf(cat, c.field, c.scope)}.`);
      const v = c.value;
      if (v && v.ref) { if (!types[v.ref]) add('error', r, `Unknown reference ${v.ref}.`); return; }
      if (['exists', 'missing'].includes(c.op)) return;
      if (type === 'number') {
        if (c.op === 'between') {
          const a = asArray(v).map(Number);
          if (a.length !== 2 || a.some((x) => !isFinite(x))) add('error', r, `${labelOf(cat, c.field, c.scope)} needs two numbers.`);
          else if (a[0] > a[1]) add('error', r, `${labelOf(cat, c.field, c.scope)}: the first number is bigger than the second.`);
        } else if (!isFinite(parseFloat(v))) add('error', r, `${labelOf(cat, c.field, c.scope)} needs a number.`);
      } else {
        const vals = asArray(v);
        if (!vals.length || vals.some((x) => String(x).trim() === '')) { add('error', r, `Choose a value for ${labelOf(cat, c.field, c.scope)}.`); return; }
        if (type === 'enum' || type === 'list') {
          const known = (c.scope === 'request' && contextMap(cat)[c.field]) ? fieldValues(cat, c.field).concat(contextMap(cat)[c.field].values || []) : fieldValues(cat, c.field);
          const knownN = known.map(norm);
          vals.filter((x) => !knownN.includes(norm(x))).forEach((x) => add('warning', r, `No sample item has ${labelOf(cat, c.field, c.scope).toLowerCase()} "${x}".`));
        }
      }
    });
    (r.then || []).forEach((a) => {
      if (!ACTIONS[a.action]) { add('error', r, `Unknown action "${a.action}".`); return; }
      if (['boost', 'demote', 'adjust_price'].includes(a.action) && !isFinite(parseFloat(a.amount))) add('error', r, `${ACTIONS[a.action].label} needs an amount.`);
      if (a.action === 'calculate') {
        if (!a.target) add('error', r, 'Name the value being calculated.');
        const vars = {};
        (cat.fields || []).filter((f) => f.type === 'number').forEach((f) => { vars[f.id] = 1; });
        rules.forEach((x) => (x.then || []).forEach((y) => { if (y.action === 'calculate' && y.target) vars[y.target] = 1; }));
        try { evalExpr(a.expr, vars); } catch (e) { add('error', r, `Formula: ${e.message}.`); }
      }
      if (a.action === 'relax') {
        if (r.type !== 'fallback') add('warning', r, 'Relax only runs in fallback rules. Change the rule type to Fallback.');
        if (!fieldMap(cat)[a.field]) add('error', r, `Relax: unknown field "${a.field}".`);
      }
      if (a.action === 'include' && r.hard) add('warning', r, "A hard rule that includes items can't stop other hard rules excluding them.");
    });
    if (r.source === 'ai' && r.status === 'active' && !r.approvedBy) add('warning', r, 'AI suggestion is active without client approval.');
  });

  // Overlaps between rules, over the sample catalogue.
  const live = rules.filter((r) => r.status !== 'disabled');
  const sets = {};
  live.forEach((r) => {
    if (r.type === 'fallback') return;
    try { sets[r.id] = new Set((cat.items || []).filter((it) => condTrue(r.when, it, null, {}, true)).map((it) => it.sku)); }
    catch (e) { sets[r.id] = new Set(); }
    const itemScoped = conditionFields(r).some((f) => f.startsWith('item.'));
    if (itemScoped && sets[r.id].size === 0 && r.status === 'active') add('warning', r, 'Matches none of the sample items.');
  });
  const overlap = (a, b) => [...sets[a.id] || []].filter((x) => (sets[b.id] || new Set()).has(x)).length;
  const has = (r, act) => (r.then || []).some((a) => a.action === act);
  for (let i = 0; i < live.length; i++) {
    for (let j = 0; j < live.length; j++) {
      if (i === j) continue;
      const a = live[i], b = live[j];
      if (!sets[a.id] || !sets[b.id]) continue;
      const n = overlap(a, b);
      if (!n) continue;
      if (has(a, 'exclude') && has(b, 'include')) {
        if (a.hard) add('info', b, `Can't override hard rule ${a.id}, which excludes ${n} of the same items.`);
        else add('conflict', b, `Re-includes ${n} items that ${a.id} excludes. Decide which should win.`);
      }
      if (i < j && has(a, 'adjust_price') && has(b, 'adjust_price')) add('info', a.priority <= b.priority ? b : a, `Price adjustments stack with ${a.priority <= b.priority ? a.id : b.id} on ${n} items, applied in priority order.`);
      if (i < j) {
        const ta = (a.then || []).filter((x) => x.action === 'calculate').map((x) => x.target);
        const tb = (b.then || []).filter((x) => x.action === 'calculate').map((x) => x.target);
        ta.filter((t) => tb.includes(t)).forEach((t) => add('conflict', a.priority <= b.priority ? b : a, `Both ${a.id} and ${b.id} calculate "${t}" for ${n} items; the later one wins.`));
        if (JSON.stringify(a.when) === JSON.stringify(b.when) && JSON.stringify(a.then) === JSON.stringify(b.then)) add('warning', b, `Duplicate of ${a.id}.`);
        if (a.priority === b.priority && a.status === 'active' && b.status === 'active') add('info', b, `Same priority as ${a.id}; order between them falls back to ID.`);
      }
    }
  }
  return issues;
}

/** Fields rules rely on that the catalogue doesn't have. */
function missingFields(cat, rules) {
  const types = allFieldTypes(cat);
  const missing = new Map();
  rules.filter((r) => r.status !== 'disabled').forEach((r) => {
    conditionFields(r).forEach((k) => { if (!types[k]) missing.set(k, (missing.get(k) || []).concat(r.id)); });
    (r.then || []).forEach((a) => { if (a.action === 'relax' && !types['item.' + a.field]) missing.set('item.' + a.field, (missing.get('item.' + a.field) || []).concat(r.id)); });
  });
  const used = new Set();
  rules.filter((r) => r.status !== 'disabled').forEach((r) => conditionFields(r).forEach((k) => used.add(k)));
  return { missing: [...missing.entries()].map(([k, ids]) => ({ field: k, rules: [...new Set(ids)] })), used: [...used] };
}

/* ------------------------------------------------------------------ describing rules */

function describeCondition(cat, c) {
  if (c.items) {
    const parts = c.items.filter((x) => !x.disabled).map((x) => describeCondition(cat, x));
    return parts.length > 1 ? '(' + parts.join(c.op === 'any' ? ' OR ' : ' AND ') + ')' : parts[0] || 'always';
  }
  const who = (c.scope === 'request' ? 'request ' : '') + labelOf(cat, c.field, c.scope).toLowerCase();
  const op = OPS[c.op] ? OPS[c.op].label : c.op;
  let v = c.value;
  if (v && v.ref) v = 'the ' + v.ref.replace('request.', "customer's ").replace('item.', "item's ").replace(/_/g, ' ');
  else if (Array.isArray(v)) v = c.op === 'between' ? v.join(' and ') : v.join(' or ');
  return ['exists', 'missing'].includes(c.op) ? `${who} ${op}` : `${who} ${op} ${v}`;
}
function describeAction(cat, a) {
  switch (a.action) {
    case 'exclude': return 'exclude it' + (a.message ? ` ("${a.message}")` : '');
    case 'include': return 'include it anyway';
    case 'boost': return `rank it higher (+${a.amount})`;
    case 'demote': return `rank it lower (−${a.amount})`;
    case 'adjust_price': return `adjust the price by ${a.mode === 'percent' ? a.amount + '%' : '£' + a.amount}` + (a.round && a.round !== 'none' ? `, ${PRICE_ROUNDING[a.round].toLowerCase()}` : '');
    case 'quote_only': return 'make it quote-only';
    case 'require_approval': return 'require staff approval';
    case 'calculate': return `set ${a.target} = ${a.expr}` + (a.round && a.round !== 'none' ? ` (${CALC_ROUNDING[a.round].toLowerCase()})` : '');
    case 'message': return `show "${a.text}"`;
    case 'handoff': return 'hand to staff';
    case 'relax': return `drop the ${labelOf(cat, a.field).toLowerCase()} requirement`;
    default: return a.action;
  }
}
function describeRule(cat, r) {
  const when = r.type === 'fallback' && !(r.when.items || []).length ? 'nothing matches' : describeCondition(cat, r.when).replace(/^\((.*)\)$/, '$1');
  return {
    when: r.type === 'fallback' && (r.when.items || []).length ? 'nothing matches AND ' + when : when,
    then: (r.then || []).map((a) => describeAction(cat, a)).join(', then '),
    because: r.because || '',
  };
}

/* ------------------------------------------------------------------ rule CRUD (pure) */

function nextRuleId(rules) {
  const n = rules.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ''), 10) || 0), 0);
  return 'R-' + String(n + 1).padStart(3, '0');
}
function newRule(rules, patch) {
  const maxP = rules.reduce((m, r) => Math.max(m, r.priority || 0), 0);
  return Object.assign({
    id: nextRuleId(rules), name: 'New rule', type: 'eligibility', priority: maxP + 10, hard: false,
    status: 'active', source: 'client', owner: '', when: { op: 'all', items: [] }, then: [], because: '',
  }, patch || {});
}
function addRule(rules, patch) { const r = newRule(rules, patch); return { rules: rules.concat(r), rule: r }; }
function duplicateRule(rules, id) {
  const src = rules.find((r) => r.id === id);
  if (!src) return { rules, rule: null };
  const r = Object.assign(clone(src), { id: nextRuleId(rules), name: src.name + ' (copy)', priority: (src.priority || 0) + 1, status: src.status === 'suggested' ? 'suggested' : 'disabled' });
  return { rules: rules.concat(r), rule: r };
}
function deleteRule(rules, id) { return rules.filter((r) => r.id !== id); }
function updateRule(rules, id, patch) { return rules.map((r) => (r.id === id ? Object.assign(clone(r), patch) : r)); }
function renumber(rules) {
  return rules.slice().sort(byPriority).map((r, i) => Object.assign(clone(r), { priority: (i + 1) * 10 }));
}
function moveRule(rules, id, dir) {
  const list = renumber(rules);
  const i = list.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const pi = list[i].priority;
  list[i].priority = list[j].priority;
  list[j].priority = pi;
  return list.sort(byPriority);
}

/* ------------------------------------------------------------------ CSV import */

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const s = String(text).replace(/\r\n?/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'field'; }

/** Build a catalogue from CSV text: infers field types and makes enum fields searchable. */
function catalogueFromCSV(text, name) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('The CSV needs a header row and at least one product.');
  const head = rows[0].map((h) => String(h).trim());
  const ids = [];
  head.forEach((h) => { let id = slug(h); while (ids.includes(id)) id += '_2'; ids.push(id); });
  const body = rows.slice(1);
  const fields = ids.map((id, c) => {
    const col = body.map((r) => String(r[c] == null ? '' : r[c]).trim()).filter((x) => x !== '');
    const numeric = col.length && col.every((x) => /^-?[£$€]?\d+(\.\d+)?$/.test(x.replace(/,/g, '')));
    const list = !numeric && col.some((x) => /[;|]/.test(x));
    const distinct = new Set(col.map(norm)).size;
    let type = 'text';
    if (numeric) type = 'number';
    else if (list) type = 'list';
    else if (distinct <= Math.max(12, Math.ceil(body.length * 0.4)) && distinct < body.length) type = 'enum';
    const f = { id, label: head[c] || id, type };
    if (/price|cost|rrp/i.test(head[c]) && numeric) { f.price = true; f.unit = '£'; }
    return f;
  });
  let pr = 1;
  fields.filter((f) => f.type === 'enum' || f.type === 'list').forEach((f) => { f.parse_priority = pr; f.phrase_order = pr; pr++; });
  const items = body.map((r, i) => {
    const it = {};
    fields.forEach((f, c) => {
      const raw = String(r[c] == null ? '' : r[c]).trim();
      if (f.type === 'number') it[f.id] = raw === '' ? null : parseFloat(raw.replace(/[£$€,]/g, ''));
      else if (f.type === 'list') it[f.id] = raw ? raw.split(/[;|]/).map((x) => x.trim()).filter(Boolean) : [];
      else it[f.id] = raw;
    });
    if (!it.sku) it.sku = 'ROW-' + String(i + 1).padStart(3, '0');
    if (!it.name) it.name = it.title || it.product || it.sku;
    return it;
  });
  if (!fields.some((f) => f.id === 'sku')) fields.unshift({ id: 'sku', label: 'SKU', type: 'text' });
  return { name: name || 'Imported catalogue', sample: true, fields, context: [], items, phrases: {} };
}

/* ------------------------------------------------------------------ exports */

const Engine = {
  RULE_TYPES, STATUSES, SOURCES, OPS, ACTIONS, PRICE_ROUNDING, CALC_ROUNDING,
  parseRequest, describeConstraints, evaluate, analyseRules, missingFields,
  describeRule, describeCondition, describeAction,
  condTrue, evalExpr, fieldValues, fieldMap, contextMap, allFieldTypes, labelOf,
  nextRuleId, newRule, addRule, duplicateRule, deleteRule, updateRule, moveRule, renumber,
  parseCSV, catalogueFromCSV,
};
export default Engine;
