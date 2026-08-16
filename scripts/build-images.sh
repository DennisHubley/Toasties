#!/usr/bin/env bash
# Builds web-optimized images from resources/ into site/assets/.
# Uses macOS `sips` only (no extra tooling required). Safe to re-run; overwrites outputs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/resources"
OUT="$ROOT/site/assets"
mkdir -p "$OUT/gallery" "$OUT/menu"

# jpg <src> <dest> <maxDimension> [quality]
jpg() {
  local src="$1" dest="$2" max="$3" q="${4:-82}"
  sips -s format jpeg -s formatOptions "$q" -Z "$max" "$src" --out "$dest" >/dev/null
  echo "  $(basename "$dest")  $(sips -g pixelWidth -g pixelHeight "$dest" | awk '/pixel/{printf "%s ", $2}') $(du -h "$dest" | cut -f1)"
}
# png <src> <dest> <maxDimension>   (keeps transparency)
png() {
  local src="$1" dest="$2" max="$3"
  sips -s format png -Z "$max" "$src" --out "$dest" >/dev/null
  echo "  $(basename "$dest")  $(sips -g pixelWidth -g pixelHeight "$dest" | awk '/pixel/{printf "%s ", $2}') $(du -h "$dest" | cut -f1)"
}

echo "Logo"
png "$SRC/Toasties Sticker - Final.png" "$OUT/logo.png" 900
png "$SRC/Toasties Sticker - Final.png" "$OUT/logo-sm.png" 320
png "$SRC/Toasties Sticker - Final.png" "$OUT/favicon.png" 96
png "$SRC/Toasties Sticker - Final.png" "$OUT/apple-touch-icon.png" 180
jpg "$SRC/0A742109-7CEB-4734-940C-5571A470F3E1.png" "$OUT/og-image.jpg" 1200 80

echo "Trailer"
png "$SRC/IMG_4308.png"  "$OUT/trailer-cutout.png" 900
jpg "$SRC/IMG_4517.jpeg" "$OUT/trailer.jpg" 1400 78
jpg "$SRC/IMG_4305.jpeg" "$OUT/trailer-2.jpg" 1400 78

echo "Food photos"
jpg "$SRC/6CD5313A-4D3F-4C05-BE29-35F20CFC8337.jpeg" "$OUT/hero.jpg" 1400 84
jpg "$SRC/6CD5313A-4D3F-4C05-BE29-35F20CFC8337.jpeg" "$OUT/gallery/cheese-pull.jpg" 1200
jpg "$SRC/7CBC85A5-149D-4CC0-A4D5-8425CA4974B4.jpeg" "$OUT/gallery/classic.jpg" 1200
jpg "$SRC/0671E490-7AF8-484E-9FB0-379818094DD8.jpeg" "$OUT/gallery/classic-2.jpg" 1200
jpg "$SRC/0A742109-7CEB-4734-940C-5571A470F3E1.png"  "$OUT/gallery/dilly.jpg" 1200
jpg "$SRC/23D224BB-D15A-4D68-94FB-3031F0B9D2BC.jpeg" "$OUT/gallery/sweet-and-spicy.jpg" 1200
jpg "$SRC/C506D7B9-5760-4CB6-B60D-97FCB9F5CEA5.jpeg" "$OUT/gallery/tomater.jpg" 1200
jpg "$SRC/59F19D8F-5BC1-446D-993B-913D8B59462F.jpeg" "$OUT/gallery/smores.jpg" 1200
jpg "$SRC/IMG_4293.jpeg"                              "$OUT/gallery/sweet-melt.jpg" 1200

echo "Menu graphics (printable)"
jpg "$SRC/Toasties - Horizontal Menu Update.png" "$OUT/menu/toasties-menu-horizontal.jpg" 2400 85
jpg "$SRC/Toasties Menu Vertical Update.png"     "$OUT/menu/toasties-menu-vertical.jpg"   2400 85

echo "Done → $OUT"
