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
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pending=page.waitForEvent('console',{predicate:message=>message.text().startsWith('handoff:'),timeout:20000});
  let requested=false;
  await page.route('**/okr?*',async route=>{
    requested=true;
    await new Promise(resolve=>setTimeout(resolve,16000));
    await route.continue();
  });
  await page.goto(server.origin+'/project1',{waitUntil:'load'});
  await page.evaluate(()=>{
    const link=document.querySelector('.project-pagination-link[rel="next"]');
    // Sample inside the outgoing document: remote evaluations may wait for
    // the pending navigation and end up running on the destination instead.
    link.addEventListener('click',()=>setTimeout(()=>{
      const loader=document.querySelector('.project-entry-loading');
      console.log('handoff:'+JSON.stringify([location.pathname,getComputedStyle(loader).opacity,loader.offsetWidth===innerWidth]));
    },13200),{once:true});
    setTimeout(()=>link.click(),0);
  });
  assert.equal((await pending).text(),'handoff:["/project1","1",true]','the source must still be covered past the old timeout');
  await page.waitForURL(url=>url.pathname==='/okr',{timeout:15000});
  await page.locator('.detail-overview-title').waitFor();
  assert.ok(requested,'the architecture footer must issue an actual OKR request');
  await page.goBack({waitUntil:'load'});
  assert.equal(new URL(page.url()).pathname,'/project1');
  assert.equal(await page.locator('.project-entry-loading.is-active').count(),0);
  console.log('PASS architecture → OKR: 16-second response, no flash past the old timeout, Back clears feedback');
}finally{await browser.close();await server.close();}
