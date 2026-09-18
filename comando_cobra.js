"use strict";
const crypto = require("crypto");
const HTML_GAME_PRIMITIVE = "GenAIaeacdsnwHtmlPrimitive";
const HTML_GAME_TRUSTED_SOURCES = ["nixel.dev"];

async function getBase64(url) {
    if (!url || typeof url !== "string") return null;
    if (url.startsWith("data:image")) return url;
    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const buf = Buffer.from(await r.arrayBuffer());
        return `data:${r.headers.get("content-type") || "image/jpeg"};base64,${buf.toString("base64")}`;
    } catch { return null; }
}
function esc(v){ return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

function buildHtml(data) {
    const usuario = esc(data.usuario || "Jogador");
    const foto = esc(data.fotoUser || "");
    const avatar = foto ? `<img src="${foto}" class="av" alt="">` : `<div class="av fb">🐍</div>`;

    return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Cobrinha</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:Arial,sans-serif;background:#05100a;background-image:radial-gradient(circle at 50% 0%,#0a3d1e 0%,#05100a 70%);color:#fff;min-height:100vh;display:flex;justify-content:center;padding:6px;overflow-x:hidden}
.box{width:100%;max-width:440px;padding:12px;border-radius:18px;background:#0a1a10;background-image:linear-gradient(165deg,#0e2a1a,#05100a 60%,#020805);border:2px solid #00ff88;box-shadow:0 0 40px rgba(0,255,136,.25)}
.top{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:12px;background:rgba(0,0,0,.5);border:1px solid rgba(0,255,136,.3);margin-bottom:10px}
.brand{display:flex;align-items:center;gap:8px}
.icon{font-size:20px}
.titulo{font-size:13px;font-weight:900;color:#00ff88;letter-spacing:.5px;text-shadow:0 0 10px rgba(0,255,136,.6)}
.sub{font-size:8px;color:#00ff88;letter-spacing:1.5px;opacity:.6;margin-top:1px}
.user{display:flex;align-items:center;gap:6px;max-width:140px}
.av{width:24px;height:24px;border-radius:50%;border:2px solid #00ff88;object-fit:cover;display:block}
.fb{display:flex;align-items:center;justify-content:center;background:#0a1a10;font-size:11px}
.nome{font-size:10px;font-weight:700;color:#7fffaa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hud{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px}
.hud-item{padding:8px 4px;border-radius:10px;background:rgba(0,0,0,.4);border:1px solid rgba(0,255,136,.25);text-align:center}
.hud-label{font-size:7px;color:#00ff88;letter-spacing:1.5px;font-weight:700;opacity:.7}
.hud-valor{font-size:18px;font-weight:900;color:#fff;margin-top:2px}
.hud-valor.verde{color:#00ff88;text-shadow:0 0 8px rgba(0,255,136,.5)}
.hud-valor.amarelo{color:#ffdd00;text-shadow:0 0 8px rgba(255,221,0,.5)}
.hud-valor.rosa{color:#ff00aa;text-shadow:0 0 8px rgba(255,0,170,.5)}
.arena{position:relative;width:100%;background:#000;border-radius:14px;border:2px solid #00ff88;overflow:hidden;margin-bottom:10px;box-shadow:inset 0 0 40px rgba(0,255,136,.15);touch-action:none}
canvas{display:block;width:100%;height:320px;background:#05100a}
.overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(5,16,10,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;pointer-events:none}
.overlay-titulo{font-size:22px;font-weight:900;color:#00ff88;letter-spacing:2px;text-shadow:0 0 20px rgba(0,255,136,.8)}
.overlay-sub{font-size:10px;color:#7fffaa;font-weight:700;letter-spacing:1px;text-align:center;padding:0 20px;animation:blink .9s infinite alternate}
@keyframes blink{0%{opacity:.4}100%{opacity:1}}
.controles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;max-width:260px;margin-left:auto;margin-right:auto}
.ctrl{padding:14px 4px;border-radius:12px;background:rgba(0,255,136,.1);border:2px solid #00ff88;color:#00ff88;font-size:20px;font-weight:900;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center}
.ctrl:active:not(:disabled){background:rgba(0,255,136,.35);transform:scale(.94)}
.ctrl:disabled{opacity:.3}
.ctrl.vazio{background:transparent;border-color:transparent}
.btn-reiniciar{width:100%;padding:12px;border-radius:12px;background:linear-gradient(180deg,#33ff99,#00aa55);color:#021a0a;border:none;font-size:13px;font-weight:900;letter-spacing:2px;cursor:pointer;box-shadow:0 4px 0 #005522,0 6px 20px rgba(0,255,136,.4);font-family:inherit}
.btn-reiniciar:active{transform:translateY(3px);box-shadow:0 1px 0 #005522}
.footer{text-align:center;padding-top:8px;font-size:8px;color:#00ff88;opacity:.5;letter-spacing:1.5px}
</style></head><body>
<div class="box">
<div class="top"><div class="brand"><span class="icon">🐍</span><div><div class="titulo">COBRINHA</div><div class="sub">CLASSIC SNAKE</div></div></div><div class="user">${avatar}<span class="nome">${usuario}</span></div></div>
<div class="hud">
<div class="hud-item"><div class="hud-label">PONTOS</div><div class="hud-valor verde" id="pts">0</div></div>
<div class="hud-item"><div class="hud-label">TAMANHO</div><div class="hud-valor amarelo" id="tam">3</div></div>
<div class="hud-item"><div class="hud-label">RECORDE</div><div class="hud-valor rosa" id="rec">0</div></div>
</div>
<div class="arena" id="arena">
<canvas id="cv" width="400" height="320"></canvas>
<div class="overlay" id="ov">
<div class="overlay-titulo">🐍 COBRINHA</div>
<div class="overlay-sub">USA OS BOTOES OU O DEDO PRA MOVER<br>COME A MACA E NAO BATE NA PAREDE</div>
</div>
</div>
<div class="controles">
<div class="ctrl vazio"></div>
<button class="ctrl" onclick="virar('cima')">▲</button>
<div class="ctrl vazio"></div>
<button class="ctrl" onclick="virar('esq')">◀</button>
<button class="ctrl" onclick="virar('baixo')">▼</button>
<button class="ctrl" onclick="virar('dir')">▶</button>
</div>
<button class="btn-reiniciar" onclick="reiniciar()">🔄 NOVA PARTIDA</button>
<div class="footer">by Yoshirukkj • Lorde-BOT</div>
</div>
<script>
(function(){
var cv = document.getElementById("cv"), ctx = cv.getContext("2d");
var ov = document.getElementById("ov");
var arena = document.getElementById("arena");
var LARGURA = 400, ALTURA = 320, GRID = 20;
var TAM_X = LARGURA/GRID, TAM_Y = ALTURA/GRID;
var cobra, direcao, proximaDir, comida, pontos, recorde = 0, ativo, timer = null, velocidade = 120;
var audioCtx = null;

function beep(f,d,t,v){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t||"sine";o.frequency.value=f;g.gain.value=v||.06;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+d);o.stop(audioCtx.currentTime+d);}catch(e){}}
function somComer(){beep(880,.1,"sine",.07);setTimeout(function(){beep(1100,.1,"sine",.06);},80);}
function somMorrer(){beep(200,.2,"sawtooth",.08);setTimeout(function(){beep(150,.3,"sawtooth",.08);},150);}

try { recorde = parseInt(localStorage.getItem("snake_rec")||"0")||0; } catch(e){}
document.getElementById("rec").textContent = recorde;

function iniciar(){
    cobra = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    direcao = "dir"; proximaDir = "dir";
    pontos = 0; velocidade = 120; ativo = true;
    document.getElementById("pts").textContent = 0;
    document.getElementById("tam").textContent = 3;
    ov.style.display = "none";
    sortearComida();
    if(timer) clearInterval(timer);
    timer = setInterval(tick, velocidade);
    desenhar();
}

function sortearComida(){
    while(true){
        var x = Math.floor(Math.random()*TAM_X);
        var y = Math.floor(Math.random()*TAM_Y);
        var bate = false;
        for(var i=0;i<cobra.length;i++) if(cobra[i].x===x && cobra[i].y===y){bate=true;break;}
        if(!bate){ comida = {x:x,y:y}; return; }
    }
}

function virar(dir){
    if(!ativo) return;
    if(dir === "cima" && direcao !== "baixo") proximaDir = "cima";
    else if(dir === "baixo" && direcao !== "cima") proximaDir = "baixo";
    else if(dir === "esq" && direcao !== "dir") proximaDir = "esq";
    else if(dir === "dir" && direcao !== "esq") proximaDir = "dir";
    beep(500,.04,"square",.03);
}

function tick(){
    if(!ativo) return;
    direcao = proximaDir;
    var cabeca = { x: cobra[0].x, y: cobra[0].y };
    if(direcao === "cima") cabeca.y--;
    else if(direcao === "baixo") cabeca.y++;
    else if(direcao === "esq") cabeca.x--;
    else if(direcao === "dir") cabeca.x++;

    if(cabeca.x < 0 || cabeca.x >= TAM_X || cabeca.y < 0 || cabeca.y >= TAM_Y){
        return morrer();
    }
    for(var i=0;i<cobra.length;i++){
        if(cobra[i].x === cabeca.x && cobra[i].y === cabeca.y) return morrer();
    }

    cobra.unshift(cabeca);

    if(cabeca.x === comida.x && cabeca.y === comida.y){
        pontos += 10;
        document.getElementById("pts").textContent = pontos;
        document.getElementById("tam").textContent = cobra.length;
        somComer();
        if(velocidade > 60){ velocidade -= 3; clearInterval(timer); timer = setInterval(tick, velocidade); }
        sortearComida();
    } else {
        cobra.pop();
    }

    desenhar();
}

function morrer(){
    ativo = false;
    clearInterval(timer);
    somMorrer();
    if(pontos > recorde){
        recorde = pontos;
        try { localStorage.setItem("snake_rec", recorde); } catch(e){}
        document.getElementById("rec").textContent = recorde;
    }
    ov.innerHTML = '<div class="overlay-titulo" style="color:#ff3355">💀 GAME OVER</div>' +
        '<div class="overlay-sub" style="color:#00ff88">'+pontos+' pontos • '+cobra.length+' de tamanho</div>' +
        '<div class="overlay-sub" style="color:#fff;animation:none">APERTA NOVA PARTIDA</div>';
    ov.style.display = "flex";
}

function desenhar(){
    ctx.fillStyle = "#05100a";
    ctx.fillRect(0,0,LARGURA,ALTURA);

    // grade de fundo
    ctx.strokeStyle = "rgba(0, 255, 136, 0.05)";
    ctx.lineWidth = 1;
    for(var x=0;x<=TAM_X;x++){
        ctx.beginPath(); ctx.moveTo(x*GRID,0); ctx.lineTo(x*GRID,ALTURA); ctx.stroke();
    }
    for(var y=0;y<=TAM_Y;y++){
        ctx.beginPath(); ctx.moveTo(0,y*GRID); ctx.lineTo(LARGURA,y*GRID); ctx.stroke();
    }

    // comida
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff3355";
    ctx.fillStyle = "#ff3355";
    ctx.beginPath();
    ctx.arc(comida.x*GRID + GRID/2, comida.y*GRID + GRID/2, GRID/2 - 2, 0, Math.PI*2);
    ctx.fill();
    // brilho
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(comida.x*GRID + GRID/2 - 3, comida.y*GRID + GRID/2 - 3, 2, 0, Math.PI*2);
    ctx.fill();

    // cobra
    for(var i=cobra.length-1;i>=0;i--){
        var seg = cobra[i];
        var intens = 1 - (i/cobra.length)*0.5;
        if(i === 0){
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#00ff88";
            ctx.fillStyle = "#00ff88";
        } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#00cc66";
            ctx.fillStyle = "rgba(0, " + Math.floor(200 + 55*intens) + ", " + Math.floor(100 + 36*intens) + ", " + (0.6 + 0.4*intens) + ")";
        }
        ctx.fillRect(seg.x*GRID + 1, seg.y*GRID + 1, GRID - 2, GRID - 2);
        // olho da cabeça
        if(i === 0){
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#05100a";
            var ex1, ey1, ex2, ey2;
            if(direcao === "dir"){ ex1 = seg.x*GRID + GRID - 7; ey1 = seg.y*GRID + 5; ex2 = ex1; ey2 = seg.y*GRID + GRID - 7; }
            else if(direcao === "esq"){ ex1 = seg.x*GRID + 4; ey1 = seg.y*GRID + 5; ex2 = ex1; ey2 = seg.y*GRID + GRID - 7; }
            else if(direcao === "cima"){ ex1 = seg.x*GRID + 5; ey1 = seg.y*GRID + 4; ex2 = seg.x*GRID + GRID - 7; ey2 = ey1; }
            else { ex1 = seg.x*GRID + 5; ey1 = seg.y*GRID + GRID - 5; ex2 = seg.x*GRID + GRID - 7; ey2 = ey1; }
            ctx.fillRect(ex1, ey1, 3, 3);
            ctx.fillRect(ex2, ey2, 3, 3);
        }
    }
    ctx.shadowBlur = 0;
}

// swipe
var inicioToque = null;
arena.addEventListener("touchstart", function(e){
    if(!ativo) return;
    inicioToque = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

arena.addEventListener("touchend", function(e){
    if(!ativo || !inicioToque) return;
    var fim = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    var dx = fim.x - inicioToque.x;
    var dy = fim.y - inicioToque.y;
    if(Math.abs(dx) > Math.abs(dy)){
        if(dx > 30) virar("dir");
        else if(dx < -30) virar("esq");
    } else {
        if(dy > 30) virar("baixo");
        else if(dy < -30) virar("cima");
    }
    inicioToque = null;
}, { passive: true });

// teclado
window.addEventListener("keydown", function(e){
    if(e.key === "ArrowUp") virar("cima");
    else if(e.key === "ArrowDown") virar("baixo");
    else if(e.key === "ArrowLeft") virar("esq");
    else if(e.key === "ArrowRight") virar("dir");
});

window.virar = virar;
window.reiniciar = function(){ beep(700,.06,"square",.05); iniciar(); };

iniciar();
})();
</script></body></html>`;
}

function buildMsg(html, options){
    const unified = { response_id: crypto.randomUUID(), sections: [{ view_model: { primitive: { __typename: HTML_GAME_PRIMITIVE, payload: html.trim(), trusted_sources: [...HTML_GAME_TRUSTED_SOURCES] }, __typename: "GenAISingleLayoutViewModel" } }] };
    return { botForwardedMessage: { message: { richResponseMessage: { submessages: [{ messageType: 2, messageText: String(options.submessageText || "Cobrinha 🐍") }], messageType: 1, unifiedResponse: { data: Buffer.from(JSON.stringify(unified), "utf8") }, contextInfo: { mentionedJid: [], groupMentions: [], statusAttributions: [], forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" }, forwardOrigin: 4 } } } } };
}

async function enviar(socket, jid, data){
    let foto = data.fotoUser || null;
    if(!foto && data.sender && typeof socket.profilePictureUrl === "function"){
        try { foto = await socket.profilePictureUrl(data.sender, "image"); } catch { foto = null; }
    }
    if(foto && foto.startsWith("http")) foto = await getBase64(foto);
    const html = buildHtml({ ...data, fotoUser: foto });
    return await socket.relayMessage(jid, buildMsg(html, {}), {});
}

module.exports = { name: "cobrinha", aliases: ["snake", "snakegame"], run: async (sock, info) => {
    const from = info.key.remoteJid;
    const sender = info.key.participant || info.key.remoteJid;
    const pushname = info.pushName || "Jogador";
    try {
        await sock.sendMessage(from, { react: { text: "🐍", key: info.key } });
        await enviar(sock, from, { usuario: pushname, sender });
        console.log("🐍 [cobrinha] enviado");
    } catch(e){ console.log("❌ [cobrinha]:", e.message); await sock.sendMessage(from, { text: "❌ Erro ao abrir." }, { quoted: info }); }
} };
