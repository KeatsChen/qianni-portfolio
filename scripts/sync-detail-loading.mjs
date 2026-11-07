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
  const next=pattern.test(html)?html.replace(pattern,snippet):html.replace(/(<meta name="viewport"[^>]*>)/,`$1\n${snippet}`);
  if(next!==html)fs.writeFileSync(target,next);
}
