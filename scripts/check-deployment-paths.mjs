// Run against the local preview while emulating Cloudflare Pages' clean URLs.
// PLAYWRIGHT_MODULE may point to an existing Playwright module; no app dependency.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:4174';
const names = ['project1','okr','chatbot','research','cozyup','materials','sports','bim','food','sustainability','community'];
const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH} : {})});
try {
  for (const width of [1440,390]) {
    const page = await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      const name = url.pathname.slice(1);
      if (url.origin === origin && names.includes(name)) {
        return route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,name+'.html'))});
      }
      return route.continue();
    });
    for (const name of names) {
      const snapshots = [];
      for (const suffix of ['.html','']) {
        await page.goto(`${origin}/${name}${suffix}`,{waitUntil:'load'});
        await page.evaluate(() => document.fonts.ready);
        const languages = [];
        for (const lang of ['en','zh']) {
          await page.locator(`button[data-lang="${lang}"]`).evaluate(button => button.click());
          await page.waitForTimeout(80);
          languages.push(await page.evaluate(() => {
            const overview = document.querySelector('.detail-overview');
            const size = element => {
              const box = element.getBoundingClientRect();
              return [box.x,box.y,box.width,box.height].map(value => Math.round(value * 10) / 10);
            };
            return {
              identity:document.body.className,
              title:overview.querySelector('h1').textContent,
              fields:overview.querySelector('.detail-overview-fields').textContent,
              facts:overview.querySelector('.detail-overview-facts').textContent,
              bounds:size(overview),
              characteristics:[...document.querySelectorAll('[data-okr-characteristic-label]')].map(element => {
                const css = getComputedStyle(element);
                return [css.fontSize,css.whiteSpace,css.display];
              }),
              implementation:[...document.querySelectorAll('[data-okr-implementation-row]')].map(element => getComputedStyle(element).display)
            };
          }));
        }
        snapshots.push(languages);
      }
      assert.deepEqual(snapshots[1],snapshots[0],`${width}px: /${name} differs from /${name}.html`);
      if (name === 'okr') {
        assert.equal(snapshots[1][0].characteristics[0][0],'10px');
        assert.ok(snapshots[1][0].implementation.every(display => display === 'flex'));
      }
      assert.equal(errors.length,0,errors.join('\n'));
      console.log(`PASS ${width}px /${name}: clean URL equals .html, English and Chinese`);
    }
    await page.close();
  }
} finally { await browser.close(); }
