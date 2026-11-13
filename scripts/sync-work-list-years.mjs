// Generate desktop directory years from the static Date facts in project details.
// Run after changing a project date; --check detects stale years without writing.
import { readFileSync, writeFileSync } from 'node:fs';

const listURL = new URL('../content.html', import.meta.url);
const original = readFileSync(listURL, 'utf8');
const gallery = /(<section class="project-gallery"[^>]*>)([\s\S]*?)(<\/section>)/;
const cards = /<a class="gallery-card\b[^"]*"[^>]*\bid="([^"]+)"[^>]*\bhref="([a-z0-9]+)(?:\?[^"]*)?"/g;
const rows = /(<a class="project-row\b[^"]*" href="#([^"]+)">)(<time(?: class="project-desktop-year" datetime="\d{4}")?>\d{4}<\/time>)(<time class="project-existing-mobile-year">\d{4}<\/time>)?/g;
const pages = new Map([...original.match(gallery)?.[2].matchAll(cards) ?? []].map(([, id, page]) => [id, page]));
let count = 0;
const updated = original.replace(rows, (_, anchor, id, previous, mobile) => {
    const page = pages.get(id);
    if (!page) throw new Error(`Missing project detail link for #${id}`);
    const detail = readFileSync(new URL(`../${page}.html`, import.meta.url), 'utf8');
    const date = detail.match(/<dt\b[^>]*\bdata-en="Date"[^>]*>[^<]*<\/dt>\s*<dd\b[^>]*>([^<]+)<\/dd>/)?.[1];
    const years = date?.match(/\b(?:19|20)\d{2}\b/g);
    if (!years?.length) throw new Error(`Missing Date year in ${page}.html`);
    const year = Math.max(...years.map(Number));
    count++;
    const oldYear = (mobile ?? previous).match(/>(\d{4})</)[1];
    return anchor + `<time class="project-desktop-year" datetime="${year}">${year}</time>` +
      `<time class="project-existing-mobile-year">${oldYear}</time>`;
});
if (count !== 11 || count !== pages.size) throw new Error(`Expected 11 paired directory rows; found ${count}`);
if (process.argv.includes('--check')) {
  if (updated !== original) throw new Error('Stale Work List years: run scripts/sync-work-list-years.mjs');
} else if (updated !== original) {
  writeFileSync(listURL, updated);
}
