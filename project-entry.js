/* Shared loading feedback for native project links, from any source page.
 * This observes navigation; it never cancels, delays, fetches or replaces it. */
(() => {
  const projects = new Set(['project1','okr','chatbot','research','cozyup','materials','sports','bim','food','sustainability','community']);
  let loading;
  const hide = () => {
    loading?.classList.remove('is-active');
    loading?.setAttribute('aria-hidden','true');
  };
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const target = new URL(link.href, location.href);
    const name = target.pathname.replace(/\/$/,'').split('/').pop().replace(/\.html$/,'');
    if (target.origin !== location.origin || !projects.has(name)) return;
    if (target.pathname === location.pathname && target.search === location.search && target.hash) return;
    if (!loading) {
      loading = document.createElement('div');
      loading.className = 'project-entry-loading';
      loading.setAttribute('role','status');
      loading.setAttribute('aria-live','polite');
      loading.setAttribute('aria-hidden','true');
      loading.innerHTML = '<span class="project-entry-grid" aria-hidden="true">'+Array.from({length:9},(_,i)=>`<i style="--dot-delay:${((i%3)+Math.floor(i/3))*.2}s"></i>`).join('')+'</span><span class="project-entry-status"></span>';
      loading.addEventListener('animationend', event => {
        if (event.target === loading) hide();
      });
      document.body.append(loading);
    }
    hide();
    // Restart the CSS-only indicator without depending on animation callbacks.
    void loading.offsetWidth;
    loading.querySelector('.project-entry-status').textContent = document.documentElement.lang.startsWith('zh') ? '正在打开项目' : 'Opening project';
    loading.setAttribute('aria-hidden','false');
    loading.classList.add('is-active');
    // Intentionally no preventDefault, requestAnimationFrame or location.assign.
  });
  window.addEventListener('pagehide',hide);
  window.addEventListener('pageshow',hide);
})();
