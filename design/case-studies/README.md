# Native case studies

`chatbot.html` and `okr.html` contain static HTML reconstructed from Figma
frames `5103:3442` (2-4) and `5103:4201` (2-5). The former full-section PNGs
are not used by these two pages. Paragraphs, diagrams, cards and color blocks
are DOM elements. Only the design's actual photographs, mockups, reference
screenshots and vector artwork use image assets.

## Editing and rebuilding

- The two JSON snapshots retain the design's per-section layers and asset
  references. They are build inputs, not browser dependencies.
- `translations.json` pairs the original Chinese strings with English.
  Update both languages together; do not change the meaning of the source.
- `text-boxes.json` records the original text-frame dimensions. English fits
  within those frames; changing languages does not move the illustrations.
- Generate the static page bodies with Node.js, without additional packages:

  ```sh
  node scripts/build-native-case-studies.mjs
  ```

- The normal static hosting deployment does not need to run this command.
  Commit the generated HTML, CSS, JavaScript and local assets together.
- Keep `native-case-studies.css` and `native-case-studies.js` with the pages.
  The script handles proportional layout, language fitting and scroll reveals.
  Reduced-motion settings disable the reveals.

Complex, overlapping presentation layouts retain the original 1084 × 650.4
coordinate system inside responsive section wrappers. The shared project
overview above them uses normal responsive layout.

The UI shown inside each case study is illustrative project documentation,
not a new working OKR or chatbot application. No unimplemented search,
approval, scoring or messaging behavior is implied.

`assets.json` inventories local design assets. Do not add expiring Figma URLs
to the deployed HTML or to these saved snapshots. Poetsen One and Roboto are
locally hosted with their OFL license files in `assets/fonts/`.

OKR uses separate font aliases for the exact MiSans Normal/Regular/Medium/
Demibold/Semibold variants, YouShe title face and the static Roboto Medium
used in the design. Their WOFF2 subsets are generated from the designer's
installed fonts by `scripts/subset-okr-fonts.py` (build-time FontTools/Brotli
only). Regenerate the subsets when adding characters to the case-study copy.
Font metadata and copyright names are preserved. DIN Pro is referenced as a
local font only; a distributable Web font license is needed before bundling it.
