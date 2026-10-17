const illustrations = [...document.querySelectorAll('.illustration-grid figure')];
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  illustrations.forEach((illustration) => illustration.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  illustrations.forEach((illustration, index) => {
    illustration.style.transitionDelay = `${index * 55}ms`;
    observer.observe(illustration);
  });
}
