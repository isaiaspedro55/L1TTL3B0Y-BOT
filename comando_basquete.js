// ════════════════════════════════════════════════
// ✅ COMANDO !BASQUETE — Tela Grande Vertical
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const BASQ_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🏀 Basquete</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#FFF3E0;font-family:system-ui;padding:6px;min-height:100vh}
.card{width:100%;max-width:440px;background:#FFFDF7;border-radius:20px;padding:14px;text-align:center;border:2px solid #FFB74D;display:flex;flex-direction:column;max-height:98vh}
h1{font-size:32px;color:#4E342E}
p{color:#8D6E63;font-size:15px;margin:4px 0}
#placar{font-size:20px;font-weight:800;color:#E65100;margin:8px 0}
#wrap{position:relative;width:100%;flex:1}
canvas{width:100%;display:block;border-radius:16px;background:linear-gradient(#87CEEB,#E0F7FA);touch-action:none;border:3px solid #4E342E}
#overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.6);border-radius:16px;z-index:5;gap:10px}
#overlay button{padding:14px 44px;border:none;border-radius:999px;background:#FF9800;color:#fff;font-weight:800;font-size:17px}
#msg{background:#FFE0B2;color:#5D2800;border-radius:999px;padding:10px;font-weight:700;font-size:14px;margin-top:10px}
.row{display:flex;gap:8px;margin-top:10px}
.row button{flex:1;padding:13px;border:none;border-radius:999px;font-weight:700;font-size:14px;cursor:pointer}
</style>
</head>
<body>
<div class="card">
<h1>🏀 Basquete</h1>
<p>Arraste para trás e solte para arremessar</p>
<div id="placar">Cestas: 0 / Tentativas: 0</div>
<div id="wrap">
<canvas id="c" width="400" height="600"></canvas>
<div id="overlay"><button onclick="start()">▶️ JOGAR</button></div>
</div>
<div id="msg">Puxe a bola para baixo e solte!</div>
<div class="row"><button onclick="reset()" style="background:#eee">🔄 Novo</button><button onclick="reset()" style="background:#FF9800;color:#fff">🎮 Novo Jogo</button></div>
</div>
<script>
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var W=400,H=600,started=false;
var bola={x:W/2,y:H-120,r:22,vx:0,vy:0,held:false,sx:0,sy:0};
var cesta={x:W-90,y:180,r:28};
var cestas=0,tent=0;
function start(){document.getElementById('overlay').style.display='none';started=true;loop();}
function reset(){cestas=0;tent=0;resetBola();upd();}
function resetBola(){bola.x=W/2;bola.y=H-120;bola.vx=0;bola.vy=0;bola.held=false;}
function upd(){document.getElementById('placar').textContent='Cestas: '+cestas+' / Tentativas: '+tent;}
function msg(t){document.getElementById('msg').textContent=t;}
function loop(){
 ctx.clearRect(0,0,W,H);
 // tabela
 ctx.fillStyle='#fff';ctx.fillRect(cesta.x+10,cesta.y-90,8,90);
 ctx.strokeStyle='#E65100';ctx.lineWidth=6;ctx.beginPath();ctx.arc(cesta.x,cesta.y,cesta.r,0,7);ctx.stroke();
 // bola
 if(!bola.held){bola.x+=bola.vx;bola.y+=bola.vy;bola.vy+=0.35;}
 if(bola.y>H||bola.x<0||bola.x>W){
   // errou
   if(bola.y>H+40){resetBola();msg('❌ Errou! Tente de novo');}
 }
 // cesta?
 var d=Math.hypot(bola.x-cesta.x,bola.y-cesta.y);
 if(d<cesta.r&&bola.vy>0&&bola.y<cesta.y+10){cestas++;msg('🎉 CESTA! Boa!');setTimeout(resetBola,600);bola.vx=0;bola.vy=0;bola.x=-100;}
 // desenha bola
 if(bola.x>-50){
 ctx.fillStyle='#FF9800';ctx.beginPath();ctx.arc(bola.x,bola.y,bola.r,0,7);ctx.fill();
 ctx.strokeStyle='#5D2800';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bola.x-bola.r,bola.y);ctx.lineTo(bola.x+bola.r,bola.y);ctx.stroke();
 ctx.beginPath();ctx.moveTo(bola.x,bola.y-bola.r);ctx.lineTo(bola.x,bola.y+bola.r);ctx.stroke();
 // mira
 if(bola.held){ctx.strokeStyle='#E65100';ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(bola.x,bola.y);ctx.lineTo(bola.x+(bola.x-bola.sx)*2,bola.y+(bola.y-bola.sy)*2);ctx.stroke();ctx.setLineDash([]);}
 }
 requestAnimationFrame(loop);
}
function pos(e){var r=cv.getBoundingClientRect();var t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)/r.width*W,y:(t.clientY-r.top)/r.height*H};}
cv.addEventListener('mousedown',function(e){var p=pos(e);if(Math.hypot(p.x-bola.x,p.y-bola.y)<40){bola.held=true;bola.sx=p.x;bola.sy=p.y;}});
cv.addEventListener('mousemove',function(e){if(bola.held){var p=pos(e);bola.sx=p.x;bola.sy=p.y;}});
cv.addEventListener('mouseup',function(e){if(bola.held){bola.held=false;tent++;upd();bola.vx=(bola.x-bola.sx)*0.15;bola.vy=(bola.y-bola.sy)*0.15;msg('🏀 Voou!');}});
cv.addEventListener('touchstart',function(e){e.preventDefault();var p=pos(e);if(Math.hypot(p.x-bola.x,p.y-bola.y)<50){bola.held=true;bola.sx=p.x;bola.sy=p.y;}},{passive:false});
cv.addEventListener('touchmove',function(e){e.preventDefault();if(bola.held){var p=pos(e);bola.sx=p.x;bola.sy=p.y;}},{passive:false});
cv.addEventListener('touchend',function(e){e.preventDefault();if(bola.held){bola.held=false;tent++;upd();bola.vx=(bola.x-bola.sx)*0.15;bola.vy=(bola.y-bola.sy)*0.15;msg('🏀 Voou!');}},{passive:false});
upd();
</script>
</body>
</html>`;

async function enviarBasquete(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "basq_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: BASQ_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🏀 Basquete" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarBasquete };
