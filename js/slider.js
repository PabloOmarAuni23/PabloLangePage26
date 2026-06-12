(function () {
  "use strict";

  const slider = document.querySelector(".hero-slider");
  if (!slider) return;

  const track = slider.querySelector(".hero-slider__track");
  const slides = slider.querySelectorAll(".hero-slider__slide");
  const dotsContainer = slider.querySelector(".hero-slider__dots");
  const btnPrev = slider.querySelector(".hero-slider__btn--prev");
  const btnNext = slider.querySelector(".hero-slider__btn--next");

  if (!slides.length) return;

  let index = 0;
  let timer = null;
  const interval = 5500;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-slider__dot";
    dot.setAttribute("aria-label", "Ir a imagen " + (i + 1));
    if (i === 0) {
      dot.classList.add("is-active");
      dot.setAttribute("aria-current", "true");
    }
    dot.addEventListener("click", () => goTo(i, true));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll(".hero-slider__dot");

  function goTo(i, userAction) {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, n) => {
      slide.classList.toggle("is-active", n === index);
      slide.setAttribute("aria-hidden", n === index ? "false" : "true");
    });
    dots.forEach((dot, n) => {
      const active = n === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
    if (userAction) resetTimer();
  }

  function next() {
    goTo(index + 1, false);
  }

  function prev() {
    goTo(index - 1, false);
  }

  function resetTimer() {
    if (reducedMotion) return;
    clearInterval(timer);
    timer = setInterval(next, interval);
  }

  if (btnNext) btnNext.addEventListener("click", () => next());
  if (btnPrev) btnPrev.addEventListener("click", () => prev());

  slider.addEventListener("mouseenter", () => clearInterval(timer));
  slider.addEventListener("mouseleave", resetTimer);
  slider.addEventListener("focusin", () => clearInterval(timer));
  slider.addEventListener("focusout", resetTimer);

  let touchStartX = 0;
  track.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  track.addEventListener(
    "touchend",
    (e) => {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) < 50) return;
      if (diff < 0) next();
      else prev();
      resetTimer();
    },
    { passive: true }
  );

  if (!reducedMotion) resetTimer();
})();
