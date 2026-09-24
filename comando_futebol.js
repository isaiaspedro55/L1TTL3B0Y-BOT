// ════════════════════════════════════════════════
// ✅ COMANDO !FUTEBOL — 1x1 Você vs Robô
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const FUT_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>⚽ Futebol 1x1</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#0a1f0a;font-family:system-ui;padding:6px;min-height:100vh}
.card{width:100%;max-width:400px;background:#111;border-radius:16px;padding:10px;text-align:center;display:flex;flex-direction:column;max-height:98vh}
.placar{display:flex;gap:8px;margin-bottom:8px}
.placar div{flex:1;background:#1e1e1e;color:#fff;border-radius:10px;padding:8px;font-weight:800;font-size:12px}
.placar b{display:block;font-size:22px;color:#4caf50}
#wrap{position:relative;width:100%}
canvas{width:100%;display:block;border-radius:12px;touch-action:none}
#overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.75);border-radius:12px;z-index:5;gap:10px}
#overlay b{color:#fff;font-size:22px}
#overlay button{padding:12px 36px;border:none;border-radius:999px;background:#4caf50;color:#fff;font-weight:800;font-size:16px}
.controls{display:flex;gap:10px;margin-top:10px;justify-content:center}
.dpad{display:grid;grid-template-columns:60px 60px 60px;gap:6px}
.dpad button{width:60px;height:56px;border:none;border-radius:14px;background:#2a2a2a;color:#fff;font-size:22px}
.dpad button:active{background:#4caf50}
#msg{background:#1e1e1e;color:#ffd54f;border-radius:999px;padding:9px;font-size:12px;font-weight:700;margin-top:8px}
.row{display:flex;gap:8px;margin-top:8px}
.row button{flex:1;padding:11px;border:none;border-radius:999px;font-weight:700;font-size:13px}
</style>
</head>
<body>
<div class="card">
<div class="placar">
<div>🔵 VOCÊ<b id="pv">0</b></div>
<div>⏱️<b id="tempo" style="font-size:16px">90</b></div>
<div>🔴 ROBÔ<b id="pc">0</b></div>
</div>
<div id="wrap">
<canvas id="c" width="360" height="540"></canvas>
<div id="overlay"><b>⚽ FUTEBOL 1x1</b><button onclick="start()">▶️ JOGAR</button></div>
</div>
<div class="controls">
<div class="dpad">
<div></div><button ontouchstart="ky=-1;event.preventDefault()" ontouchend="ky=0" onmousedown="ky=-1" onmouseup="ky=0">▲</button><div></div>
<button ontouchstart="kx=-1;event.preventDefault()" ontouchend="kx=0" onmousedown="kx=-1" onmouseup="kx=0">◀</button><button ontouchstart="ky=1;event.preventDefault()" ontouchend="ky=0" onmousedown="ky=1" onmouseup="ky=0">▼</button><button ontouchstart="kx=1;event.preventDefault()" ontouchend="kx=0" onmousedown="kx=1" onmouseup="kx=0">▶</button>
</div>
</div>
<div id="msg">Marca mais golos que o robô!</div>
<div class="row"><button onclick="novo()" style="background:#2a2a2a;color:#fff">🔄 Novo</button></div>
</div>
<script>
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var W=360,H=540,started=false;
var kx=0,ky=0;
var pj={x:W/2,y:H-100,r:14}, rb={x:W/2,y:100,r:14}, bola={x:W/2,y:H/2,r:9,vx:0,vy:0};
var pv=0,pc=0,tempo=90,lastT=0;
function drawField(){
 ctx.fillStyle='#2d7a2d';ctx.fillRect(0,0,W,H);
 // textura grama
 ctx.fillStyle='rgba(0,0,0,.08)';
 for(var i=0;i<20;i++)ctx.fillRect(0,i*27,W,13);
 ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;
 ctx.strokeRect(12,12,W-24,H-24);
 ctx.beginPath();ctx.moveTo(12,H/2);ctx.lineTo(W-12,H/2);ctx.stroke();
 ctx.beginPath();ctx.arc(W/2,H/2,48,0,7);ctx.stroke();
 ctx.beginPath();ctx.arc(W/2,12,80,0,Math.PI);ctx.stroke();
 ctx.beginPath();ctx.arc(W/2,H-12,80,Math.PI,0);ctx.stroke();
 // balizas
 ctx.fillStyle='#fff';ctx.fillRect(W/2-40,2,80,10);ctx.fillRect(W/2-40,H-12,80,10);
 ctx.strokeStyle='#ff5722';ctx.lineWidth=4;ctx.strokeRect(W/2-40,2,80,10);ctx.strokeRect(W/2-40,H-12,80,10);
}
function start(){document.getElementById('overlay').style.display='none';started=true;novo();requestAnimationFrame(loop);}
function novo(){pv=0;pc=0;tempo=90;resetPos();upd();}
function resetPos(){pj.x=W/2;pj.y=H-100;rb.x=W/2;rb.y=100;bola.x=W/2;bola.y=H/2;bola.vx=0;bola.vy=0;}
function upd(){document.getElementById('pv').textContent=pv;document.getElementById('pc').textContent=pc;document.getElementById('tempo').textContent=Math.ceil(tempo);}
function msg(t){document.getElementById('msg').textContent=t;}
function loop(ts){
 if(!started)return;
 var dt=Math.min(0.05,(ts-lastT)/1000||0.016);lastT=ts;
 tempo-=dt;if(tempo<=0){tempo=0;upd();msg(pv>pc?'🏆 VOCÊ VENCEU!':pv<pc?'🤖 ROBÔ VENCEU!':'🤝 EMPATE!');started=false;return;}
 drawField();
 // jogador anda todo campo
 pj.x+=kx*4;pj.y+=ky*4;
 pj.x=Math.max(24,Math.min(W-24,pj.x));pj.y=Math.max(24,Math.min(H-24,pj.y));
 // robô IA persegue bola
 var dx=bola.x-rb.x,dy=bola.y-rb.y,d=Math.hypot(dx,dy)||1;
 rb.x+=dx/d*2.6;rb.y+=dy/d*2.6;
 // se robô perto chuta para baixo
 if(d<28){bola.vx+=dx/d*2;bola.vy+=dy/d*2+1;}
 // jogador chuta
 var d2=Math.hypot(bola.x-pj.x,bola.y-pj.y);
 if(d2<26){var a=Math.atan2(bola.y-pj.y,bola.x-pj.x);bola.vx=Math.cos(a)*6+kx*2;bola.vy=Math.sin(a)*6+ky*2;}
 // física bola
 bola.x+=bola.vx;bola.y+=bola.vy;bola.vx*=0.985;bola.vy*=0.985;
 if(bola.x<20||bola.x>W-20){bola.vx*=-1;bola.x=Math.max(20,Math.min(W-20,bola.x));}
 // golos
 if(bola.y<14&&Math.abs(bola.x-W/2)<40){pv++;msg('⚽ GOLOOO SEU!');upd();resetPos();}
 if(bola.y>H-14&&Math.abs(bola.x-W/2)<40){pc++;msg('🥅 Gol do robô...');upd();resetPos();}
 if(bola.y<20||bola.y>H-20){if(Math.abs(bola.x-W/2)>=40){bola.vy*=-1;}}
 // desenha
 ctx.fillStyle='#2196f3';ctx.beginPath();ctx.arc(pj.x,pj.y,pj.r,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='#f44336';ctx.beginPath();ctx.arc(rb.x,rb.y,rb.r,0,7);ctx.fill();ctx.stroke();
 // bola
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bola.x,bola.y,bola.r,0,7);ctx.fill();
 ctx.fillStyle='#000';ctx.beginPath();ctx.arc(bola.x-3,bola.y-2,2.5,0,7);ctx.fill();ctx.beginPath();ctx.arc(bola.x+3,bola.y+2,2.5,0,7);ctx.fill();
 upd();
 requestAnimationFrame(loop);
}
</script>
</body>
</html>`;

async function enviarFutebol(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "fut_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: FUT_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "⚽ Futebol" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarFutebol };
