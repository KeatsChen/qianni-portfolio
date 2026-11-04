# Loading-only optimization — 2026-11-05

Rollback baseline: Git commit `4f72988f2fe2` (the worktree was clean before changes).
Full source/archive backup: `/Users/zhongqianni/Desktop/qianni-portfolio-before-loading-20261105.tar`.
No commit, push, deployment, image compression or original-asset replacement was performed.

## Changes

- Original detail images load within 500px of the viewport instead of the browser's much larger native lazy-load distance. Image dimensions reserve the existing layout. Non-JavaScript image fallback is retained.
- Motion videos receive their source only when visible; leaving the tab releases video requests. Playback and the full-size player are retained.
- Home becomes visible at DOM ready, without waiting for unrelated images and all fonts. Initial top positioning and the existing entrance remain.
- Native case-study English text fitting measures nearby sections only, and ignores resize callbacks when gallery width did not change.
- Shared resource hashes and navigation entry versions are updated together. The native case-study builder preserves progressive loading on rebuild.

## Local comparison

New browser context, Chrome, mobile 390px viewport, reduced motion, no scrolling, sampled one second after DOM ready. Numbers are the total local file sizes of **requested** assets, not measured internet bytes or online timings; range-based video transfers can be smaller.

| Page | Before | After |
| --- | ---: | ---: |
| Virtual companion | 47,218,743 bytes | 203,954 bytes |
| OKR | 23,686,789 bytes | 2,946,293 bytes |
| Motion tab | 51,554,016 bytes | 6,134,739 bytes |

Home and Work List already request comparatively small first-screen assets and were not image-compressed. Total full-page original image size is unchanged.

## Verification

- Existing 11 detail headers and page/gallery bounds compared with baseline at 1440px and 390px: unchanged.
- Original asset files are untouched.
- Scroll-loading, media playback, language/navigation interactions and delayed-resource home visibility are checked locally before handoff.
- Online improvement must be measured after the user publishes the changed files, including the new `progressive-media.js`.

To revert, restore the changed files from the baseline/archive as a new reversible change; do not reset unrelated later work. Keep the baseline archive until the optimized version is approved.
