#!/usr/bin/env bash
set -euo pipefail

log () { gum log --structured --time kitchen --level "${1}" "${2}"; }
info () { log "info" "${1}"; }

EXTENSION_NAME="gh-interactive"
OUTPUT_DIR="dist"
FLAGS="--compile --minify --bytecode"

ci=false
install=false
release_tag=""

for arg in "$@"; do
  case "$arg" in
    --ci) ci=true ;;
    --install) install=true ;;
    *) release_tag="$arg" ;;
  esac
done

if $ci; then
  if [[ -z "$release_tag" ]]; then
    echo "usage: $0 --ci <release-tag>" >&2
    exit 1
  fi

  # Setup output directory
  rm -rf $OUTPUT_DIR
  mkdir -p $OUTPUT_DIR

  bun build index.ts --target=bun-darwin-x64       $FLAGS --outfile "$OUTPUT_DIR/${EXTENSION_NAME}_${release_tag}_darwin-amd64"
  bun build index.ts --target=bun-darwin-arm64     $FLAGS --outfile "$OUTPUT_DIR/${EXTENSION_NAME}_${release_tag}_darwin-arm64"
  bun build index.ts --target=bun-linux-x64        $FLAGS --outfile "$OUTPUT_DIR/${EXTENSION_NAME}_${release_tag}_linux-amd64"
  bun build index.ts --target=bun-linux-arm64      $FLAGS --outfile "$OUTPUT_DIR/${EXTENSION_NAME}_${release_tag}_linux-arm64"
  bun build index.ts --target=bun-linux-x64-musl   $FLAGS --outfile "$OUTPUT_DIR/${EXTENSION_NAME}_${release_tag}_linux-amd64-musl"
  bun build index.ts --target=bun-linux-arm64-musl $FLAGS --outfile "$OUTPUT_DIR/${EXTENSION_NAME}_${release_tag}_linux-arm64-musl"
  bun build index.ts --target=bun-windows-x64      $FLAGS --outfile "$OUTPUT_DIR/${EXTENSION_NAME}_${release_tag}_windows-amd64.exe"
  bun build index.ts --target=bun-windows-arm64    $FLAGS --outfile "$OUTPUT_DIR/${EXTENSION_NAME}_${release_tag}_windows-arm64.exe"
else
  info "Building ${EXTENSION_NAME}"
  gum spin --title "Building..." -- \
    bun build index.ts $FLAGS --outfile "${EXTENSION_NAME}"

  if $install; then
    info "Removing old installation"
    gh extension remove $EXTENSION_NAME
    info "Installing ${EXTENSION_NAME}"
    gh extension install .
    info "Success"
  fi
fi
