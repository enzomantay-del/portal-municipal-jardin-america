# -*- coding: utf-8 -*-
"""Light turismo performance tweaks — no feature removal."""
from __future__ import annotations

import pathlib
import re
import shutil
import subprocess
import tempfile

TURISMO = pathlib.Path(r"d:\Documents\Prueba de Cursor\jardin-america-turismo")
PORTAL = pathlib.Path(r"d:\Documents\Prueba de Cursor\portal-municipal-jardin-america")
V = "20260721perf"


def patch_index(html: str) -> str:
    # 1) Convert duplicate blocking Google Fonts stylesheet into noscript-only fallback
    #    (preload + onload already loads fonts for normal browsers)
    html = re.sub(
        r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com/css2\?family=Montserrat:[^"]+)">',
        r'<noscript><link rel="stylesheet" href="\1"></noscript>',
        html,
        count=1,
    )

    # 2) Preconnect Firebase / gstatic (once)
    if "turigest-ja-default-rtdb.firebaseio.com" not in html.split("<body", 1)[0]:
        db = re.search(r'databaseURL:\s*"([^"]+)"', html)
        extra = (
            '<link rel="preconnect" href="https://www.gstatic.com" crossorigin>'
            '<link rel="dns-prefetch" href="https://www.gstatic.com">'
        )
        if db:
            host = re.sub(r"^https?://", "", db.group(1)).rstrip("/")
            extra += (
                f'<link rel="dns-prefetch" href="https://{host}">'
                f'<link rel="preconnect" href="https://{host}">'
            )
        html = html.replace(
            '<link rel="preconnect" href="https://fonts.googleapis.com">',
            '<link rel="preconnect" href="https://fonts.googleapis.com">' + extra,
            1,
        )

    # 3) Defer Firebase SDK scripts
    html = html.replace(
        '<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>',
        '<script defer src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>',
        1,
    )
    html = html.replace(
        '<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>',
        '<script defer src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>',
        1,
    )

    # 4) Defer inline scripts that talk to Firebase (keep order via defer)
    def maybe_defer(m: re.Match) -> str:
        attrs = m.group(1) or ""
        body = m.group(2) or ""
        if "defer" in attrs or "src=" in attrs or 'id="' in attrs:
            return m.group(0)
        if (
            "firebase.initializeApp" in body
            or "firebase.database(" in body
            or "firebase.app(" in body
        ):
            return f"<script defer>{body}</script>"
        return m.group(0)

    html = re.sub(r"<script(\s[^>]*)?>(.*?)</script>", maybe_defer, html, flags=re.S)

    # 5) Defer aloj catalog script + its immediate init call
    html = html.replace(
        '<script src="js/aloj-catalogo.js?v=20260713k"></script>',
        f'<script defer src="js/aloj-catalogo.js?v={V}"></script>',
        1,
    )
    html = html.replace(
        "<script>if(window.inicializarCatalogoAloj)window.inicializarCatalogoAloj();</script>",
        "<script defer>if(window.inicializarCatalogoAloj)window.inicializarCatalogoAloj();</script>",
        1,
    )

    # 6) Bump mejoras / aloj CSS cache-bust
    html = re.sub(
        r'(href="css/turismo-mejoras\.css)\?v=[^"]*"',
        rf'\1?v={V}"',
        html,
    )
    html = re.sub(
        r'(src="js/turismo-mejoras\.js)\?v=[^"]*"',
        rf'\1?v={V}"',
        html,
    )
    html = re.sub(
        r'(href="css/aloj-catalogo\.css)(?:\?v=[^"]*)?"',
        rf'\1?v={V}"',
        html,
    )

    # 7) Lazy-load iframe maps
    def lazy_iframe(m: re.Match) -> str:
        tag = m.group(0)
        if "loading=" in tag.lower():
            return tag
        return tag[:-1] + ' loading="lazy" referrerpolicy="no-referrer-when-downgrade">'

    html = re.sub(r"<iframe\b[^>]*>", lazy_iframe, html, flags=re.I)

    # 8) Add loading=lazy to imgs missing it (keep hero / fetchpriority / first nav logo)
    seen_logo = {"n": 0}

    def lazy_img(m: re.Match) -> str:
        tag = m.group(0)
        low = tag.lower()
        if "loading=" in low:
            return tag
        if "fetchpriority" in low:
            return tag
        if "tabay-hero" in low or "portada-hero" in low:
            return tag
        if "logo-municipalidad" in low:
            seen_logo["n"] += 1
            if seen_logo["n"] == 1:
                return tag
        if tag.endswith("/>"):
            return tag[:-2] + ' loading="lazy" decoding="async"/>'
        return tag[:-1] + ' loading="lazy" decoding="async">'

    html = re.sub(r"<img\b[^>]*>", lazy_img, html, flags=re.I)

    return html


def patch_netlify(text: str) -> str:
    if "/turismo/img/*" in text:
        return text
    block = """
[[headers]]
  for = "/turismo/img/*"
  [headers.values]
    Cache-Control = "public, max-age=604800, stale-while-revalidate=86400"

[[headers]]
  for = "/turismo/css/*"
  [headers.values]
    Cache-Control = "public, max-age=604800, stale-while-revalidate=86400"

[[headers]]
  for = "/turismo/js/*"
  [headers.values]
    Cache-Control = "public, max-age=604800, stale-while-revalidate=86400"

[[headers]]
  for = "/turismo/favicon.png"
  [headers.values]
    Cache-Control = "public, max-age=604800, stale-while-revalidate=86400"
"""
    return text.rstrip() + "\n" + block + "\n"


def main() -> None:
    index = TURISMO / "index.html"
    original = index.read_text(encoding="utf-8")
    updated = patch_index(original)
    if updated == original:
        print("warning: no changes detected")
    # sanity
    assert "firebase-app-compat.js" in updated
    assert 'defer src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"' in updated
    assert "loading=\"lazy\"" in updated
    # fonts: preload remains
    assert "fonts.googleapis.com/css2?family=Montserrat" in updated
    index.write_text(updated, encoding="utf-8", newline="\n")
    print("patched turismo index.html")

    # sync into portal
    subprocess.check_call(["python", str(PORTAL / "scripts" / "sync-turismo.py")], cwd=PORTAL)

    # patch netlify on portal (source of deploy)
    nt = PORTAL / "netlify.toml"
    # we'll patch in worktree from origin + copy files

    wt = pathlib.Path(tempfile.mkdtemp(prefix="turismo-perf-"))
    try:
        subprocess.check_call(
            ["git", "worktree", "add", "-B", "turismo-perf", str(wt), "origin/main"],
            cwd=PORTAL,
        )
        # copy synced turismo
        dest = wt / "turismo"
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(
            PORTAL / "turismo",
            dest,
            ignore=shutil.ignore_patterns("node_modules", ".git"),
        )
        nt_text = (wt / "netlify.toml").read_text(encoding="utf-8")
        (wt / "netlify.toml").write_text(patch_netlify(nt_text), encoding="utf-8", newline="\n")

        # verify
        live_idx = (dest / "index.html").read_text(encoding="utf-8")
        assert "defer src=\"https://www.gstatic.com/firebasejs" in live_idx
        assert "muni-consultas" not in live_idx  # sanity unrelated

        subprocess.check_call(["git", "add", "turismo", "netlify.toml"], cwd=wt)
        st = subprocess.check_output(["git", "status", "--porcelain"], cwd=wt, text=True)
        print(st)
        if not st.strip():
            raise SystemExit("nothing to commit")
        subprocess.check_call(
            [
                "git",
                "commit",
                "-m",
                "Acelerar un poco turismo: defer Firebase, lazy media y mejor caché.",
            ],
            cwd=wt,
        )
        subprocess.check_call(["git", "push", "origin", "HEAD:main"], cwd=wt)
        print("PUBLISHED OK", V)
    finally:
        subprocess.call(["git", "worktree", "remove", "--force", str(wt)], cwd=PORTAL)
        subprocess.call(["git", "branch", "-D", "turismo-perf"], cwd=PORTAL)


if __name__ == "__main__":
    main()
