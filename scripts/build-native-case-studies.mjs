// Build static, framework-free HTML from the saved Figma layer snapshots.
// Generated fragments remain ordinary DOM; no JSX or utility framework ships.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {prepareProgressiveMedia} from './prepare-progressive-media.mjs';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'");
const assets=new Map(), unknown=new Set(), chinese=new Set();
let detectedHeading='';
const translations=JSON.parse(fs.readFileSync(path.join(root,'design/case-studies/translations.json'),'utf8'));
const textBoxes=JSON.parse(fs.readFileSync(path.join(root,'design/case-studies/text-boxes.json'),'utf8'));
// Expanded English information-architecture nodes. Keep existing connector
// entry points or centers while giving the translated labels enough room.
const okrExpandedNodes=[
  ['5103:7812','5103:7813',826.47,315.93,140,31.941],
  ['5103:5992','5103:5993',489.42,179.46,126,36.736],
  ['5103:5995','5103:5996',290.0735,291.48,110,36.736],
  ['5103:5998','5103:5999',252.759,408.31,178,36.736],
  ['5103:6001','5103:6002',364.859,485.99,114,36.736],
  ['5103:6004','5103:6005',133.999,408.31,112,36.736],
  ['5103:6007','5103:6008',433.519,408.31,120,36.736],
  ['5103:6010','5103:6011',210.089,485.99,114,36.736],
  ['5103:6013','5103:6014',701.0535,291.48,142,36.736],
  ['5103:6016','5103:6017',641.7735,408.31,110,36.736],
  ['5103:6019','5103:6020',784.7235,485.99,124,36.736],
  ['5103:6022','5103:6023',791.7235,408.31,110,36.736],
  ['5103:6025','5103:6026',641.7735,485.99,110,36.736]
];
// Available column widths, not the narrower bounds of the Chinese label.
const chatbotEnglishWidths={
  '5103:3531':294.58,'5103:3538':294.58,'5103:3545':294.58,'5103:3552':294.58,
  '5103:3700':277.624,'5103:3703':345.073,'5103:3705':277.624,
  '5103:4103':476.962,'5103:4106':476.962,'5103:4109':476.962,'5103:4112':476.36
};
function declarations(token){
  if(token==='h-px')return 'height:1px';
  if(token==='bottom-0')return 'bottom:0';
  if(token==='whitespace-pre')return 'white-space:pre';
  if(token==='left-1/2')return 'left:50%';
  if(/^p-\[[\d.]+px\]$/.test(token))return 'padding:'+token.slice(3,-1);
  const fixed={absolute:'position:absolute',relative:'position:relative',contents:'display:contents',block:'display:block',flex:'display:flex','inline-grid':'display:inline-grid','flex-col':'flex-direction:column','flex-none':'flex:none','shrink-0':'flex-shrink:0','content-stretch':'align-content:stretch','items-center':'align-items:center','items-start':'align-items:flex-start','items-end':'align-items:flex-end','justify-center':'justify-content:center','justify-end':'justify-content:flex-end','place-items-start':'place-items:start','size-full':'width:100%;height:100%','w-full':'width:100%','min-w-full':'min-width:100%','max-w-none':'max-width:none','h-0':'height:0','w-0':'width:0','inset-0':'inset:0','left-0':'left:0','right-0':'right:0','top-0':'top:0','ml-0':'margin-left:0','mt-0':'margin-top:0','mb-0':'margin-bottom:0','row-1':'grid-row:1','col-1':'grid-column:1','overflow-hidden':'overflow:hidden','overflow-clip':'overflow:clip','object-cover':'object-fit:cover','pointer-events-none':'pointer-events:none','not-italic':'font-style:normal','font-normal':'font-weight:400','font-medium':'font-weight:500','font-semibold':'font-weight:600','font-bold':'font-weight:700','whitespace-nowrap':'white-space:nowrap','text-center':'text-align:center','text-right':'text-align:right','text-white':'color:#fff','text-black':'color:#000','bg-white':'background-color:#fff','from-white':'--from:#fff','to-white':'--to:#fff','border-white':'border-color:#fff','border-solid':'border-style:solid','border-dashed':'border-style:dashed','border':'border-width:1px','list-disc':'list-style-type:disc',capitalize:'text-transform:capitalize','mask-alpha':'mask-mode:alpha','mask-luminance':'mask-mode:luminance','mask-intersect':'mask-composite:intersect','mask-no-clip':'mask-clip:no-clip','mask-no-repeat':'mask-repeat:no-repeat','bg-clip-text':'background-clip:text;-webkit-background-clip:text','bottom-1/4':'bottom:25%'};
  if(fixed[token])return fixed[token];
  if(token==='bg-black')return 'background-color:#000';
  if(token==='whitespace-pre-wrap')return 'white-space:pre-wrap';
  if(token.startsWith('opacity-[calc('))return 'opacity:calc(var(--opacity-100,100)/100)';
  if(token==='bg-gradient-to-b'||token==='bg-gradient-to-r')return `background-image:linear-gradient(to ${token.endsWith('-b')?'bottom':'right'},var(--from,transparent) var(--from-position,0%),var(--to,transparent) var(--to-position,100%))`;
  let m=token.match(/^opacity-(\d+)$/);if(m)return 'opacity:'+Number(m[1])/100;
  m=token.match(/^\[([^:]+):(.+)\]$/);if(m)return m[1]+':'+m[2].replaceAll('_',' ');
  m=token.match(/^(-?)([a-z-]+)-\[(.*)\]$/);
  if(m){const k=m[2],v=m[3].replaceAll('_',' ').replace(/calc\(([^()]*)\)/g,(_,s)=>'calc('+s.replace(/([\w%.])([+-])(?=[\d.])/g,'$1 $2 ')+')');const signed=m[1]?`calc(-1 * ${v})`:v;
    const map={w:'width',h:'height','min-w':'min-width','max-w':'max-width',left:'left',right:'right',top:'top',bottom:'bottom',inset:'inset',gap:'gap',leading:'line-height',tracking:'letter-spacing',rounded:'border-radius','rounded-tl':'border-top-left-radius','rounded-tr':'border-top-right-radius','rounded-bl':'border-bottom-left-radius','rounded-br':'border-bottom-right-radius',ml:'margin-left',mt:'margin-top',mb:'margin-bottom',ms:'margin-inline-start',pl:'padding-left',pr:'padding-right',pt:'padding-top',pb:'padding-bottom','grid-cols':'grid-template-columns','grid-rows':'grid-template-rows','mask-size':'mask-size','mask-position':'mask-position'};
    if(map[k])return map[k]+':'+(k==='leading'&&v.endsWith('px')?`calc(${signed} * var(--case-copy-scale,1))`:signed);
    if(k==='size')return `width:${v};height:${v}`;
    if(k==='aspect')return 'aspect-ratio:'+v;
    if(k==='skew-x')return 'transform:skewX('+signed+')';
    if(k==='px'||k==='py')return (k==='px'?'padding-left:':'padding-top:')+v+';'+(k==='px'?'padding-right:':'padding-bottom:')+v;
    if(k==='text')return /^-?[.\d].*(?:px|rem|em|cqw|cqh|%)$/.test(v)?`font-size:calc(${v} * var(--case-copy-scale,1))`:'color:'+v;
    if(k==='bg')return 'background-color:'+v;
    if(k==='font'){const [family,weight]=v.replaceAll("'",'').split(':');const variant=weight?.replace(/ ?Italic/,'');return `font-family:"${family}","PingFang SC",Arial,sans-serif`+(weight?';font-weight:'+({Regular:400,Medium:500,Semibold:600,SemiBold:600,Demibold:600,DemiBold:600,Bold:700,Black:900}[variant]||400):'')+(weight?.includes('Italic')?';font-style:italic':'');}
    if(k==='border')return (/^[.\d].*(?:px)$/.test(v)?'border-width:':'border-color:')+v;
    if(k==='shadow')return 'box-shadow:'+v;
    if(k==='blur')return 'filter:blur('+v+')';
    if(k==='backdrop-blur')return 'backdrop-filter:blur('+v+');-webkit-backdrop-filter:blur('+v+')';
    if(k==='from'||k==='to')return '--'+k+(/^[\d.]+%$/.test(v)?'-position':'')+':'+v;
    if(k==='rotate')return '--rot:'+signed+';transform:translate(var(--tx,0px),var(--ty,0px)) rotate(var(--rot,0deg)) scale(var(--sx,1),var(--sy,1))';
    if(k==='translate-x'||k==='translate-y')return '--t'+k.slice(-1)+':'+signed+';transform:translate(var(--tx,0px),var(--ty,0px)) rotate(var(--rot,0deg)) scale(var(--sx,1),var(--sy,1))';
  }
  m=token.match(/^(-?)(translate-[xy]|scale-[xy]|rotate)-(1\/2|full|[\d.]+)$/);if(m){const sign=m[1]?'-':'';const value=m[3]==='1/2'?'50%':m[3]==='full'?'100%':m[2].startsWith('scale')?String(Number(m[3])/100):m[3]+'deg';const key=m[2]==='rotate'?'rot':m[2].startsWith('translate')?'t'+m[2].slice(-1):'s'+m[2].slice(-1);return `--${key}:${sign}${value};transform:translate(var(--tx,0px),var(--ty,0px)) rotate(var(--rot,0deg)) scale(var(--sx,1),var(--sy,1))`;}
  unknown.add(token);return '';
}
export function parse(code, sectionKey){
  const split=code.indexOf('export default function');if(split<0)throw Error('Missing design context '+sectionKey);
  const env=vm.createContext({});vm.runInContext(code.slice(0,split),env,{timeout:1000});
  const evalExpr=e=>vm.runInContext('('+e+')',env,{timeout:1000});
  let pos=code.indexOf('<',split);
  const space=()=>{while(/\s/.test(code[pos]||'')&&pos<code.length)pos++};
  function braces(){let start=++pos,depth=1,quote=null;for(;pos<code.length;pos++){const c=code[pos];if(quote){if(c==='\\'){pos++;continue}if(c===quote)quote=null;continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;if(c==='}'&&!--depth){const s=code.slice(start,pos++);return evalExpr(s)}}throw Error('Unclosed expression');}
  function node(){
    if(code[pos++]!=='<')throw Error('Expected JSX');const start=pos;while(/[\w-]/.test(code[pos]||''))pos++;const tag=code.slice(start,pos);const attrs={};
    while(pos<code.length){space();if(code.startsWith('/>',pos)){pos+=2;return {tag,attrs,children:[]}}if(code[pos]==='>'){pos++;break}const a=pos;while(/[\w:-]/.test(code[pos]||''))pos++;const name=code.slice(a,pos);if(!name)throw Error('Bad attribute '+code.slice(pos,pos+60));space();let value=true;if(code[pos]==='='){pos++;space();if(code[pos]==='"'||code[pos]==="'"){const q=code[pos++],p=pos;while(code[pos]!==q)pos++;value=decode(code.slice(p,pos++))}else if(code[pos]==='{')value=braces();else throw Error('Bad value')}attrs[name]=value;}
    const children=[];while(pos<code.length){if(code.startsWith('</',pos)){pos=code.indexOf('>',pos)+1;return {tag,attrs,children}}if(code[pos]==='<')children.push(node());else if(code[pos]==='{')children.push(String(braces()));else{const p=pos;while(pos<code.length&&code[pos]!=='<'&&code[pos]!=='{')pos++;const t=code.slice(p,pos).split('\n').map(l=>l.trim()).filter(Boolean).join(' ');if(t)children.push(decode(t));}}throw Error('Unclosed tag '+tag);
  }
  const tree=node();
  if(sectionKey==='architecture-mobile'){
    const bodyIds=new Set(['5191:4096','5168:2334','5168:2361','5183:2856','5183:2857','5186:3347','5186:3444','5186:3464','5186:3514','5186:3525','5186:3445','5186:3460','5186:3502','5186:3524']);
    tree.children=tree.children.filter(n=>typeof n!=='string'&&bodyIds.has(n.attrs['data-node-id']));
  }
  if(sectionKey==='okr-28'||sectionKey==='okr-29'){
    const annotations=sectionKey==='okr-28'?[
      [7334,7332,69,208.794921875],[7335,7333,69.25,383.01],
      [7328,7324,821.43,247.51],[7329,7325,821.43,434.81]
    ]:[
      [7393,7390,66.24,201.74],[7392,7389,66.24,351.1],[7394,7391,66.24,492.62],
      [7383,7377,823.84,213.79],[7384,7378,823.84,345.68],[7385,7379,823.84,478.17]
    ];
    for(const [titleId,bodyId,x,y] of annotations){
      const title=tree.children.find(c=>typeof c!=='string'&&c.attrs['data-node-id']==='5103:'+titleId);
      const body=tree.children.find(c=>typeof c!=='string'&&c.attrs['data-node-id']==='5103:'+bodyId);
      if(!title||!body)throw Error('Missing comparison annotation '+titleId);
      title.attrs['data-okr-annotation-title']='';body.attrs['data-okr-annotation-body']='';
      const first=Math.min(tree.children.indexOf(title),tree.children.indexOf(body));
      const wrapper={tag:'div',attrs:{className:'absolute','data-okr-comparison-annotation':'',style:{position:'absolute',left:x+'px',top:y+'px',width:'174.294189453125px'}},children:[title,body]};
      if(sectionKey==='okr-29'&&x>800)wrapper.attrs['data-okr-score-after']='';
      tree.children=tree.children.flatMap((c,i)=>i===first?[wrapper]:c===title||c===body?[]:[c]);
    }
  }
  if(sectionKey==='okr-20-4'){
    // Preserve instance paint overrides by using Figma's whole-icon export.
    const icon=tree.children.find(c=>typeof c!=='string'&&c.attrs['data-node-id']==='5103:6213');
    if(!icon)throw Error('Missing pending-review icon');
    icon.children=[{tag:'img',attrs:{src:'assets/case-studies/okr-pending-review.svg',alt:'',width:29,height:29,className:'block'},children:[]}];
  }
  if(sectionKey==='okr-11'||sectionKey==='okr-17'){
    const fills=new Set(['ce707.svg','60a74.svg','7ddb4.svg','5b7bc.svg','ad418.svg','009b6.svg']);
    const markFill=n=>{
      if(typeof n==='string')return;
      const img=n.children.find(c=>typeof c!=='string'&&c.tag==='img'&&fills.has(String(c.attrs.src).split('/').pop()));
      if(img){
        n.attrs['data-okr-fixed-corner-fill']='';
        n.attrs.style={...n.attrs.style,'--okr-fill-image':`url("${img.attrs.src}")`};
      }
      n.children.forEach(markFill);
    };
    markFill(tree);
  }
  if(sectionKey==='okr-11'){
    // Keep each branch and all its connectors together, while opening a
    // clear gap around the wider central Xiaoniu OKR node in both languages.
    const branches=[
      ['left',-20,[7772,7784,7793,7805,7835,7836,7849]],
      ['right',20,[7775,7778,7781,7787,7790,7796,7799,7802,7808,7811,7814,7817,7820,7823,7826,7829,7832,7837,7838,7839,7840,7841,7842,7843,7844,7845,7846,7847,7848,7850]]
    ];
    for(const [name,offset,ids] of branches){
      const selected=new Set(ids.map(id=>'5103:'+id));
      const children=tree.children.filter(c=>typeof c!=='string'&&selected.has(c.attrs['data-node-id']));
      const first=tree.children.indexOf(children[0]);
      if(first<0)throw Error('Missing desktop IA branch '+name);
      const wrapper={tag:'div',attrs:{className:'absolute','data-okr-ia-branch':name,style:{position:'absolute',left:0,top:0,width:'1084px',height:'650.4px',translate:`${offset}px 0`}},children};
      tree.children=tree.children.flatMap((c,i)=>i===first?[wrapper]:typeof c!=='string'&&selected.has(c.attrs['data-node-id'])?[]:[c]);
    }
  }
  if(sectionKey==='okr-22'){
    const removedAuthors=new Set(['5103:6824','5103:6833']);
    tree.children=tree.children.filter(c=>typeof c==='string'||!removedAuthors.has(c.attrs['data-node-id']));
  }
  if(sectionKey==='okr-13'){
    // Move complete examples together: fill, icons, avatar and tooltip must
    // retain their internal geometry rather than moving only the white box.
    const wrapLayers=(name,ids,offset)=>{
      const selected=new Set(ids),children=tree.children.filter(c=>typeof c!=='string'&&selected.has(c.attrs['data-node-id']));
      const first=tree.children.indexOf(children[0]);
      if(first<0)throw Error('Missing modular-design example '+name);
      const wrapper={tag:'div',attrs:{className:'absolute','data-okr-example':name,style:{position:'absolute',left:0,top:0,width:'1084px',height:'650.4px',translate:`0 ${offset}px`}},children};
      tree.children=tree.children.flatMap((c,i)=>i===first?[wrapper]:typeof c!=='string'&&selected.has(c.attrs['data-node-id'])?[]:[c]);
    };
    wrapLayers('global-header',['5103:7962','5103:7964','5103:7968','5103:7969','5103:7972'],28);
    wrapLayers('content-header',['5103:7963','5103:7973','5103:7981','5103:7988','5103:7994','5103:7995','5103:7996','5103:7997','5103:7998','5103:7999'],12);
    wrapLayers('main-content-copy',['5103:7952','5103:7955'],12);
  }
  if(sectionKey.startsWith('okr-')){
    // Figma masks the combined glow group. Masking each blurred ellipse in
    // its own small CSS box clips the blur into hard rectangular patches.
    // Keep the supplied masks, but apply them once to their shared group.
    const groupMasks=n=>{
      if(typeof n==='string')return [];
      const masks=n.children.flatMap(groupMasks);
      if(n.attrs.style?.maskImage&&/mask-size-\[1084px_358\.92[45]px/.test(n.attrs.className||''))masks.push(n);
      if(masks.length===3&&n.children.filter(c=>typeof c!=='string').length===3){
        const maskImage=masks[0].attrs.style.maskImage;
        const height=masks[0].attrs.className.match(/mask-size-\[1084px_([\d.]+)px/)[1];
        masks.forEach(layer=>{delete layer.attrs.style.maskImage;});
        n.attrs.className=`absolute left-0 top-0 w-[1084px] h-[${height}px] overflow-hidden`;
        n.attrs['data-case-gradient']='';
        n.attrs.style={...n.attrs.style,maskImage,maskSize:`1084px ${height}px`,maskPosition:'0px 0px',maskRepeat:'no-repeat'};
        return [];
      }
      return masks;
    };
    groupMasks(tree);
  }
  function html(n){if(typeof n==='string'){if(/[\u3400-\u9fff]/.test(n)){chinese.add(n);if(translations[n])return `<span data-zh="${esc(n)}" data-en="${esc(translations[n])}">${esc(n)}</span>`;}return esc(n)}
    const a=n.attrs;
    // Figma 2-3 updated the inactive tab instances. Keep the existing icon
    // slots and position the three new SVG exports at their design insets.
    if(sectionKey==='chatbot-8'){
      const tabs={
        'I5103:3997;542:3271':['00f47.svg','inset:12.5% 6.61% 8.93% 7.14%'],
        'I5103:3998;542:3271':['7768f.svg','left:2.73px;top:1.87px;width:12.024px;height:13.742px'],
        'I5103:3999;542:3271':['b0cae.svg','left:1.87px;top:1.87px;width:13.742px;height:13.742px']
      };
      const tab=tabs[a['data-node-id']];
      if(tab){
        const [file,geometry]=tab,src='assets/case-studies/'+file;
        assets.set(file,src);
        return `<div data-node-id="${a['data-node-id']}" style="position:relative;flex-shrink:0;width:17.49px;height:17.49px"><span style="position:absolute;${geometry}"><img alt="" src="${src}" loading="lazy" decoding="async" style="position:absolute;display:block;inset:0;max-width:none;width:100%;height:100%"></span></div>`;
      }
    }
    if(sectionKey==='architecture-mobile'){
      const headings=new Set(['项目背景','改版前后','用户访谈','设计目标推导','信息架构重构','视觉方向调整','字体规范','色彩规范','Icon规范','更多页面','设计小结']);
      const plain=node=>node.children.filter(c=>typeof c==='string').join('');
      const isHeading=node=>node.tag==='p'&&headings.has(plain(node))&&/text-\[1[45]px\]/.test(node.attrs.className||'');
      if(isHeading(n))a['data-arch-mobile-heading']='';
      if(n.children.some(c=>typeof c!=='string'&&isHeading(c))){
        a['data-arch-mobile-heading-group']='';
        if((a.className||'').split(' ').includes('left-1/2'))a['data-arch-mobile-centered-heading']='';
      }
    }
    // English role copy already includes its full stop; retain the Figma
    // Chinese punctuation only in Chinese rather than rendering both.
    if(sectionKey==='okr-7'&&['5103:8852','5103:8858'].includes(a['data-node-id'])){
      const mark=n.children.at(-1);
      if(mark?.children?.length===1&&mark.children[0]==='。'){
        mark.attrs['data-zh']='。';mark.attrs['data-en']='';
      }
    }
    if(sectionKey==='okr-18'&&['5103:6059','5103:6066'].includes(a['data-node-id']))a['data-case-preserve-font']='';
    if(sectionKey==='okr-4'&&a['data-node-id']==='5103:8678'){
      const steps=n.children.slice(0,6),arrows=n.children.slice(6);
      const row=steps.flatMap((step,i)=>{
        step.attrs['data-okr-implementation-step']='';
        step.children[0].attrs['data-okr-implementation-background']='';
        step.children[1].attrs['data-okr-implementation-label']='';
        step.children[1].attrs['data-case-preserve-font']='';
        if(arrows[i])arrows[i].attrs['data-okr-implementation-arrow']='';
        return arrows[i]?[step,arrows[i]]:[step];
      });
      return `<div data-node-id="5103:8678" data-okr-implementation-row>${row.map(html).join('')}</div>`;
    }
    // Removed from both languages at the designer's request.
    if(sectionKey==='chatbot-4'&&a['data-node-id']==='5103:3605')return '';
    // The board contains identical stacked title layers in Type & Color.
    if(sectionKey==='chatbot-5'&&['5266:6174','5266:6175'].includes(a['data-node-id']))return '';
    if(sectionKey==='chatbot-8'&&a['data-node-id']==='5103:3865'){
      // The green shadow belongs to the combined component silhouettes,
      // not the rectangular bounds or the grid behind the presentation.
      // Compensate for browser compositing with the existing asset shadows;
      // retain the design's offset and blur, but avoid a heavy green halo.
      return `<div data-node-id="5103:3865" style="position:absolute;inset:0;width:1084px;height:650.4px;filter:drop-shadow(3.93333px 6.74285px 16.77284px rgba(8.1445,130.2728,38.6766,0.14))">${n.children.map(html).join('')}</div>`;
    }
    const clippedComponentCards={
      '5103:3937':[811.15,125.87,103.952,82.038,10.114],
      '5103:3958':[829.26,228.24,103.952,82.038,10.114],
      '5103:3974':[266.78,96.59,230.651,90.255,10.505]
    };
    if(sectionKey==='chatbot-8'&&clippedComponentCards[a['data-node-id']]){
      const [x,y,width,height,radius]=clippedComponentCards[a['data-node-id']];
      // Keep the background's existing subtle shadow outside the card;
      // clip the foreground once before the shared group shadow is applied.
      const [background,...foreground]=n.children;
      const clearMasks=layer=>{if(typeof layer==='string')return;if(layer.attrs.style)delete layer.attrs.style.maskImage;layer.children.forEach(clearMasks);};
      foreground.forEach(clearMasks);
      return `<div data-node-id="${a['data-node-id']}" style="display:contents">${html(background)}<div data-case-card-clip style="position:absolute;left:${x}px;top:${y}px;width:${width}px;height:${height}px;border-radius:${radius}px;overflow:hidden"><div style="position:absolute;left:${-x}px;top:${-y}px;width:1084px;height:650.4px">${foreground.map(html).join('')}</div></div></div>`;
    }
    if(sectionKey==='chatbot-8'&&a['data-node-id']==='5103:3885'){
      // These decorative layers share the card's mask in Figma. A mask on
      // the rotated child uses a different coordinate space in the browser.
      // Clip the combined artwork once, keeping its original canvas coordinates.
      const maskLayer=n.children.find(c=>typeof c!=='string'&&c.attrs.style?.maskImage);
      const maskImage=maskLayer.attrs.style.maskImage;
      for(const match of maskImage.matchAll(/assets\/case-studies\/([\w.-]+)/g))assets.set(match[1],match[0]);
      const clearMasks=layer=>{if(typeof layer==='string')return;if(layer.attrs.style)delete layer.attrs.style.maskImage;layer.children.forEach(clearMasks);};
      n.children.forEach(clearMasks);
      return `<div data-node-id="5103:3885" style="position:absolute;left:378.8px;top:403.97px;width:118.621px;height:135.389px;overflow:hidden;mask-image:${esc(maskImage)};mask-size:100% 100%;mask-repeat:no-repeat"><div style="position:absolute;left:-378.8px;top:-403.97px;width:1084px;height:650.4px">${n.children.map(html).join('')}</div></div>`;
    }
    let styles=(a.className||'').split(/\s+/).map(declarations).filter(Boolean);if(a.style)styles.push(...Object.entries(a.style).map(([k,v])=>k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+':'+v));
    if(sectionKey==='chatbot-12'){
      // These Figma layers combine rotation and skew on the same icon wrapper.
      // Keep both transforms instead of allowing the skew to overwrite rotation.
      const skew=styles.findIndex(style=>style.startsWith('transform:skewX('));
      const rotation=styles.findIndex(style=>style.startsWith('--rot:'));
      if(skew!==-1&&rotation!==-1){
        styles[rotation]+=' '+styles[skew].slice('transform:'.length);
        styles.splice(skew,1);
      }
    }
    if(sectionKey==='chatbot-1'){
      if(['5103:3530','5103:3537','5103:3544','5103:3551'].includes(a['data-node-id']))a['data-chat-flow-card']='';
      if(['5103:3531','5103:3538','5103:3545','5103:3552'].includes(a['data-node-id']))a['data-chat-flow-title']='';
      if(['5103:3532','5103:3539','5103:3546','5103:3553'].includes(a['data-node-id']))a['data-chat-flow-terms']='';
      if(['5103:3533','5103:3534','5103:3535','5103:3540','5103:3541','5103:3542','5103:3547','5103:3548','5103:3549','5103:3554','5103:3555','5103:3556'].includes(a['data-node-id']))a['data-case-preserve-font']='';
    }
    if(sectionKey==='chatbot-5'&&['5103:3644','5103:3645'].includes(a['data-node-id']))a['data-case-preserve-font']='';
    if(sectionKey==='chatbot-6'&&a['data-node-id']==='5103:3704')a['data-case-preserve-font']='';
    if(sectionKey==='chatbot-8'&&['5103:4036','5103:4039','5103:4042','5103:4045'].includes(a['data-node-id'])){
      a['data-chat-component-point']='';a['data-case-preserve-font']='';
    }
    if(sectionKey.startsWith('chatbot-')&&['5103:4032','5103:4099'].includes(a['data-node-id']))a['data-case-preserve-font']='';
    if(sectionKey.startsWith('okr-')){
      // Tailwind's explicit color type is a hint, not part of the CSS value.
      styles=styles.map(s=>s.replace(/^color:color:/,'color:'));
      const expanded=okrExpandedNodes.find(row=>row[0]===a['data-node-id']||row[1]===a['data-node-id']);
      if(expanded){
        const [background,label,x,y,width,height]=expanded;
        a[a['data-node-id']===background?'data-okr-expanded-background':'data-okr-expanded-label']='';
        styles.push(`--okr-node-x:${x}px;--okr-node-y:${y}px;--okr-node-width:${width}px;--okr-node-height:${height}px`);
      }
      if((a.className||'').includes('size-[34.104px]')&&(a.className||'').includes('bg-[rgba(120,44,255,0.3)]')&&(a.className||'').includes('backdrop-blur-')){
        a['data-case-heading-icon']='';
        // Figma uses a fading gradient stroke, not a uniform white border.
        styles=styles.map(s=>s.replace(/^border-color:.+$/,'border-color:transparent'));
      }
      const variant=(a.className||'').match(/font-\['([^']+)'\]/)?.[1];
      const families={
        'MiSans:Normal':'CaseMiSansNormal', 'MiSans:Regular':'CaseMiSansRegular',
        'MiSans:Medium':'CaseMiSansMedium', 'MiSans:Demibold':'CaseMiSansDemibold',
        'MiSans:Semibold':'CaseMiSansSemibold', 'Roboto:Medium':'CaseRobotoMedium',
        'YouSheBiaoTiYuan:Regular':'CaseYouSheTitle', 'DINPro:Medium':'CaseDINMedium'
      };
      if(families[variant])styles.push(`font-family:"${families[variant]}","PingFang SC",Arial,sans-serif`);
      // Section headings have room to grow horizontally. Their Chinese text
      // frame is not an English width limit: squeezing to it made headings
      // smaller than body copy after a language switch.
      const size=(a.className||'').match(/text-\[([\d.]+)px\]/)?.[1];
      // Main case-study typography is specified by Figma, not individually
      // fitted to Chinese glyph bounds. Only miniature UI specimens (<10px)
      // may still use the constrained-label fitter.
      if(Number(size)>=10){a['data-case-preserve-font']='';a['data-okr-design-type']='';}
      if(n.tag==='p'&&Number(size)>=17&&(Number(size)>=28||/(?:^|\s)relative(?:\s|$)/.test(a.className||''))&&!/(?:^|\s)w-/.test(a.className||''))a['data-case-preserve-font']='';
      // Explanatory copy uses the design's type size, not the dimensions
      // of its shorter Chinese translation as an English shrink-to-fit box.
      // Rich-text wrappers deliberately use 0px with sized child spans.
      const richBody=Number(size)===0&&n.children.some(c=>typeof c!=='string'&&/text-\[(1[0-6](?:\.\d+)?)px\]/.test(c.attrs.className||''));
      const isBody=/^MiSans:(Normal|Regular)$/.test(variant||'')&&!/(?:^|\s)whitespace-nowrap(?:\s|$)/.test(a.className||'')&&((Number(size)>=10&&Number(size)<=16)||richBody);
      const isFlowHeading=n.tag==='p'&&Number(size)>=15&&Number(size)<=17&&(a.className||'').includes('w-full');
      if(isBody||isFlowHeading){
        a['data-case-preserve-font']='';
        a['data-okr-design-copy']='';
        if((a.className||'').includes('min-w-full'))styles=styles.map(s=>s==='width:min-content'?'width:100%':s);
      }
      if(richBody){a['data-case-preserve-font']='';a['data-okr-design-type']='';}
      if(['5103:8547','5103:8565','5103:8568','5103:8569','5103:8570','5103:8571','5103:8572','5103:8573','5103:7682','5103:7683','5103:7684','5103:7694'].includes(a['data-node-id']))a['data-case-preserve-font']='';
      if(['5103:8661','5103:8664','5103:8667','5103:8670','5103:8673'].includes(a['data-node-id'])){
        a['data-case-preserve-font']='';a['data-okr-characteristic-label']='';
      }
    }
    // Some scaled Figma component instances retain unscaled auto-layout
    // padding. Keep their explicit design width and center their contents.
    const declared=styles.join(';'), fixedWidth=declared.match(/(?:^|;)width:([\d.]+)px(?:;|$)/);
    if(fixedWidth)styles=styles.map(s=>s.replace(/padding-(left|right):([\d.]+)px/g,(all,side,value)=>Number(value)*2>Number(fixedWidth[1])?'padding-'+side+':0px':all));
    if(a.style?.maskImage?.includes(','))styles.push('mask-composite:intersect');
    if(n.tag==='p'&&!detectedHeading){const size=styles.join(';').match(/font-size:(?:calc\()?([\d.]+)px/);const plain=n.children.filter(c=>typeof c==='string').join('').trim();if(size&&Number(size[1])>=28&&plain.length<90&&/[a-z\u3400-\u9fff]/i.test(plain))detectedHeading=plain;}
    if(n.tag==='img'){a.loading='lazy';a.decoding='async';if(a.src?.startsWith('https://www.figma.com/api/mcp/asset/')||a.src?.startsWith('assets/case-studies/')){const name=a.src.split('/').at(-1);if(!assets.has(name))assets.set(name,a.src);a.src='assets/case-studies/'+name;}}
    if(sectionKey.startsWith('chatbot-')&&n.tag==='img'&&/\/(?:c0346|fcbc0)\.svg$/.test(a.src||''))a['data-case-grid-line']='';
    styles=styles.map(s=>s.replace(/https:\/\/www\.figma\.com\/api\/mcp\/asset\/[\w-]+\/([\w.-]+)/g,(url,name)=>{if(!assets.has(name))assets.set(name,url);return 'assets/case-studies/'+name}));
    styles.forEach(s=>{for(const m of s.matchAll(/assets\/case-studies\/([\w.-]+)/g))if(!assets.has(m[1]))assets.set(m[1],m[0]);});
    const box=textBoxes[a['data-node-id']];
    if(box&&(['p','span','div'].includes(n.tag)||(sectionKey.startsWith('chatbot-')&&n.tag==='ul'))){
      a['data-case-text-width']=box[0];a['data-case-text-height']=box[1];
      if(sectionKey.startsWith('chatbot-')&&n.tag==='ul'){
        a['data-case-fit-list']='';a['data-case-english-height']=72;
        a['data-case-max-scale']=13.2/14.453;
        styles.push(`--case-frame-height:${box[1]}px;--case-english-frame-height:72px`);
      }
    }
    if(sectionKey.startsWith('chatbot-')&&chatbotEnglishWidths[a['data-node-id']])a['data-case-english-width']=chatbotEnglishWidths[a['data-node-id']];
    let out='<'+n.tag;for(const [k,v] of Object.entries(a)){if(['className','style','data-name'].includes(k))continue;out+=' '+k+(v===true?'':'="'+esc(v)+'"');}if(styles.length)out+=' style="'+esc(styles.join(';'))+'"';out+='>';
    if(['img','br','hr','input'].includes(n.tag))return out;
    return out+n.children.map(html).join('')+'</'+n.tag+'>';
  }
  return html(tree);
}
export {assets,unknown,chinese,translations,textBoxes};
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
for(const name of ['chatbot','okr']){
  const data=JSON.parse(fs.readFileSync(path.join(root,'design/case-studies/'+name+'.json'),'utf8'));
  const html=data.sections.map((s,i)=>{
    // Preserve per-slide rendering adjustments when a board is reordered.
    const sectionKey=name+'-'+(s.renderIndex??i);
    detectedHeading='';
    let content;if(s.parts)content=s.parts.map((p,j)=>{
      // User-requested raster artwork: preserve Figma's clipped render bounds,
      // rather than translating and independently positioning each specimen.
      // The source layers remain in the snapshot for a reversible replacement.
      if(name==='okr'&&p.id==='5103:6233')return '<img data-okr-component-artwork src="assets/case-studies/okr-component-showcase.png" alt="OKR component library examples" width="2892" height="1355" loading="lazy" decoding="async" style="position:absolute;left:65.041015625px;top:198.7333984375px;width:963.916015625px;height:451.6666259765625px;max-width:none" />';
      return `<div style="position:absolute;left:${p.x||0}px;top:${p.y||0}px;width:${p.width||1084}px;height:${p.height||650.4}px">${parse(p.code,sectionKey+'-'+j)}</div>`;
    }).join('');else content=parse(s.code,sectionKey);
    // Use right-sized WebP portraits only in the OKR interview artwork.
    // Keep the design snapshots and shared originals unchanged.
    if(name==='okr'&&i===27)content=content.replace(
      /assets\/case-studies\/(60d03|77657|4708c|bdb24|7b18b|fd27e|c287d)\.png(?=")/g,
      'assets/case-studies/$1-okr-avatar.webp'
    );
    const heading=detectedHeading||(name==='okr'?'OKR System Design':'AI Mental Health Chatbot');
    return `<section class="case-native-slide" aria-labelledby="${name}-section-${i}"${name==='okr'?' style="background:#10051a"':''}><h2 class="case-native-label" id="${name}-section-${i}" data-zh="${esc(heading)}" data-en="${esc(translations[heading]||heading)}">${esc(heading)}</h2><div class="case-native-canvas">${content}</div></section>`;
  }).join('\n');
  const file=path.join(root,name+'.html');let page=fs.readFileSync(file,'utf8');page=page.replace(/<(?:section|div) class="(?:project-gallery|native-case-gallery)"[\s\S]*?(?=\n    <\/main>)/,`<div class="native-case-gallery" aria-label="${name==='okr'?'OKR System Design':'AI Mental Health Chatbot'} 项目详情">\n${html}\n</div>`);
  if(!page.includes('native-case-studies.css'))page=page.replace('</head>','  <link rel="stylesheet" href="native-case-studies.css?v=1" />\n</head>');
  if(!page.includes('native-case-studies.js'))page=page.replace('</body>','  <script src="native-case-studies.js?v=1"></script>\n</body>');
  page=page.replace(/native-case-studies\.(css|js)\?v=[^" ]+/g,(_,ext)=>{
    const version=createHash('sha256').update(fs.readFileSync(path.join(root,`native-case-studies.${ext}`))).digest('hex').slice(0,10);
    return `native-case-studies.${ext}?v=${version}`;
  });
  fs.writeFileSync(file,prepareProgressiveMedia(page));
}
fs.writeFileSync(path.join(root,'design/case-studies/untranslated.json'),JSON.stringify([...chinese].filter(t=>!translations[t]),null,2)+'\n');
fs.writeFileSync(path.join(root,'design/case-studies/assets.json'),JSON.stringify(Object.fromEntries(assets),null,2)+'\n');
console.log(JSON.stringify({assets:assets.size,unknown:[...unknown],untranslated:[...chinese].filter(t=>!translations[t]).length}));
if(process.argv.includes('--download')){
  const folder=path.join(root,'assets/case-studies');fs.mkdirSync(folder,{recursive:true});const queue=[...assets];
  await Promise.all(Array.from({length:8},async()=>{while(queue.length){const [name,url]=queue.shift(),file=path.join(folder,name);if(fs.existsSync(file)&&fs.statSync(file).size)continue;if(!url.startsWith('https://'))throw Error('Missing local design asset '+name+'; refresh its Figma snapshot before downloading.');await new Promise((resolve,reject)=>{const child=spawn('curl',['-fsSL','--retry','2','--max-time','60',url,'-o',file]);child.on('exit',code=>code===0?resolve():reject(Error('Asset download failed '+name)));});}}));
  console.log('Downloaded '+assets.size+' design assets');
}
}
