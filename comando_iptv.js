const { generateWAMessageFromContent, prepareWAMessageMedia } = require('@systemzero/baileys');

const URL_PAINEL = 'https://shazam-iptv.onrender.com';

const IPTV_CAPA = 'https://antmedia.io/wp-content/uploads/2026/07/IPTV-1024x512.webp';

async function enviarIPTV(sock, jid, seloBot) {

  const link = URL_PAINEL;

  let imageMessage = null;

  try {
    const media = await prepareWAMessageMedia(
      {
        image: { url: IPTV_CAPA }
      },
      {
        upload: sock.waUploadToServer
      }
    );

    imageMessage = media?.imageMessage || null;

  } catch (e) {
    console.log('⚠️ Erro ao carregar capa IPTV:', e.message);
  }

  const cards = [
    {
      header: imageMessage
        ? {
            hasMediaAttachment: true,
            imageMessage
          }
        : {
            hasMediaAttachment: false
          },

      body: {
        text:
          '📺 *SHAZAM IPTV*\n' +
          '🌐 Televisão online\n' +
          '🟢 PAINEL DISPONÍVEL'
      },

      footer: {
        text: '⚡️ SHAZAM IPTV'
      },

      nativeFlowMessage: {
        buttons: [
          {
            name: 'cta_url',

            buttonParamsJson: JSON.stringify({
              display_text: '🔗 Abrir link',
              url: link,
              merchant_url: link
            })
          }
        ]
      }
    }
  ];

  const msgObj = generateWAMessageFromContent(
    jid,
    {
      interactiveMessage: {

        body: {
          text:
            '📺 *SHAZAM IPTV*\n\n' +
            'Assista aos seus canais favoritos diretamente pelo nosso painel.'
        },

        footer: {
          text: '⚡️ SHAZAM IPTV'
        },

        carouselMessage: {
          cards
        }

      }
    },
    {
      userJid: sock.user?.id,
      quoted: seloBot
    }
  );

  await sock.relayMessage(
    jid,
    msgObj.message,
    {
      messageId: msgObj.key.id,

      additionalNodes: [
        {
          tag: 'biz',
          attrs: {},
          content: [
            {
              tag: 'interactive',
              attrs: {
                type: 'native_flow',
                v: '1'
              },
              content: [
                {
                  tag: 'native_flow',
                  attrs: {
                    v: '9',
                    name: 'mixed'
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  );

  return msgObj;
}

module.exports = {
  enviarIPTV
};
