/* ==========================================================================
   Blueprint Code — global site chrome behaviour.
   SINGLE SOURCE OF TRUTH for header/footer JS (currently the mobile menu).
   Linked on every page; safe to load more than once.
   ========================================================================== */
(function () {
  // When a page is shown inside an iframe (e.g. embedded in the demo viewer),
  // hide the site chrome so the embed shows only the demo — not a nav/footer
  // the visitor could use to wander the whole site inside the frame.
  var embedded;
  try { embedded = window.top !== window.self; } catch (e) { embedded = true; }
  if (embedded) {
    var hideChrome = function () {
      document.documentElement.classList.add('bpc-embedded');
      var els = document.querySelectorAll('.bpc-chrome');
      for (var i = 0; i < els.length; i++) els[i].style.display = 'none';
    };
    hideChrome();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideChrome);
    }
    return; // no menu behaviour needed for an embedded page
  }

  function init() {
    var heads = document.querySelectorAll('.bpc-head');
    for (var i = 0; i < heads.length; i++) {
      var head = heads[i];
      if (head.getAttribute('data-bpc-bound')) continue;
      head.setAttribute('data-bpc-bound', '1');

      var burger = head.querySelector('.bpc-burger');
      if (!burger) continue;

      (function (head, burger) {
        burger.addEventListener('click', function () {
          var open = head.classList.toggle('bpc-open');
          burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      })(head, burger);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
