const folder='assets/architecture-v2';
export const heroSrcset=(name,widths)=>widths.map(w=>`${folder}/${name}-hero-${w}.webp ${w}w`).join(', ');

// Only the two masked opening images use preview assets. Later appearances
// of the same screens still use the full PNGs.
export function optimizeMobileHero(markup){
  for(const [id,name] of [['5168:2337','enterprise-screen'],['5168:2340','home-screen']]){
    const pattern=new RegExp(`(<div data-node-id="${id}"[^>]*>)(<img[^>]*>)(<noscript>)(<img[^>]*>)`);
    if(!pattern.test(markup))throw new Error(`Missing architecture hero node ${id}`);
    const fallback=`${folder}/${name}-hero-480.webp`;
    const variants=heroSrcset(name,[320,480,880]);
    markup=markup.replace(pattern,(_,parent,image,noscript,backup)=>parent+
      image.replace(/data-media-src="[^"]+"/,`data-media-src="${fallback}" data-media-srcset="${variants}" sizes="33vw"`)+
      noscript+backup.replace(/\bsrc="[^"]+"/,`src="${fallback}" srcset="${variants}" sizes="33vw"`));
  }
  // The next section grazes the bottom of some phone viewports. Keep its
  // original images, but don't include them in speculative first-paint loads.
  return markup.replace(/(<div data-node-id="5168:(?:2411|2414)"[^>]*>)(<img)(?! data-media-scroll)/g,'$1$2 data-media-scroll=""');
}
