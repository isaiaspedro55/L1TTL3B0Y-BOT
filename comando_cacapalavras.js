// ✅ COMANDO !CACAPALAVRAS — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const CACAPALAVRAS_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Caca Palavras</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter&display=swap" rel="stylesheet">
  <style>
    * { margin:0; box-sizing:border-box; user-select:none; }
    body { display:flex; justify-content:center; background:#F3ECE0; font-family:'Inter',system-ui; padding:20px 14px; }
    .card { width:100%; max-width:440px; background:#FFFDF9; border-radius:28px; padding:24px; text-align:center; border:1px solid #E9DFCE; }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    #display { display:inline-block; background:#F6EEDD; border-radius:20px; padding:5px 16px; margin:8px 0; color:#8A6A3F; font-size:13px; }
    canvas { width:100%; border-radius:18px; border:1px solid #E9DFCE; }
    button { margin-top:12px; background:#B5652E; color:#fff; border:none; border-radius:999px; padding:12px 28px; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔍 Caca Palavras</h1>
    <div id="display">ache: SOL, LUA, MAR</div>
    <canvas id="c" width="380" height="460"></canvas>
    <br>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var W = 380, H = 460, COLS = 10, ROWS = 12;
  var SX = W/COLS, SY = H/ROWS;

  function snd(f){
    try{ var a=new AudioContext(), o=a.createOscillator(); o.frequency.value=f; o.connect(a.destination); o.start(); o.stop(a.currentTime+0.15);}catch(e){}
  }

  window.novo = function(){
    draw(); snd(600);
  };

  function draw(){
    ctx.clearRect(0,0,W,H);
    var letters = 'SOLUMARXPTALUAZMARSOLUA';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    for(var y=0;y<ROWS;y++){
      for(var x=0;x<COLS;x++){
        ctx.fillStyle = '#fff';
        ctx.fillRect(x*SX+2, y*SY+2, SX-4, SY-4);
        ctx.fillStyle = '#3D2A18';
        ctx.fillText(letters[(y*COLS+x)%letters.length], x*SX+SX/2, y*SY+SY/2+6);
      }
    }
  }

  cv.onclick = function(){ snd(700); };
  novo();
})();
</script>
</body>
</html>`;

async function enviarCacapalavras(sock, jid) {
  const htmlPayload = {
    response_id: "cacapalavras_" + Date.now(),
    sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: CACAPALAVRAS_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }]
  };
  const content = {
    botForwardedMessage: { message: { richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: "🔍 Caca Palavras" }],
      unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
      contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 }
    }}}
  };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date() });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarCacapalavras };
