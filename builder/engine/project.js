// Project engine: pure functions over a project record.
// A project holds several tools; each tool has its own discovery state and (for selectors) rules.
import Discovery from './discovery.js';
import Engine from './rules.js';
import Connections from './connections.js';

const SCHEMA = 'bpc.project/1';
const nowIso = () => new Date().toISOString();
const clone = (o) => JSON.parse(JSON.stringify(o));

function newProject(at) {
  const t = at || nowIso();
  return { schema: SCHEMA, id: 'P-' + Math.random().toString(36).slice(2, 8).toUpperCase(), name: '', description: '',
    created: t, updated: t, version: 1, tools: [], dismissed: [], events: [{ at: t, type: 'created', text: 'Project created' }] };
}

function logEvent(p, type, text, at, extra) {
  p.events = [Object.assign({ at: at || nowIso(), type, text }, extra || {})].concat(p.events || []).slice(0, 500);
  p.version = (p.version || 1) + 1;
  p.updated = at || nowIso();
}

/* ---------- suggesting tools from a description ---------- */

function suggestTools(categories, text) {
  const t = ' ' + String(text || '').toLowerCase().replace(/[’']/g, "'") + ' ';
  const out = [];
  categories.forEach((c) => {
    let score = 0;
    const hits = [];
    (c.patterns || []).forEach((p) => {
      const re = new RegExp('\\b(?:' + p.re + ')\\b', 'g');
      const found = [...new Set([...t.matchAll(re)].map((m) => m[0].trim()))];
      if (!found.length) return;
      score += p.weight * Math.min(found.length, 2);
      hits.push({ phrases: found, reason: p.reason, weight: p.weight });
    });
    if (!score) return;
    hits.sort((a, b) => b.weight - a.weight);
    out.push({
      category: c.id, name: c.name, score,
      confidence: score >= 4 ? 'strong' : score >= 2 ? 'likely' : 'possible',
      phrases: [...new Set(hits.flatMap((h) => h.phrases))],
      reasons: hits.map((h) => h.reason),
      summary: c.summary,
    });
  });
  return out.sort((a, b) => b.score - a.score);
}

/**
 * Sentences in the description that matched no tool type and no usage signal,
 * so nothing the client wrote is silently ignored.
 */
function unmatchedParts(categories, signals, text) {
  const pats = categories.flatMap((c) => (c.patterns || []).map((p) => p.re)).concat((signals || []).map((s) => s.re));
  const res = pats.map((r) => new RegExp('\\b(?:' + r + ')\\b', 'i'));
  const filler = /^(i|we|they|you|it|this|that|so|and|also|then|but|the|a|an|to|of|for|with|want|need|would|like|can|be|able|use|have|has|our|my|their|system|something|thing|things|online|web|site|website|please|just)$/;
  return String(text || '').split(/(?<=[.!?;])\s+|\n+/).map((x) => x.trim()).filter(Boolean).filter((part) => {
    const words = part.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w && !filler.test(w));
    if (words.length < 2) return false;
    const t = ' ' + part.toLowerCase().replace(/[’']/g, "'") + ' ';
    return !res.some((re) => re.test(t));
  });
}

/** Things in the description that affect scope rather than which tool is needed. */
function detectSignals(signals, text) {
  const t = ' ' + String(text || '').toLowerCase().replace(/[’']/g, "'") + ' ';
  return (signals || []).map((sg) => {
    const re = new RegExp('\\b(?:' + sg.re + ')\\b', 'g');
    const found = [...new Set([...t.matchAll(re)].map((m) => m[0].trim()))];
    return found.length ? { title: sg.title, note: sg.note, phrases: found } : null;
  }).filter(Boolean);
}

/* ---------- tools ---------- */

function nextToolId(p) {
  const n = (p.tools || []).concat(p.removed_tools || []).reduce((m, t) => Math.max(m, parseInt(String(t.id).replace(/\D/g, ''), 10) || 0), 0);
  return 'T-' + String(n + 1).padStart(2, '0');
}
function emptyCatalogue() {
  return { name: 'No catalogue yet', sample: false, fields: [], items: [], phrases: {},
    context: [
      { id: 'region', label: 'Customer region', type: 'enum', values: ['UK', 'EU', 'US'], default: 'UK' },
      { id: 'customer_type', label: 'Customer type', type: 'enum', values: ['retail', 'trade'], default: 'retail' },
      { id: 'quantity', label: 'Quantity', type: 'number', default: 1 },
    ] };
}
function addTool(p, categories, modules, opts, at) {
  const cat = categories.find((c) => c.id === opts.category);
  if (!cat) throw new Error('Unknown category ' + opts.category);
  const cfg = modules[cat.module];
  if (!cfg) throw new Error('No module for ' + cat.module);
  const tool = {
    id: nextToolId(p), name: (opts.name || '').trim() || cat.name, category: cat.id, module: cat.module,
    source: { type: opts.source || 'client', from: opts.from || null, reason: opts.reason || null },
    created: at || nowIso(), discovery: Discovery.blankState(cfg),
  };
  if (cat.id === 'select') tool.studio = { cat: emptyCatalogue(), rules: [], open: null, tab: 'rules', req: '', ctx: {}, preview: false };
  p.tools = (p.tools || []).concat(tool);
  const how = tool.source.type === 'suggested' ? 'suggested from the description'
    : tool.source.type === 'implied' ? `suggested by ${tool.source.from}` : 'added by the client';
  logEvent(p, 'tool_added', `${tool.id} ${tool.name} added (${how})`, at, { tool: tool.id });
  return tool;
}
function renameTool(p, id, name, at) {
  const t = p.tools.find((x) => x.id === id);
  if (!t || !name.trim() || t.name === name.trim()) return false;
  const old = t.name;
  t.name = name.trim();
  logEvent(p, 'tool_renamed', `${id} renamed from ${old} to ${t.name}`, at, { tool: id });
  return true;
}
function removeTool(p, id, at) {
  const t = p.tools.find((x) => x.id === id);
  if (!t) return false;
  p.tools = p.tools.filter((x) => x.id !== id);
  p.removed_tools = (p.removed_tools || []).concat({ id: t.id, name: t.name, removed: at || nowIso() });
  logEvent(p, 'tool_removed', `${id} ${t.name} removed`, at, { tool: id });
  if (p.connections) Connections.prune(p, at);
  return true;
}
function setDescription(p, text, at) {
  if ((p.description || '') === text) return false;
  p.description = text;
  logEvent(p, 'description', 'Problem description edited', at);
  return true;
}

/* ---------- tools implied by answers ---------- */

function impliedAcrossTools(p, modules, categories) {
  const present = new Set(p.tools.map((t) => t.category));
  const dismissed = new Set(p.dismissed || []);
  const byCat = {};
  p.tools.forEach((t) => {
    Discovery.impliedTools(modules[t.module], t.discovery).forEach((imp) => {
      if (present.has(imp.category)) return;
      const key = `${t.id}:${imp.question}:${imp.category}`;
      if (dismissed.has(key)) return;
      const c = categories.find((x) => x.id === imp.category);
      if (!c) return;
      const e = (byCat[imp.category] = byCat[imp.category] || { category: c.id, name: c.name, summary: c.summary, because: [] });
      if (!e.because.some((b) => b.key === key)) e.because.push({ key, tool: t.id, toolName: t.name, question: imp.question, reason: imp.reason });
    });
  });
  if (p.connections && p.connections.discovery && modules.connect_tools) {
    Discovery.impliedTools(modules.connect_tools, p.connections.discovery).forEach((imp) => {
      if (present.has(imp.category)) return;
      const key = `CX:${imp.question}:${imp.category}`;
      if (dismissed.has(key)) return;
      const c = categories.find((x) => x.id === imp.category);
      if (!c) return;
      const e = (byCat[imp.category] = byCat[imp.category] || { category: c.id, name: c.name, summary: c.summary, because: [] });
      if (!e.because.some((b) => b.key === key)) e.because.push({ key, tool: 'connections', toolName: 'Connecting Tools', question: imp.question, reason: imp.reason });
    });
  }
  return Object.values(byCat);
}
function dismissImplied(p, keys, at) {
  p.dismissed = [...new Set((p.dismissed || []).concat(keys))];
  logEvent(p, 'dismissed', `Suggestion dismissed (${keys.join(', ')})`, at);
}

/* ---------- rules suggested by discovery answers ---------- */

function syncSuggestedRules(tool, cfg) {
  if (!tool.studio) return { added: [], removed: [], stale: [] };
  const wanted = Discovery.suggestedRules(cfg, tool.discovery);
  const wantedKeys = new Set(wanted.map((r) => r.template));
  const res = { added: [], removed: [], stale: [] };
  let rules = tool.studio.rules || [];
  rules = rules.filter((r) => {
    if (r.template && !wantedKeys.has(r.template) && r.status === 'suggested') { res.removed.push(r.id); return false; }
    return true;
  });
  rules.forEach((r) => {
    if (!r.template) return;
    const stale = !wantedKeys.has(r.template);
    if (stale && !r.stale) res.stale.push(r.id);
    r.stale = stale;
  });
  wanted.forEach((w) => {
    if (rules.some((r) => r.template === w.template)) return;
    const r = Engine.newRule(rules, Object.assign(w, { status: 'suggested', source: 'bpc', owner: 'BPC' }));
    rules = rules.concat(r);
    res.added.push(r.id);
  });
  tool.studio.rules = rules;
  return res;
}

/* ---------- status ---------- */

function toolSummary(tool, modules) {
  const cfg = modules[tool.module];
  const st = tool.discovery;
  const c = Discovery.counts(cfg, st);
  const docs = cfg.documents.map((d) => Object.assign({ id: d.id, title: d.title }, Discovery.docState(cfg, st, d)));
  const secs = cfg.sections.map((s) => Object.assign({ id: s.id, title: s.title }, Discovery.sectionState(cfg, st, s)));
  const rules = tool.studio ? tool.studio.rules || [] : [];
  return {
    counts: c, docs, sections: secs, depth: cfg.module.depth || 'intake',
    confirmedSections: secs.filter((s) => s.key === 'confirmed').length,
    rules: { total: rules.length, suggested: rules.filter((r) => r.status === 'suggested').length, stale: rules.filter((r) => r.stale).length },
  };
}
function projectStatus(p, modules) {
  const tools = p.tools.map((t) => ({ tool: t, s: toolSummary(t, modules) }));
  const docs = { draft: 0, input: 0, ready: 0, review: 0 };
  const review = [];
  let unknown = 0, bpc = 0, missing = 0;
  tools.forEach(({ tool, s }) => {
    s.docs.forEach((d) => { docs[d.key]++; if (d.key === 'review') review.push({ tool: tool.id, toolName: tool.name, doc: d.id, title: d.title }); });
    unknown += s.counts.unknown; bpc += s.counts.bpc; missing += s.counts.missing;
  });
  let next;
  if (!p.description.trim()) next = { text: 'Describe the problem you want to solve', target: 'describe' };
  else if (!p.tools.length) next = { text: 'Choose at least one tool', target: 'tools' };
  else if (review.length) next = { text: `Review ${review.length} document${review.length > 1 ? 's' : ''} affected by changes`, target: review[0].tool };
  else {
    const open = tools.find(({ s }) => s.counts.missing > 0);
    if (open) next = { text: `Continue ${open.tool.name}: ${open.s.counts.missing} needed answer${open.s.counts.missing > 1 ? 's' : ''} left`, target: open.tool.id };
    else if (tools.some(({ s }) => s.confirmedSections < s.sections.length)) {
      const t = tools.find(({ s }) => s.confirmedSections < s.sections.length);
      next = { text: `Confirm the remaining sections of ${t.tool.name}`, target: t.tool.id };
    } else if (p.tools.length > 1 && (!p.connections || Connections.docState(p, modules.connect_tools).key !== 'ready')) next = { text: 'Describe how the tools connect', target: 'connections' };
    else next = { text: 'Send the brief to Blueprint Code', target: 'send' };
  }
  let connections = null;
  if (p.tools.length > 1) {
    const issues = p.connections ? Connections.analyse(p) : [];
    const state = p.connections ? Connections.docState(p, modules.connect_tools) : { key: 'draft', label: 'Draft' };
    connections = { links: p.connections ? p.connections.links.length : 0, issues: issues.filter((i) => i.level !== 'info').length, state };
    docs[state.key]++;
    if (state.key === 'review') review.push({ tool: 'connections', toolName: 'Connecting Tools', doc: 'connections', title: 'Tool Map and Connections' });
    if (!next || next.target === 'send') next = connections.issues ? { text: `Resolve ${connections.issues} connection question${connections.issues > 1 ? 's' : ''}`, target: 'connections' } : next;
  }
  return { tools, docs, review, unknown, bpc, missing, connected: p.tools.length > 1, connections, next };
}

/* ---------- history ---------- */

function projectHistory(p) {
  const rows = (p.events || []).map((e) => ({ at: e.at, scope: 'project', tool: e.tool || null, text: e.text }));
  p.tools.forEach((t) => (t.discovery.history || []).forEach((h) => rows.push({
    at: h.at, scope: 'tool', tool: t.id, toolName: t.name, q: h.q, text: h.q && h.q !== '—' ? `${h.q}: ${h.to}` : h.to, affects: h.affects, reopened: h.reopened,
  })));
  if (p.connections) (p.connections.history || []).forEach((h) => rows.push({ at: h.at, scope: 'connections', tool: 'Connections', text: h.to }));
  if (p.connections && p.connections.discovery) (p.connections.discovery.history || []).forEach((h) => rows.push({ at: h.at, scope: 'connections', tool: 'Connections', q: h.q, text: `${h.q}: ${h.to}` }));
  return rows.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/* ---------- save and resume ---------- */

function serialise(p) { return JSON.stringify(p, null, 2); }
function deserialise(text, modules) {
  let p;
  try { p = JSON.parse(text); } catch (e) { throw new Error("That file isn't valid JSON."); }
  if (!p || p.schema !== SCHEMA) throw new Error("That file isn't a Blueprint Builder project.");
  if (!Array.isArray(p.tools)) throw new Error('The project has no tools list.');
  p.tools.forEach((t) => {
    if (!modules[t.module]) throw new Error(`Tool ${t.id} uses an unknown module "${t.module}".`);
    t.discovery = Object.assign(Discovery.blankState(modules[t.module]), t.discovery || {});
  });
  if (p.connections) {
    const cx = modules.connect_tools;
    p.connections.discovery = Object.assign(cx ? Discovery.blankState(cx) : {}, p.connections.discovery || {});
    p.connections.history = p.connections.history || [];
  }
  p.events = p.events || [];
  p.dismissed = p.dismissed || [];
  return p;
}

const Project = {
  SCHEMA, newProject, logEvent, suggestTools, detectSignals, unmatchedParts, addTool, renameTool, removeTool, setDescription,
  impliedAcrossTools, dismissImplied, syncSuggestedRules, toolSummary, projectStatus, projectHistory,
  serialise, deserialise, emptyCatalogue, clone,
};
export default Project;
