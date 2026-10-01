// Rules Studio UI component. Depends on Engine (engine/rules.js).
// create(root, hooks, SAMPLE) -> { show(tool) }   hooks: save(), announce(text)
var StudioUI = (function(){
'use strict';
function create(root, hooks, SAMPLE){
root.innerHTML = '\n  <div class="sbar">\n    <span class="badge-sample" id="sample-badge" hidden>Sample data</span>\n    <span class="muted small" id="cat-name"></span>\n    <span class="sp"></span>\n    <button type="button" class="btn ghost tiny" data-act="sample-cat">Load sample catalogue</button>\n    <button type="button" class="btn ghost tiny" data-act="sample-rules">Add sample rules</button>\n    <button type="button" class="btn ghost tiny" data-act="export">Export rules (JSON)</button>\n  </div>\n  <p class="note-sample" id="no-cat" hidden>No catalogue yet. Import a sample CSV on the Catalogue tab, or load the sample clothing catalogue to try rules out. Rules that need fields the catalogue doesn\'t have are flagged under Issues.</p>\n  <div class="swrap">\n  <div>\n    <div class="tabs" role="tablist" aria-label="Rules Studio">\n      <button type="button" role="tab" id="t-rules" aria-controls="p-rules" data-tab="rules">Rules<span class="cnt" id="n-rules"></span></button>\n      <button type="button" role="tab" id="t-issues" aria-controls="p-issues" data-tab="issues">Issues<span class="cnt" id="n-issues"></span></button>\n      <button type="button" role="tab" id="t-cat" aria-controls="p-cat" data-tab="cat">Catalogue</button>\n    </div>\n    <section id="p-rules" role="tabpanel" aria-labelledby="t-rules"></section>\n    <section id="p-issues" role="tabpanel" aria-labelledby="t-issues" hidden></section>\n    <section id="p-cat" role="tabpanel" aria-labelledby="t-cat" hidden></section>\n  </div>\n  <aside class="bench" aria-labelledby="bench-h">\n    <div class="bench-h"><h3 id="bench-h">Test a request</h3><p class="muted small" style="margin:4px 0 0">Type what a customer might ask. The whole request is read, then every active rule runs.</p></div>\n    <div class="bench-in">\n      <label class="sr" for="req">Customer request</label>\n      <textarea id="req" rows="2" placeholder="Show all blue and green linen shirts and trousers"></textarea>\n      <div class="samples" id="samples"></div>\n      <div class="ctx" id="ctx"></div>\n      <label class="check"><input type="checkbox" id="preview"> Include suggested rules (preview only)</label>\n      <div><button type="button" class="btn" data-act="run">Run test</button></div>\n    </div>\n    <div class="out" id="out"></div>\n  </aside>\n  </div>';
var E = Engine;
function $(s, r){ return (r || root).querySelector(s); }
function $$(s, r){ return [].slice.call((r || root).querySelectorAll(s)); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function announce(t){ hooks.announce(t); }

var S = null;
function save(){ hooks.save(); }

/* ---------- field helpers ---------- */
function fieldChoices(){
  var item = (S.cat.fields || []).map(function(f){ return { key:'item.' + f.id, scope:'item', id:f.id, label:f.label, type:f.type }; });
  var req = (S.cat.context || []).map(function(f){ return { key:'request.' + f.id, scope:'request', id:f.id, label:f.label, type:f.type }; });
  (S.cat.fields || []).filter(function(f){ return f.parse_priority != null; }).forEach(function(f){
    req.push({ key:'request.' + f.id, scope:'request', id:f.id, label:'Requested ' + f.label.toLowerCase(), type:'list' });
  });
  return { item:item, request:req };
}
function typeOf(scope, field){
  var t = E.allFieldTypes(S.cat)[scope + '.' + field];
  return t || 'text';
}
function valuesFor(scope, field){
  if (scope === 'request') { var c = E.contextMap(S.cat)[field]; if (c && c.values) return c.values; }
  return E.fieldValues(S.cat, field);
}
function opsFor(type){ return Object.keys(E.OPS).filter(function(k){ return E.OPS[k].types.indexOf(type) > -1; }); }
function defaultValue(scope, field, op){
  var type = typeOf(scope, field), vals = valuesFor(scope, field);
  if (op === 'exists' || op === 'missing') return null;
  if (op === 'between') return [0, 100];
  if (type === 'number') return 0;
  if (op === 'in' || op === 'not_in' || op === 'contains_any') return vals.slice(0, 1);
  return vals[0] || '';
}
function getNode(node, path){ var n = node; path.forEach(function(i){ n = n.items[i]; }); return n; }
function firstField(){
  var f = (S.cat.fields || []).filter(function(x){ return x.type === 'enum'; })[0] || (S.cat.fields || [])[0];
  if (f) return { scope:'item', id:f.id, op:opsFor(f.type)[0] };
  var c = (S.cat.context || [])[0];
  return { scope:'request', id:c.id, op:opsFor(c.type === 'enum' ? 'enum' : c.type)[0] };
}
function ruleById(id){ return S.rules.filter(function(r){ return r.id === id; })[0]; }

/* ---------- analysis cache ---------- */
var ISSUES = [];
function analyse(){
  ISSUES = E.analyseRules(S.cat, S.rules);
  var bad = ISSUES.filter(function(i){ return i.level === 'error' || i.level === 'conflict'; }).length;
  $('#n-issues').textContent = bad ? bad : ISSUES.length;
  $('#n-rules').textContent = S.rules.length;
}
function issuesFor(id){ return ISSUES.filter(function(i){ return i.rule === id; }); }

/* ---------- rules list ---------- */
function chipsHTML(r){
  var src = r.source === 'ai' ? '<span class="chip ai">AI suggestion</span>' : r.source === 'bpc' ? '<span class="chip bpc">BPC</span>' : '<span class="chip">Client</span>';
  var bad = issuesFor(r.id).filter(function(i){ return i.level === 'error' || i.level === 'conflict'; }).length;
  return '<span class="chips">'
    + '<span class="chip">' + esc(labelFrom(E.RULE_TYPES, r.type)) + '</span>'
    + (r.hard ? '<span class="chip hard">Hard</span>' : '')
    + src
    + (r.status !== 'active' ? '<span class="chip off">' + esc(labelFrom(E.STATUSES, r.status)) + '</span>' : '')
    + '<span class="chip">P' + esc(r.priority) + '</span>'
    + (r.stale ? '<span class="chip bad">Answer changed</span>' : '')
    + (r.template ? '<span class="chip">From ' + esc(r.from_question || 'discovery') + '</span>' : '')
    + (bad ? '<span class="chip bad">' + bad + ' issue' + (bad > 1 ? 's' : '') + '</span>' : '')
    + '</span>';
}
function labelFrom(list, id){ var x = list.filter(function(o){ return o.id === id; })[0]; return x ? x.label : id; }
function sentenceHTML(r){
  var d = E.describeRule(S.cat, r);
  return '<div class="sentence" id="sent-' + r.id + '"><span class="kw">When</span><p>' + esc(d.when) + '</p><span class="kw">Then</span><p>' + esc(d.then || '(no action yet)') + '</p><span class="kw">Because</span><p>' + esc(d.because || '(no reason given)') + '</p></div>';
}
function renderRules(focusSel){
  var sorted = S.rules.slice().sort(function(a, b){ return (a.priority - b.priority) || String(a.id).localeCompare(b.id); });
  var html = '<div class="bar"><button type="button" class="btn" data-act="add">Add a rule</button><span class="muted small">Rules run in priority order, lowest number first. Hard rules can\'t be overridden by anything else.</span></div><ol class="rules">';
  sorted.forEach(function(r, i){
    var open = S.open === r.id;
    html += '<li class="rule ' + (r.status === 'disabled' ? 'disabled ' : '') + (r.status === 'suggested' ? 'suggested ' : '') + (open ? 'open' : '') + '" id="rule-' + r.id + '">'
      + '<div class="rh"><span class="rid">' + esc(r.id) + '</span><h3 class="rname" id="rn-' + r.id + '">' + esc(r.name || 'Untitled rule') + '</h3>' + chipsHTML(r) + '</div>'
      + sentenceHTML(r)
      + '<div class="ractions">'
      + '<button type="button" class="link" data-act="edit" data-id="' + r.id + '" aria-expanded="' + open + '" aria-controls="ed-' + r.id + '">' + (open ? 'Close editor' : 'Edit') + '</button>'
      + (r.status === 'suggested' ? '<button type="button" class="link" data-act="approve" data-id="' + r.id + '">Approve suggestion</button>' : '<button type="button" class="link" data-act="toggle" data-id="' + r.id + '">' + (r.status === 'disabled' ? 'Enable' : 'Disable') + '</button>')
      + '<button type="button" class="link" data-act="dup" data-id="' + r.id + '">Duplicate</button>'
      + (i > 0 ? '<button type="button" class="link" data-act="up" data-id="' + r.id + '" aria-label="Move ' + esc(r.id) + ' up">Move up</button>' : '')
      + (i < sorted.length - 1 ? '<button type="button" class="link" data-act="down" data-id="' + r.id + '" aria-label="Move ' + esc(r.id) + ' down">Move down</button>' : '')
      + '<span class="sp"></span><button type="button" class="link" data-act="del" data-id="' + r.id + '" aria-label="Delete ' + esc(r.id) + '">' + (r.status === 'suggested' ? 'Reject' : 'Delete') + '</button></div>'
      + (open ? editorHTML(r) : '')
      + '</li>';
  });
  html += '</ol>';
  $('#p-rules').innerHTML = html;
  if (focusSel) { var el = $(focusSel); if (el) el.focus(); }
}

/* ---------- editor ---------- */
function opt(v, label, sel){ return '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(label) + '</option>'; }
function editorHTML(r){
  var id = r.id;
  var h = '<div class="editor" id="ed-' + id + '" data-rule="' + id + '">'
    + '<div class="grid4">'
    + '<div class="f" style="grid-column:span 2"><label for="e-name-' + id + '">Rule name</label><input type="text" id="e-name-' + id + '" data-k="name" value="' + esc(r.name) + '"></div>'
    + '<div class="f"><label for="e-type-' + id + '">Type</label><select id="e-type-' + id + '" data-k="type">' + E.RULE_TYPES.map(function(t){ return opt(t.id, t.label, t.id === r.type); }).join('') + '</select></div>'
    + '<div class="f"><label for="e-pri-' + id + '">Priority</label><input type="number" id="e-pri-' + id + '" data-k="priority" value="' + esc(r.priority) + '"></div>'
    + '<div class="f"><label for="e-status-' + id + '">Status</label><select id="e-status-' + id + '" data-k="status">' + E.STATUSES.map(function(t){ return opt(t.id, t.label, t.id === r.status); }).join('') + '</select></div>'
    + '<div class="f"><label for="e-src-' + id + '">Source</label><select id="e-src-' + id + '" data-k="source">' + E.SOURCES.map(function(t){ return opt(t.id, t.label, t.id === r.source); }).join('') + '</select></div>'
    + '<div class="f"><label for="e-owner-' + id + '">Owner</label><input type="text" id="e-owner-' + id + '" data-k="owner" value="' + esc(r.owner || '') + '"></div>'
    + '<div class="f" style="align-self:end"><label class="check"><input type="checkbox" data-k="hard"' + (r.hard ? ' checked' : '') + '> Hard rule</label></div>'
    + '</div>';
  // WHEN
  h += '<div class="block"><div class="block-h"><span class="kw">When</span>' + (r.type === 'fallback' ? '<span class="muted small">Fallback rules run only when nothing matches. Conditions here are optional.</span>' : '') + '</div>'
    + groupHTML(r, r.when, [], 0) + '</div>';
  // THEN
  h += '<div class="block"><div class="block-h"><span class="kw">Then</span></div><div class="conds">'
    + (r.then || []).map(function(a, i){ return actionHTML(r, a, i); }).join('')
    + '</div><div class="bar" style="margin:10px 0 0"><button type="button" class="btn ghost tiny" data-act="add-action" data-id="' + id + '">Add an action</button></div></div>';
  // BECAUSE
  h += '<div class="block"><div class="block-h"><label class="kw" for="e-because-' + id + '">Because</label></div><textarea id="e-because-' + id + '" data-k="because" rows="2" placeholder="The business reason, in plain words">' + esc(r.because || '') + '</textarea></div>';
  h += '<div id="ed-issues-' + id + '">' + issuesHTML(issuesFor(id)) + '</div>';
  h += '<div class="ed-foot"><button type="button" class="btn" data-act="edit" data-id="' + id + '">Done</button><span class="muted small">Changes save as you go and re-run the test.</span></div></div>';
  return h;
}
function groupHTML(r, g, path, depth){
  var p = path.join('.');
  var h = '<div class="' + (depth ? 'group' : '') + '">'
    + '<div class="block-h" style="margin-bottom:6px"><span class="seg" role="group" aria-label="Match">'
    + '<button type="button" data-act="gop" data-id="' + r.id + '" data-path="' + p + '" data-op="all" aria-pressed="' + (g.op !== 'any') + '">All of these</button>'
    + '<button type="button" data-act="gop" data-id="' + r.id + '" data-path="' + p + '" data-op="any" aria-pressed="' + (g.op === 'any') + '">Any of these</button></span>'
    + (depth ? '<button type="button" class="link" data-act="rm-cond" data-id="' + r.id + '" data-path="' + p + '">Remove group</button>' : '') + '</div><div class="conds">';
  (g.items || []).forEach(function(c, i){
    var cp = path.concat(i);
    if (i > 0) h += '<span class="joiner">' + (g.op === 'any' ? 'OR' : 'AND') + '</span>';
    h += c.items ? groupHTML(r, c, cp, depth + 1) : condHTML(r, c, cp);
  });
  if (!(g.items || []).length) h += '<p class="muted small" style="margin:0">' + (r.type === 'fallback' ? 'Runs whenever nothing matches.' : 'No conditions yet, so this applies to every item.') + '</p>';
  h += '</div><div class="bar" style="margin:8px 0 0"><button type="button" class="btn ghost tiny" data-act="add-cond" data-id="' + r.id + '" data-path="' + p + '">Add a condition</button>'
    + (depth === 0 ? '<button type="button" class="btn ghost tiny" data-act="add-group" data-id="' + r.id + '" data-path="' + p + '">Add a group</button>' : '') + '</div></div>';
  return h;
}
function condHTML(r, c, path){
  var p = path.join('.'), uid = r.id + '-' + path.join('-');
  var fc = fieldChoices(), type = typeOf(c.scope || 'item', c.field);
  var fieldSel = '<select id="c-f-' + uid + '" data-cond="field" data-id="' + r.id + '" data-path="' + p + '" aria-label="Field">'
    + '<optgroup label="Item">' + fc.item.map(function(f){ return opt(f.key, f.label, f.key === (c.scope || 'item') + '.' + c.field); }).join('') + '</optgroup>'
    + '<optgroup label="Request">' + fc.request.map(function(f){ return opt(f.key, f.label, f.key === (c.scope || 'item') + '.' + c.field); }).join('') + '</optgroup>'
    + (fc.item.concat(fc.request).some(function(f){ return f.key === (c.scope || 'item') + '.' + c.field; }) ? '' : opt((c.scope || 'item') + '.' + c.field, c.field + ' (missing)', true))
    + '</select>';
  var ops = opsFor(type);
  var opSel = '<select id="c-o-' + uid + '" data-cond="op" data-id="' + r.id + '" data-path="' + p + '" aria-label="Comparison">'
    + ops.map(function(o){ return opt(o, E.OPS[o].label, o === c.op); }).join('') + (ops.indexOf(c.op) < 0 ? opt(c.op, c.op + ' (invalid)', true) : '') + '</select>';
  return '<div class="cond">' + fieldSel + opSel + '<div>' + valueHTML(r, c, p, uid, type) + '</div>'
    + '<button type="button" class="x" data-act="rm-cond" data-id="' + r.id + '" data-path="' + p + '" aria-label="Remove condition">✕</button></div>';
}
function valueHTML(r, c, p, uid, type){
  var base = ' data-id="' + r.id + '" data-path="' + p + '"';
  if (c.op === 'exists' || c.op === 'missing') return '<span class="muted small">No value needed</span>';
  if (type === 'number') {
    if (c.op === 'between') {
      var v = Array.isArray(c.value) ? c.value : [0, 0];
      return '<div class="two"><input type="number" data-cond="v0"' + base + ' value="' + esc(v[0]) + '" aria-label="From"><span class="muted small">and</span><input type="number" data-cond="v1"' + base + ' value="' + esc(v[1]) + '" aria-label="To"></div>';
    }
    return '<input type="number" data-cond="value"' + base + ' value="' + esc(c.value) + '" aria-label="Value">';
  }
  var vals = valuesFor(c.scope || 'item', c.field);
  if (c.op === 'in' || c.op === 'not_in' || c.op === 'contains_any') {
    var cur = Array.isArray(c.value) ? c.value : [];
    var extra = cur.filter(function(x){ return vals.indexOf(x) < 0; });
    return '<div class="vals" role="group" aria-label="Values">' + vals.concat(extra).map(function(v){
      return '<label><input type="checkbox" data-cond="multi"' + base + ' value="' + esc(v) + '"' + (cur.indexOf(v) > -1 ? ' checked' : '') + '>' + esc(v) + '</label>';
    }).join('') + '</div>';
  }
  if ((type === 'enum' || type === 'list') && vals.length) {
    var refs = (S.cat.context || []).filter(function(x){ return x.type === 'enum'; });
    var curV = c.value && c.value.ref ? 'ref:' + c.value.ref : String(c.value == null ? '' : c.value);
    var known = vals.indexOf(curV) > -1 || curV.indexOf('ref:') === 0;
    return '<select data-cond="value"' + base + ' aria-label="Value">' + vals.map(function(v){ return opt(v, v, v === curV); }).join('')
      + (known ? '' : opt(curV, curV + ' (not in catalogue)', true))
      + (refs.length && (c.scope || 'item') === 'item' ? '<optgroup label="Compare with the request">' + refs.map(function(x){ return opt('ref:request.' + x.id, "The customer's " + x.label.toLowerCase().replace('customer ', ''), curV === 'ref:request.' + x.id); }).join('') + '</optgroup>' : '')
      + '</select>';
  }
  return '<input type="text" data-cond="value"' + base + ' value="' + esc(c.value == null ? '' : c.value) + '" aria-label="Value">';
}
function actionHTML(r, a, i){
  var base = ' data-id="' + r.id + '" data-i="' + i + '"';
  var sel = '<select data-a="action"' + base + ' aria-label="Action ' + (i + 1) + '">' + Object.keys(E.ACTIONS).map(function(k){ return opt(k, E.ACTIONS[k].label, k === a.action); }).join('') + '</select>';
  var p = '';
  function txt(k, label, v){ return '<input type="text" data-a="' + k + '"' + base + ' value="' + esc(v == null ? '' : v) + '" placeholder="' + esc(label) + '" aria-label="' + esc(label) + '">'; }
  function num(k, label, v){ return '<input type="number" step="any" data-a="' + k + '"' + base + ' value="' + esc(v == null ? '' : v) + '" placeholder="' + esc(label) + '" aria-label="' + esc(label) + '">'; }
  function pick(k, label, map, v){ return '<select data-a="' + k + '"' + base + ' aria-label="' + esc(label) + '">' + Object.keys(map).map(function(x){ return opt(x, map[x], String(x) === String(v)); }).join('') + '</select>'; }
  switch (a.action) {
    case 'exclude': case 'include': case 'quote_only': case 'require_approval': case 'handoff':
      p = txt('message', 'Message shown to the customer or staff (optional)', a.message); break;
    case 'boost': case 'demote': p = num('amount', 'Points', a.amount); break;
    case 'adjust_price': p = pick('mode', 'Adjust by', { percent:'Percent', amount:'Amount (£)' }, a.mode || 'percent') + num('amount', 'Amount, e.g. -10', a.amount) + pick('round', 'Rounding', E.PRICE_ROUNDING, a.round || 'none'); break;
    case 'calculate': p = txt('target', 'Value name, e.g. delivery_days', a.target) + txt('expr', 'Formula, e.g. lead_time_days + 3', a.expr) + pick('round', 'Rounding', E.CALC_ROUNDING, a.round || 'none'); break;
    case 'message': p = txt('text', 'Message; use {field} to insert values', a.text); break;
    case 'relax':
      var ef = {}; (S.cat.fields || []).filter(function(f){ return f.parse_priority != null; }).forEach(function(f){ ef[f.id] = f.label; });
      p = pick('field', 'Requirement to drop', ef, a.field); break;
  }
  return '<div class="act">' + sel + '<div class="params">' + p + '</div><button type="button" class="x" data-act="rm-action"' + base + ' aria-label="Remove action ' + (i + 1) + '">✕</button></div>';
}
function issuesHTML(list){
  if (!list.length) return '';
  var order = { error:0, conflict:1, warning:2, info:3 };
  return '<ul class="issues">' + list.slice().sort(function(a, b){ return order[a.level] - order[b.level]; }).map(function(i){
    return '<li class="iss ' + i.level + '"><span class="lv">' + esc(i.level) + '</span>' + (i.rule ? '<button type="button" class="link" data-act="open" data-id="' + esc(i.rule) + '">' + esc(i.rule) + '</button> ' : '') + esc(i.text) + '</li>';
  }).join('') + '</ul>';
}
function refreshRuleChrome(r){
  analyse();
  var s = $('#sent-' + r.id); if (s) s.outerHTML = sentenceHTML(r);
  var n = $('#rn-' + r.id); if (n) n.textContent = r.name || 'Untitled rule';
  var card = $('#rule-' + r.id); if (card) { var ch = $('.chips', card); if (ch) ch.outerHTML = chipsHTML(r); }
  var iss = $('#ed-issues-' + r.id); if (iss) iss.innerHTML = issuesHTML(issuesFor(r.id));
  if (S.tab === 'issues') renderIssues();
}

/* ---------- issues and catalogue ---------- */
function renderIssues(){
  var list = ISSUES;
  $('#p-issues').innerHTML = list.length
    ? '<p class="muted small">Checked against the catalogue. Errors and conflicts need fixing; warnings and notes are for review.</p>' + issuesHTML(list)
    : '<p class="muted">No issues found.</p>';
}
function renderCatalogue(){
  var c = S.cat, mf = E.missingFields(c, S.rules);
  var used = mf.used.filter(function(k){ return k.indexOf('item.') === 0; }).map(function(k){ return k.slice(5); });
  var h = (c.sample ? '<p class="note-sample">Sample data. Results show how your rules behave; they don\'t prove the mapping of your full product range.</p>' : '')
    + '<div class="bar"><strong>' + esc(c.name) + '</strong><span class="muted small">' + (c.items || []).length + ' products, ' + (c.fields || []).length + ' fields</span></div>'
    + '<h3 style="margin:14px 0 4px;font-size:15px">Fields</h3><p class="muted small" style="margin:0">Green: used by your rules. Dashed red: your rules need it but the catalogue doesn\'t have it.</p><div class="fields">'
    + (c.fields || []).map(function(f){ return '<div class="fcard' + (used.indexOf(f.id) > -1 ? ' used' : '') + '"><div>' + esc(f.label) + '</div><div class="t">' + esc(f.id) + ', ' + esc(f.type) + (f.parse_priority != null ? ', searchable' : '') + '</div></div>'; }).join('')
    + mf.missing.map(function(m){ return '<div class="fcard missing"><div>' + esc(m.field) + '</div><div class="t">missing, used by ' + esc(m.rules.join(', ')) + '</div></div>'; }).join('')
    + '</div>';
  var cols = (c.fields || []).map(function(f){ return f.id; });
  h += '<div class="tbl" tabindex="0" aria-label="Catalogue table"><table><thead><tr>' + cols.map(function(k){ return '<th scope="col">' + esc(k) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + (c.items || []).slice(0, 200).map(function(it){ return '<tr>' + cols.map(function(k){ var v = it[k]; return '<td>' + esc(Array.isArray(v) ? v.join(', ') : v) + '</td>'; }).join('') + '</tr>'; }).join('')
    + '</tbody></table></div>';
  h += '<h3 style="margin:22px 0 6px;font-size:15px">Import a sample CSV</h3><p class="muted small" style="margin:0 0 8px">First row is the header. Use ; to separate several values in one cell, e.g. S;M;L. Columns with a small set of repeated values become searchable. Your rules are kept; any that refer to missing fields will be flagged.</p>'
    + '<div class="bar"><input type="file" id="csv-file" accept=".csv,text/csv" aria-label="Choose a CSV file"></div>'
    + '<label class="sr" for="csv-text">Or paste CSV</label><textarea id="csv-text" rows="4" placeholder="SKU,Name,Category,Colour,Material,Price,Sizes"></textarea>'
    + '<div class="bar" style="margin-top:8px"><button type="button" class="btn ghost tiny" data-act="csv">Import pasted CSV</button><span class="muted small" id="csv-msg" role="status"></span></div>';
  $('#p-cat').innerHTML = h;
}

/* ---------- test bench ---------- */
function renderBenchInputs(){
  $('#req').value = S.req;
  $('#preview').checked = !!S.preview;
  $('#samples').innerHTML = (S.cat.sample_requests || []).map(function(q){ return '<button type="button" data-sample="' + esc(q) + '">' + esc(q) + '</button>'; }).join('');
  $('#ctx').innerHTML = (S.cat.context || []).map(function(c){
    var v = S.ctx[c.id] != null ? S.ctx[c.id] : c.default;
    var input = c.type === 'enum'
      ? '<select id="ctx-' + c.id + '" data-ctx="' + c.id + '">' + (c.values || []).map(function(x){ return opt(x, x, x === v); }).join('') + '</select>'
      : '<input type="' + (c.type === 'number' ? 'number' : 'text') + '" id="ctx-' + c.id + '" data-ctx="' + c.id + '" value="' + esc(v) + '">';
    return '<div class="f"><label for="ctx-' + c.id + '">' + esc(c.label) + '</label>' + input + '</div>';
  }).join('');
}
function money(n){ return n == null ? '' : '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0 }); }
function runTest(say){
  if (!S.req.trim()) { $('#out').innerHTML = '<p class="muted small">Type a request or pick an example above.</p>'; return; }
  var res = E.evaluate(S.cat, S.rules, S.req, S.ctx, { previewSuggestions:S.preview });
  var p = res.parsed, h = '';
  if (res.sample) h += '<p class="note-sample" style="margin:0">Results from sample catalogue data.</p>';
  h += '<section><h3>How the request was read</h3><div class="interp">' + (res.interpretation.length ? res.interpretation.map(function(l){ return '<span class="ic' + (l.negative ? ' neg' : '') + '">' + esc(l.text) + '</span>'; }).join('') : '<span class="muted small">No product attributes found.</span>') + '</div>'
    + (p.groups && p.groups.length > 1 ? '<p class="small muted" style="margin:6px 0 0">Read as ' + p.groups.length + ' separate requests, because each names its own product type with its own details.</p>' : '')
    + (p.unresolved.length ? '<p class="flag" style="margin:8px 0 0">Not understood: ' + esc(p.unresolved.join(', ')) + '. These words weren\'t used.</p>' : '')
    + p.ambiguous.map(function(a){ return '<p class="flag" style="margin:8px 0 0">"' + esc(a.phrase) + '" could mean ' + a.options.map(function(o){ return esc(E.labelOf(S.cat, o.field).toLowerCase() + ' ' + o.value); }).join(' or ') + '. Used ' + esc(E.labelOf(S.cat, a.chosen.field).toLowerCase()) + '.</p>'; }).join('')
    + '</section>';
  if (res.coverage.cells.length > 1 || (res.coverage.cells[0] && res.coverage.cells[0].gap)) {
    h += '<section><h3>Coverage of every combination asked for</h3><div class="tbl cov"><table><thead><tr><th scope="col">Combination</th><th scope="col">Shown</th><th scope="col">What happened</th></tr></thead><tbody>'
      + res.coverage.cells.map(function(c){ return '<tr class="' + (c.gap ? 'gap' : '') + '"><td>' + esc(c.label) + '</td><td>' + c.shown + '</td><td>' + esc(c.explain) + '</td></tr>'; }).join('')
      + '</tbody></table></div></section>';
  }
  res.fallbackUsed.forEach(function(f){ h += '<p class="flag">Fallback ' + esc(f.rule) + ': ' + esc(f.notes.join('. ')) + '</p>'; });
  res.approvals.forEach(function(a){ h += '<p class="flag">Needs staff approval: ' + esc(a) + '</p>'; });
  res.handoffs.forEach(function(a){ h += '<p class="flag">Handed to staff: ' + esc(a) + '</p>'; });
  var blockedRules = {}; res.blocked.forEach(function(b){ blockedRules[b.text] = (blockedRules[b.text] || 0) + 1; });
  Object.keys(blockedRules).forEach(function(t){ h += '<p class="flag err">Blocked: ' + esc(t) + ' (' + blockedRules[t] + ' item' + (blockedRules[t] > 1 ? 's' : '') + ').</p>'; });
  res.errors.forEach(function(e){ h += '<p class="flag err">' + esc(e.rule) + ' failed: ' + esc(e.text) + '</p>'; });

  h += '<section><h3>' + res.results.length + ' result' + (res.results.length === 1 ? '' : 's') + '</h3><ul class="res">' + res.results.map(function(s){
    var it = s.item, attrs = ['category', 'colour', 'material'].filter(function(k){ return it[k]; }).map(function(k){ return it[k]; }).join(', ');
    var price = s.quoteOnly ? 'Quote only' : (s.price !== s.basePrice ? '<s>' + money(s.basePrice) + '</s>' + money(s.price) : money(s.price));
    return '<li class="ri"><div class="ri-h"><span class="ri-n">' + esc(it.name || it.sku) + '</span><span class="ri-p">' + price + '</span></div>'
      + '<div class="ri-a">' + esc(it.sku) + (attrs ? ', ' + esc(attrs) : '') + (it.stock != null ? ', stock ' + esc(it.stock) : '') + '</div>'
      + (s.score || s.reincludedBy || s.approval.length ? '<div class="ri-b">' + (s.score ? '<span class="chip">Rank +' + s.score + '</span>' : '') + (s.reincludedBy ? '<span class="chip ai">Re-included by ' + esc(s.reincludedBy) + '</span>' : '') + (s.approval.length ? '<span class="chip">Needs approval</span>' : '') + '</div>' : '')
      + s.messages.map(function(m){ return '<p class="ri-m">' + esc(m) + '</p>'; }).join('')
      + (s.trace.length ? '<details><summary>Why: ' + s.trace.map(function(t){ return esc(t.rule); }).join(', ') + '</summary><ul class="trace">' + s.trace.map(function(t){ return '<li>' + esc(t.rule + ' ' + t.name) + ': ' + esc(t.effects.join('; ')) + '</li>'; }).join('') + '</ul></details>' : '')
      + '</li>';
  }).join('') + '</ul></section>';
  if (res.excluded.length) h += '<details><summary>' + res.excluded.length + ' matched the request but were excluded by rules</summary><ul class="ex">' + res.excluded.map(function(x){ return '<li>' + esc(x.item.name) + ': ' + esc(x.rule) + (x.hard ? ' (hard)' : '') + ', ' + esc(x.message) + '</li>'; }).join('') + '</ul></details>';
  var trig = Object.keys(res.triggered).sort();
  h += '<details><summary>Rules that fired: ' + (trig.length ? esc(trig.join(', ')) : 'none') + '</summary><ul class="ex">' + trig.map(function(id){ var r = ruleById(id); return '<li>' + esc(id) + ' ' + esc(r ? r.name : '') + ': ' + res.triggered[id] + ' item' + (res.triggered[id] > 1 ? 's' : '') + '</li>'; }).join('') + '</ul></details>';
  h += '<p class="muted small" style="margin:0">' + res.notMatchingRequest + ' catalogue items didn\'t match the request.</p>';
  $('#out').innerHTML = h;
  if (say) announce(res.results.length + ' results. ' + res.coverage.cells.filter(function(c){ return c.gap; }).length + ' combinations with nothing to show.');
}

/* ---------- tabs ---------- */
function setTab(t){
  S.tab = t; save();
  ['rules', 'issues', 'cat'].forEach(function(k){
    $('#t-' + k).setAttribute('aria-selected', String(k === t));
    $('#p-' + k).hidden = k !== t;
  });
  if (t === 'issues') renderIssues();
  if (t === 'cat') renderCatalogue();
}

function renderAll(focusSel){
  analyse();
  $('#sample-badge').hidden = !S.cat.sample;
  $('#cat-name').textContent = S.cat.name + ', ' + (S.cat.items || []).length + ' products';
  $('#no-cat').hidden = (S.cat.items || []).length > 0;
  renderRules(focusSel);
  setTab(S.tab);
  renderBenchInputs();
  runTest(false);
}

/* ---------- events: editor inputs ---------- */
root.addEventListener('input', onInput);
root.addEventListener('change', onInput);
var testTimer = null;
function retest(){ clearTimeout(testTimer); testTimer = setTimeout(function(){ runTest(false); }, 150); }
function onInput(e){
  if (!S) return;
  var t = e.target;
  if (t.id === 'req') { S.req = t.value; save(); return; }
  if (t.id === 'preview') { S.preview = t.checked; save(); runTest(true); return; }
  if (t.hasAttribute('data-ctx')) { var c = E.contextMap(S.cat)[t.getAttribute('data-ctx')]; S.ctx[c.id] = c.type === 'number' ? parseFloat(t.value) || 0 : t.value; save(); runTest(false); return; }
  if (t.id === 'csv-file' && e.type === 'change' && t.files && t.files[0]) {
    var fr = new FileReader(); fr.onload = function(){ importCSV(fr.result, t.files[0].name.replace(/\.csv$/i, '')); }; fr.readAsText(t.files[0]); return;
  }
  var ed = t.closest && t.closest('[data-rule]'); if (!ed) return;
  var r = ruleById(ed.getAttribute('data-rule')); if (!r) return;
  var structural = false, focus = null;

  if (t.hasAttribute('data-k')) {
    var k = t.getAttribute('data-k');
    r[k] = k === 'hard' ? t.checked : k === 'priority' ? (parseInt(t.value, 10) || 0) : t.value;
    if (k === 'type' || k === 'status' || k === 'source') { structural = true; focus = '#' + t.id; }
    if (k === 'status' && t.value === 'active' && r.source === 'ai') r.approvedBy = 'client';
  } else if (t.hasAttribute('data-cond')) {
    var path = t.getAttribute('data-path').split('.').map(Number), node = getNode(r.when, path), kind = t.getAttribute('data-cond');
    if (kind === 'field') {
      var parts = t.value.split('.'); node.scope = parts[0]; node.field = parts.slice(1).join('.');
      node.op = opsFor(typeOf(node.scope, node.field))[0]; node.value = defaultValue(node.scope, node.field, node.op);
      structural = true; focus = '#' + t.id;
    } else if (kind === 'op') {
      var before = node.op; node.op = t.value;
      var shape = function(o){ return o === 'between' ? 'b' : (o === 'in' || o === 'not_in' || o === 'contains_any') ? 'm' : (o === 'exists' || o === 'missing') ? 'n' : 's'; };
      if (shape(before) !== shape(node.op)) node.value = defaultValue(node.scope || 'item', node.field, node.op);
      structural = true; focus = '#' + t.id;
    } else if (kind === 'value') {
      node.value = t.type === 'number' ? parseFloat(t.value) : (t.value.indexOf('ref:') === 0 ? { ref:t.value.slice(4) } : t.value);
    } else if (kind === 'v0' || kind === 'v1') {
      if (!Array.isArray(node.value)) node.value = [0, 0];
      node.value[kind === 'v0' ? 0 : 1] = parseFloat(t.value);
    } else if (kind === 'multi') {
      if (e.type !== 'change') return;
      node.value = $$('input[data-cond="multi"][data-path="' + t.getAttribute('data-path') + '"]', ed).filter(function(b){ return b.checked; }).map(function(b){ return b.value; });
    }
  } else if (t.hasAttribute('data-a')) {
    var a = r.then[+t.getAttribute('data-i')], ak = t.getAttribute('data-a');
    if (ak === 'action') {
      var na = { action:t.value };
      if (t.value === "boost" || t.value === "demote") na.amount = 10;
      if (t.value === 'adjust_price') { na.mode = 'percent'; na.amount = -10; na.round = 'none'; }
      if (t.value === 'calculate') { na.target = ''; na.expr = ''; na.round = 'none'; }
      if (t.value === 'relax') { var ef = (S.cat.fields || []).filter(function(f){ return f.parse_priority != null; })[0]; na.field = ef ? ef.id : ''; }
      r.then[+t.getAttribute('data-i')] = na; structural = true; focus = '[data-a="action"][data-id="' + r.id + '"][data-i="' + t.getAttribute('data-i') + '"]';
    } else a[ak] = t.type === 'number' ? parseFloat(t.value) : t.value;
  } else return;

  save();
  if (structural) { analyse(); renderRules(focus); }
  else refreshRuleChrome(r);
  retest();
}

/* ---------- events: clicks ---------- */
root.addEventListener('click', function(e){
  if (!S) return;
  var s = e.target.closest('[data-sample]');
  if (s) { S.req = s.getAttribute('data-sample'); $('#req').value = S.req; save(); runTest(true); return; }
  var tb = e.target.closest('[data-tab]'); if (tb) { setTab(tb.getAttribute('data-tab')); return; }
  var b = e.target.closest('[data-act]'); if (!b) return;
  var act = b.getAttribute('data-act'), id = b.getAttribute('data-id'), r = id ? ruleById(id) : null, focus = null, res;
  switch (act) {
    case 'run': runTest(true); return;
    case 'export': download(); return;
    case 'sample-cat':
      if ((S.cat.items || []).length && !confirm('Replace this tool\'s catalogue with the sample clothing catalogue? Your rules are kept.')) return;
      var sc = clone(SAMPLE); delete sc.rules; S.cat = sc; S.ctx = {}; save(); renderAll(); announce('Sample catalogue loaded.'); return;
    case 'sample-rules':
      if (!confirm('Add the ten sample clothing rules to this tool?')) return;
      clone(SAMPLE.rules).forEach(function(r){ var res2 = E.addRule(S.rules, Object.assign(r, { id:undefined, priority:undefined })); S.rules = res2.rules; });
      save(); renderAll(); announce('Sample rules added.'); return;
    case 'csv': importCSV($('#csv-text').value, 'Pasted catalogue'); return;
    case 'add':
      res = E.addRule(S.rules, { source:'client' }); S.rules = res.rules; S.open = res.rule.id; S.tab = 'rules';
      focus = '#e-name-' + res.rule.id; announce(res.rule.id + ' added.'); break;
    case 'edit': S.open = S.open === id ? null : id; focus = S.open ? '#e-name-' + id : '[data-act="edit"][data-id="' + id + '"]'; break;
    case 'open': S.open = id; setTab('rules'); save(); renderRules('#e-name-' + id); var card = $('#rule-' + id); if (card) card.scrollIntoView({ block:'start' }); return;
    case 'toggle': r.status = r.status === 'disabled' ? 'active' : 'disabled'; focus = '[data-act="toggle"][data-id="' + id + '"]'; announce(id + (r.status === 'active' ? ' enabled.' : ' disabled.')); break;
    case 'approve': r.status = 'active'; r.approvedBy = 'client'; focus = '[data-act="toggle"][data-id="' + id + '"]'; announce(id + ' approved and active.'); break;
    case 'dup': res = E.duplicateRule(S.rules, id); S.rules = res.rules; S.open = res.rule.id; focus = '#e-name-' + res.rule.id; announce('Duplicated as ' + res.rule.id + ', disabled until you enable it.'); break;
    case 'up': case 'down': S.rules = E.moveRule(S.rules, id, act === 'up' ? -1 : 1); focus = '[data-act="' + act + '"][data-id="' + id + '"]'; break;
    case 'del':
      if (!confirm((r.status === 'suggested' ? 'Reject ' : 'Delete ') + id + '?')) return;
      S.rules = E.deleteRule(S.rules, id); if (S.open === id) S.open = null; focus = '[data-act="add"]'; announce(id + ' removed.'); break;
    case 'gop': getNode(r.when, pathOf(b)).op = b.getAttribute('data-op'); focus = '[data-act="gop"][data-id="' + id + '"][data-path="' + b.getAttribute('data-path') + '"][data-op="' + b.getAttribute('data-op') + '"]'; break;
    case 'add-cond':
      var g = getNode(r.when, pathOf(b)), fd = firstField();
      g.items.push({ scope:fd.scope, field:fd.id, op:fd.op, value:defaultValue(fd.scope, fd.id, fd.op) });
      focus = '#c-f-' + id + '-' + pathOf(b).concat(g.items.length - 1).join('-'); break;
    case 'add-group':
      var g2 = getNode(r.when, pathOf(b)), f1 = firstField();
      g2.items.push({ op:'any', items:[{ scope:f1.scope, field:f1.id, op:f1.op, value:defaultValue(f1.scope, f1.id, f1.op) }] });
      focus = '#c-f-' + id + '-' + pathOf(b).concat(g2.items.length - 1, 0).join('-'); break;
    case 'rm-cond':
      var path = pathOf(b), last = path.pop(); getNode(r.when, path).items.splice(last, 1);
      focus = '[data-act="add-cond"][data-id="' + id + '"][data-path="' + path.join('.') + '"]'; break;
    case 'add-action': r.then = r.then || []; r.then.push({ action:'exclude', message:'' }); focus = '[data-a="action"][data-id="' + id + '"][data-i="' + (r.then.length - 1) + '"]'; break;
    case 'rm-action': r.then.splice(+b.getAttribute('data-i'), 1); focus = '[data-act="add-action"][data-id="' + id + '"]'; break;
    default: return;
  }
  save(); analyse(); renderRules(focus); if (S.tab !== 'rules') setTab(S.tab); retest();
});
function pathOf(b){ var p = b.getAttribute('data-path'); return p === '' || p == null ? [] : p.split('.').map(Number); }

function importCSV(text, name){
  var msg = $('#csv-msg');
  try {
    var c = E.catalogueFromCSV(text, name);
    c.context = (S.cat.context || []).slice();
    S.cat = c; S.ctx = {}; save();
    renderAll();
    setTab('cat');
    $('#csv-msg').textContent = 'Imported ' + c.items.length + ' products. Check the Issues tab for rules that need new fields.';
  } catch (err) { if (msg) msg.textContent = err.message; }
}
function download(){
  var out = { schema:'bpc.rules/1', exported:new Date().toISOString(), catalogue:{ name:S.cat.name, sample:S.cat.sample, fields:S.cat.fields, context:S.cat.context, item_count:(S.cat.items || []).length }, rules:S.rules };
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type:'application/json' }));
  a.download = 'rules.json'; document.body.appendChild(a); a.click(); a.remove();
}


return { show:function(tool){ S = tool.studio; if (!S.tab) S.tab = 'rules'; if (!S.ctx) S.ctx = {}; renderAll(); } };
}
return { create:create };
})();
