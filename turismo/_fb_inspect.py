# -*- coding: utf-8 -*-
from pathlib import Path
import re

html = Path(r"d:\Documents\Prueba de Cursor\jardin-america-turismo\index.html").read_text(encoding="utf-8")
out = []
for m in re.finditer(r".{0,40}firebase\.(initializeApp|database|app).{0,80}", html):
    out.append(m.group(0).encode("ascii", "backslashreplace").decode())
db = re.search(r'databaseURL:\s*"([^"]+)"', html)
out.append("databaseURL=" + (db.group(1) if db else "NONE"))
out.append("font links=" + str(len(re.findall(r"fonts\.googleapis\.com/css2\?family=Montserrat", html))))
# script tags with firebase in body
n = 0
for m in re.finditer(r"<script(\s[^>]*)?>(.*?)</script>", html, flags=re.S):
    if "firebase" in m.group(0).lower():
        n += 1
        attrs = m.group(1) or ""
        body = m.group(2) or ""
        out.append(f"script#{n} attrs={attrs!r} body_start={body[:80].encode('ascii','backslashreplace').decode()} len={len(body)}")
Path(r"d:\Documents\Prueba de Cursor\jardin-america-turismo\_fb_snip.txt").write_text("\n".join(out), encoding="utf-8")
print("wrote", len(out), "lines")
