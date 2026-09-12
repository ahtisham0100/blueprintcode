/* Reports this page's height to the parent so the embedding iframe can size
   itself to the content (no nested scrollbars). Height-only message. */
(function () {
  function report() {
    try {
      var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
      parent.postMessage({ __bpcHeight: h }, '*');
    } catch (e) { /* ignore */ }
  }
  if (window.ResizeObserver) new ResizeObserver(report).observe(document.documentElement);
  window.addEventListener('load', report);
  window.addEventListener('resize', report);
  report();
})();
