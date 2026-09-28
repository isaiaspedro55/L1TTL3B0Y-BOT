const {
  prepareWAMessageMedia,
  generateWAMessageFromContent
} = require("@itsliaaa/baileys");

function codificarLink(valor) {
  return Buffer.from(valor, "utf8").toString("base64url");
}

function decodificarLink(valor) {
  return Buffer.from(valor, "base64url").toString("utf8");
}

async function enviarPlay3(sock, jid, msg, texto, seloBot, helpers = {}) {
  const {
    reagir,
    bLine,
    nomeBot,
    pesquisarPlay3
  } = helpers;

  if (!texto || !texto.trim()) {
    await sock.sendMessage(
      jid,
      {
        text: bLine(
          "🎵",
          "Digita o nome da música ou artista.\n\nExemplo:\n!play3 Kelvin Momo"
        )
      },
      { quoted: seloBot }
    );
    return;
  }

  try {
    await reagir(sock, msg, "🔎");

    const resultados = await pesquisarPlay3(texto.trim());

    if (!resultados || !resultados.length) {
      await sock.sendMessage(
        jid,
        {
          text: bLine(
            "❌",
            "Não encontrei essa música."
          )
        },
        { quoted: seloBot }
      );

      await reagir(sock, msg, "❌");
      return;
    }

    const resultado = resultados[0];

    const dadosBotao = codificarLink(
      JSON.stringify({
        url: resultado.url,
        title: resultado.title || "Desconhecido",
        author: resultado.author || "Desconhecido",
        thumbnail: resultado.thumbnail || ""
      })
    );

    const textoResultado = [
      "🎵 *RESULTADO ENCONTRADO*",
      "",
      `🎧 *Título:* ${resultado.title || "Desconhecido"}`,
      `👤 *Canal:* ${resultado.author || "Desconhecido"}`,
      "",
      "Escolhe uma opção abaixo:"
    ].join("\n");

    const botoes = [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "🎧 BAIXAR ÁUDIO",
          id: `play3:audio:${dadosBotao}`
        })
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "🎥 BAIXAR VÍDEO",
          id: `play3:video:${dadosBotao}`
        })
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "▶️ YOUTUBE",
          id: `play3:youtube:${dadosBotao}`
        })
      }
    ];

    let mensagem;

    if (resultado.thumbnail) {
      try {
        const media = await prepareWAMessageMedia(
          {
            image: {
              url: resultado.thumbnail
            }
          },
          {
            upload: sock.waUploadToServer
          }
        );

        mensagem = generateWAMessageFromContent(
          jid,
          {
            viewOnceMessage: {
              message: {
                interactiveMessage: {
                  header: {
                    hasMediaAttachment: true,
                    ...media
                  },
                  body: {
                    text: textoResultado
                  },
                  footer: {
                    text: nomeBot || ""
                  },
                  nativeFlowMessage: {
                    buttons: botoes
                  }
                }
              }
            }
          },
          {
            userJid: jid
          }
        );

        await sock.relayMessage(
          jid,
          mensagem.message,
          {
            messageId: mensagem.key.id
          }
        );

        await reagir(sock, msg, "✅");
        return;

      } catch (e) {
        console.log(
          "⚠️ Play3 imagem:",
          e.message
        );
      }
    }

    await sock.sendMessage(
      jid,
      {
        text: textoResultado,
        buttons: botoes
      },
      { quoted: seloBot }
    );

    await reagir(sock, msg, "✅");

  } catch (e) {
    console.log(
      "❌ enviarPlay3:",
      e.message
    );

    await sock.sendMessage(
      jid,
      {
        text: bLine(
          "❌",
          "Ocorreu um erro ao procurar a música."
        )
      },
      { quoted: seloBot }
    );

    await reagir(sock, msg, "❌");
  }
}

module.exports = {
  enviarPlay3,
  decodificarLink
};
