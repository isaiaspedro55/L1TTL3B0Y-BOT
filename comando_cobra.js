// ════════════════════════════════════════════════
// ✅ COMANDO !COBRA — Jogo da Cobra (Snake) interativo
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const COBRA_HTML = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Cobra</title>
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; user-select: none; }
  html, body {
    margin: 0; padding: 0; height: 100%;
    background: radial-gradient(circle at 50% 0%, #1b2a1b, #05130a 70%);
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    overflow: hidden; color: #eaffea;
  }
  .wrap { width: 100%; max-width: 420px; padding: 12px; }
  .hud {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 8px; padding: 8px 14px; border-radius: 14px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  }
  .hud b { color: #7CFC91; font-size: 15px; }
  .hud span { font-size: 12px; opacity: .75; }
  #board {
    width: 100%; aspect-ratio: 1 / 1; border-radius: 16px;
    background: #0c1f10;
    border: 2px solid #234d29;
    box-shadow: inset 0 0 30px rgba(0,0,0,.5), 0 10px 30px rgba(0,0,0,.4);
    display: block;
  }
  .controls {
    margin-top: 14px; display: grid;
    grid-template-columns: 64px 64px 64px; grid-template-rows: 56px 56px 56px;
    gap: 8px; justify-content: center;
  }
  .controls button {
    font-size: 22px; border-radius: 14px; border: none; color: #eaffea;
    background: linear-gradient(180deg, #2e6b3a, #1c4324);
    box-shadow: 0 4px 0 #0e2513, 0 6px 12px rgba(0,0,0,.4);
    active:translateY(2px);
  }
  .controls button:active { transform: translateY(3px); box-shadow: 0 1px 0 #0e2513; }
  #up { grid-column: 2; grid-row: 1; }
  #left { grid-column: 1; grid-row: 2; }
  #pause { grid-column: 2; grid-row: 2; font-size: 16px; }
  #right { grid-column: 3; grid-row: 2; }
  #down { grid-column: 2; grid-row: 3; }
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.72);
    display: none; align-items: center; justify-content: center; flex-direction: column;
    text-align: center; gap: 10px; z-index: 5;
  }
  .overlay.show { display: flex; }
  .overlay h2 { margin: 0; font-size: 26px; color: #7CFC91; }
  .overlay button {
    margin-top: 8px; padding: 12px 28px; border: none; border-radius: 30px;
    background: #3ea34f; color: #fff; font-size: 16px; font-weight: 600;
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="hud">
    <div>🐍 <b id="score">0</b></div>
    <span id="recorde">Recorde: 0</span>
  </div>
  <canvas id="board"></canvas>
  <div class="controls">
    <button id="up">⬆️</button>
    <button id="left">⬅️</button>
    <button id="pause">⏸️</button>
    <button id="right">➡️</button>
    <button id="down">⬇️</button>
  </div>
</div>
<div class="overlay" id="overlay">
  <h2 id="overlayTitle">🐍 Cobra</h2>
  <div id="overlayMsg" style="opacity:.85">Desliza ou usa as setas. Come as maçãs 🍎!</div>
  <button id="startBtn">Jogar</button>
</div>
<script>
(function(){
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const cols = 18, rows = 18;
  let cell = 0;
  function resize(){
    const size = canvas.clientWidth || canvas.parentElement.clientWidth;
    canvas.width = size; canvas.height = size;
    cell = size / cols;
    draw();
  }
  window.addEventListener('resize', resize);

  let snake, dir, nextDir, food, score, recorde, alive, paused, loopId;
  recorde = parseInt(localStorage.getItem('cobra_recorde') || '0', 10) || 0;
  document.getElementById('recorde').textContent = 'Recorde: ' + recorde;

  function novoJogo(){
    snake = [{x:9,y:9},{x:8,y:9},{x:7,y:9}];
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    score = 0; alive = true; paused = false;
    document.getElementById('score').textContent = score;
    colocarComida();
    draw();
  }

  function colocarComida(){
    let tentativa;
    do {
      tentativa = { x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows) };
    } while (snake.some(s => s.x===tentativa.x && s.y===tentativa.y));
    food = tentativa;
  }

  function passo(){
    if (!alive || paused) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0) head.x = cols-1;
    if (head.x >= cols) head.x = 0;
    if (head.y < 0) head.y = rows-1;
    if (head.y >= rows) head.y = 0;
    if (snake.some(s => s.x===head.x && s.y===head.y)) {
      return fimDeJogo();
    }
    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) {
      score += 10;
      document.getElementById('score').textContent = score;
      colocarComida();
    } else {
      snake.pop();
    }
    draw();
  }

  function fimDeJogo(){
    alive = false;
    if (score > recorde) {
      recorde = score;
      localStorage.setItem('cobra_recorde', String(recorde));
      document.getElementById('recorde').textContent = 'Recorde: ' + recorde;
    }
    document.getElementById('overlayTitle').textContent = '💀 Fim de Jogo';
    document.getElementById('overlayMsg').textContent = 'Pontuação: ' + score;
    document.getElementById('startBtn').textContent = 'Jogar de novo';
    document.getElementById('overlay').classList.add('show');
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // grelha subtil
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let i=0;i<=cols;i++){
      ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,canvas.height); ctx.stroke();
    }
    // comida
    ctx.fillStyle = '#ff5f5f';
    ctx.beginPath();
    ctx.arc(food.x*cell+cell/2, food.y*cell+cell/2, cell*0.35, 0, Math.PI*2);
    ctx.fill();
    // cobra
    snake.forEach((s,i) => {
      const t = i===0 ? '#8CFF9E' : '#3ea34f';
      ctx.fillStyle = t;
      const pad = cell*0.08;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(s.x*cell+pad, s.y*cell+pad, cell-pad*2, cell-pad*2, cell*0.25) :
        ctx.rect(s.x*cell+pad, s.y*cell+pad, cell-pad*2, cell-pad*2);
      ctx.fill();
    });
  }

  function setDir(x,y){
    if (dir.x === -x && dir.y === -y) return; // não pode voltar sobre si mesma
    nextDir = {x,y};
  }

  document.getElementById('up').onclick = () => setDir(0,-1);
  document.getElementById('down').onclick = () => setDir(0,1);
  document.getElementById('left').onclick = () => setDir(-1,0);
  document.getElementById('right').onclick = () => setDir(1,0);
  document.getElementById('pause').onclick = () => {
    paused = !paused;
    document.getElementById('pause').textContent = paused ? '▶️' : '⏸️';
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') setDir(0,-1);
    if (e.key === 'ArrowDown') setDir(0,1);
    if (e.key === 'ArrowLeft') setDir(-1,0);
    if (e.key === 'ArrowRight') setDir(1,0);
  });

  // swipe
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, {passive:true});
  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    if (Math.max(Math.abs(dx),Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx>0?1:-1, 0);
    else setDir(0, dy>0?1:-1);
    touchStart = null;
  }, {passive:true});

  document.getElementById('startBtn').onclick = () => {
    document.getElementById('overlay').classList.remove('show');
    novoJogo();
  };

  resize();
  novoJogo();
  loopId = setInterval(passo, 140);
})();
</script>
</body>
</html>`;

async function enviarCobra(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "cobra_" + Date.now(),
    sections: [
      {
        view_model: {
          primitive: {
            __typename: "GenAIaeacdsnwHtmlPrimitive",
            payload: COBRA_HTML,
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
          submessages: [{ messageType: 2, messageText: "🐍 Cobra" }],
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

module.exports = { enviarCobra };

