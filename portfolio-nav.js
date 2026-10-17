const sharedNav = document.querySelector('.site-nav');

if (sharedNav) {
  const languageKey = 'qianni-portfolio-language';
  const languageSessionKey = 'qianni-portfolio-language-initialized';
  if (sessionStorage.getItem(languageSessionKey) !== '1') {
    localStorage.setItem(languageKey, 'en');
    sessionStorage.setItem(languageSessionKey, '1');
  }
  const languageButtons = [...sharedNav.querySelectorAll('[data-lang]')];

  const applyLanguage = (language, broadcast = false) => {
    const nextLanguage = language === 'zh' ? 'zh' : 'en';
    localStorage.setItem(languageKey, nextLanguage);
    document.documentElement.lang = nextLanguage === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach((element) => {
      element.textContent = element.dataset[nextLanguage] || element.dataset.en;
    });
    languageButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.lang === nextLanguage);
      button.setAttribute('aria-pressed', String(button.dataset.lang === nextLanguage));
    });
    if (broadcast && window.parent !== window) {
      window.parent.postMessage({ type: 'portfolio-language-change', language: nextLanguage }, location.origin);
    }
  };

  languageButtons.forEach((button) => {
    button.addEventListener('click', () => applyLanguage(button.dataset.lang, true));
  });
  applyLanguage(localStorage.getItem(languageKey) || 'en');
  window.addEventListener('storage', (event) => {
    if (event.key === languageKey && (event.newValue === 'zh' || event.newValue === 'en')) applyLanguage(event.newValue);
  });

  const navHideExtent = document.body.matches('.light-detail-nav, .materials-page') ? 104 : 72;
  let previousY = window.scrollY;
  let hideDistance = 0;
  let ticking = false;
  const renderNavProgress = () => {
    const progress = Math.min(1, hideDistance / navHideExtent);
    sharedNav.style.setProperty('--nav-hide-progress', progress.toFixed(3));
    sharedNav.style.pointerEvents = progress > .96 ? 'none' : '';
  };
  const updateNav = () => {
    ticking = false;
    const currentY = window.scrollY;
    const rawDelta = currentY - previousY;
    const delta = Math.max(-20, Math.min(20, rawDelta));
    if (currentY <= 12) hideDistance = 0;
    else if (delta > 0) hideDistance = Math.min(navHideExtent, hideDistance + delta);
    previousY = currentY;
    renderNavProgress();
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateNav);
  }, { passive: true });
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', (event) => {
      if (event.clientY <= 92) hideDistance = 0;
      else if (window.scrollY > 12) hideDistance = navHideExtent;
      renderNavProgress();
    }, { passive: true });
  }
  renderNavProgress();
}
