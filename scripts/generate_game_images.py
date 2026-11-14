#!/usr/bin/env python3
"""Generate the game's 160x90 mission illustrations from the shared palette.

The images are deliberately deterministic so the asset set can be regenerated
without an external image service. Run from the repository root:

    python3 scripts/generate_game_images.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "game" / "img"
W, H = 160, 90

P = {
    "space": "#05070f",
    "space2": "#0b1020",
    "star": "#f5f7ff",
    "ice": "#bfe8ff",
    "ice2": "#7cc7e8",
    "fire": "#ff7a1a",
    "fire2": "#ffb347",
    "smoke": "#6b5a4a",
    "deltaGreen": "#2f7d4f",
    "deltaLight": "#7fbf6a",
    "water": "#1f4e8c",
    "waterLight": "#4aa3df",
    "soil": "#8a5a2b",
    "soilLight": "#c89b5a",
    "rock": "#5c6470",
    "rockLight": "#9aa4b2",
    "uiBg": "#10141f",
    "uiPanel": "#1b2233",
    "uiPanel2": "#273149",
    "uiText": "#f2f6ff",
    "uiMuted": "#a9b4c8",
    "accent": "#ffd166",
    "accent2": "#4cc9f0",
    "danger": "#ff5c5c",
    "injury": "#ff8fa3",
    "success": "#7ee787",
    "shadow": "#000000",
    "white": "#ffffff",
}

BAYER = (
    (0, 8, 2, 10),
    (12, 4, 14, 6),
    (3, 11, 1, 9),
    (15, 7, 13, 5),
)


def canvas(color: str = P["space"]) -> Image.Image:
    return Image.new("RGB", (W, H), color)


def rect(d: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, color: str) -> None:
    d.rectangle((x, y, x + w - 1, y + h - 1), fill=color)


def poly(d: ImageDraw.ImageDraw, points: list[tuple[int, int]], color: str) -> None:
    d.polygon(points, fill=color)


def _image(target: Image.Image | ImageDraw.ImageDraw) -> Image.Image:
    return target if hasattr(target, "load") else target._image  # type: ignore[attr-defined]


def dither(
    target: Image.Image | ImageDraw.ImageDraw,
    x: int,
    y: int,
    w: int,
    h: int,
    a: str,
    b: str,
    amount: float = 0.5,
) -> None:
    """Ordered-dither a rectangle between two palette colours."""
    img = _image(target)
    pixels = img.load()
    ax, ay, az = Image.new("RGB", (1, 1), a).getpixel((0, 0))
    bx, by, bz = Image.new("RGB", (1, 1), b).getpixel((0, 0))
    for yy in range(y, min(y + h, H)):
        for xx in range(x, min(x + w, W)):
            threshold = (BAYER[yy % 4][xx % 4] + 0.5) / 16
            pixels[xx, yy] = (ax, ay, az) if threshold < amount else (bx, by, bz)


def speckle(
    target: Image.Image | ImageDraw.ImageDraw,
    x: int,
    y: int,
    w: int,
    h: int,
    colors: tuple[str, ...],
    seed: int,
    density: float = 0.16,
) -> None:
    rnd = random.Random(seed)
    img = _image(target)
    pixels = img.load()
    for yy in range(y, min(y + h, H)):
        for xx in range(x, min(x + w, W)):
            if rnd.random() < density:
                r, g, b = Image.new("RGB", (1, 1), rnd.choice(colors)).getpixel((0, 0))
                pixels[xx, yy] = (r, g, b)


def mountains(
    d: ImageDraw.ImageDraw,
    base_y: int,
    color: str,
    seed: int,
    min_h: int = 12,
    max_h: int = 32,
) -> None:
    rnd = random.Random(seed)
    x = -4
    while x < W:
        width = rnd.randint(14, 32)
        height = rnd.randint(min_h, max_h)
        for row in range(0, height, 2):
            half = int((row / height) * (width / 2))
            rect(d, x + width // 2 - half, base_y - row, max(1, half * 2 + 1), 2, color)
        x += width - rnd.randint(2, 6)


def cloud(d: ImageDraw.ImageDraw, cx: int, cy: int, r: int, color: str) -> None:
    for ox, oy, rr in (
        (0, 0, r),
        (-r, 2, max(3, r - 3)),
        (r, 2, max(3, r - 4)),
        (-r // 2, -r // 2, max(3, r - 5)),
        (r // 2, -r // 3, max(3, r - 6)),
    ):
        d.ellipse((cx + ox - rr, cy + oy - rr, cx + ox + rr, cy + oy + rr), fill=color)


def scanlines(img: Image.Image, amount: int = 12) -> None:
    overlay = Image.new("RGB", (W, H), P["space"])
    d = ImageDraw.Draw(overlay)
    for y in range(0, H, 4):
        rect(d, 0, y, W, 1, P["space"])
    img.paste(Image.blend(img, overlay, amount / 100))


def grid(d: ImageDraw.ImageDraw, color: str = P["uiPanel2"], step: int = 20) -> None:
    for x in range(0, W, step):
        d.line((x, 0, x, H), fill=color, width=1)
    for y in range(0, H, step):
        d.line((0, y, W, y), fill=color, width=1)


def basin(d: ImageDraw.ImageDraw, seed: int, burn: bool, haze: bool) -> None:
    rect(d, 0, 0, W, 28, P["space2"])
    speckle(d, 0, 0, W, 20, (P["star"], P["uiMuted"]), seed, 0.025)
    poly(d, [(0, 42), (28, 30), (62, 38), (94, 27), (128, 36), (160, 29), (160, 90), (0, 90)], P["rock"])
    poly(d, [(0, 58), (36, 48), (70, 56), (104, 45), (140, 54), (160, 49), (160, 90), (0, 90)], P["soil"])
    d.ellipse((48, 54, 112, 82), fill=P["soilLight"])
    d.ellipse((56, 58, 104, 78), fill=P["smoke"] if not burn else P["space"])
    if burn:
        poly(d, [(62, 61), (83, 55), (103, 63), (92, 76), (70, 74)], P["space"])
        speckle(d, 62, 55, 44, 24, (P["fire"], P["danger"]), seed + 9, 0.08)
    else:
        speckle(d, 58, 59, 42, 18, (P["deltaGreen"], P["smoke"]), seed + 3, 0.12)
    if haze:
        for i in range(9):
            cloud(d, 10 + i * 20, 24 + (i % 3) * 5, 9 + (i % 4), P["smoke"])


def glacier(d: ImageDraw.ImageDraw, seed: int, shifted: bool, exposed: bool) -> None:
    rect(d, 0, 0, W, 24, P["ice2"])
    dither(d, 0, 0, W, 18, P["ice"], P["ice2"], 0.55)
    mountains(d, 44, P["rock"], seed, 14, 30)
    mountains(d, 34, P["rockLight"], seed + 4, 10, 22)
    offset = 8 if shifted else 0
    poly(
        d,
        [(18, 42), (48, 26 + offset), (82, 31 + offset), (108, 40), (132, 34 + offset), (160, 50), (160, 90), (0, 90)],
        P["ice"],
    )
    poly(d, [(30, 48), (54, 34 + offset), (82, 38 + offset), (104, 48), (124, 42 + offset), (150, 55), (150, 90), (10, 90)], P["white"])
    for i in range(5):
        x = 28 + i * 22
        d.line((x, 48 + offset, x - 10, 88), fill=P["ice2"], width=2)
    if exposed:
        poly(d, [(48, 60), (66, 52), (84, 61), (72, 76), (54, 75)], P["rock"])
        speckle(d, 50, 54, 34, 22, (P["rockLight"], P["ice2"]), seed + 7, 0.1)


def fields(d: ImageDraw.ImageDraw, wet: bool, seed: int, water_expanded: bool = False) -> None:
    rect(d, 0, 0, W, H, P["deltaLight"])
    dither(d, 0, 0, W, H, P["deltaLight"], P["soilLight"] if not wet else P["deltaGreen"], 0.28)
    for row in range(4):
        for col in range(6):
            x = 6 + col * 26
            y = 8 + row * 20
            rect(d, x, y, 20, 12, P["soil"] if not wet else P["deltaGreen"])
            rect(d, x + 2, y + 2, 16, 2, P["soilLight"] if not wet else P["deltaLight"])
    rect(d, 74, 0, 9, H, P["water"])
    rect(d, 74, 48, 30, 7, P["water"])
    rect(d, 54, 58, 20, 7, P["water"])
    if water_expanded:
        rect(d, 68, 0, 21, H, P["water"])
        rect(d, 48, 38, 48, 14, P["water"])
        rect(d, 38, 62, 42, 12, P["water"])
        speckle(d, 0, 0, W, H, (P["waterLight"], P["deltaGreen"]), seed + 8, 0.04)
    else:
        speckle(d, 0, 0, W, H, (P["waterLight"], P["deltaLight"]), seed, 0.025)


def flat_ground(d: ImageDraw.ImageDraw, seed: int, wet: bool, built: bool = False) -> None:
    rect(d, 0, 0, W, 30, P["space2"])
    rect(d, 0, 30, W, 60, P["soilLight"])
    dither(d, 0, 30, W, 60, P["soilLight"], P["soil"], 0.45)
    speckle(d, 0, 30, W, 60, (P["rockLight"], P["soil"]), seed, 0.06)
    if wet:
        d.ellipse((56, 52, 104, 76), fill=P["water"])
        d.ellipse((64, 56, 94, 70), fill=P["waterLight"])
        speckle(d, 58, 54, 44, 20, (P["water"], P["waterLight"]), seed + 2, 0.1)
    if built:
        rect(d, 64, 34, 34, 28, P["rock"])
        rect(d, 70, 28, 22, 10, P["uiPanel"])
        rect(d, 74, 31, 5, 4, P["accent"])
        rect(d, 83, 31, 5, 4, P["accent"])
        rect(d, 60, 62, 42, 4, P["space"])
        for x in (64, 72, 84, 92):
            d.line((x, 66, x, 78), fill=P["rock"], width=2)


def radar_ground(d: ImageDraw.ImageDraw, seed: int, kind: str) -> None:
    rect(d, 0, 0, W, H, P["space"])
    grid(d, P["uiPanel2"], 16)
    if kind == "glacier":
        poly(d, [(0, 38), (32, 22), (64, 34), (98, 18), (128, 31), (160, 20), (160, 90), (0, 90)], P["rock"])
        poly(d, [(18, 46), (52, 28), (86, 40), (114, 26), (150, 42), (150, 90), (0, 90)], P["ice"])
        speckle(d, 0, 20, W, 70, (P["ice"], P["ice2"], P["rockLight"]), seed, 0.12)
    elif kind == "delta":
        for row in range(4):
            for col in range(6):
                x = 5 + col * 26
                y = 7 + row * 20
                rect(d, x, y, 21, 13, P["deltaGreen"] if (row + col) % 3 else P["soil"])
        rect(d, 72, 0, 10, H, P["water"])
        rect(d, 50, 42, 28, 8, P["water"])
        speckle(d, 0, 0, W, H, (P["waterLight"], P["deltaLight"]), seed, 0.08)
    else:
        rect(d, 0, 28, W, 62, P["soil"])
        dither(d, 0, 28, W, 62, P["soil"], P["soilLight"], 0.4)
        speckle(d, 0, 28, W, 62, (P["rockLight"], P["deltaGreen"]), seed, 0.07)


def save(name: str, img: Image.Image) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / name, format="PNG", optimize=True)
    print(f"wrote {OUT / name}")


def main() -> None:
    # Mission 1 — smoke basin.
    for suffix, burn in (("a", False), ("b", True)):
        img = canvas()
        d = ImageDraw.Draw(img)
        basin(d, 11, burn=burn, haze=True)
        scanlines(img, 10)
        save(f"m1-smoke_brightness_{suffix}.png", img)

    img = canvas(P["fire2"])
    d = ImageDraw.Draw(img)
    dither(d, 0, 0, W, H, P["fire2"], P["fire"], 0.35)
    mountains(d, 64, P["rock"], 4, 18, 38)
    for i in range(12):
        cloud(d, 8 + i * 15, 20 + (i % 3) * 9, 11 + i % 5, P["smoke"])
    rect(d, 0, 76, W, 14, P["soil"])
    speckle(d, 0, 72, W, 18, (P["fire"], P["danger"]), 8, 0.12)
    save("m1-smoke_optical_a.png", img)

    img = canvas()
    d = ImageDraw.Draw(img)
    rect(d, 0, 0, W, 28, P["space2"])
    poly(d, [(0, 48), (40, 34), (80, 44), (120, 31), (160, 42), (160, 90), (0, 90)], P["rock"])
    rect(d, 0, 64, W, 26, P["soil"])
    d.ellipse((60, 58, 112, 80), fill=P["water"])
    d.ellipse((68, 61, 104, 76), fill=P["waterLight"])
    speckle(d, 60, 58, 52, 22, (P["waterLight"], P["ice"]), 12, 0.08)
    scanlines(img, 9)
    save("m1-smoke_water_a.png", img)

    # Mission 2 — glacier.
    for suffix, shifted in (("a", False), ("b", True)):
        img = canvas(P["ice2"])
        d = ImageDraw.Draw(img)
        glacier(d, 21, shifted=shifted, exposed=shifted)
        speckle(d, 0, 0, W, 25, (P["ice"], P["white"]), 22 + shifted, 0.1)
        save(f"m2-glacier_iceflow_{suffix}.png", img)

    for suffix, exposed in (("a", False), ("b", True)):
        img = canvas()
        d = ImageDraw.Draw(img)
        radar_ground(d, 31, "glacier")
        if exposed:
            poly(d, [(48, 56), (72, 46), (94, 58), (82, 78), (56, 76)], P["rock"])
            speckle(d, 48, 48, 48, 30, (P["rockLight"], P["water"]), 37, 0.12)
        scanlines(img, 12)
        save(f"m2-glacier_brightness_{suffix}.png", img)

    img = canvas(P["ice2"])
    d = ImageDraw.Draw(img)
    mountains(d, 62, P["rock"], 44, 18, 36)
    mountains(d, 52, P["rockLight"], 45, 10, 24)
    for i in range(7):
        cloud(d, 8 + i * 24, 18 + (i % 2) * 8, 13 + i % 4, P["white"])
        cloud(d, 8 + i * 24, 22 + (i % 2) * 8, 10, P["uiMuted"])
    rect(d, 0, 72, W, 18, P["ice"])
    save("m2-glacier_optical_a.png", img)

    img = canvas()
    d = ImageDraw.Draw(img)
    radar_ground(d, 51, "glacier")
    rnd = random.Random(51)
    for _ in range(70):
        x = rnd.randrange(20, 140)
        y = rnd.randrange(20, 80)
        color = rnd.choice((P["accent2"], P["accent"], P["danger"], P["uiMuted"]))
        d.line((x, y, x + rnd.randint(-5, 5), y + rnd.randint(-4, 4)), fill=color, width=1)
    scanlines(img, 18)
    save("m2-glacier_motion_a.png", img)

    # Mission 3 — delta.
    for suffix, wet in (("a", False), ("b", True)):
        img = canvas()
        d = ImageDraw.Draw(img)
        fields(d, wet=wet, seed=61 + wet)
        save(f"m3-delta_moisture_{suffix}.png", img)

    for suffix, expanded in (("a", False), ("b", True)):
        img = canvas()
        d = ImageDraw.Draw(img)
        fields(d, wet=True, seed=71 + expanded, water_expanded=expanded)
        save(f"m3-delta_water_{suffix}.png", img)

    img = canvas()
    d = ImageDraw.Draw(img)
    radar_ground(d, 81, "delta")
    scanlines(img, 10)
    save("m3-delta_brightness_a.png", img)

    img = canvas(P["fire2"])
    d = ImageDraw.Draw(img)
    fields(d, wet=False, seed=91)
    dither(d, 0, 0, W, H, P["fire2"], P["soilLight"], 0.22)
    for i in range(8):
        cloud(d, 6 + i * 22, 12 + (i % 2) * 8, 10 + i % 4, P["white"])
    save("m3-delta_optical_a.png", img)

    img = canvas()
    d = ImageDraw.Draw(img)
    radar_ground(d, 101, "delta")
    rnd = random.Random(101)
    for _ in range(40):
        x = rnd.randrange(0, W)
        y = rnd.randrange(0, H)
        rect(d, x, y, rnd.randint(3, 12), rnd.randint(2, 6), rnd.choice((P["space2"], P["uiPanel2"], P["waterLight"])))
    scanlines(img, 14)
    save("m3-delta_stability_a.png", img)

    # Mission 4 — foundations.
    img = canvas()
    d = ImageDraw.Draw(img)
    flat_ground(d, 111, wet=False, built=True)
    for x in (72, 80, 88, 96):
        d.line((x, 56, x, 82), fill=P["danger"], width=1)
        d.polygon([(x - 2, 78), (x + 2, 78), (x, 84)], fill=P["danger"])
    scanlines(img, 8)
    save("m4-foundations_motion_a.png", img)

    img = canvas()
    d = ImageDraw.Draw(img)
    flat_ground(d, 121, wet=False, built=True)
    rnd = random.Random(121)
    for _ in range(45):
        x = rnd.randrange(0, W)
        y = rnd.randrange(30, H)
        rect(d, x, y, rnd.randint(4, 14), rnd.randint(2, 5), rnd.choice((P["space2"], P["uiPanel2"], P["rockLight"])))
    scanlines(img, 12)
    save("m4-foundations_stability_a.png", img)

    img = canvas(P["ice2"])
    d = ImageDraw.Draw(img)
    rect(d, 0, 0, W, 30, P["space2"])
    rect(d, 0, 30, W, 60, P["soilLight"])
    dither(d, 0, 30, W, 60, P["soilLight"], P["deltaLight"], 0.4)
    flat_ground(d, 131, wet=False, built=True)
    rect(d, 0, 0, W, 20, P["ice2"])
    save("m4-foundations_optical_a.png", img)

    img = canvas()
    d = ImageDraw.Draw(img)
    flat_ground(d, 141, wet=True, built=False)
    scanlines(img, 9)
    save("m4-foundations_water_a.png", img)

    img = canvas()
    d = ImageDraw.Draw(img)
    radar_ground(d, 151, "ground")
    scanlines(img, 10)
    save("m4-foundations_brightness_a.png", img)


if __name__ == "__main__":
    main()
