/* Ladner Traps — top-nav + mega-menu interactions */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var navItems = document.querySelectorAll(".nav-item.nav-mega[data-mega]");
    navItems.forEach(function (item) {
      var parent = item.querySelector(".nav-parent");
      var panel = item.querySelector(".mega-panel");
      if (!parent || !panel) return;

      var hoverTimeout = null;
      var open = function () {
        clearTimeout(hoverTimeout);
        item.classList.add("is-open");
        panel.setAttribute("aria-hidden", "false");
      };
      var close = function () {
        item.classList.remove("is-open");
        panel.setAttribute("aria-hidden", "true");
      };
      var delayClose = function () {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(close, 180);
      };

      item.addEventListener("mouseenter", open);
      item.addEventListener("mouseleave", delayClose);
      panel.addEventListener("mouseenter", open);
      panel.addEventListener("mouseleave", delayClose);

      // Keyboard: open when parent focused
      parent.addEventListener("focus", open);
      panel.addEventListener("focusout", function (e) {
        if (!item.contains(e.relatedTarget)) close();
      });

      // Close on Escape
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") close();
      });
    });
  });
})();
