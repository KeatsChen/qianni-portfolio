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
    // Standard case studies supply their bilingual copy as real HTML, shared
    // by desktop and mobile rather than maintaining separate text versions.
    old.querySelectorAll('.project-contributions > dl').forEach(dl=>fields.append(dl.cloneNode(true)));
    if (isEditorial) {
      const section=old.closest('.case-overview');
      if (hasEditorialContributions) {
        const role=document.createElement('span');
        role.dataset.zh='产品经理、交互设计、视觉设计';
        role.dataset.en='Product Manager · Interaction Designer · Visual Designer';
        if(isResearch){role.dataset.zh='原型设计、交互设计、视觉设计';role.dataset.en='Prototyping · Interaction Design · Visual Design';}
        if(isCompanion){role.dataset.zh='交互设计、视觉设计';role.dataset.en='Interaction Design · Visual Design';}
        if(isMaterials){role.dataset.zh='交互设计、视觉设计';role.dataset.en='Interaction Design · Visual Design';}
        role.textContent=role.dataset.en;
        fields.append(field('角色','Role',role));
        const responsibilities=isResearch ? [
          ['视觉方向探索：结合项目需求探索网站的视觉方向，与负责人沟通并确认整体设计风格。','Visual Direction: Explored visual directions based on the project requirements and agreed on the overall design style with the project lead.'],
          ['视觉规范制定：统一字体、颜色、间距、按钮及图标样式，为页面设计建立一致的视觉规范。','Visual Guidelines: Defined consistent typography, colors, spacing, button styles and icons to guide page design.'],
          ['原型设计与确认：基于负责人提供的内容结构完成页面原型，通过沟通确认页面布局与交互方式。','Prototyping: Created page prototypes based on the content structure supplied by the project lead, and confirmed layouts and interactions through discussion.'],
          ['视觉与响应式设计：完成电脑端与手机端的视觉设计及响应式布局，兼顾不同屏幕下的内容展示与使用体验。','Visual & Responsive Design: Designed the desktop and mobile interfaces and responsive layouts, considering content presentation and usability across screen sizes.']
        ] : isCompanion ? [
          ['交互体验设计：基于已确定的产品功能与流程，设计电脑端页面的操作方式与交互反馈，重点完善聊天界面的使用体验。','Interaction Design: Designed desktop interactions and feedback based on the established product features and flows, with particular attention to the chat experience.'],
          ['整体视觉设计：负责平台全部页面的视觉设计，结合虚拟伴侣产品的定位，建立统一的界面风格。','Visual Design: Designed every page of the platform, establishing a consistent interface style suited to the virtual companion product.'],
          ['视觉规范制定：明确字体、颜色、按钮及图标的设计规范，保持不同页面与功能模块之间的视觉一致性。','Visual Guidelines: Defined typography, colors, button styles and icons to maintain visual consistency across pages and features.']
        ] : [
          ['交互优化与状态完善：基于产品提供的原型，对操作步骤、页面跳转、按钮反馈及弹窗交互提出调整建议，补充加载、空白和错误等状态，完善操作流程与反馈。','Interaction Refinement & States: Reviewed the prototypes supplied by the product team and suggested improvements to task steps, navigation, button feedback and dialogs. Added loading, empty and error states to complete the flows and feedback.'],
          ['App 视觉设计：负责供应商端 App 全部页面的视觉设计，将产品原型转化为清晰、统一的界面，兼顾内容展示与操作体验。','App Visual Design: Designed every page of the supplier-side App, translating the product prototypes into clear, consistent interfaces with attention to content presentation and usability.'],
          ['视觉规范制定：制定并统一 App 的视觉规范，为各页面及组件的设计提供一致依据。','Visual Guidelines: Established consistent visual guidelines for the App to guide the design of its pages and components.']
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
      if(isMaterials){
        const location=document.createElement('span');location.dataset.zh='菲律宾';location.dataset.en='Philippines';location.textContent='Philippines';
        facts.append(field('地区','Location',location));
      }
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
  const toggle=document.createElement('button');
  toggle.type='button';toggle.className='detail-overview-toggle';
  fields.id='detail-overview-contributions';facts.id='detail-overview-metadata';
  toggle.setAttribute('aria-controls',`${fields.id} ${facts.id}`);
  const label=document.createElement('span');
  const arrow=document.createElement('img');arrow.src='assets/case-studies/7ff9d.svg';arrow.alt='';
  toggle.append(label,arrow);overview.append(toggle);
  const mobile=matchMedia('(max-width:760px)');let expanded=false;
  const updateDisclosure=()=>{
    overview.classList.toggle('is-expanded',expanded);
    toggle.setAttribute('aria-expanded',String(!mobile.matches||expanded));
    label.dataset.en=expanded?'Show less':'Show more';label.dataset.zh=expanded?'收起':'展开';
    label.textContent=document.documentElement.lang==='zh-CN'?label.dataset.zh:label.dataset.en;
    overview.style.setProperty('--overview-title-height',`${title.getBoundingClientRect().height}px`);
  };
  toggle.addEventListener('click',()=>{expanded=!expanded;updateDisclosure();});
  mobile.addEventListener('change',updateDisclosure);
  new ResizeObserver(updateDisclosure).observe(title);
  new MutationObserver(updateDisclosure).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  updateDisclosure();
  // Mobile board app/work detail: tools and metadata on the left, editable
  // responsibilities on the right. Move the same role node, never copy data.
  const roleField=[...fields.children].find(dl=>dl.querySelector('dt')?.dataset.en==='Role');
  if(roleField){
    const position=document.createComment('desktop role position');
    roleField.before(position);
    const mobileHeader=matchMedia('(max-width:760px)');
    const placeRole=()=>{
      if(mobileHeader.matches){
        const tools=facts.querySelector('.detail-overview-tools');
        if(tools)tools.after(roleField);else facts.prepend(roleField);
      }else position.after(roleField);
    };
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
      // These updated app boards use normal-flow content, not a trimmed Web shell.
      if ((isResearch || isCompanion || isMaterials) && matchMedia('(max-width:760px)').matches) return;
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
