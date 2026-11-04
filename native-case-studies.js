(() => {
  const gallery=document.querySelector('.native-case-gallery');
  if(!gallery)return;
  const isChatbot=document.body.classList.contains('chatbot-detail-page');
  const intro=isChatbot?gallery.querySelector('[data-node-id="5103:3567"]'):null;
  const reflections=isChatbot?gallery.querySelector('[data-node-id="5103:4100"]'):null;
  const tightenReflectionGaps=()=>{
    if(!reflections)return;
    const modules=[...reflections.children];
    const contentHeight=modules.reduce((sum,e)=>sum+parseFloat(getComputedStyle(e).height),0);
    // Previously four modules filled a 456px frame with three equal gaps.
    // Reduce those gaps by two thirds without changing text or line-height.
    const gap=Math.max(0,(456-contentHeight)/(modules.length-1)/3);
    reflections.style.setProperty('--case-reflection-gap',`${gap}px`);
  };
  const candidates=[...gallery.querySelectorAll('[data-case-text-width]:not([data-case-preserve-font])')];
  // Fit a rich-text block once, so nested highlighted spans keep its scale.
  const texts=candidates.filter(e=>!e.parentElement.closest('[data-case-text-width]'));
  let frame=0;
  const fitEnglish=()=>{
    frame=0;
    // Fit using the original line boxes, then tighten just the introduction.
    // Otherwise the extra room would cause the fitter to enlarge its type.
    if(intro)intro.style.setProperty('--case-intro-leading-factor','1');
    texts.forEach(e=>e.style.setProperty('--case-copy-scale',document.documentElement.lang==='en'?(e.dataset.caseMaxScale||'1'):'1'));
    if(document.documentElement.lang!=='en'){tightenReflectionGaps();return;}
    const scale=gallery.clientWidth/1084;
    const fits=e=>{
      const range=document.createRange();range.selectNodeContents(e);
      const rect=range.getBoundingClientRect();
      return rect.width<=(Number(e.dataset.caseEnglishWidth||e.dataset.caseTextWidth)+1)*scale
        &&Math.max(e.scrollHeight,e.clientHeight)<=Number(e.dataset.caseEnglishHeight||e.dataset.caseTextHeight)+1;
    };
    if(isChatbot){
      // Search for the largest fitting size instead of reducing by the first
      // overflow ratio, which over-shrinks text when wrapping loses a line.
      const bounds=texts.filter(e=>!fits(e)).map(e=>({e,low:.05,high:Number(e.dataset.caseMaxScale||1)}));
      for(let pass=0;pass<8;pass++){
        bounds.forEach(b=>b.e.style.setProperty('--case-copy-scale',String((b.low+b.high)/2)));
        const results=bounds.map(b=>fits(b.e));
        bounds.forEach((b,i)=>{const middle=(b.low+b.high)/2;if(results[i])b.low=middle;else b.high=middle;});
      }
      bounds.forEach(b=>b.e.style.setProperty('--case-copy-scale',String(b.low)));
      // Increase the previous .75 line-height by one third; retain the
      // same fitting pass and type size, changing only the leading.
      if(intro)intro.style.setProperty('--case-intro-leading-factor','1');
      tightenReflectionGaps();
      return;
    }
    // OKR: retain the design size whenever it fits. Repeated glyph-height
    // ratios used to shrink even short labels and compound rich-text scales.
    const bounds=texts.filter(e=>!fits(e)).map(e=>({e,low:.05,high:1}));
    for(let pass=0;pass<10;pass++){
      bounds.forEach(b=>b.e.style.setProperty('--case-copy-scale',String((b.low+b.high)/2)));
      const results=bounds.map(b=>fits(b.e));
      bounds.forEach((b,i)=>{const middle=(b.low+b.high)/2;if(results[i])b.low=middle;else b.high=middle;});
    }
    bounds.forEach(b=>b.e.style.setProperty('--case-copy-scale',String(b.low)));
  };
  const queueFit=()=>{if(!frame)frame=requestAnimationFrame(fitEnglish);};
  const resize=()=>{gallery.style.setProperty('--case-scale',String(gallery.clientWidth/1084));queueFit();};
  resize();
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(gallery);
  else window.addEventListener('resize',resize,{passive:true});
  new MutationObserver(queueFit).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.fonts.ready.then(queueFit);
  if(!window.detailMotionManaged&&'IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
    gallery.classList.add('is-enhanced');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting||entry.boundingClientRect.bottom<0){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    }),{threshold:0,rootMargin:'0px 0px 60px 0px'});
    gallery.querySelectorAll('.case-native-slide').forEach(e=>observer.observe(e));
  }
})();
