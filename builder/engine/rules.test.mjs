// Run: node --test engine/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import E from './rules.js';

const cat = JSON.parse(readFileSync(new URL('../data/clothing.json', import.meta.url)));
const rules = cat.rules;
const names = (res) => res.results.map((r) => r.item.name);
const sku = (name) => cat.items.find((i) => i.name === name).sku;

test('ACCEPTANCE: "blue and green linen shirts and trousers" keeps both colours, the material and both types', () => {
  const res = E.evaluate(cat, rules, 'Show all blue and green linen shirts and trousers', { region: 'UK' });
  const c = res.parsed.constraints;
  assert.deepEqual(c.colour.in.sort(), ['blue', 'green']);
  assert.deepEqual(c.material.in, ['linen']);
  assert.deepEqual(c.category.in.sort(), ['shirt', 'trousers']);
  assert.deepEqual(res.parsed.unresolved, []);
  // Every result honours every constraint.
  res.results.forEach((r) => {
    assert.ok(['blue', 'green'].includes(r.item.colour));
    assert.equal(r.item.material, 'linen');
    assert.ok(['shirt', 'trousers'].includes(r.item.category));
  });
  const got = names(res);
  assert.ok(got.includes('Riviera linen shirt'), 'blue linen shirt');
  assert.ok(got.includes('Olive grove linen shirt'), 'green linen shirt');
  assert.ok(got.includes('Coastal linen trousers'), 'blue linen trousers');
  // Honest gap: there are no green linen trousers.
  const gap = res.coverage.cells.find((x) => x.combo.colour === 'green' && x.combo.category === 'trousers');
  assert.equal(gap.inCatalogue, 0);
  assert.equal(gap.gap, true);
  assert.match(gap.explain, /No green linen trousers in the catalogue/);
  assert.equal(res.coverage.cells.length, 4);
});

test('hard rule excludes slow out-of-stock items and says why', () => {
  const res = E.evaluate(cat, rules, 'blue linen shirts', { region: 'UK' });
  assert.ok(!names(res).includes('Harbour linen overshirt'));
  const ex = res.excluded.find((x) => x.item.name === 'Harbour linen overshirt');
  assert.equal(ex.rule, 'R-001');
  assert.equal(ex.hard, true);
});

test('region rule uses the request context and explains the coverage gap', () => {
  const uk = E.evaluate(cat, rules, 'green linen shirts', { region: 'UK' });
  const us = E.evaluate(cat, rules, 'green linen shirts', { region: 'US' });
  assert.ok(names(uk).includes('Olive grove linen shirt'));
  assert.ok(!names(us).includes('Olive grove linen shirt'));
  assert.equal(us.excluded.find((x) => x.item.name === 'Olive grove linen shirt').message, "Doesn't ship to US");
});

test('AI suggestion cannot override a hard rule, even when previewed', () => {
  const res = E.evaluate(cat, rules, 'blue linen shirts', { region: 'UK' }, { previewSuggestions: true });
  assert.ok(!names(res).includes('Harbour linen overshirt'));
  assert.ok(res.blocked.some((b) => b.rule === 'R-009' && b.over === 'R-001'));
  // But it can re-include a soft (non-hard) exclusion.
  const softened = rules.map((r) => (r.id === 'R-001' ? { ...r, hard: false } : r));
  const res2 = E.evaluate(cat, softened, 'blue linen shirts', { region: 'UK' }, { previewSuggestions: true });
  assert.ok(names(res2).includes('Harbour linen overshirt'));
});

test('suggested rules are ignored unless previewed', () => {
  const res = E.evaluate(cat, rules, 'blue linen shirts', { region: 'UK' });
  assert.ok(!res.triggered['R-009']);
});

test('negation and price range in one request', () => {
  const res = E.evaluate(cat, rules, 'Linen shirts under £60, not white', { region: 'UK' });
  assert.deepEqual(res.parsed.constraints.colour.not_in, ['white']);
  assert.deepEqual(res.parsed.numeric[0], { field: 'price', op: 'lt', value: 60, text: 'under £60' });
  res.results.forEach((r) => { assert.notEqual(r.item.colour, 'white'); assert.ok(r.item.price < 60); assert.equal(r.item.material, 'linen'); });
  assert.ok(res.results.length > 0);
});

test('negation stops when a different field starts', () => {
  const p = E.parseRequest(cat, 'not white or black linen shirts');
  assert.deepEqual(p.constraints.colour.not_in.sort(), ['black', 'white']);
  assert.deepEqual(p.constraints.material.in, ['linen']);
  assert.deepEqual(p.constraints.category.in, ['shirt']);
});

test('synonyms and plurals map to catalogue values', () => {
  const p = E.parseRequest(cat, 'olive chinos and blazers');
  assert.deepEqual(p.constraints.colour.in, ['green']);
  assert.deepEqual(p.constraints.category.in.sort(), ['jacket', 'trousers']);
});

test('fallback relaxes material when nothing matches, and says so', () => {
  const res = E.evaluate(cat, rules, 'Green linen trousers', { region: 'UK' });
  assert.equal(res.fallbackUsed[0].rule, 'R-008');
  assert.ok(res.results.length > 0);
  res.results.forEach((r) => { assert.equal(r.item.colour, 'green'); assert.equal(r.item.category, 'trousers'); });
});

test('trade discount, rounding, approval and quote-only', () => {
  const res = E.evaluate(cat, rules, 'linen blazers and blue linen trousers', { region: 'UK', customer_type: 'trade', quantity: 60 });
  const trousers = res.results.find((r) => r.item.name === 'Coastal linen trousers');
  assert.equal(trousers.price, Math.round(79 * 0.9));
  assert.ok(res.approvals.length === 1);
  const blazer = res.results.find((r) => r.item.name === 'Dune linen blazer');
  assert.equal(blazer.quoteOnly, true);
});

test('calculation and message interpolation', () => {
  const res = E.evaluate(cat, rules, 'blue linen trousers', { region: 'UK' });
  const mto = res.results.find((r) => r.item.name === 'Drawstring linen trousers');
  assert.equal(mto.computed.delivery_days, 17);
  assert.ok(mto.messages.includes('Made to order: ships in about 17 days'));
});

test('recommendation boost ranks well-stocked linen first', () => {
  const res = E.evaluate(cat, rules, 'blue shirts', { region: 'UK' });
  assert.equal(res.results[0].item.material, 'linen');
});

test('grouped AND/OR conditions evaluate correctly', () => {
  const r10 = rules.find((r) => r.id === 'R-010');
  const coat = cat.items.find((i) => i.name === 'Bottle wool overcoat');
  const blazer = cat.items.find((i) => i.name === 'Dune linen blazer');
  const shirt = cat.items.find((i) => i.name === 'Riviera linen shirt');
  assert.equal(E.condTrue(r10.when, coat, {}, {}), true);   // wool
  assert.equal(E.condTrue(r10.when, blazer, {}, {}), false); // jacket but not over £200, not wool
  assert.equal(E.condTrue(r10.when, shirt, {}, {}), false);
  const enabled = rules.map((r) => (r.id === 'R-010' ? { ...r, status: 'active' } : r));
  const res = E.evaluate(cat, enabled, 'jackets', { region: 'UK' });
  assert.ok(!names(res).includes('Navy wool blazer'));
});

test('add, edit, duplicate, reorder, disable and delete rules', () => {
  let list = rules.slice();
  const added = E.addRule(list, { name: 'Hide black', when: { op: 'all', items: [{ scope: 'item', field: 'colour', op: 'is', value: 'black' }] }, then: [{ action: 'exclude' }], because: 'Test' });
  list = added.rules;
  assert.equal(added.rule.id, 'R-011');
  assert.ok(!names(E.evaluate(cat, list, 'shirts', {})).includes('Midnight cotton shirt'));
  list = E.updateRule(list, 'R-011', { status: 'disabled' });
  assert.ok(names(E.evaluate(cat, list, 'shirts', {})).includes('Midnight cotton shirt'));
  const dup = E.duplicateRule(list, 'R-003');
  assert.equal(dup.rule.id, 'R-012');
  assert.equal(dup.rule.status, 'disabled');
  list = dup.rules;
  const before = E.renumber(list).map((r) => r.id);
  const moved = E.moveRule(list, 'R-003', -1).map((r) => r.id);
  assert.equal(moved.indexOf('R-003'), before.indexOf('R-003') - 1);
  list = E.deleteRule(list, 'R-011');
  assert.ok(!list.some((r) => r.id === 'R-011'));
});

test('analysis flags incomplete and conflicting rules', () => {
  const bad = rules.concat([
    { id: 'R-020', name: '', type: 'price', priority: 90, status: 'active', source: 'client', when: { op: 'all', items: [{ scope: 'item', field: 'fabric_weight', op: 'gt', value: 200 }] }, then: [], because: '' },
    { id: 'R-021', name: 'Teal', type: 'eligibility', priority: 91, status: 'active', source: 'client', when: { op: 'all', items: [{ scope: 'item', field: 'colour', op: 'is', value: 'teal' }] }, then: [{ action: 'exclude' }], because: 'x' },
    { id: 'R-022', name: 'Back-order', type: 'eligibility', priority: 92, status: 'active', source: 'client', when: { op: 'all', items: [{ scope: 'item', field: 'material', op: 'is', value: 'linen' }] }, then: [{ action: 'include' }], because: 'x' },
    { id: 'R-023', name: 'Soft hide linen', type: 'eligibility', priority: 93, status: 'active', source: 'client', when: { op: 'all', items: [{ scope: 'item', field: 'material', op: 'is', value: 'linen' }] }, then: [{ action: 'exclude' }], because: 'x' },
  ]);
  const issues = E.analyseRules(cat, bad);
  const of = (id) => issues.filter((i) => i.rule === id).map((i) => i.level + ': ' + i.text);
  assert.ok(of('R-020').some((t) => t.includes('Unknown field "fabric_weight"')));
  assert.ok(of('R-020').some((t) => t.includes('THEN')));
  assert.ok(of('R-021').some((t) => t.includes('"teal"')));
  assert.ok(of('R-022').some((t) => t.startsWith('conflict') && t.includes('R-023')));
  assert.ok(of('R-009').some((t) => t.includes("Can't override hard rule R-001")));
  const miss = E.missingFields(cat, bad);
  assert.ok(miss.missing.some((m) => m.field === 'item.fabric_weight'));
});

test('sample data rules are clean apart from expected notes', () => {
  const issues = E.analyseRules(cat, rules).filter((i) => i.level === 'error');
  assert.deepEqual(issues, []);
});

test('formula errors are reported, not thrown', () => {
  assert.equal(E.evalExpr('max(lead_time_days, 5) * 2', { lead_time_days: 3 }), 10);
  assert.throws(() => E.evalExpr('lead_time + 1', {}), /Unknown field/);
});

test('CSV import infers types and the parser uses them', () => {
  const csv = 'SKU,Name,Category,Colour,Material,Price,Sizes\nA1,Blue tee,T-shirt,blue,cotton,20,S;M\nA2,"Green tee, organic",T-shirt,green,cotton,25,M;L\nA3,Blue hoodie,Hoodie,blue,fleece,45,M\nA4,Red hoodie,Hoodie,red,fleece,45,L';
  const c = E.catalogueFromCSV(csv, 'Test');
  const f = E.fieldMap(c);
  assert.equal(f.price.type, 'number');
  assert.equal(f.price.price, true);
  assert.equal(f.sizes.type, 'list');
  assert.equal(f.colour.type, 'enum');
  assert.equal(c.items[1].name, 'Green tee, organic');
  const res = E.evaluate(c, [], 'blue hoodies under £50', {});
  assert.deepEqual(res.results.map((r) => r.item.sku), ['A3']);
});

test('separate product phrases become separate requests', () => {
  const p = E.parseRequest(cat, 'linen blazers and blue linen trousers');
  assert.equal(p.groups.length, 2);
  assert.deepEqual(p.groups[0].category.in, ['jacket']);
  assert.equal(p.groups[0].colour, undefined);
  assert.deepEqual(p.groups[1].colour.in, ['blue']);
  const one = E.parseRequest(cat, 'Show all blue and green linen shirts and trousers');
  assert.equal(one.groups.length, 1);
  const res = E.evaluate(cat, rules, 'blue shirts and green trousers', { region: 'UK' });
  res.results.forEach((r) => assert.ok((r.item.category === 'shirt' && r.item.colour === 'blue') || (r.item.category === 'trousers' && r.item.colour === 'green')));
});
