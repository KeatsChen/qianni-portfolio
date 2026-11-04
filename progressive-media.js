/* Fetch original artwork shortly before it enters the viewport, not pages ahead. */
(() => {
  const images = [...document.querySelectorAll('img[data-media-src]')];
  if (!images.length) return;
  const load = (image, priority = 'low') => {
    image.loading = 'eager';
    image.fetchPriority = priority;
    image.closest('picture')?.querySelectorAll('source[data-media-srcset]').forEach(source => {
      source.srcset = source.dataset.mediaSrcset;
      source.removeAttribute('data-media-srcset');
    });
    if (image.dataset.mediaSrcset) image.srcset = image.dataset.mediaSrcset;
    image.src = image.dataset.mediaSrc;
    image.removeAttribute('data-media-src');
    image.removeAttribute('data-media-srcset');
  };
  if (!('IntersectionObserver' in window)) { images.forEach(image => load(image, 'auto')); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    load(entry.target);
    observer.unobserve(entry.target);
  }), { rootMargin: '500px 0px' });
  images.forEach(image => {
    const rect = image.getBoundingClientRect();
    if (rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight) load(image, 'high');
    else observer.observe(image);
  });
})();
