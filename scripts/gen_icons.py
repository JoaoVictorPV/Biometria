from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "icons"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# Paleta (igual ao BrandMark)
C1 = (0x22, 0xD3, 0xEE)
C2 = (0xA7, 0x8B, 0xFA)
C3 = (0x34, 0xD3, 0x99)
BLUE = (0x0E, 0xA5, 0xE9)
BG = (0, 0, 0)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def grad(t: float) -> tuple[int, int, int]:
    # 0..1, transição C1 -> C2 -> C3
    if t <= 0.55:
        tt = t / 0.55
        return (
            lerp(C1[0], C2[0], tt),
            lerp(C1[1], C2[1], tt),
            lerp(C1[2], C2[2], tt),
        )
    tt = (t - 0.55) / 0.45
    return (
        lerp(C2[0], C3[0], tt),
        lerp(C2[1], C3[1], tt),
        lerp(C2[2], C3[2], tt),
    )


def render(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG + (255,))
    d = ImageDraw.Draw(img)

    cx = cy = size / 2
    r = size * 0.36
    ring_w = max(2, int(size * 0.045))
    steps = 240

    # Anel com gradiente (aproximação por segmentos)
    bbox = [cx - r, cy - r, cx + r, cy + r]
    for i in range(steps):
        a0 = (i / steps) * 2 * math.pi
        a1 = ((i + 1) / steps) * 2 * math.pi
        col = grad(i / steps)
        d.arc(
            bbox,
            start=math.degrees(a0),
            end=math.degrees(a1),
            fill=col + (255,),
            width=ring_w,
        )

    # Funções de escala (baseado no viewBox 48x48)
    def sx(x: float) -> float:
        return x / 48 * size

    def sy(y: float) -> float:
        return y / 48 * size

    # Traço (a "onda")
    pts = [
        (sx(14), sy(25.5)),
        (sx(20), sy(15.5)),
        (sx(24), sy(25.5)),
        (sx(30), sy(36.0)),
        (sx(34), sy(25.0)),
        (sx(37.8), sy(24.5)),
    ]
    line_w = max(2, int(size * 0.05))
    d.line(pts, fill=BLUE + (255,), width=line_w, joint="curve")

    # Ponto
    dot_r = size * 0.06
    d.ellipse(
        [sx(34) - dot_r, sy(25) - dot_r, sx(34) + dot_r, sy(25) + dot_r],
        fill=C2 + (255,),
    )
    inner_r = dot_r * 0.42
    d.ellipse(
        [
            sx(34) - inner_r,
            sy(25) - inner_r,
            sx(34) + inner_r,
            sy(25) + inner_r,
        ],
        fill=(11, 16, 32, 140),
    )

    return img


def save_png(size: int, rel_path: str) -> None:
    img = render(size)
    p = ROOT / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    img.save(p, format="PNG")


def save_ico(rel_path: str) -> None:
    base = render(512).resize((256, 256), Image.LANCZOS)
    p = ROOT / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    base.save(
        p,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )


def main() -> None:
    # Favicons + ícones estáticos (para browsers e iOS)
    save_png(16, "public/icons/favicon-16.png")
    save_png(32, "public/icons/favicon-32.png")
    save_png(180, "public/icons/apple-touch-icon.png")
    save_png(192, "public/icons/icon-192.png")
    save_png(512, "public/icons/icon-512.png")

    # /favicon.ico usado no canto superior esquerdo (tab) e por muitos browsers
    save_ico("public/favicon.ico")

    print("OK: icons gerados em public/icons e public/favicon.ico")


if __name__ == "__main__":
    main()
