/* One progressive entrance controller for every project detail template. */
(() => {
  const root=document.documentElement;
  window.detailMotionManaged=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches||!('IntersectionObserver' in window))return;
  root.classList.add('detail-motion-pending');
  const failOpen=()=>root.classList.remove('detail-motion-pending','detail-motion-ready');
  const fallback=setTimeout(failOpen,5000);
  const start=()=>{
    // If the fail-open timeout already exposed the page, leave it visible.
    if(!root.classList.contains('detail-motion-pending'))return;
    try {
      const selector=[
        '.site-nav > *','.detail-overview-title','.detail-overview-fields > dl',
        '.detail-overview-facts','.arch-reveal','.project-gallery > img',
        '.case-native-slide','.reveal-item','.project-pagination','.site-copyright'
      ].join(',');
      const candidates=[...document.querySelectorAll(selector)].filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none');
      const selected=new Set(candidates);
      const targets=candidates.filter(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(selected.has(p))return false;return true;});
      targets.forEach(e=>e.setAttribute('data-detail-enter',''));
      root.classList.add('detail-motion-ready');
      // Commit the non-animated hidden state before exposing the page and
      // scheduling the first entrance. Otherwise browsers can transition
      // from the element's previous opacity:1 down to 0 first.
      targets.forEach(e=>getComputedStyle(e).opacity);
      root.classList.remove('detail-motion-pending');
      clearTimeout(fallback);
      const pending=new Set();
      let timer=null;
      const show=e=>{e.setAttribute('data-detail-shown','');pending.delete(e);observer.unobserve(e);};
      const tick=()=>{
        timer=null;
        const ordered=[...pending].filter(e=>{
          const r=e.getBoundingClientRect();
          if(r.bottom<0){show(e);return false;}
          if(r.top>innerHeight+40){pending.delete(e);return false;}
          return r.width>0&&r.height>0;
        }).sort((a,b)=>{
          const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
          return x.top-y.top||x.left-y.left;
        });
        if(ordered.length)show(ordered[0]);
        if(ordered.length>1)timer=setTimeout(tick,140);
      };
      const enqueue=e=>{
        if(e.hasAttribute('data-detail-shown'))return;
        const r=e.getBoundingClientRect();
        if(r.bottom<0){show(e);return;}
        if(r.width&&r.height&&r.top<=innerHeight+40){pending.add(e);if(timer===null)timer=setTimeout(tick,0);}
      };
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting)enqueue(entry.target);
          else if(entry.boundingClientRect.bottom<0)show(entry.target);
          else pending.delete(entry.target);
        });
      },{threshold:0,rootMargin:'0px 0px 40px 0px'});
      targets.forEach(e=>{
        observer.observe(e);
        if(e.tagName==='IMG')e.addEventListener('load',()=>enqueue(e),{once:true});
      });
      const finish=()=>{if(timer!==null)clearTimeout(timer);timer=null;targets.forEach(show);observer.disconnect();};
      reduced.addEventListener('change',e=>{if(e.matches)finish();});
      window.addEventListener('pageshow',e=>{if(e.persisted)finish();});
    }catch(error){clearTimeout(fallback);failOpen();console.error('Detail entrance disabled:',error);}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
