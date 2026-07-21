# -*- coding: utf-8 -*-
"""Copia el sitio de turismo al portal en /turismo/ para un solo dominio."""
from __future__ import annotations

import pathlib
import shutil

PORTAL = pathlib.Path(__file__).resolve().parents[1]
TURISMO = PORTAL.parent / "jardin-america-turismo"
DEST = PORTAL / "turismo"

SKIP_NAMES = {
    ".git",
    "node_modules",
    ".gitignore",
    "package.json",
    "package-lock.json",
    "optimize-images.mjs",
    "README.md",
    "index - Acceso directo.lnk",
}


def should_skip(path: pathlib.Path) -> bool:
    return path.name in SKIP_NAMES or path.suffix.lower() == ".lnk"


def main() -> None:
    if not TURISMO.is_dir():
        raise SystemExit("No se encontró jardin-america-turismo junto al portal")

    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir(parents=True)

    for item in TURISMO.iterdir():
        if should_skip(item):
            continue
        target = DEST / item.name
        if item.is_dir():
            shutil.copytree(item, target, ignore=shutil.ignore_patterns("node_modules", ".git"))
        else:
            shutil.copy2(item, target)

    mejoras = DEST / "js" / "turismo-mejoras.js"
    if mejoras.exists():
        text = mejoras.read_text(encoding="utf-8")
        text2 = text.replace(
            'var PORTAL_URL = "https://enzomantay-del.github.io/portal-municipal-jardin-america/";',
            'var PORTAL_URL = "/";',
        )
        if text2 != text:
            mejoras.write_text(text2, encoding="utf-8")
            print("updated PORTAL_URL -> /")

    count = sum(1 for f in DEST.rglob("*") if f.is_file())
    print("synced", count, "files ->", DEST)


if __name__ == "__main__":
    main()
