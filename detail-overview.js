/* Adapt existing project data without inventing missing roles or challenges.
 * Add fields as additional dl blocks; grid gaps remain independent of count. */
(() => {
  const old = document.querySelector('.arch-overview, .project-info, .case-heading');
  if (!old) return;
  const heading = old.querySelector('h1');
  const back = old.querySelector('a');
  if (!heading || !back) return;
  // Cloudflare Pages canonicalizes /okr.html to /okr. Page identity must
  // survive both URLs (and be available before deferred media/layout work).
  const isChatbot = document.body.classList.contains('chatbot-detail-page') || /\/chatbot(?:\.html)?\/?$/.test(location.pathname);
  const isOkr = document.body.classList.contains('okr-detail-page') || /\/okr(?:\.html)?\/?$/.test(location.pathname);
  const isResearch = document.body.classList.contains('research-page');
  const isCompanion = document.body.classList.contains('cozyup-page');
  const isMaterials = document.body.classList.contains('materials-page');
  const hasEditorialContributions = isResearch || isCompanion || isMaterials;
  const isArchitecture = old.matches('.arch-overview');
  const isEditorial = old.matches('.case-heading');
  const overview = document.createElement('header');
  overview.className = 'detail-overview';
  const title = document.createElement('div');
  title.className = 'detail-overview-title';
  const link = document.createElement('a');
  link.className = 'detail-overview-back';
  link.href = back.href;
  link.setAttribute('aria-label', 'Back to projects');
  link.innerHTML = '<img src="assets/project1/back-arrow.svg" alt="" />';
  title.append(link, heading.cloneNode(true));
  const fields = document.createElement('div');
  fields.className = 'detail-overview-fields';
  const facts = document.createElement('div');
  facts.className = 'detail-overview-facts';
  const field = (zh, en, content) => {
    const dl = document.createElement('dl');
    dl.className = 'detail-overview-field';
    const dt = document.createElement('dt');
    dt.dataset.zh = zh; dt.dataset.en = en; dt.textContent = en;
    const dd = document.createElement('dd');
    dd.append(content);
    dl.append(dt, dd);
    return dl;
  };
  const fact = (source) => {
    if (hasEditorialContributions && source.querySelector('dt')?.dataset.en === 'Design Tools') {
      // Match the preceding project's tool row without discarding any facts
      // or inventing roles/responsibilities not provided for this project.
      const tools = document.createElement('div');
      tools.className = 'detail-overview-tools';
      tools.innerHTML = '<img src="assets/architecture-v2/figma.png" alt="Figma" /><img src="assets/architecture-v2/photoshop.png" alt="Adobe Photoshop" />';
      facts.prepend(tools);
      return;
    }
    const dl = document.createElement('dl');
    for (const node of source.children) dl.append(node.cloneNode(true));
    facts.append(dl);
  };
  if (isArchitecture) {
    const role = old.querySelector('.arch-role > dl');
    const roleValue = document.createElement('span');
    Object.assign(roleValue.dataset, role.querySelector('dd').dataset);
    roleValue.textContent = role.querySelector('dd').textContent;
    fields.append(field('角色','Role', roleValue));
    const responsibilities = old.querySelector('.arch-responsibilities ul');
    fields.append(field('职责','Responsibilities', responsibilities.cloneNode(true)));
    const tools = old.querySelector('.arch-tools');
    if (tools) {
      const group = tools.cloneNode(true); group.className = 'detail-overview-tools';
      facts.append(group);
    }
    old.querySelectorAll('.arch-facts dl').forEach(fact);
  } else if (isChatbot || isOkr) {
    const role = document.createElement('span');
    role.dataset.zh = '原型设计、交互设计、视觉设计';
    role.dataset.en = 'Prototyping · Interaction Design · Visual Design';
    if (isChatbot) {
      role.dataset.zh += '、IP形象设计';
      role.dataset.en += ' · Character Design';
    } else {
      role.dataset.zh = '交互设计、视觉设计';
      role.dataset.en = 'Interaction Design · Visual Design';
    }
    role.textContent = role.dataset.en;
    fields.append(field('角色','Role',role));
    const list = document.createElement('ul');
    const responsibilities = isChatbot ? [
      ['产品原型设计：基于产品需求，梳理核心功能与用户流程，完成产品原型设计；','Product Prototyping: Mapped out core features and user flows based on product requirements, and created product prototypes.'],
      ['交互与视觉设计：负责 App 的交互体验与视觉界面设计，构建统一的视觉语言，提升产品的易用性与体验一致性。','Interaction & Visual Design: Designed the App’s interactions and visual interfaces, establishing a consistent visual language to improve usability and consistency across the product experience.'],
      ['情感化设计：将情感化设计理念融入产品体验，设计具有亲和力与情感表达力的品牌 IP 形象，增强产品的情感连接与辨识度。','Emotional Design: Incorporated emotional design into the product experience and created an approachable, expressive brand character to strengthen emotional connection and brand recognition.']
    ] : [
      ['设计研究与分析：基于产品需求与业务场景，开展竞品分析、用户调研、信息架构梳理及用户流程分析，为设计方案提供依据。','Design Research & Analysis: Conducted competitor analysis, user research, information architecture planning and user flow analysis based on product requirements and business scenarios to inform design decisions.'],
      ['多端设计：负责 OKR 产品 Web 端与 App 端的UI/UX设计，结合业务特点与用户使用场景，输出兼顾易用性、视觉品质与跨端一致性的界面设计方案。','Cross-platform Design: Designed the UI/UX for the OKR product’s Web and App versions, balancing usability, visual quality and cross-platform consistency around business needs and usage scenarios.'],
      ['设计规范与组件库建设：从零搭建产品视觉设计规范与组件库，统一色彩、字体、间距及组件样式，提升设计一致性与复用效率。','Design Guidelines & Component Library: Built visual design guidelines and a component library from scratch, standardizing colors, typography, spacing and component styles to improve consistency and reuse.'],
      ['体验验证与迭代优化：参与可用性测试及用户反馈分析，结合产品需求与业务反馈持续优化设计方案，改善产品使用体验。','Experience Validation & Iteration: Participated in usability testing and user feedback analysis, refining designs based on product requirements and business feedback to improve the user experience.'],
      ['设计落地与质量把控：跟进设计方案的开发实现，通过设计走查与视觉还原度校验，协同开发团队解决落地问题，确保设计方案的准确实现。','Design Implementation & Quality Assurance: Followed designs through development, reviewed implementation and checked visual fidelity, working with developers to resolve issues and ensure accurate delivery.']
    ];
    responsibilities.forEach(([zh,en]) => { const li=document.createElement('li'); li.dataset.zh=zh; li.dataset.en=en; li.textContent=en; list.append(li); });
    fields.append(field('职责','Responsibilities',list));
    const tools=document.createElement('div'); tools.className='detail-overview-tools';
    tools.innerHTML='<img src="assets/architecture-v2/figma.png" alt="Figma" /><img src="assets/architecture-v2/photoshop.png" alt="Photoshop" />';
    facts.append(tools);
    const date = isOkr ? '2021-2022' : '2025';
    for (const [zh,en,zhValue,enValue] of [['时间','Date',date,date],['终端','Devices',isOkr?'手机&Web':'手机',isOkr?'Mobile & Web':'Mobile'],['地区','Location',isOkr?'上海':'加州',isOkr?'Shanghai':'California']]) {
      const dl=document.createElement('dl');
      const dt=document.createElement('dt');dt.dataset.zh=zh;dt.dataset.en=en;dt.textContent=en;
      const dd=document.createElement('dd');dd.dataset.zh=zhValue;dd.dataset.en=enValue;dd.textContent=enValue;
      dl.append(dt,dd);facts.append(dl);
    }
    title.querySelector('h1').dataset.zh=isOkr ? 'OKR系统设计' : 'AI聊天机器人';
    title.querySelector('h1').dataset.en=isOkr ? 'OKR System Design' : 'AI Mental Health Chatbot App';
    title.querySelector('h1').textContent=title.querySelector('h1').dataset.en;
    document.body.classList.add(isOkr ? 'okr-detail-page' : 'chatbot-detail-page');
  } else {
    old.querySelectorAll('.project-meta > div, .heading-meta > div').forEach(fact);
    if (isEditorial) {
      const section=old.closest('.case-overview');
      if (hasEditorialContributions) {
        const role=document.createElement('span');
        role.dataset.zh='产品经理、交互设计、视觉设计';
        role.dataset.en='Product Manager · Interaction Designer · Visual Designer';
        role.textContent=role.dataset.en;
        fields.append(field('角色','Role',role));
        const responsibilities=isResearch ? [
          ['与项目负责人沟通，梳理机构介绍、研究内容和活动信息等展示需求，明确网站目标与整体设计方向。','Worked with the project lead to clarify how the institute, its research and events should be presented, and define the website’s goals and overall design direction.'],
          ['规划网站的信息架构、页面布局与原型，理清栏目层级和页面间的访问路径，让学术内容更便于浏览和查找。','Planned the information architecture, page layouts and prototypes, clarifying the content hierarchy and navigation paths to make academic content easier to browse and find.'],
          ['负责网站的交互与视觉设计，统一字体、色彩、组件及交互状态，在保持学术气质的同时兼顾阅读体验与多端一致性。','Designed the website’s interactions and visual interfaces, defining typography, colors, components and interaction states to balance an academic character with readability and consistency across devices.']
        ] : isCompanion ? [
          ['与项目负责人沟通，梳理虚拟陪伴平台的功能需求、用户使用场景与关键流程，明确产品目标及整体设计方向。','Worked with the project lead to clarify the virtual companion platform’s requirements, user scenarios and key flows, defining the product goals and overall design direction.'],
          ['规划平台的信息架构、页面布局与原型，理清角色浏览、创建与聊天等核心功能的操作路径。','Planned the platform’s information architecture, page layouts and prototypes, mapping out the core flows for browsing characters, creating a character and chatting.'],
          ['负责平台的交互体验与视觉设计，统一字体、色彩、组件及交互状态，兼顾沉浸感、易用性与界面一致性。','Designed the platform’s interactions and visual interfaces, defining typography, colors, components and interaction states to balance immersion, usability and visual consistency.']
        ] : [
          ['与项目负责人沟通，梳理建材供应商与采购方的使用需求，明确 App 的功能范围、核心流程及整体设计方向。','Worked with the project lead to understand the needs of building material suppliers and buyers, defining the App’s scope, core flows and overall design direction.'],
          ['规划 App 的信息架构、页面布局与原型，理清商品浏览、采购需求发布和供应商联系等核心功能的操作路径。','Planned the App’s information architecture, page layouts and prototypes, mapping out the core flows for browsing products, posting purchase requests and contacting suppliers.'],
          ['负责 App 的交互体验与视觉设计，统一字体、色彩、组件及交互状态，兼顾移动端的阅读体验、操作效率与界面一致性。','Designed the App’s interactions and visual interfaces, defining typography, colors, components and interaction states with attention to mobile readability, efficient use and visual consistency.']
        ];
        const list=document.createElement('ul');
        responsibilities.forEach(([zh,en])=>{
          const li=document.createElement('li');
          li.dataset.zh=zh;li.dataset.en=en;li.textContent=en;list.append(li);
        });
        fields.append(field('职责','Responsibilities',list));
      }
      const statement=section.querySelector('.case-statement');
      if (statement && !hasEditorialContributions) {
        const copy=statement.cloneNode(true); copy.removeAttribute('class');
        fields.append(field('项目概述','Project Overview',copy));
      }
      section.querySelectorAll('.case-facts > div').forEach(fact);
    }
  }
  // The final five case studies use the same tools and metadata placement.
  if (/\/(sports|bim|food|sustainability|community)(?:\.html)?\/?$/.test(location.pathname)) {
    const tools = document.createElement('div');
    tools.className = 'detail-overview-tools';
    tools.innerHTML = '<img src="assets/architecture-v2/figma.png" alt="Figma" /><img src="assets/architecture-v2/photoshop.png" alt="Adobe Photoshop" />';
    facts.prepend(tools);
    overview.classList.add('has-standard-tools');
  }
  overview.append(title,fields,facts);
  // Mobile board app/work detail: tools and metadata on the left, editable
  // responsibilities on the right. Move the same role node, never copy data.
  const roleField=[...fields.children].find(dl=>dl.querySelector('dt')?.dataset.en==='Role');
  if(roleField){
    const position=document.createComment('desktop role position');
    roleField.before(position);
    const mobileHeader=matchMedia('(max-width:760px)');
    const placeRole=()=>{if(mobileHeader.matches)facts.append(roleField);else position.after(roleField);};
    placeRole();mobileHeader.addEventListener('change',placeRole);
  }
  overview.classList.toggle('has-fields', fields.childElementCount > 0);
  document.body.classList.add('has-unified-overview');
  if (isArchitecture) {
    const hero = old.querySelector('.arch-hero');
    old.replaceWith(overview,hero);
  }
  else if (!isEditorial) {
    const sidebar=old.closest('.project-sidebar');
    sidebar.before(overview);
    sidebar.remove();
  } else {
    // Keep the original page artwork and its internal geometry intact. Only
    // remove the space formerly occupied by the obsolete information block.
    const section=old.closest('.case-overview');
    section.before(overview);
    section.querySelectorAll('.case-heading,.case-statement,.case-facts,.mobile-overview-meta').forEach(e=>e.remove());
    const inner=document.createElement('div');inner.className='case-overview-inner';
    while(section.firstChild) inner.append(section.firstChild);
    section.append(inner);
    let queued=false;
    const align=()=>{
      queued=false;
      section.style.height='';inner.style.top='';inner.style.height='';
      const sectionBox=section.getBoundingClientRect();
      const media=inner.querySelector('.desktop-pair,.hero-phones,.landing-page');
      if (!media) return;
      const scale=Number(section.closest('.scaled-detail-body')?.dataset.detailScale)||1;
      const height=sectionBox.height/scale;
      // The first picture may still be translated by its entrance animation;
      // measure its resting position so that the final gap does not shrink.
      const transform=getComputedStyle(media).transform;
      const animatedY=transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
      const trim=Math.max(0,(media.getBoundingClientRect().top-sectionBox.top)/scale-animatedY);
      inner.style.height=height+'px';inner.style.top=-trim+'px';
      section.style.height=Math.max(0,height-trim)+'px';
    };
    const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(align);}};
    align();window.addEventListener('resize',schedule,{passive:true});
    document.fonts.ready.then(schedule);
  }
})();
