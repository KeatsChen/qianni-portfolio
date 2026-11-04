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
