const revealTargets = [
  document.querySelector('.project-info'),
  ...document.querySelectorAll('.project-gallery img'),
].filter(Boolean);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((target) => target.classList.add('visible'));
} else {
  revealTargets.forEach((target) => target.classList.add('reveal'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach((target) => observer.observe(target));
}
