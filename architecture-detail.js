// Only this case study uses rich bilingual copy. Build emphasis as DOM nodes
// so translations remain selectable text and never become executable markup.
const archRichCopy = [...document.querySelectorAll('[data-rich-en][data-rich-zh]')];
function renderArchitectureCopy() {
  const language = document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
  archRichCopy.forEach((element) => {
    const source = language === 'zh' ? element.dataset.richZh : element.dataset.richEn;
    const fragment = document.createDocumentFragment();
    source.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const strong = document.createElement('strong');
        strong.textContent = part.slice(2, -2);
        fragment.append(strong);
      } else fragment.append(document.createTextNode(part));
    });
    element.replaceChildren(fragment);
  });
}
renderArchitectureCopy();
new MutationObserver(() => {
  renderArchitectureCopy();
  preserveRevisedCopyLayout();
}).observe(document.documentElement, {
  attributes:true, attributeFilter:['lang'],
});

// Wording can change without moving the surrounding artwork. Measure the
// previous bilingual copy at each current column width, retaining its space.
const layoutCopyTargets = [...document.querySelectorAll('[data-layout-rich-en][data-layout-rich-zh]')];
function preserveRevisedCopyLayout() {
  const english = document.documentElement.lang === 'en';
  layoutCopyTargets.forEach((element) => {
    const reference = element.cloneNode(false);
    reference.removeAttribute('id');
    reference.setAttribute('aria-hidden', 'true');
    reference.inert = true;
    reference.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${element.getBoundingClientRect().width}px;`;
    reference.textContent = (english ? element.dataset.layoutRichEn : element.dataset.layoutRichZh).replaceAll('**', '');
    element.parentElement.append(reference);
    element.style.minHeight = `${reference.getBoundingClientRect().height}px`;
    reference.remove();
  });
}
preserveRevisedCopyLayout();
if ('ResizeObserver' in window) {
  const widths = new WeakMap();
  const copyObserver = new ResizeObserver((entries) => {
    let resized = false;
    entries.forEach(({ target, contentRect }) => {
      if (widths.get(target) !== contentRect.width) resized = true;
      widths.set(target, contentRect.width);
    });
    if (resized) preserveRevisedCopyLayout();
  });
  layoutCopyTargets.forEach((element) => copyObserver.observe(element));
}
document.fonts.ready.then(preserveRevisedCopyLayout);

const archRevealTargets = [...document.querySelectorAll('.arch-reveal')];
clearTimeout(window.archRevealFallback);
if (!document.documentElement.classList.contains('arch-motion-ready')) {
  archRevealTargets.forEach((element) => element.classList.add('is-visible'));
} else {
  const pending = new Set();
  let revealTimer = null;
  // Use visual position rather than DOM order: the desktop facts sit beside
  // the title, but flow below the responsibilities on narrow screens.
  const revealNext = () => {
    revealTimer = null;
    const ordered = [...pending].sort((a, b) => {
      const first = a.getBoundingClientRect();
      const second = b.getBoundingClientRect();
      return first.top - second.top || first.left - second.left;
    });
    const next = ordered[0];
    if (!next) return;
    pending.delete(next);
    next.classList.add('is-visible');
    observer.unobserve(next);
    if (pending.size) revealTimer = setTimeout(revealNext, 140);
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) pending.add(entry.target);
      else {
        pending.delete(entry.target);
        // Fast scrolling must never leave already-passed content hidden.
        if (entry.boundingClientRect.bottom < 0) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    });
    if (pending.size && revealTimer === null) revealTimer = setTimeout(revealNext, 0);
  }, { threshold:0, rootMargin:'0px 0px 60px 0px' });
  archRevealTargets.forEach((element) => observer.observe(element));
}
