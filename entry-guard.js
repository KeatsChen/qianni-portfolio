const homeEntryKey = 'qianni-home-entered';
const entrySource = new URLSearchParams(window.location.search).get('from');
const isExplicitNavigation = entrySource === 'nav';

if (!isExplicitNavigation && sessionStorage.getItem(homeEntryKey) !== '1') {
  window.location.replace('index.html?first=1');
}
