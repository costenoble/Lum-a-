#!/usr/bin/env python3
"""
Détoure les dix images de fruits (composants/minimaxH3/piedPage/fruits-nuxt-scene/
public/fruits/, générées par IA) pour components/FooterFruits.vue : fond de studio
blanc -> vraies zones transparentes (canal alpha), pas une couleur de page cuite en
dur comme pour la bouteille — les fruits du pied de page passent devant un fond de
page qui change (couleur claire la plupart du temps, parfois une photo), donc il faut
une vraie transparence, pas un fond figé.

Le fond n'est pas toujours un blanc plat : certaines images (pineapple, mango,
watermelon...) ont un léger vignettage de studio, jusqu'à ~22 niveaux d'écart entre
les coins. Le fond est donc estimé localement (lissé, à partir des seuls pixels de
fond), pas pris comme une seule couleur globale.

Usage (depuis la racine du dépôt) :
    pip install numpy scipy pillow
    python3 scripts/footfruit-alpha.py

Écrit un .png par fruit dans components/minimaxH3/piedPage/web/. Requiert
uniquement Python (pas de ffmpeg, ce sont des images fixes).
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "components/minimaxH3/piedPage/fruits-nuxt-scene/public/fruits"
OUT_DIR = ROOT / "components/minimaxH3/piedPage/web"

# Marge autour du personnage où l'on n'estime pas le fond (ses propres reflets clairs
# y débordent un peu, comme sur la bouteille).
MARGIN = 24


def bg_estimate(rgb: np.ndarray, valid: np.ndarray, sigma: float = 60, down: int = 4) -> np.ndarray:
    """Le fond de studio, lissé, y compris derrière le personnage : on lisse les
    seuls pixels de fond (convolution normalisée), à basse résolution."""
    h, w, _ = rgb.shape
    small = rgb[::down, ::down]
    m = valid[::down, ::down].astype(np.float32)
    num = np.stack([ndi.gaussian_filter(small[..., c] * m, sigma / down) for c in range(3)], -1)
    den = ndi.gaussian_filter(m, sigma / down)[..., None]
    fallback = np.median(rgb[valid], axis=0) if valid.any() else np.array([0.95, 0.95, 0.95], np.float32)
    low = np.where(den > 1e-3, num / np.maximum(den, 1e-4), fallback)
    up = ndi.zoom(low, (down, down, 1), order=1)
    out = np.empty_like(rgb)
    out[:] = fallback
    hh, ww = min(h, up.shape[0]), min(w, up.shape[1])
    out[:hh, :ww] = up[:hh, :ww]
    return out


def matte(rgb: np.ndarray):
    """rgb : float32 (H, W, 3) entre 0 et 1  ->  (couleur droite, alpha)."""
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)

    # 1. Ce qui est sûrement le personnage : couleur franche ou zone sombre (contours,
    #    ombres propres, pupilles).
    strong = (sat > 0.12) | (lum < 0.55)
    solid = ndi.binary_fill_holes(ndi.binary_closing(strong, iterations=3))
    lab, n = ndi.label(solid)
    if n:
        sizes = ndi.sum(solid, lab, range(1, n + 1))
        solid = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > solid.sum() * 0.02])

    # 2. Fond estimé loin du personnage, puis « couleur vers alpha » contre lui.
    near = ndi.binary_dilation(solid, iterations=MARGIN)
    bg = bg_estimate(rgb, ~near)
    ratio = np.clip(rgb / np.maximum(bg, 0.05), 0, 1.5)
    a_dark = np.clip((1 - ratio.min(axis=2) - 0.02) / 0.98, 0, 1)

    # 3. Alpha final : le noyau du personnage (bord adouci) plus ce translucide (ombre
    #    portée au sol, mèches de poil du coco...).
    a_solid = ndi.gaussian_filter(ndi.binary_erosion(solid, iterations=1).astype(np.float32), 0.8)
    a = a_solid + (1 - a_solid) * a_dark

    # 4. Couleur de premier plan, non mélangée au fond (nécessaire pour un vrai canal
    #    alpha : sans ça, un bord semi-transparent garderait une trace de blanc).
    f_dark = np.clip((rgb - (1 - a_dark[..., None]) * bg) / np.maximum(a_dark[..., None], 1e-3), 0, 1)
    premult = a_solid[..., None] * rgb + ((1 - a_solid) * a_dark)[..., None] * f_dark
    fg = np.clip(np.where(a[..., None] > 1e-3, premult / np.maximum(a[..., None], 1e-3), 0), 0, 1)
    return fg, a


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    srcs = sorted(SRC_DIR.glob("*.jpg")) + sorted(SRC_DIR.glob("*.png"))
    for src in srcs:
        rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
        fg, a = matte(rgb)
        rgba = np.dstack([fg, a])
        out = OUT_DIR / f"{src.stem}.png"
        Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA").save(out, optimize=True)
        print(f"{src.name:16s} -> {out.name}  ({out.stat().st_size / 1024:.0f} Ko, alpha moyen {a.mean():.2f})")


if __name__ == "__main__":
    main()
