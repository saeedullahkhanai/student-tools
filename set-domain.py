"""Replace the placeholder domain everywhere (canonical, og:url, JSON-LD, sitemap, robots).
Usage:  python set-domain.py https://yourdomain.com
Run it once, from this folder, when you know your real domain."""
import pathlib, re, sys

root = pathlib.Path(__file__).parent
if len(sys.argv) != 2 or not sys.argv[1].startswith('https://'):
    sys.exit('Usage: python set-domain.py https://yourdomain.com')
new = sys.argv[1].rstrip('/')
old = re.search(r'<loc>(https?://[^/<]+)', (root / 'sitemap.xml').read_text(encoding='utf-8')).group(1)
changed = 0
for f in root.rglob('*'):
    if f.is_file() and f.suffix in ('.html', '.xml', '.txt'):
        text = f.read_text(encoding='utf-8')
        if old in text:
            f.write_text(text.replace(old, new), encoding='utf-8')
            changed += 1
print(f'Replaced {old} with {new} in {changed} files.')
