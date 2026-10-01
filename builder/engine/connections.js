// Connecting Tools engine: pure functions over project.connections.
// connections = { nodes: { [toolId]: { x, y, entry } }, links: [Link], fields: [Field], owners: [Owner], discovery, confirmed_at }
// Link  = { id, from, to, trigger, passes: [fieldId], action, on_change, fallback, fallback_note, loop_ok, note }
// Field = { id, name, type, unit, owner, note }
// Owner = { id, decision, owner, note }
import Discovery from './discovery.js';

const TRIGGERS = { complete: 'When the first tool is finished', select: 'As soon as a choice is made', request: 'When the customer asks to continue' };
const ACTIONS = { prefill: 'Pre-fills answers', filter: 'Filters what it offers', recalculate: 'Recalculates its results', add: 'Adds to the package or summary', show: 'Shows it for reference' };
const ON_CHANGE = { recalculate: 'Recalculate automatically', flag: 'Keep, but mark for review', clear: 'Clear and ask again', keep: 'Keep as it is' };
const FALLBACK = { ask: 'Ask the customer', default: 'Use a sensible default', staff: 'Pass to staff', skip: 'Skip this handoff' };
const FIELD_TYPES = { number: 'Number', text: 'Text', choice: 'Choice', list: 'List', product: 'Product', price: 'Price' };
const DEFAULT_DECISIONS = ['Product choice', 'Price', 'Discounts', 'Final recommendation', 'Basket or quote'];
const DOCS = [{ id: 'connections', title: 'Tool Map and Connections' }];

const nowIso = () => new Date().toISOString();
const pad = (n) => String(n).padStart(2, '0');
function nextId(list, prefix) {
  const n = list.reduce((m, x) => Math.max(m, parseInt(String(x.id).replace(/\D/g, ''), 10) || 0), 0);
  return prefix + '-' + pad(n + 1);
}

function blank(cfg) {
  return {
    nodes: {}, links: [], fields: [],
    owners: DEFAULT_DECISIONS.map((d, i) => ({ id: 'O-' + pad(i + 1), decision: d, owner: null, note: '' })),
    discovery: cfg ? Discovery.blankState(cfg) : null, history: [],
  };
}
function ensure(p, cfg) {
  if (!p.connections) p.connections = blank(cfg);
  if (!p.connections.discovery && cfg) p.connections.discovery = Discovery.blankState(cfg);
  layout(p);
  return p.connections;
}
function log(p, text, at) {
  const c = p.connections;
  const e = { at: at || nowIso(), q: '—', label: 'Connections', from: '', to: text, affects: ['connections'], reopened: false };
  c.history = [e].concat(c.history || []).slice(0, 300);
  p.version = (p.version || 1) + 1;
  p.updated = e.at;
}
const toolName = (p, id) => { const t = p.tools.find((x) => x.id === id); return t ? `${t.id} ${t.name}` : id; };
const fieldName = (c, id) => { const f = c.fields.find((x) => x.id === id); return f ? f.name : id; };

/* ---------- layout ---------- */
function layout(p, force) {
  const c = p.connections;
  const ids = p.tools.map((t) => t.id);
  Object.keys(c.nodes).forEach((id) => { if (!ids.includes(id)) delete c.nodes[id]; });
  const missing = ids.filter((id) => !c.nodes[id]);
  if (!missing.length && !force) return;
  // Column = longest path from an entry, ignoring loop links.
  const col = {};
  ids.forEach((id) => { col[id] = 0; });
  for (let k = 0; k < ids.length; k++) {
    c.links.filter((l) => !l.loop_ok && ids.includes(l.from) && ids.includes(l.to)).forEach((l) => { if (col[l.to] < col[l.from] + 1) col[l.to] = Math.min(col[l.from] + 1, ids.length); });
  }
  const perCol = {};
  (force ? ids : missing).forEach((id) => {
    const cc = col[id];
    perCol[cc] = (perCol[cc] || 0) + 1;
    const prev = c.nodes[id] || {};
    c.nodes[id] = { x: 40 + cc * 300, y: 100 + (perCol[cc] - 1) * 140, entry: prev.entry != null ? prev.entry : (c.links.length ? cc === 0 && !c.links.some((l) => l.to === id && !l.loop_ok) : id === ids[0]) };
  });
}

/* ---------- editing ---------- */
function addLink(p, patch, at) {
  const c = p.connections;
  const l = Object.assign({ id: nextId(c.links, 'C'), from: null, to: null, trigger: 'complete', passes: [], action: 'filter',
    on_change: 'recalculate', fallback: 'ask', fallback_note: '', loop_ok: false, note: '' }, patch || {});
  c.links.push(l);
  log(p, `${l.id} added: ${toolName(p, l.from)} to ${toolName(p, l.to)}`, at);
  return l;
}
function updateLink(p, id, patch, at, quiet) {
  const l = p.connections.links.find((x) => x.id === id);
  if (!l) return null;
  Object.assign(l, patch);
  if (!quiet) log(p, `${id} changed: ${Object.keys(patch).join(', ')}`, at);
  return l;
}
function removeLink(p, id, at) {
  const c = p.connections;
  const l = c.links.find((x) => x.id === id);
  c.links = c.links.filter((x) => x.id !== id);
  if (l) log(p, `${id} removed`, at);
}
function addField(p, patch, at) {
  const c = p.connections;
  const f = Object.assign({ id: nextId(c.fields, 'F'), name: 'New field', type: 'text', unit: '', owner: null, note: '' }, patch || {});
  c.fields.push(f);
  log(p, `${f.id} ${f.name} added to shared data`, at);
  return f;
}
function updateField(p, id, patch, at, quiet) {
  const f = p.connections.fields.find((x) => x.id === id);
  if (!f) return null;
  Object.assign(f, patch);
  if (!quiet) log(p, `${id} ${f.name} changed: ${Object.keys(patch).join(', ')}`, at);
  return f;
}
function removeField(p, id, at) {
  const c = p.connections;
  c.fields = c.fields.filter((x) => x.id !== id);
  c.links.forEach((l) => { l.passes = l.passes.filter((x) => x !== id); });
  log(p, `${id} removed from shared data and from every connection`, at);
}
function setOwner(p, id, owner, at) {
  const o = p.connections.owners.find((x) => x.id === id);
  if (!o || o.owner === owner) return;
  o.owner = owner || null;
  log(p, `${o.decision} is now owned by ${owner ? toolName(p, owner) : 'no one'}`, at);
}
function addDecision(p, name, at) {
  const c = p.connections;
  const o = { id: nextId(c.owners, 'O'), decision: name || 'New decision', owner: null, note: '' };
  c.owners.push(o);
  log(p, `${o.id} ${o.decision} added`, at);
  return o;
}
/** Remove links and ownership that point at tools no longer in the project. Returns what was removed. */
function prune(p, at) {
  const c = p.connections;
  if (!c) return { links: [], owners: [], fields: [] };
  const ids = new Set(p.tools.map((t) => t.id));
  const gone = { links: c.links.filter((l) => !ids.has(l.from) || !ids.has(l.to)).map((l) => l.id), owners: [], fields: [] };
  c.links = c.links.filter((l) => ids.has(l.from) && ids.has(l.to));
  c.owners.forEach((o) => { if (o.owner && !ids.has(o.owner)) { o.owner = null; gone.owners.push(o.id); } });
  c.fields.forEach((f) => { if (f.owner && !ids.has(f.owner)) { f.owner = null; gone.fields.push(f.id); } });
  layout(p);
  if (gone.links.length || gone.owners.length || gone.fields.length) log(p, `Removed tool cleared: ${[].concat(gone.links, gone.owners, gone.fields).join(', ')}`, at);
  return gone;
}

/* ---------- graph ---------- */
function outgoing(c, id) { return c.links.filter((l) => l.from === id); }
function incoming(c, id) { return c.links.filter((l) => l.to === id); }
function cycles(p) {
  const c = p.connections;
  const out = [];
  const ids = p.tools.map((t) => t.id);
  const seen = new Set();
  function dfs(node, path, links) {
    outgoing(c, node).forEach((l) => {
      const i = path.indexOf(l.to);
      if (i > -1) {
        const cyc = path.slice(i).concat(l.to);
        const key = cyc.slice(0, -1).slice().sort().join('>') + '|' + links.slice(i).concat(l.id).sort().join(',');
        if (!seen.has(key)) { seen.add(key); out.push({ tools: cyc, links: links.slice(i).concat(l.id) }); }
        return;
      }
      if (path.length > ids.length) return;
      dfs(l.to, path.concat(l.to), links.concat(l.id));
    });
  }
  ids.forEach((id) => dfs(id, [id], []));
  return out;
}
function reachable(p) {
  const c = p.connections;
  const entries = p.tools.filter((t) => c.nodes[t.id] && c.nodes[t.id].entry).map((t) => t.id);
  const seen = new Set(entries);
  const q = entries.slice();
  while (q.length) { const n = q.shift(); outgoing(c, n).forEach((l) => { if (!seen.has(l.to)) { seen.add(l.to); q.push(l.to); } }); }
  return { entries, seen };
}
function usedBy(c, fieldId) { return [...new Set(c.links.filter((l) => l.passes.includes(fieldId)).map((l) => l.to))]; }

/* ---------- analysis ---------- */
function analyse(p) {
  const c = p.connections;
  const issues = [];
  const add = (level, ref, text) => issues.push({ level, ref, text });
  const ids = new Set(p.tools.map((t) => t.id));
  if (p.tools.length < 2) return issues;
  c.links.forEach((l) => {
    if (!ids.has(l.from) || !ids.has(l.to)) add('error', l.id, 'Connects a tool that is no longer in the project.');
    if (l.from === l.to) add('error', l.id, 'Connects a tool to itself.');
    if (!l.passes.length) add('warning', l.id, 'Say what information passes along this connection.');
    l.passes.forEach((fid) => {
      const f = c.fields.find((x) => x.id === fid);
      if (!f) { add('error', l.id, `Passes ${fid}, which isn't in the shared data.`); return; }
      const produces = f.owner === l.from;
      const receives = incoming(c, l.from).some((x) => x.passes.includes(fid));
      if (!produces && !receives) add('warning', l.id, `${toolName(p, l.from)} passes ${f.name} but neither produces nor receives it.`);
    });
    if (l.fallback === 'skip' && l.on_change === 'clear') add('info', l.id, 'Clears results on change but skips the handoff when data is missing; check the customer never ends up with an empty step.');
    if (c.links.some((x) => x !== l && x.from === l.from && x.to === l.to && x.id < l.id)) add('info', l.id, 'Another connection joins the same two tools. Consider merging them.');
  });
  cycles(p).forEach((cy) => {
    const ok = cy.links.some((id) => { const l = c.links.find((x) => x.id === id); return l && l.loop_ok; });
    if (!ok) add('warning', cy.links[cy.links.length - 1], `Loop ${cy.tools.map((t) => t).join(' → ')}: mark the connection where it stops, so results don't recalculate forever.`);
  });
  c.fields.forEach((f) => {
    if (!f.owner) add('warning', f.id, `${f.name} has no owner. Choose the tool that produces it.`);
    if (!c.links.some((l) => l.passes.includes(f.id))) add('info', f.id, `${f.name} isn't passed anywhere yet.`);
  });
  p.tools.forEach((t) => { if (!c.links.some((l) => l.from === t.id || l.to === t.id)) add('warning', t.id, `${toolName(p, t.id)} isn't connected to anything.`); });
  const { entries, seen } = reachable(p);
  if (!entries.length) add('warning', 'entry', 'Mark at least one tool where customers can start.');
  else p.tools.forEach((t) => { if (!seen.has(t.id) && c.links.some((l) => l.to === t.id || l.from === t.id)) add('warning', t.id, `${toolName(p, t.id)} can't be reached from a starting tool.`); });
  c.owners.forEach((o) => {
    if (!o.owner) add('question', o.id, `Decide which tool owns: ${o.decision}.`);
    else if (!ids.has(o.owner)) add('error', o.id, `${o.decision} is owned by a tool that is no longer in the project.`);
  });
  return issues;
}

/* ---------- recalculation impact ---------- */
/**
 * What happens downstream when a shared field (or everything a tool produces) changes.
 * Returns steps in the order they happen: { depth, tool, link, fields, effect, propagates, note }.
 */
function impact(p, change) {
  const c = p.connections;
  let origin, changed;
  if (change.field) {
    const f = c.fields.find((x) => x.id === change.field);
    if (!f) return { origin: null, steps: [] };
    origin = f.owner;
    changed = [f.id];
  } else {
    origin = change.tool;
    changed = c.fields.filter((f) => f.owner === origin).map((f) => f.id);
  }
  const steps = [];
  const visited = new Set([origin]);
  const queue = [{ tool: origin, fields: changed, depth: 0 }];
  while (queue.length) {
    const cur = queue.shift();
    outgoing(c, cur.tool).forEach((l) => {
      const carried = l.passes.filter((f) => cur.fields.includes(f));
      if (!carried.length) return;
      const effect = l.on_change;
      const loopBack = visited.has(l.to);
      const propagates = !loopBack && effect !== 'keep';
      steps.push({
        depth: cur.depth + 1, tool: l.to, link: l.id, fields: carried, effect: loopBack ? 'update' : effect, propagates,
        note: loopBack ? (l.loop_ok ? 'Returns to an earlier tool; it updates its summary and stops.' : 'Returns to an earlier tool with no stop point marked.') : '',
      });
      if (propagates) {
        visited.add(l.to);
        // A recalculated or cleared tool changes everything it produces, plus what it passes through.
        const produced = c.fields.filter((f) => f.owner === l.to).map((f) => f.id);
        queue.push({ tool: l.to, fields: [...new Set(produced.concat(carried))], depth: cur.depth + 1 });
      }
    });
  }
  return { origin, steps };
}

/* ---------- combined acceptance tests ---------- */
function acceptanceTests(p) {
  const c = p.connections;
  const out = [];
  // IDs derive from their source, so they stay put when other connections are added or removed.
  const add = (text, source, suffix) => out.push({ id: 'CX-AT-' + source + (suffix ? '-' + suffix : ''), text, source });
  const { entries } = reachable(p);
  entries.forEach((id) => add(`A customer can start the journey at ${toolName(p, id)}.`, 'START-' + id));
  c.links.forEach((l) => {
    const names = l.passes.map((f) => fieldName(c, f)).join(', ') || 'the agreed information';
    add(`${TRIGGERS[l.trigger] || l.trigger}, ${toolName(p, l.from)} passes ${names} to ${toolName(p, l.to)}, which ${String(ACTIONS[l.action] || l.action).toLowerCase()}.`, l.id, 'A');
    add(`If ${names} is missing, ${toolName(p, l.to)} will ${String(FALLBACK[l.fallback] || l.fallback).toLowerCase()}${l.fallback_note ? ' (' + l.fallback_note + ')' : ''}.`, l.id, 'B');
  });
  c.fields.filter((f) => f.owner).forEach((f) => {
    const im = impact(p, { field: f.id });
    if (!im.steps.length) return;
    const parts = im.steps.map((s) => `${toolName(p, s.tool)} ${s.effect === 'recalculate' ? 'recalculates' : s.effect === 'clear' ? 'clears its results' : s.effect === 'flag' ? 'marks its results for review' : s.effect === 'keep' ? 'keeps its results' : 'updates its summary'}`);
    add(`When ${f.name} changes in ${toolName(p, f.owner)}: ${parts.join(', then ')}.`, f.id);
  });
  c.owners.filter((o) => o.owner).forEach((o) => add(`${o.decision} is set only by ${toolName(p, o.owner)}; other tools show it but can't change it.`, o.id));
  return out;
}

/* ---------- document ---------- */
function docState(p, cfg) {
  const c = p.connections;
  const issues = analyse(p);
  if (!c || !c.links.length) return { key: 'draft', label: 'Draft' };
  if (issues.some((i) => i.level === 'error')) return { key: 'input', label: 'Needs client input' };
  const d = cfg ? Discovery.docState(cfg, c.discovery, cfg.documents[0]) : { key: 'ready' };
  if (d.key === 'review') return { key: 'review', label: 'Needs review' };
  if (c.confirmed_at && (c.history || []).some((h) => h.at > c.confirmed_at)) return { key: 'review', label: 'Needs review' };
  if (issues.some((i) => i.level === 'warning' || i.level === 'question') || d.key === 'input') return { key: 'input', label: 'Needs client input' };
  if (d.key === 'draft') return { key: 'draft', label: 'Draft' };
  return c.confirmed_at ? { key: 'ready', label: 'Ready for client review' } : { key: 'draft', label: 'Draft' };
}

function documentBlocks(p, cfg) {
  const c = p.connections;
  const b = [];
  const { entries } = reachable(p);
  b.push(['p', `${p.tools.length} tools in this project. ${c.links.length} connection${c.links.length === 1 ? '' : 's'} and ${c.fields.length} shared field${c.fields.length === 1 ? '' : 's'}.`]);
  b.push(['h', 'Journey map']);
  b.push(['p', entries.length ? 'Customers can start at ' + entries.map((id) => toolName(p, id)).join(' or ') + '.' : 'No starting tool marked yet.']);
  b.push(['table', ['ID', 'From', 'To', 'When', 'Passes', 'At the destination'],
    c.links.map((l) => [l.id, toolName(p, l.from), toolName(p, l.to), TRIGGERS[l.trigger], l.passes.map((f) => fieldName(c, f)).join(', ') || '-', ACTIONS[l.action] + (l.loop_ok ? ' (loop stops here)' : '')])]);
  b.push(['h', 'Shared data model']);
  b.push(['table', ['ID', 'Field', 'Type', 'Produced by', 'Used by'],
    c.fields.map((f) => [f.id, f.name + (f.unit ? ` (${f.unit})` : ''), FIELD_TYPES[f.type] || f.type, f.owner ? toolName(p, f.owner) : 'Not decided', usedBy(c, f.id).map((t) => toolName(p, t)).join(', ') || '-'])]);
  b.push(['h', 'Handoff rules']);
  b.push(['table', ['ID', 'If information is missing', 'Note'], c.links.map((l) => [l.id, FALLBACK[l.fallback], l.fallback_note || '-'])]);
  b.push(['h', 'Recalculation']);
  b.push(['table', ['ID', 'When the earlier answer changes'], c.links.map((l) => [l.id, ON_CHANGE[l.on_change]])]);
  c.fields.filter((f) => f.owner).forEach((f) => {
    const im = impact(p, { field: f.id });
    if (im.steps.length) b.push(['p', `If ${f.name} changes: ` + im.steps.map((s) => `${toolName(p, s.tool)} (${s.effect})`).join(' → ') + '.']);
  });
  b.push(['h', 'Decision ownership']);
  b.push(['table', ['ID', 'Decision', 'Owned by'], c.owners.map((o) => [o.id, o.decision, o.owner ? toolName(p, o.owner) : 'Not decided'])]);
  if (cfg && c.discovery) {
    const qs = Discovery.allVisible(cfg, c.discovery).map((q) => [q.id, Discovery.decisionText(c.discovery, q) || 'Not answered', Discovery.STATUS_LABEL[Discovery.statusOf(c.discovery, q)] || 'Open']);
    b.push(['h', 'How the journey behaves']);
    b.push(['table', ['ID', 'Decision', 'Status'], qs]);
  }
  const issues = analyse(p).filter((i) => i.level !== 'info');
  b.push(['h', 'Open questions and risks']);
  b.push(issues.length ? ['ul', issues.map((i) => `${i.ref}: ${i.text}`)] : ['p', 'None.']);
  b.push(['h', 'Combined acceptance tests']);
  b.push(['table', ['ID', 'Test', 'Source'], acceptanceTests(p).map((t) => [t.id, t.text, t.source])]);
  return b;
}
function toMarkdown(title, blocks) {
  const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const out = [`# ${title}`, ''];
  blocks.forEach((b) => {
    if (b[0] === 'h') out.push(`## ${b[1]}`, '');
    else if (b[0] === 'p') out.push(b[1], '');
    else if (b[0] === 'ul') out.push(...b[1].map((x) => `- ${x}`), '');
    else if (b[0] === 'table') {
      out.push('| ' + b[1].map(cell).join(' | ') + ' |', '|' + b[1].map(() => '---').join('|') + '|');
      out.push(...(b[2].length ? b[2] : [b[1].map(() => '-')]).map((r) => '| ' + r.map(cell).join(' | ') + ' |'), '');
    }
  });
  return out.join('\n');
}

/* ---------- the cinema demo ---------- */
function demoProject(Project, categories, modules, at) {
  const t0 = at || nowIso();
  const p = Project.newProject(t0);
  p.name = 'Cinema room package';
  p.description = 'Customers plan a cinema room from its dimensions and seating distance, then we help them choose the right projector ' +
    'and the right screen size and material for the room. Their choices come back into the plan as one package they can add to the basket.';
  p.suggestions = { text: p.description, at: t0, items: Project.suggestTools(categories, p.description) };
  const plan = Project.addTool(p, categories, modules, { category: 'plan', name: 'Cinema Room Planner', source: 'suggested' }, t0);
  const proj = Project.addTool(p, categories, modules, { category: 'select', name: 'Projector Selector', source: 'suggested' }, t0);
  const screen = Project.addTool(p, categories, modules, { category: 'select', name: 'Screen Finder', source: 'suggested' }, t0);
  const sr = modules.select_recommend;
  if (sr.example) Object.keys(sr.example.answers).forEach((k) => { screen.discovery.answers[k] = JSON.parse(JSON.stringify(sr.example.answers[k])); });
  plan.discovery.answers['PC-A01'] = { value: ['shoppers'] };
  plan.discovery.answers['PC-A02'] = { value: 'The screen size and seating layout that suit their room, and the projector position.' };
  plan.discovery.answers['PC-A03'] = { value: ['dims', 'usage', 'budget'] };
  plan.discovery.answers['PC-B01'] = { value: ['numbers', 'drawing', 'products'] };
  plan.discovery.answers['PC-B02'] = { value: ['selector', 'basket'] };
  const c = ensure(p, modules.connect_tools);
  const F = (name, type, unit, owner) => addField(p, { name, type, unit, owner: owner.id }, t0).id;
  const width = F('Room width', 'number', 'm', plan);
  const dist = F('Seating distance', 'number', 'm', plan);
  const light = F('Ambient light', 'choice', '', plan);
  const size = F('Recommended screen size', 'number', 'inches', plan);
  const projector = F('Chosen projector', 'product', '', proj);
  const throwR = F('Throw ratio', 'number', '', proj);
  const scr = F('Chosen screen', 'product', '', screen);
  const total = F('Package total', 'price', '£', plan);
  addLink(p, { from: plan.id, to: proj.id, passes: [width, dist, light, size], action: 'filter', on_change: 'recalculate', fallback: 'ask' }, t0);
  addLink(p, { from: proj.id, to: screen.id, passes: [projector, throwR], action: 'filter', on_change: 'recalculate', fallback: 'default', fallback_note: 'Assume a standard 1.5 throw ratio' }, t0);
  addLink(p, { from: plan.id, to: screen.id, passes: [light, size], action: 'prefill', on_change: 'flag', fallback: 'ask' }, t0);
  addLink(p, { from: screen.id, to: plan.id, passes: [scr], action: 'add', on_change: 'recalculate', fallback: 'skip', loop_ok: true }, t0);
  addLink(p, { from: proj.id, to: plan.id, passes: [projector], action: 'add', on_change: 'recalculate', fallback: 'skip', loop_ok: true }, t0);
  c.owners.forEach((o) => {
    o.owner = { 'Product choice': screen.id, Price: plan.id, Discounts: plan.id, 'Final recommendation': plan.id, 'Basket or quote': plan.id }[o.decision] || null;
  });
  c.owners.find((o) => o.decision === 'Product choice').note = 'Projector Selector owns the projector; Screen Finder owns the screen.';
  const cx = modules.connect_tools;
  if (cx && cx.example) Object.keys(cx.example.answers).forEach((k) => { c.discovery.answers[k] = JSON.parse(JSON.stringify(cx.example.answers[k])); });
  layout(p, true);
  Object.keys(c.nodes).forEach((id) => { c.nodes[id].entry = id === plan.id; });
  void total;
  return p;
}

const Connections = {
  TRIGGERS, ACTIONS, ON_CHANGE, FALLBACK, FIELD_TYPES, DOCS,
  blank, ensure, layout, addLink, updateLink, removeLink, addField, updateField, removeField, setOwner, addDecision, prune,
  cycles, reachable, usedBy, analyse, impact, acceptanceTests, docState, documentBlocks, toMarkdown, demoProject, log,
};
export default Connections;
