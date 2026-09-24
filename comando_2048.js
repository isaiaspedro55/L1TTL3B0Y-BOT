// ════════════════════════════════════════════════
// ✅ COMANDO !2048 — 2048 (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const JOGO2048_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🔢 2048</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#FFF3E0;font-family:system-ui;padding:10px;min-height:100vh}
.card{width:100%;max-width:380px;background:#FFFDF7;border-radius:20px;padding:14px;text-align:center;border:2px solid #FFCC80}
h1{color:#E65100;font-size:26px}
.sub{color:#EF6C00;font-size:12px;font-weight:700;margin-bottom:10px}
.stats{display:flex;gap:8px;margin-bottom:10px}
.stat{flex:1;background:#FFE0B2;border-radius:12px;padding:8px}
.stat small{display:block;font-size:10px;color:#BF360C;font-weight:700}
.stat b{font-size:18px;color:#3E2723}
#board{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#E65100;padding:10px;border-radius:14px;touch-action:none}
.cell{aspect-ratio:1;background:#FFCC80;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;color:#3E2723}
.controls{margin-top:12px}
.cbtn{width:58px;height:48px;font-size:20px;border:none;border-radius:12px;background:#FFE0B2;color:#E65100;font-weight:800;margin:3px}
.row2{display:flex;gap:8px;margin-top:10px}
.row2 button{flex:1;padding:12px;border:none;border-radius:999px;font-weight:800;cursor:pointer}
#z{ background:#FFE0B2;color:#E65100}
#n{ background:#EF6C00;color:#fff}
.hint{background:#FFF3E0;border-radius:999px;padding:8px;margin-top:10px;font-size:13px;font-weight:700;color:#5D4037}
</style>
</head>
<body>
<div class="card">
<h1>🔢 2048</h1>
<div class="sub">JUNTE OS BLOCOS • 2048</div>
<div class="stats">
<div class="stat"><small>PONTOS</small><b id="p">0</b></div>
<div class="stat"><small>RECORDE</small><b id="r">0</b></div>
<div class="stat"><small>MOVES</small><b id="m">0</b></div>
</div>
<div id="board"></div>
<div class="hint">Deslize para mover</div>
<div class="controls">
<div><button class="cbtn" onclick="mv('up')">▲</button></div>
<div><button class="cbtn" onclick="mv('left')">◀</button><button class="cbtn" onclick="mv('down')">▼</button><button class="cbtn" onclick="mv('right')">▶</button></div>
</div>
<div class="row2"><button id="z" onclick="novo()">🔄 Zerar</button><button id="n" onclick="novo()">🎮 Novo</button></div>
</div>
<script>
var g,pts,movs,rec=0,over=false;
var cores={2:'#FFF8E1',4:'#FFECB3',8:'#FFB74D',16:'#FF9800',32:'#F57C00',64:'#EF6C00',128:'#E64A19',256:'#D84315',512:'#BF360C',1024:'#8D2B0A',2048:'#FFD600'};
function novo(){g=[[0,0,0,0],[0,0,0,0]];pts=0;movs=0;over=false;add();add();draw();}
function add(){var e=[];for(var i=0;i<4;i++)for(var j=0;j<4;j++)if(!g[i][j])e.push([i,j]);if(e.length){var p=e[Math.floor(Math.random()*e.length)];g[p[0]][p[1]]=Math.random()<0.9?2:4;}}
function draw(){
 var b=document.getElementById('board');b.innerHTML='';
 for(var i=0;i<4;i++)for(var j=0;j<4;j++){
  var d=document.createElement('div');d.className='cell';var v=g[i][j];
  if(v){d.textContent=v;d.style.background=cores[v]||'#FF6F00';if(v>64)d.style.color='#fff';if(v>512)d.style.fontSize='18px';}
  b.appendChild(d);
 }
 document.getElementById('p').textContent=pts;document.getElementById('m').textContent=movs;document.getElementById('r').textContent=Math.max(rec,pts);
}
function mv(dir){
 if(over)return;var moved=false;
 function slide(row){var a=row.filter(x=>x);for(var i=0;i<a.length-1;i++){if(a[i]===a[i+1]){a[i]*=2;pts+=a[i];a.splice(i+1,1);}}while(a.length<4)a.push(0);return a;}
 for(var k=0;k<4;k++){
  var line=[];
  for(var i=0;i<4;i++){line.push(dir==='left'?g[k][i]:dir==='right'?g[k][3-i]:dir==='up'?g[i][k]:g[3-i][k]);}
  var nl=slide(line);var old=line.join(',');
  if(nl.join(',')!==old)moved=true;
  for(var i=0;i<4;i++){if(dir==='left')g[k][i]=nl[i];else if(dir==='right')g[k][3-i]=nl[i];else if(dir==='up')g[i][k]=nl[i];else g[3-i][k]=nl[i];}
 }
 if(moved){movs++;add();draw();if(pts>rec)rec=pts;check();}
}
function check(){for(var i=0;i<4;i++)for(var j=0;j<4;j++){if(!g[i][j])return;if(g[i][j]===2048){over=true;alert('🏆 Venceu!');return;}}over=true;}
var sx,sy;
var bd=document.getElementById('board');
bd.addEventListener('touchstart',e=>{var t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
bd.addEventListener('touchend',e=>{var t=e.changedTouches[0];var dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)<20&&Math.abs(dy)<20)return;if(Math.abs(dx)>Math.abs(dy))mv(dx>0?'right':'left');else mv(dy>0?'down':'up');},{passive:true});
novo();
</script>
</body>
</html>`;

async function enviar2048(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "2048_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: JOGO2048_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🔢 2048" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviar2048 };
