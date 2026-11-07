import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const preview=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try{
  for(const [width,dpr,variant] of [[1440,1,480],[1440,2,880],[390,3,480],[760,3,880]]){
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:dpr,reducedMotion:'reduce'});
    const requests=[];
    page.on('request',r=>requests.push(new URL(r.url()).pathname));
    await page.goto(preview.origin+'/project1',{waitUntil:'domcontentloaded'});
    const legacyImages=await page.locator('main img,.detail-overview img').evaluateAll(imgs=>imgs
      .flatMap(img=>[img.getAttribute('src'),img.getAttribute('data-media-src')])
      .filter(src=>src&&/\.(?:png|jpe?g)(?:\?|$)/i.test(src)));
    assert.deepEqual(legacyImages,[],'architecture artwork uses WebP or SVG on both layouts');
    const images=page.locator(width>760?'.arch-hero img':'[data-node-id="5168:2337"] > img,[data-node-id="5168:2340"] > img');
    await images.first().waitFor({state:'visible'});
    const sources=await images.evaluateAll(async imgs=>{
      await Promise.all(imgs.map(img=>img.decode()));
      return imgs.map(img=>img.currentSrc);
    });
    assert.equal(sources.length,2);
    sources.forEach(src=>assert.match(src,new RegExp(`-hero-${variant}\\.webp$`)));
    assert.equal(requests.filter(p=>/-screen-hero-\d+\.webp$/.test(p)).length,2,'one preview per visible hero, not both layouts');
    assert.equal(requests.some(p=>/\/architecture-v2\/(?:home|enterprise)-screen(?:\.png|-full\.webp)$/.test(p)),false,'full-size artwork is not fetched for the first viewport');
    const original=page.locator(width>760?'.arch-after-grid img[data-media-src$="home-screen-full.webp"]':'[data-node-id="5168:2414"] > img');
    await Promise.all([
      page.waitForRequest(r=>r.url().endsWith('/home-screen-full.webp')),
      original.scrollIntoViewIfNeeded()
    ]);
    await page.close();
    console.log(`PASS ${width}px @${dpr}x: only ${variant}w previews at entry, full-resolution image retained below`);
  }
}finally{await browser.close();await preview.close();}
