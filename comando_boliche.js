// ════════════════════════════════════════════════
// ✅ COMANDO !BOLICHE — Boliche interativo (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const BOLICHE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🎳 Boliche</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;user-select:none;-webkit-tap-highlight-color:transparent}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F3ECE0;font-family:system-ui;padding:14px}
.card{width:100%;max-width:420px;background:#FFFDF9;border-radius:20px;padding:18px;border:1px solid #E9DFCE;box-shadow:0 20px 44px rgba(61,42,24,.14);text-align:center}
h1{color:#3D2A18}#score{font-weight:700;color:#B5652E;margin:8px 0}
canvas{width:100%;height:380px;background:#8B5A2B;border-radius:12px;display:block;touch-action:none}
button{margin-top:10px;padding:12px 24px;border-radius:999px;border:none;background:#B5652E;color:#fff;font-weight:700;cursor:pointer}
</style>
</head>
<body>
<div class="card"><h1>🎳 Boliche</h1><div id="score">Pinos: 10 | Arremessos: 0</div><canvas id="c" width="380" height="400"></canvas><button id="btn">🎳 Arremessar</button></div>
<script>
(function(){
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),scoreEl=document.getElementById('score'),btn=document.getElementById('btn');
var pins=[],ball={x:190,y:360,vx:0,vy:0,go:false},throws=0,aim=0,dir=1;
function resetPins(){pins=[];var rows=[[190,80],[160,110],[220,110],[130,140],[190,140],[250,140],[100,170],[160,170],[220,170],[280,170]];rows.forEach(function(p){pins.push({x:p[0],y:p[1],down:false});});}
resetPins();
function loop(){
ctx.clearRect(0,0,380,400);
// pista
ctx.fillStyle='#D2A679';ctx.fillRect(120,0,140,400);
ctx.fillStyle='#8B5A2B';ctx.fillRect(0,0,120,400);ctx.fillRect(260,0,120,400);
// mira
if(!ball.go){aim+=dir*2;if(aim>60||aim<-60)dir*=-1;ctx.strokeStyle='#fff';ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(ball.x+aim,60);ctx.stroke();ctx.setLineDash([]);}
// pinos
ctx.font='24px serif';ctx.textAlign='center';
pins.forEach(function(p){if(!p.down)ctx.fillText('🎳',p.x,p.y);});
// bola
if(ball.go){ball.x+=ball.vx;ball.y+=ball.vy;
pins.forEach(function(p){if(!p.down){var dx=ball.x-p.x,dy=ball.y-p.y;if(dx*dx+dy*dy<400){p.down=true;}}});
if(ball.y<40){ball.go=false;ball.x=190;ball.y=360;updateScore();}}
ctx.font='28px serif';ctx.fillText('⚫',ball.x,ball.y);
requestAnimationFrame(loop);
}
function updateScore(){var up=pins.filter(function(p){return !p.down}).length;scoreEl.textContent='Pinos em pé: '+up+' | Arremessos: '+throws;if(up===0){scoreEl.textContent='🎉 STRIKE! Todos derrubados em '+throws+' arremessos!';}}
btn.onclick=function(){
if(ball.go)return;throws++;
ball.vx=aim*0.06;ball.vy=-8;ball.go=true;
if(pins.every(function(p){return p.down})){resetPins();throws=0;}
};
loop();
})();
</script>
</body>
</html>`;

async function enviarBoliche(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "boliche_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: BOLICHE_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🎳 Boliche" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarBoliche };
