// ════════════════════════════════════════════════
// ✅ COMANDO !DAMA — Dama Voadora (Rei Longo Alcance)
// 100 casas | 368px | Captura à distância
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const DAMA_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Dama 100 - Rei Voador</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{background:#F3ECE0;font-family:system-ui,sans-serif;display:flex;justify-content:center;padding:8px}
.card{width:100%;max-width:390px;background:#FFFDF9;border-radius:18px;padding:10px;border:1px solid #E9DFCE;box-shadow:0 10px 30px rgba(61,42,24,.15);text-align:center}
h1{font-size:19px;color:#3D2A18}
.sub{color:#A9977E;font-size:10px;margin-bottom:8px}
.mode{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
.modeBtn{border:1px solid #E9DBBF;background:#F6EEDD;border-radius:999px;padding:7px;font-size:11px;font-weight:700;color:#8A6A3F}
.modeBtn.active{background:#3D2A18;color:#fff;border-color:#3D2A18}
.top{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px}
.stat{background:#F6EEDD;border:1px solid #E9DBBF;border-radius:10px;padding:5px}
.stat span{font-size:7px;color:#8A6A3F;display:block}
.stat b{font-size:16px;color:#3D2A18;display:block;font-weight:900}
.gameWrap{background:#2A1B0E;border-radius:14px;padding:6px}
#board{width:100%;height:368px;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(10,1fr);gap:0;background:#2A1B0E;border-radius:8px;overflow:hidden;border:2px solid #2A1B0E}
.sq{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
.sq.light{background:#F3E6C8}
.sq.dark{background:#8C5A2B}
.sq.sel{outline:3px solid #FFD23F;outline-offset:-3px;z-index:3}
.sq.canMove::after{content:'';position:absolute;width:12px;height:12px;background:#00FF88;border-radius:50%;opacity:.9}
.sq.canCapture::after{content:'';position:absolute;width:100%;height:100%;border:3px solid #FF3B3B;background:rgba(255,59,59,.25);border-radius:4px;box-sizing:border-box}
.piece{width:82%;height:82%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;box-shadow:0 2px 0 rgba(0,0,0,.4), inset 0 2px 2px rgba(255,255,255,.5);cursor:pointer;z-index:1;position:relative}
.piece.white{background:radial-gradient(circle at 30% 30%, #fff, #E8DCC3);color:#8C5A2B;border:1px solid #C9B896}
.piece.black{background:radial-gradient(circle at 30% 30%, #5a3a1a, #2A1B0E);color:#FFD23F;border:1px solid #000}
.piece.king{width:88%;height:88%;box-shadow:0 0 0 2px #FFD23F, 0 3px 6px rgba(0,0,0,.5), inset 0 2px 3px rgba(255,255,255,.6)}
.piece.king::after{content:'♔';position:absolute;font-size:16px;top:50%;left:50%;transform:translate(-50%,-50%);text-shadow:0 1px 2px rgba(0,0,0,.5)}
.piece.white.king{background:radial-gradient(circle at 30% 30%, #FFF7E0, #FFD23F);color:#8C4A1E;border:2px solid #B5652E}
.piece.black.king{background:radial-gradient(circle at 30% 30%, #7a4a1a, #1a0e02);color:#FFD23F;border:2px solid #FFD23F}
.status{margin-top:8px;background:#F6EEDD;border:1px solid #E9DBBF;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;color:#3D2A18;display:inline-block;min-width:160px}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
.btn{border:none;border-radius:999px;padding:10px;font-weight:700;font-size:11px}
.btn-dark{background:#F6EEDD;color:#8A6A3F;border:1px solid #E9DBBF}
.btn-play{background:#B5652E;color:#fff;box-shadow:0 3px 0 #8C4A1E}
#overlay{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(243,236,224,.96);display:flex;align-items:center;justify-content:center;padding:18px;z-index:999}
#overlay.hide{display:none}
.ovCard{background:#FFFDF9;border-radius:20px;padding:20px;width:100%;max-width:320px;text-align:center;border:1px solid #E9DFCE}
</style>
</head>
<body>
<div class="card">
<h1>♟️ Damas 100 - Dama Voadora</h1>
<p class="sub">Dama anda infinito e come à distância</p>
<div class="mode">
<button class="modeBtn active" id="m1">🤖 1 Jogador</button>
<button class="modeBtn" id="m2">👥 2 Jogadores</button>
</div>
<div class="top">
<div class="stat"><span id="lW">VOCÊ</span><b id="sw">0</b></div>
<div class="stat"><span>CAPTURAS</span><b id="sc">0</b></div>
<div class="stat"><span id="lB">ROBÔ</span><b id="sb">0</b></div>
</div>
<div class="gameWrap"><div id="board"></div></div>
<div id="turn" class="status">Sua vez (Claras)</div>
<div class="btns">
<button class="btn btn-dark" id="resetBtn">🔄 Zerar</button>
<button class="btn btn-dark" id="newBtn">🎮 Novo</button>
</div>
</div>
<div id="overlay">
<div class="ovCard">
<div id="ovEmoji" style="font-size:44px">♔</div>
<h2 id="ovTitle" style="font-size:18px;color:#3D2A18;margin:8px 0">Damas 100 - Dama Voadora</h2>
<p id="ovText" style="color:#A9977E;font-size:11px;margin-bottom:10px">Peão anda 1 • Dama anda infinito e come longe</p>
<div id="startBtns" style="display:grid;gap:8px">
<button class="btn btn-play" id="play1" style="padding:12px">🤖 Eu vs Robô</button>
<button class="btn btn-dark" id="play2" style="padding:12px">👥 2 Jogadores</button>
</div>
<div id="endBtns" style="display:none;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
<button class="btn btn-dark" id="closeOv">Fechar</button>
<button class="btn btn-play" id="again">De novo</button>
</div>
</div>
</div>
<script>
var SIZE=10, board=[], selected=null, validMoves=[], turn='w', mode='1P', gameOver=false, captures=0, score={W:0,B:0};
var boardEl=document.getElementById('board'), swEl=document.getElementById('sw'), sbEl=document.getElementById('sb'), scEl=document.getElementById('sc'), overlay=document.getElementById('overlay');
function idx(r,c){return r*SIZE+c} function rc(i){return {r:Math.floor(i/SIZE),c:i%SIZE}} function isDark(r,c){return (r+c)%2===1}
function updatePlacar(){swEl.textContent=score.W; sbEl.textContent=score.B; scEl.textContent=captures;}
function initBoard(){board=new Array(100).fill(null);for(var r=0;r<4;r++)for(var c=0;c<SIZE;c++)if(isDark(r,c))board[idx(r,c)]={color:'b',king:false};for(var r=6;r<SIZE;r++)for(var c=0;c<SIZE;c++)if(isDark(r,c))board[idx(r,c)]={color:'w',king:false};turn='w';selected=null;validMoves=[];captures=0;gameOver=false;}
function render(){
 boardEl.innerHTML='';
 for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++){
  var i=idx(r,c); var sq=document.createElement('div'); sq.className='sq '+(isDark(r,c)?'dark':'light');
  if(selected===i) sq.classList.add('sel');
  var mv=validMoves.find(function(m){return m.to===i}); if(mv){ if(mv.captures.length) sq.classList.add('canCapture'); else sq.classList.add('canMove'); }
  if(board[i]){var p=document.createElement('div'); p.className='piece '+(board[i].color==='w'?'white':'black')+(board[i].king?' king':''); sq.appendChild(p);}
  (function(ii,el){el.addEventListener('click',function(){clickSq(ii)});})(i,sq);
  boardEl.appendChild(sq);
 }
 document.getElementById('turn').textContent=gameOver?'Fim':(mode==='1P'?(turn==='w'?'Sua vez':'Robô'):(turn==='w'?'Claras':'Escuras')) + (selected!==null && board[selected] && board[selected].king ? ' • DAMA VOADORA ♔':'');
}

function clickSq(i){
 if(gameOver) return; if(mode==='1P'&&turn==='b') return;
 if(board[i]&&board[i].color===turn){ selected=i; validMoves=getMovesFor(i); var allCaps=getAllCaptures(turn); if(allCaps.length>0) validMoves=validMoves.filter(function(m){return m.captures.length>0}); render(); return; }
 if(selected!==null){ var mv=validMoves.find(function(m){return m.to===i}); if(mv) doMove(selected,mv); else {selected=null; validMoves=[]; render();} }
}

// ===== LÓGICA PEÃO (1 casa) + DAMA VOADORA (infinito) =====
function getMovesFor(from){
 var piece=board[from]; if(!piece) return [];
 if(piece.king) return getKingMoves(from, piece);
 // PEÃO normal
 var fromRC=rc(from); var moves=[]; var dirs= piece.color==='w'?[[-1,-1],[-1,1]]:[[1,-1],[1,1]];
 for(var d=0;d<dirs.length;d++){
  var nr=fromRC.r+dirs[d][0], nc=fromRC.c+dirs[d][1];
  if(nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&isDark(nr,nc)){ var ni=idx(nr,nc); if(!board[ni]) moves.push({to:ni,captures:[]}); }
 }
 // captura de peão (pode capturar pra trás também na internacional)
 var caps=findPawnCaptures(from, piece, []);
 caps.forEach(function(c){moves.push(c);});
 return moves;
}

function getKingMoves(from, piece){
 var moves=[]; var fromRC=rc(from); var dirs=[[-1,-1],[-1,1],[1,-1],[1,1]];
 // movimento livre infinito
 for(var d=0;d<dirs.length;d++){
  var r=fromRC.r+dirs[d][0], c=fromRC.c+dirs[d][1];
  while(r>=0&&r<SIZE&&c>=0&&c<SIZE){
   if(!isDark(r,c)) {r+=dirs[d][0]; c+=dirs[d][1]; continue;}
   var ni=idx(r,c);
   if(!board[ni]) moves.push({to:ni,captures:[]});
   else break; // bloqueado
   r+=dirs[d][0]; c+=dirs[d][1];
  }
 }
 // captura à distância da dama
 var caps=findKingCaptures(from, piece, [], []);
 caps.forEach(function(c){moves.push(c);});
 return moves;
}

function findPawnCaptures(from, piece, captured){
 var res=[]; var fromRC=rc(from); var dirs=[[-1,-1],[-1,1],[1,-1],[1,1]];
 for(var d=0;d<dirs.length;d++){
  var mr=fromRC.r+dirs[d][0], mc=fromRC.c+dirs[d][1];
  var nr=fromRC.r+dirs[d][0]*2, nc=fromRC.c+dirs[d][1]*2;
  if(nr<0||nr>=SIZE||nc<0||nc>=SIZE||mr<0||mr>=SIZE||mc<0||mc>=SIZE) continue;
  if(!isDark(nr,nc)) continue;
  var mid=idx(mr,mc), to=idx(nr,nc);
  if(board[mid]&&board[mid].color!==piece.color&&!captured.includes(mid)&&!board[to]){
   var newCap=captured.concat([mid]);
   var more=findPawnCaptures(to, {...piece, pos:to}, newCap);
   var cont=more.filter(function(m){return m.captures.length>0});
   if(cont.length>0){ cont.forEach(function(cm){ res.push({to:cm.to, captures:newCap.concat(cm.captures.filter(function(x){return !newCap.includes(x)}))}); }); }
   else res.push({to:to, captures:newCap});
  }
 }
 return res;
}

function findKingCaptures(from, piece, captured, visited){
 var res=[]; var fromRC=rc(from); var dirs=[[-1,-1],[-1,1],[1,-1],[1,1]];
 for(var d=0;d<dirs.length;d++){
  var r=fromRC.r+dirs[d][0], c=fromRC.c+dirs[d][1];
  var foundEnemy=null, foundEnemyIdx=-1;
  while(r>=0&&r<SIZE&&c>=0&&c<SIZE){
   if(!isDark(r,c)){ r+=dirs[d][0]; c+=dirs[d][1]; continue; }
   var curIdx=idx(r,c);
   if(!board[curIdx]){
    if(foundEnemy){ // casa vazia depois do inimigo = pode capturar aqui
     if(!captured.includes(foundEnemyIdx)){
      var newCap=captured.concat([foundEnemyIdx]);
      // tenta continuar capturando a partir daqui
      var more=findKingCaptures(curIdx, piece, newCap, []);
      if(more.length>0){ more.forEach(function(cm){ res.push({to:cm.to, captures:newCap.concat(cm.captures.filter(function(x){return !newCap.includes(x)}))}); }); }
      else{ res.push({to:curIdx, captures:newCap}); }
     }
    }
   }else{
    if(board[curIdx].color===piece.color) break; // aliado bloqueia
    if(foundEnemy) break; // já tem inimigo, segundo bloqueia
    if(captured.includes(curIdx)) break;
    foundEnemy=board[curIdx]; foundEnemyIdx=curIdx;
   }
   r+=dirs[d][0]; c+=dirs[d][1];
  }
 }
 return res;
}

function getAllCaptures(color){
 var all=[]; for(var i=0;i<100;i++) if(board[i]&&board[i].color===color){ var ms=getMovesFor(i).filter(function(m){return m.captures.length>0}); ms.forEach(function(m){all.push({from:i,move:m});}); } return all;
}
function doMove(from,mv){
 var piece=board[from]; board[mv.to]=piece; board[from]=null; mv.captures.forEach(function(ci){board[ci]=null;}); captures+=mv.captures.length;
 var toRC=rc(mv.to); if(!piece.king){ if(piece.color==='w'&&toRC.r===0) piece.king=true; if(piece.color==='b'&&toRC.r===SIZE-1) piece.king=true; }
 // multi captura obrigatória
 var more; if(piece.king) more=findKingCaptures(mv.to, piece, mv.captures, []); else more=findPawnCaptures(mv.to, piece, mv.captures);
 more=more.filter(function(m){return m.captures.length>mv.captures.length || (mv.captures.length===0&&m.captures.length>0)});
 if(mv.captures.length>0 && more.length>0){ selected=mv.to; validMoves=more; render(); if(navigator.vibrate)navigator.vibrate(30); return; }
 if(checkWin()){ gameOver=true; var winner=turn; if(winner==='w') score.W++; else score.B++; updatePlacar(); showEnd(winner==='w'?'Claras venceram!':'Escuras venceram!', 'Capturas: '+captures+' • '+(piece.king?'DAMA VOADORA ♔':'Peão'), winner==='w'?'⚪':'⚫'); render(); return; }
 turn=turn==='w'?'b':'w'; selected=null; validMoves=[]; render(); if(mode==='1P'&&turn==='b'&&!gameOver) setTimeout(botPlay,400);
}
function checkWin(){ var hasW=false,hasB=false; for(var i=0;i<100;i++) if(board[i]){ if(board[i].color==='w')hasW=true; else hasB=true; } if(!hasW||!hasB) return true; var hasMove=false; for(var i=0;i<100;i++) if(board[i]&&board[i].color===turn) if(getMovesFor(i).length>0){hasMove=true;break;} return !hasMove; }
function botPlay(){
 if(gameOver) return; var all=[]; for(var i=0;i<100;i++) if(board[i]&&board[i].color==='b'){ var ms=getMovesFor(i); ms.forEach(function(m){all.push({from:i,move:m});}); }
 var caps=all.filter(function(a){return a.move.captures.length>0}); if(caps.length>0) all=caps;
 if(all.length===0){ gameOver=true; score.W++; updatePlacar(); showEnd('Claras venceram!','Robô sem movimentos','⚪'); return; }
 all.sort(function(a,b){ return (b.move.captures.length - a.move.captures.length) || (board[b.from].king?1:0)-(board[a.from].king?1:0); });
 var top=all[0].move.captures.length; var bests=all.filter(function(a){return a.move.captures.length===top}); var best=bests[Math.floor(Math.random()*bests.length)];
 selected=best.from; validMoves=[best.move]; render(); setTimeout(function(){doMove(best.from,best.move);},280);
}
function showEnd(t,txt,em){ document.getElementById('ovEmoji').textContent=em; document.getElementById('ovTitle').textContent=t; document.getElementById('ovText').textContent=txt; document.getElementById('startBtns').style.display='none'; document.getElementById('endBtns').style.display='grid'; overlay.classList.remove('hide'); }
function newGame(){ initBoard(); render(); document.getElementById('startBtns').style.display='grid'; document.getElementById('endBtns').style.display='none'; overlay.classList.add('hide'); }
document.getElementById('play1').addEventListener('click',function(){mode='1P';newGame();});
document.getElementById('play2').addEventListener('click',function(){mode='2P';newGame();});
document.getElementById('again').addEventListener('click',function(){newGame();});
document.getElementById('closeOv').addEventListener('click',function(){overlay.classList.add('hide');});
document.getElementById('newBtn').addEventListener('click',function(){newGame();});
document.getElementById('resetBtn').addEventListener('click',function(){score={W:0,B:0};captures=0;updatePlacar();newGame();});
document.getElementById('m1').addEventListener('click',function(){mode='1P';document.getElementById('m1').classList.add('active');document.getElementById('m2').classList.remove('active');newGame();});
document.getElementById('m2').addEventListener('click',function(){mode='2P';document.getElementById('m2').classList.add('active');document.getElementById('m1').classList.remove('active');newGame();});
initBoard(); render();
</script>
</body>
</html>`;

async function enviarDama(sock, jid) {
  const htmlPayload = {
    response_id: "dama_" + Date.now(),
    sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: DAMA_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }]
  };
  const content = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageText: "Damas 100 - Dama Voadora" }],
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
module.exports = { enviarDama, enviarDamas: enviarDama };
