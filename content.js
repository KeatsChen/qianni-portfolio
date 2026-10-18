const workTypeHeader = document.querySelector('.work-type-header');
const contentPage = document.querySelector('.content-page');
const projectIndex = document.querySelector('.project-index');
const projectGallery = document.querySelector('.project-gallery');
const tabButtons = [...document.querySelectorAll('[data-work-tab]')];
const backButtonHTML = projectIndex.querySelector('.back-button').outerHTML;
const uiuxIndexHTML = projectIndex.innerHTML;
const uiuxGalleryHTML = projectGallery.innerHTML;
const languageKey = 'qianni-portfolio-language';
const languageSessionKey = 'qianni-portfolio-language-initialized';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

document.addEventListener('click', (event) => {
  const backButton = event.target.closest('.back-button');
  if (!backButton) return;

  // In a regular page, keep the anchor's native navigation. The custom
  // close behavior is only needed when the portfolio is opened in an iframe.
  if (window.self === window.top) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const targetOrigin = location.origin === 'null' ? '*' : location.origin;
  window.parent.postMessage({ type: 'close-portfolio-page' }, targetOrigin);
}, true);

document.addEventListener('click', (event) => {
  const projectCard = event.target.closest('.gallery-card[href]');
  if (!projectCard) return;
  event.preventDefault();
  window.location.assign(projectCard.href);
});

if (sessionStorage.getItem(languageSessionKey) !== '1') {
  localStorage.setItem(languageKey, 'en');
  sessionStorage.setItem(languageSessionKey, '1');
}
let currentTab = 'uiux';
let activeCleanup = () => {};
let tabAnimationTimer = 0;
let tabEntranceObserver = null;

function prepareTabEntranceAnimations() {
  tabEntranceObserver?.disconnect();
  tabEntranceObserver = null;
  const entranceStartedAt = performance.now();

  let textElements = [...document.querySelectorAll([
    '.project-index .category-summary h1',
    '.project-index .project-row time',
    '.project-index .project-row > span',
    '.graphic-editorial-copy > p',
    '.graphic-editorial-copy dt',
    '.graphic-editorial-copy .category-date',
    '.illustration-editorial-copy > p',
    '.illustration-editorial-copy dt',
    '.illustration-editorial-copy .category-date',
    '.motion-intro > p',
    '.motion-intro dt',
    '.motion-intro .category-date',
    '.personal-tutorial-heading h2',
    '.personal-tutorial-heading p',
    '.personal-vlog-lead > span',
    '.personal-articles h2',
    '.personal-articles a > span',
    '.personal-articles time'
  ].join(','))].filter((element) => !element.matches('.category-date dt'));
  if (currentTab === 'uiux') {
    textElements = textElements.filter((element) => !element.closest('.project-row'));
  }
  const language = document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
  textElements.forEach((element, groupIndex) => {
    const source = element.classList.contains('category-date')
      ? `/ ${element.querySelector('dt')?.textContent.trim() || '2026'}`
      : element.dataset[language] || element.textContent;
    const pieces = element.classList.contains('category-date')
      ? [source.trim()]
      : language === 'zh' ? Array.from(source) : source.split(/(\s+)/);
    const fragment = document.createDocumentFragment();
    let tokenIndex = 0;
    pieces.forEach((piece) => {
      if (/^\s+$/.test(piece)) {
        fragment.appendChild(document.createTextNode(piece));
        return;
      }
      const token = document.createElement('span');
      token.className = 'tab-blur-text-token';
      token.style.setProperty('--word-index', tokenIndex++);
      token.textContent = piece;
      fragment.appendChild(token);
    });
    element.replaceChildren(fragment);
    element.classList.add('tab-blur-text');
    element.classList.toggle('tab-intro-copy', !element.matches('h1, h2'));
    element.classList.remove('is-visible');
    element.style.setProperty('--block-delay', `${Math.min(groupIndex * 30, 180)}ms`);
  });

  let imageElements = [...projectGallery.querySelectorAll([
    '.gallery-card',
    '.graphic-grid-poster',
    '.illustration-card',
    '.motion-showcase-card',
    '.personal-tutorial-card',
    '.personal-vlog-row'
  ].join(','))].filter((element) => currentTab !== 'uiux' || !element.classList.contains('gallery-card'));
  if (currentTab === 'uiux') {
    imageElements = [...projectIndex.querySelectorAll('.project-row'), ...imageElements];
  }
  const imageStartDelay = 1000;
  imageElements.forEach((element, index) => {
    element.classList.add('tab-image-reveal');
    const isTwoColumnEditorial = currentTab === 'graphic' || currentTab === 'illustration';
    const isMotionEditorial = currentTab === 'motion';
    let delay = Math.min(index * 180, 720);
    if (currentTab === 'personal' && element.classList.contains('personal-vlog-row')) {
      delay = 0;
    }
    if (isTwoColumnEditorial || isMotionEditorial) {
      delay = imageStartDelay + index * 180;
      element.dataset.editorialRevealTarget = String(delay);
    }
    element.style.setProperty('--tab-image-delay', `${delay}ms`);
  });

  const animatedElements = [...textElements, ...imageElements];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    animatedElements.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  tabEntranceObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const revealTarget = Number(entry.target.dataset.editorialRevealTarget);
      if (Number.isFinite(revealTarget)) {
        const remainingDelay = Math.max(0, revealTarget - (performance.now() - entranceStartedAt));
        entry.target.style.setProperty('--tab-image-delay', `${Math.round(remainingDelay)}ms`);
      }
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: currentTab === 'motion' ? '0px' : '0px 0px -7% 0px' });
  requestAnimationFrame(() => requestAnimationFrame(() => animatedElements.forEach((element) => tabEntranceObserver?.observe(element))));
}

const personalTutorialImages = [
  'https://xhslink.cn/o/17CsOPdtjP4',
  'https://xhslink.cn/o/2XmJJ0nuV9o',
  'https://xhslink.cn/o/8BhsbI3X8YO',
  'https://xhslink.cn/o/4VyutLIqsBM',
  'https://xhslink.cn/o/4f2m4xH4H2l',
  'https://xhslink.cn/o/5c7pLOL0yFB'
].map((href, index) => ({
  href,
  src: `assets/personal-space/tutorial-${String(index + 1).padStart(2, '0')}.png?v=1`,
  alt: `Tutorial work ${index + 1}`
}));
const personalTutorialCards = (hidden = false) => personalTutorialImages.map(({ href, src, alt }) => `<a class="personal-tutorial-card" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${hidden ? '' : `Open ${alt}`}"${hidden ? ' aria-hidden="true" tabindex="-1"' : ''}><img src="${src}" alt="${hidden ? '' : alt}" /></a>`).join('');

const illustrationWorks = [
  { file: 6, credit: '临摹自ins@oimo' },
  { file: 11, credit: '原创作品' },
  { file: 13, credit: '临摹自ins@leimelendres' },
  { file: 4, credit: '临摹自ins@leimelendres' },
  { file: 9, credit: '临摹自ins@leimelendres' },
  { file: 12, credit: '临摹自ins@leimelendres' },
  { file: 3, credit: '临摹自ins@leimelendres' },
  { file: 1, credit: '临摹自ins@leimelendres' },
  { file: 7, credit: '临摹自ins@leimelendres' },
  { file: 5, credit: '临摹自ins@leimelendres' },
  { file: 2, credit: '临摹自ins@leimelendres' },
  { file: 8, credit: '临摹自ins@leimelendres' }
].map((work, index) => ({
  ...work,
  src: `assets/illustration/direct/illustration-${String(work.file).padStart(2, '0')}.png?v=2`,
  alt: `Illustration work ${index + 1}`
}));
const illustrationGrid = () => `<section class="illustration-editorial-layout" aria-label="Illustration works"><aside class="illustration-editorial-copy"><p data-en="Playful characters and visual stories shaped through line, form, and imagination." data-zh="以线条、形态与想象，描绘有趣的角色和视觉故事。">Playful characters and visual stories shaped through line, form, and imagination.</p><dl><div><dt data-en="Illustration" data-zh="插画">Illustration</dt></div><div><dt data-en="Visual Storytelling" data-zh="视觉叙事">Visual Storytelling</dt></div><div class="category-date"><span aria-hidden="true">/</span><dt>2026</dt></div></dl></aside><div class="illustration-scroll-region" tabindex="0" aria-label="Scrollable Illustration gallery"><div class="illustration-gallery">${illustrationWorks.map(({ src, alt, credit }) => `<button class="illustration-card" type="button" data-poster-src="${src}" aria-label="View ${alt}"><img src="${src}" alt="${alt}" /><span>${credit}</span></button>`).join('')}</div><footer class="illustration-scroll-copyright" aria-hidden="true">© 2026 Designed by Qianni Zhong. All Rights Reserved.</footer></div></section><div class="graphic-lightbox illustration-lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Illustration preview"><button class="graphic-lightbox-backdrop" type="button" aria-label="Close illustration preview"></button><figure><img src="" alt="Selected illustration" /></figure></div>`;

const motionFiles = ['motion-design.mp4', ...Array.from({ length: 8 }, (_, i) => `motion-design-${i + 2}.mp4`)];
const motionBackgrounds = ['#030314', '#030314', '#05040f', '#09090d', '#06080b', '#050508', '#08060d', '#01010b', '#e6f3ff'];
const motionTools = (index) => `<span class="motion-card-tools" aria-label="Created with Rive and Figma"><img src="assets/motion-tools/rive.png?v=1" alt="Rive" /><img src="assets/motion-tools/figma.png?v=1" alt="Figma" /></span>`;
const motionShowcase = () => `<section class="motion-showcase" aria-label="Motion design experiments"><div class="motion-intro"><p data-en="Selected motion experiments exploring interaction, rhythm, and expressive transitions." data-zh="精选动效实验，探索交互、节奏与富有表现力的转场。">Selected motion experiments exploring interaction, rhythm, and expressive transitions.</p><dl><div><dt data-en="Motion Design" data-zh="动效设计">Motion Design</dt></div><div><dt data-en="Interaction" data-zh="交互">Interaction</dt></div><div class="category-date"><span aria-hidden="true">/</span><dt>2026</dt></div></dl></div><div class="motion-showcase-list">${motionFiles.map((file, index) => `<article class="motion-showcase-card${index === 7 ? ' is-portrait' : ''}" style="--motion-bg:${motionBackgrounds[index]}" role="button" tabindex="0" aria-label="Play Motion Study ${String(index + 1).padStart(2, '0')} with sound"><header><span data-en="Motion Study ${String(index + 1).padStart(2, '0')}" data-zh="动效练习 ${String(index + 1).padStart(2, '0')}">Motion Study ${String(index + 1).padStart(2, '0')}</span>${motionTools(index)}</header><div class="motion-showcase-media"><video muted loop playsinline preload="metadata" aria-label="Motion design work ${index + 1}" src="assets/${file}"></video></div></article>`).join('')}</div></section><div class="motion-lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Motion work player"><div class="motion-lightbox-card"><header><span></span>${motionTools(0)}</header><div class="motion-lightbox-media"><video loop playsinline preload="auto"></video></div></div></div>`;

const graphicPosters = [3, 7, 5, 8, 6, 2];
const graphicPoster = (poster, index) => `<button class="graphic-grid-poster" type="button" data-poster-src="assets/posters/poster-${String(poster).padStart(2, '0')}.png?v=8" aria-label="View Graphic Design poster ${index + 1}"><img src="assets/posters/poster-${String(poster).padStart(2, '0')}.png?v=8" alt="Graphic Design poster ${index + 1}" /></button>`;

const categoryData = {
  graphic: {
    title: 'Graphic Design', zhTitle: '平面设计', directGallery: true,
    cards: `
      <section class="graphic-editorial-layout" aria-label="Graphic Design selected posters">
        <aside class="graphic-editorial-copy">
          <p data-en="Graphic explorations shaped through typography, composition, and visual rhythm." data-zh="围绕字体、构图与视觉节奏展开的平面设计探索。">Graphic explorations shaped through typography, composition, and visual rhythm.</p>
          <dl><div><dt data-en="Graphic Design" data-zh="平面设计">Graphic Design</dt></div><div><dt data-en="Visual Communication" data-zh="视觉传达">Visual Communication</dt></div><div class="category-date"><span aria-hidden="true">/</span><dt>2026</dt></div></dl>
        </aside>
        <div class="graphic-scroll-region" tabindex="0" aria-label="Scrollable Graphic Design poster gallery"><div class="graphic-poster-grid">${graphicPosters.map(graphicPoster).join('')}</div><footer class="graphic-scroll-copyright" aria-hidden="true">© 2026 Zhong Qianni. All rights reserved.</footer></div>
      </section>
      <div class="graphic-lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Poster preview"><button class="graphic-lightbox-backdrop" type="button" aria-label="Close poster preview"></button><figure><img src="" alt="Selected Graphic Design poster" /></figure></div>`
  },
  motion: {
    title: 'Motion Design Works', zhTitle: '动效设计作品', directGallery: true,
    cards: motionShowcase()
  },
  illustration: {
    title: 'Illustration', zhTitle: '插画', directGallery: true,
    cards: illustrationGrid()
  },
  personal: {
    title: 'Personal Space', zhTitle: '个人空间', directGallery: true,
    cards: `
      <section class="personal-tutorial" aria-labelledby="personal-tutorial-title"><header class="personal-tutorial-heading personal-reveal"><a class="back-button personal-tutorial-back" href="index.html?v=252&amp;from=list" aria-label="返回作品集首页首屏"><img class="back-circle" src="assets/content/back-circle.svg" alt="" /><img class="back-arrow" src="assets/content/back-arrow.svg" alt="" /></a><h2 id="personal-tutorial-title" data-en="Tutorial" data-zh="教程">Tutorial</h2></header><div class="personal-tutorial-grid">${personalTutorialImages.map(({ href, src, alt }, index) => `<a class="personal-tutorial-card personal-reveal" style="--tutorial-order:${index}" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Open ${alt}"><img src="${src}" alt="${alt}" /></a>`).join('')}</div></section>
      <section class="personal-vlog" aria-labelledby="personal-vlog-title">
        <p class="personal-vlog-lead personal-reveal"><span data-en="Vlog  |  I came into this world to see the sun," data-zh="Vlog  |  我来到这个世界上为的是看太阳，">Vlog  |  I came into this world to see the sun,</span><span data-en=" and the blue horizon wide." data-zh="和蔚蓝色的原野。"> and the blue horizon wide.</span></p>
        <div class="personal-vlog-list" aria-label="Personal vlogs">
          <a class="personal-vlog-row" href="https://www.bilibili.com/video/BV1pj411d7cL/?spm_id_from=333.1387.upload.video_card.click&amp;vd_source=8f73d9a3d97fa8485d9fd584af4366f3" target="_blank" rel="noopener noreferrer" aria-label="Watch Living in Dali on Bilibili"><div class="personal-vlog-media"><img src="assets/personal-space/living-in-dali.png?v=1" alt="Living in Dali vlog still" /><span class="personal-vlog-shade"></span><img class="personal-vlog-link" src="assets/personal-space/vlog-link-arrow.svg?v=2" alt="" /><h3 data-en="Living in Dali" data-zh="生活在大理">Living in Dali</h3></div></a>
          <a class="personal-vlog-row" href="https://www.bilibili.com/video/BV1D34y1b7Rc/?spm_id_from=333.1387.upload.video_card.click&amp;vd_source=8f73d9a3d97fa8485d9fd584af4366f3" target="_blank" rel="noopener noreferrer" aria-label="Watch Explore Shanghai’s Vintage Markets on Foot on Bilibili"><div class="personal-vlog-media"><img src="assets/personal-space/flower-bird-market.png?v=1" alt="Shanghai Flower and Bird Market vlog still" /><span class="personal-vlog-shade"></span><img class="personal-vlog-link" src="assets/personal-space/vlog-link-arrow.svg?v=2" alt="" /><h3 data-en="Explore Shanghai’s Vintage Markets on Foot" data-zh="徒步探索上海复古市集">Explore Shanghai’s Vintage Markets on Foot</h3></div></a>
          <a class="personal-vlog-row" href="https://www.bilibili.com/video/BV1KopE64Ekp/?spm_id_from=333.1387.upload.video_card.click&amp;vd_source=8f73d9a3d97fa8485d9fd584af4366f3" target="_blank" rel="noopener noreferrer" aria-label="Watch A Day Trip to Suzhou on Bilibili"><div class="personal-vlog-media"><img src="assets/personal-space/suzhou-day-trip.png?v=1" alt="Suzhou day trip vlog still" /><span class="personal-vlog-shade"></span><img class="personal-vlog-link" src="assets/personal-space/vlog-link-arrow.svg?v=2" alt="" /><h3 data-en="A Day Trip to Suzhou" data-zh="苏州一日游">A Day Trip to Suzhou</h3></div></a>
        </div>
        <section class="personal-articles personal-reveal" aria-labelledby="personal-article-title"><h2 id="personal-article-title" data-en="Travel Journal" data-zh="游记">Travel Journal</h2><a href="https://mp.weixin.qq.com/s/Kk8yubpBNqq8rYH3ezkOfA" target="_blank" rel="noopener noreferrer"><span data-en="Shunde | Please Don’t Eat Me, Don’t Eat Me — I’ll Sing You a Beautiful Song" data-zh="顺德｜请你不要吃我不要吃我，我给你唱一首好听的歌">Shunde | Please Don’t Eat Me, Don’t Eat Me — I’ll Sing You a Beautiful Song</span><time>2018</time></a><a href="https://mp.weixin.qq.com/s/iRQPTY2LAT8X5iHg98ZGJg" target="_blank" rel="noopener noreferrer"><span data-en="Shangri-La | How Long This Life, How Far This Journey Across the Seas" data-zh="香格里拉｜此生多漫长，此身越重洋。">Shangri-La | How Long This Life, How Far This Journey Across the Seas</span><time>2022</time></a></section>
      </section>`
  }
};

const applyPortfolioLanguage = (language, broadcast = false) => {
  const selected = language === 'zh' ? 'zh' : 'en';
  localStorage.setItem(languageKey, selected);
  document.documentElement.lang = selected === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach((element) => { element.textContent = element.dataset[selected] || element.dataset.en; });
  document.querySelectorAll('.work-type-language [data-lang]').forEach((button) => {
    const active = button.dataset.lang === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  prepareTabEntranceAnimations();
  if (broadcast && window.parent !== window) {
    window.parent.postMessage({ type: 'portfolio-language-change', language: selected }, location.origin);
  }
};
document.querySelectorAll('.work-type-language [data-lang]').forEach((button) => button.addEventListener('click', () => applyPortfolioLanguage(button.dataset.lang, true)));
window.addEventListener('storage', (event) => {
  if (event.key === languageKey && (event.newValue === 'zh' || event.newValue === 'en')) applyPortfolioLanguage(event.newValue);
});

if (workTypeHeader) {
  let previousY = window.scrollY;
  let hideDistance = 0;
  let ticking = false;
  const render = () => {
    const progress = Math.min(1, hideDistance / 72);
    workTypeHeader.style.setProperty('--nav-hide-progress', progress.toFixed(3));
    document.documentElement.style.setProperty('--category-title-lift', `${(-106 * progress).toFixed(2)}px`);
    workTypeHeader.style.pointerEvents = progress > .96 ? 'none' : '';
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const currentY = window.scrollY;
      const delta = Math.max(-20, Math.min(20, currentY - previousY));
      if (currentY <= 12) hideDistance = 0;
      else if (delta > 0) hideDistance = Math.min(72, hideDistance + delta);
      previousY = currentY;
      render();
    });
  }, { passive: true });
  render();
}

const attachInternalNavigationCollapse = (scroller) => {
  let previousY = scroller.scrollTop;
  let hideDistance = 0;
  let ticking = false;
  const render = () => {
    const progress = Math.min(1, hideDistance / 72);
    workTypeHeader?.style.setProperty('--nav-hide-progress', progress.toFixed(3));
    document.documentElement.style.setProperty('--category-title-lift', `${(-106 * progress).toFixed(2)}px`);
    if (workTypeHeader) workTypeHeader.style.pointerEvents = progress > .96 ? 'none' : '';
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const currentY = scroller.scrollTop;
      const delta = currentY - previousY;
      if (currentY <= 12) hideDistance = 0;
      else if (delta > 0) hideDistance = Math.min(72, hideDistance + delta);
      else if (delta < 0) hideDistance = Math.max(0, hideDistance + delta);
      previousY = currentY;
      render();
    });
  };
  scroller.addEventListener('scroll', onScroll, { passive: true });
  render();
  return () => {
    scroller.removeEventListener('scroll', onScroll);
    workTypeHeader?.style.setProperty('--nav-hide-progress', '0');
    document.documentElement.style.setProperty('--category-title-lift', '0px');
    if (workTypeHeader) workTypeHeader.style.pointerEvents = '';
  };
};

const setupGallery = () => {
  activeCleanup();
  let tabSpecificCleanup = () => {};
  if (currentTab === 'personal' && projectGallery.querySelector('.personal-vlog-carousel')) {
    const carousel = projectGallery.querySelector('.personal-vlog-carousel');
    const viewport = carousel?.querySelector('.personal-vlog-viewport');
    const slides = [...(carousel?.querySelectorAll('.personal-vlog-row') || [])];
    const dots = [...(carousel?.querySelectorAll('.personal-vlog-pagination button') || [])];
    let activeIndex = 1;
    let autoplayTimer = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const setActive = (index, smooth = true) => {
      if (!viewport || !slides.length) return;
      activeIndex = (index + slides.length) % slides.length;
      const slide = slides[activeIndex];
      const left = slide.offsetLeft - (viewport.clientWidth - slide.offsetWidth) / 2;
      viewport.scrollTo({ left, behavior: smooth && !reduced ? 'smooth' : 'auto' });
      slides.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === activeIndex));
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === activeIndex;
        dot.classList.toggle('is-active', active);
        active ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current');
      });
    };
    const stopAutoplay = () => window.clearInterval(autoplayTimer);
    const startAutoplay = () => {
      stopAutoplay();
      if (!reduced) autoplayTimer = window.setInterval(() => setActive(activeIndex + 1), 5200);
    };
    const onScrollEnd = () => {
      if (!viewport) return;
      let nearestIndex = activeIndex;
      let nearestDistance = Infinity;
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      slides.forEach((slide, index) => {
        const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
        if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = index; }
      });
      if (nearestIndex !== activeIndex) setActive(nearestIndex, false);
    };
    const dotHandlers = dots.map((dot, index) => {
      const handler = () => { setActive(index); startAutoplay(); };
      dot.addEventListener('click', handler);
      return [dot, handler];
    });
    const onPointerEnter = () => stopAutoplay();
    const onPointerLeave = () => startAutoplay();
    const onResize = () => setActive(activeIndex, false);
    viewport?.addEventListener('scrollend', onScrollEnd);
    carousel?.addEventListener('pointerenter', onPointerEnter);
    carousel?.addEventListener('pointerleave', onPointerLeave);
    carousel?.addEventListener('focusin', onPointerEnter);
    carousel?.addEventListener('focusout', onPointerLeave);
    window.addEventListener('resize', onResize, { passive: true });
    requestAnimationFrame(() => setActive(1, false));
    startAutoplay();
    tabSpecificCleanup = () => {
      stopAutoplay();
      viewport?.removeEventListener('scrollend', onScrollEnd);
      carousel?.removeEventListener('pointerenter', onPointerEnter);
      carousel?.removeEventListener('pointerleave', onPointerLeave);
      carousel?.removeEventListener('focusin', onPointerEnter);
      carousel?.removeEventListener('focusout', onPointerLeave);
      window.removeEventListener('resize', onResize);
      dotHandlers.forEach(([dot, handler]) => dot.removeEventListener('click', handler));
    };
  }
  if (currentTab === 'graphic') {
    const wall = projectGallery.querySelector('.graphic-scroll-region');
    const lightbox = projectGallery.querySelector('.graphic-lightbox');
    const preview = lightbox.querySelector('img');
    const closeButtons = [...lightbox.querySelectorAll('.graphic-lightbox-backdrop')];
    const openPreview = (poster) => {
      preview.src = poster.dataset.posterSrc;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('graphic-lightbox-open');
    };
    const closePreview = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('graphic-lightbox-open');
    };
    const onPosterClick = (event) => { const poster = event.target.closest('.graphic-grid-poster'); if (poster) openPreview(poster); };
    const onKeydown = (event) => { if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closePreview(); };
    wall.addEventListener('click', onPosterClick);
    closeButtons.forEach((button) => button.addEventListener('click', closePreview));
    window.addEventListener('keydown', onKeydown);
    activeCleanup = () => {
      document.body.classList.remove('graphic-lightbox-open');
      wall.removeEventListener('click', onPosterClick);
      closeButtons.forEach((button) => button.removeEventListener('click', closePreview));
      window.removeEventListener('keydown', onKeydown);
    };
    return;
  }
  if (currentTab === 'illustration') {
    const wall = projectGallery.querySelector('.illustration-scroll-region');
    const lightbox = projectGallery.querySelector('.illustration-lightbox');
    const preview = lightbox.querySelector('img');
    const openPreview = (card) => {
      preview.src = card.dataset.posterSrc;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('graphic-lightbox-open');
    };
    const closePreview = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('graphic-lightbox-open');
    };
    const onClick = (event) => { const card = event.target.closest('.illustration-card'); if (card) openPreview(card); };
    const onKeydown = (event) => { if (event.key === 'Escape') closePreview(); };
    wall.addEventListener('click', onClick);
    preview.addEventListener('click', closePreview);
    lightbox.querySelector('.graphic-lightbox-backdrop').addEventListener('click', closePreview);
    window.addEventListener('keydown', onKeydown);
    activeCleanup = () => {
      document.body.classList.remove('graphic-lightbox-open');
      wall.removeEventListener('click', onClick);
      preview.removeEventListener('click', closePreview);
      lightbox.querySelector('.graphic-lightbox-backdrop').removeEventListener('click', closePreview);
      window.removeEventListener('keydown', onKeydown);
    };
    return;
  }
  if (currentTab === 'motion') {
    const showcase = projectGallery.querySelector('.motion-showcase');
    const cards = [...showcase.querySelectorAll('.motion-showcase-card')];
    const videos = [...showcase.querySelectorAll('video')];
    const lightbox = projectGallery.querySelector('.motion-lightbox');
    const lightboxCard = lightbox.querySelector('.motion-lightbox-card');
    const lightboxTitle = lightbox.querySelector('header > span');
    const lightboxVideo = lightbox.querySelector('video');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let observer;
    let revealObserver;
    document.body.classList.add('motion-showcase-active');
    if (!reduced) {
      revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
      cards.forEach((card) => revealObserver.observe(card));
    } else cards.forEach((card) => card.classList.add('is-visible'));
    observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (lightbox.classList.contains('is-open')) return;
      if (entry.isIntersecting && entry.intersectionRatio > .35) entry.target.play().catch(() => {});
      else entry.target.pause();
    }), { threshold: [.1, .35, .7] });
    videos.forEach((video) => observer.observe(video));
    const openLightbox = (card) => {
      const sourceVideo = card.querySelector('video');
      lightboxTitle.textContent = card.querySelector('header > span').textContent;
      lightboxCard.style.setProperty('--motion-bg', card.style.getPropertyValue('--motion-bg'));
      lightboxCard.classList.toggle('is-portrait', card.classList.contains('is-portrait'));
      lightboxVideo.src = sourceVideo.currentSrc || sourceVideo.src;
      lightboxVideo.currentTime = sourceVideo.currentTime || 0;
      lightboxVideo.muted = false;
      lightboxVideo.volume = 1;
      videos.forEach((video) => video.pause());
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('motion-lightbox-open');
      lightboxVideo.play().catch(() => {});
    };
    const closeLightbox = () => {
      if (!lightbox.classList.contains('is-open')) return;
      lightboxVideo.pause();
      lightboxVideo.removeAttribute('src');
      lightboxVideo.load();
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('motion-lightbox-open');
      const visibleVideo = videos.find((video) => {
        const rect = video.getBoundingClientRect();
        return rect.top < innerHeight * .8 && rect.bottom > innerHeight * .2;
      });
      visibleVideo?.play().catch(() => {});
    };
    const onCardClick = (event) => { const card = event.target.closest('.motion-showcase-card'); if (card) openLightbox(card); };
    const onCardKeydown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openLightbox(event.currentTarget);
    };
    const onLightboxClick = () => closeLightbox();
    const onKeydown = (event) => { if (event.key === 'Escape') closeLightbox(); };
    showcase.addEventListener('click', onCardClick);
    cards.forEach((card) => card.addEventListener('keydown', onCardKeydown));
    lightbox.addEventListener('click', onLightboxClick);
    window.addEventListener('keydown', onKeydown);
    activeCleanup = () => {
      document.body.classList.remove('motion-showcase-active', 'motion-lightbox-open');
      observer?.disconnect();
      revealObserver?.disconnect();
      videos.forEach((video) => video.pause());
      lightboxVideo.pause();
      showcase.removeEventListener('click', onCardClick);
      cards.forEach((card) => card.removeEventListener('keydown', onCardKeydown));
      lightbox.removeEventListener('click', onLightboxClick);
      window.removeEventListener('keydown', onKeydown);
    };
    return;
  }
  const cards = [...projectGallery.querySelectorAll('.gallery-card')];
  cards.slice(0, 2).forEach((card) => {
    card.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
      image.fetchPriority = 'high';
    });
  });
  const rows = [...projectIndex.querySelectorAll('.project-row')];
  let scrollInProgress = false;
  let scrollSequence = 0;
  let savedScrollBehavior = null;
  let revealObserver;
  let videoObserver;
  const rowHandlers = [];
  const selectRow = (row) => rows.forEach((item) => {
    const selected = item === row;
    item.classList.toggle('selected', selected);
    selected ? item.setAttribute('aria-current', 'true') : item.removeAttribute('aria-current');
  });
  rows.forEach((row) => {
    const handler = (event) => {
      const target = document.querySelector(row.hash);
      if (!target) return;
      event.preventDefault();
      const sequence = ++scrollSequence;
      scrollInProgress = true;
      selectRow(row);
      const lineTop = projectIndex.querySelector('.project-nav')?.getBoundingClientRect().top ?? 50;
      const startY = window.scrollY;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo(0, Math.max(0, startY + target.getBoundingClientRect().top - lineTop));
        scrollInProgress = false;
        return;
      }
      const root = document.documentElement;
      if (savedScrollBehavior === null) savedScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      const startedAt = performance.now();
      const duration = 950;
      const scrollToLine = (now) => {
        if (sequence !== scrollSequence) return;
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        const destinationY = Math.max(0, window.scrollY + target.getBoundingClientRect().top - lineTop);
        window.scrollTo(0, startY + (destinationY - startY) * eased);
        if (progress < 1) requestAnimationFrame(scrollToLine);
        else {
          window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top - lineTop);
          root.style.scrollBehavior = savedScrollBehavior;
          savedScrollBehavior = null;
          scrollInProgress = false;
        }
      };
      requestAnimationFrame(scrollToLine);
    };
    row.addEventListener('click', handler);
    rowHandlers.push([row, handler]);
  });
  let ticking = false;
  const update = () => {
    ticking = false;
    if (!matchMedia('(min-width: 761px)').matches) { cards.forEach((card) => card.style.removeProperty('--gallery-scale')); return; }
    const focusLine = innerHeight * .2;
    let nearest = null;
    let nearestDistance = Infinity;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const anchor = rect.top + rect.height * .12;
      const progress = Math.max(0, Math.min(1, 1 - Math.max(0, anchor - focusLine) / Math.max(1, innerHeight * .78)));
      card.style.setProperty('--gallery-scale', (.76 + (1 - Math.pow(1 - progress, 3)) * .24).toFixed(4));
      const distance = Math.abs(anchor - focusLine);
      if (rect.bottom > 0 && rect.top < innerHeight && distance < nearestDistance) { nearestDistance = distance; nearest = card; }
    });
    if (nearest && rows.length && !scrollInProgress) {
      const row = rows.find((item) => item.hash === `#${nearest.id}`);
      if (row) selectRow(row);
    }
  };
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  const ensureSecondCardPeek = () => {
    const secondCard = cards[1];
    if (!secondCard || !matchMedia('(min-width: 761px)').matches) return;
    secondCard.style.marginTop = '0px';
    const desiredTop = innerHeight - 28;
    const naturalTop = secondCard.getBoundingClientRect().top;
    const lift = Math.max(0, naturalTop - desiredTop);
    secondCard.style.marginTop = lift ? `${-lift}px` : '0px';
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('resize', ensureSecondCardPeek, { passive: true });
  requestUpdate();
  window.requestAnimationFrame(ensureSecondCardPeek);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: .1, rootMargin: '0px 0px -5% 0px' });
    cards.slice(2).forEach((card) => { card.classList.add('reveal', 'deferred-reveal'); revealObserver.observe(card); });
    projectGallery.querySelectorAll('.graphic-reveal, .personal-reveal:not(.personal-tutorial-card)').forEach((element) => {
      element.classList.add('graphic-reveal-pending');
      revealObserver.observe(element);
    });
  }
  const videos = [...projectGallery.querySelectorAll('video')];
  if (videos.length) {
    videoObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > .45) entry.target.play().catch(() => {});
      else entry.target.pause();
    }), { threshold: [.1, .45, .8] });
    videos.forEach((video) => videoObserver.observe(video));
  }
  activeCleanup = () => {
    tabSpecificCleanup();
    scrollSequence += 1;
    if (savedScrollBehavior !== null) {
      document.documentElement.style.scrollBehavior = savedScrollBehavior;
      savedScrollBehavior = null;
    }
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);
    window.removeEventListener('resize', ensureSecondCardPeek);
    rowHandlers.forEach(([row, handler]) => row.removeEventListener('click', handler));
    revealObserver?.disconnect();
    videoObserver?.disconnect();
    videos.forEach((video) => video.pause());
  };
};

const categoryIndex = (data) => data.directGallery
  ? `${backButtonHTML}<section class="category-summary"><h1 data-en="${data.title}" data-zh="${data.zhTitle}">${data.title}</h1></section>`
  : `${backButtonHTML}<section class="category-summary"><h1 data-en="${data.title}" data-zh="${data.zhTitle}">${data.title}</h1><dl><div><dt data-en="Category" data-zh="类型">Category</dt><dd data-en="${data.type[0]}" data-zh="${data.type[1]}">${data.type[0]}</dd></div><div><dt data-en="Year" data-zh="时间">Year</dt><dd>${data.year}</dd></div></dl></section>`;

const switchTab = (tab, updateHistory = true) => {
  if (!categoryData[tab] && tab !== 'uiux') tab = 'uiux';
  activeCleanup();
  currentTab = tab;
  tabButtons.forEach((button) => {
    const selected = button.dataset.workTab === tab;
    button.classList.toggle('active', selected);
    selected ? button.setAttribute('aria-current', 'page') : button.removeAttribute('aria-current');
  });
  contentPage.classList.toggle('category-view', tab !== 'uiux');
  contentPage.classList.toggle('graphic-view', tab === 'graphic');
  contentPage.classList.toggle('illustration-view', tab === 'illustration');
  contentPage.classList.toggle('motion-view', tab === 'motion');
  contentPage.classList.toggle('personal-view', tab === 'personal');
  const backToTopImage = document.querySelector('.back-to-top img');
  if (backToTopImage) backToTopImage.src = tab === 'personal' ? 'assets/back-to-top-dark.svg?v=2' : 'assets/back-to-top.svg?v=2';
  if (tab === 'uiux') { projectIndex.innerHTML = uiuxIndexHTML; projectGallery.innerHTML = uiuxGalleryHTML; }
  else { projectIndex.innerHTML = categoryIndex(categoryData[tab]); projectGallery.innerHTML = categoryData[tab].cards; }
  if (updateHistory) {
    document.body.classList.add('tab-has-switched');
    window.clearTimeout(tabAnimationTimer);
    contentPage.classList.remove('tab-changing');
    void contentPage.offsetWidth;
    contentPage.classList.add('tab-changing');
    tabAnimationTimer = window.setTimeout(() => contentPage.classList.remove('tab-changing'), 760);
  }
  applyPortfolioLanguage(localStorage.getItem(languageKey) || 'en');
  setupGallery();
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (updateHistory) {
    const url = new URL(location.href);
    if (tab === 'uiux') url.searchParams.delete('tab'); else url.searchParams.set('tab', tab);
    history.replaceState({ tab }, '', `${url.pathname}${url.search}`);
  }
};

tabButtons.forEach((button) => button.addEventListener('click', () => { if (button.dataset.workTab !== currentTab) switchTab(button.dataset.workTab); }));
switchTab(new URLSearchParams(location.search).get('tab') || 'uiux', false);
window.requestAnimationFrame(() => {
  window.scrollTo(0, 0);
  window.requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.style.removeProperty('scroll-behavior');
  });
});
