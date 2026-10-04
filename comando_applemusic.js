const {
  prepareWAMessageMedia,
  generateWAMessageFromContent
} = require("@itsliaaa/baileys");

const API_APPLE = "https://nexus-light-7uyb.onrender.com";

function codificarLink(valor) {
  return Buffer.from(valor, "utf8").toString("base64url");
}

function decodificarLink(valor) {
  return Buffer.from(valor, "base64url").toString("utf8");
}

async function baixarCapa(url) {
  if (!url) return null;

  try {
    const resposta = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!resposta.ok) return null;

    const buffer = Buffer.from(
      await resposta.arrayBuffer()
    );

    return buffer.length ? buffer : null;

  } catch (e) {
    console.log(
      "⚠️ Apple Music capa:",
      e.message
    );

    return null;
  }
}

function obterLinkApple(texto) {
  try {
    const url = new URL(texto);

    if (
      /^music\.apple\.com$/i.test(url.hostname) ||
      /\.music\.apple\.com$/i.test(url.hostname)
    ) {
      return texto;
    }

    return null;

  } catch {
    return null;
  }
}

async function enviarAppleMusic(
  sock,
  jid,
  msg,
  texto,
  seloBot,
  helpers = {}
) {
  const {
    reagir,
    bLine,
    nomeBot = ""
  } = helpers || {};

  texto =
    typeof texto === "string"
      ? texto
      : texto?.text ||
        texto?.body ||
        texto?.caption ||
        "";

  texto = String(texto).trim();

  texto = texto
    .replace(
      /^[.!:\/]applemusic(?:\s+|$)/i,
      ""
    )
    .trim();

  if (!texto) {
    await sock.sendMessage(
      jid,
      {
        text: bLine(
          "🎵",
          "Digita o nome da música ou artista.\n\nExemplo:\n.applemusic Calema"
        )
      },
      { quoted: seloBot }
    );

    return;
  }

  try {
    await reagir(
      sock,
      msg,
      "🔎"
    );

    let link = obterLinkApple(
      texto
    );

    let track = null;

    /*
     * 🔎 PESQUISA APPLE MUSIC
     */
    if (!link) {

      const respostaPesquisa =
        await fetch(
          `${API_APPLE}/search/applemusic?q=${encodeURIComponent(texto)}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0"
            }
          }
        );

      if (!respostaPesquisa.ok) {
        throw new Error(
          `API pesquisa HTTP ${respostaPesquisa.status}`
        );
      }

      const pesquisa =
        await respostaPesquisa.json();

      track =
        pesquisa?.results?.[0];

      link =
        track?.link ||
        track?.apple_music_url ||
        track?.url;

      if (
        !track ||
        !link
      ) {
        await sock.sendMessage(
          jid,
          {
            text: bLine(
              "❌",
              "Não encontrei essa música no Apple Music."
            )
          },
          { quoted: seloBot }
        );

        await reagir(
          sock,
          msg,
          "❌"
        );

        return;
      }
    }

    /*
     * 🎧 API DE DOWNLOAD / INFORMAÇÕES
     */
    const respostaDownload =
      await fetch(
        `${API_APPLE}/download/applemusic?url=${encodeURIComponent(link)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

    if (!respostaDownload.ok) {
      throw new Error(
        `API download HTTP ${respostaDownload.status}`
      );
    }

    const download =
      await respostaDownload.json();

    const data =
      download?.data ||
      download?.result ||
      {};

    if (
      !data ||
      typeof data !== "object"
    ) {
      throw new Error(
        "API não retornou os dados da música."
      );
    }

    /*
     * 📀 DADOS DA MÚSICA
     */
    const info = {

      title:
        data.title ||
        track?.title ||
        "Desconhecido",

      artist:
        data.artist ||
        track?.artist ||
        "Desconhecido",

      album:
        data.album ||
        track?.album ||
        "Desconhecido",

      duration:
        data.duration ||
        track?.duration ||
        "N/A",

      genre:
        data.genre ||
        track?.genre ||
        "N/A",

      explicit:
        data.explicit ??
        track?.explicit ??
        false,

      cover:
        data.thumbnail ||
        data.cover ||
        data.image ||
        data.cover_url ||
        data.artwork ||
        track?.cover ||
        track?.thumbnail ||
        track?.image ||
        track?.artwork ||
        ""
    };

    /*
     * 🖼️ BAIXAR CAPA
     */
    const capa =
      await baixarCapa(
        info.cover
      );

    /*
     * 📝 TEXTO DA MENSAGEM
     */
    const textoResultado = [
      "🎵 *APPLE MUSIC*",
      "",
      `🗣 *Título:* ${info.title}`,
      `👤 *Artista:* ${info.artist}`,
      `💿 *Álbum:* ${info.album}`,
      `⏱️ *Duração:* ${info.duration}`,
      `🎧 *Gênero:* ${info.genre}`,
      `🔞 *Explícita:* ${info.explicit ? "Sim" : "Não"}`,
      "",
      "Escolhe uma opção abaixo:"
    ].join("\n");

    /*
     * 🔐 CODIFICAR DADOS DO BOTÃO
     */
    const dadosBotao =
      codificarLink(
        JSON.stringify({
          url: link,
          title: info.title,
          artist: info.artist,
          album: info.album,
          thumbnail: info.cover || ""
        })
      );

    /*
     * 🔘 BOTÕES
     */
    const botoes = [
      {
        name: "quick_reply",

        buttonParamsJson:
          JSON.stringify({
            display_text:
              "🎧 BAIXAR MÚSICA",

            id:
              `applebaixar_${dadosBotao}`
          })
      },

      {
        name: "cta_copy",

        buttonParamsJson:
          JSON.stringify({
            display_text:
              "🔗 COPIAR LINK",

            copy_code:
              link
          })
      }
    ];

    /*
     * 🖼️ MENSAGEM INTERATIVA COM CAPA
     */
    if (capa) {

      try {

        const media =
          await prepareWAMessageMedia(
            {
              image: capa
            },
            {
              upload:
                sock.waUploadToServer
            }
          );

        const mensagem =
          generateWAMessageFromContent(
            jid,
            {
              viewOnceMessage: {
                message: {
                  interactiveMessage: {

                    header: {
                      hasMediaAttachment:
                        true,

                      ...media
                    },

                    body: {
                      text:
                        textoResultado
                    },

                    footer: {
                      text:
                        nomeBot || ""
                    },

                    nativeFlowMessage: {
                      buttons:
                        botoes
                    }
                  }
                }
              }
            },
            {
              userJid:
                jid
            }
          );

        await sock.relayMessage(
          jid,
          mensagem.message,
          {
            messageId:
              mensagem.key.id
          }
        );

        await reagir(
          sock,
          msg,
          "✅"
        );

        return;

      } catch (e) {

        console.log(
          "⚠️ Apple Music imagem:",
          e.message
        );
      }
    }

    /*
     * 📱 FALLBACK SEM CAPA
     */
    await sock.sendMessage(
      jid,
      {
        text:
          `${textoResultado}\n\n🔗 ${link}`,

        buttons:
          botoes
      },
      {
        quoted:
          seloBot
      }
    );

    await reagir(
      sock,
      msg,
      "✅"
    );

  } catch (e) {

    console.log(
      "❌ enviarAppleMusic:",
      e.message
    );

    await sock.sendMessage(
      jid,
      {
        text: bLine(
          "❌",
          "Ocorreu um erro ao procurar a música no Apple Music."
        )
      },
      {
        quoted:
          seloBot
      }
    );

    await reagir(
      sock,
      msg,
      "❌"
    );
  }
}

module.exports = {
  enviarAppleMusic,
  codificarLink,
  decodificarLink
};
