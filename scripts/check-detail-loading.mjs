import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try {
  for(const width of [1440,390]){
    const page=await browser.newPage({viewport:{width,height:900}});
    const heroURL=/\/assets\/architecture-v2\/home-screen-hero-\d+\.webp$/;
    await page.route(heroURL,async route=>{
      await new Promise(resolve=>setTimeout(resolve,1800));await route.continue();
    });
    await Promise.all([
      page.waitForRequest(heroURL),
      page.goto(server.origin+'/project1',{waitUntil:'domcontentloaded'})
    ]);
    assert.equal(await page.locator('.detail-boot').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(1, 1, 11)');
    assert.deepEqual(await page.locator('.detail-boot i').evaluateAll(dots=>dots.map(e=>getComputedStyle(e).animationDelay)),['0s','0.2s','0.4s','0.2s','0.4s','0.6s','0.4s','0.6s','0.8s']);
    assert.ok(await page.evaluate(()=>document.documentElement.classList.contains('detail-motion-pending')));
    assert.equal(await page.locator('.detail-overview-title').evaluate(e=>getComputedStyle(e).visibility),'hidden');
    await page.waitForFunction(()=>!document.documentElement.classList.contains('detail-motion-pending'));
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.detail-overview-title')).opacity==='1');
    assert.ok(await page.evaluate(()=>document.documentElement.classList.contains('detail-motion-ready')),'normal visit preserves entrance animations');
    const sequence=await page.locator('.site-nav > *, .detail-overview-title, .detail-overview-facts, .detail-overview-fields > dl').evaluateAll(nodes=>nodes.filter(e=>e.getBoundingClientRect().width).map(e=>({top:e.getBoundingClientRect().top,shown:e.hasAttribute('data-detail-shown')})).sort((a,b)=>a.top-b.top));
    assert.ok(sequence.some(e=>e.shown),'entrance begins once the loader exits');
    await page.close();
    console.log(`PASS ${width}px: loading transition downloads first artwork, then entrance begins`);
  }
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.route('**/detail-motion.js?*',async route=>{
    await new Promise(resolve=>setTimeout(resolve,2000));await route.continue();
  });
  const navigation=page.goto(server.origin+'/project1',{waitUntil:'domcontentloaded'});
  await page.locator('.detail-boot .project-entry-grid').waitFor();
  await navigation;
  await page.waitForFunction(()=>!document.documentElement.classList.contains('detail-motion-pending'));
  await page.close();
  console.log('PASS loading animation exists before delayed external motion script');
} finally {await browser.close();await server.close();}
