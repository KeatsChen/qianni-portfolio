// Shared mobile chrome stays native-sized; only the architecture artwork is
// measured in its own Figma mobile coordinates. No navigation interception.
(() => {
  const mobile=matchMedia('(max-width:760px)');
  const arrows=[...document.querySelectorAll('.project-pagination-arrow img')].map(e=>[e,e.getAttribute('src')]);
  const updateArrows=()=>arrows.forEach(([e,src])=>e.setAttribute('src',mobile.matches?'assets/architecture-v2/nav-arrow.svg':src));
  updateArrows();mobile.addEventListener('change',updateArrows);
  const artwork=document.querySelector('.arch-mobile-case');
  if(!artwork)return;
  const texts=[...artwork.querySelectorAll('[data-case-text-width]')].filter(e=>!e.parentElement.closest('[data-case-text-width]')&&!e.hasAttribute('data-arch-mobile-heading')&&(e.hasAttribute('data-arch-copy-source')||e.querySelector('[data-en],[data-arch-copy-source]')));
  let pending=0;
  const layout=()=>{
    pending=0;if(!mobile.matches)return;
    const scale=artwork.clientWidth/377;
    artwork.style.setProperty('--arch-mobile-scale',String(scale));
    texts.forEach(e=>e.style.setProperty('--case-copy-scale','1'));
    if(document.documentElement.lang!=='en')return;
    const fits=e=>{
      const range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect();
      return r.width<=Number(e.dataset.caseTextWidth)*scale+1 && r.height<=(Number(e.dataset.caseTextHeight)+4)*scale+1;
    };
    const bounds=texts.filter(e=>!fits(e)).map(e=>({e,low:.3,high:1}));
    for(let pass=0;pass<9;pass++){
      bounds.forEach(b=>b.e.style.setProperty('--case-copy-scale',String((b.low+b.high)/2)));
      const result=bounds.map(b=>fits(b.e));
      bounds.forEach((b,i)=>{const mid=(b.low+b.high)/2;if(result[i])b.low=mid;else b.high=mid;});
    }
    bounds.forEach(b=>b.e.style.setProperty('--case-copy-scale',String(b.low)));
  };
  const queue=()=>{if(!pending)pending=requestAnimationFrame(layout);};
  new ResizeObserver(queue).observe(artwork);
  new MutationObserver(queue).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  mobile.addEventListener('change',queue);document.fonts.ready.then(queue);layout();
})();
