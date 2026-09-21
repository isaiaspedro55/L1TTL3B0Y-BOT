// ════════════════════════════════════════════════
// ✅ COMANDO !COBRA — Snake com MENSAGEM DE PERDEU
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const SNAKE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Snake</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{background:#F3ECE0;font-family:system-ui,sans-serif;display:flex;justify-content:center;padding:10px}
.card{width:100%;max-width:390px;background:#FFFDF9;border-radius:20px;padding:12px;border:1px solid #E9DFCE;box-shadow:0 10px 30px rgba(61,42,24,.15)}
h1{text-align:center;font-size:22px;color:#3D2A18}
.sub{text-align:center;color:#A9977E;font-size:11px;margin-bottom:8px}
.top{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px}
.stat{background:#F6EEDD;border:1px solid #E9DBBF;border-radius:10px;padding:6px;text-align:center}
.stat span{font-size:8px;color:#8A6A3F;display:block}
.stat b{font-size:14px;color:#3D2A18;display:block}
.gameWrap{background:#2A1B0E;border-radius:14px;padding:8px}
#canvas{width:100%;height:360px;background:#0e2118;border-radius:10px;display:block}
.controls{display:grid;grid-template-columns:60px 60px 60px;grid-template-rows:60px 60px;gap:8px;justify-content:center;margin-top:12px}
.cbtn{width:60px;height:60px;background:#FFFDF9;border:1px solid #E9DFCE;border-radius:12px;font-size:20px;font-weight:800;color:#3D2A18;box-shadow:0 4px 0 #D8CDB4}
.cbtn:active{transform:translateY(3px);box-shadow:none}
.cbtn.up{grid-column:2}.cbtn.left{grid-column:1;grid-row:2}.cbtn.down{grid-column:2;grid-row:2}.cbtn.right{grid-column:3;grid-row:2}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.btn{border:none;border-radius:999px;padding:11px;font-weight:700;font-size:12px;cursor:pointer}
.btn-dark{background:#F6EEDD;color:#8A6A3F;border:1px solid #E9DBBF}
.btn-play{background:#B5652E;color:#fff;box-shadow:0 3px 0 #8C4A1E}
.btn-play:active{transform:translateY(2px);box-shadow:0 1px 0 #8C4A1E}
#overlay{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(243,236,224,.96);display:flex;align-items:center;justify-content:center;padding:18px;z-index:999}
#overlay.hide{display:none}
.ovCard{background:#FFFDF9;border-radius:20px;padding:22px;width:100%;max-width:300px;text-align:center;border:1px solid #E9DFCE;box-shadow:0 20px 40px rgba(61,42,24,.2)}
</style>
</head>
<body>
<div class="card">
<h1>🐍 Snake</h1>
<p class="sub">coma as maçãs · não bata na parede</p>
<div class="top">
<div class="stat"><span>PONTOS</span><b id="score">0</b></div>
<div class="stat"><span>RECORDE</span><b id="record">0</b></div>
<div class="stat"><span>VEL.</span><b id="speed">1x</b></div>
</div>
<div class="gameWrap"><canvas id="canvas" width="300" height="300"></canvas></div>
<div class="controls">
<button class="cbtn up" data-d="up">▲</button>
<button class="cbtn left" data-d="left">◀</button>
<button class="cbtn down" data-d="down">▼</button>
<button class="cbtn right" data-d="right">▶</button>
</div>
<div class="btns">
<button class="btn btn-dark" id="pauseBtn">⏸️ Pausar</button>
<button class="btn btn-dark" id="newBtn">🔄 Nova</button>
</div>
</div>

<div id="overlay">
<div class="ovCard">
<div id="ovEmoji" style="font-size:48px">🐍</div>
<h2 id="ovTitle" style="font-size:22px;color:#3D2A18;margin:8px 0">Snake</h2>
<p id="ovText" style="color:#A9977E;font-size:12px;margin-bottom:12px">Deslize na tabela para mover</p>
<p id="ovMotivo" style="color:#B5652E;font-size:13px;font-weight:700;margin-bottom:12px;display:none"></p>
<button class="btn btn-play" id="playBtn" style="width:100%;padding:14px">▶️ JOGAR</button>
<p style="margin-top:8px;font-size:10px;color:#A9977E">Recorde: <span id="ovRec">0</span></p>
</div>
</div>

<script>
var canvas=document.getElementById('canvas');
var ctx=canvas.getContext('2d');
var GRID=15;
var snake,dir,nextDir,food,score,speed,loop,running=false,paused=false;
var lastHit='';
var scoreEl=document.getElementById('score');
var recordEl=document.getElementById('record');
var speedEl=document.getElementById('speed');
var overlay=document.getElementById('overlay');

function loadRec(){var r=parseInt(localStorage.getItem('snake_rec')||'0');recordEl.textContent=r;document.getElementById('ovRec').textContent=r;return r}
function saveRec(s){var r=loadRec();if(s>r){localStorage.setItem('snake_rec',s);loadRec();return true}return false}
function rndFood(){var p;do{p={x:Math.floor(Math.random()*GRID),y:Math.floor(Math.random()*GRID)}}while(snake.some(function(s){return s.x===p.x&&s.y===p.y}));return p}
function init(){snake=[{x:7,y:7},{x:6,y:7},{x:5,y:7}];dir={x:1,y:0};nextDir={x:1,y:0};food=rndFood();score=0;speed=1;lastHit='';scoreEl.textContent=0;speedEl.textContent='1x';document.getElementById('ovMotivo').style.display='none'}
function draw(){var CELL=canvas.width/GRID;ctx.fillStyle='#0e2118';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#143825';for(var i=0;i<=GRID;i++){ctx.fillRect(i*CELL,0,1,canvas.height);ctx.fillRect(0,i*CELL,canvas.width,1)}ctx.fillStyle='#ff3344';ctx.beginPath();ctx.arc(food.x*CELL+CELL/2,food.y*CELL+CELL/2,CELL*0.36,0,Math.PI*2);ctx.fill();for(var k=0;k<snake.length;k++){var s=snake[k];ctx.fillStyle=k===0?'#00ff88':'#00b85c';ctx.fillRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2)}}

function step(){
 if(!running||paused)return;
 dir=nextDir;
 var head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};

 // COLISÃO PAREDE
 if(head.x<0||head.x>=GRID||head.y<0||head.y>=GRID){
   lastHit='parede';
   return over();
 }
 // COLISÃO COM O PRÓPRIO CORPO
 if(snake.some(function(s){return s.x===head.x&&s.y===head.y})){
   lastHit='corpo';
   return over();
 }

 snake.unshift(head);
 if(head.x===food.x&&head.y===food.y){
   score+=10;scoreEl.textContent=score;
   if(score%50===0){speed++;speedEl.textContent=speed+'x';restart()};
   food=rndFood();
 }else{snake.pop()}
 draw();
}

function restart(){clearInterval(loop);loop=setInterval(step,Math.max(60,160-speed*14))}

function over(){
 running=false;clearInterval(loop);
 var isNew=saveRec(score);
 var emoji=document.getElementById('ovEmoji');
 var title=document.getElementById('ovTitle');
 var text=document.getElementById('ovText');
 var motivo=document.getElementById('ovMotivo');

 emoji.textContent='💀';
 title.textContent='VOCÊ PERDEU!';
 title.style.color='#B42318';
 
 if(lastHit==='parede'){
   motivo.textContent='❌ Bateu na parede!';
   text.textContent='Você fez '+score+' pontos. Tente não bater na borda.';
 }else{
   motivo.textContent='❌ Se mordeu!';
   text.textContent='Você fez '+score+' pontos. Cuidado com o próprio corpo!';
 }
 motivo.style.display='block';

 if(isNew){
   motivo.textContent+=' 🏆 NOVO RECORDE!';
 }

 document.getElementById('playBtn').textContent='🔄 JOGAR DE NOVO';
 overlay.classList.remove('hide');
 if(navigator.vibrate)navigator.vibrate([100,50,100]);
}

function setDir(d){var m={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}[d];if(!m)return;if(snake.length>1&&m.x===-dir.x&&m.y===-dir.y)return;nextDir=m}

var btns=document.querySelectorAll('.cbtn');
for(var i=0;i<btns.length;i++){
 btns[i].addEventListener('touchstart',function(e){e.preventDefault();setDir(this.getAttribute('data-d'))});
 btns[i].addEventListener('click',function(){setDir(this.getAttribute('data-d'))})
}
document.getElementById('playBtn').addEventListener('click',function(){init();draw();running=true;paused=false;document.getElementById('ovTitle').style.color='#3D2A18';overlay.classList.add('hide');restart()});
document.getElementById('newBtn').addEventListener('click',function(){init();draw();running=true;paused=false;document.getElementById('ovTitle').style.color='#3D2A18';overlay.classList.add('hide');restart()});
document.getElementById('pauseBtn').addEventListener('click',function(){if(!running)return;paused=true;document.getElementById('ovEmoji').textContent='⏸️';document.getElementById('ovTitle').textContent='PAUSADO';document.getElementById('ovTitle').style.color='#3D2A18';document.getElementById('ovText').textContent='Respira e volta.';document.getElementById('ovMotivo').style.display='none';document.getElementById('playBtn').textContent='▶️ CONTINUAR';overlay.classList.remove('hide')});

var sx=0,sy=0;
canvas.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
canvas.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;var dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)<15&&Math.abs(dy)<15)return;if(Math.abs(dx)>Math.abs(dy))setDir(dx>0?'right':'left');else setDir(dy>0?'down':'up')},{passive:true});

loadRec();init();draw();
</script>
</body>
</html>`;

async function enviarCobra(sock, jid) {
  const htmlPayload = {
    response_id: "cobra_" + Date.now(),
    sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: SNAKE_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }]
  };
  const content = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageText: "🐍 Snake" }],
          unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") },
          contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 }
        }
      }
    }
  };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date() });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarCobra };
