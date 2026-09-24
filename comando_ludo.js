// ════════════════════════════════════════════════
// ✅ COMANDO !LUDO — Ludo Real (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const LUDO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🎲 Ludo Real</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#FFF3E0;font-family:system-ui;padding:8px;min-height:100vh}
.card{width:100%;max-width:390px;background:#FFFDF7;border-radius:16px;padding:10px;text-align:center;border:2px solid #D7A76F}
h1{font-size:20px;color:#5D2800}
.sub{font-size:10px;color:#8D6E63;font-weight:700;margin-bottom:8px}
.stats{display:flex;gap:6px;margin-bottom:8px}
.stat{flex:1;background:#FFE0B2;border-radius:10px;padding:6px;font-size:11px;font-weight:700;color:#5D2800}
.stat b{display:block;font-size:14px}
#board{width:100%;aspect-ratio:1;background:#fff;border-radius:12px;border:2px solid #5D2800;position:relative;overflow:hidden}
canvas{width:100%;height:100%;display:block}
#rolar{margin:10px auto;background:#5D2800;color:#fff;border:none;border-radius:14px;padding:12px 40px;font-size:20px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px}
#rolar:active{transform:scale(.95)}
#rolar:disabled{opacity:.5}
#dado{font-size:28px}
#msg{background:#5D2800;color:#FFD54F;border-radius:999px;padding:10px;font-weight:700;font-size:13px;margin-top:8px}
.row{display:flex;gap:8px;margin-top:8px}
.row button{flex:1;padding:10px;border:none;border-radius:999px;font-weight:700;cursor:pointer;font-size:13px}
#nj{background:#FFE0B2;color:#5D2800}
#rg{background:#5D2800;color:#fff}
</style>
</head>
<body>
<div class="card">
<h1>🎲 LUDO REAL</h1>
<div class="sub">JOGO DE TABULEIRO CLÁSSICO</div>
<div class="stats">
<div class="stat">VEZ<b id="vez">🔵 AZUL</b></div>
<div class="stat">DADO<b id="dadoN">-</b></div>
<div class="stat">JOGADA<b id="jog">0</b></div>
</div>
<div id="board"><canvas id="c" width="360" height="360"></canvas></div>
<button id="rolar" onclick="rolar()"><span id="dado">🎲</span> ROLAR</button>
<div id="msg">AZUL é a vez - Role o dado!</div>
<div class="row"><button id="nj" onclick="novo()">🔄 Novo Jogo</button><button id="rg" onclick="alert('Saia da base com 6. Coma adversários caindo na casa deles. Casas com estrela são seguras. Entre na reta final e chegue ao centro com número exato.')">📖 Regras</button></div>
</div>
<script>
var cv=document.getElementById('c'),ctx=cv.getContext('2d'),S=360,U=S/15;
var cores={AZ:'#2196F3',VD:'#4CAF50',VM:'#F44336',AM:'#FFC107'};
var ordem=['AZ','VD','AM','VM'];
var nomes={AZ:'🔵 AZUL',VD:'🟢 VERDE',AM:'🟡 AMARELO',VM:'🔴 VERMELHO'};
var pos,vez=0,dadoV=0,jogada=0,seisSeg=0,started=true,selected=-1;
// trilha simplificada 52 casas em volta
var track=[];
(function(){for(var i=0;i<52;i++)track.push(i);})();
var safe=[0,8,13,21,26,34,39,47];
var startIdx={AZ:0,VD:13,AM:26,VM:39};
function novo(){pos={AZ:[-1,-1,-1,-1],VD:[-1,-1,-1,-1],AM:[-1,-1,-1,-1],VM:[-1,-1,-1,-1]};vez=0;jogada=0;seisSeg=0;draw();msg('AZUL é a vez - Role o dado!');document.getElementById('rolar').disabled=false;}
function msg(t){document.getElementById('msg').textContent=t;}
function coord(idx){
 // mapeia 52 casas para grade 15x15 perímetro
 var p=[6,0,7,0,8,0,6,1,7,1,8,1,6,2,7,2,8,2,6,3,7,3,8,3,6,4,7,4,8,4,
        0,6,1,6,2,6,3,6,4,6,5,6,6,5,6,4,6,3,6,2,6,1,6,0,
        6,6,7,6,8,5,8,4,8,3,8,2,8,1,8,0,8,
        8,6,8,7,8,8,9,8,10,8,11,8,12,8,13,8,14,8,
        14,6,13,6,12,6,11,6,10,6,9,6,8,6,8,5,8,4,8,3,8,2,8,1,8,0];
 // simplificação visual: usa perímetro
 var map=[[6,0],[7,0],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],[13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],[6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1]];
 var m=map[idx%52];return {x:m[0],y:m[1]};
}
function draw(){
 ctx.clearRect(0,0,S,S);
 // bases
 ctx.fillStyle=cores.AZ;ctx.fillRect(0,0,6*U,6*U);
 ctx.fillStyle=cores.VD;ctx.fillRect(9*U,0,6*U,6*U);
 ctx.fillStyle=cores.VM;ctx.fillRect(0,9*U,6*U,6*U);
 ctx.fillStyle=cores.AM;ctx.fillRect(9*U,9*U,6*U,6*U);
 // casas internas brancas
 [[1,1],[10,1],[1,10],[10,10]].forEach(function(o){ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(o[0]*U,o[1]*U,4*U,4*U,12);ctx.fill();});
 // grade trilha
 ctx.strokeStyle='#5D2800';ctx.lineWidth=1;
 for(var i=0;i<15;i++)for(var j=0;j<15;j++){
  if(i<6&&j<6)continue;if(i>=9&&j<6)continue;if(i<6&&j>=9)continue;if(i>=9&&j>=9)continue;
  if(i>=6&&i<=8&&j>=6&&j<=8)continue;
  ctx.strokeRect(i*U,j*U,U,U);
 }
 // centro
 ctx.fillStyle=cores.AZ;ctx.beginPath();ctx.moveTo(6*U,6*U);ctx.lineTo(9*U,9*U);ctx.lineTo(6*U,9*U);ctx.fill();
 ctx.fillStyle=cores.VD;ctx.beginPath();ctx.moveTo(6*U,6*U);ctx.lineTo(9*U,6*U);ctx.lineTo(9*U,9*U);ctx.fill();
 // peças
 ordem.forEach(function(cor){
  var pp=pos[cor];
  pp.forEach(function(p,k){
   var x,y;
   if(p===-1){ // na base
    var bx=cor==='AZ'||cor==='VM'?1.8:10.8, by=cor==='AZ'||cor==='VD'?1.8:10.8;
    x=(bx+(k%2)*1.8)*U; y=(by+Math.floor(k/2)*1.8)*U;
   } else if(p>=100){ // reta final
    var f=p-100; var cx=7;
    if(cor==='AZ'){x=7*U; y=(13-f)*U;}
    else if(cor==='VD'){x=(1+f)*U; y=7*U;}
    else if(cor==='AM'){x=7*U; y=(1+f)*U;}
    else{x=(13-f)*U; y=7*U;}
    x+=U/2;y+=U/2;
   } else {
    var cc=coord((startIdx[cor]+p)%52); x=cc.x*U+U/2; y=cc.y*U+U/2;
   }
   ctx.beginPath();ctx.arc(x,y,U*0.38,0,7);
   ctx.fillStyle=cores[cor];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
   ctx.fillStyle='#fff';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(k+1,x,y+3);
  });
 });
}
function rolar(){
 if(ordem[vez]!=='AZ')return;
 var d=1+Math.floor(Math.random()*6);
 jogar(d);
}
function jogar(d){
 dadoV=d;jogada++;
 document.getElementById('dadoN').textContent=d;
 document.getElementById('jog').textContent=jogada;
 document.getElementById('dado').textContent=['','⚀','⚁','⚂','⚃','⚄','⚅'][d];
 var cor=ordem[vez];
 if(d===6)seisSeg++;else seisSeg=0;
 if(seisSeg>=3){msg(cor+' tirou 3x6 - perdeu a vez!');proxima();return;}
 var moviveis=[];
 pos[cor].forEach(function(p,i){
  if(p===-1&&d===6)moviveis.push(i);
  else if(p>=0&&p<51)moviveis.push(i);
  else if(p>=100&&p<105&&p-100+d<=5)moviveis.push(i);
 });
 if(moviveis.length===0){msg(nomes[cor]+' sem jogada - '+d);setTimeout(proxima,900);return;}
 if(cor==='AZ'){
  msg('Você tirou '+d+' - toque numa peça!');
  // auto destaca: se só 1, move direto
  window._mov=moviveis; window._dado=d;
  // clique no canvas
  if(moviveis.length===1)moverPeca(cor,moviveis[0],d);
 } else {
  var pick=moviveis[Math.floor(Math.random()*moviveis.length)];
  setTimeout(function(){moverPeca(cor,pick,d);},700);
 }
 draw();
}
function moverPeca(cor,i,d){
 var p=pos[cor][i];
 var comeu=false;
 if(p===-1){pos[cor][i]=0;}
 else if(p>=100){pos[cor][i]=p+d; if(pos[cor][i]===105){msg(nomes[cor]+' chegou ao centro! 🎉');}}
 else{
  var np=p+d;
  if(np>50){ // entra reta final
   pos[cor][i]=100+(np-51);
  } else {
   pos[cor][i]=np;
   // comer
   var abs=(startIdx[cor]+np)%52;
   if(safe.indexOf(abs)===-1){
    ordem.forEach(function(o2){
     if(o2===cor)return;
     pos[o2].forEach(function(pp,j){
      if(pp>=0&&pp<51){var a2=(startIdx[o2]+pp)%52;if(a2===abs){pos[o2][j]=-1;comeu=true;}}
     });
    });
   }
  }
 }
 // venceu?
 var win=pos[cor].every(function(x){return x===105;});
 draw();
 if(win){msg('🏆 '+nomes[cor]+' VENCEU!');document.getElementById('rolar').disabled=true;return;}
 if(d===6||comeu){msg(nomes[cor]+' joga de novo! '+(comeu?'Comeu! ':''));if(cor!=='AZ')setTimeout(function(){jogar(1+Math.floor(Math.random()*6));},900);else document.getElementById('rolar').disabled=false;}
 else proxima();
}
function proxima(){
 vez=(vez+1)%4;seisSeg=0;
 document.getElementById('vez').textContent=nomes[ordem[vez]];
 var cor=ordem[vez];
 if(cor==='AZ'){msg('AZUL é a vez - Role o dado!');document.getElementById('rolar').disabled=false;}
 else{msg(nomes[cor]+' é a vez...');document.getElementById('rolar').disabled=true;setTimeout(function(){jogar(1+Math.floor(Math.random()*6));},1000);}
 draw();
}
cv.addEventListener('click',function(e){
 if(ordem[vez]!=='AZ'||!window._mov)return;
 var r=cv.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*S,my=(e.clientY-r.top)/r.height*S;
 var cor='AZ',best=-1,bd=1e9;
 pos[cor].forEach(function(p,k){
  if(window._mov.indexOf(k)===-1)return;
  var x,y;
  if(p===-1){var bx=1.8,by=1.8;x=(bx+(k%2)*1.8)*U;y=(by+Math.floor(k/2)*1.8)*U;}
  else{var cc=coord((startIdx[cor]+p)%52);x=cc.x*U+U/2;y=cc.y*U+U/2;}
  var d=Math.hypot(mx-x,my-y);if(d<bd){bd=d;best=k;}
 });
 if(best>=0&&bd<U){var d=window._dado;window._mov=null;moverPeca(cor,best,d);}
});
novo();
</script>
</body>
</html>`;

async function enviarLudo(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "ludo_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: LUDO_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🎲 Ludo Real" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarLudo };
