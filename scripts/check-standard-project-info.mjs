import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH});
const names=['sports','bim','food','sustainability','community'];
const counts=[3,3,2,3,2];
try{
 for(const [index,name] of names.entries()){
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await page.goto(server.origin+'/'+name,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  const artwork=await page.locator('.project-gallery img').first().getAttribute('data-media-src');
  for(const width of [1440,1024,761,375,320,390,760,1440]){
   await page.setViewportSize({width,height:900});await page.waitForTimeout(100);
   const mobile=width<=760;
   if(mobile&&await page.locator('.detail-overview-toggle').getAttribute('aria-expanded')==='false')await page.locator('.detail-overview-toggle').click();
   for(const lang of ['en','zh']){
    await page.locator(`[data-lang="${lang}"]`).evaluate(e=>e.click());
    const metrics=await page.evaluate(()=>{
     const fields=document.querySelector('.detail-overview-fields'),facts=document.querySelector('.detail-overview-facts');
     const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,right:b.right,width:b.width,bottom:b.bottom};};
     return {fields:box(fields),facts:box(facts),order:[...facts.children].map(e=>e.querySelector('dt')?.dataset.en||'Tools'),roleLeft:!!fields.querySelector('[data-en="Role"]'),copy:[...document.querySelectorAll('.detail-overview [data-en][data-zh]')].every(e=>e.textContent===e.dataset[document.documentElement.lang==='en'?'en':'zh']),overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    assert.equal(metrics.copy,true);assert.equal(metrics.overflow,false);
    assert.equal(await page.locator('.detail-overview-fields li').count(),counts[index]);
    if(mobile){
     assert.equal(metrics.facts.width,69);assert.ok(metrics.fields.width<=253.1);
     assert.ok(metrics.fields.x-metrics.facts.right>=20.9);
     assert.deepEqual(metrics.order,['Tools','Role','Visual Style','Date','Devices',...(['sports','bim','community'].includes(name)?['Location']:[])]);
     assert.equal(metrics.roleLeft,false);
    }else{
     assert.equal(metrics.facts.width,200);assert.ok(metrics.fields.width<=862.1);
     assert.ok(metrics.facts.x-metrics.fields.right>=79.9);assert.equal(metrics.roleLeft,true);
    }
   }
   if(width===375){
    await page.screenshot({path:`/tmp/${name}-info-mobile.png`,fullPage:true});
    await page.locator('.detail-overview-toggle').click();assert.equal(await page.locator('.detail-overview-toggle').getAttribute('aria-expanded'),'false');
   }
  }
  assert.equal(await page.locator('.project-gallery img').first().getAttribute('data-media-src'),artwork);
  await page.screenshot({path:`/tmp/${name}-info-desktop.png`,fullPage:true});
  console.log(`PASS ${name}: bilingual copy, metadata order, fixed widths/gutters, desktop/mobile role relocation, disclosure, unchanged artwork`);
  await page.close();
 }
}finally{await browser.close();await server.close();}
