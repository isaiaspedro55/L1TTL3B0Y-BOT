const { generateWAMessageFromContent, prepareWAMessageMedia } = require("@itsliaaa/baileys");

const API_ANIMEFIRE = "https://api.animefire.one";

const sessoesAnime = new Map();

function gerarSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function nomeAnime(anime) {
  return anime?.titles?.BR ||
         anime?.titles?.PT ||
         anime?.titles?.EN ||
         anime?.title ||
         "Anime";
}

function nomeEpisodio(ep) {
  return ep?.title || `Episódio ${ep?.number || "?"}`;
}

function descricaoAnime(anime) {
  const status = anime?.status || "Sem status";
  const audio = anime?.audio || "Áudio não informado";
  return `${status} • ${audio}`.slice(0, 72);
}

async function animeRequest(endpoint) {
  const r = await fetch(`${API_ANIMEFIRE}${endpoint}`, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  });

  const texto = await r.text();

  let json;

  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`Resposta inválida da AnimeFire: HTTP ${r.status}`);
  }

  if (!r.ok) {
    throw new Error(json?.message || `AnimeFire HTTP ${r.status}`);
  }

  return json;
}

async function pesquisarAnime(query) {
  const dados = await animeRequest(`/animes/pesquisar?q=${encodeURIComponent(query)}`);
  return dados?.data || dados?.results || [];
}

async function obterAnime(id) {
  const dados = await animeRequest(`/anime/${id}`);
  return dados?.data?.hero || dados?.data || dados;
}

async function obterEpisodio(id) {
  const dados = await animeRequest(`/episode/${id}`);
  return dados?.data || dados;
}

function montarRowsAnimes(resultados, sessionId) {
  return resultados.slice(0, 15).map((anime, index) => ({
    header: "",
    title: `${index + 1}. ${nomeAnime(anime)}`.slice(0, 72),
    description: descricaoAnime(anime),
    id: `anime_select ${sessionId} ${index}`
  }));
}

function montarRowsEpisodios(episodios, sessionId, pagina = 0) {
  const inicio = pagina * 15;
  const lista = episodios.slice(inicio, inicio + 15);

  return lista.map((ep, index) => ({
    header: "",
    title: `EP ${ep.number ?? inicio + index + 1} • ${nomeEpisodio(ep)}`.slice(0, 72),
    description: `${ep.audio || "Áudio"}${ep.season ? ` • Temporada ${ep.season}` : ""}`.slice(0, 72),
    id: `anime_episode ${sessionId} ${inicio + index}`
  }));
}

function montarRowsAudio(streams, sessionId) {
  return streams.map((stream, index) => {
    let titulo = "🎧 Áudio";

    if (stream.audio === "dublado") {
      titulo = "🇧🇷 Dublado";
    }

    if (stream.audio === "legendado") {
      titulo = "🇯🇵 Legendado";
    }

    const qualidade =
      Array.isArray(stream.qualities) && stream.qualities.length
        ? stream.qualities.join(", ")
        : "Qualidade disponível";

    return {
      header: "",
      title: titulo,
      description: qualidade.slice(0, 72),
      id: `anime_audio ${sessionId} ${index}`
    };
  });
}

async function enviarMenuAnime(clover, from, seloMeta, fotoUrl, resultados) {
  const sessionId = gerarSessionId();

  sessoesAnime.set(sessionId, {
    tipo: "anime",
    resultados,
    criadoEm: Date.now()
  });

  const rows = montarRowsAnimes(resultados, sessionId);

  let media = null;

  try {
    media = await prepareWAMessageMedia(
      {
        image: {
          url: fotoUrl || "https://animefire.one/"
        }
      },
      {
        upload: clover.waUploadToServer
      }
    );
  } catch {
    media = null;
  }

  const texto =
    `🎌 *ANIMEFIRE*\n\n` +
    `🔎 Resultado da pesquisa\n` +
    `📺 Foram encontrados *${resultados.length}* animes.\n\n` +
    `Escolha um anime para continuar.`;

  const mensagem = generateWAMessageFromContent(
    from,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: texto
            },
            footer: {
              text: "⚡️ SHAZAM ⚡️"
            },
            ...(media?.imageMessage
              ? {
                  header: {
                    title: "🎌 ANIMEFIRE",
                    hasMediaAttachment: true,
                    imageMessage: media.imageMessage
                  }
                }
              : {
                  header: {
                    title: "🎌 ANIMEFIRE",
                    hasMediaAttachment: false
                  }
                }),
            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: JSON.stringify({
                    title: "🎌 Escolher anime",
                    sections: [
                      {
                        title: "ANIMES ENCONTRADOS",
                        rows
                      }
                    ]
                  })
                }
              ]
            }
          }
        }
      }
    },
    {
      userJid: from,
      quoted: seloMeta
    }
  );

  await clover.relayMessage(
    from,
    mensagem.message,
    {
      messageId: mensagem.key.id
    }
  );

  return sessionId;
}

async function enviarMenuEpisodios(clover, from, seloMeta, anime, sessionId, pagina = 0) {
  const episodios = anime?.episodes || [];

  if (!episodios.length) {
    await clover.sendMessage(
      from,
      {
        text:
          `❌ *${nomeAnime(anime)}*\n\n` +
          `Nenhum episódio encontrado.`
      },
      {
        quoted: seloMeta
      }
    );

    return;
  }

  const totalPaginas = Math.ceil(episodios.length / 15);

  const rows = montarRowsEpisodios(
    episodios,
    sessionId,
    pagina
  );

  if (pagina > 0) {
    rows.push({
      header: "",
      title: "⬅️ Página anterior",
      description: `Página ${pagina}`,
      id: `anime_page ${sessionId} ${pagina - 1}`
    });
  }

  if (pagina < totalPaginas - 1) {
    rows.push({
      header: "",
      title: "➡️ Próxima página",
      description: `Página ${pagina + 2}`,
      id: `anime_page ${sessionId} ${pagina + 1}`
    });
  }

  const texto =
    `🎌 *${nomeAnime(anime)}*\n\n` +
    `📺 Total de episódios: *${episodios.length}*\n` +
    `📖 Página: *${pagina + 1}/${totalPaginas}*\n\n` +
    `Escolha o episódio.`;

  const mensagem = generateWAMessageFromContent(
    from,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: texto
            },
            footer: {
              text: "⚡️ SHAZAM ⚡️"
            },
            header: {
              title: "📺 EPISÓDIOS",
              hasMediaAttachment: false
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: JSON.stringify({
                    title: "📺 Escolher episódio",
                    sections: [
                      {
                        title: `EPISÓDIOS • ${pagina + 1}/${totalPaginas}`,
                        rows
                      }
                    ]
                  })
                }
              ]
            }
          }
        }
      }
    },
    {
      userJid: from,
      quoted: seloMeta
    }
  );

  await clover.relayMessage(
    from,
    mensagem.message,
    {
      messageId: mensagem.key.id
    }
  );
}

async function enviarMenuAudio(clover, from, seloMeta, episodio, sessionId, dados) {
  const streams = dados?.streams || [];

  if (!streams.length) {
    await clover.sendMessage(
      from,
      {
        text:
          `❌ *Nenhum stream disponível.*\n\n` +
          `📺 Episódio ${episodio.number || "?"}`
      },
      {
        quoted: seloMeta
      }
    );

    return;
  }

  sessoesAnime.set(sessionId, {
    ...sessoesAnime.get(sessionId),
    tipo: "audio",
    episodio,
    streams,
    criadoEm: Date.now()
  });

  const rows = montarRowsAudio(streams, sessionId);

  const animeNome =
    dados?.anime?.titles?.BR ||
    dados?.anime?.titles?.PT ||
    "Anime";

  const texto =
    `🎌 *${animeNome}*\n\n` +
    `📺 Episódio: *${episodio.number || "?"}*\n` +
    `📝 ${nomeEpisodio(episodio)}\n\n` +
    `🎧 Escolha o áudio:`;

  const mensagem = generateWAMessageFromContent(
    from,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: texto
            },
            footer: {
              text: "⚡️ SHAZAM ⚡️"
            },
            header: {
              title: "🎧 ÁUDIO",
              hasMediaAttachment: false
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: JSON.stringify({
                    title: "🎧 Escolher áudio",
                    sections: [
                      {
                        title: "ÁUDIO DISPONÍVEL",
                        rows
                      }
                    ]
                  })
                }
              ]
            }
          }
        }
      }
    },
    {
      userJid: from,
      quoted: seloMeta
    }
  );

  await clover.relayMessage(
    from,
    mensagem.message,
    {
      messageId: mensagem.key.id
    }
  );
}

async function processarComandoAnime(
  clover,
  from,
  info,
  sender,
  pushname,
  args,
  prefix,
  botName,
  donoName,
  fotomenu,
  seloMeta,
  selo2,
  reagir,
  reply,
  data,
  hora,
  config,
  isAdmin2,
  donoJid,
  obterMembroValido,
  donoLid,
  isBotAdmin
) {
  try {
    const query = Array.isArray(args)
      ? args.join(" ").trim()
      : String(args || "").trim();

    if (!query) {
      await reply(
        `🎌 *ANIMEFIRE*\n\n` +
        `Use:\n` +
        `${prefix}anime nome do anime\n\n` +
        `Exemplo:\n` +
        `${prefix}anime Naruto`
      );

      return;
    }

    if (reagir) {
      try {
        await reagir("🔎");
      } catch {}
    }

    const resultados = await pesquisarAnime(query);

    if (!resultados.length) {
      await reply(
        `❌ Nenhum anime encontrado para:\n*${query}*`
      );

      return;
    }

    await enviarMenuAnime(
      clover,
      from,
      seloMeta,
      fotomenu,
      resultados
    );

  } catch (erro) {
    console.error("[ANIME]", erro);

    await reply(
      `❌ *Erro no AnimeFire*\n\n${erro.message}`
    );
  }
}

async function processarInteracaoAnime(
  clover,
  from,
  info,
  id,
  seloMeta,
  reply
) {
  try {
    if (!id || typeof id !== "string") {
      return false;
    }

    if (id.startsWith("anime_select ")) {
      const partes = id.split(" ");

      const sessionId = partes[1];
      const index = Number(partes[2]);

      const sessao = sessoesAnime.get(sessionId);

      if (!sessao) {
        await reply(
          "⌛ Essa pesquisa expirou. Use o comando novamente."
        );

        return true;
      }

      const animeSelecionado = sessao.resultados[index];

      if (!animeSelecionado?.id) {
        await reply(
          "❌ Anime não encontrado."
        );

        return true;
      }

      await clover.sendMessage(
        from,
        {
          text: "⏳ Carregando episódios..."
        },
        {
          quoted: seloMeta
        }
      );

      const anime = await obterAnime(
        animeSelecionado.id
      );

      sessoesAnime.set(
        sessionId,
        {
          tipo: "episodios",
          anime,
          resultados: sessao.resultados,
          criadoEm: Date.now()
        }
      );

      await enviarMenuEpisodios(
        clover,
        from,
        seloMeta,
        anime,
        sessionId,
        0
      );

      return true;
    }

    if (id.startsWith("anime_page ")) {
      const partes = id.split(" ");

      const sessionId = partes[1];
      const pagina = Number(partes[2]);

      const sessao = sessoesAnime.get(sessionId);

      if (!sessao?.anime) {
        await reply(
          "⌛ Essa lista expirou. Faça a pesquisa novamente."
        );

        return true;
      }

      await enviarMenuEpisodios(
        clover,
        from,
        seloMeta,
        sessao.anime,
        sessionId,
        pagina
      );

      return true;
    }

    if (id.startsWith("anime_episode ")) {
      const partes = id.split(" ");

      const sessionId = partes[1];
      const index = Number(partes[2]);

      const sessao = sessoesAnime.get(sessionId);

      if (!sessao?.anime) {
        await reply(
          "⌛ Essa lista expirou. Faça a pesquisa novamente."
        );

        return true;
      }

      const episodio =
        sessao.anime.episodes?.[index];

      if (!episodio?.id) {
        await reply(
          "❌ Episódio não encontrado."
        );

        return true;
      }

      await clover.sendMessage(
        from,
        {
          text: "⏳ Carregando opções de áudio..."
        },
        {
          quoted: seloMeta
        }
      );

      const dados = await obterEpisodio(
        episodio.id
      );

      sessoesAnime.set(
        sessionId,
        {
          ...sessao,
          tipo: "audio",
          episodio,
          streams: dados?.streams || [],
          criadoEm: Date.now()
        }
      );

      await enviarMenuAudio(
        clover,
        from,
        seloMeta,
        episodio,
        sessionId,
        dados
      );

      return true;
    }

    if (id.startsWith("anime_audio ")) {
      const partes = id.split(" ");

      const sessionId = partes[1];
      const index = Number(partes[2]);

      const sessao = sessoesAnime.get(sessionId);

      if (!sessao?.streams) {
        await reply(
          "⌛ Essa seleção expirou. Faça a pesquisa novamente."
        );

        return true;
      }

      const stream = sessao.streams[index];

      if (!stream) {
        await reply(
          "❌ Stream não encontrado."
        );

        return true;
      }

      const url = stream.url;

      const animeNome =
        sessao.anime?.titles?.BR ||
        sessao.anime?.titles?.PT ||
        "Anime";

      const audio =
        stream.audio === "dublado"
          ? "🇧🇷 Dublado"
          : stream.audio === "legendado"
          ? "🇯🇵 Legendado"
          : `🎧 ${stream.audio || "Áudio"}`;

      await clover.sendMessage(
        from,
        {
          text:
            `🎬 *${animeNome}*\n\n` +
            `📺 Episódio ${sessao.episodio?.number || "?"}\n` +
            `${audio}\n` +
            `🎞️ ${stream.qualities?.join(", ") || "N/A"}\n\n` +
            `🔗 *Stream recebido:*\n` +
            `${url || "Nenhuma URL"}`
        },
        {
          quoted: seloMeta
        }
      );

      return true;
    }

    return false;

  } catch (erro) {
    console.error(
      "[ANIME INTERAÇÃO]",
      erro
    );

    await reply(
      `❌ *Erro no AnimeFire*\n\n${erro.message}`
    );

    return true;
  }
}

setInterval(() => {
  const agora = Date.now();

  for (const [id, sessao] of sessoesAnime) {
    if (
      agora - sessao.criadoEm >
      30 * 60 * 1000
    ) {
      sessoesAnime.delete(id);
    }
  }
}, 10 * 60 * 1000);

module.exports = {
  processarComandoAnime,
  processarInteracaoAnime
};
