// Blueprint dashboard and document views. Depends on Documents, Project.
// create(root, hooks) -> { dashboard(project, focus), doc(project, id, focus) }
// hooks: save(), announce(text), changed(), ctx (modules, categories, signals, implied), reviewer() -> true in a BPC review session
var DocumentsUI = (function(){
'use strict';
var Dm = Documents;
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function when(iso){ var d = new Date(iso); return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }); }
var IDRE = /^[A-Z]{1,5}-[A-Za-z0-9_.-]+$/;
function download(name, text, type){ var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type:type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function slug(s){ return String(s || 'blueprint').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function create(root, hooks){
  var P = null, docs = [], current = null, openThread = null;
  function $(s){ return root.querySelector(s); }
  // Reviewer mode comes from the server (a review session opened from the CMS), never from this device.
  function reviewer(){ return !!(hooks.reviewer && hooks.reviewer()); }
  function regen(){ docs = Dm.documentSet(P, hooks.ctx); return docs; }
  function chip(d){ return '<span class="st-chip st-' + d.state + '">' + esc(d.stateLabel) + '</span>'; }
  function groups(){
    var g = [{ key:'project', title:'Project', docs:docs.filter(function(d){ return d.scope === 'project'; }) }];
    P.tools.forEach(function(t){ g.push({ key:t.id, title:t.id + ' ' + t.name, docs:docs.filter(function(d){ return d.tool === t.id; }) }); });
    return g;
  }
  function reviewerBar(){
    return reviewer() ? '<p class="rv muted small">Reviewing as BPC: approvals, clarification requests and comments are recorded as BPC.</p>' : '';
  }

  /* ---------- dashboard ---------- */
  function dashboard(focus){
    regen();
    var s = Dm.summary(P, hooks.ctx, docs), hist = Project.projectHistory(P).slice(0, 8);
    var status = s.needsReview ? ['Needs review', s.needsReview + ' document' + (s.needsReview > 1 ? 's' : '') + ' changed after approval']
      : s.needsInput ? ['Needs your input', s.needsInput + ' document' + (s.needsInput > 1 ? 's have' : ' has') + ' open items']
      : s.drafts ? ['In progress', s.drafts + ' document' + (s.drafts > 1 ? 's' : '') + ' still in draft'] : ['Ready', 'Nothing waiting on you'];
    var cards = [['Current status', status[0], status[1]], ['Blueprint documents', s.approved + '/' + s.total + ' approved', s.ready + ' ready for your review'],
      ['Review progress', (s.byState.client_approved || 0) + (s.byState.bpc_review || 0) + ' client approved, ' + s.bpcApproved + ' BPC approved', 'Approve each document, then BPC reviews it'],
      ['Next action', s.next.text, s.next.doc ? '<a href="#/doc/' + esc(s.next.doc) + '">Open ' + esc(s.next.doc) + '</a>' : '']];
    var html = '<p class="crumb">Blueprint / Overview</p><div class="th-row"><h1 id="bp-h" tabindex="-1">' + esc(P.name || 'Untitled project') + '</h1></div>'
      + (P.description ? '<p class="lead">' + esc(P.description) + '</p>' : '') + reviewerBar()
      + '<div class="bpgrid"><div class="bpmain">'
      + '<div class="stats4">' + cards.map(function(c){ return '<div class="stat"><p class="stat-k">' + c[0] + '</p><p class="stat-v">' + esc(c[1]) + '</p><p class="stat-s">' + (c[0] === 'Next action' ? c[2] : esc(c[2])) + '</p></div>'; }).join('') + '</div>';
    html += '<section class="panel"><div class="panel-h"><h2>Blueprint documents</h2><span class="pill">' + s.approved + '/' + s.total + ' approved</span></div>'
      + groups().map(function(g){
        return '<h3 class="grp-h">' + esc(g.title) + '</h3><div class="dgrid">' + g.docs.map(function(d){
          return '<a class="dcard" href="#/doc/' + esc(d.id) + '">' + chip(d) + '<span class="dcard-id">' + esc(d.id) + '</span><span class="dcard-t">' + esc(d.title) + '</span>'
            + (d.open.length ? '<span class="dcard-s">' + d.open.length + ' open item' + (d.open.length > 1 ? 's' : '') + '</span>' : '') + '</a>';
        }).join('') + '</div>';
      }).join('') + '</section>';
    var dec = s.decisions, sig = (P.suggestions && P.suggestions.signals) || [];
    var sums = [
      ['Product summary', [P.description ? P.description.slice(0, 140) + (P.description.length > 140 ? '…' : '') : 'No description yet.', P.tools.length + ' tool' + (P.tools.length === 1 ? '' : 's') + ': ' + P.tools.map(function(t){ return t.name; }).join(', ')].concat(sig.map(function(x){ return x.title; }))],
      ['MVP summary', [(function(){ var m = docs.filter(function(d){ return d.id === 'P-MVP'; })[0]; var p = m && m.blocks.filter(function(b){ return b[0] === 'p'; })[0]; return p ? p[1] : ''; })(), 'Phases: scoping, Prototype Sprint, production, later']],
      ['Application summary', [P.tools.length + ' tools' + (P.connections && P.tools.length > 1 ? ', ' + P.connections.links.length + ' connections, ' + P.connections.fields.length + ' shared fields' : ''), dec + ' of ' + s.requirements + ' decisions recorded', s.activeRules + ' active rules of ' + s.rules, s.tests + ' acceptance tests']],
      ['Technical summary', (function(){ var t = docs.filter(function(d){ return d.id === 'P-TECH'; })[0]; var tb = t && t.blocks.filter(function(b){ return b[0] === 'table'; })[0]; return tb && tb[2].length ? tb[2].slice(0, 4).map(function(r){ return r[2]; }) : ['Platform and systems not recorded yet']; })()],
    ];
    html += '<div class="sgrid4">' + sums.map(function(x){ return '<section class="scard2"><h3>' + x[0] + '</h3><ul>' + x[1].filter(Boolean).map(function(i){ return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></section>'; }).join('') + '</div>';
    html += '<section class="panel"><div class="panel-h"><h2>Before go-live</h2><span class="pill">' + s.goLive.length + ' to settle</span></div><p class="muted" style="margin:0 0 10px">Work that must be true before launch, not before development starts.</p><ul class="golive">'
      + s.goLive.map(function(g){ return '<li><span class="dcard-id">' + esc(g[0]) + '</span><strong>' + esc(g[1]) + '</strong><span class="muted small">' + esc(g[2]) + '</span></li>'; }).join('') + '</ul></section>';
    html += '</div><aside class="bprail">'
      + '<section class="pcard"><h2>Project health</h2><dl class="health">'
      + [['Documents approved', s.approved + '/' + s.total], ['Ready for review', s.ready], ['Needs input', s.needsInput], ['Needs review', s.needsReview], ['In draft', s.drafts], ['Open items', s.openItems], ['Version', P.version], ['Last changed', P.updated ? when(P.updated) : '-']]
        .map(function(r){ return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('')
      + '</dl><a class="btn ghost tiny" href="#/doc/P-RISKS">Open decisions and risks</a></section>'
      + '<section class="pcard"><h2>Recent activity</h2><ul class="hist">' + hist.map(function(h){ return '<li><span class="when">' + when(h.at) + (h.tool ? ', ' + esc(h.tool) : '') + '</span>' + esc(h.text) + '</li>'; }).join('') + '</ul></section>'
      + '<section class="pcard"><h2>Next stages</h2><ol class="stages"><li><strong>Prototype Sprint</strong><span>After the documents are approved.</span></li><li><strong>Production build</strong><span>From the approved production scope.</span></li><li><strong>Support</strong><span>Price, product and rule updates.</span></li></ol></section>'
      + '<section class="pcard"><h2>Export</h2><div class="bar"><button type="button" class="btn tiny" data-dcact="md-all">Full blueprint (.md)</button><button type="button" class="btn ghost tiny" data-dcact="handover">Developer handover (.json)</button></div><p class="muted small" style="margin:8px 0 0">Open any document and print it to save a PDF.</p></section>'
      + '</aside></div>';
    root.innerHTML = '<div class="bp">' + html + '</div>';
    if (focus) $('#bp-h').focus();
  }

  /* ---------- document view ---------- */
  function cellHTML(x, docId, first){
    var v = String(x == null ? '' : x);
    if (first && IDRE.test(v)) {
      var n = (P.comments && P.comments[v] || []).length;
      return '<td class="idc"><span class="dcard-id">' + esc(v) + '</span><button type="button" class="cbtn" data-dcact="thread" data-item="' + esc(v) + '" aria-expanded="' + (openThread === v) + '" aria-label="' + (n ? n + ' comment' + (n > 1 ? 's' : '') + ' on ' : 'Comment on ') + esc(v) + '">' + (n ? n + ' comment' + (n > 1 ? 's' : '') : 'Comment') + '</button></td>';
    }
    return '<td>' + esc(v) + '</td>';
  }
  function threadHTML(item, cols){
    var list = (P.comments && P.comments[item]) || [];
    return '<tr class="thread"><td colspan="' + cols + '"><div class="thr">' + (list.length ? '<ul>' + list.map(function(c){ return '<li><span class="when">' + when(c.at) + ', ' + (c.by === 'bpc' ? 'BPC' : 'Client') + '</span>' + esc(c.text) + '</li>'; }).join('') + '</ul>' : '<p class="muted small" style="margin:0 0 6px">No comments yet.</p>')
      + '<label class="sr" for="cm-text">Comment on ' + esc(item) + '</label><textarea id="cm-text" rows="2" placeholder="Ask a question or suggest a change"></textarea>'
      + '<div class="bar" style="margin-top:6px"><button type="button" class="btn tiny" data-dcact="comment" data-item="' + esc(item) + '">Add comment as ' + (reviewer() ? 'BPC' : 'client') + '</button><button type="button" class="link" data-dcact="thread" data-item="' + esc(item) + '">Close</button></div></div></td></tr>';
  }
  function blocksHTML(d){
    return d.blocks.map(function(b){
      if (b[0] === 'h') return '<h3 class="subh">' + esc(b[1]) + '</h3>';
      if (b[0] === 'p') return '<p>' + esc(b[1]) + '</p>';
      if (b[0] === 'ul' || b[0] === 'ol') return '<' + b[0] + '>' + b[1].map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</' + b[0] + '>';
      var rows = b[2].length ? b[2].map(function(r){
        var id = String(r[0]);
        return '<tr>' + r.map(function(x, i){ return cellHTML(x, d.id, i === 0); }).join('') + '</tr>' + (openThread === id && IDRE.test(id) ? threadHTML(id, b[1].length) : '');
      }).join('') : '<tr><td colspan="' + b[1].length + '" class="muted">None.</td></tr>';
      return '<div class="tbl"><table><thead><tr>' + b[1].map(function(h){ return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }).join('');
  }
  function diffHTML(d){
    var df = Dm.diff(d.approved.text, d.md), changes = df.filter(function(x){ return x.t !== 'same'; });
    return '<section class="diffp"><h2>Changed since you approved it on ' + when(d.approved.at) + '</h2><p class="muted small" style="margin:0 0 8px">The approved wording is kept until you approve the changes. Removed lines are struck through; new lines are marked.</p><div class="diff">'
      + changes.slice(0, 120).map(function(x){ return '<div class="dl ' + x.t + '"><span class="sr">' + (x.t === 'add' ? 'Added: ' : 'Removed: ') + '</span>' + (x.t === 'del' ? '<s>' + esc(x.s) + '</s>' : esc(x.s)) + '</div>'; }).join('')
      + (changes.length > 120 ? '<p class="muted small">…and ' + (changes.length - 120) + ' more lines.</p>' : '') + '</div></section>';
  }
  function docNav(){
    return '<nav class="docnav" aria-label="Documents"><a href="#/blueprint">Overview</a>' + groups().map(function(g){
      return '<p class="nav-sec">' + esc(g.title) + '</p>' + g.docs.map(function(d){ return '<a href="#/doc/' + esc(d.id) + '"' + (current === d.id ? ' aria-current="page"' : '') + '><span class="dot dot-' + d.state + '" aria-hidden="true"></span>' + esc(d.title) + '<span class="sr">, ' + esc(d.stateLabel) + '</span></a>'; }).join('');
    }).join('') + '</nav>';
  }
  function docView(id, focus){
    regen();
    var d = docs.filter(function(x){ return x.id === id; })[0];
    if (!d) { location.hash = '#/blueprint'; return; }
    current = id;
    var rv = reviewer(), idx = docs.indexOf(d);
    var src = d.scope === 'tool' ? '<a class="link" href="#/tool/' + esc(d.tool) + '">Change the answers behind this document</a>' + (P.tools.filter(function(t){ return t.id === d.tool; })[0].studio && (d.key === 'rules' || d.key === 'inputs') ? ' <a class="link" href="#/tool/' + esc(d.tool) + '/rules">Open the Rules Studio</a>' : '')
      : d.id === 'P-MAP' ? '<a class="link" href="#/connections">Open the journey editor</a>' : d.id === 'P-IDEA' ? '<a class="link" href="#/project">Edit the description and tools</a>' : '';
    var actions = '<div class="bar docact">' + chip(d)
      + (Dm.canApprove(d, 'client') && !rv ? '<button type="button" class="btn tiny" data-dcact="approve">' + (d.state === 'review' ? 'Approve the changes' : 'Approve this document') + '</button>' : '')
      + (rv && Dm.canApprove(d, 'bpc') ? '<button type="button" class="btn tiny" data-dcact="bpc-approve">Approve as BPC</button>' : '')
      + (rv && ['client_approved', 'bpc_review', 'ready'].indexOf(d.state) > -1 ? '<button type="button" class="btn ghost tiny" data-dcact="clarify">Ask for clarification</button>' : '')
      + '<button type="button" class="btn ghost tiny push" data-dcact="md">Download .md</button><button type="button" class="btn ghost tiny" data-dcact="print">Print or save PDF</button></div>';
    var why = d.state === 'draft' ? 'Some needed answers are missing, or sections aren\'t confirmed yet.' : d.state === 'input' ? 'There are open items below. Answer them, or confirm they\'re for the scoping call, before approving.'
      : d.state === 'ready' ? 'Everything it needs is confirmed. Read it through and approve it, or comment on any line.' : d.state === 'client_approved' ? 'Approved by you on ' + when(d.approved.at) + '.'
      : d.state === 'bpc_review' ? 'Approved by you on ' + when(d.approved.at) + '. It includes BPC recommendations, so BPC reviews it next.' : d.state === 'bpc_approved' ? 'Approved by you and by BPC.' : '';
    var html = docNav() + '<div class="docmain"><p class="crumb">Blueprint / ' + esc(d.scope === 'tool' ? d.tool + ' ' + d.toolName : 'Project') + ' / ' + esc(d.id) + '</p>'
      + '<h1 id="doc-h" tabindex="-1">' + esc(d.title) + '</h1>' + reviewerBar() + actions + (why ? '<p class="muted small">' + esc(why) + '</p>' : '')
      + (d.clarify ? '<div class="banner"><strong>BPC asked:</strong> ' + esc(d.clarify.text) + ' <span class="muted small">(' + when(d.clarify.at) + ')</span> <button type="button" class="btn ghost tiny" data-dcact="resolve">Mark as answered</button></div>' : '')
      + (d.state === 'review' && d.approved ? diffHTML(d) : '')
      + (src ? '<p class="small">' + src + '</p>' : '')
      + '<article class="docbody">' + blocksHTML(d) + '</article>'
      + '<nav class="pager" aria-label="Previous and next document">' + (idx > 0 ? '<a href="#/doc/' + esc(docs[idx - 1].id) + '">Previous: ' + esc(docs[idx - 1].title) + '</a>' : '<span></span>') + (idx < docs.length - 1 ? '<a href="#/doc/' + esc(docs[idx + 1].id) + '">Next: ' + esc(docs[idx + 1].title) + '</a>' : '') + '</nav></div>';
    root.innerHTML = '<div class="docwrap">' + html + '</div>';
    if (focus === true) $('#doc-h').focus(); else if (typeof focus === 'string') { var el = root.querySelector(focus); if (el) el.focus(); }
  }

  /* ---------- events ---------- */
  root.addEventListener('click', function(e){
    var b = e.target.closest('[data-dcact]'); if (!b || !P) return;
    var act = b.getAttribute('data-dcact'), d = current && docs.filter(function(x){ return x.id === current; })[0];
    switch (act) {
      case 'md-all': download(slug(P.name) + '-blueprint-v' + P.version + '.md', '# Blueprint: ' + (P.name || 'Untitled') + '\n\nVersion ' + P.version + ', ' + new Date().toLocaleDateString('en-GB') + '\n\n' + docs.map(function(x){ return x.md + '\n\n_State: ' + x.stateLabel + ' (' + x.id + ')_'; }).join('\n\n---\n\n'), 'text/markdown'); return;
      case 'handover': download(slug(P.name) + '-handover-v' + P.version + '.json', JSON.stringify(Dm.handover(P, hooks.ctx), null, 2), 'application/json'); hooks.announce('Developer handover downloaded.'); return;
      case 'md': download(d.id.toLowerCase() + '.md', d.md, 'text/markdown'); return;
      case 'print': window.print(); return;
      case 'approve': Dm.approve(P, d, 'client'); hooks.save(); hooks.changed(); docView(current, '[data-dcact="md"]'); hooks.announce(d.title + ' approved.'); return;
      case 'bpc-approve': Dm.approve(P, d, 'bpc'); hooks.save(); hooks.changed(); docView(current, '[data-dcact="md"]'); hooks.announce(d.title + ' approved by BPC.'); return;
      case 'clarify': var q = window.prompt('What needs clarifying?'); if (!q) return; Dm.requestClarification(P, d, q); hooks.save(); hooks.changed(); docView(current, '[data-dcact="md"]'); return;
      case 'resolve': Dm.resolveClarification(P, current); hooks.save(); hooks.changed(); docView(current, '[data-dcact="md"]'); return;
      case 'thread': var it = b.getAttribute('data-item'); openThread = openThread === it ? null : it; docView(current, openThread ? '#cm-text' : '[data-dcact="thread"][data-item="' + it + '"]'); return;
      case 'comment':
        var tx = $('#cm-text').value.trim(); if (!tx) { $('#cm-text').focus(); return; }
        var item = b.getAttribute('data-item');
        Dm.comment(P, item, current, reviewer() ? 'bpc' : 'client', tx); hooks.save(); hooks.changed(); docView(current, '#cm-text'); hooks.announce('Comment added to ' + item + '.'); return;
    }
  });

  return {
    dashboard: function(project, focus){ P = project; current = null; openThread = null; dashboard(focus); },
    doc: function(project, id, focus){ P = project; if (current !== id) openThread = null; docView(id, focus); }
  };
}
return { create:create };
})();
