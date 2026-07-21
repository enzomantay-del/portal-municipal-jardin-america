# -*- coding: utf-8 -*-
from pathlib import Path
import re

root = Path(r"d:\Documents\Prueba de Cursor\jardin-america-turismo")
html = (root / "index.html").read_text(encoding="utf-8")
print("size KB", round(len(html) / 1024, 1))
print("inline style blocks", html.count("<style"))
print("loading=lazy", html.count('loading="lazy"'))
print("img tags", len(re.findall(r"<img\b", html, flags=re.I)))
print("iframe", len(re.findall(r"<iframe\b", html, flags=re.I)))

print("\nSCRIPTS:")
for m in re.finditer(r"<script([^>]*)>(.*?)</script>", html, flags=re.I | re.S):
    attrs, body = m.group(1), m.group(2)
    src = re.search(r'src="([^"]+)"', attrs)
    if src:
        print(" external", src.group(1), "defer" in attrs, "async" in attrs)
    else:
        print(" inline", len(body), "chars", "firebase" in body.lower(), attrs[:80])

print("\nLINKS:")
for m in re.findall(r"<link[^>]+>", html):
    if "stylesheet" in m or "preload" in m or "preconnect" in m or "icon" in m:
        print(m[:240])

print("\nFILES:")
for p in sorted(root.rglob("*")):
    if p.is_file() and p.suffix.lower() in {".js", ".css", ".webp", ".png", ".jpg", ".jpeg", ".svg"}:
        print(f"{p.relative_to(root)} {round(p.stat().st_size/1024,1)} KB")
