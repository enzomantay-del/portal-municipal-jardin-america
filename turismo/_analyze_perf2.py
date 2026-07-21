# -*- coding: utf-8 -*-
from pathlib import Path
import re

html = Path(r"d:\Documents\Prueba de Cursor\jardin-america-turismo\index.html").read_text(encoding="utf-8")

# Find tm-perf-hydrate
m = re.search(r'<script[^>]*id="tm-perf-hydrate"[^>]*>.*?</script>', html, flags=re.I | re.S)
print("HYDRATE:", (m.group(0)[:1200] + "...") if m else "NONE")

# Firebase block
for m in re.finditer(r"<script[^>]*>.*?</script>", html, flags=re.I | re.S):
    block = m.group(0)
    if "firebase" in block.lower() or "gstatic.com/firebase" in block:
        print("\nFIREBASE BLOCK len", len(block))
        print(block[:500])
        print("...")
        print(block[-300:])

# imgs without lazy
imgs = re.findall(r"<img\b[^>]*>", html, flags=re.I)
no_lazy = [i for i in imgs if "loading=" not in i.lower()]
print("\nIMGS without loading attr:", len(no_lazy))
for i in no_lazy[:15]:
    print(i[:160])

# iframe
print("\nIFRAMES:")
for i in re.findall(r"<iframe\b[^>]*>", html, flags=re.I):
    print(i[:250])
