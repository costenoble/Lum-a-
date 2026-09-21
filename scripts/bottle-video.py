#!/usr/bin/env python3
"""
Prépare une vidéo d'orbite de bouteille (générée avec MiniMax H3) pour le défilement
de components/BottleScroll.vue : la vidéo n'est pas lue, elle est « scrubée » — sa
position dans le temps suit celle du scroll.

Trois choses la distinguent d'une vidéo ordinaire :

  1. Le fond de studio est remplacé par la couleur exacte du fond du site (PAPER).
     Chaque image est détourée (bouteille, bouchon, étiquette, ombre au sol) puis
     recomposée sur PAPER. La vidéo reste une vidéo ordinaire, sans canal alpha ni
     shader : posée sur la page, elle s'y fond, sans cadre visible. Le verre clair
     est rendu pour un fond CLAIR ; sur un fond sombre il faudrait un autre traitement.

  2. Elle est un peu affûtée avant l'encodage (SHARPEN) et agrandie (OUT_W) : la source
     est en 768p et s'affiche plus grand que cela. On ne recrée pas de détail, mais on
     évite que le navigateur l'étire en la floutant, et on renforce ce qui est là (grain
     du bouchon, arêtes du verre).

  3. Des images clés très rapprochées (toutes les GOP images), sans images B. Une vidéo
     normale n'en a qu'une ou deux pour 240 images : pour afficher une image
     quelconque, le navigateur doit décoder depuis la dernière image clé, ce qui rend
     le défilement saccadé, surtout en remontant. Ici, il ne décode jamais plus de
     GOP - 1 images.

Le début est rogné (START_FRAME) : les premières images sont un zoom éclair depuis la
photo de départ (bouteille entière entre ses bandes blanches) vers le plan « bouchon
vu d'en haut », et portent le filigrane du fournisseur (MiniMax). À revoir avec les
conditions d'utilisation de la formule utilisée ; la vraie solution est de générer
sans filigrane (alors START_FRAME peut baisser).

Usage (depuis la racine du dépôt) :
    pip install numpy scipy pillow
    python3 scripts/bottle-video.py comete components/minimaxH3/bottle/lumea-scroll/videos/lumea_strawberry_v2.mp4

Produit components/minimaxH3/bottle/web/<nom>.mp4 et <nom>-poster.jpg (l'image de
départ, affichée avant que la vidéo soit chargée). Compter environ 2 minutes pour une
vidéo de 10 s. Requiert ffmpeg.

Variables d'environnement : START_FRAME, GOP, CRF, OUT_W, SHARPEN (0 pour désactiver).
Si le fond du site change (--paper dans assets/css/main.css), changer PAPER ici.
"""
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "components/minimaxH3/bottle/web"

# Couleur de fond du site (--paper : #f3f2ef).
SITE_PAPER = (0xF3, 0xF2, 0xEF)

# Une vidéo passe par le YUV : le navigateur ne la restitue jamais tout à fait à la
# couleur qu'on y a mise (ici, jusqu'à 3 niveaux sur 255 de plus). Sur un fond quasi
# blanc, c'est ce qui dessinerait un rectangle à peine plus clair que la page. On
# compense donc : cet écart a été MESURÉ dans Chrome (pixels d'une capture d'écran de
# la page, au bord de la vidéo, contre le fond de la page). À remesurer si la vidéo
# est encodée autrement, ou si le rendu diffère sur un autre navigateur.
DISPLAY_OFFSET = (-2, -2, -3)

PAPER = np.array([c + o for c, o in zip(SITE_PAPER, DISPLAY_OFFSET)], dtype=np.float32) / 255
# L'image d'attente est une image (JPEG), pas une vidéo : elle ne passe pas par le YUV
# de la même façon, et n'a pas besoin de compensation. Son fond est celui du site, exact.
POSTER_PAPER = np.array(SITE_PAPER, dtype=np.float32) / 255

START_FRAME = int(os.environ.get("START_FRAME", 8))
GOP = int(os.environ.get("GOP", 4))
CRF = int(os.environ.get("CRF", 24))
OUT_W = int(os.environ.get("OUT_W", 1706))  # 1364 x 1,25
SHARPEN = int(os.environ.get("SHARPEN", 1))
FPS = 24

# Écart au fond (en fraction) sous lequel un pixel est du vide, et au-dessus duquel il
# compte pleinement comme de l'ombre ou du verre ; entre les deux, transition douce.
DEADBAND = (0.02, 0.10)

# Marge autour de la bouteille où l'on n'estime pas le fond : le verre clair, les
# reflets et le halo blanc de la génération y débordent.
MARGIN = 36


def bg_estimate(rgb: np.ndarray, valid: np.ndarray, sigma: float = 45, down: int = 4) -> np.ndarray:
    """
    Le fond de studio, lisse, y compris derrière la bouteille : on lisse les seuls
    pixels de fond (convolution normalisée), à basse résolution pour rester rapide.
    Il varie dans l'image (vignettage, dégradé) et d'une image à l'autre.
    """
    h, w, _ = rgb.shape
    small = rgb[::down, ::down]
    m = valid[::down, ::down].astype(np.float32)
    num = np.stack([ndi.gaussian_filter(small[..., c] * m, sigma / down) for c in range(3)], -1)
    den = ndi.gaussian_filter(m, sigma / down)[..., None]
    fallback = np.median(rgb[valid], axis=0) if valid.any() else np.array([0.93, 0.93, 0.94], np.float32)
    low = np.where(den > 1e-3, num / np.maximum(den, 1e-4), fallback)
    up = ndi.zoom(low, (down, down, 1), order=1)
    out = np.empty_like(rgb)
    out[:] = fallback
    hh, ww = min(h, up.shape[0]), min(w, up.shape[1])
    out[:hh, :ww] = up[:hh, :ww]
    return out


def bake(rgb: np.ndarray, paper: np.ndarray = PAPER) -> np.ndarray:
    """rgb : float32 (H, W, 3) entre 0 et 1  ->  la même image, fond remplacé par `paper`."""
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)

    # 1. Ce qui est sûrement la bouteille : jus, étiquette, bouchon, ombres denses.
    strong = (sat > 0.30) | (lum < 0.50)
    solid = ndi.binary_fill_holes(ndi.binary_closing(strong, iterations=4))

    # 2. Le fond, estimé loin de la bouteille, puis « couleur vers alpha » contre lui :
    #    tout ce qui est plus sombre que le fond (ombre au sol, verre teinté, bords)
    #    devient de l'opacité ; ce qui est plus clair ou égal (halo, fond) devient du vide.
    near = ndi.binary_dilation(solid, iterations=MARGIN)
    bg = bg_estimate(rgb, ~near)
    ratio = np.clip(rgb / np.maximum(bg, 0.05), 0, 1.5)
    a_raw = np.clip(1 - ratio.min(axis=2), 0, 1)
    # Le studio a des dégradés doux (vignettage, reflets) que l'estimation du fond,
    # lissée, ne suit pas tout à fait : on les ignore jusqu'à ~2 % d'écart, puis on
    # laisse passer l'ombre progressivement (jusqu'à 10 %), pour que l'ombre au sol
    # s'efface en douceur au lieu de se couper net.
    t = np.clip((a_raw - DEADBAND[0]) / (DEADBAND[1] - DEADBAND[0]), 0, 1)
    a_dark = a_raw * (t * t * (3 - 2 * t))

    # 3. Alpha final : le noyau de la bouteille (bord adouci) plus ce translucide.
    a_solid = ndi.gaussian_filter(ndi.binary_erosion(solid, iterations=1).astype(np.float32), 0.9)
    a = a_solid + (1 - a_solid) * a_dark

    # 4. Couleur de premier plan (non mélangée au fond), recomposée sur PAPER.
    f_dark = np.clip((rgb - (1 - a_dark[..., None]) * bg) / np.maximum(a_dark[..., None], 1e-3), 0, 1)
    premult = a_solid[..., None] * rgb + ((1 - a_solid) * a_dark)[..., None] * f_dark
    fg = np.clip(np.where(a[..., None] > 1e-3, premult / np.maximum(a[..., None], 1e-3), 0), 0, 1)
    return np.clip(fg * a[..., None] + paper * (1 - a[..., None]), 0, 1)


def finish(img: Image.Image, out_h: int) -> Image.Image:
    """Agrandit et affûte une image cuite, comme chaque image de la vidéo."""
    img = img.resize((OUT_W, out_h), Image.LANCZOS)
    if SHARPEN:
        img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=110, threshold=2))
    return img


def write_poster(first_rgb: np.ndarray, out_h: int, dst: Path) -> None:
    """L'image d'attente : la première image, sur le fond exact du site."""
    img = Image.fromarray((bake(first_rgb, POSTER_PAPER) * 255 + 0.5).astype(np.uint8))
    # 4:4:4 et qualité haute : le fond, plat, doit rester exactement à la couleur du site.
    finish(img, out_h).save(dst, "JPEG", quality=92, subsampling=0)


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    name, src = sys.argv[1], Path(sys.argv[2])
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dst = OUT_DIR / f"{name}.mp4"

    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
         "-of", "csv=p=0", str(src)], capture_output=True, text=True, check=True).stdout.strip().split(",")
    w, h = int(probe[0]), int(probe[1])
    out_h = round(OUT_W * h / w / 2) * 2
    frame_bytes = w * h * 3

    decode = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", str(src),
         "-vf", f"trim=start_frame={START_FRAME},setpts=PTS-STARTPTS",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE)
    encode = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OUT_W}x{out_h}", "-r", str(FPS), "-i", "-",
         "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
         "-c:v", "libx264", "-preset", "slow", "-crf", str(CRF),
         "-x264-params", f"keyint={GOP}:min-keyint={GOP}:scenecut=0:bframes=0",
         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
         "-movflags", "+faststart", "-an", str(dst)],
        stdin=subprocess.PIPE)

    count = 0
    first = None
    while True:
        raw = decode.stdout.read(frame_bytes)
        if len(raw) < frame_bytes:
            break
        rgb = np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3).astype(np.float32) / 255
        if first is None:
            first = rgb.copy()
        img = finish(Image.fromarray((bake(rgb) * 255 + 0.5).astype(np.uint8)), out_h)
        encode.stdin.write(img.tobytes())
        count += 1
        if count % 25 == 0:
            print(f"  {count} images", flush=True)

    encode.stdin.close()
    encode.wait()
    decode.wait()

    poster = OUT_DIR / f"{name}-poster.jpg"
    write_poster(first, out_h, poster)

    keys = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-skip_frame", "nokey",
         "-show_entries", "frame=pts_time", "-of", "csv=p=0", str(dst)],
        capture_output=True, text=True, check=True).stdout.split()
    print(f"{count} images, {len(keys)} images clés -> {dst} ({dst.stat().st_size / 1e6:.2f} Mo), {poster.name}")


if __name__ == "__main__":
    main()
