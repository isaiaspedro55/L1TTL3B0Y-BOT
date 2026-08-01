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
const { exec, execSync } = require("child_process");
const path     = require("path");
const axios    = require("axios");
const https    = require("https");
const FormData = require("form-data");

fs.ensureDirSync(process.env.TMPDIR);
fs.ensureDirSync("./downloads");
fs.ensureDirSync("./vpn");
fs.ensureDirSync("./dados");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CONFIG = {
  PREFIXO:         "!",
  NUMERO_BOT:      "244954260707",
  NUMEROS_ADM:     ["926612801","244926612801","169853876965546"],
  DONO_JID:        "169853876965546@lid",
  DONO_NOME:       "ISAÍAS PEDRO",
  DONO_NUM:        "926 612 801",
  VOZ_TTS:         "pt-PT-DuarteNeural",
  SENHA_BOT:       "lordinho2025",
  CANAL_URL:       "https://whatsapp.com/channel/0029VbDBkEcK5cDMSt0E4r0Q",
  NOME_BOT:        "LORDE LÁ DJUM",
  SCRAPER_HUB_URL: process.env.SCRAPER_HUB_URL||"http://localhost:3000",
  // ✅ true = estamos num servidor (Render, Railway, etc.) sem IP residencial
  IS_SERVER:       process.env.RENDER||process.env.RAILWAY||process.env.NODE_ENV==="production"||false,
};

const httpsAgent = new https.Agent({rejectUnauthorized:false,keepAlive:true,timeout:60000});
const silentLogger={level:"silent",child:()=>silentLogger,info:()=>{},warn:()=>{},error:()=>{},debug:()=>{},trace:()=>{},fatal:()=>{}};
const errosComando={};
let ppBotUrl=null;
let botFotoBuffer=null;
const BOT_FOTO_PATH="./dados/bot_foto.jpg";
if(fs.existsSync(BOT_FOTO_PATH)){try{botFotoBuffer=fs.readFileSync(BOT_FOTO_PATH);}catch{}}
// ✅ Caminho detectado do yt-dlp (pode variar entre Termux e Render)
let YTDLP_CMD="yt-dlp";
let FFMPEG_CMD="ffmpeg";
let EDGETTS_CMD="edge-tts";

process.on("uncaughtException",e=>{if(e.code==="ENOENT"&&e.path&&(e.path.includes("-enc")||e.path.includes("/tmp/")||e.path.includes("/video/media/"))) return; console.error("❌",e.message);});
process.on("unhandledRejection",r=>{const m=r?.message||String(r); if(m.includes("-enc")||m.includes("Media upload")) return; console.error("❌",m);});

// ═══════════════════════════════════════════════════════
// ✅ AUTO-SETUP — Detecta e instala dependências
// ═══════════════════════════════════════════════════════
async function autoSetup(){
  console.log("\n🔧 A verificar dependências...");

  // ─── Detecta yt-dlp ───
  const ytdlpPaths=["yt-dlp","python3 -m yt_dlp","python -m yt_dlp","/usr/local/bin/yt-dlp","/usr/bin/yt-dlp","~/.local/bin/yt-dlp"];
  let ytdlpFound=false;
  for(const cmd of ytdlpPaths){
    try{execSync(`${cmd} --version`,{stdio:"pipe",timeout:10000}); YTDLP_CMD=cmd; ytdlpFound=true; console.log(`✅ yt-dlp: ${cmd}`); break;}catch{}
  }
  if(!ytdlpFound){
    console.log("📥 A instalar yt-dlp...");
    const installCmds=[
      "pip install yt-dlp --break-system-packages",
      "pip3 install yt-dlp --break-system-packages",
      "pip install yt-dlp",
      "pip3 install yt-dlp",
      "python3 -m pip install yt-dlp",
    ];
    for(const cmd of installCmds){
      try{execSync(cmd,{stdio:"pipe",timeout:120000}); YTDLP_CMD="yt-dlp"; console.log("✅ yt-dlp instalado!"); ytdlpFound=true; break;}catch{}
    }
    if(!ytdlpFound){YTDLP_CMD="python3 -m yt_dlp"; console.log("⚠️ yt-dlp: usando python3 -m yt_dlp como fallback");}
  }

  // ─── Detecta ffmpeg ───
  const ffmpegPaths=["ffmpeg","/usr/bin/ffmpeg","/usr/local/bin/ffmpeg"];
  let ffmpegFound=false;
  for(const cmd of ffmpegPaths){
    try{execSync(`${cmd} -version`,{stdio:"pipe",timeout:5000}); FFMPEG_CMD=cmd; ffmpegFound=true; console.log(`✅ ffmpeg: ${cmd}`); break;}catch{}
  }
  if(!ffmpegFound){
    console.log("📥 A instalar ffmpeg...");
    try{execSync("apt-get install -y ffmpeg 2>/dev/null || apk add ffmpeg 2>/dev/null || yum install -y ffmpeg 2>/dev/null",{stdio:"pipe",timeout:120000}); ffmpegFound=true; console.log("✅ ffmpeg instalado!");}catch{}
    if(!ffmpegFound) console.log("⚠️ ffmpeg não encontrado - conversão de áudio desactivada");
  }

  // ─── Detecta edge-tts ───
  const edgePaths=["edge-tts","python3 -m edge_tts","~/.local/bin/edge-tts"];
  let edgeFound=false;
  for(const cmd of edgePaths){
    try{execSync(`${cmd} --version`,{stdio:"pipe",timeout:5000}); EDGETTS_CMD=cmd; edgeFound=true; console.log(`✅ edge-tts: ${cmd}`); break;}catch{}
  }
  if(!edgeFound){
    console.log("📥 A instalar edge-tts...");
    const installCmds=["pip install edge-tts --break-system-packages","pip3 install edge-tts --break-system-packages","pip install edge-tts","python3 -m pip install edge-tts"];
    for(const cmd of installCmds){
      try{execSync(cmd,{stdio:"pipe",timeout:120000}); EDGETTS_CMD="edge-tts"; console.log("✅ edge-tts instalado!"); edgeFound=true; break;}catch{}
    }
    if(!edgeFound) console.log("⚠️ edge-tts não encontrado - TTS desactivado");
  }

  // ─── Actualiza yt-dlp (importante para evitar erros 403) ───
  if(ytdlpFound){
    try{
      console.log("🔄 A actualizar yt-dlp...");
      execSync(`${YTDLP_CMD} -U`,{stdio:"pipe",timeout:60000});
      console.log("✅ yt-dlp actualizado!");
    }catch{console.log("⚠️ Não foi possível actualizar yt-dlp");}
  }

  if(CONFIG.IS_SERVER){
    console.log(`\n⚠️ AVISO: Bot a correr em SERVIDOR (${process.env.RENDER?"Render":process.env.RAILWAY?"Railway":"Produção"})`);
    console.log("⚠️ YouTube bloqueia IPs de datacenters — downloads podem falhar");
    console.log("💡 Solução: configura SCRAPER_HUB_URL como variável de ambiente ou usa cookies");
  }

  console.log("✅ Setup concluído!\n");
}

// ─── Argumentos yt-dlp adaptados para servidor vs Termux ───
function getYtDlpBaseArgs(){
  const UA_MOBILE="Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";
  const UA_TV="Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1";

  if(CONFIG.IS_SERVER){
    // Em servidores: usa tv_embedded e mweb que têm menos restrições IP
    return[
      "--no-check-certificate",
      "--no-playlist",
      "--no-warnings",
      "--force-ipv4",
      "--geo-bypass",
      `--extractor-args "youtube:player_client=tv_embedded,mweb,ios"`,
      `--add-header "User-Agent:${UA_TV}"`,
      "--sleep-interval 1",
      "--max-sleep-interval 3",
      "--retries 5",
      "--fragment-retries 5",
    ].join(" ");
  }else{
    // No Termux: usa android/ios normalmente
    return[
      "--no-check-certificate",
      "--no-playlist",
      "--no-warnings",
      "--force-ipv4",
      "--geo-bypass",
      `--extractor-args "youtube:player_client=android,ios,tv_embedded"`,
      `--add-header "User-Agent:${UA_MOBILE}"`,
      "--retries 3",
    ].join(" ");
  }
}

// ─── API Piped.video (proxy YouTube — não tem IP bloqueado) ───
const PIPED_INSTANCES=[
  "https://pipedapi.kavin.rocks",
  "https://piped-api.garudalinux.org",
  "https://api.piped.yt",
  "https://pipedapi.adminforge.de",
];

async function buscarYouTubePiped(query){
  for(const instance of PIPED_INSTANCES){
    try{
      const{data}=await axios.get(`${instance}/search?q=${encodeURIComponent(query)}&filter=videos`,{timeout:10000,httpsAgent});
      const videos=data?.items?.filter(i=>i.type==="stream")||[];
      if(videos.length) return videos.slice(0,5).map(v=>({
        title:v.title,
        url:`https://www.youtube.com/watch?v=${v.url?.replace("/watch?v=","")||v.videoId}`,
        duration:v.duration,
        uploader:v.uploaderName||"N/A",
        thumbnail:v.thumbnail||null,
        pipedUrl:`${instance}${v.url}`,
      }));
    }catch{continue;}
  }
  return[];
}

async function downloadViaPiped(videoUrl){
  // Obtém URL de stream directamente via Piped (não precisa de yt-dlp!)
  const videoId=videoUrl.match(/(?:v=|youtu\.be\/)([^&\n?]+)/)?.[1];
  if(!videoId) throw new Error("ID do vídeo inválido");

  for(const instance of PIPED_INSTANCES){
    try{
      const{data}=await axios.get(`${instance}/streams/${videoId}`,{timeout:15000,httpsAgent});
      const audioStreams=data?.audioStreams?.filter(s=>s.mimeType?.includes("audio"))||[];
      const videoStreams=data?.videoStreams?.filter(s=>s.videoOnly===false&&s.mimeType?.includes("mp4"))||[];
      audioStreams.sort((a,b)=>(b.bitrate||0)-(a.bitrate||0));
      return{
        audioUrl:audioStreams[0]?.url||null,
        videoUrl:videoStreams[0]?.url||null,
        title:data?.title||"Música",
      };
    }catch{continue;}
  }
  throw new Error("Piped não disponível");
}

// ─── InvidiousAPI (outro proxy YouTube) ───
const INVIDIOUS_INSTANCES=[
  "https://invidious.snopyta.org",
  "https://yewtu.be",
  "https://invidious.io.lol",
  "https://inv.nadeko.net",
];

async function downloadViaInvidious(videoId){
  for(const instance of INVIDIOUS_INSTANCES){
    try{
      const{data}=await axios.get(`${instance}/api/v1/videos/${videoId}?fields=adaptiveFormats,title`,{timeout:15000,httpsAgent});
      const audioFormats=(data?.adaptiveFormats||[]).filter(f=>f.type?.includes("audio"));
      audioFormats.sort((a,b)=>(b.bitrate||0)-(a.bitrate||0));
      if(audioFormats[0]?.url) return{audioUrl:audioFormats[0].url,title:data?.title||"Música"};
    }catch{continue;}
  }
  throw new Error("Invidious não disponível");
}

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

[ARQUIVO_RANK,ARQUIVO_STATS,ARQUIVO_ATIVOS,ARQUIVO_SILENCIADOS,ARQUIVO_COINS,ARQUIVO_COOLDOWNS,ARQUIVO_VIPS].forEach(f=>{
  if(!fs.existsSync(f)){
    if(f.includes("stats")) fs.writeJsonSync(f,{total:0,comandos:{},usuarios:{}});
    else fs.writeJsonSync(f,{});
  }
});

// ═══════════════════════════════════════════════════════
// ✅ ESTADOS EM MEMÓRIA
// ═══════════════════════════════════════════════════════
const membrosSilenciados={},jogoAtivo={},jogoLoop={},bufferMsgs={},cacheMsg={},msgApagadas={};
const banEmCurso=new Set(),historyMsgs={},menuEsperandoResposta=new Map();
const senhasAprovadas=new Set(),gruposAtivados=new Set(),pedidoSenha=new Set();
const chatsDesativados=new Set(),vozBotDesativado=new Set(),comandosBloqueados=new Set();
const antiLinkDesativado=new Set(),cacheViewOnce={};
const jogoAdivinhar={},jogoVelocidade={};
const MAX_BUFFER=100,MAX_CACHE_MSG=200,MAX_HISTORY=1000;

// ✅ ASSISTENTE IA
const assistenteAtivo=new Set();
const assistenteHistoria={};
const MAX_HISTORIA_IA=20;
const NOMES_ASSISTENTE=["isaias","isaías","isaia","isáia","izaias","izaia","isaias,","isaías,","assistente"];
assistenteAtivo._timers={};

// ✅ CACHE DO PLAY
const playCacheMap=new Map();
function salvarPlayCache(dados){const chave=`play_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; playCacheMap.set(chave,{...dados,criadoEm:Date.now()}); setTimeout(()=>playCacheMap.delete(chave),10*60*1000); return chave;}
function obterPlayCache(chave){return playCacheMap.get(chave)||null;}
function removerPlayCache(chave){playCacheMap.delete(chave);}

try{const s=fs.readJsonSync(ARQUIVO_SILENCIADOS); for(const[j,l] of Object.entries(s)) membrosSilenciados[j]=l;}catch{}

const MENU_NUMEROS={"1":"cat_principal","2":"cat_downloads","3":"cat_figurinhas","4":"cat_brincadeiras","5":"cat_coins","6":"cat_alteradores","7":"cat_logos","8":"cat_adm","9":"cat_dono","0":"cat_18"};
const LINK_RX=/(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/|bit\.ly|youtu\.be|youtube\.com|facebook\.com|instagram\.com|tiktok\.com|wa\.me)/i;
const STATUS_MENCAO_RX=/status\s*@|'s status|was mentioned/i;

// ═══════════════════════════════════════════════════════
// ✅ HELPERS
// ═══════════════════════════════════════════════════════
function ehDono(s){if(!s) return false; const n=String(s).split("@")[0].split(":")[0].replace(/\D/g,""); if(!n) return false; return CONFIG.NUMEROS_ADM.some(d=>{const dn=d.replace(/\D/g,""); return n===dn||n.endsWith(dn)||dn.endsWith(n);});}
function extrairJid(p){if(!p) return ""; if(typeof p==="string") return p; if(typeof p==="object"&&p.id) return p.id; return String(p);}
function removerAcentos(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function formatarDuracao(seg){if(!seg||isNaN(seg)) return "N/A"; const m=Math.floor(seg/60),s=Math.floor(seg%60); return `${m}:${s.toString().padStart(2,"0")}`;}
function getTexto(msg){const m=msg?.message; if(!m) return ""; return m.conversation||m.extendedTextMessage?.text||m.imageMessage?.caption||m.videoMessage?.caption||m.documentMessage?.caption||"";}
function calcularSeguro(expr){const safe=expr.replace(/[^0-9+\-*/().%\s]/g,"").trim(); if(!safe) throw new Error("Inválida"); return Function(`"use strict"; return (${safe})`)();}
function gerarGrade(palavra){const tam=8,letras="ABCDEFGHIJKLMNOPQRSTUVWXYZ"; const grade=Array(tam).fill(null).map(()=>Array(tam).fill(null).map(()=>letras[Math.floor(Math.random()*26)])); const linha=Math.floor(Math.random()*tam),col=Math.floor(Math.random()*(tam-palavra.length)); for(let i=0;i<palavra.length;i++) grade[linha][col+i]=palavra[i]; return grade.map(r=>r.join(" ")).join("\n");}
function mostrarGuerraEstado(jogo){const vidas=["❤️❤️❤️❤️❤️❤️","🧡❤️❤️❤️❤️❤️","🧡🧡❤️❤️❤️❤️","🧡🧡🧡❤️❤️❤️","🧡🧡🧡🧡❤️❤️","🧡🧡🧡🧡🧡❤️","💀💀💀💀💀💀"]; const pM=jogo.palavra.split("").map(l=>jogo.letrasAcertadas.includes(l)?l:"_").join(" "); const eS=jogo.letrasErradas.length>0?jogo.letrasErradas.join(", "):"Nenhuma"; return `⚔️ *FORCA*\n✦ ─────────── ✦\n🔤 *${pM}*\n💡 _${jogo.dica}_\n\n${vidas[Math.min(jogo.letrasErradas.length,6)]}\n❌ Erradas: *${eS}*\n\n_Digita uma letra!_`;}
function selecionarSemRepetir(banco,usadas){const disp=banco.filter(item=>{const id=item.p||item.palavra||item.c||item.i; return !usadas.includes(id);}); if(!disp.length) return null; return disp[Math.floor(Math.random()*disp.length)];}
function ehMencaoStatus(msg,texto){if(msg.message?.statusMentionMessage) return true; if(texto&&STATUS_MENCAO_RX.test(texto)) return true; const ctx=msg.message?.extendedTextMessage?.contextInfo; if(ctx?.remoteJid?.includes("status@broadcast")) return true; if(ctx?.participant?.includes("status@broadcast")) return true; return false;}
function getTipoMsg(msg){const m=msg?.message; if(!m) return "📄"; if(m.conversation||m.extendedTextMessage) return "💬"; if(m.imageMessage) return "🖼️"; if(m.videoMessage) return "🎥"; if(m.audioMessage||m.pttMessage) return "🎙️"; if(m.stickerMessage) return "🎭"; if(m.documentMessage) return "📄"; return "📄";}
function salvarNoBuffer(jid,d){if(!bufferMsgs[jid]) bufferMsgs[jid]=[]; bufferMsgs[jid].push(d); if(bufferMsgs[jid].length>MAX_BUFFER) bufferMsgs[jid].shift();}
function salvarSilenciados(){try{fs.writeJsonSync(ARQUIVO_SILENCIADOS,membrosSilenciados);}catch{}}
function salvarStats(cmd,sender){try{const s=fs.readJsonSync(ARQUIVO_STATS); s.total=(s.total||0)+1; s.comandos[cmd]=(s.comandos[cmd]||0)+1; s.usuarios[String(sender).split("@")[0]]=(s.usuarios[String(sender).split("@")[0]]||0)+1; fs.writeJsonSync(ARQUIVO_STATS,s);}catch{}}
function addXP(sender,xp=2){try{const r=fs.readJsonSync(ARQUIVO_RANK); const n=String(sender).split("@")[0]; if(!r[n]) r[n]={xp:0,nivel:1,msgs:0}; r[n].xp+=xp; r[n].msgs+=1; r[n].nivel=Math.floor(r[n].xp/100)+1; fs.writeJsonSync(ARQUIVO_RANK,r);}catch{}}
function registarAtividade(sender,jid){try{const a=fs.readJsonSync(ARQUIVO_ATIVOS); if(!a[jid]) a[jid]={}; a[jid][String(sender)]=Date.now(); fs.writeJsonSync(ARQUIVO_ATIVOS,a);}catch{}}
const userRateLimit={};
function verificarRateLimit(s){const a=Date.now(); if(userRateLimit[s]&&(a-userRateLimit[s])<2000) return false; userRateLimit[s]=a; return true;}
setInterval(()=>{const a=Date.now(); for(const[k,v] of Object.entries(userRateLimit)){if(a-v>10000) delete userRateLimit[k];}},5*60*1000);
function detectarWakeWord(txt){if(!txt) return null; const palavras=txt.trim().split(/\s+/); const padroes=["isaias","izaias","isaia","izaia"]; for(let i=0;i<Math.min(4,palavras.length);i++){const pl=removerAcentos(palavras[i].toLowerCase()).replace(/[^a-z]/g,""); if(padroes.includes(pl)) return palavras.slice(i+1).join(" ").trim();} return null;}

// ═══════════════════════════════════════════════════════
// ✅ COINS & VIP
// ═══════════════════════════════════════════════════════
function getCoins(s){try{const c=fs.readJsonSync(ARQUIVO_COINS); return c[s]?.moedas||0;}catch{return 0;}}
function setCoins(s,n){try{const c=fs.readJsonSync(ARQUIVO_COINS); if(!c[s]) c[s]={moedas:0}; c[s].moedas=Math.max(0,n); fs.writeJsonSync(ARQUIVO_COINS,c);}catch{}}
function addCoins(s,n){try{const c=fs.readJsonSync(ARQUIVO_COINS); if(!c[s]) c[s]={moedas:0}; c[s].moedas+=n; fs.writeJsonSync(ARQUIVO_COINS,c);}catch{}}
function getCooldown(s,t){try{const c=fs.readJsonSync(ARQUIVO_COOLDOWNS); return c[`${s}_${t}`]||0;}catch{return 0;}}
function setCooldown(s,t){try{const c=fs.readJsonSync(ARQUIVO_COOLDOWNS); c[`${s}_${t}`]=Date.now(); fs.writeJsonSync(ARQUIVO_COOLDOWNS,c);}catch{}}
function isVip(sender){try{const v=fs.readJsonSync(ARQUIVO_VIPS); return !!v[sender];}catch{return false;}}
function addVip(sender,nome="VIP"){try{const v=fs.readJsonSync(ARQUIVO_VIPS); v[sender]={nome,desde:Date.now()}; fs.writeJsonSync(ARQUIVO_VIPS,v);}catch{}}
function removeVip(sender){try{const v=fs.readJsonSync(ARQUIVO_VIPS); delete v[sender]; fs.writeJsonSync(ARQUIVO_VIPS,v);}catch{}}
function listarVips(){try{return fs.readJsonSync(ARQUIVO_VIPS);}catch{return {};}}

// ═══════════════════════════════════════════════════════
// ✅ SELO VERIFICADO
// ═══════════════════════════════════════════════════════
function criarSeloBot(jid){const num=CONFIG.NUMERO_BOT; return{key:{participant:"0@s.whatsapp.net",remoteJid:jid||"status@broadcast",fromMe:false},message:{contactMessage:{displayName:CONFIG.NOME_BOT,vcard:`BEGIN:VCARD\nVERSION:3.0\nN:;${CONFIG.NOME_BOT};;;\nFN:${CONFIG.NOME_BOT}\nitem1.TEL;waid=${num}:+${num}\nitem1.X-ABLabel:WhatsApp\nEND:VCARD`,contextInfo:{forwardingScore:1,isForwarded:true}}}};}

// ═══════════════════════════════════════════════════════
// ✅ BARRA DE CARREGAMENTO
// ═══════════════════════════════════════════════════════
const FRAMES_LOADING=["⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛  0%","🟦🟦⬛⬛⬛⬛⬛⬛⬛⬛ 20%","🟦🟦🟦🟦⬛⬛⬛⬛⬛⬛ 40%","🟦🟦🟦🟦🟦🟦⬛⬛⬛⬛ 60%","🟦🟦🟦🟦🟦🟦🟦🟦⬛⬛ 80%","🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% ✅"];

async function barraCarregamento(sock,jid,seloBot,titulo,callbackDownload){
  let loadingMsg=null;
  try{loadingMsg=await sock.sendMessage(jid,{text:`⏬ *${titulo}*\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{}
  const downloadPromise=callbackDownload();
  for(let i=1;i<=4;i++){await new Promise(r=>setTimeout(r,700)); if(loadingMsg){try{await sock.sendMessage(jid,{text:`⏬ *${titulo}*\n\n${FRAMES_LOADING[i]}`,edit:loadingMsg.key});}catch{}}}
  const resultado=await downloadPromise;
  if(loadingMsg){try{await sock.sendMessage(jid,{text:`⏬ *${titulo}*\n\n${FRAMES_LOADING[5]}`,edit:loadingMsg.key});}catch{}}
  await new Promise(r=>setTimeout(r,400));
  return resultado;
}

// ═══════════════════════════════════════════════════════
// ✅ LOADING HACKER (para o !play)
// ═══════════════════════════════════════════════════════
function gerarSequenciaHacker(titulo,formato){const tipo=formato==="mp3"?"áudio":"vídeo"; return[`[ 📂 ] Invadindo servidor de mídia...\n_alvo: ${titulo}_`,`[ 🛰️ ] Escaneando rede...\n_capturando pacotes..._`,`[ 🟢 ] Acesso concedido. Bypass completo.`,`[ 🔍 ] Analisando o ${tipo}...\n_rastreando metadados..._`,`[ 🧬 ] Extraindo dados do artista...`,`[ 📡 ] Extraindo pacotes de ${tipo}...`,`[ 💾 ] Compilando arquivo final...\n_criptografia removida_`,`[ ✅ ] Missão concluída. Enviando resultado.`];}

async function rodarLoadingHacker(sock,chatJid,msgAlvo,titulo,formato){
  const passos=gerarSequenciaHacker(titulo,formato);
  const loadingMsg=await sock.sendMessage(chatJid,{text:passos[0]},{quoted:msgAlvo});
  for(let i=1;i<passos.length;i++){await new Promise(r=>setTimeout(r,900)); try{await sock.sendMessage(chatJid,{text:passos[i],edit:loadingMsg.key});}catch(e){console.warn("[PLAY] Falha ao editar loading:",e.message); break;}}
  return loadingMsg;
}

// ═══════════════════════════════════════════════════════
// ✅ PLAY — Banner com botões
// ═══════════════════════════════════════════════════════
function montarLegendaPlay(item){return `🎵 *${item.titulo}*\n👤 Canal: ${item.autor}\n${item.duracao?`⏱️ Duração: ${item.duracao}\n`:""}\n✨ Selecciona o formato desejado. ✨`;}

async function enviarBannerButtons(sock,chatJid,item,chave,msg){return await sock.sendMessage(chatJid,{image:{url:item.thumbnail},caption:montarLegendaPlay(item),footer:CONFIG.NOME_BOT,buttons:[{buttonId:`play_mp3_${chave}`,buttonText:{displayText:"🎵 Áudio MP3"},type:1},{buttonId:`play_mp4_${chave}`,buttonText:{displayText:"🎬 Vídeo MP4"},type:1},{buttonId:`play_doc_${chave}`,buttonText:{displayText:"📄 Documento"},type:1}],headerType:4},{quoted:msg});}
async function enviarBannerInteractive(sock,chatJid,item,chave,msg){return await sock.sendMessage(chatJid,{image:{url:item.thumbnail},caption:montarLegendaPlay(item),footer:CONFIG.NOME_BOT,title:item.titulo,subtitle:item.autor,hasMediaAttachment:false,interactiveButtons:[{name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🎵 Áudio MP3",id:`play_mp3_${chave}`})},{name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🎬 Vídeo MP4",id:`play_mp4_${chave}`})},{name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"📄 Documento",id:`play_doc_${chave}`})}]},{quoted:msg});}
async function enviarBannerNativeFlow(sock,chatJid,item,chave,msg){return await sock.sendMessage(chatJid,{...(item.thumbnail?{image:{url:item.thumbnail}}:{}),caption:montarLegendaPlay(item),footer:CONFIG.NOME_BOT,nativeFlow:[{text:"🎵 Áudio MP3",id:`play_mp3_${chave}`,icon:"review"},{text:"🎬 Vídeo MP4",id:`play_mp4_${chave}`,icon:"default"},{text:"📄 Documento",id:`play_doc_${chave}`,icon:"default"}]},{quoted:msg});}
async function enviarBannerFallback(sock,chatJid,item,chave,msg){return await sock.sendMessage(chatJid,{...(item.thumbnail?{image:{url:item.thumbnail}}:{}),caption:montarLegendaPlay(item)+`\n\n👉 Responda: *mp3*, *mp4* ou *doc*\n🆔 \`${chave}\``,footer:CONFIG.NOME_BOT},{quoted:msg});}

async function processarComandoPlay(sock,chatJid,msg,query){
  if(!query||!query.trim()){await sock.sendMessage(chatJid,{text:`⚠️ Uso: *${CONFIG.PREFIXO}play <nome da música>*`},{quoted:criarSeloBot(chatJid)}); return;}
  await sock.sendMessage(chatJid,{react:{text:"🔎",key:msg.key}});
  let videos=[];
  // Tenta Scraper Hub primeiro
  try{videos=await scraperYouTubeSearch(query,1);}catch{}
  // Tenta Piped (bom para servidores)
  if(!videos.length){try{const piped=await buscarYouTubePiped(query); if(piped.length) videos=piped;}catch{}}
  // Fallback yt-dlp
  if(!videos.length){try{const baseArgs=getYtDlpBaseArgs(); const json=await runCmd(`${YTDLP_CMD} --dump-json ${baseArgs} "ytsearch1:${query}" 2>/dev/null`); const linhas=json.trim().split('\n').filter(l=>l.trim().startsWith('{')); videos=linhas.map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);}catch{}}

  if(!videos.length){await sock.sendMessage(chatJid,{react:{text:"❌",key:msg.key}}); await sock.sendMessage(chatJid,{text:`💥 Não encontrei: "_${query}_".`},{quoted:criarSeloBot(chatJid)}); return;}

  const v=videos[0];
  const item={titulo:(v.title||v.titulo||query).slice(0,60),autor:v.uploader||v.channel||v.canal||v.uploaderName||"N/A",duracao:v.duration?formatarDuracao(v.duration||v.duracao||0):null,thumbnail:v.thumbnail||v.miniatura||null,url:v.webpage_url||v.url||v.link||v.pipedUrl||`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,query,chatJid};
  const chave=salvarPlayCache(item);
  let bannerMsg=null;

  if(item.thumbnail){try{bannerMsg=await enviarBannerButtons(sock,chatJid,item,chave,msg);}catch{} if(!bannerMsg){try{bannerMsg=await enviarBannerInteractive(sock,chatJid,item,chave,msg);}catch{}} if(!bannerMsg){try{bannerMsg=await enviarBannerNativeFlow(sock,chatJid,item,chave,msg);}catch{}}}
  if(!bannerMsg){bannerMsg=await enviarBannerFallback(sock,chatJid,item,chave,msg);}
  const itemCached=obterPlayCache(chave); if(itemCached) itemCached.bannerKey=bannerMsg?.key;
  await sock.sendMessage(chatJid,{react:{text:"✅",key:msg.key}});
}

function extrairBotaoClicado(msg){const legado=msg.message?.buttonsResponseMessage?.selectedButtonId; if(legado) return legado; const nativeFlow=msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage; if(nativeFlow?.paramsJson){try{const p=JSON.parse(nativeFlow.paramsJson); if(p.id) return p.id;}catch{}} const template=msg.message?.templateButtonReplyMessage?.selectedId; if(template) return template; return null;}

async function processarBotaoPlay(sock,msg){
  const chatJid=msg.key.remoteJid;
  let formato=null,chave=null;
  const btnId=extrairBotaoClicado(msg);
  if(btnId&&btnId.startsWith("play_")){const partes=btnId.split("_"); formato=partes[1]; chave=partes.slice(2).join("_");}
  else{const body=getTexto(msg).toLowerCase().trim(); const ctx=msg.message?.extendedTextMessage?.contextInfo; if(ctx?.quotedMessage?.imageMessage?.caption){const cap=ctx.quotedMessage.imageMessage.caption; const match=cap.match(/🆔 `([^`]+)`/); if(match){chave=match[1]; if(body.includes("mp3")) formato="mp3"; else if(body.includes("mp4")) formato="mp4"; else if(body.includes("doc")) formato="doc";}} if(!formato||!chave) return false;}

  const item=obterPlayCache(chave);
  if(!item){await sock.sendMessage(chatJid,{text:"⌛ Esta busca expirou. Usa *!play* novamente."},{quoted:msg}); return true;}
  if(item.bannerKey){try{await sock.sendMessage(chatJid,{delete:item.bannerKey});}catch{}}
  const loadingMsg=await rodarLoadingHacker(sock,chatJid,msg,item.titulo,formato);
  let arquivoFinal=null;
  try{
    if(formato==="mp3"){
      arquivoFinal=await downloadMusica(item.url||item.query,false);
      if(!arquivoFinal||!fs.existsSync(arquivoFinal)) throw new Error("Download falhou");
      const buf=fs.readFileSync(arquivoFinal);
      try{await sock.sendMessage(chatJid,{delete:loadingMsg.key});}catch{}
      await sock.sendMessage(chatJid,{audio:buf,mimetype:"audio/mpeg",fileName:`${item.titulo}.mp3`},{quoted:msg});
    }else if(formato==="mp4"){
      arquivoFinal=await downloadVideo(item.url||item.query,480);
      if(!arquivoFinal||!fs.existsSync(arquivoFinal)) throw new Error("Download falhou");
      const buf=fs.readFileSync(arquivoFinal);
      try{await sock.sendMessage(chatJid,{delete:loadingMsg.key});}catch{}
      await sock.sendMessage(chatJid,{video:buf,caption:`🎬 ${item.titulo}`,mimetype:"video/mp4"},{quoted:msg});
    }else if(formato==="doc"){
      arquivoFinal=await downloadMusica(item.url||item.query,true);
      if(!arquivoFinal||!fs.existsSync(arquivoFinal)) throw new Error("Download falhou");
      const buf=fs.readFileSync(arquivoFinal);
      try{await sock.sendMessage(chatJid,{delete:loadingMsg.key});}catch{}
      await sock.sendMessage(chatJid,{document:buf,mimetype:"audio/mpeg",fileName:`${item.titulo}.mp3`},{quoted:msg});
    }
    await sock.sendMessage(chatJid,{react:{text:"✅",key:msg.key}});
  }catch(e){
    console.error("❌ [PLAY] Falha:",e.message);
    try{await sock.sendMessage(chatJid,{text:`[ ⛔ ] Falha na extração.\n_${e.message}_`,edit:loadingMsg.key});}
    catch{await sock.sendMessage(chatJid,{text:`💥 Falha: _${e.message}_`},{quoted:msg});}
    await sock.sendMessage(chatJid,{react:{text:"❌",key:msg.key}});
  }finally{if(arquivoFinal&&fs.existsSync(arquivoFinal)){try{fs.removeSync(arquivoFinal);}catch{}} removerPlayCache(chave);}
  return true;
}

// ═══════════════════════════════════════════════════════
// ✅ ENVIO COM SELO
// ═══════════════════════════════════════════════════════
async function enviarComSelo(sock,jid,texto,seloBot,q=null){const opts=q?{quoted:q}:{quoted:seloBot}; try{if(botFotoBuffer) await sock.sendMessage(jid,{image:botFotoBuffer,caption:texto},opts); else if(ppBotUrl) await sock.sendMessage(jid,{image:{url:ppBotUrl},caption:texto},opts); else await sock.sendMessage(jid,{text:texto},opts);}catch{try{await sock.sendMessage(jid,{text:texto},{quoted:seloBot});}catch{}}}
async function reagir(sock,msg,emoji="⏳"){try{await sock.sendMessage(msg.key.remoteJid,{react:{text:emoji,key:msg.key}});}catch{}}

// ═══════════════════════════════════════════════════════
// ✅ MENU
// ═══════════════════════════════════════════════════════
function buildSecoes(isDono){
  const principal={title:"🌀 MENUS",highlight_label:"L1TTL3B0Y|DEV",rows:[{header:"● MENU-PRINCIPAL",title:"_comandos principais._",id:"cat_principal"},{header:"● MENU-DOWNLOADS",title:"_download e upload._",id:"cat_downloads"},{header:"● MENU-FIGURINHAS",title:"_figurinhas e criações._",id:"cat_figurinhas"},{header:"● MENU-BRINCADEIRAS",title:"_jogos e diversão._",id:"cat_brincadeiras"},{header:"● MENU-COINS",title:"_moedas e economia._",id:"cat_coins"},{header:"🎵 MENU-ALTERADORES",title:"_IA, voz, áudio e imagem._",id:"cat_alteradores"},{header:"🎨 MENU-LOGOS",title:"_criação de logos._",id:"cat_logos"},{header:"🔞 MENU+18",title:"_exclusivo para VIPs._",id:"cat_18"},{header:"🛡️ MENU-ADM",title:"_administração._",id:"cat_adm"}]};
  if(isDono) principal.rows.push({header:"● MENU-DONO",title:"_apenas dono._",id:"cat_dono"});
  const extras={title:"🌀 EXTRAS",highlight_label:"L1TTL3B0Y|DEV",rows:[{header:"● ISAÍAS IA",title:"_assistente sem prefixo._",id:"cat_assistente"},{header:"● CRIADOR",title:"_informações do criador._",id:"cat_criador"},{header:"● PING",title:"_status do bot._",id:"cat_ping"},{header:"● DONOS",title:"_lista de donos._",id:"cat_donos"},{header:"● ALUGAR BOT",title:"_planos de aluguel._",id:"cat_alugar_info"}]};
  return[principal,extras];
}

async function enviarMenuPrincipal(sock,jid,msg,isDono,sender,isAdmin,seloBot){
  const P=CONFIG.PREFIXO; const agora=new Date(); const hora=agora.toLocaleTimeString("pt-AO",{timeZone:"Africa/Luanda",hour:"2-digit",minute:"2-digit",second:"2-digit"}); const nomeUser=sender.split("@")[0].split(":")[0]; const cargo=isDono?"Criador.":(isAdmin?"Administrador.":"Utilizador."); const secoes=buildSecoes(isDono);
  const textoMenu=`┌─☆·˖✶˖·✦·˖✶˖·☆─┐\n｜  🌀 *LORDE LÁ DJUM* 🌀\n└─☆·˖✶˖·✦·˖✶˖·☆─┘\n\n｜✦ 🤖 BOT: *${CONFIG.NOME_BOT}*\n｜✦ 👤 USUÁRIO: *${nomeUser}*\n｜✦ 🎖️ CARGO: *${cargo}*\n｜✦ ⌨️ PREFIXO: *${P}*\n｜✦ 🕐 HORA: *${hora}*\n｜✦ 💎 VIP: *${isVip(sender)?"✅":"❌"}*\n｜✦ 🔑 Acesso: *${senhasAprovadas.has(sender)||isDono?"✅":"Usa !pp [código]"}*\n`;
  try{const botFotoSrc=botFotoBuffer?"./dados/bot_foto.jpg":(ppBotUrl||null); const payload={caption:textoMenu,footer:CONFIG.NOME_BOT,optionText:"≡ ABRIR MENU",optionTitle:"📂 Selecciona uma categoria",nativeFlow:[{text:"≡ Categorias",sections:secoes,icon:"default"},{text:"📢 Canal",url:CONFIG.CANAL_URL,useWebview:false}]}; if(botFotoSrc) payload.image={url:botFotoSrc}; await sock.sendMessage(jid,payload,{quoted:seloBot}); return;}catch(e){console.log("⚠️ NativeFlow menu:",e.message);}
  try{if(botFotoBuffer) await sock.sendMessage(jid,{image:botFotoBuffer,caption:textoMenu},{quoted:seloBot}); else if(ppBotUrl) await sock.sendMessage(jid,{image:{url:ppBotUrl},caption:textoMenu},{quoted:seloBot}); else await sock.sendMessage(jid,{text:textoMenu},{quoted:seloBot}); await new Promise(r=>setTimeout(r,600)); await sock.sendMessage(jid,{listMessage:{title:`🌀 *${CONFIG.NOME_BOT}*`,description:"Selecciona uma categoria:",footerText:`© ${CONFIG.NOME_BOT}`,buttonText:"≡ MENU",listType:1,sections:secoes}}); return;}catch(e){console.log("⚠️ listMessage:",e.message);}
  try{await sock.sendMessage(jid,{text:textoMenu},{quoted:seloBot});}catch{}
  await new Promise(r=>setTimeout(r,400));
  const menu=`┌─⊱ 『 📂 CATEGORIAS 』 ⊰─┐\n│\n◎ ─ *1* → 📋 Principal\n◎ ─ *2* → ⬇️ Downloads\n◎ ─ *3* → 🎭 Figurinhas\n◎ ─ *4* → 🎮 Brincadeiras\n◎ ─ *5* → 💰 Coins\n◎ ─ *6* → 🎵 Alteradores\n◎ ─ *7* → 🎨 Logos\n◎ ─ *8* → 🛡️ ADM\n◎ ─ *9* → 🔞 +18 (VIP)${isDono?"\n◎ ─ *0* → 👑 Dono":""}\n│\n└──────────────────────────────⊰`;
  await sock.sendMessage(jid,{text:menu},{quoted:seloBot});
  menuEsperandoResposta.set(`${jid}_${sender}`,{isDono,timestamp:Date.now()});
  setTimeout(()=>menuEsperandoResposta.delete(`${jid}_${sender}`),120000);
}

function gerarSubmenu(catId,P){
  if(catId==="cat_principal") return(`┌─⊱ 『 📋 MENU PRINCIPAL 』 ⊰─┐\n│\n◎ ─ *${P}menu* / *${P}ping* / *${P}stats*\n◎ ─ *${P}sobre* / *${P}id* / *${P}regras*\n◎ ─ *${P}dono* / *${P}donos* / *${P}alugar*\n◎ ─ *${P}pp [código]* → _palavra-passe_\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);
  if(catId==="cat_assistente") return(`┌─⊱ 『 🤖 ISAÍAS IA 』 ⊰─┐\n│\n◎ ─ Fala sem prefixo!\n│\n💬 *Exemplos:*\n◎ ─ _"Isaías, baixa Calema te amo"_\n◎ ─ _"que tempo em Luanda?"_\n◎ ─ _"faz uma piada"_\n◎ ─ _"quanto é 15x12?"_\n│\n◎ ─ *${P}assistente* → _activar_\n◎ ─ *${P}isaias-off* → _desactivar_\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);
  if(catId==="cat_downloads") return(`┌─⊱ 『 ⬇️ MENU DOWNLOADS 』 ⊰─┐\n│\n🎵 *YOUTUBE*\n◎ ─ *${P}play* [música] → _banner c/ botões_\n◎ ─ *${P}mp3* / *${P}mp4* / *${P}mp4hd*\n◎ ─ *${P}ytsearch* [pesquisa]\n│\n📱 *REDES SOCIAIS*\n◎ ─ *${P}tiktok* / *${P}ttsearch*\n◎ ─ *${P}tttrend* / *${P}ttuser*\n◎ ─ *${P}instagram* / *${P}twitter*\n◎ ─ *${P}facebook* / *${P}kwai*\n◎ ─ *${P}spotify* / *${P}soundcloud*\n│\n🖼️ *FICHEIROS*\n◎ ─ *${P}pinterest* / *${P}pinvideo*\n◎ ─ *${P}mediafire* / *${P}apk*\n◎ ─ *${P}qr* / *${P}tourl* / *${P}mostre*\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);
  if(catId==="cat_figurinhas") return(`┌─⊱ 『 🎭 MENU FIGURINHAS 』 ⊰─┐\n│\n◎ ─ *${P}sticker* → _imagem/vídeo ➜ sticker_\n◎ ─ *${P}sf* → _sticker ➜ foto_\n◎ ─ *${P}brat* [texto]\n◎ ─ *${P}figurinha* [nº]\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);
  if(catId==="cat_brincadeiras") return(`┌─⊱ 『 🎮 MENU BRINCADEIRAS 』 ⊰─┐\n│\n🎮 *GRUPO:* quiz/vof/completar/caca/guerra/stop\n🎲 *SOLO:* matematica/jokenpo/dado/cara-coroa\n         adivinhar/velocidade/roleta/aki/aposta\n😂 *DIVERSÃO:* piada/conselho/poema/historia\n              perfil/cara/ship/fofoca\n⚡ *FUN:* shazam [envia ⚡⚡]\n🏆 *RANK:* rank/toprank\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);
  if(catId==="cat_coins") return(`┌─⊱ 『 💰 MENU COINS 』 ⊰─┐\n│\n◎ ─ *${P}moedas* / *${P}diario* / *${P}topcoins*\n◎ ─ *${P}dar* @user [qtd]\n◎ ─ *${P}roubar* @user\n◎ ─ *${P}aposta* [qtd]\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);
  if(catId==="cat_alteradores") return(`┌─⊱ 『 🎵 MENU ALTERADORES 』 ⊰─┐\n│\n🔊 *VOZ:* vz / busca (reconhece música)\n📝 *TRANSCRIÇÃO:* transcrever/resumiraudio\n              traduziraudio/audioparaia\n🧠 *IA:* ia/resumir/traduzir\n🖼️ *IMAGEM:* fotocopia/fotoparaia\n           resumirfoto/traduzirfoto/editar\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);
  if(catId==="cat_logos") return(`┌─⊱ 『 🎨 MENU LOGOS 』 ⊰─┐\n│\n◎ ─ *${P}meme* / *${P}logo* / *${P}card*\n◎ ─ *${P}calc* / *${P}encurtar* / *${P}qr*\n◎ ─ *${P}tempo* / *${P}horario* / *${P}cotacao*\n◎ ─ *${P}ver* / *${P}apagadas* / *${P}placar*\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);
  if(catId==="cat_18") return(`┌─⊱ 『 🔞 MENU +18 』 ⊰─┐\n│\n◎ ─ ⚠️ *EXCLUSIVO PARA VIPS*\n│\n◎ ─ *${P}piada18* / *${P}truth* / *${P}dare*\n◎ ─ *${P}crush* / *${P}seduzir* @user\n◎ ─ *${P}beijo* / *${P}abraco* / *${P}tapa*\n◎ ─ *${P}flirt* / *${P}casal* @user\n│\n◎ ─ 💰 *${P}alugar* para ser VIP\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT}_`);
  if(catId==="cat_adm"||catId==="adm") return(`┌─⊱ 『 🛡️ MENU ADM 』 ⊰─┐\n│\n👥 *MEMBROS:* banir/add/addadmin/removeadmin\n             silenciar/dessilenciar/addvip/vips\n📢 *COMUNICAÇÃO:* all/att/aviso/link/sorteio\n⚙️ *CONFIGS:* fechar/abrir/nomegrupo/descgrupo\n             bot/anti-link/scanlink/verifica/addai\n│\n└──────────────────────────────⊰`);
  if(catId==="cat_dono") return(`┌─⊱ 『 👑 MENU DONO 』 ⊰─┐\n│\n◎ ─ *${CONFIG.PREFIXO}ergue-se* / *${CONFIG.PREFIXO}set* [senha]\n◎ ─ *${CONFIG.PREFIXO}out* / *${CONFIG.PREFIXO}prefixo* [símbolo]\n◎ ─ *${CONFIG.PREFIXO}setfoto* / *${CONFIG.PREFIXO}chaton*\n◎ ─ *${CONFIG.PREFIXO}sms* / *${CONFIG.PREFIXO}gsms*\n│\n👑 *${CONFIG.DONO_NOME}*\n📞 *${CONFIG.DONO_NUM}*\n│\n└──────────────────────────────⊰`);
  return null;
}

async function enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono){
  if(catId==="cat_assistente"){assistenteAtivo.add(jid); clearTimeout(assistenteAtivo._timers[jid]); assistenteAtivo._timers[jid]=setTimeout(()=>{assistenteAtivo.delete(jid); delete assistenteHistoria[jid];},30*60*1000); await sock.sendMessage(jid,{text:`🤖 *Assistente Isaías ACTIVADO!*\n│\n_"Isaías, baixa música do Calema"_\n_"que tempo em Luanda?"_\n_"faz uma piada"_\n│\n*!isaias-off* para desactivar.`},{quoted:seloBot}); return;}
  if(catId==="cat_ping"){const ini=Date.now(); await sock.sendMessage(jid,{text:"⏳"}); await sock.sendMessage(jid,{text:`🏓 *PONG!*\n📶 *${Date.now()-ini}ms* | ⏱️ ${Math.floor(process.uptime()/60)} min | 💾 ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB\n🌐 Servidor: *${CONFIG.IS_SERVER?"☁️ Cloud":"📱 Local"}*`},{quoted:seloBot}); return;}
  if(catId==="cat_donos"){await sock.sendMessage(jid,{text:`👑 *DONOS*\n│\n◎ ─ 👑 *${CONFIG.DONO_NOME}*\n   📞 ${CONFIG.DONO_NUM}`},{quoted:seloBot}); return;}
  if(catId==="cat_alugar_info"||catId==="cat_alugar"){await sock.sendMessage(jid,{text:gerarTextoAlugar()},{quoted:seloBot}); return;}
  if(catId==="cat_criador"){let ppD=null; try{ppD=await sock.profilePictureUrl(CONFIG.DONO_JID,"image");}catch{} const tD=`👨‍💻 *CRIADOR*\n│\n🏷️ *${CONFIG.DONO_NOME}*\n📞 *${CONFIG.DONO_NUM}*`; if(ppD) await sock.sendMessage(jid,{image:{url:ppD},caption:tD},{quoted:seloBot}); else await sock.sendMessage(jid,{text:tD},{quoted:seloBot}); return;}
  const texto=gerarSubmenu(catId,CONFIG.PREFIXO);
  if(!texto) return;
  await reagir(sock,{key:{remoteJid:jid,...msg?.key}},msg?.key?"✅":"⚡").catch(()=>{});
  await new Promise(r=>setTimeout(r,300));
  if(botFotoBuffer) await sock.sendMessage(jid,{image:botFotoBuffer,caption:texto},{quoted:seloBot});
  else if(ppBotUrl) await sock.sendMessage(jid,{image:{url:ppBotUrl},caption:texto},{quoted:seloBot});
  else await sock.sendMessage(jid,{text:texto},{quoted:seloBot});
}

function gerarTextoAlugar(){return`╭━━⪩ *ALUGUEL BOT* ⪨━━\n▢ Bot rápido e estável 24h\n▢ Comandos exclusivos\n▢ Downloads sem travar\n▢ IA com GPT\n▢ Anti-link, Anti-spam\n▢ Suporte prioritário\n╰━━─「🤖」─━━\n\n╭━━⪩ *PLANOS* ⪨━━\n▢ 🎁 *Grátis* - 3 dias (KZ 0,00)\n▢ 🎈 *Lite* - 5 dias (KZ 500)\n▢ 🍀 *Basic* - 1 semana (KZ 700)\n▢ 🪙 *Gold* - 2 semanas (KZ 1200)\n▢ 💎 *Diamond* - 1 mês (KZ 2000)\n▢ 🚀 *Ultra* - 3 meses (KZ 3500)\n╰━━─「💰」─━━\n\n╭━━⪩ *CONTATO* ⪨━━\n▢ 📲 +244926612801\n▢ Suporte 24h\n╰━━─「📱」─━━`;}

// ═══════════════════════════════════════════════════════
// ✅ ASSISTENTE IA
// ═══════════════════════════════════════════════════════
function detectarChamadaAssistente(texto){if(!texto) return false; const t=texto.trim().toLowerCase(); const tLimpo=removerAcentos(t); return NOMES_ASSISTENTE.some(n=>{const nL=removerAcentos(n); return tLimpo.startsWith(nL)||tLimpo.includes(` ${nL} `)||tLimpo.includes(` ${nL},`)||tLimpo.includes(` ${nL}!`)||tLimpo.includes(` ${nL}?`);});}
function removerNomeAssistente(texto){let t=texto.trim(); for(const nome of NOMES_ASSISTENTE){const regex=new RegExp(`^${nome}[,!?. ]*`,"i"); t=t.replace(regex,"").trim();} return t||texto;}
function adicionarHistorico(jid,role,content){if(!assistenteHistoria[jid]) assistenteHistoria[jid]=[]; assistenteHistoria[jid].push({role,content}); if(assistenteHistoria[jid].length>MAX_HISTORIA_IA*2) assistenteHistoria[jid]=assistenteHistoria[jid].slice(-MAX_HISTORIA_IA*2);}

async function classificarIntencao(pergunta){
  const sistema=`Classificador de intenções para bot WhatsApp. Responde APENAS JSON.
Intenções: DOWNLOADS_MUSICA, DOWNLOADS_VIDEO, DOWNLOADS_TIKTOK, DOWNLOADS_INSTAGRAM,
DOWNLOADS_YOUTUBE_PESQUISA, DOWNLOADS_TWITTER, DOWNLOADS_FACEBOOK, DOWNLOADS_SPOTIFY,
DOWNLOADS_SOUNDCLOUD, DOWNLOADS_PINTEREST, DOWNLOADS_MEDIAFIRE, DOWNLOADS_APK,
STICKER, VOZ_TEXTO, TRANSCREVER, IA_PERGUNTA, IA_TRADUZIR, IA_RESUMIR,
IA_PIADA, IA_CONSELHO, IA_HISTORIA, IA_POEMA, FOTO_IA, QR_CODE, ENCURTAR_LINK,
TEMPO, HORARIO, CALCULADORA, COTACAO, PING, RANK, MOEDAS, ALUGAR, DONO_INFO, MENU, DESCONHECIDO
Formato: {"intencao":"NOME","parametro":"texto ou vazio","confianca":0-100}`;
  try{const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:"llama-3.1-8b-instant",messages:[{role:"system",content:sistema},{role:"user",content:pergunta}],max_tokens:200,temperature:0.1},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:12000,httpsAgent}); const resp=data.choices?.[0]?.message?.content?.trim(); const m=resp?.match(/\{[\s\S]+\}/); if(m) return JSON.parse(m[0]);}catch(e){console.log("❌ classificarIntencao:",e.message);}
  return{intencao:"DESCONHECIDO",parametro:"",confianca:0};
}

async function respostaAssistente(pergunta,historico=[],nomeUser){
  const sistema=`Você é Isaías, assistente do bot LORDE LÁ DJUM v3.5 no WhatsApp. Responde em português de Angola. Seja direto, amigável e natural. O utilizador chama-se ${nomeUser}.`;
  try{const msgs=[{role:"system",content:sistema},...historico.slice(-MAX_HISTORIA_IA*2),{role:"user",content:pergunta}]; const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:"llama-3.1-8b-instant",messages:msgs,max_tokens:600,temperature:0.8},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:20000,httpsAgent}); return data.choices?.[0]?.message?.content?.trim()||"Desculpa, tenta de novo!";}
  catch(e){console.log("❌ respostaAssistente:",e.message); return"Desculpa, tive um problema. Tenta de novo!";}
}

async function executarAssistente(sock,jid,msg,sender,seloBot,texto,isDono,isAdmin){
  if(!assistenteAtivo.has(jid)){if(!detectarChamadaAssistente(texto)) return false; assistenteAtivo.add(jid);}
  clearTimeout(assistenteAtivo._timers[jid]);
  assistenteAtivo._timers[jid]=setTimeout(()=>{assistenteAtivo.delete(jid); delete assistenteHistoria[jid];},30*60*1000);
  const perguntaLimpa=removerNomeAssistente(texto).trim();
  if(!perguntaLimpa) return true;
  const nomeUser=sender.split("@")[0].split(":")[0];
  await reagir(sock,msg,"🤔");
  try{
    const{intencao,parametro,confianca}=await classificarIntencao(perguntaLimpa);
    console.log(`🤖 IA: ${intencao} (${confianca}%) "${parametro}"`);
    adicionarHistorico(jid,"user",perguntaLimpa);

    if(intencao==="DOWNLOADS_MUSICA"&&parametro){await reagir(sock,msg,"🎵"); const arq=await barraCarregamento(sock,jid,seloBot,`A baixar: ${parametro}`,()=>downloadMusica(parametro,false)); if(arq&&fs.existsSync(arq)){try{await enviarAudio(sock,jid,arq,seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); const r=`✅ Aqui está! 🎵`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r); setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`😔 Erro. Tenta *!mp3 ${parametro}*`},{quoted:seloBot});}}else{await reagir(sock,msg,"❌"); const r=`❌ Não encontrei. Tenta *!mp3 ${parametro}*! 🎵`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);} return true;}
    if(intencao==="DOWNLOADS_VIDEO"&&parametro){await reagir(sock,msg,"🎬"); const saida=await barraCarregamento(sock,jid,seloBot,`A baixar vídeo: ${parametro}`,()=>downloadVideo(parametro,480)); if(saida&&fs.existsSync(saida)){try{await enviarVideo(sock,jid,saida,`🎬 ${parametro}`,[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); adicionarHistorico(jid,"assistant","Aqui está o vídeo! 🎬"); setTimeout(()=>{try{fs.removeSync(saida);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`😔 Erro. Tenta *!mp4 ${parametro}*`},{quoted:seloBot});}}else{await reagir(sock,msg,"❌"); const r=`❌ Não consegui. Tenta *!mp4 ${parametro}*! 🎬`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);} return true;}
    if(intencao==="DOWNLOADS_YOUTUBE_PESQUISA"&&parametro){await reagir(sock,msg,"🔍"); const videos=await scraperYouTubeSearch(parametro,5); if(videos.length){const lista=videos.slice(0,5).map((v,i)=>`*${i+1}.* 🎵 ${(v.title||v.titulo||"N/A").slice(0,40)}\n   ⏱️ ${formatarDuracao(v.duration||0)}\n   🔗 ${v.webpage_url||v.url||""}`).join("\n\n"); const r=`🔍 *${parametro}*:\n\n${lista}\n\nUsa *!mp3 [link]* ou *!mp4 [link]*!`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);}else{const r=`❌ Não encontrei "_${parametro}_".`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);} await reagir(sock,msg,"✅"); return true;}
    if(intencao==="DOWNLOADS_TIKTOK"&&parametro){await reagir(sock,msg,"📱"); try{const result=await barraCarregamento(sock,jid,seloBot,"A baixar TikTok...",()=>scraperTikTokVideo(parametro)); await sock.sendMessage(jid,{video:{url:result.url},caption:`📱 *${result.title||"TikTok"}*`},{quoted:seloBot}); await reagir(sock,msg,"✅"); addXP(sender,5); adicionarHistorico(jid,"assistant","Aqui está o TikTok! 📱");}catch(e){await reagir(sock,msg,"❌"); const r=`❌ Não consegui. Tenta *!tiktok [link]*! 📱`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);} return true;}
    if(["DOWNLOADS_INSTAGRAM","DOWNLOADS_TWITTER","DOWNLOADS_FACEBOOK"].includes(intencao)&&parametro){const emojis={DOWNLOADS_INSTAGRAM:"📸",DOWNLOADS_TWITTER:"🐦",DOWNLOADS_FACEBOOK:"📘"}; const cmds={DOWNLOADS_INSTAGRAM:"!instagram",DOWNLOADS_TWITTER:"!twitter",DOWNLOADS_FACEBOOK:"!facebook"}; const emoji=emojis[intencao],cmd=cmds[intencao]; await reagir(sock,msg,emoji); try{const result=await barraCarregamento(sock,jid,seloBot,`A baixar...`,()=>dlRedeSocial(parametro)); await enviarVideo(sock,jid,result.filePath,`${emoji} Download`,[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); adicionarHistorico(jid,"assistant",`Aqui está! ${emoji}`); setTimeout(()=>{try{fs.removeSync(result.filePath);}catch{}},15000);}catch(e){await reagir(sock,msg,"❌"); const r=`❌ Não consegui. Tenta *${cmd} [link]*! ${emoji}`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);} return true;}
    if(["DOWNLOADS_SPOTIFY","DOWNLOADS_SOUNDCLOUD"].includes(intencao)&&parametro){const emoji=intencao==="DOWNLOADS_SPOTIFY"?"🟢":"🔶"; const cmd=intencao==="DOWNLOADS_SPOTIFY"?"!spotify":"!soundcloud"; await reagir(sock,msg,emoji); try{const dlFn=intencao==="DOWNLOADS_SPOTIFY"?()=>dlSpotify(parametro).then(r=>r.filePath):()=>dlSoundcloud(parametro).then(r=>r.filePath); const arq=await barraCarregamento(sock,jid,seloBot,`A procurar: ${parametro}`,dlFn); await enviarAudio(sock,jid,arq,seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); const r=`✅ Aqui está! ${emoji}`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r); setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);}catch(e){await reagir(sock,msg,"❌"); const r=`❌ Não encontrei. Tenta *${cmd} ${parametro}*! ${emoji}`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);} return true;}
    if(intencao==="VOZ_TEXTO"&&parametro){await reagir(sock,msg,"🔊"); try{const audioPath=await barraCarregamento(sock,jid,seloBot,"A converter para voz...",()=>textoParaFala(parametro)); await enviarAudio(sock,jid,audioPath,seloBot); try{fs.removeSync(audioPath);}catch{} await reagir(sock,msg,"✅"); adicionarHistorico(jid,"assistant","Voz enviada! 🔊");}catch(e){const r=`❌ Não consegui. Tenta *!vz ${parametro}*! 🔊`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);} return true;}
    if(intencao==="TRANSCREVER"){const audioData=await downloadAudioDaMensagem(msg); if(!audioData){const r=`🎙️ Para transcrever, responde a uma *nota de voz*!`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);}else{await reagir(sock,msg,"🎙️"); try{const t=await transcreverComGroq(audioData.buffer); await sock.sendMessage(jid,{text:`📝 *Transcrição:*\n│\n${t}`},{quoted:seloBot}); await reagir(sock,msg,"✅"); adicionarHistorico(jid,"assistant",t.slice(0,100));}catch(e){const r=`❌ Não consegui transcrever.`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);}} return true;}
    if(intencao==="FOTO_IA"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){const r=`🖼️ Para analisar foto, responde à imagem!`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);}else{await reagir(sock,msg,"🖼️"); try{const instrucao=parametro||"Descreve detalhadamente. Em português."; const resp_ia=await analisarImagem(imgBuf,instrucao); await sock.sendMessage(jid,{text:`🖼️ *Análise:*\n│\n${resp_ia}`},{quoted:seloBot}); await reagir(sock,msg,"🧠"); adicionarHistorico(jid,"assistant",resp_ia.slice(0,200));}catch(e){const r=`❌ Não consegui analisar.`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);}} return true;}
    if(intencao==="CALCULADORA"&&parametro){try{const resultado=calcularSeguro(parametro); const r=`🔢 *${parametro}* = *${resultado}*`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); await reagir(sock,msg,"✅"); adicionarHistorico(jid,"assistant",r);}catch{try{const resp_ia=await chatIA(`Calcula: ${parametro}. Responde só com o resultado.`); await sock.sendMessage(jid,{text:`🔢 ${parametro} = *${resp_ia}*`},{quoted:seloBot}); adicionarHistorico(jid,"assistant",resp_ia);}catch{const r=`❌ Não consegui calcular.`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);}} return true;}
    if(intencao==="TEMPO"){const cidade=parametro||"Luanda"; try{const res=await axios.get(`https://wttr.in/${encodeURIComponent(cidade)}?format=j1`,{timeout:10000,httpsAgent}); const cur=res.data.current_condition[0]; const r=`🌤️ *${cidade}*\n│\n🌡️ *${cur.temp_C}°C* — ${cur.weatherDesc[0].value}\n💧 ${cur.humidity}% | 💨 ${cur.windspeedKmph}km/h`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); await reagir(sock,msg,"✅"); adicionarHistorico(jid,"assistant",r);}catch{const resp_ia=await chatIA(`Clima em ${cidade} agora? 2 linhas.`,"Sê direto."); await sock.sendMessage(jid,{text:`🌤️ *${cidade}:*\n${resp_ia}`},{quoted:seloBot}); adicionarHistorico(jid,"assistant",resp_ia.slice(0,100));} return true;}
    if(intencao==="HORARIO"){const agora=new Date(); const opc=(tz)=>({timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false}); const r=`🕐 Angola: *${agora.toLocaleTimeString("pt-AO",opc("Africa/Luanda"))}* | Brasil: *${agora.toLocaleTimeString("pt-BR",opc("America/Sao_Paulo"))}* | Portugal: *${agora.toLocaleTimeString("pt-PT",opc("Europe/Lisbon"))}*`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r); return true;}
    if(intencao==="COTACAO"){const resp_ia=await chatIA("Cotações: 1 USD = ? AOA, 1 EUR = ? AOA. Sê direto e breve.","Assistente financeiro."); await sock.sendMessage(jid,{text:`💱 *COTAÇÕES KWANZA*\n│\n${resp_ia}`},{quoted:seloBot}); adicionarHistorico(jid,"assistant",resp_ia.slice(0,100)); return true;}
    if(intencao==="PING"){const ini=Date.now(); const r=`🏓 *Bot online!* 📶 *${Date.now()-ini}ms* | ⏱️ ${Math.floor(process.uptime()/60)} min | 💾 ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r); return true;}
    if(intencao==="RANK"){const r2=fs.readJsonSync(ARQUIVO_RANK); const n=sender.split("@")[0]; const d=r2[n]||{xp:0,nivel:1,msgs:0}; const bar="█".repeat(Math.min(10,Math.floor((d.xp%100)/10)))+"░".repeat(10-Math.min(10,Math.floor((d.xp%100)/10))); const r=`🏆 *${nomeUser}* — Nível *${d.nivel}* | XP: *${d.xp}*\n[${bar}]\n💬 Msgs: *${d.msgs}*`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r); return true;}
    if(intencao==="MOEDAS"){const moedas=getCoins(sender); const r=`💰 *${nomeUser}*, tens *${moedas}* moedas! Usa *!diario* para ganhar mais! 🎁`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r); return true;}
    if(intencao==="ALUGAR"){await sock.sendMessage(jid,{text:gerarTextoAlugar()},{quoted:seloBot}); adicionarHistorico(jid,"assistant","Info de aluguel!"); return true;}
    if(intencao==="DONO_INFO"){let ppD=null; try{ppD=await sock.profilePictureUrl(CONFIG.DONO_JID,"image");}catch{} const r=`👑 *${CONFIG.DONO_NOME}* | 📞 *${CONFIG.DONO_NUM}*\nUsa *!alugar*! 💰`; if(ppD) await sock.sendMessage(jid,{image:{url:ppD},caption:r},{quoted:seloBot}); else await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r); return true;}
    if(intencao==="MENU"){const r=`📋 Usa *!menu* ou pede: _"Isaías, baixa a música..."_, _"que clima..."_, _"piada"_, etc. 😊`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r); return true;}
    if(intencao==="QR_CODE"&&parametro){try{await sock.sendMessage(jid,{image:{url:`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(parametro)}&qzone=2&ecc=M`},caption:`🔲 QR Code!`},{quoted:seloBot}); await reagir(sock,msg,"✅"); adicionarHistorico(jid,"assistant","QR Code! 🔲");}catch{const r=`❌ Tenta *!qr ${parametro}*!`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);} return true;}
    if(intencao==="ENCURTAR_LINK"&&parametro){try{const{data}=await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(parametro)}`,{timeout:10000,httpsAgent}); const urlE=String(data).trim(); const r=`🔗 *Link encurtado:*\n${urlE}`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);}catch{const r=`❌ Tenta *!encurtar ${parametro}*!`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);} return true;}

    // IA geral — resposta directa sem loading
    if(["IA_PERGUNTA","IA_TRADUZIR","IA_RESUMIR","IA_PIADA","IA_CONSELHO","IA_HISTORIA","IA_POEMA"].includes(intencao)){
      await reagir(sock,msg,"🧠");
      let prompt=parametro||perguntaLimpa;
      if(intencao==="IA_PIADA") prompt="Conta uma piada engraçada em português de Angola.";
      else if(intencao==="IA_HISTORIA") prompt=`Escreve história curta sobre: ${parametro||"algo interessante"}. Máx 200 palavras.`;
      else if(intencao==="IA_POEMA") prompt=`Escreve poema de 4-6 versos sobre: ${parametro||"Angola"}.`;
      const resp_ia=await respostaAssistente(prompt,assistenteHistoria[jid]||[],nomeUser);
      await sock.sendMessage(jid,{text:resp_ia},{quoted:seloBot});
      await reagir(sock,msg,"🧠");
      adicionarHistorico(jid,"user",prompt);
      adicionarHistorico(jid,"assistant",resp_ia);
      return true;
    }

    // Desconhecido — resposta directa sem loading
    if(intencao==="DESCONHECIDO"||confianca<40){
      await reagir(sock,msg,"🤖");
      const resp_ia=await respostaAssistente(perguntaLimpa,assistenteHistoria[jid]||[],nomeUser);
      const naoConsegue=resp_ia.toLowerCase().includes("não consigo")||resp_ia.toLowerCase().includes("nao consigo");
      if(naoConsegue){const r=`😔 Infelizmente não consigo fazer isso.\n\nEscreve *!menu* para ver as opções! 📋`; await sock.sendMessage(jid,{text:r},{quoted:seloBot}); adicionarHistorico(jid,"assistant",r);}
      else{await sock.sendMessage(jid,{text:resp_ia},{quoted:seloBot}); adicionarHistorico(jid,"user",perguntaLimpa); adicionarHistorico(jid,"assistant",resp_ia);}
      return true;
    }

    addXP(sender,2);
    return true;
  }catch(e){
    console.error("❌ Assistente:",e.message);
    try{await sock.sendMessage(jid,{text:`😔 Tive um erro. Tenta de novo ou usa *!menu*!`},{quoted:seloBot});}catch{}
    return true;
  }
}

// ═══════════════════════════════════════════════════════
// ✅ FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════
function runCmd(cmd){return new Promise((resolve,reject)=>{exec(cmd,{timeout:180000,maxBuffer:150*1024*1024,env:{...process.env,TMPDIR:process.env.TMPDIR}},(err,stdout,stderr)=>{if(err) reject(new Error(stderr||err.message)); else resolve(stdout.trim());});});}
function encontrarArquivo(pasta,prefixo){try{const arqs=fs.readdirSync(pasta).filter(f=>f.startsWith(prefixo)&&!f.endsWith(".part")&&!f.endsWith(".ytdl")); if(!arqs.length) return null; const p=path.join(pasta,arqs[0]); return fs.statSync(p).size>3000?p:null;}catch{return null;}}

async function chatIA(prompt,sistema="És um assistente simpático que responde em português de Angola. Sê direto."){
  for(const modelo of["llama-3.1-8b-instant","mixtral-8x7b-32768"]){try{const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:modelo,messages:[{role:"system",content:sistema},{role:"user",content:prompt}],max_tokens:800,temperature:0.7},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:20000,httpsAgent}); const resp=data.choices?.[0]?.message?.content?.trim(); if(resp&&resp.length>2) return resp;}catch(e){console.log(`❌ Groq ${modelo}:`,e.message);}}
  try{const{data}=await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(sistema)}&model=openai-large`,{timeout:25000,responseType:"text",httpsAgent}); const resp=typeof data==="string"?data.trim():String(data).trim(); if(resp.length>5) return resp;}catch{}
  return "❌ IA indisponível.";
}

async function transcreverComGroq(buffer){const formData=new FormData(); formData.append("file",buffer,{filename:"audio.ogg",contentType:"audio/ogg"}); formData.append("model","whisper-large-v3"); formData.append("response_format","json"); const{data}=await axios.post("https://api.groq.com/openai/v1/audio/transcriptions",formData,{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,...formData.getHeaders()},timeout:60000,httpsAgent}); const texto=data?.text?.trim(); if(!texto) throw new Error("Áudio não audível"); return texto;}

async function textoParaFala(texto,voz=CONFIG.VOZ_TTS){
  const tempId=Date.now(),tempTxt=`./downloads/tts_in_${tempId}.txt`,tempOut=`./downloads/tts_out_${tempId}.mp3`;
  try{
    const textoLimpo=texto.replace(/[*_~`#]/g,"").replace(/\n+/g,". ").slice(0,1800);
    if(!textoLimpo.trim()) throw new Error("Texto vazio");
    fs.writeFileSync(tempTxt,textoLimpo,"utf8");
    await runCmd(`${EDGETTS_CMD} --voice "${voz}" --file "${tempTxt}" --write-media "${tempOut}"`);
    if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<500) throw new Error("TTS inválido");
    return tempOut;
  }finally{try{fs.removeSync(tempTxt);}catch{}}
}

async function reconhecerMusica(buf){const formData=new FormData(); formData.append("file",buf,{filename:"audio.ogg",contentType:"audio/ogg"}); formData.append("api_token","test"); formData.append("return","apple_music,spotify"); const{data}=await axios.post("https://api.audd.io/",formData,{headers:{...formData.getHeaders()},timeout:30000,httpsAgent}); return data;}

async function analisarImagem(imagemBuffer,instrucao){let mimeType="image/jpeg"; if(imagemBuffer[0]===0x89&&imagemBuffer[1]===0x50) mimeType="image/png"; const base64=imagemBuffer.toString("base64"); for(const modelo of["meta-llama/llama-4-scout-17b-16e-instruct","meta-llama/llama-4-maverick-17b-128e-instruct"]){try{const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:modelo,messages:[{role:"user",content:[{type:"image_url",image_url:{url:`data:${mimeType};base64,${base64}`}},{type:"text",text:instrucao}]}],max_tokens:1000,temperature:0.3},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:30000,httpsAgent}); const resp=data.choices?.[0]?.message?.content?.trim(); if(resp&&resp.length>2) return resp;}catch(e){console.log(`❌ ${modelo}:`,e.message);}} throw new Error("Modelos de visão falharam.");}

async function buscarImagemInternet(query){try{const{data}=await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,{timeout:8000,httpsAgent}); if(data?.originalimage?.source) return data.originalimage.source; if(data?.thumbnail?.source) return data.thumbnail.source;}catch{} try{const{data}=await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,{timeout:8000,httpsAgent}); if(data?.originalimage?.source) return data.originalimage.source; if(data?.thumbnail?.source) return data.thumbnail.source;}catch{} return null;}

async function gerarJogoIA(tipo,categoria=null,usadas=[]){
  const sistema="Gerador de jogos educativos. Responde APENAS JSON puro.";
  let prompt="";
  if(tipo==="quiz"){const ev=usadas.length>0?`Evita: ${usadas.slice(-6).join(" | ")}`:""; prompt=`Quiz ${categoria?`sobre:"${categoria}"`:"variado"}. ${ev} JSON: {"pergunta":"Capital de Angola?","resposta":"luanda"}.`;}
  if(tipo==="completar"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:""; prompt=`Palavra Completa ${categoria||"variado"}. ${ev} JSON: {"inicial":"A_G_LA","completa":"angola","dica":"País África"}.`;}
  if(tipo==="caca"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:""; prompt=`Palavra Caça. ${ev} JSON: {"palavra":"ANGOLA","dica":"País"}. MAIÚSCULAS 4-8 letras.`;}
  if(tipo==="guerra"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:""; prompt=`Palavra Forca. ${ev} JSON: {"palavra":"FUTEBOL","dica":"Desporto"}. 5-9 letras MAIÚSCULAS.`;}
  if(tipo==="vof"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(" | ")}`:""; prompt=`Afirmação V/F. ${ev} JSON: {"pergunta":"O sol é uma estrela.","resposta":"verdadeiro"}.`;}
  try{const resp=await chatIA(prompt,sistema); const m=resp.match(/\{[^{}]+\}/); if(!m) throw new Error("no JSON"); const p=JSON.parse(m[0]); if(tipo==="quiz"&&p.pergunta&&p.resposta) return{p:p.pergunta,r:p.resposta.toLowerCase().trim()}; if(tipo==="completar"&&p.inicial&&p.completa) return{i:p.inicial,c:p.completa.toLowerCase().trim(),d:p.dica||"Completa"}; if(tipo==="caca"&&p.palavra) return{palavra:p.palavra.toUpperCase().replace(/[^A-Z]/g,""),dica:p.dica||"Encontra"}; if(tipo==="guerra"&&p.palavra) return{palavra:p.palavra.toUpperCase().replace(/[^A-Z]/g,""),dica:p.dica||"Palavra"}; if(tipo==="vof"&&p.pergunta&&p.resposta) return{p:p.pergunta,r:p.resposta.toLowerCase().trim()};}catch(e){console.log(`❌ gerarJogoIA(${tipo}):`,e.message);}
  return null;
}

// Uploads
async function uploadParaTelegraph(buffer){const formData=new FormData(); let mimeType="image/jpeg",ext="jpg"; if(buffer[0]===0x89&&buffer[1]===0x50){mimeType="image/png";ext="png";} formData.append("file",buffer,{filename:`img.${ext}`,contentType:mimeType}); const{data}=await axios.post("https://telegra.ph/upload",formData,{headers:{...formData.getHeaders()},timeout:30000,httpsAgent}); if(data?.[0]?.src) return `https://telegra.ph${data[0].src}`; throw new Error("Telegraph falhou");}
async function uploadParaCatbox(buffer,nome,mimeType){const formData=new FormData(); formData.append("reqtype","fileupload"); formData.append("fileToUpload",buffer,{filename:nome,contentType:mimeType}); const{data}=await axios.post("https://catbox.moe/user/api.php",formData,{headers:{...formData.getHeaders()},timeout:180000,httpsAgent,maxContentLength:Infinity,maxBodyLength:Infinity}); const url=String(data).trim(); if(!url.startsWith("http")) throw new Error("Catbox falhou"); return url;}

// Scraper Hub
async function scraperHub(endpoint){const{data}=await axios.get(`${CONFIG.SCRAPER_HUB_URL}${endpoint}`,{timeout:30000,httpsAgent}); return data;}
async function scraperTikTokVideo(url){try{const data=await scraperHub(`/api/tiktok/video?url=${encodeURIComponent(url)}`); if(data?.url||data?.video) return{url:data.url||data.video,title:data.title||"TikTok"};}catch{} const{data}=await axios.post("https://www.tikwm.com/api/",`url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`,{headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Mozilla/5.0"},timeout:30000,httpsAgent}); const d=data?.data; if(!d) throw new Error("Sem dados"); return{url:d.hdplay||d.play,title:d.title||"TikTok"};}
async function scraperTikTokSearch(query,limit=10){try{const data=await scraperHub(`/api/tiktok/search?q=${encodeURIComponent(query)}&limit=${limit}`); return data?.resultados||data?.results||data?.videos||[];}catch{return[];}}
async function scraperTikTokTrending(region="AO",limit=10){try{const data=await scraperHub(`/api/tiktok/trending?region=${region}&limit=${limit}`); return data?.resultados||data?.results||data?.videos||[];}catch{return[];}}
async function scraperTikTokUser(username){try{const data=await scraperHub(`/api/tiktok/user?username=${encodeURIComponent(username)}`); return data?.resultado||data?.result||data?.user||null;}catch{return null;}}
async function scraperPinterestSearch(query,limit=10,type="image"){try{const data=await scraperHub(`/api/pinterest/search?q=${encodeURIComponent(query)}&limit=${limit}&type=${type}`); return data?.resultados||data?.results||data?.pins||[];}catch{try{const{data}=await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`,{timeout:15000,httpsAgent}); return data?.data||[];}catch{return [];}}}
async function scraperPinterestPin(url){try{const data=await scraperHub(`/api/pinterest/pin?url=${encodeURIComponent(url)}`); return data?.resultado||data?.result||data?.pin||null;}catch{try{const{data}=await axios.get(`https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(url)}`,{timeout:15000,httpsAgent}); return data?.data||null;}catch{return null;}}}
async function scraperYouTubeSearch(query,limit=5){try{const data=await scraperHub(`/api/youtube/search?q=${encodeURIComponent(query)}&limit=${limit}`); return data?.resultados||data?.results||data?.videos||[];}catch{return[];}}
async function downloadViaScraperHub(url,formato){const resp=await axios.post(`${CONFIG.SCRAPER_HUB_URL}/api/youtube/download`,{url,formato},{timeout:180000,httpsAgent}); if(!resp.data?.filename) throw new Error("Scraper Hub: sem filename"); const filename=resp.data.filename; const fileResp=await axios.get(`${CONFIG.SCRAPER_HUB_URL}/api/youtube/file/${filename}`,{responseType:"arraybuffer",timeout:180000,httpsAgent}); return Buffer.from(fileResp.data);}

// ═══════════════════════════════════════════════════════
// ✅ DOWNLOADS — Com estratégias múltiplas para servidores
// ═══════════════════════════════════════════════════════
async function downloadMusica(entrada,altaQualidade=false){
  // 1. Tenta Scraper Hub
  try{const buf=await downloadViaScraperHub(entrada,"mp3"); const p=path.join("./downloads",`mus_hub_${Date.now()}.mp3`); fs.writeFileSync(p,buf); if(fs.statSync(p).size>3000) return p; fs.removeSync(p);}catch(e){console.log("⚠️ Scraper Hub mp3:",e.message);}

  // 2. Tenta via Piped (bom para servidores)
  if(CONFIG.IS_SERVER){
    try{
      const videoId=entrada.match(/(?:v=|youtu\.be\/)([^&\n?]+)/)?.[1];
      const piped=videoId?await downloadViaInvidious(videoId):null;
      if(piped?.audioUrl){
        console.log("🟢 Usando Invidious para download...");
        const resp=await axios.get(piped.audioUrl,{responseType:"arraybuffer",timeout:120000,httpsAgent,maxContentLength:Infinity});
        const p=path.join("./downloads",`mus_inv_${Date.now()}.mp3`);
        fs.writeFileSync(p,Buffer.from(resp.data));
        if(fs.statSync(p).size>3000) return p;
        fs.removeSync(p);
      }
    }catch(e){console.log("⚠️ Invidious:",e.message);}

    // 3. Tenta Piped como fallback
    try{
      const busca=await buscarYouTubePiped(entrada);
      if(busca.length){
        const videoId=busca[0].url.match(/(?:v=|youtu\.be\/)([^&\n?]+)/)?.[1];
        if(videoId){
          const streams=await downloadViaInvidious(videoId);
          if(streams?.audioUrl){
            const resp=await axios.get(streams.audioUrl,{responseType:"arraybuffer",timeout:120000,httpsAgent,maxContentLength:Infinity});
            const p=path.join("./downloads",`mus_piped_${Date.now()}.mp3`);
            fs.writeFileSync(p,Buffer.from(resp.data));
            if(fs.statSync(p).size>3000) return p;
            fs.removeSync(p);
          }
        }
      }
    }catch(e){console.log("⚠️ Piped música:",e.message);}
  }

  // 4. yt-dlp com args adaptados para servidor
  const isUrl=entrada.startsWith("http");
  const nomeBase=`mus_${Date.now()}`;
  const saida=`./downloads/${nomeBase}.%(ext)s`;
  const quality=altaQualidade?"0":"5";
  const baseArgs=getYtDlpBaseArgs();
  const base=`${YTDLP_CMD} -x --audio-format mp3 --audio-quality ${quality} -o "${saida}" ${baseArgs}`;
  const fontes=isUrl?[entrada]:[`scsearch1:${entrada}`,`ytsearch1:${entrada}`,`ytsearch1:${entrada.split(" ").slice(0,4).join(" ")} audio`];
  for(const fonte of fontes){
    try{
      await runCmd(`${base} "${fonte}"`);
      const arq=encontrarArquivo("./downloads",nomeBase);
      if(arq&&fs.statSync(arq).size>3000) return arq;
    }catch(e){console.log(`⚠️ yt-dlp música (${fonte.slice(0,30)}):`,e.message);}
  }
  return null;
}

async function downloadVideo(entrada,height=480){
  // 1. Tenta Scraper Hub
  try{const buf=await downloadViaScraperHub(entrada,"mp4"); const p=path.join("./downloads",`vid_hub_${Date.now()}.mp4`); fs.writeFileSync(p,buf); if(fs.statSync(p).size>3000) return p; fs.removeSync(p);}catch(e){console.log("⚠️ Scraper Hub mp4:",e.message);}

  // 2. yt-dlp com args de servidor
  const isUrl=entrada.startsWith("http");
  const nomeBase=`vid_${Date.now()}`;
  const saidaAny=`./downloads/${nomeBase}.%(ext)s`;
  const pesquisa=isUrl?entrada:`ytsearch1:${entrada}`;
  const baseArgs=getYtDlpBaseArgs();
  const tentarSalvar=(arq)=>{if(!arq) return null; try{const tam=fs.statSync(arq).size; if(tam>10000&&tam<100*1024*1024) return arq; if(fs.existsSync(arq)) fs.removeSync(arq);}catch{} return null;};

  // Para servidor, usa formatos que funcionam melhor com tv_embedded
  const formatosServidor=[
    `best[height<=${height}][ext=mp4]`,
    `best[height<=${height}]`,
    "best[ext=mp4]",
    "worst[ext=mp4]",
    "worst",
  ];
  const formatosTermux=[
    `best[height<=${height}][ext=mp4]`,
    `best[height<=${height}][ext=mp4]`,
    "18",
    "worst",
  ];
  const formatos=CONFIG.IS_SERVER?formatosServidor:formatosTermux;
  for(const fmt of formatos){
    try{
      await runCmd(`${YTDLP_CMD} ${baseArgs} -f "${fmt}" -o "${saidaAny}" "${pesquisa}"`);
      const r=tentarSalvar(encontrarArquivo("./downloads",nomeBase));
      if(r) return r;
    }catch(e){console.log(`⚠️ yt-dlp vídeo (${fmt}):`,e.message);}
  }
  return null;
}

async function downloadVideoHD(entrada,height=720){
  const isUrl=entrada.startsWith("http"),pesquisa=isUrl?entrada:`ytsearch1:${entrada}`;
  const nomeBase=`vidhd_${Date.now()}`,saida=`./downloads/${nomeBase}.mp4`;
  const LIMITE=90*1024*1024,MAX_SIZE="90M";
  const baseArgs=getYtDlpBaseArgs();
  const fmt=`bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/bestvideo+bestaudio/best`;
  const tentarSalvar=(arq)=>{if(!arq) return null; try{const tam=fs.statSync(arq).size; if(tam>10000&&tam<=LIMITE) return arq; if(fs.existsSync(arq)) fs.removeSync(arq);}catch{} return null;};
  try{
    await runCmd(`${YTDLP_CMD} ${baseArgs} --max-filesize ${MAX_SIZE} -f "${fmt}" --merge-output-format mp4 -o "${saida}" "${pesquisa}"`);
    const r=tentarSalvar(saida)||tentarSalvar(encontrarArquivo("./downloads",nomeBase));
    if(r) return{filePath:r,quality:`${height}p`,sizeMB:(fs.statSync(r).size/1024/1024).toFixed(1)};
  }catch(e){console.log(`⚠️ yt-dlp HD:`,e.message);}
  const r=await downloadVideo(entrada);
  if(r) return{filePath:r,quality:"480p",sizeMB:(fs.statSync(r).size/1024/1024).toFixed(1)};
  throw new Error("Não consegui baixar.");
}

async function dlRedeSocial(url){const nomeBase=`dl_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`; try{await runCmd(`${YTDLP_CMD} --no-check-certificate --no-playlist -f "best[ext=mp4]/best" -o "${saida}" "${url}"`); const arq=encontrarArquivo("./downloads",nomeBase); if(arq) return{filePath:arq};}catch{} throw new Error("Não consegui baixar.");}
async function dlSpotify(query){const arq=await downloadMusica(query,true); if(arq) return{filePath:arq}; throw new Error("Spotify: não encontrei.");}
async function dlSoundcloud(query){const isUrl=query.startsWith("http"),nomeBase=`sc_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`,fonte=isUrl?query:`scsearch1:${query}`; try{await runCmd(`${YTDLP_CMD} --no-check-certificate -x --audio-format mp3 --audio-quality 0 --no-playlist --no-warnings -o "${saida}" "${fonte}"`); const arq=encontrarArquivo("./downloads",nomeBase); if(arq) return{filePath:arq};}catch{} const arqFb=await downloadMusica(query,true); if(arqFb) return{filePath:arqFb}; throw new Error("SoundCloud: não encontrei.");}
async function dlMediafire(url){try{const{data}=await axios.get(url,{headers:{"User-Agent":"Mozilla/5.0"},timeout:15000,httpsAgent}); const match=data.match(/href="(https:\/\/download\d+\.mediafire\.com\/[^"]+)"/); if(match) return{url:match[1],title:decodeURIComponent(match[1].split("/").pop().split("?")[0])||"file"}; throw new Error("Link não encontrado.");}catch(e){throw new Error("MediaFire: "+e.message);}}
async function dlApk(query){try{const{data}=await axios.get(`https://liteapks.com/?s=${encodeURIComponent(query)}`,{headers:{"User-Agent":"Mozilla/5.0"},timeout:15000,httpsAgent}); const regex=/href="(https:\/\/liteapks\.com\/[a-z0-9-]+\.html)"/g; let m; const results=[]; while((m=regex.exec(data))!==null&&results.length<3){const u=m[1]; if(!u.includes("page/")&&!results.find(r=>r===u)) results.push(u);} if(!results.length) throw new Error("Não encontrei."); return{url:results[0],title:results[0].split("/").pop().replace(".html","").replace(/-/g," ")};}catch(e){throw new Error("APK: "+e.message);}}

// Enviar Áudio/Vídeo
async function enviarAudio(sock,jid,filePath,msgCitada){
  if(!fs.existsSync(filePath)) throw new Error("Ficheiro não encontrado");
  const oggPath=path.join("./downloads",`ogg_${Date.now()}.ogg`);
  let converteu=false;
  if(FFMPEG_CMD!=="UNAVAILABLE"){try{await new Promise((res,rej)=>exec(`${FFMPEG_CMD} -i "${filePath}" -c:a libopus -b:a 64k -ar 24000 -ac 1 -vn "${oggPath}" -y -loglevel error`,{timeout:60000,env:{...process.env}},(err)=>err?rej(err):res())); if(fs.existsSync(oggPath)&&fs.statSync(oggPath).size>500) converteu=true;}catch{}}
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

// Stickers
async function criarSticker(imagemBuffer,isAnimated=false){const tempId=Date.now(),tempIn=`./downloads/stk_in_${tempId}.tmp`,tempOut=`./downloads/stk_out_${tempId}.webp`; try{fs.writeFileSync(tempIn,imagemBuffer); const cmd=isAnimated?`${FFMPEG_CMD} -i "${tempIn}" -t 5 -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=12" -c:v libwebp -quality 70 -preset default -loop 0 -an -vsync 0 "${tempOut}" -y -loglevel error`:`${FFMPEG_CMD} -i "${tempIn}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -c:v libwebp -quality 90 "${tempOut}" -y -loglevel error`; await new Promise((resolve,reject)=>{exec(cmd,{timeout:30000,env:{...process.env}},(err)=>err?reject(err):resolve());}); if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<100) throw new Error("WebP inválido"); return fs.readFileSync(tempOut);}finally{try{fs.removeSync(tempIn);}catch{} try{fs.removeSync(tempOut);}catch{}}}
async function stickerParaFoto(buf,isAnimated=false){const tempId=Date.now(),tempIn=`./downloads/sf_in_${tempId}.webp`,tempOut=`./downloads/sf_out_${tempId}.${isAnimated?"mp4":"jpg"}`; try{fs.writeFileSync(tempIn,buf); const cmd=isAnimated?`${FFMPEG_CMD} -i "${tempIn}" -c:v libx264 -pix_fmt yuv420p -movflags faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${tempOut}" -y -loglevel error`:`${FFMPEG_CMD} -i "${tempIn}" -frames:v 1 -q:v 2 "${tempOut}" -y -loglevel error`; await new Promise((resolve,reject)=>{exec(cmd,{timeout:30000,env:{...process.env}},(err)=>err?reject(err):resolve());}); if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<100) throw new Error("Conversão inválida"); return{buffer:fs.readFileSync(tempOut),isVideo:isAnimated};}catch(e){return{buffer:buf,isVideo:false,isWebP:true};}finally{try{fs.removeSync(tempIn);}catch{} try{fs.removeSync(tempOut);}catch{}}}

// Download de mídia
async function downloadImagemDaMensagem(msg){try{if(msg.message?.imageMessage) return await downloadMediaMessage(msg,"buffer",{});}catch{} const ctx=msg.message?.extendedTextMessage?.contextInfo; if(!ctx?.quotedMessage) return null; if(ctx.quotedMessage.imageMessage){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage}; return await downloadMediaMessage(qm,"buffer",{});}catch{}} return null;}
async function downloadAudioDaMensagem(msg){const tipos=["audioMessage","pttMessage"]; for(const tipo of tipos){if(msg.message?.[tipo]){try{return{buffer:await downloadMediaMessage(msg,"buffer",{})};}catch{}}} const ctx=msg.message?.extendedTextMessage?.contextInfo; if(!ctx?.quotedMessage) return null; for(const tipo of tipos){if(ctx.quotedMessage[tipo]){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage}; return{buffer:await downloadMediaMessage(qm,"buffer",{})};}catch{}}} return null;}
async function downloadQualquerMidia(msg){const m=msg.message; if(!m) return null; const tipos=[{chave:"imageMessage",mime:"image/jpeg",ext:"jpg"},{chave:"videoMessage",mime:"video/mp4",ext:"mp4"},{chave:"audioMessage",mime:"audio/ogg",ext:"ogg"},{chave:"pttMessage",mime:"audio/ogg",ext:"ogg"},{chave:"documentMessage",mime:"application/octet-stream",ext:"bin"},{chave:"stickerMessage",mime:"image/webp",ext:"webp"}]; for(const t of tipos){if(m[t.chave]){try{const buf=await downloadMediaMessage(msg,"buffer",{}); const mime=m[t.chave].mimetype||t.mime; const ext=mime.split("/")[1]?.split(";")[0]||t.ext; const nome=m[t.chave].fileName||`midia_${Date.now()}.${ext}`; return{buffer:buf,mime,nome};}catch{}}} const ctx=m.extendedTextMessage?.contextInfo; if(ctx?.quotedMessage){for(const t of tipos){if(ctx.quotedMessage[t.chave]){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage}; const buf=await downloadMediaMessage(qm,"buffer",{}); const mime=ctx.quotedMessage[t.chave].mimetype||t.mime; const ext=mime.split("/")[1]?.split(";")[0]||t.ext; const nome=ctx.quotedMessage[t.chave].fileName||`midia_${Date.now()}.${ext}`; return{buffer:buf,mime,nome};}catch{}}}} return null;}

// Ban
async function banirComContagem(sock,jid,sender,msgKey,motivo="Infração das regras"){const banKey=`${jid}_${sender}`; if(banEmCurso.has(banKey)) return; banEmCurso.add(banKey); try{try{await sock.sendMessage(jid,{delete:msgKey});}catch{} for(let i=5;i>=0;i--){try{await sock.sendMessage(jid,{text:`⏳ *${i}...*`});}catch{} await new Promise(r=>setTimeout(r,900));} try{await sock.sendMessage(jid,{text:`BANNNN❌️\n\n🚨 @${sender.split("@")[0]} foi *BANIDO!*\n_Motivo: ${motivo}_`,mentions:[sender]});}catch{} await new Promise(r=>setTimeout(r,500)); try{await sock.groupParticipantsUpdate(jid,[sender],"remove");}catch{} try{await sock.sendMessage(jid,{text:`🔨 @${sender.split("@")[0]} *REMOVIDO!* 😂💨`,mentions:[sender]});}catch{}}finally{setTimeout(()=>banEmCurso.delete(banKey),5000);}}

// Jogos
const VOF_BANCO=[{p:"O sol é uma estrela.",r:"verdadeiro"},{p:"A baleia é um peixe.",r:"falso"},{p:"O coração tem 4 câmaras.",r:"verdadeiro"},{p:"Angola tem 18 províncias.",r:"verdadeiro"},{p:"A água ferve a 50°C.",r:"falso"},{p:"O elefante é o maior animal terrestre.",r:"verdadeiro"},{p:"A Lua tem atmosfera.",r:"falso"},{p:"O tubarão é um mamífero.",r:"falso"},{p:"Luanda é capital de Angola.",r:"verdadeiro"},{p:"O diamante é o mineral mais duro.",r:"verdadeiro"}];
const QUIZ_BANCO=[{p:"Capital de Angola?",r:"luanda"},{p:"Maior planeta do sistema solar?",r:"jupiter"},{p:"Moeda de Angola?",r:"kwanza"},{p:"Quem pintou a Mona Lisa?",r:"leonardo da vinci"},{p:"Quantos continentes existem?",r:"7"},{p:"Capital do Brasil?",r:"brasilia"},{p:"País mais populoso do mundo?",r:"china"},{p:"Em que ano Angola se tornou independente?",r:"1975"}];
const COMPLETAR_BANCO=[{i:"ANG_LA",c:"angola",d:"País da África Austral"},{i:"LU_NDA",c:"luanda",d:"Capital de Angola"},{i:"FU_BOL",c:"futebol",d:"Desporto popular"},{i:"KW_NZA",c:"kwanza",d:"Moeda de Angola"},{i:"BR_SIL",c:"brasil",d:"América do Sul"}];
const CACA_BANCO=[{palavra:"ANGOLA",dica:"País da África Austral"},{palavra:"LUANDA",dica:"Capital de Angola"},{palavra:"FUTEBOL",dica:"Desporto popular"},{palavra:"AFRICA",dica:"Continente"},{palavra:"KWANZA",dica:"Moeda de Angola"},{palavra:"BRASIL",dica:"América do Sul"},{palavra:"DIAMANTE",dica:"Pedra preciosa"},{palavra:"ELEFANTE",dica:"Maior animal terrestre"}];
const GUERRA_BANCO=[{palavra:"ANGOLA",dica:"País da África Austral"},{palavra:"LUANDA",dica:"Capital de Angola"},{palavra:"AFRICA",dica:"Continente"},{palavra:"FUTEBOL",dica:"Desporto favorito"},{palavra:"DIAMANTE",dica:"Pedra preciosa"},{palavra:"ELEFANTE",dica:"Maior animal terrestre"},{palavra:"MUSICA",dica:"Arte dos sons"},{palavra:"OCEANO",dica:"Grande massa de água"}];
const PERFIS_ELOGIO=["🌟 Um ser extraordinário! Líder nato, coração de ouro!","👑 O verdadeiro rei! Inteligente, divertido!","🔥 Pura energia! Um talento raro!","💎 Raro como diamante! Leal e honesto!","🚀 Destinado ao sucesso! Mente brilhante!"];
const PERFIS_ZOADA=["😂 Deus criou esta pessoa e perguntou: 'O que fiz?!' 💀","🤣 A face assusta os espelhos! 💀","😭 Esta pessoa chegou e o WiFi ficou lento! 🚶🏿‍♂️","💀 Antes da câmara frontal! 📸😂","🤡 Acorda às 6h, olha pro espelho e volta a dormir! 😂"];
const PALAVRAS_VELOCIDADE=["programacao","desenvolvimento","inteligencia","javascript","angola","futebol","diamante","computador","tecnologia","engenharia"];
const MATEMATICA_BANCO=()=>{const a=Math.floor(Math.random()*50)+1,b=Math.floor(Math.random()*50)+1,ops=["+","-","*"]; const op=ops[Math.floor(Math.random()*ops.length)]; let r; if(op==="+") r=a+b; else if(op==="-") r=a-b; else r=a*b; return{pergunta:`*${a} ${op} ${b}*`,resposta:String(r)};};
const VERDADES_18=["Qual foi tua maior saia justa?","Tens crush em alguém aqui no grupo?","Já mandaste msg para a pessoa errada?","Já finges não ler uma mensagem?","Qual foi o momento mais embaraçoso da tua vida?"];
const DESAFIOS_18=["Canta uma música a cappella","Faz 20 flexões agora","Manda uma selfie feia","Escreve um poema sobre o dono do bot","Dança por 30 segundos","Conta um segredo que nunca contaste"];

async function proximaPergunta(sock,jid,seloBot){
  const loop=jogoLoop[jid]; if(!loop||!loop.activo) return;
  const{tipo,categoria,usadas=[]}=loop;
  let p=await gerarJogoIA(tipo,categoria,usadas);
  if(!p){if(tipo==="quiz") p=selecionarSemRepetir(QUIZ_BANCO,usadas); if(tipo==="vof") p=selecionarSemRepetir(VOF_BANCO,usadas); if(tipo==="completar") p=selecionarSemRepetir(COMPLETAR_BANCO,usadas); if(tipo==="caca") p=selecionarSemRepetir(CACA_BANCO,usadas); if(tipo==="guerra") p=selecionarSemRepetir(GUERRA_BANCO,usadas);}
  if(!p){loop.usadas=[]; if(tipo==="quiz") p=QUIZ_BANCO[Math.floor(Math.random()*QUIZ_BANCO.length)]; if(tipo==="vof") p=VOF_BANCO[Math.floor(Math.random()*VOF_BANCO.length)]; if(tipo==="completar") p=COMPLETAR_BANCO[Math.floor(Math.random()*COMPLETAR_BANCO.length)]; if(tipo==="caca") p=CACA_BANCO[Math.floor(Math.random()*CACA_BANCO.length)]; if(tipo==="guerra") p=GUERRA_BANCO[Math.floor(Math.random()*GUERRA_BANCO.length)]; await sock.sendMessage(jid,{text:`🔄 Banco reiniciado!`},{quoted:seloBot});}
  if(!p){delete jogoLoop[jid]; delete jogoAtivo[jid]; return;}
  const idP=p.p||p.palavra||p.c||p.i; loop.usadas=[...(loop.usadas||[]),idP]; loop.rodada=(loop.rodada||0)+1;
  const R=`Rodada *${loop.rodada}*`; const S=`\n🛑 *${CONFIG.PREFIXO}stop*`;
  if(tipo==="quiz"){jogoAtivo[jid]={tipo:"quiz",r:p.r}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="quiz"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nResposta: *${p.r.toUpperCase()}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}},25000); await sock.sendMessage(jid,{text:`🎮 *QUIZ* — ${R}\n✦ ─────────── ✦\n❓ *${p.p}*\n\n⏰ 25s | 🏆 +50 XP${S}`},{quoted:seloBot});}
  if(tipo==="vof"){jogoAtivo[jid]={tipo:"vof",r:p.r}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="vof"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nResposta: *${p.r.toUpperCase()}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}},20000); await sock.sendMessage(jid,{text:`✅❌ *V/F* — ${R}\n✦ ─────────── ✦\n❓ *${p.p}*\nverdadeiro / falso\n\n⏰ 20s${S}`},{quoted:seloBot});}
  if(tipo==="completar"){jogoAtivo[jid]={tipo:"completar",r:p.c}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="completar"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nResposta: *${p.c.toUpperCase()}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}},25000); await sock.sendMessage(jid,{text:`🔤 *COMPLETA* — ${R}\n✦ ─────────── ✦\n❓ *${p.i}*\n💡 ${p.d}\n\n⏰ 25s${S}`},{quoted:seloBot});}
  if(tipo==="caca"){jogoAtivo[jid]={tipo:"caca",r:p.palavra.toLowerCase()}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="caca"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nPalavra: *${p.palavra}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),5000);}},45000); await sock.sendMessage(jid,{text:`🔍 *CAÇA-PALAVRAS* — ${R}\n\`\`\`\n${gerarGrade(p.palavra)}\n\`\`\`\n💡 ${p.dica}\n\n⏰ 45s${S}`},{quoted:seloBot});}
  if(tipo==="guerra"){jogoAtivo[jid]={tipo:"guerra",palavra:p.palavra,dica:p.dica,letrasAcertadas:[],letrasErradas:[],maxErros:6}; loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="guerra"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⏰ Tempo!\nPalavra: *${p.palavra}*`},{quoted:seloBot}); delete jogoAtivo[jid]; setTimeout(()=>proximaPergunta(sock,jid,seloBot),5000);}},90000); await sock.sendMessage(jid,{text:`⚔️ *FORCA* — ${R}\n✦ ─────────── ✦\n🔤 ${p.palavra.split("").map(()=>"_").join(" ")}\n💡 ${p.dica}\n❤️❤️❤️❤️❤️❤️\n\n⏰ 90s${S}`},{quoted:seloBot});}
}

async function varreduraGrupos(sock){try{console.log("🔍 Scan grupos..."); await new Promise(r=>setTimeout(r,4000)); const grupos=await sock.groupFetchAllParticipating(); let activados=0; for(const[gJid,meta] of Object.entries(grupos)){try{const participantes=(meta.participants||[]).map(p=>extrairJid(p.id||p)); const donoNoGrupo=participantes.find(p=>ehDono(p)); if(donoNoGrupo){gruposAtivados.add(gJid); activados++; await new Promise(r=>setTimeout(r,300));}}catch{}} console.log(`✅ Scan: ${activados} grupo(s).`);}catch(e){console.log("❌ Scan:",e.message);}}
async function verificarInativos(sock){try{const ativos=fs.readJsonSync(ARQUIVO_ATIVOS),agora=Date.now(),LIMITE=30*24*60*60*1000; for(const gJid of Object.keys(ativos)){try{const meta=await sock.groupMetadata(gJid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); for(const m of meta.participants){const mId=extrairJid(m.id||m); if(admins.includes(mId)||ehDono(mId)) continue; const ultima=ativos[gJid]?.[mId]; if(!ultima||(agora-ultima)>LIMITE){try{await sock.groupParticipantsUpdate(gJid,[mId],"remove"); await sock.sendMessage(gJid,{text:`🚨 @${mId.split("@")[0]} removido por *inatividade*!`,mentions:[mId]});}catch{}}}}catch{}}}catch{}}
async function encontrarGrupoPorArg(sock,ativos,args){const idx=parseInt(args[0]); if(!isNaN(idx)&&idx>=1&&idx<=ativos.length) return{grupoJid:ativos[idx-1],mensagem:args.slice(1).join(" ")}; try{const grupos=await sock.groupFetchAllParticipating(); for(let len=args.length;len>=1;len--){const nomeTentativa=args.slice(0,len).join(" ").toLowerCase(); const encontrado=ativos.find(gJid=>(grupos[gJid]?.subject||"").toLowerCase().includes(nomeTentativa)); if(encontrado&&len<args.length) return{grupoJid:encontrado,mensagem:args.slice(len).join(" ")};}}catch{} return{grupoJid:null,mensagem:""};}

// Reconhecimento de música (para !busca)
async function executarReconhecimentoMusica(sock,jid,msg,sender,seloBot){
  const audioData=await downloadAudioDaMensagem(msg);
  if(!audioData){await sock.sendMessage(jid,{text:`↩️ Responde nota de voz com *${CONFIG.PREFIXO}busca* para reconhecer a música`},{quoted:seloBot}); return;}
  await reagir(sock,msg,"🎵"); await sock.sendMessage(jid,{text:`🎵 A reconhecer...\n⏳`},{quoted:seloBot});
  try{const resultado=await reconhecerMusica(audioData.buffer); if(resultado.status==="success"&&resultado.result){const r=resultado.result; const spotify=r.spotify?.external_urls?.spotify||""; const coverUrl=r.spotify?.album?.images?.[0]?.url||null; const textoMusica=`🎵 *MÚSICA IDENTIFICADA!*\n│\n🎵 *${r.title}*\n👤 ${r.artist}\n💿 ${r.album||"N/A"}${spotify?`\n🟢 ${spotify}`:""}`;if(coverUrl) await sock.sendMessage(jid,{image:{url:coverUrl},caption:textoMusica},{quoted:seloBot}); else await sock.sendMessage(jid,{text:textoMusica},{quoted:seloBot}); await reagir(sock,msg,"🎵"); addXP(sender,5);}else{await reagir(sock,msg,"❌"); await sock.sendMessage(jid,{text:`❌ Não reconheci. Tenta áudio mais claro.`},{quoted:seloBot});}}catch(e){await reagir(sock,msg,"❌"); await sock.sendMessage(jid,{text:`❌ Erro: ${e.message}`},{quoted:seloBot});}
}

async function enviarGif(sock,jid,caption="",quotedMsg=null){const tempOut=path.join("./downloads",`gif_${Date.now()}.mp4`); try{await runCmd(`${YTDLP_CMD} --no-check-certificate --no-playlist --no-warnings --force-ipv4 --geo-bypass --match-filter "duration < 60" --extractor-args "youtube:player_client=android,ios" -f "best[height<=480][ext=mp4]/best[height<=480]/worst" --max-filesize 8M -o "${tempOut}" "ytsearch1:solo leveling sung jin woo rise scene"`); if(fs.existsSync(tempOut)&&fs.statSync(tempOut).size>5000){const buf=fs.readFileSync(tempOut); try{fs.removeSync(tempOut);}catch{} await sock.sendMessage(jid,{video:buf,gifPlayback:true,caption,mimetype:"video/mp4"},quotedMsg?{quoted:quotedMsg}:{}); return true;}}catch(e){console.log(`❌ GIF: ${e.message.slice(0,60)}`);} finally{try{if(fs.existsSync(tempOut)) fs.removeSync(tempOut);}catch{}} return false;}

// ═══════════════════════════════════════════════════════
// ✅ TODOS OS COMANDOS
// ═══════════════════════════════════════════════════════
const TODOS_COMANDOS=new Set([
  "menu","ajuda","sobre","setfoto","alugar","addai","pp","assistente","isaias-on","isaias-off","isaias-reset",
  "play","mp3","mp4","mp4hd","mostre","foto","doc","qr","tourl","ytsearch",
  "tiktok","ttsearch","tttrend","ttuser","instagram","twitter","facebook","kwai",
  "spotify","soundcloud","mediafire","apk","pinterest","pinvideo",
  "sticker","sf","brat","figurinha","figu",
  "piada","conselho","historia","poema","perfil","denunciar","cara","ship","fofoca",
  "quiz","completar","vof","caca","guerra","stop","rank","toprank",
  "matematica","jokenpo","dado","cara-coroa","adivinhar","velocidade","roleta","aki","aposta",
  "shazam","busca",
  "moedas","diario","dar","roubar","topcoins",
  "vz","transcrever","audiotexto","resumiraudio","traduziraudio","audioparaia",
  "ia","resumir","traduzir","fotocopia","fotoparaia","resumirfoto","traduzirfoto","editar",
  "meme","logo","card","calc","encurtar","cotacao","tempo","horario","ping","stats","regras","info","dono","donos","id","ver","apagadas","placar","scanlink","criador",
  "piada18","truth","dare","crush","seduzir","beijo","abraco","tapa","flirt","casal",
  "banir","add","addadmin","removeadmin","fechar","abrir","silenciar","dessilenciar","silenciados",
  "all","att","aviso","link","sorteio","nomegrupo","descgrupo","fotogrupo","apagar",
  "bloq","desbloq","bot","anti-link","vozbot","verifica","addvip","removevip","vips",
  "ergue-se","set","out","prefixo","prefixos","chaton","sms","gsms",
]);

// ═══════════════════════════════════════════════════════
// ✅ START BOT
// ═══════════════════════════════════════════════════════
let tentativasReconexao=0;

async function startBot(){
  // ✅ Executa auto-setup antes de conectar
  await autoSetup();

  try{
    const{version}=await fetchLatestBaileysVersion();
    const{state,saveCreds}=await useMultiFileAuthState("./sessao");
    const sock=makeWASocket({version,auth:state,printQRInTerminal:false,getMessage:async()=>({conversation:""}),generateHighQualityLinkPreview:false,fetchAgent:httpsAgent,logger:silentLogger,connectTimeoutMs:60000,keepAliveIntervalMs:10000,retryRequestDelayMs:2000,maxMsgRetryCount:3,defaultQueryTimeoutMs:180000});
    sock.ev.on("creds.update",saveCreds);
    setInterval(()=>verificarInativos(sock),24*60*60*1000);

    if(!sock.authState.creds.registered){
      const phoneNumber=CONFIG.NUMERO_BOT.replace(/\D/g,"");
      console.log("⏳ A aguardar ligação...");
      await new Promise(r=>setTimeout(r,8000));
      if(!sock.authState.creds.registered){
        try{const code=await sock.requestPairingCode(phoneNumber); const codeFmt=code?.match(/.{1,4}/g)?.join("-")||code; console.log(`\n╔══════════════════════════════════╗\n║  🔑 CÓDIGO: ${codeFmt}  ║\n║  📞 +${phoneNumber}  ║\n╚══════════════════════════════════╝\n`);}
        catch(e){console.error("❌ Erro código:",e.message); process.exit(1);}
      }
    }

    sock.ev.on("connection.update",async({connection,lastDisconnect})=>{
      if(connection==="close"){const codigo=lastDisconnect?.error?.output?.statusCode,motivo=lastDisconnect?.error?.message||"desconhecido"; console.log(`\n❌ Desconectado | ${codigo} | ${motivo}`); if(codigo===DisconnectReason.loggedOut||codigo===401){if(motivo.includes("conflict")){setTimeout(()=>startBot(),15000); return;} process.exit(0);} tentativasReconexao++; setTimeout(()=>startBot(),Math.min(5000*tentativasReconexao,60000));}
      if(connection==="open"){tentativasReconexao=0; console.log(`\n✅ Bot conectado! +${CONFIG.NUMERO_BOT}\n🌐 Modo: ${CONFIG.IS_SERVER?"☁️ Servidor":"📱 Local"}`); try{ppBotUrl=await sock.profilePictureUrl(sock.user.id,"image");}catch{ppBotUrl=null;} setTimeout(()=>varreduraGrupos(sock),5000);}
    });

    sock.ev.on("group-participants.update",async(update)=>{
      try{const{id,participants,action}=update; if(!participants||!Array.isArray(participants)) return;
        if(action==="add"){for(const participante of participants){const p=extrairJid(participante); if(!p||!p.includes("@")) continue; try{const meta=await sock.groupMetadata(id); const admins=meta.participants.filter(m=>m.admin).map(m=>extrairJid(m.id||m)); const mentions=[p,...admins]; let ppUser=null; try{ppUser=await sock.profilePictureUrl(p,"image");}catch{} const listaAdm=admins.length>0?admins.map(a=>`👮 @${a.split("@")[0]}`).join("\n│ "):"_(sem admins)_"; const texto=`🎉 *BEM-VINDO!* 🎉\n\n👋 Olá @${p.split("@")[0]}!\nBem-vindo(a) ao *${meta.subject}*! 🤗\n\n╭─── 📋 *REGRAS* ───╮\n│ ❌ Sem links | ❌ Sem spam\n│ ✅ Respeita todos\n╰───────────────────╯\n\n╭─── 👑 *ADMINS* ───╮\n│ ${listaAdm}\n╰───────────────────╯\n\n🤖 Usa *${CONFIG.PREFIXO}menu* !\n💬 Ou fala: _"Isaías, ..."_`; if(ppUser) await sock.sendMessage(id,{image:{url:ppUser},caption:texto,mentions}); else await sock.sendMessage(id,{text:texto,mentions});}catch(e){console.log("❌ Boas-vindas:",e.message);}}}
        if(action==="remove"){for(const participante of participants){const p=extrairJid(participante); if(!p||!p.includes("@")) continue; try{await sock.sendMessage(id,{text:`👋 @${p.split("@")[0]} BAZAAA... 😂💨`,mentions:[p]});}catch{}}}
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
        if(!cacheMsg[jid]) cacheMsg[jid]={}; cacheMsg[jid][msg.key.id]={sender,texto:texto||"",tipo:getTipoMsg(msg),timestamp:Date.now()}; const cK=Object.keys(cacheMsg[jid]); if(cK.length>MAX_CACHE_MSG) delete cacheMsg[jid][cK[0]];
        if(msg.message?.protocolMessage?.type===0){const kD=msg.message.protocolMessage.key,mDI=kD?.id,jD=kD?.remoteJid||jid; const mC=cacheMsg[jD]?.[mDI]||cacheMsg[jid]?.[mDI]; if(mC&&(mC.texto||mC.tipo)){if(!msgApagadas[jid]) msgApagadas[jid]=[]; msgApagadas[jid].push({...mC,apagadoEm:Date.now()}); if(msgApagadas[jid].length>30) msgApagadas[jid].shift();} return;}

        // View-once cache
        {const m=msg.message; const voMsg=m?.viewOnceMessage?.message||m?.viewOnceMessageV2?.message||m?.viewOnceMessageV2Extension?.message; if(voMsg){(async()=>{try{const buf=await downloadMediaMessage(msg,"buffer",{}); const tipo=voMsg.videoMessage?"video":(voMsg.audioMessage||voMsg.pttMessage)?"audio":"imagem"; if(!cacheViewOnce[jid]) cacheViewOnce[jid]={}; cacheViewOnce[jid][msg.key.id]={tipo,buf,sender,timestamp:Date.now()}; setTimeout(()=>{if(cacheViewOnce[jid]?.[msg.key.id]) delete cacheViewOnce[jid][msg.key.id];},60*60*1000);}catch{}})();}}

        if(isGrupo){if(!historyMsgs[jid]) historyMsgs[jid]=[]; historyMsgs[jid].push({key:msg.key,sender,texto:texto||"",timestamp:Date.now()}); if(historyMsgs[jid].length>MAX_HISTORY) historyMsgs[jid].shift(); addXP(sender,2); registarAtividade(sender,jid); salvarNoBuffer(jid,{sender,texto,mencoes,timestamp:Date.now()});}

        // ✅ HANDLER: Botões do !play (PRIORIDADE MÁXIMA)
        if(msg.message?.buttonsResponseMessage||msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage||msg.message?.templateButtonReplyMessage){
          const btnId=extrairBotaoClicado(msg);
          if(btnId&&btnId.startsWith("play_")){const tratou=await processarBotaoPlay(sock,msg); if(tratou) return;}
          if(btnId&&btnId.startsWith("cat_")){await enviarSubmenu(sock,jid,msg,btnId,seloBot,sender,isDono); return;}
        }

        // Handlers de menu
        const listResp=msg.message?.listResponseMessage;
        if(listResp){const catId=listResp.singleSelectReply?.selectedRowId; if(catId&&catId.startsWith("cat_")){if(isGrupo&&!isDono&&!gruposAtivados.has(jid)) return; if(chatsDesativados.has(jid)&&!isDono) return; let isAdmin=isDono; if(isGrupo&&!isDono){try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); isAdmin=admins.includes(sender);}catch{}} if(!isDono&&!senhasAprovadas.has(sender)){if(isGrupo&&isAdmin){senhasAprovadas.add(sender);}else return;} await enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono); return;}}

        const interResp=msg.message?.interactiveResponseMessage;
        if(interResp){let catId=null; try{const nf=interResp.nativeFlowResponseMessage; if(nf?.paramsJson){const params=JSON.parse(nf.paramsJson); catId=params.id||params.selectedId||params.rowId||null;}}catch{} if(!catId) catId=interResp.body||null; if(catId){if(catId.startsWith("play_")){const tratou=await processarBotaoPlay(sock,msg); if(tratou) return;} if(catId.startsWith("cat_")){if(isGrupo&&!isDono&&!gruposAtivados.has(jid)) return; if(chatsDesativados.has(jid)&&!isDono) return; await enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono); return;}}}

        // !ergue-se
        if(isDono&&isGrupo&&texto===`${CONFIG.PREFIXO}ergue-se`){gruposAtivados.add(jid); assistenteAtivo.add(jid); const caption=`✅ *ERGUE-TE!* 🤴🏽\n\nAs tuas Ordens! ✨️👑\n🔒 Anti-link: *ACTIVO*\n🤖 Isaías IA: *ACTIVO*\n🌐 Modo: *${CONFIG.IS_SERVER?"☁️ Servidor":"📱 Local"}*\n\n_Usa *${CONFIG.PREFIXO}menu*!_`; await reagir(sock,msg,"✅"); const gifOk=await enviarGif(sock,jid,caption); if(!gifOk) await enviarComSelo(sock,jid,caption,seloBot); return;}

        if(isGrupo&&!isDono&&!gruposAtivados.has(jid)) return;
        if(chatsDesativados.has(jid)&&!isDono) return;

        let isAdmin=isDono;
        if(isGrupo&&!isDono){try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); isAdmin=admins.includes(sender);}catch{}}

        if(isGrupo&&!isAdmin&&(membrosSilenciados[jid]||[]).includes(sender)){try{await sock.sendMessage(jid,{delete:msg.key});}catch{}; return;}
        if(isGrupo&&!isAdmin&&ehMencaoStatus(msg,texto)){banirComContagem(sock,jid,sender,msg.key,"Menção de status ⛔"); return;}
        if(isGrupo&&!isAdmin&&!antiLinkDesativado.has(jid)&&LINK_RX.test(texto)){banirComContagem(sock,jid,sender,msg.key,"Link proibido 🔗❌"); return;}
        if(isGrupo&&!isAdmin&&mencoes.length>5){banirComContagem(sock,jid,sender,msg.key,"Spam de menções 📢❌"); return;}

        // ✅ GATE !pp [código] — antes do assistente
        if(texto.startsWith(CONFIG.PREFIXO)){
          const args2=texto.slice(CONFIG.PREFIXO.length).trim().split(/\s+/);
          const cmd2=args2[0]?.toLowerCase();
          if(cmd2==="pp"){
            const codigoFornecido=args2.slice(1).join(" ").trim();
            if(!codigoFornecido){await sock.sendMessage(jid,{text:`🔑 *Uso:* *${CONFIG.PREFIXO}pp [código]*\n_O código é dado pelo dono do bot._`},{quoted:seloBot}); return;}
            if(codigoFornecido===CONFIG.SENHA_BOT){senhasAprovadas.add(sender); await sock.sendMessage(jid,{text:`✅ *Acesso liberado!* 🎉\n\nBem-vindo(a)! Usa *${CONFIG.PREFIXO}menu* ou fala: _"Isaías, ..."_ 🤖`},{quoted:seloBot}); await reagir(sock,msg,"✅");}
            else{await sock.sendMessage(jid,{text:`❌ *Código errado!*\n_Contacta ${CONFIG.DONO_NUM} para o código._`},{quoted:seloBot}); await reagir(sock,msg,"❌");}
            return;
          }
        }

        // ✅ ASSISTENTE IA — antes do prefixo
        if(texto&&!texto.startsWith(CONFIG.PREFIXO)){
          if(!isDono&&!senhasAprovadas.has(sender)){
            if(texto.trim()===CONFIG.SENHA_BOT){senhasAprovadas.add(sender); await sock.sendMessage(jid,{text:`✅ *Acesso liberado!* 🎉\nUsa *${CONFIG.PREFIXO}menu* ou fala: _"Isaías, ..."_ 🤖`},{quoted:seloBot}); return;}
            if(detectarChamadaAssistente(texto)){
              if(isGrupo&&isAdmin){senhasAprovadas.add(sender);}
              else{await sock.sendMessage(jid,{text:`🔒 Precisas de acesso! Usa *${CONFIG.PREFIXO}pp [código]* para entrar.\n_Contacta ${CONFIG.DONO_NUM} para o código._`},{quoted:seloBot}); return;}
            }else return;
          }
          const foiAssistente=await executarAssistente(sock,jid,msg,sender,seloBot,texto,isDono,isAdmin);
          if(foiAssistente) return;
          if(/^[0-9]$/.test(texto.trim())){const chaveMenu=`${jid}_${sender}`; const estadoMenu=menuEsperandoResposta.get(chaveMenu); if(estadoMenu&&(Date.now()-estadoMenu.timestamp)<120000){const catId=MENU_NUMEROS[texto.trim()]; if(catId){if(catId==="cat_dono"&&!estadoMenu.isDono){await sock.sendMessage(jid,{text:`🔒 Apenas o dono.`},{quoted:seloBot}); return;} menuEsperandoResposta.delete(chaveMenu); await enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono); return;}}}
          return;
        }

        // Prefixo sozinho
        if(texto.trim()===CONFIG.PREFIXO){await reagir(sock,msg,"🌀"); await sock.sendMessage(jid,{text:`🌀 Prefixo: *${CONFIG.PREFIXO}*\nUsa *${CONFIG.PREFIXO}menu* ou *${CONFIG.PREFIXO}pp [código]* para entrar. 🤖`},{quoted:seloBot}); return;}

        // Gate de senha com prefixo
        if(!isDono&&!senhasAprovadas.has(sender)){
          if(isGrupo&&isAdmin){senhasAprovadas.add(sender);}
          else{const chave=`pw_${sender}_${jid}`; if(!pedidoSenha.has(chave)){pedidoSenha.add(chave); setTimeout(()=>pedidoSenha.delete(chave),60000); await sock.sendMessage(jid,{text:`🔒 *Acesso restrito!*\n│\nUsa *${CONFIG.PREFIXO}pp [código]* para entrar.\n_Contacta ${CONFIG.DONO_NUM} para o código._`},{quoted:seloBot});} return;}
        }

        if(!isDono&&!verificarRateLimit(sender)){await reagir(sock,msg,"⏳"); return;}
        const args=texto.slice(CONFIG.PREFIXO.length).trim().split(/\s+/);
        const comando=args.shift().toLowerCase();

        await reagir(sock,msg,"⏳");
        salvarStats(comando,sender);

        // Jogos
        if(isGrupo&&jogoAtivo[jid]){
          const jogo=jogoAtivo[jid],resp=texto.toLowerCase().trim(),loop=jogoLoop[jid];
          const acertou=async(xp)=>{addXP(sender,xp); addCoins(sender,xp/2|0); await reagir(sock,msg,"🎉"); await sock.sendMessage(jid,{text:`🎉 *CORRETO!*\n✅ @${sender.split("@")[0]} acertou!\n🏆 +${xp} XP | +${xp/2|0} 💰${loop?.activo?"\n⏳ Próxima em 3s...":""}`},{quoted:seloBot}); if(loop?.timeoutHandle) clearTimeout(loop.timeoutHandle); delete jogoAtivo[jid]; if(loop?.activo) setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);};
          if(jogo.tipo==="quiz"&&resp===jogo.r){await acertou(50); return;}
          if(jogo.tipo==="completar"&&resp===jogo.r){await acertou(40); return;}
          if(jogo.tipo==="caca"&&resp===jogo.r){await acertou(60); return;}
          if(jogo.tipo==="matematica"&&resp===jogo.r){await acertou(30); return;}
          if(jogo.tipo==="vof"){const ru=resp==="v"?"verdadeiro":resp==="f"?"falso":resp; if(ru==="verdadeiro"||ru==="falso"){if(ru===jogo.r){await acertou(30);}else{await reagir(sock,msg,"❌"); await sock.sendMessage(jid,{text:`❌ *ERRADO!*\nResposta: *${jogo.r.toUpperCase()}*`},{quoted:seloBot}); if(loop?.timeoutHandle) clearTimeout(loop.timeoutHandle); delete jogoAtivo[jid]; if(loop?.activo) setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);} return;}}
          if(jogo.tipo==="guerra"){const lP=texto.toUpperCase().trim().replace(/[^A-Z]/g,""); if(!lP) return; if(lP===jogo.palavra){await acertou(80); return;} if(lP.length===1){if(jogo.letrasAcertadas.includes(lP)||jogo.letrasErradas.includes(lP)){await sock.sendMessage(jid,{text:`⚠️ *${lP}* já foi usada!\n\n${mostrarGuerraEstado(jogo)}`},{quoted:seloBot}); return;} if(jogo.palavra.includes(lP)){jogo.letrasAcertadas.push(lP); const pM=jogo.palavra.split("").map(l=>jogo.letrasAcertadas.includes(l)?l:"_").join(" "); if(!pM.includes("_")){await acertou(80); return;} await sock.sendMessage(jid,{text:`✅ *${lP}* está!\n\n${mostrarGuerraEstado(jogo)}`},{quoted:seloBot});}else{jogo.letrasErradas.push(lP); if(jogo.letrasErradas.length>=jogo.maxErros){await sock.sendMessage(jid,{text:`💀 *FIM!*\nPalavra: *${jogo.palavra}*${loop?.activo?"\n⏳ Próxima em 5s...":""}`},{quoted:seloBot}); if(loop?.timeoutHandle) clearTimeout(loop.timeoutHandle); delete jogoAtivo[jid]; if(loop?.activo) setTimeout(()=>proximaPergunta(sock,jid,seloBot),5000);}else{await sock.sendMessage(jid,{text:`❌ *${lP}* NÃO está!\n\n${mostrarGuerraEstado(jogo)}`},{quoted:seloBot});}} return;}}
        }

        if(jogoAdivinhar[jid]){const num=parseInt(texto.trim()); if(!isNaN(num)){const jogo=jogoAdivinhar[jid]; jogo.tentativas++; if(num===jogo.numero){const xp=Math.max(10,50-jogo.tentativas*5); addXP(sender,xp); addCoins(sender,xp/2|0); await sock.sendMessage(jid,{text:`🎉 Era o *${jogo.numero}*!\n🎲 Tentativas: *${jogo.tentativas}*\n🏆 +${xp} XP`,mentions:[sender]},{quoted:seloBot}); delete jogoAdivinhar[jid]; return;}else{const dica=num<jogo.numero?"📈 Mais alto!":"📉 Mais baixo!"; let editText=`🎯 *ADIVINHAR*\n\n${dica}\n🎲 Tentativas: *${jogo.tentativas}*${jogo.tentativas>=18?`\n⚠️ ${20-jogo.tentativas} restantes.`:""}`; if(jogo.tentativas>=20){await sock.sendMessage(jid,{text:`💀 *FIM!* Era o *${jogo.numero}*!`},{quoted:seloBot}); delete jogoAdivinhar[jid]; return;} try{if(jogo.msgKey) await sock.sendMessage(jid,{text:editText,edit:jogo.msgKey});}catch{await sock.sendMessage(jid,{text:editText},{quoted:seloBot});} return;}}}
        if(jogoVelocidade[jid]){const jogo=jogoVelocidade[jid]; if(texto.toLowerCase().trim()===jogo.palavra){const tempo=((Date.now()-jogo.inicio)/1000).toFixed(1); const xp=tempo<5?100:tempo<10?70:tempo<20?50:30; addXP(sender,xp); addCoins(sender,xp/2|0); await sock.sendMessage(jid,{text:`⚡ *INCRÍVEL!* @${sender.split("@")[0]}\n✅ ${tempo}s!\n🏆 +${xp} XP`,mentions:[sender]},{quoted:seloBot}); delete jogoVelocidade[jid]; return;}}

        // Wake word áudio
        const audioMsgDireto=msg.message?.audioMessage||msg.message?.pttMessage;
        if(audioMsgDireto&&!vozBotDesativado.has(jid)){
          const voiceLimitKey=`voice_${sender}`,agoraV=Date.now();
          if(!userRateLimit[voiceLimitKey]||(agoraV-userRateLimit[voiceLimitKey])>3000){
            userRateLimit[voiceLimitKey]=agoraV;
            (async()=>{try{const audioData=await downloadAudioDaMensagem(msg); if(!audioData) return; const transcricao=await transcreverComGroq(audioData.buffer); const pergunta=detectarWakeWord(transcricao); if(pergunta===null) return; await reagir(sock,msg,"🎙️"); if(!pergunta){await sock.sendMessage(jid,{text:`👋 Diz *Isaías* seguido da pergunta!`},{quoted:seloBot}); return;} await sock.sendMessage(jid,{text:`🎙️ _"${pergunta}"_`},{quoted:seloBot}); const resposta=await chatIA(pergunta); try{const audioPath=await textoParaFala(resposta); await enviarAudio(sock,jid,audioPath,seloBot); try{fs.removeSync(audioPath);}catch{}}catch{await sock.sendMessage(jid,{text:`🤖 *ISAÍAS:*\n\n${resposta}`},{quoted:seloBot});} addXP(sender,5);}catch(e){console.log("❌ Wake word:",e.message);}})();
          }
          return;
        }

        if(comandosBloqueados.has(jid)&&!isAdmin&&!["bloq","desbloq","pp"].includes(comando)){await sock.sendMessage(jid,{text:`🔒 *Comandos bloqueados!*`},{quoted:seloBot}); await reagir(sock,msg,"🔒"); return;}
        if(!TODOS_COMANDOS.has(comando)){const chave=`${jid}_${sender}`,erros=(errosComando[chave]||0)+1; errosComando[chave]=erros; setTimeout(()=>{delete errosComando[chave];},5*60*1000); let ppErrou=null; try{ppErrou=await sock.profilePictureUrl(sender,"image");}catch{} const textoErro=`@${sender.split("@")[0]} Comando errado! 😑\nEscreve *${CONFIG.PREFIXO}menu* ⏳️\n\nOu fala: _"Isaías, ..."_ 🤖`; if(ppErrou) await sock.sendMessage(jid,{image:{url:ppErrou},caption:textoErro,mentions:[sender]},{quoted:seloBot}); else await sock.sendMessage(jid,{text:textoErro,mentions:[sender]},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}

        const CMDS_ADMIN=["banir","addadmin","removeadmin","fechar","abrir","all","att","anti-link","bot","link","sorteio","verifica","silenciar","dessilenciar","silenciados","add","aviso","apagar","vozbot","bloq","desbloq","nomegrupo","descgrupo","fotogrupo","scanlink","addai","addvip","removevip","vips"];
        if(CMDS_ADMIN.includes(comando)&&!isAdmin){await sock.sendMessage(jid,{text:`🔒 *Apenas administradores.*`},{quoted:seloBot}); await reagir(sock,msg,"🚫"); return;}
        const CMDS_DONO=["out","prefixo","prefixos","set","chaton","sms","gsms","setfoto"];
        if(CMDS_DONO.includes(comando)&&!isDono){await sock.sendMessage(jid,{text:`🔒 *Apenas o dono.*`},{quoted:seloBot}); await reagir(sock,msg,"🚫"); return;}
        const CMDS_18=["piada18","truth","dare","crush","seduzir","beijo","abraco","tapa","flirt","casal"];
        if(CMDS_18.includes(comando)&&!isDono&&!isVip(sender)){await sock.sendMessage(jid,{text:`🔞 *Exclusivo para VIPs!*\nUsa *${CONFIG.PREFIXO}alugar* 💎`},{quoted:seloBot}); await reagir(sock,msg,"🔞"); return;}

        // ══════════════════════════════════════════
        //              ✅ COMANDOS
        // ══════════════════════════════════════════

        // ─── PALAVRA-PASSE ───
        if(comando==="pp"){const codigoFornecido=args.join(" ").trim(); if(!codigoFornecido){await sock.sendMessage(jid,{text:`🔑 *Uso:* *${CONFIG.PREFIXO}pp [código]*`},{quoted:seloBot}); return;} if(codigoFornecido===CONFIG.SENHA_BOT){senhasAprovadas.add(sender); await sock.sendMessage(jid,{text:`✅ *Acesso liberado!* 🎉\n\nBem-vindo(a)! Usa *${CONFIG.PREFIXO}menu* ou fala: _"Isaías, ..."_ 🤖`},{quoted:seloBot}); await reagir(sock,msg,"✅");}else{await sock.sendMessage(jid,{text:`❌ *Código errado!*\n_Contacta ${CONFIG.DONO_NUM}._`},{quoted:seloBot}); await reagir(sock,msg,"❌");} return;}

        // ─── ASSISTENTE ───
        if(comando==="assistente"||comando==="isaias-on"||comando==="isaias"){assistenteAtivo.add(jid); clearTimeout(assistenteAtivo._timers[jid]); assistenteAtivo._timers[jid]=setTimeout(()=>{assistenteAtivo.delete(jid); delete assistenteHistoria[jid];},30*60*1000); await sock.sendMessage(jid,{text:`🤖 *Assistente Isaías ACTIVADO!*\n│\n_"Isaías, baixa música do Calema"_\n_"que tempo em Luanda?"_\n_"faz uma piada"_\n│\n*!isaias-off* para desactivar.`},{quoted:seloBot}); await reagir(sock,msg,"🤖"); return;}
        if(comando==="isaias-off"){assistenteAtivo.delete(jid); delete assistenteHistoria[jid]; clearTimeout(assistenteAtivo._timers[jid]); await sock.sendMessage(jid,{text:`🔴 *Assistente Isaías DESACTIVADO!*`},{quoted:seloBot}); await reagir(sock,msg,"🔴"); return;}
        if(comando==="isaias-reset"){delete assistenteHistoria[jid]; await sock.sendMessage(jid,{text:`🔄 *Conversa reiniciada!*`},{quoted:seloBot}); await reagir(sock,msg,"🔄"); return;}

        // ─── INFO/MENU ───
        if(comando==="setfoto"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}setfoto* ↩️ responde imagem`},{quoted:seloBot}); return;} botFotoBuffer=imgBuf; fs.writeFileSync(BOT_FOTO_PATH,imgBuf); await sock.sendMessage(jid,{image:imgBuf,caption:`✅ *Foto actualizada!*`},{quoted:seloBot}); await reagir(sock,msg,"✅"); return;}
        if(comando==="alugar"){await sock.sendMessage(jid,{text:gerarTextoAlugar()},{quoted:seloBot}); await reagir(sock,msg,"💰"); return;}
        if(comando==="addai"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} try{await sock.groupParticipantsUpdate(jid,["867051314767696@bot"],"add"); await sock.sendMessage(jid,{text:`✅ Meta AI adicionada!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="menu"||comando==="ajuda"){const sub=args[0]?.toLowerCase(); const catMap={principal:"cat_principal",downloads:"cat_downloads",figurinhas:"cat_figurinhas",brincadeiras:"cat_brincadeiras",coins:"cat_coins",alteradores:"cat_alteradores",logos:"cat_logos","18":"cat_18",adm:"cat_adm",dono:"cat_dono",assistente:"cat_assistente"}; if(sub&&catMap[sub]){await enviarSubmenu(sock,jid,msg,catMap[sub],seloBot,sender,isDono);}else{await enviarMenuPrincipal(sock,jid,msg,isDono,sender,isAdmin,seloBot);} return;}
        if(comando==="sobre"){await enviarComSelo(sock,jid,`┌─⊱ 『 🤖 SOBRE 』 ⊰─┐\n│\n◎ ─ *${CONFIG.NOME_BOT}*\n◎ ─ 👑 *ISAÍAS PEDRO*\n◎ ─ 📦 @itsliaaa/baileys\n◎ ─ 🌐 Modo: *${CONFIG.IS_SERVER?"☁️ Servidor":"📱 Local"}*\n◎ ─ ✅ Isaías IA sem prefixo\n◎ ─ ✅ !pp [código] para acesso\n◎ ─ ✅ Multi-proxy downloads\n◎ ─ ✅ Sistema VIP 💎\n│\n└──────────────────────────────⊰\n_© ${CONFIG.NOME_BOT} — 24/7_ 🟢`,seloBot); return;}
        if(comando==="set"){const novaSenha=args.join(" ").replace(/['"]/g,"").trim(); if(!novaSenha){await sock.sendMessage(jid,{text:`🔑 *${CONFIG.PREFIXO}set [nova_senha]*`},{quoted:seloBot}); return;} CONFIG.SENHA_BOT=novaSenha; senhasAprovadas.clear(); await sock.sendMessage(jid,{text:`✅ Senha: *${novaSenha}*\n_Todos precisam de usar !pp novamente._`},{quoted:seloBot}); await reagir(sock,msg,"🔑"); return;}
        if(comando==="id"){await sock.sendMessage(jid,{text:`📱 *JID:* _${sender}_\n👑 Dono: ${isDono?"✅":"❌"} | 👮 Admin: ${isAdmin?"✅":"❌"} | 💎 VIP: ${isVip(sender)?"✅":"❌"}\n🔑 Acesso: ${senhasAprovadas.has(sender)||isDono?"✅":"❌"}\n🤖 IA: ${assistenteAtivo.has(jid)?"✅ ACTIVO":"❌"}\n🌐 Modo: ${CONFIG.IS_SERVER?"☁️ Servidor":"📱 Local"}`},{quoted:seloBot}); return;}
        if(comando==="out"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} try{await sock.sendMessage(jid,{text:`👋 *Bot a sair...*`},{quoted:seloBot}); await new Promise(r=>setTimeout(r,1000)); await sock.groupLeave(jid);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});}; return;}
        if(comando==="prefixo"||comando==="prefixos"){if(!args[0]){await sock.sendMessage(jid,{text:`⚙️ Prefixo: *${CONFIG.PREFIXO}*`},{quoted:seloBot}); return;} const antigoP=CONFIG.PREFIXO; CONFIG.PREFIXO=args[0].trim().charAt(0); await sock.sendMessage(jid,{text:`✅ Prefixo: *${antigoP}* → *${CONFIG.PREFIXO}*`},{quoted:seloBot}); return;}
        if(comando==="ping"){const ini=Date.now(); await sock.sendMessage(jid,{text:"⏳"}); await sock.sendMessage(jid,{text:`🏓 *PONG!*\n📶 *${Date.now()-ini}ms* | ⏱️ ${Math.floor(process.uptime()/60)} min | 💾 ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB\n🌐 Modo: *${CONFIG.IS_SERVER?"☁️ Servidor":"📱 Local"}*`},{quoted:seloBot}); return;}
        if(comando==="stats"){const s=fs.readJsonSync(ARQUIVO_STATS); const top=Object.entries(s.comandos||{}).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n],i)=>`◎ ─ ${i+1}. *${CONFIG.PREFIXO}${c}* — ${n}x`).join("\n"); await sock.sendMessage(jid,{text:`📊 *STATS*\n│\n◎ ─ 🔢 Total: *${s.total||0}*\n│\n${top}`},{quoted:seloBot}); return;}
        if(comando==="regras"){await sock.sendMessage(jid,{text:`📋 *REGRAS*\n│\n◎ ─ ❌ Sem links\n◎ ─ ❌ Sem spam\n◎ ─ ❌ Sem ofensas\n◎ ─ ❌ Sem status\n◎ ─ ✅ Respeita todos\n│\n◎ ─ ⚡ Ban automático 5→0!`},{quoted:seloBot}); return;}
        if(comando==="dono"||comando==="criador"){let ppD=null; try{ppD=await sock.profilePictureUrl(CONFIG.DONO_JID,"image");}catch{} const tD=`👑 *CRIADOR*\n│\n🏷️ *${CONFIG.DONO_NOME}*\n📞 *${CONFIG.DONO_NUM}*\nUsa *!alugar*! 💰`; if(ppD) await sock.sendMessage(jid,{image:{url:ppD},caption:tD},{quoted:seloBot}); else await sock.sendMessage(jid,{text:tD},{quoted:seloBot}); await reagir(sock,msg,"👑"); return;}
        if(comando==="donos"){await sock.sendMessage(jid,{text:`👑 *DONOS*\n│\n◎ ─ 👑 *${CONFIG.DONO_NOME}*\n   📞 ${CONFIG.DONO_NUM}`},{quoted:seloBot}); return;}

        // ─── VIP ───
        if(comando==="addvip"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}addvip* @user`},{quoted:seloBot}); return;} addVip(alvo,alvo.split("@")[0]); senhasAprovadas.add(alvo); await sock.sendMessage(jid,{text:`💎 *@${alvo.split("@")[0]} é agora VIP!*`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"💎"); return;}
        if(comando==="removevip"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}removevip* @user`},{quoted:seloBot}); return;} removeVip(alvo); await sock.sendMessage(jid,{text:`❌ @${alvo.split("@")[0]} removido dos VIPs.`,mentions:[alvo]},{quoted:seloBot}); return;}
        if(comando==="vips"){const vips=listarVips(); const lista=Object.entries(vips); if(!lista.length){await sock.sendMessage(jid,{text:`📭 Nenhum VIP.`},{quoted:seloBot}); return;} const t=lista.map(([j,info],i)=>`◎ ─ ${i+1}. 💎 *${info.nome||j.split("@")[0]}*`).join("\n"); await sock.sendMessage(jid,{text:`💎 *VIPS*\n│\n${t}\n│\nTotal: *${lista.length}*`},{quoted:seloBot}); return;}

        // ─── PLAY ───
        if(comando==="play"){const query=args.join(" ").trim(); await processarComandoPlay(sock,jid,msg,query); return;}

        // ─── DOWNLOADS ───
        if(comando==="mp3"&&args.length>0){const entrada=args.join(" "); await reagir(sock,msg,"🎵"); let arqFinal=null; try{arqFinal=await barraCarregamento(sock,jid,seloBot,`A baixar MP3: _${entrada.slice(0,40)}_`,()=>downloadMusica(entrada,false));}catch(e){console.log("❌ mp3:",e.message);} if(!arqFinal||!fs.existsSync(arqFinal)){await sock.sendMessage(jid,{text:`❌ Não encontrei: _${entrada}_`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarAudio(sock,jid,arqFinal,seloBot); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} setTimeout(()=>{try{fs.removeSync(arqFinal);}catch{}},15000); return;}
        if(comando==="mp4"&&args.length>0){const entrada=args.join(" "); await reagir(sock,msg,"🎬"); let saida=null; try{saida=await barraCarregamento(sock,jid,seloBot,`A baixar vídeo: _${entrada.slice(0,40)}_`,()=>downloadVideo(entrada,480));}catch(e){console.log("❌ mp4:",e.message);} if(!saida||!fs.existsSync(saida)){await sock.sendMessage(jid,{text:`❌ Não consegui.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,saida,`🎬 _© ${CONFIG.NOME_BOT}_`,[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} setTimeout(()=>{try{fs.removeSync(saida);}catch{}},15000); return;}
        if(comando==="mp4hd"&&args.length>0){const entrada=args.join(" "); await reagir(sock,msg,"📹"); let result=null; try{result=await barraCarregamento(sock,jid,seloBot,`A baixar vídeo 720p...`,()=>downloadVideoHD(entrada,720));}catch(e){console.log("❌ mp4hd:",e.message);} if(!result||!result.filePath||!fs.existsSync(result.filePath)){await sock.sendMessage(jid,{text:`❌ Não consegui.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,result.filePath,`📹 ${result.quality} | 💾 ${result.sizeMB}MB`,[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(result.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="ytsearch"&&args.length>0){const query=args.join(" "); let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🔍 _${query}_\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{} const videos=await scraperYouTubeSearch(query,5); if(loadMsg){try{await sock.sendMessage(jid,{text:`🔍 _${query}_\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); if(!videos.length){await sock.sendMessage(jid,{text:"❌ Nenhum resultado."},{quoted:seloBot}); return;} const lista=videos.slice(0,5).map((v,i)=>`*${i+1}.* 🎵 ${(v.title||v.titulo||"N/A").slice(0,40)}\n   ⏱️ ${formatarDuracao(v.duration||0)}\n   🔗 ${v.webpage_url||v.url||""}`).join("\n\n"); const primThumb=videos[0]?.thumbnail||null; if(primThumb) await sock.sendMessage(jid,{image:{url:primThumb},caption:`🔎 *YouTube: ${query}*\n\n${lista}`},{quoted:seloBot}); else await sock.sendMessage(jid,{text:`🔎 *YouTube: ${query}*\n\n${lista}`},{quoted:seloBot}); await reagir(sock,msg,"🔍"); return;}
        if(comando==="tiktok"){const url=args[0]; if(!url||!url.startsWith("http")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}tiktok* [link]`},{quoted:seloBot}); return;} await reagir(sock,msg,"📱"); let result=null; try{result=await barraCarregamento(sock,jid,seloBot,"A baixar TikTok...",()=>scraperTikTokVideo(url));}catch{} if(!result){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await sock.sendMessage(jid,{video:{url:result.url},caption:`📱 *${result.title||"TikTok"}*`},{quoted:seloBot}); await reagir(sock,msg,"✅"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="ttsearch"&&args.length>0){const query=args.join(" "); const videos=await scraperTikTokSearch(query,5); if(!videos.length){await sock.sendMessage(jid,{text:"❌ Nenhum resultado TikTok."},{quoted:seloBot}); return;} try{const cards=videos.slice(0,5).map(v=>({...(v.thumbnail||v.cover?{image:{url:v.thumbnail||v.cover}}:{}),caption:`🎵 *${(v.title||v.desc||"TikTok").slice(0,50)}*\n👤 ${v.author||"N/A"}`,footer:`📱 TikTok`,nativeFlow:[{text:"🎬 Baixar",url:v.video||v.url||"",useWebview:false}]})); await sock.sendMessage(jid,{text:`🔍 *TikTok: ${query}*`,footer:CONFIG.NOME_BOT,cards},{quoted:seloBot});}catch{const lista=videos.slice(0,5).map((v,i)=>`*${i+1}.* ${(v.title||v.desc||"TikTok").slice(0,40)}\n   🔗 ${v.video||v.url||""}`).join("\n\n"); await sock.sendMessage(jid,{text:`🔍 *TikTok: ${query}*\n\n${lista}`},{quoted:seloBot});} await reagir(sock,msg,"🔍"); return;}
        if(comando==="tttrend"){const videos=await scraperTikTokTrending("AO",5); if(!videos.length){await sock.sendMessage(jid,{text:"❌ Não consegui buscar."},{quoted:seloBot}); return;} const lista=videos.slice(0,5).map((v,i)=>`*${i+1}.* 🔥 ${(v.title||v.desc||"TikTok").slice(0,40)}\n   🔗 ${v.video||v.url||""}`).join("\n\n"); await sock.sendMessage(jid,{text:`🔥 *TRENDING TIKTOK* 🇦🇴\n\n${lista}`},{quoted:seloBot}); await reagir(sock,msg,"🔥"); return;}
        if(comando==="ttuser"&&args.length>0){const username=args[0]; const user=await scraperTikTokUser(username); if(!user){await sock.sendMessage(jid,{text:`❌ Utilizador não encontrado: ${username}`},{quoted:seloBot}); return;} const texto_user=`📱 *TIKTOK USER*\n│\n◎ ─ 👤 *${user.nickname||user.nome||username}*\n◎ ─ 🔖 @${user.username||username}`; if(user.foto||user.avatar) await sock.sendMessage(jid,{image:{url:user.foto||user.avatar},caption:texto_user},{quoted:seloBot}); else await sock.sendMessage(jid,{text:texto_user},{quoted:seloBot}); await reagir(sock,msg,"📱"); return;}
        if(comando==="pinterest"&&args.length>0){const query=args.join(" "); let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`📌 _${query}_\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{} const pins=await scraperPinterestSearch(query,5,"image"); if(loadMsg){try{await sock.sendMessage(jid,{text:`📌 _${query}_\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); if(!pins.length){await sock.sendMessage(jid,{text:"❌ Nenhuma imagem."},{quoted:seloBot}); return;} try{const url=typeof pins[0]==="string"?pins[0]:(pins[0].image_url||pins[0].url||pins[0].src||""); await sock.sendMessage(jid,{image:{url},caption:`📌 Pinterest: ${query}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="pinvideo"&&args.length>0){const url=args[0]; let result=null; try{result=await barraCarregamento(sock,jid,seloBot,"A baixar Pinterest vídeo...",()=>scraperPinterestPin(url));}catch{} if(!result){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); return;} const videoUrl=result.video||result.url||result.link; if(!videoUrl){await sock.sendMessage(jid,{text:"❌ Sem vídeo nesse pin."},{quoted:seloBot}); return;} await sock.sendMessage(jid,{video:{url:videoUrl},caption:"📌 Pinterest"},{quoted:seloBot}); await reagir(sock,msg,"✅"); return;}
        if(comando==="instagram"&&args.length>0){const url=args[0]; await reagir(sock,msg,"📸"); let r=null; try{r=await barraCarregamento(sock,jid,seloBot,"A baixar Instagram...",()=>dlRedeSocial(url));}catch{} if(!r){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,r.filePath,"📸 Instagram",[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(r.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="twitter"&&args.length>0){const url=args[0]; await reagir(sock,msg,"🐦"); let r=null; try{r=await barraCarregamento(sock,jid,seloBot,"A baixar Twitter...",()=>dlRedeSocial(url));}catch{} if(!r){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,r.filePath,"🐦 Twitter/X",[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(r.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="facebook"&&args.length>0){const url=args[0]; if(!url.includes("facebook.com")&&!url.includes("fb.watch")){await sock.sendMessage(jid,{text:"❌ Link inválido."},{quoted:seloBot}); return;} await reagir(sock,msg,"📘"); let r=null; try{r=await barraCarregamento(sock,jid,seloBot,"A baixar Facebook...",()=>dlRedeSocial(url));}catch{} if(!r){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,r.filePath,"📘 Facebook",[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(r.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="kwai"&&args.length>0){const url=args[0]; await reagir(sock,msg,"📹"); let r=null; try{r=await barraCarregamento(sock,jid,seloBot,"A baixar Kwai...",()=>dlRedeSocial(url));}catch{} if(!r){await sock.sendMessage(jid,{text:"❌ Não consegui."},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarVideo(sock,jid,r.filePath,"📹 Kwai",[sender],seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(r.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="spotify"&&args.length>0){const entrada=args.join(" "); await reagir(sock,msg,"🟢"); let arq=null; try{arq=await barraCarregamento(sock,jid,seloBot,`A baixar Spotify: _${entrada.slice(0,40)}_`,()=>dlSpotify(entrada).then(r=>r.filePath));}catch{} if(!arq){await sock.sendMessage(jid,{text:`❌ Não encontrei.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarAudio(sock,jid,arq,seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="soundcloud"&&args.length>0){const entrada=args.join(" "); await reagir(sock,msg,"🔶"); let arq=null; try{arq=await barraCarregamento(sock,jid,seloBot,"A baixar SoundCloud...",()=>dlSoundcloud(entrada).then(r=>r.filePath));}catch{} if(!arq){await sock.sendMessage(jid,{text:`❌ Não encontrei.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;} try{await enviarAudio(sock,jid,arq,seloBot); await reagir(sock,msg,"✅"); addXP(sender,5); setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="mediafire"&&args.length>0){const url=args[0]; if(!url.includes("mediafire.com")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}mediafire* [link]`},{quoted:seloBot}); return;} await reagir(sock,msg,"📦"); try{const result=await dlMediafire(url); await sock.sendMessage(jid,{document:{url:result.url},fileName:result.title,mimetype:"application/octet-stream",caption:`📦 *${result.title}*`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="apk"&&args.length>0){const query=args.join(" "); await reagir(sock,msg,"📲"); try{const result=await dlApk(query); await sock.sendMessage(jid,{text:`📲 *APK: ${result.title}*\n🔗 ${result.url}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="qr"){const dado=args.join(" "); if(!dado){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}qr* [texto/url]`},{quoted:seloBot}); return;} try{await sock.sendMessage(jid,{image:{url:`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(dado)}&qzone=2&ecc=M`},caption:`🔲 *QR CODE*`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="mostre"&&args.length>0){const query=args.join(" "); let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🔍 _${query}_\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} const imageUrl=await buscarImagemInternet(query); if(loadMsg){try{await sock.sendMessage(jid,{text:`🔍 _${query}_\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); if(!imageUrl){await sock.sendMessage(jid,{text:`❌ Não encontrei.`},{quoted:seloBot}); return;} await sock.sendMessage(jid,{image:{url:imageUrl},caption:`🖼️ *${query}*`},{quoted:seloBot}); await reagir(sock,msg,"✅"); return;}
        if(comando==="foto"&&args[0]){try{await sock.sendMessage(jid,{image:{url:args.join("")},caption:"📷"},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="doc"&&args[0]){try{const url=args.join(""),nome=decodeURIComponent(url.split("/").pop().split("?")[0])||"documento"; await sock.sendMessage(jid,{document:{url},fileName:nome,mimetype:"application/octet-stream",caption:"📄"},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="tourl"){const midia=await downloadQualquerMidia(msg); if(!midia){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}tourl* ↩️ responde mídia`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🔗 A gerar link...\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{} try{let url; if(midia.mime.startsWith("image/")&&!midia.mime.includes("webp")){try{url=await uploadParaTelegraph(midia.buffer);}catch{url=await uploadParaCatbox(midia.buffer,midia.nome,midia.mime);}}else{url=await uploadParaCatbox(midia.buffer,midia.nome,midia.mime);} if(loadMsg){try{await sock.sendMessage(jid,{text:`🔗 A gerar link...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`🔗 *Link gerado!*\n│\n◎ ─ 📎 *${midia.nome}*\n◎ ─ 🌐 ${url}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message.slice(0,80)}`},{quoted:seloBot});} return;}

        // ─── FIGURINHAS ───
        if(comando==="sticker"){const quotedMsg=msg.message.extendedTextMessage?.contextInfo?.quotedMessage; const iM=quotedMsg?.imageMessage,vM=quotedMsg?.videoMessage; if(!iM&&!vM){await sock.sendMessage(jid,{text:`↩️ Responde imagem/vídeo com *${CONFIG.PREFIXO}sticker*`},{quoted:seloBot}); return;} const isAnim=!!vM; await sock.sendMessage(jid,{text:`🎭 A criar sticker...\n⏳`},{quoted:seloBot}); try{const buf=await downloadMediaMessage({message:quotedMsg,key:msg.key},"buffer",{}); const webpBuf=await criarSticker(buf,isAnim); await sock.sendMessage(jid,{sticker:webpBuf},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{try{const buf=await downloadMediaMessage({message:quotedMsg,key:msg.key},"buffer",{}); await sock.sendMessage(jid,{sticker:buf},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});}} return;}
        if(comando==="sf"){const ctx=msg.message?.extendedTextMessage?.contextInfo,quotedMsg=ctx?.quotedMessage,stickerMsgD=msg.message?.stickerMessage,stickerMsgQ=quotedMsg?.stickerMessage,stickerMsg=stickerMsgD||stickerMsgQ; if(!stickerMsg){await sock.sendMessage(jid,{text:`↩️ Responde sticker com *${CONFIG.PREFIXO}sf*`},{quoted:seloBot}); return;} const isAnimated=stickerMsg.isAnimated||false; try{let buf; if(stickerMsgD) buf=await downloadMediaMessage(msg,"buffer",{}); else{const qm={key:{remoteJid:jid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:quotedMsg}; buf=await downloadMediaMessage(qm,"buffer",{});} if(!buf||buf.length<100) throw new Error("Sticker inválido"); const resultado=await stickerParaFoto(buf,isAnimated); if(resultado.isVideo) await sock.sendMessage(jid,{video:resultado.buffer,mimetype:"video/mp4",caption:`🎥 Convertido!`},{quoted:seloBot}); else await sock.sendMessage(jid,{image:resultado.buffer,caption:`🖼️ Convertido!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="brat"){const textoBrat=args.join(" ")||"brat"; try{const url=`https://api.memegen.link/images/custom/~p${encodeURIComponent(textoBrat)}/_.jpg?background=d4c5a0&width=512&height=512`; const{data}=await axios.get(url,{responseType:"arraybuffer",timeout:15000,httpsAgent}); const buf=await criarSticker(Buffer.from(data),false); await sock.sendMessage(jid,{sticker:buf},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="figurinha"||comando==="figu"){const quantidade=Math.min(parseInt(args[0])||1,5); await reagir(sock,msg,"🎭"); const emojis=["😂","😍","🔥","💀","😭","🤣","😎","🥺","😤","💪"]; for(let i=0;i<quantidade;i++){try{const emoji=emojis[Math.floor(Math.random()*emojis.length)]; const url=`https://api.memegen.link/images/custom/~p${encodeURIComponent(emoji)}/_.png?width=512&height=512`; const{data}=await axios.get(url,{responseType:"arraybuffer",timeout:10000,httpsAgent}); const buf=await criarSticker(Buffer.from(data),false); await sock.sendMessage(jid,{sticker:buf},{quoted:seloBot}); await new Promise(r=>setTimeout(r,500));}catch{}} return;}

        // ─── BRINCADEIRAS ───
        if(comando==="piada"){try{const p=await chatIA("Conta uma piada curta e engraçada em português de Angola."); await sock.sendMessage(jid,{text:`😂 *PIADA*\n│\n${p}`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="conselho"&&args.length>0){const sit=args.join(" "); try{const resp=await chatIA(`Dá um conselho para: "${sit}".`); await sock.sendMessage(jid,{text:`💡 *CONSELHO*\n│\n${resp}`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="historia"){const tema=args.join(" ")||"Angola"; try{const h=await chatIA(`Escreve uma história curta sobre: "${tema}". Máx 200 palavras.`); await sock.sendMessage(jid,{text:`📖 *HISTÓRIA*\n│\n${h}`},{quoted:seloBot}); addXP(sender,5);}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="poema"){const tema=args.join(" ")||"Angola"; try{const p=await chatIA(`Escreve um poema de 4-8 versos sobre: "${tema}".`,"Poeta angolano."); await sock.sendMessage(jid,{text:`✍️ *POEMA*\n│\n${p}`},{quoted:seloBot}); addXP(sender,5);}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="perfil"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`↩️ Menciona alguém!`},{quoted:seloBot}); return;} const ehZoada=Math.random()<0.5,LISTA=ehZoada?PERFIS_ZOADA:PERFIS_ELOGIO; const desc=LISTA[Math.floor(Math.random()*LISTA.length)]; let ppAlvo=null; try{ppAlvo=await sock.profilePictureUrl(alvo,"image");}catch{} const textoFinal=`${ehZoada?"😂":"🌟"} ${desc}\n\n📱 +${alvo.split("@")[0]}`; if(ppAlvo) await sock.sendMessage(jid,{image:{url:ppAlvo},caption:textoFinal,mentions:[alvo]},{quoted:seloBot}); else await sock.sendMessage(jid,{text:textoFinal,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,ehZoada?"😂":"🌟"); return;}
        if(comando==="cara"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}cara* @user`},{quoted:seloBot}); return;} const nota=Math.floor(Math.random()*10)+1; await sock.sendMessage(jid,{text:`📊 *AVALIAÇÃO*\n│\n👤 @${alvo.split("@")[0]}\n⭐ Nota: *${nota}/10* ${nota>=8?"🔥😍":nota>=5?"😊👍":"😬💀"}`,mentions:[alvo]},{quoted:seloBot}); return;}
        if(comando==="ship"){const a1=extrairJid(mencoes[0]),a2=extrairJid(mencoes[1]); if(!a1||!a2){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}ship* @user1 @user2`},{quoted:seloBot}); return;} const percent=Math.floor(Math.random()*100)+1; const barra=`${"💕".repeat(Math.floor(percent/10))}${"⬛".repeat(10-Math.floor(percent/10))}`; await sock.sendMessage(jid,{text:`💘 *SHIP*\n│\n@${a1.split("@")[0]} + @${a2.split("@")[0]}\n│\n${barra} *${percent}%*\n│\n${percent>=80?"Perfeito! 😍":percent>=60?"Muito compatíveis! 😊":percent>=40?"Pode funcionar! 🤔":"Hmmm... 😅"}`,mentions:[a1,a2]},{quoted:seloBot}); return;}
        if(comando==="fofoca"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} try{const meta=await sock.groupMetadata(jid); const membros=meta.participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p)); if(membros.length<2){await sock.sendMessage(jid,{text:"❌ Poucos membros."},{quoted:seloBot}); return;} const a=membros[Math.floor(Math.random()*membros.length)]; const b=membros.filter(m=>m!==a)[Math.floor(Math.random()*(membros.length-1))]; const fofocas=[`Dizem que @${a.split("@")[0]} tem crush em @${b.split("@")[0]}! 😱`,`@${a.split("@")[0]} apagou as mensagens antes de tu veres... 👀`,`@${a.split("@")[0]} é o que finge não ler mas vê tudo! 😂`]; await sock.sendMessage(jid,{text:`📢 *FOFOCA* 🗣️\n│\n${fofocas[Math.floor(Math.random()*fofocas.length)]}`,mentions:[a,b]},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="denunciar"){const ctx3=msg.message?.extendedTextMessage?.contextInfo; if(!ctx3?.participant){await sock.sendMessage(jid,{text:`↩️ Responde mensagem com *${CONFIG.PREFIXO}denunciar [motivo]*`},{quoted:seloBot}); return;} try{const den=extrairJid(ctx3.participant),mot=args.join(" ")||"Sem motivo"; const meta=await sock.groupMetadata(jid); for(const a of meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p))){try{await sock.sendMessage(a,{text:`🚨 *DENÚNCIA!*\n│\n◎ ─ 👤 @${den.split("@")[0]}\n◎ ─ 📝 ${mot}`,mentions:[den]});}catch{}} await sock.sendMessage(jid,{text:`✅ Denúncia enviada!`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}

        // ─── ✅ SHAZAM — apenas diversão (2 relâmpagos) ───
        if(comando==="shazam"){
          await reagir(sock,msg,"⚡");
          await sock.sendMessage(jid,{text:"⚡️"},{quoted:seloBot});
          await new Promise(r=>setTimeout(r,500));
          await sock.sendMessage(jid,{text:"⚡️"});
          return;
        }

        // ─── BUSCA — reconhecimento de música ───
        if(comando==="busca"){await executarReconhecimentoMusica(sock,jid,msg,sender,seloBot); return;}

        // ─── JOGOS ───
        if(["quiz","vof","completar","caca","guerra"].includes(comando)&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:`⚠️ Jogo activo! Usa *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); return;}
        if(comando==="quiz"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"quiz",categoria,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`🎮 *QUIZ* iniciado! ${categoria?`🎯 *${categoria.toUpperCase()}*`:"🎲 Variado"} | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"🎮"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="vof"){jogoLoop[jid]={tipo:"vof",categoria:null,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`✅❌ *V/F* iniciado! | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"❓"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="completar"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"completar",categoria,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`🔤 *COMPLETA* iniciado! | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"🔤"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="caca"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"caca",categoria,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`🔍 *CAÇA-PALAVRAS* iniciado! | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"🔍"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="guerra"){const categoria=args.length>0?args.join(" "):null; jogoLoop[jid]={tipo:"guerra",categoria,activo:true,usadas:[],rodada:0}; await sock.sendMessage(jid,{text:`⚔️ *FORCA* iniciado! | 🛑 *${CONFIG.PREFIXO}stop*`},{quoted:seloBot}); await reagir(sock,msg,"⚔️"); setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000); return;}
        if(comando==="stop"){if(jogoLoop[jid]&&jogoLoop[jid].activo){if(jogoLoop[jid].timeoutHandle) clearTimeout(jogoLoop[jid].timeoutHandle); const rodadas=jogoLoop[jid].rodada||0; delete jogoLoop[jid]; delete jogoAtivo[jid]; delete jogoAdivinhar[jid]; delete jogoVelocidade[jid]; await sock.sendMessage(jid,{text:`🛑 *Jogo parado!*\n📊 Rodadas: *${rodadas}*`},{quoted:seloBot}); await reagir(sock,msg,"🛑");}else{await sock.sendMessage(jid,{text:`❌ Não há jogo activo.`},{quoted:seloBot});} return;}
        if(comando==="rank"){const r=fs.readJsonSync(ARQUIVO_RANK); const n=sender.split("@")[0]; const d=r[n]||{xp:0,nivel:1,msgs:0}; const bar="█".repeat(Math.min(10,Math.floor((d.xp%100)/10)))+"░".repeat(10-Math.min(10,Math.floor((d.xp%100)/10))); await sock.sendMessage(jid,{text:`🏆 *RANK*\n│\n◎ ─ ⭐ Nível: *${d.nivel}* | ✨ XP: *${d.xp}*\n◎ ─ 📊 [${bar}]\n◎ ─ 💬 Msgs: *${d.msgs}*`},{quoted:seloBot}); await reagir(sock,msg,"🏆"); return;}
        if(comando==="toprank"){const r=fs.readJsonSync(ARQUIVO_RANK); const medalhas=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]; const top=Object.entries(r).sort((a,b)=>b[1].xp-a[1].xp).slice(0,10).map(([n,d],i)=>`◎ ─ ${medalhas[i]} +${n} — Nv.*${d.nivel}* | *${d.xp}* XP`).join("\n"); await sock.sendMessage(jid,{text:`🏆 *TOP 10 XP*\n│\n${top||"◎ ─ _Sem dados_"}`},{quoted:seloBot}); return;}
        if(comando==="matematica"){const desafio=MATEMATICA_BANCO(); jogoAtivo[jid]={tipo:"matematica",r:desafio.resposta}; await sock.sendMessage(jid,{text:`🧮 *DESAFIO MATEMÁTICO*\n✦ ─────────── ✦\n❓ Quanto é ${desafio.pergunta}?\n\n⏰ 15s!`},{quoted:seloBot}); setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="matematica"){await sock.sendMessage(jid,{text:`⏰ Tempo!\nResposta: *${desafio.resposta}*`},{quoted:seloBot}); delete jogoAtivo[jid];}},15000); return;}
        if(comando==="jokenpo"){const opcoes=["pedra","papel","tesoura"]; const bot=opcoes[Math.floor(Math.random()*3)]; const user=args[0]?.toLowerCase(); if(!["pedra","papel","tesoura"].includes(user)){await sock.sendMessage(jid,{text:`✊ *JOKENPO*\n◎ ─ *${CONFIG.PREFIXO}jokenpo* [pedra/papel/tesoura]`},{quoted:seloBot}); return;} let resultado; if(user===bot) resultado="🤝 *Empate!*"; else if((user==="pedra"&&bot==="tesoura")||(user==="papel"&&bot==="pedra")||(user==="tesoura"&&bot==="papel")){resultado="🎉 *Ganhaste!*"; addXP(sender,20); addCoins(sender,10);}else{resultado="😅 *Bot ganhou!*";} await sock.sendMessage(jid,{text:`✊ *JOKENPO*\n│\n◎ ─ Tu: *${user}*\n◎ ─ Bot: *${bot}*\n│\n${resultado}`},{quoted:seloBot}); return;}
        if(comando==="dado"){const lados=parseInt(args[0])||6; const resultado=Math.floor(Math.random()*lados)+1; await sock.sendMessage(jid,{text:`🎲 *DADO ${lados}*\nResultado: *${resultado}*`},{quoted:seloBot}); await reagir(sock,msg,"🎲"); return;}
        if(comando==="cara-coroa"){const resultado=Math.random()<0.5?"CARA 😊":"COROA 👑"; const escolha=args[0]?.toLowerCase(); let texto=`🪙 *CARA OU COROA*\nResultado: *${resultado}*`; if(escolha&&["cara","coroa"].includes(escolha)){const acertou=(escolha==="cara"&&resultado.includes("CARA"))||(escolha==="coroa"&&resultado.includes("COROA")); if(acertou){texto+=`\n✅ *Acertaste!* +20 XP`; addXP(sender,20);}else{texto+=`\n❌ *Erraste!*`;}} await sock.sendMessage(jid,{text:texto},{quoted:seloBot}); await reagir(sock,msg,"🪙"); return;}
        if(comando==="adivinhar"){if(jogoAdivinhar[jid]){await sock.sendMessage(jid,{text:`🎯 Jogo activo! Adivinha de 1-100.`},{quoted:seloBot}); return;} const numero=Math.floor(Math.random()*100)+1; const jM=await sock.sendMessage(jid,{text:`🎯 *ADIVINHAR NÚMERO*\n\n${FRAMES_LOADING[0]}\n\n_Adivinha de 1 a 100!_`},{quoted:seloBot}); jogoAdivinhar[jid]={numero,tentativas:0,msgKey:jM?.key}; setTimeout(()=>{if(jogoAdivinhar[jid]){delete jogoAdivinhar[jid]; sock.sendMessage(jid,{text:`⏰ *Tempo!* Era o *${numero}*!`},{quoted:seloBot});}},5*60*1000); return;}
        if(comando==="velocidade"){if(jogoVelocidade[jid]){await sock.sendMessage(jid,{text:`⚡ Jogo activo!`},{quoted:seloBot}); return;} const palavra=PALAVRAS_VELOCIDADE[Math.floor(Math.random()*PALAVRAS_VELOCIDADE.length)]; await sock.sendMessage(jid,{text:`⚡ *VELOCIDADE*\n│\nDigita:\n\n\`\`\`${palavra}\`\`\`\n\n⏰ Já!`},{quoted:seloBot}); jogoVelocidade[jid]={palavra,inicio:Date.now(),msgKey:null}; setTimeout(()=>{if(jogoVelocidade[jid]){delete jogoVelocidade[jid]; sock.sendMessage(jid,{text:`⏰ Tempo! Era: *${palavra}*`},{quoted:seloBot});}},30000); return;}
        if(comando==="roleta"){const bala=Math.floor(Math.random()*6)+1; const disparo=bala===1; if(disparo){await sock.sendMessage(jid,{text:`🔫 *ROLETA RUSSA*\n│\n💀 *BANG!* @${sender.split("@")[0]} foi eliminado!`,mentions:[sender]},{quoted:seloBot}); await reagir(sock,msg,"💀");}else{await sock.sendMessage(jid,{text:`🔫 *ROLETA RUSSA*\n│\n😅 *CLICK!* Sobreviveste!\n🏆 +50 XP`},{quoted:seloBot}); addXP(sender,50); await reagir(sock,msg,"😅");} return;}
        if(comando==="aki"){const acertou=Math.random()<0.7; if(acertou){const personalidades=["Cristiano Ronaldo","Michael Jackson","Barack Obama","Lionel Messi","Elon Musk"]; const p=personalidades[Math.floor(Math.random()*personalidades.length)]; await sock.sendMessage(jid,{text:`🎩 *AKINATOR*\n│\n🎯 Acho que és... *${p}*?`},{quoted:seloBot});}else{await sock.sendMessage(jid,{text:`🎩 *AKINATOR*\n│\n😵 Não consigo adivinhar! +100 XP`},{quoted:seloBot}); addXP(sender,100);} return;}
        if(comando==="aposta"&&args.length>0){const qtd=parseInt(args[0]); if(isNaN(qtd)||qtd<=0){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}aposta* [quantidade]`},{quoted:seloBot}); return;} const saldo=getCoins(sender); if(saldo<qtd){await sock.sendMessage(jid,{text:`❌ Saldo insuficiente! Tens: *${saldo}* 💰`},{quoted:seloBot}); return;} const resultado=Math.random()<0.5?"CARA 😊":"COROA 👑"; const escolha=args[1]?.toLowerCase()||"cara"; const ganhou=(escolha==="cara"&&resultado.includes("CARA"))||(escolha==="coroa"&&resultado.includes("COROA")); if(ganhou){addCoins(sender,qtd); await sock.sendMessage(jid,{text:`🎰 *APOSTA*\n│\n🪙 *${resultado}*\n✅ *GANHASTE!* +${qtd} 💰\nSaldo: *${getCoins(sender)}*`},{quoted:seloBot}); await reagir(sock,msg,"🎉");}else{setCoins(sender,saldo-qtd); await sock.sendMessage(jid,{text:`🎰 *APOSTA*\n│\n🪙 *${resultado}*\n❌ *PERDESTE!* -${qtd} 💰\nSaldo: *${getCoins(sender)}*`},{quoted:seloBot}); await reagir(sock,msg,"😭");} return;}

        // ─── COINS ───
        if(comando==="moedas"){const moedasUser=getCoins(sender); await sock.sendMessage(jid,{text:`💰 *MOEDAS*\n│\n◎ ─ 👤 *${sender.split("@")[0]}*\n◎ ─ 💰 Saldo: *${moedasUser}*\n│\n◎ ─ 🎁 *${CONFIG.PREFIXO}diario* → +100 diário`},{quoted:seloBot}); await reagir(sock,msg,"💰"); return;}
        if(comando==="diario"){const agora=Date.now(); const ultimoDiario=getCooldown(sender,"diario"); const COOLDOWN_DIARIO=24*60*60*1000; if(agora-ultimoDiario<COOLDOWN_DIARIO){const restante=Math.ceil((COOLDOWN_DIARIO-(agora-ultimoDiario))/3600000); await sock.sendMessage(jid,{text:`⏰ Já coletaste hoje!\n◎ ─ Volta em *${restante}h*`},{quoted:seloBot}); return;} const ganho=100+Math.floor(Math.random()*50); addCoins(sender,ganho); setCooldown(sender,"diario"); await sock.sendMessage(jid,{text:`🎁 *RECOMPENSA DIÁRIA*\n│\n◎ ─ 🎉 +*${ganho}* moedas!\n◎ ─ 💰 Total: *${getCoins(sender)}*`},{quoted:seloBot}); await reagir(sock,msg,"🎁"); return;}
        if(comando==="dar"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}dar* @user [quantidade]`},{quoted:seloBot}); return;} const quantidade=parseInt(args[args.length-1])||0; if(quantidade<=0){await sock.sendMessage(jid,{text:`❌ Quantidade inválida.`},{quoted:seloBot}); return;} if(getCoins(sender)<quantidade){await sock.sendMessage(jid,{text:`❌ Saldo insuficiente! Tens: *${getCoins(sender)}* 💰`},{quoted:seloBot}); return;} setCoins(sender,getCoins(sender)-quantidade); addCoins(alvo,quantidade); await sock.sendMessage(jid,{text:`✅ Enviaste *${quantidade}* 💰 para @${alvo.split("@")[0]}!`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"💸"); return;}
        if(comando==="roubar"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}roubar* @user`},{quoted:seloBot}); return;} if(alvo===sender){await sock.sendMessage(jid,{text:`❌ Não podes roubar a ti mesmo!`},{quoted:seloBot}); return;} const moedasAlvo=getCoins(alvo); if(moedasAlvo<=0){await sock.sendMessage(jid,{text:`❌ Sem moedas!`,mentions:[alvo]},{quoted:seloBot}); return;} const sucesso=Math.random()>0.5; if(sucesso){const roubado=Math.min(Math.floor(moedasAlvo*0.1)+Math.floor(Math.random()*20),moedasAlvo); setCoins(alvo,moedasAlvo-roubado); addCoins(sender,roubado); await sock.sendMessage(jid,{text:`🦹 Roubaste *${roubado}* 💰 de @${alvo.split("@")[0]}!`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"🦹");}else{const perda=Math.floor(getCoins(sender)*0.05)+10; setCoins(sender,Math.max(0,getCoins(sender)-perda)); await sock.sendMessage(jid,{text:`👮 Foste apanhado! Perdeste *${perda}* 💰`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"👮");} return;}
        if(comando==="topcoins"){try{const c=fs.readJsonSync(ARQUIVO_COINS); const medalhas=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]; const top=Object.entries(c).sort((a,b)=>(b[1].moedas||0)-(a[1].moedas||0)).slice(0,10).map(([n,d],i)=>`◎ ─ ${medalhas[i]} +${n.split("@")[0]} — *${d.moedas||0}* 💰`).join("\n"); await sock.sendMessage(jid,{text:`💰 *TOP 10 RICOS*\n│\n${top||"◎ ─ _Sem dados_"}`},{quoted:seloBot}); await reagir(sock,msg,"💰");}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}

        // ─── ALTERADORES ───
        if(comando==="vz"){const ctxVz=msg.message?.extendedTextMessage?.contextInfo,quotedVz=ctxVz?.quotedMessage; let textoParaFalar=""; if(quotedVz) textoParaFalar=quotedVz.conversation||quotedVz.extendedTextMessage?.text||""; if(!textoParaFalar&&args.length>0) textoParaFalar=args.join(" "); if(!textoParaFalar){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}vz* [texto]`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🔊 A converter...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const audioPath=await textoParaFala(textoParaFalar); if(loadMsg){try{await sock.sendMessage(jid,{text:`🔊 A converter...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await enviarAudio(sock,jid,audioPath,seloBot); try{fs.removeSync(audioPath);}catch{} await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="transcrever"||comando==="audiotexto"){const d=await downloadAudioDaMensagem(msg); if(!d){await sock.sendMessage(jid,{text:`↩️ Responde áudio com *${CONFIG.PREFIXO}transcrever*`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`📝 A transcrever...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const t=await transcreverComGroq(d.buffer); if(loadMsg){try{await sock.sendMessage(jid,{text:`📝 A transcrever...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`📝 *TRANSCRIÇÃO*\n│\n${t}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="resumiraudio"){const d=await downloadAudioDaMensagem(msg); if(!d){await sock.sendMessage(jid,{text:`↩️ Responde áudio com *${CONFIG.PREFIXO}resumiraudio*`},{quoted:seloBot}); return;} try{const t=await transcreverComGroq(d.buffer); const r=await chatIA(`Resume: "${t}"`); await sock.sendMessage(jid,{text:`🎙️ *RESUMO*\n│\n${r}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="traduziraudio"){const idioma=args[0]||"português"; const d=await downloadAudioDaMensagem(msg); if(!d){await sock.sendMessage(jid,{text:`↩️ Responde áudio com *${CONFIG.PREFIXO}traduziraudio [idioma]*`},{quoted:seloBot}); return;} try{const t=await transcreverComGroq(d.buffer); const tr=await chatIA(`Traduz para ${idioma}: "${t}"`); await sock.sendMessage(jid,{text:`🌍 *TRADUÇÃO*\n│\n${tr}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="audioparaia"){const d=await downloadAudioDaMensagem(msg); if(!d){await sock.sendMessage(jid,{text:`↩️ Responde áudio com *${CONFIG.PREFIXO}audioparaia*`},{quoted:seloBot}); return;} try{const t=await transcreverComGroq(d.buffer); const r=await chatIA(t); await sock.sendMessage(jid,{text:`🧠 *IA + ÁUDIO*\n│\n${r}`},{quoted:seloBot}); await reagir(sock,msg,"🧠");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="ia"&&args.length>0){const pergunta=args.join(" "); let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🧠 A processar...\n\n${FRAMES_LOADING[1]}`},{quoted:seloBot});}catch{} try{const resp=await chatIA(pergunta); if(loadMsg){try{await sock.sendMessage(jid,{text:`🧠 A processar...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`🧠 *IA*\n│\n${resp}`},{quoted:seloBot}); await reagir(sock,msg,"🧠");}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="resumir"){const ctx2=msg.message?.extendedTextMessage?.contextInfo; const msgC=ctx2?.quotedMessage?.conversation||ctx2?.quotedMessage?.extendedTextMessage?.text||""; if(!msgC){await sock.sendMessage(jid,{text:`↩️ Responde mensagem com *${CONFIG.PREFIXO}resumir*`},{quoted:seloBot}); return;} try{const resp=await chatIA(`Resume: "${msgC}"`); await sock.sendMessage(jid,{text:`📝 *RESUMO*\n│\n${resp}`},{quoted:seloBot}); await reagir(sock,msg,"📝");}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="traduzir"&&args.length>1){const idioma=args[0],textT=args.slice(1).join(" "); try{const resp=await chatIA(`Traduz para ${idioma}: "${textT}"`); await sock.sendMessage(jid,{text:`🌍 *TRADUÇÃO*\n│\n${resp}`},{quoted:seloBot}); await reagir(sock,msg,"🌍");}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="fotocopia"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}fotocopia*`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🖼️ A ler texto...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const t=await analisarImagem(imgBuf,"Lê e transcreve TODO o texto visível. Em português."); if(loadMsg){try{await sock.sendMessage(jid,{text:`🖼️ A ler texto...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`📄 *TEXTO EXTRAÍDO*\n│\n${t}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="fotoparaia"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}fotoparaia [pergunta]*`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🖼️ A analisar...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const instrucao=args.join(" ")?`Responde: "${args.join(" ")}". Em português.`:"Descreve detalhadamente. Em português."; const resp=await analisarImagem(imgBuf,instrucao); if(loadMsg){try{await sock.sendMessage(jid,{text:`🖼️ A analisar...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`🧠 *IA + IMAGEM*\n│\n${resp}`},{quoted:seloBot}); await reagir(sock,msg,"🧠");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="resumirfoto"){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}resumirfoto*`},{quoted:seloBot}); return;} try{const resumo=await analisarImagem(imgBuf,"Faz um resumo objetivo. Em português."); await sock.sendMessage(jid,{text:`📝 *RESUMO DA IMAGEM*\n│\n${resumo}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="traduzirfoto"){const idioma=args[0]||"português"; const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}traduzirfoto [idioma]*`},{quoted:seloBot}); return;} try{const resultado=await analisarImagem(imgBuf,`Lê e traduz para ${idioma}.`); await sock.sendMessage(jid,{text:`🌍 *TRADUÇÃO DA IMAGEM*\n│\n${resultado}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="editar"){const instrucao=args.join(" ").trim(); if(!instrucao){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}editar* [instrução] ↩️ imagem`},{quoted:seloBot}); return;} const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}editar [instrução]*`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🎨 A analisar...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const descricao=await analisarImagem(imgBuf,`Descreve para poder editar com: "${instrucao}". Em português.`); if(loadMsg){try{await sock.sendMessage(jid,{text:`🎨 A analisar...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`🎨 *ANÁLISE PARA EDIÇÃO*\n│\n💡 _${instrucao}_\n│\n${descricao}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message.slice(0,100)}`},{quoted:seloBot});} return;}

        // ─── LOGOS / UTILIDADES ───
        if(comando==="meme"){const partes=args.join(" ").split("|"); if(partes.length<2){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}meme* [texto1|texto2]`},{quoted:seloBot}); return;} try{await sock.sendMessage(jid,{image:{url:`https://api.memegen.link/images/drake/${encodeURIComponent(partes[0].trim())}/${encodeURIComponent(partes[1].trim())}.jpg?width=512`},caption:`😂 *MEME*`},{quoted:seloBot}); await reagir(sock,msg,"😂");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="logo"){const textoLogo=args.join(" ").trim(); if(!textoLogo){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}logo* [texto]`},{quoted:seloBot}); return;} try{await sock.sendMessage(jid,{image:{url:`https://api.memegen.link/images/custom/${encodeURIComponent(textoLogo)}/_.jpg?background=000000&width=512&height=256`},caption:`🎨 *LOGO: ${textoLogo}*`},{quoted:seloBot}); await reagir(sock,msg,"🎨");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="card"){const textoCard=args.join(" ").trim(); if(!textoCard){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}card* [texto]`},{quoted:seloBot}); return;} try{await sock.sendMessage(jid,{image:{url:`https://api.memegen.link/images/buzz/${encodeURIComponent(textoCard)}/${encodeURIComponent("@"+sender.split("@")[0])}.jpg?width=512`},caption:`🃏 *CARD*`},{quoted:seloBot}); await reagir(sock,msg,"🃏");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="calc"){const expr=args.join(" "); if(!expr){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}calc* [expressão]`},{quoted:seloBot}); return;} try{const resultado=calcularSeguro(expr); await sock.sendMessage(jid,{text:`🔢 *${expr}* = *${resultado}*`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:`❌ Expressão inválida!`},{quoted:seloBot});} return;}
        if(comando==="encurtar"){const url=args[0]; if(!url||!url.startsWith("http")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}encurtar* [url]`},{quoted:seloBot}); return;} try{const{data}=await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,{timeout:10000,httpsAgent}); const urlE=String(data).trim(); if(!urlE.startsWith("http")) throw new Error("Falha"); await sock.sendMessage(jid,{text:`🔗 *Link encurtado:*\n${urlE}`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="cotacao"){let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`💱 A buscar cotações...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const resp=await chatIA("Cotações actuais do Kwanza (AOA) para USD, EUR, BRL. Formato curto.","Sê direto."); if(loadMsg){try{await sock.sendMessage(jid,{text:`💱 A buscar cotações...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`💱 *COTAÇÕES KWANZA*\n│\n${resp}`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});} return;}
        if(comando==="tempo"){if(!args[0]){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}tempo* [cidade]`},{quoted:seloBot}); return;} const local=args.join(" "); let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🌤️ ${local}...\n\n${FRAMES_LOADING[2]}`},{quoted:seloBot});}catch{} try{const res=await axios.get(`https://wttr.in/${encodeURIComponent(local)}?format=j1`,{timeout:10000,httpsAgent}); const cur=res.data.current_condition[0]; if(loadMsg){try{await sock.sendMessage(jid,{text:`🌤️ ${local}...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); await sock.sendMessage(jid,{text:`🌤️ *${local.toUpperCase()}*\n│\n🌡️ *${cur.temp_C}°C* — ${cur.weatherDesc[0].value}\n💧 ${cur.humidity}% | 💨 ${cur.windspeedKmph}km/h`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:`❌ Cidade não encontrada.`},{quoted:seloBot});} return;}
        if(comando==="horario"){const agora=new Date(); const opc=(tz)=>({timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false}); await sock.sendMessage(jid,{text:`🕐 *HORÁRIO MUNDIAL*\n│\n🇦🇴 Angola: *${agora.toLocaleTimeString("pt-AO",opc("Africa/Luanda"))}*\n🇧🇷 Brasil: *${agora.toLocaleTimeString("pt-BR",opc("America/Sao_Paulo"))}*\n🇵🇹 Portugal: *${agora.toLocaleTimeString("pt-PT",opc("Europe/Lisbon"))}*\n🇺🇸 EUA: *${agora.toLocaleTimeString("en-US",opc("America/New_York"))}*`},{quoted:seloBot}); return;}
        if(comando==="ver"){const ctx=msg.message?.extendedTextMessage?.contextInfo; const stanzaId=ctx?.stanzaId; if(!ctx||!stanzaId){await sock.sendMessage(jid,{text:`↩️ Responde view-once com *${CONFIG.PREFIXO}ver*`},{quoted:seloBot}); return;} const quemEnviou=ctx.participant?`@${ctx.participant.split("@")[0].split(":")[0]}`:"alguém"; const mentions=ctx.participant?[ctx.participant]:[]; const cached=cacheViewOnce[jid]?.[stanzaId]; if(cached){try{if(cached.tipo==="video") await sock.sendMessage(jid,{video:cached.buf,caption:`🔓 De: ${quemEnviou}`,mentions},{quoted:seloBot}); else if(cached.tipo==="audio"){await sock.sendMessage(jid,{audio:cached.buf,mimetype:"audio/ogg; codecs=opus",ptt:false},{quoted:seloBot});}else await sock.sendMessage(jid,{image:cached.buf,caption:`🔓 De: ${quemEnviou}`,mentions},{quoted:seloBot}); await reagir(sock,msg,"🔓"); addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;} const qMsg=ctx.quotedMessage; if(qMsg){let innerMsg=null; for(const key of["viewOnceMessage","viewOnceMessageV2","viewOnceMessageV2Extension"]){if(qMsg[key]?.message){innerMsg=qMsg[key].message; break;}} if(innerMsg){try{const fakeMsg={key:{remoteJid:jid,id:stanzaId,participant:ctx.participant||"",fromMe:false},message:innerMsg}; const buf=await downloadMediaMessage(fakeMsg,"buffer",{}); if(innerMsg.imageMessage) await sock.sendMessage(jid,{image:buf,caption:`🔓 De: ${quemEnviou}`,mentions},{quoted:seloBot}); else if(innerMsg.videoMessage) await sock.sendMessage(jid,{video:buf,caption:`🔓 De: ${quemEnviou}`,mentions},{quoted:seloBot}); else if(innerMsg.audioMessage||innerMsg.pttMessage) await sock.sendMessage(jid,{audio:buf,mimetype:"audio/ogg; codecs=opus",ptt:false},{quoted:seloBot}); await reagir(sock,msg,"🔓"); addXP(sender,5);}catch{await sock.sendMessage(jid,{text:`❌ Expirada.`},{quoted:seloBot});} return;}} await sock.sendMessage(jid,{text:`❌ Não encontrei.`},{quoted:seloBot}); await reagir(sock,msg,"❌"); return;}
        if(comando==="apagadas"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} const lista=msgApagadas[jid]||[]; if(!lista.length){await sock.sendMessage(jid,{text:`📭 Nenhuma mensagem apagada.`},{quoted:seloBot}); return;} const ultimas=lista.slice(-10).reverse(); const textoLista=ultimas.map(m=>{const hora=new Date(m.apagadoEm).toLocaleTimeString("pt-AO",{timeZone:"Africa/Luanda",hour:"2-digit",minute:"2-digit"}); return `◎ ─ +${m.sender?.split("@")[0]||"?"} 🕐 ${hora}\n   ${m.texto?`_"${m.texto.slice(0,60)}"_`:`_(${m.tipo})_`}`;}).join("\n│\n"); await sock.sendMessage(jid,{text:`🕵️ *MSGS APAGADAS*\n│\n${textoLista}`},{quoted:seloBot}); return;}
        if(comando==="placar"){const busca=args.join(" ").trim(); if(!busca){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}placar* [equipa/jogo]`},{quoted:seloBot}); return;} try{const resp=await chatIA(`Dá o último placar de: "${busca}". Formato: Equipa A X - X Equipa B.`,"Sê direto."); await sock.sendMessage(jid,{text:`⚽ *PLACAR: ${busca}*\n│\n${resp}`},{quoted:seloBot}); await reagir(sock,msg,"⚽");}catch{await sock.sendMessage(jid,{text:`❌ Não encontrei.`},{quoted:seloBot});} return;}

        // ─── +18 VIP ───
        if(comando==="piada18"){const p=await chatIA("Conta uma piada adulta (+18) engraçada em português.","Humorista adulto."); await sock.sendMessage(jid,{text:`🔞 *PIADA +18*\n│\n${p}`},{quoted:seloBot}); return;}
        if(comando==="truth"){const t=VERDADES_18[Math.floor(Math.random()*VERDADES_18.length)]; await sock.sendMessage(jid,{text:`🎯 *TRUTH*\n│\n❓ ${t}`},{quoted:seloBot}); return;}
        if(comando==="dare"){const d=DESAFIOS_18[Math.floor(Math.random()*DESAFIOS_18.length)]; await sock.sendMessage(jid,{text:`🎲 *DARE*\n│\n🔥 ${d}`},{quoted:seloBot}); return;}
        if(comando==="crush"){const membros=isGrupo?(await sock.groupMetadata(jid).catch(()=>({participants:[]}))).participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p)).filter(m=>m!==sender):[]; const alvo=membros.length>0?membros[Math.floor(Math.random()*membros.length)]:null; await sock.sendMessage(jid,{text:`💘 *CRUSH*\n│\n${alvo?`Teu crush secreto é @${alvo.split("@")[0]}! 😍`:"Sem membros!"}`,mentions:alvo?[alvo]:[]},{quoted:seloBot}); return;}
        if(["seduzir","beijo","abraco","tapa","flirt","casal"].includes(comando)){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}${comando}* @user`},{quoted:seloBot}); return;} const emojisAcao={seduzir:"😏",beijo:"😘",abraco:"🤗",tapa:"👋",flirt:"💋",casal:"💑"}; const frasesAcao={seduzir:[`😏 @${sender.split("@")[0]} está a seduzir @${alvo.split("@")[0]}! 🔥`],beijo:[`😘 @${sender.split("@")[0]} deu um beijo em @${alvo.split("@")[0]}! 💋`],abraco:[`🤗 @${sender.split("@")[0]} abraçou @${alvo.split("@")[0]}! ❤️`],tapa:[`👋 @${sender.split("@")[0]} deu um tapa em @${alvo.split("@")[0]}! 💥`],flirt:[`💋 @${sender.split("@")[0]} está a flirtar com @${alvo.split("@")[0]}! 😍`],casal:[`💑 @${sender.split("@")[0]} e @${alvo.split("@")[0]} estão juntos! ❤️`]}; const frases=frasesAcao[comando]||[`${emojisAcao[comando]} @${sender.split("@")[0]} → @${alvo.split("@")[0]}`]; await sock.sendMessage(jid,{text:frases[0],mentions:[sender,alvo]},{quoted:seloBot}); await reagir(sock,msg,emojisAcao[comando]||"💕"); return;}

        // ─── ADM ───
        if(comando==="bloq"){comandosBloqueados.add(jid); await sock.sendMessage(jid,{text:`🔒 *Comandos bloqueados!*`},{quoted:seloBot}); return;}
        if(comando==="desbloq"){comandosBloqueados.delete(jid); await sock.sendMessage(jid,{text:`🔓 *Comandos desbloqueados!*`},{quoted:seloBot}); return;}
        if(comando==="bot"){const op=args.join(" ").toLowerCase(); if(op.includes("off")){chatsDesativados.add(jid); await sock.sendMessage(jid,{text:`🔴 *BOT OFF!*`},{quoted:seloBot});}else if(op.includes("on")){chatsDesativados.delete(jid); await sock.sendMessage(jid,{text:`✅ *BOT ON!* 🤴🏽`},{quoted:seloBot});} return;}
        if(comando==="anti-link"){const op=args[0]?.toLowerCase(); if(op==="off"){antiLinkDesativado.add(jid); await sock.sendMessage(jid,{text:`⚠️ *Anti-link DESACTIVADO!*`},{quoted:seloBot});}else{antiLinkDesativado.delete(jid); await sock.sendMessage(jid,{text:`✅ *Anti-link ACTIVADO!*`},{quoted:seloBot});} return;}
        if(comando==="vozbot"){const op=args[0]?.toLowerCase(); if(op==="off"){vozBotDesativado.add(jid); await sock.sendMessage(jid,{text:`🔇 *Voz desactivada!*`},{quoted:seloBot});}else if(op==="on"){vozBotDesativado.delete(jid); await sock.sendMessage(jid,{text:`🎙️ *Voz activada!*`},{quoted:seloBot});}else{await sock.sendMessage(jid,{text:`🎙️ Estado: ${vozBotDesativado.has(jid)?"🔇 OFF":"🟢 ON"}`},{quoted:seloBot});} await reagir(sock,msg,"✅"); return;}
        if(comando==="silenciar"&&isGrupo){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`↩️ Responde com *${CONFIG.PREFIXO}silenciar*`},{quoted:seloBot}); return;} if(!membrosSilenciados[jid]) membrosSilenciados[jid]=[]; if(!membrosSilenciados[jid].includes(alvo)){membrosSilenciados[jid].push(alvo); salvarSilenciados();} await sock.sendMessage(jid,{text:`🔇 @${alvo.split("@")[0]} silenciado!`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"🔇"); return;}
        if(comando==="dessilenciar"&&isGrupo){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant); if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:`↩️ Responde com *${CONFIG.PREFIXO}dessilenciar*`},{quoted:seloBot}); return;} if(membrosSilenciados[jid]){membrosSilenciados[jid]=membrosSilenciados[jid].filter(m=>m!==alvo); salvarSilenciados();} await sock.sendMessage(jid,{text:`🔊 @${alvo.split("@")[0]} dessilenciado!`,mentions:[alvo]},{quoted:seloBot}); return;}
        if(comando==="silenciados"&&isGrupo){const lista=membrosSilenciados[jid]||[]; if(!lista.length) await sock.sendMessage(jid,{text:`🔊 Nenhum silenciado.`},{quoted:seloBot}); else await sock.sendMessage(jid,{text:`🔇 *Silenciados:*\n${lista.map((m,i)=>`${i+1}. @${m.split("@")[0]}`).join("\n")}`},{quoted:seloBot}); return;}
        if(comando==="nomegrupo"&&isGrupo){const novoNome=args.join(" ").trim(); if(!novoNome){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}nomegrupo [nome]*`},{quoted:seloBot}); return;} try{await sock.groupUpdateSubject(jid,novoNome); await sock.sendMessage(jid,{text:`✅ Nome: *${novoNome}*`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="descgrupo"&&isGrupo){const novaDesc=args.join(" ").trim(); if(!novaDesc){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}descgrupo [desc]*`},{quoted:seloBot}); return;} try{await sock.groupUpdateDescription(jid,novaDesc); await sock.sendMessage(jid,{text:`✅ Descrição actualizada!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="fotogrupo"&&isGrupo){const imgBuf=await downloadImagemDaMensagem(msg); if(!imgBuf){await sock.sendMessage(jid,{text:`↩️ Responde imagem com *${CONFIG.PREFIXO}fotogrupo*`},{quoted:seloBot}); return;} try{await sock.updateProfilePicture(jid,imgBuf); await sock.sendMessage(jid,{text:`✅ Foto actualizada!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="add"&&isGrupo){if(!args[0]){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}add [número]*`},{quoted:seloBot}); return;} let numero=args[0].replace(/[^\d]/g,""); if(numero.startsWith("00")) numero=numero.slice(2); if(numero.startsWith("244")&&numero.length===12){}else if(numero.length===9) numero=`244${numero}`; try{const result=await sock.groupParticipantsUpdate(jid,[`${numero}@s.whatsapp.net`],"add"); const status=result?.[0]?.status; if(status===200){await sock.sendMessage(jid,{text:`✅ +${numero} adicionado!`},{quoted:seloBot}); await reagir(sock,msg,"✅");}else if(status===408){await sock.sendMessage(jid,{text:`❌ Sem WhatsApp.`},{quoted:seloBot});}else if(status===403){await sock.sendMessage(jid,{text:`⚠️ Não permite adição.`},{quoted:seloBot});}else{await reagir(sock,msg,"✅");}}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="banir"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant); if(!alvo){await sock.sendMessage(jid,{text:"↩️ Responde a mensagem."},{quoted:seloBot}); return;} try{await sock.groupParticipantsUpdate(jid,[alvo],"remove"); await sock.sendMessage(jid,{text:`✅ @${alvo.split("@")[0]} BANIDO! 🔨`,mentions:[alvo]},{quoted:seloBot}); await reagir(sock,msg,"🔨");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="addadmin"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant); if(!alvo){await sock.sendMessage(jid,{text:"↩️ Responde a mensagem."},{quoted:seloBot}); return;} try{await sock.groupParticipantsUpdate(jid,[alvo],"promote"); await sock.sendMessage(jid,{text:`👑 @${alvo.split("@")[0]} é agora admin!`,mentions:[alvo]},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="removeadmin"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant); if(!alvo){await sock.sendMessage(jid,{text:"↩️ Responde a mensagem."},{quoted:seloBot}); return;} try{await sock.groupParticipantsUpdate(jid,[alvo],"demote"); await sock.sendMessage(jid,{text:`✅ Admin removido!`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="fechar"&&isGrupo){try{await sock.groupSettingUpdate(jid,"announcement"); await sock.sendMessage(jid,{text:"🔒 *Grupo fechado!*"},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="abrir"&&isGrupo){try{await sock.groupSettingUpdate(jid,"not_announcement"); await sock.sendMessage(jid,{text:"🔓 *Grupo aberto!*"},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="all"&&isGrupo){try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📢 *ATENÇÃO A TODOS!*\n\n${todos.map(p=>`@${p.split("@")[0]}`).join(" ")}`,mentions:todos},{quoted:seloBot}); await reagir(sock,msg,"📢");}catch{} return;}
        if(comando==="att"&&isGrupo){try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📣${todos.map(()=>"\u200B").join("")}`,mentions:todos},{quoted:seloBot}); await reagir(sock,msg,"📣");}catch{} return;}
        if(comando==="aviso"&&isGrupo){const avisoTxt=args.join(" "); if(!avisoTxt){await sock.sendMessage(jid,{text:`◎ ─ *${CONFIG.PREFIXO}aviso* [mensagem]`},{quoted:seloBot}); return;} try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📢 *AVISO!*\n✦ ─────────── ✦\n\n${avisoTxt}\n\n${todos.map(p=>`@${p.split("@")[0]}`).join(" ")}`,mentions:todos},{quoted:seloBot}); await reagir(sock,msg,"📢");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="link"&&isGrupo){try{const codigo=await sock.groupInviteCode(jid); await sock.sendMessage(jid,{text:`🔗 *LINK DO GRUPO*\n│\nhttps://chat.whatsapp.com/${codigo}`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:"❌ Erro."},{quoted:seloBot});} return;}
        if(comando==="sorteio"&&isGrupo){try{const meta=await sock.groupMetadata(jid),membros=meta.participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p)); if(!membros.length){await sock.sendMessage(jid,{text:"❌ Sem membros."},{quoted:seloBot}); return;} const vencedor=membros[Math.floor(Math.random()*membros.length)]; await sock.sendMessage(jid,{text:`🎉 *SORTEIO!*\n│\n🏆 @${vencedor.split("@")[0]}! 🎊`,mentions:[vencedor]},{quoted:seloBot}); await reagir(sock,msg,"🎉");}catch{} return;}
        if(comando==="verifica"&&isGrupo){const buffer=bufferMsgs[jid]||[]; try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)),infrat={}; for(const m of buffer){if(admins.includes(m.sender)||ehDono(m.sender)) continue; if(LINK_RX.test(m.texto)) infrat[m.sender]=true;} const lista=Object.keys(infrat); for(const inf of lista){try{await sock.groupParticipantsUpdate(jid,[inf],"remove");}catch{}} await sock.sendMessage(jid,{text:`✅ *${lista.length}* banido(s) por links!`},{quoted:seloBot}); await reagir(sock,msg,"🔨");}catch{} return;}
        if(comando==="apagar"&&isGrupo){const ctx3=msg.message?.extendedTextMessage?.contextInfo; if(!ctx3?.stanzaId){await sock.sendMessage(jid,{text:`↩️ Cita mensagem com *${CONFIG.PREFIXO}apagar*`},{quoted:seloBot}); return;} try{await sock.sendMessage(jid,{delete:{remoteJid:jid,id:ctx3.stanzaId,participant:ctx3.participant||""}}); await reagir(sock,msg,"🗑️");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}
        if(comando==="scanlink"){if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Só em grupos."},{quoted:seloBot}); return;} const historico=historyMsgs[jid]||[]; if(!historico.length){await sock.sendMessage(jid,{text:`📭 Sem histórico.`},{quoted:seloBot}); return;} let loadMsg=null; try{loadMsg=await sock.sendMessage(jid,{text:`🔍 A varrer ${historico.length} msgs...\n\n${FRAMES_LOADING[0]}`},{quoted:seloBot});}catch{} try{const meta=await sock.groupMetadata(jid); const admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)); const membrosActuais=new Set(meta.participants.map(p=>extrairJid(p.id||p))); let deletados=0,banidos=0; const banidosSet=new Set(); const linksEncontrados=[]; for(const h of historico){if(!h.texto||!LINK_RX.test(h.texto)) continue; if(admins.includes(h.sender)||ehDono(h.sender)) continue; linksEncontrados.push(h);} if(loadMsg){try{await sock.sendMessage(jid,{text:`🔍 A varrer ${historico.length} msgs...\n\n${FRAMES_LOADING[5]}`,edit:loadMsg.key});}catch{}} await new Promise(r=>setTimeout(r,300)); if(!linksEncontrados.length){await sock.sendMessage(jid,{text:`✅ Chat LIMPO! 🎉`},{quoted:seloBot}); await reagir(sock,msg,"✅"); return;} for(const h of linksEncontrados){try{await sock.sendMessage(jid,{delete:h.key}); deletados++;}catch{} await new Promise(r=>setTimeout(r,300));} for(const h of linksEncontrados){if(banidosSet.has(h.sender)||!membrosActuais.has(h.sender)) continue; try{await sock.groupParticipantsUpdate(jid,[h.sender],"remove"); await sock.sendMessage(jid,{text:`🚨 @${h.sender.split("@")[0]} — *BAN!*`,mentions:[h.sender]}); banidosSet.add(h.sender); banidos++;}catch{} await new Promise(r=>setTimeout(r,500));} historyMsgs[jid]=[]; await sock.sendMessage(jid,{text:`✅ *SCAN CONCLUÍDO!*\n│\n◎ ─ 🗑️ Eliminadas: *${deletados}*\n◎ ─ 🔨 Banidos: *${banidos}*`},{quoted:seloBot}); await reagir(sock,msg,"🔨");}catch(e){await sock.sendMessage(jid,{text:`❌ Erro: ${e.message}`},{quoted:seloBot});} return;}

        // ─── DONO ───
        if(comando==="chaton"){const ativos=[...gruposAtivados]; if(!ativos.length){await sock.sendMessage(jid,{text:`📭 Nenhum grupo activo.`},{quoted:seloBot}); return;} try{const grupos=await sock.groupFetchAllParticipating(); const linhas=ativos.map((gJid,i)=>{const nome=grupos[gJid]?.subject||gJid; const membros=grupos[gJid]?.participants?.length||"?"; return `◎ ─ *${i+1}.* 🟢 *${nome}*\n   👥 ${membros} membros`;}).join("\n│\n"); await sock.sendMessage(jid,{text:`🏘️ *GRUPOS ACTIVOS (${ativos.length})*\n│\n${linhas}`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}

        if(comando==="sms"){const ativos=[...gruposAtivados]; if(!ativos.length){await sock.sendMessage(jid,{text:`❌ Nenhum grupo activo.`},{quoted:seloBot}); return;} if(!args.length){try{const grupos=await sock.groupFetchAllParticipating(); const lista=ativos.map((gJid,i)=>`◎ ─ *${i+1}.* ${grupos[gJid]?.subject||gJid}`).join("\n"); await sock.sendMessage(jid,{text:`📢 *SMS PRIVADA*\n│\n${lista}\n│\n◎ ─ *${CONFIG.PREFIXO}sms [nº] [msg]*`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;} const{grupoJid,mensagem}=await encontrarGrupoPorArg(sock,[...gruposAtivados],args); if(!grupoJid){await sock.sendMessage(jid,{text:`❌ Grupo não encontrado.`},{quoted:seloBot}); return;} if(!mensagem.trim()){await sock.sendMessage(jid,{text:`❌ Escreve a mensagem!`},{quoted:seloBot}); return;} try{const grupos=await sock.groupFetchAllParticipating(); const nomeGrupo=grupos[grupoJid]?.subject||"Grupo"; const meta=await sock.groupMetadata(grupoJid); const membros=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(jid,{text:`📤 A enviar para *${membros.length}* membros...\n⏳`},{quoted:seloBot}); let enviados=0,erros=0; for(const membro of membros){if(ehDono(membro)) continue; try{await sock.sendMessage(membro,{text:`📢 *Mensagem Privada*\n✦ ─────────── ✦\n\n${mensagem}\n\n✦ ─────────── ✦\n_${CONFIG.DONO_NOME}_\n_${nomeGrupo}_`}); enviados++; await new Promise(r=>setTimeout(r,600));}catch{erros++;}} await sock.sendMessage(jid,{text:`✅ SMS!\n📊 ${enviados} enviados | ❌ ${erros} erros`},{quoted:seloBot}); await reagir(sock,msg,"📢");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}

        if(comando==="gsms"){const ativos=[...gruposAtivados]; if(!ativos.length){await sock.sendMessage(jid,{text:`❌ Nenhum grupo activo.`},{quoted:seloBot}); return;} if(!args.length){try{const grupos=await sock.groupFetchAllParticipating(); const lista=ativos.map((gJid,i)=>`◎ ─ *${i+1}.* ${grupos[gJid]?.subject||gJid}`).join("\n"); await sock.sendMessage(jid,{text:`📣 *AVISO NO GRUPO*\n│\n${lista}\n│\n◎ ─ *${CONFIG.PREFIXO}gsms [nº] [msg]*`},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;} const{grupoJid,mensagem}=await encontrarGrupoPorArg(sock,[...gruposAtivados],args); if(!grupoJid){await sock.sendMessage(jid,{text:`❌ Grupo não encontrado.`},{quoted:seloBot}); return;} if(!mensagem.trim()){await sock.sendMessage(jid,{text:`❌ Escreve a mensagem!`},{quoted:seloBot}); return;} try{const meta=await sock.groupMetadata(grupoJid); const todos=meta.participants.map(p=>extrairJid(p.id||p)); await sock.sendMessage(grupoJid,{text:`📣 *AVISO!*\n✦ ─────────── ✦\n\n${mensagem}\n\n✦ ─────────── ✦\n${todos.map(()=>"\u200B").join("")}`,mentions:todos}); await sock.sendMessage(jid,{text:`✅ Aviso enviado!\n👥 ${todos.length} mencionados`},{quoted:seloBot}); await reagir(sock,msg,"📣");}catch(e){await sock.sendMessage(jid,{text:`❌ ${e.message}`},{quoted:seloBot});} return;}

        if(comando==="info"){await sock.sendMessage(jid,{text:`◎ ─ Usa *${CONFIG.PREFIXO}menu*\n◎ ─ Ou fala: _"Isaías, ..."_ 🤖`},{quoted:seloBot}); return;}

      }catch(e){console.error("❌ Erro handler:",e.message); try{await reagir(sock,msg,"❌");}catch{}}
    });

  }catch(e){
    console.error("❌ Erro crítico startBot:",e.message);
    tentativasReconexao++;
    setTimeout(()=>startBot(),Math.min(5000*tentativasReconexao,60000));
  }
}

startBot();
