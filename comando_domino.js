// ✅ COMANDO !DOMINO — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const DOMINO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Domino</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter&display=swap" rel="stylesheet">
  <style>
    * { margin:0; box-sizing:border-box; user-select:none; }
    body { display:flex; justify-content:center; background:#F3ECE0; font-family:'Inter',system-ui; padding:20px 14px; }
    .card { width:100%; max-width:520px; background:#FFFDF9; border-radius:28px; padding:24px; text-align:center; border:1px solid #E9DFCE; }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    canvas { width:100%; border-radius:18px; background:#EFEBE9; border:1px solid #E9DFCE; }
    button { margin-top:12px; background:#B5652E; color:#fff; border:none; border-radius:999px; padding:12px 28px; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Domino</h1>
    <p style="color:#A9977E;font-size:13px;margin:8px 0 12px">voce vs robo</p>
    <canvas id="c" width="480" height="280"></canvas>
    <br>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');

  function snd(f){
    try{ var a=new AudioContext(), o=a.createOscillator(); o.frequency.value=f; o.connect(a.destination); o.start(); o.stop(a.currentTime+0.15);}catch(e){}
  }

  window.novo = function(){ draw(); snd(600); };

  function draw(){
    ctx.clearRect(0,0,480,280);
    for(var i=0;i<5;i++){
      var x = 20+i*90, y = 90;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#3D2A18';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, 80, 100, 10);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y+50); ctx.lineTo(x+80, y+50);
      ctx.stroke();
      ctx.fillStyle = '#3D2A18';
      ctx.font = '20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i+1), x+40, y+35);
      ctx.fillText(String(6-i), x+40, y+80);
    }
  }

  cv.onclick = function(){ snd(600); };
  novo();
})();
</script>
</body>
</html>`;

async function enviarDomino(sock, jid) {
  const htmlPayload = {
    response_id: "domino_" + Date.now(),
    sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: DOMINO_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }]
  };
  const content = {
    botForwardedMessage: { message: { richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: "Domino" }],
      unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
      contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 }
    }}}
  };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date() });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarDomino };
