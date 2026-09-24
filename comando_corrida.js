// ════════════════════════════════════════════════
// ✅ COMANDO !CORRIDA — Corrida interativa (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");
const CORRIDA_HTML = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>🏎️ Corrida</title>
<style>*{margin:0;padding:0;box-sizing:border-box;user-select:none;-webkit-tap-highlight-color:transparent}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F3ECE0;font-family:system-ui;padding:12px}
.card{width:100%;max-width:360px;background:#FFFDF9;border-radius:20px;padding:16px;border:1px solid #E9DFCE;box-shadow:0 20px 44px rgba(61,42,24,.14);text-align:center}
h1{color:#3D2A18;font-size:22px}#dist{color:#dc2626;font-weight:800;margin:6px 0}
canvas{width:100%;height:320px;background:#1e293b;border-radius:14px;display:block;touch-action:none}
#btn{margin-top:10px;padding:12px 28px;border-radius:999px;border:none;background:#dc2626;color:#fff;font-weight:700;cursor:pointer}
.hint{font-size:12px;color:#888;margin-top:6px}</style></head>
<body><div class="card"><h1>🏎️ Corrida</h1><div id="dist">Distância: 0m</div>
<canvas id="c" width="320" height="320"></canvas>
<button id="btn">▶️ Acelerar / Começar</button><div class="hint">Toque na tela ou no botão para desviar e acelerar</div></div>
<script>(function(){
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),distEl=document.getElementById('dist'),btn=document.getElementById('btn');
var car={x:160,y:260,w:34,h:54},obs=[],dist=0,run=false,speed=4,frame=0;
function reset(){obs=[];dist=0;car.x=160;run=true;btn.textContent='🏎️ Acelerar (toque)';}
function spawn(){var w=30+Math.random()*30;obs.push({x:20+Math.random()*240,w:w,h:40,y:-50});}
function loop(){
if(!run){requestAnimationFrame(loop);return;}
frame++;dist+=0.1;distEl.textContent='Distância: '+Math.floor(dist)+'m';
if(frame%50===0)spawn();
speed=4+dist/100;
ctx.fillStyle='#1e293b';ctx.fillRect(0,0,320,320);
// estrada
ctx.fillStyle='#334155';ctx.fillRect(60,0,200,320);
ctx.strokeStyle='#facc15';ctx.setLineDash([15,15]);ctx.beginPath();ctx.moveTo(160,0);ctx.lineTo(160,320);ctx.stroke();ctx.setLineDash([]);
// carro
ctx.fillStyle='#ef4444';ctx.fillRect(car.x-car.w/2,car.y-car.h/2,car.w,car.h);
ctx.fillStyle='#93c5fd';ctx.fillRect(car.x-car.w/2+5,car.y-car.h/2+6,car.w-10,14);
// obstáculos
ctx.fillStyle='#f59e0b';
for(var i=0;i<obs.length;i++){var o=obs[i];o.y+=speed;ctx.fillRect(o.x,o.y,o.w,o.h);
if(o.y>car.y-50&&o.y<car.y+50&&Math.abs(o.x+o.w/2-car.x)<(o.w+car.w)/2-6){gameOver();return;}}
obs=obs.filter(function(o){return o.y<340;});
requestAnimationFrame(loop);}
function gameOver(){run=false;btn.textContent='🔄 Recomeçar';distEl.textContent+=' — 💥 Fim!';}
function move(d){car.x+=d;if(car.x<80)car.x=80;if(car.x>240)car.x=240;}
cv.addEventListener('touchstart',function(e){e.preventDefault();if(!run){reset();}else{var t=e.touches[0],r=cv.getBoundingClientRect();move(t.clientX<r.left+r.width/2?-30:30);}},{passive:false});
cv.addEventListener('mousedown',function(e){if(!run)reset();});
document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')move(-20);if(e.key==='ArrowRight')move(20);});
btn.onclick=function(){if(!run)reset();else dist+=5;};
reset();loop();})();</script></body></html>`;
async function enviarCorrida(sock,jid,quotedMsg){
const p={response_id:"corrida_"+Date.now(),sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:CORRIDA_HTML,trusted_sources:["nixel.dev"]},__typename:"GenAISingleLayoutViewModel",height:"full",full_screen:true}}]};
const c={botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"🏎️ Corrida"}],unifiedResponse:{data:Buffer.from(JSON.stringify(p)).toString("base64")},contextInfo:{forwardingScore:1,isForwarded:true,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}};
const f=generateWAMessageFromContent(jid,c,{userJid:sock.authState?.creds?.me?.id||sock.user?.id,timestamp:new Date()});
await sock.relayMessage(jid,f.message,{messageId:f.key.id});return f;}
module.exports={enviarCorrida};
