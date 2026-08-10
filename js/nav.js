/* Ladner Traps — top-nav, mega-menu, and mobile drawer */
(function () {
  "use strict";

  var MOBILE_MQ = "(max-width: 900px)";

  var MEGA_PREVIEWS = {
    all: null, // keep default markup
    traps: [
      {
        href: "/products/crab-traps",
        img: "assets/products/csp-2968.jpg",
        badge: "Commercial",
        title: "Crab Traps",
        desc: "Heavy-duty commercial frames for hard seasons.",
      },
      {
        href: "/products/prawn-traps",
        img: "assets/products/csp-2943.jpg",
        badge: "Commercial",
        title: "Prawn Traps",
        desc: "Clean handling, repeated West Coast sets.",
      },
      {
        href: "/products/black-cod-traps",
        img: "assets/commercial-black-cod-trap.webp",
        badge: "Commercial",
        title: "Black Cod Traps",
        desc: "Built for deep sets and demanding seasons.",
      },
    ],
    bait: [
      {
        href: "/products/prawn-bait",
        img: "assets/products/csp-2993.jpg",
        badge: "Skretting",
        title: "Skretting Prawn Bait",
        desc: "Premier Canadian distributor for Super Bait pellets.",
      },
      {
        href: "/products/prawn-bait",
        img: "assets/prawn-and-crab-oil-4-litre-bottle.webp",
        badge: "Super Bait",
        title: "Prawn Oil",
        desc: "Prawn and crab oil for bait preparation.",
      },
      {
        href: "/products/prawn-bait",
        img: "assets/super-prawn-bait-pellets-pail.webp",
        badge: "Pellets",
        title: "Prawn Bait Pellets",
        desc: "Prawn Super Bait pellets for commercial crews.",
      },
    ],
    anodes: [
      {
        href: "/products/zinc-anodes",
        img: "assets/solar-z22-oval-marine-zinc-anode.png",
        badge: "22 lb",
        title: "Z-22 Strap Anode",
        desc: "Large oval strap anode for commercial marine use.",
      },
      {
        href: "/products/zinc-anodes",
        img: "assets/2.5lb-sport-zinc-anode.png",
        badge: "2.5 lb",
        title: "2.5 lb Sport Zinc Anode",
        desc: "Square sport anode with ½\" bolt fitting.",
      },
      {
        href: "/products/zinc-anodes",
        img: "assets/4.5lb-round-marine-zinc-anode.png",
        badge: "4.5 lb",
        title: "4.5 lb Round Anode",
        desc: "Best-selling commercial spin-on zinc option.",
      },
    ],
    accessories: [
      {
        href: "/products/accessories",
        img: "assets/blue-commercial-rope-coils-2.jpg",
        badge: "Rigging",
        title: "Rope",
        desc: "Commercial rope for trap lines and deck use.",
      },
      {
        href: "/products/accessories",
        img: "assets/products/csp-2987.jpg",
        badge: "Hardware",
        title: "Rubber Snubber",
        desc: "Lid closure hardware for prawn traps.",
      },
      {
        href: "/products/accessories",
        img: "assets/red-commercial-buoy.jpg",
        badge: "Markers",
        title: "Floats & Buoys",
        desc: "Marking gear for trap strings.",
      },
    ],
  };

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function isMobileNav() {
    return window.matchMedia(MOBILE_MQ).matches;
  }

  function assetPrefix() {
    // Product pages live under /products/ and need ../assets
    return /\/products\//.test(window.location.pathname) ? "../" : "";
  }

  var closeMobileMenuFn = null;

  ready(function () {
    initMegaMenu();
    initMobileNav();
    initHashScroll();
  });

  function initHashScroll() {
    function scrollToHash() {
      if (!window.location.hash) return;
      var id = window.location.hash.slice(1);
      var el = document.getElementById(id);
      if (!el) return;
      requestAnimationFrame(function () {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
  }

  function renderMegaCards(container, items) {
    var prefix = assetPrefix();
    container.innerHTML = items
      .map(function (item) {
        return (
          '<a class="mm-card" href="' +
          item.href +
          '">' +
          '<div class="mm-card-thumb">' +
          '<img alt="' +
          item.title +
          '" src="' +
          prefix +
          item.img +
          '"/>' +
          '<span class="mm-card-badge">' +
          item.badge +
          "</span>" +
          "</div>" +
          '<div class="mm-card-meta">' +
          "<strong>" +
          item.title +
          "</strong>" +
          "<span>" +
          item.desc +
          "</span>" +
          "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  function initMegaMenu() {
    var navItems = document.querySelectorAll(".nav-item.nav-mega[data-mega]");
    navItems.forEach(function (item) {
      var parent = item.querySelector(".nav-parent");
      var panel = item.querySelector(".mega-panel");
      if (!parent || !panel) return;

      parent.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");

      var cards = panel.querySelector(".mega-cards");
      var defaultCardsHTML = cards ? cards.innerHTML : "";
      var subcats = panel.querySelectorAll(".mm-subcat[data-mega-cat]");

      subcats.forEach(function (sub) {
        var activate = function () {
          if (!cards || isMobileNav()) return;
          var key = sub.getAttribute("data-mega-cat");
          subcats.forEach(function (s) {
            s.classList.toggle("is-active", s === sub);
          });
          if (!key || key === "all" || !MEGA_PREVIEWS[key]) {
            cards.innerHTML = defaultCardsHTML;
            return;
          }
          renderMegaCards(cards, MEGA_PREVIEWS[key]);
        };
        sub.addEventListener("mouseenter", activate);
        sub.addEventListener("focus", activate);
      });

      var hoverTimeout = null;
      var setOpen = function (openState) {
        item.classList.toggle("is-open", openState);
        panel.setAttribute("aria-hidden", openState ? "false" : "true");
        parent.setAttribute("aria-expanded", openState ? "true" : "false");
        if (!openState) {
          if (cards) cards.innerHTML = defaultCardsHTML;
          subcats.forEach(function (s) {
            s.classList.remove("is-active");
          });
        }
      };
      var open = function () {
        if (isMobileNav()) return;
        clearTimeout(hoverTimeout);
        setOpen(true);
      };
      var close = function () {
        if (isMobileNav()) return;
        setOpen(false);
      };
      var delayClose = function () {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(close, 180);
      };

      // Mobile: tap Products to expand/collapse categories (don't navigate).
      // Desktop: leave href alone so middle-click / "open in new tab" still works.
      parent.addEventListener("click", function (e) {
        if (!isMobileNav()) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen(!item.classList.contains("is-open"));
      });

      item.addEventListener("mouseenter", open);
      item.addEventListener("mouseleave", delayClose);
      panel.addEventListener("mouseenter", open);
      panel.addEventListener("mouseleave", delayClose);

      parent.addEventListener("focus", open);
      panel.addEventListener("focusout", function (e) {
        if (!item.contains(e.relatedTarget)) close();
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
        // Products parent toggles the accordion; don't close the drawer.
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
