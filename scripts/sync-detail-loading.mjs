// Keep the critical, network-independent detail loader identical on every page.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const template=fs.readFileSync(path.join(root,'scripts/templates/detail-loading-head.html'),'utf8').trim();
const [snippet,bodyMarkup]=template.split('\n<!-- detail-loading-body:start -->');
const bodyTemplate='<!-- detail-loading-body:start -->'+bodyMarkup.replace('{{dots}}',Array.from({length:9},(_,i)=>`<i style="--dot-delay:${((i%3)+Math.floor(i/3))*200}ms"></i>`).join(''));
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
  const target=path.join(root,file),html=fs.readFileSync(target,'utf8');
  if(!html.includes('src="detail-motion.js?'))continue;
  // Read the canonical destinations from the existing pagination. Endpoints
  // intentionally omit the unavailable direction rather than disabling a link.
  const pagination=[...html.matchAll(/<a\b[^>]*\bclass="[^"]*\bproject-pagination-link\b[^"]*"[^>]*>/g)].map(match=>match[0]);
  const links=[['prev','Previous project','上一个项目'],['next','Next project','下一个项目']].map(([rel,en,zh])=>{
    const href=pagination.find(tag=>tag.includes(`rel="${rel}"`))?.match(/\bhref="([^"]+)"/)?.[1];
    return href?`<a href="${href}" rel="${rel}"><span lang="en">${en}</span><span lang="zh">${zh}</span></a>`:'';
  }).filter(Boolean).join('\n    ');
  const bodySnippet=bodyTemplate.replace('{{project-links}}',links);
  const pattern=/<!-- detail-loading:start -->[\s\S]*?<!-- detail-loading:end -->/;
  let next=pattern.test(html)?html.replace(pattern,snippet):html.replace(/(<meta name="viewport"[^>]*>)/,`$1\n${snippet}`);
  const bodyPattern=/<!-- detail-loading-body:start -->[\s\S]*?<!-- detail-loading-body:end -->/;
  next=bodyPattern.test(next)?next.replace(bodyPattern,bodySnippet):next.replace(/(<body\b[^>]*>)/i,`$1\n${bodySnippet}`);
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
