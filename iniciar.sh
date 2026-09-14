#!/bin/sh
set -e

BASE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

sh "$BASE_DIR/instalar_dependencias.sh"

export PATH="$BASE_DIR/.local/bin:$HOME/.local/bin:$PATH"

echo "=========================================="
echo "A verificar dependencias..."
echo "=========================================="

if command -v yt-dlp >/dev/null 2>&1; then
    echo "OK yt-dlp: $(command -v yt-dlp)"
else
    echo "ERRO: yt-dlp nao encontrado."
fi

if command -v ffmpeg >/dev/null 2>&1; then
    echo "OK ffmpeg: $(command -v ffmpeg)"
else
    echo "ERRO: ffmpeg nao encontrado."
fi

if command -v edge-tts >/dev/null 2>&1; then
    echo "OK edge-tts: $(command -v edge-tts)"
else
    echo "AVISO: edge-tts nao encontrado."
fi

echo "=========================================="
echo "Iniciando L1TTL3B0Y..."
echo "=========================================="

cd "$BASE_DIR"

exec node index.js
