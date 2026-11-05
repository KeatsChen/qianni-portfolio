import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const names=['project1','okr','chatbot','research','cozyup','materials','sports','bim','food','sustainability','community'];
try{
for(const name of names){
  const editorial=['project1','research','cozyup','materials'].includes(name);
  const nativeCanvas=['chatbot','okr'].includes(name);
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.origin+'/'+name,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  const sample=()=>page.evaluate(()=>[...document.querySelectorAll('main section:not(.detail-overview),.native-case-gallery,.arch-hero,.project-gallery,.hero-phones,.desktop-pair,.landing-page,.page-shot')].map(element=>{
    const box=element.getBoundingClientRect();return [box.width,box.height];
  }));
  const desktop=await sample();
  for(const width of [320,377,390,760]){
    await page.setViewportSize({width,height:844});
    await page.waitForFunction(mode=>document.body.classList.contains(mode),nativeCanvas?'mobile-detail-native':editorial?'mobile-detail-editorial':'mobile-detail-scaled');
    await page.waitForTimeout(120);
    const mobile=await sample();
    assert.equal(mobile.length,desktop.length);
    if(editorial){
      assert.equal(await page.locator('.scaled-detail-body').count(),0,'dedicated Figma mobile body must not be Web-scaled');
      assert.ok(await page.locator('body').evaluate(e=>e.classList.contains('mobile-detail-editorial')));
      assert.ok(await page.locator('main').evaluate(e=>Math.abs(e.getBoundingClientRect().width-innerWidth)<2));
    }else {
      const ratio=nativeCanvas?(width-32)/1084:width/1440;
      desktop.forEach((box,i)=>box.forEach((value,j)=>assert.ok(Math.abs(value*ratio-mobile[i][j])<2,`${name}: ${width}px artwork ${i} dimension ${j}`)));
      if(nativeCanvas){
        assert.equal(await page.locator('.scaled-detail-body').count(),0,'native presentation must not scale its Web shell');
        const metrics=await page.locator('.native-case-gallery').evaluate(e=>({x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width,gap:parseFloat(getComputedStyle(e).rowGap)}));
        assert.equal(metrics.x,16);assert.equal(metrics.width,width-32);assert.ok(Math.abs(metrics.gap-24*ratio)<.05);
      }
    }
    assert.equal(await page.locator('.detail-overview').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ')[0]),'69px','overview uses the Figma metadata column');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  }
  await page.setViewportSize({width:1440,height:900});
  await page.waitForFunction(()=>!document.body.matches('.mobile-detail-editorial,.mobile-detail-native,.mobile-detail-scaled'));
  await page.waitForTimeout(120);
  const restored=await sample();desktop.forEach((box,i)=>box.forEach((value,j)=>assert.ok(Math.abs(value-restored[i][j])<2,`${name}: desktop restored`)));
  assert.equal(errors.length,0,errors.join('\n'));
  console.log(`PASS ${name}: ${nativeCanvas?'16px-gutter scaled Web presentation':editorial?'dedicated Figma mobile body':'scaled Web body'} at 320/377/390/760px, mobile header columns, desktop restored`);
  await page.close();
}
}finally{await browser.close();await server.close();}
