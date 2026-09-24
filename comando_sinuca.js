// ════════════════════════════════════════════════
// ✅ COMANDO !SINUCA — Sinuca (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const SINUCA_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🎱 Sinuca</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{display:flex;justify-content:center;background:#FFD60A;font-family:system-ui;padding:10px;min-height:100vh}
.card{width:100%;max-width:400px;background:#FFD60A;border-radius:20px;padding:18px;text-align:center}
h1{font-size:28px;color:#1a1a00;margin-bottom:4px}
.sub{color:#1a1a00;font-weight:700;margin-bottom:12px;font-size:15px}
#score{font-weight:800;margin-bottom:8px;color:#1a1a00}
.wrap{width:100%;background:#FFD60A;border-radius:14px;padding:4px}
canvas{width:100%;height:380px;background:#0a7a3d;border-radius:10px;display:block;touch-action:none;border:12px solid #7a3e1a}
#btn{margin-top:12px;width:100%;padding:13px;border:none;border-radius:999px;background:#1a1a00;color:#FFD60A;font-weight:800;font-size:16px;cursor:pointer}
.hint{font-size:12px;color:#1a1a00;margin-top:8px;font-weight:600}
</style>
</head>
<body>
<div class="card">
<h1>🎱 Sinuca</h1>
<div class="sub">Arraste da bola branca para mirar e soltar</div>
<div id="score">Encaçapadas: 0</div>
<div class="wrap"><canvas id="c"></canvas></div>
<button id="btn" onclick="reset()">🔄 Novo Jogo</button>
<div class="hint">🔊 Som ativado</div>
</div>
<script>
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
function fit(){var r=cv.getBoundingClientRect();cv.width=r.width;cv.height=380;}
window.addEventListener('resize',fit);fit();
var AC=null;
function beep(f,d,type){try{
if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();
var o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.value=f;
g.gain.setValueAtTime(0.25,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.01,AC.currentTime+d);
o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d);
}catch(e){}}
function sndHit(){beep(220,0.12,'square');}
function sndPocket(){beep(520,0.25,'sine');setTimeout(()=>beep(780,0.25,'sine'),120);}
function sndWall(){beep(150,0.08,'triangle');}
var balls=[],white,aiming=false,aimX=0,aimY=0,count=0;
var pockets=[{x:15,y:15},{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];
function setupPockets(){var W=cv.width,H=380;pockets=[{x:12,y:12},{x:W/2,y:8},{x:W-12,y:12},{x:12,y:H-12},{x:W/2,y:H-8},{x:W-12,y:H-12}];}
function reset(){
 fit();setupPockets();count=0;document.getElementById('score').textContent='Encaçapadas: 0';
 balls=[];var colors=['#e5383b','#f4a261','#ffd60a','#2a9d8f','#3a86ff','#8338ec'];
 for(var i=0;i<6;i++){balls.push({x:60+Math.random()*(cv.width-120),y:60+Math.random()*180,vx:0,vy:0,c:colors[i],r:11});}
 white={x:cv.width/2,y:300,vx:0,vy:0,c:'#fff',r:11};balls.push(white);
}
function loop(){
 ctx.fillStyle='#0a7a3d';ctx.fillRect(0,0,cv.width,380);
 pockets.forEach(p=>{ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,p.y,14,18,0,0,7);ctx.fill();});
 balls.forEach(b=>{
  b.x+=b.vx;b.y+=b.vy;b.vx*=0.985;b.vy*=0.985;
  if(Math.abs(b.vx)<0.05)b.vx=0;if(Math.abs(b.vy)<0.05)b.vy=0;
  if(b.x<18){b.x=18;b.vx*=-0.8;sndWall();}if(b.x>cv.width-18){b.x=cv.width-18;b.vx*=-0.8;sndWall();}
  if(b.y<18){b.y=18;b.vy*=-0.8;sndWall();}if(b.y>362){b.y=362;b.vy*=-0.8;sndWall();}
 });
 for(var i=0;i<balls.length;i++)for(var j=i+1;j<balls.length;j++){
  var a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  if(d<22&&d>0){var nx=dx/d,ny=dy/d;var tx=(a.vx+b.vx)/2,ty=(a.vy+b.vy)/2;a.vx=tx+(a.x-b.x)*0.02;a.vy=ty+(a.y-b.y)*0.02;b.vx=tx+(b.x-a.x)*0.02;b.vy=ty+(b.y-a.y)*0.02;sndHit();}
 }
 balls=balls.filter(b=>{
  for(var p of pockets){if(Math.hypot(b.x-p.x,b.y-p.y)<16){if(b!==white){sndPocket();count++;document.getElementById('score').textContent='Encaçapadas: '+count;return false;}else{b.x=cv.width/2;b.y=300;b.vx=0;b.vy=0;return true;}}}
  return true;
 });
 balls.forEach(b=>{ctx.fillStyle=b.c;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.arc(b.x-3,b.y-3,4,0,7);ctx.fill();});
 if(aiming){ctx.strokeStyle='#fff';ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(white.x,white.y);ctx.lineTo(aimX,aimY);ctx.stroke();ctx.setLineDash([]);}
 requestAnimationFrame(loop);
}
function pos(e){var r=cv.getBoundingClientRect();var t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
cv.addEventListener('touchstart',e=>{e.preventDefault();var p=pos(e);if(Math.hypot(p.x-white.x,p.y-white.y)<30){aiming=true;aimX=p.x;aimY=p.y;}},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();if(aiming){var p=pos(e);aimX=p.x;aimY=p.y;}},{passive:false});
cv.addEventListener('touchend',e=>{if(aiming){aiming=false;white.vx=(white.x-aimX)*0.08;white.vy=(white.y-aimY)*0.08;sndHit();}});
cv.addEventListener('mousedown',e=>{var p=pos(e);if(Math.hypot(p.x-white.x,p.y-white.y)<30){aiming=true;aimX=p.x;aimY=p.y;}});
cv.addEventListener('mousemove',e=>{if(aiming){var p=pos(e);aimX=p.x;aimY=p.y;}});
cv.addEventListener('mouseup',()=>{if(aiming){aiming=false;white.vx=(white.x-aimX)*0.08;white.vy=(white.y-aimY)*0.08;sndHit();}});
reset();loop();
</script>
</body>
</html>`;

async function enviarSinuca(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "sinuca_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: SINUCA_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🎱 Sinuca" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarSinuca };
