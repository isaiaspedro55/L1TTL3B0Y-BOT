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
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F3ECE0;font-family:system-ui;padding:12px}
.card{width:100%;max-width:360px;background:#FFFDF9;border-radius:20px;padding:16px;text-align:center;border:1px solid #E9DFCE;box-shadow:0 20px 44px rgba(61,42,24,.14)}
h1{color:#3D2A18;font-size:22px}
#score{color:#d97706;font-weight:800;font-size:20px;margin:6px 0}
canvas{width:100%;height:380px;background:#7dd3fc;border-radius:14px;display:block;touch-action:none}
#btn{margin-top:10px;padding:12px 28px;border-radius:999px;border:none;background:#f59e0b;color:#fff;font-weight:700;font-size:16px;cursor:pointer}
.hint{font-size:12px;color:#888;margin-top:6px}
</style>
</head>
<body>
<div class="card">
<h1>🐤 Flappy</h1>
<div id="score">Pontos: 0</div>
<canvas id="c" width="320" height="380"></canvas>
<button id="btn">▶️ Começar</button>
<div class="hint">Toque na tela para voar</div>
</div>
<script>
(function(){
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),
scoreEl=document.getElementById('score'),btn=document.getElementById('btn');
var y=190,vy=0,pipes=[],score=0,run=false,frame=0,over=false;
function reset(){
  y=190;vy=0;pipes=[];score=0;over=false;run=true;frame=0;
  scoreEl.textContent='Pontos: 0';
  btn.textContent='🔄 Recomeçar';
}
function loop(){
  ctx.fillStyle='#7dd3fc';ctx.fillRect(0,0,320,380);
  // nuvens
  ctx.fillStyle='rgba(255,255,255,.7)';
  ctx.beginPath();ctx.arc(80,80,22,0,7);ctx.arc(105,80,18,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(250,120,20,0,7);ctx.arc(272,120,16,0,7);ctx.fill();
  if(run && !over){
    frame++;vy+=0.45;y+=vy;
    if(frame%90===0){
      var gapY=80+Math.random()*140;
      pipes.push({x:320,w:55,gapY:gapY,gapH:115});
    }
    for(var i=0;i<pipes.length;i++){
      var p=pipes[i];p.x-=2.5;
      if(p.x+ p.w>58 && p.x<92 && (y-12<p.gapY || y+12>p.gapY+p.gapH)){
        over=true;run=false;btn.textContent='🔄 Jogar de novo';
      }
      if(Math.floor(p.x+p.w)===58){score++;scoreEl.textContent='Pontos: '+score;}
    }
    pipes=pipes.filter(function(p){return p.x>-60;});
    if(y>368||y<0){over=true;run=false;btn.textContent='🔄 Jogar de novo';}
  }
  ctx.fillStyle='#16a34a';
  pipes.forEach(function(p){
    ctx.fillRect(p.x,0,p.w,p.gapY);
    ctx.fillRect(p.x,p.gapY+p.gapH,p.w,380-p.gapY-p.gapH);
    ctx.fillStyle='#15803d';ctx.fillRect(p.x,p.gapY-8,p.w,8);ctx.fillRect(p.x,p.gapY+p.gapH,p.w,8);ctx.fillStyle='#16a34a';
  });
  // chão
  ctx.fillStyle='#ca8a04';ctx.fillRect(0,368,320,12);
  // pássaro
  ctx.font='28px serif';ctx.fillText('🐤',58,y-14);
  if(over){
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,150,320,80);
    ctx.fillStyle='#fff';ctx.font='bold 20px system-ui';ctx.textAlign='center';
    ctx.fillText('💥 Fim! '+score+' pts',160,198);ctx.textAlign='left';
  }
  requestAnimationFrame(loop);
}
function flap(){ if(!run){ reset(); return; } if(!over) vy=-7; }
cv.addEventListener('touchstart',function(e){e.preventDefault();flap();},{passive:false});
cv.addEventListener('mousedown',flap);
btn.onclick=function(){reset();};
loop();
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
