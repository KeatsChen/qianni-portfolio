// Keep original files/pixels. Reserve layout and defer offscreen network requests.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dimensions = bytes => {
  if (bytes.subarray(1, 4).toString() === 'PNG') return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  for (let offset = 2; offset + 9 < bytes.length;) {
    if (bytes[offset++] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(offset);
    if (length < 2) break;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) return [bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3)];
    offset += length;
  }
  return null;
};
export function prepareProgressiveMedia(page) {
  // Sources inside picture must stay deferred too; otherwise they download first.
  const defer = original => original.replace(/<img\b[^>]*>/g, tag => {
    const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (!src || tag.includes('data-media-src=') || !tag.includes('loading="lazy"')) return tag;
    const file = path.join(root, src.split('?')[0]);
    if (!src.startsWith('assets/') || !fs.existsSync(file)) return tag;
    if (!src.startsWith('assets/case-studies/') && fs.statSync(file).size < 32768) return tag;
    let image = tag.replace(/\bsrc=/, 'data-media-src=').replace(/\bsrcset=/, 'data-media-srcset=');
    if (!/\bwidth=/.test(image) && !/\.svg(?:\?|$)/.test(src)) {
      const size = dimensions(fs.readFileSync(file));
      if (size) image = image.replace('<img', `<img width="${size[0]}" height="${size[1]}"`);
    }
    return image + '<noscript>' + tag + '</noscript>';
  });
  page = page.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/g, picture => {
    if (picture.includes('data-media-src=')) return picture;
    const changed = defer(picture);
    if (changed === picture) return picture;
    // The noscript img is enough for non-JS fallback; preserve its original src.
    return changed.replace(/<source\b[^>]*>/g, source => source.replace(/\bsrcset=/, 'data-media-srcset='));
  });
  // Exclude existing noscript blocks from repeated runs.
  page = page.split(/(<noscript>[\s\S]*?<\/noscript>)/g).map(part => part.startsWith('<noscript>') ? part : defer(part)).join('');
  const version = createHash('sha256').update(fs.readFileSync(path.join(root, 'progressive-media.js'))).digest('hex').slice(0, 10);
  if (!page.includes('src="progressive-media.js')) page = page.replace('</head>', `  <script defer src="progressive-media.js?v=${version}"></script>\n</head>`);
  else page = page.replace(/progressive-media\.js\?v=[^" ]+/g, `progressive-media.js?v=${version}`);
  return page;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // --write performs only the repeatable, mechanical attribute transformation.
  let patch = '*** Begin Patch\n';
  for (const name of ['project1','okr','chatbot','research','cozyup','materials','sports','bim','food','sustainability','community']) {
    const file = path.join(root, name + '.html');
    const old = fs.readFileSync(file, 'utf8'), next = prepareProgressiveMedia(old);
    if (old === next) continue;
    if (process.argv.includes('--write')) { fs.writeFileSync(file, next); continue; }
    patch += `*** Update File: ${file}\n`;
    const a = old.split('\n'), b = next.split('\n');
    // Include whole file to support the extra head line and generated fragments.
    patch += '@@\n' + a.map(line => '-' + line).join('\n') + '\n' + b.map(line => '+' + line).join('\n') + '\n';
  }
  if (!process.argv.includes('--write')) process.stdout.write(patch + '*** End Patch');
}
