(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const items = [...document.querySelectorAll('.reveal-item')];
  const isMobile = matchMedia('(max-width: 560px)').matches;
  const heroText = document.querySelector('.detail-overview') || document.querySelector(isMobile ? '.mobile-overview-meta' : '.case-facts');
  const heroScreens = [...document.querySelectorAll('.hero-phones > .reveal-item')];
  const observedItems = items.filter((item) => !heroScreens.includes(item));

  items.forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${Math.min((index % 3) * 75, 150)}ms`);
  });

  heroScreens.forEach((screen, index) => {
    screen.style.setProperty('--reveal-delay', `${index * 110}ms`);
  });

  let heroScreensShown = false;
  const showHeroScreens = () => {
    if (heroScreensShown) return;
    heroScreensShown = true;
    heroScreens.forEach((screen) => screen.classList.add('is-visible'));
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);

      if (entry.target === heroText) {
        window.setTimeout(showHeroScreens, 1150);
      }
    });
  }, { threshold: 0.09, rootMargin: '0px 0px -7% 0px' });

  observedItems.forEach((item) => observer.observe(item));
  if (heroText && !observedItems.includes(heroText)) observer.observe(heroText);
  if (isMobile) window.setTimeout(showHeroScreens, 2200);
})();
