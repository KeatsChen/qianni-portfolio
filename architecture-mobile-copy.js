// The Web article is the canonical bilingual copy. Mobile keeps its own
// Figma layers and typography, but never maintains a second editorial version.
(() => {
  const mobile=document.querySelector('.arch-mobile-case');
  if(!mobile)return;
  const bindings=[];let key=0;
  const bind=(target,source,rich=false)=>{
    if(!target||!source)return;
    if(!source.dataset.architectureCopyKey)source.dataset.architectureCopyKey=`architecture-copy-${key++}`;
    target.dataset.archCopySource=`[data-architecture-copy-key="${source.dataset.architectureCopyKey}"]`;
    if(rich){
      const sample=[...target.querySelectorAll('span')].find(e=>parseFloat(getComputedStyle(e).fontSize)>0)||target;
      const style=getComputedStyle(sample),size=parseFloat(style.fontSize)||12;
      const leading=parseFloat(style.lineHeight)||size*1.5;
      target.style.fontSize=`calc(${size}px * var(--case-copy-scale,1))`;
      target.style.lineHeight=`calc(${leading}px * var(--case-copy-scale,1))`;
    }
    bindings.push({target,source,rich,parts:rich==='split'?[...target.children]:null});
  };
  const webTexts=[...document.querySelectorAll('.arch-case [data-en][data-zh]')].filter(e=>!e.closest('.arch-mobile-case'));
  const byChinese=new Map();webTexts.forEach(e=>{if(!byChinese.has(e.dataset.zh))byChinese.set(e.dataset.zh,e);});
  for(const target of mobile.querySelectorAll('[data-en][data-zh]'))bind(target,byChinese.get(target.dataset.zh));
  // A goal and a chapter can share a Chinese name but use different English
  // wording. Chapter headings and their small captions follow the Web chapter.
  for(const heading of mobile.querySelectorAll('[data-arch-mobile-heading]')){
    const text=heading.querySelector('[data-zh]');
    const source=webTexts.find(e=>e.matches('.arch-section-heading h2')&&e.dataset.zh===text?.dataset.zh);
    if(!source)continue;
    if(text){const old=bindings.findIndex(b=>b.target===text);if(old>=0)bindings.splice(old,1);bind(text,source);}
    for(const caption of heading.parentElement.querySelectorAll('p')){
      if(caption!==heading&&caption.textContent==='Architecture')bind(caption,source.parentElement.querySelector('p'));
    }
  }
  const paragraphs={
    '5168:2370':'.arch-background-lead',
    '5186:3313':'.arch-quote:nth-child(1) blockquote',
    '5186:3314':'.arch-quote:nth-child(2) blockquote',
    '5183:2993':'.arch-information-copy > .arch-rich',
    '5183:3017':'.arch-research-card:nth-child(1) > .arch-rich',
    '5183:3018':'.arch-research-card:nth-child(2) > .arch-rich',
    '5183:3019':'.arch-research-card:nth-child(3) > .arch-rich',
    '5186:3405':'.arch-color-copy',
    '5183:3129':'.arch-icon-row:nth-of-type(1) > .arch-rich',
    '5183:3130':'.arch-icon-row:nth-of-type(2) > .arch-rich'
  };
  for(const [id,selector] of Object.entries(paragraphs))bind(mobile.querySelector(`[data-node-id="${id}"]`),document.querySelector(selector),true);
  for(let i=1;i<=3;i++)bind(mobile.querySelector(`[data-node-id="5183:3237"] > li:nth-child(${i})`),document.querySelector(`.arch-takeaways > li:nth-child(${i})`),true);
  // The white swatch caption is split into two differently colored spans in
  // Figma; its wording still comes from the same Web component.
  for(const id of ['5186:3419','5186:3478','5186:3487'])bind(mobile.querySelector(`[data-node-id="${id}"]`),document.querySelector('.arch-secondary-swatches .arch-swatch h3'),id==='5186:3487'?'split':true);
  const sync=()=>{
    const english=document.documentElement.lang==='en';
    bindings.forEach(({target,source,rich,parts})=>{
      if(rich==='split'){
        const text=source.textContent,cut=english?6:2;
        parts[0].textContent=text.slice(0,cut);parts[1].textContent=text.slice(cut);
      }
      else if(rich){target.replaceChildren(...[...source.childNodes].map(n=>n.cloneNode(true)));}
      else {
        if(source.dataset.en!==undefined){target.dataset.en=source.dataset.en;target.dataset.zh=source.dataset.zh;}
        target.textContent=english?(source.dataset.en??source.textContent):(source.dataset.zh??source.textContent);
      }
    });
  };
  sync();new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
