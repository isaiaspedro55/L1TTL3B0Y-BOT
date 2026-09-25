// ✅ COMANDO !CONNECT4 — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const CONNECT4_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Connect 4</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter&display=swap" rel="stylesheet">
  <style>
    * { margin:0; box-sizing:border-box; user-select:none; }
    body { display:flex; justify-content:center; background:#F3ECE0; font-family:'Inter',system-ui; padding:20px 14px; }
    .card { width:100%; max-width:440px; background:#FFFDF9; border-radius:28px; padding:24px; text-align:center; border:1px solid #E9DFCE; }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    #display { display:inline-block; background:#F6EEDD; border-radius:20px; padding:5px 16px; margin:8px 0; color:#8A6A3F; }
    canvas { width:100%; border-radius:18px; }
    button { margin-top:12px; background:#B5652E; color:#fff; border:none; border-radius:999px; padding:12px 28px; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔴 Connect 4</h1>
    <div id="display">vez 🔴</div>
    <p style="color:#A9977E;font-size:13px;margin-bottom:12px">ligue 4 para vencer</p>
    <canvas id="c" width="380" height="360"></canvas>
    <br>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var disp = document.getElementById('display');
  var grid = Array(42).fill('');
  var turn = 'R';

  function snd(f){
    try{ var a=new AudioContext(), o=a.createOscillator(); o.frequency.value=f; o.connect(a.destination); o.start(); o.stop(a.currentTime+0.15);}catch(e){}
  }

  window.novo = function(){
    grid.fill(''); turn='R';
    disp.textContent = 'vez 🔴';
    draw();
  };

  function draw(){
    ctx.clearRect(0,0,380,360);
    ctx.fillStyle = '#3D2A18';
    ctx.beginPath();
    ctx.roundRect(0,0,380,360,18);
    ctx.fill();
    for(var i=0;i<42;i++){
      var x = i%7, y = Math.floor(i/7);
      var cx = x*380/7+380/14, cy = y*360/6+360/12;
      ctx.fillStyle = '#F3ECE0';
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 7); ctx.fill();
      if(grid[i]==='R'){ ctx.fillStyle='#E53935'; ctx.beginPath(); ctx.arc(cx,cy,18,0,7); ctx.fill(); }
      if(grid[i]==='Y'){ ctx.fillStyle='#FBC02D'; ctx.beginPath(); ctx.arc(cx,cy,18,0,7); ctx.fill(); }
    }
  }

  cv.onclick = function(e){
    var r = cv.getBoundingClientRect();
    var c = Math.floor((e.clientX-r.left)/r.width*7);
    for(var rr=5; rr>=0; rr--){
      var idx = rr*7+c;
      if(!grid[idx]){
        grid[idx]=turn;
        snd(600);
        turn = (turn==='R') ? 'Y' : 'R';
        disp.textContent = 'vez ' + (turn==='R' ? '🔴' : '🟡');
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

async function enviarConnect4(sock, jid) {
  const htmlPayload = {
    response_id: "connect4_" + Date.now(),
    sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: CONNECT4_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }]
  };
  const content = {
    botForwardedMessage: { message: { richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: "🔴 Connect 4" }],
      unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
      contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 }
    }}}
  };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date() });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarConnect4 };
