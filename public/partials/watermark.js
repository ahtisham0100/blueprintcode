/* ==========================================================================
   Blueprint Code — demo watermark.
   SINGLE SOURCE OF TRUTH for the company-logo watermark shown on served demo
   pages. Scatters small, 45°-tilted logo marks across the page BODY only —
   the field is confined between the shared header (.bpc-head) and footer
   (.bpc-footer) so the chrome stays clean. Pages without that chrome (e.g. a
   demo embedded in the viewer with chrome hidden, or a standalone demo) get
   the field across the whole document.

   Linked on every demo page; safe to load more than once and inside an iframe.
   ========================================================================== */
(function () {
  var MARK_SRC = '/blueprintcode-ai.png';
  var SIZE = 352;    // mark width, px
  var STEP_X = 300;  // horizontal spacing between marks, px
  var STEP_Y = 240;  // vertical spacing between rows, px

  var layer = null;
  var resizeTimer = null;

  // Document-relative top of an element (stable for sticky headers, which keep
  // their normal-flow offsetTop regardless of scroll position).
  function docTop(el) {
    var t = 0;
    while (el) { t += el.offsetTop; el = el.offsetParent; }
    return t;
  }

  // Return the element only if it is actually rendered (chrome may be hidden
  // when a demo is embedded in the viewer — then we want a full-page field).
  function firstVisible(sel) {
    var el = document.querySelector(sel);
    if (!el) return null;
    return el.getBoundingClientRect().height > 0 ? el : null;
  }

  function build() {
    if (!layer) return;
    layer.style.height = '0px'; // don't let the field inflate scrollHeight while measuring

    var head = firstVisible('.bpc-head');
    var foot = firstVisible('.bpc-footer');
    var docW = document.documentElement.clientWidth;
    var docH = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    );

    var top = head ? docTop(head) + head.offsetHeight : 0;
    var bottom = foot ? docTop(foot) : docH;
    var height = Math.max(0, bottom - top);

    layer.style.top = top + 'px';
    layer.style.width = docW + 'px';
    layer.style.height = height + 'px';

    layer.textContent = '';
    var frag = document.createDocumentFragment();
    var row = 0;
    for (var y = 24; y < height; y += STEP_Y) {
      var rowOffset = (row % 2) ? STEP_X / 2 : 0; // stagger alternate rows
      var col = 0;
      for (var x = -SIZE; x < docW + SIZE; x += STEP_X) {
        // gentle, deterministic jitter so the field reads as scattered, not gridded
        var jx = ((row * 7 + col * 13) % 44) - 22;
        var jy = ((row * 11 + col * 5) % 34) - 17;
        var img = document.createElement('img');
        img.src = MARK_SRC;
        img.alt = '';
        img.className = 'bpc-watermark__mark';
        img.style.left = Math.round(x + rowOffset + jx) + 'px';
        img.style.top = Math.round(y + jy) + 'px';
        frag.appendChild(img);
        col++;
      }
      row++;
    }
    layer.appendChild(frag);
  }

  function inject() {
    if (document.querySelector('.bpc-watermark')) return; // idempotent

    var style = document.createElement('style');
    style.setAttribute('data-bpc-watermark', '1');
    // z-index sits below the sticky header/footer chrome (z-index 2000) so the
    // chrome always paints over the field, but above ordinary demo content.
    style.textContent =
      '.bpc-watermark{position:absolute;left:0;overflow:hidden;' +
        'pointer-events:none;opacity:.2;z-index:1900;}' +
      '.bpc-watermark__mark{position:absolute;width:' + SIZE + 'px;height:auto;' +
        'transform:rotate(-45deg);transform-origin:center;}';
    document.head.appendChild(style);

    layer = document.createElement('div');
    layer.className = 'bpc-watermark';
    layer.setAttribute('aria-hidden', 'true');
    (document.body || document.documentElement).appendChild(layer);

    build();
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  }

  function start() {
    inject();
    window.addEventListener('resize', onResize);
    window.addEventListener('load', build); // re-measure once late content settles
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
