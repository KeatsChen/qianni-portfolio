import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const server=await startPreview(),browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH});
try {
  for(const script of ['detail-motion.js','detail-overview.js','architecture-detail.js']){
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    let release;const gate=new Promise(resolve=>release=resolve);
    await page.route(`**/${script}?*`,async route=>{await gate;await route.continue();});
    const nav=page.goto(server.origin+'/project1',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!document.body&&!!document.querySelector('h1'),{},{timeout:4000});
    assert.equal(await page.locator('script[src]:not([defer]):not([async])').count(),0);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement,'::after').content),'""');
    release();await nav;
    await page.waitForFunction(()=>!document.documentElement.classList.contains('detail-motion-pending'));
    await page.locator('.detail-overview-title').waitFor();
    await page.close();console.log(`PASS stalled ${script}: body parses, loader exists, header initializes after release`);
  }
}finally{await browser.close();await server.close();}
