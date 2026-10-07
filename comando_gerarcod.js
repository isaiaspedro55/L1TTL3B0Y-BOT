const fetch = global.fetch || require('node-fetch');

const URL_IPTV = process.env.IPTV_API_URL || 'https://shazam-iptv.onrender.com';

const DURACOES_VALIDAS = new Set([
  '1h',
  '6h',
  '12h',
  '24h',
  '1d',
  '3d',
  '7d',
  '30d'
]);

async function gerarCodigoIPTV(duracao) {
  duracao = String(duracao || '').trim().toLowerCase();

  if (!DURACOES_VALIDAS.has(duracao)) {
    return {
      ok: false,
      erro: 'DURAÇÃO_INVALIDA'
    };
  }

  if (!process.env.ADMIN_KEY) {
    return {
      ok: false,
      erro: 'ADMIN_KEY_AUSENTE'
    };
  }

  const resposta = await fetch(`${URL_IPTV}/api/admin/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      adminKey: process.env.ADMIN_KEY,
      duration: duracao
    })
  });

  let dados;

  try {
    dados = await resposta.json();
  } catch {
    return {
      ok: false,
      erro: `RESPOSTA_INVALIDA_${resposta.status}`
    };
  }

  if (!resposta.ok || !dados.ok) {
    return {
      ok: false,
      erro: dados.error || `HTTP_${resposta.status}`
    };
  }

  return {
    ok: true,
    dados
  };
}

async function enviarGerarCod(sock, jid, duracao, seloBot) {
  try {
    const resultado = await gerarCodigoIPTV(duracao);

    if (!resultado.ok) {
      if (resultado.erro === 'DURAÇÃO_INVALIDA') {
        await sock.sendMessage(jid, {
          text:
            '⚡️ *SHAZAM IPTV*\n\n' +
            '❌ Duração inválida.\n\n' +
            'Use uma destas opções:\n' +
            '• `:gerarcod 1h`\n' +
            '• `:gerarcod 6h`\n' +
            '• `:gerarcod 12h`\n' +
            '• `:gerarcod 24h`\n' +
            '• `:gerarcod 1d`\n' +
            '• `:gerarcod 3d`\n' +
            '• `:gerarcod 7d`\n' +
            '• `:gerarcod 30d`'
        }, { quoted: seloBot });

        return;
      }

      if (resultado.erro === 'ADMIN_KEY_AUSENTE') {
        throw new Error('ADMIN_KEY não configurada no .env do bot.');
      }

      throw new Error(resultado.erro);
    }

    const d = resultado.dados.user;

    const texto =
      '⚡️ *SHAZAM IPTV — NOVO ACESSO*\n\n' +
      `👤 *Usuário:* \`${d.username}\`\n` +
      `🔑 *Senha:* \`${d.password}\`\n` +
      `⏳ *Duração:* ${d.duration || duracao}\n` +
      `📅 *Criado:* ${d.createdAt || '-'}\n` +
      `⌛ *Expira:* ${d.expiresAt || '-'}\n\n` +
      `🌐 *Painel:*\n${URL_IPTV}\n\n` +
      '🔐 Acesso gerado pelo administrador.';

    await sock.sendMessage(jid, {
      text: texto
    }, { quoted: seloBot });

  } catch (erro) {
    console.error('[GERARCOD IPTV]', erro);

    await sock.sendMessage(jid, {
      text:
        '⚡️ *SHAZAM IPTV*\n\n' +
        '❌ Não foi possível gerar o acesso.\n' +
        '💡 Verifique se o servidor IPTV está online.'
    }, { quoted: seloBot });
  }
}

module.exports = {
  enviarGerarCod
};
