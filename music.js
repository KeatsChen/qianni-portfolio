// Background music and its audio file were removed from the design.
// Retain this compatibility entry without restoring stale controls or 404s.
// Navigation between pages stays native HTML.
document.querySelectorAll('.music-note,.music-player').forEach(element=>element.remove());
try { sessionStorage.removeItem('qianni-portfolio-music'); } catch (_) {}
