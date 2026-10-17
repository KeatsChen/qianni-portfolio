const boards = [...document.querySelectorAll('.more-gallery figure')];

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  boards.forEach((board) => board.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
  boards.forEach((board) => observer.observe(board));
}
