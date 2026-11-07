import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try{
  for(const width of [1440,320]){
    for(const project of ['/project1','/okr','/community']){
      const page=await browser.newPage({viewport:{width,height:900}});
      let release;
      const pending=new Promise(resolve=>release=resolve);
      try{
        await page.route('**/detail-overview.js?*',async route=>{
          await pending;
          await route.continue().catch(()=>{});
        });
        await page.goto(server.origin+'/content',{waitUntil:'domcontentloaded'});
        await page.goto(server.origin+project,{waitUntil:'commit'});
        await page.locator('.detail-boot .project-entry-grid').waitFor({state:'visible'});
        assert.equal(await page.locator('.detail-boot i:visible').count(),9);
        assert.equal(await page.locator('.detail-boot :is(a,button,nav):visible').count(),0);
        assert.equal(await page.locator('.detail-boot-nav').count(),0);
        assert.equal(await page.locator('h1').first().evaluate(e=>getComputedStyle(e).visibility),'hidden');
        assert.equal(await page.locator('.detail-boot-recovery').isVisible(),false);
        await page.goBack({waitUntil:'commit',timeout:7000});
        assert.equal(new URL(page.url()).pathname,'/content');
        console.log(`PASS ${width}px ${project}: only nine dots during loading; browser Back still works`);
      }finally{release();await page.close();}
    }
  }
}finally{await browser.close();await server.close();}
