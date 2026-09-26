#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Déclinaisons WebP des images du site, à relancer après avoir déposé ou
# remplacé un render (public/renders/) ou une photo d'expertise (public/expertise/).
#
# Les .jpg/.png restent les originaux ; le site ne sert que les .webp :
#   - renders :   <slug>.webp (1400 px) + <slug>-320/-640/-960.webp, choisies par
#                 le navigateur via srcset (voir components/BottleShot.vue) ;
#   - expertise : <nom>.webp en 640 px (vignette de survol, 260 px de large au plus)
#                 + <nom>-1200.webp pour les grandes photos (accueil, /studio).
#
# Prérequis : cwebp (brew install webp).
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

Q=80

for src in public/renders/*.{jpg,png}; do
  [ -e "$src" ] || continue
  base="${src%.*}"
  cwebp -quiet -q $Q -resize 1400 0 "$src" -o "$base.webp"
  for w in 320 640 960; do
    cwebp -quiet -q $Q -resize $w 0 "$src" -o "$base-$w.webp"
  done
done

for src in public/expertise/*.{jpg,png}; do
  [ -e "$src" ] || continue
  cwebp -quiet -q $Q -resize 640 0 "$src" -o "${src%.*}.webp"
  cwebp -quiet -q $Q -resize 1200 0 "$src" -o "${src%.*}-1200.webp"
done

du -ch public/renders/*.webp public/expertise/*.webp | tail -1
