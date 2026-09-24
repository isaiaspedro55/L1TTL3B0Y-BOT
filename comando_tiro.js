// ════════════════════════════════════════════════
// ✅ COMANDO !TIRO — Elimine os Drones (Vertical)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const TIRO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🚁 Tiro</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#0a0f0a;font-family:system-ui;padding:6px;min-height:100vh}
.card{width:100%;max-width:400px;background:#111;border-radius:16px;padding:10px;text-align:center;display:flex;flex-direction:column;max-height:98vh;border:1px solid #333}
h1{color:#fff;font-size:14px;margin-bottom:8px}
h1 span{background:#e53935;color:#fff;padding:2px 8px;border-radius:6px;font-size:11px}
.stats{display:flex;gap:6px;margin-bottom:8px}
.stat{flex:1;background:#1e1e1e;border-radius:10px;padding:7px;font-size:9px;color:#aaa;font-weight:700}
.stat b{display:block;font-size:15px;color:#fff;margin-top:2px}
#wrap{position:relative;width:100%}
canvas{width:100%;display:block;border-radius:12px;border:2px solid #e53935;background:#0f1f0f;touch-action:none}
#overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.8);border-radius:12px;z-index:5;gap:10px}
#overlay b{color:#fff;font-size:22px}
#overlay button{padding:12px 36px;border:none;border-radius:999px;background:#e53935;color:#fff;font-weight:800;font-size:16px}
.controls{display:flex;gap:10px;margin-top:10px;align-items:center;justify-content:space-between}
.dpad{display:grid;grid-template-columns:56px 56px 56px;gap:6px}
.dpad button{width:56px;height:56px;border:none;border-radius:12px;background:#2a2a2a;color:#fff;font-size:20px}
.dpad button:active{background:#444}
#fire{width:120px;height:80px;border:none;border-radius:20px;background:#e53935;color:#fff;font-size:20px;font-weight:800;box-shadow:0 4px 0 #a02725}
#fire:active{transform:translateY(3px);box-shadow:none}
#msg{background:#1e1e1e;color:#ff8a65;border-radius:999px;padding:9px;font-size:12px;font-weight:700;margin-top:8px}
.row{display:flex;gap:8px;margin-top:8px}
.row button{flex:1;padding:11px;border:none;border-radius:999px;font-weight:700;font-size:13px;cursor:pointer}
#rs{background:#2a2a2a;color:#fff}
#nm{background:#e53935;color:#fff}
</style>
</head>
<body>
<div class="card">
<h1><span>📱 MODO VERTICAL</span> ELIMINE OS DRONES</h1>
<div class="stats">
<div class="stat">VIDA<b id="vida" style="color:#4caf50">100%</b></div>
<div class="stat">MUNIÇÃO<b id="mun">30/60</b></div>
<div class="stat">PONTOS<b id="pts">0</b></div>
<div class="stat">LEVEL<b>LVL 1</b></div>
</div>
<div id="wrap">
<canvas id="c" width="360" height="520"></canvas>
<div id="overlay"><b>🚁 TIRO</b><button onclick="start()">▶️ JOGAR</button></div>
</div>
<div class="controls">
<div class="dpad">
<div></div><button onmousedown="ky=-1" onmouseup="ky=0" ontouchstart="ky=-1;event.preventDefault()" ontouchend="ky=0">▲</button><div></div>
<button onmousedown="kx=-1" onmouseup="kx=0" ontouchstart="kx=-1;event.preventDefault()" ontouchend="kx=0">◀</button><button onmousedown="ky=1" onmouseup="ky=0" ontouchstart="ky=1;event.preventDefault()" ontouchend="ky=0">▼</button><button onmousedown="kx=1" onmouseup="kx=0" ontouchstart="kx=1;event.preventDefault()" ontouchend="kx=0">▶</button>
</div>
<button id="fire" ontouchstart="atirar();event.preventDefault()" onmousedown="atirar()">🔥 FIRE</button>
</div>
<div id="msg">Use as setas para mover</div>
<div class="row"><button id="rs" onclick="novo()">🔄 Reset</button><button id="nm" onclick="novo()">🎮 Nova Missão</button></div>
</div>
<script>
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var W=360,H=520,started=false;
var px=W/2,py=H-80,kx=0,ky=0,vida=100,mun=30,pts=0;
var tiros=[],inimigos=[];
function start(){document.getElementById('overlay').style.display='none';started=true;novo();loop();}
function novo(){vida=100;mun=30;pts=0;tiros=[];inimigos=[];px=W/2;py=H-80;upd();msg('Nova missão iniciada!');}
function msg(t){document.getElementById('msg').textContent=t;}
function upd(){document.getElementById('vida').textContent=vida+'%';document.getElementById('mun').textContent=mun+'/60';document.getElementById('pts').textContent=pts;}
function atirar(){if(!started||mun<=0){if(mun<=0)msg('Sem munição! Recarregando...');return;}mun--;tiros.push({x:px,y:py-20});upd();}
function spawn(){if(Math.random()<0.03)inimigos.push({x:20+Math.random()*(W-60),y:-20,s:1+Math.random()});}
function loop(){
 if(!started)return;
 ctx.fillStyle='#0f1f0f';ctx.fillRect(0,0,W,H);
 px+=kx*4;py+=ky*4;
 if(px<20)px=20;if(px>W-20)px=W-20;if(py<40)py=40;if(py>H-20)py=H-20;
 ctx.fillStyle='#4a7c59';ctx.fillRect(px-15,py-10,30,20);
 ctx.fillStyle='#ffeb3b';ctx.fillRect(px+10,py-3,14,6);
 ctx.fillStyle='#ffeb3b';
 tiros.forEach(function(t,i){t.y-=8;ctx.fillRect(t.x-2,t.y,4,12);if(t.y<0)tiros.splice(i,1);});
 spawn();
 inimigos.forEach(function(e,i){
  e.y+=e.s*2;
  ctx.fillStyle='#e53935';ctx.fillRect(e.x-20,e.y-8,40,16);
  ctx.fillStyle='#fff';ctx.fillRect(e.x-12,e.y-4,8,8);ctx.fillRect(e.x+4,e.y-4,8,8);
  tiros.forEach(function(t,j){if(Math.abs(t.x-e.x)<22&&Math.abs(t.y-e.y)<14){inimigos.splice(i,1);tiros.splice(j,1);pts+=100;upd();}});
  if(Math.abs(px-e.x)<30&&Math.abs(py-e.y)<20){inimigos.splice(i,1);vida-=20;msg('💥 Dano! -20% HP');upd();if(vida<=0){msg('💀 Game Over!');started=false;}}
  if(e.y>H+20)inimigos.splice(i,1);
 });
 if(mun<30&&Math.random()<0.01){mun++;upd();}
 requestAnimationFrame(loop);
}
</script>
</body>
</html>`;

async function enviarTiro(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "tiro_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: TIRO_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🚁 Tiro" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarTiro };
