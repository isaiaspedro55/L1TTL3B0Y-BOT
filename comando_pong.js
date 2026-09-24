// ════════════════════════════════════════════════
// ✅ COMANDO !PONG — Pong interativo (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");
const PONG_HTML = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>🏓 Pong</title>
<style>*{margin:0;padding:0;box-sizing:border-box;user-select:none;-webkit-tap-highlight-color:transparent}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F3ECE0;font-family:system-ui;padding:12px}
.card{width:100%;max-width:360px;background:#FFFDF9;border-radius:20px;padding:16px;text-align:center;border:1px solid #E9DFCE;box-shadow:0 20px 44px rgba(61,42,24,.14)}
h1{color:#3D2A18}#pl{color:#0d9488;font-weight:800;margin:6px 0}
canvas{width:100%;height:300px;background:#0f172a;border-radius:14px;display:block;touch-action:none}
#btn{margin-top:10px;padding:12px 28px;border-radius:999px;border:none;background:#0d9488;color:#fff;font-weight:700}
.hint{font-size:12px;color:#888;margin-top:6px}</style></head>
<body><div class="card"><h1>🏓 Pong</h1><div id="pl">Você 0 : 0 CPU</div>
<canvas id="c" width="320" height="300"></canvas>
<button id="btn">▶️ Começar</button><div class="hint">Arraste o dedo na tela para mover a raquete</div></div>
<script>(function(){
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),pl=document.getElementById('pl'),btn=document.getElementById('btn');
var pw=70,ph=10,px=125,bx=160,by=150,bvx=3,bvy=3,cx=125,ps=0,cs=0,run=false;
function reset(){bx=160;by=150;bvx=3*(Math.random()<.5?-1:1);bvy=3;}
function loop(){
ctx.fillStyle='#0f172a';ctx.fillRect(0,0,320,300);
ctx.fillStyle='#fff';ctx.fillRect(px,285,pw,ph);ctx.fillRect(cx,5,pw,ph);
ctx.beginPath();ctx.arc(bx,by,8,0,7);ctx.fill();
if(run){bx+=bvx;by+=bvy;
if(bx<8||bx>312)bvx*=-1;
if(by<22&&bx>cx&&bx<cx+pw)bvy=Math.abs(bvy);
if(by>278&&bx>px&&bx<px+pw)bvy=-Math.abs(bvy);
if(by<0){ps++;upd();reset();} if(by>300){cs++;upd();reset();}
cx+= (bx-cx-pw/2)*0.06; if(cx<0)cx=0; if(cx>250)cx=250;}
requestAnimationFrame(loop);}
function upd(){pl.textContent='Você '+ps+' : '+cs+' CPU';}
function moveTo(clientX){var r=cv.getBoundingClientRect();px=(clientX-r.left)/r.width*320-pw/2;if(px<0)px=0;if(px>250)px=250;}
cv.addEventListener('touchmove',function(e){e.preventDefault();moveTo(e.touches[0].clientX);},{passive:false});
cv.addEventListener('touchstart',function(e){e.preventDefault();if(!run){run=true;btn.textContent='⏸️ Pausar';}moveTo(e.touches[0].clientX);},{passive:false});
cv.addEventListener('mousemove',function(e){moveTo(e.clientX);});
btn.onclick=function(){run=!run;btn.textContent=run?'⏸️ Pausar':'▶️ Continuar';if(run&&by===150)reset();};
loop();})();</script></body></html>`;
async function enviarPong(sock,jid,quotedMsg){
const p={response_id:"pong_"+Date.now(),sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:PONG_HTML,trusted_sources:["nixel.dev"]},__typename:"GenAISingleLayoutViewModel",height:"full",full_screen:true}}]};
const c={botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"🏓 Pong"}],unifiedResponse:{data:Buffer.from(JSON.stringify(p)).toString("base64")},contextInfo:{forwardingScore:1,isForwarded:true,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}};
const f=generateWAMessageFromContent(jid,c,{userJid:sock.authState?.creds?.me?.id||sock.user?.id,timestamp:new Date()});
await sock.relayMessage(jid,f.message,{messageId:f.key.id});return f;}
module.exports={enviarPong};
