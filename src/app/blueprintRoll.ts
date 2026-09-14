// @ts-nocheck
/* eslint-disable */
/* =========================================================================
   BLUEPRINT BOARD — PAGE TURN  (ported verbatim from the source homepage)
   -------------------------------------------------------------------------
   One blueprint sheet is visible at a time. Turning is done by a deforming
   mesh drawn in a transparent WebGL canvas above the live HTML sheets. Falls
   back to a crossfade when prefers-reduced-motion is set, the viewport is
   narrow, WebGL is unavailable, or the context is lost.

   Wrapped as initBlueprintRoll() returning a cleanup fn so it can be driven
   from a React useEffect. The DOM structure it queries (#blueprint-roll and
   its children) is rendered by Home.tsx.
   ========================================================================= */
export function initBlueprintRoll(): () => void {
  'use strict';

  var track = document.getElementById('blueprint-roll');
  if (!track) return function () {};

  var stage      = track.querySelector('.roll-stage');
  var sheets     = Array.prototype.slice.call(track.querySelectorAll('.roll-sheet'));
  var progressEl = document.getElementById('roll-progress');
  var prevBtn    = document.getElementById('roll-prev');
  var nextBtn    = document.getElementById('roll-next');
  var bar        = track.querySelector('.roll-timer');
  if (!stage || !progressEl || !prevBtn || !nextBtn || sheets.length < 2) return function () {};

  var disposers = [];

  var AUTO_MS    = 10000;   // dwell on each sheet
  var TURN_MS    = 1400;    // curl duration
  var HANDOFF_MS = 140;     // live sheet <-> mesh crossfade

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow  = window.matchMedia && window.matchMedia('(max-width: 860px)').matches;

  var current = 0, busy = false, timer = null, inView = true, book = null;

  /* --------------------------------------------------------------- sound */
  /* Page-turn sound on each sheet change. Shares the site-wide mute
     preference with the demo viewer ('bpc-viewer-sound', default on) and
     stays silent for reduced-motion visitors (they get the calm crossfade). */
  var soundOn = true;
  try { soundOn = localStorage.getItem('bpc-viewer-sound') !== 'off'; } catch (e) {}
  var turnSound = null;
  try {
    turnSound = new Audio('/media/page-turn-open.mp3');
    turnSound.preload = 'auto';
    turnSound.volume = 0.5;
  } catch (e) { turnSound = null; }

  function playTurn() {
    if (reduced || !soundOn || !turnSound) return;
    try {
      turnSound.pause();
      turnSound.currentTime = 0;
      var p = turnSound.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  /* ---------------------------------------------------------------- state */

  progressEl.setAttribute('aria-live', 'polite');
  track.setAttribute('role', 'group');
  track.setAttribute('aria-roledescription', 'blueprint sheets');

  function label(i) {
    return 'SHEET ' + String(i + 1).padStart(2, '0') + ' / ' + String(sheets.length).padStart(2, '0');
  }

  function paint(index) {
    for (var i = 0; i < sheets.length; i++) {
      var live = (i === index);
      sheets[i].classList.toggle('is-live', live);
      sheets[i].classList.remove('is-under', 'is-handoff');
      sheets[i].setAttribute('aria-hidden', live ? 'false' : 'true');
    }
    progressEl.textContent = label(index);
  }

  function startTimer() {
    stopTimer();
    if (!inView || document.hidden) return;
    if (bar) { bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run'); }
    timer = window.setTimeout(function () { go(1); }, AUTO_MS);
  }

  function stopTimer() {
    if (timer) { window.clearTimeout(timer); timer = null; }
    if (bar) bar.classList.remove('run');
  }

  /* Single entry point for every turn. Guarded so a rapid second click, or
     the auto timer firing mid-turn, is dropped rather than queued. */
  function go(dir) {
    if (busy) return;
    var next = (current + dir + sheets.length) % sheets.length;
    if (next === current) return;

    busy = true;
    stopTimer();
    playTurn();
    var from = current;

    function done() {
      current = next;
      paint(current);
      busy = false;
      startTimer();
    }

    if (book) book.turn(dir, from, next, done);
    else      crossfade(from, next, done);
  }

  function crossfade(from, to, done) {
    sheets[to].classList.add('is-under');
    void sheets[to].offsetWidth;
    sheets[from].classList.remove('is-live');
    sheets[from].classList.add('is-handoff');
    sheets[to].classList.add('is-live');
    window.setTimeout(done, 320);
  }

  function demote() {                 // drop to the crossfade at any point
    book = null;
    track.classList.add('mode-fade');
  }

  /* ------------------------------------------------------------- controls */

  function onPrev() { go(-1); }
  function onNext() { go(1); }
  function onKey(e) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  }
  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);
  track.addEventListener('keydown', onKey);
  disposers.push(function () {
    prevBtn.removeEventListener('click', onPrev);
    nextBtn.removeEventListener('click', onNext);
    track.removeEventListener('keydown', onKey);
  });

  /* Stop all work when the board is off-screen or the tab is hidden. */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) { if (!busy) startTimer(); }
      else stopTimer();
    }, { threshold: 0.15 });
    io.observe(track);
    disposers.push(function () { io.disconnect(); });
  }
  function onVis() {
    if (document.hidden) stopTimer();
    else if (!busy) startTimer();
  }
  document.addEventListener('visibilitychange', onVis);
  disposers.push(function () { document.removeEventListener('visibilitychange', onVis); });

  /* ============================ FACE TEXTURE ==============================
     A repaint of the live sheet onto a 2D canvas. Geometry comes from the
     DOM, never from constants: boxes from getBoundingClientRect, glyphs from
     per-character Range rects, styling from getComputedStyle.
     ====================================================================== */

  function pf(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function opaque(c) { return !!c && c !== 'transparent' && !/^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$/.test(c); }

  function roundedPath(g, x, y, w, h, r) {
    var m = Math.min(Math.abs(w), Math.abs(h)) / 2;
    var tl = Math.min(r[0], m), tr = Math.min(r[1], m),
        br = Math.min(r[2], m), bl = Math.min(r[3], m);
    g.beginPath();
    g.moveTo(x + tl, y);
    g.lineTo(x + w - tr, y); g.arcTo(x + w, y, x + w, y + tr, tr);
    g.lineTo(x + w, y + h - br); g.arcTo(x + w, y + h, x + w - br, y + h, br);
    g.lineTo(x + bl, y + h); g.arcTo(x, y + h, x, y + h - bl, bl);
    g.lineTo(x, y + tl); g.arcTo(x, y, x + tl, y, tl);
    g.closePath();
  }

  function radii(cs) {
    return [pf(cs.borderTopLeftRadius), pf(cs.borderTopRightRadius),
            pf(cs.borderBottomRightRadius), pf(cs.borderBottomLeftRadius)];
  }

  /* Split a CSS list on top-level commas — colour functions contain them. */
  function topSplit(s) {
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  /* Minimal linear-gradient support: an optional angle or "to <side>", then
     colour stops with zero, one or two positions. Returns null on anything
     it does not understand, and the caller keeps the flat background. */
  function gradient(g, image, b) {
    var m = /^linear-gradient\(([\s\S]*)\)\s*$/.exec((topSplit(image)[0] || image).trim());
    if (!m) return null;
    var parts = topSplit(m[1]);
    if (!parts.length) return null;

    var deg = 180;                                  // CSS default: to bottom
    if (/^-?[\d.]+deg$/.test(parts[0])) deg = pf(parts.shift());
    else if (/^to\s/.test(parts[0])) {
      var dir = parts.shift().replace(/^to\s+/, '');
      deg = { 'top': 0, 'right': 90, 'bottom': 180, 'left': 270,
              'top right': 45, 'right top': 45, 'bottom right': 135, 'right bottom': 135,
              'bottom left': 225, 'left bottom': 225, 'top left': 315, 'left top': 315 }[dir];
      if (deg === undefined) return null;
    }

    // The gradient line is needed before the stops: computed styles express
    // positions in either percentages or pixels, and pixels resolve against
    // the length of that line.
    var rad = (deg - 90) * Math.PI / 180;
    var dx = Math.cos(rad), dy = Math.sin(rad);
    var len = Math.abs(b.w * Math.sin(deg * Math.PI / 180)) + Math.abs(b.h * Math.cos(deg * Math.PI / 180));
    if (!len) return null;

    function at(tok) {
      if (tok === undefined) return null;
      if (/%$/.test(tok)) return pf(tok) / 100;
      return pf(tok) / len;                       // px, and bare 0
    }

    var stops = [], i, j;
    for (i = 0; i < parts.length; i++) {
      var sm = /^(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}|[a-zA-Z]+)(?:\s+(-?[\d.]+(?:%|px)?))?(?:\s+(-?[\d.]+(?:%|px)?))?$/.exec(parts[i]);
      if (!sm) return null;
      stops.push({ c: sm[1], p: at(sm[2]) });
      if (sm[3] !== undefined) stops.push({ c: sm[1], p: at(sm[3]) });
    }
    if (stops.length < 2) return null;
    if (stops[0].p === null) stops[0].p = 0;
    if (stops[stops.length - 1].p === null) stops[stops.length - 1].p = 1;
    for (j = 1; j < stops.length - 1; j++) {
      if (stops[j].p === null) stops[j].p = j / (stops.length - 1);
    }

    // CSS angles run clockwise from "to top"; the gradient line is centred on
    // the box and long enough to cover it.
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    var grad = g.createLinearGradient(cx - dx * len / 2, cy - dy * len / 2,
                                      cx + dx * len / 2, cy + dy * len / 2);
    try {
      for (var k = 0; k < stops.length; k++) {
        grad.addColorStop(Math.max(0, Math.min(1, stops[k].p)), stops[k].c);
      }
    } catch (e) { return null; }
    return grad;
  }

  function fillBox(g, cs, b, rad) {
    if (opaque(cs.backgroundColor)) {
      roundedPath(g, b.x, b.y, b.w, b.h, rad);
      g.fillStyle = cs.backgroundColor;
      g.fill();
    }
    var img = cs.backgroundImage;
    if (img && img !== 'none') {
      var grad = gradient(g, img, b);
      if (grad) { roundedPath(g, b.x, b.y, b.w, b.h, rad); g.fillStyle = grad; g.fill(); }
    }
  }

  function strokeBox(g, cs, b, rad) {
    var t = pf(cs.borderTopWidth), r = pf(cs.borderRightWidth),
        bo = pf(cs.borderBottomWidth), l = pf(cs.borderLeftWidth);
    if (!t && !r && !bo && !l) return;
    var uniform = t === r && r === bo && bo === l && t > 0 &&
                  cs.borderTopColor === cs.borderRightColor &&
                  cs.borderRightColor === cs.borderBottomColor &&
                  cs.borderBottomColor === cs.borderLeftColor;
    if (uniform) {
      roundedPath(g, b.x + t / 2, b.y + t / 2, b.w - t, b.h - t, rad);
      g.lineWidth = t; g.strokeStyle = cs.borderTopColor; g.stroke();
      return;
    }
    // Dividing rules such as .roll-copy's right border and .option-row's
    // bottom border come through here, at their measured positions.
    if (t)  { g.fillStyle = cs.borderTopColor;    g.fillRect(b.x, b.y, b.w, t); }
    if (bo) { g.fillStyle = cs.borderBottomColor; g.fillRect(b.x, b.y + b.h - bo, b.w, bo); }
    if (l)  { g.fillStyle = cs.borderLeftColor;   g.fillRect(b.x, b.y, l, b.h); }
    if (r)  { g.fillStyle = cs.borderRightColor;  g.fillRect(b.x + b.w - r, b.y, r, b.h); }
  }

  /* Every glyph is placed at its own measured rect, so wrapping, line length,
     line height and letter spacing come straight from the live layout. */
  function paintText(node, g, o, range) {
    var txt = node.nodeValue;
    if (!txt || !/\S/.test(txt)) return;
    var host = node.parentElement;
    if (!host) return;
    var cs = getComputedStyle(host);
    if (cs.display === 'none') return;

    g.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    g.fillStyle = cs.color;
    g.textAlign = 'left';
    g.textBaseline = 'middle';

    var underline = /underline/.test(cs.textDecorationLine || cs.textDecoration || '');
    var runTop = null, runL = 0, runR = 0, runH = 0;

    function flushUnderline() {
      if (!underline || runTop === null) return;
      g.fillRect(runL, runTop + runH * 0.78, runR - runL, Math.max(1, pf(cs.fontSize) / 16));
    }

    for (var i = 0; i < txt.length; i++) {
      var ch = txt.charAt(i);
      if (ch === '\n' || ch === '\t' || ch === '\r') continue;
      range.setStart(node, i); range.setEnd(node, i + 1);
      var r = range.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      var x = r.left - o.left, y = r.top - o.top;
      if (underline) {
        if (runTop === null || Math.abs(y - runTop) > 1) { flushUnderline(); runTop = y; runL = x; runH = r.height; }
        runR = x + r.width;
      }
      if (ch !== ' ') g.fillText(ch, x, y + r.height / 2);
    }
    flushUnderline();
  }

  /* Absolutely positioned ::before / ::after — the accent head rule on each
     sheet, and the small decorative marks inside the demo panels. */
  function paintPseudo(el, which, g, box, cs) {
    var ps;
    try { ps = getComputedStyle(el, which); } catch (e) { return; }
    if (!ps || ps.content === 'none' || ps.content === '' || ps.display === 'none') return;
    if (ps.position !== 'absolute') return;            // inline pseudos: skipped
    var hasPaint = opaque(ps.backgroundColor) || (ps.backgroundImage && ps.backgroundImage !== 'none');
    if (!hasPaint) return;

    var bl = pf(cs.borderLeftWidth), bt = pf(cs.borderTopWidth);
    var L = pf(ps.left), T = pf(ps.top), R = pf(ps.right), B = pf(ps.bottom);
    var innerW = box.w - bl - pf(cs.borderRightWidth);
    var innerH = box.h - bt - pf(cs.borderBottomWidth);
    var w = ps.width  === 'auto' ? innerW - L - R : pf(ps.width);
    var h = ps.height === 'auto' ? innerH - T - B : pf(ps.height);
    if (w <= 0 || h <= 0) return;

    var b = { x: box.x + bl + L, y: box.y + bt + T, w: w, h: h };
    g.save();
    var op = parseFloat(ps.opacity);
    g.globalAlpha = isNaN(op) ? 1 : Math.max(0, Math.min(1, op));

    var mt = /matrix\(([^)]+)\)/.exec(ps.transform || '');
    if (mt) {
      var n = mt[1].split(',').map(parseFloat);
      g.translate(b.x + b.w / 2, b.y + b.h / 2);
      g.transform(n[0], n[1], n[2], n[3], n[4], n[5]);
      b = { x: -b.w / 2, y: -b.h / 2, w: b.w, h: b.h };
    }
    fillBox(g, ps, b, radii(ps));
    g.restore();
  }

  function paintElement(el, g, o, range) {
    var cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    // No visibility check: a hidden sheet is still fully laid out, and that
    // laid-out state is exactly what we are painting from.

    var r = el.getBoundingClientRect();
    var box = { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
    if (box.w <= 0 || box.h <= 0) return;
    var rad = radii(cs);

    var alpha = parseFloat(cs.opacity);
    var faded = !isNaN(alpha) && alpha < 1 && !el.classList.contains('roll-sheet');
    if (faded) { g.save(); g.globalAlpha = alpha; }

    fillBox(g, cs, box, rad);
    strokeBox(g, cs, box, rad);
    paintPseudo(el, '::before', g, box, cs);

    var clipped = cs.overflow === 'hidden' || cs.overflowX === 'hidden';
    if (clipped) { g.save(); roundedPath(g, box.x, box.y, box.w, box.h, rad); g.clip(); }

    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 1) paintElement(n, g, o, range);
      else if (n.nodeType === 3) paintText(n, g, o, range);
    }

    if (clipped) g.restore();
    paintPseudo(el, '::after', g, box, cs);
    if (faded) g.restore();
  }

  function paintSheet(el, W, H, dpr) {
    var c = document.createElement('canvas');
    c.width  = Math.max(2, Math.round(W * dpr));
    c.height = Math.max(2, Math.round(H * dpr));
    var g = c.getContext('2d');
    g.scale(dpr, dpr);
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ground-2').trim() || '#0E2136';
    g.fillRect(0, 0, W, H);

    // A sheet waiting its turn is visibility:hidden. It is still laid out, but
    // range rects for text inside a hidden subtree are not dependable across
    // engines, so make it visible for the measurement pass. Its opacity stays
    // 0 throughout, so nothing appears on screen, and geometry is unaffected.
    var prior = el.style.visibility;
    el.style.visibility = 'visible';
    try {
      paintElement(el, g, el.getBoundingClientRect(), document.createRange());
    } finally {
      el.style.visibility = prior;
    }
    return c;
  }

  /* ================================ CURL =================================
     Orthographic by design: under perspective the lifted edge is magnified
     toward the camera and the top and bottom of the sheet clip against the
     board. Depth is carried by the fold shading and the cast shadow, which
     is what the effect reads from anyway. The projection is two divides in
     the vertex shader, so there are no matrices to carry.
     ====================================================================== */

  var PAGE_VS = [
    'attribute vec2 aUv;',
    'uniform float uProgress;',
    'uniform vec2  uSize;',
    'uniform float uThickness;',
    'varying vec2  vUv;',
    'varying float vAng;',
    'const float PI = 3.14159265;',
    'void main(){',
    '  vUv = aUv;',
    '  float x = aUv.x;',
    '  float y = aUv.y - 0.5;',
    '  float p = clamp(uProgress, 0.0, 1.10);',
    '  float tilt = 0.30 * sin(p * PI) * (1.0 - p);',
    '  vec2 fn = vec2(cos(tilt), sin(tilt));',      // fold normal
    '  vec2 ft = vec2(-sin(tilt), cos(tilt));',     // along the fold
    '  float maxU = cos(tilt) + 0.5 * abs(sin(tilt));',
    '  float foldU = mix(maxU + 0.04, -0.16, p);',
    '  vec2 P = vec2(x, y);',
    '  float u = dot(P, fn);',
    '  float v = dot(P, ft);',
    '  float base = mix(0.32, 0.095, p);',
    '  float d = u - foldU;',
    '  float r = base * (1.0 + 0.55 * clamp(d, 0.0, 1.3));',
    '  float ang = 0.0;',
    '  float uu = u, z = 0.0;',
    '  if (d > 0.0){ ang = d / r; uu = foldU + r * sin(ang); z = r * (1.0 - cos(ang)); }',
    '  vec2 Q = fn * uu + ft * v;',
    '  vec3 pos = vec3(Q.x, Q.y + 0.5, z);',
    '  vAng = ang;',
    '  pos.z += 0.03 * (1.0 - 4.0 * y * y) * sin(p * PI);',
    '  vec3 w = vec3((pos.x - 0.5) * uSize.x, (pos.y - 0.5) * uSize.y, pos.z * uSize.x);',
    '  if (uThickness > 0.0){ w -= vec3(-sin(ang), 0.0, cos(ang)) * uThickness; }',
    '  gl_Position = vec4(w.x / (uSize.x * 0.5), w.y / (uSize.y * 0.5), -w.z / (uSize.x * 1.5), 1.0);',
    '}'
  ].join('\n');

  var PAGE_FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform sampler2D uMap;',
    'uniform float uProgress;',
    'uniform float uBackOnly;',
    'uniform vec3  uPaper;',
    'varying vec2  vUv;',
    'varying float vAng;',
    'const float PI = 3.14159265;',
    'float inner(float s){',
    '  if (s < 0.05) return 1.0;',
    '  if (s < 0.15) return mix(1.0, 0.06, (s - 0.05) / 0.10);',
    '  if (s < 0.35) return mix(0.06, 1.0, (s - 0.15) / 0.20);',
    '  return mix(1.0, 0.0, clamp((s - 0.35) / 0.65, 0.0, 1.0));',
    '}',
    'void main(){',
    '  vec3 col;',
    '  if (uBackOnly > 0.5 || !gl_FrontFacing){',
    '    vec2 gr = fract(vUv * vec2(20.0, 11.0));',
    '    float grid = (step(0.965, gr.x) + step(0.965, gr.y)) * 0.045;',
    '    col = uPaper + grid;',
    '  } else {',
    '    col = texture2D(uMap, vUv).rgb;',
    '  }',
    '  float lambert = 0.40 + 0.60 * abs(cos(vAng));',
    '  float hi      = pow(max(sin(vAng), 0.0), 9.0) * 0.30;',
    '  col = col * lambert * (1.0 - 0.30 * inner(vAng / PI) * step(0.0001, vAng)) + hi;',
    '  float a = 1.0 - smoothstep(0.86, 1.00, uProgress);',
    '  gl_FragColor = vec4(col * a, a);',
    '}'
  ].join('\n');

  var SHADOW_VS = [
    'attribute vec2 aUv;',
    'varying vec2 vUv;',
    'void main(){',
    '  vUv = aUv;',
    '  gl_Position = vec4(aUv.x * 2.0 - 1.0, aUv.y * 2.0 - 1.0, 0.999, 1.0);',
    '}'
  ].join('\n');

  var SHADOW_FS = [
    'precision mediump float;',
    'uniform float uProgress;',
    'varying vec2 vUv;',
    'const float PI = 3.14159265;',
    'void main(){',
    '  float p = clamp(uProgress, 0.0, 1.0);',
    '  float tilt = 0.30 * sin(p * PI) * (1.0 - p);',
    '  float maxU = cos(tilt) + 0.5 * abs(sin(tilt));',
    '  float foldU = mix(maxU + 0.04, -0.16, p);',
    '  float u = dot(vec2(vUv.x, vUv.y - 0.5), vec2(cos(tilt), sin(tilt)));',
    '  float d = u - foldU;',
    '  float spread = mix(9.0, 3.0, sin(p * PI));',
    '  float a = exp(-max(d, 0.0) * spread) * step(0.0, d) * 0.55 * sin(p * PI);',
    '  a *= 0.72 + 0.28 * (1.0 - abs(vUv.y - 0.5) * 2.0);',
    '  gl_FragColor = vec4(0.0, 0.0, 0.0, a);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      if (window.console) console.warn('page turn shader:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function link(gl, vsSrc, fsSrc) {
    var vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
    var fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    var p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aUv');
    gl.linkProgram(p);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      if (window.console) console.warn('page turn link:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  function createBook() {
    var canvas = document.createElement('canvas');
    canvas.className = 'roll-gl';
    canvas.setAttribute('aria-hidden', 'true');

    var opts = { alpha: true, antialias: true, premultipliedAlpha: true, depth: true };
    var gl = null;
    try { gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts); }
    catch (e) { return null; }
    if (!gl) return null;

    var pageProg = link(gl, PAGE_VS, PAGE_FS);
    var shadProg = link(gl, SHADOW_VS, SHADOW_FS);
    if (!pageProg || !shadProg) return null;

    stage.appendChild(canvas);
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      canvas.classList.remove('is-on');
      demote();
    });

    // UV grid and index buffer. 88 x 44 cells is enough subdivision for the
    // curl to read as a surface rather than a set of facets.
    var NX = 88, NY = 44, ix, iy;
    var uv = new Float32Array((NX + 1) * (NY + 1) * 2), k = 0;
    for (iy = 0; iy <= NY; iy++) {
      for (ix = 0; ix <= NX; ix++) { uv[k++] = ix / NX; uv[k++] = iy / NY; }
    }
    var idx = new Uint16Array(NX * NY * 6), q = 0;
    for (iy = 0; iy < NY; iy++) {
      for (ix = 0; ix < NX; ix++) {
        var a = iy * (NX + 1) + ix, b = a + 1, c = a + NX + 1, d = c + 1;
        idx[q++] = a; idx[q++] = c; idx[q++] = b;
        idx[q++] = b; idx[q++] = c; idx[q++] = d;
      }
    }

    var uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    var idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

    var U = {
      progress: gl.getUniformLocation(pageProg, 'uProgress'),
      size:     gl.getUniformLocation(pageProg, 'uSize'),
      thick:    gl.getUniformLocation(pageProg, 'uThickness'),
      backOnly: gl.getUniformLocation(pageProg, 'uBackOnly'),
      paper:    gl.getUniformLocation(pageProg, 'uPaper'),
      map:      gl.getUniformLocation(pageProg, 'uMap'),
      shadowP:  gl.getUniformLocation(shadProg, 'uProgress')
    };

    var W = 0, H = 0, dpr = 1, cache = [], tex = null, raf = null;

    function measure() {
      var r = stage.getBoundingClientRect();
      var nw = Math.max(2, Math.round(r.width)),
          nh = Math.max(2, Math.round(r.height)),
          nd = Math.min(window.devicePixelRatio || 1, 2);
      if (nw === W && nh === H && nd === dpr) return false;
      W = nw; H = nh; dpr = nd;
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      return true;
    }

    function clearCache() {
      for (var i = 0; i < cache.length; i++) if (cache[i]) gl.deleteTexture(cache[i]);
      cache = [];
    }

    function texture(i) {
      if (cache[i]) return cache[i];
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paintSheet(sheets[i], W, H, dpr));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);   // non-power-of-two
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      cache[i] = t;
      return t;
    }

    function draw(p) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // premultiplied output

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);

      // contact shadow first, flat against the board
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.useProgram(shadProg);
      gl.uniform1f(U.shadowP, p);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);

      // then the sheet: backing layer, then the printed face
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.useProgram(pageProg);
      gl.uniform1f(U.progress, p);
      gl.uniform2f(U.size, W, H);
      gl.uniform3f(U.paper, 0.051, 0.110, 0.188);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(U.map, 0);

      gl.uniform1f(U.thick, 3.5);
      gl.uniform1f(U.backOnly, 1);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);

      gl.uniform1f(U.thick, 0);
      gl.uniform1f(U.backOnly, 0);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    }

    // fast lift, slow settle, with a very small damped overshoot at the end
    function ease(t) {
      var e = 1 - Math.pow(1 - t, 2.6);
      if (t > 0.82) { var s = (t - 0.82) / 0.18; e += 0.016 * Math.sin(s * Math.PI) * (1 - s); }
      return Math.min(e, 1.02);
    }

    function turn(dir, from, to, done) {
      if (measure()) clearCache();          // textures are painted at stage size
      var faceIdx  = dir > 0 ? from : to;
      var underIdx = dir > 0 ? to   : from;

      tex = texture(faceIdx);
      draw(dir > 0 ? 0 : 1);

      sheets[underIdx].classList.add('is-under');
      canvas.classList.add('is-on');

      if (dir > 0) {                        // hand over without an empty frame
        sheets[from].classList.remove('is-live');
        sheets[from].classList.add('is-handoff');
      }

      var t0 = 0;
      function frame(now) {
        if (!t0) t0 = now;
        var t = Math.min((now - t0) / TURN_MS, 1);
        var e = ease(t);
        draw(dir > 0 ? e : 1 - e);
        if (t < 1) raf = window.requestAnimationFrame(frame);
        else finish();
      }

      function finish() {
        raf = null;
        if (dir < 0) { sheets[to].classList.add('is-under'); void sheets[to].offsetWidth; }
        canvas.classList.remove('is-on');
        window.setTimeout(done, HANDOFF_MS);
      }

      raf = window.requestAnimationFrame(frame);
    }

    var resizeTimer = null;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (busy) return;                   // never resize mid-turn
        if (measure()) clearCache();
      }, 180);
    }
    window.addEventListener('resize', onResize);

    // Webfonts change glyph metrics. If anything was painted before they
    // settled, throw it away and repaint on next use.
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(clearCache, function () {});
    }

    measure();

    disposers.push(function () {
      if (raf) window.cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      clearCache();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    });

    return { turn: turn };
  }

  /* ------------------------------------------------------------- start-up */

  function begin(engine) {
    book = engine;
    track.classList.add('js-ready');
    if (!book) track.classList.add('mode-fade');
    paint(0);
    startTimer();
  }

  begin((reduced || narrow) ? null : createBook());

  return function cleanup() {
    stopTimer();
    for (var i = 0; i < disposers.length; i++) {
      try { disposers[i](); } catch (e) { /* ignore */ }
    }
  };
}
