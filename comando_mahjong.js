// ✅ COMANDO !MAHJONG — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const MAHJONG_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mahjong</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter&display=swap" rel="stylesheet">
  <style>
    * { margin:0; box-sizing:border-box; user-select:none; }
    body { display:flex; justify-content:center; background:#F3ECE0; font-family:'Inter',system-ui; padding:20px 14px; }
    .card { width:100%; max-width:440px; background:#FFFDF9; border-radius:28px; padding:24px; text-align:center; border:1px solid #E9DFCE; }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    canvas { width:100%; border-radius:18px; border:1px solid #E9DFCE; }
    button { margin-top:12px; background:#B5652E; color:#fff; border:none; border-radius:999px; padding:12px 28px; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Mahjong</h1>
    <p style="color:#A9977E;font-size:13px;margin:8px 0 12px">combine os pares · grade 6x4</p>
    <canvas id="c" width="420" height="320"></canvas>
    <br>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var W = 420, H = 320, COLS = 6, ROWS = 4;
  var SX = W/COLS, SY = H/ROWS;

  function snd(f){
    try{ var a=new AudioContext(), o=a.createOscillator(); o.frequency.value=f; o.connect(a.destination); o.start(); o.stop(a.currentTime+0.15);}catch(e){}
  }

  window.novo = function(){ draw(); snd(650); };

  function draw(){
    ctx.clearRect(0,0,W,H);
    var E = ['A','B','C','D','E','F'];
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    for(var i=0;i<24;i++){
      var x = i%COLS, y = Math.floor(i/COLS);
      ctx.fillStyle = '#FFFEF7';
      ctx.strokeStyle = '#D8CDB4';
      ctx.beginPath();
      ctx.roundRect(x*SX+6, y*SY+6, SX-12, SY-12, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3D2A18';
      ctx.fillText(E[i%E.length], x*SX+SX/2, y*SY+SY/2+10);
    }
  }

  cv.onclick = function(){ snd(650); };
  novo();
})();
</script>
</body>
</html>`;

async function enviarMahjong(sock, jid) {
  const htmlPayload = {
    response_id: "mahjong_" + Date.now(),
    sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: MAHJONG_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }]
  };
  const content = {
    botForwardedMessage: { message: { richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: "Mahjong" }],
      unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
      contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 }
    }}}
  };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date() });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarMahjong };
