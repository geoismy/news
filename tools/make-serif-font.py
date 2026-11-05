# 제목·편지용 명조 글꼴(public/news/fonts/geo-serif-700/900.woff2) 다시 만들기
# 제목이나 김정호 편지 글자를 바꿨을 때만 실행해요.
#
#   pip install fonttools brotli
#   npm pack @fontsource/noto-serif-kr && mkdir ns && tar xzf fontsource-noto-serif-kr-*.tgz -C ns
#   python3 tools/make-serif-font.py ns/package
#
# index.html의 <h1>과 편지(<dialog>)에 나오는 글자 + 영문·숫자·문장부호만 담아요.
import glob, html, os, re, sys, tempfile
from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont

pkg = sys.argv[1] if len(sys.argv) > 1 else "ns/package"
root = os.path.join(os.path.dirname(__file__), "..", "public", "news")
s = open(os.path.join(root, "index.html"), encoding="utf-8").read()
d = s[s.index("<dialog"):s.index("</dialog>")]
h = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S).group(1)
need = set(html.unescape(re.sub(r"<[^>]+>", " ", d + " " + h))) - set(" \n\t")
need |= set("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,!?'\"·…()-~:;/ ")

def ranges(r):
    out = []
    for part in r.split(","):
        part = part.strip().replace("U+", "")
        if "-" in part:
            a, b = part.split("-"); out.append((int(a, 16), int(b, 16)))
        else:
            out.append((int(part, 16),) * 2)
    return out

tmp = tempfile.mkdtemp()
for w in (700, 900):
    css = open(os.path.join(pkg, f"{w}.css")).read()
    parts = []
    for i, f in enumerate(re.findall(r"@font-face\s*{(.*?)}", css, re.S)):
        file = re.search(r"url\(\./files/([^)]+?\.woff2)\)", f).group(1)
        rg = ranges(re.search(r"unicode-range:\s*([^;]+);", f).group(1))
        cs = {c for c in need if any(a <= ord(c) <= b for a, b in rg)}
        if not cs: continue
        font = TTFont(os.path.join(pkg, "files", file))
        cmap = font.getBestCmap(); cs = {c for c in cs if ord(c) in cmap}
        if not cs: continue
        opt = subset.Options(); opt.layout_features = ["*"]; opt.name_IDs = ["*"]
        sub = subset.Subsetter(opt); sub.populate(text="".join(cs)); sub.subset(font)
        font.flavor = None; p = os.path.join(tmp, f"{w}-{i}.ttf"); font.save(p); parts.append(p)
    m = Merger().merge(parts); m.flavor = "woff2"
    out = os.path.join(root, "fonts", f"geo-serif-{w}.woff2"); m.save(out)
    print(out, os.path.getsize(out), "bytes")
