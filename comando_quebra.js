// ════════════════════════════════════════════════
// ✅ COMANDO !QUEBRA — Quebra-cabeça 8 (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const QUEBRA_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🧩 Quebra-cabeça</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#FFF3E0;font-family:system-ui;padding:10px;min-height:100vh}
.card{width:100%;max-width:420px;background:#FFFDF7;border-radius:22px;padding:20px;text-align:center;border:2px solid #FFB74D}
h1{color:#3E2723;font-size:32px;line-height:1.1;margin-bottom:6px}
.sub{color:#BF360C;font-weight:700;margin-bottom:14px;font-size:16px}
.stats{display:flex;gap:8px;margin-bottom:12px}
.stat{flex:1;background:#FFE0B2;border-radius:12px;padding:8px}
.stat small{display:block;font-size:11px;color:#BF360C;font-weight:700}
.stat b{font-size:16px;color:#3E2723}
#board{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#E65100;padding:12px;border-radius:16px;min-height:380px}
.tile{aspect-ratio:1;background:#FFB74D;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:800;color:#5D2800;cursor:pointer;box-shadow:0 4px 0 #BF360C;min-height:110px}
.tile:active{transform:scale(.96)}
.tile.empty{background:transparent;box-shadow:none}
#msg{min-height:28px;font-weight:800;color:#E65100;margin:10px 0}
.row{display:flex;gap:10px}
.row button{flex:1;padding:14px;border:none;border-radius:999px;font-weight:800;font-size:15px;cursor:pointer}
#e{background:#FFE0B2;color:#E65100}
#n{background:#EF6C00;color:#fff}
</style>
</head>
<body>
<div class="card">
<h1>🧩 Quebra-cabeça</h1>
<div class="sub">Ordene de 1 a 8!</div>
<div class="stats">
<div class="stat"><small>MOVES</small><b id="mv">0</b></div>
<div class="stat"><small>TEMPO</small><b id="tp">00:00</b></div>
<div class="stat"><small>STATUS</small><b>🧩</b></div>
</div>
<div id="board"></div>
<div id="msg"></div>
<div class="row"><button id="e" onclick="novo()">🔀 Embaralhar</button><button id="n" onclick="novo()">🎮 Novo</button></div>
</div>
<script>
var t=[],moves=0,sec=0,timer=null;
function novo(){t=[1,2,3,4,5,6,7,8,0];do{shuffle();}while(!solv()||win());moves=0;sec=0;document.getElementById('msg').textContent='';clearInterval(timer);timer=setInterval(()=>{sec++;upd();},1000);upd();draw();}
function shuffle(){for(var i=8;i>0;i--){var j=Math.floor(Math.random()*(i+1));var x=t[i];t[i]=t[j];t[j]=x;}}
function solv(){var inv=0;for(var i=0;i<9;i++)for(var j=i+1;j<9;j++)if(t[i]&&t[j]&&t[i]>t[j])inv++;return inv%2===0;}
function win(){for(var i=0;i<8;i++)if(t[i]!==i+1)return false;return true;}
function upd(){document.getElementById('mv').textContent=moves;var m=Math.floor(sec/60),s=sec%60;document.getElementById('tp').textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;}
function draw(){var b=document.getElementById('board');b.innerHTML='';t.forEach((v,i)=>{var d=document.createElement('div');d.className='tile'+(v===0?' empty':'');d.textContent=v||'';d.onclick=()=>play(i);b.appendChild(d);});}
function play(i){var z=t.indexOf(0),r1=Math.floor(i/3),c1=i%3,r2=Math.floor(z/3),c2=z%3;if(Math.abs(r1-r2)+Math.abs(c1-c2)===1){t[z]=t[i];t[i]=0;moves++;upd();draw();if(win()){clearInterval(timer);document.getElementById('msg').textContent='🏆 Venceu em '+moves+' moves!';}}}
novo();
</script>
</body>
</html>`;

async function enviarQuebra(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "quebra_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: QUEBRA_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🧩 Quebra-cabeça" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarQuebra };
