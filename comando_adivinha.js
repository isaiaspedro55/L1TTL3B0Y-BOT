// ════════════════════════════════════════════════
// ✅ COMANDO !ADIVINHA — Adivinha o Número (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const ADIVINHA_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🔢 Adivinha</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{display:flex;justify-content:center;background:#1a1a2e;font-family:system-ui;padding:10px;min-height:100vh;color:#fff}
.card{width:100%;max-width:360px;background:#252545;border-radius:18px;padding:16px;text-align:center}
h1{color:#ffd60a;font-size:20px;margin-bottom:2px}
.sub{font-size:12px;color:#aaa;margin-bottom:12px}
.stats{display:flex;gap:8px;margin-bottom:12px}
.stat{flex:1;background:#1a1a2e;border-radius:10px;padding:8px}
.stat small{display:block;font-size:10px;color:#888}
.stat b{font-size:16px}
#msg{min-height:60px;background:#1a1a2e;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;padding:10px;font-size:15px}
#hist{font-size:12px;color:#aaa;min-height:20px;margin-bottom:8px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
.grid button{padding:14px;font-size:18px;font-weight:700;border:none;border-radius:10px;background:#34345e;color:#fff;cursor:pointer}
.grid button:active{background:#4a4a8a}
#btnJogar{width:100%;padding:14px;border:none;border-radius:999px;background:#ffd60a;color:#000;font-weight:800;font-size:17px;cursor:pointer}
#inputNum{width:100%;padding:12px;border-radius:10px;border:2px solid #ffd60a;background:#1a1a2e;color:#fff;font-size:20px;text-align:center;margin-bottom:10px;outline:none}
.row{display:flex;gap:8px}
.row button{flex:1;padding:11px;border-radius:999px;border:none;font-weight:700;cursor:pointer}
#btnNovo{background:#34345e;color:#fff}
#btnReset{background:#ffd60a;color:#000}
.tip{font-size:12px;color:#ffd60a;margin-top:10px}
</style>
</head>
<body>
<div class="card">
<h1>🔢 ADIVINHA O NÚMERO</h1>
<div class="sub">1 A 100 • 7 TENTATIVAS</div>
<div class="stats">
<div class="stat"><small>TENTATIVAS</small><b id="t">0/7</b></div>
<div class="stat"><small>DICA</small><b id="dica">1-100</b></div>
<div class="stat"><small>RECORDE</small><b id="rec">-</b></div>
</div>
<div id="msg">Clique em JOGAR para começar!</div>
<div id="hist"></div>
<div id="gameArea" style="display:none">
<input id="inputNum" type="number" min="1" max="100" placeholder="1-100">
<div class="grid">
<button onclick="dig('1')">1</button><button onclick="dig('2')">2</button><button onclick="dig('3')">3</button>
<button onclick="dig('4')">4</button><button onclick="dig('5')">5</button><button onclick="dig('6')">6</button>
<button onclick="dig('7')">7</button><button onclick="dig('8')">8</button><button onclick="dig('9')">9</button>
<button onclick="clr()">C</button><button onclick="dig('0')">0</button><button onclick="tentar()">✔</button>
</div>
</div>
<button id="btnJogar" onclick="novo()">▶️ JOGAR</button>
<div class="row" style="margin-top:10px"><button id="btnNovo" onclick="novo()">🔄 Novo</button><button id="btnReset" onclick="novo()">🎮 Reiniciar</button></div>
<div class="tip">Adivinhe o número secreto</div>
</div>
<script>
var secreto,min,max,tentativas,acabou,recorde=null;
function novo(){
 secreto=Math.floor(Math.random()*100)+1;min=1;max=100;tentativas=0;acabou=false;
 document.getElementById('gameArea').style.display='block';
 document.getElementById('btnJogar').style.display='none';
 document.getElementById('inputNum').value='';
 document.getElementById('hist').textContent='';
 upd('Adivinhe! Digite de 1 a 100','1-100');
}
function upd(m,d){document.getElementById('msg').textContent=m;document.getElementById('t').textContent=tentativas+'/7';document.getElementById('dica').textContent=d;document.getElementById('rec').textContent=recorde?recorde:'-';}
function dig(n){var i=document.getElementById('inputNum');if(i.value.length<3)i.value+=n;}
function clr(){document.getElementById('inputNum').value='';}
function tentar(){
 if(acabou)return;
 var v=parseInt(document.getElementById('inputNum').value);
 if(!v||v<1||v>100){document.getElementById('msg').textContent='⚠️ Digite 1 a 100!';return;}
 tentativas++;
 var h=document.getElementById('hist');h.textContent+=' '+v;
 if(v===secreto){acabou=true;
   if(!recorde||tentativas<recorde)recorde=tentativas;
   upd('🎉 ACERTOU em '+tentativas+' tentativas! Nº '+secreto,min+'-'+max);
   document.getElementById('btnJogar').style.display='block';document.getElementById('btnJogar').textContent='▶️ JOGAR DE NOVO';
 }else if(tentativas>=7){acabou=true;upd('💥 Fim! Era '+secreto+'. Tente de novo!',min+'-'+max);
   document.getElementById('btnJogar').style.display='block';document.getElementById('btnJogar').textContent='🔄 TENTAR DE NOVO';
 }else if(v<secreto){min=Math.max(min,v+1);upd('📈 É MAIOR que '+v+'! Tente '+min+'-'+max,min+'-'+max);}
 else{max=Math.min(max,v-1);upd('📉 É MENOR que '+v+'! Tente '+min+'-'+max,min+'-'+max);}
 document.getElementById('inputNum').value='';
}
document.getElementById('inputNum').addEventListener('keydown',function(e){if(e.key==='Enter')tentar();});
</script>
</body>
</html>`;

async function enviarAdivinha(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "adivinha_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: ADIVINHA_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🔢 Adivinha o Número" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarAdivinha };
