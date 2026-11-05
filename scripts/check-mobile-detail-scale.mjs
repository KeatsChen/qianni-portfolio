import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const names=['project1','okr','chatbot','research','cozyup','materials','sports','bim','food','sustainability','community'];
try{
for(const name of names){
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.origin+'/'+name,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  const sample=()=>page.evaluate(()=>[...document.querySelectorAll('main section:not(.detail-overview),.native-case-gallery,.arch-hero,.project-gallery,.hero-phones,.desktop-pair,.landing-page,.page-shot')].map(element=>{
    const box=element.getBoundingClientRect();return [box.width,box.height];
  }));
  const desktop=await sample();
  for(const width of [320,390,760]){
    await page.setViewportSize({width,height:844});await page.waitForTimeout(120);
    const mobile=await sample();
    assert.equal(mobile.length,desktop.length);
    desktop.forEach((box,i)=>box.forEach((value,j)=>assert.ok(Math.abs(value*width/1440-mobile[i][j])<2,`${name}: ${width}px artwork ${i} dimension ${j}`)));
    assert.equal(await page.locator('.detail-overview').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ')[0]),'69px','overview uses the Figma metadata column');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  }
  await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(120);
  const restored=await sample();desktop.forEach((box,i)=>box.forEach((value,j)=>assert.ok(Math.abs(value-restored[i][j])<2,`${name}: desktop restored`)));
  assert.equal(errors.length,0,errors.join('\n'));
  console.log(`PASS ${name}: desktop composition scales at 320/390/760px, mobile header columns, desktop restored`);
  await page.close();
}
}finally{await browser.close();await server.close();}
