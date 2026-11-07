// Compile the saved app/work detail-Architectural layers with the site's
// existing framework-free Figma compiler. This is artwork DOM, not a screenshot.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {parse,assets,unknown,chinese,translations,textBoxes} from './build-native-case-studies.mjs';
import {prepareProgressiveMedia} from './prepare-progressive-media.mjs';
import {optimizeMobileHero,optimizeArchitectureArtwork} from './architecture-hero-media.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'design/case-studies/architecture-mobile.json'),'utf8'));
const copyFile=path.join(root,'design/case-studies/architecture-mobile-translations.json');
if(fs.existsSync(copyFile))Object.assign(translations,JSON.parse(fs.readFileSync(copyFile,'utf8')));
Object.assign(textBoxes,snapshot.textBoxes);
let artwork=parse(snapshot.code,'architecture-mobile');
// These files were verified byte-for-byte identical to existing Web artwork.
const aliases=JSON.parse(fs.readFileSync(path.join(root,'design/case-studies/architecture-mobile-assets.json'),'utf8'));
for(const [from,to] of Object.entries(aliases)){
  artwork=artwork.replaceAll(from,to);assets.delete(path.basename(from));
}
const markup=optimizeArchitectureArtwork(optimizeMobileHero(prepareProgressiveMedia(`<div class="arch-mobile-case" aria-label="Architectural Assets Platform mobile case study"><div class="arch-mobile-canvas">${artwork}</div></div>`)));
const file=path.join(root,'project1.html');let page=fs.readFileSync(file,'utf8');
const fragment=`<!-- architecture-mobile:start -->\n${markup}\n<!-- architecture-mobile:end -->`;
if(page.includes('<!-- architecture-mobile:start -->'))page=page.replace(/<!-- architecture-mobile:start -->[\s\S]*?<!-- architecture-mobile:end -->/,fragment);
else page=page.replace('    <nav id="project-navigation"',fragment+'\n    <nav id="project-navigation"');
fs.writeFileSync(file,page);
console.log(JSON.stringify({assets:assets.size,unknown:[...unknown],untranslated:[...chinese].filter(s=>!translations[s])},null,2));
if(process.argv.includes('--download')){
  const folder=path.join(root,'assets/case-studies');fs.mkdirSync(folder,{recursive:true});const queue=[...assets];
  await Promise.all(Array.from({length:6},async()=>{while(queue.length){const [name,url]=queue.shift(),file=path.join(folder,name);if(fs.existsSync(file)&&fs.statSync(file).size)continue;await new Promise((resolve,reject)=>{const p=spawn('curl',['-fsSL','--retry','2','--max-time','60',url,'-o',file]);p.on('exit',code=>code===0?resolve():reject(Error('Cannot download '+name)));});}}));
}
