// Documents engine: turns a project into document sets with stable IDs, review states and traceability.
// Pure functions. ctx = { modules, categories, signals }.
import Discovery from './discovery.js';
import Engine from './rules.js';
import Connections from './connections.js';

const STATES = {
  draft: 'Draft', input: 'Needs client input', ready: 'Ready for client review', review: 'Needs review',
  client_approved: 'Client approved', bpc_review: 'Needs BPC review', bpc_approved: 'BPC approved',
};
const TOOL_DOCS = [
  ['purpose', 'Tool Purpose and Users'], ['journey', 'Tool Journey and States'], ['inputs', 'Inputs and Data Requirements'],
  ['rules', 'Business Rules and Priorities'], ['outputs', 'Outputs, Recommendations and Calls to Action'], ['admin', 'Admin Editing Requirements'],
  ['exceptions', 'Exceptions and Fallbacks'], ['prototype', 'Prototype Scope'], ['production', 'Production Scope'], ['acceptance', 'Acceptance Tests'],
];
const PROJECT_DOCS = [
  ['P-IDEA', 'Idea and Problem Review'], ['P-JOURNEY', 'Overall Customer or Staff Journey'], ['P-MAP', 'Tool Map and Connections'],
  ['P-DATA', 'Shared Data Model'], ['P-TECH', 'Integrations and Technical Foundation'], ['P-ACCESS', 'Roles, Access and Security'],
  ['P-MVP', 'MVP and Later Phases'], ['P-COVERAGE', 'Requirements Coverage'], ['P-RISKS', 'Open Decisions and Risks'], ['P-UX', 'UI/UX Direction'],
];
const GO_LIVE = [
  ['GL-01', 'Final product data and prices signed off', 'The data used in the build must be confirmed before launch, not before development starts.'],
  ['GL-02', 'Platform access and a staging copy of the shop', 'Needed to connect baskets, quotes and orders safely.'],
  ['GL-03', 'End-to-end test orders or quotes', 'Cheapest, most expensive and most common cases, placed on the live platform.'],
  ['GL-04', 'Accessibility check to WCAG 2.2 AA', 'Keyboard, screen reader and contrast checks on every step.'],
  ['GL-05', 'Analytics events agreed', 'So you can see where customers drop out.'],
];

const nowIso = () => new Date().toISOString();
function hash(s) { let h = 5381; const t = String(s); for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
const tn = (t) => `${t.id} ${t.name}`;
const S = Discovery.STATUS_LABEL;

/* ---------- helpers over tools ---------- */
function decisionsFor(ctx, tool, docKey) {
  const cfg = ctx.modules[tool.module];
  return Discovery.allVisible(cfg, tool.discovery).filter((q) => !docKey || q.affects.includes(docKey)).map((q) => {
    const st = Discovery.statusOf(tool.discovery, q);
    return { q, status: st, text: Discovery.decisionText(tool.discovery, q), id: `REQ-${tool.id}-${q.id}` };
  });
}
function decisionRows(list) {
  return list.map((d) => [d.id, d.text || `Not answered: ${d.q.label}`, d.status ? S[d.status] : (d.q.required ? 'Needed' : 'Open'), d.q.id]);
}
function openItems(tool, list) {
  return list.filter((d) => d.status === 'unknown' || d.status === 'bpc' || (!d.status && d.q.required))
    .map((d) => ({ id: `Q-${tool.id}-${d.q.id}`, text: d.status === 'bpc' ? `BPC to advise: ${d.q.label}` : d.status === 'unknown' ? `Unknown: ${d.q.label}` : `Needed: ${d.q.label}` }));
}
function toolRules(tool) { return tool.studio ? (tool.studio.rules || []) : []; }
function ruleId(tool, r) { return `${tool.id}-${r.id}`; }
function linksOf(p, tool) {
  const c = p.connections;
  if (!c || p.tools.length < 2) return { inc: [], out: [], c: null };
  return { inc: c.links.filter((l) => l.to === tool.id), out: c.links.filter((l) => l.from === tool.id), c };
}
function fname(c, id) { const f = c && c.fields.find((x) => x.id === id); return f ? f.name : id; }
function toolById(p, id) { return p.tools.find((t) => t.id === id); }
function label(p, id) { const t = toolById(p, id); return t ? tn(t) : id; }

/* ---------- acceptance tests per tool ---------- */
function toolTests(p, ctx, tool) {
  const out = [];
  decisionsFor(ctx, tool, 'acceptance').forEach((d) => {
    if (['confirmed', 'assumption', 'bpc_accepted'].includes(d.status) && d.text) out.push({ id: `AT-${tool.id}-${d.q.id}`, text: `Check that it behaves as decided: ${d.text}`, source: d.id, kind: 'decision' });
  });
  toolRules(tool).forEach((r) => {
    if (r.status !== 'active') return;
    const cat = tool.studio.cat;
    const dsc = Engine.describeRule(cat, r);
    out.push({ id: `AT-${ruleId(tool, r)}`, text: `When ${dsc.when}, the system shall ${dsc.then}.`, source: ruleId(tool, r), kind: 'rule', from_question: r.from_question || null });
  });
  const { inc, c } = linksOf(p, tool);
  inc.forEach((l) => out.push({ id: `AT-${tool.id}-${l.id}`, text: `Receives ${l.passes.map((f) => fname(c, f)).join(', ') || 'the agreed information'} from ${label(p, l.from)} and ${String(Connections.ACTIONS[l.action]).toLowerCase()}; if it's missing, it will ${String(Connections.FALLBACK[l.fallback]).toLowerCase()}.`, source: l.id, kind: 'connection' }));
  return out;
}

/* ---------- per-tool documents ---------- */
function toolDocs(p, ctx, tool) {
  const cfg = ctx.modules[tool.module];
  const cat = ctx.categories.find((c) => c.id === tool.category);
  const { inc, out, c } = linksOf(p, tool);
  const docs = [];
  TOOL_DOCS.forEach(([key, title]) => {
    const list = decisionsFor(ctx, tool, key);
    const b = [];
    const open = openItems(tool, list);
    const bpcItems = list.filter((d) => d.status === 'bpc_accepted').map((d) => d.id);
    if (key === 'purpose') {
      b.push(['p', `${tool.name} is a ${cat ? cat.name : tool.category} tool. ${cat ? cat.summary : ''}`]);
      b.push(['p', tool.source.type === 'implied' ? `Added because ${tool.source.from}: ${tool.source.reason}` : tool.source.type === 'suggested' ? 'Suggested from the project description and confirmed by the client.' : 'Added by the client.']);
    }
    if (list.length) { b.push(['h', 'Decisions']); b.push(['table', ['ID', 'Decision', 'Status', 'Question'], decisionRows(list)]); }
    if (key === 'journey') {
      const node = c && c.nodes[tool.id];
      const states = [['ST-1', 'Start', node && node.entry ? 'Customers can start here.' : inc.length ? `Opened from ${inc.map((l) => label(p, l.from)).join(' or ')}.` : 'Opened directly.'],
        ['ST-2', 'Answering', 'The customer answers questions or sets options; progress is kept if they go back.'],
        ['ST-3', 'Results', 'Results or a calculated answer are shown, with reasons where agreed.'],
        ['ST-4', 'Nothing suitable', 'The agreed fallback runs (see Exceptions and Fallbacks).'],
        ['ST-5', 'Complete', out.length ? `Passes its results to ${out.map((l) => label(p, l.to)).join(' and ')}.` : 'The finish action runs.']];
      b.push(['h', 'States']);
      b.push(['table', ['ID', 'State', 'What happens'], states.map((s) => [`${tool.id}-${s[0]}`, s[1], s[2]])]);
    }
    if (key === 'inputs') {
      if (tool.studio) {
        const catl = tool.studio.cat;
        const mf = Engine.missingFields(catl, toolRules(tool));
        const used = mf.used.filter((k) => k.startsWith('item.')).map((k) => k.slice(5));
        b.push(['h', 'Catalogue fields']);
        b.push(['p', `${catl.name}: ${(catl.items || []).length} products${catl.sample ? ' (sample data; this does not prove the mapping of the full range)' : ''}.`]);
        b.push(['table', ['ID', 'Field', 'Type', 'Used by rules'], (catl.fields || []).map((f) => [`${tool.id}-FLD-${f.id}`, f.label, f.type, used.includes(f.id) ? 'Yes' : '-'])]);
        mf.missing.forEach((m) => open.push({ id: `${tool.id}-MISSING-${m.field}`, text: `The rules need ${m.field}, which the catalogue doesn't have (${m.rules.join(', ')}).` }));
      }
      if (inc.length) { b.push(['h', 'Received from other tools']); b.push(['table', ['ID', 'Field', 'From', 'Connection'], inc.flatMap((l) => l.passes.map((f) => [f, fname(c, f), label(p, l.from), l.id]))]); }
    }
    if (key === 'rules') {
      const rules = toolRules(tool);
      if (tool.studio) {
        b.push(['h', 'Rules']);
        b.push(['table', ['ID', 'When', 'Then', 'Because', 'Status'], rules.slice().sort((a, x) => a.priority - x.priority).map((r) => {
          const d = Engine.describeRule(tool.studio.cat, r);
          return [ruleId(tool, r), d.when, d.then, d.because || '-', `${r.status}${r.hard ? ', hard' : ''}, ${r.source}${r.stale ? ', answer changed' : ''}`];
        })]);
        rules.filter((r) => r.status === 'suggested').forEach((r) => open.push({ id: ruleId(tool, r), text: `Suggested rule awaiting approval: ${r.name}.` }));
        rules.filter((r) => r.stale).forEach((r) => open.push({ id: ruleId(tool, r), text: `Approved rule no longer matches the answers: ${r.name}.` }));
        Engine.analyseRules(tool.studio.cat, rules).filter((i) => i.level === 'error' || i.level === 'conflict').forEach((i, n) => open.push({ id: `${tool.id}-${i.rule || 'RULES'}-ISS${n + 1}`, text: i.text }));
        rules.filter((r) => r.source === 'bpc' && r.status === 'active').forEach((r) => bpcItems.push(ruleId(tool, r)));
      } else b.push(['p', 'This intake records rules as answers. Formal rules are written with you at scoping.']);
    }
    if (key === 'outputs' && out.length) { b.push(['h', 'Passed to other tools']); b.push(['table', ['ID', 'Field', 'To', 'Connection'], out.flatMap((l) => l.passes.map((f) => [f, fname(c, f), label(p, l.to), l.id]))]); }
    if (key === 'exceptions') {
      const fb = toolRules(tool).filter((r) => r.type === 'fallback' && r.status !== 'disabled');
      if (fb.length) { b.push(['h', 'Fallback rules']); b.push(['ul', fb.map((r) => `${ruleId(tool, r)}: ${Engine.describeRule(tool.studio.cat, r).then}`)]); }
      if (inc.length) { b.push(['h', 'When information from another tool is missing']); b.push(['table', ['ID', 'From', 'Fallback'], inc.map((l) => [l.id, label(p, l.from), Connections.FALLBACK[l.fallback] + (l.fallback_note ? `: ${l.fallback_note}` : '')])]); }
    }
    if (key === 'production') {
      const sig = (p.suggestions && p.suggestions.signals) || [];
      if (sig.length) { b.push(['h', 'How it will be used']); b.push(['table', ['ID', 'Noticed', 'What it means'], sig.map((s, i) => [`SIG-${String(i + 1).padStart(2, '0')}`, s.title, s.note])]); }
      b.push(['h', 'Standards']);
      b.push(['ul', ['Keyboard operable and built to WCAG 2.2 AA.', 'Works on phones, tablets and desktop.', 'Analytics events for each step and finish action.']]);
    }
    if (key === 'acceptance') {
      const tests = toolTests(p, ctx, tool);
      b.push(['h', 'Tests']);
      b.push(['table', ['ID', 'Test', 'Traces to'], tests.map((t) => [t.id, t.text, t.source])]);
      const pend = toolRules(tool).filter((r) => r.status === 'suggested');
      if (pend.length) b.push(['p', `${pend.length} suggested rule${pend.length > 1 ? 's' : ''} will get tests once approved.`]);
    }
    const asm = list.filter((d) => d.status === 'assumption').map((d) => ({ id: `ASM-${tool.id}-${d.q.id}`, text: d.text }));
    if (asm.length) { b.push(['h', 'Assumptions']); b.push(['table', ['ID', 'Assumption'], asm.map((a) => [a.id, a.text])]); }
    if (open.length) { b.push(['h', 'Open items']); b.push(['table', ['ID', 'Item'], open.map((o) => [o.id, o.text])]); }
    let base;
    if (list.length) base = Discovery.docState(cfg, tool.discovery, { id: key }).key;
    else {
      // Nothing in this module feeds the document directly: it's ready once the whole discovery is confirmed.
      const secs = cfg.sections.map((s) => Discovery.sectionState(cfg, tool.discovery, s).key);
      base = secs.includes('needs_review') ? 'review' : secs.every((k) => k === 'confirmed') ? 'ready' : 'draft';
    }
    if (base === 'ready' && open.length) base = 'input';
    docs.push({ id: `${tool.id}-${key.toUpperCase()}`, key, title, scope: 'tool', tool: tool.id, toolName: tool.name, blocks: b, base, open, bpcItems, inputs: list.map((d) => d.q.id) });
  });
  return docs;
}

/* ---------- project documents ---------- */
function allDecisions(p, ctx) { return p.tools.flatMap((t) => decisionsFor(ctx, t).map((d) => Object.assign({ tool: t }, d))); }
function pickText(p, ctx, qids) {
  return allDecisions(p, ctx).filter((d) => qids.includes(d.q.id) && d.text).map((d) => [d.id, d.tool.name, d.text, S[d.status]]);
}
function flowOrder(p) {
  const c = p.connections;
  if (!c || p.tools.length < 2) return p.tools.map((t) => t.id);
  const { entries } = Connections.reachable(p);
  const seen = [];
  const q = entries.length ? entries.slice() : [p.tools[0].id];
  while (q.length) { const n = q.shift(); if (seen.includes(n)) continue; seen.push(n); c.links.filter((l) => l.from === n && !l.loop_ok).forEach((l) => q.push(l.to)); }
  p.tools.forEach((t) => { if (!seen.includes(t.id)) seen.push(t.id); });
  return seen;
}

function projectDocs(p, ctx, tdocs) {
  const docs = [];
  const cx = ctx.modules.connect_tools;
  const multi = p.tools.length > 1;
  const c = p.connections;
  const sig = (p.suggestions && p.suggestions.signals) || [];
  const allTests = p.tools.flatMap((t) => toolTests(p, ctx, t)).concat(multi && c ? Connections.acceptanceTests(p) : []);
  const add = (id, blocks, base, open, extra) => {
    const t = PROJECT_DOCS.find((x) => x[0] === id);
    docs.push(Object.assign({ id, key: id, title: t[1], scope: 'project', tool: null, blocks, base, open: open || [], bpcItems: [] }, extra || {}));
  };
  const toolState = (keys) => {
    const ds = tdocs.filter((d) => keys.includes(d.key));
    if (!ds.length) return 'draft';
    if (ds.some((d) => d.base === 'review')) return 'review';
    if (ds.some((d) => d.base === 'draft')) return 'draft';
    if (ds.some((d) => d.base === 'input')) return 'input';
    return 'ready';
  };

  // Idea and problem
  {
    const b = [['p', p.description || 'No description yet.']];
    const sg = p.suggestions && p.suggestions.items || [];
    if (sg.length) b.push(['h', 'Tools suggested from the description'], ['table', ['Tool type', 'Confidence', 'Because'], sg.map((s) => [s.name, s.confidence, s.reasons.join('; ')])]);
    b.push(['h', 'Tools chosen'], ['table', ['ID', 'Tool', 'Type', 'Why it is here'], p.tools.map((t) => [t.id, t.name, (ctx.categories.find((x) => x.id === t.category) || {}).name || t.category,
      t.source.type === 'implied' ? `Suggested by ${t.source.from}` : t.source.type === 'suggested' ? 'Suggested from the description' : 'Added by the client'])]);
    if (sig.length) b.push(['h', 'Things noticed in the description'], ['table', ['ID', 'Noticed', 'What it means'], sig.map((s, i) => [`SIG-${String(i + 1).padStart(2, '0')}`, s.title, s.note])]);
    if ((p.dismissed || []).length) b.push(['h', 'Suggestions the client said are not needed'], ['ul', p.dismissed]);
    const open = [];
    if (!p.description.trim()) open.push({ id: 'P-Q-DESC', text: 'Describe the problem.' });
    if (!p.tools.length) open.push({ id: 'P-Q-TOOLS', text: 'Choose at least one tool.' });
    add('P-IDEA', b, open.length ? 'draft' : toolState(['purpose']) === 'draft' ? 'draft' : 'ready', open);
  }
  // Overall journey
  {
    const order = flowOrder(p);
    const b = [['h', 'Order'], ['ol', order.map((id) => { const t = toolById(p, id); const n = c && c.nodes[id]; return `${tn(t)}${n && n.entry ? ' (customers can start here)' : ''}`; })]];
    const rows = pickText(p, ctx, ['SR-A01', 'CV-A01', 'PC-A01', 'QC-A01', 'CT-A01', 'SR-B01', 'SR-B04', 'SR-A04', 'CV-B04', 'PC-B01', 'QC-B01']);
    if (rows.length) b.push(['h', 'What each tool does in the journey'], ['table', ['ID', 'Tool', 'Decision', 'Status'], rows]);
    if (multi && c && cx) {
      const jd = Discovery.allVisible(cx, c.discovery).filter((q) => ['CX-A01', 'CX-A02', 'CX-A03', 'CX-B03'].includes(q.id))
        .map((q) => [`REQ-CX-${q.id}`, Discovery.decisionText(c.discovery, q) || `Not answered: ${q.label}`, S[Discovery.statusOf(c.discovery, q)] || 'Open']);
      b.push(['h', 'The journey as a whole'], ['table', ['ID', 'Decision', 'Status'], jd]);
    }
    add('P-JOURNEY', b, toolState(['journey']));
  }
  // Tool map (multi-tool only)
  if (multi && c) {
    const st = Connections.docState(p, cx);
    const iss = Connections.analyse(p).filter((i) => i.level !== 'info').map((i) => ({ id: `CX-ISS-${i.ref}`, text: i.text }));
    add('P-MAP', Connections.documentBlocks(p, cx), st.key === 'review' ? 'review' : st.key, iss);
  }
  // Shared data model
  {
    const b = [];
    if (multi && c) b.push(['h', 'Passed between tools'], ['table', ['ID', 'Field', 'Type', 'Produced by', 'Used by'], c.fields.map((f) => [f.id, f.name + (f.unit ? ` (${f.unit})` : ''), Connections.FIELD_TYPES[f.type] || f.type, f.owner ? label(p, f.owner) : 'Not decided', Connections.usedBy(c, f.id).map((t) => label(p, t)).join(', ') || '-'])]);
    const open = [];
    p.tools.filter((t) => t.studio).forEach((t) => {
      const cat = t.studio.cat;
      b.push(['h', `${tn(t)} catalogue`], ['p', `${cat.name}, ${(cat.items || []).length} products${cat.sample ? ', sample data' : ''}.`]);
      if ((cat.fields || []).length) b.push(['table', ['ID', 'Field', 'Type'], cat.fields.map((f) => [`${t.id}-FLD-${f.id}`, f.label, f.type])]);
      Engine.missingFields(cat, t.studio.rules || []).missing.forEach((m) => open.push({ id: `${t.id}-MISSING-${m.field}`, text: `${t.name} rules need ${m.field}.` }));
    });
    const sources = pickText(p, ctx, ['SR-C01', 'SR-C02', 'SR-C05', 'SR-C06', 'CA-A02', 'CT-A06']);
    if (sources.length) b.push(['h', 'Where the data comes from'], ['table', ['ID', 'Tool', 'Decision', 'Status'], sources]);
    if (!b.length) b.push(['p', 'No shared data recorded yet.']);
    if (multi && c) c.fields.filter((f) => !f.owner).forEach((f) => open.push({ id: f.id, text: `${f.name} has no owner.` }));
    add('P-DATA', b, open.length ? 'input' : toolState(['inputs']), open);
  }
  // Integrations and technical foundation
  {
    const rows = pickText(p, ctx, ['SR-F01', 'AI-B03', 'SR-C01', 'CA-A02', 'CA-A03', 'CA-A04', 'QC-B01', 'SR-G02', 'CV-B01', 'CV-B02']);
    const b = [];
    if (rows.length) b.push(['h', 'Client decisions'], ['table', ['ID', 'Tool', 'Decision', 'Status'], rows]);
    if (multi && c && cx) {
      const q = Discovery.allVisible(cx, c.discovery).find((x) => x.id === 'CX-B04');
      if (q) b.push(['p', `Combined result: ${Discovery.decisionText(c.discovery, q) || 'not decided yet.'}`]);
    }
    b.push(['h', 'Proposed foundation (BPC recommendation, not yet approved)'], ['table', ['ID', 'Area', 'Proposal'], [
      ['TECH-01', 'Front end', 'Each tool as an embeddable web component, so the same build runs on your site, dealer sites and staff devices.'],
      ['TECH-02', 'Rules', 'Rules held as data (the Rules Studio format) and evaluated the same way in the browser and on the server.'],
      ['TECH-03', 'Server', 'A small server for prices, quotes, saving and email; secrets and AI calls stay on the server.'],
      ['TECH-04', 'Data', 'Product data synced from your source on a schedule, with a sample-data mode for prototypes.'],
    ].concat(sig.some((s) => /offline/i.test(s.note) || /away from a desk/.test(s.title)) ? [['TECH-05', 'Offline', 'Store the catalogue and rules on the device so reps can work without signal, syncing when back online.']] : [])
      .concat(sig.some((s) => /embedded|Dealers/.test(s.title)) ? [['TECH-06', 'Dealers', 'One build with per-dealer settings (branding, prices, access), rather than separate copies.']] : [])]);
    add('P-TECH', b, toolState(['production']), [], { bpcOwned: true });
  }
  // Roles, access and security
  {
    const rows = pickText(p, ctx, ['SR-A01', 'CV-A01', 'PC-A01', 'QC-A01', 'CT-A01', 'SR-D06', 'SR-D07', 'QC-A04', 'SR-E01', 'SR-E02', 'SR-E03', 'SR-F02', 'CA-B02']);
    const b = [];
    if (rows.length) b.push(['h', 'Who uses it and what they can do'], ['table', ['ID', 'Tool', 'Decision', 'Status'], rows]);
    if (multi && c && cx) {
      const q = Discovery.allVisible(cx, c.discovery).find((x) => x.id === 'CX-B02');
      if (q) b.push(['p', `Staff overrides: ${Discovery.decisionText(c.discovery, q) || 'not decided yet.'}`]);
    }
    const roles = [['ROLE-01', 'Customer', 'Uses the tools; sees retail prices; can save or share results where agreed.'], ['ROLE-02', 'Client administrator', 'Edits products, rules and wording allowed by the admin decisions.']];
    if (sig.some((s) => /Dealers/.test(s.title))) roles.push(['ROLE-03', 'Dealer', 'Uses a branded copy; sees their own prices and customers only.']);
    if (sig.some((s) => /reps/.test(s.title))) roles.push(['ROLE-04', 'Sales rep', 'Staff mode: trade prices, saved customers, quotes.']);
    roles.push(['ROLE-05', 'BPC', 'Maintains the build and reviews changes under support.']);
    b.push(['h', 'Proposed roles (BPC recommendation)'], ['table', ['ID', 'Role', 'Access'], roles]);
    b.push(['h', 'Security and privacy'], ['ul', ['Personal details only where a decision requires them, with a privacy notice.', 'Trade prices and dealer data behind a login.', 'Every staff override recorded where agreed.']]);
    add('P-ACCESS', b, toolState(['purpose', 'admin']), [], { bpcOwned: true });
  }
  // MVP and later phases
  {
    const b = [];
    const proto = pickText(p, ctx, ['SR-G01', 'CV-Z01', 'PC-Z01', 'QC-Z01', 'CA-Z01', 'AI-Z01', 'CT-Z01']);
    const ranked = p.tools.map((t) => ({ t, c: Discovery.counts(ctx.modules[t.module], t.discovery) })).sort((a, x) => x.c.answered / Math.max(1, x.c.total) - a.c.answered / Math.max(1, a.c.total));
    b.push(['h', 'Suggested first prototype'], ['p', ranked.length ? `Start with ${tn(ranked[0].t)}${ranked.length > 1 ? ', then connect ' + ranked.slice(1).map((x) => tn(x.t)).join(', ') : ''}. Build on confirmed decisions only; assumptions are tested during the sprint.` : 'Add a tool first.']);
    if (proto.length) b.push(['table', ['ID', 'Tool', 'The prototype must prove', 'Status'], proto]);
    b.push(['h', 'Phases'], ['table', ['ID', 'Phase', 'Scope'], [
      ['PH-0', 'Scoping call', 'Settle open questions and BPC recommendations; agree the sprint.'],
      ['PH-1', 'Prototype Sprint', 'Working tools on staging with sample data, meeting their acceptance tests.'],
      ['PH-2', 'Production', 'Full data, platform connections, finish actions, accessibility and analytics.'],
      ['PH-3', 'Later', ['Unknowns resolved after launch'].concat(sig.map((s) => s.title)).join('; ') + '.'],
    ]]);
    const implied = (typeof ctx.implied === 'function' ? ctx.implied(p) : []);
    if (implied.length) b.push(['h', 'Tools suggested by answers but not added'], ['ul', implied.map((i) => `${i.name}: ${i.because.map((x) => x.reason).join('; ')}`)]);
    add('P-MVP', b, toolState(['prototype']));
  }
  // Requirements coverage
  {
    const rows = [];
    const open = [];
    allDecisions(p, ctx).forEach((d) => {
      if (!d.status) return;
      const rules = toolRules(d.tool).filter((r) => r.from_question === d.q.id);
      const tests = allTests.filter((t) => t.source === d.id || (t.from_question === d.q.id && t.id.startsWith(`AT-${d.tool.id}`)) || rules.some((r) => t.source === ruleId(d.tool, r)));
      let cov;
      if (d.status === 'unknown' || d.status === 'bpc') cov = 'Open';
      else if (tests.length) cov = 'Tested';
      else if (rules.length) cov = 'Rule only';
      else if (d.q.affects.includes('acceptance')) cov = 'Not yet covered';
      else cov = 'Documented';
      rows.push([d.id, d.text || d.q.label, d.q.affects.map((a) => `${d.tool.id}-${a.toUpperCase()}`).join(', '), rules.map((r) => ruleId(d.tool, r)).join(', ') || '-', tests.map((t) => t.id).join(', ') || '-', cov]);
      if (cov === 'Not yet covered') open.push({ id: d.id, text: 'Feeds acceptance tests but has none yet.' });
    });
    const counts = {};
    rows.forEach((r) => { counts[r[5]] = (counts[r[5]] || 0) + 1; });
    const b = [['p', Object.keys(counts).length ? Object.entries(counts).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(', ') + '.' : 'No decisions yet.'],
      ['table', ['Requirement', 'Decision', 'Documents', 'Rules', 'Tests', 'Coverage'], rows]];
    if (multi && c) b.push(['h', 'Combined journey tests'], ['table', ['ID', 'Test', 'Source'], Connections.acceptanceTests(p).map((t) => [t.id, t.text, t.source])]);
    add('P-COVERAGE', b, rows.length ? (open.length ? 'input' : toolState(['acceptance'])) : 'draft', open);
  }
  // Open decisions and risks
  {
    const open = [];
    tdocs.forEach((d) => d.open.forEach((o) => { if (!open.some((x) => x.id === o.id)) open.push(Object.assign({ doc: d.id }, o)); }));
    docs.forEach((d) => d.open.forEach((o) => { if (!open.some((x) => x.id === o.id)) open.push(Object.assign({ doc: d.id }, o)); }));
    const asm = allDecisions(p, ctx).filter((d) => d.status === 'assumption').map((d) => [`ASM-${d.tool.id}-${d.q.id}`, d.tool.name, d.text]);
    const bpc = allDecisions(p, ctx).filter((d) => d.status === 'bpc' || d.status === 'bpc_accepted').map((d) => [d.id, d.tool.name, d.q.recommend || d.q.label, d.status === 'bpc' ? 'Awaiting client decision' : 'Accepted by client']);
    const b = [['h', 'Open decisions'], ['table', ['ID', 'Item', 'Document'], open.map((o) => [o.id, o.text, o.doc])],
      ['h', 'Assumptions to test'], ['table', ['ID', 'Tool', 'Assumption'], asm],
      ['h', 'BPC recommendations'], ['table', ['ID', 'Tool', 'Recommendation', 'Status'], bpc],
      ['h', 'Risks'], ['table', ['ID', 'Risk', 'Why it matters'], [
        ['RISK-01', 'Sample data', 'Prototype results use sample data; the full catalogue may expose gaps.'],
        ...(asm.length ? [['RISK-02', 'Untested assumptions', `${asm.length} decision${asm.length > 1 ? 's rest' : ' rests'} on assumptions.`]] : []),
        ...(sig.some((s) => /offline/i.test(s.note)) ? [['RISK-03', 'Offline use', 'Working without signal affects architecture and must be decided early.']] : []),
      ]]];
    add('P-RISKS', b, open.length ? 'input' : 'ready', []);
  }
  // UI/UX direction
  {
    const rows = pickText(p, ctx, ['SR-B01', 'SR-B02', 'SR-B04', 'SR-B05', 'SR-B06', 'CV-B01', 'PC-B01', 'SR-F02', 'SR-F03']);
    const b = [];
    if (rows.length) b.push(['h', 'Client decisions'], ['table', ['ID', 'Tool', 'Decision', 'Status'], rows]);
    const away = sig.some((s) => /away from a desk/.test(s.title));
    b.push(['h', 'Direction (BPC recommendation)'], ['table', ['ID', 'Principle', 'Why'], [
      ['UX-01', 'Show results early and refine', 'People stay engaged when they see progress.'],
      ['UX-02', 'Explain every recommendation in a line', 'Builds trust and reduces returns.'],
      ['UX-03', 'Keep choices visible when going back', 'Nobody has to start again.'],
      ['UX-04', away ? 'Design for phones and tablets first' : 'Responsive from phone to desktop', away ? 'It will be used on site and in the field.' : 'Most visits are on phones.'],
      ['UX-05', 'Accessible to WCAG 2.2 AA', 'Legal duty and better for everyone.'],
    ]]);
    add('P-UX', b, toolState(['journey', 'outputs']), [], { bpcOwned: true });
  }
  return docs;
}

/* ---------- all documents and states ---------- */
function documentSet(p, ctx) {
  const tdocs = p.tools.flatMap((t) => toolDocs(p, ctx, t));
  const pdocs = projectDocs(p, ctx, tdocs);
  const all = pdocs.concat(tdocs);
  all.forEach((d) => {
    d.md = Connections.toMarkdown(d.title + (d.toolName ? ` (${d.tool} ${d.toolName})` : ''), d.blocks);
    d.hash = hash(d.md);
    Object.assign(d, stateOf(p, d));
  });
  return all;
}
function stateOf(p, d) {
  const r = (p.reviews || {})[d.id] || {};
  const changed = r.client && r.client.hash !== d.hash;
  let key;
  if (changed) key = 'review';
  else if (r.clarify && !r.clarify.resolved) key = 'input';
  else if (r.bpc && r.client && r.bpc.hash === d.hash) key = 'bpc_approved';
  else if (r.client) key = (d.bpcItems && d.bpcItems.length) || d.bpcOwned ? 'bpc_review' : 'client_approved';
  else key = d.base;
  return { state: key, stateLabel: STATES[key], approved: r.client || null, bpc: r.bpc || null, clarify: r.clarify && !r.clarify.resolved ? r.clarify : null };
}
function canApprove(d, by) {
  if (by === 'client') return d.state === 'ready' || d.state === 'review';
  if (by === 'bpc') return ['client_approved', 'bpc_review'].includes(d.state);
  return false;
}
function approve(p, d, by, at) {
  p.reviews = p.reviews || {};
  const r = (p.reviews[d.id] = p.reviews[d.id] || {});
  const t = at || nowIso();
  if (by === 'client') { r.client = { at: t, hash: d.hash, text: d.md }; delete r.bpc; if (r.clarify) r.clarify.resolved = true; }
  else r.bpc = { at: t, hash: d.hash };
  logDoc(p, `${d.id} ${d.title} approved by ${by === 'bpc' ? 'BPC' : 'the client'}`, t);
}
function requestClarification(p, d, text, at) {
  p.reviews = p.reviews || {};
  const r = (p.reviews[d.id] = p.reviews[d.id] || {});
  r.clarify = { at: at || nowIso(), text, resolved: false };
  logDoc(p, `BPC asked for clarification on ${d.id}: ${text}`, at);
}
function resolveClarification(p, docId, at) {
  const r = (p.reviews || {})[docId];
  if (r && r.clarify) { r.clarify.resolved = true; logDoc(p, `Clarification on ${docId} marked resolved`, at); }
}
function comment(p, itemId, docId, by, text, at) {
  p.comments = p.comments || {};
  const e = { at: at || nowIso(), by, doc: docId, text };
  p.comments[itemId] = (p.comments[itemId] || []).concat(e);
  logDoc(p, `${by === 'bpc' ? 'BPC' : 'Client'} commented on ${itemId}`, e.at);
  return e;
}
function logDoc(p, text, at) {
  p.events = [{ at: at || nowIso(), type: 'documents', text }].concat(p.events || []).slice(0, 500);
  p.version = (p.version || 1) + 1;
}

/* ---------- line diff for approved vs current ---------- */
function diff(a, b) {
  const x = String(a || '').split('\n'), y = String(b || '').split('\n');
  const n = x.length, m = y.length;
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) { out.push({ t: 'same', s: x[i] }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push({ t: 'del', s: x[i++] });
    else out.push({ t: 'add', s: y[j++] });
  }
  while (i < n) out.push({ t: 'del', s: x[i++] });
  while (j < m) out.push({ t: 'add', s: y[j++] });
  return out;
}

/* ---------- dashboard and handover ---------- */
function summary(p, ctx, docs) {
  docs = docs || documentSet(p, ctx);
  const by = {};
  docs.forEach((d) => { by[d.state] = (by[d.state] || 0) + 1; });
  const decisions = allDecisions(p, ctx);
  const rules = p.tools.flatMap((t) => toolRules(t));
  const tests = p.tools.flatMap((t) => toolTests(p, ctx, t)).concat(p.tools.length > 1 && p.connections ? Connections.acceptanceTests(p) : []);
  // Point at the document where the open item lives, not the roll-ups that repeat it.
  const openDoc = docs.find((d) => d.state === 'input' && !['P-RISKS', 'P-COVERAGE'].includes(d.id)) || docs.find((d) => d.state === 'input');
  const reviewDoc = docs.find((d) => d.state === 'review');
  const readyDoc = docs.find((d) => d.state === 'ready');
  const bpcDoc = docs.find((d) => d.state === 'bpc_review' || d.state === 'client_approved');
  let next;
  if (!p.tools.length) next = { text: 'Choose your tools', doc: null };
  else if (reviewDoc) next = { text: `Review the changes to ${reviewDoc.title}${reviewDoc.toolName ? ' (' + reviewDoc.toolName + ')' : ''}`, doc: reviewDoc.id };
  else if (openDoc) next = { text: `Answer the open items in ${openDoc.title}${openDoc.toolName ? ' (' + openDoc.toolName + ')' : ''}`, doc: openDoc.id };
  else if (docs.some((d) => d.state === 'draft')) { const dd = docs.find((d) => d.state === 'draft'); next = { text: `Finish ${dd.title}${dd.toolName ? ' (' + dd.toolName + ')' : ''}`, doc: dd.id }; }
  else if (readyDoc) next = { text: `Review and approve ${readyDoc.title}${readyDoc.toolName ? ' (' + readyDoc.toolName + ')' : ''}`, doc: readyDoc.id };
  else if (bpcDoc) next = { text: 'Waiting for BPC to review the approved documents', doc: bpcDoc.id };
  else next = { text: 'Send the brief to Blueprint Code', doc: null };
  const open = docs.find((d) => d.id === 'P-RISKS');
  const goLive = GO_LIVE.slice();
  ((p.suggestions && p.suggestions.signals) || []).forEach((s, i) => goLive.push([`GL-S${i + 1}`, s.title, s.note]));
  return {
    docs, byState: by, total: docs.length,
    approved: (by.client_approved || 0) + (by.bpc_review || 0) + (by.bpc_approved || 0), bpcApproved: by.bpc_approved || 0,
    ready: by.ready || 0, needsInput: by.input || 0, needsReview: by.review || 0, drafts: by.draft || 0,
    decisions: decisions.filter((d) => d.status).length, requirements: decisions.length, rules: rules.length,
    activeRules: rules.filter((r) => r.status === 'active').length, tests: tests.length,
    openItems: open ? open.blocks[1][2].length : 0, blockers: docs.filter((d) => d.state === 'input').length,
    goLive, next,
  };
}
function handover(p, ctx) {
  const docs = documentSet(p, ctx);
  return {
    schema: 'bpc.handover/1', exported: nowIso(), project: { id: p.id, name: p.name, version: p.version, description: p.description },
    signals: (p.suggestions && p.suggestions.signals) || [],
    tools: p.tools.map((t) => ({
      id: t.id, name: t.name, category: t.category, module: t.module, source: t.source,
      decisions: decisionsFor(ctx, t).map((d) => ({ id: d.id, question: d.q.id, label: d.q.label, status: d.status || 'unanswered', text: d.text, value: (t.discovery.answers[d.q.id] || {}).value ?? null, affects: d.q.affects })),
      rules: toolRules(t).map((r) => Object.assign({ trace_id: ruleId(t, r) }, r)),
      catalogue: t.studio ? { name: t.studio.cat.name, sample: !!t.studio.cat.sample, fields: t.studio.cat.fields, items: (t.studio.cat.items || []).length } : null,
      tests: toolTests(p, ctx, t),
    })),
    connections: p.tools.length > 1 && p.connections ? {
      links: p.connections.links, fields: p.connections.fields, owners: p.connections.owners,
      entries: Connections.reachable(p).entries, tests: Connections.acceptanceTests(p),
      behaviour: ctx.modules.connect_tools ? Discovery.allVisible(ctx.modules.connect_tools, p.connections.discovery).map((q) => ({ id: q.id, status: Discovery.statusOf(p.connections.discovery, q), text: Discovery.decisionText(p.connections.discovery, q) })) : [],
    } : null,
    documents: docs.map((d) => ({ id: d.id, title: d.title, tool: d.tool, state: d.state, hash: d.hash, open: d.open, approved: d.approved ? d.approved.at : null, bpc_approved: d.bpc ? d.bpc.at : null })),
    comments: p.comments || {},
    unresolved: docs.flatMap((d) => d.open.map((o) => Object.assign({ doc: d.id }, o))),
  };
}

const Documents = {
  STATES, TOOL_DOCS, PROJECT_DOCS, GO_LIVE, hash, documentSet, toolDocs, projectDocs, toolTests, stateOf, canApprove, approve,
  requestClarification, resolveClarification, comment, diff, summary, handover,
};
export default Documents;
