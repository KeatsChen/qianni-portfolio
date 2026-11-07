import assert from 'node:assert/strict';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const server = await startPreview();
const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH} : {})});
try {
  for (const name of ['research', 'materials']) {
    for (const width of [1920, 1440, 1280, 1100, 1024, 801, 800, 761, 390, 375]) {
      const page = await browser.newPage({viewport:{width,height:900}, reducedMotion:'reduce'});
      await page.goto(`${server.origin}/${name}`, {waitUntil:'load'});
      for (const lang of ['en','zh']) {
        await page.locator(`[data-lang="${lang}"]`).first().evaluate(e => e.click());
        const metrics = await page.evaluate(() => {
          const nav = document.querySelector('.site-nav');
          const box = e => {const r=e.getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width};};
          return {nav:box(nav), content:box(document.querySelector('.detail-overview')), padding:getComputedStyle(nav).paddingLeft, hidden:getComputedStyle(nav).display==='none', overflow:document.documentElement.scrollWidth>innerWidth+1};
        });
        if (width > 760) {
          assert.ok(Math.abs(metrics.nav.left-metrics.content.left)<1, `${name} ${width} ${lang}: left alignment`);
          assert.ok(Math.abs(metrics.nav.right-metrics.content.right)<1, `${name} ${width} ${lang}: right alignment`);
          assert.equal(metrics.padding,'20px');
          if (width===1440) assert.equal(metrics.nav.width,1240);
        } else assert.ok(metrics.hidden, 'mobile keeps its shared header');
        assert.equal(metrics.overflow,false);
      }
      await page.close();
    }
    console.log(`PASS ${name}: bilingual nav/content alignment, 761–1920px; mobile unchanged`);
  }
} finally {await browser.close(); await server.close();}
