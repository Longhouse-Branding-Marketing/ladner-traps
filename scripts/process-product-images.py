#!/usr/bin/env python3
"""Copy CSP product photos into assets/products and apply light retouching."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = Path(
    r"C:\Users\austi\.cursor\projects\c-Users-austi-Documents-Code-ladner-traps\assets"
)
OUT_DIR = ROOT / "assets" / "products"

SKIP_IDS = {"0108", "2957", "2958", "2979"}
RUST_FIX_IDS = {"2947", "2948", "2968"}
TWINE_VARIANT_SOURCE = "2980"


def find_source(id_: str) -> Path | None:
    pattern = f"*CSP_Connor_CrabTraps-{id_}-*"
    matches = sorted(SRC_DIR.glob(pattern))
    return matches[0] if matches else None


def is_rust_pixel(r: int, g: int, b: int) -> bool:
    if r < 95 or g > 125 or b > 95:
        return False
    if r / max(g, 1) < 1.35:
        return False
    if g > 95 and r - g < 35:
        return False
    return True


def is_twine_pixel(r: int, g: int, b: int) -> bool:
    return r > 150 and 60 < g < 200 and b < 120 and r > g > b


def fix_rust(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not is_rust_pixel(r, g, b):
                continue
            lum = (r + g + b) / 3
            sr = int(125 + lum * 0.42)
            sg = int(130 + lum * 0.42)
            sb = int(138 + lum * 0.44)
            px[x, y] = (sr, sg, sb, a)
    return out


def recolor_twine(img: Image.Image, mode: str) -> Image.Image:
    out = img.convert("RGBA")
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not is_twine_pixel(r, g, b):
                continue
            lum = (r + g + b) / 3
            if mode == "pink":
                px[x, y] = (min(255, int(lum * 1.15)), int(lum * 0.45), int(lum * 0.75), a)
            elif mode == "white":
                v = int(185 + lum * 0.22)
                px[x, y] = (v, v, v, a)
            elif mode == "black":
                v = int(max(18, lum * 0.18))
                px[x, y] = (v, v, v, a)
            else:
                px[x, y] = (min(255, int(lum * 1.1)), int(lum * 0.58), int(lum * 0.12), a)
    return out


def save_jpg(img: Image.Image, dest: Path, quality: int = 88) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    rgb = img.convert("RGB")
    rgb.save(dest, "JPEG", quality=quality, optimize=True)


def main() -> None:
    if not SRC_DIR.exists():
        raise SystemExit(f"Source directory not found: {SRC_DIR}")

    id_pattern = re.compile(r"CSP_Connor_CrabTraps-(\d+)-")
    ids = sorted({m.group(1) for p in SRC_DIR.glob("*CSP_Connor*") if (m := id_pattern.search(p.name))})

    for id_ in ids:
        if id_ in SKIP_IDS:
            print(f"skip {id_}")
            continue

        src = find_source(id_)
        if not src:
            print(f"missing {id_}")
            continue

        img = Image.open(src)
        dest = OUT_DIR / f"csp-{id_}.jpg"

        if id_ in RUST_FIX_IDS:
            img = fix_rust(img)
            print(f"rust-fix {id_}")
        else:
            print(f"copy {id_}")

        save_jpg(img, dest)

    base = find_source(TWINE_VARIANT_SOURCE)
    if base:
        base_img = Image.open(base)
        for mode in ("orange", "pink", "white", "black"):
            variant = recolor_twine(base_img, mode)
            save_jpg(variant, OUT_DIR / f"csp-2980-twine-{mode}.jpg")
            print(f"twine variant {mode}")

    print(f"Done. {len(list(OUT_DIR.glob('*.jpg')))} files in {OUT_DIR}")


if __name__ == "__main__":
    main()
