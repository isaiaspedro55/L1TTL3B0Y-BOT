// ✅ COMANDO !QUIZ — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const QUIZ_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Quiz</title>
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
    <h1>❓ Quiz</h1>
    <div id="display">pontos 0</div>
    <canvas id="c" width="380" height="420"></canvas>
    <br>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var disp = document.getElementById('display');
  var qs = [
    { q:'Capital do Brasil?', a:['Sao Paulo','Brasilia','Rio'], c:1 },
    { q:'2 + 2 = ?', a:['3','4','5'], c:1 },
    { q:'Cor do ceu?', a:['Azul','Verde','Rosa'], c:0 }
  ];
  var qi = 0, sc = 0;

  function snd(f){
    try{ var a=new AudioContext(), o=a.createOscillator(); o.frequency.value=f; o.connect(a.destination); o.start(); o.stop(a.currentTime+0.2);}catch(e){}
  }

  window.novo = function(){
    qi = 0; sc = 0;
    show();
  };

  function show(){
    ctx.clearRect(0,0,380,420);
    if(qi >= qs.length){
      ctx.fillStyle = '#3D2A18';
      ctx.font = '22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Fim! '+sc+' pts', 190, 200);
      disp.textContent = 'fim · '+sc+' pts';
      return;
    }
    var q = qs[qi];
    ctx.fillStyle = '#3D2A18';
    ctx.font = '20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(q.q, 190, 60);
    q.a.forEach(function(op,i){
      ctx.fillStyle = '#B5652E';
      ctx.beginPath();
      ctx.roundRect(40, 100+i*70, 300, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(op, 190, 132+i*70);
    });
    disp.textContent = 'pergunta '+(qi+1)+'/'+qs.length+' · '+sc+' pts';
  }

  cv.onclick = function(e){
    if(qi >= qs.length) return;
    var r = cv.getBoundingClientRect();
    var y = (e.clientY-r.top)/r.height*420;
    var i = Math.floor((y-100)/70);
    if(i>=0 && i<3){
      if(i === qs[qi].c){ sc++; snd(880); } else { snd(200); }
      qi++;
      setTimeout(show, 400);
    }
  };

  novo();
})();
</script>
</body>
</html>`;

async function enviarQuiz(sock, jid) {
  const htmlPayload = {
    response_id: "quiz_" + Date.now(),
    sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: QUIZ_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }]
  };
  const content = {
    botForwardedMessage: { message: { richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: "❓ Quiz" }],
      unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
      contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 }
    }}}
  };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date() });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarQuiz };
