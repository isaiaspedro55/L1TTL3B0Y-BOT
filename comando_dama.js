// ════════════════════════════════════════════════
// ✅ COMANDO !DAMA — Jogo de Damas interativo (2 jogadores, mesmo ecrã)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const DAMA_HTML = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Damas</title>
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; user-select: none; }
  html, body {
    margin: 0; padding: 0; min-height: 100%;
    background: radial-gradient(circle at 50% 0%, #2a1f16, #120b06 70%);
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    color: #f5e9da;
  }
  .wrap { width: 100%; max-width: 420px; padding: 12px; }
  .hud {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 8px; padding: 10px 14px; border-radius: 14px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    font-size: 14px;
  }
  .turno { display:flex; align-items:center; gap:8px; font-weight:600; }
  .bolinha { width:16px; height:16px; border-radius:50%; display:inline-block; border: 2px solid rgba(255,255,255,.5); }
  .bolinha.preta { background:#1b1b1b; }
  .bolinha.branca { background:#eee0c8; }
  #board {
    width: 100%; aspect-ratio: 1/1; display: grid;
    grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr);
    border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.5);
    border: 3px solid #5a3d24;
  }
  .sq { position: relative; display:flex; align-items:center; justify-content:center; }
  .sq.light { background:#e8d3ab; }
  .sq.dark { background:#7a4a26; }
  .sq.hl { box-shadow: inset 0 0 0 3px #7CFC91; }
  .sq.mv::after {
    content:''; position:absolute; width:22%; height:22%; border-radius:50%;
    background: rgba(124,252,145,0.75);
  }
  .peca {
    width: 76%; height: 76%; border-radius: 50%;
    box-shadow: 0 3px 6px rgba(0,0,0,.5), inset 0 -3px 6px rgba(0,0,0,.35), inset 0 3px 6px rgba(255,255,255,.15);
    display:flex; align-items:center; justify-content:center; font-size: 16px;
  }
  .peca.preta { background: linear-gradient(160deg,#3a3a3a,#0d0d0d); }
  .peca.branca { background: linear-gradient(160deg,#fff6e6,#d8c39a); color:#5a3d24; }
  .msg { margin-top: 12px; text-align:center; font-size: 13px; opacity:.85; min-height: 18px; }
  .btns { margin-top: 10px; display:flex; justify-content:center; gap:10px; }
  .btns button {
    padding: 10px 20px; border-radius: 20px; border: none; font-size: 13px; font-weight:600;
    background: linear-gradient(180deg,#8a5a30,#5a3d24); color:#fff;
  }
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.75);
    display: none; align-items: center; justify-content: center; flex-direction: column;
    text-align: center; gap: 10px; z-index: 5;
  }
  .overlay.show { display: flex; }
  .overlay h2 { margin: 0; font-size: 26px; color: #f0c987; }
  .overlay button {
    margin-top: 8px; padding: 12px 28px; border: none; border-radius: 30px;
    background: #c98a3f; color: #2a1a0d; font-size: 16px; font-weight: 700;
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="hud">
    <div class="turno">Vez: <span class="bolinha preta" id="turnoBolinha"></span> <span id="turnoTexto">Pretas</span></div>
    <div>🎯 <span id="placar">12 x 12</span></div>
  </div>
  <div id="board"></div>
  <div class="msg" id="msg">Toca numa peça e depois na casa de destino.</div>
  <div class="btns">
    <button id="resetBtn">🔄 Reiniciar</button>
  </div>
</div>
<div class="overlay" id="overlay">
  <h2 id="overlayTitle">🏆 Fim de Jogo</h2>
  <div id="overlayMsg"></div>
  <button id="startBtn">Jogar de novo</button>
</div>
<script>
(function(){
  const N = 8;
  let board, turno, selecionada, jogadasValidas, capturaObrigatoriaDeCadeia;

  function novoTabuleiro(){
    const b = Array.from({length:N}, () => Array(N).fill(null));
    for (let y=0;y<3;y++){
      for (let x=0;x<N;x++){
        if ((x+y)%2===1) b[y][x] = { cor:'preta', dama:false };
      }
    }
    for (let y=5;y<8;y++){
      for (let x=0;x<N;x++){
        if ((x+y)%2===1) b[y][x] = { cor:'branca', dama:false };
      }
    }
    return b;
  }

  function iniciar(){
    board = novoTabuleiro();
    turno = 'preta';
    selecionada = null;
    jogadasValidas = [];
    capturaObrigatoriaDeCadeia = null;
    atualizarHud();
    render();
    document.getElementById('msg').textContent = 'Toca numa peça e depois na casa de destino.';
  }

  function atualizarHud(){
    document.getElementById('turnoBolinha').className = 'bolinha ' + turno;
    document.getElementById('turnoTexto').textContent = turno === 'preta' ? 'Pretas' : 'Brancas';
    let pretas = 0, brancas = 0;
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){
      const p = board[y][x];
      if (p) { if (p.cor==='preta') pretas++; else brancas++; }
    }
    document.getElementById('placar').textContent = pretas + ' x ' + brancas;
    if (pretas===0 || brancas===0){
      fimDeJogo(pretas===0 ? 'Brancas' : 'Pretas');
    }
  }

  function fimDeJogo(vencedor){
    document.getElementById('overlayTitle').textContent = '🏆 ' + vencedor + ' venceram!';
    document.getElementById('overlayMsg').textContent = 'Toca em jogar de novo para recomeçar.';
    document.getElementById('overlay').classList.add('show');
  }

  function dentro(x,y){ return x>=0 && x<N && y>=0 && y<N; }

  function direcoesDe(peca){
    if (peca.dama) return [[-1,-1],[-1,1],[1,-1],[1,1]];
    return peca.cor === 'preta' ? [[1,-1],[1,1]] : [[-1,-1],[-1,1]];
  }

  // Devolve { simples:[{x,y}], capturas:[{x,y,capturada:{x,y}}] }
  function movimentosDe(x,y){
    const peca = board[y][x];
    if (!peca) return { simples:[], capturas:[] };
    const simples = [], capturas = [];
    const dirs = peca.dama ? [[-1,-1],[-1,1],[1,-1],[1,1]] : direcoesDe(peca);
    dirs.forEach(([dy,dx]) => {
      const nx = x+dx, ny = y+dy;
      if (dentro(nx,ny) && !board[ny][nx]) simples.push({x:nx,y:ny});
      const mx = x+dx, my = y+dy, jx = x+dx*2, jy = y+dy*2;
      if (dentro(jx,jy) && board[my] && board[my][mx] && board[my][mx].cor !== peca.cor && !board[jy][jx]) {
        capturas.push({x:jx, y:jy, capturada:{x:mx,y:my}});
      }
    });
    return { simples, capturas };
  }

  function existeCapturaObrigatoria(cor){
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){
      const p = board[y][x];
      if (p && p.cor===cor){
        const mv = movimentosDe(x,y);
        if (mv.capturas.length) return true;
      }
    }
    return false;
  }

  function render(){
    const el = document.getElementById('board');
    el.innerHTML = '';
    const obrigatorio = existeCapturaObrigatoria(turno);
    for (let y=0;y<N;y++){
      for (let x=0;x<N;x++){
        const sq = document.createElement('div');
        sq.className = 'sq ' + (((x+y)%2===0) ? 'light' : 'dark');
        sq.dataset.x = x; sq.dataset.y = y;

        if (selecionada && selecionada.x===x && selecionada.y===y) sq.classList.add('hl');
        if (jogadasValidas.some(m => m.x===x && m.y===y)) sq.classList.add('mv');

        const peca = board[y][x];
        if (peca){
          const pd = document.createElement('div');
          pd.className = 'peca ' + peca.cor;
          if (peca.dama) pd.textContent = '♛';
          sq.appendChild(pd);
        }
        sq.addEventListener('click', () => onClickCasa(x,y,obrigatorio));
        el.appendChild(sq);
      }
    }
  }

  function onClickCasa(x,y,obrigatorio){
    const peca = board[y][x];

    // Seleccionar peça própria
    if (peca && peca.cor === turno){
      const mv = movimentosDe(x,y);
      let disponiveis = mv.capturas;
      if (!disponiveis.length && !obrigatorio) disponiveis = mv.simples;
      if (obrigatorio && !mv.capturas.length) {
        document.getElementById('msg').textContent = 'Há captura obrigatória com outra peça!';
        return;
      }
      selecionada = { x, y };
      jogadasValidas = disponiveis;
      render();
      return;
    }

    // Tentar mover para casa alvo
    if (selecionada){
      const alvo = jogadasValidas.find(m => m.x===x && m.y===y);
      if (alvo){
        const p = board[selecionada.y][selecionada.x];
        board[y][x] = p;
        board[selecionada.y][selecionada.x] = null;
        let capturou = false;
        if (alvo.capturada){
          board[alvo.capturada.y][alvo.capturada.x] = null;
          capturou = true;
        }
        // Promoção a dama
        if ((p.cor==='preta' && y===N-1) || (p.cor==='branca' && y===0)) p.dama = true;

        // Cadeia de capturas
        if (capturou){
          const seguinte = movimentosDe(x,y);
          if (seguinte.capturas.length){
            selecionada = { x, y };
            jogadasValidas = seguinte.capturas;
            document.getElementById('msg').textContent = 'Captura em cadeia! Continua a jogar.';
            render();
            atualizarHud();
            return;
          }
        }

        selecionada = null;
        jogadasValidas = [];
        turno = turno === 'preta' ? 'branca' : 'preta';
        document.getElementById('msg').textContent = 'Toca numa peça e depois na casa de destino.';
        render();
        atualizarHud();
        return;
      }
    }

    // Clique inválido: desseleciona
    selecionada = null;
    jogadasValidas = [];
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

async function enviarDama(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "dama_" + Date.now(),
    sections: [
      {
        view_model: {
          primitive: {
            __typename: "GenAIaeacdsnwHtmlPrimitive",
            payload: DAMA_HTML,
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
          submessages: [{ messageType: 2, messageText: "🔴 Damas" }],
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

module.exports = { enviarDama };

