// Run: node --test engine/connections.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import P from './project.js';
import C from './connections.js';
import D from './discovery.js';

const load = (f) => JSON.parse(readFileSync(new URL('../modules/' + f, import.meta.url)));
const CATS = load('categories.json').categories;
const MODULES = { connect_tools: load('connect_tools.json') };
CATS.forEach((c) => { MODULES[c.module] = load(c.module + '.json'); });
const T0 = '2026-09-29T10:00:00.000Z';
const demo = () => C.demoProject(P, CATS, MODULES, T0);
const field = (p, name) => p.connections.fields.find((f) => f.name === name).id;
const tid = (p, name) => p.tools.find((t) => t.name === name).id;

test('the cinema demo is a valid three-tool connected project', () => {
  const p = demo();
  assert.deepEqual(p.tools.map((t) => t.name), ['Cinema Room Planner', 'Projector Selector', 'Screen Finder']);
  assert.equal(p.connections.links.length, 5);
  const issues = C.analyse(p);
  assert.deepEqual(issues.filter((i) => i.level === 'error' || i.level === 'warning'), []);
  assert.ok(C.reachable(p).entries.includes(tid(p, 'Cinema Room Planner')));
});

test('changing room dimensions identifies every downstream result, in order, and stops at the loop', () => {
  const p = demo();
  const im = C.impact(p, { field: field(p, 'Room width') });
  assert.equal(im.origin, tid(p, 'Cinema Room Planner'));
  const seq = im.steps.map((s) => `${s.tool}:${s.effect}`);
  assert.deepEqual(seq.slice(0, 1), [`${tid(p, 'Projector Selector')}:recalculate`]);
  assert.ok(seq.includes(`${tid(p, 'Screen Finder')}:recalculate`), 'screen finder recalculates via the projector');
  const back = im.steps.filter((s) => s.tool === tid(p, 'Cinema Room Planner'));
  assert.ok(back.length && back.every((s) => s.effect === 'update' && !s.propagates), 'returns to the planner and stops');
  assert.ok(im.steps.every((s, i) => i === 0 || s.depth >= im.steps[i - 1].depth), 'ordered by depth');
});

test('a flagged connection marks results for review; keep stops propagation', () => {
  const p = demo();
  const im = C.impact(p, { field: field(p, 'Ambient light') });
  const scr = im.steps.find((s) => s.tool === tid(p, 'Screen Finder') && s.link === 'C-03');
  assert.equal(scr.effect, 'flag');
  C.updateLink(p, 'C-01', { on_change: 'keep' }, T0);
  const im2 = C.impact(p, { field: field(p, 'Room width') });
  assert.deepEqual(im2.steps.map((s) => [s.tool, s.effect]), [[tid(p, 'Projector Selector'), 'keep']]);
});

test('clearing propagates like recalculation', () => {
  const p = demo();
  C.updateLink(p, 'C-01', { on_change: 'clear' }, T0);
  const im = C.impact(p, { field: field(p, 'Seating distance') });
  assert.equal(im.steps[0].effect, 'clear');
  assert.ok(im.steps.some((s) => s.tool === tid(p, 'Screen Finder')));
});

test('a loop without a stop point is flagged; branching is allowed', () => {
  const p = demo();
  C.updateLink(p, 'C-04', { loop_ok: false }, T0);
  C.updateLink(p, 'C-05', { loop_ok: false }, T0);
  const w = C.analyse(p).filter((i) => /^Loop/.test(i.text));
  assert.ok(w.length >= 1);
  // The planner branches to two tools; that alone raises nothing.
  const p2 = demo();
  assert.equal(C.analyse(p2).filter((i) => /Loop/.test(i.text)).length, 0);
  assert.equal(p2.connections.links.filter((l) => l.from === tid(p2, 'Cinema Room Planner')).length, 2);
});

test('passing data a tool neither produces nor receives is flagged', () => {
  const p = demo();
  C.addLink(p, { from: tid(p, 'Screen Finder'), to: tid(p, 'Projector Selector'), passes: [field(p, 'Room width')], loop_ok: true }, T0);
  assert.ok(C.analyse(p).some((i) => /Screen Finder passes Room width but neither produces nor receives it/.test(i.text)));
});

test('removing a tool prunes its connections, ownership and fields', () => {
  const p = demo();
  const proj = tid(p, 'Projector Selector');
  P.removeTool(p, proj, T0);
  assert.ok(p.connections.links.every((l) => l.from !== proj && l.to !== proj));
  assert.ok(p.connections.fields.filter((f) => f.name === 'Chosen projector').every((f) => f.owner === null));
  assert.ok(!p.connections.nodes[proj]);
  assert.ok(P.projectHistory(p).some((h) => /Removed tool cleared/.test(h.text)));
});

test('editing and deleting shared fields updates every connection', () => {
  const p = demo();
  const f = field(p, 'Throw ratio');
  C.removeField(p, f, T0);
  assert.ok(p.connections.links.every((l) => !l.passes.includes(f)));
  const nf = C.addField(p, { name: 'Screen gain', type: 'number', owner: tid(p, 'Screen Finder') }, T0);
  assert.equal(nf.id, 'F-09');
});

test('combined acceptance tests have stable IDs and trace to their source', () => {
  const p = demo();
  const t = C.acceptanceTests(p);
  assert.ok(t.length >= 12);
  assert.equal(t[0].id, 'CX-AT-START-T-01');
  assert.equal(new Set(t.map((x) => x.id)).size, t.length, 'ids unique');
  const before = t.find((x) => x.source === 'C-02').id;
  C.removeLink(p, 'C-01', T0);
  assert.equal(C.acceptanceTests(p).find((x) => x.source === 'C-02').id, before, 'ids stable when another connection is removed');
  assert.ok(t.some((x) => x.source === 'C-01' && /passes Room width, Seating distance, Ambient light, Recommended screen size/.test(x.text)));
  assert.ok(t.some((x) => /When Room width changes in T-01 Cinema Room Planner: T-02 Projector Selector recalculates/.test(x.text)));
  assert.ok(t.some((x) => /Price is set only by T-01/.test(x.text)));
});

test('document has every required section and exports to Markdown', () => {
  const p = demo();
  const md = C.toMarkdown('Tool Map and Connections', C.documentBlocks(p, MODULES.connect_tools));
  ['Journey map', 'Shared data model', 'Handoff rules', 'Recalculation', 'Decision ownership', 'How the journey behaves', 'Combined acceptance tests']
    .forEach((h) => assert.ok(md.includes('## ' + h), h));
  assert.ok(md.includes('| C-02 |'));
});

test('document state follows the questionnaire, the analysis and later edits', () => {
  const p = demo();
  const cx = MODULES.connect_tools;
  assert.notEqual(C.docState(p, cx).key, 'ready');
  const st = p.connections.discovery;
  st.answers['CX-Z01'] = { value: 'The whole journey with one change.' };
  cx.sections.forEach((s) => assert.ok(D.confirmSection(cx, st, s.id, '2026-09-29T11:00:00.000Z'), s.id));
  p.connections.confirmed_at = '2026-09-29T11:00:00.000Z';
  assert.equal(C.docState(p, cx).key, 'ready');
  C.updateLink(p, 'C-02', { on_change: 'flag' }, '2026-09-29T12:00:00.000Z');
  assert.equal(C.docState(p, cx).key, 'review');
});

test('connections survive save and resume, and appear in project status and history', () => {
  const p = demo();
  const back = P.deserialise(P.serialise(p), MODULES);
  assert.deepEqual(back.connections.links, p.connections.links);
  const st = P.projectStatus(back, MODULES);
  assert.ok(st.connections && st.connections.links === 5);
  assert.ok(P.projectHistory(back).some((h) => h.scope === 'connections'));
});

test('the connections questionnaire can suggest another tool', () => {
  const p = demo();
  p.connections.discovery.answers['CX-B03'] = { value: 'quote' };
  const imp = P.impliedAcrossTools(p, MODULES, CATS);
  assert.ok(imp.some((i) => i.category === 'quote' && i.because.some((b) => b.tool === 'connections')));
});
