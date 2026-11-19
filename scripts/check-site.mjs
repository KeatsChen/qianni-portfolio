// Deployment regression: every root page, real clean-URL redirects, both sizes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {startPreview} from './cloudflare-preview.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages=fs.readdirSync(root).filter(file=>file.endsWith('.html')).sort();
for(const file of fs.readdirSync(root).filter(file=>/\.(html|css)$/.test(file))){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const pattern=file.endsWith('.css')?/url\(\s*["']?([^"')\s]+)["']?\s*\)/g:/(?:src|href|data-media-src)="([^"#]+)"/g;
  for(const match of source.matchAll(pattern)){
    const asset=match[1].split(/[?#]/)[0];
    if(!asset||/^(?:[a-z]+:|\/\/|%23)/i.test(asset))continue;
    const resolved=path.resolve(root,path.dirname(file),asset);
    assert.ok(fs.existsSync(resolved)||(!path.extname(resolved)&&fs.existsSync(resolved+'.html')),`${file}: missing ${asset}`);
  }
}
console.log('PASS static HTML/CSS local asset references');
const preview=await startPreview();
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
try{
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    let homeRequests=0;
    page.on('request',request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame()&&new URL(request.url()).pathname==='/')homeRequests++;});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.url().startsWith(preview.origin)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
    const snapshot=()=>page.evaluate(()=>({title:document.title,heading:document.querySelector('h1')?.textContent,identity:[...document.body.classList].filter(name=>name.includes('page')||name.endsWith('-view')).sort(),fields:document.querySelector('.detail-overview-fields')?.textContent}));
    for(const file of pages){
      const clean=file==='index.html'?'/':'/'+file.slice(0,-5);
      await page.goto(`${preview.origin}/${file}?audit=1`,{waitUntil:'load'});
      assert.equal(new URL(page.url()).pathname,clean,`${file}: redirect`);
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(()=>!document.documentElement.classList.contains('home-booting'),{},{timeout:3000});
      if(await page.locator('button[data-lang="en"]').count()){
        let chatbotChineseType;
        for(const lang of ['zh','en']){
          await page.locator(`button[data-lang="${lang}"]`).first().evaluate(button=>button.click());
          assert.equal(await page.locator('html').getAttribute('lang'),lang==='zh'?'zh-CN':'en',`${file}: language`);
          const footerText=await page.locator('.site-footer-nav [data-en][data-zh]').evaluateAll((links,selected)=>links.every(link=>link.textContent===link.dataset[selected]),lang);
          assert.ok(footerText,`${file}: footer language`);
          if(file==='okr.html'){
            assert.ok(await page.locator('body.okr-detail-page').count());
            assert.equal(await page.locator('[data-okr-implementation-row]').first().evaluate(element=>getComputedStyle(element).display),'flex');
            if(lang==='en')assert.equal(await page.locator('[data-okr-characteristic-label]').first().evaluate(element=>getComputedStyle(element).fontSize),'10px');
          }
          if(file==='chatbot.html'){
            const items = page.locator('body.chatbot-detail-page .detail-overview-field li');
            assert.equal(await items.count(),4);
            assert.match(await items.first().textContent(),lang==='zh'?/^与产品经理沟通/:/^Worked with the product manager/);
            assert.equal(await items.last().textContent(),lang==='zh'?'*项目已进行脱敏处理':'*Sensitive project details have been anonymized.');
            await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
            const type = await page.locator('.native-case-gallery .case-native-canvas [data-en][data-zh]').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).fontSize));
            assert.ok(type.length>0,'Chatbot has bilingual body text');
            if(lang==='zh')chatbotChineseType=type;
            else assert.deepEqual(type,chatbotChineseType,'Chatbot body uses the same font sizes in both languages');
            const introduction=await page.locator('[data-node-id="5103:3567"]').textContent();
            assert.equal(introduction,lang==='zh'
              ? 'Chatbot是一款面向有情绪陪伴需求的年轻人的 AI 应用，通过聊天倾诉与愿望卡，帮助用户梳理当下情绪、建立对未来的期待。'
              : 'Chatbot is an AI companion for young adults seeking emotional support, combining conversations and wish cards to help them make sense of their feelings and have something to look forward to.');
            if(lang==='en'){
              const lines=await page.locator('[data-node-id="5103:3567"]').evaluate(el=>el.clientHeight/parseFloat(getComputedStyle(el.firstElementChild).lineHeight));
              assert.equal(lines,5,'Updated Chatbot English introduction fits five lines at its original type size');
            }
          }
        }
      }
      const before=await snapshot();
      await page.reload({waitUntil:'load'});
      assert.deepEqual(await snapshot(),before,`${file}: refresh changed page`);
      await page.goto(`${preview.origin}${clean}?audit=2`,{waitUntil:'load'});
      assert.deepEqual(await snapshot(),before,`${file}: direct clean entry changed page`);
      assert.ok(await page.locator('main').count(),`${file}: missing main`);
      if(await page.locator('.back-to-top').count()){
        await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
        await page.waitForTimeout(100);
        if(await page.locator('.back-to-top').first().isVisible()){
          await page.locator('.back-to-top').first().click();
          await page.waitForFunction(()=>scrollY<2,{},{timeout:5000});
        }
      }
      assert.equal(errors.length,0,errors.join('\n'));
      console.log(`PASS ${width}px ${file}: redirect, direct entry, refresh, language, back-to-top, resources`);
    }
    // Work List tabs must support URL state, refresh and browser history.
    await page.goto(`${preview.origin}/content`,{waitUntil:'load'});
    const tabs=['uiux','graphic','motion','illustration','personal'];
    for(const tab of tabs.slice(1)){
      await page.locator(`[data-work-tab="${tab}"]`).click();
      assert.equal(new URL(page.url()).searchParams.get('tab'),tab);
      await page.reload({waitUntil:'load'});
      assert.equal(await page.locator('[data-work-tab][aria-current="page"]').getAttribute('data-work-tab'),tab);
    }
    await page.goBack();
    assert.equal(await page.locator('[data-work-tab][aria-current="page"]').getAttribute('data-work-tab'),'illustration');
    await page.goForward();
    assert.equal(await page.locator('[data-work-tab][aria-current="page"]').getAttribute('data-work-tab'),'personal');
    for(const tab of tabs){
      await page.goto(`${preview.origin}/content?tab=${tab}`,{waitUntil:'load'});
      assert.equal(await page.locator('[data-work-tab][aria-current="page"]').getAttribute('data-work-tab'),tab);
      const previousHomeRequests=homeRequests;
      await page.locator('.back-button:visible').first().click();
      await page.waitForURL(url=>url.pathname==='/');
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(()=>scrollY),0,`${tab}: home top`);
      assert.equal(homeRequests-previousHomeRequests,1,`${tab}: home should load only once`);
    }
    console.log(`PASS ${width}px all Work List tabs: direct links, refresh, history, return home`);
    for(const tab of ['graphic','illustration']){
      await page.goto(`${preview.origin}/content?tab=${tab}`,{waitUntil:'load'});
      await page.locator(tab==='graphic'?'.graphic-grid-poster':'.illustration-card').first().click();
      const lightbox=page.locator('.graphic-lightbox');
      assert.equal(await lightbox.getAttribute('aria-hidden'),'false');
      await lightbox.locator('img').evaluate(image=>image.decode());
      await page.keyboard.press('Escape');
      assert.equal(await lightbox.getAttribute('aria-hidden'),'true');
    }
    await page.goto(`${preview.origin}/content?tab=motion`,{waitUntil:'load'});
    const lastVideo=page.locator('.motion-showcase-card video').last();
    assert.equal(await lastVideo.getAttribute('src'),null,'offscreen video should stay deferred');
    await lastVideo.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('.motion-showcase-card:last-child video').hasAttribute('src'));
    await page.locator('.motion-showcase-card').last().click();
    assert.equal(await page.locator('.motion-lightbox').getAttribute('aria-hidden'),'false');
    assert.ok(await page.locator('.motion-lightbox video').getAttribute('src'));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.motion-lightbox').getAttribute('aria-hidden'),'true');
    await page.goto(`${preview.origin}/content?tab=personal`,{waitUntil:'load'});
    assert.equal(await page.locator('.personal-tutorial-card').count(),6);
    assert.equal(await page.locator('.personal-tutorial-card .personal-vlog-link').count(),0);
    assert.equal(await page.locator('.site-copyright').count(),1);
    await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
    assert.ok(await page.evaluate(()=>scrollY>0),'personal page must scroll without waiting for images');
    console.log(`PASS ${width}px image lightboxes, Escape, deferred motion/player, personal scrolling/footer`);
    // Actual cover clicks, project previous/next links and footer anchors.
    await page.goto(`${preview.origin}/content`,{waitUntil:'load'});
    const projects=await page.locator('.gallery-card[href]').evaluateAll(cards=>cards.map(card=>({id:card.id,href:card.getAttribute('href')})));
    assert.equal(projects.length,11);
    for(const project of projects){
      await page.locator(`#${project.id}.gallery-card`).click();
      await page.waitForURL(url=>url.pathname===new URL(project.href,preview.origin+'/content').pathname.replace(/\.html$/,''));
      await page.locator('.detail-overview').waitFor();
      const next=page.locator('.project-pagination-link[rel="next"]');
      if(await next.count()){
        const target=new URL(await next.getAttribute('href'),page.url()).pathname.replace(/\.html$/,'');
        await next.click();await page.waitForURL(url=>url.pathname===target);await page.goBack({waitUntil:'load'});
      }
      await page.locator('.detail-overview-back').click();
      await page.waitForURL(url=>url.pathname==='/content'&&url.hash==='#'+project.id);
    }
    await page.goto(`${preview.origin}/sports`,{waitUntil:'load'});
    await page.locator('.site-footer-nav a').filter({hasText:'Contact me'}).click();
    await page.waitForURL(url=>url.pathname==='/'&&url.hash==='#connect');
    await page.waitForTimeout(120);
    assert.ok(await page.locator('#connect').evaluate(element=>element.getBoundingClientRect().top<innerHeight),'footer contact target');
    assert.equal(errors.length,0,errors.join('\n'));
    console.log(`PASS ${width}px all project covers, pagination, return links, footer anchor; no JS/resource errors`);
    for(const contact of ['wechat','email','phone']){
      const trigger=page.locator(`.contact-trigger[data-contact="${contact}"]`);
      if(!await trigger.count())continue;
      await trigger.click();
      assert.equal(await page.locator('#contact-dialog').getAttribute('aria-hidden'),'false');
      assert.equal(await page.locator('.contact-dialog-value').textContent(),await trigger.getAttribute('data-contact-value'));
      await page.locator('.contact-dialog-close').click();
      assert.equal(await page.locator('#contact-dialog').getAttribute('aria-hidden'),'true');
    }
    await page.goto(preview.origin+'/',{waitUntil:'load'});
    await page.waitForFunction(()=>!document.documentElement.classList.contains('home-booting'));
    await page.locator('.nav-download-trigger').click();
    assert.equal(await page.locator('.nav-download-menu').getAttribute('aria-hidden'),'false');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.nav-download-menu').getAttribute('aria-hidden'),'true');
    if(width===390){
      await page.locator('#mobile-nav-trigger').click();
      assert.equal(await page.locator('#mobile-navigation').getAttribute('aria-hidden'),'false');
      await page.locator('.mobile-navigation-close').click();
      assert.equal(await page.locator('#mobile-navigation').getAttribute('aria-hidden'),'true');
    }
    assert.equal(errors.length,0,errors.join('\n'));
    console.log(`PASS ${width}px home contacts, download menu and mobile menu`);
    await context.close();
  }
}finally{await browser.close();await preview.close();}
