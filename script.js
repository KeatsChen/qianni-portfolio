const languageButtons = document.querySelectorAll('[data-lang]');
const localized = document.querySelectorAll('[data-en][data-zh]');
const portfolioLanguageKey = 'qianni-portfolio-language';
const portfolioLanguageSessionKey = 'qianni-portfolio-language-initialized';

function initTiltedWorkCards() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll('.work-card').forEach((card) => {
    const glare = document.createElement('span');
    glare.className = 'tilt-glare';
    glare.setAttribute('aria-hidden', 'true');
    card.appendChild(glare);

    const state = { x: 0, y: 0, scale: 1, lift: 0 };
    const target = { x: 0, y: 0, scale: 1, lift: 0 };
    let animationFrame = 0;

    const render = () => {
      state.x += (target.x - state.x) * .14;
      state.y += (target.y - state.y) * .14;
      state.scale += (target.scale - state.scale) * .14;
      state.lift += (target.lift - state.lift) * .14;
      card.style.setProperty('--tilt-x', `${state.x.toFixed(3)}deg`);
      card.style.setProperty('--tilt-y', `${state.y.toFixed(3)}deg`);
      card.style.setProperty('--tilt-scale', state.scale.toFixed(4));
      card.style.setProperty('--tilt-lift', `${state.lift.toFixed(3)}px`);

      const moving = Math.abs(target.x - state.x) > .01 || Math.abs(target.y - state.y) > .01 || Math.abs(target.scale - state.scale) > .001 || Math.abs(target.lift - state.lift) > .01;
      animationFrame = moving ? requestAnimationFrame(render) : 0;
    };

    const startRender = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(render);
    };

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      target.x = (y - .5) * -16;
      target.y = (x - .5) * 16;
      target.scale = 1.035;
      target.lift = -5;
      card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
      card.classList.add('is-tilting');
      startRender();
    });

    card.addEventListener('pointerleave', () => {
      target.x = 0;
      target.y = 0;
      target.scale = 1;
      target.lift = 0;
      card.classList.remove('is-tilting');
      startRender();
    });
  });
}

initTiltedWorkCards();

function initTiltedCapabilitiesCard() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const card = document.querySelector('.capabilities-showcase');
  if (!card) return;

  const glare = document.createElement('span');
  glare.className = 'tilt-glare';
  glare.setAttribute('aria-hidden', 'true');
  card.appendChild(glare);

  const state = { x: 0, y: 0, scale: 1, lift: 0 };
  const target = { x: 0, y: 0, scale: 1, lift: 0 };
  let animationFrame = 0;

  const render = () => {
    state.x += (target.x - state.x) * .12;
    state.y += (target.y - state.y) * .12;
    state.scale += (target.scale - state.scale) * .12;
    state.lift += (target.lift - state.lift) * .12;
    card.style.setProperty('--capability-tilt-x', `${state.x.toFixed(3)}deg`);
    card.style.setProperty('--capability-tilt-y', `${state.y.toFixed(3)}deg`);
    card.style.setProperty('--capability-tilt-scale', state.scale.toFixed(4));
    card.style.setProperty('--capability-tilt-lift', `${state.lift.toFixed(3)}px`);

    const moving = Math.abs(target.x - state.x) > .01 || Math.abs(target.y - state.y) > .01 || Math.abs(target.scale - state.scale) > .001 || Math.abs(target.lift - state.lift) > .01;
    animationFrame = moving ? requestAnimationFrame(render) : 0;
  };

  const startRender = () => {
    if (!animationFrame) animationFrame = requestAnimationFrame(render);
  };

  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    target.x = (y - .5) * -5.6;
    target.y = (x - .5) * 7;
    target.scale = 1.012;
    target.lift = -4;
    card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
    card.classList.add('is-tilting');
    startRender();
  });

  card.addEventListener('pointerleave', () => {
    target.x = 0;
    target.y = 0;
    target.scale = 1;
    target.lift = 0;
    card.classList.remove('is-tilting');
    startRender();
  });
}

initTiltedCapabilitiesCard();

// Home always starts from its first screen, including reloads after scrolling.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('pageshow', () => window.scrollTo(0, 0));
window.addEventListener('load', () => {
  window.requestAnimationFrame(() => window.scrollTo(0, 0));
}, { once: true });

if (sessionStorage.getItem(portfolioLanguageSessionKey) !== '1') {
  localStorage.setItem(portfolioLanguageKey, 'en');
  sessionStorage.setItem(portfolioLanguageSessionKey, '1');
}
sessionStorage.setItem('qianni-home-entered', '1');

const homeNav = document.querySelector('.hero-nav');
if (homeNav) {
  let previousNavY = window.scrollY;
  let homeNavHideDistance = 0;
  let homeNavTicking = false;
  let hasHomeNavScrolled = false;
  let hasDownwardScrollIntent = false;
  let pointerInHomeNavZone = false;

  window.addEventListener('wheel', (event) => {
    if (event.deltaY > 0) hasDownwardScrollIntent = true;
  }, { passive: true });
  window.addEventListener('touchmove', () => {
    hasDownwardScrollIntent = true;
  }, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) hasDownwardScrollIntent = true;
  });

  const renderHomeNav = () => {
    const progress = Math.min(1, homeNavHideDistance / 72);
    homeNav.style.setProperty('--nav-hide-progress', progress.toFixed(3));
    homeNav.style.pointerEvents = progress > .96 ? 'none' : '';
  };

  window.addEventListener('scroll', () => {
    if (homeNavTicking) return;
    homeNavTicking = true;
    requestAnimationFrame(() => {
      homeNavTicking = false;
      const currentY = window.scrollY;
      const rawDelta = currentY - previousNavY;
      const delta = Math.max(-20, Math.min(20, rawDelta));
      if (currentY <= 12) homeNavHideDistance = 0;
      else if (delta > 0 && hasDownwardScrollIntent && !pointerInHomeNavZone) {
        hasHomeNavScrolled = true;
        homeNavHideDistance = Math.min(72, homeNavHideDistance + delta);
      }
      previousNavY = currentY;
      renderHomeNav();
    });
  }, { passive: true });
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', (event) => {
      pointerInHomeNavZone = event.clientY <= 92;
      if (pointerInHomeNavZone) homeNavHideDistance = 0;
      else if (hasHomeNavScrolled && window.scrollY > 12) homeNavHideDistance = 72;
      renderHomeNav();
    }, { passive: true });
  }
  renderHomeNav();
}

const entryParams = new URLSearchParams(window.location.search);
if (entryParams.get('from') === 'list' || entryParams.get('first') === '1') {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  history.replaceState(null, '', 'index.html');
}

function prepareIntroTextMotion() {
  const intro = document.querySelector('.intro');
  if (!intro) return;

  intro.classList.remove('intro-motion-visible');
  intro.querySelectorAll(':scope > h1, :scope > p').forEach((block) => {
    const lines = [...block.querySelectorAll(':scope > span')];
    let wordOffset = 0;
    lines.forEach((line) => {
      const sourceText = line.textContent.trim();
      const words = document.documentElement.lang === 'zh-CN'
        ? Array.from(sourceText)
        : sourceText.split(/\s+/);
      line.classList.add('intro-motion-line');
      line.replaceChildren(...words.flatMap((word, index) => {
        if (/\s/.test(word)) return [document.createTextNode(word)];
        const wordElement = document.createElement('span');
        wordElement.className = 'intro-motion-word';
        wordElement.style.setProperty('--word-index', wordOffset + index);
        wordElement.textContent = word;
        if (document.documentElement.lang === 'zh-CN' || index === words.length - 1) return [wordElement];
        return [wordElement, document.createTextNode(' ')];
      }));
      wordOffset += words.length;
    });
  });

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => intro.classList.add('intro-motion-visible'));
  });
}

let homeReturnRevealTimer = 0;
window.replayHomeEntranceMotion = () => {
  window.scrollTo(0, 0);
  document.body.classList.remove('home-return-reveal');
  void document.body.offsetWidth;
  document.body.classList.add('home-return-reveal');
  prepareIntroTextMotion();
  window.clearTimeout(homeReturnRevealTimer);
  homeReturnRevealTimer = window.setTimeout(() => {
    document.body.classList.remove('home-return-reveal');
  }, 2600);
};

window.closePortfolioPageWithHomeEntrance = () => {
  const overlay = document.querySelector('.site-page-overlay');
  document.body.classList.remove('site-page-open', 'directory-page-open');
  window.replayHomeEntranceMotion();
  overlay?.remove();
};

function initializeProjectDeck() {
  const deck = document.querySelector('.project-deck');
  if (!deck) return;
  const cards = [...deck.querySelectorAll('.project-deck-card')];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    deck.classList.add('is-ready', 'is-spread');
    return;
  }

  let cycleTimer = 0;
  let isVisible = true;
  const clearCycle = () => window.clearTimeout(cycleTimer);
  const schedule = (callback, delay) => {
    clearCycle();
    cycleTimer = window.setTimeout(callback, delay);
  };
  const focus = () => {
    if (!isVisible || deck.classList.contains('is-focus')) return;
    deck.classList.add('is-focus');
    const entrySeconds = Number.parseFloat(getComputedStyle(deck).getPropertyValue('--entry-duration')) || 1.2;
    const firstCard = cards[0];
    const continueToPreSpread = () => {
      clearCycle();
      window.requestAnimationFrame(() => window.requestAnimationFrame(preSpread));
    };
    firstCard?.addEventListener('animationend', continueToPreSpread, { once: true });
    schedule(continueToPreSpread, entrySeconds * 1000 + 160);
  };
  const preSpread = () => {
    if (!isVisible || deck.classList.contains('is-pre-spread')) return;
    cards.forEach((card) => {
      const current = getComputedStyle(card);
      card.style.left = current.left;
      card.style.top = current.top;
      card.style.transform = current.transform;
      card.style.opacity = current.opacity;
    });
    deck.classList.add('is-tilted', 'is-stacking');
    void deck.offsetWidth;
    window.requestAnimationFrame(() => {
      deck.classList.add('is-pre-spread');
      cards.forEach((card) => {
        card.style.removeProperty('left');
        card.style.removeProperty('top');
        card.style.removeProperty('transform');
        card.style.removeProperty('opacity');
      });
      schedule(spread, 450);
    });
  };
  const spread = () => {
    if (!isVisible) return;
    deck.classList.add('is-tilted', 'is-stacking', 'is-spread');
    clearCycle();
  };

  if (new URLSearchParams(window.location.search).get('tune') === '1') {
    const tuner = document.createElement('aside');
    tuner.className = 'deck-tuner';
    tuner.innerHTML = `
      <strong>卡片入场动画</strong>
      <label>上升角度<input data-var="--entry-start-angle" data-unit="deg" data-negative="1" type="range" min="0" max="30" step="1" value="20"><output>20°</output></label>
      <label>停留角度<input data-var="--entry-end-angle" data-unit="deg" data-negative="1" type="range" min="0" max="25" step="1" value="10"><output>10°</output></label>
      <label>上升距离<input data-var="--entry-rise" data-unit="vh" type="range" min="20" max="90" step="1" value="55"><output>55vh</output></label>
      <label>动画时长<input data-var="--entry-duration" data-unit="s" type="range" min="0.6" max="2.4" step="0.05" value="1.2"><output>1.2s</output></label>
      <div class="deck-tuner-curve">
        <span>旋转曲线</span>
        <code>cubic-bezier(<b data-curve-output>0.22, 1.00, 0.36, 1.00</b>)</code>
      </div>
      <label>X1<input data-curve="0" type="range" min="0" max="1" step="0.01" value="0.22"><output>0.22</output></label>
      <label>Y1<input data-curve="1" type="range" min="-0.5" max="1.5" step="0.01" value="1"><output>1.00</output></label>
      <label>X2<input data-curve="2" type="range" min="0" max="1" step="0.01" value="0.36"><output>0.36</output></label>
      <label>Y2<input data-curve="3" type="range" min="-0.5" max="1.5" step="0.01" value="1"><output>1.00</output></label>
      <button type="button">重新播放</button>`;
    document.body.appendChild(tuner);
    const replay = () => {
      clearCycle();
      deck.classList.remove('is-focus', 'is-tilted', 'is-stacking', 'is-pre-spread', 'is-spread');
      void deck.offsetWidth;
      schedule(focus, 180);
    };
    let replayTimer = 0;
    const replaySoon = () => {
      window.clearTimeout(replayTimer);
      replayTimer = window.setTimeout(replay, 120);
    };
    tuner.querySelectorAll('input[data-var]').forEach((input) => {
      input.addEventListener('input', () => {
        const sign = input.dataset.negative === '1' ? '-' : '';
        deck.style.setProperty(input.dataset.var, `${sign}${input.value}${input.dataset.unit}`);
        input.nextElementSibling.value = `${input.value}${input.dataset.unit === 'deg' ? '°' : input.dataset.unit}`;
        replaySoon();
      });
    });
    const curveInputs = [...tuner.querySelectorAll('input[data-curve]')];
    curveInputs.forEach((input) => {
      input.addEventListener('input', () => {
        input.nextElementSibling.value = Number(input.value).toFixed(2);
        const values = curveInputs.map((control) => Number(control.value).toFixed(2));
        deck.style.setProperty('--tilt-easing', `cubic-bezier(${values.join(', ')})`);
        tuner.querySelector('[data-curve-output]').textContent = values.join(', ');
        replaySoon();
      });
    });
    tuner.querySelector('button').addEventListener('click', replay);
  }

  window.requestAnimationFrame(() => {
    deck.classList.add('is-ready');
    schedule(focus, 650);
  });

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) {
      deck.classList.add('is-ready');
      if (!deck.classList.contains('is-spread')) schedule(focus, 260);
    } else {
      clearCycle();
    }
  }, { threshold: .08 });
  visibilityObserver.observe(deck);
}

initializeProjectDeck();

const worksBlurObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-blur-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .35, rootMargin: '0px 0px -8% 0px' }) : null;

function prepareWorksBlurText() {
  document.querySelectorAll('.works-heading .blur-text[data-en][data-zh]').forEach((element) => {
    const language = document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
    const text = element.dataset[language];
    const pieces = language === 'zh' ? Array.from(text) : text.split(/(\s+)/);
    const fragment = document.createDocumentFragment();
    let tokenIndex = 0;

    pieces.forEach((piece) => {
      if (/^\s+$/.test(piece)) {
        fragment.appendChild(document.createTextNode(piece));
        return;
      }
      const token = document.createElement('span');
      token.className = 'blur-text-token';
      token.style.setProperty('--blur-index', tokenIndex++);
      token.textContent = piece;
      fragment.appendChild(token);
    });

    if (worksBlurObserver) worksBlurObserver.unobserve(element);
    element.classList.remove('is-blur-visible');
    element.replaceChildren(fragment);
    if (worksBlurObserver) worksBlurObserver.observe(element);
    else element.classList.add('is-blur-visible');
  });
}

function setLanguage(language) {
  localStorage.setItem(portfolioLanguageKey, language);
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  languageButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.lang === language);
  });
  localized.forEach((element) => {
    const parts = element.dataset[language].split('|');
    if (element.matches('h1, p') && parts.length > 1) {
      element.replaceChildren(...parts.map((text) => {
        const span = document.createElement('span');
        span.textContent = text;
        return span;
      }));
    } else {
      element.textContent = parts[0];
    }
  });
  prepareIntroTextMotion();
  prepareWorksBlurText();
}

languageButtons.forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
const savedLanguage = localStorage.getItem(portfolioLanguageKey);
setLanguage(savedLanguage === 'zh' || savedLanguage === 'en' ? savedLanguage : 'en');
window.addEventListener('storage', (event) => {
  if (event.key !== portfolioLanguageKey || !['zh', 'en'].includes(event.newValue)) return;
  setLanguage(event.newValue);
});
window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.data?.type !== 'portfolio-language-change') return;
  if (event.data.language === 'zh' || event.data.language === 'en') setLanguage(event.data.language);
});

const portfolioCurtain = document.querySelector('.portfolio-strings');
if (portfolioCurtain && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const strands = [...portfolioCurtain.querySelectorAll(':scope > span')];
  const controlStrands = strands.filter((strand) => strand.classList.contains('control-strand'));
  let previousPointerX = null;
  portfolioCurtain.addEventListener('pointermove', (event) => {
    const activeControl = event.target.closest('.control-strand');
    if (activeControl) {
      previousPointerX = null;
      portfolioCurtain.classList.remove('is-lifting');
      const button = activeControl.querySelector('button');
      const buttonCenter = button.getBoundingClientRect().left + button.getBoundingClientRect().width / 2;
      const attraction = Math.max(-6, Math.min(6, event.clientX - buttonCenter));
      strands.forEach((strand) => {
        strand.classList.toggle('is-attracted', strand === activeControl);
        strand.style.transform = strand === activeControl
          ? `translateX(${attraction}px) rotate(${attraction * 0.08}deg)`
          : 'translateX(0) rotate(0deg)';
      });
      return;
    }
    const bounds = portfolioCurtain.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const movement = previousPointerX === null ? event.movementX : pointerX - previousPointerX;
    const direction = Math.sign(movement) || 1;
    previousPointerX = pointerX;
    portfolioCurtain.classList.add('is-lifting');
    strands.forEach((strand) => {
      const center = strand.offsetLeft + strand.offsetWidth / 2;
      const distance = Math.abs(pointerX - center);
      const influence = Math.max(0, 1 - distance / 105);
      const amplitude = strand.classList.contains('lamp-strand') ? 0.4 : strand.classList.contains('music-strand') ? 0.55 : 1;
      const shift = 48 * direction * influence * influence * amplitude;
      const tilt = 5.5 * direction * influence * amplitude;
      strand.style.transform = `translateX(${shift}px) rotate(${tilt}deg)`;
    });
  });
  controlStrands.forEach((strand) => {
    strand.addEventListener('pointerleave', () => {
      strand.classList.remove('is-attracted');
      strand.style.transform = 'translateX(0) rotate(0deg)';
    });
  });
  portfolioCurtain.addEventListener('pointerleave', () => {
    previousPointerX = null;
    portfolioCurtain.classList.remove('is-lifting');
    strands.forEach((strand) => {
      strand.classList.remove('is-attracted');
      strand.style.transform = 'translateX(0) rotate(0deg)';
    });
  });
}

const themeLamp = document.querySelector('.theme-lamp');

function setTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('theme-light', isLight);
  themeLamp?.setAttribute('aria-pressed', String(isLight));
  themeLamp?.setAttribute('aria-label', isLight ? '切换到深色模式' : '切换到浅色模式');
}

setTheme('dark');
themeLamp?.addEventListener('click', (event) => {
  event.stopPropagation();
  setTheme(document.body.classList.contains('theme-light') ? 'dark' : 'light');
});

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

const contactDialogLayer = document.querySelector('.contact-dialog-layer');
const contactDialog = contactDialogLayer?.querySelector('.contact-dialog');
const contactDialogTitle = contactDialogLayer?.querySelector('#contact-dialog-title');
const contactDialogValue = contactDialogLayer?.querySelector('.contact-dialog-value');
const contactDialogCopy = contactDialogLayer?.querySelector('.contact-dialog-copy');
const contactDialogCopyLabel = contactDialogLayer?.querySelector('.contact-dialog-copy-label');
let lastContactTrigger = null;

const contactContent = {
  wechat: {
    title: '微信', width: 178
  },
  email: {
    title: '邮箱', width: 211
  }
};

function positionContactDialog() {
  if (!lastContactTrigger || !contactDialog) return;
  const rect = lastContactTrigger.getBoundingClientRect();
  const width = Number(contactDialog.style.getPropertyValue('--contact-dialog-width').replace('px','')) || 178;
  const halfWidth = width / 2;
  const x = Math.min(window.innerWidth - halfWidth - 12, Math.max(halfWidth + 12, rect.left + rect.width / 2));
  contactDialog.style.setProperty('--contact-dialog-x', `${x}px`);
  contactDialog.style.setProperty('--contact-dialog-y', `${Math.max(126,rect.top - 13)}px`);
}

function closeContactDialog() {
  if (!contactDialogLayer?.classList.contains('is-open')) return;
  const closingTrigger = lastContactTrigger;
  contactDialogLayer.classList.remove('is-open');
  contactDialogLayer.setAttribute('aria-hidden', 'true');
  closingTrigger?.setAttribute('aria-expanded', 'false');
  closingTrigger?.closest('.social-item')?.classList.remove('has-dialog-open');
  lastContactTrigger = null;
  window.setTimeout(() => closingTrigger?.focus(), 360);
}

document.querySelectorAll('.contact-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const content = contactContent[trigger.dataset.contact];
    if (!content || !contactDialogLayer) return;
    if (contactDialogLayer.classList.contains('is-open') && lastContactTrigger === trigger) {
      closeContactDialog();
      return;
    }
    lastContactTrigger?.setAttribute('aria-expanded', 'false');
    lastContactTrigger?.closest('.social-item')?.classList.remove('has-dialog-open');
    lastContactTrigger = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.closest('.social-item')?.classList.add('has-dialog-open');
    contactDialogTitle.textContent = content.title;
    contactDialogValue.textContent = trigger.dataset.contactValue;
    contactDialogCopyLabel.textContent = '复制';
    contactDialog.style.setProperty('--contact-dialog-width', `${content.width}px`);
    positionContactDialog();
    contactDialogCopy.classList.remove('is-copied');
    contactDialogLayer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      contactDialogLayer.classList.add('is-open');
      contactDialogLayer.querySelector('.contact-dialog-close')?.focus();
    });
  });
});

window.addEventListener('resize', positionContactDialog);
window.addEventListener('scroll', positionContactDialog, { passive: true });

contactDialogLayer?.querySelectorAll('[data-contact-close]').forEach((button) => button.addEventListener('click', closeContactDialog));
contactDialogCopy?.addEventListener('click', async () => {
  await copyText(contactDialogValue.textContent);
  const isChinese = document.documentElement.lang === 'zh-CN';
  const original = contactDialogCopyLabel.textContent;
  contactDialogCopyLabel.textContent = isChinese ? '已复制' : 'Copied';
  contactDialogCopy.classList.add('is-copied');
  window.setTimeout(() => {
    contactDialogCopyLabel.textContent = original;
    contactDialogCopy.classList.remove('is-copied');
  }, 1400);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeContactDialog();
});

const illustrationMosaic = document.querySelector('.illustration-mosaic[data-opacities]');
if (illustrationMosaic) {
  const opacities = illustrationMosaic.dataset.opacities.split(',').map(Number);
  opacities.forEach((opacity) => {
    const square = document.createElement('i');
    square.style.opacity = String(opacity / 100);
    illustrationMosaic.appendChild(square);
  });
}

const capabilitiesShowcase = document.querySelector('.capabilities-showcase');
if (capabilitiesShowcase) {
  const updateCapabilityBorderGlow = (event) => {
    const rect = capabilitiesShowcase.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const scaleX = dx === 0 ? Infinity : centerX / Math.abs(dx);
    const scaleY = dy === 0 ? Infinity : centerY / Math.abs(dy);
    const edgeProximity = Math.min(Math.max(1 / Math.min(scaleX, scaleY), 0), 1);
    let cursorAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (cursorAngle < 0) cursorAngle += 360;

    capabilitiesShowcase.style.setProperty('--capability-edge-proximity', (edgeProximity * 100).toFixed(3));
    capabilitiesShowcase.style.setProperty('--capability-cursor-angle', `${cursorAngle.toFixed(3)}deg`);
  };

  capabilitiesShowcase.addEventListener('pointermove', updateCapabilityBorderGlow);

  if ('IntersectionObserver' in window) {
    const capabilitiesObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-dropping');
        observer.unobserve(entry.target);
      });
    }, { threshold: .5, rootMargin: '0px' });
    capabilitiesObserver.observe(capabilitiesShowcase);
  } else {
    capabilitiesShowcase.classList.add('is-dropping');
  }
}

const revealGroups = [
  ['.hero-nav a', 70],
  ['.feature-card', 90],
  ['.work-card', 180, 720],
  ['.detail-row h2', 80],
  ['.experience-list article', 90],
  ['.compact-row > p, .social-links', 90],
];

document.documentElement.classList.add('reveal-ready');

const revealItems = [];
revealGroups.forEach(([selector, step, maxDelay = 360]) => {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.classList.add('reveal-item');
    element.style.setProperty('--reveal-delay', `${Math.min(index * step, maxDelay)}ms`);
    revealItems.push(element);
  });
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      revealItems.forEach((element) => revealObserver.observe(element));
    });
  });
} else {
  revealItems.forEach((element) => element.classList.add('is-visible'));
}
