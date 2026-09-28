const axios = require("axios");

const {
  prepareWAMessageMedia,
  generateWAMessageFromContent,
} = require("@itsliaaa/baileys");

/**
 * !soundcloud1
 * Pesquisa músicas no SoundCloud e mostra até 5 resultados
 * em carrossel com capa, copiar link e botão de download.
 *
 * O download é tratado pelo index.js através do ID:
 * soundcloud1baixar_<base64url>
 */

function codificarLink(valor) {
  return Buffer.from(
    typeof valor === "string" ? valor : JSON.stringify(valor),
    "utf8"
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodificarLink(valor) {
  try {
    return Buffer.from(
      String(valor)
        .replace(/-/g, "+")
        .replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
  } catch {
    return "";
  }
}

function formatarTrack(track) {
  return {
    title:
      track?.title ||
      track?.name ||
      "N/A",

    artist:
      track?.artist ||
      track?.username ||
      track?.user?.username ||
      "N/A",

    plays:
      track?.repro ||
      track?.plays ||
      track?.playCount ||
      "N/A",

    duration:
      track?.duration ||
      track?.timestamp ||
      "N/A",

    url:
      track?.url ||
      track?.link ||
      track?.permalink_url ||
      "",

    image:
      track?.image ||
      track?.cover ||
      track?.thumbnail ||
      track?.artwork_url ||
      "",
  };
}

async function enviarSoundcloud1(
  sock,
  jid,
  msg,
  query,
  seloBot,
  helpers = {}
) {
  const {
    reagir = async () => {},

    bBloco = (titulo, linhas) =>
      [titulo, ...linhas].join("\n"),

    bLine = (emoji, texto) =>
      `${emoji} ${texto}`,

    nomeBot = "⚡️SHAZAM⚡️",
  } = helpers;

  const texto = String(query || "").trim();

  if (!texto) {
    await sock.sendMessage(
      jid,
      {
        text: bBloco(
          "🎵 SOUNDCLOUD 1",
          [
            bLine(
              "💡",
              "Uso: !soundcloud1 [música/artista]"
            ),

            bLine(
              "🎧",
              "Ex: !soundcloud1 Calema"
            ),
          ]
        ),
      },
      {
        quoted: seloBot,
      }
    );

    return;
  }

  await reagir(sock, msg, "🔍");

  try {
    const response = await axios.get(
      `https://apis-starlights-team.koyeb.app/starlight/soundcloud-search?text=${encodeURIComponent(
        texto
      )}`,
      {
        timeout: 45000,
      }
    );

    const raw = Array.isArray(response.data)
      ? response.data.slice(0, 5)
      : [];

    const resultados = raw
      .map(formatarTrack)
      .filter((item) => item.url);

    if (!resultados.length) {
      await sock.sendMessage(
        jid,
        {
          text: bLine(
            "❌",
            "Nenhum resultado encontrado no SoundCloud."
          ),
        },
        {
          quoted: seloBot,
        }
      );

      await reagir(sock, msg, "❌");

      return;
    }

    const cards = [];

    for (let i = 0; i < resultados.length; i++) {
      const track = resultados[i];

      let header = {
        hasMediaAttachment: false,
      };

      if (track.image) {
        try {
          const media =
            await prepareWAMessageMedia(
              {
                image: {
                  url: track.image,
                },
              },
              {
                upload: sock.waUploadToServer,
              }
            );

          header = {
            hasMediaAttachment: true,
            imageMessage: media.imageMessage,
          };
        } catch {}
      }

      const dadosBotao = codificarLink({
        url: track.url,

        query:
          `${track.title} ${track.artist}`.trim(),
      });

      const textoCard =
        `╔═〔 🎧 SOUNDCLOUD ${i + 1} 〕═╗\n` +
        `║ 🎵 *Título:* ${track.title}\n` +
        `║ 👤 *Artista:* ${track.artist}\n` +
        `║ ▶️ *Reproduções:* ${track.plays}\n` +
        `║ ⏱️ *Duração:* ${track.duration}\n` +
        `╚════════════════════╝`;

      cards.push({
        header,

        body: {
          text: textoCard,
        },

        footer: {
          text:
            `${i + 1}/${resultados.length} | ${nomeBot}`,
        },

        nativeFlowMessage: {
          buttons: [
            {
              name: "cta_copy",

              buttonParamsJson:
                JSON.stringify({
                  display_text:
                    "📋 Copiar Link",

                  copy_code:
                    track.url,
                }),
            },

            {
              name: "quick_reply",

              buttonParamsJson:
                JSON.stringify({
                  display_text:
                    "🎧 Baixar Música",

                  id:
                    `soundcloud1baixar_${dadosBotao}`,
                }),
            },
          ],

          messageParamsJson:
            JSON.stringify({
              limited_use: true,
            }),
        },
      });
    }

    const content = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text:
                `🎵 *RESULTADOS DO SOUNDCLOUD:* _"${texto}"_\n\n` +
                `Desliza para escolher a música desejada. 👉`,
            },

            footer: {
              text: nomeBot,
            },

            carouselMessage: {
              cards,
            },
          },
        },
      },
    };

    const fullMsg =
      generateWAMessageFromContent(
        jid,
        content,
        {}
      );

    const bizNode = {
      tag: "biz",

      attrs: {},

      content: [
        {
          tag: "interactive",

          attrs: {
            type: "native_flow",
            v: "1",
          },

          content: [
            {
              tag: "native_flow",

              attrs: {
                name: "mixed",
                v: "9",
              },
            },
          ],
        },
      ],
    };

    await sock.relayMessage(
      jid,
      fullMsg.message,
      {
        messageId: fullMsg.key.id,

        additionalNodes: [
          bizNode,
        ],
      }
    );

    await reagir(sock, msg, "✅");

  } catch (error) {
    console.error(
      "❌ soundcloud1:",
      error?.message || error
    );

    await reagir(sock, msg, "❌");

    await sock.sendMessage(
      jid,
      {
        text: bBloco(
          "❌ SOUNDCLOUD 1",
          [
            bLine(
              "💡",
              "Erro ao pesquisar no SoundCloud."
            ),

            bLine(
              "🔴",
              error?.message ||
                "Erro desconhecido."
            ),
          ]
        ),
      },
      {
        quoted: seloBot,
      }
    );
  }
}

module.exports = {
  enviarSoundcloud1,
  decodificarLink,
};
