#!/bin/sh
set -u

BASE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BIN_DIR="$BASE_DIR/.local/bin"

mkdir -p "$BIN_DIR"
export PATH="$BIN_DIR:$HOME/.local/bin:$PATH"

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

elif [ -x "$BIN_DIR/edge-tts" ]; then
    echo "OK edge-tts local: $BIN_DIR/edge-tts"

elif command -v python3 >/dev/null 2>&1 && command -v pip3 >/dev/null 2>&1; then
    echo "Instalando edge-tts Python..."
    python3 -m pip install --user --upgrade edge-tts >/tmp/l1ttl3boy_edge_tts.log 2>&1 || true

    if [ -x "$HOME/.local/bin/edge-tts" ]; then
        echo "OK edge-tts instalado."
    else
        echo "AVISO: edge-tts Python nao foi instalado."
    fi

elif [ -d "$BASE_DIR/node_modules/node-edge-tts" ]; then
    echo "Python/pip nao disponiveis."
    echo "Criando adaptador Node.js para edge-tts..."

    cat > "$BIN_DIR/edge-tts" <<'WRAPPER'
#!/bin/sh

BASE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"

exec node - "$@" "$BASE_DIR" <<'NODE'
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const baseDir = args.pop();

function getArg(name) {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : null;
}

const voice = getArg("--voice") || "pt-PT-DuarteNeural";
const inputFile = getArg("--file");
const outputFile = getArg("--write-media");

if (!inputFile || !outputFile) {
    console.error("Uso: edge-tts --voice VOZ --file TEXTO --write-media SAIDA");
    process.exit(2);
}

try {
    const { EdgeTTS } = require(path.join(baseDir, "node_modules", "node-edge-tts"));

    const texto = fs.readFileSync(inputFile, "utf8");

    const tts = new EdgeTTS({
        voice: voice
    });

    tts.ttsPromise(texto, outputFile)
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });

} catch (err) {
    console.error(err);
    process.exit(1);
}
NODE
WRAPPER

    chmod +x "$BIN_DIR/edge-tts"
    echo "OK adaptador edge-tts criado."

else
    echo "AVISO: nenhum metodo de edge-tts disponivel."
fi

echo "=========================================="
echo "Preparacao concluida"
echo "=========================================="
