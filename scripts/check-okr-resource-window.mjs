import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try{
  const page=await browser.newPage({viewport:{width:390,height:812},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const errors=[];let documents=0;
  page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('renderer crash'));
  page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documents++;});
  await page.addInitScript(()=>window.__scrollAuditBoot=Math.random());
  await page.goto(server.origin+'/okr',{waitUntil:'load'});
  const boot=await page.evaluate(()=>window.__scrollAuditBoot),navigationCount=documents;
  const initialHeights=await page.locator('.case-native-slide').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
  let peak=0;
  for(const language of ['en','zh']){
    await page.locator(`[data-lang="${language}"]`).evaluate(e=>e.click());
    for(const y of [0,800,1600,2400,3200,4000,4800,5600,6400,6800,5600,4000,3200,1600,0]){
      await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await page.waitForTimeout(140);
      const state=await page.evaluate(()=>{
        const sections=[...document.querySelectorAll('[data-okr-resource-managed]')];
        const active=sections.filter(e=>!e.hasAttribute('data-okr-resource-suspended'));
        const dormant=sections.filter(e=>e.hasAttribute('data-okr-resource-suspended'));
        const images=[...new Map([...document.images].filter(i=>i.currentSrc&&i.complete&&i.naturalWidth).map(i=>[i.currentSrc,i])).values()];
        return {y:scrollY,height:document.documentElement.scrollHeight,boot:window.__scrollAuditBoot,active:active.length,
          dormantHaveSources:dormant.some(e=>e.querySelector('img[src],img[srcset]')),
          dormantPaint:dormant.some(e=>getComputedStyle(e.querySelector('.case-native-canvas')).display!=='none'),
          visibleSuspended:dormant.some(e=>{const r=e.getBoundingClientRect();return r.bottom>1&&r.top<innerHeight-1;}),
          decodedMiB:Math.round(images.reduce((s,i)=>s+i.naturalWidth*i.naturalHeight*4,0)/1048576)};
      });
      assert.equal(state.boot,boot,'scroll must not reboot the document');assert.equal(documents,navigationCount,'scroll must not navigate');
      assert.ok(state.active<=8,`bounded working set: ${state.active}`);
      assert.equal(state.dormantHaveSources,false,'offscreen image sources released');assert.equal(state.dormantPaint,false,'offscreen paint trees released');
      assert.equal(state.visibleSuspended,false,'visible sections are restored');
      assert.ok(Math.abs(state.y-Math.min(y,state.height-812))<2,'scroll position must not jump to the top');
      peak=Math.max(peak,state.decodedMiB);
      const heights=await page.locator('.case-native-slide').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
      heights.forEach((h,i)=>assert.ok(Math.abs(h-initialHeights[i])<.1,'placeholder height stays unchanged'));
      assert.ok(await page.locator('.native-case-gallery [data-en][data-zh]').evaluateAll((es,lang)=>es.every(e=>e.textContent===(e.dataset[lang]||e.dataset.en)),language),'both languages update offscreen text too');
    }
  }
  await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-okr-resource-suspended]').count(),0,'desktop retains all presentation layers');
  await page.setViewportSize({width:390,height:812});await page.waitForTimeout(150);
  assert.ok(await page.locator('[data-okr-resource-suspended]').count()>20,'mobile working set restored after rotation');
  await page.goto(server.origin+'/project1');
  await page.locator('.project-pagination-link[rel="next"]').click();await page.waitForURL(u=>u.pathname==='/okr');
  await page.evaluate(()=>scrollTo({top:3500,behavior:'instant'}));await page.waitForTimeout(150);
  await page.goBack({waitUntil:'load'});await page.waitForURL(u=>u.pathname==='/project1');
  await page.goForward({waitUntil:'load'});await page.waitForURL(u=>u.pathname==='/okr');await page.waitForTimeout(150);
  assert.equal(await page.locator('.case-native-slide').count(),32,'history restores complete OKR page');
  assert.equal(errors.length,0,errors.join('\n'));await page.close();
  console.log(`PASS OKR: two full down/up passes, both languages, stable scroll/document/heights, bounded media, rotation/history; peak live decoded-pixel estimate ${peak} MiB (not measured RAM)`);
  const fallback=await browser.newPage({viewport:{width:390,height:812}});
  await fallback.addInitScript(()=>{delete window.IntersectionObserver;});
  await fallback.goto(server.origin+'/okr',{waitUntil:'load'});
  assert.equal(await fallback.locator('[data-okr-resource-suspended]').count(),0,'no observer support fails open');
  assert.ok(await fallback.locator('.case-native-canvas img[src]').count()>400,'fallback loads original artwork');
  await fallback.close();console.log('PASS OKR no-IntersectionObserver fallback');
}finally{await browser.close();await server.close();}
