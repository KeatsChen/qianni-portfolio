import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try{
  for(const width of [1440,320]){
    for(const [selector,path] of [['a[href="content"]','/content'],['a[href="./"]','/'],['a[rel="prev"]','/project1'],['a[rel="next"]','/chatbot']]){
      const page=await browser.newPage({viewport:{width,height:900}});
      let release;
      const pending=new Promise(resolve=>release=resolve);
      try{
        await page.route('**/detail-overview.js?*',async route=>{
          await pending;
          await route.continue().catch(()=>{});
        });
        await page.goto(server.origin+'/okr',{waitUntil:'commit'});
        const link=page.locator('.detail-boot-nav '+selector);
        await link.waitFor({state:'visible'});
        assert.equal(await page.locator('h1').first().evaluate(e=>getComputedStyle(e).visibility),'hidden');
        assert.equal(await page.locator('.detail-boot-recovery').isVisible(),false,'navigation is available before the timeout UI');
        await Promise.all([
          page.waitForURL(url=>url.pathname===path,{waitUntil:'commit',timeout:7000}),
          link.click({noWaitAfter:true,timeout:5000})
        ]);
        console.log(`PASS ${width}px: ${path} opens before the detail script finishes`);
      }finally{release();await page.close();}
    }
  }
}finally{await browser.close();await server.close();}
