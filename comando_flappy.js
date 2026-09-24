// ════════════════════════════════════════════════
// ✅ COMANDO !FLAPPY — Flappy Bird interativo (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const FLAPPY_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🐤 Flappy</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;user-select:none;-webkit-tap-highlight-color:transparent}
html,body{height:100%}
body{display:flex;align-items:flex-start;justify-content:center;background:#F3ECE0;font-family:system-ui,-apple-system,sans-serif;padding:8px;overflow:hidden}
.card{width:100%;max-width:360px;background:#FFFDF9;border-radius:16px;padding:12px;text-align:center;border:1px solid #E9DFCE;box-shadow:0 20px 44px rgba(61,42,24,.14);display:flex;flex-direction:column;max-height:94vh}
h1{color:#3D2A18;font-size:20px}
#score{color:#d97706;font-weight:800;font-size:18px;margin:4px 0 8px}
.wrap{width:100%;flex:1;min-height:0}
canvas{width:100%;height:100%;min-height:300px;max-height:54vh;background:#7dd3fc;border-radius:12px;display:block;touch-action:none}
#btn{margin-top:10px;padding:11px 24px;border-radius:999px;border:none;background:#f59e0b;color:#fff;font-weight:700;font-size:15px;cursor:pointer;flex-shrink:0}
.hint{font-size:11px;color:#888;margin-top:6px;flex-shrink:0}
</style>
</head>
<body>
<div class="card">
<h1>🐤 Flappy</h1>
<div id="score">Pontos: 0</div>
<div class="wrap"><canvas id="c"></canvas></div>
<button id="btn">▶️ Começar</button>
<div class="hint">Toque na tela para voar</div>
</div>
<script>
(function(){
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),scoreEl=document.getElementById('score'),btn=document.getElementById('btn');
function fit(){var r=cv.getBoundingClientRect();cv.width=r.width;cv.height=r.height;}
window.addEventListener('resize',fit);
var y=150,vy=0,pipes=[],score=0,run=false,frame=0,over=false;
function W(){return cv.width} function H(){return cv.height}
function reset(){fit();y=H()*0.45;vy=0;pipes=[];score=0;over=false;run=true;frame=0;scoreEl.textContent='Pontos: 0';btn.textContent='🔄 Recomeçar';}
function loop(){
ctx.fillStyle='#7dd3fc';ctx.fillRect(0,0,W(),H());
ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(W()*0.25,60,18,0,7);ctx.arc(W()*0.32,60,14,0,7);ctx.fill();
if(run&&!over){frame++;vy+=0.45;y+=vy;
if(frame%85===0){var gapY=50+Math.random()*(H()*0.4);pipes.push({x:W(),w:52,gapY:gapY,gapH:110});}
for(var i=0;i<pipes.length;i++){var p=pipes[i];p.x-=2.6;var bx=W()*0.22;
if(p.x+p.w>bx&&p.x<bx+28&&(y-12<p.gapY||y+12>p.gapY+p.gapH)){over=true;run=false;btn.textContent='🔄 Jogar de novo';}
if(Math.floor(p.x+p.w)===Math.floor(bx)){score++;scoreEl.textContent='Pontos: '+score;}}
pipes=pipes.filter(function(p){return p.x>-60;});
if(y>H()-22||y<0){over=true;run=false;btn.textContent='🔄 Jogar de novo';}}
var gh=20;ctx.fillStyle='#16a34a';
pipes.forEach(function(p){ctx.fillRect(p.x,0,p.w,p.gapY);ctx.fillRect(p.x,p.gapY+p.gapH,p.w,H()-p.gapY-p.gapH-gh);});
ctx.fillStyle='#ca8a04';ctx.fillRect(0,H()-gh,W(),gh);
ctx.font='26px serif';ctx.fillText('🐤',W()*0.22,y-14);
if(over){ctx.fillStyle='rgba(0,0,0,.6)';var bw=W()*0.84,bx0=(W()-bw)/2;ctx.fillRect(bx0,H()*0.38,bw,60);ctx.fillStyle='#fff';ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillText('💥 Fim! '+score+' pts',W()/2,H()*0.38+38);ctx.textAlign='left';}
requestAnimationFrame(loop);}
function flap(){if(!run){reset();return;}if(!over)vy=-7;}
cv.addEventListener('touchstart',function(e){e.preventDefault();flap();},{passive:false});
cv.addEventListener('mousedown',flap);
btn.onclick=function(){reset();};
fit();loop();
})();
</script>
</body>
</html>`;

async function enviarFlappy(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "flappy_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: FLAPPY_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🐤 Flappy" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarFlappy };
