/* One progressive entrance controller for every project detail template. */
(() => {
  const root=document.documentElement;
  window.detailMotionManaged=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const animate=!reduced.matches&&('IntersectionObserver' in window);
  root.classList.add('detail-motion-pending');
  const failOpen=()=>root.classList.remove('detail-motion-pending','detail-motion-ready');
  const start=()=>{
    // A failed layout script must not expose the uninitialized page. The
    // independent loader instead offers Retry and Back until startup succeeds.
    if(!document.querySelector('.detail-overview-title'))return;
    try {
      // Start first-viewport media without tying navigation or controls to it.
      document.dispatchEvent(new Event('detail:prepare-first-paint'));
      if(!animate){failOpen();return;}
      const selector=[
        '.detail-overview-title h1','.detail-overview-fields > dl',
        '.detail-overview-facts','.arch-reveal','.project-gallery > img',
        '.case-native-slide','.reveal-item','.site-copyright'
      ].join(',');
      const controls='a[href],button,input,select,textarea,summary,[role="button"]';
      const candidates=[...document.querySelectorAll(selector)].filter(e=>
        !e.matches(controls)&&!e.querySelector(controls)&&e.getClientRects().length&&getComputedStyle(e).display!=='none'
      );
      const selected=new Set(candidates);
      const targets=candidates.filter(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(selected.has(p))return false;return true;});
      targets.forEach(e=>e.setAttribute('data-detail-enter',''));
      root.classList.add('detail-motion-ready');
      // Commit the non-animated hidden state before exposing the page and
      // scheduling the first entrance. Otherwise browsers can transition
      // from the element's previous opacity:1 down to 0 first.
      targets.forEach(e=>getComputedStyle(e).opacity);
      root.classList.remove('detail-motion-pending');
      const pending=new Set();
      let timer=null;
      const show=e=>{e.setAttribute('data-detail-shown','');e.removeAttribute('data-detail-recovery');pending.delete(e);observer.unobserve(e);};
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
        if(r.width&&r.height&&r.top<=innerHeight+40){
          e.setAttribute('data-detail-recovery','');
          pending.add(e);if(timer===null)timer=setTimeout(tick,0);
        }
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
      // First paint must not depend on the observer's first callback. Some
      // restored/backgrounded tabs deliver it late or not at all. The same
      // position-sorted queue handles both observers and direct viewport scans.
      const scan=()=>targets.forEach(enqueue);
      scan();
      window.addEventListener('scroll',scan,{passive:true});
      window.addEventListener('resize',scan,{passive:true});
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)scan();});
      // Retain the startup watchdog until the visible content actually shows,
      // rather than cancelling it as soon as the observer is constructed.
      setTimeout(()=>{
        const visible=targets.filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.top<innerHeight;});
        if(visible.some(e=>!e.hasAttribute('data-detail-shown')))finish();
      },3000);
      const finish=()=>{if(timer!==null)clearTimeout(timer);timer=null;targets.forEach(show);observer.disconnect();};
      reduced.addEventListener('change',e=>{if(e.matches)finish();});
      window.addEventListener('pageshow',e=>{if(e.persisted)finish();});
    }catch(error){failOpen();console.error('Detail entrance disabled:',error);}
  };
  // A deferred controller executes before later deferred mobile/layout scripts.
  // Start only after those scripts finish; the parser itself is never blocked.
  if(document.readyState==='loading'||document.currentScript?.defer)document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
