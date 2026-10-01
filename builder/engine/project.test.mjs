// Run: node --test engine/project.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import D from './discovery.js';
import P from './project.js';
import E from './rules.js';

const load = (f) => JSON.parse(readFileSync(new URL('../modules/' + f, import.meta.url)));
const CATFILE = load('categories.json');
const CATS = CATFILE.categories;
const MODULES = {};
CATS.forEach((c) => { MODULES[c.module] = load(c.module + '.json'); });
const SR = MODULES.select_recommend;
const T0 = '2026-09-29T10:00:00.000Z';
const at = (m) => new Date(Date.parse(T0) + m * 60000).toISOString();

function answer(tool, qid, patch, minute) {
  const before = tool.discovery.answers[qid] ? JSON.stringify(tool.discovery.answers[qid]) : '';
  tool.discovery.answers[qid] = Object.assign(tool.discovery.answers[qid] || {}, patch);
  return D.recordChange(MODULES[tool.module], tool.discovery, qid, before, at(minute || 1));
}

test('a three-tool buying journey description suggests planner, selector and quote', () => {
  const text = 'Customers plan a cinema room from its dimensions, then we help them choose the right projector and screen, ' +
    'and trade buyers need a quote for the whole package.';
  const s = P.suggestTools(CATS, text);
  const ids = s.map((x) => x.category);
  ['plan', 'select', 'quote'].forEach((c) => assert.ok(ids.includes(c), c));
  const plan = s.find((x) => x.category === 'plan');
  assert.ok(plan.phrases.includes('plan') && plan.phrases.includes('dimensions'));
  assert.ok(plan.reasons.length >= 2);
  assert.ok(!ids.includes('audit'));
});

test('no suggestions for an empty or unrelated description', () => {
  assert.deepEqual(P.suggestTools(CATS, ''), []);
  assert.deepEqual(P.suggestTools(CATS, 'Hello there'), []);
});

test('multiple tools in one project: add, rename, remove, ids stay stable', () => {
  const p = P.newProject(T0);
  const a = P.addTool(p, CATS, MODULES, { category: 'plan', name: 'Cinema Room Planner', source: 'suggested' }, at(1));
  const b = P.addTool(p, CATS, MODULES, { category: 'select', name: 'Projector Selector' }, at(2));
  const c = P.addTool(p, CATS, MODULES, { category: 'select', name: 'Screen Finder' }, at(3));
  assert.deepEqual(p.tools.map((t) => t.id), ['T-01', 'T-02', 'T-03']);
  assert.ok(b.studio && c.studio && !a.studio, 'selectors get a Rules Studio');
  P.renameTool(p, 'T-02', 'Projector Finder', at(4));
  P.removeTool(p, 'T-02', at(5));
  const d = P.addTool(p, CATS, MODULES, { category: 'quote' }, at(6));
  assert.equal(d.id, 'T-04', 'removed ids are not reused');
  assert.equal(d.name, 'Quote & Convert');
  const hist = P.projectHistory(p).map((h) => h.text);
  assert.ok(hist.some((t) => t.includes('renamed from Projector Selector to Projector Finder')));
  assert.ok(hist.some((t) => t.includes('T-02 Projector Finder removed')));
});

test('answers can suggest other tools, with the question that caused it, and can be dismissed', () => {
  const p = P.newProject(T0);
  const t = P.addTool(p, CATS, MODULES, { category: 'select', name: 'Screen Finder' }, at(1));
  answer(t, 'SR-A04', { value: 'quote' }, 2);
  answer(t, 'SR-C04', { value: ['size', 'material'] }, 3);
  answer(t, 'SR-C01', { value: 'erp' }, 4);
  let imp = P.impliedAcrossTools(p, MODULES, CATS);
  assert.deepEqual(imp.map((i) => i.category).sort(), ['connect', 'plan', 'quote']);
  assert.equal(imp.find((i) => i.category === 'quote').because[0].question, 'SR-A04');
  // Adding the tool removes the suggestion; dismissing hides it.
  P.addTool(p, CATS, MODULES, { category: 'quote', source: 'implied', from: 'T-01 SR-A04' }, at(5));
  P.dismissImplied(p, imp.find((i) => i.category === 'connect').because.map((b) => b.key), at(6));
  imp = P.impliedAcrossTools(p, MODULES, CATS);
  assert.deepEqual(imp.map((i) => i.category), ['plan']);
});

test('intake modules also imply tools', () => {
  const p = P.newProject(T0);
  const t = P.addTool(p, CATS, MODULES, { category: 'plan' }, at(1));
  answer(t, 'PC-B02', { value: ['selector', 'quote'] });
  assert.deepEqual(P.impliedAcrossTools(p, MODULES, CATS).map((i) => i.category).sort(), ['quote', 'select']);
});

test('discovery answers sync suggested rules into the Rules Studio, and changes clean up after themselves', () => {
  const p = P.newProject(T0);
  const t = P.addTool(p, CATS, MODULES, { category: 'select' }, at(1));
  answer(t, 'SR-C04', { value: ['stock'] });
  answer(t, 'SR-D01', { value: 'hide' });
  answer(t, 'SR-D03', { value: 'relax' });
  let r = P.syncSuggestedRules(t, SR);
  assert.equal(r.added.length, 2);
  assert.ok(t.studio.rules.every((x) => x.status === 'suggested' && x.source === 'bpc'));
  // Approve one, then change both answers.
  const hide = t.studio.rules.find((x) => x.template === 'oos_hide');
  hide.status = 'active';
  answer(t, 'SR-D01', { value: 'lower' }, 2);
  answer(t, 'SR-D03', { value: 'message' }, 3);
  r = P.syncSuggestedRules(t, SR);
  assert.ok(r.added.length === 1 && t.studio.rules.some((x) => x.template === 'oos_lower'));
  assert.ok(!t.studio.rules.some((x) => x.template === 'nomatch_relax'), 'unapproved suggestion removed');
  assert.equal(t.studio.rules.find((x) => x.template === 'oos_hide').stale, true, 'approved rule kept but flagged');
  // Rules still evaluate with the engine.
  assert.ok(Array.isArray(E.analyseRules(t.studio.cat, t.studio.rules)));
});

test('recalculated status: changing a confirmed answer flags only the documents it feeds', () => {
  const p = P.newProject(T0);
  P.setDescription(p, 'Help customers choose a screen', at(0));
  const t = P.addTool(p, CATS, MODULES, { category: 'select' }, at(1));
  answer(t, 'SR-A01', { value: ['shoppers'] });
  answer(t, 'SR-A02', { value: 'Which screen suits the room' });
  answer(t, 'SR-A03', { status: 'unknown' });
  answer(t, 'SR-A04', { value: 'basket' });
  assert.ok(D.confirmSection(SR, t.discovery, 'A', at(2)));
  let st = P.projectStatus(p, MODULES);
  assert.equal(st.review.length, 0);
  const e = answer(t, 'SR-A04', { value: 'shortlist' }, 3);
  assert.equal(e.reopened, true);
  st = P.projectStatus(p, MODULES);
  const docs = st.review.map((x) => x.doc).sort();
  assert.deepEqual(e.affects.sort(), ['acceptance', 'outputs']);
  assert.deepEqual(docs, ['acceptance', 'outputs'], 'purpose and journey are not flagged');
  assert.deepEqual(D.changedSinceConfirm(SR, t.discovery, 'A'), ['SR-A04']);
  assert.match(st.next.text, /^Review \d+ documents?/);
});

test('cannot confirm a section with needed answers missing', () => {
  const p = P.newProject(T0);
  const t = P.addTool(p, CATS, MODULES, { category: 'select' }, at(1));
  answer(t, 'SR-A01', { value: ['shoppers'] });
  assert.equal(D.confirmSection(SR, t.discovery, 'A', at(2)), false);
  answer(t, 'SR-A02', { status: 'bpc' });
  answer(t, 'SR-A04', { status: 'unknown' });
  assert.equal(D.confirmSection(SR, t.discovery, 'A', at(3)), true);
  const doc = D.docState(SR, t.discovery, SR.documents.find((d) => d.id === 'purpose'));
  assert.equal(doc.key, 'input', 'unknowns and open BPC questions mean Needs client input, not Ready');
});

test('save and resume round-trips the whole project', () => {
  const p = P.newProject(T0);
  p.name = 'Cinema package';
  P.setDescription(p, 'Plan a room, pick a projector and screen, then quote.', at(1));
  const t = P.addTool(p, CATS, MODULES, { category: 'select', name: 'Screen Finder' }, at(2));
  answer(t, 'SR-A04', { value: 'quote' }, 3);
  P.syncSuggestedRules(t, SR);
  const text = P.serialise(p);
  const back = P.deserialise(text, MODULES);
  assert.deepEqual(JSON.parse(P.serialise(back)), JSON.parse(text));
  assert.equal(back.tools[0].discovery.answers['SR-A04'].value, 'quote');
  assert.throws(() => P.deserialise('{"schema":"nope"}', MODULES), /isn't a Blueprint Builder project/);
  assert.throws(() => P.deserialise('not json', MODULES), /valid JSON/);
});

test('every module is internally consistent', () => {
  Object.entries(MODULES).forEach(([id, cfg]) => {
    const Q = D.index(cfg);
    Object.values(Q).forEach((q) => {
      q.affects.forEach((a) => assert.ok(cfg.documents.some((d) => d.id === a), `${id} ${q.id} affects ${a}`));
      (q.options || []).forEach((o) => (o.implies || []).forEach((imp) => assert.ok(CATS.some((c) => c.id === imp.category), `${q.id} implies ${imp.category}`)));
      if (q.show_if) assert.ok(Q[q.show_if.q], `${q.id} show_if`);
    });
  });
});

test('screen range sold through dealers and reps: configurator, question-led selector and quote, plus usage signals', () => {
  const text = 'I want a system so We can sell projector screens with multiple variables (15 materials, 1500 sizes) we want to be able to use online and share with dealers and reps to use on sites and in the field';
  const s = P.suggestTools(CATS, text);
  const ids = s.map((x) => x.category);
  ['configure', 'select', 'quote'].forEach((c) => assert.ok(ids.includes(c), c));
  assert.equal(s.find((x) => x.category === 'configure').confidence, 'strong');
  assert.ok(s.find((x) => x.category === 'select').reasons.includes('the range is too large to browse'));
  const sig = P.detectSignals(CATFILE.signals, text).map((x) => x.title);
  ['Dealers or partners will use it', 'Sales reps will use it', 'It will be used away from a desk', 'It will be shared or embedded elsewhere'].forEach((t) => assert.ok(sig.includes(t), t));
});

test('question eliminator wording suggests a selector', () => {
  const s = P.suggestTools(CATS, 'We want a question eliminator that narrows down the options');
  assert.equal(s[0].category, 'select');
});

test('KPI tracking and a back-office system suggest Connect & Automate alongside the rest', () => {
  const text = 'I want a system so We can sell projector screens with multiple variables (15 materials, 1500 sizes) we want to be able to use online and share with dealers and reps to use on sites and in the field. We also need a backend system to keep track of KPI';
  const ids = P.suggestTools(CATS, text).map((x) => x.category);
  ['configure', 'select', 'quote', 'connect'].forEach((c) => assert.ok(ids.includes(c), c));
  assert.deepEqual(P.unmatchedParts(CATS, CATFILE.signals, text), []);
});

test('every service area is recognised from a range of everyday phrasings', () => {
  const cases = {
    configure: ['Let customers design their own kitchen', 'We need a 3D preview of the sofa', 'Personalised jewellery with engraving', 'A product builder for modular shelving'],
    select: ['Customers keep buying the wrong size and returning it', 'A gift finder for our shop', 'Help buyers choose the right boiler', 'A quiz that narrows down the options'],
    plan: ['Work out how much paint a room needs', 'A room planner for cinema rooms', 'Show the ROI of switching to solar', 'Calculate the right cable length'],
    quote: ['Our dealers need a quote for bulk orders', 'Turn enquiries into signed proposals', 'Trade customers get prices on request', 'Send a deposit payment link with the quote'],
    connect: ['A dashboard to report on sales KPIs', 'Stop re-keying orders into Xero', 'Sync stock levels with our ERP', 'A back office portal for our reps'],
    audit: ['Check our site meets WCAG', 'Lots of people abandon the basket', 'The website is slow on mobile', 'An accessibility audit before the deadline'],
  };
  Object.entries(cases).forEach(([cat, phrases]) => phrases.forEach((ph) => {
    const ids = P.suggestTools(CATS, ph).map((x) => x.category);
    assert.ok(ids.includes(cat), `${cat}: "${ph}" gave ${ids.join(', ') || 'nothing'}`);
  }));
});

test('sentences that match nothing are listed back, not ignored', () => {
  const um = P.unmatchedParts(CATS, CATFILE.signals, 'Help customers choose the right screen. Our office cat is called Biscuit and loves naps.');
  assert.deepEqual(um.length, 1);
  assert.match(um[0], /Biscuit/);
});
