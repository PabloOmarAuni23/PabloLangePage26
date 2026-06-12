(function () {
  "use strict";

  let revealObserver = null;

  function initCompactToggle() {
    const compactButton = document.getElementById("btn-compact-menu");
    if (!compactButton || compactButton.dataset.ready) return;

    compactButton.dataset.ready = "true";
    compactButton.addEventListener("click", () => {
      const compact = !document.body.classList.contains("menu-compact");
      document.body.classList.toggle("menu-compact", compact);
      compactButton.setAttribute("aria-pressed", compact ? "true" : "false");
      compactButton.textContent = compact ? "Ver detalles" : "Ver solo precios";
    });
  }

  function initRevealAnimations() {
    const items = document.querySelectorAll(
      ".story-section, .photo-break, .visit-section, .carta-block, .carta-photos"
    );
    if (!items.length) return;

    if (revealObserver) revealObserver.disconnect();

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    items.forEach((item) => {
      item.classList.add("reveal-on-scroll");
      revealObserver.observe(item);
    });
  }

  function initMenuInteractions() {
    initCompactToggle();
    initRevealAnimations();
  }

  document.addEventListener("menu:rendered", initMenuInteractions);
  document.addEventListener("DOMContentLoaded", initMenuInteractions);

  if (window.__menuReady) {
    initMenuInteractions();
  }
})();
