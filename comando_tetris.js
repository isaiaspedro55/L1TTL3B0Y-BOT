// ════════════════════════════════════════════════
// ✅ COMANDO !TETRIS — Encaixe blocos e complete linhas.
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const TETRIS_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>🧱 Tetris</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#ecfeff;font-family:system-ui;padding:7px;min-height:100vh;color:#172033}
.card{width:100%;max-width:440px;background:#fff;border:2px solid #06b6d4;border-radius:22px;padding:13px;text-align:center;box-shadow:0 10px 30px #0002}
h1{font-size:30px;color:#06b6d4;margin:2px}p{color:#64748b;font-size:14px;margin:3px 0 8px}
#placar{font-size:18px;font-weight:900;margin:7px;color:#06b6d4}
#area{width:100%;min-height:390px;display:flex;align-items:center;justify-content:center}
button{border:0;border-radius:14px;padding:12px;font-weight:900;font-size:15px;cursor:pointer}
.primary{background:#06b6d4;color:#fff}
.grid{display:grid;gap:7px;width:100%}
.cell{background:#f1f5f9;border:2px solid transparent;min-height:52px;font-size:24px}
.cell:active{transform:scale(.96)}
#overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0009;z-index:10}
.modal{background:#fff;border-radius:22px;padding:24px;text-align:center;width:min(88%,350px)}
.modal button{margin-top:14px;width:100%;background:#06b6d4;color:#fff}
#msg{margin-top:9px;background:#f1f5f9;border-radius:13px;padding:9px;font-weight:800;font-size:13px}
.row{display:flex;gap:7px;margin-top:8px}.row button{flex:1}
canvas{width:100%;max-height:68vh;border-radius:18px;border:2px solid #06b6d4;touch-action:none;background:#f8fafc}
</style>
</head>
<body>
<div class="card">
<h1>🧱 Tetris</h1><p>Encaixe blocos e complete linhas.</p>
<div id="placar">Pontos: 0</div>
<div id="area"><canvas id="cv" width="240" height="480"></canvas><div class="row"><button class="primary" onclick="left()">⬅️</button><button class="primary" onclick="down()">⬇️</button><button class="primary" onclick="right()">➡️</button></div></div>
<div id="msg">Toque em JOGAR para começar.</div>
<div class="row"><button onclick="resetar()" style="background:#e5e7eb">🔄 Novo</button><button onclick="som()" id="snd" style="background:#06b6d4;color:#fff">🔊 Som</button></div>
</div>
<script>
let soundOn=true,points=0;
function beep(freq=700,dur=.08){if(!soundOn)return;try{let a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur);o.stop(a.currentTime+dur)}catch(e){}}
function add(n){points+=n;document.getElementById('placar').textContent='Pontos: '+points}
function msg(t){document.getElementById('msg').textContent=t}
function som(){soundOn=!soundOn;document.getElementById('snd').textContent=soundOn?'🔊 Som':'🔇 Som';if(soundOn)beep()}
function resetar(){location.reload()}
function iniciar(){document.getElementById('overlay')?.remove();beep(900,.1);if(typeof initGame==='function')initGame()}
let ctx,px=5,py=0;function initGame(){ctx=document.getElementById("cv").getContext("2d");draw()}function draw(){ctx.fillStyle="#0f172a";ctx.fillRect(0,0,240,480);ctx.fillStyle="#22d3ee";ctx.fillRect(px*24,py*24,48,48)}function left(){px=Math.max(0,px-1);add(1);draw()}function right(){px=Math.min(8,px+1);add(1);draw()}function down(){py=Math.min(18,py+1);add(1);beep(600);draw()}
</script>
</body></html>`;

async function enviarTetris(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "tetris_" + Date.now(),
    sections: [{
      view_model: {
        primitive: {
          __typename: "GenAIaeacdsnwHtmlPrimitive",
          payload: TETRIS_HTML,
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
          submessages: [{ messageType: 2, messageText: "🧱 Tetris" }],
          unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
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
module.exports = { enviarTetris };

