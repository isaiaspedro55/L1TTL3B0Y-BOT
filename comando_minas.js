// ✅ COMANDO !MINAS — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const MINAS_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Campo Minado</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; }
    body { display:flex; justify-content:center; background:#F3ECE0; font-family:'Inter',system-ui; padding:20px 14px; }
    .card { width:100%; max-width:440px; background:#FFFDF9; border-radius:28px; padding:24px; text-align:center; border:1px solid #E9DFCE; }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    #display { display:inline-block; background:#F6EEDD; border-radius:20px; padding:5px 16px; margin:8px 0; color:#8A6A3F; font-size:13px; }
    canvas { width:100%; border-radius:18px; border:1px solid #E9DFCE; }
    button { margin-top:12px; background:#B5652E; color:#fff; border:none; border-radius:999px; padding:12px 28px; font-weight:600; box-shadow:0 4px 0 #8C4A1E; }
  </style>
</head>
<body>
  <div class="card">
    <h1>💣 Campo Minado</h1>
    <div id="display">minas 10</div>
    <p style="color:#A9977E;font-size:13px;margin-bottom:12px">toque para revelar · evite as minas</p>
    <canvas id="c" width="380" height="380"></canvas>
    <br>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var disp = document.getElementById('display');
  var N = 8, S = 380/8;
  var mines = new Set(), rev = new Set();

  function snd(f,d){
    try{
      var a = new AudioContext();
      var o = a.createOscillator();
      var g = a.createGain();
      o.frequency.value = f;
      o.connect(g); g.connect(a.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime+(d||0.2));
      o.stop(a.currentTime+(d||0.2));
    }catch(e){}
  }

  window.novo = function(){
    mines.clear(); rev.clear();
    while(mines.size < 10){
      mines.add(Math.floor(Math.random()*64));
    }
    disp.textContent = 'minas 10 · revelados 0';
    draw();
  };

  function draw(){
    ctx.clearRect(0,0,380,380);
    for(var i=0;i<64;i++){
      var x = i%N, y = Math.floor(i/N);
      var isRev = rev.has(i);
      var isMine = mines.has(i);
      ctx.fillStyle = isRev ? (isMine ? '#D32F2F' : '#EFEBE9') : '#F6EEDD';
      ctx.beginPath();
      ctx.roundRect(x*S+2, y*S+2, S-4, S-4, 6);
      ctx.fill();
      if(isRev && isMine){
        ctx.font = '20px serif';
        ctx.fillText('💣', x*S+14, y*S+30);
      }
    }
    if(rev.size>0){
      disp.textContent = 'revelados '+rev.size;
    }
  }

  cv.onclick = function(e){
    var r = cv.getBoundingClientRect();
    var x = Math.floor((e.clientX-r.left)/r.width*N);
    var y = Math.floor((e.clientY-r.top)/r.height*N);
    var i = y*N+x;
    if(rev.has(i)) return;
    rev.add(i);
    if(mines.has(i)){ snd(150,0.4); } else { snd(700); }
    draw();
  };

  novo();
})();
</script>
</body>
</html>`;

async function enviarMinas(sock, jid) {
  const htmlPayload = {
    response_id: "minas_" + Date.now(),
    sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: MINAS_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }]
  };
  const content = {
    botForwardedMessage: { message: { richResponseMessage: {
      messageType: 1,
      submessages: [{ messageType: 2, messageText: "💣 Campo Minado" }],
      unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
      contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 }
    }}}
  };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date() });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarMinas };
