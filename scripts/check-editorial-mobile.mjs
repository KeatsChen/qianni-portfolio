import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH});
try{
 for(const name of ['research','cozyup','materials']){
  const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:'reduce'});
  await page.goto(server.origin+'/'+name,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  for(const width of [320,375,390,760]){
   await page.setViewportSize({width,height:812});await page.waitForTimeout(150);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   for(const lang of ['en','zh']){
    await page.locator(`button[data-lang="${lang}"]`).evaluate(e=>e.click());
    await page.locator('.detail-overview-toggle').click();
    assert.equal(await page.locator('.detail-overview-toggle').getAttribute('aria-expanded'),'true');
    await page.locator('.detail-overview-toggle').click();
    const blocks=await page.locator('main > section').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
    blocks.slice(1).forEach((b,i)=>assert.ok(b.top>=blocks[i].bottom-1,'sections must not overlap'));
   }
  }
  await page.setViewportSize({width:375,height:812});
  for(let y=0;y<6500;y+=500){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(80);}
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:`/tmp/${name}-mobile-updated.png`,fullPage:true});
  const failed=await page.locator('main img[src]').evaluateAll(es=>es.filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src));
  assert.deepEqual(failed,[],'all displayed artwork must load');
  if(name==='research'){
   const pair=await page.locator('.desktop-pair').boundingBox();assert.ok(Math.abs(pair.width-343)<1);
   const grid=await page.locator('.web-grid').boundingBox();assert.ok(Math.abs(grid.width-250.561)<1);
  }else if(name==='cozyup'){
   const hero=await page.locator('.landing-page').boundingBox();assert.ok(Math.abs(hero.width-243.614)<1);
   const grid=await page.locator('.page-gallery').boundingBox();assert.ok(Math.abs(grid.width-275)<1);
  }else{
   const hero=await page.locator('.hero-home').boundingBox();assert.ok(Math.abs(hero.width-231.563)<1);assert.ok(Math.abs(hero.height-688.074)<1);
   const profile=await page.locator('.hero-profile').boundingBox();assert.ok(Math.abs(profile.y-hero.y-hero.height-24)<1);
   const grid=await page.locator('.phone-gallery-mobile').boundingBox();assert.ok(Math.abs(grid.width-339.806)<1);
   assert.equal(await page.locator('.phone-gallery-mobile .phone').count(),8);
   const copy=await page.locator('.detail-overview-fields').textContent();assert.ok(copy.includes('供应商端'));assert.ok(!copy.includes('规划 App 的信息架构'));
  }
  console.log(`PASS ${name}: Figma mobile geometry, bilingual disclosure, image loading and non-overlapping sections`);
  await page.close();
 }
}finally{await browser.close();await server.close();}
