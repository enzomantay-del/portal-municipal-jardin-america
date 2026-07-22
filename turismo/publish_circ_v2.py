from pathlib import Path
import re
import shutil
import subprocess
import tempfile

TURISMO = Path(r"d:\Documents\Prueba de Cursor\jardin-america-turismo")
PORTAL = Path(r"d:\Documents\Prueba de Cursor\portal-municipal-jardin-america")

idx = TURISMO / "index.html"
t = idx.read_text(encoding="utf-8")
t = re.sub(r"circuitos-turismo\.css\?v=[^\"]+", "circuitos-turismo.css?v=20260722b", t)
t = re.sub(r"circuitos-data\.js\?v=[^\"]+", "circuitos-data.js?v=20260722b", t)
t = re.sub(r"circuitos-turismo\.js\?v=[^\"]+", "circuitos-turismo.js?v=20260722b", t)
idx.write_text(t, encoding="utf-8", newline="\n")

subprocess.run(
    ["python", str(PORTAL / "scripts" / "sync-turismo.py")],
    cwd=PORTAL,
    check=True,
)

subprocess.run(
    [
        "git",
        "add",
        "index.html",
        "css/circuitos-turismo.css",
        "js/circuitos-data.js",
        "js/circuitos-turismo.js",
    ],
    cwd=TURISMO,
    check=True,
)
msg = "Mejorar circuitos: diseno limpio y ruta por calles reales.\n"
subprocess.run(["git", "commit", "-m", msg], cwd=TURISMO, check=True)
subprocess.run(["git", "push", "origin", "HEAD"], cwd=TURISMO, check=True)
print(subprocess.run(["git", "log", "-1", "--oneline"], cwd=TURISMO, capture_output=True, text=True).stdout)

wt = Path(tempfile.gettempdir()) / "portal-pub-circ-v2"
subprocess.run(["git", "worktree", "prune"], cwd=PORTAL, check=False)
if wt.exists():
    subprocess.run(["git", "worktree", "remove", "--force", str(wt)], cwd=PORTAL, check=False)
    shutil.rmtree(wt, ignore_errors=True)
subprocess.run(["git", "fetch", "origin"], cwd=PORTAL, check=True)
r = subprocess.run(
    ["git", "worktree", "add", "-B", "pub-circ-v2", str(wt), "origin/main"],
    cwd=PORTAL,
    capture_output=True,
    text=True,
)
print(r.stderr)
dest = wt / "turismo"
if dest.exists():
    shutil.rmtree(dest)
shutil.copytree(
    PORTAL / "turismo",
    dest,
    ignore=shutil.ignore_patterns(
        ".git",
        "node_modules",
        "*.lnk",
        "_*.py",
        "package.json",
        "package-lock.json",
        "optimize-images.mjs",
        "README.md",
    ),
)
subprocess.run(["git", "add", "-A", "turismo"], cwd=wt, check=True)
subprocess.run(["git", "commit", "-m", msg], cwd=wt, check=True)
push = subprocess.run(["git", "push", "origin", "HEAD:main"], cwd=wt, capture_output=True, text=True)
print(push.stderr)
print("push", push.returncode)
print(subprocess.run(["git", "log", "-1", "--oneline"], cwd=wt, capture_output=True, text=True).stdout)
subprocess.run(["git", "worktree", "remove", "--force", str(wt)], cwd=PORTAL, check=False)
subprocess.run(["git", "worktree", "prune"], cwd=PORTAL, check=False)
