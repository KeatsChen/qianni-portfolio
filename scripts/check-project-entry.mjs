// The three project sources share the same URL and non-blocking feedback.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const names=new Set(['project1','okr','chatbot','research','cozyup','materials','sports','bim','food','sustainability','community']);
const destinations=new Map();
for(const file of fs.readdirSync(root).filter(file=>file.endsWith('.html'))){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(html.includes('project-entry.js')&&html.includes('project-entry.css'),`${file}: shared loader missing`);
  for(const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)){
    const url=new URL(match[1].replaceAll('&amp;','&'),'http://local/');
    const name=url.pathname.slice(1).replace(/\.html$/,'');
    if(url.origin!=='http://local'||!names.has(name))continue;
    assert.equal(url.pathname,'/'+name,`${file}: use canonical project entry`);
    if(destinations.has(name))assert.equal(url.href,destinations.get(name),`${file}: different entry for ${name}`);
    destinations.set(name,url.href);
  }
}
assert.equal(destinations.size,11);
console.log('PASS all HTML project anchors share one canonical URL per project');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try{
  for(const width of [1440,390])for(const lang of ['en','zh']){
    const page=await browser.newPage({viewport:{width,height:900}});
    for(const [source,selector] of [['/','a.project-deck-card[href^="okr?"]'],['/content','#okr.gallery-card'],['/project1','.project-pagination-link[rel="next"]']]){
      await page.goto(server.origin+source,{waitUntil:'load'});
      if(source==='/')await page.waitForFunction(()=>!document.documentElement.classList.contains('home-booting'));
      await page.locator(`button[data-lang="${lang}"]`).first().evaluate(button=>button.click());
      await page.evaluate(selector=>{
        window.entryCheck=null;
        // After production's document listener, suppress the actual navigation
        // in this visual-state test only. Real navigation is tested separately.
        window.addEventListener('click',event=>{
          if(!event.target.closest(selector))return;
          window.entryCheck={cancelled:event.defaultPrevented};
          event.preventDefault();
        },{once:true});
      },selector);
      await page.locator(selector).click();
      assert.equal((await page.evaluate(()=>window.entryCheck)).cancelled,false);
      await page.waitForTimeout(400);
      const feedback=await page.locator('.project-entry-loading').evaluate(element=>({text:element.textContent,opacity:getComputedStyle(element).opacity,pointer:getComputedStyle(element).pointerEvents}));
      assert.ok(feedback.text.includes(lang==='zh'?'正在打开项目':'Opening project'));
      assert.ok(Number(feedback.opacity)>0);
      assert.equal(feedback.pointer,'none');
      console.log(`PASS ${width}px ${lang} ${source}: shared feedback, native link not cancelled`);
    }
    // Fail-open visibility must work even without the JS animationend cleanup.
    await page.evaluate(()=>window.addEventListener('animationend',event=>event.stopImmediatePropagation(),true));
    await page.waitForTimeout(4200);
    assert.equal(await page.locator('.project-entry-loading').evaluate(element=>getComputedStyle(element).visibility),'hidden');
    await page.close();
  }
}finally{await browser.close();await server.close();}
