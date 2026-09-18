// ════════════════════════════════════════════════
// ✅ COMANDO !XO — Jogo da Velha interactivo (2 jogadores, mesmo ecrã)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const XO_HTML = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Jogo da Velha</title>
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; user-select: none; }
  html, body {
    margin: 0; padding: 0; min-height: 100%;
    background: radial-gradient(circle at 50% 0%, #1a1830, #08070f 70%);
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    color: #f0eefc;
  }
  .wrap { width: 100%; max-width: 380px; padding: 14px; }
  .hud {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 12px; padding: 10px 14px; border-radius: 14px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    font-size: 14px;
  }
  .turno { display:flex; align-items:center; gap:8px; font-weight:700; }
  .tag { padding:3px 10px; border-radius: 10px; font-weight:800; }
  .tag.x { background: rgba(124,252,145,.18); color:#7CFC91; }
  .tag.o { background: rgba(255,158,158,.18); color:#ff9e9e; }
  .placar { font-size: 12px; opacity:.8; }
  #board {
    display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);
    gap: 8px; aspect-ratio: 1/1; border-radius: 16px; padding: 8px;
    background: rgba(255,255,255,0.04);
    box-shadow: 0 10px 30px rgba(0,0,0,.5);
  }
  .cel {
    border-radius: 12px; background: rgba(255,255,255,0.06);
    display:flex; align-items:center; justify-content:center;
    font-size: 44px; font-weight: 800;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .cel.x { color: #7CFC91; }
  .cel.o { color: #ff9e9e; }
  .cel.vencedora { background: rgba(255,215,120,0.18); border-color: #ffd778; }
  .msg { margin-top: 12px; text-align:center; font-size: 13px; opacity:.85; min-height: 18px; }
  .btns { margin-top: 10px; display:flex; justify-content:center; gap:10px; }
  .btns button {
    padding: 10px 20px; border-radius: 20px; border: none; font-size: 13px; font-weight:700;
    background: linear-gradient(180deg,#5a4ea3,#332c66); color:#fff;
  }
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.75);
    display: none; align-items: center; justify-content: center; flex-direction: column;
    text-align: center; gap: 10px; z-index: 5;
  }
  .overlay.show { display: flex; }
  .overlay h2 { margin: 0; font-size: 26px; color: #ffd778; }
  .overlay button {
    margin-top: 8px; padding: 12px 28px; border: none; border-radius: 30px;
    background: #ffd778; color: #2a1a0d; font-size: 16px; font-weight: 800;
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="hud">
    <div class="turno">Vez: <span class="tag x" id="turnoTag">X</span></div>
    <div class="placar">🏆 X <b id="placarX">0</b> — O <b id="placarO">0</b></div>
  </div>
  <div id="board"></div>
  <div class="msg" id="msg">Toca numa casa para jogar.</div>
  <div class="btns">
    <button id="resetBtn">🔄 Novo Jogo</button>
  </div>
</div>
<div class="overlay" id="overlay">
  <h2 id="overlayTitle">🏆 Vitória!</h2>
  <div id="overlayMsg"></div>
  <button id="startBtn">Jogar de novo</button>
</div>
<script>
(function(){
  const LINHAS_VENCEDORAS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  let cels, turno, fim, placar;
  placar = { X: 0, O: 0 };

  function iniciar(){
    cels = Array(9).fill(null);
    turno = 'X';
    fim = false;
    render();
    document.getElementById('turnoTag').textContent = turno;
    document.getElementById('turnoTag').className = 'tag ' + turno.toLowerCase();
    document.getElementById('msg').textContent = 'Toca numa casa para jogar.';
  }

  function checarVencedor(){
    for (const [a,b,c] of LINHAS_VENCEDORAS){
      if (cels[a] && cels[a]===cels[b] && cels[b]===cels[c]) return { vencedor: cels[a], linha: [a,b,c] };
    }
    if (cels.every(c => c)) return { vencedor: 'empate', linha: [] };
    return null;
  }

  function render(vencedorInfo){
    const el = document.getElementById('board');
    el.innerHTML = '';
    cels.forEach((v,i) => {
      const c = document.createElement('div');
      c.className = 'cel' + (v ? ' ' + v.toLowerCase() : '');
      if (vencedorInfo && vencedorInfo.linha.includes(i)) c.classList.add('vencedora');
      c.textContent = v || '';
      c.addEventListener('click', () => jogar(i));
      el.appendChild(c);
    });
  }

  function jogar(i){
    if (fim || cels[i]) return;
    cels[i] = turno;
    const resultado = checarVencedor();
    if (resultado){
      fim = true;
      render(resultado.vencedor !== 'empate' ? resultado : null);
      if (resultado.vencedor === 'empate'){
        document.getElementById('overlayTitle').textContent = '🤝 Empate!';
        document.getElementById('overlayMsg').textContent = 'Ninguém venceu desta vez.';
      } else {
        placar[resultado.vencedor]++;
        document.getElementById('placarX').textContent = placar.X;
        document.getElementById('placarO').textContent = placar.O;
        document.getElementById('overlayTitle').textContent = '🏆 ' + resultado.vencedor + ' venceu!';
        document.getElementById('overlayMsg').textContent = 'Toca em jogar de novo para continuar.';
      }
      document.getElementById('overlay').classList.add('show');
      return;
    }
    turno = turno === 'X' ? 'O' : 'X';
    document.getElementById('turnoTag').textContent = turno;
    document.getElementById('turnoTag').className = 'tag ' + turno.toLowerCase();
    render();
  }

  document.getElementById('resetBtn').onclick = iniciar;
  document.getElementById('startBtn').onclick = () => {
    document.getElementById('overlay').classList.remove('show');
    iniciar();
  };

  iniciar();
})();
</script>
</body>
</html>`;

async function enviarXO(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "xo_" + Date.now(),
    sections: [
      {
        view_model: {
          primitive: {
            __typename: "GenAIaeacdsnwHtmlPrimitive",
            payload: XO_HTML,
            trusted_sources: ["nixel.dev"]
          },
          __typename: "GenAISingleLayoutViewModel",
          height: "full",
          full_screen: true
        }
      }
    ]
  };

  const content = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: "❌⭕ Jogo da Velha" }],
          unifiedResponse: {
            data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64")
          },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
            forwardOrigin: 4
          }
        }
      }
    }
  };

  const fullMsg = generateWAMessageFromContent(jid, content, {
    userJid: sock.authState?.creds?.me?.id || sock.user?.id,
    timestamp: new Date(),
  });

  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}

module.exports = { enviarXO };

