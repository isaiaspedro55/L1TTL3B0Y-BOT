// ════════════════════════════════════════════════
// ✅ COMANDO !OTHELLO — Vire peças e domine o tabuleiro.
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const OTHELLO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>⚫ Othello</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#f8fafc;font-family:system-ui;padding:7px;min-height:100vh;color:#172033}
.card{width:100%;max-width:440px;background:#fff;border:2px solid #334155;border-radius:22px;padding:13px;text-align:center;box-shadow:0 10px 30px #0002}
h1{font-size:30px;color:#334155;margin:2px}p{color:#64748b;font-size:14px;margin:3px 0 8px}
#placar{font-size:18px;font-weight:900;margin:7px;color:#334155}
#area{width:100%;min-height:390px;display:flex;align-items:center;justify-content:center}
button{border:0;border-radius:14px;padding:12px;font-weight:900;font-size:15px;cursor:pointer}
.primary{background:#334155;color:#fff}
.grid{display:grid;gap:7px;width:100%}
.cell{background:#f1f5f9;border:2px solid transparent;min-height:52px;font-size:24px}
.cell:active{transform:scale(.96)}
#overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0009;z-index:10}
.modal{background:#fff;border-radius:22px;padding:24px;text-align:center;width:min(88%,350px)}
.modal button{margin-top:14px;width:100%;background:#334155;color:#fff}
#msg{margin-top:9px;background:#f1f5f9;border-radius:13px;padding:9px;font-weight:800;font-size:13px}
.row{display:flex;gap:7px;margin-top:8px}.row button{flex:1}
canvas{width:100%;max-height:68vh;border-radius:18px;border:2px solid #334155;touch-action:none;background:#f8fafc}
</style>
</head>
<body>
<div class="card">
<h1>⚫ Othello</h1><p>Vire peças e domine o tabuleiro.</p>
<div id="placar">Pontos: 0</div>
<div id="area"><div id="ot" class="grid" style="grid-template-columns:repeat(6,1fr)"></div></div>
<div id="msg">Toque em JOGAR para começar.</div>
<div class="row"><button onclick="resetar()" style="background:#e5e7eb">🔄 Novo</button><button onclick="som()" id="snd" style="background:#334155;color:#fff">🔊 Som</button></div>
</div>
<script>
let soundOn=true,points=0;
function beep(freq=700,dur=.08){if(!soundOn)return;try{let a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur);o.stop(a.currentTime+dur)}catch(e){}}
function add(n){points+=n;document.getElementById('placar').textContent='Pontos: '+points}
function msg(t){document.getElementById('msg').textContent=t}
function som(){soundOn=!soundOn;document.getElementById('snd').textContent=soundOn?'🔊 Som':'🔇 Som';if(soundOn)beep()}
function resetar(){location.reload()}
function iniciar(){document.getElementById('overlay')?.remove();beep(900,.1);if(typeof initGame==='function')initGame()}
let o=Array(36).fill("");function initGame(){o.fill("");o[14]="⚫";o[15]="⚪";o[20]="⚪";o[21]="⚫";render()}function render(){document.getElementById("ot").innerHTML=o.map((x,i)=>`<button class="cell" style="min-height:45px;border-radius:50%;background:#16a34a" onclick="put(${i})">${x}</button>`).join("")}function put(i){if(o[i])return;o[i]="⚫";add(1);beep(650);let n=i+1;if(n%6)o[i+1]="⚫";render()}
</script>
</body></html>`;

async function enviarOthello(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "othello_" + Date.now(),
    sections: [{
      view_model: {
        primitive: {
          __typename: "GenAIaeacdsnwHtmlPrimitive",
          payload: OTHELLO_HTML,
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
          submessages: [{ messageType: 2, messageText: "⚫ Othello" }],
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
module.exports = { enviarOthello };

