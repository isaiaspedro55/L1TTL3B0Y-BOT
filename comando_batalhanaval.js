// ════════════════════════════════════════════════
// ✅ COMANDO !BATALHANAVAL — estilo Piano
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const BATALHANAVAL_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Batalha Naval</title>
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
      display:inline-block; background:#F6EEDD; border:1px solid #E9DBBF;
      border-radius:20px; padding:5px 16px; color:#8A6A3F;
      font-size:13px; margin:8px 0;
    }
    .sub { color:#A9977E; font-size:13px; margin-bottom:12px; }
    canvas { width:100%; border-radius:18px; border:1px solid #E9DFCE; }
    button {
      margin-top:14px; background:#B5652E; color:#fff; border:none;
      border-radius:999px; padding:13px 30px; font-weight:600;
      box-shadow:0 4px 0 #8C4A1E; cursor:pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚢 Batalha Naval</h1>
    <div id="display">pronto</div>
    <p class="sub">toque para atirar · 5 navios escondidos</p>
    <canvas id="c" width="380" height="380"></canvas>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var disp = document.getElementById('display');
  var N = 8, S = 380 / N, navios = [], hits = 0;

  function snd(f){
    try{
      var a = new AudioContext();
      var o = a.createOscillator();
      var g = a.createGain();
      o.frequency.value = f;
      o.connect(g); g.connect(a.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime+0.2);
      o.stop(a.currentTime+0.2);
    }catch(e){}
  }

  window.novo = function(){
    navios = []; hits = 0;
    for(let i=0;i<5;i++){
      navios.push({ x: Math.floor(Math.random()*N), y: Math.floor(Math.random()*N), hit:false });
    }
    disp.textContent = 'acertos 0/5';
    draw();
  };

  function draw(){
    ctx.clearRect(0,0,380,380);
    for(let y=0;y<N;y++){
      for(let x=0;x<N;x++){
        ctx.fillStyle = '#E8F0FE';
        ctx.fillRect(x*S+2, y*S+2, S-4, S-4);
        let n = navios.find(n=>n.x==x && n.y==y && n.hit);
        if(n){
          ctx.fillStyle = '#B5652E';
          ctx.beginPath();
          ctx.arc(x*S+S/2, y*S+S/2, 12, 0, 7);
          ctx.fill();
        }
      }
    }
  }

  cv.onclick = function(e){
    var r = cv.getBoundingClientRect();
    var x = Math.floor((e.clientX-r.left)/r.width*N);
    var y = Math.floor((e.clientY-r.top)/r.height*N);
    var n = navios.find(n=>n.x==x && n.y==y);
    if(n && !n.hit){
      n.hit = true; hits++; snd(880);
      disp.textContent = 'acertos '+hits+'/5';
    } else {
      snd(200);
    }
    draw();
  };

  novo();
})();
</script>
</body>
</html>`;

async function enviarBatalhanaval(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "batalhanaval_" + Date.now(),
    sections: [{
      view_model: {
        primitive: {
          __typename: "GenAIaeacdsnwHtmlPrimitive",
          payload: BATALHANAVAL_HTML,
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
          submessages: [{ messageType: 2, messageText: "🚢 Batalha Naval" }],
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

module.exports = { enviarBatalhanaval };
