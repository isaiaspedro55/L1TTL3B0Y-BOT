// ════════════════════════════════════════════════
// ✅ COMANDO !PINGPONG — Ping Pong Vertical
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const PINGPONG_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🏓 Ping Pong</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#FFF3E0;font-family:system-ui;padding:6px;min-height:100vh}
.card{width:100%;max-width:400px;background:#1a3a2a;border-radius:18px;padding:10px;text-align:center;display:flex;flex-direction:column;max-height:98vh;border:2px solid #0d2818}
.top{display:flex;gap:8px;margin-bottom:8px}
.top div{flex:1;background:#2d5a3d;color:#fff;border-radius:10px;padding:8px;font-size:10px;font-weight:800}
.top b{display:block;font-size:18px;margin-top:2px}
#wrap{position:relative;width:100%;flex:1}
canvas{width:100%;display:block;border-radius:12px;touch-action:none;background:#2b6cb0}
#overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.75);border-radius:12px;z-index:5;gap:12px}
#overlay b{color:#fff;font-size:24px}
#overlay button{padding:14px 44px;border:none;border-radius:999px;background:#FFB74D;color:#3E2723;font-weight:800;font-size:17px;cursor:pointer}
.controls{display:flex;gap:12px;margin-top:10px}
.controls button{flex:1;height:68px;border:none;border-radius:16px;font-size:32px;cursor:pointer;background:#FFB74D;color:#3E2723;box-shadow:0 4px 0 #BF360C;font-weight:800}
.controls button:active{transform:translateY(3px);box-shadow:none}
#msg{background:#0d2818;color:#FFD54F;border-radius:999px;padding:9px;font-weight:700;font-size:13px;margin-top:8px}
.row{display:flex;gap:8px;margin-top:8px}
.row button{flex:1;padding:11px;border:none;border-radius:999px;font-weight:700;cursor:pointer;font-size:13px}
#z{background:#2d5a3d;color:#fff}
#nv{background:#FFB74D;color:#3E2723}
#ps{position:absolute;top:10px;right:10px;width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,.9);font-size:20px;z-index:6;cursor:pointer}
</style>
</head>
<body>
<div class="card">
<div class="top">
<div>VOCÊ<b id="pv">0</b></div>
<div>BOLA<b id="vel">1x</b></div>
<div>BOT<b id="cv">0</b></div>
</div>
<div id="wrap">
<canvas id="c" width="360" height="560"></canvas>
<button id="ps" onclick="togglePause()">⏸️</button>
<div id="overlay"><b>🏓 PING PONG</b><button onclick="start()">▶️ JOGAR</button></div>
</div>
<div class="controls">
<button ontouchstart="mv=-1;event.preventDefault()" ontouchend="mv=0" onmousedown="mv=-1" onmouseup="mv=0" onmouseleave="mv=0">◀️</button>
<button ontouchstart="mv=1;event.preventDefault()" ontouchend="mv=0" onmousedown="mv=1" onmouseup="mv=0" onmouseleave="mv=0">▶️</button>
</div>
<div id="msg">Toque em JOGAR</div>
<div class="row"><button id="z" onclick="zerar()">🔄 Zerar</button><button id="nv" onclick="novo()">🎮 Novo</button></div>
</div>
<script>
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var W=360,H=560,mv=0,paused=true,started=false;
var px=W/2-45,cx=W/2-45,bx=W/2,by=H/2,bdx=2.5,bdy=3.5,pv=0,cvv=0,speed=1;
function drawTable(){
 ctx.fillStyle='#2b6cb0';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#fff';ctx.lineWidth=3;
 ctx.strokeRect(8,8,W-16,H-16);
 ctx.beginPath();ctx.moveTo(8,H/2);ctx.lineTo(W-8,H/2);ctx.stroke();
 ctx.beginPath();ctx.moveTo(W/2,8);ctx.lineTo(W/2,H-8);ctx.stroke();
 ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(10,H/2-4,W-20,8);
 ctx.fillStyle='#333';
 for(var i=12;i<W-10;i+=16)ctx.fillRect(i,H/2-4,2,8);
}
function start(){document.getElementById('overlay').style.display='none';started=true;paused=false;document.getElementById('ps').textContent='⏸️';msg2('Você é a raquete de baixo!');loop();}
function novo(){pv=0;cvv=0;speed=1;bx=W/2;by=H/2;bdx=2.5;bdy=-3.5;upd();if(!started)start();else loop();}
function zerar(){pv=0;cvv=0;upd();}
function togglePause(){if(!started)return;paused=!paused;document.getElementById('ps').textContent=paused?'▶️':'⏸️';msg2(paused?'⏸️ Pausado':'▶️ Continuando...');if(!paused)loop();}
function msg2(t){document.getElementById('msg').textContent=t;}
function upd(){document.getElementById('pv').textContent=pv;document.getElementById('cv').textContent=cvv;document.getElementById('vel').textContent=speed.toFixed(1)+'x';}
function loop(){
 if(paused)return;
 drawTable();
 px+=mv*7;if(px<14)px=14;if(px>W-104)px=W-104;
 var t=bx-45;cx+=(t-cx)*0.07;if(cx<14)cx=14;if(cx>W-104)cx=W-104;
 bx+=bdx;by+=bdy;
 if(bx<18||bx>W-18)bdx*=-1;
 ctx.fillStyle='#c0392b';ctx.fillRect(cx,20,90,14);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(cx,20,90,14);
 ctx.fillStyle='#c0392b';ctx.fillRect(px,H-34,90,14);ctx.strokeRect(px,H-34,90,14);
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,9,0,7);ctx.fill();ctx.strokeStyle='#e67e22';ctx.lineWidth=2;ctx.stroke();
 if(by<44&&bdy<0&&bx>cx&&bx<cx+90){bdy=Math.abs(bdy)*1.03;bdx+=(bx-(cx+45))*0.04;speed=Math.abs(bdy)/3.5;upd();}
 if(by>H-48&&bdy>0&&bx>px&&bx<px+90){bdy=-Math.abs(bdy)*1.03;bdx+=(bx-(px+45))*0.04;speed=Math.abs(bdy)/3.5;upd();}
 if(by<0){pv++;msg2('🎉 Você marcou!');upd();reset();}
 if(by>H){cvv++;msg2('🤖 Bot marcou!');upd();reset();}
 requestAnimationFrame(loop);
}
function reset(){bx=W/2;by=H/2;bdx=2.5*(Math.random()>0.5?1:-1);bdy=3.5*(bdy>0?-1:1);if(bdy>0)bdy=3.5;else bdy=-3.5;}
cv.addEventListener('touchmove',function(e){e.preventDefault();var r=cv.getBoundingClientRect();px=(e.touches[0].clientX-r.left)/r.width*W-45;},{passive:false});
upd();
</script>
</body>
</html>`;

async function enviarPingpong(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "pingpong_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: PINGPONG_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🏓 Ping Pong" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarPingpong };
