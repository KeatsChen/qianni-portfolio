import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try{
  for(const width of [1440,320]){
    for(const project of ['/project1','/okr','/chatbot','/research','/cozyup','/materials','/sports','/bim','/food','/sustainability','/community']){
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
        assert.equal(await page.locator('.detail-boot :is(a,button,nav):visible').count(),1);
        assert.equal(await page.locator('.detail-boot-nav').count(),0);
        assert.equal(await page.locator('h1').first().evaluate(e=>getComputedStyle(e).visibility),'hidden');
        assert.equal(await page.locator('.detail-boot-recovery').isVisible(),false);
        const back=page.locator('.detail-boot').getByRole('link',{name:/^(Back to projects|返回项目列表)$/});
        const expectedHash=project==='/project1'?'#architecture':'#'+project.slice(1);
        assert.equal(new URL(await back.getAttribute('href'),page.url()).hash,expectedHash);
        await Promise.all([
          page.waitForURL(url=>url.pathname==='/content'&&url.hash===expectedHash,{waitUntil:'commit',timeout:7000}),
          back.click({timeout:3000})
        ]);
        console.log(`PASS ${width}px ${project}: one loading back arrow works with startup scripts still blocked`);
      }finally{release();await page.close();}
    }
  }
}finally{await browser.close();await server.close();}
