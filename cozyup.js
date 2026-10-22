(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const items = [...document.querySelectorAll('.reveal-item')];
  const heroText = document.querySelector('.case-facts');
  const heroImage = document.querySelector('.landing-page');
  const observedItems = items.filter((item) => item !== heroImage);

  items.forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${Math.min((index % 3) * 75, 150)}ms`);
  });
  if (heroImage) heroImage.style.setProperty('--reveal-delay', '0ms');

  let heroImageShown = false;
  const showHeroImage = () => {
    if (!heroImage || heroImageShown) return;
    heroImageShown = true;
    heroImage.classList.add('is-visible');
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
      if (entry.target === heroText) window.setTimeout(showHeroImage, 1150);
    });
  }, { threshold: 0.09, rootMargin: '0px 0px -7% 0px' });

  observedItems.forEach((item) => observer.observe(item));

  // Mobile browsers may delay the hero image or its observer callback.
  // Keep the reveal, but never leave the image permanently transparent.
  if (matchMedia('(max-width: 560px)').matches) {
    window.setTimeout(showHeroImage, 2200);
  }
})();
