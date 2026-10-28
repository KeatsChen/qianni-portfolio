const homeEntryKey = 'qianni-home-entered';
const entrySource = new URLSearchParams(window.location.search).get('from');
// A return from the work list/detail page is already a deliberate in-site
// navigation. Treat it the same as the primary nav so Safari does not first
// request Home and then replace it with a second Home request.
const isExplicitNavigation = ['nav', 'list', 'detail'].includes(entrySource);

if (!isExplicitNavigation && sessionStorage.getItem(homeEntryKey) !== '1') {
  window.location.replace('index.html?first=1');
}

// Detail pages are opened inside the already-loaded Work List iframe.
// Restore that history entry directly instead of requesting the list again.
if (window.self !== window.top && !location.pathname.endsWith('/content.html')) {
  document.addEventListener('click', (event) => {
    const backLink = event.target.closest('.back-button, .case-back');
    if (!backLink) return;
    if (window.frameElement?.classList.contains('project-detail-frame')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.stop();
      window.parent.postMessage({ type: 'close-project-detail' }, location.origin);
      return;
    }
    let cameFromWorkList = false;
    try {
      cameFromWorkList = new URL(document.referrer).pathname.endsWith('/content.html');
    } catch (_) {}
    if (!cameFromWorkList) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    // A detail page can still be fetching its large case-study images when
    // the user goes back. Cancel those requests so history traversal is not
    // held up waiting for the current document to finish loading.
    window.stop();
    history.back();
  }, true);
}
