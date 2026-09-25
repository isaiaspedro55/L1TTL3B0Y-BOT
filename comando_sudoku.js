// ✅ COMANDO !SUDOKU — estilo Piano
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const SUDOKU_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sudoku</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter&display=swap" rel="stylesheet">
  <style>
    * { margin:0; box-sizing:border-box; }
    body { display:flex; justify-content:center; background:#F3ECE0; font-family:'Inter'; padding:20px 14px; }
    .card { width:100%; max-width:440px; background:#FFFDF9; border-radius:28px; padding:24px; text-align:center; }
    h1 { font-family:'Fraunces'; color:#3D2A18; }
    canvas { width:100%; border-radius:18px; border:1px solid #E9DFCE; }
    button { margin-top:12px; background:#B5652E; color:#fff; border:none; border-radius:999px; padding:12px 28px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔢 Sudoku</h1>
    <canvas id="c" width="380" height="380"></canvas>
    <button onclick="novo()">🔄 Novo jogo</button>
  </div>
  <script>
    (function(){
      var cv = document.getElementById('c');
      var ctx = cv.getContext('2d');

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
        draw(); snd(600);
      };

      function draw(){
        ctx.clearRect(0,0,380,380);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0,0,380,380);
        for(let i=0;i<=9;i++){
          ctx.lineWidth = i%3==0 ? 3 : 1;
          ctx.strokeStyle = '#3D2A18';
          ctx.beginPath();
          ctx.moveTo(i*380/9,0);
          ctx.lineTo(i*380/9,380);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0,i*380/9);
          ctx.lineTo(380,i*380/9);
          ctx.stroke();
        }
      }

      cv.onclick = function(){ snd(600); };

      novo();
    })();
  </script>
</body>
</html>`;

async function enviarSudoku(sock, jid) {
  const htmlPayload = {
    response_id: "sudoku_" + Date.now(),
    sections: [{
      view_model: {
        primitive: {
          __typename: "GenAIaeacdsnwHtmlPrimitive",
          payload: SUDOKU_HTML,
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
          submessages: [{ messageType: 2, messageText: "🔢 Sudoku" }],
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
    userJid: sock.user?.id,
    timestamp: new Date(),
  });

  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}

module.exports = { enviarSudoku };
