/* Ladner Traps — top-nav, mega-menu, and mobile drawer */
(function () {
  "use strict";

  var MOBILE_MQ = "(max-width: 900px)";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function isMobileNav() {
    return window.matchMedia(MOBILE_MQ).matches;
  }

  var closeMobileMenuFn = null;

  ready(function () {
    initMegaMenu();
    initMobileNav();
  });

  function initMegaMenu() {
    var navItems = document.querySelectorAll(".nav-item.nav-mega[data-mega]");
    navItems.forEach(function (item) {
      var parent = item.querySelector(".nav-parent");
      var panel = item.querySelector(".mega-panel");
      if (!parent || !panel) return;

      parent.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");

      var hoverTimeout = null;
      var open = function () {
        if (isMobileNav()) return;
        clearTimeout(hoverTimeout);
        item.classList.add("is-open");
        panel.setAttribute("aria-hidden", "false");
      };
      var close = function () {
        if (isMobileNav()) return;
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

      parent.addEventListener("focus", open);
      panel.addEventListener("focusout", function (e) {
        if (!item.contains(e.relatedTarget)) close();
      });

      parent.addEventListener("click", function (e) {
        if (!isMobileNav()) return;
        e.preventDefault();
        var expanded = item.classList.toggle("is-open");
        parent.setAttribute("aria-expanded", expanded ? "true" : "false");
        panel.setAttribute("aria-hidden", expanded ? "false" : "true");
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          if (isMobileNav() && closeMobileMenuFn) {
            closeMobileMenuFn();
          } else if (!isMobileNav()) {
            close();
          }
        }
      });
    });
  }

  function initMobileNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-menu-toggle");
    var nav = document.getElementById("primary-nav");
    var backdrop = document.querySelector(".nav-backdrop");
    if (!header || !toggle || !nav) return;

    var openMenu = function () {
      document.body.classList.add("is-nav-open");
      header.classList.add("is-menu-open");
      toggle.setAttribute("aria-expanded", "true");
      if (backdrop) {
        backdrop.hidden = false;
      }
      document.body.style.overflow = "hidden";
    };

    var closeMenu = function () {
      document.body.classList.remove("is-nav-open");
      header.classList.remove("is-menu-open");
      toggle.setAttribute("aria-expanded", "false");
      if (backdrop) {
        backdrop.hidden = true;
      }
      document.body.style.overflow = "";
      nav.querySelectorAll(".nav-item.nav-mega.is-open").forEach(function (item) {
        item.classList.remove("is-open");
        var parent = item.querySelector(".nav-parent");
        var panel = item.querySelector(".mega-panel");
        if (parent) parent.setAttribute("aria-expanded", "false");
        if (panel) panel.setAttribute("aria-hidden", "true");
      });
    };

    closeMobileMenuFn = closeMenu;

    toggle.addEventListener("click", function () {
      if (document.body.classList.contains("is-nav-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeMenu);
    }

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (!isMobileNav()) return;
        if (link.classList.contains("nav-parent")) return;
        closeMenu();
      });
    });

    window.addEventListener("resize", function () {
      if (!isMobileNav() && document.body.classList.contains("is-nav-open")) {
        closeMenu();
      }
    });
  }
})();
