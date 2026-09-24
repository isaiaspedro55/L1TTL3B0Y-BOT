// ════════════════════════════════════════════════
// ✅ COMANDO !XADREZCHINES — Xiangqi (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const XADREZCHINES_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>♟️ Xiangqi</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#FFF3E0;font-family:system-ui;padding:8px;min-height:100vh}
.card{width:100%;max-width:380px;background:#FFFDF7;border-radius:16px;padding:10px;text-align:center;border:2px solid #D7A76F;max-height:96vh;overflow:hidden;display:flex;flex-direction:column}
h1{font-size:18px;color:#5D2800}
.sub{font-size:10px;color:#BF360C;font-weight:700;margin-bottom:8px}
.stats{display:flex;gap:6px;margin-bottom:8px}
.stat{flex:1;background:#FFE0B2;border-radius:10px;padding:6px;font-size:11px}
.stat b{display:block;font-size:13px;color:#3E2723}
#wrap{width:100%;flex:1;min-height:0;display:flex;justify-content:center}
canvas{width:100%;max-width:340px;height:auto;aspect-ratio:9/10;background:#F5DEB3;border-radius:10px;border:2px solid #A9713F;touch-action:none}
#turno{margin:8px 0;padding:10px;border-radius:999px;background:#8D4A1A;color:#fff;font-weight:800;font-size:14px}
.row{display:flex;gap:8px}
.row button{flex:1;padding:11px;border:none;border-radius:999px;font-weight:800;cursor:pointer;font-size:14px}
#n{background:#FFE0B2;color:#8D4A1A}
#r{background:#8D4A1A;color:#fff}
</style>
</head>
<body>
<div class="card">
<h1>♟️ XIANGQI</h1>
<div class="sub">XADREZ CHINÊS • CAPTURE O GENERAL</div>
<div class="stats">
<div class="stat">VEZ<b id="vez">PRETO</b></div>
<div class="stat">PEÇAS<b>16-16</b></div>
<div class="stat">XEQUE<b>-</b></div>
</div>
<div id="wrap"><canvas id="c" width="340" height="380"></canvas></div>
<div id="turno">Preto é a vez</div>
<div class="row"><button id="n" onclick="novo()">🔄 Novo</button><button id="r" onclick="novo()">🎮 Reiniciar</button></div>
</div>
<script>
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var W=340,H=380,cols=9,rows=10,mx=20,my=20;
var cw=(W-mx*2)/(cols-1),ch=(H-my*2)/(rows-1);
function draw(){
 ctx.fillStyle='#F5DEB3';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#A9713F';ctx.lineWidth=1.5;
 for(var r=0;r<rows;r++){ctx.beginPath();ctx.moveTo(mx,my+r*ch);ctx.lineTo(W-mx,my+r*ch);ctx.stroke();}
 for(var c=0;c<cols;c++){ctx.beginPath();ctx.moveTo(mx+c*cw,my);ctx.lineTo(mx+c*cw,my+4*ch);ctx.stroke();ctx.beginPath();ctx.moveTo(mx+c*cw,my+5*ch);ctx.lineTo(mx+c*cw,H-my);ctx.stroke();}
 ctx.fillStyle='#87CEEB';ctx.fillRect(mx,my+4*ch+4,W-mx*2,ch-8);
 ctx.fillStyle='#8D4A1A';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText('楚 河  漢 界',W/2,my+5*ch-8);
 var layout=[
  [0,0,'N','P'],[1,0,'B','P'],[2,0,'A','P'],[3,0,'K','P'],[4,0,'A','P'],[5,0,'B','P'],[6,0,'N','P'],
  [1,2,'C','P'],[5,2,'C','P'],[0,3,'P','P'],[2,3,'P','P'],[4,3,'P','P'],[6,3,'P','P'],
  [0,9,'N','V'],[1,9,'B','V'],[2,9,'A','V'],[3,9,'K','V'],[4,9,'A','V'],[5,9,'B','V'],[6,9,'N','V'],
  [1,7,'C','V'],[5,7,'C','V'],[0,6,'P','V'],[2,6,'P','V'],[4,6,'P','V'],[6,6,'P','V']
 ];
 layout.forEach(function(o){
  var x=mx+o[0]*cw,y=my+o[1]*ch;
  ctx.beginPath();ctx.arc(x,y,14,0,7);
  ctx.fillStyle=o[3]==='P'?'#FFF8E1':'#FFE0B2';ctx.fill();
  ctx.strokeStyle=o[3]==='P'?'#5D2800':'#E65100';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=o[3]==='P'?'#3E2723':'#BF360C';ctx.font='bold 12px system-ui';ctx.fillText(o[2],x,y+4);
 });
}
function novo(){document.getElementById('vez').textContent='PRETO';document.getElementById('turno').textContent='Preto é a vez';draw();}
novo();
</script>
</body>
</html>`;

async function enviarXadrezChines(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "xcz_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: XADREZCHINES_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "♟️ Xadrez Chinês" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarXadrezChines };
