// ✅ COMANDO !MEMORIA — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const MEMORIA_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Memória</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; }
    body { display:flex; justify-content:center; background:#F3ECE0; font-family:'Inter',system-ui; padding:20px 14px; }
    .card { width:100%; max-width:440px; background:#FFFDF9; border-radius:28px; padding:24px; text-align:center; border:1px solid #E9DFCE; }
    h1 { font-family:'Fraunces',serif; color:#3D2A18; }
    #display { display:inline-block; background:#F6EEDD; border-radius:20px; padding:5px 16px; color:#8A6A3F; margin:8px 0; font-size:13px; }
    canvas { width:100%; border-radius:18px; border:1px solid #E9DFCE; }
    button { margin-top:12px; background:#B5652E; color:#fff; border:none; border-radius:999px; padding:12px 28px; font-weight:600; box-shadow:0 4px 0 #8C4A1E; cursor:pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🧠 Memória</h1>
    <div id="display">pares 0/8</div>
    <p style="color:#A9977E;font-size:13px;margin-bottom:12px">encontre os 8 pares</p>
    <canvas id="c" width="380" height="380"></canvas>
    <br>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
<script>
(function(){
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var disp = document.getElementById('display');
  var cards = [], first = null, pts = 0;
  var EMO = ['🍎','🍌','🍇','🍓','🍒','🥝','🍍','🥥'];

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
    var v = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8].sort(()=>Math.random()-0.5);
    cards = v.map(val=>({val:val, open:false, done:false}));
    first = null; pts = 0;
    disp.textContent = 'pares 0/8';
    draw();
  };

  function draw(){
    ctx.clearRect(0,0,380,380);
    cards.forEach(function(c,i){
      var x = i%4, y = Math.floor(i/4), s = 95;
      ctx.fillStyle = c.done ? '#D7CCC8' : c.open ? '#fff' : '#B5652E';
      ctx.beginPath();
      ctx.roundRect(x*s+5, y*s+5, s-10, s-10, 10);
      ctx.fill();
      if(c.open || c.done){
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.fillText(EMO[c.val-1], x*s+s/2, y*s+s/2+12);
      }
    });
  }

  cv.onclick = function(e){
    var r = cv.getBoundingClientRect();
    var x = Math.floor((e.clientX-r.left)/r.width*4);
    var y = Math.floor((e.clientY-r.top)/r.height*4);
    var c = cards[y*4+x];
    if(!c || c.open || c.done) return;
    c.open = true; snd(500);
    if(!first){
      first = c;
    } else {
      if(first.val === c.val){
        first.done = true; c.done = true; pts++;
        snd(880);
        disp.textContent = 'pares '+pts+'/8';
      } else {
        var f = first;
        setTimeout(function(){ f.open=false; c.open=false; draw(); }, 600);
      }
      first = null;
    }
    draw();
  };

  novo();
})();
</script>
</body>
</html>`;

async function enviarMemoria(sock, jid) {
  const htmlPayload = {
    response_id: "memoria_" + Date.now(),
    sections: [
      {
        view_model: {
          primitive: {
            __typename: "GenAIaeacdsnwHtmlPrimitive",
            payload: MEMORIA_HTML,
            trusted_sources: ["nixel.dev"]
          },
          __typename: "GenAISingleLayoutViewModel",
          height: "full",
          full_screen: true
        }
      }
    ]
  };

  const content = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: "🧠 Memória" }],
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
    timestamp: new Date()
  });

  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}

module.exports = { enviarMemoria };
