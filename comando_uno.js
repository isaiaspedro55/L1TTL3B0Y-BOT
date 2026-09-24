// ════════════════════════════════════════════════
// ✅ COMANDO !UNO — UNO (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const UNO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🃏 UNO</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{display:flex;justify-content:center;background:#FFF3E0;font-family:system-ui;padding:8px;min-height:100vh}
.card{width:100%;max-width:380px;background:#FFFDF7;border-radius:16px;padding:10px;text-align:center;border:2px solid #FFB74D;display:flex;flex-direction:column;max-height:96vh}
h1{color:#BF360C;font-size:20px}
.sub{font-size:11px;color:#E65100;font-weight:700;margin-bottom:8px}
.stats{display:flex;gap:6px;margin-bottom:8px}
.stat{flex:1;background:#FFD54F;border-radius:10px;padding:6px;font-size:11px;font-weight:700;color:#5D2800}
.stat b{display:block;font-size:14px}
#mesa{background:#C62828;border-radius:14px;padding:12px;min-height:220px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:3px solid #2E7D32}
#cmesa{width:90px;height:130px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:#fff;box-shadow:0 4px 8px rgba(0,0,0,.3)}
#mao{display:flex;gap:6px;overflow-x:auto;padding:10px 4px;min-height:90px;justify-content:flex-start}
.carta{min-width:58px;height:82px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;cursor:pointer;flex-shrink:0;box-shadow:0 2px 4px rgba(0,0,0,.3);border:2px solid #fff}
.carta:active{transform:scale(.93)}
.carta.sel{outline:3px solid #FFD600;transform:translateY(-8px)}
#start{position:absolute;inset:0;background:rgba(198,40,40,.96);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:5}
#start b{color:#fff;font-size:22px}
#start button{padding:12px 36px;border:none;border-radius:999px;background:#FFD54F;color:#5D2800;font-weight:800;font-size:16px;cursor:pointer}
#mesawrap{position:relative;flex:1;display:flex;flex-direction:column}
.row{display:flex;gap:8px;margin-top:8px}
.row button{flex:1;padding:11px;border:none;border-radius:999px;font-weight:800;font-size:13px;cursor:pointer}
#cp{background:#FFE0B2;color:#5D2800}
#uno{background:#3E2723;color:#FFD54F}
#nv{background:#FFB74D;color:#5D2800}
.hint{background:#3E2723;color:#FFD54F;border-radius:999px;padding:8px;margin-top:8px;font-size:12px;font-weight:700}
</style>
</head>
<body>
<div class="card">
<h1>🃏 UNO</h1>
<div class="sub">DESCARTE TODAS AS CARTAS</div>
<div class="stats">
<div class="stat">VEZ<b id="vez">VOCÊ</b></div>
<div class="stat">MESA<b id="nmesa">-</b></div>
<div class="stat">SUAS<b id="nsuas">7</b></div>
</div>
<div id="mesawrap">
<div id="mesa">
<div id="cmesa">5</div>
<div style="color:#fff;font-weight:700;font-size:13px" id="corinfo">Toque numa carta compatível</div>
</div>
<div id="start"><div style="font-size:40px">🃏</div><b>UNO</b><button onclick="novo()">▶️ JOGAR</button></div>
</div>
<div id="mao"></div>
<div class="hint">Toque numa carta compatível com a mesa</div>
<div class="row"><button id="cp" onclick="comprar()">🃏 Comprar</button><button id="uno" onclick="uno()">🔔 UNO!</button><button id="nv" onclick="novo()">🎮 Novo</button></div>
</div>
<script>
var cores=['#E53935','#FB8C00','#FDD835','#43A047'];
var nomes=['Vermelho','Laranja','Amarelo','Verde'];
var mesa=null,mao=[],bot=[],started=false,vezVoce=true;
function cartaAle(){return {n:Math.floor(Math.random()*10),c:Math.floor(Math.random()*4)};}
function novo(){
 document.getElementById('start').style.display='none';
 mesa=cartaAle();mao=[];bot=[];
 for(var i=0;i<7;i++){mao.push(cartaAle());bot.push(cartaAle());}
 started=true;vezVoce=true;draw();
}
function podeJogar(ct){return ct.n===mesa.n||ct.c===mesa.c;}
function draw(){
 var cm=document.getElementById('cmesa');
 cm.textContent=mesa.n;cm.style.background=cores[mesa.c];
 document.getElementById('nmesa').textContent=mesa.n+' '+nomes[mesa.c];
 document.getElementById('nsuas').textContent=mao.length;
 document.getElementById('vez').textContent=vezVoce?'VOCÊ':'BOT';
 var m=document.getElementById('mao');m.innerHTML='';
 mao.forEach(function(ct,i){
  var d=document.createElement('div');d.className='carta';d.textContent=ct.n;d.style.background=cores[ct.c];
  d.onclick=function(){jogar(i);};m.appendChild(d);
 });
 if(mao.length===0){alert('🏆 Você venceu!');started=false;}
 if(bot.length===0){alert('🤖 Bot venceu!');started=false;}
}
function jogar(i){
 if(!started||!vezVoce)return;
 var ct=mao[i];
 if(!podeJogar(ct)){alert('Carta incompatível!');return;}
 mesa=ct;mao.splice(i,1);vezVoce=false;draw();
 setTimeout(turnoBot,800);
}
function turnoBot(){
 if(!started)return;
 var idx=-1;
 for(var i=0;i<bot.length;i++){if(podeJogar(bot[i])){idx=i;break;}}
 if(idx>=0){mesa=bot[idx];bot.splice(idx,1);}
 else{bot.push(cartaAle());}
 vezVoce=true;draw();
}
function comprar(){if(!started||!vezVoce)return;mao.push(cartaAle());vezVoce=false;draw();setTimeout(turnoBot,800);}
function uno(){if(mao.length===1)alert('🔔 UNO!');else alert('Você tem '+mao.length+' cartas!');}
</script>
</body>
</html>`;

async function enviarUno(sock, jid, quotedMsg) {
  const htmlPayload = { response_id: "uno_" + Date.now(), sections: [{ view_model: { primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: UNO_HTML, trusted_sources: ["nixel.dev"] }, __typename: "GenAISingleLayoutViewModel", height: "full", full_screen: true } }] };
  const content = { botForwardedMessage: { message: { richResponseMessage: { messageType: 1, submessages: [{ messageType: 2, messageText: "🃏 UNO" }], unifiedResponse: { data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64") }, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
  const fullMsg = generateWAMessageFromContent(jid, content, { userJid: sock.authState?.creds?.me?.id || sock.user?.id, timestamp: new Date(), });
  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}
module.exports = { enviarUno };
