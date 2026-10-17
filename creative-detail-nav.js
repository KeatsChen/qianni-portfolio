const creativeWorkHeader = document.querySelector('.work-type-header');

if (creativeWorkHeader) {
  const languageKey = 'qianni-portfolio-language';
  const languageButtons = [...creativeWorkHeader.querySelectorAll('[data-lang]')];

  const applyCreativeLanguage = (language, broadcast = false) => {
    const selected = language === 'zh' ? 'zh' : 'en';
    localStorage.setItem(languageKey, selected);
    document.documentElement.lang = selected === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach((element) => {
      element.textContent = element.dataset[selected] || element.dataset.en;
    });
    languageButtons.forEach((button) => {
      const active = button.dataset.lang === selected;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (broadcast && window.parent !== window) {
      window.parent.postMessage({ type: 'portfolio-language-change', language: selected }, location.origin);
    }
  };

  languageButtons.forEach((button) => {
    button.addEventListener('click', () => applyCreativeLanguage(button.dataset.lang, true));
  });
  applyCreativeLanguage(localStorage.getItem(languageKey) || 'en');

  let previousY = window.scrollY;
  let hideDistance = 0;
  let ticking = false;
  const renderNav = () => {
    const progress = Math.min(1, hideDistance / 72);
    creativeWorkHeader.style.setProperty('--nav-hide-progress', progress.toFixed(3));
    creativeWorkHeader.style.pointerEvents = progress > .96 ? 'none' : '';
  };
  const updateNav = () => {
    ticking = false;
    const currentY = window.scrollY;
    const delta = Math.max(-20, Math.min(20, currentY - previousY));
    if (currentY <= 12) hideDistance = 0;
    else if (delta > 0) hideDistance = Math.min(72, hideDistance + delta);
    previousY = currentY;
    renderNav();
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateNav);
  }, { passive: true });
  renderNav();
}
