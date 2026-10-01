// Blueprint Builder app shell. Depends on Engine, Discovery, Project, DiscoveryUI, StudioUI and the embedded data.
(function(){
'use strict';
var DATA = JSON.parse(document.getElementById('app-data').textContent);
var CATS = DATA.categories, SIGNALS = DATA.signals || [], MODULES = DATA.modules, SAMPLE = DATA.sample;
var KEY = 'bpc-builder:project:1';
var P = null, renaming = null, saveTimer = null;

function $(s){ return document.querySelector(s); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function when(iso){ var d = new Date(iso); return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }); }
function announce(t){ var l = $('#app-live'); l.textContent = ''; setTimeout(function(){ l.textContent = t; }, 30); }
function cat(id){ return CATS.filter(function(c){ return c.id === id; })[0]; }
function tool(id){ return P.tools.filter(function(t){ return t.id === id; })[0]; }
function cfgOf(t){ return MODULES[t.module]; }

/* ---------- persistence ----------
   Always on this device (localStorage). When signed in, the project is also kept in the client's
   account: BIND = { id, rev, sent } names the account copy, and every save is pushed to it
   (Server.save, with the rev the server last gave us; a 409 means it changed somewhere else).
   A BPC review session (opened from the CMS) edits one account project and nothing is written
   to this device, so a reviewer's own local project is left alone. */
var BKEY = 'bpc-builder:server:1';
var ACC = { client:null, review:null }, BIND = null, localOk = true;
var sync = { timer:null, busy:null, again:false, conflict:false, error:null, at:null, creating:false };
function reviewing(){ return !!ACC.review; }
function signedIn(){ return !!ACC.client && !reviewing(); }
function hasContent(p){ return !!(p.description || p.tools.length || p.name); }
function readBind(){ try { var b = JSON.parse(localStorage.getItem(BKEY) || 'null'); return b && b.id ? b : null; } catch (e) { return null; } }
function writeBind(){ if (reviewing()) return; try { if (BIND) localStorage.setItem(BKEY, JSON.stringify(BIND)); else localStorage.removeItem(BKEY); } catch (e) {} }
function load(){
  try { var raw = localStorage.getItem(KEY); if (raw) return Project.deserialise(raw, MODULES); } catch (e) { console.warn(e); }
  return Project.newProject();
}
function saveLocal(){
  if (reviewing()) return;
  try { localStorage.setItem(KEY, JSON.stringify(P)); localOk = true; } catch (e) { localOk = false; }
}
function status(){
  var el = $('#app-saved'), t;
  if (reviewing()) t = sync.error ? 'Not saved: ' + sync.error : (sync.busy || sync.timer) ? 'Saving…' : sync.at ? 'BPC review saved ' + when(sync.at) : 'BPC review';
  else if (BIND && signedIn()) t = sync.conflict ? 'Changed somewhere else' : sync.error ? "Couldn't save to your account. Saved on this device." : (sync.busy || sync.timer || sync.creating) ? 'Saving…' : 'Saved to your account ' + when(sync.at || P.updated);
  else t = localOk ? 'Saved on this device ' + when(P.updated) : "Couldn't save on this device. Use Save file.";
  el.textContent = t;
}
function saveNow(){
  P.updated = new Date().toISOString();
  saveLocal();
  if (BIND && (signedIn() || reviewing())) { clearTimeout(sync.timer); sync.timer = setTimeout(pushNow, 1200); }
  else if (signedIn() && hasContent(P)) createNow();
  status();
}
function save(){ clearTimeout(saveTimer); saveTimer = setTimeout(function(){ saveTimer = null; saveNow(); }, 250); $('#app-saved').textContent = 'Saving…'; }
function flush(){ if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; saveNow(); } }
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'hidden') { flush(); if (sync.timer) pushNow(); } });

/** Put the project in the signed-in client's account. */
function createNow(){
  if (sync.creating || BIND || !signedIn()) return Promise.resolve(!!BIND);
  sync.creating = true; status();
  return Server.create(P).then(function(r){
    if (P.id !== r.id) { P.id = r.id; saveLocal(); }
    BIND = { id:r.id, rev:r.rev, sent:r.submittedAt }; writeBind(); sync.error = null; sync.at = r.updatedAt;
    return true;
  }, function(e){ sync.error = e.message; if (e.status === 401) signedOut(); else banner(esc(e.message), 'warn'); return false; })
  .then(function(ok){ sync.creating = false; status(); if (!$('#v-acct').hidden) renderAccount(); return ok; });
}
/** Push the current project to its account copy now. Resolves true once the server has it. */
function pushNow(){
  clearTimeout(sync.timer); sync.timer = null;
  if (!BIND || sync.conflict) return Promise.resolve(false);
  if (sync.busy) { sync.again = true; return sync.busy; }
  var sent = JSON.stringify(P);
  sync.busy = Server.save(BIND.id, BIND.rev, JSON.parse(sent)).then(function(r){
    BIND.rev = r.rev; writeBind(); sync.error = null; sync.at = r.updatedAt;
    // The server keeps the other side's parts (BPC's approvals and comments for a client, the
    // client's work for a reviewer). Take those back without re-rendering the page being edited.
    var mine = JSON.parse(sent);
    if (JSON.stringify([r.project.reviews, r.project.comments]) !== JSON.stringify([mine.reviews || {}, mine.comments || {}])) {
      P.reviews = r.project.reviews; P.comments = r.project.comments; saveLocal();
      if (/^#\/(blueprint|doc\/)/.test(location.hash)) route(false);
    }
    return true;
  }, function(e){
    if (e.status === 409) {
      sync.conflict = true;
      banner('This project was changed somewhere else (another tab, device or BPC). <button type="button" class="btn tiny" data-pact="reload-server">Load the latest version</button> <span class="muted small">Use Save file first if you want to keep what is on this screen.</span>', 'warn');
    } else if (e.status === 401 || e.status === 404) { sync.error = e.message; if (!reviewing()) signedOut(); }
    else sync.error = e.message;
    return false;
  }).then(function(ok){
    sync.busy = null; status();
    if (sync.again) { sync.again = false; return pushNow(); }
    return ok;
  });
  status();
  return sync.busy;
}
function adoptServer(r){
  P = Project.deserialise(JSON.stringify(r.project), MODULES);
  BIND = { id:r.id, rev:r.rev, sent:r.submittedAt }; writeBind();
  sync.conflict = false; sync.error = null; sync.at = r.updatedAt;
  saveLocal(); $('#app-name').value = P.name || ''; status();
}
function signedOut(){
  ACC.client = null; BIND = null; writeBind(); renderAccountBar();
  banner('You are signed out. Your work is still on this device. <a href="#/projects">Sign in again</a> to keep saving it to your account.', 'warn');
}

/* ---------- banner ---------- */
function banner(html, kind){
  var b = $('#app-banner');
  if (!html) { b.hidden = true; b.innerHTML = ''; return; }
  b.className = 'banner' + (kind === 'ok' ? ' ok' : '');
  b.innerHTML = '<span>' + html + '</span> <button type="button" class="link" data-pact="banner-close">Dismiss</button>';
  b.hidden = false;
}

/* ---------- components ---------- */
var discovery = DiscoveryUI.create($('#disc-root'), {
  save: save, announce: announce,
  changed: function(){
    var t = tool(currentTool); if (!t) return;
    P.version = (P.version || 1) + 1;
    if (t.studio) {
      var r = Project.syncSuggestedRules(t, cfgOf(t));
      var bits = [];
      if (r.added.length) bits.push(r.added.length + ' rule' + (r.added.length > 1 ? 's' : '') + ' suggested in the Rules Studio');
      if (r.removed.length) bits.push(r.removed.length + ' suggested rule' + (r.removed.length > 1 ? 's' : '') + ' withdrawn');
      if (r.stale.length) bits.push(r.stale.length + (r.stale.length > 1 ? ' approved rules no longer match' : ' approved rule no longer matches') + ' your answers');
      if (bits.length) announce(bits.join('. ') + '.');
    }
    renderToolHead();
  },
  openRules: function(id){ location.hash = '#/tool/' + id + '/rules'; }
});
var studio = StudioUI.create($('#studio-root'), { save: save, announce: announce }, SAMPLE);
var CTX = { modules: MODULES, categories: CATS, signals: SIGNALS, implied: function(p){ return Project.impliedAcrossTools(p, MODULES, CATS); } };
var documents = DocumentsUI.create($('#bp-root'), { save: save, announce: announce, ctx: CTX, reviewer: reviewing, changed: function(){ P.version = (P.version || 1) + 1; } });
var connections = ConnectionsUI.create($('#cx-root'), { save: save, announce: announce, modules: MODULES, changed: function(){ P.version = (P.version || 1) + 1; } });

/* ---------- routing ---------- */
var currentTool = null;
function route(focus){
  var h = location.hash || '#/project';
  var sm = /^#\/start\?desc=([^&]*)/.exec(h);
  if (sm) { startFrom(sm[1]); return; }
  if (h === '#/projects') {
    currentTool = null;
    $('#v-project').hidden = true; $('#v-tool').hidden = true; $('#v-cx').hidden = true; $('#v-bp').hidden = true; $('#v-acct').hidden = false;
    renderAccount(focus ? '#acct-h' : null);
    document.title = (signedIn() ? 'My projects' : 'Sign in') + ' | Blueprint Builder';
    if (focus) window.scrollTo(0, 0);
    return;
  }
  $('#v-acct').hidden = true;
  var dm = /^#\/(blueprint|doc\/([A-Za-z0-9_.-]+))$/.exec(h);
  if (dm) {
    currentTool = null;
    $('#v-project').hidden = true; $('#v-tool').hidden = true; $('#v-cx').hidden = true; $('#v-bp').hidden = false;
    if (dm[2]) documents.doc(P, dm[2], focus); else documents.dashboard(P, focus);
    document.title = (dm[2] || 'Blueprint') + ' | Blueprint Builder';
    if (focus) window.scrollTo(0, 0);
    return;
  }
  $('#v-bp').hidden = true;
  if (h === '#/connections') {
    if (P.tools.length < 2) { location.hash = '#/project'; return; }
    currentTool = null;
    $('#v-project').hidden = true; $('#v-tool').hidden = true; $('#v-cx').hidden = false;
    connections.show(P, focus);
    document.title = 'Connecting tools | Blueprint Builder';
    if (focus) window.scrollTo(0, 0);
    return;
  }
  $('#v-cx').hidden = true;
  var m = /^#\/tool\/(T-\d+)(?:\/(rules))?$/.exec(h);
  if (m && tool(m[1])) {
    currentTool = m[1];
    var t = tool(currentTool), tab = m[2] === 'rules' && t.studio ? 'rules' : 'discovery';
    $('#v-project').hidden = true; $('#v-tool').hidden = false;
    renderToolHead(tab);
    $('#disc-root').hidden = tab !== 'discovery'; $('#studio-root').hidden = tab !== 'rules';
    if (tab === 'rules') { Project.syncSuggestedRules(t, cfgOf(t)); studio.show(t); }
    else discovery.show(t, cfgOf(t), false);
    document.title = t.name + ' | Blueprint Builder';
    if (focus) { var hh = $('#tool-h'); if (hh) hh.focus(); window.scrollTo(0, 0); }
  } else {
    currentTool = null;
    $('#v-tool').hidden = true; $('#v-project').hidden = false;
    renderProject();
    document.title = (P.name || 'New project') + ' | Blueprint Builder';
    if (focus) { var ph = $('#proj-h'); if (ph) ph.focus(); window.scrollTo(0, 0); }
  }
}
window.addEventListener('hashchange', function(){ route(true); });

/* ---------- hand-off from the Process Blueprinter ----------
   /builder#/start?desc=... opens a project whose description is the process the visitor just
   mapped, with tool suggestions already made. An existing project is never replaced silently. */
function startFrom(raw){
  var desc = '';
  try { desc = decodeURIComponent(raw).trim().slice(0, 2000); } catch (e) {}
  history.replaceState(null, '', location.pathname + location.search + '#/project');
  if (!desc || reviewing()) { route(true); return; }
  if (hasContent(P) && P.description !== desc) {
    if (!confirm('Start a new project from the process you just mapped? ' + (BIND ? 'Your current project stays in your account.' : 'The current project on this device is replaced; use Save file first to keep it.'))) { route(true); return; }
    flush(); if (BIND) pushNow();
    P = Project.newProject(); BIND = null; writeBind(); $('#app-name').value = '';
  }
  P.description = desc;
  P.suggestions = { text:desc, at:new Date().toISOString(), items:Project.suggestTools(CATS, desc), signals:Project.detectSignals(SIGNALS, desc), unmatched:Project.unmatchedParts(CATS, SIGNALS, desc) };
  Project.logEvent(P, 'description', 'Started from the Process Blueprinter');
  saveNow(); route(true);
  announce('Your process is in. ' + (P.suggestions.items.length ? P.suggestions.items.length + ' tool types suggested.' : 'Add tools below.'));
}

/* ---------- tool header ---------- */
function renderToolHead(tab){
  var t = tool(currentTool); if (!t) return;
  tab = tab || ($('#studio-root').hidden ? 'discovery' : 'rules');
  var s = Project.toolSummary(t, MODULES), c = cat(t.category);
  $('#tool-head').innerHTML = '<a class="link" href="#/project">Back to the project</a>'
    + '<div class="th-row"><span class="tid">' + esc(t.id) + '</span><h1 id="tool-h" tabindex="-1">' + esc(t.name) + '</h1><span class="chip">' + esc(c ? c.name : t.category) + '</span>'
    + '<span class="muted small">' + s.counts.answered + ' of ' + s.counts.total + ' answered, ' + s.confirmedSections + ' of ' + s.sections.length + ' sections confirmed</span></div>'
    + '<nav class="apptabs" aria-label="Tool views"><a href="#/tool/' + t.id + '"' + (tab === 'discovery' ? ' aria-current="page"' : '') + '>Discovery</a>'
    + (t.studio ? '<a href="#/tool/' + t.id + '/rules"' + (tab === 'rules' ? ' aria-current="page"' : '') + '>Rules Studio' + (s.rules.suggested ? ' <span class="cnt">' + s.rules.suggested + ' suggested</span>' : '') + '</a>' : '')
    + '</nav>';
}

/* ---------- project view ---------- */
function sourceText(t){
  if (t.source.type === 'suggested') return 'Suggested from your description';
  if (t.source.type === 'implied') return 'Suggested by ' + esc(t.source.from) + (t.source.reason ? ': ' + esc(t.source.reason) : '');
  return 'Added by you';
}
function toolCard(t){
  var s = Project.toolSummary(t, MODULES), c = cat(t.category), pct = s.counts.total ? Math.round(s.counts.answered / s.counts.total * 100) : 0;
  var d = { ready:0, input:0, draft:0, review:0 }; s.docs.forEach(function(x){ d[x.key]++; });
  var name = renaming === t.id
    ? '<span class="rn"><label class="sr" for="rn-' + t.id + '">New name for ' + t.id + '</label><input type="text" id="rn-' + t.id + '" value="' + esc(t.name) + '"><button type="button" class="btn tiny" data-pact="rename-save" data-id="' + t.id + '">Save</button><button type="button" class="link" data-pact="rename-cancel">Cancel</button></span>'
    : '<h3>' + esc(t.name) + '</h3>';
  return '<article class="tcard" id="card-' + t.id + '"><div class="tc-h"><span class="tid">' + t.id + '</span>' + name + '</div>'
    + '<p class="tc-cat"><span class="chip">' + esc(c ? c.name : t.category) + '</span> <span class="muted small">' + (s.depth === 'full' ? 'Detailed discovery' : 'Guided intake') + '</span></p>'
    + '<p class="muted small tc-src">' + sourceText(t) + '</p>'
    + '<div class="meter" role="img" aria-label="' + pct + '% answered"><span style="width:' + pct + '%"></span></div>'
    + '<p class="small tc-prog">' + s.counts.answered + ' of ' + s.counts.total + ' answered, ' + s.confirmedSections + ' of ' + s.sections.length + ' sections confirmed</p>'
    + '<p class="tc-docs">' + (d.review ? '<span class="ds review">' + d.review + ' need review</span>' : '') + (d.input ? '<span class="ds input">' + d.input + ' need input</span>' : '')
      + (d.ready ? '<span class="ds ready">' + d.ready + ' ready</span>' : '') + (d.draft ? '<span class="ds draft">' + d.draft + ' draft</span>' : '')
      + (s.rules.suggested ? '<span class="ds input">' + s.rules.suggested + ' rule' + (s.rules.suggested > 1 ? 's' : '') + ' to review</span>' : '') + (s.rules.stale ? '<span class="ds review">' + s.rules.stale + ' rule' + (s.rules.stale > 1 ? 's' : '') + ' out of date</span>' : '') + '</p>'
    + '<div class="tc-act"><a class="btn tiny" href="#/tool/' + t.id + '">Open</a>' + (t.studio ? '<a class="btn ghost tiny" href="#/tool/' + t.id + '/rules">Rules Studio</a>' : '')
    + '<button type="button" class="link" data-pact="rename" data-id="' + t.id + '">Rename</button><button type="button" class="link push" data-pact="remove" data-id="' + t.id + '">Remove</button></div></article>';
}
function suggestionsHTML(){
  var sg = P.suggestions;
  if (!sg) return '';
  if (!sg.items.length) return '<p class="banner">No clear matches in that description. Add more detail, or choose tools yourself below.</p>' + signalsHTML(sg);
  return '<p class="muted small" style="margin:16px 0 8px">Suggested from what you wrote. These are suggestions, not decisions: keep what fits.</p><div class="sgrid">' + sg.items.map(function(s){
    var existing = P.tools.filter(function(t){ return t.category === s.category; });
    return '<article class="scard"><div class="tc-h"><h3>' + esc(s.name) + '</h3><span class="chip conf-' + s.confidence + '">' + esc(s.confidence) + '</span></div>'
      + '<p class="muted small" style="margin:0 0 6px">' + esc(s.summary) + '</p>'
      + '<p class="small" style="margin:0 0 4px">Because ' + esc(s.reasons.join('; ')) + '.</p>'
      + '<p class="phr">' + s.phrases.map(function(p){ return '<span class="ph">“' + esc(p) + '”</span>'; }).join('') + '</p>'
      + '<div class="tc-act">' + (existing.length ? '<span class="muted small">Added as ' + existing.map(function(t){ return t.id; }).join(', ') + '</span><button type="button" class="link" data-pact="add-sugg" data-cat="' + s.category + '">Add another</button>'
        : '<button type="button" class="btn tiny" data-pact="add-sugg" data-cat="' + s.category + '">Add this tool</button>') + '</div></article>';
  }).join('') + '</div>' + signalsHTML(sg);
}
function unmatchedHTML(sg){
  if (!sg.unmatched || !sg.unmatched.length) return '';
  return '<section class="unmatched" aria-labelledby="um-h"><h3 id="um-h">Not matched to a tool yet</h3><p class="muted small" style="margin:0 0 8px">We couldn\'t link these parts of your description to a tool. Add a tool yourself below (Custom tool if nothing fits), or rephrase with more detail.</p><ul>'
    + sg.unmatched.map(function(x){ return '<li>“' + esc(x) + '”</li>'; }).join('') + '</ul></section>';
}
function signalsHTML(sg){
  if (!sg.signals || !sg.signals.length) return unmatchedHTML(sg);
  return '<section class="signals" aria-labelledby="sig-h"><h3 id="sig-h">We also noticed</h3><p class="muted small" style="margin:0 0 8px">These don\'t add tools, but they change what each tool needs. We\'ll carry them into production scope.</p><ul>'
    + sg.signals.map(function(x){ return '<li><strong>' + esc(x.title) + '</strong> <span class="phr" style="display:inline-flex">' + x.phrases.map(function(p){ return '<span class="ph">“' + esc(p) + '”</span>'; }).join('') + '</span><br><span class="muted small">' + esc(x.note) + '</span></li>'; }).join('')
    + '</ul></section>' + unmatchedHTML(sg);
}
function impliedHTML(){
  var imp = Project.impliedAcrossTools(P, MODULES, CATS);
  if (!imp.length) return '';
  return '<section class="psec" aria-labelledby="imp-h"><h2 id="imp-h">Your answers suggest you may also need</h2><div class="sgrid">' + imp.map(function(i){
    return '<article class="scard implied"><h3>' + esc(i.name) + '</h3><p class="muted small" style="margin:0 0 6px">' + esc(i.summary) + '</p><ul class="because">'
      + i.because.map(function(b){ return '<li><a href="#/tool/' + b.tool + '">' + esc(b.tool + ' ' + b.toolName) + '</a>, ' + esc(b.question) + ': ' + esc(b.reason) + '</li>'; }).join('')
      + '</ul><div class="tc-act"><button type="button" class="btn tiny" data-pact="add-implied" data-cat="' + i.category + '" data-from="' + esc(i.because[0].tool + ' ' + i.because[0].question) + '" data-reason="' + esc(i.because[0].reason) + '">Add this tool</button>'
      + '<button type="button" class="link" data-pact="dismiss" data-keys="' + esc(i.because.map(function(b){ return b.key; }).join('|')) + '">Not needed</button></div></article>';
  }).join('') + '</div></section>';
}
function renderProject(focusSel){
  var st = Project.projectStatus(P, MODULES), hist = Project.projectHistory(P).slice(0, 8);
  var main = '<h1 id="proj-h" tabindex="-1">' + esc(P.name || 'New project') + '</h1>'
    + '<section class="psec" aria-labelledby="desc-h"><h2 id="desc-h">What do you want to solve?</h2>'
    + '<p class="muted" style="margin:0 0 10px;max-width:64ch">Describe the problem in your own words: who your customers are, what they struggle with, and what should happen instead. No need to know our categories.</p>'
    + '<label class="sr" for="app-desc">Problem description</label><textarea id="app-desc" rows="5" placeholder="For example: customers plan a cinema room, but don\'t know which projector and screen size suit it. Trade buyers need a quote for the whole package.">' + esc(P.description) + '</textarea>'
    + '<div class="bar" style="margin-top:10px"><button type="button" class="btn" data-pact="suggest">Suggest tools</button><span class="muted small">Suggestions come from the words you use and need your confirmation.</span><button type="button" class="link push" data-pact="demo">Load the cinema demo project</button></div>'
    + '<div id="app-sugg">' + suggestionsHTML() + '</div></section>';
  main += '<section class="psec" aria-labelledby="tools-h"><h2 id="tools-h">Tools in this project (' + P.tools.length + ')</h2>'
    + (P.tools.length ? '<div class="tgrid">' + P.tools.map(toolCard).join('') + '</div>' : '<p class="muted">No tools yet. Add one from the suggestions, or choose below.</p>')
    + '<div class="addown"><span class="lbl">Add a tool yourself</span><label class="sr" for="app-cat">Tool type</label><select id="app-cat">' + CATS.map(function(c){ return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select>'
    + '<label class="sr" for="app-newname">Name (optional)</label><input type="text" id="app-newname" placeholder="Name, e.g. Screen Finder"><button type="button" class="btn ghost tiny" data-pact="add-own">Add</button></div></section>';
  main += impliedHTML();
  if (P.tools.length > 1) {
    var cs = st.connections;
    main += '<section class="psec" aria-labelledby="cx-sec-h"><h2 id="cx-sec-h">Connecting tools</h2><p class="muted" style="margin:0 0 10px;max-width:64ch">How your ' + P.tools.length + ' tools work together: where customers start, what passes between tools, what recalculates when an earlier answer changes, and where the journey ends.</p>'
      + '<p style="margin:0 0 10px"><span class="ds ' + cs.state.key + '">' + esc(cs.state.label) + '</span> <span class="muted small">' + cs.links + ' connection' + (cs.links === 1 ? '' : 's') + (cs.issues ? ', ' + cs.issues + ' thing' + (cs.issues > 1 ? 's' : '') + ' to settle' : '') + '</span></p>'
      + '<a class="btn tiny" href="#/connections">Open the journey editor</a></section>';
  }

  var docs = st.docs;
  var ds = Documents.summary(P, CTX);
  var bpCard = '<section class="pcard"><h2>Blueprint</h2><p class="small" style="margin:0 0 8px">' + ds.total + ' documents: ' + ds.approved + ' approved, ' + ds.ready + ' ready for review, ' + ds.needsInput + ' need input, ' + ds.needsReview + ' need review.</p><a class="btn tiny" href="#/blueprint">Open the blueprint</a></section>';
  var rail = '<section class="pcard next"><h2>Next</h2><p style="margin:0 0 10px">' + esc(st.next.text) + '.</p><button type="button" class="btn tiny" data-pact="next" data-target="' + esc(st.next.target) + '">Go</button></section>'
    + bpCard + sendCard() + '<section class="pcard"><h2>Status</h2><dl class="counts"><div><dt>Tools</dt><dd>' + P.tools.length + '</dd></div><div><dt>Docs ready</dt><dd>' + docs.ready + '</dd></div>'
    + '<div><dt>Need review</dt><dd>' + docs.review + '</dd></div><div><dt>Need input</dt><dd>' + docs.input + '</dd></div><div><dt>Unknowns</dt><dd>' + st.unknown + '</dd></div><div><dt>BPC advice</dt><dd>' + st.bpc + '</dd></div></dl>'
    + '<p class="muted small" style="margin:8px 0 0">' + docs.draft + ' document' + (docs.draft === 1 ? '' : 's') + ' still in draft. "Ready" means confirmed with no open questions, not just written.</p></section>'
    + (st.review.length ? '<section class="pcard"><h2>Needs review</h2><ul class="plist">' + st.review.map(function(r){ return '<li><a href="' + (r.tool === 'connections' ? '#/connections' : '#/tool/' + r.tool) + '">' + esc(r.tool === 'connections' ? 'Connections' : r.tool) + '</a> ' + esc(r.title) + '</li>'; }).join('') + '</ul></section>' : '')
    + '<section class="pcard"><h2>Recent changes</h2>' + (hist.length ? '<ul class="hist">' + hist.map(function(h){ return '<li><span class="when">' + when(h.at) + (h.tool ? ', ' + esc(h.tool) : '') + '</span>' + esc(h.text) + '</li>'; }).join('') + '</ul>' : '') + '<p class="muted small" style="margin:8px 0 0">Version ' + P.version + '</p></section>';
  $('#v-project').innerHTML = '<div class="pgrid"><div class="pmain">' + main + '</div><aside class="prail" aria-label="Project status">' + rail + '</aside></div>';
  if (focusSel) { var el = $(focusSel); if (el) el.focus(); }
}

/* ---------- account and sending ---------- */
function sendCard(){
  if (reviewing() || !P.tools.length) return '';
  var last = BIND && BIND.sent ? '<p class="muted small" style="margin:8px 0 0">Last sent ' + when(BIND.sent) + '. Send again after important changes.</p>' : '';
  return '<section class="pcard"><h2>Send to Blueprint Code</h2><p class="small" style="margin:0 0 8px">' + (signedIn() ? 'We receive the full blueprint and developer handover, and you get a copy by email.' : 'Sign in with your email first. We email you a link; there is no password.') + '</p>'
    + '<button type="button" class="btn tiny" data-pact="send">' + (signedIn() ? 'Send the blueprint' : 'Sign in to send') + '</button>' + last + '</section>';
}
function renderAccountBar(){
  var a = $('#app-account'), h = '';
  if (reviewing()) h = '<span class="chip">BPC review: ' + esc(ACC.review.email) + '</span><button type="button" class="btn ghost tiny" data-pact="end-review">End review</button>';
  else if (ACC.client) h = '<a class="link" href="#/projects">My projects</a><span class="muted small acct-email">' + esc(ACC.client.email) + '</span><button type="button" class="link" data-pact="sign-out">Sign out</button>';
  else if (Server.available) h = '<a class="btn tiny" href="#/projects">Sign in to save and send</a>';
  a.innerHTML = h;
  ['new', 'open-file'].forEach(function(k){ var b = document.querySelector('.top [data-pact="' + k + '"]'); if (b) b.hidden = reviewing(); });
}
var sentTo = null;
function renderAccount(focusSel){
  var v = $('#v-acct');
  if (reviewing()) { location.hash = '#/blueprint'; return; }
  if (!signedIn()) {
    v.innerHTML = '<div class="acct"><h1 id="acct-h" tabindex="-1">Save and send your blueprint</h1>'
      + '<p style="max-width:60ch">Sign in with your email to keep your projects in your account, carry on from any device, and send the finished blueprint to Blueprint Code. There is no password: we email you a sign-in link.</p>'
      + (sentTo ? '<p class="banner ok" role="status">Check your inbox. We sent a sign-in link to <strong>' + esc(sentTo) + '</strong>. It works once, for 15 minutes.</p>' : '')
      + '<form id="acct-form" class="acct-form" novalidate><label for="acct-email">Email</label><input type="email" id="acct-email" autocomplete="email" required placeholder="you@company.com">'
      + '<button type="submit" class="btn">Email me a sign-in link</button></form><p class="muted small" id="acct-err" role="alert"></p>'
      + '<p class="muted small" style="max-width:60ch">We use your email to sign you in and to reply about your blueprint, nothing else. Until you sign in, your work stays on this device only.</p>'
      + (Server.available ? '' : '<p class="banner">Open Blueprint Builder from blueprintcode.ai/builder to sign in.</p>') + '</div>';
    var f = focusSel && $(focusSel); if (f) f.focus();
    return;
  }
  v.innerHTML = '<div class="acct"><h1 id="acct-h" tabindex="-1">My projects</h1><p class="muted" id="acct-list">Loading your projects…</p></div>';
  var f2 = focusSel && $(focusSel); if (f2) f2.focus();
  Server.list().then(function(r){
    var list = r.projects, here = BIND ? BIND.id : null;
    var html = (!BIND && hasContent(P) ? '<section class="pcard next" style="margin:0 0 18px"><h2>Not in your account yet</h2><p class="small" style="margin:0 0 8px">"' + esc(P.name || 'Untitled project') + '" is only on this device.</p><button type="button" class="btn tiny" data-pact="upload">Save it to my account</button></section>' : '')
      + (list.length ? '<ul class="acct-list">' + list.map(function(x){
        return '<li><div><strong>' + esc(x.name || 'Untitled project') + '</strong> <span class="tid">' + esc(x.id) + '</span>' + (x.id === here ? ' <span class="chip">open now</span>' : '') + (x.submittedAt ? ' <span class="ds ready">sent ' + when(x.submittedAt) + '</span>' : '')
          + '<br><span class="muted small">Changed ' + when(x.updatedAt) + '</span></div><div class="bar">' + (x.id === here ? '<a class="btn tiny" href="#/project">Continue</a>' : '<button type="button" class="btn tiny" data-pact="open-project" data-id="' + esc(x.id) + '">Open</button>')
          + '<button type="button" class="link" data-pact="delete-project" data-id="' + esc(x.id) + '" data-name="' + esc(x.name || 'Untitled project') + '">Delete</button></div></li>';
      }).join('') + '</ul>' : '<p class="muted">No projects in your account yet.</p>')
      + '<div class="bar" style="margin:14px 0 30px"><button type="button" class="btn ghost tiny" data-pact="new">Start a new project</button></div>'
      + '<section class="psec"><h2>Account</h2><p class="small">Signed in as <strong>' + esc(ACC.client.email) + '</strong>.</p><div class="bar"><button type="button" class="link" data-pact="sign-out">Sign out</button><button type="button" class="link" data-pact="delete-account" data-n="' + list.length + '">Delete my account and projects</button></div></section>';
    var el = $('#acct-list'); if (el) el.outerHTML = '<div id="acct-list">' + html + '</div>';
  }, function(e){ if (e.status === 401) { signedOut(); renderAccount(); } else { var el = $('#acct-list'); if (el) el.textContent = e.message; } });
}
function send(){
  if (reviewing()) return;
  if (!signedIn()) { location.hash = '#/projects'; announce('Sign in to send your blueprint.'); return; }
  Array.prototype.forEach.call(document.querySelectorAll('[data-pact="send"]'), function(b){ b.disabled = true; b.textContent = 'Sending…'; });
  flush();
  (BIND ? pushNow() : createNow()).then(function(ok){
    if (!ok || !BIND) throw new Error(sync.conflict ? 'Load the latest version first, then send.' : (sync.error || "Couldn't save the project to your account."));
    return Server.submit(BIND.id, BIND.rev);
  }).then(function(r){
    BIND.sent = r.submittedAt; writeBind();
    if (r.sent) banner('Sent to Blueprint Code. ' + (r.copySent ? 'We have emailed you a copy.' : 'Your copy by email did not go through, but we have it.') + ' We will reply by email.', 'ok');
    else banner('Your blueprint is saved in your account, but our notification email did not go through. We will still see it; you can also email <a href="mailto:hello@blueprintcode.ai">hello@blueprintcode.ai</a>.', 'warn');
    announce(r.sent ? 'Blueprint sent.' : 'Blueprint saved but not emailed.');
  }).catch(function(e){ banner(esc(e.message), 'warn'); announce(e.message); })
  .then(function(){ if (location.hash === '#/project' || !location.hash) renderProject(); });
}
function startReview(){
  var id = ACC.review.projectId;
  BIND = { id:id, rev:0 };
  $('#app-saved').textContent = 'Loading the project…';
  return Server.load(id).then(function(r){
    P = Project.deserialise(JSON.stringify(r.project), MODULES);
    BIND.rev = r.rev; sync.at = r.updatedAt;
    $('#app-name').value = P.name || ''; $('#app-name').readOnly = true;
    banner('BPC review of <strong>' + esc(P.name || id) + '</strong> for ' + esc(r.clientEmail || 'the client') + '. Only your approvals, clarification requests and BPC comments are saved; other edits are discarded.', 'ok');
    if (!/^#\/(blueprint|doc\/|tool\/|connections)/.test(location.hash)) location.hash = '#/blueprint'; else route(true);
    status();
  }, function(e){ banner('This review no longer opens the project (' + esc(e.message) + '). Open it again from the CMS.', 'warn'); });
}
function startClient(){
  BIND = readBind();
  if (!BIND) { if (hasContent(P) && location.hash !== '#/projects') createNow(); return Promise.resolve(); }
  return Server.load(BIND.id).then(function(r){
    if (r.rev === BIND.rev && P.id === BIND.id) { BIND.sent = r.submittedAt; writeBind(); pushNow(); }  // this device is up to date, maybe newer
    else adoptServer(r);
  }, function(e){ if (e.status === 404) { BIND = null; writeBind(); } else sync.error = e.message; status(); });
}

/* ---------- project events ---------- */
var descBefore = null;
document.addEventListener('focusin', function(e){ if (e.target.id === 'app-desc') descBefore = P.description; });
document.addEventListener('input', function(e){
  if (e.target.id === 'app-desc') { P.description = e.target.value; save(); }
  if (e.target.id === 'app-name') { P.name = e.target.value; save(); }
});
document.addEventListener('change', function(e){
  if (e.target.id === 'app-desc' && descBefore !== null && descBefore !== P.description) { Project.logEvent(P, 'description', 'Problem description edited'); descBefore = P.description; save(); }
  if (e.target.id === 'app-name') { Project.logEvent(P, 'renamed', 'Project named ' + (P.name || '(blank)')); save(); var ph = document.getElementById('proj-h'); if (ph) ph.textContent = P.name || 'New project'; document.title = (P.name || 'New project') + ' | Blueprint Builder'; }
  if (e.target.id === 'app-file' && e.target.files && e.target.files[0]) {
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var np = Project.deserialise(fr.result, MODULES);
        if (reviewing()) return;
        if (!confirm('Open "' + (np.name || 'Untitled project') + '"? It replaces the project on this device.')) return;
        P = np; BIND = null; writeBind(); saveNow(); $('#app-name').value = P.name || ''; location.hash = '#/project'; route(true); announce('Project opened.');
      } catch (err) { alert(err.message); }
      e.target.value = '';
    };
    fr.readAsText(e.target.files[0]);
  }
});
document.addEventListener('submit', function(e){
  if (e.target.id !== 'acct-form') return;
  e.preventDefault();
  var inp = $('#acct-email'), btn = e.target.querySelector('button'), err = $('#acct-err'), email = inp.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Enter a valid email address.'; inp.focus(); return; }
  btn.disabled = true; btn.textContent = 'Sending…'; err.textContent = '';
  flush();
  Server.requestLink(email).then(function(){ sentTo = email; renderAccount('#acct-h'); announce('Sign-in link sent to ' + email + '.'); },
    function(x){ btn.disabled = false; btn.textContent = 'Email me a sign-in link'; err.textContent = x.message; });
});
document.addEventListener('click', function(e){
  var b = e.target.closest('[data-pact]'); if (!b) return;
  var act = b.getAttribute('data-pact'), id = b.getAttribute('data-id'), t;
  switch (act) {
    case 'suggest':
      P.description = $('#app-desc').value;
      P.suggestions = { text:P.description, at:new Date().toISOString(), items:Project.suggestTools(CATS, P.description), signals:Project.detectSignals(SIGNALS, P.description), unmatched:Project.unmatchedParts(CATS, SIGNALS, P.description) };
      save(); $('#app-sugg').innerHTML = suggestionsHTML();
      announce(P.suggestions.items.length ? P.suggestions.items.length + ' tool types suggested.' : 'No clear matches.');
      var first = $('#app-sugg .scard .btn'); if (first) first.focus();
      return;
    case 'add-sugg':
      t = Project.addTool(P, CATS, MODULES, { category:b.getAttribute('data-cat'), source:'suggested', reason:'From the project description' });
      save(); renderProject('#card-' + t.id + ' .btn'); announce(t.name + ' added as ' + t.id + '.'); return;
    case 'add-implied':
      t = Project.addTool(P, CATS, MODULES, { category:b.getAttribute('data-cat'), source:'implied', from:b.getAttribute('data-from'), reason:b.getAttribute('data-reason') });
      save(); renderProject('#card-' + t.id + ' .btn'); announce(t.name + ' added as ' + t.id + '.'); return;
    case 'dismiss':
      Project.dismissImplied(P, b.getAttribute('data-keys').split('|')); save(); renderProject('#tools-h'); announce('Suggestion dismissed.'); return;
    case 'add-own':
      t = Project.addTool(P, CATS, MODULES, { category:$('#app-cat').value, name:$('#app-newname').value, source:'client' });
      save(); renderProject('#card-' + t.id + ' .btn'); announce(t.name + ' added as ' + t.id + '.'); return;
    case 'rename': renaming = id; renderProject('#rn-' + id); return;
    case 'rename-cancel': var was = renaming; renaming = null; renderProject('[data-pact="rename"][data-id="' + was + '"]'); return;
    case 'rename-save': Project.renameTool(P, id, $('#rn-' + id).value); renaming = null; save(); renderProject('[data-pact="rename"][data-id="' + id + '"]'); return;
    case 'remove':
      t = tool(id);
      if (!confirm('Remove ' + t.id + ' ' + t.name + ' and all its answers?')) return;
      Project.removeTool(P, id); save(); renderProject('#tools-h'); announce(t.name + ' removed.'); return;
    case 'next':
      var tg = b.getAttribute('data-target');
      if (tool(tg)) location.hash = '#/tool/' + tg;
      else if (tg === 'describe') $('#app-desc').focus();
      else if (tg === 'tools') $('#app-cat').focus();
      else if (tg === 'connections') location.hash = '#/connections';
      else if (tg === 'send') send();
      return;
    case 'send': send(); return;
    case 'banner-close': banner(null); return;
    case 'reload-server':
      Server.load(BIND.id).then(function(r){ adoptServer(r); banner('Loaded the latest version.', 'ok'); route(true); }, function(x){ banner(esc(x.message), 'warn'); });
      return;
    case 'upload': createNow().then(function(ok){ if (ok) announce('Saved to your account.'); }); return;
    case 'open-project':
      flush();
      (BIND ? pushNow() : Promise.resolve(true)).then(function(){ return Server.load(id); }).then(function(r){
        adoptServer(r); location.hash = '#/project'; announce((P.name || 'Project') + ' opened.');
      }, function(x){ banner(esc(x.message), 'warn'); });
      return;
    case 'delete-project':
      if (!confirm('Delete "' + b.getAttribute('data-name') + '" from your account? This cannot be undone.')) return;
      Server.remove(id).then(function(){
        if (BIND && BIND.id === id) { BIND = null; writeBind(); P = Project.newProject(); saveLocal(); $('#app-name').value = ''; }
        renderAccount(); announce('Project deleted.');
      }, function(x){ banner(esc(x.message), 'warn'); });
      return;
    case 'delete-account':
      var n = b.getAttribute('data-n');
      if (prompt('This deletes your account and all ' + n + ' project' + (n === '1' ? '' : 's') + ' in it, for good. Type DELETE to confirm.') !== 'DELETE') return;
      Server.deleteAccount().then(function(){
        ACC.client = null; BIND = null; writeBind(); P = Project.newProject(); saveLocal(); $('#app-name').value = '';
        renderAccountBar(); banner('Your account and its projects have been deleted.', 'ok'); location.hash = '#/project'; route(true);
      }, function(x){ banner(esc(x.message), 'warn'); });
      return;
    case 'sign-out':
      if (!confirm('Sign out? Your projects stay in your account, and the copy on this device is cleared.')) return;
      flush();
      (BIND ? pushNow() : Promise.resolve(true)).then(function(){ return Server.signOut(); }).then(function(){
        ACC.client = null; BIND = null; writeBind(); P = Project.newProject(); saveLocal(); $('#app-name').value = '';
        renderAccountBar(); banner(null); location.hash = '#/project'; route(true); announce('Signed out.');
      }, function(x){ banner(esc(x.message), 'warn'); });
      return;
    case 'end-review':
      Server.endReview().then(function(){ location.href = location.pathname; }, function(x){ banner(esc(x.message), 'warn'); });
      return;

    case 'save-file':
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([Project.serialise(P)], { type:'application/json' }));
      a.download = (P.name || 'blueprint-project').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-v' + P.version + '.json';
      document.body.appendChild(a); a.click(); a.remove(); announce('Project file saved.'); return;
    case 'open-file': $('#app-file').click(); return;
    case 'demo':
      if (reviewing()) return;
      if ((P.tools.length || P.description) && !confirm('Replace this project with the cinema demo? ' + (BIND ? 'The current one stays in your account.' : 'Save a file first if you want to keep it.'))) return;
      flush(); if (BIND) pushNow();
      P = Connections.demoProject(Project, CATS, MODULES); BIND = null; writeBind(); saveNow(); $('#app-name').value = P.name; location.hash = '#/project'; route(true); announce('Cinema demo loaded: three connected tools.'); return;
    case 'new':
      if (reviewing()) return;
      if (!confirm('Start a new project? ' + (BIND ? 'The current one stays in your account.' : 'The current one is replaced on this device. Save a file first if you want to keep it.'))) return;
      flush(); if (BIND) pushNow();
      P = Project.newProject(); BIND = null; writeBind(); saveNow(); $('#app-name').value = ''; location.hash = '#/project'; route(true); return;
  }
});

/* ---------- start ----------
   Render this device's copy straight away, then ask the server who is here. */
P = load();
$('#app-name').value = P.name || '';
saveLocal(); status();
renderAccountBar();
route(false);
Server.me().then(function(me){
  ACC = { client:me.client, review:me.review };
  renderAccountBar();
  if (reviewing()) return startReview();
  if (signedIn()) return startClient().then(function(){ if (location.hash === '#/projects' || location.hash === '#/project' || !location.hash) route(false); });
  if (location.hash === '#/projects') route(false);
}, function(){ /* offline, or opened as a file: this device only */ });
})();
