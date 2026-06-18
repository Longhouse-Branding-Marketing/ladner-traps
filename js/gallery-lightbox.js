/* Product gallery lightbox — enlarges .crab-gallery photos on click.
   No external dependencies. Safe to load with `defer`. */

(function () {
  "use strict";

  const ready = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  ready(function () {
    const galleries = document.querySelectorAll(".crab-gallery");
    if (!galleries.length) return;

    const root = document.createElement("div");
    root.className = "lt-lightbox";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Enlarged product photo");
    root.setAttribute("aria-hidden", "true");
    root.hidden = true;
    root.innerHTML =
      '<button type="button" class="lt-lightbox-close" aria-label="Close enlarged photo">&times;</button>' +
      '<button type="button" class="lt-lightbox-prev" aria-label="Previous photo"><span aria-hidden="true">&larr;</span></button>' +
      '<button type="button" class="lt-lightbox-next" aria-label="Next photo"><span aria-hidden="true">&rarr;</span></button>' +
      '<div class="lt-lightbox-backdrop" tabindex="-1"></div>' +
      '<figure class="lt-lightbox-stage">' +
      '<img class="lt-lightbox-image" alt="" decoding="async" />' +
      '<figcaption class="lt-lightbox-caption">' +
      '<p class="lt-lightbox-title"></p>' +
      '<p class="lt-lightbox-desc"></p>' +
      '<p class="lt-lightbox-count" aria-live="polite"></p>' +
      "</figcaption>" +
      "</figure>";

    document.body.appendChild(root);

    const imageEl = root.querySelector(".lt-lightbox-image");
    const titleEl = root.querySelector(".lt-lightbox-title");
    const descEl = root.querySelector(".lt-lightbox-desc");
    const countEl = root.querySelector(".lt-lightbox-count");
    const prevBtn = root.querySelector(".lt-lightbox-prev");
    const nextBtn = root.querySelector(".lt-lightbox-next");
    const closeBtn = root.querySelector(".lt-lightbox-close");
    const backdrop = root.querySelector(".lt-lightbox-backdrop");

    let items = [];
    let index = 0;
    let lastFocus = null;

    function collectItems(gallery) {
      return Array.from(gallery.querySelectorAll(".crab-card"))
        .map(function (card) {
          const img = card.querySelector(".crab-img img");
          const title = card.querySelector(".crab-card-body h3");
          const desc = card.querySelector(".crab-card-body p");
          if (!img || !img.src) return null;
          return {
            card: card,
            src: img.currentSrc || img.src,
            alt: img.alt || "",
            title: title ? title.textContent.trim() : "",
            desc: desc ? desc.textContent.trim() : "",
          };
        })
        .filter(Boolean);
    }

    function render() {
      const item = items[index];
      if (!item) return;

      imageEl.src = item.src;
      imageEl.alt = item.alt;
      titleEl.textContent = item.title;
      descEl.textContent = item.desc;
      countEl.textContent = items.length > 1 ? index + 1 + " / " + items.length : "";

      const solo = items.length <= 1;
      prevBtn.hidden = solo;
      nextBtn.hidden = solo;
      titleEl.hidden = !item.title;
      descEl.hidden = !item.desc;
    }

    function open(gallery, card) {
      items = collectItems(gallery);
      if (!items.length) return;

      const startIndex = items.findIndex(function (item) {
        return item.card === card;
      });
      index = startIndex >= 0 ? startIndex : 0;
      lastFocus = document.activeElement;
      render();

      root.hidden = false;
      root.setAttribute("aria-hidden", "false");
      document.body.classList.add("lt-lightbox-open");
      closeBtn.focus();
    }

    function close() {
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lt-lightbox-open");
      imageEl.removeAttribute("src");

      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
      lastFocus = null;
    }

    function step(delta) {
      if (items.length <= 1) return;
      index = (index + delta + items.length) % items.length;
      render();
    }

    galleries.forEach(function (gallery) {
      gallery.querySelectorAll(".crab-card").forEach(function (card) {
        const trigger = card.querySelector(".crab-img");
        const title = card.querySelector(".crab-card-body h3");
        if (!trigger) return;

        trigger.classList.add("lt-gallery-trigger");
        trigger.setAttribute("role", "button");
        trigger.setAttribute("tabindex", "0");
        trigger.setAttribute(
          "aria-label",
          "View enlarged photo" + (title ? ": " + title.textContent.trim() : "")
        );

        trigger.addEventListener("click", function () {
          open(gallery, card);
        });

        trigger.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open(gallery, card);
          }
        });
      });
    });

    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    prevBtn.addEventListener("click", function () {
      step(-1);
    });
    nextBtn.addEventListener("click", function () {
      step(1);
    });

    document.addEventListener("keydown", function (event) {
      if (root.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    });
  });
})();
