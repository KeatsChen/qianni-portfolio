// Keep the critical, network-independent detail loader identical on every page.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const snippet=fs.readFileSync(path.join(root,'scripts/templates/detail-loading-head.html'),'utf8').trim();
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
  const target=path.join(root,file),html=fs.readFileSync(target,'utf8');
  if(!html.includes('src="detail-motion.js?'))continue;
  const pattern=/<!-- detail-loading:start -->[\s\S]*?<!-- detail-loading:end -->/;
  let next=pattern.test(html)?html.replace(pattern,snippet):html.replace(/(<meta name="viewport"[^>]*>)/,`$1\n${snippet}`);
  // Former body-end classics must still execute before mobile/deferred setup,
  // but must not stop the parser while their network requests are pending.
  const end=next.indexOf('</head>');
  const body=next.slice(end),scripts=[...body.matchAll(/<script src="[^"]+"><\/script>/g)].map(m=>m[0]);
  let tail=body;
  for(const script of scripts)tail=tail.replace(script,'');
  let head=next.slice(0,end).replace(/<script src="detail-motion.js/g,'<script defer src="detail-motion.js');
  if(scripts.length)head=head.replace(/(<script defer src="detail-motion.js)/,scripts.map(s=>s.replace('<script src=','<script defer src=')).join('\n')+'\n$1');
  head=head.replace(/<script src="entry-guard.js/g,'<script defer src="entry-guard.js');
  next=(head+tail).replace(/^[\t ]+$/gm,'');
  if(next!==html)fs.writeFileSync(target,next);
}
