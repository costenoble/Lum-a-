#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Prépare la carte du Monde Luméa (pages/monde.vue, components/MondeCarte.vue).
#
# La carte source (components/minimaxH3/monde/carte.jpg) ne fait que 1306 px de large :
# floue en plein écran, et plus encore quand on zoome sur un lieu. Elle est donc
# agrandie x4 par IA avec Real-ESRGAN (modèle généraliste realesrgan-x4plus : le modèle
# « anime » durcit les contours et crispe les mascottes), puis déclinée en WebP.
# L'IA n'invente pas de vrai détail : une carte générée directement en haute
# définition restera meilleure — il suffira de la mettre à la place et de relancer.
#
# Usage (depuis la racine du dépôt) :
#   REALESRGAN=/chemin/vers/realesrgan-ncnn-vulkan scripts/monde-carte.sh [source]
# Real-ESRGAN (version ncnn, binaire macOS natif) :
#   https://github.com/xinntao/Real-ESRGAN/releases (realesrgan-ncnn-vulkan-*-macos.zip)
# Sans REALESRGAN, la source est déclinée telle quelle (pour une carte déjà en HD).
# Requiert cwebp (brew install webp).
# ---------------------------------------------------------------------------
set -euo pipefail

SRC="${1:-components/minimaxH3/monde/carte.jpg}"
OUT="public/monde"
mkdir -p "$OUT"

master="$SRC"
if [ -n "${REALESRGAN:-}" ]; then
  master="$(mktemp -t carte).png"
  "$REALESRGAN" -i "$SRC" -o "$master" -n realesrgan-x4plus -s 4
fi

# Trois tailles, choisies par le navigateur (srcset) selon la place affichée.
for w in 1600 2600 4096; do
  cwebp -quiet -q 82 -resize "$w" 0 "$master" -o "$OUT/carte-$w.webp"
done

ls -l "$OUT"/carte-*.webp | awk '{ printf "%-32s %.2f Mo\n", $NF, $5 / 1e6 }'
