#!/bin/sh
# Run once before building the native app. No APK is created by this script.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OUT="$ROOT/app/libs/sherpa-onnx-2.0.1.aar"
URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/v2.0.1/sherpa-onnx-2.0.1.aar"
HASH="a8d09d1d32f3eb8520482c6d3d43fae674681c5b050385967c70a3c2c9bf0ee7"
mkdir -p "$(dirname "$OUT")"
if [ -f "$OUT" ] && printf '%s  %s\n' "$HASH" "$OUT" | sha256sum -c - >/dev/null 2>&1; then
  echo "Verified sherpa-onnx Android SDK already installed; skipping download."
  exit 0
fi
TMP="$OUT.part"
trap 'rm -f "$TMP"' EXIT HUP INT TERM
curl --fail --location --retry 2 --silent --show-error "$URL" --output "$TMP"
printf '%s  %s\n' "$HASH" "$TMP" | sha256sum -c -
mv -f "$TMP" "$OUT"
echo "sherpa-onnx v2.0.1 Android SDK installed and checksum verified."
