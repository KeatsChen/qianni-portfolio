// Figma frame 4231:502 is 1440px wide. Use its original glow exports without
// changing paint, opacity or blur. Anchor their centers to the same chapters
// when responsive reflow or a different language changes chapter positions.
(() => {
  const backdrop = document.querySelector('.arch-backdrop');
  const main = document.querySelector('.arch-case');
  if (!backdrop || !main) return;

  const referenceWidth = 1440;
  const anchors = [
    [0, null],
    [1406, '.arch-background'],
    [2149, '.arch-comparison'],
    [3287, '.arch-interviews'],
    [4274, '.arch-goals'],
    [5247, '.arch-information-architecture'],
    [6352, '.arch-visual-direction'],
    [7284, '.arch-typography'],
    [8245, '.arch-colors'],
    [9126, '.arch-icons'],
    [10110, '.arch-more'],
    [11887, '.arch-summary'],
    [12586, '#project-navigation'],
  ].map(([designY, selector]) => ({
    designY,
    element: selector ? main.querySelector(selector) : null,
  }));

  // Preserve the Figma layer order. Width/height include the exported blur.
  const definitions = [
    ['5000:1019', 'right', 1361, 7423.5, 1905.2, 1905.2],
    ['5000:1021', 'right', 1361, 11396.5, 1905.2, 1905.2],
    ['5000:1020', 'left', -17.75, 8676.25, 3125.06, 3125.06],
    ['5000:1022', 'left', -18, 12176.25, 3125.06, 3125.06],
    ['5005:1168', 'center', 721.5, 4625.5, 2177.76, 2177.76],
    ['5005:1173', 'right', 1360.5, 2134.5, 1905.2, 1905.2],
    ['5005:1174', 'left', -29.75, 3087.25, 3125.06, 3125.06],
    ['4974:206', 'top', 214, -67, 1590.06, 1950.06],
  ];
  const glows = definitions.map(([id, asset, x, y, width, height]) => {
    const element = document.createElement('div');
    element.className = 'arch-backdrop-glow';
    element.dataset.designNode = id;
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    const image = document.createElement('img');
    image.src = 'assets/architecture-v2/glow-' + asset + '.svg';
    image.alt = '';
    element.append(image);
    backdrop.append(element);
    return { element, image, x, y, width, height };
  });

  function alignBackdrop() {
    const frame = main.getBoundingClientRect();
    const body = document.body.getBoundingClientRect();
    const scale = frame.width / referenceWidth;
    const positions = anchors.map(({ designY, element }) => ({
      designY,
      actualY: element ? element.getBoundingClientRect().top - body.top : 0,
    }));
    const chapterY = (designY) => {
      if (designY <= 0) return designY * scale;
      for (let index = 1; index < positions.length; index++) {
        const end = positions[index];
        if (designY > end.designY) continue;
        const start = positions[index - 1];
        const progress = (designY - start.designY) / (end.designY - start.designY);
        return start.actualY + progress * (end.actualY - start.actualY);
      }
      const end = positions[positions.length - 1];
      return end.actualY + (designY - end.designY) * scale;
    };
    backdrop.style.left = (frame.left - body.left) + 'px';
    backdrop.style.right = 'auto';
    backdrop.style.width = frame.width + 'px';
    glows.forEach(({ element, x, y, width, height }) => {
      const left = (x - width / 2) * scale;
      const top = chapterY(y) - height * scale / 2;
      element.style.transform = 'translate(' + left + 'px,' + top + 'px) scale(' + scale + ')';
    });
  }

  let queued = false;
  function scheduleAlignment() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      alignBackdrop();
    });
  }
  alignBackdrop();
  // Keep the original whole-image fallback if an export fails to load.
  Promise.all(glows.map(({ image }) => image.decode())).then(() => {
    alignBackdrop();
    backdrop.classList.add('is-aligned');
  }).catch(() => {});
  if ('ResizeObserver' in window) new ResizeObserver(scheduleAlignment).observe(main);
  window.addEventListener('resize', scheduleAlignment, { passive:true });
  new MutationObserver(scheduleAlignment).observe(document.documentElement, {
    attributes:true, attributeFilter:['lang'],
  });
  document.fonts.ready.then(scheduleAlignment);
})();
