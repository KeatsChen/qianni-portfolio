if (!document.querySelector('.site-copyright')) {
  const footer = document.createElement('footer');
  footer.className = 'site-copyright site-copyright--motion';
  footer.innerHTML = `
    <p>© 2026 Designed by Qianni Zhong. All Rights Reserved.</p>
    <nav class="site-footer-nav" aria-label="Footer navigation">
      <a href="index.html#engagements">Recent engagements</a>
      <span aria-hidden="true"></span>
      <a href="content.html?v=127&amp;from=nav">My Works</a>
      <span aria-hidden="true"></span>
      <a href="index.html#connect">Contact me</a>
    </nav>`;
  document.body.append(footer);
}

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
