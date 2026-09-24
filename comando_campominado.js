// ════════════════════════════════════════════════
// ✅ COMANDO !CAMPOMINADO — Campo Minado (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const CAMPOMINADO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>💣 Campo Minado</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{display:flex;justify-content:center;background:#0f0f1a;font-family:system-ui;padding:10px;min-height:100vh;color:#fff}
.card{width:100%;max-width:400px;background:#1e1e32;border-radius:20px;padding:18px;text-align:center;border:1px solid #2e2e4a}
h1{font-size:24px;margin-bottom:4px}
.sub{color:#ff9f1c;font-weight:700;margin-bottom:14px;font-size:16px}
.stats{display:flex;gap:8px;margin-bottom:14px}
.stat{flex:1;background:#0f0f1a;border-radius:12px;padding:10px}
.stat small{display:block;font-size:11px;color:#888}
.stat b{font-size:18px;color:#ffd60a}
#board{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;background:#0f0f1a;padding:10px;border-radius:14px;margin-bottom:14px}
.cell{aspect-ratio:1;background:#2e2e4a;border:none;border-radius:8px;font-size:18px;cursor:pointer;color:#fff;font-weight:700}
.cell:active{transform:scale(.95)}
.cell.open{background:#1a1a2e}
.cell.boom{background:#e5383b}
#btn{width:100%;padding:13px;border:none;border-radius:999px;background:#ff9f1c;color:#000;font-weight:800;font-size:16px;cursor:pointer}
.msg{min-height:24px;margin-bottom:8px;font-weight:700}
</style>
</head>
<body>
<div class="card">
<h1>💣 Campo Minado</h1>
<div class="sub">Toque para revelar — 10 minas</div>
<div class="stats">
<div class="stat"><small>REVELADAS</small><b id="r">0</b></div>
<div class="stat"><small>MINAS</small><b>10</b></div>
<div class="stat"><small>STATUS</small><b id="s">🙂</b></div>
</div>
<div class="msg" id="msg"></div>
<div id="board"></div>
<button id="btn" onclick="novo()">🔄 Novo Jogo</button>
</div>
<script>
var N=8,MINAS=10,board,mines,rev,over;
function novo(){
 board=[];mines=new Set();rev=0;over=false;
 document.getElementById('msg').textContent='';
 document.getElementById('s').textContent='🙂';
 document.getElementById('r').textContent='0';
 while(mines.size<MINAS)mines.add(Math.floor(Math.random()*N*N));
 var b=document.getElementById('board');b.innerHTML='';
 for(var i=0;i<N*N;i++){
  (function(i){
   var d=document.createElement('button');d.className='cell';d.textContent='';
   d.onclick=function(){jogar(i,d);};
   b.appendChild(d);board.push(d);
  })(i);
 }
}
function viz(i){
 var r=Math.floor(i/N),c=i%N,n=0;
 for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){
  if(!dr&&!dc)continue;var nr=r+dr,nc=c+dc;
  if(nr>=0&&nr<N&&nc>=0&&nc<N&&mines.has(nr*N+nc))n++;
 }return n;
}
function jogar(i,d){
 if(over||d.classList.contains('open'))return;
 if(mines.has(i)){
  d.classList.add('boom');d.textContent='💣';over=true;
  document.getElementById('s').textContent='💥';
  document.getElementById('msg').textContent='💥 Explodiu! Tente de novo';
  board.forEach(function(c,idx){if(mines.has(idx)){c.textContent='💣';c.classList.add('open');}});
  return;
 }
 d.classList.add('open');rev++;
 var n=viz(i);if(n>0){d.textContent=n;d.style.color=['','#4cc9f0','#80ed99','#ffd60a','#ff9f1c','#e5383b'][n]||'#fff';}
 document.getElementById('r').textContent=rev;
 if(rev>=N*N-MINAS){over=true;document.getElementById('s').textContent='🏆';document.getElementById('msg').textContent='🏆 Venceu! Parabéns!';}
}
novo();
</script>
</body>
</html>`;

async function enviarCampoMinado(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "minado_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: CAMPOMINADO_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "💣 Campo Minado" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarCampoMinado };
