import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const names=['project1','okr','chatbot','research','cozyup','materials','sports','bim','food','sustainability','community'];
try{
  for(const name of names){
    for(const width of [320,377,390,760]){
      const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(server.origin+'/'+name,{waitUntil:'load'});
      const header=page.locator('.detail-overview'),button=page.locator('.detail-overview-toggle');
      assert.equal(await button.getAttribute('aria-expanded'),'false');
      const closed=await header.evaluate(e=>e.getBoundingClientRect().height);
      await button.click();assert.equal(await button.getAttribute('aria-expanded'),'true');
      assert.equal(await button.isVisible(),true,'Show less remains available after expansion');
      assert.ok(await button.locator('img').evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).b<0),'expanded arrow points up');
      assert.ok(await header.evaluate((e,closed)=>e.getBoundingClientRect().height>=closed,closed));
      assert.equal(await header.evaluate(e=>getComputedStyle(e).maxHeight),'none');
      assert.equal(await page.locator('.project-pagination').evaluate(e=>!!e.closest('.scaled-detail-body')),false);
      for(const lang of ['en','zh']){
        await page.locator(`[data-lang="${lang}"]`).evaluate(e=>e.click());
        await page.waitForTimeout(80);
        assert.equal(await button.locator('span').textContent(),lang==='en'?'Show less':'收起');
        assert.ok(await button.evaluate(e=>{
          const root=e.closest('.detail-overview');
          const bottom=Math.max(...[...root.querySelectorAll('.detail-overview-fields,.detail-overview-facts')].map(n=>n.getBoundingClientRect().bottom));
          return e.getBoundingClientRect().top>=bottom+10;
        }),'collapse button has its own space below both information columns');
        if(name==='project1'){
          const copy=await page.locator('.arch-mobile-case').evaluate(root=>{
            const targets=[...root.querySelectorAll('[data-arch-copy-source]')];
            const sources=new Set(targets.map(e=>document.querySelector(e.dataset.archCopySource)));
            const web=[...document.querySelectorAll('.arch-case .arch-rich')].filter(e=>!e.closest('.arch-mobile-case'));
            return {mismatched:targets.filter(e=>e.textContent!==document.querySelector(e.dataset.archCopySource)?.textContent).map(e=>e.dataset.nodeId||e.dataset.archCopySource),missing:web.filter(e=>!sources.has(e)).map(e=>e.className)};
          });
          assert.deepEqual(copy.mismatched,[],`mobile copy equals Web copy (${lang})`);
          assert.deepEqual(copy.missing,[],`every Web paragraph has a mobile counterpart (${lang})`);
        }
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} ${width} ${lang}: horizontal overflow`);
        for(const link of await page.locator('.project-pagination-link').all()){
          const metrics=await link.evaluate(e=>{
            const label=e.querySelector('.project-pagination-label'),icon=e.querySelector('.project-pagination-arrow');
            const a=label.getBoundingClientRect(),b=icon.getBoundingClientRect();
            return {difference:Math.abs(a.y+a.height/2-b.y-b.height/2),icon:b.width,label:a.width,overflow:label.scrollWidth>label.clientWidth+1,href:e.getAttribute('href')};
          });
          assert.ok(metrics.difference<1,'icon centered on multi-line project label');
          assert.equal(Math.round(metrics.icon),14);assert.ok(metrics.label<=113.1);assert.equal(metrics.overflow,false);
          assert.match(metrics.href,/\?v=20261107-(?:loading-clean-27|arch-webp-28)$/);
        }
      }
      if(name==='project1'){
        assert.equal(await page.locator('.arch-mobile-case').evaluate(e=>getComputedStyle(e).display),'block');
        assert.ok(await page.locator('.arch-mobile-case [data-node-id="5186:3502"]').count(),'Figma color section exists');
        assert.equal(await page.locator('.project-pagination-link[rel="prev"]').count(),0,'first project has no previous project');
      }
      await button.click();
      assert.equal(await button.getAttribute('aria-expanded'),'false');
      assert.equal(await button.locator('span').textContent(),'展开');
      assert.ok(await button.locator('img').evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).b>0),'collapsed arrow points down');
      assert.notEqual(await header.evaluate(e=>getComputedStyle(e).maxHeight),'none');
      await button.click();assert.equal(await button.getAttribute('aria-expanded'),'true','can expand again');
      await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(80);
      assert.equal(await button.isVisible(),false,'no mobile disclosure on desktop');
      assert.equal(await header.evaluate(e=>getComputedStyle(e).maxHeight),'none');
      assert.equal(errors.length,0,errors.join('\n'));await page.close();
    }
    console.log(`PASS ${name}: disclosure, bilingual pagination, 320/377/390/760px and desktop restoration`);
  }
}finally{await browser.close();await server.close();}
