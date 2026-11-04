# Portfolio delivery checks

- This site deploys to Cloudflare Pages. `.html` links are redirected to extensionless URLs. Never infer page identity solely with `endsWith('.html')`; declare essential page classes in HTML and support clean URLs.
- Use the Cloudflare-style preview (`node scripts/cloudflare-preview.mjs --port 4175`) for user-facing previews, not only a generic static server.
- Before handing off website changes, run `scripts/check-site.mjs` with the available Playwright runtime and fix failures. It covers every root HTML page, all Work List tabs, desktop/mobile, direct entry/refresh, language, browser history, headers/footers, project pagination, media and local asset failures.
- Also retain the dedicated `scripts/check-deployment-paths.mjs` regression for detail identity and typography. Do not claim production is verified if online access was unavailable: distinguish local deployment simulation from real CDN testing.
- Update local CSS/JS content hashes and all relevant navigation entry versions together. Check `git diff --check`. Do not commit or push without the user's request.
- Preserve design and original detail image quality. Do not turn editable headings/metadata into screenshots to hide layout bugs.
