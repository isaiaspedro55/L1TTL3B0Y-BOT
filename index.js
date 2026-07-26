const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const fs       = require("fs-extra");
const { exec } = require("child_process");
const path     = require("path");
const axios    = require("axios");
const https    = require("https");
const FormData = require("form-data");

const CONFIG = {
  PREFIXO: "!",
  NUMERO_BOT: "244954260707",
  NUMEROS_ADM: ["926612801", "244926612801", "169853876965546"],
  GROQ_KEY: "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",
  PASTA_DOWNLOAD: "./downloads",
  PASTA_ARQ: "./vpn",
  PASTA_DADOS: "./dados",
  DIAS_INATIVO: 30,
  DONO_JID: "169853876965546@lid",
  DONO_NOME: "ISAÍAS PEDRO",
  DONO_NUM: "926 612 801",
  VOZ_TTS: "pt-PT-DuarteNeural",
  SENHA_BOT: "lordinho2025",
  SYSTEMZONE_KEY: "SUA_APIKEY_AQUI",
};

const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true, timeout: 60000 });
const silentLogger = { level:"silent", child:()=>silentLogger, info:()=>{}, warn:()=>{}, error:()=>{}, debug:()=>{}, trace:()=>{}, fatal:()=>{} };
const errosComando = {};
let ppBotUrl = null;
let primeiraConexao = true;

process.on("uncaughtException",  (e) => console.error("❌ uncaughtException:", e.message));
process.on("unhandledRejection", (r) => console.error("❌ unhandledRejection:", r?.message || r));

const userRateLimit = {};
function verificarRateLimit(sender) {
  const agora = Date.now();
  if (userRateLimit[sender] && (agora - userRateLimit[sender]) < 2000) return false;
  userRateLimit[sender] = agora;
  return true;
}
setInterval(() => { const agora = Date.now(); for (const [k, v] of Object.entries(userRateLimit)) { if (agora - v > 10000) delete userRateLimit[k]; } }, 5 * 60 * 1000);

function ehDono(sender) {
  if (!sender) return false;
  const num = String(sender).split("@")[0].split(":")[0].replace(/\D/g, "");
  if (!num) return false;
  return CONFIG.NUMEROS_ADM.some(d => { const dNum = d.replace(/\D/g, ""); return num === dNum || num.endsWith(dNum) || dNum.endsWith(num); });
}

function extrairJid(p) { if (!p) return ""; if (typeof p === "string") return p; if (typeof p === "object" && p.id) return p.id; return String(p); }
function removerAcentos(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function detectarWakeWord(textoTranscrito) {
  if (!textoTranscrito) return null;
  const palavras = textoTranscrito.trim().split(/\s+/);
  const padroes = ["isaias","izaias","isaia","izaia"];
  for (let i = 0; i < Math.min(4, palavras.length); i++) {
    const pl = removerAcentos(palavras[i].toLowerCase()).replace(/[^a-z]/g, "");
    if (padroes.includes(pl)) return palavras.slice(i + 1).join(" ").trim();
  }
  return null;
}

const senhasAprovadas    = new Set();
const gruposAtivados     = new Set();
const pedidoSenha        = new Set();
const chatsDesativados   = new Set();
const vozBotDesativado   = new Set();
const comandosBloqueados = new Set();
const antiLinkDesativado = new Set();
const cacheViewOnce      = {};
const membrosSilenciados = {};
const jogoAtivo          = {};
const jogoLoop           = {};
const bufferMsgs         = {};
const MAX_BUFFER         = 100;
const cacheMsg           = {};
const msgApagadas        = {};
const MAX_CACHE_MSG      = 200;
const banEmCurso         = new Set();
const historyMsgs        = {};
const MAX_HISTORY        = 1000;

const ARQ_EXTS = [".ehi",".npv",".hia",".ovpn",".conf",".vpn",".key",".cert",".p12",".vless",".vmess"];

function getTipoMsg(msg) {
  const m = msg?.message;
  if (!m) return "📄 Outro";
  if (m.conversation || m.extendedTextMessage) return "💬 Texto";
  if (m.imageMessage)   return "🖼️ Imagem";
  if (m.videoMessage)   return "🎥 Vídeo";
  if (m.audioMessage || m.pttMessage) return "🎙️ Áudio";
  if (m.stickerMessage) return "🎭 Figurinha";
  if (m.documentMessage) return "📄 Documento";
  if (m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension) return "👁️ Visual única";
  return "📄 Outro";
}

fs.ensureDirSync("./downloads");
fs.ensureDirSync("./vpn");
fs.ensureDirSync("./dados");

const ARQUIVO_RANK        = "./dados/rank.json";
const ARQUIVO_STATS       = "./dados/stats.json";
const ARQUIVO_ATIVOS      = "./dados/ativos.json";
const ARQUIVO_SILENCIADOS = "./dados/silenciados.json";

if (!fs.existsSync(ARQUIVO_RANK))        fs.writeJsonSync(ARQUIVO_RANK, {});
if (!fs.existsSync(ARQUIVO_STATS))       fs.writeJsonSync(ARQUIVO_STATS, { total:0, comandos:{}, usuarios:{} });
if (!fs.existsSync(ARQUIVO_ATIVOS))      fs.writeJsonSync(ARQUIVO_ATIVOS, {});
if (!fs.existsSync(ARQUIVO_SILENCIADOS)) fs.writeJsonSync(ARQUIVO_SILENCIADOS, {});

try { const s = fs.readJsonSync(ARQUIVO_SILENCIADOS); for (const [j, l] of Object.entries(s)) membrosSilenciados[j] = l; } catch {}
function salvarSilenciados() { try { fs.writeJsonSync(ARQUIVO_SILENCIADOS, membrosSilenciados); } catch {} }
function salvarNoBuffer(jid, d) { if (!bufferMsgs[jid]) bufferMsgs[jid] = []; bufferMsgs[jid].push(d); if (bufferMsgs[jid].length > MAX_BUFFER) bufferMsgs[jid].shift(); }

const TODOS_COMANDOS = new Set([
  "menu","ajuda","sobre",
  "play","mp3","mp4","mp4hd","foto","doc","sticker","mostre",
  "sf","qr","vz","ver","id",
  "tiktok","instagram","twitter","spotify","soundcloud","pinterest","mediafire","apk",
  "transcrever","audiotexto","resumiraudio","traduziraudio","audioparaia","busca","shazam",
  "fotocopia","fotoparaia","resumirfoto","traduzirfoto",
  "apagadas","arquivo","arqadd","arqdelete","decrypt",
  "ia","resumir","traduzir","piada","conselho","poema","historia",
  "calc","encurtar","cotacao","tempo","horario","ping","stats","regras","info","dono",
  "quiz","completar","vof","caca","guerra","rank","toprank","perfil","stop",
  "all","att","link","sorteio","verifica","banir","silenciar","dessilenciar","silenciados",
  "addadmin","removeadmin","fechar","abrir","bot","anti-link","vozbot",
  "bloq","desbloq","aviso","apagar","denunciar","out","add","prefixo","prefixos",
  "ergue-se","set","nomegrupo","descgrupo","fotogrupo",
  "chaton","sms","gsms","scanlink",
  "editar","placar","tourl",
]);

const VOF_BANCO = [
  {p:"O sol é uma estrela.",r:"verdadeiro"},{p:"A baleia é um peixe.",r:"falso"},
  {p:"O coração tem 4 câmaras.",r:"verdadeiro"},{p:"Angola tem 18 províncias.",r:"verdadeiro"},
  {p:"A água ferve a 50°C.",r:"falso"},{p:"O elefante é o maior animal terrestre.",r:"verdadeiro"},
  {p:"A Lua tem atmosfera.",r:"falso"},{p:"O tubarão é um mamífero.",r:"falso"},
  {p:"Luanda é capital de Angola.",r:"verdadeiro"},{p:"O diamante é o mineral mais duro.",r:"verdadeiro"},
  {p:"O Brasil tem mais de 200 milhões de habitantes.",r:"verdadeiro"},{p:"O ouro é um metal.",r:"verdadeiro"},
  {p:"A África é o maior continente do mundo.",r:"falso"},{p:"O golfinho é um mamífero.",r:"verdadeiro"},
  {p:"A Lua é maior que a Terra.",r:"falso"},{p:"O Python é uma linguagem de programação.",r:"verdadeiro"},
  {p:"O caracol tem concha.",r:"verdadeiro"},{p:"O Rio Nilo fica na Ásia.",r:"falso"},
];
const QUIZ_BANCO = [
  {p:"Capital de Angola?",r:"luanda"},{p:"Maior planeta do sistema solar?",r:"jupiter"},
  {p:"Moeda de Angola?",r:"kwanza"},{p:"Quem pintou a Mona Lisa?",r:"leonardo da vinci"},
  {p:"Quantos continentes existem?",r:"7"},{p:"Maior oceano do mundo?",r:"pacifico"},
  {p:"Capital do Brasil?",r:"brasilia"},{p:"País mais populoso do mundo?",r:"china"},
  {p:"Quantos lados tem um hexágono?",r:"6"},{p:"Menor país do mundo?",r:"vaticano"},
  {p:"Em que ano Angola se tornou independente?",r:"1975"},{p:"Quantos ossos tem o corpo humano adulto?",r:"206"},
  {p:"Capital de Portugal?",r:"lisboa"},{p:"Maior deserto do mundo?",r:"saara"},
  {p:"Quantos planetas tem o sistema solar?",r:"8"},{p:"Animal mais rápido do mundo?",r:"guepardo"},
];
const COMPLETAR_BANCO = [
  {i:"ANG_LA",c:"angola",d:"País da África Austral"},{i:"LU_NDA",c:"luanda",d:"Capital de Angola"},
  {i:"FU_BOL",c:"futebol",d:"Desporto popular"},{i:"KW_NZA",c:"kwanza",d:"Moeda de Angola"},
  {i:"BR_SIL",c:"brasil",d:"Maior país da América do Sul"},{i:"AFR_CA",c:"africa",d:"Continente"},
  {i:"D_ANTE",c:"diamante",d:"Pedra preciosa"},{i:"EL_FAN_E",c:"elefante",d:"Maior animal terrestre"},
];
const CACA_BANCO = [
  {palavra:"ANGOLA",dica:"País da África Austral"},{palavra:"LUANDA",dica:"Capital de Angola"},
  {palavra:"FUTEBOL",dica:"Desporto popular"},{palavra:"AFRICA",dica:"Continente"},
  {palavra:"KWANZA",dica:"Moeda de Angola"},{palavra:"BRASIL",dica:"América do Sul"},
  {palavra:"DIAMANTE",dica:"Pedra preciosa"},{palavra:"ELEFANTE",dica:"Maior animal terrestre"},
  {palavra:"OCEANO",dica:"Grande massa de água"},{palavra:"PYTHON",dica:"Linguagem de programação"},
];
const GUERRA_BANCO = [
  {palavra:"ANGOLA",dica:"País da África Austral"},{palavra:"LUANDA",dica:"Capital de Angola"},
  {palavra:"AFRICA",dica:"Continente"},{palavra:"FUTEBOL",dica:"Desporto favorito"},
  {palavra:"DIAMANTE",dica:"Pedra preciosa"},{palavra:"ELEFANTE",dica:"Maior animal terrestre"},
  {palavra:"MUSICA",dica:"Arte dos sons"},{palavra:"ESTRELA",dica:"Corpo celeste"},
  {palavra:"OCEANO",dica:"Grande massa de água"},{palavra:"BANANA",dica:"Fruta tropical"},
];

const PERFIS_ELOGIO = ["🌟 Um ser extraordinário! Líder nato, coração de ouro!","👑 O verdadeiro rei! Inteligente, divertido!","🔥 Pura energia! Um talento raro!","💎 Raro como diamante! Leal e honesto!","🚀 Destinado ao sucesso! Mente brilhante!"];
const PERFIS_ZOADA  = ["😂 Deus criou esta pessoa e perguntou: 'O que fiz?!' 💀","🤣 A face assusta os espelhos! Quando some ninguém repara! 💀","😭 Esta pessoa chegou e o WiFi ficou lento! Coincidência? NÃO! 🚶🏿‍♂️","💀 Dizem que já foi bonita... antes da câmara frontal! 📸😂","🤡 Acorda às 6h, olha pro espelho e volta a dormir com medo! 😂"];
const LINK_RX = /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/|bit\.ly|youtu\.be|youtube\.com|facebook\.com|instagram\.com|tiktok\.com|wa\.me)/i;
const STATUS_MENCAO_RX = /status\s*@|'s status|was mentioned/i;

function getTexto(msg) { const m = msg?.message; if (!m) return ""; return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || m.documentMessage?.caption || ""; }
function salvarStats(cmd, sender) { try { const s = fs.readJsonSync(ARQUIVO_STATS); s.total=(s.total||0)+1; s.comandos[cmd]=(s.comandos[cmd]||0)+1; s.usuarios[String(sender).split("@")[0]]=(s.usuarios[String(sender).split("@")[0]]||0)+1; fs.writeJsonSync(ARQUIVO_STATS,s); } catch {} }
function addXP(sender, xp=2) { try { const r=fs.readJsonSync(ARQUIVO_RANK); const n=String(sender).split("@")[0]; if(!r[n]) r[n]={xp:0,nivel:1,msgs:0}; r[n].xp+=xp; r[n].msgs+=1; r[n].nivel=Math.floor(r[n].xp/100)+1; fs.writeJsonSync(ARQUIVO_RANK,r); } catch {} }
function registarAtividade(sender, jid) { try { const a=fs.readJsonSync(ARQUIVO_ATIVOS); if(!a[jid]) a[jid]={}; a[jid][String(sender)]=Date.now(); fs.writeJsonSync(ARQUIVO_ATIVOS,a); } catch {} }
function calcularSeguro(expr) { const safe=expr.replace(/[^0-9+\-*/().%\s]/g,"").trim(); if(!safe) throw new Error("Inválida"); return Function(`"use strict"; return (${safe})`)(); }
function gerarGrade(palavra) { const tam=8,letras="ABCDEFGHIJKLMNOPQRSTUVWXYZ"; const grade=Array(tam).fill(null).map(()=>Array(tam).fill(null).map(()=>letras[Math.floor(Math.random()*26)])); const linha=Math.floor(Math.random()*tam),col=Math.floor(Math.random()*(tam-palavra.length)); for(let i=0;i<palavra.length;i++) grade[linha][col+i]=palavra[i]; return grade.map(r=>r.join(" ")).join("\n"); }
function mostrarGuerraEstado(jogo) { const vidas=["❤️❤️❤️❤️❤️❤️","🧡❤️❤️❤️❤️❤️","🧡🧡❤️❤️❤️❤️","🧡🧡🧡❤️❤️❤️","🧡🧡🧡🧡❤️❤️","🧡🧡🧡🧡🧡❤️","💀💀💀💀💀💀"]; const pM=jogo.palavra.split("").map(l=>jogo.letrasAcertadas.includes(l)?l:"_").join(" "); const eS=jogo.letrasErradas.length>0?jogo.letrasErradas.join(", "):"Nenhuma"; return `⚔️ *GUERRA*\n✦ ─────────── ✦\n🔤 *${pM}*\n💡 _${jogo.dica}_\n\n${vidas[Math.min(jogo.letrasErradas.length,6)]}\n❌ Erradas: *${eS}*\n\n_Digita uma letra!_`; }
function selecionarSemRepetir(banco, usadas) { const disp=banco.filter(item=>{const id=item.p||item.palavra||item.c||item.i; return !usadas.includes(id);}); if(!disp.length) return null; return disp[Math.floor(Math.random()*disp.length)]; }

function ehMencaoStatus(msg, texto) {
  if (msg.message?.statusMentionMessage) return true;
  if (texto && STATUS_MENCAO_RX.test(texto)) return true;
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (ctx?.remoteJid?.includes("status@broadcast")) return true;
  if (ctx?.participant?.includes("status@broadcast")) return true;
  return false;
}

async function enviarComFoto(sock,jid,texto,ppUrl,q=null) { try { if(ppUrl) await sock.sendMessage(jid,{image:{url:ppUrl},caption:texto},q?{quoted:q}:{}); else await sock.sendMessage(jid,{text:texto},q?{quoted:q}:{}); } catch { try { await sock.sendMessage(jid,{text:texto}); } catch {} } }
async function enviarSemFoto(sock,jid,texto,q=null) { try { await sock.sendMessage(jid,{text:texto},q?{quoted:q}:{}); } catch {} }
async function reagir(sock,msg,emoji="⏳") { try { await sock.sendMessage(msg.key.remoteJid,{react:{text:emoji,key:msg.key}}); } catch {} }

// ═══════════════════════════════════════════════════════
//  ✅ MENU PRINCIPAL — estilo Itadori Bot
// ═══════════════════════════════════════════════════════

async function enviarMenuPrincipal(sock, jid, msg, isDono, sender, isAdmin) {
  const P = CONFIG.PREFIXO;
  const agora = new Date();
  const hora = agora.toLocaleTimeString("pt-AO", { timeZone:"Africa/Luanda", hour:"2-digit", minute:"2-digit", second:"2-digit" });
  const nomeUser = sender.split("@")[0].split(":")[0];
  const cargo = isDono ? "Criador." : (isAdmin ? "Administrador." : "Utilizador.");
  const bt = chatsDesativados.has(jid)?"🔴":"🟢";
  const al = antiLinkDesativado.has(jid)?"⚠️":"🔒";
  const vz = vozBotDesativado.has(jid)?"🔇":"🎙️";

  const caption =
`┌─☆·˖✶˖·✦·˖✶˖·☆·˖✶˖·✦─┐
｜  🌀 *LORDE LÁ DJUM* 🌀  ｜
└─☆·˖✶˖·✦·˖✶˖·☆·˖✶˖·✦─┘
┌─☆·˖✶˖·✦·˖✶˖·☆·˖✶˖·✦─┐
｜✦ 🌀 ⁺ BOT: 🌀LORDE-DJUM v3.5
｜✦ 🌀 ⁺ USUÁRIO: ${nomeUser}
｜✦ 🌀 ⁺ CARGO: ${cargo}
｜✦ 🌀 ⁺ PREFIXO: *${P}*
｜✦ 🌀 ⁺ BOT: ${bt} 
｜✦ 🌀 ⁺ HORA: ${hora}
└─☆·˖✶˖·✦·˖✶˖·☆·˖✶˖·✦─┘`;
══════════════════
🎵 *!menu musica*
📱 *!menu social*
🧠 *!menu ia*
🎮 *!menu jogos*
══════════════════
🔢 *!menu util*
🕵️ *!menu extra*
📁 *!menu arq*
══════════════════
🛡️ *!menu adm*
🏘️ *!menu grup*
👑 *!menu dono*
══════════════════

  const categorias = [
    { title: "🎵  MÚSICA & VÍDEO",   rowId: "cat_musica", description: "play, mp3, mp4, mp4hd, sticker, voz..." },
    { title: "📱  REDES SOCIAIS",     rowId: "cat_social", description: "TikTok, Insta, Twitter, Spotify..." },
    { title: "🧠  INTELIGÊNCIA IA",  rowId: "cat_ia",     description: "IA, traduzir, analisar imagens..." },
    { title: "🎮  JOGOS",            rowId: "cat_jogos",  description: "Quiz, Forca, V/F, Caça-palavras..." },
    { title: "🔢  UTILIDADES",       rowId: "cat_util",   description: "QR, Calc, Placar, Tempo, ToURL..." },
    { title: "🕵️  EXTRAS",           rowId: "cat_extra",  description: "Editor IA, Shazam, View-Once..." },
    { title: "📁  ARQUIVOS & VPN",   rowId: "cat_arq",    description: "Ficheiros .ehi .ovpn, Decrypt..." },
    { title: "🛡️  ADMINISTRAÇÃO",    rowId: "cat_adm",    description: "Ban, Silenciar, Fechar, ScanLink..." },
  ];
  if (isDono) {
    categorias.push({ title: "🏘️  GESTÃO DE GRUPOS", rowId: "cat_grup", description: "ChaTon, SMS, GSMS (DONO)" });
    categorias.push({ title: "👑  ÁREA DO DONO",      rowId: "cat_dono", description: "Ergue-se, Senha, Prefixo..." });
  }

  // Tenta buttonsMessage com imagem
  let enviouComBotao = false;
  try {
    let imgBuf = null;
    if (ppBotUrl) {
      try { const resp = await axios.get(ppBotUrl,{responseType:"arraybuffer",timeout:8000,httpsAgent}); imgBuf = Buffer.from(resp.data); } catch {}
    }
    if (imgBuf) {
      await sock.sendMessage(jid, {
        image: imgBuf,
        caption,
        footer: "🌀LORDE-DJUM v3.5",
        buttons: [
          { buttonId: "btn_abrir_menu", buttonText: { displayText: "≡  MENU" }, type: 1 },
          { buttonId: "btn_dono",       buttonText: { displayText: `👑 ${CONFIG.DONO_NOME}` }, type: 1 },
        ],
        headerType: 4
      }, { quoted: msg });
      enviouComBotao = true;
    }
  } catch(e) { console.log("⚠️ buttonsMessage não suportado, usando listMessage..."); }

  if (!enviouComBotao) {
    try {
      if (ppBotUrl) await sock.sendMessage(jid, { image: { url: ppBotUrl }, caption }, { quoted: msg });
      else await sock.sendMessage(jid, { text: caption }, { quoted: msg });
    } catch { await sock.sendMessage(jid, { text: caption }, { quoted: msg }); }
    await new Promise(r => setTimeout(r, 600));
    try {
      await sock.sendMessage(jid, {
        listMessage: {
          title: `🌀 *LORDE LÁ DJUM v3.5*`,
          description: `📁 Selecciona uma categoria:`,
          footerText: `🌀LORDE-DJUM v3.5`,
          buttonText: `≡  MENU`,
          listType: 1,
          sections: [{ title: "📂  CATEGORIAS", rows: categorias }]
        }
      });
    } catch(e2) {
      const listaTexto = categorias.map(c=>`◎ ─ *${P}menu ${c.rowId.replace("cat_","")}*`).join("\n");
      await sock.sendMessage(jid, { text: `📂 *Categorias:*\n\n${listaTexto}` });
    }
  }
}

async function abrirListaCategorias(sock, jid, msg, isDono) {
  const categorias = [
    { title: "🎵  MÚSICA & VÍDEO",   rowId: "cat_musica", description: "play, mp3, mp4, mp4hd, sticker, voz..." },
    { title: "📱  REDES SOCIAIS",     rowId: "cat_social", description: "TikTok, Insta, Twitter, Spotify..." },
    { title: "🧠  INTELIGÊNCIA IA",  rowId: "cat_ia",     description: "IA, traduzir, analisar imagens..." },
    { title: "🎮  JOGOS",            rowId: "cat_jogos",  description: "Quiz, Forca, V/F, Caça-palavras..." },
    { title: "🔢  UTILIDADES",       rowId: "cat_util",   description: "QR, Calc, Placar, Tempo, ToURL..." },
    { title: "🕵️  EXTRAS",           rowId: "cat_extra",  description: "Editor IA, Shazam, View-Once..." },
    { title: "📁  ARQUIVOS & VPN",   rowId: "cat_arq",    description: "Ficheiros .ehi .ovpn, Decrypt..." },
    { title: "🛡️  ADMINISTRAÇÃO",    rowId: "cat_adm",    description: "Ban, Silenciar, Fechar, ScanLink..." },
  ];
  if (isDono) {
    categorias.push({ title: "🏘️  GESTÃO DE GRUPOS", rowId: "cat_grup", description: "ChaTon, SMS, GSMS (DONO)" });
    categorias.push({ title: "👑  ÁREA DO DONO",      rowId: "cat_dono", description: "Ergue-se, Senha, Prefixo..." });
  }
  try {
    await sock.sendMessage(jid, {
      listMessage: {
        title: `🌀 *LORDE LÁ DJUM v3.5*`,
        description: `📁 Selecciona uma categoria:`,
        footerText: `🌀LORDE-DJUM v3.5`,
        buttonText: `≡  MENU`,
        listType: 1,
        sections: [{ title: "📂  CATEGORIAS", rows: categorias }]
      }
    }, { quoted: msg });
  } catch(e) { await enviarSemFoto(sock, jid, `📂 Usa *${CONFIG.PREFIXO}menu [categoria]*`); }
}

// ═══════════════════════════════════════════════════════
//  ✅ SUBMENUS ESTILIZADOS
// ═══════════════════════════════════════════════════════

function gerarSubmenu(catId, P) {
  if (catId==="cat_musica"||catId==="musica") return (
`┌─⊱ 『 🎵 MÚSICA & VÍDEO 』 ⊰─┐
│
◎ ─ *${P}play* [música]
◎ ─ *${P}mp3* [música] → _HD_
◎ ─ *${P}mp4* [nome/link] → _480p_
◎ ─ *${P}mp4hd* [nome/link] → _720p_
│
◎ ─ *${P}mostre* [pesquisa]
◎ ─ *${P}foto* [url]
◎ ─ *${P}doc* [url]
│
◎ ─ *${P}sticker* → _cria sticker_
◎ ─ *${P}sf* → _sticker ➜ foto_
◎ ─ *${P}vz* [texto] → _áudio voz_
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5_`);

  if (catId==="cat_social"||catId==="social") return (
`┌─⊱ 『 📱 REDES SOCIAIS 』 ⊰─┐
│
◎ ─ *${P}tiktok* [link]
◎ ─ *${P}instagram* [link]
◎ ─ *${P}twitter* [link]
◎ ─ *${P}spotify* [música/link]
◎ ─ *${P}soundcloud* [música/link]
◎ ─ *${P}pinterest* [link/pesquisa]
│
◎ ─ *${P}mediafire* [link]
◎ ─ *${P}apk* [nome do app]
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5_`);

  if (catId==="cat_ia"||catId==="ia") return (
`┌─⊱ 『 🧠 INTELIGÊNCIA IA 』 ⊰─┐
│
◎ ─ *${P}ia* [pergunta]
◎ ─ *${P}resumir* → _cita mensagem_
◎ ─ *${P}traduzir* [idioma] [texto]
◎ ─ *${P}piada*
◎ ─ *${P}conselho* [situação]
◎ ─ *${P}poema* [tema]
◎ ─ *${P}historia* [tema]
│
◎ ─ *${P}transcrever* → _áudio→texto_
◎ ─ *${P}resumiraudio*
◎ ─ *${P}traduziraudio* [idioma]
◎ ─ *${P}audioparaia*
│
◎ ─ *${P}fotocopia* → _lê texto foto_
◎ ─ *${P}fotoparaia* [pergunta]
◎ ─ *${P}resumirfoto*
◎ ─ *${P}traduzirfoto* [idioma]
│
◎ ─ _Diz_ *"Isaías, [pergunta]"* 🎙️
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5_`);

  if (catId==="cat_jogos"||catId==="jogos") return (
`┌─⊱ 『 🎮 JOGOS EM LOOP ♾️ 』 ⊰─┐
│
◎ ─ *${P}quiz* [tema]
◎ ─ *${P}vof* → _Verdadeiro/Falso_
◎ ─ *${P}completar* [tema]
◎ ─ *${P}caca* [tema]
◎ ─ *${P}guerra* → _Forca ⚔️_
◎ ─ *${P}stop* → _Para o jogo 🛑_
│
◎ ─ *${P}rank* → _teu ranking_
◎ ─ *${P}toprank* → _top 10_
◎ ─ *${P}perfil* → _perfil aleatório_
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5_`);

  if (catId==="cat_util"||catId==="util") return (
`┌─⊱ 『 🔢 UTILIDADES 』 ⊰─┐
│
◎ ─ *${P}qr* [texto/url]
◎ ─ *${P}calc* [expressão]
◎ ─ *${P}encurtar* [url]
◎ ─ *${P}tourl* → _mídia ➜ link 🔗_
◎ ─ *${P}cotacao* → _Kwanza_
◎ ─ *${P}placar* [jogo] → _⚽ ao vivo_
◎ ─ *${P}tempo* [local]
◎ ─ *${P}horario* → _mundial_
◎ ─ *${P}ping* → _latência_
◎ ─ *${P}stats* → _estatísticas_
◎ ─ *${P}regras* / *${P}id* / *${P}dono*
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5_`);

  if (catId==="cat_extra"||catId==="extra") return (
`┌─⊱ 『 🕵️ EXTRAS 』 ⊰─┐
│
◎ ─ *${P}busca* ⚡
    _↩️ responde nota de voz_
    _↳ Shazam — reconhece música_
│
◎ ─ *${P}editar* [instrução]
    _↩️ responde uma imagem_
    _↳ edita com IA 🎨_
│
◎ ─ *${P}ver*
    _↩️ responde view-once_
    _↳ desbloqueia 📷🎥_
│
◎ ─ *${P}apagadas*
    _↳ mostra msgs apagadas_
│
◎ ─ *${P}denunciar* [motivo]
    _↩️ responde mensagem_
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5_`);

  if (catId==="cat_arq"||catId==="arq") return (
`┌─⊱ 『 📁 ARQUIVOS & VPN 』 ⊰─┐
│
◎ ─ *${P}arquivo* → _lista ficheiros_
◎ ─ *${P}arquivo* [nome] → _envia_
◎ ─ *${P}arqadd* → _adiciona ficheiro_
◎ ─ *${P}arqdelete* [nome/nº] → _elimina_
◎ ─ *${P}decrypt* → _analisa config_
│
◎ ─ ✅ .ehi .npv .ovpn
◎ ─ ✅ .conf .hia .vless .vmess
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5_`);

  if (catId==="cat_adm"||catId==="adm"||catId==="admin") return (
`┌─⊱ 『 🛡️ ADMINISTRAÇÃO 』 ⊰─┐
│
◎ ─ *${CONFIG.PREFIXO}banir*  ◎ ─ *${CONFIG.PREFIXO}add* [nº]
◎ ─ *${CONFIG.PREFIXO}addadmin*  ◎ ─ *${CONFIG.PREFIXO}removeadmin*
◎ ─ *${CONFIG.PREFIXO}fechar*  ◎ ─ *${CONFIG.PREFIXO}abrir*
│
◎ ─ *${CONFIG.PREFIXO}silenciar*
◎ ─ *${CONFIG.PREFIXO}dessilenciar*
◎ ─ *${CONFIG.PREFIXO}silenciados*
│
◎ ─ *${CONFIG.PREFIXO}all* / *${CONFIG.PREFIXO}att* / *${CONFIG.PREFIXO}aviso*
◎ ─ *${CONFIG.PREFIXO}link* / *${CONFIG.PREFIXO}sorteio*
│
◎ ─ *${CONFIG.PREFIXO}nomegrupo* / *${CONFIG.PREFIXO}descgrupo*
◎ ─ *${CONFIG.PREFIXO}fotogrupo* / *${CONFIG.PREFIXO}apagar*
│
◎ ─ *${CONFIG.PREFIXO}bloq* / *${CONFIG.PREFIXO}desbloq*
◎ ─ *${CONFIG.PREFIXO}bot* off/on
◎ ─ *${CONFIG.PREFIXO}anti-link* on/off
◎ ─ *${CONFIG.PREFIXO}vozbot* on/off
◎ ─ *${CONFIG.PREFIXO}verifica* / *${CONFIG.PREFIXO}scanlink*
│
└──────────────────────────────⊰
_⚡ Ban automático 5→0_
_© LORDE LÁ DJUM v3.5_`);

  if (catId==="cat_grup"||catId==="grup") return (
`┌─⊱ 『 🏘️ GESTÃO DE GRUPOS 』 ⊰─┐
│
◎ ─ *${CONFIG.PREFIXO}chaton*
    _↳ lista grupos activos_
│
◎ ─ *${CONFIG.PREFIXO}sms* [nº] [msg]
    _↳ SMS privada a todos_
│
◎ ─ *${CONFIG.PREFIXO}gsms* [nº] [msg]
    _↳ aviso no grupo_
    _↳ menciona todos_
│
◎ ─ _Ex:_
   *${CONFIG.PREFIXO}sms 1 Olá pessoal!*
   *${CONFIG.PREFIXO}gsms 1 Atenção!*
│
◎ ─ ⚠️ _Apenas DONO_
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5_`);

  if (catId==="cat_dono"||catId==="dono") return (
`┌─⊱ 『 👑 ÁREA DO DONO 』 ⊰─┐
│
◎ ─ *${CONFIG.PREFIXO}ergue-se*
    _↳ activa o bot no grupo_
│
◎ ─ *${CONFIG.PREFIXO}set* [nova_senha]
    _↳ troca a senha do bot_
│
◎ ─ *${CONFIG.PREFIXO}out*
    _↳ bot sai do grupo_
│
◎ ─ *${CONFIG.PREFIXO}prefixo* [símbolo]
    _↳ muda o prefixo_
│
◎ ─ ───────────────── ◎
│
👑 *${CONFIG.DONO_NOME}*
📞 *${CONFIG.DONO_NUM}*
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5_`);

  return null;
}

async function enviarSubmenu(sock, jid, msg, catId) {
  const texto = gerarSubmenu(catId, CONFIG.PREFIXO);
  if (!texto) return;
  await reagir(sock, msg, "✅");
  await new Promise(r => setTimeout(r, 400));
  await enviarComFoto(sock, jid, texto, ppBotUrl, msg);
}

async function enviarGif(sock, jid, caption="", quotedMsg=null) {
  const tempOut = `./downloads/gif_${Date.now()}.mp4`;
  const UA = "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Chrome/112.0";
  const pesquisas = [
    "ytsearch1:solo leveling arise sung jinwoo shadow soldiers short clip",
    "ytsearch1:solo leveling sung jin woo rise scene",
  ];
  for (const pesquisa of pesquisas) {
    try {
      await runCmd(
        `yt-dlp --no-check-certificate --no-playlist --no-warnings --force-ipv4 --geo-bypass ` +
        `--match-filter "duration < 60" --extractor-args "youtube:player_client=android,ios" ` +
        `--add-header "User-Agent:${UA}" -f "best[height<=480][ext=mp4]/best[height<=480]/worst" ` +
        `--max-filesize 8M -o "${tempOut}" "${pesquisa}"`
      );
      if (fs.existsSync(tempOut) && fs.statSync(tempOut).size > 5000) {
        const buf = fs.readFileSync(tempOut);
        try { fs.removeSync(tempOut); } catch {}
        await sock.sendMessage(jid, { video: buf, gifPlayback: true, caption, mimetype: "video/mp4" }, quotedMsg ? { quoted: quotedMsg } : {});
        return true;
      }
    } catch(e) { console.log(`❌ GIF: ${e.message.slice(0,60)}`); }
    finally { try { if(fs.existsSync(tempOut)) fs.removeSync(tempOut); } catch {} }
  }
  return false;
}

async function banirComContagem(sock, jid, sender, msgKey, motivo="Infração das regras") {
  const banKey = `${jid}_${sender}`;
  if (banEmCurso.has(banKey)) return;
  banEmCurso.add(banKey);
  try {
    try { await sock.sendMessage(jid, { delete: msgKey }); } catch {}
    for (let i = 5; i >= 0; i--) {
      try { await sock.sendMessage(jid, { text: `⏳ *${i}...*` }); } catch {}
      await new Promise(r => setTimeout(r, 900));
    }
    try { await sock.sendMessage(jid, { text: `BANNNN❌️\n\n🚨 @${sender.split("@")[0]} foi *BANIDO!*\n_Motivo: ${motivo}_`, mentions: [sender] }); } catch {}
    await new Promise(r => setTimeout(r, 500));
    try { await sock.groupParticipantsUpdate(jid, [sender], "remove"); } catch {}
    try { await sock.sendMessage(jid, { text: `🔨 @${sender.split("@")[0]} *REMOVIDO!*\n✦ ─────────── ✦\nÉ por causa desta pessoa 🚶🏿‍♂️\n*BAZAAA...* 😂💨`, mentions: [sender] }); } catch {}
  } finally { setTimeout(() => banEmCurso.delete(banKey), 5000); }
}

async function chatIA(prompt, sistema="És um assistente simpático que responde sempre em português de Angola. Sê direto e objetivo.") {
  for(const modelo of ["llama-3.1-8b-instant","mixtral-8x7b-32768"]){
    try{ const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:modelo,messages:[{role:"system",content:sistema},{role:"user",content:prompt}],max_tokens:800,temperature:0.7},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:20000,httpsAgent}); const resp=data.choices?.[0]?.message?.content?.trim(); if(resp&&resp.length>2) return resp; }catch(e){console.log(`❌ Groq ${modelo}:`,e.message);}
  }
  try{ const{data}=await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(sistema)}&model=openai-large`,{timeout:25000,responseType:"text",httpsAgent}); const resp=typeof data==="string"?data.trim():String(data).trim(); if(resp.length>5) return resp; }catch{}
  return "❌ IA temporariamente indisponível.";
}

async function gerarJogoIA(tipo, categoria=null, usadas=[]) {
  const sistema="És um gerador de jogos educativos. Responde SEMPRE com JSON válido puro. Sem markdown.";
  let prompt="";
  if(tipo==="quiz"){const ev=usadas.length>0?`Evita: ${usadas.slice(-6).join(" | ")}`:""; prompt=`Quiz em português ${categoria?`sobre:"${categoria}"`:"variado"}. ${ev} JSON: {"pergunta":"Capital de Angola?","resposta":"luanda"}.`;}
  if(tipo==="completar"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:""; prompt=`Palavra Completa ${categoria||"variado"}. ${ev} JSON: {"inicial":"A_G_LA","completa":"angola","dica":"País África"}.`;}
  if(tipo==="caca"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:""; prompt=`Palavra Caça ${categoria||"variado"}. ${ev} JSON: {"palavra":"ANGOLA","dica":"País"}. MAIÚSCULAS A-Z, 4-8 letras.`;}
  if(tipo==="guerra"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:""; prompt=`Palavra Forca ${categoria||"variado"}. ${ev} JSON: {"palavra":"FUTEBOL","dica":"Desporto"}. 5-9 letras MAIÚSCULAS.`;}
  if(tipo==="vof"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(" | ")}`:""; prompt=`Afirmação V/F português. ${ev} JSON: {"pergunta":"O sol é uma estrela.","resposta":"verdadeiro"}.`;}
  try{ const resp=await chatIA(prompt,sistema); const m=resp.match(/\{[^{}]+\}/); if(!m) throw new Error("no JSON"); const p=JSON.parse(m[0]); if(tipo==="quiz"&&p.pergunta&&p.resposta) return{p:p.pergunta,r:p.resposta.toLowerCase().trim()}; if(tipo==="completar"&&p.inicial&&p.completa) return{i:p.inicial,c:p.completa.toLowerCase().trim(),d:p.dica||"Completa"}; if(tipo==="caca"&&p.palavra) return{palavra:p.palavra.toUpperCase().replace(/[^A-Z]/g,""),dica:p.dica||"Encontra"}; if(tipo==="guerra"&&p.palavra) return{palavra:p.palavra.toUpperCase().replace(/[^A-Z]/g,""),dica:p.dica||"Palavra"}; if(tipo==="vof"&&p.pergunta&&p.resposta) return{p:p.pergunta,r:p.resposta.toLowerCase().trim()}; }catch(e){console.log(`❌ gerarJogoIA(${tipo}):`,e.message);}
  return null;
}

async function analisarImagem(imagemBuffer, instrucao) {
  let mimeType="image/jpeg"; if(imagemBuffer[0]===0x89&&imagemBuffer[1]===0x50) mimeType="image/png"; else if(imagemBuffer.slice(0,4).toString("ascii")==="RIFF") mimeType="image/webp";
  const base64=imagemBuffer.toString("base64");
  for(const modelo of ["meta-llama/llama-4-scout-17b-16e-instruct","meta-llama/llama-4-maverick-17b-128e-instruct"]){
    try{ const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:modelo,messages:[{role:"user",content:[{type:"image_url",image_url:{url:`data:${mimeType};base64,${base64}`}},{type:"text",text:instrucao}]}],max_tokens:1000,temperature:0.3},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:30000,httpsAgent}); const resp=data.choices?.[0]?.message?.content?.trim(); if(resp&&resp.length>2) return resp; }catch(e){console.log(`❌ ${modelo}:`,e.message);}
  }
  throw new Error("Modelos de visão falharam.");
}

async function downloadImagemDaMensagem(msg) {
  if(msg.message?.imageMessage){try{return await downloadMediaMessage(msg,"buffer",{});}catch{}}
  const ctx=msg.message?.extendedTextMessage?.contextInfo; if(!ctx?.quotedMessage) return null;
  if(ctx.quotedMessage.imageMessage){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage}; return await downloadMediaMessage(qm,"buffer",{});}catch{}}
  return null;
}

async function downloadAudioDaMensagem(msg) {
  const tipos=["audioMessage","pttMessage"];
  for(const tipo of tipos){if(msg.message?.[tipo]){try{return{buffer:await downloadMediaMessage(msg,"buffer",{})};}catch{}}}
  const ctx=msg.message?.extendedTextMessage?.contextInfo; if(!ctx?.quotedMessage) return null;
  for(const tipo of tipos){if(ctx.quotedMessage[tipo]){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage}; return{buffer:await downloadMediaMessage(qm,"buffer",{})};}catch{}}}
  return null;
}

async function downloadQualquerMidia(msg) {
  const m=msg.message; if(!m) return null;
  const tipos=[
    {chave:"imageMessage",  mime:"image/jpeg",      ext:"jpg"},
    {chave:"videoMessage",  mime:"video/mp4",        ext:"mp4"},
    {chave:"audioMessage",  mime:"audio/ogg",        ext:"ogg"},
    {chave:"pttMessage",    mime:"audio/ogg",        ext:"ogg"},
    {chave:"documentMessage",mime:"application/octet-stream",ext:"bin"},
    {chave:"stickerMessage",mime:"image/webp",       ext:"webp"},
  ];
  for(const t of tipos){if(m[t.chave]){try{const buf=await downloadMediaMessage(msg,"buffer",{}); const mime=m[t.chave].mimetype||t.mime; const ext=mime.split("/")[1]?.split(";")[0]||t.ext; const nome=m[t.chave].fileName||`midia_${Date.now()}.${ext}`; return{buffer:buf,mime,nome};}catch{}}}
  const ctx=m.extendedTextMessage?.contextInfo;
  if(ctx?.quotedMessage){for(const t of tipos){if(ctx.quotedMessage[t.chave]){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage}; const buf=await downloadMediaMessage(qm,"buffer",{}); const mime=ctx.quotedMessage[t.chave].mimetype||t.mime; const ext=mime.split("/")[1]?.split(";")[0]||t.ext; const nome=ctx.quotedMessage[t.chave].fileName||`midia_${Date.now()}.${ext}`; return{buffer:buf,mime,nome};}catch{}}}}
  return null;
}

async function transcreverComGroq(buffer) {
  const formData=new FormData(); formData.append("file",buffer,{filename:"audio.ogg",contentType:"audio/ogg"}); formData.append("model","whisper-large-v3"); formData.append("response_format","json");
  const{data}=await axios.post("https://api.groq.com/openai/v1/audio/transcriptions",formData,{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,...formData.getHeaders()},timeout:60000,httpsAgent});
  const texto=data?.text?.trim(); if(!texto) throw new Error("Áudio não audível"); return texto;
}

function runCmd(cmd) { return new Promise((resolve,reject)=>{exec(cmd,{timeout:180000,maxBuffer:100*1024*1024},(err,stdout,stderr)=>{if(err) reject(new Error(stderr||err.message)); else resolve(stdout.trim());});}); }
function encontrarArquivo(pasta,prefixo) { try{const arqs=fs.readdirSync(pasta).filter(f=>f.startsWith(prefixo)&&!f.endsWith(".part")&&!f.endsWith(".ytdl")); if(!arqs.length) return null; const p=path.join(pasta,arqs[0]); return fs.statSync(p).size>3000?p:null;}catch{return null;} }

async function textoParaFala(texto, voz=CONFIG.VOZ_TTS) {
  const tempId=Date.now(),tempTxt=`./downloads/tts_in_${tempId}.txt`,tempOut=`./downloads/tts_out_${tempId}.mp3`;
  try{ const textoLimpo=texto.replace(/[*_~`#]/g,"").replace(/\n+/g,". ").slice(0,1800); if(!textoLimpo.trim()) throw new Error("Texto vazio"); fs.writeFileSync(tempTxt,textoLimpo,"utf8"); await runCmd(`edge-tts --voice "${voz}" --file "${tempTxt}" --write-media "${tempOut}"`); if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<500) throw new Error("TTS inválido"); return tempOut; }finally{try{fs.removeSync(tempTxt);}catch{}}
}

async function reconhecerMusica(buf) {
  const formData=new FormData(); formData.append("file",buf,{filename:"audio.ogg",contentType:"audio/ogg"}); formData.append("api_token","test"); formData.append("return","apple_music,spotify");
  const{data}=await axios.post("https://api.audd.io/",formData,{headers:{...formData.getHeaders()},timeout:30000,httpsAgent}); return data;
}

async function buscarImagemInternet(query) {
  const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"; const headers={"User-Agent":UA};
  try{const{data}=await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,{timeout:8000,httpsAgent}); if(data?.originalimage?.source) return data.originalimage.source; if(data?.thumbnail?.source) return data.thumbnail.source;}catch{}
  try{const{data}=await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,{timeout:8000,httpsAgent}); if(data?.originalimage?.source) return data.originalimage.source; if(data?.thumbnail?.source) return data.thumbnail.source;}catch{}
  try{const{data}=await axios.get(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1`,{headers,timeout:12000,httpsAgent}); for(const p of[/"murl":"(https?:\/\/[^"]+)"/,/mediaurl=(https?[^&"]+)/i]){const m=data.match(p); if(m?.[1]){const url=decodeURIComponent(m[1].split("&")[0]); if(url.startsWith("http")) return url;}}}catch{}
  return null;
}

async function uploadParaTelegraph(buffer) {
  const formData=new FormData(); let mimeType="image/jpeg",ext="jpg"; if(buffer[0]===0x89&&buffer[1]===0x50){mimeType="image/png";ext="png";}else if(buffer.slice(0,4).toString("ascii")==="RIFF"){mimeType="image/webp";ext="webp";} formData.append("file",buffer,{filename:`img.${ext}`,contentType:mimeType}); const{data}=await axios.post("https://telegra.ph/upload",formData,{headers:{...formData.getHeaders()},timeout:30000,httpsAgent}); if(data?.[0]?.src) return `https://telegra.ph${data[0].src}`; throw new Error("Upload falhou");
}

async function uploadParaCatbox(buffer, nome="arquivo", mimeType="application/octet-stream") {
  const formData=new FormData(); formData.append("reqtype","fileupload"); formData.append("fileToUpload",buffer,{filename:nome,contentType:mimeType});
  const{data}=await axios.post("https://catbox.moe/user/api.php",formData,{headers:{...formData.getHeaders()},timeout:60000,httpsAgent});
  const url=String(data).trim(); if(!url.startsWith("http")) throw new Error("Catbox falhou"); return url;
}

async function downloadMusica(entrada, altaQualidade=false) {
  const isUrl=entrada.startsWith("http"),nomeBase=`mus_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`,quality=altaQualidade?"0":"5",UA="Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Chrome/112.0 Mobile Safari/537.36";
  const base=`yt-dlp --no-check-certificate -x --audio-format mp3 --audio-quality ${quality} --no-playlist --no-warnings --force-ipv4 --geo-bypass --extractor-args "youtube:player_client=android,ios,tv_embedded" --add-header "User-Agent:${UA}" -o "${saida}"`;
  const fontes=isUrl?[entrada]:[`scsearch1:${entrada}`,`ytsearch1:${entrada}`,`ytsearch1:${entrada.split(" ").slice(0,4).join(" ")} audio`];
  for(const fonte of fontes){try{await runCmd(`${base} "${fonte}"`); const arq=encontrarArquivo("./downloads",nomeBase); if(arq&&fs.statSync(arq).size>3000) return arq;}catch{}}
  return null;
}

async function downloadVideo(entrada) {
  const isUrl=entrada.startsWith("http"),nomeBase=`vid_${Date.now()}`,saidaAny=`./downloads/${nomeBase}.%(ext)s`,pesquisa=isUrl?entrada:`ytsearch1:${entrada}`;
  const UA_MOB="Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Chrome/112.0 Mobile Safari/537.36",UA_DES="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";
  const tentarSalvar=(arq)=>{if(!arq) return null; try{const tam=fs.statSync(arq).size; if(tam>10000&&tam<100*1024*1024) return arq; if(fs.existsSync(arq)) fs.removeSync(arq);}catch{} return null;};
  const tentativas=[["android","18",UA_MOB],["ios","18",UA_MOB],["android","best[height<=480][ext=mp4]",UA_MOB],["ios","best[height<=480][ext=mp4]",UA_MOB],["tv_embedded","best[height<=480][ext=mp4]",UA_DES],["web","best[height<=480][ext=mp4]",UA_DES],["android","worst",UA_MOB],["ios","worst",UA_MOB]];
  for(const [player,fmt,ua] of tentativas){try{await runCmd(`yt-dlp --no-check-certificate --no-playlist --no-warnings --force-ipv4 --geo-bypass --extractor-args "youtube:player_client=${player}" --add-header "User-Agent:${ua}" -f "${fmt}" -o "${saidaAny}" "${pesquisa}"`); const r=tentarSalvar(encontrarArquivo("./downloads",nomeBase)); if(r) return r;}catch{}}
  return null;
}

async function downloadVideoHD(entrada, height=720) {
  const isUrl=entrada.startsWith("http"),pesquisa=isUrl?entrada:`ytsearch1:${entrada}`,nomeBase=`vidhd_${Date.now()}`,saida=`./downloads/${nomeBase}.mp4`,UA="Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Chrome/112.0 Mobile Safari/537.36",LIMITE=90*1024*1024,MAX_SIZE="90M",fmt=`bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/bestvideo+bestaudio/best`;
  const tentarSalvar=(arq)=>{if(!arq) return null; try{const tam=fs.statSync(arq).size; if(tam>10000&&tam<=LIMITE) return arq; if(fs.existsSync(arq)) fs.removeSync(arq);}catch{} return null;};
  for(const player of ["android","ios","tv_embedded","web","default"]){try{await runCmd(`yt-dlp --no-check-certificate --no-playlist --no-warnings --force-ipv4 --geo-bypass --max-filesize ${MAX_SIZE} --extractor-args "youtube:player_client=${player}" --add-header "User-Agent:${UA}" -f "${fmt}" --merge-output-format mp4 -o "${saida}" "${pesquisa}"`); const r=tentarSalvar(saida)||tentarSalvar(encontrarArquivo("./downloads",nomeBase)); if(r) return{filePath:r,quality:`${height}p`,sizeMB:(fs.statSync(r).size/1024/1024).toFixed(1)};}catch{}}
  const r=await downloadVideo(entrada); if(r) return{filePath:r,quality:"480p (fallback)",sizeMB:(fs.statSync(r).size/1024/1024).toFixed(1)};
  throw new Error(`❌ Não consegui baixar em ${height}p.`);
}

async function dlTiktok(url) { try{const{data}=await axios.post("https://www.tikwm.com/api/",`url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`,{headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Mozilla/5.0"},timeout:30000,httpsAgent}); const d=data?.data; if(!d) throw new Error("Sem dados"); return{title:d.title||"TikTok",url:d.hdplay||d.play};}catch(e){throw new Error("TikTok: "+e.message);} }
async function dlTwitter(url) { const nomeBase=`tw_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`; try{await runCmd(`yt-dlp --no-check-certificate --no-playlist -f "best[ext=mp4]/best" -o "${saida}" "${url}"`); const arq=encontrarArquivo("./downloads",nomeBase); if(arq) return{filePath:arq};}catch{} throw new Error("Twitter: não consegui."); }
async function dlInstagram(url) { const nomeBase=`ig_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`; try{await runCmd(`yt-dlp --no-check-certificate --no-playlist -f "best[ext=mp4]/best" -o "${saida}" "${url}"`); const arq=encontrarArquivo("./downloads",nomeBase); if(arq) return{filePath:arq};}catch{} throw new Error("Instagram: não consegui."); }
async function dlSpotify(query) { const arq=await downloadMusica(query,true); if(arq) return{filePath:arq}; throw new Error("Spotify: não encontrei."); }
async function dlSoundcloud(query) { const isUrl=query.startsWith("http"),nomeBase=`sc_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`,fonte=isUrl?query:`scsearch1:${query}`; try{await runCmd(`yt-dlp --no-check-certificate -x --audio-format mp3 --audio-quality 0 --no-playlist --no-warnings -o "${saida}" "${fonte}"`); const arq=encontrarArquivo("./downloads",nomeBase); if(arq) return{filePath:arq};}catch{} const arqFb=await downloadMusica(query,true); if(arqFb) return{filePath:arqFb}; throw new Error("SoundCloud: não encontrei."); }
async function dlPinterest(query) { const isUrl=query.startsWith("http"),UA="Mozilla/5.0"; if(isUrl){try{const{data}=await axios.get(`https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(query)}`,{timeout:15000,httpsAgent}); if(data?.data?.url) return{url:data.data.url};}catch{} throw new Error("Pinterest: não consegui.");} try{const{data}=await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`,{timeout:15000,httpsAgent}); const arr=data?.data||data?.result||[]; if(Array.isArray(arr)&&arr.length){const url=typeof arr[0]==="string"?arr[0]:(arr[0].image_url||arr[0].url||arr[0].src); if(url) return{url};}}catch{} throw new Error("Pinterest: sem resultados."); }
async function dlMediafire(url) { try{const{data}=await axios.get(url,{headers:{"User-Agent":"Mozilla/5.0"},timeout:15000,httpsAgent}); const match=data.match(/href="(https:\/\/download\d+\.mediafire\.com\/[^"]+)"/); if(match) return{url:match[1],title:decodeURIComponent(match[1].split("/").pop().split("?")[0])||"file"}; throw new Error("Link não encontrado.");}catch(e){throw new Error("MediaFire: "+e.message);} }
async function dlApk(query) { try{const{data}=await axios.get(`https://liteapks.com/?s=${encodeURIComponent(query)}`,{headers:{"User-Agent":"Mozilla/5.0"},timeout:15000,httpsAgent}); const regex=/href="(https:\/\/liteapks\.com\/[a-z0-9-]+\.html)"/g; let m; const results=[]; while((m=regex.exec(data))!==null&&results.length<3){const u=m[1]; if(!u.includes("page/")&&!results.find(r=>r===u)) results.push(u);} if(!results.length) throw new Error("Não encontrei."); return{url:results[0],title:results[0].split("/").pop().replace(".html","").replace(/-/g," ")};}catch(e){throw new Error("APK: "+e.message);} }

async function enviarAudio(sock,jid,filePath,msgCitada) {
  if(!fs.existsSync(filePath)) throw new Error("Ficheiro não encontrado");
  const tamOriginal=fs.statSync(filePath).size,oggPath=filePath.replace(/\.[^.]+$/,`_${Date.now()}.ogg`); let converteu=false;
  try{const bitrate=tamOriginal>3*1024*1024?"48k":"64k"; await new Promise((resolve,reject)=>{exec(`ffmpeg -i "${filePath}" -c:a libopus -b:a ${bitrate} -ar 24000 -ac 1 -vn "${oggPath}" -y -loglevel error`,{timeout:60000},(err)=>err?reject(err):resolve());}); if(fs.existsSync(oggPath)&&fs.statSync(oggPath).size>500) converteu=true;}catch{}
  const audioPath=converteu?oggPath:filePath,mimetype=converteu?"audio/ogg; codecs=opus":"audio/mpeg",buffer=fs.readFileSync(audioPath);
  const limpar=()=>{if(converteu&&fs.existsSync(oggPath)) try{fs.removeSync(oggPath);}catch{}};
  try{await sock.sendMessage(jid,{audio:buffer,mimetype,ptt:false},msgCitada?{quoted:msgCitada}:{}); limpar(); return;}catch{}
  try{await sock.sendMessage(jid,{audio:buffer,mimetype:"audio/ogg; codecs=opus",ptt:false},msgCitada?{quoted:msgCitada}:{}); limpar(); return;}catch{}
  try{const b=fs.readFileSync(filePath); await sock.sendMessage(jid,{audio:b,mimetype:"audio/mpeg",ptt:false},msgCitada?{quoted:msgCitada}:{}); limpar();}catch{}
}
async function enviarVideo(sock,jid,filePath,caption,mentions,msgCitada){ const buffer=fs.readFileSync(filePath); try{await sock.sendMessage(jid,{video:buffer,caption,mentions},msgCitada?{quoted:msgCitada}:{});}catch{await sock.sendMessage(jid,{document:buffer,mimetype:"video/mp4",fileName:path.basename(filePath),caption},msgCitada?{quoted:msgCitada}:{});} }

async function criarSticker(imagemBuffer, isAnimated=false) {
  const tempId=Date.now(),tempIn=`./downloads/stk_in_${tempId}.tmp`,tempOut=`./downloads/stk_out_${tempId}.webp`;
  try{
    fs.writeFileSync(tempIn,imagemBuffer);
    const cmd=isAnimated
      ?`ffmpeg -i "${tempIn}" -t 5 -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=12" -c:v libwebp -quality 70 -preset default -loop 0 -an -vsync 0 "${tempOut}" -y -loglevel error`
      :`ffmpeg -i "${tempIn}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -c:v libwebp -quality 90 "${tempOut}" -y -loglevel error`;
    await new Promise((resolve,reject)=>{exec(cmd,{timeout:30000},(err)=>err?reject(err):resolve());});
    if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<100) throw new Error("WebP inválido");
    return fs.readFileSync(tempOut);
  }finally{
    try{fs.removeSync(tempIn);}catch{}
    try{fs.removeSync(tempOut);}catch{}
  }
}

async function stickerParaFoto(buf,isAnimated=false) { const tempId=Date.now(),tempIn=`./downloads/sf_in_${tempId}.webp`,tempOut=`./downloads/sf_out_${tempId}.${isAnimated?"mp4":"jpg"}`; try{ fs.writeFileSync(tempIn,buf); const cmd=isAnimated?`ffmpeg -i "${tempIn}" -c:v libx264 -pix_fmt yuv420p -movflags faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${tempOut}" -y -loglevel error`:`ffmpeg -i "${tempIn}" -frames:v 1 -q:v 2 "${tempOut}" -y -loglevel error`; await new Promise((resolve,reject)=>{exec(cmd,{timeout:30000},(err)=>err?reject(err):resolve());}); if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<100) throw new Error("Conversão inválida"); return{buffer:fs.readFileSync(tempOut),isVideo:isAnimated}; }catch(e){return{buffer:buf,isVideo:false,isWebP:true};}finally{try{fs.removeSync(tempIn);}catch{} try{fs.removeSync(tempOut);}catch{}} }

function analisarArquivo(conteudo,nomeArq){
  const ext=nomeArq.split(".").pop()?.toLowerCase();
  if(ext==="ehi"||ext==="npv"||ext==="hia"){try{let jsonStr=conteudo.trim(); if(!jsonStr.startsWith("{")&&!jsonStr.startsWith("[")){try{jsonStr=Buffer.from(jsonStr,"base64").toString("utf8");}catch{}} const jM=jsonStr.match(/\{[\s\S]+\}/); if(jM) jsonStr=jM[0]; const d=JSON.parse(jsonStr); const nome=d.name||d.configName||nomeArq,servidor=d.server||d.proxyServer||d.sshHost||d.host||"N/A",porta=d.port||d.proxyPort||d.sshPort||"N/A",usuario=d.sshUsername||d.username||d.user||"N/A",senha=d.sshPassword||d.password||"****",payload=d.payload||d.httpPayload||d.customPayload||"N/A",protocolo=d.connectionType||d.protocol||d.mode||(d.sshHost?"SSH":d.proxyServer?"HTTP Proxy":"N/A"),dns=d.dnsServer||d.dns||"N/A",udp=d.udpEnabled||d.udp||false,tls=d.tlsEnabled||d.tls||d.ssl||false,sni=d.sni||d.hostName||d.serverName||"N/A",payloadLimpo=String(payload).replace(/\r?\n/g,"\\n").slice(0,80); return `🔓 *DECRYPT!*\n✦ ─────────── ✦\n📄 *${nomeArq}* | *${nome}*\n\n🌐 Host: *${servidor}*\nPorta: *${porta}* | *${protocolo}*\nSNI: *${sni}*\n\n👤 User: *${usuario}* | Senha: *${senha}*\n\n🔒 TLS: *${tls?"✅":"❌"}* | UDP: *${udp?"✅":"❌"}* | DNS: *${dns}*\n\n📡 Payload: _${payloadLimpo!=="N/A"?payloadLimpo+"...":"N/A"}_`;}catch(e){return `🔓 *DECRYPT*\n📄 *${nomeArq}*\n${conteudo.slice(0,400)}`;}}
  const linhaProto=conteudo.trim().split("\n").find(l=>/^(vless|vmess|trojan|ss):\/\//i.test(l.trim()));
  if(linhaProto){try{const url=new URL(linhaProto.trim()),proto=url.protocol.replace(":",""),params=Object.fromEntries(url.searchParams),nome=decodeURIComponent(url.hash?.slice(1)||"N/A"); return `🔓 *DECRYPT*\n✦ ─────────── ✦\n📄 *${nomeArq}* | Nome: *${nome}*\n\n🌐 Host: *${url.hostname}* | Porta: *${url.port||"N/A"}*\nProtocolo: *${proto.toUpperCase()}* | SNI: *${params.sni||"N/A"}*\n🔒 TLS: *${params.security==="tls"||params.security==="reality"?"✅":"❌"}*`;}catch{}}
  const linhas=conteudo.split("\n"),info={servidor:"N/A",porta:"N/A",protocolo:"N/A",cifra:"N/A",dns:[],tls:false};
  for(const linha of linhas){const l=linha.trim(),ll=l.toLowerCase(); if(ll.startsWith("remote ")){const p=l.split(/\s+/); info.servidor=p[1]||"N/A"; info.porta=p[2]||"N/A"; if(p[3]) info.protocolo=p[3].toUpperCase();} if(ll.startsWith("proto ")) info.protocolo=l.split(" ")[1]?.trim().toUpperCase()||info.protocolo; if(ll.startsWith("cipher ")) info.cifra=l.split(" ")[1]?.trim()||"N/A"; if(ll.startsWith("dhcp-option dns")) info.dns.push(l.split(/\s+/)[2]?.trim()); if(ll.includes("tls-auth")||ll.includes("tls-crypt")) info.tls=true;}
  return `🔓 *DECRYPT*\n✦ ─────────── ✦\n📄 *${nomeArq}*\n🌐 Host: *${info.servidor}* | Porta: *${info.porta}*\nProtocolo: *${info.protocolo}*\n🔒 Cifra: *${info.cifra}* | TLS: *${info.tls?"✅":"❌"}*\n🌍 DNS: *${info.dns.join(", ")||"N/A"}*`;
}

async function verificarInativos(sock){ try{const ativos=fs.readJsonSync(ARQUIVO_ATIVOS),agora=Date.now(),LIMITE=CONFIG.DIAS_INATIVO*24*60*60*1000; for(const gJid of Object.keys(ativos)){try{const meta=await sock.groupMetadata(gJid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); for(const m of meta.participants){const mId=extrairJid(m.id||m); if(admins.includes(mId)||ehDono(mId)) continue; const ultima=ativos[gJid]?.[mId]; if(!ultima||(agora-ultima)>LIMITE){try{await sock.groupParticipantsUpdate(gJid,[mId],"remove"); await sock.sendMessage(gJid,{text:`🚨 @${mId.split("@")[0]} removido por *inatividade*!`,mentions:[mId]});}catch{}}}}catch{}}}catch{} }

async function encontrarGrupoPorArg(sock, ativos, args) {
  const idx=parseInt(args[0]);
  if(!isNaN(idx)&&idx>=1&&idx<=ativos.length) return{grupoJid:ativos[idx-1],mensagem:args.slice(1).join(" ")};
  try{
    const grupos=await sock.groupFetchAllParticipating();
    for(let len=args.length;len>=1;len--){
      const nomeTentativa=args.slice(0,len).join(" ").toLowerCase();
      const encontrado=ativos.find(gJid=>(grupos[gJid]?.subject||"").toLowerCase().includes(nomeTentativa));
      if(encontrado&&len<args.length) return{grupoJid:encontrado,mensagem:args.slice(len).join(" ")};
    }
  }catch{}
  return{grupoJid:null,mensagem:""};
}

async function varreduraGrupos(sock, ehPrimeira=true) {
  try {
    console.log("🔍 A fazer scan dos grupos...");
    await new Promise(r => setTimeout(r, 4000));
    const grupos = await sock.groupFetchAllParticipating();
    let activados = 0;
    for (const [gJid, meta] of Object.entries(grupos)) {
      try {
        const participantes = (meta.participants || []).map(p => extrairJid(p.id || p));
        const donoNoGrupo = participantes.find(p => ehDono(p));
        if (donoNoGrupo) {
          gruposAtivados.add(gJid);
          activados++;
          if (ehPrimeira) {
            const caption = `✨️ *Oi!👑\n\n@${donoNoGrupo.split("@")[0]}`;
            const gifOk = await enviarGif(sock, gJid, caption);
            if (!gifOk) await enviarComFoto(sock, gJid, caption, ppBotUrl);
          }
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch {}
    }
    console.log(`✅ Scan: ${activados} grupo(s) activado(s).`);
  } catch(e) { console.log("❌ Auto-scan:", e.message); }
}

async function proximaPergunta(sock, jid) {
  const loop=jogoLoop[jid]; if(!loop||!loop.activo) return;
  const{tipo,categoria,usadas=[]}=loop;
  let p=await gerarJogoIA(tipo,categoria,usadas);
  if(!p){ if(tipo==="quiz") p=selecionarSemRepetir(QUIZ_BANCO,usadas); if(tipo==="vof") p=selecionarSemRepetir(VOF_BANCO,usadas); if(tipo==="completar") p=selecionarSemRepetir(COMPLETAR_BANCO,usadas); if(tipo==="caca") p=selecionarSemRepetir(CACA_BANCO,usadas); if(tipo==="guerra") p=selecionarSemRepetir(GUERRA_BANCO,usadas); }
  if(!p){ loop.usadas=[]; if(tipo==="quiz") p=QUIZ_BANCO[Math.floor(Math.random()*QUIZ_BANCO.length)]; if(tipo==="vof") p=VOF_BANCO[Math.floor(Math.random()*VOF_BANCO.length)]; if(tipo==="completar") p=COMPLETAR_BANCO[Math.floor(Math.random()*COMPLETAR_BANCO.length)]; if(tipo==="caca") p=CACA_BANCO[Math.floor(Math.random()*CACA_BANCO.length)]; if(tipo==="guerra") p=GUERRA_BANCO[Math.floor(Math.random()*GUERRA_BANCO.length)]; await enviarSemFoto(sock,jid,`🔄 *Banco reiniciado!*`); }
  if(!p){delete jogoLoop[jid]; delete jogoAtivo[jid]; return;}
  const idP=p.p||p.palavra||p.c||p.i; loop.usadas=[...(loop.usadas||[]),idP]; loop.rodada=(loop.rodada||0)+1;
  const R=`Rodada *${loop.rodada}*`; const S=`\n🛑 *${CONFIG.PREFIXO}stop* para parar`;
  if(tipo==="quiz"){jogoAtivo[jid]={tipo:"quiz",r:p.r}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="quiz"&&jogoLoop[jid]?.activo){await enviarSemFoto(sock,jid,`⏰ *Tempo!*\nResposta: *${p.r.toUpperCase()}*\n⏳ Próxima em 3s...`); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid),3000);}},25000); await enviarComFoto(sock,jid,`🎮 *QUIZ* — ${R}\n✦ ─────────── ✦\n❓ *${p.p}*\n\n⏰ 25s | 🏆 +50 XP${S}`,ppBotUrl);}
  if(tipo==="vof"){jogoAtivo[jid]={tipo:"vof",r:p.r}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="vof"&&jogoLoop[jid]?.activo){await enviarSemFoto(sock,jid,`⏰ *Tempo!*\nResposta: *${p.r.toUpperCase()}*\n⏳ Próxima em 3s...`); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid),3000);}},20000); await enviarComFoto(sock,jid,`✅❌ *V/F* — ${R}\n✦ ─────────── ✦\n❓ *${p.p}*\nverdadeiro / falso\n\n⏰ 20s | 🏆 +30 XP${S}`,ppBotUrl);}
  if(tipo==="completar"){jogoAtivo[jid]={tipo:"completar",r:p.c}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="completar"&&jogoLoop[jid]?.activo){await enviarSemFoto(sock,jid,`⏰ *Tempo!*\nResposta: *${p.c.toUpperCase()}*\n⏳ Próxima em 3s...`); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid),3000);}},25000); await enviarComFoto(sock,jid,`🔤 *COMPLETA* — ${R}\n✦ ─────────── ✦\n❓ *${p.i}*\n💡 ${p.d}\n\n⏰ 25s | 🏆 +40 XP${S}`,ppBotUrl);}
  if(tipo==="caca"){jogoAtivo[jid]={tipo:"caca",r:p.palavra.toLowerCase()}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="caca"&&jogoLoop[jid]?.activo){await enviarSemFoto(sock,jid,`⏰ *Tempo!*\nPalavra: *${p.palavra}*\n⏳ Próxima em 5s...`); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid),5000);}},45000); await enviarComFoto(sock,jid,`🔍 *CAÇA-PALAVRAS* — ${R}\n\`\`\`\n${gerarGrade(p.palavra)}\n\`\`\`\n💡 ${p.dica}\n⏰ 45s | 🏆 +60 XP${S}`,ppBotUrl);}
  if(tipo==="guerra"){jogoAtivo[jid]={tipo:"guerra",palavra:p.palavra,dica:p.dica,letrasAcertadas:[],letrasErradas:[],maxErros:6}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="guerra"&&jogoLoop[jid]?.activo){await enviarSemFoto(sock,jid,`⏰ *Tempo!*\nPalavra: *${p.palavra}*\n⏳ Próxima em 5s...`); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid),5000);}},90000); await enviarComFoto(sock,jid,`⚔️ *GUERRA* — ${R}\n✦ ─────────── ✦\n🔤 ${p.palavra.split("").map(()=>"_").join(" ")}\n💡 ${p.dica}\n❤️❤️❤️❤️❤️❤️\n\n⏰ 90s | 🏆 +80 XP${S}`,ppBotUrl);}
}

let tentativasReconexao=0;

async function startBot() {
  try{
    const{version}=await fetchLatestBaileysVersion();
    const{state,saveCreds}=await useMultiFileAuthState("./sessao");
    const sock=makeWASocket({version,auth:state,printQRInTerminal:false,getMessage:async()=>({conversation:""}),generateHighQualityLinkPreview:false,fetchAgent:httpsAgent,logger:silentLogger,connectTimeoutMs:60000,keepAliveIntervalMs:10000,retryRequestDelayMs:2000,maxMsgRetryCount:3});
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
          console.log("\n╔══════════════════════════════════════════╗");
          console.log("║        🔑 CÓDIGO DE PAREAMENTO 🔑        ║");
          console.log("╠══════════════════════════════════════════╣");
          console.log(`║           ➤  ${codeFmt}  ◄             ║`);
          console.log("╠══════════════════════════════════════════╣");
          console.log(`║  📞 Número: +${phoneNumber}             ║`);
          console.log("║  ⏰ Tens 30 segundos!                    ║");
          console.log("╚══════════════════════════════════════════╝\n");
        }catch(e){console.error("❌ Erro ao solicitar código:",e.message); process.exit(1);}
      }
    }

    sock.ev.on("connection.update",async({connection,lastDisconnect})=>{
      if(connection==="close"){
        const codigo=lastDisconnect?.error?.output?.statusCode,motivo=lastDisconnect?.error?.message||"desconhecido";
        console.log(`\n❌ Desconectado | Código: ${codigo} | Motivo: ${motivo}`);
        if(codigo===DisconnectReason.loggedOut||codigo===401){
          if(motivo.includes("conflict")){console.log("\n⚠️ CONFLITO — reconectando em 15s...\n"); setTimeout(()=>startBot(),15000); return;}
          console.log("\n⚠️ Sessão expirada!\n   rm -rf sessao/ && node index.js\n"); process.exit(0);
        }
        tentativasReconexao++;
        setTimeout(()=>startBot(),Math.min(5000*tentativasReconexao,60000));
      }
      if(connection==="open"){
        tentativasReconexao=0;
        console.log(`\n✅ Bot conectado! +${CONFIG.NUMERO_BOT}`);
        console.log(`📅 ${new Date().toLocaleString("pt-AO",{timeZone:"Africa/Luanda"})}\n`);
        try{ppBotUrl=await sock.profilePictureUrl(sock.user.id,"image");}catch{ppBotUrl=null;}
        const ehPrimeira=primeiraConexao;
        if(primeiraConexao) primeiraConexao=false;
        setTimeout(()=>varreduraGrupos(sock,ehPrimeira),5000);
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
              const listaAdm=admins.length>0?admins.map(a=>`👮 @${a.split("@")[0]}`).join("\n│ "):"_(sem admins)_";
              let ppUser=null; try{ppUser=await sock.profilePictureUrl(p,"image");}catch{}
              const texto=`🎉 *BEM-VINDO AO GRUPO!* 🎉\n✦ ─────────── ✦\n\n👋 Olá @${p.split("@")[0]}!\nBem-vindo(a) ao *${meta.subject}*! 🤗\n\n╭─── 📋 *REGRAS* ───╮\n│ ❌ Sem links\n│ ❌ Sem spam\n│ ❌ Sem pornografia\n│ ❌ Sem ofensas\n│ ❌ Sem status\n│ ✅ Respeita todos\n╰───────────────────╯\n\n╭─── 👑 *ADMINS* ───╮\n│ ${listaAdm}\n╰───────────────────╯\n\n🤖 Usa *${CONFIG.PREFIXO}menu* !\n_Aproveita!_ 🎊`;
              if(ppUser) await sock.sendMessage(id,{image:{url:ppUser},caption:texto,mentions});
              else await sock.sendMessage(id,{text:texto,mentions});
            }catch(e){console.log("❌ Boas-vindas:",e.message);}
          }
        }
        if(action==="remove"){
          for(const participante of participants){
            const p=extrairJid(participante); if(!p||!p.includes("@")) continue;
            try{await sock.sendMessage(id,{text:`👋 *SAÍU +1*\n✦ ─────────── ✦\n\nÉ por causa de @${p.split("@")[0]} que a\nRede Estava Lenta 🚶🏿‍♂️\n\n*BAZAAA...* 😂💨`,mentions:[p]});}catch{}
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

        if(!msg.key.fromMe){
          const m=msg.message; const voMsg=m?.viewOnceMessage?.message||m?.viewOnceMessageV2?.message||m?.viewOnceMessageV2Extension?.message;
          if(voMsg){(async()=>{try{const buf=await downloadMediaMessage(msg,"buffer",{}); const tipo=voMsg.videoMessage?"video":(voMsg.audioMessage||voMsg.pttMessage)?"audio":"imagem"; const remetente=extrairJid(isGrupo?(msg.key.participant||""):msg.key.remoteJid); if(!cacheViewOnce[jid]) cacheViewOnce[jid]={}; cacheViewOnce[jid][msg.key.id]={tipo,buf,sender:remetente,timestamp:Date.now()}; setTimeout(()=>{if(cacheViewOnce[jid]?.[msg.key.id]) delete cacheViewOnce[jid][msg.key.id];},60*60*1000);}catch{}})();}
        }
        if(!msg.key.fromMe){const sC=extrairJid(isGrupo?(msg.key.participant||""):msg.key.remoteJid); if(!cacheMsg[jid]) cacheMsg[jid]={}; cacheMsg[jid][msg.key.id]={sender:sC,texto:getTexto(msg)||"",tipo:getTipoMsg(msg),timestamp:Date.now()}; const cK=Object.keys(cacheMsg[jid]); if(cK.length>MAX_CACHE_MSG) delete cacheMsg[jid][cK[0]];}
        if(msg.message?.protocolMessage?.type===0){const kD=msg.message.protocolMessage.key,mDI=kD?.id,jD=kD?.remoteJid||jid; const mC=cacheMsg[jD]?.[mDI]||cacheMsg[jid]?.[mDI]; if(mC&&(mC.texto||mC.tipo)){if(!msgApagadas[jid]) msgApagadas[jid]=[]; msgApagadas[jid].push({...mC,apagadoEm:Date.now()}); if(msgApagadas[jid].length>30) msgApagadas[jid].shift();} return;}
        if(msg.key.fromMe) return;

        const sender=extrairJid(isGrupo?(msg.key.participant||""):msg.key.remoteJid);
        const isDono=ehDono(sender),texto=getTexto(msg);
        const mencoes=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];

        if(isGrupo&&!msg.key.fromMe){
          if(!historyMsgs[jid]) historyMsgs[jid]=[];
          historyMsgs[jid].push({key:msg.key,sender,texto:getTexto(msg)||"",timestamp:Date.now()});
          if(historyMsgs[jid].length>MAX_HISTORY) historyMsgs[jid].shift();
        }

        if(isGrupo){addXP(sender,2); registarAtividade(sender,jid); salvarNoBuffer(jid,{sender,texto,mencoes,timestamp:Date.now()});}

        // ✅ HANDLER: Botão clicado (buttonsResponseMessage)
        const btnResp=msg.message?.buttonsResponseMessage;
        if(btnResp){
          const btnId=btnResp.selectedButtonId;
          if(btnId==="btn_abrir_menu"||btnId==="btn_menu"){
            if(isGrupo&&!isDono&&!gruposAtivados.has(jid)) return;
            if(chatsDesativados.has(jid)&&!isDono) return;
            if(!isDono&&!senhasAprovadas.has(sender)){
              if(isGrupo){let iA=false; try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); iA=admins.includes(sender);}catch{} if(iA){senhasAprovadas.add(sender);}else return;}else return;
            }
            await reagir(sock,msg,"✅");
            await abrirListaCategorias(sock,jid,msg,isDono);
            return;
          }
        }

        // ✅ HANDLER: Lista interactiva (listResponseMessage)
        const listResp=msg.message?.listResponseMessage;
        if(listResp){
          const catId=listResp.singleSelectReply?.selectedRowId;
          if(catId&&catId.startsWith("cat_")){
            if(isGrupo&&!isDono&&!gruposAtivados.has(jid)) return;
            if(chatsDesativados.has(jid)&&!isDono) return;
            if(!isDono&&!senhasAprovadas.has(sender)){
              let iA=false;
              if(isGrupo){try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); iA=admins.includes(sender);}catch{} if(iA){senhasAprovadas.add(sender);}else return;}else return;
            }
            await enviarSubmenu(sock,jid,msg,catId);
            return;
          }
        }

        // !ergue-se
        if(isDono&&isGrupo&&texto===`${CONFIG.PREFIXO}ergue-se`){
          gruposAtivados.add(jid);
          const caption=`✅ *ERGUE-TE!* 🤴🏽\n✦ ─────────── ✦\n\nAs tuas Ordens meu senhor! ✨️👑\n\n🔒 Anti-link: *ACTIVO*\n🚫 Anti-menção: *ACTIVO*\n⛔ Anti-status: *ACTIVO*\n\n_Usa *${CONFIG.PREFIXO}menu*!_`;
          await reagir(sock,msg,"✅");
          const gifOk=await enviarGif(sock,jid,caption);
          if(!gifOk) await enviarComFoto(sock,jid,caption,ppBotUrl);
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

        // JOGOS
        if(isGrupo&&jogoAtivo[jid]){
          const jogo=jogoAtivo[jid],resp=texto.toLowerCase().trim(),loop=jogoLoop[jid];
          const acertou=async(xp)=>{addXP(sender,xp); await reagir(sock,msg,"🎉"); await enviarComFoto(sock,jid,`🎉 *CORRETO!*\n✅ @${sender.split("@")[0]} acertou!\n🏆 +${xp} XP!${loop?.activo?"\n⏳ Próxima em 3s...":""}`,ppBotUrl); if(loop?.timeoutHandle) clearTimeout(loop.timeoutHandle); delete jogoAtivo[jid]; if(loop?.activo) setTimeout(()=>proximaPergunta(sock,jid),3000);};
          if(jogo.tipo==="quiz"&&resp===jogo.r){await acertou(50); return;}
          if(jogo.tipo==="completar"&&resp===jogo.r){await acertou(40); return;}
          if(jogo.tipo==="caca"&&resp===jogo.r){await acertou(60); return;}
          if(jogo.tipo==="vof"){const ru=resp==="v"?"verdadeiro":resp==="f"?"falso":resp; if(ru==="verdadeiro"||ru==="falso"){if(ru===jogo.r){await acertou(30);}else{await reagir(sock,msg,"❌"); await enviarComFoto(sock,jid,`❌ *ERRADO!*\nResposta: *${jogo.r.toUpperCase()}*${loop?.activo?"\n⏳ Próxima em 3s...":""}`,ppBotUrl); if(loop?.timeoutHandle) clearTimeout(loop.timeoutHandle); delete jogoAtivo[jid]; if(loop?.activo) setTimeout(()=>proximaPergunta(sock,jid),3000);} return;}}
          if(jogo.tipo==="guerra"){
            const lP=texto.toUpperCase().trim().replace(/[^A-Z]/g,""); if(!lP) return;
            if(lP===jogo.palavra){await acertou(80); return;}
            if(lP.length===1){
              if(jogo.letrasAcertadas.includes(lP)||jogo.letrasErradas.includes(lP)){await enviarSemFoto(sock,jid,`⚠️ *${lP}* já foi usada!\n\n${mostrarGuerraEstado(jogo)}`); return;}
              if(jogo.palavra.includes(lP)){jogo.letrasAcertadas.push(lP); const pM=jogo.palavra.split("").map(l=>jogo.letrasAcertadas.includes(l)?l:"_").join(" "); if(!pM.includes("_")){await acertou(80); return;} await enviarSemFoto(sock,jid,`✅ *${lP}* está!\n\n${mostrarGuerraEstado(jogo)}`);}
              else{jogo.letrasErradas.push(lP); if(jogo.letrasErradas.length>=jogo.maxErros){await enviarComFoto(sock,jid,`💀 *FIM!*\nPalavra: *${jogo.palavra}*${loop?.activo?"\n⏳ Próxima em 5s...":""}`,ppBotUrl); if(loop?.timeoutHandle) clearTimeout(loop.timeoutHandle); delete jogoAtivo[jid]; if(loop?.activo) setTimeout(()=>proximaPergunta(sock,jid),5000);}else{await enviarSemFoto(sock,jid,`❌ *${lP}* NÃO está!\n\n${mostrarGuerraEstado(jogo)}`);}}
              return;
            }
          }
        }

        // WAKE WORD
        const audioMsgDireto=msg.message?.audioMessage||msg.message?.pttMessage;
        if(audioMsgDireto&&!vozBotDesativado.has(jid)&&(!isGrupo||!chatsDesativados.has(jid))){
          const voiceLimitKey=`voice_${sender}`,agoraV=Date.now();
          if(!userRateLimit[voiceLimitKey]||(agoraV-userRateLimit[voiceLimitKey])>3000){
            userRateLimit[voiceLimitKey]=agoraV;
            (async()=>{try{const audioData=await downloadAudioDaMensagem(msg); if(!audioData) return; const transcricao=await transcreverComGroq(audioData.buffer); const pergunta=detectarWakeWord(transcricao); if(pergunta===null) return; await reagir(sock,msg,"🎙️"); if(!pergunta){await enviarSemFoto(sock,jid,`👋 Diz *Isaías* seguido da pergunta!`,msg); return;} await enviarSemFoto(sock,jid,`🎙️ _"${pergunta}"_\n🧠 A pensar...`,msg); const resposta=await chatIA(pergunta); try{const audioPath=await textoParaFala(resposta); await enviarAudio(sock,jid,audioPath,msg); try{fs.removeSync(audioPath);}catch{}}catch(eTTS){await enviarSemFoto(sock,jid,`🤖 *ISAÍAS:*\n\n${resposta}`,msg);} addXP(sender,5);}catch(e){console.log("❌ Wake word:",e.message);}})();
          }
          return;
        }

        // Gate senha
        if(!texto.startsWith(CONFIG.PREFIXO)){
          if(!isDono&&!senhasAprovadas.has(sender)){
            if(isGrupo&&isAdmin){senhasAprovadas.add(sender);}
            else if(texto.trim()===CONFIG.SENHA_BOT){senhasAprovadas.add(sender); await enviarSemFoto(sock,jid,`✅ *Acesso permitido!* 🎉\nEscreve *${CONFIG.PREFIXO}menu* para começar.`,msg);}
          }
          return;
        }

        if(!isDono&&!verificarRateLimit(sender)){await reagir(sock,msg,"⏳"); return;}
        const args=texto.slice(CONFIG.PREFIXO.length).trim().split(/\s+/);
        const comando=args.shift().toLowerCase();

        if(!isDono&&!senhasAprovadas.has(sender)){
          if(isGrupo&&isAdmin){senhasAprovadas.add(sender);}
          else{const chave=`pw_${sender}_${jid}`; if(!pedidoSenha.has(chave)){pedidoSenha.add(chave); setTimeout(()=>pedidoSenha.delete(chave),60000); await enviarSemFoto(sock,jid,`🔒 *Acesso restrito!*\nEnvia a *palavra-passe* para usar o bot.\n_Contacta ${CONFIG.DONO_NUM} para o código._`);} return;}
        }

        await reagir(sock,msg,"⏳");
        salvarStats(comando,sender);

        if(comandosBloqueados.has(jid)&&!isAdmin&&!["bloq","desbloq"].includes(comando)){await enviarSemFoto(sock,jid,`🔒 *Comandos bloqueados!*`); await reagir(sock,msg,"🔒"); return;}
        if(!TODOS_COMANDOS.has(comando)){
          const chave=`${jid}_${sender}`,erros=(errosComando[chave]||0)+1; errosComando[chave]=erros; setTimeout(()=>{delete errosComando[chave];},5*60*1000);
          let ppErrou=null; try{ppErrou=await sock.profilePictureUrl(sender,"image");}catch{}
          const textoErro=`@${sender.split("@")[0]} Assim esse Comando é pra Fazer o quê😑\nTá errado❌️🚶🏿‍♂️\n\nEscreve *${CONFIG.PREFIXO}menu* pra ver os comandos⏳️\n\n`+(erros>=3?`⚠️ *Já erraste ${erros}x!*\n*Continua e vou te BANIR🙂*`:`Se errar mais vou te BANIR🙂`);
          if(ppErrou) await sock.sendMessage(jid,{image:{url:ppErrou},caption:textoErro,mentions:[sender]},{quoted:msg});
          else await sock.sendMessage(jid,{text:textoErro,mentions:[sender]},{quoted:msg});
          await reagir(sock,msg,"❌"); return;
        }

        const CMDS_ADMIN=["banir","addadmin","removeadmin","fechar","abrir","all","att","anti-link","bot","link","sorteio","verifica","silenciar","dessilenciar","silenciados","decrypt","arqadd","arqdelete","add","aviso","apagar","vozbot","bloq","desbloq","nomegrupo","descgrupo","fotogrupo","scanlink"];
        if(CMDS_ADMIN.includes(comando)&&!isAdmin){await enviarSemFoto(sock,jid,`🔒 *Apenas administradores.*`); await reagir(sock,msg,"🚫"); return;}
        const CMDS_DONO=["out","prefixo","prefixos","set","chaton","sms","gsms"];
        if(CMDS_DONO.includes(comando)&&!isDono){await enviarSemFoto(sock,jid,`🔒 *Apenas o dono do bot.*`); await reagir(sock,msg,"🚫"); return;}

        // ═══════════════════════════════════
        //         TODOS OS COMANDOS
        // ═══════════════════════════════════

        if(comando==="set"){const novaSenha=args.join(" ").replace(/['"]/g,"").trim(); if(!novaSenha){await enviarSemFoto(sock,jid,`🔑 *${CONFIG.PREFIXO}set [nova_senha]*\nActual: *${CONFIG.SENHA_BOT}*`); return;} CONFIG.SENHA_BOT=novaSenha; senhasAprovadas.clear(); await enviarSemFoto(sock,jid,`✅ *Senha alterada!*\n🔑 *${novaSenha}*`); await reagir(sock,msg,"🔑"); return;}
        if(comando==="id"){const numExtraido=sender.split("@")[0].split(":")[0]; await enviarSemFoto(sock,jid,`📱 *JID*\n✦ ─────────── ✦\n_${sender}_\nNúmero: _${numExtraido}_\n👑 Dono: ${isDono?"✅":"❌"} | 👮 Admin: ${isAdmin?"✅":"❌"}`); await reagir(sock,msg,"📱"); return;}
        if(comando==="out"){if(!isGrupo){await enviarSemFoto(sock,jid,"❌ Só em grupos."); return;} try{await sock.sendMessage(jid,{text:`👋 *Bot a sair...*`}); await new Promise(r=>setTimeout(r,1000)); await sock.groupLeave(jid);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);}; return;}
        if(comando==="prefixo"||comando==="prefixos"){if(!args[0]){await enviarComFoto(sock,jid,`⚙️ Prefixo: *${CONFIG.PREFIXO}*`,ppBotUrl); return;} const antigoP=CONFIG.PREFIXO; CONFIG.PREFIXO=args[0].trim().charAt(0); await enviarComFoto(sock,jid,`✅ Prefixo: *${antigoP}* → *${CONFIG.PREFIXO}*`,ppBotUrl); return;}
        if(comando==="bloq"){comandosBloqueados.add(jid); await enviarComFoto(sock,jid,`🔒 *Comandos bloqueados!*`,ppBotUrl); await reagir(sock,msg,"🔒"); return;}
        if(comando==="desbloq"){comandosBloqueados.delete(jid); await enviarComFoto(sock,jid,`🔓 *Comandos desbloqueados!*`,ppBotUrl); await reagir(sock,msg,"🔓"); return;}
        if(comando==="add"&&isGrupo){if(!args[0]){await enviarComFoto(sock,jid,`📱 *${CONFIG.PREFIXO}add [número]*`,ppBotUrl); return;} let numero=args[0].replace(/[^\d]/g,""); if(numero.startsWith("00")) numero=numero.slice(2); if(numero.startsWith("244")&&numero.length===12){}else if(numero.length===9) numero=`244${numero}`; else if(numero.startsWith("0")&&numero.length===10) numero=`244${numero.slice(1)}`; await enviarSemFoto(sock,jid,`📱 A adicionar *+${numero}*...\n⏳`); try{const result=await sock.groupParticipantsUpdate(jid,[`${numero}@s.whatsapp.net`],"add"); const status=result?.[0]?.status; if(status===200){await enviarComFoto(sock,jid,`✅ *+${numero}* adicionado!`,ppBotUrl); await reagir(sock,msg,"✅");}else if(status===408){await enviarSemFoto(sock,jid,`❌ Sem WhatsApp.`);}else if(status===403){await enviarSemFoto(sock,jid,`⚠️ Não permite adição.`);}else{await reagir(sock,msg,"✅");}}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="bot"){const op=args.join(" ").toLowerCase(); if(op.includes("off")){chatsDesativados.add(jid); await enviarComFoto(sock,jid,`🔴 *BOT OFF!*`,ppBotUrl);}else if(op.includes("la")||op.includes("djum")||op==="on"){chatsDesativados.delete(jid); await enviarComFoto(sock,jid,`✅ *BOT ON!* 🤴🏽`,ppBotUrl);} return;}
        if(comando==="anti-link"){const op=args[0]?.toLowerCase(); if(op==="off"){antiLinkDesativado.add(jid); await enviarComFoto(sock,jid,`⚠️ *Anti-link DESACTIVADO!*`,ppBotUrl);}else{antiLinkDesativado.delete(jid); await enviarComFoto(sock,jid,`✅ *Anti-link ACTIVADO!*`,ppBotUrl);} return;}
        if(comando==="silenciar"&&isGrupo){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await enviarSemFoto(sock,jid,`↩️ Responde com *${CONFIG.PREFIXO}silenciar*`); return;} if(!membrosSilenciados[jid]) membrosSilenciados[jid]=[]; if(!membrosSilenciados[jid].includes(alvo)){membrosSilenciados[jid].push(alvo); salvarSilenciados();} await enviarComFoto(sock,jid,`🔇 *@${alvo.split("@")[0]} silenciado!*`,ppBotUrl); await reagir(sock,msg,"🔇"); return;}
        if(comando==="dessilenciar"&&isGrupo){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await enviarSemFoto(sock,jid,`↩️ Responde com *${CONFIG.PREFIXO}dessilenciar*`); return;} if(membrosSilenciados[jid]){membrosSilenciados[jid]=membrosSilenciados[jid].filter(m=>m!==alvo); salvarSilenciados();} await enviarComFoto(sock,jid,`🔊 *@${alvo.split("@")[0]} dessilenciado!*`,ppBotUrl); return;}
        if(comando==="silenciados"&&isGrupo){const lista=membrosSilenciados[jid]||[]; if(!lista.length) await enviarComFoto(sock,jid,`🔊 Nenhum silenciado.`,ppBotUrl); else await enviarComFoto(sock,jid,`🔇 *Silenciados:*\n${lista.map((m,i)=>`${i+1}. @${m.split("@")[0]}`).join("\n")}`,ppBotUrl); return;}
        if(comando==="vozbot"){const op=args[0]?.toLowerCase(); if(op==="off"){vozBotDesativado.add(jid); await enviarComFoto(sock,jid,`🔇 *Voz desactivada!*`,ppBotUrl);}else if(op==="on"){vozBotDesativado.delete(jid); await enviarComFoto(sock,jid,`🎙️ *Voz activada!*`,ppBotUrl);}else{await enviarComFoto(sock,jid,`🎙️ ${vozBotDesativado.has(jid)?"🔇 OFF":"🟢 ON"}\n*${CONFIG.PREFIXO}vozbot on/off*`,ppBotUrl);} await reagir(sock,msg,"✅"); return;}
        if(comando==="nomegrupo"&&isGrupo){const novoNome=args.join(" ").trim(); if(!novoNome){await enviarComFoto(sock,jid,`✏️ *${CONFIG.PREFIXO}nomegrupo [nome]*`,ppBotUrl); return;} try{await sock.groupUpdateSubject(jid,novoNome); await enviarComFoto(sock,jid,`✅ *Nome alterado:*\n_${novoNome}_`,ppBotUrl); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="descgrupo"&&isGrupo){const novaDesc=args.join(" ").trim(); if(!novaDesc){await enviarComFoto(sock,jid,`✏️ *${CONFIG.PREFIXO}descgrupo [descrição]*`,ppBotUrl); return;} try{await sock.groupUpdateDescription(jid,novaDesc); await enviarComFoto(sock,jid,`✅ *Descrição actualizada!*`,ppBotUrl); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="fotogrupo"&&isGrupo){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await enviarComFoto(sock,jid,`📷 Responde imagem com *${CONFIG.PREFIXO}fotogrupo*`,ppBotUrl); return;} try{await sock.updateProfilePicture(jid,imgBuf); await enviarComFoto(sock,jid,`✅ *Foto do grupo actualizada!*`,ppBotUrl); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}

        // ✅ MENU
        if(comando==="menu"||comando==="ajuda"){
          const sub=args[0]?.toLowerCase();
          const catMap={musica:"cat_musica",social:"cat_social",ia:"cat_ia",jogos:"cat_jogos",util:"cat_util",extra:"cat_extra",arq:"cat_arq",adm:"cat_adm",admin:"cat_adm",grup:"cat_grup",dono:"cat_dono"};
          if(sub&&catMap[sub]){await enviarSubmenu(sock,jid,msg,catMap[sub]);}
          else{await enviarMenuPrincipal(sock,jid,msg,isDono,sender,isAdmin);}
          return;
        }

        if(comando==="sobre"){await enviarComFoto(sock,jid,
`┌─⊱ 『 🤖 SOBRE O BOT 』 ⊰─┐
│
◎ ─ *LORDE LÁ DJUM v3.5* 🤴🏽
◎ ─ 👑 Criado por: *ISAÍAS PEDRO*
│
◎ ─ ✅ Menu interativo (imagem+botão)
◎ ─ ✅ Shazam com ⚡ lightning
◎ ─ ✅ Editor IA 🎨
◎ ─ ✅ Placar ao vivo ⚽
◎ ─ ✅ Mídia para link 🔗
◎ ─ ✅ Sticker puro ffmpeg
◎ ─ ✅ GIF Solo Leveling
◎ ─ ✅ Ban automático 5→0
◎ ─ ✅ Arquivos / VPN
◎ ─ ✅ SMS / GSMS / ScanLink
◎ ─ ✅ Reconexão silenciosa
◎ ─ ✅ Jogos em loop ♾️
│
└──────────────────────────────⊰
_© LORDE LÁ DJUM v3.5 — 24/7_ 🟢`,ppBotUrl); return;}

        // EDITAR
        if(comando==="editar"){
          const instrucao=args.join(" ").trim();
          if(!instrucao){await enviarComFoto(sock,jid,`┌─⊱ 『 🎨 EDITOR IA 』 ⊰─┐\n│\n◎ ─ *${CONFIG.PREFIXO}editar* [instrução]\n    _↩️ responde uma imagem_\n│\n◎ ─ _Ex:_\n   _adiciona óculos_\n   _muda fundo para praia_\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
          const imgBuf=await downloadImagemDaMensagem(msg);
          if(!imgBuf){await enviarSemFoto(sock,jid,`↩️ Responde uma *imagem* com *${CONFIG.PREFIXO}editar [instrução]*`); return;}
          await enviarSemFoto(sock,jid,`🎨 A editar com IA...\n💡 _${instrucao}_\n⏳ Aguarda (pode demorar 1 min)`);
          try{
            const form=new FormData();
            form.append("image",imgBuf,{filename:"imagem.jpg",contentType:"image/jpeg"});
            form.append("prompt",instrucao);
            form.append("apikey",CONFIG.SYSTEMZONE_KEY);
            const{data}=await axios.post("https://systemzone.store/api/v2/edit/deepai",form,{headers:{...form.getHeaders()},timeout:90000,httpsAgent});
            const urlResultado=data?.imagem||data?.result||data?.download_url||data?.url;
            if(!urlResultado) throw new Error("API sem imagem");
            await sock.sendMessage(jid,{image:{url:urlResultado.replace("http://","https://")},caption:`✨ *Imagem editada!*\n✦ ─────────── ✦\n💡 _${instrucao}_\n\n_© LORDE LÁ DJUM v3.5_`},{quoted:msg});
            await reagir(sock,msg,"✅"); addXP(sender,5);
          }catch(e){console.log("❌ editar:",e.message); await enviarSemFoto(sock,jid,`❌ Erro ao editar: ${e.message.slice(0,100)}`); await reagir(sock,msg,"❌");}
          return;
        }

        // PLACAR
        if(comando==="placar"){
          const busca=args.join(" ").trim();
          if(!busca){await enviarComFoto(sock,jid,`┌─⊱ 『 ⚽ PLACAR AO VIVO 』 ⊰─┐\n│\n◎ ─ *${CONFIG.PREFIXO}placar* [jogo/equipa]\n│\n◎ ─ _Ex:_\n   _${CONFIG.PREFIXO}placar Brasil_\n   _${CONFIG.PREFIXO}placar Real Madrid_\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
          await enviarSemFoto(sock,jid,`⚽ A buscar placar de _${busca}_...\n⏳`);
          try{
            const{data}=await axios.get(`https://systemzone.store/api/placar?search=${encodeURIComponent(busca)}`,{timeout:15000,httpsAgent});
            if(!data?.status||!data?.result) throw new Error("Sem resultado");
            const res=data.result,casa=res.times?.casa||"?",fora=res.times?.fora||"?",pC=res.placar?.casa??"?",pF=res.placar?.fora??"?",st=res.status||"N/D";
            const aoVivo=st.toLowerCase().includes("andamento")||st.toLowerCase().includes("vivo");
            let txt=`┌─⊱ 『 ${aoVivo?"🔴 AO VIVO":"⚽ PLACAR"} 』 ⊰─┐\n│\n◎ ─ *${casa}*  ${pC} × ${pF}  *${fora}*\n◎ ─ 📊 _${st}_\n│\n◎ ─ ⚡ *LANCES:*`;
            if(res.cronologia?.length){const agrupado={}; res.cronologia.forEach(l=>{const p=l.periodo||"Geral"; if(!agrupado[p]) agrupado[p]=[]; agrupado[p].push(l);}); for(const[periodo,lances] of Object.entries(agrupado)){txt+=`\n│\n◎ ─ *${periodo.toUpperCase()}*`; lances.forEach(l=>{const min=(l.minuto||"").replace(/39;/g,"'"); const det=l.detalhe?` _(${l.detalhe})_`:""; txt+=`\n   [${min}] ${l.time} — ${l.tipo}: *${l.jogador}*${det}`;});}}else{txt+="\n   _Nenhum lance registado._";}
            txt+="\n│\n└──────────────────────────────⊰";
            await enviarComFoto(sock,jid,txt,ppBotUrl); await reagir(sock,msg,"⚽");
          }catch(e){console.log("❌ placar:",e.message); await enviarSemFoto(sock,jid,`❌ Não encontrei placar para *${busca}*.\n_Tenta: ${CONFIG.PREFIXO}placar Brasil_`);}
          return;
        }

        // TOURL
        if(comando==="tourl"){
          const midia=await downloadQualquerMidia(msg);
          if(!midia){await enviarSemFoto(sock,jid,`┌─⊱ 『 🔗 MÍDIA → LINK 』 ⊰─┐\n│\n◎ ─ *${CONFIG.PREFIXO}tourl*\n    _↩️ responde qualquer mídia_\n│\n◎ ─ 🖼️ Imagem | 🎥 Vídeo\n◎ ─ 🎙️ Áudio | 📄 Documento\n│\n└──────────────────────────────⊰`); return;}
          await enviarSemFoto(sock,jid,`🔗 A gerar link para: _${midia.nome}_\n⏳`);
          try{
            let url;
            if(midia.mime.startsWith("image/")&&!midia.mime.includes("webp")){try{url=await uploadParaTelegraph(midia.buffer);}catch{url=await uploadParaCatbox(midia.buffer,midia.nome,midia.mime);}}else{url=await uploadParaCatbox(midia.buffer,midia.nome,midia.mime);}
            const tam=(midia.buffer.length/1024).toFixed(1);
            await enviarComFoto(sock,jid,`┌─⊱ 『 🔗 LINK GERADO! 』 ⊰─┐\n│\n◎ ─ 📎 *${midia.nome}*\n◎ ─ 💾 *${tam} KB* | _${midia.mime}_\n│\n◎ ─ 🌐 ${url}\n│\n└──────────────────────────────⊰`,ppBotUrl);
            await reagir(sock,msg,"✅"); addXP(sender,3);
          }catch(e){console.log("❌ tourl:",e.message); await enviarSemFoto(sock,jid,`❌ Erro: ${e.message.slice(0,80)}`);}
          return;
        }

        // SCANLINK
        if(comando==="scanlink"){
          if(!isGrupo){await enviarSemFoto(sock,jid,"❌ Só funciona em grupos."); return;}
          const historico=historyMsgs[jid]||[];
          if(!historico.length){await enviarComFoto(sock,jid,`┌─⊱ 『 🔍 SCAN DE LINKS 』 ⊰─┐\n│\n◎ ─ 📭 Sem histórico ainda.\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
          await enviarComFoto(sock,jid,`┌─⊱ 『 🔍 A VARRER CHAT 』 ⊰─┐\n│\n◎ ─ 📊 Msgs: *${historico.length}*\n◎ ─ 🔗 A procurar links...\n│\n└──────────────────────────────⊰`,ppBotUrl);
          try{
            const meta=await sock.groupMetadata(jid);
            const admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p));
            const membrosActuais=new Set(meta.participants.map(p=>extrairJid(p.id||p)));
            let deletados=0,banidos=0;
            const banidosSet=new Set();
            const linksEncontrados=[];
            for(const h of historico){if(!h.texto||!LINK_RX.test(h.texto)) continue; if(admins.includes(h.sender)||ehDono(h.sender)) continue; linksEncontrados.push(h);}
            if(!linksEncontrados.length){await enviarComFoto(sock,jid,`┌─⊱ 『 ✅ SCAN CONCLUÍDO! 』 ⊰─┐\n│\n◎ ─ 🔍 Verificadas: *${historico.length}* msgs\n◎ ─ ✅ Nenhum link!\n◎ ─ 🎉 Chat LIMPO!\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"✅"); return;}
            for(const h of linksEncontrados){try{await sock.sendMessage(jid,{delete:h.key}); deletados++;}catch{} await new Promise(r=>setTimeout(r,300));}
            for(const h of linksEncontrados){if(banidosSet.has(h.sender)) continue; if(!membrosActuais.has(h.sender)) continue; try{await sock.groupParticipantsUpdate(jid,[h.sender],"remove"); await sock.sendMessage(jid,{text:`🚨 *BAN!* @${h.sender.split("@")[0].split(":")[0]}\n_Link no scan_`,mentions:[h.sender]}); banidosSet.add(h.sender); banidos++;}catch{} await new Promise(r=>setTimeout(r,500));}
            historyMsgs[jid]=[];
            const listaLinks=linksEncontrados.slice(0,5).map((h,i)=>`   ${i+1}. @${h.sender.split("@")[0].split(":")[0]} — _${h.texto.slice(0,35)}_`).join("\n");
            const extra=linksEncontrados.length>5?`\n   _...e mais ${linksEncontrados.length-5}_`:"";
            await enviarComFoto(sock,jid,`┌─⊱ 『 ✅ SCAN CONCLUÍDO! 』 ⊰─┐\n│\n◎ ─ 📊 Verificadas: *${historico.length}*\n◎ ─ 🔗 Links: *${linksEncontrados.length}*\n◎ ─ 🗑️ Eliminadas: *${deletados}*\n◎ ─ 🔨 Banidos: *${banidos}*\n│\n◎ ─ 📋 *Infractores:*\n${listaLinks}${extra}\n│\n◎ ─ 🧹 _Histórico limpo!_\n│\n└──────────────────────────────⊰`,ppBotUrl);
            await reagir(sock,msg,"🔨");
          }catch(e){await enviarSemFoto(sock,jid,`❌ Erro: ${e.message}`);}
          return;
        }

        // CHATON
        if(comando==="chaton"){
          const ativos=[...gruposAtivados];
          if(!ativos.length){await enviarComFoto(sock,jid,`┌─⊱ 『 🏘️ GRUPOS ACTIVOS 』 ⊰─┐\n│\n◎ ─ 🔴 Nenhum grupo activo.\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
          try{
            const grupos=await sock.groupFetchAllParticipating();
            const linhas=ativos.map((gJid,i)=>{const nome=grupos[gJid]?.subject||gJid; const membros=grupos[gJid]?.participants?.length||"?"; return `◎ ─ *${i+1}.* 🟢 *${nome}*\n   👥 ${membros} membros`;}).join("\n│\n");
            await enviarComFoto(sock,jid,`┌─⊱ 『 🏘️ GRUPOS ACTIVOS (${ativos.length}) 』 ⊰─┐\n│\n${linhas}\n│\n◎ ─ 📢 *${CONFIG.PREFIXO}sms [nº] [msg]*\n◎ ─ 📣 *${CONFIG.PREFIXO}gsms [nº] [msg]*\n│\n└──────────────────────────────⊰`,ppBotUrl);
          }catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);}
          return;
        }

        // SMS
        if(comando==="sms"){
          const ativos=[...gruposAtivados];
          if(!ativos.length){await enviarComFoto(sock,jid,`❌ Nenhum grupo activo.`,ppBotUrl); return;}
          if(!args.length){
            try{const grupos=await sock.groupFetchAllParticipating(); const lista=ativos.map((gJid,i)=>`◎ ─ *${i+1}.* ${grupos[gJid]?.subject||gJid}`).join("\n"); await enviarComFoto(sock,jid,`┌─⊱ 『 📢 SMS PRIVADA 』 ⊰─┐\n│\n${lista}\n│\n◎ ─ *${CONFIG.PREFIXO}sms [nº] [msg]*\n│\n└──────────────────────────────⊰`,ppBotUrl);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);}
            return;
          }
          const{grupoJid,mensagem}=await encontrarGrupoPorArg(sock,[...gruposAtivados],args);
          if(!grupoJid){await enviarComFoto(sock,jid,`❌ Grupo não encontrado.`,ppBotUrl); return;}
          if(!mensagem.trim()){await enviarComFoto(sock,jid,`❌ Escreve a mensagem!`,ppBotUrl); return;}
          try{
            const grupos=await sock.groupFetchAllParticipating(); const nomeGrupo=grupos[grupoJid]?.subject||"Grupo";
            const meta=await sock.groupMetadata(grupoJid); const membros=meta.participants.map(p=>extrairJid(p.id||p));
            await enviarSemFoto(sock,jid,`📤 A enviar para *${membros.length}* membros de *${nomeGrupo}*...\n⏳`);
            let enviados=0,erros=0;
            for(const membro of membros){if(ehDono(membro)) continue; try{await sock.sendMessage(membro,{text:`📢 *Mensagem Privada*\n✦ ─────────── ✦\n\n${mensagem}\n\n✦ ─────────── ✦\n_Enviado por: ${CONFIG.DONO_NOME}_\n_Grupo: ${nomeGrupo}_`}); enviados++; await new Promise(r=>setTimeout(r,600));}catch{erros++;}}
            await enviarComFoto(sock,jid,`┌─⊱ 『 ✅ SMS ENVIADA! 』 ⊰─┐\n│\n◎ ─ 📊 Enviada: *${enviados}*\n◎ ─ ❌ Erros: *${erros}*\n◎ ─ 👥 Grupo: *${nomeGrupo}*\n│\n└──────────────────────────────⊰`,ppBotUrl);
            await reagir(sock,msg,"📢");
          }catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);}
          return;
        }

        // GSMS
        if(comando==="gsms"){
          const ativos=[...gruposAtivados];
          if(!ativos.length){await enviarComFoto(sock,jid,`❌ Nenhum grupo activo.`,ppBotUrl); return;}
          if(!args.length){
            try{const grupos=await sock.groupFetchAllParticipating(); const lista=ativos.map((gJid,i)=>`◎ ─ *${i+1}.* ${grupos[gJid]?.subject||gJid}`).join("\n"); await enviarComFoto(sock,jid,`┌─⊱ 『 📣 AVISO NO GRUPO 』 ⊰─┐\n│\n${lista}\n│\n◎ ─ *${CONFIG.PREFIXO}gsms [nº] [msg]*\n│\n└──────────────────────────────⊰`,ppBotUrl);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);}
            return;
          }
          const{grupoJid,mensagem}=await encontrarGrupoPorArg(sock,[...gruposAtivados],args);
          if(!grupoJid){await enviarComFoto(sock,jid,`❌ Grupo não encontrado.`,ppBotUrl); return;}
          if(!mensagem.trim()){await enviarComFoto(sock,jid,`❌ Escreve a mensagem!`,ppBotUrl); return;}
          try{
            const grupos=await sock.groupFetchAllParticipating(); const nomeGrupo=grupos[grupoJid]?.subject||"Grupo";
            const meta=await sock.groupMetadata(grupoJid); const todos=meta.participants.map(p=>extrairJid(p.id||p));
            await sock.sendMessage(grupoJid,{text:`📣 *AVISO IMPORTANTE!*\n✦ ─────────── ✦\n\n${mensagem}\n\n✦ ─────────── ✦\n${todos.map(()=>"\u200B").join("")}`,mentions:todos});
            await enviarComFoto(sock,jid,`┌─⊱ 『 ✅ AVISO ENVIADO! 』 ⊰─┐\n│\n◎ ─ 📣 Grupo: *${nomeGrupo}*\n◎ ─ 👥 Mencionados: *${todos.length}*\n│\n└──────────────────────────────⊰`,ppBotUrl);
            await reagir(sock,msg,"📣");
          }catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);}
          return;
        }

        if(comando==="apagadas"){if(!isGrupo){await enviarSemFoto(sock,jid,"❌ Só em grupos."); return;} const lista=msgApagadas[jid]||[]; if(!lista.length){await enviarComFoto(sock,jid,`┌─⊱ 『 🕵️ MSGS APAGADAS 』 ⊰─┐\n│\n◎ ─ 📭 Nenhuma detectada ainda.\n│\n└──────────────────────────────⊰`,ppBotUrl); return;} const ultimas=lista.slice(-10).reverse(); const textoLista=ultimas.map((m,i)=>{const hora=new Date(m.apagadoEm).toLocaleTimeString("pt-AO",{timeZone:"Africa/Luanda",hour:"2-digit",minute:"2-digit"}); const conteudo=m.texto?`_"${m.texto.slice(0,60)}"_`:`_(${m.tipo})_`; return `◎ ─ +${m.sender?.split("@")[0]||"?"} 🕐 ${hora}\n   ${conteudo}`;}).join("\n│\n"); await enviarComFoto(sock,jid,`┌─⊱ 『 🕵️ MSGS APAGADAS (${ultimas.length}) 』 ⊰─┐\n│\n${textoLista}\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
        if(comando==="stop"){if(jogoLoop[jid]&&jogoLoop[jid].activo){if(jogoLoop[jid].timeoutHandle) clearTimeout(jogoLoop[jid].timeoutHandle); const rodadas=jogoLoop[jid].rodada||0; delete jogoLoop[jid]; delete jogoAtivo[jid]; await enviarComFoto(sock,jid,`┌─⊱ 『 🛑 JOGO PARADO! 』 ⊰─┐\n│\n◎ ─ 📊 Rodadas: *${rodadas}*\n◎ ─ Obrigado! 🎮\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"🛑");}else{await enviarSemFoto(sock,jid,`❌ Não há jogo activo.`);} return;}

        if(comando==="ver"){
          const ctx=msg.message?.extendedTextMessage?.contextInfo; const stanzaId=ctx?.stanzaId;
          if(!ctx||!stanzaId){await enviarSemFoto(sock,jid,`👁️ Responde uma view-once com *${CONFIG.PREFIXO}ver*`); await reagir(sock,msg,"❌"); return;}
          const quemEnviou=ctx.participant?`@${ctx.participant.split("@")[0].split(":")[0]}`:"alguém"; const mentions=ctx.participant?[ctx.participant]:[];
          const cached=cacheViewOnce[jid]?.[stanzaId];
          if(cached){await enviarSemFoto(sock,jid,`🔓 A desbloquear...\n⏳`); try{if(cached.tipo==="video") await sock.sendMessage(jid,{video:cached.buf,caption:`🔓 *Vídeo!*\n📩 De: ${quemEnviou}`,mentions},{quoted:msg}); else if(cached.tipo==="audio"){await sock.sendMessage(jid,{audio:cached.buf,mimetype:"audio/ogg; codecs=opus",ptt:false},{quoted:msg});}else await sock.sendMessage(jid,{image:cached.buf,caption:`🔓 *Imagem!*\n📩 De: ${quemEnviou}`,mentions},{quoted:msg}); await reagir(sock,msg,"🔓"); addXP(sender,5);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
          const qMsg=ctx.quotedMessage; if(qMsg){let innerMsg=null; for(const key of["viewOnceMessage","viewOnceMessageV2","viewOnceMessageV2Extension"]){if(qMsg[key]?.message){innerMsg=qMsg[key].message; break;}} if(innerMsg){await enviarSemFoto(sock,jid,`🔓 A desbloquear...\n⏳`); try{const fakeMsg={key:{remoteJid:jid,id:stanzaId,participant:ctx.participant||"",fromMe:false},message:innerMsg}; const buf=await downloadMediaMessage(fakeMsg,"buffer",{}); if(innerMsg.imageMessage) await sock.sendMessage(jid,{image:buf,caption:`🔓 *Imagem!*\n📩 De: ${quemEnviou}`,mentions},{quoted:msg}); else if(innerMsg.videoMessage) await sock.sendMessage(jid,{video:buf,caption:`🔓 *Vídeo!*\n📩 De: ${quemEnviou}`,mentions},{quoted:msg}); else if(innerMsg.audioMessage||innerMsg.pttMessage) await sock.sendMessage(jid,{audio:buf,mimetype:"audio/ogg; codecs=opus",ptt:false},{quoted:msg}); await reagir(sock,msg,"🔓"); addXP(sender,5);}catch{await enviarSemFoto(sock,jid,`❌ Expirada.`); await reagir(sock,msg,"❌");} return;}}
          await enviarSemFoto(sock,jid,`❌ Não encontrei no cache.`); await reagir(sock,msg,"❌"); return;
        }

        if(comando==="play"&&args.length>0){const entrada=args.join(" "); await enviarSemFoto(sock,jid,`🎵 A procurar: _${entrada}_\n⏳`); let arqFinal=null; try{arqFinal=await downloadMusica(entrada,false);}catch{} if(!arqFinal||!fs.existsSync(arqFinal)){await enviarSemFoto(sock,jid,`❌ Não encontrei.`); await reagir(sock,msg,"❌"); return;} try{await enviarAudio(sock,jid,arqFinal,msg); await reagir(sock,msg,"✅"); addXP(sender,5);}catch{await enviarSemFoto(sock,jid,`❌ Erro.`);} setTimeout(()=>{try{fs.removeSync(arqFinal);}catch{}},15000); return;}
        if(comando==="mp3"&&args.length>0){const entrada=args.join(" "); await enviarSemFoto(sock,jid,`🎵 HD: _${entrada}_\n⏳`); let arqFinal=null; try{arqFinal=await downloadMusica(entrada,true);}catch{} if(!arqFinal||!fs.existsSync(arqFinal)){await enviarSemFoto(sock,jid,`❌ Não encontrei.`); await reagir(sock,msg,"❌"); return;} try{await enviarAudio(sock,jid,arqFinal,msg); await reagir(sock,msg,"✅"); addXP(sender,5);}catch{await enviarSemFoto(sock,jid,`❌ Erro.`);} setTimeout(()=>{try{fs.removeSync(arqFinal);}catch{}},15000); return;}
        if(comando==="mp4"&&args.length>0){const entrada=args.join(" "); await enviarSemFoto(sock,jid,`🎬 A procurar: _${entrada}_\n⏳`); let saida=null; try{saida=await downloadVideo(entrada);}catch{} if(!saida||!fs.existsSync(saida)){await enviarSemFoto(sock,jid,`❌ Não consegui.`); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,saida,`✅ *${entrada}*\n_© LORDE LÁ DJUM_`,[sender],msg); await reagir(sock,msg,"✅"); addXP(sender,5);}catch{await enviarSemFoto(sock,jid,`❌ Erro.`);} setTimeout(()=>{try{fs.removeSync(saida);}catch{}},15000); return;}
        if(comando==="mp4hd"&&args.length>0){const entrada=args.join(" "); await enviarSemFoto(sock,jid,`🎬 720p: _${entrada}_\n⏳`); try{const result=await downloadVideoHD(entrada,720); await enviarVideo(sock,jid,result.filePath,`🎬 ${result.quality} | 💾 ${result.sizeMB}MB\n_© LORDE LÁ DJUM_`,[sender],msg); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(result.filePath);}catch{}},15000);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`); await reagir(sock,msg,"❌");} return;}
        if(comando==="tiktok"){const url=args[0]; if(!url||!url.startsWith("http")){await enviarSemFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}tiktok* [link]`); return;} await enviarSemFoto(sock,jid,`📱 A baixar...\n⏳`); try{const result=await dlTiktok(url); await sock.sendMessage(jid,{video:{url:result.url},caption:`🎵 *${result.title||"TikTok"}*\n_© LORDE LÁ DJUM_`},{quoted:msg}); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="instagram"){const url=args[0]; if(!url||!url.startsWith("http")){await enviarSemFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}instagram* [link]`); return;} await enviarSemFoto(sock,jid,`📸 A baixar...\n⏳`); try{const result=await dlInstagram(url); await enviarVideo(sock,jid,result.filePath,`📸 Instagram\n_© LORDE LÁ DJUM_`,[sender],msg); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(result.filePath);}catch{}},15000);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="twitter"){const url=args[0]; if(!url||!url.startsWith("http")){await enviarSemFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}twitter* [link]`); return;} await enviarSemFoto(sock,jid,`🐦 A baixar...\n⏳`); try{const result=await dlTwitter(url); await enviarVideo(sock,jid,result.filePath,`🐦 Twitter/X\n_© LORDE LÁ DJUM_`,[sender],msg); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(result.filePath);}catch{}},15000);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="spotify"&&args.length>0){const entrada=args.join(" "); await enviarSemFoto(sock,jid,`🟢 A procurar: _${entrada}_\n⏳`); try{const result=await dlSpotify(entrada); await enviarAudio(sock,jid,result.filePath,msg); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(result.filePath);}catch{}},15000);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="soundcloud"&&args.length>0){const entrada=args.join(" "); await enviarSemFoto(sock,jid,`🔶 A procurar: _${entrada}_\n⏳`); try{const result=await dlSoundcloud(entrada); await enviarAudio(sock,jid,result.filePath,msg); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(result.filePath);}catch{}},15000);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="pinterest"&&args.length>0){const entrada=args.join(" "); await enviarSemFoto(sock,jid,`📌 A procurar...\n⏳`); try{const result=await dlPinterest(entrada); await sock.sendMessage(jid,{image:{url:result.url},caption:`📌 Pinterest`},{quoted:msg}); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="mediafire"&&args.length>0){const url=args[0]; if(!url.includes("mediafire.com")){await enviarSemFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}mediafire* [link]`); return;} await enviarSemFoto(sock,jid,`📦 A processar...\n⏳`); try{const result=await dlMediafire(url); await sock.sendMessage(jid,{document:{url:result.url},fileName:result.title,mimetype:"application/octet-stream",caption:`📦 *${result.title}*`},{quoted:msg}); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="apk"&&args.length>0){const query=args.join(" "); await enviarSemFoto(sock,jid,`📲 A procurar: _${query}_\n⏳`); try{const result=await dlApk(query); await enviarComFoto(sock,jid,`┌─⊱ 『 📲 APK 』 ⊰─┐\n│\n◎ ─ 🏷️ *${result.title}*\n◎ ─ 🔗 ${result.url}\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}

        if(comando==="qr"){const ctx=msg.message?.extendedTextMessage?.contextInfo,quotedMsg=ctx?.quotedMessage,imageMsg=quotedMsg?.imageMessage||msg.message?.imageMessage; if(imageMsg){try{let buf; if(msg.message?.imageMessage) buf=await downloadMediaMessage(msg,"buffer",{}); else{const qm={key:{remoteJid:jid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:quotedMsg}; buf=await downloadMediaMessage(qm,"buffer",{});} const imageUrl=await uploadParaTelegraph(buf); const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(imageUrl)}&qzone=2&ecc=M`; await sock.sendMessage(jid,{image:{url:qrUrl},caption:`🔲 *QR CODE!*`},{quoted:msg}); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;} const dado=args.join(" "); if(!dado){await enviarComFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}qr* [texto/url]`,ppBotUrl); return;} try{const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(dado)}&qzone=2&ecc=M`; await sock.sendMessage(jid,{image:{url:qrUrl},caption:`🔲 *QR CODE*`},{quoted:msg}); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="sf"){const ctx=msg.message?.extendedTextMessage?.contextInfo,quotedMsg=ctx?.quotedMessage,stickerMsgD=msg.message?.stickerMessage,stickerMsgQ=quotedMsg?.stickerMessage,stickerMsg=stickerMsgD||stickerMsgQ; if(!stickerMsg){await enviarSemFoto(sock,jid,`↩️ Responde sticker com *${CONFIG.PREFIXO}sf*`); return;} const isAnimated=stickerMsg.isAnimated||false; try{let buf; if(stickerMsgD) buf=await downloadMediaMessage(msg,"buffer",{}); else{const qm={key:{remoteJid:jid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:quotedMsg}; buf=await downloadMediaMessage(qm,"buffer",{});} if(!buf||buf.length<100) throw new Error("Sticker inválido"); const resultado=await stickerParaFoto(buf,isAnimated); if(resultado.isVideo) await sock.sendMessage(jid,{video:resultado.buffer,mimetype:"video/mp4",caption:`🎥 Convertido!`},{quoted:msg}); else await sock.sendMessage(jid,{image:resultado.buffer,caption:`🖼️ Convertido!`},{quoted:msg}); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="vz"){const ctxVz=msg.message?.extendedTextMessage?.contextInfo,quotedVz=ctxVz?.quotedMessage; let textoParaFalar=""; if(quotedVz) textoParaFalar=quotedVz.conversation||quotedVz.extendedTextMessage?.text||""; if(!textoParaFalar&&args.length>0) textoParaFalar=args.join(" "); if(!textoParaFalar){await enviarComFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}vz* [texto]`,ppBotUrl); return;} await enviarSemFoto(sock,jid,`🔊 A converter...\n⏳`,msg); try{const audioPath=await textoParaFala(textoParaFalar); await enviarAudio(sock,jid,audioPath,msg); try{fs.removeSync(audioPath);}catch{} await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="calc"){const expr=args.join(" "); if(!expr){await enviarComFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}calc* [expressão]`,ppBotUrl); return;} try{const resultado=calcularSeguro(expr); await enviarComFoto(sock,jid,`┌─⊱ 『 🔢 CALC 』 ⊰─┐\n│\n◎ ─ *${expr}* = *${resultado}*\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"✅");}catch{await enviarSemFoto(sock,jid,`❌ Expressão inválida!`);} return;}
        if(comando==="encurtar"){const url=args[0]; if(!url||!url.startsWith("http")){await enviarComFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}encurtar* [url]`,ppBotUrl); return;} try{const{data}=await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,{timeout:10000,httpsAgent}); const urlE=String(data).trim(); if(!urlE.startsWith("http")) throw new Error("Falha"); await enviarComFoto(sock,jid,`┌─⊱ 『 🔗 LINK CURTO 』 ⊰─┐\n│\n◎ ─ ${urlE}\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="cotacao"){await enviarSemFoto(sock,jid,`💱 A buscar...\n⏳`); try{const resp=await chatIA("Cotações actuais Kwanza (AOA) para USD, EUR, BRL. Formato curto.","Sê direto."); await enviarComFoto(sock,jid,`┌─⊱ 『 💱 COTAÇÕES KWANZA 』 ⊰─┐\n│\n${resp.split("\n").map(l=>`◎ ─ ${l}`).join("\n")}\n│\n└──────────────────────────────⊰`,ppBotUrl);}catch{await enviarSemFoto(sock,jid,`❌ Erro.`);} return;}
        if(comando==="poema"){const tema=args.join(" ")||"Angola"; await enviarSemFoto(sock,jid,`✍️ A compor...\n⏳`); try{const p=await chatIA(`Poema sobre: "${tema}". 4-8 versos.`,"Poeta angolano."); await enviarComFoto(sock,jid,`┌─⊱ 『 ✍️ POEMA 』 ⊰─┐\n│ _${tema}_\n│\n${p}\n│\n└──────────────────────────────⊰`,ppBotUrl); addXP(sender,5);}catch{await enviarSemFoto(sock,jid,"❌ Erro.");} return;}
        if(comando==="historia"){const tema=args.join(" ")||"Angola"; await enviarSemFoto(sock,jid,`📖 A criar...\n⏳`); try{const h=await chatIA(`História curta sobre: "${tema}". Máx 200 palavras.`,"Escritor angolano."); await enviarComFoto(sock,jid,`┌─⊱ 『 📖 HISTÓRIA 』 ⊰─┐\n│\n${h}\n│\n└──────────────────────────────⊰`,ppBotUrl); addXP(sender,5);}catch{await enviarSemFoto(sock,jid,"❌ Erro.");} return;}

        if(comando==="sticker"){
          const quotedMsg=msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
          const iM=quotedMsg?.imageMessage,vM=quotedMsg?.videoMessage;
          if(!iM&&!vM){await enviarSemFoto(sock,jid,`↩️ Responde imagem/vídeo com *${CONFIG.PREFIXO}sticker*`); return;}
          const isAnim=!!vM;
          await enviarSemFoto(sock,jid,isAnim?`🎭 A criar sticker animado...\n⏳`:`🎭 A criar sticker...\n⏳`);
          try{
            const buf=await downloadMediaMessage({message:quotedMsg,key:msg.key},"buffer",{});
            const webpBuf=await criarSticker(buf,isAnim);
            await sock.sendMessage(jid,{sticker:webpBuf},{quoted:msg});
            await reagir(sock,msg,"✅");
          }catch{
            try{const buf=await downloadMediaMessage({message:quotedMsg,key:msg.key},"buffer",{}); await sock.sendMessage(jid,{sticker:buf},{quoted:msg}); await reagir(sock,msg,"✅");}
            catch{await enviarSemFoto(sock,jid,"❌ Erro."); await reagir(sock,msg,"❌");}
          }
          return;
        }

        if(comando==="foto"&&args[0]){try{await sock.sendMessage(jid,{image:{url:args.join("")},caption:"📷"},{quoted:msg}); await reagir(sock,msg,"✅");}catch{await enviarSemFoto(sock,jid,`❌ Erro.`);} return;}
        if(comando==="doc"&&args[0]){try{const url=args.join(""),nome=decodeURIComponent(url.split("/").pop().split("?")[0])||"documento"; await sock.sendMessage(jid,{document:{url},fileName:nome,mimetype:"application/octet-stream",caption:"📄"},{quoted:msg}); await reagir(sock,msg,"✅");}catch{await enviarSemFoto(sock,jid,`❌ Erro.`);} return;}
        if(comando==="mostre"&&args.length>0){const query=args.join(" "); await enviarSemFoto(sock,jid,`🔍 A buscar: _${query}_\n⏳`); try{const imageUrl=await buscarImagemInternet(query); if(!imageUrl){await enviarSemFoto(sock,jid,`❌ Não encontrei.`); return;} await sock.sendMessage(jid,{image:{url:imageUrl},caption:`🖼️ *${query}*`},{quoted:msg}); await reagir(sock,msg,"✅");}catch{await enviarSemFoto(sock,jid,`❌ Não encontrei.`);} return;}
        if(comando==="dono"){let ppD=null; try{ppD=await sock.profilePictureUrl(CONFIG.DONO_JID,"image");}catch{} const tD=`┌─⊱ 『 👑 CRIADOR DO BOT 』 ⊰─┐\n│\n◎ ─ 🏷️ *${CONFIG.DONO_NOME}*\n◎ ─ 📞 *${CONFIG.DONO_NUM}*\n│\n└──────────────────────────────⊰`; if(ppD) await sock.sendMessage(jid,{image:{url:ppD},caption:tD},{quoted:msg}); else await enviarSemFoto(sock,jid,tD,msg); await reagir(sock,msg,"👑"); return;}

        // ✅ BUSCA / SHAZAM — com ⚡ lightning bolts
        if(comando==="busca"||comando==="shazam"){
          const audioData=await downloadAudioDaMensagem(msg);
          if(!audioData){
            await enviarSemFoto(sock,jid,`┌─⊱ 『 ⚡ SHAZAM 』 ⊰─┐\n│\n◎ ─ *${CONFIG.PREFIXO}busca*\n    _↩️ responde nota de voz_\n    _↳ reconhece qualquer música_\n│\n└──────────────────────────────⊰`);
            return;
          }
          await reagir(sock,msg,"⚡");
          await sock.sendMessage(jid,{text:"⚡"},{quoted:msg});
          await new Promise(r=>setTimeout(r,400));
          await sock.sendMessage(jid,{text:"⚡⚡"});
          await new Promise(r=>setTimeout(r,400));
          await sock.sendMessage(jid,{text:"⚡⚡⚡ *A reconhecer a música...*"});
          await new Promise(r=>setTimeout(r,500));
          try{
            const resultado=await reconhecerMusica(audioData.buffer);
            if(resultado.status==="success"&&resultado.result){
              const r=resultado.result;
              const spotify=r.spotify?.external_urls?.spotify||"";
              const apple=r.apple_music?.url||"";
              const coverUrl=r.spotify?.album?.images?.[0]?.url||null;
              const textoMusica=`┌─⊱ 『 ⚡ MÚSICA RECONHECIDA! 』 ⊰─┐\n│\n◎ ─ 🎵 *${r.title}*\n◎ ─ 👤 ${r.artist}\n◎ ─ 💿 ${r.album||"N/A"}${spotify?`\n◎ ─ 🟢 ${spotify}`:""}${apple?`\n◎ ─ 🍎 ${apple}`:""}\n│\n└──────────────────────────────⊰`;
              await reagir(sock,msg,"⚡");
              if(coverUrl) await sock.sendMessage(jid,{image:{url:coverUrl},caption:textoMusica},{quoted:msg});
              else await enviarSemFoto(sock,jid,textoMusica,msg);
              await reagir(sock,msg,"🎵");
              addXP(sender,5);
            }else{
              await reagir(sock,msg,"❌");
              await enviarSemFoto(sock,jid,`┌─⊱ 『 ⚡ SHAZAM 』 ⊰─┐\n│\n◎ ─ ❌ Música não reconhecida.\n◎ ─ _Tenta com áudio mais claro._\n│\n└──────────────────────────────⊰`);
            }
          }catch(e){
            await reagir(sock,msg,"❌");
            await enviarSemFoto(sock,jid,`❌ Erro no Shazam: ${e.message}`);
          }
          return;
        }

        if(comando==="fotocopia"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await enviarSemFoto(sock,jid,`↩️ Responde imagem com *${CONFIG.PREFIXO}fotocopia*`); return;} await enviarSemFoto(sock,jid,`🖼️ A processar...\n⏳`); try{const t=await analisarImagem(imgBuf,"Lê e transcreve TODO o texto em português."); await enviarSemFoto(sock,jid,`┌─⊱ 『 📄 TEXTO EXTRAÍDO 』 ⊰─┐\n│\n${t}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"✅");}catch{await enviarSemFoto(sock,jid,`❌ Erro.`);} return;}
        if(comando==="fotoparaia"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await enviarSemFoto(sock,jid,`↩️ Responde imagem com *${CONFIG.PREFIXO}fotoparaia*`); return;} await enviarSemFoto(sock,jid,`🖼️ A analisar...\n⏳`); try{const instrucao=args.join(" ")?`Responde: "${args.join(" ")}". Português.`:"Descreve detalhadamente. Português."; const resp=await analisarImagem(imgBuf,instrucao); await enviarSemFoto(sock,jid,`┌─⊱ 『 🧠 IA + IMAGEM 』 ⊰─┐\n│\n${resp}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"🧠");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="resumirfoto"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await enviarSemFoto(sock,jid,`↩️ Responde imagem com *${CONFIG.PREFIXO}resumirfoto*`); return;} try{const resumo=await analisarImagem(imgBuf,"Resumo objetivo. Português."); await enviarSemFoto(sock,jid,`┌─⊱ 『 📝 RESUMO DA IMAGEM 』 ⊰─┐\n│\n${resumo}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="traduzirfoto"){const idioma=args[0]||"português"; const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await enviarSemFoto(sock,jid,`↩️ Responde imagem com *${CONFIG.PREFIXO}traduzirfoto [idioma]*`); return;} try{const resultado=await analisarImagem(imgBuf,`Lê e traduz para ${idioma}.`); await enviarSemFoto(sock,jid,`┌─⊱ 『 🌍 TRADUÇÃO DA IMAGEM 』 ⊰─┐\n│\n${resultado}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="ia"&&args.length>0){const pergunta=args.join(" "); await enviarSemFoto(sock,jid,`🧠 A processar...\n⏳`); try{const resp=await chatIA(pergunta); await enviarSemFoto(sock,jid,`┌─⊱ 『 🧠 IA 』 ⊰─┐\n│\n${resp}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"🧠");}catch{await enviarSemFoto(sock,jid,`❌ Erro.`);} return;}
        if(comando==="resumir"){const ctx2=msg.message?.extendedTextMessage?.contextInfo; const msgC=ctx2?.quotedMessage?.conversation||ctx2?.quotedMessage?.extendedTextMessage?.text||""; if(!msgC){await enviarSemFoto(sock,jid,`↩️ Responde mensagem com *${CONFIG.PREFIXO}resumir*`); return;} try{const resp=await chatIA(`Resumo curto: "${msgC}"`); await enviarSemFoto(sock,jid,`┌─⊱ 『 📝 RESUMO 』 ⊰─┐\n│\n${resp}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"📝");}catch{await enviarSemFoto(sock,jid,`❌ Erro.`);} return;}
        if(comando==="traduzir"&&args.length>1){const idioma=args[0],textT=args.slice(1).join(" "); try{const resp=await chatIA(`Traduz para ${idioma}: "${textT}"`); await enviarSemFoto(sock,jid,`┌─⊱ 『 🌍 TRADUÇÃO 』 ⊰─┐\n│\n${resp}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"🌍");}catch{await enviarSemFoto(sock,jid,"❌ Erro.");} return;}
        if(comando==="piada"){try{const p=await chatIA("Piada curta em português de Angola."); await enviarComFoto(sock,jid,`┌─⊱ 『 😂 PIADA 』 ⊰─┐\n│\n${p}\n│\n└──────────────────────────────⊰`,ppBotUrl);}catch{await enviarSemFoto(sock,jid,"❌ Erro.");} return;}
        if(comando==="conselho"&&args.length>0){const sit=args.join(" "); try{const resp=await chatIA(`Conselho para: "${sit}".`); await enviarComFoto(sock,jid,`┌─⊱ 『 💡 CONSELHO 』 ⊰─┐\n│\n${resp}\n│\n└──────────────────────────────⊰`,ppBotUrl);}catch{await enviarSemFoto(sock,jid,"❌ Erro.");} return;}
        if(comando==="transcrever"||comando==="audiotexto"){const d=await downloadAudioDaMensagem(msg); if(!d){await enviarSemFoto(sock,jid,`↩️ Responde áudio com *${CONFIG.PREFIXO}transcrever*`); return;} try{const t=await transcreverComGroq(d.buffer); await enviarSemFoto(sock,jid,`┌─⊱ 『 📝 TRANSCRIÇÃO 』 ⊰─┐\n│\n${t}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="resumiraudio"){const d=await downloadAudioDaMensagem(msg); if(!d){await enviarSemFoto(sock,jid,`↩️ Responde áudio com *${CONFIG.PREFIXO}resumiraudio*`); return;} try{const t=await transcreverComGroq(d.buffer); const r=await chatIA(`Resumo: "${t}"`); await enviarSemFoto(sock,jid,`┌─⊱ 『 🎙️ RESUMO DO ÁUDIO 』 ⊰─┐\n│\n${r}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="traduziraudio"){const idioma=args[0]||"português"; const d=await downloadAudioDaMensagem(msg); if(!d){await enviarSemFoto(sock,jid,`↩️ Responde áudio com *${CONFIG.PREFIXO}traduziraudio [idioma]*`); return;} try{const t=await transcreverComGroq(d.buffer); const tr=await chatIA(`Traduz para ${idioma}: "${t}"`); await enviarSemFoto(sock,jid,`┌─⊱ 『 🌍 TRADUÇÃO DO ÁUDIO 』 ⊰─┐\n│\n${tr}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"✅");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="audioparaia"){const d=await downloadAudioDaMensagem(msg); if(!d){await enviarSemFoto(sock,jid,`↩️ Responde áudio com *${CONFIG.PREFIXO}audioparaia*`); return;} try{const t=await transcreverComGroq(d.buffer); const r=await chatIA(t); await enviarSemFoto(sock,jid,`┌─⊱ 『 🧠 IA + ÁUDIO 』 ⊰─┐\n│\n${r}\n│\n└──────────────────────────────⊰`); await reagir(sock,msg,"🧠");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="ping"){const ini=Date.now(); await sock.sendMessage(jid,{text:"⏳"}); await enviarComFoto(sock,jid,`┌─⊱ 『 🏓 PONG! 』 ⊰─┐\n│\n◎ ─ 📶 *${Date.now()-ini}ms*\n◎ ─ ⏱️ Uptime: *${Math.floor(process.uptime()/60)} min*\n◎ ─ 💾 RAM: *${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB*\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
        if(comando==="regras"){await enviarComFoto(sock,jid,`┌─⊱ 『 📋 REGRAS 』 ⊰─┐\n│\n◎ ─ ❌ Sem links\n◎ ─ ❌ Sem spam\n◎ ─ ❌ Sem pornografia\n◎ ─ ❌ Sem ofensas\n◎ ─ ❌ Sem status\n◎ ─ ✅ Respeita todos\n│\n◎ ─ ⚡ Ban automático 5→0!\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
        if(comando==="stats"){const s=fs.readJsonSync(ARQUIVO_STATS); const top=Object.entries(s.comandos||{}).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n],i)=>`◎ ─ ${i+1}. *${CONFIG.PREFIXO}${c}* — ${n}x`).join("\n"); await enviarComFoto(sock,jid,`┌─⊱ 『 📊 ESTATÍSTICAS 』 ⊰─┐\n│\n◎ ─ 🔢 Total: *${s.total||0}*\n│\n◎ ─ 📈 *Top 5:*\n${top}\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
        if(comando==="tempo"){if(!args[0]){await enviarComFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}tempo* [local]`,ppBotUrl); return;} const local=args.join(" "); try{const res=await axios.get(`https://wttr.in/${encodeURIComponent(local)}?format=j1`,{timeout:10000,httpsAgent}); const cur=res.data.current_condition[0]; await enviarComFoto(sock,jid,`┌─⊱ 『 🌤️ ${local.toUpperCase()} 』 ⊰─┐\n│\n◎ ─ 🌡️ *${cur.temp_C}°C*\n◎ ─ ☁️ ${cur.weatherDesc[0].value}\n◎ ─ 💧 ${cur.humidity}%\n│\n└──────────────────────────────⊰`,ppBotUrl);}catch{await enviarComFoto(sock,jid,`❌ Não encontrei.`,ppBotUrl);} return;}
        if(comando==="horario"){const agora=new Date(); const opc=(tz)=>({timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false}); await enviarComFoto(sock,jid,`┌─⊱ 『 🕐 HORÁRIO MUNDIAL 』 ⊰─┐\n│\n◎ ─ 🇦🇴 Angola: *${agora.toLocaleTimeString("pt-AO",opc("Africa/Luanda"))}*\n◎ ─ 🇧🇷 Brasil: *${agora.toLocaleTimeString("pt-BR",opc("America/Sao_Paulo"))}*\n◎ ─ 🇵🇹 Portugal: *${agora.toLocaleTimeString("pt-PT",opc("Europe/Lisbon"))}*\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
        if(comando==="info"){await enviarComFoto(sock,jid,`◎ ─ Usa *${CONFIG.PREFIXO}menu* para ver os comandos.`,ppBotUrl); return;}

        if(comando==="arquivo"){
          const fichs=fs.readdirSync("./vpn");
          if(!args[0]){await enviarComFoto(sock,jid,`┌─⊱ 『 📁 FICHEIROS (${fichs.length}) 』 ⊰─┐\n│\n${fichs.length>0?fichs.map((f,i)=>`◎ ─ ${i+1}. ${f}`).join("\n"):"◎ ─ _Sem ficheiros_"}\n│\n◎ ─ *${CONFIG.PREFIXO}arqadd* para adicionar\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
          const enc=fichs.find(f=>f.toLowerCase().includes(args.join(" ").toLowerCase()));
          if(!enc){await enviarComFoto(sock,jid,`❌ Não encontrado.`,ppBotUrl); return;}
          await sock.sendMessage(jid,{document:fs.readFileSync(path.join("./vpn",enc)),fileName:enc,mimetype:"application/octet-stream"},{quoted:msg});
          await reagir(sock,msg,"✅"); return;
        }

        if(comando==="arqadd"){
          const docDireto=msg.message?.documentMessage; const docCitado=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage; const docMsg=docDireto||docCitado;
          if(!docMsg){await enviarComFoto(sock,jid,`┌─⊱ 『 📤 ADICIONAR FICHEIRO 』 ⊰─┐\n│\n◎ ─ 1️⃣ Envia o ficheiro\n◎ ─ 2️⃣ Legenda: *${CONFIG.PREFIXO}arqadd*\n│\n◎ ─ ✅ .ehi .npv .ovpn .conf .hia\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
          try{
            let buffer; if(docDireto){buffer=await downloadMediaMessage(msg,"buffer",{});}else{const ctx3=msg.message?.extendedTextMessage?.contextInfo; const qm={key:{remoteJid:jid,id:ctx3?.stanzaId||"",participant:ctx3?.participant||"",fromMe:false},message:ctx3?.quotedMessage}; buffer=await downloadMediaMessage(qm,"buffer",{});}
            let nomeArq=docMsg.fileName||`arq_${Date.now()}.ehi`; const extActual=path.extname(nomeArq).toLowerCase(); if(!ARQ_EXTS.includes(extActual)) nomeArq=nomeArq+".ehi";
            let destPath=path.join("./vpn",nomeArq); if(fs.existsSync(destPath)){const base=path.basename(nomeArq,path.extname(nomeArq)); const ext=path.extname(nomeArq); nomeArq=`${base}_${Date.now()}${ext}`; destPath=path.join("./vpn",nomeArq);}
            fs.writeFileSync(destPath,buffer); const tam=(buffer.length/1024).toFixed(1);
            await enviarComFoto(sock,jid,`┌─⊱ 『 ✅ FICHEIRO ADICIONADO! 』 ⊰─┐\n│\n◎ ─ 📄 *${nomeArq}*\n◎ ─ 💾 *${tam} KB*\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"✅");
          }catch(e){await enviarComFoto(sock,jid,`❌ Erro: ${e.message}`,ppBotUrl);}
          return;
        }

        if(comando==="arqdelete"){
          const fichs=fs.readdirSync("./vpn");
          if(!args[0]){await enviarComFoto(sock,jid,`┌─⊱ 『 🗑️ ELIMINAR FICHEIRO 』 ⊰─┐\n│\n◎ ─ *${CONFIG.PREFIXO}arqdelete* [nome ou nº]\n│\n${fichs.length>0?fichs.map((f,i)=>`◎ ─ ${i+1}. ${f}`).join("\n"):"◎ ─ _Sem ficheiros_"}\n│\n└──────────────────────────────⊰`,ppBotUrl); return;}
          let nomeAlvo=""; const idx=parseInt(args[0]);
          if(!isNaN(idx)&&idx>=1&&idx<=fichs.length){nomeAlvo=fichs[idx-1];}else{nomeAlvo=fichs.find(f=>f.toLowerCase().includes(args.join(" ").toLowerCase()))||"";}
          if(!nomeAlvo){await enviarComFoto(sock,jid,`❌ Ficheiro não encontrado.`,ppBotUrl); return;}
          try{fs.removeSync(path.join("./vpn",nomeAlvo)); await enviarComFoto(sock,jid,`┌─⊱ 『 ✅ ELIMINADO! 』 ⊰─┐\n│\n◎ ─ 🗑️ *${nomeAlvo}*\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"✅");}catch(e){await enviarComFoto(sock,jid,`❌ Erro: ${e.message}`,ppBotUrl);}
          return;
        }

        if(comando==="decrypt"){const docResp=msg.message?.documentMessage||msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage; if(docResp){try{let buf; if(msg.message?.documentMessage) buf=await downloadMediaMessage(msg,"buffer",{}); else{const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage; buf=await downloadMediaMessage({message:q,key:msg.key},"buffer",{});} await enviarComFoto(sock,jid,analisarArquivo(buf.toString("utf8"),docResp.fileName||"ficheiro"),ppBotUrl); await reagir(sock,msg,"🔓");}catch(e){await enviarComFoto(sock,jid,`❌ ${e.message}`,ppBotUrl);} return;} await enviarComFoto(sock,jid,`↩️ Responde um ficheiro com *${CONFIG.PREFIXO}decrypt*`,ppBotUrl); return;}
        if(comando==="denunciar"){const ctx3=msg.message?.extendedTextMessage?.contextInfo; if(!ctx3?.participant){await enviarSemFoto(sock,jid,`↩️ Responde mensagem com *${CONFIG.PREFIXO}denunciar [motivo]*`); return;} try{const den=extrairJid(ctx3.participant),mot=args.join(" ")||"Sem motivo"; const meta=await sock.groupMetadata(jid); for(const a of meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p))){try{await sock.sendMessage(a,{text:`┌─⊱ 『 🚨 DENÚNCIA! 』 ⊰─┐\n│\n◎ ─ 👤 @${den.split("@")[0]}\n◎ ─ 📝 *Motivo:* ${mot}\n│\n└──────────────────────────────⊰`,mentions:[den]});}catch{}} await enviarSemFoto(sock,jid,`✅ *Denúncia enviada!*`);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="perfil"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await enviarComFoto(sock,jid,`↩️ Menciona alguém!`,ppBotUrl); return;} const ehZoada=Math.random()<0.5,LISTA=ehZoada?PERFIS_ZOADA:PERFIS_ELOGIO; const desc=LISTA[Math.floor(Math.random()*LISTA.length)]; let ppAlvo=null; try{ppAlvo=await sock.profilePictureUrl(alvo,"image");}catch{} const textoFinal=`${ehZoada?"😂":"🌟"} ${desc}\n\n📱 +${alvo.split("@")[0]}`; if(ppAlvo) await sock.sendMessage(jid,{image:{url:ppAlvo},caption:textoFinal,mentions:[alvo]}); else await sock.sendMessage(jid,{text:textoFinal,mentions:[alvo]}); await reagir(sock,msg,ehZoada?"😂":"🌟"); return;}

        if(comando==="all"&&isGrupo){const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📢 *ATENÇÃO A TODOS!*\n✦ ─────────── ✦\n\n${todos.map(p=>`@${p.split("@")[0]}`).join(" ")}`,mentions:todos}); await reagir(sock,msg,"📢"); return;}
        if(comando==="att"&&isGrupo){const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📣${todos.map(()=>"\u200B").join("")}`,mentions:todos}); await reagir(sock,msg,"📣"); return;}
        if(comando==="link"&&isGrupo){try{const codigo=await sock.groupInviteCode(jid); await enviarComFoto(sock,jid,`┌─⊱ 『 🔗 LINK DO GRUPO 』 ⊰─┐\n│\n◎ ─ https://chat.whatsapp.com/${codigo}\n│\n└──────────────────────────────⊰`,ppBotUrl);}catch{await enviarComFoto(sock,jid,"❌ Erro.",ppBotUrl);} return;}
        if(comando==="sorteio"&&isGrupo){try{const meta=await sock.groupMetadata(jid),membros=meta.participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p)); if(!membros.length){await enviarComFoto(sock,jid,"❌ Sem membros.",ppBotUrl); return;} const vencedor=membros[Math.floor(Math.random()*membros.length)]; await sock.sendMessage(jid,{text:`┌─⊱ 『 🎉 SORTEIO! 』 ⊰─┐\n│\n◎ ─ 🏆 @${vencedor.split("@")[0]}! 🎊\n│\n└──────────────────────────────⊰`,mentions:[vencedor]}); await reagir(sock,msg,"🎉");}catch{} return;}
        if(comando==="verifica"&&isGrupo){const buffer=bufferMsgs[jid]||[]; const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)),infrat={}; for(const m of buffer){if(admins.includes(m.sender)||ehDono(m.sender)) continue; if(LINK_RX.test(m.texto)) infrat[m.sender]=true;} const lista=Object.keys(infrat); for(const inf of lista){try{await sock.groupParticipantsUpdate(jid,[inf],"remove");}catch{}} await enviarComFoto(sock,jid,`✅ *${lista.length}* banido(s)!`,ppBotUrl); await reagir(sock,msg,"🔨"); return;}
        if(comando==="aviso"&&isGrupo){const avisoTxt=args.join(" "); if(!avisoTxt){await enviarComFoto(sock,jid,`◎ ─ *${CONFIG.PREFIXO}aviso* [mensagem]`,ppBotUrl); return;} try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📢 *AVISO!*\n✦ ─────────── ✦\n\n${avisoTxt}\n\n${todos.map(p=>`@${p.split("@")[0]}`).join(" ")}`,mentions:todos}); await reagir(sock,msg,"📢");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="apagar"&&isGrupo){const ctx3=msg.message?.extendedTextMessage?.contextInfo; if(!ctx3?.stanzaId){await enviarComFoto(sock,jid,`↩️ Cita mensagem com *${CONFIG.PREFIXO}apagar*`,ppBotUrl); return;} try{await sock.sendMessage(jid,{delete:{remoteJid:jid,id:ctx3.stanzaId,participant:ctx3.participant||""}}); await reagir(sock,msg,"🗑️");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="banir"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant); if(!alvo){await enviarComFoto(sock,jid,"↩️ Responde a mensagem.",ppBotUrl); return;} try{await sock.groupParticipantsUpdate(jid,[alvo],"remove"); await enviarComFoto(sock,jid,`✅ *@${alvo.split("@")[0]} BANIDO!* 🔨`,ppBotUrl); await reagir(sock,msg,"🔨");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="addadmin"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant); if(!alvo){await enviarComFoto(sock,jid,"↩️ Responde a mensagem.",ppBotUrl); return;} try{await sock.groupParticipantsUpdate(jid,[alvo],"promote"); await enviarComFoto(sock,jid,`👑 *@${alvo.split("@")[0]}* é admin!`,ppBotUrl); await reagir(sock,msg,"👑");}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="removeadmin"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant); if(!alvo){await enviarComFoto(sock,jid,"↩️ Responde a mensagem.",ppBotUrl); return;} try{await sock.groupParticipantsUpdate(jid,[alvo],"demote"); await enviarComFoto(sock,jid,`✅ Admin removido!`,ppBotUrl);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="fechar"&&isGrupo){try{await sock.groupSettingUpdate(jid,"announcement"); await enviarComFoto(sock,jid,"🔒 *Grupo fechado!*",ppBotUrl);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}
        if(comando==="abrir"&&isGrupo){try{await sock.groupSettingUpdate(jid,"not_announcement"); await enviarComFoto(sock,jid,"🔓 *Grupo aberto!*",ppBotUrl);}catch(e){await enviarSemFoto(sock,jid,`❌ ${e.message}`);} return;}

        if(["quiz","vof","completar","caca","guerra"].includes(comando)&&jogoLoop[jid]?.activo){await enviarComFoto(sock,jid,`⚠️ Jogo activo! Usa *${CONFIG.PREFIXO}stop*`,ppBotUrl); return;}
        if(comando==="quiz"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"quiz",categoria,activo:true,usadas:[],rodada:0}; await enviarComFoto(sock,jid,`┌─⊱ 『 🎮 QUIZ! 』 ⊰─┐\n│\n◎ ─ ${categoria?`🎯 *${categoria.toUpperCase()}*`:"🎲 Variado"}\n◎ ─ ♾️ Loop | 🛑 *${CONFIG.PREFIXO}stop*\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"🎮"); setTimeout(()=>proximaPergunta(sock,jid),2000); return;}
        if(comando==="vof"){jogoLoop[jid]={tipo:"vof",categoria:null,activo:true,usadas:[],rodada:0}; await enviarComFoto(sock,jid,`┌─⊱ 『 ✅❌ V/F! 』 ⊰─┐\n│\n◎ ─ ♾️ Loop | 🛑 *${CONFIG.PREFIXO}stop*\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"❓"); setTimeout(()=>proximaPergunta(sock,jid),2000); return;}
        if(comando==="completar"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"completar",categoria,activo:true,usadas:[],rodada:0}; await enviarComFoto(sock,jid,`┌─⊱ 『 🔤 COMPLETA! 』 ⊰─┐\n│\n◎ ─ ${categoria?`🎯 *${categoria.toUpperCase()}*`:"🎲 Variado"}\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"🔤"); setTimeout(()=>proximaPergunta(sock,jid),2000); return;}
        if(comando==="caca"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"caca",categoria,activo:true,usadas:[],rodada:0}; await enviarComFoto(sock,jid,`┌─⊱ 『 🔍 CAÇA-PALAVRAS! 』 ⊰─┐\n│\n◎ ─ ${categoria?`🎯 *${categoria.toUpperCase()}*`:"🎲 Variado"}\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"🔍"); setTimeout(()=>proximaPergunta(sock,jid),2000); return;}
        if(comando==="guerra"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"guerra",categoria,activo:true,usadas:[],rodada:0}; await enviarComFoto(sock,jid,`┌─⊱ 『 ⚔️ GUERRA! 』 ⊰─┐\n│\n◎ ─ ${categoria?`🎯 *${categoria.toUpperCase()}*`:"🎲 Variado"}\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"⚔️"); setTimeout(()=>proximaPergunta(sock,jid),2000); return;}
        if(comando==="rank"){const r=fs.readJsonSync(ARQUIVO_RANK); const n=sender.split("@")[0]; const d=r[n]||{xp:0,nivel:1,msgs:0}; const bar="█".repeat(Math.min(10,Math.floor((d.xp%100)/10)))+"░".repeat(10-Math.min(10,Math.floor((d.xp%100)/10))); await enviarComFoto(sock,jid,`┌─⊱ 『 🏆 RANK — @${n} 』 ⊰─┐\n│\n◎ ─ ⭐ Nível: *${d.nivel}*\n◎ ─ ✨ XP: *${d.xp}*\n◎ ─ 📊 [${bar}]\n◎ ─ 💬 Msgs: *${d.msgs}*\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"🏆"); return;}
        if(comando==="toprank"){const r=fs.readJsonSync(ARQUIVO_RANK); const medalhas=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]; const top=Object.entries(r).sort((a,b)=>b[1].xp-a[1].xp).slice(0,10).map(([n,d],i)=>`◎ ─ ${medalhas[i]} +${n} — Nv.*${d.nivel}* | *${d.xp}* XP`).join("\n"); await enviarComFoto(sock,jid,`┌─⊱ 『 🏆 TOP 10 』 ⊰─┐\n│\n${top||"◎ ─ _Sem dados_"}\n│\n└──────────────────────────────⊰`,ppBotUrl); await reagir(sock,msg,"🏆"); return;}

      }catch(e){console.error("❌ Erro handler:",e.message); try{await reagir(sock,msg,"❌");}catch{}}
    });

  }catch(e){
    console.error("❌ Erro crítico:",e.message);
    tentativasReconexao++;
    setTimeout(()=>startBot(),Math.min(5000*tentativasReconexao,60000));
  }
}

startBot();
