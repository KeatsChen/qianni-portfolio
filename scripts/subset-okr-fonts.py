"""Generate WOFF2 subsets from the designer's locally installed fonts.

Build-time helper only: requires fonttools and brotli, not website dependencies.
Only characters used in the saved OKR design and bilingual copy are included.
"""
import json
from pathlib import Path
import sys
from fontTools import subset

root = Path(__file__).resolve().parent.parent
fonts = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Library/Fonts'
source = json.dumps(json.loads((root / 'design/case-studies/okr.json').read_text()), ensure_ascii=False)
source += json.dumps(json.loads((root / 'design/case-studies/translations.json').read_text()), ensure_ascii=False)
characters = set(source) | set(chr(i) for i in range(32, 127))
unicodes = ','.join(f'U+{ord(c):04X}' for c in sorted(characters))
files = [
    ('MiSans-Normal.ttf', 'okr-misans-normal.woff2'),
    ('MiSans-Regular.ttf', 'okr-misans-regular.woff2'),
    ('MiSans-Medium.ttf', 'okr-misans-medium.woff2'),
    ('MiSans-Demibold.ttf', 'okr-misans-demibold.woff2'),
    ('MiSans-Semibold.ttf', 'okr-misans-semibold.woff2'),
    ('YouSheBiaoTiYuan-2.otf', 'okr-youshe-title.woff2'),
    ('Roboto-Medium.ttf', 'okr-roboto-medium.woff2'),
]
for original, output in files:
    target = root / 'assets/fonts' / output
    subset.main([str(fonts / original), '--flavor=woff2', f'--output-file={target}',
                 f'--unicodes={unicodes}', '--layout-features=*', '--name-IDs=*',
                 '--name-languages=*', '--name-legacy'])
    print(output, target.stat().st_size)
