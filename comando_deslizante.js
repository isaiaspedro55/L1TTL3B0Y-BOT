// ════════════════════════════════════════════════
// ✅ COMANDO !DESLIZANTE — 15 Puzzle (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const DESLIZANTE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🧩 Deslizante 15</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#FFF3E0;font-family:system-ui;padding:10px;min-height:100vh}
.card{width:100%;max-width:380px;background:#FFFDF7;border-radius:20px;padding:14px;text-align:center;border:2px solid #FFB74D}
h1{color:#E65100;font-size:20px;margin-bottom:8px}
.stats{display:flex;gap:8px;margin-bottom:10px}
.stat{flex:1;background:#FFE0B2;border-radius:10px;padding:6px}
.stat small{display:block;font-size:10px;color:#BF360C;font-weight:700}
.stat b{font-size:14px;color:#3E2723}
#board{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#E65100;padding:10px;border-radius:14px;min-height:320px;position:relative}
.tile{aspect-ratio:1;background:#FF9800;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;cursor:pointer;box-shadow:0 3px 0 #BF360C}
.tile:active{transform:scale(.95)}
.tile.empty{background:transparent;box-shadow:none;cursor:default}
#start{position:absolute;inset:10px;background:rgba(230,81,0,.95);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
#start span{font-size:40px}
#start b{color:#fff;font-size:20px}
#start button{padding:12px 32px;border:none;border-radius:999px;background:#FFD600;color:#3E2723;font-weight:800;font-size:16px;cursor:pointer}
.row{display:flex;gap:8px;margin-top:12px}
.row button{flex:1;padding:12px;border:none;border-radius:999px;font-weight:800;cursor:pointer}
#e{background:#FFE0B2;color:#E65100}
#n{background:#EF6C00;color:#fff}
.hint{font-size:12px;color:#8D6E63;margin-top:8px;font-weight:600}
</style>
</head>
<body>
<div class="card">
<h1>🧩 DESLIZANTE 15</h1>
<div class="stats">
<div class="stat"><small>MOVES</small><b id="mv">0</b></div>
<div class="stat"><small>TEMPO</small><b id="tp">00:00</b></div>
<div class="stat"><small>MELHOR</small><b id="ml">-</b></div>
</div>
<div id="board">
<div id="start"><span>🧩</span><b>15 PUZZLE</b><button onclick="novo()">▶️ JOGAR</button></div>
</div>
<div class="hint">Ordene de 1 a 15</div>
<div class="row"><button id="e" onclick="novo()">🔀 Embaralhar</button><button id="n" onclick="novo()">🎮 Novo</button></div>
</div>
<script>
var t=[],moves=0,sec=0,timer=null,best=null,started=false;
function novo(){
 document.getElementById('start').style.display='none';
 t=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0];
 do{shuffle();}while(!solvable()||win());
 moves=0;sec=0;started=true;upd();
 clearInterval(timer);timer=setInterval(()=>{sec++;upd();},1000);
 draw();
}
function shuffle(){for(var i=t.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var x=t[i];t[i]=t[j];t[j]=x;}}
function solvable(){var inv=0;for(var i=0;i<16;i++)for(var j=i+1;j<16;j++)if(t[i]&&t[j]&&t[i]>t[j])inv++;var row=3-Math.floor(t.indexOf(0)/4);return (inv+row)%2===1;}
function win(){for(var i=0;i<15;i++)if(t[i]!==i+1)return false;return true;}
function upd(){document.getElementById('mv').textContent=moves;var m=Math.floor(sec/60),s=sec%60;document.getElementById('tp').textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;document.getElementById('ml').textContent=best?best:'-';}
function draw(){
 var b=document.getElementById('board');b.querySelectorAll('.tile').forEach(e=>e.remove());
 t.forEach((v,i)=>{
  var d=document.createElement('div');d.className='tile'+(v===0?' empty':'');d.textContent=v||'';
  d.onclick=()=>play(i);b.appendChild(d);
 });
}
function play(i){
 if(!started)return;
 var z=t.indexOf(0),r1=Math.floor(i/4),c1=i%4,r2=Math.floor(z/4),c2=z%4;
 if(Math.abs(r1-r2)+Math.abs(c1-c2)===1){t[z]=t[i];t[i]=0;moves++;draw();upd();
  if(win()){clearInterval(timer);started=false;if(!best||moves<best)best=moves;upd();alert('🏆 Venceu em '+moves+' moves!');}
 }
}
upd();
</script>
</body>
</html>`;

async function enviarDeslizante(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "desliz_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: DESLIZANTE_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🧩 Deslizante 15" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarDeslizante };
