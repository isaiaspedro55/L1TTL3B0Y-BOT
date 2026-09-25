// ════════════════════════════════════════════════
// ✅ COMANDO !MAHJONG — Encontre e combine símbolos iguais.
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const MAHJONG_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>🀄 Mahjong</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#ecfdf5;font-family:system-ui;padding:7px;min-height:100vh;color:#172033}
.card{width:100%;max-width:440px;background:#fff;border:2px solid #059669;border-radius:22px;padding:13px;text-align:center;box-shadow:0 10px 30px #0002}
h1{font-size:30px;color:#059669;margin:2px}p{color:#64748b;font-size:14px;margin:3px 0 8px}
#placar{font-size:18px;font-weight:900;margin:7px;color:#059669}
#area{width:100%;min-height:390px;display:flex;align-items:center;justify-content:center}
button{border:0;border-radius:14px;padding:12px;font-weight:900;font-size:15px;cursor:pointer}
.primary{background:#059669;color:#fff}
.grid{display:grid;gap:7px;width:100%}
.cell{background:#f1f5f9;border:2px solid transparent;min-height:52px;font-size:24px}
.cell:active{transform:scale(.96)}
#overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0009;z-index:10}
.modal{background:#fff;border-radius:22px;padding:24px;text-align:center;width:min(88%,350px)}
.modal button{margin-top:14px;width:100%;background:#059669;color:#fff}
#msg{margin-top:9px;background:#f1f5f9;border-radius:13px;padding:9px;font-weight:800;font-size:13px}
.row{display:flex;gap:7px;margin-top:8px}.row button{flex:1}
canvas{width:100%;max-height:68vh;border-radius:18px;border:2px solid #059669;touch-action:none;background:#f8fafc}
</style>
</head>
<body>
<div class="card">
<h1>🀄 Mahjong</h1><p>Encontre e combine símbolos iguais.</p>
<div id="placar">Pontos: 0</div>
<div id="area"><div id="mj" class="grid" style="grid-template-columns:repeat(4,1fr)"></div></div>
<div id="msg">Toque em JOGAR para começar.</div>
<div class="row"><button onclick="resetar()" style="background:#e5e7eb">🔄 Novo</button><button onclick="som()" id="snd" style="background:#059669;color:#fff">🔊 Som</button></div>
</div>
<script>
let soundOn=true,points=0;
function beep(freq=700,dur=.08){if(!soundOn)return;try{let a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur);o.stop(a.currentTime+dur)}catch(e){}}
function add(n){points+=n;document.getElementById('placar').textContent='Pontos: '+points}
function msg(t){document.getElementById('msg').textContent=t}
function som(){soundOn=!soundOn;document.getElementById('snd').textContent=soundOn?'🔊 Som':'🔇 Som';if(soundOn)beep()}
function resetar(){location.reload()}
function iniciar(){document.getElementById('overlay')?.remove();beep(900,.1);if(typeof initGame==='function')initGame()}
let tiles=[],pick1=-1;function initGame(){let s=["🀄","🌸","🐉","🎋","⭐","🦋"];tiles=[...s,...s].sort(()=>Math.random()-.5);render()}function render(){document.getElementById("mj").innerHTML=tiles.map((x,i)=>x?`<button class="cell" onclick="pick(${i})">🀄</button>`:`<button class="cell" disabled> </button>`).join("")}function pick(i){if(!tiles[i])return;if(pick1<0){pick1=i;document.getElementById("mj").children[i].textContent=tiles[i];return}let e=document.getElementById("mj").children[i];e.textContent=tiles[i];if(tiles[pick1]===tiles[i]){tiles[pick1]=tiles[i]=null;add(2);beep(1000);pick1=-1;render()}else setTimeout(()=>{render();pick1=-1},500)}
</script>
</body></html>`;

async function enviarMahjong(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "mahjong_" + Date.now(),
    sections: [{
      view_model: {
        primitive: {
          __typename: "GenAIaeacdsnwHtmlPrimitive",
          payload: MAHJONG_HTML,
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
          submessages: [{ messageType: 2, messageText: "🀄 Mahjong" }],
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
module.exports = { enviarMahjong };

