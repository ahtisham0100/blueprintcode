// Discovery UI component. Depends on Discovery (engine/discovery.js) and Engine (engine/rules.js).
// create(root, hooks) -> { show(tool, cfg, focus) }
// hooks: save(), changed(), openRules(toolId)
var DiscoveryUI = (function(){
'use strict';
var D = Discovery;
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function when(iso){ var d = new Date(iso); return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }); }
function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

function create(root, hooks){
  var CFG = null, S = null, TOOL = null, editing = null, pending = {};
  root.innerHTML = '<div class="dshell"><nav class="dsteps" aria-label="Sections"><ol></ol></nav><div class="dmain"></div><aside class="drail" aria-label="Tool status"></aside></div>';
  var HID = (root.id || 'disc') + '-h';
  var stepsEl = root.querySelector('.dsteps ol'), mainEl = root.querySelector('.dmain'), railEl = root.querySelector('.drail');
  function $(s){ return root.querySelector(s); }
  function $$(s){ return [].slice.call(root.querySelectorAll(s)); }
  function Qs(){ return D.index(CFG); }
  function A(id){ return S.answers[id] || {}; }
  function docTitle(id){ var d = CFG.documents.filter(function(x){ return x.id === id; })[0]; return d ? d.title : id; }
  function sec(id){ return CFG.sections.filter(function(s){ return s.id === id; })[0]; }
  function persist(){ hooks.save(); }

  /* ---------- render ---------- */
  function renderSteps(){
    var items = CFG.sections.map(function(s){
      var st = D.sectionState(CFG, S, s);
      return '<li><button type="button" data-dgo="' + s.id + '"' + (S.current === s.id ? ' aria-current="step"' : '') + '><span class="l">' + esc(s.id) + '</span><span>' + esc(s.title) + '</span><span class="st ' + st.key + '">' + esc(st.label) + '</span></button></li>';
    });
    items.push('<li><button type="button" data-dgo="review"' + (S.current === 'review' ? ' aria-current="step"' : '') + '><span class="l">✓</span><span>Review</span></button></li>');
    stepsEl.innerHTML = items.join('');
  }
  function optionsHTML(q){
    var a = A(q.id), multi = q.type === 'multi', v = a.value;
    var html = '<div class="opts">' + q.options.map(function(o, i){
      var on = multi ? Array.isArray(v) && v.indexOf(o.id) > -1 : v === o.id;
      return '<label class="opt"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="' + q.id + '" id="' + q.id + '-' + i + '" value="' + esc(o.id) + '" data-q="' + q.id + '"' + (on ? ' checked' : '') + '><span>' + esc(cap(o.label)) + '</span></label>';
    }).join('') + '</div>';
    var oo = q.options.filter(function(o){ return o.other; })[0];
    if (oo) {
      var show = multi ? Array.isArray(v) && v.indexOf(oo.id) > -1 : v === oo.id;
      html += '<div class="other"' + (show ? '' : ' hidden') + '><label class="sr" for="' + q.id + '-other">Describe</label><input type="text" id="' + q.id + '-other" data-q="' + q.id + '" data-other value="' + esc(a.other || '') + '" placeholder="Describe"></div>';
    }
    return html;
  }
  function questionHTML(q){
    var a = A(q.id), st = D.statusOf(S, q), hint = q.hint ? '<p class="hint" id="h-' + q.id + '">' + esc(q.hint) + '</p>' : '';
    var head = '<span class="qid">' + q.id + '</span><span>' + esc(q.label) + '</span>' + (q.required ? '<span class="req">needed</span>' : '');
    var input;
    if (q.type === 'single' || q.type === 'multi') input = optionsHTML(q);
    else if (q.type === 'textarea') input = '<textarea id="' + q.id + '-in" data-q="' + q.id + '" rows="3"' + (q.hint ? ' aria-describedby="h-' + q.id + '"' : '') + '>' + esc(a.value || '') + '</textarea>';
    else input = '<input type="text" id="' + q.id + '-in" data-q="' + q.id + '" value="' + esc(a.value || '') + '"' + (q.hint ? ' aria-describedby="h-' + q.id + '"' : '') + '>';
    var foot = '<div class="qfoot">';
    if (D.hasValue(S, q) && ['bpc', 'bpc_accepted', 'unknown'].indexOf(st) < 0)
      foot += '<span class="seg" role="group" aria-label="How sure are you?"><button type="button" data-set="confirmed" data-qid="' + q.id + '" aria-pressed="' + (st === 'confirmed') + '">Confirmed</button><button type="button" data-set="assumption" data-qid="' + q.id + '" aria-pressed="' + (st === 'assumption') + '">Assumption</button></span>';
    foot += '<button type="button" class="tog" data-set="unknown" data-qid="' + q.id + '" aria-pressed="' + (st === 'unknown') + '">I don\'t know</button>'
      + '<button type="button" class="tog bpc" data-set="bpc" data-qid="' + q.id + '" aria-pressed="' + (st === 'bpc' || st === 'bpc_accepted') + '">Ask BPC to advise</button>'
      + '<span class="affects">Feeds: ' + esc(q.affects.map(docTitle).join(', ')) + '</span></div>';
    var extra = '';
    if (st === 'bpc' || st === 'bpc_accepted') {
      extra = '<div class="rec"><p><strong>BPC recommends:</strong> ' + esc(q.recommend || "We'll advise on this at the scoping call.") + '</p>'
        + (q.recommend ? (st === 'bpc_accepted' ? '<span class="chip bpc_accepted">Accepted as a BPC recommendation</span> <button type="button" class="link" data-set="bpc" data-qid="' + q.id + '">Undo</button>'
          : '<button type="button" class="btn ghost tiny" data-set="bpc_accepted" data-qid="' + q.id + '">Accept this recommendation</button>') : '') + '</div>';
    } else if (st === 'unknown') extra = '<p class="unk">Marked as unknown. It won\'t block you; we\'ll cover it at scoping.</p>';
    var tag = (q.type === 'single' || q.type === 'multi') ? 'fieldset' : 'div';
    var legend = tag === 'fieldset' ? '<legend>' + head + '</legend>' : '<label class="ql" for="' + q.id + '-in">' + head + '</label>';
    return '<' + tag + ' class="q" id="q-' + q.id + '"' + (tag === 'fieldset' && q.hint ? ' aria-describedby="h-' + q.id + '"' : '') + '>' + legend + hint + input + foot + extra + '</' + tag + '>';
  }
  function summaryHTML(s){
    var qs = D.visibleQuestions(CFG, S, s), st = S.sections[s.id], ss = D.sectionState(CFG, S, s);
    var items = qs.map(function(q){
      var t = D.decisionText(S, q), stt = D.statusOf(S, q);
      if (!t) return '<li><span class="qid">' + q.id + '</span><p class="txt muted">' + esc(q.label) + '</p><span class="chip missing">' + (q.required ? 'Needed' : 'Not answered') + '</span></li>';
      var editable = stt !== 'unknown' && stt !== 'bpc';
      return '<li><span class="qid">' + q.id + '</span>' + (editing === q.id
        ? '<span class="ed"><label class="sr" for="w-' + q.id + '">Wording for ' + q.id + '</label><input type="text" id="w-' + q.id + '" value="' + esc(t) + '"><button type="button" class="btn tiny" data-dact="save-wording" data-qid="' + q.id + '">Save</button></span>'
        : '<p class="txt">' + esc(t) + (A(q.id).wording ? ' <span class="muted small">(edited)</span>' : '')
          + (editable ? ' <button type="button" class="link" data-dact="edit-wording" data-qid="' + q.id + '" aria-label="Edit wording of ' + q.id + '">Edit wording</button>' : '')
          + (A(q.id).wording ? ' <button type="button" class="link" data-dact="reset-wording" data-qid="' + q.id + '">Use generated</button>' : '') + '</p>')
        + '<span class="chip ' + stt + '">' + esc(D.STATUS_LABEL[stt]) + '</span></li>';
    }).join('');
    var btn = st && st.status === 'confirmed'
      ? '<p class="banner ok" style="margin:0">Confirmed ' + when(st.at) + '. Changing an answer marks the documents it feeds for review.</p>'
      : '<button type="button" class="btn" data-dact="confirm" data-sec="' + s.id + '"' + (ss.missing ? ' disabled aria-describedby="need-' + s.id + '"' : '') + '>' + (st && st.status === 'needs_review' ? 'Confirm changes' : 'Confirm this section') + '</button>'
        + (ss.missing ? ' <span class="muted small" id="need-' + s.id + '">Answer the ' + ss.missing + ' needed question' + (ss.missing > 1 ? 's' : '') + ' first, or mark ' + (ss.missing > 1 ? 'them' : 'it') + ' as unknown.</span>' : '');
    return '<section class="summary" aria-labelledby="sum-' + s.id + '"><h2 id="sum-' + s.id + '">Decision summary</h2><p class="muted small" style="margin:0">Check the wording. Edit anything that doesn\'t say what you mean.</p><ul class="dec">' + items + '</ul>' + btn + '</section>';
  }
  function renderSection(focus){
    var s = sec(S.current), i = CFG.sections.indexOf(s), st = S.sections[s.id];
    var tools = '<div class="dbar">' + (CFG.example ? '<button type="button" class="btn ghost tiny" data-dact="example">Load example answers</button>' : '')
      + '<button type="button" class="btn ghost tiny" data-dact="clear">Clear answers</button><span class="muted small">' + (CFG.module.depth === 'full' ? 'Detailed discovery' : 'Guided intake') + '</span></div>';
    var html = tools + '<h2 class="dh" tabindex="-1" id="' + HID + '">' + esc(s.title) + '</h2><p class="intro">' + esc(s.intro) + (i === 0 ? ' ' + esc(CFG.module.intro) : '') + '</p>';
    if (st && st.status === 'needs_review') {
      var changed = D.changedSinceConfirm(CFG, S, s.id);
      var aff = [].concat.apply([], changed.map(function(id){ return Qs()[id].affects; })).filter(function(v, j, a){ return a.indexOf(v) === j; });
      html += '<p class="banner">Changed since you confirmed it: ' + esc(changed.join(', ')) + '. Documents to review: ' + esc(aff.map(docTitle).join(', ')) + '. Check the summary and confirm again.</p>';
    }
    html += '<div class="qs">' + D.visibleQuestions(CFG, S, s).map(questionHTML).join('') + '</div><div class="sumwrap">' + summaryHTML(s) + '</div>';
    html += '<div class="nav">' + (i > 0 ? '<button type="button" class="btn ghost" data-dgo="' + CFG.sections[i - 1].id + '">Back</button>' : '')
      + '<button type="button" class="btn push" data-dgo="' + (i < CFG.sections.length - 1 ? CFG.sections[i + 1].id : 'review') + '">' + (i < CFG.sections.length - 1 ? 'Next: ' + esc(CFG.sections[i + 1].title) : 'Review') + '</button></div>';
    mainEl.innerHTML = html;
    if (focus) { var el = typeof focus === 'string' ? root.querySelector(focus) : $('#' + HID); if (el) el.focus(); }
  }
  function renderReview(focus){
    var lists = { confirmed:[], assumption:[], bpc:[], unknown:[], missing:[] };
    D.allVisible(CFG, S).forEach(function(q){
      var st = D.statusOf(S, q);
      if (!st) { if (q.required) lists.missing.push(q); return; }
      lists[st === 'bpc_accepted' || st === 'bpc' ? 'bpc' : st].push(q);
    });
    function li(q){ return '<li><span class="qid">' + q.id + '</span> ' + esc(D.decisionText(S, q) || q.label) + (D.statusOf(S, q) === 'bpc' ? ' <span class="chip bpc">awaiting your decision</span>' : '') + ' <button type="button" class="link" data-dgo="' + q.section + '" data-focus="q-' + q.id + '">Change</button></li>'; }
    function panel(title, arr, note){ return '<section class="panel"><h3>' + title + ' (' + arr.length + ')</h3>' + (note ? '<p class="muted small" style="margin:0 0 6px">' + note + '</p>' : '') + (arr.length ? '<ul>' + arr.map(li).join('') + '</ul>' : '<p class="muted small" style="margin:0">None.</p>') + '</section>'; }
    var rules = D.suggestedRules(CFG, S);
    var html = '<h2 class="dh" tabindex="-1" id="' + HID + '">Review</h2><p class="intro">Everything recorded for this tool, sorted by how certain it is. Nothing here is an approved design or a fixed price.</p>'
      + (lists.missing.length ? '<p class="banner">' + lists.missing.length + ' needed question' + (lists.missing.length > 1 ? 's are' : ' is') + ' unanswered: ' + lists.missing.map(function(q){ return '<button type="button" class="link" data-dgo="' + q.section + '" data-focus="q-' + q.id + '">' + q.id + '</button>'; }).join(', ') + '.</p>' : '')
      + '<div class="grid-rev">' + panel('Confirmed', lists.confirmed) + panel('Assumptions', lists.assumption, 'Believed but not checked.')
      + panel('BPC recommendations', lists.bpc, 'Accepted ones are marked; the rest need your decision.') + panel('Unknown', lists.unknown, 'Resolved at scoping.') + '</div>'
      + '<h3 class="subh">Documents</h3><div class="tbl"><table><thead><tr><th scope="col">Document</th><th scope="col">Status</th><th scope="col">Fed by</th></tr></thead><tbody>'
      + CFG.documents.map(function(d){ var s = D.docState(CFG, S, d); return '<tr><td>' + esc(d.title) + '</td><td><span class="ds ' + s.key + '">' + esc(s.label) + '</span></td><td class="small muted">' + (s.questions.join(', ') || (d.id === 'rules' && TOOL.studio ? 'The Rules Studio' : 'Not covered by this intake')) + '</td></tr>'; }).join('')
      + '</tbody></table></div>';
    if (TOOL.studio) html += '<h3 class="subh">Rules suggested by your answers</h3>' + (rules.length ? '<ul>' + rules.map(function(r){ return '<li>' + esc(r.name) + ' <span class="muted small">(from ' + r.from_question + ')</span></li>'; }).join('') + '</ul>' : '<p class="muted small">None yet.</p>')
      + '<button type="button" class="btn ghost" data-dact="rules">Open the Rules Studio</button>';
    html += '<div class="nav"><button type="button" class="btn ghost" data-dgo="' + CFG.sections[CFG.sections.length - 1].id + '">Back</button></div>';
    mainEl.innerHTML = html;
    if (focus) $('#' + HID).focus();
  }
  function renderRail(){
    var c = D.counts(CFG, S);
    var html = '<section><h3>Answers</h3><dl class="counts"><div><dt>Confirmed</dt><dd>' + c.confirmed + '</dd></div><div><dt>Assumptions</dt><dd>' + c.assumption + '</dd></div><div><dt>BPC advice</dt><dd>' + c.bpc + '</dd></div><div><dt>Unknown</dt><dd>' + c.unknown + '</dd></div></dl>'
      + (c.missing ? '<p class="small muted" style="margin:8px 0 0">' + c.missing + ' needed question' + (c.missing > 1 ? 's' : '') + ' unanswered.</p>' : '') + '</section>';
    html += '<section><h3>Documents</h3><ul class="docs">' + CFG.documents.map(function(d){ var s = D.docState(CFG, S, d); return '<li><span>' + esc(d.title) + '</span><span class="ds ' + s.key + '">' + esc(s.label) + '</span></li>'; }).join('') + '</ul></section>';
    html += '<section><h3>Changes to this tool</h3>' + ((S.history || []).length ? '<ul class="hist">' + S.history.slice(0, 5).map(function(h){
      return '<li><span class="when">' + when(h.at) + ', ' + h.q + (h.reopened ? ', reopened' : '') + '</span>' + esc(h.to) + '</li>';
    }).join('') + '</ul>' : '<p class="muted small" style="margin:0">None yet.</p>') + '</section>';
    railEl.innerHTML = html;
  }
  function refreshSide(){ renderSteps(); renderRail(); if (S.current !== 'review') { var w = $('.sumwrap'); if (w) w.innerHTML = summaryHTML(sec(S.current)); } }
  function render(focus){ renderSteps(); renderRail(); if (S.current === 'review') renderReview(focus); else renderSection(focus); }

  /* ---------- editing ---------- */
  function beginEdit(q){ if (!(q.id in pending)) pending[q.id] = S.answers[q.id] ? JSON.stringify(S.answers[q.id]) : ''; }
  function commit(q){ if (q.id in pending) { D.recordChange(CFG, S, q.id, pending[q.id]); delete pending[q.id]; hooks.changed(); } }
  function resetStatusOnValue(a){ if (a.status === 'unknown' || a.status === 'bpc' || a.status === 'bpc_accepted') a.status = 'confirmed'; }

  root.addEventListener('input', function(e){
    var t = e.target, qid = t.getAttribute && t.getAttribute('data-q'); if (!qid || !S) return;
    if (t.type === 'radio' || t.type === 'checkbox') return;
    var q = Qs()[qid]; beginEdit(q);
    var a = S.answers[qid] = S.answers[qid] || {};
    if (t.hasAttribute('data-other')) a.other = t.value;
    else { a.value = t.value; if (t.value.trim()) resetStatusOnValue(a); }
    delete a.wording;
    persist(); refreshSide();
  });
  root.addEventListener('change', function(e){
    var t = e.target, qid = t.getAttribute && t.getAttribute('data-q'); if (!qid || !S) return;
    var q = Qs()[qid];
    if (t.type === 'radio' || t.type === 'checkbox') {
      beginEdit(q);
      var a = S.answers[qid] = S.answers[qid] || {};
      if (t.type === 'radio') a.value = t.value;
      else {
        var boxes = $$('input[name="' + qid + '"]'), clicked = q.options.filter(function(o){ return o.id === t.value; })[0];
        if (t.checked) boxes.forEach(function(b){ var o = q.options.filter(function(x){ return x.id === b.value; })[0]; if (b !== t && (clicked.exclusive || o.exclusive)) b.checked = false; });
        a.value = boxes.filter(function(b){ return b.checked; }).map(function(b){ return b.value; });
      }
      resetStatusOnValue(a); delete a.wording;
      commit(q); persist(); renderSection('#' + CSS.escape(t.id)); refreshSide();
    } else {
      commit(q); persist();
      var el = document.getElementById('q-' + q.id);
      if (el && !el.contains(document.activeElement)) { var tmp = document.createElement('div'); tmp.innerHTML = questionHTML(q); el.replaceWith(tmp.firstChild); }
      refreshSide();
    }
  });
  root.addEventListener('click', function(e){
    if (!S) return;
    var g = e.target.closest('[data-dgo]');
    if (g) {
      S.current = g.getAttribute('data-dgo'); persist(); render(true);
      var f = g.getAttribute('data-focus');
      if (f) { var el = document.getElementById(f); if (el) { el.scrollIntoView({ block:'center' }); var inp = el.querySelector('input,textarea'); if (inp) inp.focus(); } }
      return;
    }
    var s = e.target.closest('[data-set]');
    if (s) {
      var q = Qs()[s.getAttribute('data-qid')], set = s.getAttribute('data-set');
      var before = S.answers[q.id] ? JSON.stringify(S.answers[q.id]) : '';
      var a = S.answers[q.id] = S.answers[q.id] || {};
      if ((set === 'unknown' || set === 'bpc') && s.classList.contains('tog') && s.getAttribute('aria-pressed') === 'true') delete a.status;
      else a.status = set;
      if (a.status === 'unknown' || a.status === 'bpc') delete a.wording;
      D.recordChange(CFG, S, q.id, before); hooks.changed(); persist();
      renderSection('[data-set="' + set + '"][data-qid="' + q.id + '"]'); refreshSide();
      if (!root.contains(document.activeElement)) { var qq = document.getElementById('q-' + q.id); if (qq) { var b = qq.querySelector('button'); if (b) b.focus(); } }
      return;
    }
    var b = e.target.closest('[data-dact]'); if (!b) return;
    var act = b.getAttribute('data-dact'), qid = b.getAttribute('data-qid');
    if (act === 'edit-wording') { editing = qid; refreshSide(); var w = document.getElementById('w-' + qid); if (w) w.focus(); }
    else if (act === 'save-wording') {
      var q2 = Qs()[qid], bf = JSON.stringify(A(qid)), val = document.getElementById('w-' + qid).value.trim();
      S.answers[qid] = S.answers[qid] || {};
      delete S.answers[qid].wording;
      if (val && val !== D.generatedText(S, q2)) S.answers[qid].wording = val;
      editing = null; D.recordChange(CFG, S, qid, bf); hooks.changed(); persist(); refreshSide();
      var eb = root.querySelector('[data-dact="edit-wording"][data-qid="' + qid + '"]'); if (eb) eb.focus();
    }
    else if (act === 'reset-wording') { var bf2 = JSON.stringify(A(qid)); delete S.answers[qid].wording; D.recordChange(CFG, S, qid, bf2); hooks.changed(); persist(); refreshSide(); }
    else if (act === 'confirm') {
      if (D.confirmSection(CFG, S, b.getAttribute('data-sec'))) { hooks.changed(); persist(); refreshSide(); hooks.announce(sec(b.getAttribute('data-sec')).title + ' confirmed.'); var nb = root.querySelector('.nav .push'); if (nb) nb.focus(); }
    }
    else if (act === 'rules') hooks.openRules(TOOL.id);
    else if (act === 'example') {
      if (Object.keys(S.answers).length && !confirm('Replace this tool\'s answers with the example?')) return;
      var fresh = D.blankState(CFG);
      Object.keys(fresh).forEach(function(k){ S[k] = fresh[k]; });
      Object.keys(CFG.example.answers).forEach(function(k){ S.answers[k] = JSON.parse(JSON.stringify(CFG.example.answers[k])); });
      S.history = [{ at:new Date().toISOString(), q:'—', label:'Example', from:'', to:'Example answers loaded', affects:[], reopened:false }];
      hooks.changed(); persist(); render(true); hooks.announce('Example loaded.');
    }
    else if (act === 'clear') {
      if (!confirm('Clear every answer for this tool?')) return;
      var bl = D.blankState(CFG); Object.keys(bl).forEach(function(k){ S[k] = bl[k]; });
      hooks.changed(); persist(); render(true);
    }
  });

  return {
    show: function(tool, cfg, focus){ TOOL = tool; CFG = cfg; S = tool.discovery; editing = null; pending = {}; if (S.current !== 'review' && !sec(S.current)) S.current = CFG.sections[0].id; render(focus); }
  };
}
return { create:create };
})();
