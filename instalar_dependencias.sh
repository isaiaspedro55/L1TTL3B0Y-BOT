#!/bin/sh
set -u

BASE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BIN_DIR="$BASE_DIR/.local/bin"

mkdir -p "$BIN_DIR"

echo "=========================================="
echo "L1TTL3B0Y - Preparando dependencias"
echo "=========================================="

# yt-dlp
if command -v yt-dlp >/dev/null 2>&1; then
    echo "OK yt-dlp: $(command -v yt-dlp)"
else
    echo "Instalando yt-dlp..."

    ARCH="$(uname -m 2>/dev/null || echo unknown)"

    case "$ARCH" in
        x86_64|amd64)
            URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"
            ;;
        aarch64|arm64)
            URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64"
            ;;
        armv7l|armv7)
            URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_armv7l"
            ;;
        *)
            URL=""
            echo "Arquitetura nao suportada: $ARCH"
            ;;
    esac

    if [ -n "$URL" ]; then
        if command -v curl >/dev/null 2>&1; then
            curl -L --fail --retry 3 "$URL" -o "$BIN_DIR/yt-dlp"
        elif command -v wget >/dev/null 2>&1; then
            wget -O "$BIN_DIR/yt-dlp" "$URL"
        else
            echo "ERRO: curl/wget nao disponivel."
        fi
    fi

    if [ -f "$BIN_DIR/yt-dlp" ]; then
        chmod +x "$BIN_DIR/yt-dlp"
        echo "OK yt-dlp instalado localmente."
    fi
fi

# ffmpeg
if command -v ffmpeg >/dev/null 2>&1; then
    echo "OK ffmpeg: $(command -v ffmpeg)"
else
    echo "AVISO: ffmpeg nao esta disponivel."
fi

# edge-tts
if command -v edge-tts >/dev/null 2>&1; then
    echo "OK edge-tts: $(command -v edge-tts)"
elif command -v python3 >/dev/null 2>&1 && command -v pip3 >/dev/null 2>&1; then
    echo "Instalando edge-tts..."
    python3 -m pip install --user --upgrade edge-tts >/tmp/l1ttl3boy_edge_tts.log 2>&1 || true

    if [ -x "$HOME/.local/bin/edge-tts" ]; then
        echo "OK edge-tts instalado."
    else
        echo "AVISO: edge-tts nao foi instalado."
    fi
else
    echo "AVISO: python3/pip3 nao disponiveis."
fi

echo "=========================================="
echo "Preparacao concluida"
echo "=========================================="
