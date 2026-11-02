#!/usr/bin/env bash
# Renders the Chrome Web Store images into store/out/ with headless Chrome:
# three 1280x800 screenshots, the 440x280 promo tile and the 128x128 store icon.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
out="$root/store/out"
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT

mkdir -p "$out"
[[ -f "$root/dist/vendor/mermaid.min.js" ]] || node "$root/scripts/build.mjs"

shot() {
  local scene=$1 size=$2 file=$3
  "$chrome" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --user-data-dir="$profile" \
    --window-size="$size" --virtual-time-budget=8000 \
    --screenshot="$out/$file" "file://$root/store/demo.html#$scene" 2>/dev/null
  echo "$out/$file"
}

shot light 1280,800 1-diagrams-light.png
shot dark 1280,800 2-dark-mode.png
shot viewer 1280,800 3-full-screen.png
shot tile 440,280 promo-tile-440x280.png

cp "$root/src/icons/icon128.png" "$out/store-icon-128.png"
echo "$out/store-icon-128.png"
