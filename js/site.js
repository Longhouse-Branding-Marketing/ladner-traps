/* V33 Editorial Elevation — runtime enhancements
   - Injects marquee ticker strips between major sections
   - Reveals elements on scroll
   - Adds vertical labels on the hero
   No external dependencies. Safe to load with `defer`. */

(function () {
  "use strict";

  const ready = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  ready(function () {
    insertTickers();
    armReveal();
  });

  /* ---------- Marquee ticker injection ---------- */

  function makeTicker(items, variant) {
    const wrap = document.createElement("div");
    wrap.className = "lt-ticker" + (variant === "light" ? " lt-ticker-light" : "");
    wrap.setAttribute("aria-hidden", "true");

    const track = document.createElement("div");
    track.className = "lt-track";

    const buildRun = () => {
      items.forEach((it) => {
        const span = document.createElement("span");
        const dot = document.createElement("span");
        dot.className = "dot";
        span.appendChild(dot);

        if (it.b) {
          const b = document.createElement("b");
          b.textContent = it.b;
          span.appendChild(b);
        }
        if (it.t) {
          const t = document.createTextNode(" " + it.t);
          span.appendChild(t);
        }
        track.appendChild(span);
      });
    };

    // Build the run twice so the marquee can loop seamlessly via translateX(-50%)
    buildRun();
    buildRun();

    wrap.appendChild(track);
    return wrap;
  }

  function insertTickers() {
    // Each ticker is inserted *before* the first matching selector found in
    // `before`. Order is treated as a priority list — first hit wins. This
    // makes the script resilient to changes in section presence between
    // site versions (e.g. v32 had a prawn-traps section; v58 does not).
    const tickers = [
      {
        before: ["#quality"],
        variant: "dark",
        items: [
          { b: "Est. 1964", t: "Delta · British Columbia" },
          { b: "Pacific Coast", t: "California → Alaska" },
          { b: "Commercial Grade", t: "Crab · Prawn · Black Cod" },
          { b: "Rigging", t: "Rope · Snaps · Hooks · Floats" },
          { b: "Prawn Super Bait", t: "Premier Canadian Distributor" },
          { b: "Marine Zincs", t: "Traps · Docks · Vessels" },
        ],
      },
      {
        before: ["#prawn-bait", "#accessories", "#prawn-traps"],
        variant: "light",
        items: [
          { b: "Catalogue", t: "01 — Commercial Trap Lineup" },
          { b: "Spec.", t: "Heavy-duty frames · Commercial mesh" },
          { b: "Service", t: "Built for repeated sets" },
          { b: "Origin", t: "Delta · BC · 49°N 123°W" },
          { b: "File №", t: "LT-CAT-2026" },
        ],
      },
      {
        before: ["#history"],
        variant: "dark",
        items: [
          { b: "Chapter 02", t: "Origin · 1964" },
          { b: "Made on the Water", t: "By fishermen, for fishermen" },
          { b: "Word of Mouth", t: "Reputation earned the hard way" },
          { b: "Today", t: "Carried forward by Sealtech Manufacturing" },
          { b: "Standard", t: "Practical · Durable · Honest" },
        ],
      },
      {
        before: ["#how-to-buy", "#distributors"],
        variant: "light",
        items: [
          { b: "Order Path", t: "Commercial direct · Sport through distributors" },
          { b: "Distributors", t: "Pacific Net & Twine · LFS Marine" },
          { b: "Coverage", t: "BC · WA · OR · CA · AK" },
          { b: "Ports", t: "Delta · Bellingham · Ketchikan · SF" },
          { b: "Sales", t: "sales@ladnertraps.com · (604) 946-0281" },
        ],
      },
      {
        before: ["#contact"],
        variant: "dark",
        items: [
          { b: "Hours", t: "Mon–Fri  8 a.m. – 4:30 p.m." },
          { b: "Phone", t: "(604) 946-0281" },
          { b: "Sales", t: "sales@ladnertraps.com" },
          { b: "Support", t: "support@ladnertraps.com" },
          { b: "Address", t: "3593 River Road West · Delta · BC · V4K 3N2" },
        ],
      },
    ];

    tickers.forEach((cfg) => {
      // Find first selector in priority list that actually exists.
      let target = null;
      for (const sel of cfg.before) {
        target = document.querySelector(sel);
        if (target && target.parentNode) break;
      }
      if (!target || !target.parentNode) return;
      const ticker = makeTicker(cfg.items, cfg.variant);
      target.parentNode.insertBefore(ticker, target);
    });
  }

  /* ---------- Reveal on scroll ---------- */

  function armReveal() {
    if (typeof IntersectionObserver === "undefined") return;

    const candidates = document.querySelectorAll(
      [
        ".hero-card",
        ".brand-strip-grid > div",
        ".quality-panel",
        ".quality-point",
        ".product-card",
        ".crab-hero-panel",
        ".crab-card",
        ".crab-cta",
        ".accessories-hero",
        ".accessory-card",
        ".accessories-proof",
        ".bait-hero-panel",
        ".bait-product-card",
        ".bait-proof-row",
        ".zinc-hero-panel",
        ".zinc-card",
        ".zinc-note",
        ".zinc-order-sheet",
        ".zinc-order-contact",
        ".history-hero",
        ".history-panel",
        ".history-step",
        ".history-bottom",
        ".territory-panel",
        ".buy-path-card",
        ".buy-path-note",
        ".dist-card",
        ".address-card",
        ".contact-card",
        ".quote-card",
        "form",
        ".section-head",
      ].join(",")
    );

    candidates.forEach((el, i) => {
      el.classList.add("lt-reveal");
      // Mild stagger inside grids
      const parent = el.parentElement;
      const sib = parent ? Array.prototype.indexOf.call(parent.children, el) : 0;
      el.style.transitionDelay = Math.min(sib * 70, 420) + "ms";
    });

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    candidates.forEach((el) => obs.observe(el));
  }
})();
