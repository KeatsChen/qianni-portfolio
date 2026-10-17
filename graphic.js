const posters = [...document.querySelectorAll('.poster-grid figure')];
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  posters.forEach((poster) => poster.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  posters.forEach((poster, index) => {
    poster.style.transitionDelay = `${index * 55}ms`;
    observer.observe(poster);
  });
}
