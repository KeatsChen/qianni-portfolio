/* Keep the editable mobile overview; render case-study artwork at its Web
 * design width and scale the whole composition, not individual components. */
(() => {
  if (!document.querySelector('.detail-overview')) return;
  const query=matchMedia('(max-width:760px)');
  // These editorial studies have dedicated app/Figma mobile compositions.
  // Only their shared overview is extracted; retain responsive CSS and media.
  const editorial=document.body.matches('.research-page,.cozyup-page,.materials-page,.architecture-detail-page');
  // app/work detail-chatboot + app/work detail-okr scale the 1084px
  // presentation canvases into a 16px-gutter mobile column, not the Web shell.
  const nativeCanvas=document.body.matches('.chatbot-detail-page,.okr-detail-page');
  const hasMobileBody=editorial||nativeCanvas;
  const files=new Set(['project1.css','architecture-detail.css','research.css','cozyup.css','materials.css']);
  const sheets=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(link=>files.has(new URL(link.href).pathname.split('/').pop()));
  const copies=[];
  const frames=[];
  const sources=[];
  let pagination, paginationPlaceholder;
  let placeholder,overview,active=false;
  const desktopMedia=value=>value.replace(/\((min|max)-width:\s*([\d.]+)px\)/gi,(_,kind,width)=>`(min-width:${(kind==='min'?1440>=Number(width):1440<=Number(width))?0:100000}px)`);
  const serialize=rules=>[...rules].map(rule=>{
    if(rule.type===CSSRule.MEDIA_RULE)return `@media ${desktopMedia(rule.conditionText)}{${serialize(rule.cssRules)}}`;
    return rule.cssText.replace(/([\d.]+)vw\b/g,(_,value)=>`${Number(value)*14.4}px`);
  }).join('\n');
  const resize=()=>{
    const scale=document.documentElement.clientWidth/1440;
    frames.forEach(frame=>{frame.style.zoom=String(scale);frame.dataset.detailScale=String(scale);});
  };
  const apply=()=>{
    if(query.matches&&!active){
      active=true;
      // Read the downloaded same-origin sheets before disabling their mobile
      // breakpoints. Preserve source order and non-width media preferences.
      if(!hasMobileBody)sheets.forEach(link=>{
        const style=document.createElement('style');
        style.media='(max-width:760px)';
        style.textContent=serialize(link.sheet.cssRules);
        link.after(style);copies.push([link,style,link.media]);
        link.media='(min-width:761px)';
      });
      overview=document.querySelector('.detail-overview');
      const main=document.querySelector('main');
      placeholder=document.createComment('mobile overview position');
      overview.before(placeholder);main.before(overview);
      // Pagination is a shared mobile component, not part of scaled artwork.
      // Keep the same live anchors and restore their exact desktop location.
      pagination=document.querySelector('.project-pagination-surface')||document.querySelector('.project-pagination');
      if(pagination&&main.contains(pagination)){
        paginationPlaceholder=document.createComment('desktop project switch position');
        pagination.before(paginationPlaceholder);main.after(pagination);
      }
      document.body.classList.add(nativeCanvas?'mobile-detail-native':editorial?'mobile-detail-editorial':'mobile-detail-scaled');
      const roots=hasMobileBody?[]:[main];
      roots.forEach(element=>{
        const frame=document.createElement('div');frame.className='scaled-detail-body';
        element.before(frame);frame.append(element);frames.push(frame);
      });
      frames.forEach(frame=>frame.querySelectorAll('picture source[media]').forEach(source=>{
        sources.push([source,source.media]);source.media=desktopMedia(source.media);
      }));
      resize();
    }else if(!query.matches&&active){
      active=false;
      placeholder.replaceWith(overview);
      frames.splice(0).forEach(frame=>frame.replaceWith(...frame.childNodes));
      if(paginationPlaceholder){paginationPlaceholder.replaceWith(pagination);paginationPlaceholder=null;}
      copies.splice(0).forEach(([link,style,media])=>{link.media=media;style.remove();});
      sources.splice(0).forEach(([source,media])=>{source.media=media;});
      document.body.classList.remove('mobile-detail-scaled','mobile-detail-editorial','mobile-detail-native');
    }
  };
  apply();
  query.addEventListener('change',()=>{apply();window.dispatchEvent(new Event('resize'));});
  window.addEventListener('resize',resize,{passive:true});
  // Re-measure editorial whitespace and native canvases in desktop coordinates.
  window.dispatchEvent(new Event('resize'));
})();
