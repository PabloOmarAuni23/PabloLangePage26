(function () {
  "use strict";

  const siteNav = document.querySelector(".site-nav");
  const siteLinks = document.querySelectorAll(".site-nav__link");
  const cartaSection = document.getElementById("carta");

  function getCartaScrollOffset() {
    let offset = 12;
    if (siteNav) offset += siteNav.offsetHeight;
    return offset;
  }

  siteLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        if (href === "#carta") {
          const y =
            target.getBoundingClientRect().top +
            window.pageYOffset -
            getCartaScrollOffset();
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        } else {
          target.scrollIntoView({ behavior: "smooth" });
        }
        history.replaceState(null, "", href);
      }
    });
  });

  const scrollSections = document.querySelectorAll("[data-nav-section]");
  if (scrollSections.length && siteLinks.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          siteLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    scrollSections.forEach((el) => navObserver.observe(el));
  }

  const slider = document.querySelector(".hero-slider");
  if (siteNav && slider) {
    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("is-scrolled", !entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    headerObserver.observe(slider);
  }
})();
