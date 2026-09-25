// ════════════════════════════════════════════════
// ✅ COMANDO !MEMÓRIA — Encontre os 8 pares.
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const MEMORIA_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>🧠 Memória</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#eff6ff;font-family:system-ui;padding:7px;min-height:100vh;color:#172033}
.card{width:100%;max-width:440px;background:#fff;border:2px solid #0284c7;border-radius:22px;padding:13px;text-align:center;box-shadow:0 10px 30px #0002}
h1{font-size:30px;color:#0284c7;margin:2px}p{color:#64748b;font-size:14px;margin:3px 0 8px}
#placar{font-size:18px;font-weight:900;margin:7px;color:#0284c7}
#area{width:100%;min-height:390px;display:flex;align-items:center;justify-content:center}
button{border:0;border-radius:14px;padding:12px;font-weight:900;font-size:15px;cursor:pointer}
.primary{background:#0284c7;color:#fff}
.grid{display:grid;gap:7px;width:100%}
.cell{background:#f1f5f9;border:2px solid transparent;min-height:52px;font-size:24px}
.cell:active{transform:scale(.96)}
#overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0009;z-index:10}
.modal{background:#fff;border-radius:22px;padding:24px;text-align:center;width:min(88%,350px)}
.modal button{margin-top:14px;width:100%;background:#0284c7;color:#fff}
#msg{margin-top:9px;background:#f1f5f9;border-radius:13px;padding:9px;font-weight:800;font-size:13px}
.row{display:flex;gap:7px;margin-top:8px}.row button{flex:1}
canvas{width:100%;max-height:68vh;border-radius:18px;border:2px solid #0284c7;touch-action:none;background:#f8fafc}
</style>
</head>
<body>
<div class="card">
<h1>🧠 Memória</h1><p>Encontre os 8 pares.</p>
<div id="placar">Pontos: 0</div>
<div id="area"><div style="width:100%"><div id="grid" class="grid" style="grid-template-columns:repeat(4,1fr)"></div></div></div>
<div id="msg">Toque em JOGAR para começar.</div>
<div class="row"><button onclick="resetar()" style="background:#e5e7eb">🔄 Novo</button><button onclick="som()" id="snd" style="background:#0284c7;color:#fff">🔊 Som</button></div>
</div>
<script>
let soundOn=true,points=0;
function beep(freq=700,dur=.08){if(!soundOn)return;try{let a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur);o.stop(a.currentTime+dur)}catch(e){}}
function add(n){points+=n;document.getElementById('placar').textContent='Pontos: '+points}
function msg(t){document.getElementById('msg').textContent=t}
function som(){soundOn=!soundOn;document.getElementById('snd').textContent=soundOn?'🔊 Som':'🔇 Som';if(soundOn)beep()}
function resetar(){location.reload()}
function iniciar(){document.getElementById('overlay')?.remove();beep(900,.1);if(typeof initGame==='function')initGame()}
let cards=[],open=[],pairs=0,lock=false;
function initGame(){let s=["🍎","🚀","🎸","🐼","⚡","🌙","🍕","🎮"];cards=[...s,...s].sort(()=>Math.random()-.5);open=[];pairs=0;render();}
function render(){document.getElementById("grid").innerHTML=cards.map((x,i)=>`<button class="cell" id="m${i}" onclick="flip(${i})">❔</button>`).join("");}
function flip(i){if(lock||open.includes(i)||document.getElementById("m"+i).dataset.done)return;let e=document.getElementById("m"+i);e.textContent=cards[i];open.push(i);beep(650);if(open.length===2){lock=true;let[a,b]=open;if(cards[a]===cards[b]){document.getElementById("m"+a).dataset.done=1;document.getElementById("m"+b).dataset.done=1;document.getElementById("m"+a).style.background="#dcfce7";document.getElementById("m"+b).style.background="#dcfce7";pairs++;add(2);open=[];lock=false;if(pairs===8){msg("🏆 Todos os pares!");beep(1100,.2)}}else setTimeout(()=>{document.getElementById("m"+a).textContent="❔";document.getElementById("m"+b).textContent="❔";open=[];lock=false},650)}}
</script>
</body></html>`;

async function enviarMemoria(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "memoria_" + Date.now(),
    sections: [{
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
    }]
  };
  const content = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: "🧠 Memória" }],
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
module.exports = { enviarMemoria };

