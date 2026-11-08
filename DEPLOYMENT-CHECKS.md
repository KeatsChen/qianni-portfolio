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

Project covers and pagination use native anchors and share the same clean project URLs. Loading feedback never prevents navigation or captures input. After 500ms, Home and Work List show the nine-dot transition; after 24 seconds it becomes a compact status. On detail pages, the status is compact from the start so existing controls stay visible during a pending project switch. CSS clears both variants even without JavaScript callbacks, and a restored page clears stale status. On arrival, only the startup shell uses a full-screen loader with a native return link. Once page scripts initialize, controls appear independently of pending fonts and artwork; the content still animates in. `scripts/check-detail-loading.mjs` tests real control clicks with the first artwork request held open, and the navigation tests cover a 16-second response and browser Back.
