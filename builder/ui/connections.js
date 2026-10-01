// Connecting Tools UI. Depends on Connections, Discovery, DiscoveryUI.
// create(root, hooks) -> { show(project, focus) }   hooks: save(), announce(text), changed(), modules
var ConnectionsUI = (function(){
'use strict';
var C = Connections;
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function opt(v, label, sel){ return '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(label) + '</option>'; }
function optsFrom(map, cur){ return Object.keys(map).map(function(k){ return opt(k, map[k], k === cur); }).join(''); }
var NODE_W = 184, NODE_H = 70;
var TABS = [['journey', 'Journey'], ['data', 'Shared data'], ['owners', 'Decisions'], ['questions', 'Questions'], ['whatif', 'What if'], ['doc', 'Document']];
var EFFECT = { recalculate:'Recalculates', clear:'Clears its results', flag:'Marks results for review', keep:'Keeps its results', update:'Updates its summary and stops' };

function create(root, hooks){
  var P = null, CX = null, tab = 'journey', sel = null, whatif = '', drag = null;
  root.innerHTML = '<div class="cx"><a class="link" href="#/project">Back to the project</a>'
    + '<div class="th-row"><h1 id="cx-h" tabindex="-1">Connecting tools</h1><span id="cx-state"></span></div>'
    + '<p class="muted" style="margin:4px 0 0;max-width:72ch">How your tools work together as one journey: where customers start, what passes between tools, what recalculates when an earlier answer changes, and which tool owns each decision.</p>'
    + '<div id="cx-issues"></div>'
    + '<nav class="apptabs" role="tablist" aria-label="Connecting tools">' + TABS.map(function(t){ return '<button type="button" role="tab" id="cxt-' + t[0] + '" aria-controls="cxp-' + t[0] + '" data-cxtab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</nav>'
    + TABS.map(function(t){ return '<section id="cxp-' + t[0] + '" role="tabpanel" aria-labelledby="cxt-' + t[0] + '" hidden></section>'; }).join('')
    + '</div>';
  var qRoot = document.createElement('div'); qRoot.id = 'cxq';
  root.querySelector('#cxp-questions').appendChild(qRoot);
  var qUI = DiscoveryUI.create(qRoot, { save: function(){ hooks.save(); }, announce: hooks.announce, changed: function(){ hooks.changed(); renderHeader(); }, openRules: function(){} });
  function $(s){ return root.querySelector(s); }
  function c(){ return P.connections; }
  function tname(id){ var t = P.tools.filter(function(x){ return x.id === id; })[0]; return t ? t.id + ' ' + t.name : id; }
  function fname(id){ var f = c().fields.filter(function(x){ return x.id === id; })[0]; return f ? f.name : id; }
  function persist(){ hooks.save(); hooks.changed(); }
  function toolOpts(cur, blank){ return (blank ? opt('', blank, !cur) : '') + P.tools.map(function(t){ return opt(t.id, t.id + ' ' + t.name, t.id === cur); }).join(''); }
  function issuesFor(ref){ return C.analyse(P).filter(function(i){ return i.ref === ref; }); }
  function issueList(list){ return list.length ? '<ul class="issues">' + list.map(function(i){ return '<li class="iss ' + (i.level === 'question' ? 'warning' : i.level) + '"><span class="lv">' + esc(i.level) + '</span>' + esc(i.ref) + ': ' + esc(i.text) + '</li>'; }).join('') + '</ul>' : ''; }

  /* ---------- header ---------- */
  function renderHeader(){
    var st = C.docState(P, CX), issues = C.analyse(P).filter(function(i){ return i.level !== 'info'; });
    $('#cx-state').innerHTML = '<span class="ds ' + st.key + '">' + esc(st.label) + '</span> <span class="muted small">' + c().links.length + ' connections, ' + c().fields.length + ' shared fields</span>';
    $('#cx-issues').innerHTML = issues.length ? '<details class="cxiss"><summary>' + issues.length + ' thing' + (issues.length > 1 ? 's' : '') + ' to settle</summary>' + issueList(issues) + '</details>' : '';
  }

  /* ---------- canvas ---------- */
  function geometry(){
    var n = c().nodes, pairs = {}, out = [], placed = [];
    Object.keys(n).forEach(function(k){ placed.push({ x:n[k].x - 6, y:n[k].y - 6, w:NODE_W + 12, h:NODE_H + 12 }); });
    function mid(a, b, c2, d){ return (a + 3 * b + 3 * c2 + d) / 8; }
    c().links.forEach(function(l){
      var a = n[l.from], b = n[l.to]; if (!a || !b) return;
      var key = [l.from, l.to].sort().join('|'); pairs[key] = (pairs[key] || 0) + 1;
      var k = pairs[key] - 1, off = k * 16, pts;
      if (b.x > a.x) {
        var x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2 + off - 8, x2 = b.x, y2 = b.y + NODE_H / 2 + off - 8;
        if (x2 - x1 > NODE_W + 120) { var top = Math.min(a.y, b.y) - 55 - k * 24; pts = [x1, y1, x1 + 70, top, x2 - 70, top, x2, y2]; }
        else { var dx = Math.max(40, (x2 - x1) / 2); pts = [x1, y1, x1 + dx, y1, x2 - dx, y2, x2, y2]; }
      } else {
        var sx = a.x + NODE_W / 2 + off, sy = a.y + NODE_H, ex = b.x + NODE_W / 2 - off, ey = b.y + NODE_H, dip = Math.max(sy, ey) + 70 + k * 30;
        pts = [sx, sy, sx, dip, ex, dip, ex, ey];
      }
      var d = 'M' + pts[0] + ' ' + pts[1] + ' C' + pts.slice(2).join(' ');
      var mx = mid(pts[0], pts[2], pts[4], pts[6]), my = mid(pts[1], pts[3], pts[5], pts[7]);
      var names = l.passes.map(fname), label = l.id + ', ' + (names.length === 1 ? names[0].slice(0, 18) : names.length + ' fields');
      var w = Math.min(230, 12 + label.length * 6.6), box = { x:mx - w / 2, y:my - 11, w:w, h:22 };
      var hits = function(r){ return !(box.x + box.w < r.x || r.x + r.w < box.x || box.y + box.h < r.y || r.y + r.h < box.y); };
      for (var tries = 0; tries < 12 && placed.some(hits); tries++) box.y += (tries % 2 ? -1 : 1) * 26 * (tries + 1);
      placed.push(box);
      out.push({ l:l, d:d, box:box, label:label, title:names.join(', ') || 'Nothing passed yet' });
    });
    return out;
  }
  function linksSVG(hl){
    return geometry().map(function(g){
      var l = g.l, cls = 'lnk' + (sel === l.id ? ' sel' : '') + (hl && hl.links[l.id] ? ' hot' : '');
      return '<g class="' + cls + '"><path d="' + g.d + '" marker-end="url(#cx-arrow)"/>'
        + '<g class="lbl" transform="translate(' + g.box.x + ',' + g.box.y + ')" tabindex="0" role="button" data-link="' + l.id + '" aria-label="Edit connection ' + esc(l.id) + ' from ' + esc(tname(l.from)) + ' to ' + esc(tname(l.to)) + ', passing ' + esc(g.title) + '">'
        + '<title>' + esc(g.l.id + ': ' + g.title) + '</title><rect width="' + g.box.w + '" height="22" rx="3"/><text x="8" y="15">' + esc(g.label) + '</text></g></g>';
    }).join('');
  }
  function nodesSVG(hl, interactive){
    return P.tools.map(function(t){
      var n = c().nodes[t.id]; if (!n) return '';
      var eff = hl ? hl.nodes[t.id] : null;
      var name = t.name.length > 24 ? t.name.slice(0, 23) + '…' : t.name;
      return '<g class="node' + (n.entry ? ' entry' : '') + (eff ? ' eff-' + eff : '') + '" transform="translate(' + n.x + ',' + n.y + ')" data-node="' + t.id + '"'
        + (interactive ? ' tabindex="0" role="button" aria-label="' + esc(t.id + ' ' + t.name + (n.entry ? ', starting tool' : '') + '. Drag or use arrow keys to move.') + '"' : '') + '>'
        + '<rect width="' + NODE_W + '" height="' + NODE_H + '" rx="3"/>'
        + '<text class="nid" x="12" y="22">' + esc(t.id) + (n.entry ? '  START' : '') + '</text><text class="nname" x="12" y="46">' + esc(name) + '</text>'
        + (eff ? '<text class="neff" x="12" y="62">' + esc(eff === 'origin' ? 'Changed here' : EFFECT[eff] || eff) + '</text>' : '')
        + '</g>';
    }).join('');
  }
  function canvasHTML(hl, interactive){
    var n = c().nodes, maxX = 0, maxY = 0;
    Object.keys(n).forEach(function(k){ maxX = Math.max(maxX, n[k].x); maxY = Math.max(maxY, n[k].y); });
    var geo = geometry(), maxL = 0; geo.forEach(function(g){ maxL = Math.max(maxL, g.box.y + 40); });
    var W = maxX + NODE_W + 60, H = Math.max(maxY + NODE_H + 150, maxL);
    return '<div class="cxcanvas' + (interactive ? '' : ' ro') + '"><svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Journey map">'
      + '<defs><marker id="cx-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>'
      + '<g class="links">' + linksSVG(hl) + '</g><g class="nodes">' + nodesSVG(hl, interactive) + '</g></svg></div>';
  }

  /* ---------- journey tab ---------- */
  function linkCard(l){
    var iss = issuesFor(l.id).filter(function(i){ return i.level !== 'info'; });
    return '<li class="lcard' + (sel === l.id ? ' sel' : '') + '"><div class="lc-h"><span class="tid">' + l.id + '</span><span>' + esc(tname(l.from)) + ' → ' + esc(tname(l.to)) + '</span>' + (l.loop_ok ? '<span class="chip">loop stops</span>' : '') + (iss.length ? '<span class="chip bad">' + iss.length + '</span>' : '') + '</div>'
      + '<p class="small muted" style="margin:2px 0 6px">' + esc(l.passes.map(fname).join(', ') || 'Nothing passed yet') + '. ' + esc(C.ON_CHANGE[l.on_change]) + '.</p>'
      + '<div class="bar"><button type="button" class="link" data-cxact="edit" data-id="' + l.id + '" aria-expanded="' + (sel === l.id) + '">' + (sel === l.id ? 'Close' : 'Edit') + '</button><button type="button" class="link push" data-cxact="rm-link" data-id="' + l.id + '">Remove</button></div>'
      + (sel === l.id ? editorHTML(l) : '') + '</li>';
  }
  function editorHTML(l){
    var f = c().fields, id = l.id;
    return '<div class="lcedit" data-lid="' + id + '">'
      + '<div class="g2"><div class="f"><label for="le-from">From</label><select id="le-from" data-lk="from">' + toolOpts(l.from) + '</select></div>'
      + '<div class="f"><label for="le-to">To</label><select id="le-to" data-lk="to">' + toolOpts(l.to) + '</select></div></div>'
      + '<div class="f"><label for="le-trigger">When</label><select id="le-trigger" data-lk="trigger">' + optsFrom(C.TRIGGERS, l.trigger) + '</select></div>'
      + '<fieldset class="f"><legend>What passes</legend><div class="vals">' + (f.length ? f.map(function(x){
          return '<label><input type="checkbox" data-lpass value="' + x.id + '"' + (l.passes.indexOf(x.id) > -1 ? ' checked' : '') + '>' + esc(x.name) + ' <span class="muted small">(' + esc(x.owner ? x.owner : 'no owner') + ')</span></label>';
        }).join('') : '<span class="muted small">No shared fields yet. Add one below.</span>') + '</div>'
      + '<div class="newf"><label class="sr" for="le-nf">New field name</label><input type="text" id="le-nf" placeholder="New field, e.g. Room width"><label class="sr" for="le-nft">Type</label><select id="le-nft">' + optsFrom(C.FIELD_TYPES, 'number') + '</select><button type="button" class="btn ghost tiny" data-cxact="new-field" data-id="' + id + '">Add and pass</button></div></fieldset>'
      + '<div class="f"><label for="le-action">At the destination, it</label><select id="le-action" data-lk="action">' + optsFrom(C.ACTIONS, l.action) + '</select></div>'
      + '<div class="f"><label for="le-change">If the earlier answer changes</label><select id="le-change" data-lk="on_change">' + optsFrom(C.ON_CHANGE, l.on_change) + '</select></div>'
      + '<div class="g2"><div class="f"><label for="le-fb">If the information is missing</label><select id="le-fb" data-lk="fallback">' + optsFrom(C.FALLBACK, l.fallback) + '</select></div>'
      + '<div class="f"><label for="le-fbn">Fallback detail <span class="opt-tag">(optional)</span></label><input type="text" id="le-fbn" data-lk="fallback_note" value="' + esc(l.fallback_note || '') + '"></div></div>'
      + '<label class="check"><input type="checkbox" data-lk="loop_ok"' + (l.loop_ok ? ' checked' : '') + '> If the journey loops back here, it stops: the earlier tool updates its summary without running again</label>'
      + '<div class="f"><label for="le-note">Note <span class="opt-tag">(optional)</span></label><input type="text" id="le-note" data-lk="note" value="' + esc(l.note || '') + '"></div>'
      + issueList(issuesFor(id))
      + '</div>';
  }
  function renderJourney(focusSel){
    var starts = '<fieldset class="f"><legend>Where can customers start?</legend><div class="vals">' + P.tools.map(function(t){
      return '<label><input type="checkbox" data-entry="' + t.id + '"' + (c().nodes[t.id] && c().nodes[t.id].entry ? ' checked' : '') + '>' + esc(t.id + ' ' + t.name) + '</label>';
    }).join('') + '</div></fieldset>';
    var add = '<div class="addlink"><span class="lbl">Add a connection</span><label class="sr" for="al-from">From</label><select id="al-from">' + toolOpts(P.tools[0] && P.tools[0].id) + '</select><span class="muted">to</span>'
      + '<label class="sr" for="al-to">To</label><select id="al-to">' + toolOpts(P.tools[1] && P.tools[1].id) + '</select><button type="button" class="btn tiny" data-cxact="add-link">Add</button></div>';
    $('#cxp-journey').innerHTML = '<div class="cxj"><div><p class="muted small" style="margin:0 0 8px">Drag tools to arrange them, or focus one and use the arrow keys. Select a label to edit that connection. Branches and loops are allowed.</p><div id="cx-map">' + canvasHTML(null, true) + '</div>'
      + '<button type="button" class="link" data-cxact="relayout">Tidy layout</button></div>'
      + '<div class="cxside">' + starts + add + '<ol class="lcards">' + c().links.map(linkCard).join('') + '</ol></div></div>';
    if (focusSel) { var el = $(focusSel); if (el) el.focus(); }
  }
  function refreshMapLinks(){ var g = root.querySelector('#cx-map svg .links'); if (g) g.innerHTML = linksSVG(null); }

  /* ---------- data, owners ---------- */
  function renderData(focusSel){
    var rows = c().fields.map(function(f){
      var used = C.usedBy(c(), f.id).map(tname).join(', ') || '-';
      return '<tr data-fid="' + f.id + '"><td class="tid">' + f.id + '</td>'
        + '<td><label class="sr" for="fn-' + f.id + '">Name of ' + f.id + '</label><input type="text" id="fn-' + f.id + '" data-fk="name" value="' + esc(f.name) + '"></td>'
        + '<td><label class="sr" for="ft-' + f.id + '">Type of ' + f.id + '</label><select id="ft-' + f.id + '" data-fk="type">' + optsFrom(C.FIELD_TYPES, f.type) + '</select></td>'
        + '<td><label class="sr" for="fu-' + f.id + '">Unit of ' + f.id + '</label><input type="text" id="fu-' + f.id + '" data-fk="unit" value="' + esc(f.unit || '') + '" style="max-width:90px"></td>'
        + '<td><label class="sr" for="fo-' + f.id + '">Produced by</label><select id="fo-' + f.id + '" data-fk="owner">' + toolOpts(f.owner, 'Not decided') + '</select></td>'
        + '<td class="small">' + esc(used) + '</td><td><button type="button" class="x" data-cxact="rm-field" data-id="' + f.id + '" aria-label="Remove ' + esc(f.name) + '">✕</button></td></tr>';
    }).join('');
    var iss = C.analyse(P).filter(function(i){ return /^F-/.test(i.ref); });
    $('#cxp-data').innerHTML = '<p class="muted small" style="max-width:72ch">Every piece of information that passes between tools. Each field has one tool that produces it; the others receive it.</p>'
      + '<div class="tbl"><table><thead><tr><th scope="col">ID</th><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Unit</th><th scope="col">Produced by</th><th scope="col">Used by</th><th scope="col"><span class="sr">Remove</span></th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="muted">No shared fields yet.</td></tr>') + '</tbody></table></div>'
      + '<div class="bar" style="margin-top:10px"><button type="button" class="btn ghost tiny" data-cxact="add-field">Add a field</button></div>' + issueList(iss);
    if (focusSel) { var el = $(focusSel); if (el) el.focus(); }
  }
  function renderOwners(focusSel){
    var rows = c().owners.map(function(o){
      return '<tr><td class="tid">' + o.id + '</td><td><label class="sr" for="od-' + o.id + '">Decision</label><input type="text" id="od-' + o.id + '" data-ok="decision" data-oid="' + o.id + '" value="' + esc(o.decision) + '"></td>'
        + '<td><label class="sr" for="oo-' + o.id + '">Owned by</label><select id="oo-' + o.id + '" data-ok="owner" data-oid="' + o.id + '">' + toolOpts(o.owner, 'Not decided') + '</select></td>'
        + '<td><label class="sr" for="on-' + o.id + '">Note</label><input type="text" id="on-' + o.id + '" data-ok="note" data-oid="' + o.id + '" value="' + esc(o.note || '') + '"></td></tr>';
    }).join('');
    $('#cxp-owners').innerHTML = '<p class="muted small" style="max-width:72ch">One tool owns each decision. Others can show it, but only the owner can change it. This prevents two tools setting different prices or baskets.</p>'
      + '<div class="tbl"><table><thead><tr><th scope="col">ID</th><th scope="col">Decision</th><th scope="col">Owned by</th><th scope="col">Note</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '<div class="bar" style="margin-top:10px"><button type="button" class="btn ghost tiny" data-cxact="add-decision">Add a decision</button></div>';
    if (focusSel) { var el = $(focusSel); if (el) el.focus(); }
  }

  /* ---------- what if ---------- */
  function renderWhatIf(){
    var opts = '<option value="">Choose what changes…</option>' + P.tools.map(function(t){
      var fs = c().fields.filter(function(f){ return f.owner === t.id; });
      return '<optgroup label="' + esc(t.id + ' ' + t.name) + '">' + fs.map(function(f){ return opt('f:' + f.id, f.name, whatif === 'f:' + f.id); }).join('') + opt('t:' + t.id, 'Everything ' + t.name + ' produces', whatif === 't:' + t.id) + '</optgroup>';
    }).join('');
    var body = '';
    if (whatif) {
      var im = C.impact(P, whatif.charAt(0) === 'f' ? { field:whatif.slice(2) } : { tool:whatif.slice(2) });
      var hl = { nodes:{}, links:{} };
      if (im.origin) hl.nodes[im.origin] = 'origin';
      im.steps.forEach(function(s){ hl.links[s.link] = 1; if (!hl.nodes[s.tool] || hl.nodes[s.tool] === 'keep') hl.nodes[s.tool] = s.effect; });
      body = im.steps.length
        ? '<ol class="steps-list">' + im.steps.map(function(s){ return '<li><strong>' + esc(tname(s.tool)) + '</strong> ' + esc((EFFECT[s.effect] || s.effect).toLowerCase()) + ' <span class="muted small">via ' + esc(s.link) + ', carrying ' + esc(s.fields.map(fname).join(', ')) + '</span>' + (s.note ? '<br><span class="small">' + esc(s.note) + '</span>' : '') + '</li>'; }).join('') + '</ol>'
        : '<p class="muted">Nothing downstream uses this, so nothing else changes.</p>';
      body += canvasHTML(hl, false);
    }
    $('#cxp-whatif').innerHTML = '<p class="muted small" style="max-width:72ch">Pick something a customer might change. You\'ll see every later result that has to be recalculated, cleared or reviewed, in the order it happens.</p>'
      + '<div class="f" style="max-width:420px"><label for="cx-wi">If this changes</label><select id="cx-wi">' + opts + '</select></div>' + body;
  }

  /* ---------- document ---------- */
  function blocksHTML(blocks){
    return blocks.map(function(b){
      if (b[0] === 'h') return '<h3 class="subh">' + esc(b[1]) + '</h3>';
      if (b[0] === 'p') return '<p>' + esc(b[1]) + '</p>';
      if (b[0] === 'ul') return '<ul>' + b[1].map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      return '<div class="tbl"><table><thead><tr>' + b[1].map(function(h){ return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>'
        + (b[2].length ? b[2].map(function(r){ return '<tr>' + r.map(function(x){ return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + b[1].length + '" class="muted">None yet.</td></tr>') + '</tbody></table></div>';
    }).join('');
  }
  function canConfirm(){
    var st = CX ? c().discovery : null;
    var secsOk = CX.sections.every(function(s){ return st.sections[s.id] && st.sections[s.id].status === 'confirmed'; });
    var issues = C.analyse(P).filter(function(i){ return i.level !== 'info'; });
    return { ok: secsOk && !issues.length && c().links.length > 0, secsOk: secsOk, issues: issues.length };
  }
  function renderDoc(){
    var st = C.docState(P, CX), cc = canConfirm();
    var why = cc.ok ? '' : '<span class="muted small">' + [!cc.secsOk ? 'confirm every section under Questions' : '', cc.issues ? 'settle the ' + cc.issues + ' open item' + (cc.issues > 1 ? 's' : '') : '', !c().links.length ? 'add a connection' : ''].filter(Boolean).join(', and ') + ' first.</span>';
    $('#cxp-doc').innerHTML = '<div class="bar"><span class="ds ' + st.key + '">' + esc(st.label) + '</span>'
      + '<button type="button" class="btn tiny" data-cxact="confirm"' + (cc.ok ? '' : ' disabled') + '>Mark ready for client review</button>' + why
      + '<button type="button" class="btn ghost tiny push" data-cxact="md">Download Markdown</button></div>'
      + '<article class="docbody"><h2 class="subh" style="margin-top:18px">Tool Map and Connections</h2>' + blocksHTML(C.documentBlocks(P, CX)) + '</article>';
  }

  /* ---------- tabs ---------- */
  function setTab(t, focus){
    tab = t;
    TABS.forEach(function(x){ $('#cxt-' + x[0]).setAttribute('aria-selected', String(x[0] === t)); $('#cxp-' + x[0]).hidden = x[0] !== t; });
    if (t === 'journey') renderJourney(); else if (t === 'data') renderData(); else if (t === 'owners') renderOwners();
    else if (t === 'questions') qUI.show({ id:'CX', discovery:c().discovery }, CX, false);
    else if (t === 'whatif') renderWhatIf(); else if (t === 'doc') renderDoc();
    if (focus) $('#cxt-' + t).focus();
  }

  /* ---------- events ---------- */
  root.addEventListener('click', function(e){
    if (!P) return;
    var tb = e.target.closest('[data-cxtab]'); if (tb) { setTab(tb.getAttribute('data-cxtab')); return; }
    var lk = e.target.closest('[data-link]'); if (lk) { sel = lk.getAttribute('data-link'); renderJourney('#le-from'); return; }
    var b = e.target.closest('[data-cxact]'); if (!b) return;
    var act = b.getAttribute('data-cxact'), id = b.getAttribute('data-id'), l;
    switch (act) {
      case 'edit': sel = sel === id ? null : id; renderJourney(sel ? '#le-from' : '[data-cxact="edit"][data-id="' + id + '"]'); return;
      case 'add-link':
        var fr = $('#al-from').value, to = $('#al-to').value;
        if (fr === to) { hooks.announce('Choose two different tools.'); return; }
        l = C.addLink(P, { from:fr, to:to, loop_ok:c().nodes[to] && c().nodes[fr] && c().nodes[to].x <= c().nodes[fr].x });
        sel = l.id; persist(); renderHeader(); renderJourney('#le-from'); hooks.announce(l.id + ' added.'); return;
      case 'rm-link':
        if (!confirm('Remove ' + id + '?')) return;
        C.removeLink(P, id); if (sel === id) sel = null; persist(); renderHeader(); renderJourney('[data-cxact="add-link"]'); return;
      case 'new-field':
        var nm = $('#le-nf').value.trim(); if (!nm) { $('#le-nf').focus(); return; }
        l = c().links.filter(function(x){ return x.id === id; })[0];
        var f = C.addField(P, { name:nm, type:$('#le-nft').value, owner:l.from });
        C.updateLink(P, id, { passes:l.passes.concat(f.id) });
        persist(); renderHeader(); renderJourney('#le-nf'); hooks.announce(f.id + ' ' + f.name + ' added and passed along ' + id + '.'); return;
      case 'relayout': C.layout(P, true); hooks.save(); renderJourney('[data-cxact="relayout"]'); return;
      case 'add-field': var nf = C.addField(P, {}); persist(); renderHeader(); renderData('#fn-' + nf.id); return;
      case 'rm-field':
        if (!confirm('Remove ' + fname(id) + ' from the shared data and from every connection?')) return;
        C.removeField(P, id); persist(); renderHeader(); renderData('[data-cxact="add-field"]'); return;
      case 'add-decision': var o = C.addDecision(P); persist(); renderHeader(); renderOwners('#od-' + o.id); return;
      case 'confirm':
        c().confirmed_at = new Date().toISOString(); C.log(P, 'Connections marked ready for client review'); c().confirmed_at = new Date(Date.now() + 1).toISOString();
        persist(); renderHeader(); renderDoc(); hooks.announce('Marked ready for client review.'); return;
      case 'md':
        var md = C.toMarkdown('Tool Map and Connections', C.documentBlocks(P, CX));
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([md], { type:'text/markdown' }));
        a.download = 'tool-map-and-connections.md'; document.body.appendChild(a); a.click(); a.remove(); return;
    }
  });
  function onInput(e){
    if (!P) return;
    var t = e.target, final = e.type === 'change';
    if (t.hasAttribute('data-entry')) { c().nodes[t.getAttribute('data-entry')].entry = t.checked; C.log(P, t.getAttribute('data-entry') + (t.checked ? ' marked' : ' unmarked') + ' as a starting tool'); persist(); renderHeader(); var g = root.querySelector('#cx-map svg .nodes'); if (g) g.innerHTML = nodesSVG(null, true); return; }
    var ed = t.closest('[data-lid]');
    if (ed && (t.hasAttribute('data-lk') || t.hasAttribute('data-lpass'))) {
      var id = ed.getAttribute('data-lid'), l = c().links.filter(function(x){ return x.id === id; })[0], patch = {};
      if (t.hasAttribute('data-lpass')) { if (!final) return; patch.passes = [].slice.call(ed.querySelectorAll('[data-lpass]')).filter(function(x){ return x.checked; }).map(function(x){ return x.value; }); }
      else { var k = t.getAttribute('data-lk'); patch[k] = t.type === 'checkbox' ? t.checked : t.value; if (t.type === 'text' && !final) { C.updateLink(P, id, patch, null, true); hooks.save(); return; } if (t.type !== 'checkbox' && t.tagName === 'SELECT' && !final) return; }
      if (patch.from === l.to || patch.to === l.from) { hooks.announce('A connection needs two different tools.'); renderJourney('#' + t.id); return; }
      C.updateLink(P, id, patch); persist(); renderHeader();
      if (patch.from || patch.to) { C.layout(P); renderJourney('#' + t.id); return; }
      var card = t.closest('.lcard'); refreshMapLinks();
      var p = card.querySelector('p.small'); if (p) p.textContent = (l.passes.map(fname).join(', ') || 'Nothing passed yet') + '. ' + C.ON_CHANGE[l.on_change] + '.';
      return;
    }
    if (t.hasAttribute('data-fk')) {
      var fid = t.closest('[data-fid]').getAttribute('data-fid'), fp = {}; fp[t.getAttribute('data-fk')] = t.value || (t.getAttribute('data-fk') === 'owner' ? null : t.value);
      if (!final && t.tagName === 'SELECT') return;
      C.updateField(P, fid, fp, null, !final); hooks.save(); if (final) { hooks.changed(); renderHeader(); if (t.tagName === 'SELECT') renderData('#' + t.id); }
      return;
    }
    if (t.hasAttribute('data-ok')) {
      var oid = t.getAttribute('data-oid'), key = t.getAttribute('data-ok'), o = c().owners.filter(function(x){ return x.id === oid; })[0];
      if (key === 'owner') { if (!final) return; C.setOwner(P, oid, t.value || null); persist(); renderHeader(); return; }
      o[key] = t.value; hooks.save(); if (final) { C.log(P, oid + ' ' + key + ' edited'); persist(); }
      return;
    }
    if (t.id === 'cx-wi' && final) { whatif = t.value; renderWhatIf(); var s2 = $('#cx-wi'); if (s2) s2.focus(); hooks.announce(whatif ? ($('.steps-list') ? $('.steps-list').children.length + ' later results affected.' : 'Nothing downstream is affected.') : ''); }
  }
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);

  /* drag and keyboard moves on the map */
  root.addEventListener('pointerdown', function(e){
    var g = e.target.closest('#cx-map .node[data-node]'); if (!g || !P) return;
    var id = g.getAttribute('data-node'), n = c().nodes[id], svg = g.ownerSVGElement, pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY; var p0 = pt.matrixTransform(svg.getScreenCTM().inverse());
    drag = { id:id, g:g, dx:p0.x - n.x, dy:p0.y - n.y, svg:svg };
    g.setPointerCapture(e.pointerId); e.preventDefault();
  });
  root.addEventListener('pointermove', function(e){
    if (!drag) return;
    var pt = drag.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var p = pt.matrixTransform(drag.svg.getScreenCTM().inverse()), n = c().nodes[drag.id];
    n.x = Math.max(10, Math.round((p.x - drag.dx) / 10) * 10); n.y = Math.max(10, Math.round((p.y - drag.dy) / 10) * 10);
    drag.g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')'); refreshMapLinks();
  });
  root.addEventListener('pointerup', function(){ if (drag) { var id = drag.id; drag = null; hooks.save(); renderJourney('#cx-map [data-node="' + id + '"]'); } });
  root.addEventListener('keydown', function(e){
    var g = e.target.closest && e.target.closest('#cx-map .node[data-node]');
    if (g) {
      var d = { ArrowLeft:[-20, 0], ArrowRight:[20, 0], ArrowUp:[0, -20], ArrowDown:[0, 20] }[e.key]; if (!d) return;
      e.preventDefault();
      var n = c().nodes[g.getAttribute('data-node')]; n.x = Math.max(10, n.x + d[0]); n.y = Math.max(10, n.y + d[1]);
      g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')'); refreshMapLinks(); hooks.save(); return;
    }
    var lb = e.target.closest && e.target.closest('#cx-map [data-link]');
    if (lb && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); lb.click(); }
  });

  return {
    show: function(project, focus){
      P = project; CX = hooks.modules.connect_tools; C.ensure(P, CX);
      renderHeader(); setTab(tab);
      if (focus) $('#cx-h').focus();
    }
  };
}
return { create:create };
})();
