require("dotenv").config();
// ✅ LINHA 1 ABSOLUTA
process.env.TMPDIR = require("path").join(process.cwd(), "downloads");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
} = require("@itsliaaa/baileys");

const fs       = require("fs-extra");
const { exec } = require("child_process");
const path     = require("path");
const axios    = require("axios");
const https    = require("https");
const FormData = require("form-data");

fs.ensureDirSync(process.env.TMPDIR);
fs.ensureDirSync("./downloads");
fs.ensureDirSync("./vpn");
fs.ensureDirSync("./dados");

const CONFIG = {
  PREFIXO:          "!",
  NUMERO_BOT:       "244954260707",
  NUMEROS_ADM:      ["926612801","244926612801","169853876965546"],
<<<<<<< HEAD
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
=======
  GROQ_API_KEY:     process.env.GROQ_API_KEY,
>>>>>>> bcff44d (Atualiza bot e adiciona novos dados)
  DONO_JID:         "169853876965546@lid",
  DONO_NOME:        "ISAÍAS PEDRO",
  DONO_NUM:         "926 612 801",
  VOZ_TTS:          "pt-PT-DuarteNeural",
  SENHA_BOT:        "lordinho2025",
  CANAL_URL:        "https://whatsapp.com/channel/0029VbDBkEcK5cDMSt0E4r0Q",
  NOME_BOT:         "L1TTL3B0T",
  // ✅ Scraper Hub — coloca o URL da tua API aqui
  SCRAPER_HUB_URL:  "http://localhost:3000",
};

const httpsAgent = new https.Agent({rejectUnauthorized:false,keepAlive:true,timeout:60000});
const silentLogger={level:"silent",child:()=>silentLogger,info:()=>{},warn:()=>{},error:()=>{},debug:()=>{},trace:()=>{},fatal:()=>{}};
const errosComando={};
let ppBotUrl=null;
let botFotoBuffer=null;
const BOT_FOTO_PATH="./dados/bot_foto.jpg";
if(fs.existsSync(BOT_FOTO_PATH)){try{botFotoBuffer=fs.readFileSync(BOT_FOTO_PATH);}catch{}}

process.on("uncaughtException",e=>{if(e.code==="ENOENT"&&e.path&&(e.path.includes("-enc")||e.path.includes("/tmp/")||e.path.includes("/video/media/"))) return; console.error("❌",e.message);});
process.on("unhandledRejection",r=>{const m=r?.message||String(r); if(m.includes("-enc")||m.includes("Media upload")) return; console.error("❌",m);});

// ═══════════════════════════════════════════════════════
// ✅ ARQUIVOS DE DADOS
// ═══════════════════════════════════════════════════════
const ARQUIVO_RANK        = "./dados/rank.json";
const ARQUIVO_STATS       = "./dados/stats.json";
const ARQUIVO_ATIVOS      = "./dados/ativos.json";
const ARQUIVO_SILENCIADOS = "./dados/silenciados.json";
const ARQUIVO_COINS       = "./dados/coins.json";
const ARQUIVO_COOLDOWNS   = "./dados/cooldowns.json";
const ARQUIVO_VIPS        = "./dados/vips.json";
const ARQUIVO_ADIVINHAR   = "./dados/adivinhar.json";

[ARQUIVO_RANK,ARQUIVO_STATS,ARQUIVO_ATIVOS,ARQUIVO_SILENCIADOS,ARQUIVO_COINS,ARQUIVO_COOLDOWNS,ARQUIVO_VIPS,ARQUIVO_ADIVINHAR].forEach(f=>{
  if(!fs.existsSync(f)){
    if(f.includes("stats")) fs.writeJsonSync(f,{total:0,comandos:{},usuarios:{}});
    else fs.writeJsonSync(f,{});
  }
});

// ═══════════════════════════════════════════════════════
// ✅ ESTADOS EM MEMÓRIA
// ═══════════════════════════════════════════════════════
const membrosSilenciados={}, jogoAtivo={}, jogoLoop={}, bufferMsgs={}, cacheMsg={}, msgApagadas={};
const banEmCurso=new Set(), historyMsgs={}, menuEsperandoResposta=new Map();
const senhasAprovadas=new Set(), gruposAtivados=new Set(), pedidoSenha=new Set();
const chatsDesativados=new Set(), vozBotDesativado=new Set(), comandosBloqueados=new Set();
const antiLinkDesativado=new Set(), cacheViewOnce={};
const MAX_BUFFER=100, MAX_CACHE_MSG=200, MAX_HISTORY=1000;
const jogoAdivinhar={};   // jid → {numero, tentativas, msgKey}
const jogoVelocidade={};  // jid → {palavra, inicio, msgKey}
const jogoMemoria={};     // jid → {cartas, viradas, acertos, msgKey}

try{const s=fs.readJsonSync(ARQUIVO_SILENCIADOS); for(const[j,l] of Object.entries(s)) membrosSilenciados[j]=l;}catch{}

const MENU_NUMEROS={"1":"cat_principal","2":"cat_downloads","3":"cat_figurinhas","4":"cat_brincadeiras","5":"cat_coins","6":"cat_alteradores","7":"cat_logos","8":"cat_adm","9":"cat_dono","0":"cat_18"};
const LINK_RX=/(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/|bit\.ly|youtu\.be|youtube\.com|facebook\.com|instagram\.com|tiktok\.com|wa\.me)/i;
const STATUS_MENCAO_RX=/status\s*@|'s status|was mentioned/i;
const ARQ_EXTS=[".ehi",".npv",".hia",".ovpn",".conf",".vpn",".key",".cert",".p12",".vless",".vmess"];

// ═══════════════════════════════════════════════════════
// ✅ HELPERS BÁSICOS
// ═══════════════════════════════════════════════════════
function ehDono(s){if(!s) return false; const n=String(s).split("@")[0].split(":")[0].replace(/\D/g,""); if(!n) return false; return CONFIG.NUMEROS_ADM.some(d=>{const dn=d.replace(/\D/g,""); return n===dn||n.endsWith(dn)||dn.endsWith(n);});}
function extrairJid(p){if(!p) return ""; if(typeof p==="string") return p; if(typeof p==="object"&&p.id) return p.id; return String(p);}
function removerAcentos(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function formatarDuracao(seg){if(!seg||isNaN(seg)) return "N/A"; const m=Math.floor(seg/60),s=Math.floor(seg%60); return `${m}:${s.toString().padStart(2,"0")}`;}
function getTexto(msg){const m=msg?.message; if(!m) return ""; return m.conversation||m.extendedTextMessage?.text||m.imageMessage?.caption||m.videoMessage?.caption||m.documentMessage?.caption||"";}
function calcularSeguro(expr){const safe=expr.replace(/[^0-9+\-*/().%\s]/g,"").trim(); if(!safe) throw new Error("Inválida"); return Function(`"use strict"; return (${safe})`)();}
function getTipoMsg(msg){const m=msg?.message; if(!m) return "📄"; if(m.conversation||m.extendedTextMessage) return "💬"; if(m.imageMessage) return "🖼️"; if(m.videoMessage) return "🎥"; if(m.audioMessage||m.pttMessage) return "🎙️"; if(m.stickerMessage) return "🎭"; if(m.documentMessage) return "📄"; return "📄";}
function ehMencaoStatus(msg,texto){if(msg.message?.statusMentionMessage) return true; if(texto&&STATUS_MENCAO_RX.test(texto)) return true; const ctx=msg.message?.extendedTextMessage?.contextInfo; if(ctx?.remoteJid?.includes("status@broadcast")) return true; if(ctx?.participant?.includes("status@broadcast")) return true; return false;}
function selecionarSemRepetir(banco,usadas){const disp=banco.filter(item=>{const id=item.p||item.palavra||item.c||item.i; return !usadas.includes(id);}); if(!disp.length) return null; return disp[Math.floor(Math.random()*disp.length)];}
function mostrarGuerraEstado(jogo){const vidas=["❤️❤️❤️❤️❤️❤️","🧡❤️❤️❤️❤️❤️","🧡🧡❤️❤️❤️❤️","🧡🧡🧡❤️❤️❤️","🧡🧡🧡🧡❤️❤️","🧡🧡🧡🧡🧡❤️","💀💀💀💀💀💀"]; const pM=jogo.palavra.split("").map(l=>jogo.letrasAcertadas.includes(l)?l:"_").join(" "); const eS=jogo.letrasErradas.length>0?jogo.letrasErradas.join(", "):"Nenhuma"; return `⚔️ *FORCA*\n✦ ─────────── ✦\n🔤 *${pM}*\n💡 _${jogo.dica}_\n\n${vidas[Math.min(jogo.letrasErradas.length,6)]}\n❌ Erradas: *${eS}*\n\n_Digita uma letra!_`;}

const userRateLimit={};
function verificarRateLimit(s){const a=Date.now(); if(userRateLimit[s]&&(a-userRateLimit[s])<2000) return false; userRateLimit[s]=a; return true;}
setInterval(()=>{const a=Date.now(); for(const[k,v] of Object.entries(userRateLimit)){if(a-v>10000) delete userRateLimit[k];}},5*60*1000);

function detectarWakeWord(txt){
  if(!txt) return null;
  const palavras=txt.trim().split(/\s+/);
  const padroes=["isaias","izaias","isaia","izaia"];
  for(let i=0;i<Math.min(4,palavras.length);i++){const pl=removerAcentos(palavras[i].toLowerCase()).replace(/[^a-z]/g,""); if(padroes.includes(pl)) return palavras.slice(i+1).join(" ").trim();}
  return null;
}
function salvarNoBuffer(jid,d){if(!bufferMsgs[jid]) bufferMsgs[jid]=[]; bufferMsgs[jid].push(d); if(bufferMsgs[jid].length>MAX_BUFFER) bufferMsgs[jid].shift();}
function salvarSilenciados(){try{fs.writeJsonSync(ARQUIVO_SILENCIADOS,membrosSilenciados);}catch{}}
function salvarStats(cmd,sender){try{const s=fs.readJsonSync(ARQUIVO_STATS); s.total=(s.total||0)+1; s.comandos[cmd]=(s.comandos[cmd]||0)+1; s.usuarios[String(sender).split("@")[0]]=(s.usuarios[String(sender).split("@")[0]]||0)+1; fs.writeJsonSync(ARQUIVO_STATS,s);}catch{}}
function addXP(sender,xp=2){try{const r=fs.readJsonSync(ARQUIVO_RANK); const n=String(sender).split("@")[0]; if(!r[n]) r[n]={xp:0,nivel:1,msgs:0}; r[n].xp+=xp; r[n].msgs+=1; r[n].nivel=Math.floor(r[n].xp/100)+1; fs.writeJsonSync(ARQUIVO_RANK,r);}catch{}}
function registarAtividade(sender,jid){try{const a=fs.readJsonSync(ARQUIVO_ATIVOS); if(!a[jid]) a[jid]={}; a[jid][String(sender)]=Date.now(); fs.writeJsonSync(ARQUIVO_ATIVOS,a);}catch{}}

// ═══════════════════════════════════════════════════════
// ✅ SISTEMA DE COINS
// ═══════════════════════════════════════════════════════
function getCoins(s){try{const c=fs.readJsonSync(ARQUIVO_COINS); return c[s]?.moedas||0;}catch{return 0;}}
function setCoins(s,n){try{const c=fs.readJsonSync(ARQUIVO_COINS); if(!c[s]) c[s]={moedas:0}; c[s].moedas=Math.max(0,n); fs.writeJsonSync(ARQUIVO_COINS,c);}catch{}}
function addCoins(s,n){try{const c=fs.readJsonSync(ARQUIVO_COINS); if(!c[s]) c[s]={moedas:0}; c[s].moedas+=n; fs.writeJsonSync(ARQUIVO_COINS,c);}catch{}}
function getCooldown(s,t){try{const c=fs.readJsonSync(ARQUIVO_COOLDOWNS); return c[`${s}_${t}`]||0;}catch{return 0;}}
function setCooldown(s,t){try{const c=fs.readJsonSync(ARQUIVO_COOLDOWNS); c[`${s}_${t}`]=Date.now(); fs.writeJsonSync(ARQUIVO_COOLDOWNS,c);}catch{}}

// ═══════════════════════════════════════════════════════
// ✅ SISTEMA DE VIPS
// ═══════════════════════════════════════════════════════
function isVip(sender){try{const v=fs.readJsonSync(ARQUIVO_VIPS); return !!v[sender];}catch{return false;}}
function addVip(sender,nome="VIP"){try{const v=fs.readJsonSync(ARQUIVO_VIPS); v[sender]={nome,desde:Date.now()}; fs.writeJsonSync(ARQUIVO_VIPS,v);}catch{}}
function removeVip(sender){try{const v=fs.readJsonSync(ARQUIVO_VIPS); delete v[sender]; fs.writeJsonSync(ARQUIVO_VIPS,v);}catch{}}
function listarVips(){try{return fs.readJsonSync(ARQUIVO_VIPS);}catch{return {};}}

// ═══════════════════════════════════════════════════════
// ✅ SELO VERIFICADO (aplicado em todas as respostas)
// ═══════════════════════════════════════════════════════
function criarSeloBot(jid){
  const num=CONFIG.NUMERO_BOT;
  return {
    key:{participant:"0@s.whatsapp.net",remoteJid:jid||"status@broadcast",fromMe:false},
    message:{contactMessage:{
      displayName:CONFIG.NOME_BOT,
      vcard:`BEGIN:VCARD\nVERSION:3.0\nN:;${CONFIG.NOME_BOT};;;\nFN:${CONFIG.NOME_BOT}\nitem1.TEL;waid=${num}:+${num}\nitem1.X-ABLabel:WhatsApp\nEND:VCARD`,
      contextInfo:{forwardingScore:1,isForwarded:true}
    }}
  };
}

// ═══════════════════════════════════════════════════════
// ✅ BARRA DE CARREGAMENTO COM EDIÇÃO DE MENSAGEM
// ═══════════════════════════════════════════════════════
const FRAMES_LOADING=[
  "⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛  0%",
  "🟦🟦⬛⬛⬛⬛⬛⬛⬛⬛ 20%",
  "🟦🟦🟦🟦⬛⬛⬛⬛⬛⬛ 40%",
  "🟦🟦🟦🟦🟦🟦⬛⬛⬛⬛ 60%",
  "🟦🟦🟦🟦🟦🟦🟦🟦⬛⬛ 80%",
  "🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% ",
];

async function barraCarregamento(sock,jid,seloBot,titulo,callbackDownload){
  let loadingMsg=null;
  try{
    loadingMsg=await sock.sendMessage(jid,{text:`⏬ *${titulo}*\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});
  }catch{loadingMsg=null;}

  const downloadPromise=callbackDownload();

  // Anima frames 1-4 (paralelo ao download)
  for(let i=1;i<=4;i++){
    await new Promise(r=>setTimeout(r,600));
    if(loadingMsg){
      try{await sock.sendMessage(jid,{text:`⏬ *${titulo}*\n\n${FRAMES_LOADING[i]}`,edit:loadingMsg.key});}catch{}
    }
  }

  // Aguarda download
  const resultado=await downloadPromise;

  // Frame 100%
  if(loadingMsg){
    try{await sock.sendMessage(jid,{text:`⏬ *${titulo}*\n\n${FRAMES_LOADING[5]}`,edit:loadingMsg.key});}catch{}
  }
  await new Promise(r=>setTimeout(r,400));

  return resultado;
}

// ═══════════════════════════════════════════════════════
// ✅ ENVIO COM SELO
// ═══════════════════════════════════════════════════════
async function enviarComSelo(sock,jid,texto,seloBot,q=null){
  const opts=q?{quoted:q}:{quoted:seloBot};
  try{
    if(botFotoBuffer) await sock.sendMessage(jid,{image:botFotoBuffer,caption:texto},opts);
    else if(ppBotUrl)  await sock.sendMessage(jid,{image:{url:ppBotUrl},caption:texto},opts);
    else               await sock.sendMessage(jid,{text:texto},opts);
  }catch{try{await sock.sendMessage(jid,{text:texto},{quoted:seloBot});}catch{}}
}
async function enviarTexto(sock,jid,texto,seloBot){try{await sock.sendMessage(jid,{text:texto},{quoted:seloBot});}catch{}}
async function reagir(sock,msg,emoji="⏳"){try{await sock.sendMessage(msg.key.remoteJid,{react:{text:emoji,key:msg.key}});}catch{}}

// ═══════════════════════════════════════════════════════
// ✅ NATIVE FLOW — Menu de Categorias
// ═══════════════════════════════════════════════════════
function buildSecoes(isDono){
  const principal={
    title:"🔵 MENUS",
    highlight_label:"L1TTL3B0Y|DEV",
    rows:[
      {header:"● MENU-PRINCIPAL",title:"_comandos principais e básicos._",id:"cat_principal"},
      {header:"● MENU-DOWNLOADS",title:"_download e upload de conteúdo._",id:"cat_downloads"},
      {header:"● MENU-FIGURINHAS",title:"_figurinhas e criações._",id:"cat_figurinhas"},
      {header:"● MENU-BRINCADEIRAS",title:"_jogos, diversão e mais._",id:"cat_brincadeiras"},
      {header:"● MENU-COINS",title:"_moedas, apostas e economia._",id:"cat_coins"},
      {header:"● MENU-ALTERADORES",title:"_IA, voz, áudio e imagem._",id:"cat_alteradores"},
      {header:"● MENU-LOGOS",title:"_criação de logos e artes._",id:"cat_logos"},
      {header:"● MENU+18",title:"_exclusivo para VIPs._",id:"cat_18"},
      {header:"● MENU-ADM",title:"_administração do grupo._",id:"cat_adm"},
    ]
  };
  if(isDono) principal.rows.push({header:"● MENU-DONO",title:"_apenas dono._",id:"cat_dono"});
  const extras={
    title:"🔵 EXTRAS",
    highlight_label:"L1TTL3B0Y|DEV",
    rows:[
      {header:"● CRIADOR",title:"_informações do criador._",id:"cat_criador"},
      {header:"● PING",title:"_status do bot._",id:"cat_ping"},
      {header:"● DONOS",title:"_lista de donos._",id:"cat_donos"},
      {header:"● ALUGAR BOT",title:"_planos de aluguel._",id:"cat_alugar_info"},
    ]
  };
  return[principal,extras];
}

async function enviarMenuPrincipal(sock,jid,msg,isDono,sender,isAdmin,seloBot){
  const P=CONFIG.PREFIXO;
  const agora=new Date();
  const hora=agora.toLocaleTimeString("pt-AO",{timeZone:"Africa/Luanda",hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const nomeUser=sender.split("@")[0].split(":")[0];
  const cargo=isDono?"Criador.":(isAdmin?"Administrador.":"Utilizador.");
  const secoes=buildSecoes(isDono);

  const textoMenu=
`┌─☆·˖✶˖·✦·˖✶˖·☆─┐
｜  🌀 *LORDE LÁ DJUM* 🌀
└─☆·˖✶˖·✦·˖✶˖·☆─┘

｜✦ 🔵 BOT: *${CONFIG.NOME_BOT}*
｜✦ 🔵 USUÁRIO: *${nomeUser}*
｜✦ 🔵 CARGO: *${cargo}*
｜✦ 🔵 PREFIXO: *${P}*
｜✦ 🔵 HORA: *${hora}*
｜✦ 💎 VIP: *${isVip(sender)?"✅":"❌"}*`;

  // ✅ Tenta Native Flow via @itsliaaa/baileys
  try{
    const botFotoSrc=botFotoBuffer?"./dados/bot_foto.jpg":(ppBotUrl||null);
    const payload={
      caption:textoMenu,
      footer:CONFIG.NOME_BOT,
      optionText:"≡ ABRIR MENU",
      optionTitle:"📂 Selecciona uma categoria",
      nativeFlow:[
        {text:"≡ Categorias",sections:secoes,icon:"default"},
        {text:"📢 Canal",url:CONFIG.CANAL_URL,useWebview:false},
      ]
    };
    if(botFotoSrc) payload.image={url:botFotoSrc};
    await sock.sendMessage(jid,payload,{quoted:seloBot});
    return;
  }catch(e){console.log("⚠️ NativeFlow menu:",e.message);}

  // Fallback: foto + listMessage
  try{
    if(botFotoBuffer) await sock.sendMessage(jid,{image:botFotoBuffer,caption:textoMenu},{quoted:seloBot});
    else if(ppBotUrl)  await sock.sendMessage(jid,{image:{url:ppBotUrl},caption:textoMenu},{quoted:seloBot});
    else               await sock.sendMessage(jid,{text:textoMenu},{quoted:seloBot});
    await new Promise(r=>setTimeout(r,600));
    await sock.sendMessage(jid,{
      listMessage:{title:`🌀 *${CONFIG.NOME_BOT}*`,description:"Selecciona uma categoria:",footerText:`© ${CONFIG.NOME_BOT}`,buttonText:"≡ MENU",listType:1,sections:secoes}
    });
    return;
  }catch(e){console.log("⚠️ listMessage:",e.message);}

  // Fallback texto
  try{await sock.sendMessage(jid,{text:textoMenu},{quoted:seloBot});}catch{}
  await new Promise(r=>setTimeout(r,400));
  const menu=
`┌─⊱ 『 📂 CATEGORIAS 』 ⊰─┐
│
◎ ─ *1* → 📋 Principal
◎ ─ *2* → ⬇️ Downloads
◎ ─ *3* → 🎭 Figurinhas
◎ ─ *4* → 🎮 Brincadeiras
◎ ─ *5* → 💰 Coins
◎ ─ *6* → 🎵 Alteradores
◎ ─ *7* → 🎨 Logos
◎ ─ *8* → 🛡️ ADM
◎ ─ *9* → 🔞 +18 (VIP)${isDono?"\n◎ ─ *0* → 👑 Dono":""}
│
└──────────────────────────────⊰`;
  await sock.sendMessage(jid,{text:menu},{quoted:seloBot});
  menuEsperandoResposta.set(`${jid}_${sender}`,{isDono,timestamp:Date.now()});
  setTimeout(()=>menuEsperandoResposta.delete(`${jid}_${sender}`),120000);
}

// ═══════════════════════════════════════════════════════
// ✅ SUBMENUS
// ═══════════════════════════════════════════════════════
function gerarSubmenu(catId,P){
  if(catId==="cat_principal") return(`┌─⊱ 『 📋 MENU PRINCIPAL 』 ⊰─┐\n│\n◎ ─ *${P}menu* → _abre o menu_\n◎ ─ *${P}ping* → _latência_\n◎ ─ *${P}stats* → _estatísticas_\n◎ ─ *${P}sobre* → _sobre o bot_\n◎ ─ *${P}id* → _teu ID_\n◎ ─ *${P}regras* → _regras_\n◎ ─ *${P}dono* → _info do criador_\n◎ ─ *${P}donos* → _lista de donos_\n◎ ─ *${P}alugar* → _alugar bot_ 💰\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);

  if(catId==="cat_downloads") return(`┌─⊱ 『 ⬇️ MENU DOWNLOADS 』 ⊰─┐\n│\n🎵 *YOUTUBE*\n◎ ─ *${P}play* [música] → _carousel 5 resultados_\n   _👈 escolhe Música/Vídeo/Documento_\n◎ ─ *${P}mp3* [música] → _MP3 directo_\n◎ ─ *${P}mp4* [nome/link] → _480p_\n◎ ─ *${P}mp4hd* [nome/link] → _720p_\n◎ ─ *${P}ytsearch* [pesquisa]\n│\n📱 *REDES SOCIAIS*\n◎ ─ *${P}tiktok* [link]\n◎ ─ *${P}ttsearch* [pesquisa] → _TikTok_\n◎ ─ *${P}tttrend* → _TikTok trending_\n◎ ─ *${P}ttuser* [@user]\n◎ ─ *${P}instagram* [link]\n◎ ─ *${P}twitter* [link]\n◎ ─ *${P}facebook* [link]\n◎ ─ *${P}kwai* [link]\n◎ ─ *${P}spotify* [música/link]\n◎ ─ *${P}soundcloud* [música/link]\n│\n🖼️ *IMAGENS & FICHEIROS*\n◎ ─ *${P}pinterest* [pesquisa]\n◎ ─ *${P}pinvideo* [url] → _Pinterest vídeo_\n◎ ─ *${P}mediafire* [link]\n◎ ─ *${P}apk* [nome]\n◎ ─ *${P}qr* [texto/url]\n◎ ─ *${P}tourl* → _mídia ➜ link_\n◎ ─ *${P}mostre* [pesquisa]\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);

  if(catId==="cat_figurinhas") return(`┌─⊱ 『 🎭 MENU FIGURINHAS 』 ⊰─┐\n│\n◎ ─ *${P}sticker* → _imagem/vídeo ➜ sticker_\n◎ ─ *${P}sf* → _sticker ➜ foto_\n◎ ─ *${P}brat* [texto] → _brat sticker_\n◎ ─ *${P}figurinha* [nº]\n◎ ─ *${P}figu* [tipo]\n   _emoji/anime/engracada/flork_\n   _coreana/bebe/animais/desenho_\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);

  if(catId==="cat_brincadeiras") return(`┌─⊱ 『 🎮 MENU BRINCADEIRAS 』 ⊰─┐\n│\n🎮 *JOGOS DE GRUPO*\n◎ ─ *${P}quiz* [tema]\n◎ ─ *${P}vof* → _verdadeiro/falso_\n◎ ─ *${P}completar* [tema]\n◎ ─ *${P}caca* [tema]\n◎ ─ *${P}guerra* → _forca ⚔️_\n◎ ─ *${P}stop* → _para o jogo_\n│\n🎲 *JOGOS SOLO*\n◎ ─ *${P}matematica* → _desafio maths_\n◎ ─ *${P}jokenpo* → _pedra/papel/tesoura_\n◎ ─ *${P}dado* [lados] → _lança dado_\n◎ ─ *${P}cara-coroa* → _moeda_\n◎ ─ *${P}adivinhar* → _adivinha número_\n◎ ─ *${P}velocidade* → _digita rápido_\n◎ ─ *${P}roleta* → _roleta russa_ 💀\n◎ ─ *${P}aki* [sim/nao/naosei] → _akinator_\n│\n😂 *DIVERSÃO*\n◎ ─ *${P}piada* / *${P}conselho*\n◎ ─ *${P}poema* / *${P}historia*\n◎ ─ *${P}perfil* @user\n◎ ─ *${P}cara* @user → _avalia cara_\n◎ ─ *${P}ship* @user1 @user2\n◎ ─ *${P}fofoca* → _fofoca do grupo_\n│\n🏆 *RANKING*\n◎ ─ *${P}rank* / *${P}toprank*\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);

  if(catId==="cat_coins") return(`┌─⊱ 『 💰 MENU COINS 』 ⊰─┐\n│\n◎ ─ *${P}moedas* → _ver saldo_\n◎ ─ *${P}diario* → _+100 moedas_ 🎁\n◎ ─ *${P}dar* @user [qtd]\n◎ ─ *${P}roubar* @user\n◎ ─ *${P}aposta* [qtd] → _cara ou coroa_\n◎ ─ *${P}topcoins* → _os mais ricos_\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);

  if(catId==="cat_alteradores") return(`┌─⊱ 『 🎵 MENU ALTERADORES 』 ⊰─┐\n│\n🔊 *VOZ & ÁUDIO*\n◎ ─ *${P}vz* [texto] → _texto em voz_\n◎ ─ *${P}shazam* → _reconhece música ⚡_\n◎ ─ *${P}busca* → _shazam sem animação_\n│\n📝 *TEXTO & TRANSCRIÇÃO*\n◎ ─ *${P}transcrever* → _áudio ➜ texto_\n◎ ─ *${P}resumiraudio*\n◎ ─ *${P}traduziraudio* [idioma]\n◎ ─ *${P}audioparaia*\n│\n🧠 *IA*\n◎ ─ *${P}ia* [pergunta]\n◎ ─ *${P}resumir* → _resume msg_\n◎ ─ *${P}traduzir* [idioma] [texto]\n│\n🖼️ *IMAGEM + IA*\n◎ ─ *${P}fotocopia* → _lê texto foto_\n◎ ─ *${P}fotoparaia* [pergunta]\n◎ ─ *${P}resumirfoto*\n◎ ─ *${P}traduzirfoto* [idioma]\n◎ ─ *${P}editar* [instrução]\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);

  if(catId==="cat_logos") return(`┌─⊱ 『 🎨 MENU LOGOS 』 ⊰─┐\n│\n◎ ─ *${P}meme* [texto1|texto2]\n◎ ─ *${P}logo* [texto]\n◎ ─ *${P}card* [texto]\n◎ ─ *${P}calc* [expressão]\n◎ ─ *${P}encurtar* [url]\n◎ ─ *${P}tempo* [cidade]\n◎ ─ *${P}horario* → _mundial_\n◎ ─ *${P}cotacao* → _Kwanza_\n◎ ─ *${P}ver* → _view-once_\n◎ ─ *${P}apagadas* → _msgs apagadas_\n◎ ─ *${P}placar* [jogo]\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);

  if(catId==="cat_18") return(`┌─⊱ 『 🔞 MENU +18 』 ⊰─┐\n│\n◎ ─ ⚠️ *EXCLUSIVO PARA VIPS*\n│\n🔥 *ADULTO*\n◎ ─ *${P}piada18* → _piada adulta_\n◎ ─ *${P}truth* → _verdade adulta_\n◎ ─ *${P}dare* → _desafio adulto_\n◎ ─ *${P}crush* → _jogo do crush_\n◎ ─ *${P}seduzir* @user\n◎ ─ *${P}beijo* @user\n◎ ─ *${P}abraco* @user\n◎ ─ *${P}tapa* @user\n◎ ─ *${P}flirt* @user\n◎ ─ *${P}casal* @user\n│\n◎ ─ 💰 Ser VIP: *${CONFIG.PREFIXO}alugar*\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);

  if(catId==="cat_adm"||catId==="adm") return(`┌─⊱ 『 🛡️ MENU ADM 』 ⊰─┐\n│\n👥 *MEMBROS*\n◎ ─ *${CONFIG.PREFIXO}banir* / *${CONFIG.PREFIXO}add* [nº]\n◎ ─ *${CONFIG.PREFIXO}addadmin* / *${CONFIG.PREFIXO}removeadmin*\n◎ ─ *${CONFIG.PREFIXO}silenciar* / *${CONFIG.PREFIXO}dessilenciar*\n◎ ─ *${CONFIG.PREFIXO}addvip* @user\n◎ ─ *${CONFIG.PREFIXO}removevip* @user\n◎ ─ *${CONFIG.PREFIXO}vips* → _lista vips_\n◎ ─ *${CONFIG.PREFIXO}addai* → _Meta AI_\n│\n📢 *COMUNICAÇÃO*\n◎ ─ *${CONFIG.PREFIXO}all* / *${CONFIG.PREFIXO}att* / *${CONFIG.PREFIXO}aviso*\n◎ ─ *${CONFIG.PREFIXO}link* / *${CONFIG.PREFIXO}sorteio*\n│\n⚙️ *CONFIGURAÇÕES*\n◎ ─ *${CONFIG.PREFIXO}fechar* / *${CONFIG.PREFIXO}abrir*\n◎ ─ *${CONFIG.PREFIXO}nomegrupo* / *${CONFIG.PREFIXO}descgrupo*\n◎ ─ *${CONFIG.PREFIXO}fotogrupo* / *${CONFIG.PREFIXO}apagar*\n◎ ─ *${CONFIG.PREFIXO}bloq* / *${CONFIG.PREFIXO}desbloq*\n◎ ─ *${CONFIG.PREFIXO}bot* off/on\n◎ ─ *${CONFIG.PREFIXO}anti-link* on/off\n◎ ─ *${CONFIG.PREFIXO}scanlink* / *${CONFIG.PREFIXO}verifica*\n│\n└──────────────────────────────⊰\n_⚡ Ban automático 5→0_`);

  if(catId==="cat_dono") return(`┌─⊱ 『 👑 MENU DONO 』 ⊰─┐\n│\n◎ ─ *${CONFIG.PREFIXO}ergue-se*\n◎ ─ *${CONFIG.PREFIXO}set* [senha]\n◎ ─ *${CONFIG.PREFIXO}out*\n◎ ─ *${CONFIG.PREFIXO}prefixo* [símbolo]\n◎ ─ *${CONFIG.PREFIXO}setfoto*\n◎ ─ *${CONFIG.PREFIXO}chaton*\n◎ ─ *${CONFIG.PREFIXO}sms* [nº] [msg]\n◎ ─ *${CONFIG.PREFIXO}gsms* [nº] [msg]\n│\n👑 *${CONFIG.DONO_NOME}*\n📞 *${CONFIG.DONO_NUM}*\n│\n└──────────────────────────────⊰`);

  return null;
}

async function enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono){
  // Inline handlers para funções extras
  if(catId==="cat_ping"){const ini=Date.now(); await sock.sendMessage(jid,{text:"⏳"}); await sock.sendMessage(jid,{text:`🏓 *PONG!*\n📶 *${Date.now()-ini}ms* | ⏱️ ${Math.floor(process.uptime()/60)} min | 💾 ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`},{quoted:seloBot}); return;}
  if(catId==="cat_donos"){await sock.sendMessage(jid,{text:`┌─⊱ 『 👑 DONOS 』 ⊰─┐\n│\n◎ ─ 👑 *${CONFIG.DONO_NOME}*\n   📞 ${CONFIG.DONO_NUM}\n│\n└──────────────────────────────⊰`},{quoted:seloBot}); return;}
  if(catId==="cat_alugar_info"||catId==="cat_alugar"){
    await sock.sendMessage(jid,{text:gerarTextoAlugar()},{quoted:seloBot}); return;
  }
  if(catId==="cat_criador"){
    let ppD=null; try{ppD=await sock.profilePictureUrl(CONFIG.DONO_JID,"image");}catch{}
    const tD=`┌─⊱ 『 👨‍💻 CRIADOR 』 ⊰─┐\n│\n◎ ─ 🏷️ *${CONFIG.DONO_NOME}*\n◎ ─ 📞 *${CONFIG.DONO_NUM}*\n◎ ─ 🤖 *${CONFIG.NOME_BOT}*\n│\n└──────────────────────────────⊰`;
    if(ppD) await sock.sendMessage(jid,{image:{url:ppD},caption:tD},{quoted:seloBot});
    else await sock.sendMessage(jid,{text:tD},{quoted:seloBot});
    return;
  }
  const texto=gerarSubmenu(catId,CONFIG.PREFIXO);
  if(!texto) return;
  await reagir(sock,{key:{remoteJid:jid,...msg?.key}},msg?.key?"✅":"⚡").catch(()=>{});
  await new Promise(r=>setTimeout(r,300));
  if(botFotoBuffer) await sock.sendMessage(jid,{image:botFotoBuffer,caption:texto},{quoted:seloBot});
  else if(ppBotUrl) await sock.sendMessage(jid,{image:{url:ppBotUrl},caption:texto},{quoted:seloBot});
  else await sock.sendMessage(jid,{text:texto},{quoted:seloBot});
}

// ═══════════════════════════════════════════════════════
// ✅ TEXTO ALUGAR
// ═══════════════════════════════════════════════════════
function gerarTextoAlugar(){
  return `╭━━⪩ *ALUGUEL BOT* ⪨━━
▢
▢ • *preços disponíveis 💰*
▢ • Bot rápido e estável 24h
▢ • Comandos exclusivos
▢ • Downloads sem travar
▢ • IA com GPT e mais
▢ • Anti-link, Anti-spam
▢ • Sistema de administração
▢ • Suporte prioritário
▢
╰━━─「🤖」─━━

╭━━⪩ *PLANOS* ⪨━━
▢
▢ 🎁 *Grátis* - 3 dias
▢   KZ 0,00 - Teste grátis
▢
▢ 🎈 *Lite* - 5 dias
▢   KZ 500 - Básico para testes
▢
▢ 🍀 *Basic* - 1 semana
▢   KZ 700 - Grupos pequenos
▢
▢ 🪙 *Gold* - 2 semanas
▢   KZ 1200 - Intermediário
▢
▢ 💎 *Diamond* - 1 mês
▢   KZ 2000 - Suporte prioritário
▢
▢ 🚀 *Ultra* - 3 meses
▢   KZ 3500 - Plano completo
▢
╰━━─「💰」─━━

╭━━⪩ *VANTAGENS* ⪨━━
▢
▢ ✅ Rodando 24 horas
▢ ✅ Atualizações automáticas
▢ ✅ Suporte via WhatsApp
▢ ✅ Anti-ban e Anti-flood
▢ ✅ Personalização completa
▢
╰━━─「🔥」─━━

╭━━⪩ *CONTATO* ⪨━━
▢
▢ 📲  +244926612801
▢ Suporte 24h
▢
╰━━─「📱」─━━`;
}

// ═══════════════════════════════════════════════════════
// ✅ FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════
function runCmd(cmd){
  return new Promise((resolve,reject)=>{
    exec(cmd,{timeout:180000,maxBuffer:150*1024*1024,env:{...process.env,TMPDIR:process.env.TMPDIR}},(err,stdout,stderr)=>{
      if(err) reject(new Error(stderr||err.message));
      else resolve(stdout.trim());
    });
  });
}
function encontrarArquivo(pasta,prefixo){try{const arqs=fs.readdirSync(pasta).filter(f=>f.startsWith(prefixo)&&!f.endsWith(".part")&&!f.endsWith(".ytdl")); if(!arqs.length) return null; const p=path.join(pasta,arqs[0]); return fs.statSync(p).size>3000?p:null;}catch{return null;}}

async function chatIA(prompt,sistema="És um assistente simpático que responde sempre em português de Angola. Sê direto e objetivo."){
  for(const modelo of ["llama-3.1-8b-instant","mixtral-8x7b-32768"]){
    try{const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:modelo,messages:[{role:"system",content:sistema},{role:"user",content:prompt}],max_tokens:800,temperature:0.7},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:20000,httpsAgent}); const resp=data.choices?.[0]?.message?.content?.trim(); if(resp&&resp.length>2) return resp;}catch(e){console.log(`❌ Groq ${modelo}:`,e.message);}
  }
  try{const{data}=await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(sistema)}&model=openai-large`,{timeout:25000,responseType:"text",httpsAgent}); const resp=typeof data==="string"?data.trim():String(data).trim(); if(resp.length>5) return resp;}catch{}
  return "❌ IA temporariamente indisponível.";
}

async function transcreverComGroq(buffer){
  const formData=new FormData(); formData.append("file",buffer,{filename:"audio.ogg",contentType:"audio/ogg"}); formData.append("model","whisper-large-v3"); formData.append("response_format","json");
  const{data}=await axios.post("https://api.groq.com/openai/v1/audio/transcriptions",formData,{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,...formData.getHeaders()},timeout:60000,httpsAgent});
  const texto=data?.text?.trim(); if(!texto) throw new Error("Áudio não audível"); return texto;
}

async function textoParaFala(texto,voz=CONFIG.VOZ_TTS){
  const tempId=Date.now(),tempTxt=`./downloads/tts_in_${tempId}.txt`,tempOut=`./downloads/tts_out_${tempId}.mp3`;
  try{const textoLimpo=texto.replace(/[*_~`#]/g,"").replace(/\n+/g,". ").slice(0,1800); if(!textoLimpo.trim()) throw new Error("Texto vazio"); fs.writeFileSync(tempTxt,textoLimpo,"utf8"); await runCmd(`edge-tts --voice "${voz}" --file "${tempTxt}" --write-media "${tempOut}"`); if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<500) throw new Error("TTS inválido"); return tempOut;}finally{try{fs.removeSync(tempTxt);}catch{}}
}

async function reconhecerMusica(buf){
  const formData=new FormData(); formData.append("file",buf,{filename:"audio.ogg",contentType:"audio/ogg"}); formData.append("api_token","test"); formData.append("return","apple_music,spotify");
  const{data}=await axios.post("https://api.audd.io/",formData,{headers:{...formData.getHeaders()},timeout:30000,httpsAgent}); return data;
}

async function analisarImagem(imagemBuffer,instrucao){
  let mimeType="image/jpeg"; if(imagemBuffer[0]===0x89&&imagemBuffer[1]===0x50) mimeType="image/png";
  const base64=imagemBuffer.toString("base64");
  for(const modelo of ["meta-llama/llama-4-scout-17b-16e-instruct","meta-llama/llama-4-maverick-17b-128e-instruct"]){
    try{const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:modelo,messages:[{role:"user",content:[{type:"image_url",image_url:{url:`data:${mimeType};base64,${base64}`}},{type:"text",text:instrucao}]}],max_tokens:1000,temperature:0.3},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:30000,httpsAgent}); const resp=data.choices?.[0]?.message?.content?.trim(); if(resp&&resp.length>2) return resp;}catch(e){console.log(`❌ ${modelo}:`,e.message);}
  }
  throw new Error("Modelos de visão falharam.");
}

async function buscarImagemInternet(query){try{const{data}=await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,{timeout:8000,httpsAgent}); if(data?.originalimage?.source) return data.originalimage.source; if(data?.thumbnail?.source) return data.thumbnail.source;}catch{} try{const{data}=await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,{timeout:8000,httpsAgent}); if(data?.originalimage?.source) return data.originalimage.source; if(data?.thumbnail?.source) return data.thumbnail.source;}catch{} return null;}

async function uploadParaTelegraph(buffer){const formData=new FormData(); let mimeType="image/jpeg",ext="jpg"; if(buffer[0]===0x89&&buffer[1]===0x50){mimeType="image/png";ext="png";} formData.append("file",buffer,{filename:`img.${ext}`,contentType:mimeType}); const{data}=await axios.post("https://telegra.ph/upload",formData,{headers:{...formData.getHeaders()},timeout:30000,httpsAgent}); if(data?.[0]?.src) return `https://telegra.ph${data[0].src}`; throw new Error("Telegraph falhou");}
async function uploadParaCatbox(buffer,nome,mimeType){const formData=new FormData(); formData.append("reqtype","fileupload"); formData.append("fileToUpload",buffer,{filename:nome,contentType:mimeType}); const{data}=await axios.post("https://catbox.moe/user/api.php",formData,{headers:{...formData.getHeaders()},timeout:180000,httpsAgent,maxContentLength:Infinity,maxBodyLength:Infinity}); const url=String(data).trim(); if(!url.startsWith("http")) throw new Error("Catbox falhou"); return url;}

// ═══════════════════════════════════════════════════════
// ✅ SCRAPER HUB API
// ═══════════════════════════════════════════════════════
async function scraperHub(endpoint){
  const{data}=await axios.get(`${CONFIG.SCRAPER_HUB_URL}${endpoint}`,{timeout:30000,httpsAgent});
  return data;
}

// TikTok via Scraper Hub
async function scraperTikTokVideo(url){
  try{
    const data=await scraperHub(`/api/tiktok/video?url=${encodeURIComponent(url)}`);
    if(data?.url||data?.video) return{url:data.url||data.video,title:data.title||"TikTok"};
  }catch{}
  // Fallback tikwm
  const{data}=await axios.post("https://www.tikwm.com/api/",`url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`,{headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Mozilla/5.0"},timeout:30000,httpsAgent});
  const d=data?.data; if(!d) throw new Error("Sem dados"); return{url:d.hdplay||d.play,title:d.title||"TikTok"};
}

async function scraperTikTokSearch(query,limit=10){
  const data=await scraperHub(`/api/tiktok/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return data?.resultados||data?.results||data?.videos||[];
}

async function scraperTikTokTrending(region="AO",limit=10){
  const data=await scraperHub(`/api/tiktok/trending?region=${region}&limit=${limit}`);
  return data?.resultados||data?.results||data?.videos||[];
}

async function scraperTikTokUser(username){
  const data=await scraperHub(`/api/tiktok/user?username=${encodeURIComponent(username)}`);
  return data?.resultado||data?.result||data?.user||null;
}

// Pinterest via Scraper Hub
async function scraperPinterestSearch(query,limit=10,type="image"){
  try{
    const data=await scraperHub(`/api/pinterest/search?q=${encodeURIComponent(query)}&limit=${limit}&type=${type}`);
    return data?.resultados||data?.results||data?.pins||[];
  }catch{
    // Fallback
    const{data}=await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`,{timeout:15000,httpsAgent});
    return data?.data||[];
  }
}

async function scraperPinterestPin(url){
  try{
    const data=await scraperHub(`/api/pinterest/pin?url=${encodeURIComponent(url)}`);
    return data?.resultado||data?.result||data?.pin||null;
  }catch{
    const{data}=await axios.get(`https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(url)}`,{timeout:15000,httpsAgent});
    return data?.data||null;
  }
}

// YouTube via Scraper Hub
async function scraperYouTubeSearch(query,limit=5){
  try{
    const data=await scraperHub(`/api/youtube/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return data?.resultados||data?.results||data?.videos||[];
  }catch{return[];}
}

async function downloadViaScraperHub(url,formato){
  const resp=await axios.post(`${CONFIG.SCRAPER_HUB_URL}/api/youtube/download`,{url,formato},{timeout:180000,httpsAgent});
  if(!resp.data?.filename) throw new Error("Scraper Hub: sem filename");
  const filename=resp.data.filename;
  const fileResp=await axios.get(`${CONFIG.SCRAPER_HUB_URL}/api/youtube/file/${filename}`,{responseType:"arraybuffer",timeout:180000,httpsAgent});
  return Buffer.from(fileResp.data);
}

// ═══════════════════════════════════════════════════════
// ✅ DOWNLOADS LOCAIS (yt-dlp como fallback)
// ═══════════════════════════════════════════════════════
async function downloadMusica(entrada,altaQualidade=false){
  // Tenta Scraper Hub primeiro
  try{
    const buf=await downloadViaScraperHub(entrada,"mp3");
    const p=path.join("./downloads",`mus_hub_${Date.now()}.mp3`);
    fs.writeFileSync(p,buf);
    return p;
  }catch{}

  // Fallback yt-dlp
  const isUrl=entrada.startsWith("http"),nomeBase=`mus_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`,quality=altaQualidade?"0":"5",UA="Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Chrome/112.0 Mobile Safari/537.36";
  const base=`yt-dlp --no-check-certificate -x --audio-format mp3 --audio-quality ${quality} --no-playlist --no-warnings --force-ipv4 --geo-bypass --extractor-args "youtube:player_client=android,ios,tv_embedded" --add-header "User-Agent:${UA}" -o "${saida}"`;
  const fontes=isUrl?[entrada]:[`scsearch1:${entrada}`,`ytsearch1:${entrada}`,`ytsearch1:${entrada.split(" ").slice(0,4).join(" ")} audio`];
  for(const fonte of fontes){try{await runCmd(`${base} "${fonte}"`); const arq=encontrarArquivo("./downloads",nomeBase); if(arq&&fs.statSync(arq).size>3000) return arq;}catch{}}
  return null;
}

async function downloadVideo(entrada,height=480){
  // Tenta Scraper Hub
  try{
    const buf=await downloadViaScraperHub(entrada,"mp4");
    const p=path.join("./downloads",`vid_hub_${Date.now()}.mp4`);
    fs.writeFileSync(p,buf);
    return p;
  }catch{}

  // Fallback yt-dlp
  const isUrl=entrada.startsWith("http"),nomeBase=`vid_${Date.now()}`,saidaAny=`./downloads/${nomeBase}.%(ext)s`,pesquisa=isUrl?entrada:`ytsearch1:${entrada}`;
  const UA_MOB="Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Chrome/112.0 Mobile Safari/537.36";
  const tentarSalvar=(arq)=>{if(!arq) return null; try{const tam=fs.statSync(arq).size; if(tam>10000&&tam<100*1024*1024) return arq; if(fs.existsSync(arq)) fs.removeSync(arq);}catch{} return null;};
  const tentativas=[["android",`best[height<=${height}][ext=mp4]`,UA_MOB],["ios",`best[height<=${height}][ext=mp4]`,UA_MOB],["android","18",UA_MOB],["ios","18",UA_MOB],["android","worst",UA_MOB]];
  for(const[player,fmt,ua] of tentativas){try{await runCmd(`yt-dlp --no-check-certificate --no-playlist --no-warnings --force-ipv4 --geo-bypass --extractor-args "youtube:player_client=${player}" --add-header "User-Agent:${ua}" -f "${fmt}" -o "${saidaAny}" "${pesquisa}"`); const r=tentarSalvar(encontrarArquivo("./downloads",nomeBase)); if(r) return r;}catch{}}
  return null;
}

async function downloadVideoHD(entrada,height=720){
  const isUrl=entrada.startsWith("http"),pesquisa=isUrl?entrada:`ytsearch1:${entrada}`,nomeBase=`vidhd_${Date.now()}`,saida=`./downloads/${nomeBase}.mp4`,UA="Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Chrome/112.0 Mobile Safari/537.36",LIMITE=90*1024*1024,MAX_SIZE="90M",fmt=`bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/bestvideo+bestaudio/best`;
  const tentarSalvar=(arq)=>{if(!arq) return null; try{const tam=fs.statSync(arq).size; if(tam>10000&&tam<=LIMITE) return arq; if(fs.existsSync(arq)) fs.removeSync(arq);}catch{} return null;};
  for(const player of["android","ios","tv_embedded","web","default"]){try{await runCmd(`yt-dlp --no-check-certificate --no-playlist --no-warnings --force-ipv4 --geo-bypass --max-filesize ${MAX_SIZE} --extractor-args "youtube:player_client=${player}" --add-header "User-Agent:${UA}" -f "${fmt}" --merge-output-format mp4 -o "${saida}" "${pesquisa}"`); const r=tentarSalvar(saida)||tentarSalvar(encontrarArquivo("./downloads",nomeBase)); if(r) return{filePath:r,quality:`${height}p`,sizeMB:(fs.statSync(r).size/1024/1024).toFixed(1)};}catch{}}
  const r=await downloadVideo(entrada); if(r) return{filePath:r,quality:"480p",sizeMB:(fs.statSync(r).size/1024/1024).toFixed(1)};
  throw new Error("Não consegui baixar.");
}

async function dlRedeSocial(url){const nomeBase=`dl_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`; try{await runCmd(`yt-dlp --no-check-certificate --no-playlist -f "best[ext=mp4]/best" -o "${saida}" "${url}"`); const arq=encontrarArquivo("./downloads",nomeBase); if(arq) return{filePath:arq};}catch{} throw new Error("Não consegui baixar.");}
async function dlSpotify(query){const arq=await downloadMusica(query,true); if(arq) return{filePath:arq}; throw new Error("Spotify: não encontrei.");}
async function dlSoundcloud(query){const isUrl=query.startsWith("http"),nomeBase=`sc_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`,fonte=isUrl?query:`scsearch1:${query}`; try{await runCmd(`yt-dlp --no-check-certificate -x --audio-format mp3 --audio-quality 0 --no-playlist --no-warnings -o "${saida}" "${fonte}"`); const arq=encontrarArquivo("./downloads",nomeBase); if(arq) return{filePath:arq};}catch{} const arqFb=await downloadMusica(query,true); if(arqFb) return{filePath:arqFb}; throw new Error("SoundCloud: não encontrei.");}
async function dlMediafire(url){try{const{data}=await axios.get(url,{headers:{"User-Agent":"Mozilla/5.0"},timeout:15000,httpsAgent}); const match=data.match(/href="(https:\/\/download\d+\.mediafire\.com\/[^"]+)"/); if(match) return{url:match[1],title:decodeURIComponent(match[1].split("/").pop().split("?")[0])||"file"}; throw new Error("Link não encontrado.");}catch(e){throw new Error("MediaFire: "+e.message);}}
async function dlApk(query){try{const{data}=await axios.get(`https://liteapks.com/?s=${encodeURIComponent(query)}`,{headers:{"User-Agent":"Mozilla/5.0"},timeout:15000,httpsAgent}); const regex=/href="(https:\/\/liteapks\.com\/[a-z0-9-]+\.html)"/g; let m; const results=[]; while((m=regex.exec(data))!==null&&results.length<3){const u=m[1]; if(!u.includes("page/")&&!results.find(r=>r===u)) results.push(u);} if(!results.length) throw new Error("Não encontrei."); return{url:results[0],title:results[0].split("/").pop().replace(".html","").replace(/-/g," ")};}catch(e){throw new Error("APK: "+e.message);}}

// ═══════════════════════════════════════════════════════
// ✅ ENVIAR ÁUDIO/VÍDEO (com catbox fallback)
// ═══════════════════════════════════════════════════════
async function enviarAudio(sock,jid,filePath,msgCitada){
  if(!fs.existsSync(filePath)) throw new Error("Ficheiro não encontrado");
  const oggPath=path.join("./downloads",`ogg_${Date.now()}.ogg`);
  let converteu=false;
  try{await new Promise((res,rej)=>exec(`ffmpeg -i "${filePath}" -c:a libopus -b:a 64k -ar 24000 -ac 1 -vn "${oggPath}" -y -loglevel error`,{timeout:60000,env:{...process.env}},(err)=>err?rej(err):res())); if(fs.existsSync(oggPath)&&fs.statSync(oggPath).size>500) converteu=true;}catch{}
  const usePath=converteu?oggPath:filePath;
  const mime=converteu?"audio/ogg; codecs=opus":"audio/mpeg";
  const buf=fs.readFileSync(usePath);
  const cleanup=()=>{if(converteu&&fs.existsSync(oggPath)) try{fs.removeSync(oggPath);}catch{}};
  try{await sock.sendMessage(jid,{audio:buf,mimetype:mime,ptt:false},msgCitada?{quoted:msgCitada}:{}); cleanup(); return;}catch(e){console.log("⚠️ áudio buffer:",e.message);}
  try{const url=await uploadParaCatbox(buf,path.basename(usePath),mime); await sock.sendMessage(jid,{audio:{url},mimetype:mime,ptt:false},msgCitada?{quoted:msgCitada}:{}); cleanup(); return;}catch(e){console.log("⚠️ catbox:",e.message);}
  try{await sock.sendMessage(jid,{document:fs.readFileSync(filePath),mimetype:"audio/mpeg",fileName:path.basename(filePath)},msgCitada?{quoted:msgCitada}:{}); cleanup(); return;}catch(e){cleanup(); throw e;}
}

async function enviarVideo(sock,jid,filePath,caption,mentions,msgCitada){
  if(!fs.existsSync(filePath)) throw new Error("Vídeo não encontrado");
  const buf=fs.readFileSync(filePath);
  try{await sock.sendMessage(jid,{video:buf,caption,mentions},msgCitada?{quoted:msgCitada}:{}); return;}catch(e){console.log("⚠️ vídeo buffer:",e.message);}
  try{const url=await uploadParaCatbox(buf,path.basename(filePath),"video/mp4"); await sock.sendMessage(jid,{video:{url},caption,mentions},msgCitada?{quoted:msgCitada}:{}); return;}catch(e){console.log("⚠️ catbox vídeo:",e.message);}
  try{await sock.sendMessage(jid,{document:buf,mimetype:"video/mp4",fileName:path.basename(filePath),caption},msgCitada?{quoted:msgCitada}:{}); return;}catch(e){throw e;}
}

// ═══════════════════════════════════════════════════════
// ✅ STICKERS
// ═══════════════════════════════════════════════════════
async function criarSticker(imagemBuffer,isAnimated=false){const tempId=Date.now(),tempIn=`./downloads/stk_in_${tempId}.tmp`,tempOut=`./downloads/stk_out_${tempId}.webp`; try{fs.writeFileSync(tempIn,imagemBuffer); const cmd=isAnimated?`ffmpeg -i "${tempIn}" -t 5 -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=12" -c:v libwebp -quality 70 -preset default -loop 0 -an -vsync 0 "${tempOut}" -y -loglevel error`:`ffmpeg -i "${tempIn}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -c:v libwebp -quality 90 "${tempOut}" -y -loglevel error`; await new Promise((resolve,reject)=>{exec(cmd,{timeout:30000,env:{...process.env}},(err)=>err?reject(err):resolve());}); if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<100) throw new Error("WebP inválido"); return fs.readFileSync(tempOut);}finally{try{fs.removeSync(tempIn);}catch{} try{fs.removeSync(tempOut);}catch{}}}
async function stickerParaFoto(buf,isAnimated=false){const tempId=Date.now(),tempIn=`./downloads/sf_in_${tempId}.webp`,tempOut=`./downloads/sf_out_${tempId}.${isAnimated?"mp4":"jpg"}`; try{fs.writeFileSync(tempIn,buf); const cmd=isAnimated?`ffmpeg -i "${tempIn}" -c:v libx264 -pix_fmt yuv420p -movflags faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${tempOut}" -y -loglevel error`:`ffmpeg -i "${tempIn}" -frames:v 1 -q:v 2 "${tempOut}" -y -loglevel error`; await new Promise((resolve,reject)=>{exec(cmd,{timeout:30000,env:{...process.env}},(err)=>err?reject(err):resolve());}); if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<100) throw new Error("Conversão inválida"); return{buffer:fs.readFileSync(tempOut),isVideo:isAnimated};}catch(e){return{buffer:buf,isVideo:false,isWebP:true};}finally{try{fs.removeSync(tempIn);}catch{} try{fs.removeSync(tempOut);}catch{}}}

// ═══════════════════════════════════════════════════════
// ✅ DOWNLOAD DE MÍDIA DE MENSAGEM
// ═══════════════════════════════════════════════════════
async function downloadImagemDaMensagem(msg){try{if(msg.message?.imageMessage) return await downloadMediaMessage(msg,"buffer",{});}catch{} const ctx=msg.message?.extendedTextMessage?.contextInfo; if(!ctx?.quotedMessage) return null; if(ctx.quotedMessage.imageMessage){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage}; return await downloadMediaMessage(qm,"buffer",{});}catch{}} return null;}
async function downloadAudioDaMensagem(msg){const tipos=["audioMessage","pttMessage"]; for(const tipo of tipos){if(msg.message?.[tipo]){try{return{buffer:await downloadMediaMessage(msg,"buffer",{})};}catch{}}} const ctx=msg.message?.extendedTextMessage?.contextInfo; if(!ctx?.quotedMessage) return null; for(const tipo of tipos){if(ctx.quotedMessage[tipo]){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage}; return{buffer:await downloadMediaMessage(qm,"buffer",{})};}catch{}}} return null;}
async function downloadQualquerMidia(msg){const m=msg.message; if(!m) return null; const tipos=[{chave:"imageMessage",mime:"image/jpeg",ext:"jpg"},{chave:"videoMessage",mime:"video/mp4",ext:"mp4"},{chave:"audioMessage",mime:"audio/ogg",ext:"ogg"},{chave:"pttMessage",mime:"audio/ogg",ext:"ogg"},{chave:"documentMessage",mime:"application/octet-stream",ext:"bin"},{chave:"stickerMessage",mime:"image/webp",ext:"webp"}]; for(const t of tipos){if(m[t.chave]){try{const buf=await downloadMediaMessage(msg,"buffer",{}); const mime=m[t.chave].mimetype||t.mime; const ext=mime.split("/")[1]?.split(";")[0]||t.ext; const nome=m[t.chave].fileName||`midia_${Date.now()}.${ext}`; return{buffer:buf,mime,nome};}catch{}}} const ctx=m.extendedTextMessage?.contextInfo; if(ctx?.quotedMessage){for(const t of tipos){if(ctx.quotedMessage[t.chave]){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage}; const buf=await downloadMediaMessage(qm,"buffer",{}); const mime=ctx.quotedMessage[t.chave].mimetype||t.mime; const ext=mime.split("/")[1]?.split(";")[0]||t.ext; const nome=ctx.quotedMessage[t.chave].fileName||`midia_${Date.now()}.${ext}`; return{buffer:buf,mime,nome};}catch{}}}} return null;}

// ═══════════════════════════════════════════════════════
// ✅ BAN COM CONTAGEM
// ═══════════════════════════════════════════════════════
async function banirComContagem(sock,jid,sender,msgKey,motivo="Infração das regras"){
  const banKey=`${jid}_${sender}`; if(banEmCurso.has(banKey)) return; banEmCurso.add(banKey);
  try{
    try{await sock.sendMessage(jid,{delete:msgKey});}catch{}
    for(let i=5;i>=0;i--){try{await sock.sendMessage(jid,{text:`⏳ *${i}...*`});}catch{} await new Promise(r=>setTimeout(r,900));}
    try{await sock.sendMessage(jid,{text:`BANNNN❌️\n\n🚨 @${sender.split("@")[0]} foi *BANIDO!*\n_Motivo: ${motivo}_`,mentions:[sender]});}catch{}
    await new Promise(r=>setTimeout(r,500));
    try{await sock.groupParticipantsUpdate(jid,[sender],"remove");}catch{}
    try{await sock.sendMessage(jid,{text:`🔨 @${sender.split("@")[0]} *REMOVIDO!*\n_BAZAAA..._ 😂💨`,mentions:[sender]});}catch{}
  }finally{setTimeout(()=>banEmCurso.delete(banKey),5000);}
}

// ═══════════════════════════════════════════════════════
// ✅ JOGOS — BANCOS
// ═══════════════════════════════════════════════════════
const VOF_BANCO=[{p:"O sol é uma estrela.",r:"verdadeiro"},{p:"A baleia é um peixe.",r:"falso"},{p:"O coração tem 4 câmaras.",r:"verdadeiro"},{p:"Angola tem 18 províncias.",r:"verdadeiro"},{p:"A água ferve a 50°C.",r:"falso"},{p:"O elefante é o maior animal terrestre.",r:"verdadeiro"},{p:"A Lua tem atmosfera.",r:"falso"},{p:"O tubarão é um mamífero.",r:"falso"},{p:"Luanda é capital de Angola.",r:"verdadeiro"},{p:"O diamante é o mineral mais duro.",r:"verdadeiro"},{p:"O Brasil tem mais de 200 milhões de habitantes.",r:"verdadeiro"},{p:"O ouro é um metal.",r:"verdadeiro"},{p:"A África é o maior continente do mundo.",r:"falso"},{p:"O golfinho é um mamífero.",r:"verdadeiro"},{p:"A Lua é maior que a Terra.",r:"falso"}];
const QUIZ_BANCO=[{p:"Capital de Angola?",r:"luanda"},{p:"Maior planeta do sistema solar?",r:"jupiter"},{p:"Moeda de Angola?",r:"kwanza"},{p:"Quem pintou a Mona Lisa?",r:"leonardo da vinci"},{p:"Quantos continentes existem?",r:"7"},{p:"Maior oceano do mundo?",r:"pacifico"},{p:"Capital do Brasil?",r:"brasilia"},{p:"País mais populoso do mundo?",r:"china"},{p:"Quantos lados tem um hexágono?",r:"6"},{p:"Menor país do mundo?",r:"vaticano"},{p:"Em que ano Angola se tornou independente?",r:"1975"},{p:"Quantos ossos tem o corpo humano adulto?",r:"206"},{p:"Capital de Portugal?",r:"lisboa"},{p:"Maior deserto do mundo?",r:"saara"},{p:"Quantos planetas tem o sistema solar?",r:"8"},{p:"Animal mais rápido do mundo?",r:"guepardo"}];
const COMPLETAR_BANCO=[{i:"ANG_LA",c:"angola",d:"País da África Austral"},{i:"LU_NDA",c:"luanda",d:"Capital de Angola"},{i:"FU_BOL",c:"futebol",d:"Desporto popular"},{i:"KW_NZA",c:"kwanza",d:"Moeda de Angola"},{i:"BR_SIL",c:"brasil",d:"Maior país da América do Sul"},{i:"AFR_CA",c:"africa",d:"Continente"},{i:"D_ANTE",c:"diamante",d:"Pedra preciosa"},{i:"EL_FAN_E",c:"elefante",d:"Maior animal terrestre"}];
const CACA_BANCO=[{palavra:"ANGOLA",dica:"País da África Austral"},{palavra:"LUANDA",dica:"Capital de Angola"},{palavra:"FUTEBOL",dica:"Desporto popular"},{palavra:"AFRICA",dica:"Continente"},{palavra:"KWANZA",dica:"Moeda de Angola"},{palavra:"BRASIL",dica:"América do Sul"},{palavra:"DIAMANTE",dica:"Pedra preciosa"},{palavra:"ELEFANTE",dica:"Maior animal terrestre"},{palavra:"OCEANO",dica:"Grande massa de água"},{palavra:"PYTHON",dica:"Linguagem de programação"}];
const GUERRA_BANCO=[{palavra:"ANGOLA",dica:"País da África Austral"},{palavra:"LUANDA",dica:"Capital de Angola"},{palavra:"AFRICA",dica:"Continente"},{palavra:"FUTEBOL",dica:"Desporto favorito"},{palavra:"DIAMANTE",dica:"Pedra preciosa"},{palavra:"ELEFANTE",dica:"Maior animal terrestre"},{palavra:"MUSICA",dica:"Arte dos sons"},{palavra:"ESTRELA",dica:"Corpo celeste"},{palavra:"OCEANO",dica:"Grande massa de água"},{palavra:"BANANA",dica:"Fruta tropical"}];
const PERFIS_ELOGIO=["🌟 Um ser extraordinário! Líder nato, coração de ouro!","👑 O verdadeiro rei! Inteligente, divertido!","🔥 Pura energia! Um talento raro!","💎 Raro como diamante! Leal e honesto!","🚀 Destinado ao sucesso! Mente brilhante!"];
const PERFIS_ZOADA=["😂 Deus criou esta pessoa e perguntou: 'O que fiz?!' 💀","🤣 A face assusta os espelhos! 💀","😭 Esta pessoa chegou e o WiFi ficou lento! 🚶🏿‍♂️","💀 Antes da câmara frontal! 📸😂","🤡 Acorda às 6h, olha pro espelho e volta a dormir! 😂"];
const PALAVRAS_VELOCIDADE=["programacao","desenvolvimento","inteligencia","javascript","comunicacao","angola","mozambique","portugal","brasil","futebol","diamante","musica","computador","telefone","internet","facebook","instagram","whatsapp","downloads","configuracao","administracao","tecnologia","engenharia","medicina","arquitetura"];
const MATEMATICA_BANCO=()=>{const a=Math.floor(Math.random()*50)+1,b=Math.floor(Math.random()*50)+1,ops=["+","-","*"]; const op=ops[Math.floor(Math.random()*ops.length)]; let r; if(op==="+") r=a+b; else if(op==="-") r=a-b; else r=a*b; return{pergunta:`*${a} ${op} ${b}*`,resposta:String(r)};};
const VERDADES_18=["Qual foi tua maior saia justa?","Já fizeste algo que nunca contaste a ninguém?","Qual foi o maior erro amoroso da tua vida?","Tens crush em alguém aqui no grupo?","Já mandaste msg para a pessoa errada?","Que habilidade secreta tens?","Já finges não ler uma mensagem?","Qual foi o momento mais embaraçoso da tua vida?","Alguma vez choraste por causa de alguém?","Qual foi a maior mentira que já disseste?"];
const DESAFIOS_18=["Canta uma música a cappella em voz alta","Faz 20 flexões agora","Conta uma piada para o grupo","Manda uma selfie feia","Escreve um poema sobre o dono do bot","Dança por 30 segundos","Muda o teu nome no grupo por 1 hora","Escreve um elogio a cada membro online","Conta um segredo que nunca contaste","Diz 10 palavras em inglês sem parar"];

function mostrarGuerraEstado(jogo){const vidas=["❤️❤️❤️❤️❤️❤️","🧡❤️❤️❤️❤️❤️","🧡🧡❤️❤️❤️❤️","🧡🧡🧡❤️❤️❤️","🧡🧡🧡🧡❤️❤️","🧡🧡🧡🧡🧡❤️","💀💀💀💀💀💀"]; const pM=jogo.palavra.split("").map(l=>jogo.letrasAcertadas.includes(l)?l:"_").join(" "); const eS=jogo.letrasErradas.length>0?jogo.letrasErradas.join(", "):"Nenhuma"; return `⚔️ *FORCA*\n✦ ─────────── ✦\n🔤 *${pM}*\n💡 _${jogo.dica}_\n\n${vidas[Math.min(jogo.letrasErradas.length,6)]}\n❌ Erradas: *${eS}*\n\n_Digita uma letra!_`;}
function gerarGrade(palavra){const tam=8,letras="ABCDEFGHIJKLMNOPQRSTUVWXYZ"; const grade=Array(tam).fill(null).map(()=>Array(tam).fill(null).map(()=>letras[Math.floor(Math.random()*26)])); const linha=Math.floor(Math.random()*tam),col=Math.floor(Math.random()*(tam-palavra.length)); for(let i=0;i<palavra.length;i++) grade[linha][col+i]=palavra[i]; return grade.map(r=>r.join(" ")).join("\n");}

async function gerarJogoIA(tipo,categoria=null,usadas=[]){
  const sistema="És um gerador de jogos educativos. Responde SEMPRE com JSON válido puro. Sem markdown.";
  let prompt="";
  if(tipo==="quiz"){const ev=usadas.length>0?`Evita: ${usadas.slice(-6).join(" | ")}`:""; prompt=`Quiz em português ${categoria?`sobre:"${categoria}"`:"variado"}. ${ev} JSON: {"pergunta":"Capital de Angola?","resposta":"luanda"}.`;}
  if(tipo==="completar"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:""; prompt=`Palavra Completa ${categoria||"variado"}. ${ev} JSON: {"inicial":"A_G_LA","completa":"angola","dica":"País África"}.`;}
  if(tipo==="caca"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:""; prompt=`Palavra Caça ${categoria||"variado"}. ${ev} JSON: {"palavra":"ANGOLA","dica":"País"}. MAIÚSCULAS A-Z, 4-8 letras.`;}
  if(tipo==="guerra"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:""; prompt=`Palavra Forca ${categoria||"variado"}. ${ev} JSON: {"palavra":"FUTEBOL","dica":"Desporto"}. 5-9 letras MAIÚSCULAS.`;}
  if(tipo==="vof"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(" | ")}`:""; prompt=`Afirmação V/F português. ${ev} JSON: {"pergunta":"O sol é uma estrela.","resposta":"verdadeiro"}.`;}
  try{const resp=await chatIA(prompt,sistema); const m=resp.match(/\{[^{}]+\}/); if(!m) throw new Error("no JSON"); const p=JSON.parse(m[0]); if(tipo==="quiz"&&p.pergunta&&p.resposta) return{p:p.pergunta,r:p.resposta.toLowerCase().trim()}; if(tipo==="completar"&&p.inicial&&p.completa) return{i:p.inicial,c:p.completa.toLowerCase().trim(),d:p.dica||"Completa"}; if(tipo==="caca"&&p.palavra) return{palavra:p.palavra.toUpperCase().replace(/[^A-Z]/g,""),dica:p.dica||"Encontra"}; if(tipo==="guerra"&&p.palavra) return{palavra:p.palavra.toUpperCase().replace(/[^A-Z]/g,""),dica:p.dica||"Palavra"}; if(tipo==="vof"&&p.pergunta&&p.resposta) return{p:p.pergunta,r:p.resposta.toLowerCase().trim()};}catch(e){console.log(`❌ gerarJogoIA(${tipo}):`,e.message);}
  return null;
}

async function proximaPergunta(sock,jid,seloBot){
  const loop=jogoLoop[jid]; if(!loop||!loop.activo) return;
  const{tipo,categoria,usadas=[]}=loop;
  let p=await gerarJogoIA(tipo,categoria,usadas);
  if(!p){if(tipo==="quiz") p=selecionarSemRepetir(QUIZ_BANCO,usadas); if(tipo==="vof") p=selecionarSemRepetir(VOF_BANCO,usadas); if(tipo==="completar") p=selecionarSemRepetir(COMPLETAR_BANCO,usadas); if(tipo==="caca") p=selecionarSemRepetir(CACA_BANCO,usadas); if(tipo==="guerra") p=selecionarSemRepetir(GUERRA_BANCO,usadas);}
  if(!p){loop.usadas=[]; if(tipo==="quiz") p=QUIZ_BANCO[Math.floor(Math.random()*QUIZ_BANCO.length)]; if(tipo==="vof") p=VOF_BANCO[Math.floor(Math.random()*VOF_BANCO.length)]; if(tipo==="completar") p=COMPLETAR_BANCO[Math.floor(Math.random()*COMPLETAR_BANCO.length)]; if(tipo==="caca") p=CACA_BANCO[Math.floor(Math.random()*CACA_BANCO.length)]; if(tipo==="guerra") p=GUERRA_BANCO[Math.floor(Math.random()*GUERRA_BANCO.length)]; await sock.sendMessage(jid,{text:`🔄 *Banco reiniciado!*`},{quoted:seloBot});}
  if(!p){delete jogoLoop[jid]; delete jogoAtivo[jid]; return;}
  const idP=p.p||p.palavra||p.c||p.i; loop.usadas=[...(loop.usadas||[]),idP]; loop.rodada=(loop.rodada||0)+1;
  const R=`Rodada *${loop.rodada}*`; const S=`\n🛑 *${CONFIG.PREFIXO}stop*`;
  if(tipo==="quiz"){jogoAtivo[jid]={tipo:"quiz",r:p.r}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="quiz"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nResposta: *${p.r.toUpperCase()}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}},25000); await sock.sendMessage(jid,{text:`🎮 *QUIZ* — ${R}\n✦ ─────────── ✦\n❓ *${p.p}*\n\n⏰ 25s | 🏆 +50 XP${S}`},{quoted:seloBot});}
  if(tipo==="vof"){jogoAtivo[jid]={tipo:"vof",r:p.r}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="vof"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nResposta: *${p.r.toUpperCase()}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}},20000); await sock.sendMessage(jid,{text:`✅❌ *V/F* — ${R}\n✦ ─────────── ✦\n❓ *${p.p}*\nverdadeiro / falso\n\n⏰ 20s | 🏆 +30 XP${S}`},{quoted:seloBot});}
  if(tipo==="completar"){jogoAtivo[jid]={tipo:"completar",r:p.c}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="completar"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nResposta: *${p.c.toUpperCase()}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}},25000); await sock.sendMessage(jid,{text:`🔤 *COMPLETA* — ${R}\n✦ ─────────── ✦\n❓ *${p.i}*\n💡 ${p.d}\n\n⏰ 25s | 🏆 +40 XP${S}`},{quoted:seloBot});}
  if(tipo==="caca"){jogoAtivo[jid]={tipo:"caca",r:p.palavra.toLowerCase()}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="caca"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nPalavra: *${p.palavra}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),5000);}},45000); await sock.sendMessage(jid,{text:`🔍 *CAÇA-PALAVRAS* — ${R}\n\`\`\`\n${gerarGrade(p.palavra)}\n\`\`\`\n💡 ${p.dica}\n\n⏰ 45s | 🏆 +60 XP${S}`},{quoted:seloBot});}
  if(tipo==="guerra"){jogoAtivo[jid]={tipo:"guerra",palavra:p.palavra,dica:p.dica,letrasAcertadas:[],letrasErradas:[],maxErros:6}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="guerra"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nPalavra: *${p.palavra}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),5000);}},90000); await sock.sendMessage(jid,{text:`⚔️ *FORCA* — ${R}\n✦ ─────────── ✦\n🔤 ${p.palavra.split("").map(()=>"_").join(" ")}\n💡 ${p.dica}\n❤️❤️❤️❤️❤️❤️\n\n⏰ 90s | 🏆 +80 XP${S}`},{quoted:seloBot});}
}

// ═══════════════════════════════════════════════════════
// ✅ VARREDURA (silenciosa)
// ═══════════════════════════════════════════════════════
async function varreduraGrupos(sock){
  try{console.log("🔍 Scan grupos..."); await new Promise(r=>setTimeout(r,4000)); const grupos=await sock.groupFetchAllParticipating(); let activados=0; for(const[gJid,meta] of Object.entries(grupos)){try{const participantes=(meta.participants||[]).map(p=>extrairJid(p.id||p)); const donoNoGrupo=participantes.find(p=>ehDono(p)); if(donoNoGrupo){gruposAtivados.add(gJid); activados++; await new Promise(r=>setTimeout(r,300));}}catch{}} console.log(`✅ Scan: ${activados} grupo(s) activado(s).`);}catch(e){console.log("❌ Auto-scan:",e.message);}
}

async function verificarInativos(sock){try{const ativos=fs.readJsonSync(ARQUIVO_ATIVOS),agora=Date.now(),LIMITE=30*24*60*60*1000; for(const gJid of Object.keys(ativos)){try{const meta=await sock.groupMetadata(gJid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); for(const m of meta.participants){const mId=extrairJid(m.id||m); if(admins.includes(mId)||ehDono(mId)) continue; const ultima=ativos[gJid]?.[mId]; if(!ultima||(agora-ultima)>LIMITE){try{await sock.groupParticipantsUpdate(gJid,[mId],"remove"); await sock.sendMessage(gJid,{text:`🚨 @${mId.split("@")[0]} removido por *inatividade*!`,mentions:[mId]});}catch{}}}}catch{}}}catch{}}

async function encontrarGrupoPorArg(sock,ativos,args){const idx=parseInt(args[0]); if(!isNaN(idx)&&idx>=1&&idx<=ativos.length) return{grupoJid:ativos[idx-1],mensagem:args.slice(1).join(" ")}; try{const grupos=await sock.groupFetchAllParticipating(); for(let len=args.length;len>=1;len--){const nomeTentativa=args.slice(0,len).join(" ").toLowerCase(); const encontrado=ativos.find(gJid=>(grupos[gJid]?.subject||"").toLowerCase().includes(nomeTentativa)); if(encontrado&&len<args.length) return{grupoJid:encontrado,mensagem:args.slice(len).join(" ")};}}catch{} return{grupoJid:null,mensagem:""};}

async function executarReconhecimentoMusica(sock,jid,msg,sender,comAnimacao,seloBot){
  const audioData=await downloadAudioDaMensagem(msg);
  if(!audioData){await sock.sendMessage(jid,{text:`↩️ Responde nota de voz com *${CONFIG.PREFIXO}${comAnimacao?"shazam":"busca"}*`},{quoted:seloBot}); return;}
  if(comAnimacao){await reagir(sock,msg,"⚡"); await sock.sendMessage(jid,{text:"⚡"},{quoted:seloBot}); await new Promise(r=>setTimeout(r,400)); await sock.sendMessage(jid,{text:"⚡⚡"}); await new Promise(r=>setTimeout(r,400)); await sock.sendMessage(jid,{text:"⚡⚡⚡ *A reconhecer a música...*"}); await new Promise(r=>setTimeout(r,500));}
  else{await reagir(sock,msg,"🎵"); await sock.sendMessage(jid,{text:`🎵 A reconhecer...\n⏳`},{quoted:seloBot});}
  try{const resultado=await reconhecerMusica(audioData.buffer); if(resultado.status==="success"&&resultado.result){const r=resultado.result; const spotify=r.spotify?.external_urls?.spotify||""; const coverUrl=r.spotify?.album?.images?.[0]?.url||null; const textoMusica=`┌─⊱ 『 ⚡ MÚSICA RECONHECIDA! 』 ⊰─┐\n│\n◎ ─ 🎵 *${r.title}*\n◎ ─ 👤 ${r.artist}\n◎ ─ 💿 ${r.album||"N/A"}${spotify?`\n◎ ─ 🟢 ${spotify}`:""}\n│\n└──────────────────────────────⊰`; if(coverUrl) await sock.sendMessage(jid,{image:{url:coverUrl},caption:textoMusica},{quoted:seloBot}); else await sock.sendMessage(jid,{text:textoMusica},{quoted:seloBot}); await reagir(sock,msg,"🎵"); addXP(sender,5);}else{await reagir(sock,msg,"❌"); await sock.sendMessage(jid,{text:`❌ Música não reconhecida.\n_Tenta com áudio mais claro._`},{quoted:seloBot});}}catch(e){await reagir(sock,msg,"❌"); await sock.sendMessage(jid,{text:`❌ Erro: ${e.message}`},{quoted:seloBot});}
}

async function enviarGif(sock,jid,caption="",quotedMsg=null){const tempOut=path.join("./downloads",`gif_${Date.now()}.mp4`); const UA="Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Chrome/112.0"; const pesquisas=["ytsearch1:solo leveling arise sung jinwoo shadow soldiers short clip"]; for(const pesquisa of pesquisas){try{await runCmd(`yt-dlp --no-check-certificate --no-playlist --no-warnings --force-ipv4 --geo-bypass --match-filter "duration < 60" --extractor-args "youtube:player_client=android,ios" --add-header "User-Agent:${UA}" -f "best[height<=480][ext=mp4]/best[height<=480]/worst" --max-filesize 8M -o "${tempOut}" "${pesquisa}"`); if(fs.existsSync(tempOut)&&fs.statSync(tempOut).size>5000){const buf=fs.readFileSync(tempOut); try{fs.removeSync(tempOut);}catch{} await sock.sendMessage(jid,{video:buf,gifPlayback:true,caption,mimetype:"video/mp4"},quotedMsg?{quoted:quotedMsg}:{}); return true;}}catch(e){console.log(`❌ GIF: ${e.message.slice(0,60)}`);} finally{try{if(fs.existsSync(tempOut)) fs.removeSync(tempOut);}catch{}}} return false;}

// ═══════════════════════════════════════════════════════
// ✅ TODOS OS COMANDOS
// ═══════════════════════════════════════════════════════
const TODOS_COMANDOS=new Set([
  "menu","ajuda","sobre","setfoto","alugar","addai",
  // downloads
  "play","mp3","mp4","mp4hd","mostre","foto","doc","qr","tourl","ytsearch",
  "tiktok","ttsearch","tttrend","ttuser","instagram","twitter","facebook","kwai",
  "spotify","soundcloud","mediafire","apk","pinterest","pinvideo",
  // figurinhas
  "sticker","sf","brat","figurinha","figu",
  // brincadeiras
  "piada","conselho","historia","poema","perfil","denunciar","cara","ship","fofoca",
  "quiz","completar","vof","caca","guerra","stop","rank","toprank",
  "matematica","jokenpo","dado","cara-coroa","adivinhar","velocidade","roleta","aki","aposta",
  // coins
  "moedas","diario","dar","roubar","topcoins",
  // alteradores
  "vz","shazam","busca","transcrever","audiotexto","resumiraudio","traduziraudio","audioparaia",
  "ia","resumir","traduzir","fotocopia","fotoparaia","resumirfoto","traduzirfoto","editar",
  // logos/util
  "meme","logo","card","calc","encurtar","cotacao","tempo","horario","ping","stats","regras","info","dono","donos","id","ver","apagadas","placar","scanlink",
  // 18+
  "piada18","truth","dare","crush","seduzir","beijo","abraco","tapa","flirt","casal",
  // adm
  "banir","add","addadmin","removeadmin","fechar","abrir","silenciar","dessilenciar","silenciados",
  "all","att","aviso","link","sorteio","nomegrupo","descgrupo","fotogrupo","apagar",
  "bloq","desbloq","bot","anti-link","vozbot","verifica","addvip","removevip","vips","criador",
  // dono
  "ergue-se","set","out","prefixo","prefixos","chaton","sms","gsms",
]);

// ═══════════════════════════════════════════════════════
// ✅ START BOT
// ═══════════════════════════════════════════════════════
let tentativasReconexao=0;

async function startBot(){
  try{
    const{version}=await fetchLatestBaileysVersion();
    const{state,saveCreds}=await useMultiFileAuthState("./sessao");
    const sock=makeWASocket({
      version,auth:state,
      printQRInTerminal:false,
      getMessage:async()=>({conversation:""}),
      generateHighQualityLinkPreview:false,
      fetchAgent:httpsAgent,
      logger:silentLogger,
      connectTimeoutMs:60000,
      keepAliveIntervalMs:10000,
      retryRequestDelayMs:2000,
      maxMsgRetryCount:3,
      defaultQueryTimeoutMs:180000,
    });
    sock.ev.on("creds.update",saveCreds);
    setInterval(()=>verificarInativos(sock),24*60*60*1000);

    if(!sock.authState.creds.registered){
      const phoneNumber=CONFIG.NUMERO_BOT.replace(/\D/g,"");
      console.log("⏳ A aguardar ligação estável...");
      await new Promise(r=>setTimeout(r,8000));
      if(!sock.authState.creds.registered){
        try{
          const code=await sock.requestPairingCode(phoneNumber);
          const codeFmt=code?.match(/.{1,4}/g)?.join("-")||code;
          console.log(`\n╔══════════════════════════════════╗`);
          console.log(`║  🔑 CÓDIGO: ${codeFmt}  ║`);
          console.log(`║  📞 +${phoneNumber}  ║`);
          console.log(`╚══════════════════════════════════╝\n`);
        }catch(e){console.error("❌ Erro código:",e.message); process.exit(1);}
      }
    }

    sock.ev.on("connection.update",async({connection,lastDisconnect})=>{
      if(connection==="close"){
        const codigo=lastDisconnect?.error?.output?.statusCode,motivo=lastDisconnect?.error?.message||"desconhecido";
        console.log(`\n❌ Desconectado | Código: ${codigo} | Motivo: ${motivo}`);
        if(codigo===DisconnectReason.loggedOut||codigo===401){if(motivo.includes("conflict")){console.log("\n⚠️ CONFLITO — reconectando em 15s...\n"); setTimeout(()=>startBot(),15000); return;} console.log("\n⚠️ Sessão expirada!\n   rm -rf sessao/ && node index.js\n"); process.exit(0);}
        tentativasReconexao++;
        setTimeout(()=>startBot(),Math.min(5000*tentativasReconexao,60000));
      }
      if(connection==="open"){
        tentativasReconexao=0;
        console.log(`\n✅ Bot conectado! +${CONFIG.NUMERO_BOT}`);
        try{ppBotUrl=await sock.profilePictureUrl(sock.user.id,"image");}catch{ppBotUrl=null;}
        setTimeout(()=>varreduraGrupos(sock),5000);
      }
    });

    sock.ev.on("group-participants.update",async(update)=>{
      try{
        const{id,participants,action}=update; if(!participants||!Array.isArray(participants)) return;
        if(action==="add"){
          for(const participante of participants){
            const p=extrairJid(participante); if(!p||!p.includes("@")) continue;
            try{
              const meta=await sock.groupMetadata(id);
              const admins=meta.participants.filter(m=>m.admin).map(m=>extrairJid(m.id||m));
              const mentions=[p,...admins];
              let ppUser=null; try{ppUser=await sock.profilePictureUrl(p,"image");}catch{}
              const listaAdm=admins.length>0?admins.map(a=>`👮 @${a.split("@")[0]}`).join("\n│ "):"_(sem admins)_";
              const texto=`🎉 *BEM-VINDO!* 🎉\n\n👋 Olá @${p.split("@")[0]}!\nBem-vindo(a) ao *${meta.subject}*! 🤗\n\n╭─── 📋 *REGRAS* ───╮\n│ ❌ Sem links\n│ ❌ Sem spam\n│ ❌ Sem ofensas\n│ ✅ Respeita todos\n╰───────────────────╯\n\n╭─── 👑 *ADMINS* ───╮\n│ ${listaAdm}\n╰───────────────────╯\n\n🤖 Usa *${CONFIG.PREFIXO}menu* !`;
              if(ppUser) await sock.sendMessage(id,{image:{url:ppUser},caption:texto,mentions});
              else await sock.sendMessage(id,{text:texto,mentions});
            }catch(e){console.log("❌ Boas-vindas:",e.message);}
          }
        }
        if(action==="remove"){
          for(const participante of participants){
            const p=extrairJid(participante); if(!p||!p.includes("@")) continue;
            try{await sock.sendMessage(id,{text:`👋 *SAÍU +1*\n\nÉ por causa de @${p.split("@")[0]} que a Rede Estava Lenta 🚶🏿‍♂️\n\n*BAZAAA...* 😂💨`,mentions:[p]});}catch{}
          }
        }
      }catch(e){console.log("❌ group-participants:",e.message);}
    });

    sock.ev.on("messages.upsert",async({messages,type})=>{
      try{
        if(type!=="notify") return;
        const msg=messages[0]; if(!msg?.message) return;
        const jid=msg.key.remoteJid,isGrupo=jid.endsWith("@g.us");
        if(jid==="status@broadcast") return;
        if(msg.key.fromMe) return;

        const seloBot=criarSeloBot(jid);
        const sender=extrairJid(isGrupo?(msg.key.participant||""):msg.key.remoteJid);
        const isDono=ehDono(sender),texto=getTexto(msg);
        const mencoes=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];

        // Cache msgs
        if(!cacheMsg[jid]) cacheMsg[jid]={};
        cacheMsg[jid][msg.key.id]={sender,texto:texto||"",tipo:getTipoMsg(msg),timestamp:Date.now()};
        const cK=Object.keys(cacheMsg[jid]); if(cK.length>MAX_CACHE_MSG) delete cacheMsg[jid][cK[0]];

        // Msgs apagadas
        if(msg.message?.protocolMessage?.type===0){const kD=msg.message.protocolMessage.key,mDI=kD?.id,jD=kD?.remoteJid||jid; const mC=cacheMsg[jD]?.[mDI]||cacheMsg[jid]?.[mDI]; if(mC&&(mC.texto||mC.tipo)){if(!msgApagadas[jid]) msgApagadas[jid]=[]; msgApagadas[jid].push({...mC,apagadoEm:Date.now()}); if(msgApagadas[jid].length>30) msgApagadas[jid].shift();} return;}

        // View-once cache
        {const m=msg.message; const voMsg=m?.viewOnceMessage?.message||m?.viewOnceMessageV2?.message||m?.viewOnceMessageV2Extension?.message; if(voMsg){(async()=>{try{const buf=await downloadMediaMessage(msg,"buffer",{}); const tipo=voMsg.videoMessage?"video":(voMsg.audioMessage||voMsg.pttMessage)?"audio":"imagem"; if(!cacheViewOnce[jid]) cacheViewOnce[jid]={}; cacheViewOnce[jid][msg.key.id]={tipo,buf,sender,timestamp:Date.now()}; setTimeout(()=>{if(cacheViewOnce[jid]?.[msg.key.id]) delete cacheViewOnce[jid][msg.key.id];},60*60*1000);}catch{}})();}}

        if(isGrupo){
          if(!historyMsgs[jid]) historyMsgs[jid]=[]; historyMsgs[jid].push({key:msg.key,sender,texto:texto||"",timestamp:Date.now()}); if(historyMsgs[jid].length>MAX_HISTORY) historyMsgs[jid].shift();
          addXP(sender,2); registarAtividade(sender,jid); salvarNoBuffer(jid,{sender,texto,mencoes,timestamp:Date.now()});
        }

        // ✅ HANDLER: listResponseMessage (categoria do menu)
        const listResp=msg.message?.listResponseMessage;
        if(listResp){
          const catId=listResp.singleSelectReply?.selectedRowId;
          if(catId&&catId.startsWith("cat_")){
            if(isGrupo&&!isDono&&!gruposAtivados.has(jid)) return;
            if(chatsDesativados.has(jid)&&!isDono) return;
            let isAdmin=isDono; if(isGrupo&&!isDono){try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); isAdmin=admins.includes(sender);}catch{}}
            if(!isDono&&!senhasAprovadas.has(sender)){if(isGrupo&&isAdmin){senhasAprovadas.add(sender);}else return;}
            await enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono);
            return;
          }
        }

        // ✅ HANDLER: interactiveResponseMessage (native flow clicks)
        const interResp=msg.message?.interactiveResponseMessage;
        if(interResp){
          let catId=null;
          try{const nf=interResp.nativeFlowResponseMessage; if(nf?.paramsJson){const params=JSON.parse(nf.paramsJson); catId=params.id||params.selectedId||params.rowId||null;}}catch{}
          if(!catId) catId=interResp.body||null;

          if(catId){
            if(isGrupo&&!isDono&&!gruposAtivados.has(jid)) return;
            if(chatsDesativados.has(jid)&&!isDono) return;

            // ✅ Download buttons do !play
            if(catId.startsWith("dl_audio:")||catId.startsWith("dl_video:")||catId.startsWith("dl_doc:")){
              const[tipo,url]=catId.split(":").slice(0,2).concat(catId.split(":").slice(2).join(":")).filter(Boolean);
              const urlReal=catId.replace(/^dl_(audio|video|doc):/,"");
              let isAdmin=isDono; if(isGrupo&&!isDono){try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); isAdmin=admins.includes(sender);}catch{}}
              if(!isDono&&!senhasAprovadas.has(sender)&&!isAdmin){await sock.sendMessage(jid,{text:`🔒 Acessa com a senha!`},{quoted:seloBot}); return;}

              if(catId.startsWith("dl_audio:")){
                await reagir(sock,msg,"🎵");
                let arq=null;
                try{arq=await barraCarregamento(sock,jid,seloBot,"A baixar MP3...",()=>downloadMusica(urlReal,false));}catch(e){console.log("❌ dl_audio barraCarregamento:",e.message);}
                if(!arq||!fs.existsSync(arq)){await sock.sendMessage(jid,{text:"❌ Não consegui baixar o áudio."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}
                try{await enviarAudio(sock,jid,arq,seloBot); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}
                setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);
              }
              else if(catId.startsWith("dl_video:")){
                await reagir(sock,msg,"🎬");
                let saida=null;
                try{saida=await barraCarregamento(sock,jid,seloBot,"A baixar vídeo 480p...",()=>downloadVideo(urlReal,480));}catch(e){console.log("❌ dl_video:",e.message);}
                if(!saida||!fs.existsSync(saida)){await sock.sendMessage(jid,{text:"❌ Não consegui baixar o vídeo."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}
                try{await enviarVideo(sock,jid,saida,"🎬 Vídeo",[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}
                setTimeout(()=>{try{fs.removeSync(saida);}catch{}},15000);
              }
              else if(catId.startsWith("dl_doc:")){
                await reagir(sock,msg,"📄");
                let arq=null;
                try{arq=await barraCarregamento(sock,jid,seloBot,"A preparar documento...",()=>downloadMusica(urlReal,true));}catch(e){console.log("❌ dl_doc:",e.message);}
                if(!arq||!fs.existsSync(arq)){await sock.sendMessage(jid,{text:"❌ Não consegui baixar."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}
                try{const buf=fs.readFileSync(arq); await sock.sendMessage(jid,{document:buf,mimetype:"audio/mpeg",fileName:path.basename(arq)},{quoted:seloBot}); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}
                setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);
              }
              return;
            }

            // Categorias do menu
            if(catId.startsWith("cat_")){
              await enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono);
              return;
            }
          }
        }

        // ✅ HANDLER: buttonsResponseMessage
        const btnResp=msg.message?.buttonsResponseMessage;
        if(btnResp){
          const btnId=btnResp.selectedButtonId||btnResp.body||"";
          if(btnId.startsWith("cat_")){ await enviarSubmenu(sock,jid,msg,btnId,seloBot,sender,isDono); return;}
        }

        // !ergue-se
        if(isDono&&isGrupo&&texto===`${CONFIG.PREFIXO}ergue-se`){
          gruposAtivados.add(jid);
          const caption=`✅ *ERGUE-TE!* 🤴🏽\n\nAs tuas Ordens meu senhor! ✨️👑\n\n🔒 Anti-link: *ACTIVO*\n🚫 Anti-menção: *ACTIVO*\n⛔ Anti-status: *ACTIVO*\n\n_Usa *${CONFIG.PREFIXO}menu*!_`;
          await reagir(sock,msg,"✅");
          const gifOk=await enviarGif(sock,jid,caption);
          if(!gifOk) await enviarComSelo(sock,jid,caption,seloBot);
          return;
        }

        if(isGrupo&&!isDono&&!gruposAtivados.has(jid)) return;
        if(chatsDesativados.has(jid)&&!isDono) return;

        let isAdmin=isDono;
        if(isGrupo&&!isDono){try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); isAdmin=admins.includes(sender);}catch{}}

        if(isGrupo&&!isAdmin&&(membrosSilenciados[jid]||[]).includes(sender)){try{await sock.sendMessage(jid,{delete:msg.key});}catch{}; return;}
        if(isGrupo&&!isAdmin&&ehMencaoStatus(msg,texto)){banirComContagem(sock,jid,sender,msg.key,"Menção de status ⛔"); return;}
        if(isGrupo&&!isAdmin&&!antiLinkDesativado.has(jid)&&LINK_RX.test(texto)){banirComContagem(sock,jid,sender,msg.key,"Link proibido 🔗❌"); return;}
        if(isGrupo&&!isAdmin&&mencoes.length>5){banirComContagem(sock,jid,sender,msg.key,"Spam de menções 📢❌"); return;}

        // ✅ JOGOS em andamento
        if(isGrupo&&jogoAtivo[jid]){
          const jogo=jogoAtivo[jid],resp=texto.toLowerCase().trim(),loop=jogoLoop[jid];
          const acertou=async(xp)=>{addXP(sender,xp); addCoins(sender,xp/2|0); await reagir(sock,msg,"🎉"); await sock.sendMessage(jid,{text:`🎉 *CORRETO!*\n✅ @${sender.split("@")[0]} acertou!\n🏆 +${xp} XP | +${xp/2|0} 💰${loop?.activo?"\n⏳ Próxima em 3s...":""}`},{quoted:seloBot}); if(loop?.timeoutHandle) clearTimeout(loop.timeoutHandle); delete jogoAtivo[jid]; if(loop?.activo) setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);};
          if(jogo.tipo==="quiz"&&resp===jogo.r){await acertou(50); return;}
          if(jogo.tipo==="completar"&&resp===jogo.r){await acertou(40); return;}
          if(jogo.tipo==="caca"&&resp===jogo.r){await acertou(60); return;}
          if(jogo.tipo==="vof"){const ru=resp==="v"?"verdadeiro":resp==="f"?"falso":resp; if(ru==="verdadeiro"||ru==="falso"){if(ru===jogo.r){await acertou(30);}else{await reagir(sock,msg,"❌"); await sock.sendMessage(jid,{text:`❌ *ERRADO!*\nResposta: *${jogo.r.toUpperCase()}*${loop?.activo?"\n⏳ Próxima em 3s...":""}`},{quoted:seloBot}); if(loop?.timeoutHandle) clearTimeout(loop.timeoutHandle); delete jogoAtivo[jid]; if(loop?.activo) setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);} return;}}
          if(jogo.tipo==="guerra"){const lP=texto.toUpperCase().trim().replace(/[^A-Z]/g,""); if(!lP) return; if(lP===jogo.palavra){await acertou(80); return;} if(lP.length===1){if(jogo.letrasAcertadas.includes(lP)||jogo.letrasErradas.includes(lP)){await sock.sendMessage(jid,{text:`⚠️ *${lP}* já foi usada!\n\n${mostrarGuerraEstado(jogo)}`},{quoted:seloBot}); return;} if(jogo.palavra.includes(lP)){jogo.letrasAcertadas.push(lP); const pM=jogo.palavra.split("").map(l=>jogo.letrasAcertadas.includes(l)?l:"_").join(" "); if(!pM.includes("_")){await acertou(80); return;} await sock.sendMessage(jid,{text:`✅ *${lP}* está!\n\n${mostrarGuerraEstado(jogo)}`},{quoted:seloBot});}else{jogo.letrasErradas.push(lP); if(jogo.letrasErradas.length>=jogo.maxErros){await sock.sendMessage(jid,{text:`💀 *FIM!*\nPalavra: *${jogo.palavra}*${loop?.activo?"\n⏳ Próxima em 5s...":""}`},{quoted:seloBot}); if(loop?.timeoutHandle) clearTimeout(loop.timeoutHandle); delete jogoAtivo[jid]; if(loop?.activo) setTimeout(()=>proximaPergunta(sock,jid,seloBot),5000);}else{await sock.sendMessage(jid,{text:`❌ *${lP}* NÃO está!\n\n${mostrarGuerraEstado(jogo)}`},{quoted:seloBot});}} return;}}
        }

        // ✅ Jogo: Adivinhar número
        if(jogoAdivinhar[jid]){
          const num=parseInt(texto.trim());
          if(!isNaN(num)){
            const jogo=jogoAdivinhar[jid];
            jogo.tentativas++;
            if(num===jogo.numero){
              const xp=Math.max(10,50-jogo.tentativas*5);
              addXP(sender,xp); addCoins(sender,xp/2|0);
              let loadMsg=jogo.msgKey;
              await sock.sendMessage(jid,{text:`🎉 *CORRETO!* @${sender.split("@")[0]}\n\n🎯 Era o número *${jogo.numero}*!\n🎲 Tentativas: *${jogo.tentativas}*\n🏆 +${xp} XP | +${xp/2|0} 💰`,mentions:[sender]},{quoted:seloBot});
              delete jogoAdivinhar[jid];
              return;
            }else{
              const dica=num<jogo.numero?"📈 Mais alto!":"📉 Mais baixo!";
              let editText=`🎲 *ADIVINHAR NÚMERO*\n\n${dica}\n🎯 Tentativas: *${jogo.tentativas}*\n_Intervalo: 1-100_\n\n_Ainda a tentar..._`;
              if(jogo.tentativas>=10){editText+=`\n⚠️ Tens ${20-jogo.tentativas} tentativas restantes.`;}
              if(jogo.tentativas>=20){
                await sock.sendMessage(jid,{text:`💀 *FIM!* O número era *${jogo.numero}*!`},{quoted:seloBot});
                delete jogoAdivinhar[jid];
                return;
              }
              try{if(jogo.msgKey) await sock.sendMessage(jid,{text:editText,edit:jogo.msgKey});}catch{await sock.sendMessage(jid,{text:editText},{quoted:seloBot});}
              return;
            }
          }
        }

        // ✅ Jogo: Velocidade (resposta à palavra)
        if(jogoVelocidade[jid]){
          const jogo=jogoVelocidade[jid];
          if(texto.toLowerCase().trim()===jogo.palavra){
            const tempo=((Date.now()-jogo.inicio)/1000).toFixed(1);
            const xp=tempo<5?100:tempo<10?70:tempo<20?50:30;
            addXP(sender,xp); addCoins(sender,xp/2|0);
            await sock.sendMessage(jid,{text:`⚡ *INCRÍVEL!* @${sender.split("@")[0]}\n\n✅ Digitou em *${tempo}s*!\n🏆 +${xp} XP | +${xp/2|0} 💰`,mentions:[sender]},{quoted:seloBot});
            delete jogoVelocidade[jid];
            return;
          }
        }

        // ✅ Wake word (Isaías)
        const audioMsgDireto=msg.message?.audioMessage||msg.message?.pttMessage;
        if(audioMsgDireto&&!vozBotDesativado.has(jid)){
          const voiceLimitKey=`voice_${sender}`,agoraV=Date.now();
          if(!userRateLimit[voiceLimitKey]||(agoraV-userRateLimit[voiceLimitKey])>3000){
            userRateLimit[voiceLimitKey]=agoraV;
            (async()=>{try{const audioData=await downloadAudioDaMensagem(msg); if(!audioData) return; const transcricao=await transcreverComGroq(audioData.buffer); const pergunta=detectarWakeWord(transcricao); if(pergunta===null) return; await reagir(sock,msg,"🎙️"); if(!pergunta){await sock.sendMessage(jid,{text:`👋 Diz *Isaías* seguido da pergunta!`},{quoted:seloBot}); return;} await sock.sendMessage(jid,{text:`🎙️ _"${pergunta}"_\n🧠 A pensar...`},{quoted:seloBot}); const resposta=await chatIA(pergunta); try{const audioPath=await textoParaFala(resposta); await enviarAudio(sock,jid,audioPath,seloBot); try{fs.removeSync(audioPath);}catch{}}catch{await sock.sendMessage(jid,{text:`🤖 *ISAÍAS:*\n\n${resposta}`},{quoted:seloBot});} addXP(sender,5);}catch(e){console.log("❌ Wake word:",e.message);}})();
          }
          return;
        }

        // Gate senha + menu numerado
        if(!texto.startsWith(CONFIG.PREFIXO)){
          if(/^[0-9]$/.test(texto.trim())){
            const chaveMenu=`${jid}_${sender}`;
            const estadoMenu=menuEsperandoResposta.get(chaveMenu);
            if(estadoMenu&&(Date.now()-estadoMenu.timestamp)<120000){
              const catId=MENU_NUMEROS[texto.trim()];
              if(catId){
                if(catId==="cat_dono"&&!estadoMenu.isDono){await sock.sendMessage(jid,{text:`🔒 _Apenas o dono._`},{quoted:seloBot}); return;}
                menuEsperandoResposta.delete(chaveMenu);
                await enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono);
                return;
              }
            }
          }
          if(!isDono&&!senhasAprovadas.has(sender)){
            if(isGrupo&&isAdmin){senhasAprovadas.add(sender);}
            else if(texto.trim()===CONFIG.SENHA_BOT){senhasAprovadas.add(sender); await sock.sendMessage(jid,{text:`✅ *Acesso permitido!* 🎉\nEscreve *${CONFIG.PREFIXO}menu*`},{quoted:seloBot});}
          }
          return;
        }

        // ✅ Prefixo sozinho
        if(texto.trim()===CONFIG.PREFIXO){await reagir(sock,msg,"🌀"); await sock.sendMessage(jid,{text:`🌀 Prefixo: *${CONFIG.PREFIXO}*\nUsa *${CONFIG.PREFIXO}menu*`},{quoted:seloBot}); return;}

        if(!isDono&&!verificarRateLimit(sender)){await reagir(sock,msg,"⏳"); return;}
        const args=texto.slice(CONFIG.PREFIXO.length).trim().split(/\s+/);
        const comando=args.shift().toLowerCase();

        if(!isDono&&!senhasAprovadas.has(sender)){
          if(isGrupo&&isAdmin){senhasAprovadas.add(sender);}
          else{const chave=`pw_${sender}_${jid}`; if(!pedidoSenha.has(chave)){pedidoSenha.add(chave); setTimeout(()=>pedidoSenha.delete(chave),60000); await sock.sendMessage(jid,{text:`🔒 *Acesso restrito!*\nEnvia a *palavra-passe*.\n_Contacta ${CONFIG.DONO_NUM}._`},{quoted:seloBot});} return;}
        }

        await reagir(sock,msg,"⏳");
        salvarStats(comando,sender);

        if(comandosBloqueados.has(jid)&&!isAdmin&&!["bloq","desbloq"].includes(comando)){await sock.sendMessage(jid,{text:`🔒 *Comandos bloqueados!*`},{quoted:seloBot}); await reagir(sock,msg,"🔒"); return;}
        if(!TODOS_COMANDOS.has(comando)){
          const chave=`${jid}_${sender}`,erros=(errosComando[chave]||0)+1; errosComando[chave]=erros; setTimeout(()=>{delete errosComando[chave];},5*60*1000);
          let ppErrou=null; try{ppErrou=await sock.profilePictureUrl(sender,"image");}catch{}
          const textoErro=`@${sender.split("@")[0]} Comando errado! 😑\nEscreve *${CONFIG.PREFIXO}menu* ⏳️\n\n`+(erros>=3?`⚠️ *${erros}x erros!* Continua e vou te BANIR🙂`:``);
          if(ppErrou) await sock.sendMessage(jid,{image:{url:ppErrou},caption:textoErro,mentions:[sender]},{quoted:seloBot});
          else await sock.sendMessage(jid,{text:textoErro,mentions:[sender]},{quoted:seloBot});
          await reagir(sock,msg,"❌"); return;
        }

        const CMDS_ADMIN=["banir","addadmin","removeadmin","fechar","abrir","all","att","anti-link","bot","link","sorteio","verifica","silenciar","dessilenciar","silenciados","arqadd","arqdelete","add","aviso","apagar","vozbot","bloq","desbloq","nomegrupo","descgrupo","fotogrupo","scanlink","addai","addvip","removevip","vips"];
        if(CMDS_ADMIN.includes(comando)&&!isAdmin){await sock.sendMessage(jid,{text:`🔒 *Apenas administradores.*`},{quoted:seloBot}); await reagir(sock,msg,"🚫"); return;}
        const CMDS_DONO=["out","prefixo","prefixos","set","chaton","sms","gsms","setfoto"];
        if(CMDS_DONO.includes(comando)&&!isDono){await sock.sendMessage(jid,{text:`🔒 *Apenas o dono.*`},{quoted:seloBot}); await reagir(sock,msg,"🚫"); return;}
        const CMDS_18=["piada18","truth","dare","crush","seduzir","beijo","abraco","tapa","flirt","casal"];
        if(CMDS_18.includes(comando)&&!isDono&&!isVip(sender)){await sock.sendMessage(jid,{text:`🔞 *Acesso restrito a VIPs!*\n│\nSe torna VIP com *${CONFIG.PREFIXO}alugar* 💎`},{quoted:seloBot}); await reagir(sock,msg,"🔞"); return;}

        // ════════════════════════════════════════════════
        //              ✅ COMANDOS
        // ════════════════════════════════════════════════

        // ─── SISTEMA/MENU ───
        if(comando==="setfoto"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}setfoto* ↩️ responde imagem\n◎ ─ Actual: ${botFotoBuffer?"✅ Personalizada":"📷 Perfil WA"}`},{quoted:seloBot}); return;} botFotoBuffer=imgBuf; fs.writeFileSync(BOT_FOTO_PATH,imgBuf); await sock.sendMessage(jid,{image:imgBuf,caption:`✅ *Foto actualizada!*`},{quoted:seloBot}); await reagir(sock,msg,"✅"); return;}
        if(comando==="alugar"){await sock.sendMessage(jid,{text:gerarTextoAlugar()},{quoted:seloBot}); await reagir(sock,msg,"💰"); return;}
        if(comando==="addai"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} try{await sock.groupParticipantsUpdate(jid,["867051314767696@bot"],"add"); await sock.sendMessage(jid,{text:`✅ Meta AI adicionada!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot}); await reagir(sock,msg,"❌");} return;}
        if(comando==="menu"||comando==="ajuda"){const sub=args[0]?.toLowerCase(); const catMap={principal:"cat_principal",downloads:"cat_downloads",figurinhas:"cat_figurinhas",brincadeiras:"cat_brincadeiras",coins:"cat_coins",alteradores:"cat_alteradores",logos:"cat_logos","18":"cat_18",adm:"cat_adm",dono:"cat_dono"}; if(sub&&catMap[sub]){await enviarSubmenu(sock,jid,msg,catMap[sub],seloBot,sender,isDono);}else{await enviarMenuPrincipal(sock,jid,msg,isDono,sender,isAdmin,seloBot);} return;}
        if(comando==="sobre"){await enviarComSelo(sock,jid,`┌─⊱ 『 🤖 SOBRE 』 ⊰─┐\n│\n◎ ─ *${CONFIG.NOME_BOT}*\n◎ ─ 👑 Criado por: *ISAÍAS PEDRO*\n◎ ─ 📦 @itsliaaa/baileys\n◎ ─ ✅ Native Flow Carousel\n◎ ─ ✅ Barra de carregamento\n◎ ─ ✅ Scraper Hub API\n◎ ─ ✅ Sistema VIP 💎\n◎ ─ ✅ 20+ jogos\n◎ ─ ✅ 18+ VIP exclusivo\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT} — 24/7_ 🟢`,seloBot); return;}
        if(comando==="set"){const novaSenha=args.join(" ").replace(/['"]/g,"").trim(); if(!novaSenha){await sock.sendMessage(jid,{text:`🔑 *${CONFIG.PREFIXO}set [nova_senha]*`},{quoted:seloBot}); return;} CONFIG.SENHA_BOT=novaSenha; senhasAprovadas.clear(); await sock.sendMessage(jid,{text:`✅ *Senha alterada:* *${novaSenha}*`},{quoted:seloBot}); await reagir(sock,msg,"🔑"); return;}
        if(comando==="id"){await sock.sendMessage(jid,{text:`📱 *JID:* _${sender}_\n👑 Dono: ${isDono?"✅":"❌"} | 👮 Admin: ${isAdmin?"✅":"❌"} | 💎 VIP: ${isVip(sender)?"✅":"❌"}`},{quoted:seloBot}); await reagir(sock,msg,"📱"); return;}
        if(comando==="out"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} try{await sock.sendMessage(jid,{text:`👋 *Bot a sair...*`},{quoted:seloBot}); await new Promise(r=>setTimeout(r,1000)); await sock.groupLeave(jid);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}; return;}
        if(comando==="prefixo"||comando==="prefixos"){if(!args[0]){await sock.sendMessage(jid,{text:`⚙️ Prefixo: *${CONFIG.PREFIXO}*`},{quoted:seloBot}); return;} const antigoP=CONFIG.PREFIXO; CONFIG.PREFIXO=args[0].trim().charAt(0); await sock.sendMessage(jid,{text:`✅ Prefixo: *${antigoP}* → *${CONFIG.PREFIXO}*`},{quoted:seloBot}); return;}
        if(comando==="ping"){const ini=Date.now(); await sock.sendMessage(jid,{text:"⏳"}); await sock.sendMessage(jid,{text:`🏓 *PONG!*\n📶 *${Date.now()-ini}ms* | ⏱️ ${Math.floor(process.uptime()/60)} min | 💾 ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`},{quoted:seloBot}); return;}
        if(comando==="stats"){const s=fs.readJsonSync(ARQUIVO_STATS); const top=Object.entries(s.comandos||{}).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n],i)=>`◎ ─ ${i+1}. *${CONFIG.PREFIXO}${c}* — ${n}x`).join("\n"); await sock.sendMessage(jid,{text:`┌─⊱ 『 📊 STATS 』 ⊰─┐\n│\n◎ ─ 🔢 Total: *${s.total||0}*\n│\n${top}\n│\n└──────────────────────────────⊰`},{quoted:seloBot}); return;}
        if(comando==="regras"){await sock.sendMessage(jid,{text:`┌─⊱ 『 📋 REGRAS 』 ⊰─┐\n│\n◎ ─ ❌ Sem links\n◎ ─ ❌ Sem spam\n◎ ─ ❌ Sem ofensas\n◎ ─ ❌ Sem status\n◎ ─ ✅ Respeita todos\n│\n◎ ─ ⚡ Ban automático 5→0!\n│\n└──────────────────────────────⊰`},{quoted:seloBot}); return;}
        if(comando==="dono"||comando==="criador"){let ppD=null; try{ppD=await sock.profilePictureUrl(CONFIG.DONO_JID,"image");}catch{} const tD=`┌─⊱ 『 👑 CRIADOR 』 ⊰─┐\n│\n◎ ─ 🏷️ *${CONFIG.DONO_NOME}*\n◎ ─ 📞 *${CONFIG.DONO_NUM}*\n│\n◎ ─ 💰 *${CONFIG.PREFIXO}alugar*\n│\n└──────────────────────────────⊰`; if(ppD) await sock.sendMessage(jid,{image:{url:ppD},caption:tD},{quoted:seloBot}); else await sock.sendMessage(jid,{text:tD},{quoted:seloBot}); await reagir(sock,msg,"👑"); return;}
        if(comando==="donos"){await sock.sendMessage(jid,{text:`┌─⊱ 『 👑 DONOS 』 ⊰─┐\n│\n◎ ─ 👑 *${CONFIG.DONO_NOME}*\n   📞 ${CONFIG.DONO_NUM}\n│\n└──────────────────────────────⊰`},{quoted:seloBot}); return;}

        // ─── VIP ───
        if(comando==="addvip"){
          const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);
          if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}addvip* @user`},{quoted:seloBot}); return;}
          const nomeVip=args.join(" ").replace(/@\S+/g,"").trim()||alvo.split("@")[0];
          addVip(alvo,nomeVip);
          await sock.sendMessage(jid,{text:`💎 *@${alvo.split("@")[0]} é agora VIP!*\n✅ Acesso ao menu +18 liberado!`,mentions:[alvo]},{quoted:seloBot});
          await reagir(sock,msg,"💎"); return;
        }
        if(comando==="removevip"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}removevip* @user`},{quoted:seloBot}); return;} removeVip(alvo); await sock.sendMessage(jid,{text:`❌ *@${alvo.split("@")[0]}* removido dos VIPs.`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"✅"); return;}
        if(comando==="vips"){const vips=listarVips(); const lista=Object.entries(vips); if(!lista.length){await sock.sendMessage(jid,{text:`📭 Nenhum VIP registado.`},{quoted:seloBot}); return;} const texto_vips=lista.map(([jid_v,info],i)=>`◎ ─ ${i+1}. 💎 *${info.nome||jid_v.split("@")[0]}*`).join("\n"); await sock.sendMessage(jid,{text:`┌─⊱ 『 💎 LISTA VIPs 』 ⊰─┐\n│\n${texto_vips}\n│\n◎ ─ Total: *${lista.length}*\n│\n└──────────────────────────────⊰`},{quoted:seloBot}); return;}

        // ─── DOWNLOADS ───

        // ✅ PLAY — Carousel com Native Flow + loading
        if(comando==="play"){
          if(!args.length){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}play* [música ou link]`},{quoted:seloBot}); return;}
          const query=args.join(" ");
          await reagir(sock,msg,"🔍");

          // Loading de pesquisa
          let loadMsg=null;
          try{loadMsg=await sock.sendMessage(jid,{text:`🔍 *A pesquisar:* _${query}_\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{}

          const searchPromise=scraperYouTubeSearch(query,5).then(r=>r.length>0?r:null).catch(async()=>{
            // Fallback yt-dlp
            try{
              const UA="Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Chrome/112.0 Mobile Safari/537.36";
              const json=await runCmd(`yt-dlp --dump-json --no-playlist --no-warnings --force-ipv4 --geo-bypass --extractor-args "youtube:player_client=android,ios" --add-header "User-Agent:${UA}" "ytsearch5:${query}" 2>/dev/null`);
              const linhas=json.trim().split('\n').filter(l=>l.trim().startsWith('{'));
              return linhas.map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);
            }catch{return null;}
          });

          for(let i=1;i<=4;i++){await new Promise(r=>setTimeout(r,500)); if(loadMsg){try{await sock.sendMessage(jid,{text:`🔍 *A pesquisar:* _${query}_\n\n${FRAMES_LOADING[i]}`,edit:loadMsg.key});}catch{}}}

          const videos=await searchPromise;
          if(loadMsg){try{await sock.sendMessage(jid,{text:`🔍 *A pesquisar:* _${query}_\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}}
          await new Promise(r=>setTimeout(r,400));

          if(!videos||!videos.length){await sock.sendMessage(jid,{text:"❌ Nenhum resultado encontrado!"},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}

          // ✅ Tenta enviar Carousel com Native Flow
          try{
            const cards=await Promise.all(videos.slice(0,5).map(async v=>{
              const titulo=(v.title||v.titulo||"N/A").slice(0,50);
              const canal=v.uploader||v.channel||v.canal||"N/A";
              const duracao=formatarDuracao(v.duration||v.duracao||0);
              const urlVid=v.webpage_url||v.url||v.link||"";
              const thumb=v.thumbnail||v.miniatura||null;

              return {
                ...(thumb?{image:{url:thumb}}:{}),
                caption:`🎵 *${titulo}*\n\n👤 ${canal}\n⏱️ ${duracao}`,
                footer:`🌀 ${CONFIG.NOME_BOT}`,
                nativeFlow:[
                  {text:"🎵 Música",  id:`dl_audio:${urlVid}`,  icon:"review"},
                  {text:"🎬 Vídeo",   id:`dl_video:${urlVid}`,  icon:"default"},
                  {text:"📄 Documento",id:`dl_doc:${urlVid}`,   icon:"default"},
                ]
              };
            }));

            await sock.sendMessage(jid,{
              text:`🎵 *Resultados para:* _${query}_\n👈 Desliza para escolher:`,
              footer:CONFIG.NOME_BOT,
              cards
            },{quoted:seloBot});
            await reagir(sock,msg,"🎧");
          }catch(e){
            console.log("⚠️ Carousel play falhou:",e.message);
            // Fallback: lista de texto
            const lista=videos.slice(0,5).map((v,i)=>`*${i+1}.* 🎵 ${(v.title||v.titulo||"N/A").slice(0,40)}\n   ⏱️ ${formatarDuracao(v.duration||0)} | 👤 ${(v.uploader||"N/A").slice(0,20)}\n   🔗 ${v.webpage_url||v.url||""}`).join("\n\n");
            await sock.sendMessage(jid,{text:`🔍 *${query}*\n\n${lista}\n\n_Use !mp3 [link] ou !mp4 [link] para baixar_`},{quoted:seloBot});
            await reagir(sock,msg,"🎧");
          }
          return;
        }

        // ✅ MP3 HD com barra de carregamento
        if(comando==="mp3"&&args.length>0){
          const entrada=args.join(" ");
          await reagir(sock,msg,"🎵");
          let arqFinal=null;
          try{arqFinal=await barraCarregamento(sock,jid,seloBot,`A baixar MP3: _${entrada.slice(0,40)}_`,()=>downloadMusica(entrada,true));}catch(e){console.log("❌ mp3:",e.message);}
          if(!arqFinal||!fs.existsSync(arqFinal)){await sock.sendMessage(jid,{text:`❌ Não encontrei: _${entrada}_`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}
          try{await enviarAudio(sock,jid,arqFinal,seloBot); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}
          setTimeout(()=>{try{fs.removeSync(arqFinal);}catch{}},15000);
          return;
        }

        // ✅ MP4 com barra de carregamento
        if(comando==="mp4"&&args.length>0){
          const entrada=args.join(" ");
          await reagir(sock,msg,"🎬");
          let saida=null;
          try{saida=await barraCarregamento(sock,jid,seloBot,`A baixar vídeo 480p: _${entrada.slice(0,40)}_`,()=>downloadVideo(entrada,480));}catch(e){console.log("❌ mp4:",e.message);}
          if(!saida||!fs.existsSync(saida)){await sock.sendMessage(jid,{text:`❌ Não consegui baixar.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}
          try{await enviarVideo(sock,jid,saida,`🎬 _© ${CONFIG.NOME_BOT}_`,[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}
          setTimeout(()=>{try{fs.removeSync(saida);}catch{}},15000);
          return;
        }

        // ✅ MP4HD com barra de carregamento
        if(comando==="mp4hd"&&args.length>0){
          const entrada=args.join(" ");
          await reagir(sock,msg,"📹");
          let result=null;
          try{result=await barraCarregamento(sock,jid,seloBot,`A baixar vídeo 720p: _${entrada.slice(0,40)}_`,()=>downloadVideoHD(entrada,720));}catch(e){console.log("❌ mp4hd:",e.message);}
          if(!result||!result.filePath||!fs.existsSync(result.filePath)){await sock.sendMessage(jid,{text:`❌ Não consegui.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}
          try{await enviarVideo(sock,jid,result.filePath,`📹 ${result.quality} | 💾 ${result.sizeMB}MB\n_© ${CONFIG.NOME_BOT}_`,[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(result.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot}); await reagir(sock,msg,"❌");}
          return;
        }

        // ✅ YTSEARCH
        if(comando==="ytsearch"&&args.length>0){
          const query=args.join(" ");
          let loadMsg=null;
          try{loadMsg=await sock.sendMessage(jid,{text:`🔍 A pesquisar: _${query}_\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{}
          const videos=await scraperYouTubeSearch(query,5);
          if(loadMsg){try{await sock.sendMessage(jid,{text:`🔍 A pesquisar: _${query}_\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}}
          await new Promise(r=>setTimeout(r,300));
          if(!videos.length){await sock.sendMessage(jid,{text:"❌ Nenhum resultado."},{quoted:seloBot}); return;}
          const lista=videos.slice(0,5).map((v,i)=>`*${i+1}.* 🎵 ${(v.title||v.titulo||"N/A").slice(0,40)}\n   ⏱️ ${formatarDuracao(v.duration||0)} | 👤 ${(v.uploader||"N/A").slice(0,20)}\n   🔗 ${v.webpage_url||v.url||""}`).join("\n\n");
          const primThumb=videos[0]?.thumbnail||null;
          if(primThumb) await sock.sendMessage(jid,{image:{url:primThumb},caption:`🔎 *YouTube: ${query}*\n\n${lista}`},{quoted:seloBot});
          else await sock.sendMessage(jid,{text:`🔎 *YouTube: ${query}*\n\n${lista}`},{quoted:seloBot});
          await reagir(sock,msg,"🔍"); return;
        }

        // ✅ TIKTOK via Scraper Hub + loading
        if(comando==="tiktok"){
          const url=args[0]; if(!url||!url.startsWith("http")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}tiktok* [link]`},{quoted:seloBot}); return;}
          let result=null;
          try{result=await barraCarregamento(sock,jid,seloBot,"A baixar TikTok...",()=>scraperTikTokVideo(url));}catch(e){console.log("❌ tiktok:",e.message);}
          if(!result){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}
          try{await sock.sendMessage(jid,{video:{url:result.url},caption:`📱 *${result.title||"TikTok"}*`},{quoted:seloBot}); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}
          return;
        }

        // ✅ TTSEARCH (TikTok Search)
        if(comando==="ttsearch"&&args.length>0){
          const query=args.join(" ");
          let loadMsg=null;
          try{loadMsg=await sock.sendMessage(jid,{text:`🔍 A pesquisar no TikTok: _${query}_\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{}
          const videos=await scraperTikTokSearch(query,5);
          if(loadMsg){try{await sock.sendMessage(jid,{text:`🔍 A pesquisar no TikTok: _${query}_\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}}
          await new Promise(r=>setTimeout(r,300));
          if(!videos.length){await sock.sendMessage(jid,{text:"❌ Nenhum resultado no TikTok."},{quoted:seloBot}); return;}

          // Tenta enviar como carousel nativo
          try{
            const cards=videos.slice(0,5).map(v=>({
              ...(v.thumbnail||v.cover?{image:{url:v.thumbnail||v.cover}}:{}),
              caption:`🎵 *${(v.title||v.desc||"TikTok").slice(0,50)}*\n👤 ${v.author||v.username||"N/A"}`,
              footer:`📱 TikTok • ${CONFIG.NOME_BOT}`,
              nativeFlow:[{text:"🎬 Baixar",url:v.video||v.url||v.link||"",useWebview:false}]
            }));
            await sock.sendMessage(jid,{text:`🔍 *TikTok: ${query}*`,footer:CONFIG.NOME_BOT,cards},{quoted:seloBot});
          }catch{
            const lista=videos.slice(0,5).map((v,i)=>`*${i+1}.* 🎵 ${(v.title||v.desc||"TikTok").slice(0,40)}\n   👤 ${v.author||"N/A"}\n   🔗 ${v.video||v.url||""}`).join("\n\n");
            await sock.sendMessage(jid,{text:`🔍 *TikTok: ${query}*\n\n${lista}`},{quoted:seloBot});
          }
          await reagir(sock,msg,"🔍"); return;
        }

        // ✅ TTTREND (TikTok Trending)
        if(comando==="tttrend"){
          let loadMsg=null;
          try{loadMsg=await sock.sendMessage(jid,{text:`🔥 A carregar trending TikTok...\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{}
          const videos=await scraperTikTokTrending("AO",5);
          if(loadMsg){try{await sock.sendMessage(jid,{text:`🔥 A carregar trending TikTok...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}}
          await new Promise(r=>setTimeout(r,300));
          if(!videos.length){await sock.sendMessage(jid,{text:"❌ Não consegui buscar trending."},{quoted:seloBot}); return;}
          const lista=videos.slice(0,5).map((v,i)=>`*${i+1}.* 🔥 ${(v.title||v.desc||"TikTok").slice(0,40)}\n   👤 ${v.author||"N/A"}\n   🔗 ${v.video||v.url||""}`).join("\n\n");
          await sock.sendMessage(jid,{text:`🔥 *TRENDING TIKTOK* 🇦🇴\n\n${lista}`},{quoted:seloBot});
          await reagir(sock,msg,"🔥"); return;
        }

        // ✅ TTUSER (TikTok User)
        if(comando==="ttuser"&&args.length>0){
          const username=args[0];
          let loadMsg=null;
          try{loadMsg=await sock.sendMessage(jid,{text:`👤 A buscar @${username}...\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{}
          const user=await scraperTikTokUser(username);
          if(loadMsg){try{await sock.sendMessage(jid,{text:`👤 A buscar @${username}...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}}
          await new Promise(r=>setTimeout(r,300));
          if(!user){await sock.sendMessage(jid,{text:`❌ Utilizador não encontrado: ${username}`},{quoted:seloBot}); return;}
          const texto_user=`┌─⊱ 『 📱 TIKTOK USER 』 ⊰─┐\n│\n◎ ─ 👤 *${user.nickname||user.nome||username}*\n◎ ─ 🔖 @${user.username||username}\n◎ ─ 👥 Seguidores: *${user.seguidores||0}*\n◎ ─ ➡️ Seguindo: *${user.seguindo||0}*\n◎ ─ ❤️ Likes: *${user.likes||0}*\n◎ ─ 🎬 Vídeos: *${user.videos||0}*\n│\n└──────────────────────────────⊰`;
          if(user.foto||user.avatar) await sock.sendMessage(jid,{image:{url:user.foto||user.avatar},caption:texto_user},{quoted:seloBot});
          else await sock.sendMessage(jid,{text:texto_user},{quoted:seloBot});
          await reagir(sock,msg,"📱"); return;
        }

        // ✅ PINTEREST com carousel
        if(comando==="pinterest"&&args.length>0){
          const query=args.join(" ");
          let loadMsg=null;
          try{loadMsg=await sock.sendMessage(jid,{text:`📌 A pesquisar Pinterest: _${query}_\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{}
          const pins=await scraperPinterestSearch(query,5,"image");
          if(loadMsg){try{await sock.sendMessage(jid,{text:`📌 A pesquisar Pinterest: _${query}_\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}}
          await new Promise(r=>setTimeout(r,300));
          if(!pins.length){await sock.sendMessage(jid,{text:"❌ Nenhuma imagem encontrada."},{quoted:seloBot}); return;}
          // Envia primeira imagem
          try{const url=typeof pins[0]==="string"?pins[0]:(pins[0].image_url||pins[0].url||pins[0].src||""); await sock.sendMessage(jid,{image:{url},caption:`📌 *Pinterest: ${query}*`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}
          return;
        }

        // ✅ PINVIDEO (Pinterest vídeo)
        if(comando==="pinvideo"&&args.length>0){
          const url=args[0];
          let result=null;
          try{result=await barraCarregamento(sock,jid,seloBot,"A baixar Pinterest vídeo...",()=>scraperPinterestPin(url));}catch(e){console.log("❌ pinvideo:",e.message);}
          if(!result){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); return;}
          const videoUrl=result.video||result.url||result.link;
          if(!videoUrl){await sock.sendMessage(jid,{text:"❌ Não encontrei vídeo nesse pin."},{quoted:seloBot}); return;}
          await sock.sendMessage(jid,{video:{url:videoUrl},caption:"📌 Pinterest"},{quoted:seloBot});
          await reagir(sock,msg,"✅"); return;
        }

        // Outros downloads com loading
        if(comando==="instagram"&&args.length>0){const url=args[0]; await reagir(sock,msg,"📸"); let r=null; try{r=await barraCarregamento(sock,jid,seloBot,"A baixar Instagram...",()=>dlRedeSocial(url));}catch(e){console.log("❌ ig:",e.message);} if(!r){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,r.filePath,"📸 Instagram",[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(r.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="twitter"&&args.length>0){const url=args[0]; await reagir(sock,msg,"🐦"); let r=null; try{r=await barraCarregamento(sock,jid,seloBot,"A baixar Twitter...",()=>dlRedeSocial(url));}catch(e){console.log("❌ tw:",e.message);} if(!r){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,r.filePath,"🐦 Twitter/X",[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(r.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="facebook"&&args.length>0){const url=args[0]; if(!url.includes("facebook.com")&&!url.includes("fb.watch")){await sock.sendMessage(jid,{text:"❌ Link inválido do Facebook."},{quoted:seloBot}); return;} await reagir(sock,msg,"📘"); let r=null; try{r=await barraCarregamento(sock,jid,seloBot,"A baixar Facebook...",()=>dlRedeSocial(url));}catch(e){console.log("❌ fb:",e.message);} if(!r){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,r.filePath,"📘 Facebook",[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(r.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="kwai"&&args.length>0){const url=args[0]; await reagir(sock,msg,"📹"); let r=null; try{r=await barraCarregamento(sock,jid,seloBot,"A baixar Kwai...",()=>dlRedeSocial(url));}catch(e){console.log("❌ kwai:",e.message);} if(!r){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,r.filePath,"📹 Kwai",[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(r.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="spotify"&&args.length>0){const entrada=args.join(" "); await reagir(sock,msg,"🟢"); let arq=null; try{arq=await barraCarregamento(sock,jid,seloBot,`A baixar Spotify: _${entrada.slice(0,40)}_`,()=>dlSpotify(entrada).then(r=>r.filePath));}catch(e){console.log("❌ spotify:",e.message);} if(!arq){await sock.sendMessage(jid,{text:`❌ Não encontrei.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarAudio(sock,jid,arq,seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="soundcloud"&&args.length>0){const entrada=args.join(" "); await reagir(sock,msg,"🔶"); let arq=null; try{arq=await barraCarregamento(sock,jid,seloBot,`A baixar SoundCloud...`,()=>dlSoundcloud(entrada).then(r=>r.filePath));}catch(e){console.log("❌ sc:",e.message);} if(!arq){await sock.sendMessage(jid,{text:`❌ Não encontrei.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarAudio(sock,jid,arq,seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="mediafire"&&args.length>0){const url=args[0]; if(!url.includes("mediafire.com")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}mediafire* [link do mediafire]`},{quoted:seloBot}); return;} await reagir(sock,msg,"📦"); try{const result=await dlMediafire(url); await sock.sendMessage(jid,{document:{url:result.url},fileName:result.title,mimetype:"application/octet-stream",caption:`📦 *${result.title}*`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="apk"&&args.length>0){const query=args.join(" "); await reagir(sock,msg,"📲"); try{const result=await dlApk(query); await sock.sendMessage(jid,{text:`📲 *APK*\n\n◎ ─ 🏷️ *${result.title}*\n◎ ─ 🔗 ${result.url}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="qr"){const dado=args.join(" "); if(!dado){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}qr* [texto/url]`},{quoted:seloBot}); return;} try{const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(dado)}&qzone=2&ecc=M`; await sock.sendMessage(jid,{image:{url:qrUrl},caption:`🔲 *QR CODE*`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="mostre"&&args.length>0){const query=args.join(" "); let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🔍 A buscar: _${query}_\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} const imageUrl=await buscarImagemInternet(query); if(loadMsg){try{await sock.sendMessage(jid,{text:`🔍 A buscar: _${query}_\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); if(!imageUrl){await sock.sendMessage(jid,{text:`❌ Não encontrei.`},{quoted:seloBot}); return;} await sock.sendMessage(jid,{image:{url:imageUrl},caption:`🖼️ *${query}*`},{quoted:seloBot}); await reagir(sock,msg,"✅"); return;}
        if(comando==="foto"&&args[0]){try{await sock.sendMessage(jid,{image:{url:args.join("")},caption:"📷"},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="doc"&&args[0]){try{const url=args.join(""),nome=decodeURIComponent(url.split("/").pop().split("?")[0])||"documento"; await sock.sendMessage(jid,{document:{url},fileName:nome,mimetype:"application/octet-stream",caption:"📄"},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="tourl"){const midia=await downloadQualquerMidia(msg); if(!midia){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}tourl* ↩️ responde mídia`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🔗 A gerar link...\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{} try{let url; if(midia.mime.startsWith("image/")&&!midia.mime.includes("webp")){try{url=await uploadParaTelegraph(midia.buffer);}catch{url=await uploadParaCatbox(midia.buffer,midia.nome,midia.mime);}}else{url=await uploadParaCatbox(midia.buffer,midia.nome,midia.mime);} if(loadMsg){try{await sock.sendMessage(jid,{text:`🔗 A gerar link...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`🔗 *Link gerado!*\n│\n◎ ─ 📎 *${midia.nome}*\n◎ ─ 🌐 ${url}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ Erro: ${e.message.slice(0,80)}`},{quoted:seloBot});} return;}

        // ─── FIGURINHAS ───
        if(comando==="sticker"){const quotedMsg=msg.message.extendedTextMessage?.contextInfo?.quotedMessage; const iM=quotedMsg?.imageMessage,vM=quotedMsg?.videoMessage; if(!iM&&!vM){await sock.sendMessage(jid,{text:`↩️ Responde imagem/vídeo com *${CONFIG.PREFIXO}sticker*`},{quoted:seloBot}); return;} const isAnim=!!vM; await sock.sendMessage(jid,{text:`🎭 A criar sticker...\n⏳`},{quoted:seloBot}); try{const buf=await downloadMediaMessage({message:quotedMsg,key:msg.key},"buffer",{}); const webpBuf=await criarSticker(buf,isAnim); await sock.sendMessage(jid,{sticker:webpBuf},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{try{const buf=await downloadMediaMessage({message:quotedMsg,key:msg.key},"buffer",{}); await sock.sendMessage(jid,{sticker:buf},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot}); await reagir(sock,msg,"❌");}} return;}
        if(comando==="sf"){const ctx=msg.message?.extendedTextMessage?.contextInfo,quotedMsg=ctx?.quotedMessage,stickerMsgD=msg.message?.stickerMessage,stickerMsgQ=quotedMsg?.stickerMessage,stickerMsg=stickerMsgD||stickerMsgQ; if(!stickerMsg){await sock.sendMessage(jid,{text:`↩️ Responde sticker com *${CONFIG.PREFIXO}sf*`},{quoted:seloBot}); return;} const isAnimated=stickerMsg.isAnimated||false; try{let buf; if(stickerMsgD) buf=await downloadMediaMessage(msg,"buffer",{}); else{const qm={key:{remoteJid:jid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:quotedMsg}; buf=await downloadMediaMessage(qm,"buffer",{});} if(!buf||buf.length<100) throw new Error("Sticker inválido"); const resultado=await stickerParaFoto(buf,isAnimated); if(resultado.isVideo) await sock.sendMessage(jid,{video:resultado.buffer,mimetype:"video/mp4",caption:`🎥 Convertido!`},{quoted:seloBot}); else await sock.sendMessage(jid,{image:resultado.buffer,caption:`🖼️ Convertido!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="brat"){
          const textoBrat=args.join(" ")||"brat";
          try{
            const url=`https://api.memegen.link/images/custom/~p${encodeURIComponent(textoBrat)}/_.jpg?background=d4c5a0&width=512&height=512`;
            const{data}=await axios.get(url,{responseType:"arraybuffer",timeout:15000,httpsAgent});
            const buf=await criarSticker(Buffer.from(data),false);
            await sock.sendMessage(jid,{sticker:buf},{quoted:seloBot});
            await reagir(sock,msg,"✅");
          }catch(e){await sock.sendMessage(jid,{text:`❌ Erro ao criar brat: ${e.message}`},{quoted:seloBot}); await reagir(sock,msg,"❌");}
          return;
        }
        if(comando==="figurinha"||comando==="figu"){const quantidade=Math.min(parseInt(args[0])||1,5); await reagir(sock,msg,"🎭"); const emojis=["😂","😍","🔥","💀","😭","🤣","😎","🥺","😤","💪"]; for(let i=0;i<quantidade;i++){try{const emoji=emojis[Math.floor(Math.random()*emojis.length)]; const url=`https://api.memegen.link/images/custom/~p${encodeURIComponent(emoji)}/_.png?width=512&height=512`; const{data}=await axios.get(url,{responseType:"arraybuffer",timeout:10000,httpsAgent}); const buf=await criarSticker(Buffer.from(data),false); await sock.sendMessage(jid,{sticker:buf},{quoted:seloBot}); await new Promise(r=>setTimeout(r,500));}catch{}} return;}

        // ─── BRINCADEIRAS / JOGOS ───
        if(comando==="piada"){try{const p=await chatIA("Cria uma piada curta e engraçada em português de Angola."); await sock.sendMessage(jid,{text:`😂 *PIADA*\n│\n${p}`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="conselho"&&args.length>0){const sit=args.join(" "); try{const resp=await chatIA(`Dá um conselho para: "${sit}".`); await sock.sendMessage(jid,{text:`💡 *CONSELHO*\n│\n${resp}`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="historia"){const tema=args.join(" ")||"Angola"; try{const h=await chatIA(`Escreve uma história curta sobre: "${tema}". Máx 200 palavras.`); await sock.sendMessage(jid,{text:`📖 *HISTÓRIA: ${tema}*\n│\n${h}`},{quoted:seloBot}); addXP(sender,5);}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="poema"){const tema=args.join(" ")||"Angola"; try{const p=await chatIA(`Escreve um poema de 4-8 versos sobre: "${tema}".`,"Poeta angolano."); await sock.sendMessage(jid,{text:`✍️ *POEMA: ${tema}*\n│\n${p}`},{quoted:seloBot}); addXP(sender,5);}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="perfil"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`↩️ Menciona alguém!`},{quoted:seloBot}); return;} const ehZoada=Math.random()<0.5,LISTA=ehZoada?PERFIS_ZOADA:PERFIS_ELOGIO; const desc=LISTA[Math.floor(Math.random()*LISTA.length)]; let ppAlvo=null; try{ppAlvo=await sock.profilePictureUrl(alvo,"image");}catch{} const textoFinal=`${ehZoada?"😂":"🌟"} ${desc}\n\n📱 +${alvo.split("@")[0]}`; if(ppAlvo) await sock.sendMessage(jid,{image:{url:ppAlvo},caption:textoFinal,mentions:[alvo]},{quoted:seloBot}); else await sock.sendMessage(jid,{text:textoFinal,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,ehZoada?"😂":"🌟"); return;}
        if(comando==="cara"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`↩️ Menciona alguém com *${CONFIG.PREFIXO}cara* @user`},{quoted:seloBot}); return;} const nota=Math.floor(Math.random()*10)+1; const emojis=nota>=8?"🔥😍":nota>=5?"😊👍":"😬💀"; await sock.sendMessage(jid,{text:`📊 *AVALIAÇÃO DE CARA*\n│\n👤 @${alvo.split("@")[0]}\n⭐ Nota: *${nota}/10* ${emojis}`,mentions:[alvo]},{quoted:seloBot}); return;}
        if(comando==="ship"){const a1=extrairJid(mencoes[0]),a2=extrairJid(mencoes[1]); if(!a1||!a2){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}ship* @user1 @user2`},{quoted:seloBot}); return;} const percent=Math.floor(Math.random()*100)+1; const barra=`${"💕".repeat(Math.floor(percent/10))}${"⬛".repeat(10-Math.floor(percent/10))}`; const comentario=percent>=80?"Perfeito para casal! 😍":percent>=60?"Muito compatíveis! 😊":percent>=40?"Pode funcionar! 🤔":"Hmmm... 😅"; await sock.sendMessage(jid,{text:`💘 *SHIP METER*\n│\n👤 @${a1.split("@")[0]} + @${a2.split("@")[0]}\n│\n${barra} *${percent}%*\n│\n💬 ${comentario}`,mentions:[a1,a2]},{quoted:seloBot}); return;}
        if(comando==="fofoca"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} try{const meta=await sock.groupMetadata(jid); const membros=meta.participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p)); if(membros.length<2){await sock.sendMessage(jid,{text:"❌ Poucos membros."},{quoted:seloBot}); return;} const a=membros[Math.floor(Math.random()*membros.length)]; const b=membros.filter(m=>m!==a)[Math.floor(Math.random()*(membros.length-1))]; const fofocas=[`Dizem que @${a.split("@")[0]} tem crush em @${b.split("@")[0]}! 😱`,`Alguém viu @${a.split("@")[0]} a fazer download às 3h da manhã... 🌚`,`@${a.split("@")[0]} apagou as mensagens antes de tu veres... 👀`,`Fontes confiáveis dizem que @${a.split("@")[0]} e @${b.split("@")[0]} têm segredos! 🤫`,`@${a.split("@")[0]} é o que finge não ler mas vê tudo! 😂`]; const fofoca=fofocas[Math.floor(Math.random()*fofocas.length)]; await sock.sendMessage(jid,{text:`📢 *FOFOCA DO GRUPO* 🗣️\n│\n${fofoca}`,mentions:[a,b]},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="denunciar"){const ctx3=msg.message?.extendedTextMessage?.contextInfo; if(!ctx3?.participant){await sock.sendMessage(jid,{text:`↩️ Responde mensagem com *${CONFIG.PREFIXO}denunciar [motivo]*`},{quoted:seloBot}); return;} try{const den=extrairJid(ctx3.participant),mot=args.join(" ")||"Sem motivo"; const meta=await sock.groupMetadata(jid); for(const a of meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p))){try{await sock.sendMessage(a,{text:`🚨 *DENÚNCIA!*\n│\n◎ ─ 👤 @${den.split("@")[0]}\n◎ ─ 📝 Motivo: ${mot}`,mentions:[den]});}catch{}} await sock.sendMessage(jid,{text:`✅ Denúncia enviada aos admins!`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}

        // ─── JOGOS ───
        if(["quiz","vof","completar","caca","guerra"].includes(comando)&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⚠️ Jogo activo! Usa *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); return;}
        if(comando==="quiz"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"quiz",categoria,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`🎮 *QUIZ* iniciado! ${categoria?`🎯 *${categoria.toUpperCase()}*`:"🎲 Variado"} | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"🎮"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="vof"){jogoLoop[jid]={tipo:"vof",categoria:null,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`✅❌ *V/F* iniciado! | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"❓"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="completar"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"completar",categoria,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`🔤 *COMPLETA* iniciado! ${categoria?`🎯 *${categoria.toUpperCase()}*`:"🎲 Variado"} | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"🔤"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="caca"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"caca",categoria,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`🔍 *CAÇA-PALAVRAS* iniciado! ${categoria?`🎯 *${categoria.toUpperCase()}*`:"🎲 Variado"} | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"🔍"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="guerra"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"guerra",categoria,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`⚔️ *FORCA* iniciado! ${categoria?`🎯 *${categoria.toUpperCase()}*`:"🎲 Variado"} | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"⚔️"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="stop"){if(jogoLoop[jid]&&jogoLoop[jid].activo){if(jogoLoop[jid].timeoutHandle) clearTimeout(jogoLoop[jid].timeoutHandle); const rodadas=jogoLoop[jid].rodada||0; delete jogoLoop[jid]; delete jogoAtivo[jid]; delete jogoAdivinhar[jid]; delete jogoVelocidade[jid]; await sock.sendMessage(jid,{text:`🛑 *Jogo parado!*\n📊 Rodadas: *${rodadas}*`},{quoted:seloBot}); await reagir(sock,msg,"🛑");}else{await sock.sendMessage(jid,{text:`❌ Não há jogo activo.`},{quoted:seloBot});} return;}
        if(comando==="rank"){const r=fs.readJsonSync(ARQUIVO_RANK); const n=sender.split("@")[0]; const d=r[n]||{xp:0,nivel:1,msgs:0}; const bar="█".repeat(Math.min(10,Math.floor((d.xp%100)/10)))+"░".repeat(10-Math.min(10,Math.floor((d.xp%100)/10))); await sock.sendMessage(jid,{text:`🏆 *RANK*\n│\n◎ ─ ⭐ Nível: *${d.nivel}*\n◎ ─ ✨ XP: *${d.xp}*\n◎ ─ 📊 [${bar}]\n◎ ─ 💬 Msgs: *${d.msgs}*`},{quoted:seloBot}); await reagir(sock,msg,"🏆"); return;}
        if(comando==="toprank"){const r=fs.readJsonSync(ARQUIVO_RANK); const medalhas=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]; const top=Object.entries(r).sort((a,b)=>b[1].xp-a[1].xp).slice(0,10).map(([n,d],i)=>`◎ ─ ${medalhas[i]} +${n} — Nv.*${d.nivel}* | *${d.xp}* XP`).join("\n"); await sock.sendMessage(jid,{text:`🏆 *TOP 10 XP*\n│\n${top||"◎ ─ _Sem dados_"}`},{quoted:seloBot}); await reagir(sock,msg,"🏆"); return;}

        // ─── NOVOS JOGOS ───
        if(comando==="matematica"){
          const desafio=MATEMATICA_BANCO();
          jogoAtivo[jid]={tipo:"matematica",r:desafio.resposta};
          const jM=await sock.sendMessage(jid,{text:`🧮 *DESAFIO MATEMÁTICO*\n✦ ─────────── ✦\n❓ Quanto é *${desafio.pergunta}*?\n\n⏰ 15s para responder!`},{quoted:seloBot});
          setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="matematica"){await sock.sendMessage(jid,{text:`⏰ Tempo!\nResposta: *${desafio.resposta}*`},{quoted:seloBot}); delete jogoAtivo[jid];}},15000);
          return;
        }

        if(comando==="jokenpo"){
          const opcoes=["pedra","papel","tesoura"];
          const bot=opcoes[Math.floor(Math.random()*3)];
          const user=args[0]?.toLowerCase();
          if(!["pedra","papel","tesoura"].includes(user)){await sock.sendMessage(jid,{text:`✊ *PEDRA/PAPEL/TESOURA*\n│\n◎ ─ *${CONFIG.PREFIXO}jokenpo* [pedra/papel/tesoura]`},{quoted:seloBot}); return;}
          let resultado;
          if(user===bot) resultado="🤝 *Empate!*";
          else if((user==="pedra"&&bot==="tesoura")||(user==="papel"&&bot==="pedra")||(user==="tesoura"&&bot==="papel")){resultado="🎉 *Ganhaste!*"; addXP(sender,20); addCoins(sender,10);}
          else{resultado="😅 *Bot ganhou!*";}
          await sock.sendMessage(jid,{text:`✊ *JOKENPO*\n│\n◎ ─ Tu: *${user}*\n◎ ─ Bot: *${bot}*\n│\n${resultado}`},{quoted:seloBot});
          await reagir(sock,msg,resultado.includes("Ganhaste")?"🎉":resultado.includes("Empate")?"🤝":"😅");
          return;
        }

        if(comando==="dado"){
          const lados=parseInt(args[0])||6;
          const resultado=Math.floor(Math.random()*lados)+1;
          const emojis=["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣"];
          await sock.sendMessage(jid,{text:`🎲 *DADO ${lados} LADOS*\n│\n◎ ─ Resultado: *${resultado}* ${lados<=6?emojis[resultado-1]||"":" "}`},{quoted:seloBot});
          await reagir(sock,msg,"🎲"); return;
        }

        if(comando==="cara-coroa"){
          const resultado=Math.random()<0.5?"CARA 😊":"COROA 👑";
          const escolha=args[0]?.toLowerCase();
          const choices=["cara","coroa"];
          let texto=`🪙 *CARA OU COROA*\n│\n◎ ─ Resultado: *${resultado}*`;
          if(escolha&&choices.includes(escolha)){
            const escolhaCerta=(escolha==="cara"&&resultado.includes("CARA"))||(escolha==="coroa"&&resultado.includes("COROA"));
            if(escolhaCerta){texto+=`\n│\n✅ *Acertaste!* +20 XP | +10 💰`; addXP(sender,20); addCoins(sender,10);}
            else{texto+=`\n│\n❌ *Erraste!*`;}
          }
          await sock.sendMessage(jid,{text:texto},{quoted:seloBot});
          await reagir(sock,msg,"🪙"); return;
        }

        if(comando==="adivinhar"){
          if(jogoAdivinhar[jid]){await sock.sendMessage(jid,{text:`🎯 Jogo já activo! Guess um número de 1-100.`},{quoted:seloBot}); return;}
          const numero=Math.floor(Math.random()*100)+1;
          const jM=await sock.sendMessage(jid,{text:`🎯 *ADIVINHAR NÚMERO*\n\n${FRAMES_LOADING[0]}\n_Pensa num número de 1 a 100..._\n\n_Começa a adivinhar!_`},{quoted:seloBot});
          jogoAdivinhar[jid]={numero,tentativas:0,msgKey:jM?.key};
          setTimeout(()=>{if(jogoAdivinhar[jid]&&jogoAdivinhar[jid].numero===numero){delete jogoAdivinhar[jid]; sock.sendMessage(jid,{text:`⏰ *Tempo esgotado!*\nEra o número *${numero}*!`},{quoted:seloBot});}},5*60*1000);
          return;
        }

        if(comando==="velocidade"){
          if(jogoVelocidade[jid]){await sock.sendMessage(jid,{text:`⚡ Jogo já activo!`},{quoted:seloBot}); return;}
          const palavra=PALAVRAS_VELOCIDADE[Math.floor(Math.random()*PALAVRAS_VELOCIDADE.length)];
          const jM=await sock.sendMessage(jid,{text:`⚡ *VELOCIDADE DE DIGITAÇÃO*\n│\n📝 Digita esta palavra o mais rápido possível:\n\n\`\`\`${palavra}\`\`\`\n\n⏰ Já!`},{quoted:seloBot});
          jogoVelocidade[jid]={palavra,inicio:Date.now(),msgKey:jM?.key};
          setTimeout(()=>{if(jogoVelocidade[jid]){delete jogoVelocidade[jid]; sock.sendMessage(jid,{text:`⏰ *Tempo esgotado!*\nPalavra era: *${palavra}*`},{quoted:seloBot});}},30000);
          return;
        }

        if(comando==="roleta"){
          // Roleta russa divertida (1 em 6 chances de "morrer")
          const cartuchos=6;
          const bala=Math.floor(Math.random()*cartuchos)+1;
          const disparo=bala===1;
          if(disparo){
            await sock.sendMessage(jid,{text:`🔫 *ROLETA RUSSA*\n│\n💀 *BANG!* @${sender.split("@")[0]} foi eliminado!\n_Espera 5 min para jogar de novo._`,mentions:[sender]},{quoted:seloBot});
            await reagir(sock,msg,"💀");
          }else{
            await sock.sendMessage(jid,{text:`🔫 *ROLETA RUSSA*\n│\n😅 *CLICK!* Sobreviveste! (${cartuchos-bala+1}/${cartuchos})\n🏆 +50 XP por coragem!`},{quoted:seloBot});
            addXP(sender,50); await reagir(sock,msg,"😅");
          }
          return;
        }

        if(comando==="aki"){
          const resposta=args[0]?.toLowerCase();
          if(!resposta||!["sim","nao","naosei","talvez"].includes(resposta.replace(/\s/g,""))){
            const jAki=await sock.sendMessage(jid,{text:`🎩 *AKINATOR*\n│\nEstou a pensar numa personalidade...\n│\nResponde: *sim* / *nao* / *naosei*\n│\n❓ Pergunta 1: É uma pessoa famosa?`},{quoted:seloBot});
            return;
          }
          // Simplificado: resposta aleatória do akinator
          const acertou=Math.random()<0.7;
          if(acertou){const personalidades=["Cristiano Ronaldo","Michael Jackson","Barack Obama","Lionel Messi","Elon Musk","Albert Einstein"]; const p=personalidades[Math.floor(Math.random()*personalidades.length)]; await sock.sendMessage(jid,{text:`🎩 *AKINATOR*\n│\n🎯 Acho que és... *${p}*?`},{quoted:seloBot});}
          else{await sock.sendMessage(jid,{text:`🎩 *AKINATOR*\n│\n😵 Não consigo adivinhar! Ganhaste! 🏆\n+100 XP`},{quoted:seloBot}); addXP(sender,100);}
          return;
        }

        if(comando==="aposta"&&args.length>0){
          const qtd=parseInt(args[0]);
          if(isNaN(qtd)||qtd<=0){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}aposta* [quantidade]`},{quoted:seloBot}); return;}
          const saldo=getCoins(sender);
          if(saldo<qtd){await sock.sendMessage(jid,{text:`❌ Saldo insuficiente!\n◎ ─ Tens: *${saldo}* 💰`},{quoted:seloBot}); return;}
          const resultado=Math.random()<0.5?"CARA 😊":"COROA 👑";
          const escolha=args[1]?.toLowerCase()||"cara";
          const ganhou=(escolha==="cara"&&resultado.includes("CARA"))||(escolha==="coroa"&&resultado.includes("COROA"));
          if(ganhou){addCoins(sender,qtd); await sock.sendMessage(jid,{text:`🎰 *APOSTA*\n│\n🪙 Resultado: *${resultado}*\n💰 Apostaste: *${qtd}*\n✅ *GANHASTE!* +${qtd} moedas!\n💰 Saldo: *${getCoins(sender)}*`},{quoted:seloBot}); await reagir(sock,msg,"🎉");}
          else{setCoins(sender,saldo-qtd); await sock.sendMessage(jid,{text:`🎰 *APOSTA*\n│\n🪙 Resultado: *${resultado}*\n💰 Apostaste: *${qtd}*\n❌ *PERDESTE!* -${qtd} moedas!\n💰 Saldo: *${getCoins(sender)}*`},{quoted:seloBot}); await reagir(sock,msg,"😭");}
          return;
        }

        // ─── COINS ───
        if(comando==="moedas"){const moedasUser=getCoins(sender); const nomeUser=sender.split("@")[0]; await sock.sendMessage(jid,{text:`💰 *MOEDAS*\n│\n◎ ─ 👤 *${nomeUser}*\n◎ ─ 💰 Saldo: *${moedasUser}*\n│\n◎ ─ 🎁 *${CONFIG.PREFIXO}diario* → +100 diário\n◎ ─ 💸 *${CONFIG.PREFIXO}dar* @user qtd`},{quoted:seloBot}); await reagir(sock,msg,"💰"); return;}
        if(comando==="diario"){const agora=Date.now(); const ultimoDiario=getCooldown(sender,"diario"); const COOLDOWN_DIARIO=24*60*60*1000; if(agora-ultimoDiario<COOLDOWN_DIARIO){const restante=Math.ceil((COOLDOWN_DIARIO-(agora-ultimoDiario))/3600000); await sock.sendMessage(jid,{text:`⏰ Já coletaste hoje!\n◎ ─ Volta em *${restante}h*`},{quoted:seloBot}); return;} const ganho=100+Math.floor(Math.random()*50); addCoins(sender,ganho); setCooldown(sender,"diario"); await sock.sendMessage(jid,{text:`🎁 *RECOMPENSA DIÁRIA*\n│\n◎ ─ 🎉 +*${ganho}* moedas!\n◎ ─ 💰 Total: *${getCoins(sender)}*\n│\n◎ ─ _Volta amanhã!_`},{quoted:seloBot}); await reagir(sock,msg,"🎁"); return;}
        if(comando==="dar"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}dar* @user [quantidade]`},{quoted:seloBot}); return;} const quantidade=parseInt(args[args.length-1])||0; if(quantidade<=0){await sock.sendMessage(jid,{text:`❌ Quantidade inválida.`},{quoted:seloBot}); return;} if(getCoins(sender)<quantidade){await sock.sendMessage(jid,{text:`❌ Saldo insuficiente!\n◎ ─ Tens: *${getCoins(sender)}* 💰`},{quoted:seloBot}); return;} setCoins(sender,getCoins(sender)-quantidade); addCoins(alvo,quantidade); await sock.sendMessage(jid,{text:`✅ Enviaste *${quantidade}* 💰 para @${alvo.split("@")[0]}!`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"💸"); return;}
        if(comando==="roubar"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}roubar* @user`},{quoted:seloBot}); return;} if(alvo===sender){await sock.sendMessage(jid,{text:`❌ Não podes roubar a ti mesmo!`},{quoted:seloBot}); return;} const moedasAlvo=getCoins(alvo); if(moedasAlvo<=0){await sock.sendMessage(jid,{text:`❌ @${alvo.split("@")[0]} não tem moedas!`,mentions:[alvo]},{quoted:seloBot}); return;} const sucesso=Math.random()>0.5; if(sucesso){const roubado=Math.min(Math.floor(moedasAlvo*0.1)+Math.floor(Math.random()*20),moedasAlvo); setCoins(alvo,moedasAlvo-roubado); addCoins(sender,roubado); await sock.sendMessage(jid,{text:`🦹 *ROUBO!*\n│\n◎ ─ Roubaste *${roubado}* 💰 de @${alvo.split("@")[0]}!\n◎ ─ Saldo: *${getCoins(sender)}*`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"🦹");}else{const perda=Math.floor(getCoins(sender)*0.05)+10; setCoins(sender,Math.max(0,getCoins(sender)-perda)); await sock.sendMessage(jid,{text:`👮 *ROUBO FALHADO!*\n│\n◎ ─ Foste apanhado! Perdeste *${perda}* 💰\n◎ ─ Saldo: *${getCoins(sender)}*`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"👮");} return;}
        if(comando==="topcoins"){try{const c=fs.readJsonSync(ARQUIVO_COINS); const medalhas=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]; const top=Object.entries(c).sort((a,b)=>(b[1].moedas||0)-(a[1].moedas||0)).slice(0,10).map(([n,d],i)=>`◎ ─ ${medalhas[i]} +${n.split("@")[0].split(":")[0]} — *${d.moedas||0}* 💰`).join("\n"); await sock.sendMessage(jid,{text:`💰 *TOP 10 RICOS*\n│\n${top||"◎ ─ _Sem dados_"}`},{quoted:seloBot}); await reagir(sock,msg,"💰");}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}

        // ─── ALTERADORES / IA ───
        if(comando==="vz"){const ctxVz=msg.message?.extendedTextMessage?.contextInfo,quotedVz=ctxVz?.quotedMessage; let textoParaFalar=""; if(quotedVz) textoParaFalar=quotedVz.conversation||quotedVz.extendedTextMessage?.text||""; if(!textoParaFalar&&args.length>0) textoParaFalar=args.join(" "); if(!textoParaFalar){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}vz* [texto] ou responde mensagem`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🔊 A converter para voz...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const audioPath=await textoParaFala(textoParaFalar); if(loadMsg){try{await sock.sendMessage(jid,{text:`🔊 A converter para voz...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await enviarAudio(sock,jid,audioPath,seloBot); try{fs.removeSync(audioPath);}catch{} await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="shazam"){await executarReconhecimentoMusica(sock,jid,msg,sender,true,seloBot); return;}
        if(comando==="busca"){await executarReconhecimentoMusica(sock,jid,msg,sender,false,seloBot); return;}
        if(comando==="transcrever"||comando==="audiotexto"){const d=await downloadAudioDaMensagem(msg); if(!d){await sock.sendMessage(jid,{text:`↩️ Responde áudio com *${CONFIG.PREFIXO}transcrever*`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`📝 A transcrever...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const t=await transcreverComGroq(d.buffer); if(loadMsg){try{await sock.sendMessage(jid,{text:`📝 A transcrever...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`📝 *TRANSCRIÇÃO*\n│\n${t}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="resumiraudio"){const d=await downloadAudioDaMensagem(msg); if(!d){await sock.sendMessage(jid,{text:`↩️ Responde áudio com *${CONFIG.PREFIXO}resumiraudio*`},{quoted:seloBot}); return;} try{const t=await transcreverComGroq(d.buffer); const r=await chatIA(`Resume: "${t}"`); await sock.sendMessage(jid,{text:`🎙️ *RESUMO DO ÁUDIO*\n│\n${r}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="traduziraudio"){const idioma=args[0]||"português"; const d=await downloadAudioDaMensagem(msg); if(!d){await sock.sendMessage(jid,{text:`↩️ Responde áudio com *${CONFIG.PREFIXO}traduziraudio [idioma]*`},{quoted:seloBot}); return;} try{const t=await transcreverComGroq(d.buffer); const tr=await chatIA(`Traduz para ${idioma}: "${t}"`); await sock.sendMessage(jid,{text:`🌍 *TRADUÇÃO DO ÁUDIO*\n│\n${tr}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="audioparaia"){const d=await downloadAudioDaMensagem(msg); if(!d){await sock.sendMessage(jid,{text:`↩️ Responde áudio com *${CONFIG.PREFIXO}audioparaia*`},{quoted:seloBot}); return;} try{const t=await transcreverComGroq(d.buffer); const r=await chatIA(t); await sock.sendMessage(jid,{text:`🧠 *IA + ÁUDIO*\n│\n${r}`},{quoted:seloBot}); await reagir(sock,msg,"🧠");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}

        if(comando==="ia"&&args.length>0){
          const pergunta=args.join(" ");
          let loadMsg=null;
          try{loadMsg=await sock.sendMessage(jid,{text:`🧠 A processar...\n\n${FRAMES_LOADING[1]}`},{quoted:seloBot});}catch{}
          try{
            const resp=await chatIA(pergunta);
            if(loadMsg){try{await sock.sendMessage(jid,{text:`🧠 A processar...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}}
            await new Promise(r=>setTimeout(r,300));
            await sock.sendMessage(jid,{text:`🧠 *IA*\n│\n${resp}`},{quoted:seloBot});
            await reagir(sock,msg,"🧠");
          }catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});}
          return;
        }
        if(comando==="resumir"){const ctx2=msg.message?.extendedTextMessage?.contextInfo; const msgC=ctx2?.quotedMessage?.conversation||ctx2?.quotedMessage?.extendedTextMessage?.text||""; if(!msgC){await sock.sendMessage(jid,{text:`↩️ Responde mensagem com *${CONFIG.PREFIXO}resumir*`},{quoted:seloBot}); return;} try{const resp=await chatIA(`Resume em poucas frases: "${msgC}"`); await sock.sendMessage(jid,{text:`📝 *RESUMO*\n│\n${resp}`},{quoted:seloBot}); await reagir(sock,msg,"📝");}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="traduzir"&&args.length>1){const idioma=args[0],textT=args.slice(1).join(" "); try{const resp=await chatIA(`Traduz para ${idioma}: "${textT}"`); await sock.sendMessage(jid,{text:`🌍 *TRADUÇÃO*\n│\n${resp}`},{quoted:seloBot}); await reagir(sock,msg,"🌍");}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="fotocopia"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}fotocopia*`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🖼️ A ler texto...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const t=await analisarImagem(imgBuf,"Lê e transcreve TODO o texto visível. Em português."); if(loadMsg){try{await sock.sendMessage(jid,{text:`🖼️ A ler texto...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`📄 *TEXTO EXTRAÍDO*\n│\n${t}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="fotoparaia"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}fotoparaia [pergunta]*`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🖼️ A analisar...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const instrucao=args.join(" ")?`Responde: "${args.join(" ")}". Em português.`:"Descreve detalhadamente. Em português."; const resp=await analisarImagem(imgBuf,instrucao); if(loadMsg){try{await sock.sendMessage(jid,{text:`🖼️ A analisar...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`🧠 *IA + IMAGEM*\n│\n${resp}`},{quoted:seloBot}); await reagir(sock,msg,"🧠");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="resumirfoto"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}resumirfoto*`},{quoted:seloBot}); return;} try{const resumo=await analisarImagem(imgBuf,"Faz um resumo objetivo. Em português."); await sock.sendMessage(jid,{text:`📝 *RESUMO DA IMAGEM*\n│\n${resumo}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="traduzirfoto"){const idioma=args[0]||"português"; const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}traduzirfoto [idioma]*`},{quoted:seloBot}); return;} try{const resultado=await analisarImagem(imgBuf,`Lê e traduz para ${idioma}.`); await sock.sendMessage(jid,{text:`🌍 *TRADUÇÃO DA IMAGEM*\n│\n${resultado}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="editar"){const instrucao=args.join(" ").trim(); if(!instrucao){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}editar* [instrução] ↩️ imagem`},{quoted:seloBot}); return;} const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde uma *imagem* com *${CONFIG.PREFIXO}editar [instrução]*`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🎨 A editar com IA...\n💡 _${instrucao}_\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const descricao=await analisarImagem(imgBuf,`Descreve a imagem para poder ser editada com: "${instrucao}". Em português.`); if(loadMsg){try{await sock.sendMessage(jid,{text:`🎨 A editar com IA...\n💡 _${instrucao}_\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`🎨 *ANÁLISE PARA EDIÇÃO*\n│\n💡 _${instrucao}_\n│\n${descricao}\n│\n⚠️ _Para edição real, usa uma API de geração._`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message.slice(0,100)}`},{quoted:seloBot}); await reagir(sock,msg,"❌");} return;}

        // ─── LOGOS / UTILIDADES ───
        if(comando==="meme"){const partes=args.join(" ").split("|"); if(partes.length<2){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}meme* [texto1|texto2]`},{quoted:seloBot}); return;} try{const url=`https://api.memegen.link/images/drake/${encodeURIComponent(partes[0].trim())}/${encodeURIComponent(partes[1].trim())}.jpg?width=512`; await sock.sendMessage(jid,{image:{url},caption:`😂 *MEME*`},{quoted:seloBot}); await reagir(sock,msg,"😂");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="logo"){const textoLogo=args.join(" ").trim(); if(!textoLogo){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}logo* [texto]`},{quoted:seloBot}); return;} try{const url=`https://api.memegen.link/images/custom/${encodeURIComponent(textoLogo)}/_.jpg?background=000000&width=512&height=256`; await sock.sendMessage(jid,{image:{url},caption:`🎨 *LOGO: ${textoLogo}*`},{quoted:seloBot}); await reagir(sock,msg,"🎨");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="card"){const textoCard=args.join(" ").trim(); if(!textoCard){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}card* [texto]`},{quoted:seloBot}); return;} try{const nomeUser=sender.split("@")[0].split(":")[0]; const url=`https://api.memegen.link/images/buzz/${encodeURIComponent(textoCard)}/${encodeURIComponent("@"+nomeUser)}.jpg?width=512`; await sock.sendMessage(jid,{image:{url},caption:`🃏 *CARD*`},{quoted:seloBot}); await reagir(sock,msg,"🃏");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="calc"){const expr=args.join(" "); if(!expr){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}calc* [expressão]`},{quoted:seloBot}); return;} try{const resultado=calcularSeguro(expr); await sock.sendMessage(jid,{text:`🔢 *${expr}* = *${resultado}*`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:`❌ Expressão inválida!`},{quoted:seloBot});} return;}
        if(comando==="encurtar"){const url=args[0]; if(!url||!url.startsWith("http")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}encurtar* [url]`},{quoted:seloBot}); return;} try{const{data}=await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,{timeout:10000,httpsAgent}); const urlE=String(data).trim(); if(!urlE.startsWith("http")) throw new Error("Falha"); await sock.sendMessage(jid,{text:`🔗 *Link encurtado:*\n${urlE}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="cotacao"){let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`💱 A buscar cotações...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const resp=await chatIA("Dá cotações actuais do Kwanza (AOA) para USD, EUR, BRL. Formato curto e directo.","Sê direto."); if(loadMsg){try{await sock.sendMessage(jid,{text:`💱 A buscar cotações...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`💱 *COTAÇÕES KWANZA*\n│\n${resp.split("\n").map(l=>`◎ ─ ${l}`).join("\n")}`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="tempo"){if(!args[0]){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}tempo* [cidade]`},{quoted:seloBot}); return;} const local=args.join(" "); let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🌤️ A buscar tempo em ${local}...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const res=await axios.get(`https://wttr.in/${encodeURIComponent(local)}?format=j1`,{timeout:10000,httpsAgent}); const cur=res.data.current_condition[0]; if(loadMsg){try{await sock.sendMessage(jid,{text:`🌤️ A buscar tempo em ${local}...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`🌤️ *${local.toUpperCase()}*\n│\n◎ ─ 🌡️ *${cur.temp_C}°C*\n◎ ─ ☁️ ${cur.weatherDesc[0].value}\n◎ ─ 💧 ${cur.humidity}%\n◎ ─ 💨 ${cur.windspeedKmph}km/h`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:`❌ Cidade não encontrada.`},{quoted:seloBot});} return;}
        if(comando==="horario"){const agora=new Date(); const opc=(tz)=>({timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false}); await sock.sendMessage(jid,{text:`🕐 *HORÁRIO MUNDIAL*\n│\n◎ ─ 🇦🇴 Angola: *${agora.toLocaleTimeString("pt-AO",opc("Africa/Luanda"))}*\n◎ ─ 🇧🇷 Brasil: *${agora.toLocaleTimeString("pt-BR",opc("America/Sao_Paulo"))}*\n◎ ─ 🇵🇹 Portugal: *${agora.toLocaleTimeString("pt-PT",opc("Europe/Lisbon"))}*\n◎ ─ 🇺🇸 EUA: *${agora.toLocaleTimeString("en-US",opc("America/New_York"))}*`},{quoted:seloBot}); return;}
        if(comando==="ver"){const ctx=msg.message?.extendedTextMessage?.contextInfo; const stanzaId=ctx?.stanzaId; if(!ctx||!stanzaId){await sock.sendMessage(jid,{text:`↩️ Responde view-once com *${CONFIG.PREFIXO}ver*`},{quoted:seloBot}); return;} const quemEnviou=ctx.participant?`@${ctx.participant.split("@")[0].split(":")[0]}`:"alguém"; const mentions=ctx.participant?[ctx.participant]:[]; const cached=cacheViewOnce[jid]?.[stanzaId]; if(cached){try{if(cached.tipo==="video") await sock.sendMessage(jid,{video:cached.buf,caption:`🔓 De: ${quemEnviou}`,mentions},{quoted:seloBot}); else if(cached.tipo==="audio"){await sock.sendMessage(jid,{audio:cached.buf,mimetype:"audio/ogg; codecs=opus",ptt:false},{quoted:seloBot});}else await sock.sendMessage(jid,{image:cached.buf,caption:`🔓 De: ${quemEnviou}`,mentions},{quoted:seloBot}); await reagir(sock,msg,"🔓"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;} const qMsg=ctx.quotedMessage; if(qMsg){let innerMsg=null; for(const key of["viewOnceMessage","viewOnceMessageV2","viewOnceMessageV2Extension"]){if(qMsg[key]?.message){innerMsg=qMsg[key].message; break;}} if(innerMsg){try{const fakeMsg={key:{remoteJid:jid,id:stanzaId,participant:ctx.participant||"",fromMe:false},message:innerMsg}; const buf=await downloadMediaMessage(fakeMsg,"buffer",{}); if(innerMsg.imageMessage) await sock.sendMessage(jid,{image:buf,caption:`🔓 De: ${quemEnviou}`,mentions},{quoted:seloBot}); else if(innerMsg.videoMessage) await sock.sendMessage(jid,{video:buf,caption:`🔓 De: ${quemEnviou}`,mentions},{quoted:seloBot}); else if(innerMsg.audioMessage||innerMsg.pttMessage) await sock.sendMessage(jid,{audio:buf,mimetype:"audio/ogg; codecs=opus",ptt:false},{quoted:seloBot}); await reagir(sock,msg,"🔓"); addXP(sender,5);}catch{await sock.sendMessage(jid,{text:`❌ Expirada.`},{quoted:seloBot}); await reagir(sock,msg,"❌");} return;}} await sock.sendMessage(jid,{text:`❌ Não encontrei no cache.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}
        if(comando==="apagadas"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} const lista=msgApagadas[jid]||[]; if(!lista.length){await sock.sendMessage(jid,{text:`📭 Nenhuma mensagem apagada detectada.`},{quoted:seloBot}); return;} const ultimas=lista.slice(-10).reverse(); const textoLista=ultimas.map(m=>{const hora=new Date(m.apagadoEm).toLocaleTimeString("pt-AO",{timeZone:"Africa/Luanda",hour:"2-digit",minute:"2-digit"}); return `◎ ─ +${m.sender?.split("@")[0]||"?"} 🕐 ${hora}\n   ${m.texto?`_"${m.texto.slice(0,60)}"_`:`_(${m.tipo})_`}`;}).join("\n│\n"); await sock.sendMessage(jid,{text:`🕵️ *MSGS APAGADAS*\n│\n${textoLista}`},{quoted:seloBot}); return;}
        if(comando==="placar"){const busca=args.join(" ").trim(); if(!busca){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}placar* [equipa/jogo]`},{quoted:seloBot}); return;} try{const resp=await chatIA(`Dá o último resultado/placar de: "${busca}". Formato: Equipa A X - X Equipa B.`,"Sê direto."); await sock.sendMessage(jid,{text:`⚽ *PLACAR: ${busca}*\n│\n${resp}`},{quoted:seloBot}); await reagir(sock,msg,"⚽");}catch{await sock.sendMessage(jid,{text:`❌ Não encontrei.`},{quoted:seloBot});} return;}

        // ─── +18 VIP ───
        if(comando==="piada18"){const p=await chatIA("Conta uma piada adulta (+18) engraçada e criativa em português. Sem ser ofensiva demais.","Humorista adulto."); await sock.sendMessage(jid,{text:`🔞 *PIADA +18*\n│\n${p}`},{quoted:seloBot}); return;}
        if(comando==="truth"){const t=VERDADES_18[Math.floor(Math.random()*VERDADES_18.length)]; await sock.sendMessage(jid,{text:`🎯 *TRUTH (Verdade)*\n│\n❓ ${t}`},{quoted:seloBot}); return;}
        if(comando==="dare"){const d=DESAFIOS_18[Math.floor(Math.random()*DESAFIOS_18.length)]; await sock.sendMessage(jid,{text:`🎲 *DARE (Desafio)*\n│\n🔥 ${d}`},{quoted:seloBot}); return;}
        if(comando==="crush"){const membros=isGrupo?(await sock.groupMetadata(jid).catch(()=>({participants:[]}))).participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p)).filter(m=>m!==sender):[]; const alvo=membros.length>0?membros[Math.floor(Math.random()*membros.length)]:null; await sock.sendMessage(jid,{text:`💘 *CRUSH DO GRUPO*\n│\n${alvo?`◎ ─ O teu crush secreto é @${alvo.split("@")[0]}! 😍`:"◎ ─ Não há membros suficientes!"}`,mentions:alvo?[alvo]:[]},{quoted:seloBot}); return;}
        if(["seduzir","beijo","abraco","tapa","flirt","casal"].includes(comando)){
          const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);
          if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}${comando}* @user`},{quoted:seloBot}); return;}
          const emojisAcao={seduzir:"😏",beijo:"😘",abraco:"🤗",tapa:"👋",flirt:"💋",casal:"💑"};
          const frasesAcao={
            seduzir:[`😏 @${sender.split("@")[0]} está a seduzir @${alvo.split("@")[0]}! 🔥`,`💫 Alguém está com interesse em @${alvo.split("@")[0]}... 😏`],
            beijo:[`😘 @${sender.split("@")[0]} deu um beijo em @${alvo.split("@")[0]}! 💋`,`💋 Que cena! @${sender.split("@")[0]} e @${alvo.split("@")[0]}! 😳`],
            abraco:[`🤗 @${sender.split("@")[0]} deu um abraço carinhoso a @${alvo.split("@")[0]}! ❤️`,`💞 Que fofura! @${sender.split("@")[0]} abraçou @${alvo.split("@")[0]}!`],
            tapa:[`👋 @${sender.split("@")[0]} deu um tapa em @${alvo.split("@")[0]}! 💥`,`😤 @${alvo.split("@")[0]} apanhou um tapa de @${sender.split("@")[0]}! 😂`],
            flirt:[`💋 @${sender.split("@")[0]} está a flirtar com @${alvo.split("@")[0]}! 😍`,`💘 Alguém está interessado! @${sender.split("@")[0]} e @${alvo.split("@")[0]}! 🥰`],
            casal:[`💑 @${sender.split("@")[0]} e @${alvo.split("@")[0]} estão juntos! ❤️`,`💕 Novo casal no grupo! @${sender.split("@")[0]} + @${alvo.split("@")[0]}! 🎉`],
          };
          const frases=frasesAcao[comando]||[`${emojisAcao[comando]} @${sender.split("@")[0]} → @${alvo.split("@")[0]}`];
          const frase=frases[Math.floor(Math.random()*frases.length)];
          await sock.sendMessage(jid,{text:frase,mentions:[sender,alvo]},{quoted:seloBot});
          await reagir(sock,msg,emojisAcao[comando]||"💕");
          return;
        }

        // ─── ADMINISTRAÇÃO ───
        if(comando==="bloq"){comandosBloqueados.add(jid); await sock.sendMessage(jid,{text:`🔒 *Comandos bloqueados!*`},{quoted:seloBot}); await reagir(sock,msg,"🔒"); return;}
        if(comando==="desbloq"){comandosBloqueados.delete(jid); await sock.sendMessage(jid,{text:`🔓 *Comandos desbloqueados!*`},{quoted:seloBot}); await reagir(sock,msg,"🔓"); return;}
        if(comando==="bot"){const op=args.join(" ").toLowerCase(); if(op.includes("off")){chatsDesativados.add(jid); await sock.sendMessage(jid,{text:`🔴 *BOT OFF!*`},{quoted:seloBot});}else if(op.includes("on")||op.includes("la")||op.includes("djum")){chatsDesativados.delete(jid); await sock.sendMessage(jid,{text:`✅ *BOT ON!* 🤴🏽`},{quoted:seloBot});} return;}
        if(comando==="anti-link"){const op=args[0]?.toLowerCase(); if(op==="off"){antiLinkDesativado.add(jid); await sock.sendMessage(jid,{text:`⚠️ *Anti-link DESACTIVADO!*`},{quoted:seloBot});}else{antiLinkDesativado.delete(jid); await sock.sendMessage(jid,{text:`✅ *Anti-link ACTIVADO!*`},{quoted:seloBot});} return;}
        if(comando==="vozbot"){const op=args[0]?.toLowerCase(); if(op==="off"){vozBotDesativado.add(jid); await sock.sendMessage(jid,{text:`🔇 *Voz desactivada!*`},{quoted:seloBot});}else if(op==="on"){vozBotDesativado.delete(jid); await sock.sendMessage(jid,{text:`🎙️ *Voz activada!*`},{quoted:seloBot});}else{await sock.sendMessage(jid,{text:`🎙️ Estado: ${vozBotDesativado.has(jid)?"🔇 OFF":"🟢 ON"}\n*${CONFIG.PREFIXO}vozbot on/off*`},{quoted:seloBot});} await reagir(sock,msg,"✅"); return;}
        if(comando==="silenciar"&&isGrupo){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`↩️ Responde com *${CONFIG.PREFIXO}silenciar*`},{quoted:seloBot}); return;} if(!membrosSilenciados[jid]) membrosSilenciados[jid]=[]; if(!membrosSilenciados[jid].includes(alvo)){membrosSilenciados[jid].push(alvo); salvarSilenciados();} await sock.sendMessage(jid,{text:`🔇 @${alvo.split("@")[0]} silenciado!`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"🔇"); return;}
        if(comando==="dessilenciar"&&isGrupo){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`↩️ Responde com *${CONFIG.PREFIXO}dessilenciar*`},{quoted:seloBot}); return;} if(membrosSilenciados[jid]){membrosSilenciados[jid]=membrosSilenciados[jid].filter(m=>m!==alvo); salvarSilenciados();} await sock.sendMessage(jid,{text:`🔊 @${alvo.split("@")[0]} dessilenciado!`,mentions:[alvo]},{quoted:seloBot}); return;}
        if(comando==="silenciados"&&isGrupo){const lista=membrosSilenciados[jid]||[]; if(!lista.length) await sock.sendMessage(jid,{text:`🔊 Nenhum silenciado.`},{quoted:seloBot}); else await sock.sendMessage(jid,{text:`🔇 *Silenciados:*\n${lista.map((m,i)=>`${i+1}. @${m.split("@")[0]}`).join("\n")}`},{quoted:seloBot}); return;}
        if(comando==="nomegrupo"&&isGrupo){const novoNome=args.join(" ").trim(); if(!novoNome){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}nomegrupo [nome]*`},{quoted:seloBot}); return;} try{await sock.groupUpdateSubject(jid,novoNome); await sock.sendMessage(jid,{text:`✅ Nome alterado: *${novoNome}*`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="descgrupo"&&isGrupo){const novaDesc=args.join(" ").trim(); if(!novaDesc){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}descgrupo [desc]*`},{quoted:seloBot}); return;} try{await sock.groupUpdateDescription(jid,novaDesc); await sock.sendMessage(jid,{text:`✅ Descrição actualizada!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="fotogrupo"&&isGrupo){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}fotogrupo*`},{quoted:seloBot}); return;} try{await sock.updateProfilePicture(jid,imgBuf); await sock.sendMessage(jid,{text:`✅ Foto do grupo actualizada!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="add"&&isGrupo){if(!args[0]){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}add [número]*`},{quoted:seloBot}); return;} let numero=args[0].replace(/[^\d]/g,""); if(numero.startsWith("00")) numero=numero.slice(2); if(numero.startsWith("244")&&numero.length===12){}else if(numero.length===9) numero=`244${numero}`; else if(numero.startsWith("0")&&numero.length===10) numero=`244${numero.slice(1)}`; await sock.sendMessage(jid,{text:`📱 A adicionar +${numero}...\n⏳`},{quoted:seloBot}); try{const result=await sock.groupParticipantsUpdate(jid,[`${numero}@s.whatsapp.net`],"add"); const status=result?.[0]?.status; if(status===200){await sock.sendMessage(jid,{text:`✅ +${numero} adicionado!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}else if(status===408){await sock.sendMessage(jid,{text:`❌ Sem WhatsApp.`},{quoted:seloBot});}else if(status===403){await sock.sendMessage(jid,{text:`⚠️ Não permite adição.`},{quoted:seloBot});}else{await reagir(sock,msg,"✅");}}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="banir"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant); if(!alvo){await sock.sendMessage(jid,{text:"↩️ Responde a mensagem."},{quoted:seloBot}); return;} try{await sock.groupParticipantsUpdate(jid,[alvo],"remove"); await sock.sendMessage(jid,{text:`✅ @${alvo.split("@")[0]} BANIDO! 🔨`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"🔨");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="addadmin"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant); if(!alvo){await sock.sendMessage(jid,{text:"↩️ Responde a mensagem."},{quoted:seloBot}); return;} try{await sock.groupParticipantsUpdate(jid,[alvo],"promote"); await sock.sendMessage(jid,{text:`👑 @${alvo.split("@")[0]} é agora admin!`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"👑");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="removeadmin"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant); if(!alvo){await sock.sendMessage(jid,{text:"↩️ Responde a mensagem."},{quoted:seloBot}); return;} try{await sock.groupParticipantsUpdate(jid,[alvo],"demote"); await sock.sendMessage(jid,{text:`✅ Admin removido!`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="fechar"&&isGrupo){try{await sock.groupSettingUpdate(jid,"announcement"); await sock.sendMessage(jid,{text:"🔒 *Grupo fechado!*"},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="abrir"&&isGrupo){try{await sock.groupSettingUpdate(jid,"not_announcement"); await sock.sendMessage(jid,{text:"🔓 *Grupo aberto!*"},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="all"&&isGrupo){try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📢 *ATENÇÃO A TODOS!*\n\n${todos.map(p=>`@${p.split("@")[0]}`).join(" ")}`,mentions:todos},{quoted:seloBot}); await reagir(sock,msg,"📢");}catch{} return;}
        if(comando==="att"&&isGrupo){try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📣${todos.map(()=>"\u200B").join("")}`,mentions:todos},{quoted:seloBot}); await reagir(sock,msg,"📣");}catch{} return;}
        if(comando==="aviso"&&isGrupo){const avisoTxt=args.join(" "); if(!avisoTxt){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}aviso* [mensagem]`},{quoted:seloBot}); return;} try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📢 *AVISO!*\n✦ ─────────── ✦\n\n${avisoTxt}\n\n${todos.map(p=>`@${p.split("@")[0]}`).join(" ")}`,mentions:todos},{quoted:seloBot}); await reagir(sock,msg,"📢");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="link"&&isGrupo){try{const codigo=await sock.groupInviteCode(jid); await sock.sendMessage(jid,{text:`🔗 *LINK DO GRUPO*\n│\nhttps://chat.whatsapp.com/${codigo}`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="sorteio"&&isGrupo){try{const meta=await sock.groupMetadata(jid),membros=meta.participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p)); if(!membros.length){await sock.sendMessage(jid,{text:"❌ Sem membros para sortear."},{quoted:seloBot}); return;} const vencedor=membros[Math.floor(Math.random()*membros.length)]; await sock.sendMessage(jid,{text:`🎉 *SORTEIO!*\n│\n🏆 @${vencedor.split("@")[0]}! 🎊`,mentions:[vencedor]},{quoted:seloBot}); await reagir(sock,msg,"🎉");}catch{} return;}
        if(comando==="verifica"&&isGrupo){const buffer=bufferMsgs[jid]||[]; try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)),infrat={}; for(const m of buffer){if(admins.includes(m.sender)||ehDono(m.sender)) continue; if(LINK_RX.test(m.texto)) infrat[m.sender]=true;} const lista=Object.keys(infrat); for(const inf of lista){try{await sock.groupParticipantsUpdate(jid,[inf],"remove");}catch{}} await sock.sendMessage(jid,{text:`✅ *${lista.length}* banido(s) por links!`},{quoted:seloBot}); await reagir(sock,msg,"🔨");}catch{} return;}
        if(comando==="apagar"&&isGrupo){const ctx3=msg.message?.extendedTextMessage?.contextInfo; if(!ctx3?.stanzaId){await sock.sendMessage(jid,{text:`↩️ Cita mensagem com *${CONFIG.PREFIXO}apagar*`},{quoted:seloBot}); return;} try{await sock.sendMessage(jid,{delete:{remoteJid:jid,id:ctx3.stanzaId,participant:ctx3.participant||""}}); await reagir(sock,msg,"🗑️");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="scanlink"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} const historico=historyMsgs[jid]||[]; if(!historico.length){await sock.sendMessage(jid,{text:`📭 Sem histórico.`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🔍 A varrer ${historico.length} mensagens...\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{} try{const meta=await sock.groupMetadata(jid); const admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); const membrosActuais=new Set(meta.participants.map(p=>extrairJid(p.id||p))); let deletados=0,banidos=0; const banidosSet=new Set(); const linksEncontrados=[]; for(const h of historico){if(!h.texto||!LINK_RX.test(h.texto)) continue; if(admins.includes(h.sender)||ehDono(h.sender)) continue; linksEncontrados.push(h);} if(loadMsg){try{await sock.sendMessage(jid,{text:`🔍 A varrer ${historico.length} mensagens...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); if(!linksEncontrados.length){await sock.sendMessage(jid,{text:`✅ Nenhum link! Chat LIMPO! 🎉`},{quoted:seloBot}); await reagir(sock,msg,"✅"); return;} for(const h of linksEncontrados){try{await sock.sendMessage(jid,{delete:h.key}); deletados++;}catch{} await new Promise(r=>setTimeout(r,300));} for(const h of linksEncontrados){if(banidosSet.has(h.sender)||!membrosActuais.has(h.sender)) continue; try{await sock.groupParticipantsUpdate(jid,[h.sender],"remove"); await sock.sendMessage(jid,{text:`🚨 @${h.sender.split("@")[0].split(":")[0]} — *BAN!*`,mentions:[h.sender]}); banidosSet.add(h.sender); banidos++;}catch{} await new Promise(r=>setTimeout(r,500));} historyMsgs[jid]=[]; await sock.sendMessage(jid,{text:`✅ *SCAN CONCLUÍDO!*\n│\n◎ ─ 🔍 Verificadas: *${historico.length}*\n◎ ─ 🔗 Links: *${linksEncontrados.length}*\n◎ ─ 🗑️ Eliminadas: *${deletados}*\n◎ ─ 🔨 Banidos: *${banidos}*`},{quoted:seloBot}); await reagir(sock,msg,"🔨");}catch(e){await sock.sendMessage(jid,{text:`❌ Erro: ${e.message}`},{quoted:seloBot});} return;}

        // ─── DONO ───
        if(comando==="chaton"){const ativos=[...gruposAtivados]; if(!ativos.length){await sock.sendMessage(jid,{text:`📭 Nenhum grupo activo.`},{quoted:seloBot}); return;} try{const grupos=await sock.groupFetchAllParticipating(); const linhas=ativos.map((gJid,i)=>{const nome=grupos[gJid]?.subject||gJid; const membros=grupos[gJid]?.participants?.length||"?"; return `◎ ─ *${i+1}.* 🟢 *${nome}*\n   👥 ${membros} membros`;}).join("\n│\n"); await sock.sendMessage(jid,{text:`🏘️ *GRUPOS ACTIVOS (${ativos.length})*\n│\n${linhas}`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}

        if(comando==="sms"){
          const ativos=[...gruposAtivados]; if(!ativos.length){await sock.sendMessage(jid,{text:`❌ Nenhum grupo activo.`},{quoted:seloBot}); return;}
          if(!args.length){try{const grupos=await sock.groupFetchAllParticipating(); const lista=ativos.map((gJid,i)=>`◎ ─ *${i+1}.* ${grupos[gJid]?.subject||gJid}`).join("\n"); await sock.sendMessage(jid,{text:`📢 *SMS PRIVADA*\n│\n${lista}\n│\n◎ ─ *${CONFIG.PREFIXO}sms [nº] [msg]*`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
          const{grupoJid,mensagem}=await encontrarGrupoPorArg(sock,[...gruposAtivados],args);
          if(!grupoJid){await sock.sendMessage(jid,{text:`❌ Grupo não encontrado.`},{quoted:seloBot}); return;}
          if(!mensagem.trim()){await sock.sendMessage(jid,{text:`❌ Escreve a mensagem!`},{quoted:seloBot}); return;}
          try{const grupos=await sock.groupFetchAllParticipating(); const nomeGrupo=grupos[grupoJid]?.subject||"Grupo"; const meta=await sock.groupMetadata(grupoJid); const membros=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📤 A enviar para *${membros.length}* membros...\n⏳`},{quoted:seloBot}); let enviados=0,erros=0; for(const membro of membros){if(ehDono(membro)) continue; try{await sock.sendMessage(membro,{text:`📢 *Mensagem Privada*\n✦ ─────────── ✦\n\n${mensagem}\n\n✦ ─────────── ✦\n_Enviado por: ${CONFIG.DONO_NOME}_\n_Grupo: ${nomeGrupo}_`}); enviados++; await new Promise(r=>setTimeout(r,600));}catch{erros++;}} await sock.sendMessage(jid,{text:`✅ SMS enviada!\n📊 ${enviados} enviados | ❌ ${erros} erros`},{quoted:seloBot}); await reagir(sock,msg,"📢");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}
          return;
        }

        if(comando==="gsms"){
          const ativos=[...gruposAtivados]; if(!ativos.length){await sock.sendMessage(jid,{text:`❌ Nenhum grupo activo.`},{quoted:seloBot}); return;}
          if(!args.length){try{const grupos=await sock.groupFetchAllParticipating(); const lista=ativos.map((gJid,i)=>`◎ ─ *${i+1}.* ${grupos[gJid]?.subject||gJid}`).join("\n"); await sock.sendMessage(jid,{text:`📣 *AVISO NO GRUPO*\n│\n${lista}\n│\n◎ ─ *${CONFIG.PREFIXO}gsms [nº] [msg]*`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
          const{grupoJid,mensagem}=await encontrarGrupoPorArg(sock,[...gruposAtivados],args);
          if(!grupoJid){await sock.sendMessage(jid,{text:`❌ Grupo não encontrado.`},{quoted:seloBot}); return;}
          if(!mensagem.trim()){await sock.sendMessage(jid,{text:`❌ Escreve a mensagem!`},{quoted:seloBot}); return;}
          try{const grupos=await sock.groupFetchAllParticipating(); const nomeGrupo=grupos[grupoJid]?.subject||"Grupo"; const meta=await sock.groupMetadata(grupoJid); const todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(grupoJid,{text:`📣 *AVISO IMPORTANTE!*\n✦ ─────────── ✦\n\n${mensagem}\n\n✦ ─────────── ✦\n${todos.map(()=>"\u200B").join("")}`,mentions:todos}); await sock.sendMessage(jid,{text:`✅ Aviso enviado!\n👥 ${todos.length} mencionados`},{quoted:seloBot}); await reagir(sock,msg,"📣");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}
          return;
        }

        if(comando==="info"){await sock.sendMessage(jid,{text:`◎ ─ Usa *${CONFIG.PREFIXO}menu*`},{quoted:seloBot}); return;}

      }catch(e){console.error("❌ Erro handler:",e.message); try{await reagir(sock,msg,"❌");}catch{}}
    });

  }catch(e){
    console.error("❌ Erro crítico startBot:",e.message);
    tentativasReconexao++;
    setTimeout(()=>startBot(),Math.min(5000*tentativasReconexao,60000));
  }
}

startBot();
