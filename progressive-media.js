/* Fetch original artwork shortly before it enters the viewport, not pages ahead. */
(() => {
  // The OKR working-set controller owns its original image sources across
  // suspend/resume. A second one-shot observer must not reload released images.
  const images = [...document.querySelectorAll('img[data-media-src]')].filter(image=>!image.closest('[data-okr-resource-managed]'));
  if (!images.length) return;
  const load = (image, priority = 'low') => {
    if (!image.dataset.mediaSrc) return;
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
  const scrollImages=images.filter(image=>image.hasAttribute('data-media-scroll'));
  const normalImages=images.filter(image=>!image.hasAttribute('data-media-scroll'));
  if(scrollImages.length){
    const scrollObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      load(entry.target);
      scrollObserver.unobserve(entry.target);
    }),{rootMargin:'0px 0px -96px 0px'});
    const observeScrollImages=()=>scrollImages.forEach(image=>scrollObserver.observe(image));
    if(document.documentElement.classList.contains('detail-motion-pending')){
      const ready=new MutationObserver(()=>{
        if(document.documentElement.classList.contains('detail-motion-pending'))return;
        ready.disconnect();observeScrollImages();
      });
      ready.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    }else observeScrollImages();
  }
  // Mobile layout runs after this deferred script. A detail transition can
  // request its newly positioned first viewport without fetching later slides.
  document.addEventListener('detail:prepare-first-paint',()=>normalImages.forEach(image=>{
    const rect=image.getBoundingClientRect();
    if(rect.width&&rect.height&&rect.bottom>0&&rect.top<innerHeight)load(image,'high');
  }));
  normalImages.forEach(image => {
    const rect = image.getBoundingClientRect();
    if (rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight) load(image, 'high');
    else observer.observe(image);
  });
})();
