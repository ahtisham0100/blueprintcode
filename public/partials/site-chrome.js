/* ==========================================================================
   Blueprint Code — global site chrome behaviour.
   SINGLE SOURCE OF TRUTH for header/footer JS (currently the mobile menu).
   Linked on every page; safe to load more than once.
   ========================================================================== */
(function () {
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
