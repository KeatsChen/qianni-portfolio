// A missing observer callback / slow parser must never leave a black article.
import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const missingObserver=()=>{
  window.IntersectionObserver=class {observe(){}unobserve(){}disconnect(){}};
};
try {
  for(const source of ['/', '/content', '/okr']) {
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    await page.goto(server.origin+source,{waitUntil:'load'});
    await page.locator('a[href^="project1?"]').first().click();
    await page.waitForURL(url=>url.pathname==='/project1');
    await page.waitForFunction(()=>!document.documentElement.classList.contains('detail-motion-pending')&&getComputedStyle(document.querySelector('.detail-overview-title')).opacity==='1');
    for(let i=0;i<8;i++) {
      assert.equal(await page.locator('.detail-overview-title').evaluate(e=>getComputedStyle(e).opacity),'1','shown header must never disappear again');
      await page.waitForTimeout(100);
    }
    await page.goBack({waitUntil:'load'});
    assert.equal(new URL(page.url()).pathname,source);
    await page.close();
    console.log(`PASS architecture entry from ${source}: visible header, no second hiding, browser Back`);
  }
  for(const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.addInitScript(missingObserver);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(server.origin+'/project1',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!document.documentElement.classList.contains('detail-motion-pending')&&getComputedStyle(document.querySelector('.detail-overview-title')).opacity==='1');
    assert.equal(await page.locator('.detail-overview-title').getAttribute('data-detail-shown'),'');
    await page.evaluate(()=>window.scrollTo(0,2000));
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('[data-detail-enter]:not([data-detail-shown])').evaluateAll(nodes=>nodes.some(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.top<innerHeight;})),false,'scroll reveals also work without observer callbacks');
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(`PASS ${width}px: missing observer callback, initial paint and scroll recovery`);
  }
  for(const slowParser of [false,true]) {
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    await page.addInitScript(()=>{
      window.IntersectionObserver=class {observe(){}unobserve(){}disconnect(){}};
      window.setTimeout=()=>0;
      window.requestAnimationFrame=()=>0;
    });
    if(slowParser) await page.route('**/detail-overview.js?*',async route=>{
      await new Promise(resolve=>setTimeout(resolve,6500));await route.continue();
    });
    const navigation=page.goto(server.origin+'/project1',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.arch-title-row, .detail-overview-title',{state:'attached'});
    await page.waitForTimeout(8500);
    assert.ok(await page.locator('h1').first().evaluate(e=>{
      for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.visibility==='hidden'||Number(s.opacity)===0)return false;}return true;
    }),'CSS alone must expose the article even if JS timers and animation frames stop');
    await navigation;
    await page.waitForTimeout(500);
    assert.ok(await page.locator('h1').first().evaluate(e=>{
      for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.visibility==='hidden'||Number(s.opacity)===0)return false;}return true;
    }),'late startup must not hide content again');
    await page.close();
    console.log(`PASS CSS-only recovery: timers/frames paused, ${slowParser?'slow':'normal'} parser`);
  }
} finally {await browser.close();await server.close();}
