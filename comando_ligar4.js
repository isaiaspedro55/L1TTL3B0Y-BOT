// ✅ COMANDO !LIGAR4 — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const LIGAR4_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Ligar 4</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; }
    body {
      display:flex; justify-content:center;
      background:#F3ECE0; font-family:'Inter',system-ui;
      padding:20px 14px; min-height:100vh; align-items:center;
    }
    .card {
      width:100%; max-width:440px; background:#FFFDF9;
      border-radius:28px; padding:24px; text-align:center;
      border:1px solid #E9DFCE;
    }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    #display {
      display:inline-block; background:#F6EEDD; border:1px solid #E9DBBF;
      border-radius:20px; padding:5px 16px; color:#8A6A3F;
      font-size:13px; margin:8px 0;
    }
    .sub { color:#A9977E; font-size:13px; margin-bottom:12px; }
    canvas { width:100%; border-radius:18px; touch-action:none; }
    button {
      margin-top:14px; background:#B5652E; color:#fff; border:none;
      border-radius:999px; padding:13px 30px; font-weight:600;
      box-shadow:0 4px 0 #8C4A1E; cursor:pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔴 Ligar 4</h1>
    <div id="display">vez do 🔴</div>
    <p class="sub">toque na coluna para soltar a peça</p>
    <canvas id="c" width="380" height="360"></canvas>
    <br>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var disp = document.getElementById('display');
  var COLS = 7, ROWS = 6;
  var W = 380, H = 360;
  var CW = W / COLS, CH = H / ROWS;
  var grid = [];
  var turn = 'R';

  function snd(f){
    try{
      var a = new AudioContext();
      var o = a.createOscillator();
      o.frequency.value = f;
      o.connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.15);
    }catch(e){}
  }

  window.novo = function(){
    grid = Array(COLS * ROWS).fill('');
    turn = 'R';
    disp.textContent = 'vez do 🔴';
    draw();
  };

  function draw(){
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#3D2A18';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 18);
    ctx.fill();

    for(var r = 0; r < ROWS; r++){
      for(var c = 0; c < COLS; c++){
        var i = r * COLS + c;
        var cx = c * CW + CW / 2;
        var cy = r * CH + CH / 2;

        ctx.fillStyle = '#F3ECE0';
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();

        if(grid[i] === 'R'){
          ctx.fillStyle = '#E53935';
          ctx.beginPath();
          ctx.arc(cx, cy, 18, 0, Math.PI * 2);
          ctx.fill();
        }

        if(grid[i] === 'Y'){
          ctx.fillStyle = '#FBC02D';
          ctx.beginPath();
          ctx.arc(cx, cy, 18, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function checkWin(p){
    // horizontal
    for(var r = 0; r < ROWS; r++){
      for(var c = 0; c <= COLS - 4; c++){
        var i = r * COLS + c;
        if(grid[i]===p && grid[i+1]===p && grid[i+2]===p && grid[i+3]===p) return true;
      }
    }
    // vertical
    for(var c = 0; c < COLS; c++){
      for(var r = 0; r <= ROWS - 4; r++){
        var i = r * COLS + c;
        if(grid[i]===p && grid[i+COLS]===p && grid[i+COLS*2]===p && grid[i+COLS*3]===p) return true;
      }
    }
    return false;
  }

  cv.onclick = function(e){
    var rect = cv.getBoundingClientRect();
    var c = Math.floor((e.clientX - rect.left) / rect.width * COLS);
    if(c < 0 || c >= COLS) return;

    for(var r = ROWS - 1; r >= 0; r--){
      var i = r * COLS + c;
      if(!grid[i]){
        grid[i] = turn;
        snd(turn === 'R' ? 600 : 500);

        if(checkWin(turn)){
          draw();
          disp.textContent = turn === 'R' ? '🏆 🔴 venceu!' : '🏆 🟡 venceu!';
          snd(880);
          return;
        }

        turn = (turn === 'R') ? 'Y' : 'R';
        disp.textContent = turn === 'R' ? 'vez do 🔴' : 'vez do 🟡';
        draw();
        break;
      }
    }
  };

  novo();
})();
</script>
</body>
</html>`;

async function enviarLigar4(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "ligar4_" + Date.now(),
    sections: [
      {
        view_model: {
          primitive: {
            __typename: "GenAIaeacdsnwHtmlPrimitive",
            payload: LIGAR4_HTML,
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
          submessages: [{ messageType: 2, messageText: "🔴 Ligar 4" }],
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

module.exports = { enviarLigar4 };
