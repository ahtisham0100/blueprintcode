// Run: node --test engine/documents.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import P from './project.js';
import C from './connections.js';
import D from './discovery.js';
import Docs from './documents.js';

const load = (f) => JSON.parse(readFileSync(new URL('../modules/' + f, import.meta.url)));
const CATFILE = load('categories.json');
const CATS = CATFILE.categories;
const MODULES = { connect_tools: load('connect_tools.json') };
CATS.forEach((c) => { MODULES[c.module] = load(c.module + '.json'); });
const CTX = { modules: MODULES, categories: CATS, signals: CATFILE.signals, implied: (p) => P.impliedAcrossTools(p, MODULES, CATS) };
const T0 = '2026-09-29T10:00:00.000Z';
const at = (m) => new Date(Date.parse(T0) + m * 60000).toISOString();
const demo = () => C.demoProject(P, CATS, MODULES, T0);
const doc = (p, id) => Docs.documentSet(p, CTX).find((d) => d.id === id);
function confirmAll(p, tool, m) {
  const cfg = MODULES[tool.module];
  D.allVisible(cfg, tool.discovery).forEach((q) => {
    const st = D.statusOf(tool.discovery, q);
    if ((q.required && !D.answered(tool.discovery, q)) || st === 'unknown' || st === 'bpc') tool.discovery.answers[q.id] = { status: 'bpc_accepted' };
  });
  cfg.sections.forEach((s) => assert.ok(D.confirmSection(cfg, tool.discovery, s.id, at(m)), `${tool.id} ${s.id}`));
}

test('full document set: ten project documents and ten per tool, with unique stable IDs', () => {
  const p = demo();
  const set = Docs.documentSet(p, CTX);
  assert.equal(set.filter((d) => d.scope === 'project').length, 10);
  assert.equal(set.filter((d) => d.scope === 'tool').length, 30);
  assert.equal(new Set(set.map((d) => d.id)).size, set.length);
  ['P-IDEA', 'P-JOURNEY', 'P-MAP', 'P-DATA', 'P-TECH', 'P-ACCESS', 'P-MVP', 'P-COVERAGE', 'P-RISKS', 'P-UX', 'T-03-ACCEPTANCE'].forEach((id) => assert.ok(set.some((d) => d.id === id), id));
  const again = Docs.documentSet(p, CTX);
  assert.deepEqual(again.map((d) => d.hash), set.map((d) => d.hash), 'regenerating without changes gives identical documents');
});

test('requirement IDs derive from their question, so unrelated changes never renumber them', () => {
  const p = demo();
  const t = p.tools[2];
  const idsBefore = Docs.documentSet(p, CTX).find((d) => d.id === 'T-03-PURPOSE').blocks.find((b) => b[0] === 'table')[2].map((r) => r[0]);
  t.discovery.answers['SR-A03'] = { status: 'unknown' };
  const idsAfter = Docs.documentSet(p, CTX).find((d) => d.id === 'T-03-PURPOSE').blocks.find((b) => b[0] === 'table')[2].map((r) => r[0]);
  assert.deepEqual(idsAfter, idsBefore);
  assert.ok(idsBefore.includes('REQ-T-03-SR-A01'));
});

test('states: draft until confirmed, then ready; approval, change, diff and re-approval', () => {
  const p = demo();
  const t = p.tools[0];
  assert.equal(doc(p, 'T-01-PURPOSE').state, 'draft');
  assert.equal(Docs.canApprove(doc(p, 'T-01-PURPOSE'), 'client'), false);
  confirmAll(p, t, 1);
  const d1 = doc(p, 'T-01-PURPOSE');
  assert.equal(d1.state, 'ready');
  Docs.approve(p, d1, 'client', at(2));
  assert.equal(doc(p, 'T-01-PURPOSE').state, 'client_approved');
  // Change a decision the document shows.
  const before = JSON.stringify(t.discovery.answers['PC-A02']);
  t.discovery.answers['PC-A02'] = { value: 'The seating layout only.' };
  D.recordChange(MODULES.plan, t.discovery, 'PC-A02', before, at(3));
  const d2 = doc(p, 'T-01-PURPOSE');
  assert.equal(d2.state, 'review');
  const df = Docs.diff(d2.approved.text, d2.md);
  assert.ok(df.some((x) => x.t === 'del' && x.s.includes('projector position')));
  assert.ok(df.some((x) => x.t === 'add' && x.s.includes('The seating layout only.')));
  assert.equal(Docs.canApprove(d2, 'client'), true);
  Docs.approve(p, d2, 'client', at(4));
  assert.equal(doc(p, 'T-01-PURPOSE').state, 'client_approved');
});

test('documents with BPC-owned content need BPC review; BPC can approve or ask for clarification', () => {
  const p = demo();
  p.tools.forEach((t, i) => confirmAll(p, t, i + 1));
  const tech = doc(p, 'P-TECH');
  assert.equal(tech.state, 'ready');
  Docs.approve(p, tech, 'client', at(5));
  assert.equal(doc(p, 'P-TECH').state, 'bpc_review');
  Docs.requestClarification(p, doc(p, 'P-TECH'), 'Which ERP do you use?', at(6));
  assert.equal(doc(p, 'P-TECH').state, 'input');
  Docs.resolveClarification(p, 'P-TECH', at(7));
  Docs.approve(p, doc(p, 'P-TECH'), 'bpc', at(8));
  assert.equal(doc(p, 'P-TECH').state, 'bpc_approved');
  assert.ok(P.projectHistory(p).some((h) => /P-TECH .* approved by BPC/.test(h.text)));
});

test('comments attach to an item ID and are logged', () => {
  const p = demo();
  Docs.comment(p, 'REQ-T-03-SR-B04', 'T-03-OUTPUTS', 'client', 'Show four, not three.', at(1));
  Docs.comment(p, 'REQ-T-03-SR-B04', 'T-03-OUTPUTS', 'bpc', 'Four fits on desktop; three on phones.', at(2));
  assert.equal(p.comments['REQ-T-03-SR-B04'].length, 2);
  assert.ok(P.projectHistory(p).some((h) => /BPC commented on REQ-T-03-SR-B04/.test(h.text)));
});

test('coverage traces decision to rule to test', () => {
  const p = demo();
  const t = p.tools[2];
  P.syncSuggestedRules(t, MODULES.select_recommend);
  const oos = t.studio.rules.find((r) => r.template === 'oos_estimate');
  oos.status = 'active';
  const cov = doc(p, 'P-COVERAGE').blocks.find((b) => b[0] === 'table')[2];
  const row = cov.find((r) => r[0] === 'REQ-T-03-SR-D01');
  assert.equal(row[3], `T-03-${oos.id}`);
  assert.ok(row[4].includes(`AT-T-03-${oos.id}`));
  assert.equal(row[5], 'Tested');
  assert.ok(cov.some((r) => r[5] === 'Open'), 'unknowns show as open');
});

test('usage signals flow into production scope, technical foundation and roles', () => {
  const p = P.newProject(T0);
  P.setDescription(p, 'Sell projector screens with 15 materials and 1500 sizes; dealers and reps use it on sites and in the field.', at(1));
  p.suggestions = { text: p.description, items: P.suggestTools(CATS, p.description), signals: P.detectSignals(CATFILE.signals, p.description) };
  P.addTool(p, CATS, MODULES, { category: 'configure' }, at(2));
  const set = Docs.documentSet(p, CTX);
  assert.ok(set.find((d) => d.id === 'T-01-PRODUCTION').md.includes('Sales reps will use it'));
  const tech = set.find((d) => d.id === 'P-TECH').md;
  assert.ok(tech.includes('TECH-05') && tech.includes('TECH-06'));
  assert.ok(set.find((d) => d.id === 'P-ACCESS').md.includes('ROLE-04'));
  assert.ok(!set.some((d) => d.id === 'P-MAP'), 'no tool map with a single tool');
});

test('developer handover carries decisions, rules, connections, tests and unresolved items', () => {
  const p = demo();
  P.syncSuggestedRules(p.tools[2], MODULES.select_recommend);
  const h = Docs.handover(p, CTX);
  assert.equal(h.schema, 'bpc.handover/1');
  assert.equal(h.tools.length, 3);
  assert.ok(h.tools[2].rules.every((r) => r.trace_id.startsWith('T-03-R-')));
  assert.equal(h.connections.links.length, 5);
  assert.ok(h.connections.tests.length > 0 && h.unresolved.length > 0);
  assert.ok(h.documents.every((d) => d.hash && d.state));
  JSON.parse(JSON.stringify(h));
});

test('dashboard summary gives a next action and go-live items', () => {
  const p = demo();
  const s = Docs.summary(p, CTX);
  assert.equal(s.total, 40);
  assert.ok(s.next.text.length > 0);
  assert.ok(s.goLive.length >= 5);
  assert.ok(s.tests > 10);
});
