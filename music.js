// Audio state is shared between real HTML pages. Navigation stays native so
// the address bar, browser history, and direct links all describe the page.
const musicStateKey = 'qianni-portfolio-music';
let musicNoteButton = document.querySelector('.music-note');

if (
  !musicNoteButton &&
  !document.body.classList.contains('home-page') &&
  !document.body.classList.contains('no-music-control') &&
  !document.body.classList.contains('has-site-nav')
) {
  const standaloneStyle = document.createElement('style');
  standaloneStyle.textContent = `
    .standalone-music-note{position:fixed;z-index:2000;top:22px;left:50%;width:56px;height:56px;padding:0;border:1px solid rgba(255,255,255,.13);border-radius:50%;background:rgba(12,12,20,.72);box-shadow:0 8px 30px rgba(0,0,0,.28);backdrop-filter:blur(14px);transform:translateX(-50%);cursor:pointer}
    .standalone-music-note::before{content:"";position:absolute;left:50%;top:50%;width:19px;height:19px;background:rgba(255,255,255,.92);-webkit-mask:url("assets/music-note.svg") center/contain no-repeat;mask:url("assets/music-note.svg") center/contain no-repeat;transform:translate(-50%,-50%);transition:background-color .28s ease,filter .28s ease}
    .standalone-music-note[aria-pressed="true"]::before{background:#ffd84d;filter:drop-shadow(0 0 8px rgba(255,216,77,.72))}
    .standalone-music-note:hover{border-color:rgba(255,255,255,.3)}
    .standalone-music-note:focus-visible{outline:2px solid #fff;outline-offset:4px}
  `;
  document.head.appendChild(standaloneStyle);
  musicNoteButton = document.createElement('button');
  musicNoteButton.className = 'music-note standalone-music-note';
  musicNoteButton.type = 'button';
  musicNoteButton.setAttribute('aria-label', '播放背景音乐');
  musicNoteButton.setAttribute('aria-pressed', 'false');
  document.body.appendChild(musicNoteButton);
}
let persistentMusic = document.querySelector('.music-player');

if (!persistentMusic) {
  persistentMusic = document.createElement('audio');
  persistentMusic.className = 'music-player';
  persistentMusic.src = 'assets/navigation-music-trimmed.m4a?v=1';
  persistentMusic.preload = 'auto';
  persistentMusic.hidden = true;
  document.body.appendChild(persistentMusic);
}

function readMusicState() {
  try {
    return JSON.parse(sessionStorage.getItem(musicStateKey)) || { playing: false, time: 0, savedAt: Date.now() };
  } catch (_) {
    return { playing: false, time: 0, savedAt: Date.now() };
  }
}

function writeMusicState(playing = !persistentMusic.paused) {
  try {
    sessionStorage.setItem(musicStateKey, JSON.stringify({
      playing,
      time: persistentMusic.currentTime || 0,
      savedAt: Date.now()
    }));
  } catch (_) {}
}

function syncMusicButton(playing) {
  if (!musicNoteButton) return;
  musicNoteButton.setAttribute('aria-pressed', String(playing));
  musicNoteButton.setAttribute('aria-label', playing
    ? '停止播放背景音乐'
    : '播放背景音乐');
}

async function restoreMusic() {
  const saved = readMusicState();
  if (!saved.playing) {
    syncMusicButton(false);
    return;
  }

  const elapsed = Math.max(0, (Date.now() - saved.savedAt) / 1000);
  const resumeAt = saved.time + elapsed;
  const setPosition = () => {
    const duration = Number.isFinite(persistentMusic.duration) ? persistentMusic.duration : 0;
    persistentMusic.currentTime = duration ? resumeAt % duration : resumeAt;
  };

  if (persistentMusic.readyState >= 1) setPosition();
  else persistentMusic.addEventListener('loadedmetadata', setPosition, { once: true });

  try {
    await persistentMusic.play();
    syncMusicButton(true);
  } catch (_) {
    syncMusicButton(false);
  }
}

musicNoteButton?.addEventListener('click', async (event) => {
  event.stopPropagation();
  if (!persistentMusic.paused) {
    persistentMusic.pause();
    writeMusicState(false);
    syncMusicButton(false);
    return;
  }

  try {
    await persistentMusic.play();
    writeMusicState(true);
    syncMusicButton(true);
  } catch (_) {
    syncMusicButton(false);
  }
});

persistentMusic.addEventListener('ended', () => {
  persistentMusic.currentTime = 0;
  writeMusicState(false);
  syncMusicButton(false);
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (link && link.origin === location.origin) writeMusicState();
}, true);

window.addEventListener('pagehide', () => writeMusicState());
window.setInterval(() => {
  if (!persistentMusic.paused) writeMusicState(true);
}, 1000);

restoreMusic();
window.addEventListener('pageshow', (event) => {
  if (event.persisted) restoreMusic();
});
