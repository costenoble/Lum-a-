#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Prépare les vidéos de l'intro du prototype /monde (components/MondeIntro.vue).
# Comme la bouteille de BottleScroll, elles ne sont pas lues mais « scrubées » : leur
# position dans le temps suit le scroll. D'où :
#   - une image clé toutes les GOP images, sans images B : afficher n'importe quel
#     instant, dans les deux sens, ne demande jamais de décoder plus de GOP - 1 images ;
#   - 1280 px de large : assez pour un plein écran (l'image est floue et lumineuse par
#     nature), et décodable vite, y compris sur téléphone ;
#   - pas de son, +faststart.
# Produit components/minimaxH3/monde/web/<nom>.mp4 et <nom>-poster.jpg (première image).
#
# Usage (depuis la racine du dépôt) :
#   scripts/monde-video.sh components/minimaxH3/personnage/awakening.mp4 [autres.mp4...]
# Requiert ffmpeg.
# ---------------------------------------------------------------------------
set -euo pipefail

OUT="components/minimaxH3/monde/web"
GOP="${GOP:-4}"
CRF="${CRF:-31}"
WIDTH="${WIDTH:-1280}"
mkdir -p "$OUT"

for src in "$@"; do
  name="$(basename "${src%.*}")"
  ffmpeg -v error -y -i "$src" \
    -vf "scale=${WIDTH}:-2:flags=lanczos,format=yuv420p" \
    -c:v libx264 -preset slow -crf "$CRF" \
    -x264-params "keyint=${GOP}:min-keyint=${GOP}:scenecut=0:bframes=0" \
    -movflags +faststart -an "$OUT/$name.mp4"
  ffmpeg -v error -y -i "$OUT/$name.mp4" -frames:v 1 -q:v 3 "$OUT/$name-poster.jpg"
  ls -l "$OUT/$name.mp4" "$OUT/$name-poster.jpg" | awk '{ printf "%-48s %.2f Mo\n", $NF, $5 / 1e6 }'
done
