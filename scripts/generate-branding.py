#!/usr/bin/env python3
"""Derive every raster branding asset from the supplied NN MOVIES artwork.

Source of truth:  public/brand/source-logo.png   (the logo image you provided)

Generated:
    public/brand/logo-mark.png    512x512   emblem only, transparent background
    public/brand/logo-full.png    variable  emblem + MOVIES lockup, transparent
    public/favicon-32.png          32x32    legacy favicon fallback
    app/apple-icon.png            180x180   iOS home-screen icon
    public/og-image.png          1200x630   Open Graph / Twitter card

Usage:  python3 scripts/generate-branding.py
Deps:   pillow  (pip install pillow)

To re-brand: drop a new artwork file at public/brand/source-logo.png, adjust the
CROP_* boxes below if the composition differs, and re-run. Nothing else in the
codebase references image dimensions directly.
"""

from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "public", "brand", "source-logo.png")

# Crop boxes in source-image pixels (left, top, right, bottom).
CROP_EMBLEM = (455, 55, 900, 465)
CROP_LOCKUP = (385, 45, 950, 575)

INK = (9, 9, 11)
GOLD = (224, 179, 80)
MIST = (212, 212, 216)
DIM = (113, 113, 122)

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def key_background(img: Image.Image, low: int = 34, high: int = 86) -> Image.Image:
    """Luminance key: drop the dark studio backdrop, keep the gold/red emblem.

    Pixels darker than `low` become fully transparent, brighter than `high`
    fully opaque, with a linear ramp between so edges stay soft.
    """
    rgb = img.convert("RGB")
    lum = rgb.convert("L").filter(ImageFilter.GaussianBlur(0.6))
    alpha = lum.point(
        [0 if v <= low else 255 if v >= high else int(255 * (v - low) / (high - low)) for v in range(256)]
    )
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def square(img: Image.Image, size: int) -> Image.Image:
    """Fit into a transparent square canvas without distortion."""
    fitted = img.copy()
    fitted.thumbnail((size, size), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2), fitted)
    return canvas


def on_tile(mark: Image.Image, size: int, radius_ratio: float = 0.22) -> Image.Image:
    """Composite the mark onto an opaque dark rounded tile (for app icons)."""
    tile = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], int(size * radius_ratio), fill=255
    )
    backdrop = Image.new("RGBA", (size, size), INK + (255,))
    tile.paste(backdrop, (0, 0), mask)
    inner = square(mark, int(size * 0.84))
    tile.paste(inner, ((size - inner.width) // 2, (size - inner.height) // 2), inner)
    return tile


def write(img: Image.Image, *parts: str) -> None:
    path = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print("wrote", os.path.relpath(path, ROOT), img.size)


def main() -> None:
    if not os.path.exists(SOURCE):
        raise SystemExit(f"missing source artwork: {SOURCE}")

    source = Image.open(SOURCE).convert("RGB")

    emblem = key_background(source.crop(CROP_EMBLEM))
    # The lockup crop reaches into the studio spotlight, so it needs a higher
    # floor to keep the backdrop from ghosting through as bright patches.
    lockup = key_background(source.crop(CROP_LOCKUP), low=58, high=112)

    mark_512 = square(emblem, 512)
    write(mark_512, "public", "brand", "logo-mark.png")

    lockup_out = lockup.copy()
    lockup_out.thumbnail((720, 720), Image.LANCZOS)
    write(lockup_out, "public", "brand", "logo-full.png")

    write(on_tile(emblem, 32, 0.18), "public", "favicon-32.png")
    write(on_tile(emblem, 180), "app", "apple-icon.png")
    write(on_tile(emblem, 512), "public", "brand", "icon-512.png")

    # --- Open Graph card -------------------------------------------------
    og = Image.new("RGB", (1200, 630), INK)
    draw = ImageDraw.Draw(og)
    backdrop = source.copy().resize((1200, 655), Image.LANCZOS).filter(
        ImageFilter.GaussianBlur(14)
    )
    og.paste(backdrop, (0, -12))
    shade = Image.new("RGBA", (1200, 630), (9, 9, 11, 200))
    og.paste(Image.alpha_composite(og.convert("RGBA"), shade).convert("RGB"), (0, 0))
    draw = ImageDraw.Draw(og)
    draw.rectangle([0, 0, 1200, 6], fill=(225, 29, 46))

    hero = square(lockup, 380)
    og.paste(hero, (86, 128), hero)

    draw.text((520, 214), "NAFIJ", font=load_font(92), fill=(244, 244, 245))
    draw.text((524, 322), "NETFLIX", font=load_font(44), fill=GOLD)
    draw.text((526, 392), "Movies and TV, streamed in premium dark mode.", font=load_font(24), fill=MIST)
    draw.text((526, 430), "Powered by TMDB metadata.", font=load_font(22), fill=DIM)
    write(og, "public", "og-image.png")


if __name__ == "__main__":
    main()
