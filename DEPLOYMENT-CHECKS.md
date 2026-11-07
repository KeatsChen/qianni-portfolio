# Deployment regression — 2026-11-05

## Scope

All 18 root HTML pages (including older standalone creative/personal/more pages), all five Work List tabs, all 11 project covers and project-switch controls. Desktop 1440px and mobile 390px. Chinese and English controls are checked on pages that provide them.

## Fixes

- OKR and Chatbot declare page identity in HTML; their adapters accept both `.html` and extensionless URLs. This restores the dedicated metadata, typography and diagram layout on Pages clean URLs.
- Removed background-music restoration and the request for a deleted audio file, consistent with the earlier removal of this feature.
- Shared footer links no longer use the old `v=127` entry. Late-mounted home footer links now follow the selected language.
- The download menu now closes on Escape while focus remains on its trigger, not only after focus moves inside the menu.
- Cache revalidation coverage includes the older standalone pages too. Shared script hashes and entry-link versions are synchronized.

## Repeatable checks

`scripts/check-site.mjs` starts an isolated local HTTP server with Pages-style `.html` redirects, then checks static asset existence, JS errors/HTTP failures, direct access, refresh, language, return-to-top, tab URL/history, project navigation, footer anchors, image/video players, personal-page scrolling, and home menus/contact popups.

Set `PLAYWRIGHT_MODULE` to the installed Playwright module and `BROWSER_PATH` to Chrome if needed; then run `node scripts/check-site.mjs`. No frontend runtime dependency is added.

The narrower `scripts/check-deployment-paths.mjs` also compares clean and `.html` detail-page headers and key OKR typography/layout.

Use `node scripts/cloudflare-preview.mjs --port 4175` for a deployment-style manual preview. It preserves query strings and anchors while canonicalizing `.html` URLs. This simulates static routing, **not** the live CDN, account-level redirects, cache rules or remote browser conditions.

Repository `AGENTS.md` requires these checks before future deliveries. Production still requires publishing and then checking the real website; unavailable online access must never be reported as a production pass.

## Navigation stall follow-up

## Mobile detail composition

All 11 project detail pages retain a readable single-column overview on mobile. The rest of the case-study composition uses the 1440px Web layout, scaled uniformly with CSS zoom (editable DOM, not screenshots). The shared adapter evaluates component stylesheet width breakpoints at the design width and preserves motion preference rules; the original desktop sheets and header position are restored above 760px. Artwork picture sources use the Web image rather than a separate mobile crop. `scripts/check-mobile-detail-scale.mjs` checks composition ratios at 320/390/760px, horizontal overflow, single-column headers and rotation back to desktop. Floating navigation/back-to-top controls retain their mobile behavior.

The Work List intercepted cover links and waited for two animation frames and a timer before navigation. This gate is removed: project covers use native anchors, while detail-page entrance animations remain. Home covers, Work List covers and project pagination share the same clean project URLs and loading feedback. Feedback never prevents navigation or captures input. After a 500ms delay, the nine-dot loader covers the outgoing page. It stays full-screen for 24 seconds, then becomes a compact status for an unusually long stall. CSS clears it after another 36 seconds even without JavaScript callbacks. The outgoing pagehide does not clear it; pageshow resets it on browser Back. `scripts/check-navigation-stall.mjs` covers paused animation frames and a 16-second Architecture → OKR response, and `scripts/check-project-entry.mjs` verifies URL identity, all three entry sources, fast-request suppression, document handoff and CSS fail-open behavior. Production response issues still require online verification.
