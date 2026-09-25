// ✅ COMANDO !OTHELLO — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const OTHELLO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Othello</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter&display=swap" rel="stylesheet">
  <style>
    * { margin:0; box-sizing:border-box; user-select:none; }
    body { display:flex; justify-content:center; background:#F3ECE0; font-family:'Inter',system-ui; padding:20px 14px; }
    .card { width:100%; max-width:440px; background:#FFFDF9; border-radius:28px; padding:24px; text-align:center; border:1px solid #E9DFCE; }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    #display { display:inline-block; background:#F6EEDD; border-radius:20px; padding:5px 16px; margin:8px 0; color:#8A6A3F; font-size:13px; }
    canvas { width:100%; border-radius:18px; border:1px solid #E9DFCE; touch-action:none; }
    button { margin-top:12px; background:#B5652E; color:#fff; border:none; border-radius:999px; padding:12px 28px; font-weight:600; box-shadow:0 4px 0 #8C4A1E; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚫ Othello</h1>
    <div id="display">sua vez: ⚫</div>
    <p style="color:#A9977E;font-size:13px;margin-bottom:12px">reversi 8x8 — vire as peças</p>
    <canvas id="c" width="400" height="400"></canvas>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var disp = document.getElementById('display');
  var W = 400, H = 400, N = 8, S = W/N;

  function snd(f){
    try{ var a=new AudioContext(), o=a.createOscillator(); o.frequency.value=f; o.connect(a.destination); o.start(); o.stop(a.currentTime+0.15);}catch(e){}
  }

  window.novo = function(){
    disp.textContent = 'sua vez: ⚫';
    draw(); snd(600);
  };

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    for(let i=0;i<=N;i++){
      ctx.beginPath(); ctx.moveTo(i*S,0); ctx.lineTo(i*S,H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*S); ctx.lineTo(W,i*S); ctx.stroke();
    }
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    var init = [[3,3,'⚪'],[4,4,'⚪'],[3,4,'⚫'],[4,3,'⚫']];
    init.forEach(p=>{
      ctx.fillText(p[2], p[0]*S+S/2, p[1]*S+S/2+12);
    });
  }

  cv.onclick = function(e){
    snd(500);
    disp.textContent = 'jogada feita!';
  };

  novo();
})();
</script>
</body>
</html>`;

async function enviarOthello(sock, jid) {
  const htmlPayload = {
    response_id: "othello_" + Date.now(),
    sections: [{
      view_model: {
        primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: OTHELLO_HTML, trusted_sources: ["nixel.dev"] },
        __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true
      }
    }]
  };
  const content = {
    botForwardedMessage: { message: { richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: "⚫ Othello" }],
      unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
      contextInfo: { forwardingScore:1, isForwarded:true, forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"}, forwardOrigin:4 }
    }}}
  };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.user?.id, timestamp: new Date() });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarOthello };
