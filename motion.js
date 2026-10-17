const motionVideos = [...document.querySelectorAll('.video-frame video')];

const setVideoPlayback = (video, shouldPlay) => {
  if (shouldPlay) {
    video.play().catch(() => {});
  } else {
    video.pause();
  }
};

if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('video');
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
      setVideoPlayback(video, entry.isIntersecting && entry.intersectionRatio >= 0.35);
    });
  }, { threshold: [0, .35, .65], rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.video-frame').forEach((frame, index) => {
    frame.style.transitionDelay = `${(index % 4) * 60}ms`;
    videoObserver.observe(frame);
  });
} else {
  document.querySelectorAll('.video-frame').forEach((frame, index) => {
    frame.classList.add('is-visible');
    setVideoPlayback(motionVideos[index], index === 0);
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) motionVideos.forEach((video) => video.pause());
});
