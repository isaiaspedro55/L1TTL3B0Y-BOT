// ════════════════════════════════════════════════
// ✅ comando_anime.js — Download de episódios de anime (!ep)
// ════════════════════════════════════════════════
// Depende de uma API própria configurada pelo operador do bot,
// via variável de ambiente ANIME_EPISODE_API. Este módulo NUNCA
// inventa nem embute nenhuma fonte/URL de episódios.
//
// Contrato esperado da API (GET):
//   GET {ANIME_EPISODE_API}?anime=<nome>&episode=<numero>
//   Resposta JSON esperada:
//   {
//     "anime": "Naruto",
//     "episode": 1,
//     "title": "Naruto - Episódio 1",
//     "url": "https://.../naruto-001.mp4",
//     "mimetype": "video/mp4"
//   }
// ════════════════════════════════════════════════

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { exec } = require("child_process");

const PASTA_ANIMES = "./downloads/animes";
const LIMITE_BYTES = 90 * 1024 * 1024; // 90 MB

function garantirPasta() {
  try {
    fs.ensureDirSync(PASTA_ANIMES);
  } catch (e) {
    console.error("❌ [ep] Não consegui criar a pasta de animes:", e.message);
  }
}

// Aceita apenas inteiros positivos (ex: "1", "12", "1000")
function validarEpisodio(valor) {
  if (!/^\d+$/.test(String(valor).trim())) return null;
  const n = parseInt(valor, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function limparArquivo(caminho) {
  if (!caminho) return;
  try {
    if (fs.existsSync(caminho)) fs.removeSync(caminho);
  } catch (e) {
    console.error("⚠️ [ep] Falha ao apagar arquivo temporário:", e.message);
  }
}

function encontrarArquivoGerado(pasta, prefixoNome) {
  try {
    const arquivos = fs.readdirSync(pasta);
    const achado = arquivos.find((f) => f.startsWith(prefixoNome));
    return achado ? path.join(pasta, achado) : null;
  } catch (e) {
    return null;
  }
}

// Consulta a API de episódios configurada pelo operador (nunca inventada aqui)
async function buscarEpisodio(animeNome, numeroEpisodio) {
  const apiUrl = process.env.ANIME_EPISODE_API;
  if (!apiUrl) {
    throw new Error("ANIME_EPISODE_API_NAO_CONFIGURADA");
  }
  let resposta;
  try {
    resposta = await axios.get(apiUrl, {
      params: { anime: animeNome, episode: numeroEpisodio },
      timeout: 20000,
    });
  } catch (e) {
    if (e.code === "ECONNABORTED") throw new Error("TIMEOUT_API");
    if (e.response && e.response.status === 404) throw new Error("EPISODIO_NAO_ENCONTRADO");
    throw new Error("ERRO_API: " + (e.message || "desconhecido"));
  }
  const data = resposta && resposta.data;
  if (!data || typeof data !== "object") throw new Error("RESPOSTA_API_INVALIDA");
  if (!data.url || !/^https?:\/\//i.test(data.url)) throw new Error("URL_INVALIDA");
  return data;
}

// Baixa via yt-dlp (para fontes que ele suporta, ex: extractors genéricos/HLS)
function baixarViaYtDlp(url, destinoBase, ytdlpCmd, ffmpegCmd) {
  return new Promise((resolve, reject) => {
    const saida = `${destinoBase}.%(ext)s`;
    const partesCmd = [
      ytdlpCmd,
      `-f "best[height<=720][ext=mp4]/best[height<=720]/best"`,
      "--no-playlist --no-warnings --no-check-certificate",
      ffmpegCmd ? `--ffmpeg-location "${ffmpegCmd}"` : "",
      "--merge-output-format mp4 --retries 2",
      `-o "${saida}"`,
      `"${url}"`,
    ].filter(Boolean);
    const cmd = partesCmd.join(" ");
    exec(cmd, { timeout: 180000, maxBuffer: 200 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ [ep] yt-dlp falhou:", (stderr || err.message || "").slice(0, 500));
        return reject(new Error("ERRO_YTDLP"));
      }
      resolve();
    });
  });
}

// Baixa directamente via HTTP (para fontes que servem um .mp4 directo)
async function baixarDireto(url, destinoFinal) {
  let resposta;
  try {
    resposta = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 120000,
      maxContentLength: 200 * 1024 * 1024,
      maxBodyLength: 200 * 1024 * 1024,
    });
  } catch (e) {
    console.error("❌ [ep] Download directo falhou:", e.message);
    throw new Error("ERRO_DOWNLOAD");
  }
  try {
    fs.writeFileSync(destinoFinal, Buffer.from(resposta.data));
  } catch (e) {
    console.error("❌ [ep] Falha ao gravar arquivo:", e.message);
    throw new Error("ERRO_GRAVACAO");
  }
}

/**
 * Processa o comando !ep <anime> <episódio>
 * ctx deve conter as dependências já existentes no index.js, para não duplicar nada:
 *   sock, jid, msg, seloBot, args, sender,
 *   bLine, bBloco, reagir, enviarVideo, addXP,
 *   CONFIG, YTDLP_CMD, FFMPEG_CMD
 */
async function processarComandoEp(ctx) {
  const {
    sock, jid, msg, seloBot, args, sender,
    bLine, bBloco, reagir, enviarVideo, addXP,
    CONFIG, YTDLP_CMD, FFMPEG_CMD,
  } = ctx;

  garantirPasta();

  // ── Validações de uso ──
  if (!args || args.length === 0) {
    await sock.sendMessage(jid, {
      text: bBloco("🍥 ANIME DOWNLOADER", [
        bLine("💡", `Uso: *${CONFIG.PREFIXO}ep* [anime] [episódio]`),
        bLine("💡", `Ex: *${CONFIG.PREFIXO}ep* Naruto 1`),
      ]),
    }, { quoted: seloBot });
    return;
  }

  if (args.length < 2) {
    await sock.sendMessage(jid, {
      text: bLine("❌", "Falta o número do episódio. Ex: *" + CONFIG.PREFIXO + "ep* " + args.join(" ") + " 1"),
    }, { quoted: seloBot });
    return;
  }

  const numeroStr = args[args.length - 1];
  const nomeAnime = args.slice(0, -1).join(" ").trim();
  const numeroEpisodio = validarEpisodio(numeroStr);

  if (!nomeAnime) {
    await sock.sendMessage(jid, { text: bLine("❌", "Nome do anime inválido.") }, { quoted: seloBot });
    return;
  }
  if (numeroEpisodio === null) {
    await sock.sendMessage(jid, { text: bLine("❌", "Número de episódio inválido.") }, { quoted: seloBot });
    return;
  }

  // ── Resposta inicial ──
  await reagir(sock, msg, "🍥");
  await sock.sendMessage(jid, {
    text: bBloco("🍥 ANIME DOWNLOADER", [
      bLine("🎌", `Anime: *${nomeAnime}*`),
      bLine("🎬", `Episódio: *${numeroEpisodio}*`),
      "",
      bLine("🔎", "Procurando episódio..."),
      bLine("⏳", "Aguarde..."),
    ]),
  }, { quoted: seloBot });

  // ── Busca na API configurada ──
  let dadosEpisodio;
  try {
    dadosEpisodio = await buscarEpisodio(nomeAnime, numeroEpisodio);
  } catch (e) {
    console.error("❌ [ep] Busca falhou:", e.message);
    let msgErro = "❌ Não encontrei este episódio na fonte configurada.";
    if (e.message === "ANIME_EPISODE_API_NAO_CONFIGURADA") {
      msgErro = "❌ A fonte de episódios não está configurada neste bot. Contacta o dono.";
    } else if (e.message === "TIMEOUT_API") {
      msgErro = "❌ A fonte de episódios demorou demasiado a responder. Tenta novamente.";
    } else if (e.message === "EPISODIO_NAO_ENCONTRADO") {
      msgErro = "❌ Episódio não encontrado. Confirma o nome do anime e o número do episódio.";
    } else if (e.message === "URL_INVALIDA") {
      msgErro = "❌ A fonte devolveu uma URL de vídeo inválida.";
    } else if (e.message === "RESPOSTA_API_INVALIDA") {
      msgErro = "❌ A fonte de episódios devolveu uma resposta inválida.";
    }
    await sock.sendMessage(jid, { text: bLine("❌", msgErro.replace("❌ ", "")) }, { quoted: seloBot });
    await reagir(sock, msg, "❌");
    return;
  }

  const animeExibido = dadosEpisodio.anime || nomeAnime;
  const episodioExibido = dadosEpisodio.episode || numeroEpisodio;
  const tituloExibido = dadosEpisodio.title || `${animeExibido} - Episódio ${episodioExibido}`;

  await sock.sendMessage(jid, {
    text: bBloco("🎌 " + animeExibido, [
      bLine("🎬", `Episódio ${episodioExibido}`),
      "",
      bLine("⬇️", "Baixando..."),
      bLine("📺", "Qualidade máxima: 720p"),
    ]),
  }, { quoted: seloBot });

  // ── Download ──
  const timestamp = Date.now();
  const nomeSeguro = nomeAnime.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "anime";
  const nomeBase = `${timestamp}_${nomeSeguro}_EP${numeroEpisodio}`;
  const destinoBase = path.join(PASTA_ANIMES, nomeBase);
  let arquivoFinal = null;

  try {
    const preferirYtDlp = dadosEpisodio.usarYtDlp === true || /\.m3u8($|\?)/i.test(dadosEpisodio.url);
    if (preferirYtDlp) {
      await baixarViaYtDlp(dadosEpisodio.url, destinoBase, YTDLP_CMD, FFMPEG_CMD);
      arquivoFinal = encontrarArquivoGerado(PASTA_ANIMES, nomeBase);
    } else {
      arquivoFinal = `${destinoBase}.mp4`;
      await baixarDireto(dadosEpisodio.url, arquivoFinal);
    }
  } catch (e) {
    console.error("❌ [ep] Download falhou:", e.message);
    limparArquivo(arquivoFinal);
    await sock.sendMessage(jid, {
      text: bLine("❌", "Erro ao baixar o episódio. Tenta novamente mais tarde."),
    }, { quoted: seloBot });
    await reagir(sock, msg, "❌");
    return;
  }

  if (!arquivoFinal || !fs.existsSync(arquivoFinal)) {
    await sock.sendMessage(jid, { text: bLine("❌", "Arquivo não encontrado após o download.") }, { quoted: seloBot });
    await reagir(sock, msg, "❌");
    return;
  }

  // ── Validação do arquivo ──
  let tamanhoBytes;
  try {
    tamanhoBytes = fs.statSync(arquivoFinal).size;
  } catch (e) {
    limparArquivo(arquivoFinal);
    await sock.sendMessage(jid, { text: bLine("❌", "Arquivo corrompido ou inacessível.") }, { quoted: seloBot });
    await reagir(sock, msg, "❌");
    return;
  }

  if (tamanhoBytes === 0) {
    limparArquivo(arquivoFinal);
    await sock.sendMessage(jid, { text: bLine("❌", "Arquivo corrompido (vazio).") }, { quoted: seloBot });
    await reagir(sock, msg, "❌");
    return;
  }

  if (tamanhoBytes > LIMITE_BYTES) {
    limparArquivo(arquivoFinal);
    await sock.sendMessage(jid, {
      text: bLine("❌", "O episódio ultrapassa o limite de 90 MB."),
    }, { quoted: seloBot });
    await reagir(sock, msg, "❌");
    return;
  }

  const tamanhoMB = (tamanhoBytes / (1024 * 1024)).toFixed(1);
  await sock.sendMessage(jid, {
    text: bBloco("🍥 " + animeExibido, [
      bLine("🎬", `Episódio: ${episodioExibido}`),
      bLine("📦", `Tamanho: ${tamanhoMB} MB`),
    ]),
  }, { quoted: seloBot });

  // ── Envio ──
  try {
    await enviarVideo(sock, jid, arquivoFinal, bLine("🍥", tituloExibido), [sender], seloBot);
    await sock.sendMessage(jid, { text: bLine("✅", "Episódio enviado com sucesso!") }, { quoted: seloBot });
    await reagir(sock, msg, "✅");
    if (typeof addXP === "function") {
      try { addXP(sender, 5); } catch {}
    }
  } catch (e) {
    console.error("❌ [ep] Falha no envio:", e.message);
    await sock.sendMessage(jid, { text: bLine("❌", "Falha ao enviar o episódio.") }, { quoted: seloBot });
    await reagir(sock, msg, "❌");
  } finally {
    limparArquivo(arquivoFinal);
  }
}

module.exports = { processarComandoEp };

