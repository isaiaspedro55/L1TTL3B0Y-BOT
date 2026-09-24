// ════════════════════════════════════════════════
// ✅ COMANDO !PONG — Pong Profissional (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const PONG_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🏓 Pong</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#FFF3E0;font-family:system-ui;padding:8px;min-height:100vh}
.card{width:100%;max-width:420px;background:#FFFDF7;border-radius:20px;padding:14px;text-align:center;border:2px solid #FFB74D;display:flex;flex-direction:column;max-height:98vh}
h1{font-size:28px;color:#4E342E}
.score{font-size:18px;font-weight:800;color:#00897B;margin:4px 0 10px}
#wrap{position:relative;width:100%}
canvas{width:100%;height:auto;aspect-ratio:3/4;background:#0F172A;border-radius:16px;display:block;border:3px solid #4E342E;touch-action:none}
#overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(15,23,42,.85);border-radius:16px;z-index:5;gap:12px}
#overlay b{color:#fff;font-size:22px}
#overlay button{padding:14px 40px;border:none;border-radius:999px;background:#FFB74D;color:#4E342E;font-weight:800;font-size:16px;cursor:pointer}
.controls{display:flex;gap:10px;margin-top:12px;justify-content:center}
.controls button{width:80px;height:64px;border:none;border-radius:16px;font-size:28px;cursor:pointer;background:#FFE0B2;color:#4E342E;font-weight:800;box-shadow:0 4px 0 #BF360C}
.controls button:active{transform:translateY(3px);box-shadow:none}
#pauseBtn{background:#4E342E;color:#FFD54F}
.top{display:flex;gap:8px;margin-bottom:10px}
.top div{flex:1;background:#FFE0B2;border-radius:10px;padding:6px;font-size:11px;font-weight:700;color:#5D2800}
.top b{display:block;font-size:15px}
</style>
</head>
<body>
<div class="card">
<h1>🏓 Pong</h1>
<div class="score" id="placar">Você 0 : 0 CPU</div>
<div class="top">
<div>VELOCIDADE<b id="vel">1x</b></div>
<div>RECORDE<b id="rec">0</b></div>
<div>STATUS<b id="st">⏸️</b></div>
</div>
<div id="wrap">
<canvas id="c" width="360" height="480"></canvas>
<div id="overlay"><b>🏓 PONG</b><button onclick="start()">▶️ JOGAR</button></div>
</div>
<div class="controls">
<button id="bl" onmousedown="mv=-1" onmouseup="mv=0" ontouchstart="mv=-1;event.preventDefault()" ontouchend="mv=0">◀️</button>
<button id="pauseBtn" onclick="togglePause()">⏸️</button>
<button id="br" onmousedown="mv=1" onmouseup="mv=0" ontouchstart="mv=1;event.preventDefault()" ontouchend="mv=0">▶️</button>
</div>
</div>
<script>
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var W=360,H=480,paused=true,started=false,raf=null;
var pv=0,cv2=0,mv=0,px=W/2-40,cx=W/2-40,bx=W/2,by=H/2,bdx=3,bdy=3;
var rec=0;
function start(){document.getElementById('overlay').style.display='none';started=true;paused=false;updSt();loop();}
function togglePause(){if(!started)return;paused=!paused;updSt();document.getElementById('pauseBtn').textContent=paused?'▶️':'⏸️';if(!paused)loop();}
function updSt(){document.getElementById('st').textContent=paused?'⏸️':'▶️';}
function loop(){
 if(paused)return;
 ctx.fillStyle='#0F172A';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#334155';ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();ctx.setLineDash([]);
 // move player
 px+=mv*6; if(px<0)px=0; if(px>W-80)px=W-80;
 // cpu IA
 var target=bx-40; cx+=(target-cx)*0.08; if(cx<0)cx=0; if(cx>W-80)cx=W-80;
 // ball
 bx+=bdx;by+=bdy;
 if(bx<6||bx>W-6)bdx*=-1;
 // paddles
 ctx.fillStyle='#fff';ctx.fillRect(cx,10,80,12);ctx.fillRect(px,H-22,80,12);
 ctx.fillStyle='#FFB74D';ctx.beginPath();ctx.arc(bx,by,8,0,7);ctx.fill();
 // colisão
 if(by<28&&bx>cx&&bx<cx+80){bdy=Math.abs(bdy);bdx+=(bx-(cx+40))*0.03;}
 if(by>H-36&&bx>px&&bx<px+80){bdy=-Math.abs(bdy);bdx+=(bx-(px+40))*0.03;pv++;}
 if(by<0){cv2++;reset();}
 if(by>H){pv++;reset();}
 document.getElementById('placar').textContent='Você '+pv+' : '+cv2+' CPU';
 document.getElementById('vel').textContent=Math.abs(bdy).toFixed(1)+'x';
 if(pv>rec){rec=pv;document.getElementById('rec').textContent=rec;}
 // touch drag
 raf=requestAnimationFrame(loop);
}
function reset(){bx=W/2;by=H/2;bdx=3*(Math.random()>0.5?1:-1);bdy=3*(Math.random()>0.5?1:-1);}
cv.addEventListener('touchmove',function(e){e.preventDefault();var r=cv.getBoundingClientRect();var t=e.touches[0];px=(t.clientX-r.left)/r.width*W-40;if(px<0)px=0;if(px>W-80)px=W-80;},{passive:false});
</script>
</body>
</html>`;

async function enviarPong(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "pong_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: PONG_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🏓 Pong" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarPong };
