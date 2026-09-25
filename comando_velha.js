// ✅ COMANDO !VELHA — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const VELHA_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Jogo da Velha</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; }
    body {
      display:flex; align-items:center; justify-content:center;
      min-height:100vh; padding:20px 14px;
      background:#F3ECE0; font-family:'Inter',system-ui;
    }
    .card {
      width:100%; max-width:440px; background:#FFFDF9;
      border-radius:28px; padding:24px; text-align:center;
      border:1px solid #E9DFCE;
    }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    #display {
      display:inline-block; background:#F6EEDD;
      border-radius:20px; padding:5px 16px;
      color:#8A6A3F; font-size:13px; margin:8px 0;
    }
    canvas { width:100%; border-radius:18px; background:#fff; border:1px solid #E9DFCE; }
    button {
      margin-top:14px; background:#B5652E; color:#fff;
      border:none; border-radius:999px; padding:13px 30px;
      font-weight:600; box-shadow:0 4px 0 #8C4A1E;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>❌ Jogo da Velha</h1>
    <div id="display">sua vez</div>
    <p style="color:#A9977E;font-size:13px;margin-bottom:12px">você X vs robô O</p>
    <canvas id="c" width="380" height="380"></canvas>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var disp = document.getElementById('display');
  var b = Array(9).fill('');

  function snd(f){
    try{
      var a = new AudioContext();
      var o = a.createOscillator();
      o.frequency.value = f;
      o.connect(a.destination);
      o.start(); o.stop(a.currentTime+0.15);
    }catch(e){}
  }

  window.novo = function(){
    b = Array(9).fill('');
    disp.textContent = 'sua vez: X';
    draw();
  };

  function draw(){
    ctx.clearRect(0,0,380,380);
    ctx.strokeStyle = '#D8CDB4';
    ctx.lineWidth = 3;
    for(let i=1;i<3;i++){
      ctx.beginPath(); ctx.moveTo(i*380/3,0); ctx.lineTo(i*380/3,380); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*380/3); ctx.lineTo(380,i*380/3); ctx.stroke();
    }
    ctx.fillStyle = '#3D2A18';
    ctx.font = '70px Fraunces, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    b.forEach((v,i)=>{
      if(v) ctx.fillText(v, (i%3)*380/3+380/6, Math.floor(i/3)*380/3+380/6);
    });
  }

  function win(p){
    var w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return w.some(c=>c.every(i=>b[i]==p));
  }

  cv.onclick = function(e){
    var r = cv.getBoundingClientRect();
    var x = Math.floor((e.clientX-r.left)/r.width*3);
    var y = Math.floor((e.clientY-r.top)/r.height*3);
    var i = y*3+x;
    if(b[i]) return;
    b[i] = 'X'; snd(700);
    if(win('X')){ disp.textContent = '🏆 você venceu!'; draw(); return; }
    let ai = Math.floor(Math.random()*9);
    let tries = 0;
    while(b[ai] && tries<20){ ai = Math.floor(Math.random()*9); tries++; }
    if(!b[ai]) b[ai] = 'O';
    if(win('O')) disp.textContent = '🤖 robô venceu';
    draw();
  };

  novo();
})();
</script>
</body>
</html>`;

async function enviarVelha(sock, jid) {
  const htmlPayload = {
    response_id: "velha_" + Date.now(),
    sections: [{
      view_model: {
        primitive: {
          __typename: "GenAIaeacdsnwHtmlPrimitive",
          payload: VELHA_HTML,
          trusted_sources: ["nixel.dev"]
        },
        __typename: "GenAISingleLayoutViewModel",
        height: "full",
        full_screen: true
      }
    }]
  };
  const content = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: "❌ Jogo da Velha" }],
          unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
          contextInfo: {
            forwardingScore: 1, isForwarded: true,
            forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
            forwardOrigin: 4
          }
        }
      }
    }
  };
  const fullMsg = generateWAMessageFromContent(jid, content, {
    userJid: sock.user?.id, timestamp: new Date(),
  });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}

module.exports = { enviarVelha };
