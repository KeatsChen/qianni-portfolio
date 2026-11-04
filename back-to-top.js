if (!document.querySelector('.site-copyright')) {
  const footer = document.createElement('footer');
  footer.className = 'site-copyright site-copyright--motion';
  footer.innerHTML = `
    <p>© 2026 Designed by Qianni Zhong. All Rights Reserved.</p>
    <nav class="site-footer-nav" aria-label="Footer navigation">
      <a href="index.html?v=20261105-site-audit-3#engagements" data-en="Recent engagements" data-zh="近期经历">Recent engagements</a>
      <span aria-hidden="true"></span>
      <a href="content.html?v=20261105-site-audit-3" data-en="My Works" data-zh="我的作品">My Works</a>
      <span aria-hidden="true"></span>
      <a href="index.html?v=20261105-site-audit-3#connect" data-en="Contact me" data-zh="联系我">Contact me</a>
    </nav>`;
  document.body.append(footer);
  const language=document.documentElement.lang.startsWith('zh')?'zh':'en';
  footer.querySelectorAll('[data-en][data-zh]').forEach(link=>{link.textContent=link.dataset[language];});
}

// Home captures its translatable nodes before the shared footer is appended.
// Keep the late-mounted footer synchronized with the page language as well.
const syncFooterLanguage=()=>{
  const language=document.documentElement.lang.startsWith('zh')?'zh':'en';
  document.querySelectorAll('.site-footer-nav [data-en][data-zh]').forEach(link=>{link.textContent=link.dataset[language];});
};
syncFooterLanguage();
new MutationObserver(syncFooterLanguage).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

document.querySelectorAll('.back-to-top').forEach((button) => {
  const updateVisibility = () => {
    button.classList.toggle('is-visible', window.scrollY > Math.max(420, window.innerHeight * .55));
  };

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  });

  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('resize', updateVisibility, { passive: true });
  updateVisibility();
});
