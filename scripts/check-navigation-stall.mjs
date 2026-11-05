// Real project links must work with animation frames paused and a slow response.
import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try{
  for(const width of [1440,390])for(const lang of ['en','zh']){
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();
    let requested=false;
    await page.route('**/okr?*',async route=>{
      requested=true;
      await new Promise(resolve=>setTimeout(resolve,1500));
      await route.continue();
    });
    await page.goto(server.origin+'/content',{waitUntil:'load'});
    await page.locator('button[data-lang="'+lang+'"]').evaluate(button=>button.click());
    assert.equal(await page.locator('.project-transition').count(),0,'must not have blocking overlay');
    const target=await page.locator('#okr.gallery-card').getAttribute('href');
    assert.ok(target.startsWith('okr?'));
    // This used to deadlock the delayed requestAnimationFrame navigation gate.
    await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});
    await page.locator('#okr.gallery-card').click({noWaitAfter:true});
    await page.waitForURL(url=>url.pathname==='/okr',{timeout:15000});
    assert.ok(requested,'native click must issue an actual request');
    await page.locator('.detail-overview-title').waitFor();
    assert.ok(await page.locator('body.okr-detail-page .detail-overview-fields').textContent());
    await page.goBack({waitUntil:'load'});
    await page.waitForURL(url=>url.pathname==='/content');
    assert.equal(await page.locator('.project-transition').count(),0);
    console.log('PASS '+width+'px '+lang+': paused animation frames, delayed OKR response, native navigation and back');
    await context.close();
  }
}finally{await browser.close();await server.close();}
