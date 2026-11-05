/* Keep the original artwork, but bound its live image/paint working set on
   phones. The section boxes and all selectable bilingual text stay in the DOM. */
(() => {
  if(!document.body.classList.contains('okr-detail-page')||!('IntersectionObserver' in window))return;
  const slides=[...document.querySelectorAll('.native-case-gallery > .case-native-slide')];
  if(!slides.length)return;
  const mobile=matchMedia('(max-width:760px)');
  const records=new Map();
  slides.forEach(slide=>{
    slide.setAttribute('data-okr-resource-managed','');
    records.set(slide,[...slide.querySelectorAll('img')].filter(img=>img.dataset.mediaSrc||img.getAttribute('src')).map(img=>({
      img,src:img.dataset.mediaSrc||img.getAttribute('src'),
      srcset:img.dataset.mediaSrcset||img.getAttribute('srcset'),
      sources:[...img.closest('picture')?.querySelectorAll('source')||[]].map(source=>({source,srcset:source.dataset.mediaSrcset||source.getAttribute('srcset')}))
    })));
  });
  const images=new Map([...records.values()].flat().map(record=>[record.img,record]));
  const load=record=>{
    if(record.img.getAttribute('src')===record.src)return;
    record.sources.forEach(({source,srcset})=>{if(srcset)source.srcset=srcset;});
    if(record.srcset)record.img.srcset=record.srcset;
    record.img.loading='eager';record.img.fetchPriority='low';
    record.img.src=record.src;
  };
  const release=record=>{
    // Never set src="": that can request the document itself. Removing the
    // source drops the decoded-image reference without changing the original.
    record.img.removeAttribute('src');record.img.removeAttribute('srcset');
    record.sources.forEach(({source})=>source.removeAttribute('srcset'));
  };
  const suspend=slide=>{
    if(slide.hasAttribute('data-okr-resource-suspended'))return;
    slide.setAttribute('data-okr-resource-suspended','');
    records.get(slide).forEach(release);
  };
  const resume=slide=>{
    const wasSuspended=slide.hasAttribute('data-okr-resource-suspended');
    slide.removeAttribute('data-okr-resource-suspended');
    records.get(slide).forEach(load);
    if(wasSuspended)window.dispatchEvent(new Event('native-case-resume'));
  };
  // One short guard band prepares the next section without retaining every
  // chapter already read. Observe stable section boxes, never hidden canvases.
  const margin=200;
  const reconcile=()=>{
    if(!mobile.matches)return;
    slides.forEach(slide=>{
      const r=slide.getBoundingClientRect();
      if(r.bottom>=-margin&&r.top<=innerHeight+margin)resume(slide);else suspend(slide);
    });
  };
  const sectionObserver=new IntersectionObserver(()=>reconcile(),{rootMargin:`${margin}px 0px`});
  const imageObserver=new IntersectionObserver(entries=>{
    if(mobile.matches)return;
    entries.forEach(entry=>{if(entry.isIntersecting){load(images.get(entry.target));imageObserver.unobserve(entry.target);}});
  },{rootMargin:'500px 0px'});
  const apply=()=>{
    sectionObserver.disconnect();imageObserver.disconnect();
    if(mobile.matches){reconcile();slides.forEach(slide=>sectionObserver.observe(slide));}
    else {
      slides.forEach(slide=>slide.removeAttribute('data-okr-resource-suspended'));
      images.forEach(record=>{if(!record.img.getAttribute('src'))imageObserver.observe(record.img);});
      window.dispatchEvent(new Event('native-case-resume'));
    }
  };
  mobile.addEventListener('change',apply);
  window.addEventListener('pageshow',reconcile);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconcile();});
  apply();
})();
