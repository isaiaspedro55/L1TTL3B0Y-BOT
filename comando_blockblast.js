// ✅ COMANDO !BLOCKBLAST — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const BLOCKBLAST_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Block Blast</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; }
    body { display:flex; justify-content:center; background:#F3ECE0; font-family:'Inter',system-ui; padding:20px 14px; }
    .card { width:100%; max-width:440px; background:#FFFDF9; border-radius:28px; padding:24px; text-align:center; border:1px solid #E9DFCE; }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    #display { display:inline-block; background:#F6EEDD; border-radius:20px; padding:5px 16px; color:#8A6A3F; margin:8px 0; }
    canvas { width:100%; border-radius:18px; border:1px solid #E9DFCE; }
    button { margin-top:12px; background:#B5652E; color:#fff; border:none; border-radius:999px; padding:12px 28px; font-weight:600; box-shadow:0 4px 0 #8C4A1E; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🧱 Block Blast</h1>
    <div id="display">pontos 0</div>
    <p style="color:#A9977E;font-size:13px;margin-bottom:12px">toque para colocar blocos</p>
    <canvas id="c" width="380" height="380"></canvas>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var disp = document.getElementById('display');
  var N = 8, S = 380/N, grid = Array(64).fill(0), pts = 0;

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
    grid.fill(0); pts = 0;
    disp.textContent = 'pontos 0';
    draw();
  };

  function draw(){
    ctx.clearRect(0,0,380,380);
    grid.forEach((v,i)=>{
      var x = i%N, y = Math.floor(i/N);
      ctx.fillStyle = v ? '#B5652E' : '#F6EEDD';
      ctx.beginPath();
      ctx.roundRect(x*S+3, y*S+3, S-6, S-6, 8);
      ctx.fill();
    });
  }

  cv.onclick = function(e){
    var r = cv.getBoundingClientRect();
    var x = Math.floor((e.clientX-r.left)/r.width*N);
    var y = Math.floor((e.clientY-r.top)/r.height*N);
    var i = y*N+x;
    if(!grid[i]){
      grid[i]=1; pts+=10; snd(600);
      disp.textContent = 'pontos '+pts;
      draw();
    }
  };

  novo();
})();
</script>
</body>
</html>`;

async function enviarBlockblast(sock, jid) {
  const htmlPayload = {
    response_id: "blockblast_" + Date.now(),
    sections: [{
      view_model: {
        primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: BLOCKBLAST_HTML, trusted_sources: ["nixel.dev"] },
        __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true
      }
    }]
  };
  const content = {
    botForwardedMessage: { message: { richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: "🧱 Block Blast" }],
      unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
      contextInfo: { forwardingScore:1, isForwarded:true, forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"}, forwardOrigin:4 }
    }}}
  };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.user?.id, timestamp: new Date() });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarBlockblast };
