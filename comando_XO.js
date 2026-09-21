// ════════════════════════════════════════════════
// ✅ COMANDO !XO — FIX PLACAR QUE NÃO CONTAVA
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const XO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>XO</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{background:#F3ECE0;font-family:system-ui,sans-serif;display:flex;justify-content:center;padding:10px}
.card{width:100%;max-width:390px;background:#FFFDF9;border-radius:20px;padding:14px;border:1px solid #E9DFCE;box-shadow:0 10px 30px rgba(61,42,24,.15);text-align:center}
h1{font-size:22px;color:#3D2A18}
.sub{color:#A9977E;font-size:11px;margin:2px 0 10px}
.mode{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}
.modeBtn{border:1px solid #E9DBBF;background:#F6EEDD;border-radius:999px;padding:8px;font-size:11px;font-weight:700;color:#8A6A3F}
.modeBtn.active{background:#3D2A18;color:#fff;border-color:#3D2A18}
.top{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px}
.stat{background:#F6EEDD;border:1px solid #E9DBBF;border-radius:10px;padding:6px}
.stat span{font-size:8px;color:#8A6A3F;display:block}
.stat b{font-size:20px;color:#3D2A18;display:block;font-weight:900}
.gameWrap{background:#2A1B0E;border-radius:16px;padding:10px}
#board{width:100%;height:362px;display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr;gap:8px;background:#2A1B0E;border-radius:10px}
.cell{background:#FFFDF9;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:54px;font-weight:900;cursor:pointer;box-shadow:0 4px 0 #D8CDB4}
.cell:active{transform:translateY(3px);box-shadow:none}
.cell.x{color:#B5652E;background:#FFF1DC}
.cell.o{color:#2A6B4A;background:#E6F5EC}
.cell.win{background:#B5652E!important;color:#fff!important}
.status{margin-top:10px;background:#F6EEDD;border:1px solid #E9DBBF;border-radius:999px;padding:8px 12px;font-size:13px;font-weight:700;color:#3D2A18;display:inline-block;min-width:120px}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.btn{border:none;border-radius:999px;padding:11px;font-weight:700;font-size:12px}
.btn-dark{background:#F6EEDD;color:#8A6A3F;border:1px solid #E9DBBF}
.btn-play{background:#B5652E;color:#fff;box-shadow:0 3px 0 #8C4A1E}
#overlay{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(243,236,224,.96);display:flex;align-items:center;justify-content:center;padding:18px;z-index:999}
#overlay.hide{display:none}
.ovCard{background:#FFFDF9;border-radius:20px;padding:22px;width:100%;max-width:320px;text-align:center;border:1px solid #E9DFCE}
</style>
</head>
<body>
<div class="card">
<h1>#️⃣ Jogo da Velha</h1>
<p class="sub">escolha o modo abaixo</p>
<div class="mode">
<button class="modeBtn active" id="m1">🤖 1 Jogador</button>
<button class="modeBtn" id="m2">👥 2 Jogadores</button>
</div>
<div class="top">
<div class="stat"><span id="labelX">VOCÊ (X)</span><b id="sx">0</b></div>
<div class="stat"><span>VELHA</span><b id="sv">0</b></div>
<div class="stat"><span id="labelO">ROBÔ (O)</span><b id="so">0</b></div>
</div>
<div class="gameWrap"><div id="board"></div></div>
<div id="turn" class="status">Vez do X</div>
<div class="btns">
<button class="btn btn-dark" id="resetBtn">🔄 Zerar Placar</button>
<button class="btn btn-dark" id="newBtn">🎮 Novo Jogo</button>
</div>
</div>

<div id="overlay">
<div class="ovCard">
<div id="ovEmoji" style="font-size:48px">🎮</div>
<h2 id="ovTitle" style="font-size:20px;color:#3D2A18;margin:8px 0">Escolha o modo</h2>
<p id="ovText" style="color:#A9977E;font-size:12px;margin-bottom:12px">Como quer jogar?</p>
<div style="display:grid;gap:8px" id="startBtns">
<button class="btn btn-play" id="play1" style="padding:14px">🤖 Eu vs Robô</button>
<button class="btn btn-dark" id="play2" style="padding:14px">👥 2 Jogadores</button>
</div>
<div id="endBtns" style="display:none;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
<button class="btn btn-dark" id="closeOv">Fechar</button>
<button class="btn btn-play" id="again">De novo</button>
</div>
</div>
</div>

<script>
var boardEl=document.getElementById('board'),turnEl=document.getElementById('turn');
var sxEl=document.getElementById('sx'),soEl=document.getElementById('so'),svEl=document.getElementById('sv');
var labelX=document.getElementById('labelX'),labelO=document.getElementById('labelO');
var m1Btn=document.getElementById('m1'),m2Btn=document.getElementById('m2');
var overlay=document.getElementById('overlay');
var cells=[],state=['','','','','','','','',''],player='X',gameOver=false,mode='1P';
var winComb=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
var score={X:0,O:0,V:0};

function updatePlacar(){
 sxEl.textContent=score.X;
 soEl.textContent=score.O;
 svEl.textContent=score.V;
 try{localStorage.setItem('xo_score_v3',JSON.stringify(score));}catch(e){}
}
function loadPlacar(){
 try{
  var s=JSON.parse(localStorage.getItem('xo_score_v3')||'null');
  if(s){score=s;}
 }catch(e){}
 updatePlacar();
}

function build(){
 boardEl.innerHTML=''; cells=[];
 for(var i=0;i<9;i++){
  var c=document.createElement('div'); c.className='cell'; c.setAttribute('data-i',i);
  c.addEventListener('click',function(){ var idx=parseInt(this.getAttribute('data-i')); humanPlay(idx); });
  boardEl.appendChild(c); cells.push(c);
 }
 render();
}
function render(){
 for(var i=0;i<9;i++){
  cells[i].textContent=state[i];
  cells[i].className='cell';
  if(state[i]==='X')cells[i].classList.add('x');
  if(state[i]==='O')cells[i].classList.add('o');
 }
}
function setMode(m){
 mode=m;
 if(m==='1P'){m1Btn.classList.add('active');m2Btn.classList.remove('active');labelX.textContent='VOCÊ (X)';labelO.textContent='ROBÔ (O)';}
 else{m2Btn.classList.add('active');m1Btn.classList.remove('active');labelX.textContent='X';labelO.textContent='O';}
}
function humanPlay(i){
 if(gameOver||state[i]!=='')return;
 if(mode==='1P' && player==='O')return;
 makeMove(i);
 if(!gameOver && mode==='1P' && player==='O'){ setTimeout(botMove,350); }
}
function makeMove(i){
 if(state[i]!=='')return;
 state[i]=player;
 render();
 if(navigator.vibrate)navigator.vibrate(25);
 var win=checkWin();
 if(win){
  gameOver=true;
  win.combo.forEach(function(idx){cells[idx].classList.add('win')});
  if(win.winner==='X'){score.X+=1;}else{score.O+=1;}
  updatePlacar();
  showEnd(win.winner+' venceu!', mode==='1P'?(win.winner==='X'?'Você venceu o robô! 🏆':'Robô venceu! 🤖'):(win.winner+' fez a linha!'), win.winner==='X'?'❌':'⭕');
  return;
 }
 if(state.every(function(v){return v!==''})){
  gameOver=true; score.V+=1; updatePlacar();
  showEnd('Deu velha!','Empate - ninguém venceu','🤝');
  return;
 }
 player=player==='X'?'O':'X';
 turnEl.textContent = mode==='1P' ? (player==='X'?'Sua vez (X)':'Vez do Robô (O)') : ('Vez do '+player);
}
function botMove(){
 if(gameOver)return;
 var move=findWinningMove('O');
 if(move===-1) move=findWinningMove('X');
 if(move===-1 && state[4]==='') move=4;
 if(move===-1){ var corners=[0,2,6,8].filter(function(i){return state[i]===''}); if(corners.length) move=corners[Math.floor(Math.random()*corners.length)]; }
 if(move===-1){ var empties=[]; for(var i=0;i<9;i++) if(state[i]==='') empties.push(i); move=empties[Math.floor(Math.random()*empties.length)]; }
 if(move!==-1) makeMove(move);
}
function findWinningMove(p){
 for(var i=0;i<9;i++){ if(state[i]===''){ state[i]=p; var w=checkWin(); state[i]=''; if(w && w.winner===p) return i; } }
 return -1;
}
function checkWin(){
 for(var k=0;k<winComb.length;k++){ var a=winComb[k][0],b=winComb[k][1],c=winComb[k][2]; if(state[a]&&state[a]===state[b]&&state[a]===state[c]) return {winner:state[a],combo:winComb[k]} }
 return null;
}
function showEnd(title,text,emoji){
 document.getElementById('ovEmoji').textContent=emoji;
 document.getElementById('ovTitle').textContent=title;
 document.getElementById('ovText').textContent=text+' | Placar: X '+score.X+' - '+score.V+' - O '+score.O;
 document.getElementById('startBtns').style.display='none';
 document.getElementById('endBtns').style.display='grid';
 overlay.classList.remove('hide');
 if(navigator.vibrate)navigator.vibrate([80,40,80]);
}
function newGame(){
 state=['','','','','','','','','']; player='X'; gameOver=false;
 build();
 turnEl.textContent = mode==='1P'?'Sua vez (X)':'Vez do X';
 document.getElementById('startBtns').style.display='grid';
 document.getElementById('endBtns').style.display='none';
 overlay.classList.add('hide');
}
document.getElementById('play1').addEventListener('click',function(){setMode('1P');newGame();});
document.getElementById('play2').addEventListener('click',function(){setMode('2P');newGame();});
document.getElementById('again').addEventListener('click',function(){newGame();});
document.getElementById('closeOv').addEventListener('click',function(){overlay.classList.add('hide');});
document.getElementById('newBtn').addEventListener('click',function(){newGame();});
document.getElementById('resetBtn').addEventListener('click',function(){score={X:0,O:0,V:0};updatePlacar();newGame();});
m1Btn.addEventListener('click',function(){setMode('1P');newGame();});
m2Btn.addEventListener('click',function(){setMode('2P');newGame();});
loadPlacar(); build();
</script>
</body>
</html>`;

async function enviarXO(sock, jid) {
  const htmlPayload = {
    response_id: "xo_" + Date.now(),
    sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: XO_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }]
  };
  const content = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageText: "Jogo da Velha" }],
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
module.exports = { enviarXO, enviarVelha: enviarXO };
