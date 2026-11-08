import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try {
  for(const width of [1440,390]){
    const page=await browser.newPage({viewport:{width,height:900}});
    const heroURL=/\/assets\/architecture-v2\/home-screen-hero-\d+\.webp$/;
    let release;
    const pending=new Promise(resolve=>release=resolve);
    await page.route(heroURL,async route=>{await pending;await route.continue().catch(()=>{});});
    try{
      await Promise.all([
        page.waitForRequest(heroURL),
        page.goto(server.origin+'/project1',{waitUntil:'domcontentloaded'})
      ]);
      assert.equal(await page.locator('.detail-boot').isVisible(),false,'artwork must not hold the startup overlay');
      assert.ok(await page.evaluate(()=>document.documentElement.classList.contains('detail-motion-ready')),'content still animates in');
      await page.locator('.detail-overview-back').click({trial:true});
      if(width<760){
        const toggle=page.locator('.detail-overview-toggle');
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'),'true');
      }else{
        await page.locator('.site-nav button[data-lang="zh"]').click();
        assert.match(await page.locator('html').getAttribute('lang'),/^zh/);
      }
      await Promise.all([
        page.waitForURL(url=>url.pathname==='/okr',{waitUntil:'commit'}),
        page.locator('.project-pagination-link[rel="next"]').click()
      ]);
      console.log(`PASS ${width}px: return, page controls and next project are usable with first artwork still pending`);
    }finally{release();await page.close();}
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
