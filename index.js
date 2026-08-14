require("dotenv").config();
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
fs.ensureDirSync("./dados");

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const CONFIG = {
  PREFIXO:         "!",
  NUMERO_BOT:      "244954260707",
  NUMEROS_ADM:     ["926612801","244926612801","169853876965546"],
  GROQ_KEY: process.env.GROQ_API_KEY || '',
  DONO_JID:        "169853876965546@lid",
  DONO_NOME:       "ISAÍAS PEDRO",
  DONO_NUM:        "926 612 801",
  VOZ_TTS:         "pt-PT-DuarteNeural",
  SENHA_BOT:       "lordinho2025",
  CANAL_URL:       "https://whatsapp.com/channel/0029VbDBkEcK5cDMSt0E4r0Q",
  NOME_BOT:        "LORDE LÁ DJUM",
  SCRAPER_HUB_URL: process.env.SCRAPER_HUB_URL||"http://localhost:3000",
  IS_SERVER:       !!(process.env.RENDER||process.env.RAILWAY||process.env.NODE_ENV==="production"),
};

const httpsAgent = new https.Agent({rejectUnauthorized:false,keepAlive:true,timeout:60000});
const silentLogger={level:"silent",child:()=>silentLogger,info:()=>{},warn:()=>{},error:()=>{},debug:()=>{},trace:()=>{},fatal:()=>{}};
const errosComando={};
let ppBotUrl=null, botFotoBuffer=null;
const BOT_FOTO_PATH="./dados/bot_foto.jpg";
if(fs.existsSync(BOT_FOTO_PATH)){try{botFotoBuffer=fs.readFileSync(BOT_FOTO_PATH);}catch{}}
let YTDLP_CMD="yt-dlp", FFMPEG_CMD="ffmpeg", EDGETTS_CMD="edge-tts";

process.on("uncaughtException",e=>{if(e.code==="ENOENT"&&e.path&&(e.path.includes("-enc")||e.path.includes("/tmp/"))) return;console.error("❌",e.message);});
process.on("unhandledRejection",r=>{const m=r?.message||String(r);if(m.includes("-enc")||m.includes("Media upload")) return;console.error("❌",m);});

// ════════════════════════════════════════════════
// ✅ ESTÉTICA Cases.js style
// ════════════════════════════════════════════════
const B_TOP="┏┉∴°𝄪⸗.⠡∝┅┈°.ᰔᩚ.°┈┅∝⠡.⸗𝄪°∴┉┓";
const B_MID="┣┉∴°𝄪⸗.⠡∝┅┈°.ᰔᩚ.°┈┅∝⠡.⸗𝄪°∴┉┛";
const B_BOT="┗┉∴°𝄪⸗.⠡∝┅┈°.ᰔᩚ.°┈┅∝⠡.⸗𝄪°∴┉┛";
const B_SEP="╎";
function bTitle(t){return `┋𝄪°⠡⸗𝄪﹝${t}﹞`;}
function bLine(emoji,texto){return `┋°‧․ˑ${emoji}⃟⠥ʿ⇢ ${texto}`;}
function bBloco(titulo,linhas){return [B_TOP,bTitle(titulo),B_MID,...linhas,B_BOT].join("\n");}

// ════════════════════════════════════════════════
// ✅ EMOJIS DO MENU
// ════════════════════════════════════════════════
const EMOJIS_PATH="./dados/emojis.json";
function carregarEmojis(){try{return fs.readJsonSync(EMOJIS_PATH);}catch{return{e:"🌀",principal:"🌀",downloads:"⬇️",figurinhas:"🎭",brincadeiras:"🎮",coins:"💰",alteradores:"🎵",logos:"🎨",mais18:"🔞",adm:"🛡️",dono:"👑",musicas:"🎵",pesquisas:"🔍",animes:"🎌",rpg:"⚔️",ias:"🤖",plaquinhas:"🪧",extras:"⭐",assistente:"🤖"};}}
function salvarEmojis(e){try{fs.writeJsonSync(EMOJIS_PATH,e);}catch{}}
let ME=carregarEmojis();

// ════════════════════════════════════════════════
// ✅ BANCOS DE DADOS
// ════════════════════════════════════════════════
const CANTADAS_BANCO=["Você tem wi-fi? Porque eu sinto uma conexão entre a gente.","Seu nome é Google? Porque você tem tudo que eu procuro.","Você acredita em amor à primeira vista, ou preciso passar de novo?","Se você fosse uma música, seria aquela que não sai da minha cabeça.","Você não é a Monalisa, mas é uma obra de arte.","Meu coração sempre capota na curva do seu sorriso.","Seus pais são matemáticos? Porque você é um produto notável.","Meu amor por você é como Pi: irracional e infinito.","Com licença, mas você me deve uma bebida… derrubei a minha quando te vi.","Me empresta uma foto sua para mostrar ao Papai Noel o que quero de presente!","Posso te seguir? Porque a minha mãe me disse para seguir meus sonhos."];
const INUNCA_BANCO=["Eu nunca vomitei na frente de outras pessoas.","Eu nunca soltei pum em elevador e fingi que não fui eu.","Eu nunca deixei o celular cair na privada.","Eu nunca fui a uma festa sem ser chamado.","Eu nunca ri tanto que fiz um pouco de xixi.","Eu nunca criei uma conta falsa nas redes sociais.","Eu nunca usei a escova de dentes de outra pessoa.","Eu nunca culpei outra pessoa por um erro meu.","Eu nunca fingi estar no celular para evitar alguém.","Eu nunca fui expulso da sala de aula.","Eu nunca me arrependi imediatamente após enviar uma mensagem.","Eu nunca chorei no transporte público.","Eu nunca caí na rua porque estava olhando o celular."];
const CONSELHOS_BIBLICOS=["\"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.\" — João 3:16","\"O Senhor é o meu pastor, nada me faltará.\" — Salmos 23:1","\"Tudo posso naquele que me fortalece.\" — Filipenses 4:13","\"Não temas, porque eu sou contigo.\" — Isaías 41:10","\"Entrega o teu caminho ao Senhor, confia nele.\" — Salmos 37:5","\"O amor é paciente, o amor é bondoso.\" — 1 Coríntios 13:4","\"Com Deus, tudo é possível.\" — Mateus 19:26"];
const SIGNOS_INFO={aries:{nome:"Áries",data:"21 Mar - 19 Abr",elem:"🔥 Fogo",regente:"♂️ Marte",emoji:"♈"},touro:{nome:"Touro",data:"20 Abr - 20 Mai",elem:"🌍 Terra",regente:"♀️ Vênus",emoji:"♉"},gemeos:{nome:"Gêmeos",data:"21 Mai - 20 Jun",elem:"💨 Ar",regente:"☿️ Mercúrio",emoji:"♊"},cancer:{nome:"Câncer",data:"21 Jun - 22 Jul",elem:"💧 Água",regente:"🌙 Lua",emoji:"♋"},leao:{nome:"Leão",data:"23 Jul - 22 Ago",elem:"🔥 Fogo",regente:"☀️ Sol",emoji:"♌"},virgem:{nome:"Virgem",data:"23 Ago - 22 Set",elem:"🌍 Terra",regente:"☿️ Mercúrio",emoji:"♍"},libra:{nome:"Libra",data:"23 Set - 22 Out",elem:"💨 Ar",regente:"♀️ Vênus",emoji:"♎"},escorpiao:{nome:"Escorpião",data:"23 Out - 21 Nov",elem:"💧 Água",regente:"♂️ Marte",emoji:"♏"},sagitario:{nome:"Sagitário",data:"22 Nov - 21 Dez",elem:"🔥 Fogo",regente:"♃ Júpiter",emoji:"♐"},capricornio:{nome:"Capricórnio",data:"22 Dez - 19 Jan",elem:"🌍 Terra",regente:"♄ Saturno",emoji:"♑"},aquario:{nome:"Aquário",data:"20 Jan - 18 Fev",elem:"💨 Ar",regente:"⛢ Urano",emoji:"♒"},peixes:{nome:"Peixes",data:"19 Fev - 20 Mar",elem:"💧 Água",regente:"♆ Netuno",emoji:"♓"}};
const ANIMES_INFO=[{nome:"Naruto",gen:"Ação/Aventura",ep:"720",nota:"8.3"},{nome:"One Piece",gen:"Aventura",ep:"1000+",nota:"9.0"},{nome:"Dragon Ball Z",gen:"Ação",ep:"291",nota:"8.8"},{nome:"Attack on Titan",gen:"Ação/Drama",ep:"87",nota:"9.0"},{nome:"Death Note",gen:"Thriller",ep:"37",nota:"9.0"},{nome:"Demon Slayer",gen:"Ação",ep:"44+",nota:"8.7"},{nome:"My Hero Academia",gen:"Super-herói",ep:"150+",nota:"8.4"},{nome:"Jujutsu Kaisen",gen:"Ação",ep:"47+",nota:"8.7"},{nome:"Hunter x Hunter",gen:"Aventura",ep:"148",nota:"9.0"}];
const VERDADES_18=["Qual foi tua maior saia justa?","Tens crush em alguém aqui no grupo?","Já mandaste msg para a pessoa errada?","Qual foi o momento mais embaraçoso da tua vida?"];
const DESAFIOS_18=["Canta uma música a cappella","Faz 20 flexões agora","Manda uma selfie feia","Escreve um poema sobre o dono do bot","Dança por 30 segundos"];
const PERFIS_ELOGIO=["🌟 Um ser extraordinário! Líder nato, coração de ouro!","👑 O verdadeiro rei! Inteligente, divertido!","🔥 Pura energia! Um talento raro!","💎 Raro como diamante! Leal e honesto!"];
const PERFIS_ZOADA=["😂 Deus criou esta pessoa e perguntou: 'O que fiz?!' 💀","🤣 A face assusta os espelhos! 💀","😭 Esta pessoa chegou e o WiFi ficou lento! 🚶🏿‍♂️","🤡 Acorda às 6h, olha pro espelho e volta a dormir! 😂"];
const PALAVRAS_VELOCIDADE=["programacao","desenvolvimento","inteligencia","javascript","angola","futebol","diamante","computador","tecnologia"];
const MATEMATICA_BANCO=()=>{const a=Math.floor(Math.random()*50)+1,b=Math.floor(Math.random()*50)+1,ops=["+","-","*"];const op=ops[Math.floor(Math.random()*ops.length)];let r;if(op==="+")r=a+b;else if(op==="-")r=a-b;else r=a*b;return{pergunta:`*${a} ${op} ${b}*`,resposta:String(r)};};

const RPG_PATH="./dados/rpg.json";
let rpgPersonagens={};
try{rpgPersonagens=fs.readJsonSync(RPG_PATH)||{};}catch{}
function salvarRpg(){try{fs.writeJsonSync(RPG_PATH,rpgPersonagens);}catch{}}

// ════════════════════════════════════════════════
// ✅ SIMILARIDADE DE COMANDOS
// ════════════════════════════════════════════════
function levenshtein(a,b){const m=a.length,n=b.length;const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){if(a[i-1]===b[j-1]) dp[i][j]=dp[i-1][j-1];else dp[i][j]=1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);}return dp[m][n];}

function encontrarComandoSimilar(cmdErrado,todosComandos){
  const cmd=cmdErrado.toLowerCase().trim();
  let melhor=null, melhorScore=Infinity;
  for(const c of todosComandos){
    // Score combinado: Levenshtein + prefix match + contains
    let score=levenshtein(cmd,c);
    if(c.startsWith(cmd)||cmd.startsWith(c)) score-=2;
    if(c.includes(cmd)||cmd.includes(c)) score-=1;
    if(score<melhorScore){melhorScore=score;melhor=c;}
  }
  // Só sugere se for razoavelmente próximo
  if(melhorScore<=4) return melhor;
  return null;
}

// Frases carinhosas para comando errado
const FRASES_ERRO=[
  "Ei {user}, tás bem? 😄",
  "Calma {user}, não te preocupes! 😊",
  "Haha {user}, quase lá! 😂",
  "Ei {user}, deixa eu te ajudar! 🤝",
  "Boa tentativa {user}! 😉",
  "Não desistas {user}! 💪",
];

function fraseCarinho(nomeUser){
  const f=FRASES_ERRO[Math.floor(Math.random()*FRASES_ERRO.length)];
  return f.replace("{user}",nomeUser);
}

// Stickers de reacção ao erro (URLs de imagem que serão convertidos)
const ERRO_STICKER_TEXTS=["🤔","😅","😂","🥲","😬","🤭"];

// ════════════════════════════════════════════════
// ✅ AUTO-SETUP
// ════════════════════════════════════════════════
async function autoSetup(){
  console.log("\n🔧 A verificar dependências...");
  const ytPaths=["yt-dlp","python3 -m yt_dlp","/usr/local/bin/yt-dlp","/usr/bin/yt-dlp"];
  let ytFound=false;
  for(const cmd of ytPaths){try{execSync(`${cmd} --version`,{stdio:"pipe",timeout:8000});YTDLP_CMD=cmd;ytFound=true;console.log(`✅ yt-dlp: ${cmd}`);break;}catch{}}
  if(!ytFound){const cmds=["pip install yt-dlp --break-system-packages","pip3 install yt-dlp --break-system-packages","pip install yt-dlp"];for(const c of cmds){try{execSync(c,{stdio:"pipe",timeout:90000});YTDLP_CMD="yt-dlp";ytFound=true;console.log("✅ yt-dlp instalado!");break;}catch{}}}
  const ffPaths=["ffmpeg","/usr/bin/ffmpeg","/usr/local/bin/ffmpeg"];
  for(const cmd of ffPaths){try{execSync(`${cmd} -version`,{stdio:"pipe",timeout:5000});FFMPEG_CMD=cmd;console.log(`✅ ffmpeg: ${cmd}`);break;}catch{}}
  const edgePaths=["edge-tts","python3 -m edge_tts"];
  for(const cmd of edgePaths){try{execSync(`${cmd} --version`,{stdio:"pipe",timeout:5000});EDGETTS_CMD=cmd;console.log(`✅ edge-tts: ${cmd}`);break;}catch{}}
  if(ytFound){try{execSync(`${YTDLP_CMD} -U`,{stdio:"pipe",timeout:60000});console.log("✅ yt-dlp actualizado!");}catch{}}
  if(CONFIG.IS_SERVER)console.log("\n⚠️ SERVIDOR — usando proxies para YouTube\n");
  console.log("✅ Setup concluído!\n");
}

// ════════════════════════════════════════════════
// ✅ PROXIES YOUTUBE (Render)
// ════════════════════════════════════════════════
const PIPED_INSTANCES=["https://pipedapi.kavin.rocks","https://piped-api.garudalinux.org","https://api.piped.yt","https://pipedapi.adminforge.de"];
const INVIDIOUS_INSTANCES=["https://yewtu.be","https://invidious.io.lol","https://inv.nadeko.net"];
async function buscarYouTubePiped(query){for(const inst of PIPED_INSTANCES){try{const{data}=await axios.get(`${inst}/search?q=${encodeURIComponent(query)}&filter=videos`,{timeout:10000,httpsAgent});const vs=data?.items?.filter(i=>i.type==="stream")||[];if(vs.length)return vs.slice(0,5).map(v=>({title:v.title,url:`https://www.youtube.com/watch?v=${v.url?.replace("/watch?v=","")||v.videoId}`,duration:v.duration,uploader:v.uploaderName||"N/A",thumbnail:v.thumbnail||null,pipedUrl:`${inst}${v.url}`}));}catch{continue;}}return[];}
function getYtDlpArgs(){
  // ios player client bypasses YouTube "Sign in to confirm you're not a bot"
  return '--no-check-certificate --no-playlist --no-warnings --force-ipv4 --geo-bypass --extractor-args "youtube:player_client=ios,android_vr,tv_embedded" --retries 3 --sleep-interval 1';
}

// ════════════════════════════════════════════════
// ✅ ARQUIVOS DE DADOS
// ════════════════════════════════════════════════
const ARQUIVO_RANK="./dados/rank.json",ARQUIVO_STATS="./dados/stats.json",ARQUIVO_ATIVOS="./dados/ativos.json",ARQUIVO_SILENCIADOS="./dados/silenciados.json",ARQUIVO_COINS="./dados/coins.json",ARQUIVO_COOLDOWNS="./dados/cooldowns.json",ARQUIVO_VIPS="./dados/vips.json",ARQUIVO_ALUGUEL="./dados/aluguel.json";
[ARQUIVO_RANK,ARQUIVO_STATS,ARQUIVO_ATIVOS,ARQUIVO_SILENCIADOS,ARQUIVO_COINS,ARQUIVO_COOLDOWNS,ARQUIVO_VIPS,ARQUIVO_ALUGUEL].forEach(f=>{if(!fs.existsSync(f)){if(f.includes("stats"))fs.writeJsonSync(f,{total:0,comandos:{},usuarios:{}});else fs.writeJsonSync(f,{});}});

// ════ SISTEMA DE CASES (Comandos dinâmicos) ════
const CASES_CODE_PATH="./dados/cases_code.json";
function carregarCases(){try{return fs.readJsonSync(CASES_CODE_PATH);}catch{return{};}}
function salvarCases(d){try{fs.writeJsonSync(CASES_CODE_PATH,d);}catch{}}
function nomeCaseLimpo(n){return n.toLowerCase().trim().replace(/[^a-z0-9_]/g,"").slice(0,30);}

// ════ SISTEMA DE ALUGUEL ════
function carregarAluguel(){try{return fs.readJsonSync(ARQUIVO_ALUGUEL);}catch{return{};}}
function salvarAluguelData(d){try{fs.writeJsonSync(ARQUIVO_ALUGUEL,d);}catch{}}
function ativarAluguel(jid,dias){
  const d=carregarAluguel();
  const expira=Date.now()+(dias*24*60*60*1000);
  d[jid]={ativadoEm:Date.now(),expiraEm:expira,dias};
  salvarAluguelData(d);
  return expira;
}
function verificarAluguel(jid){
  if(!jid.endsWith("@g.us"))return true; // privado sempre ok
  const d=carregarAluguel();
  const al=d[jid];
  if(!al)return false;
  if(Date.now()>al.expiraEm){
    delete d[jid];
    salvarAluguelData(d);
    return false; // expirou
  }
  return true;
}
function infoAluguel(jid){const d=carregarAluguel();return d[jid]||null;}
function diasRestantes(jid){const al=infoAluguel(jid);if(!al)return 0;return Math.max(0,Math.ceil((al.expiraEm-Date.now())/(24*60*60*1000)));}
// Verifica expiração e notifica o grupo
async function verificarExpiracaoAluguel(sock,jid){
  const d=carregarAluguel();
  const al=d[jid];
  if(!al)return;
  if(Date.now()>al.expiraEm){
    delete d[jid];
    salvarAluguelData(d);
    try{await sock.sendMessage(jid,{text:bBloco("⏰ ALUGUEL EXPIRADO",[bLine("❌","O aluguel deste grupo expirou!"),bLine("💰",`Contacta *${CONFIG.DONO_NUM}* para renovar.`)])});}catch{}
  }
}

// ════════════════════════════════════════════════
// ✅ ESTADOS EM MEMÓRIA
// ════════════════════════════════════════════════
const membrosSilenciados={},jogoAtivo={},jogoLoop={},bufferMsgs={},cacheMsg={},msgApagadas={};
const banEmCurso=new Set(),historyMsgs={},menuEsperandoResposta=new Map();
const senhasAprovadas=new Set(),gruposAtivados=new Set(),pedidoSenha=new Set();
const chatsDesativados=new Set(),vozBotDesativado=new Set(),comandosBloqueados=new Set();
const antiLinkDesativado=new Set(),cacheViewOnce={};
const jogoAdivinhar={},jogoVelocidade={};
const playCacheMap=new Map();
// ✅ ASSISTENTE — apenas responde quando mencionado em grupos
const assistenteAtivo=new Set();
const assistenteHistoria={};
const MAX_HISTORIA_IA=20,MAX_BUFFER=100,MAX_CACHE_MSG=200,MAX_HISTORY=1000;
assistenteAtivo._timers={};
const NOMES_ASSISTENTE=["isaias","isaías","isaia","isáia","izaias","izaia"];
const MENU_NUMEROS={"1":"cat_principal","2":"cat_downloads","3":"cat_musicas","4":"cat_figurinhas","5":"cat_brincadeiras","6":"cat_coins","7":"cat_alteradores","8":"cat_logos","9":"cat_pesquisas","0":"cat_18"};
const LINK_RX=/(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/|bit\.ly|youtu\.be|youtube\.com|facebook\.com|instagram\.com|tiktok\.com|wa\.me)/i;
const STATUS_MENCAO_RX=/status\s*@|'s status|was mentioned/i;
try{const s=fs.readJsonSync(ARQUIVO_SILENCIADOS);for(const[j,l] of Object.entries(s))membrosSilenciados[j]=l;}catch{}

// ════════════════════════════════════════════════
// ✅ HELPERS
// ════════════════════════════════════════════════
function ehDono(s){if(!s)return false;const n=String(s).split("@")[0].split(":")[0].replace(/\D/g,"");if(!n)return false;return CONFIG.NUMEROS_ADM.some(d=>{const dn=d.replace(/\D/g,"");return n===dn||n.endsWith(dn)||dn.endsWith(n);});}
function extrairJid(p){if(!p)return "";if(typeof p==="string")return p;if(typeof p==="object"&&p.id)return p.id;return String(p);}
function removerAcentos(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function formatarDuracao(seg){if(!seg||isNaN(seg))return "N/A";const m=Math.floor(seg/60),s=Math.floor(seg%60);return `${m}:${s.toString().padStart(2,"0")}`;}

// ✅ FUNÇÃO getTexto — só retorna texto real, ignora mídia sem legenda
function getTexto(msg){
  const m=msg?.message;
  if(!m)return "";
  // Texto puro
  if(m.conversation)return m.conversation;
  if(m.extendedTextMessage?.text)return m.extendedTextMessage.text;
  // Legenda de mídia (só conta se tiver texto)
  if(m.imageMessage?.caption)return m.imageMessage.caption;
  if(m.videoMessage?.caption)return m.videoMessage.caption;
  if(m.documentMessage?.caption)return m.documentMessage.caption;
  // Sticker, áudio, etc. sem texto = vazio
  return "";
}

// ✅ Detecta se mensagem é apenas mídia (sem texto)
function eMidiaSemTexto(msg){
  const m=msg?.message;
  if(!m)return false;
  const temTexto=getTexto(msg).trim().length>0;
  if(temTexto)return false;
  // Sticker, imagem sem legenda, vídeo sem legenda, áudio, ptt
  return !!(m.stickerMessage||m.imageMessage||m.videoMessage||m.audioMessage||m.pttMessage||m.viewOnceMessage||m.viewOnceMessageV2);
}

function calcularSeguro(expr){const safe=expr.replace(/[^0-9+\-*/().%\s]/g,"").trim();if(!safe)throw new Error("Inválida");return Function(`"use strict";return(${safe})`)();}
function gerarGrade(palavra){const tam=8,letras="ABCDEFGHIJKLMNOPQRSTUVWXYZ";const grade=Array(tam).fill(null).map(()=>Array(tam).fill(null).map(()=>letras[Math.floor(Math.random()*26)]));const linha=Math.floor(Math.random()*tam),col=Math.floor(Math.random()*(tam-palavra.length));for(let i=0;i<palavra.length;i++)grade[linha][col+i]=palavra[i];return grade.map(r=>r.join(" ")).join("\n");}
function mostrarGuerraEstado(jogo){const vidas=["❤️❤️❤️❤️❤️❤️","🧡❤️❤️❤️❤️❤️","🧡🧡❤️❤️❤️❤️","🧡🧡🧡❤️❤️❤️","🧡🧡🧡🧡❤️❤️","🧡🧡🧡🧡🧡❤️","💀💀💀💀💀💀"];const pM=jogo.palavra.split("").map(l=>jogo.letrasAcertadas.includes(l)?l:"_").join(" ");const eS=jogo.letrasErradas.length>0?jogo.letrasErradas.join(", "):"Nenhuma";return bBloco("⚔️ FORCA",[bLine("🔤",`*${pM}*`),bLine("💡",`_${jogo.dica}_`),vidas[Math.min(jogo.letrasErradas.length,6)],bLine("❌",`Erradas: *${eS}*`),bLine("💬","_Digita uma letra!_")]);}
function selecionarSemRepetir(banco,usadas){const disp=banco.filter(item=>{const id=item.p||item.palavra||item.c||item.i;return!usadas.includes(id);});if(!disp.length)return null;return disp[Math.floor(Math.random()*disp.length)];}
function ehMencaoStatus(msg,texto){if(msg.message?.statusMentionMessage)return true;if(texto&&STATUS_MENCAO_RX.test(texto))return true;const ctx=msg.message?.extendedTextMessage?.contextInfo;if(ctx?.remoteJid?.includes("status@broadcast"))return true;return false;}
function getTipoMsg(msg){const m=msg?.message;if(!m)return "📄";if(m.conversation||m.extendedTextMessage)return "💬";if(m.imageMessage)return "🖼️";if(m.videoMessage)return "🎥";if(m.audioMessage||m.pttMessage)return "🎙️";if(m.stickerMessage)return "🎭";return "📄";}
function salvarNoBuffer(jid,d){if(!bufferMsgs[jid])bufferMsgs[jid]=[];bufferMsgs[jid].push(d);if(bufferMsgs[jid].length>MAX_BUFFER)bufferMsgs[jid].shift();}
function salvarSilenciados(){try{fs.writeJsonSync(ARQUIVO_SILENCIADOS,membrosSilenciados);}catch{}}
function salvarStats(cmd,sender){try{const s=fs.readJsonSync(ARQUIVO_STATS);s.total=(s.total||0)+1;s.comandos[cmd]=(s.comandos[cmd]||0)+1;s.usuarios[String(sender).split("@")[0]]=(s.usuarios[String(sender).split("@")[0]]||0)+1;fs.writeJsonSync(ARQUIVO_STATS,s);}catch{}}
function addXP(sender,xp=2){try{const r=fs.readJsonSync(ARQUIVO_RANK);const n=String(sender).split("@")[0];if(!r[n])r[n]={xp:0,nivel:1,msgs:0};r[n].xp+=xp;r[n].msgs+=1;r[n].nivel=Math.floor(r[n].xp/100)+1;fs.writeJsonSync(ARQUIVO_RANK,r);}catch{}}
function registarAtividade(sender,jid){try{const a=fs.readJsonSync(ARQUIVO_ATIVOS);if(!a[jid])a[jid]={};a[jid][String(sender)]=Date.now();fs.writeJsonSync(ARQUIVO_ATIVOS,a);}catch{}}
const userRateLimit={};
function verificarRateLimit(s){const a=Date.now();if(userRateLimit[s]&&(a-userRateLimit[s])<2000)return false;userRateLimit[s]=a;return true;}
function detectarWakeWord(txt){if(!txt)return null;const palavras=txt.trim().split(/\s+/);const padroes=["isaias","izaias","isaia","izaia"];for(let i=0;i<Math.min(4,palavras.length);i++){const pl=removerAcentos(palavras[i].toLowerCase()).replace(/[^a-z]/g,"");if(padroes.includes(pl))return palavras.slice(i+1).join(" ").trim();}return null;}

// ════════════════════════════════════════════════
// ✅ COINS & VIP
// ════════════════════════════════════════════════
function getCoins(s){try{const c=fs.readJsonSync(ARQUIVO_COINS);return c[s]?.moedas||0;}catch{return 0;}}
function setCoins(s,n){try{const c=fs.readJsonSync(ARQUIVO_COINS);if(!c[s])c[s]={moedas:0};c[s].moedas=Math.max(0,n);fs.writeJsonSync(ARQUIVO_COINS,c);}catch{}}
function addCoins(s,n){try{const c=fs.readJsonSync(ARQUIVO_COINS);if(!c[s])c[s]={moedas:0};c[s].moedas+=n;fs.writeJsonSync(ARQUIVO_COINS,c);}catch{}}
function getCooldown(s,t){try{const c=fs.readJsonSync(ARQUIVO_COOLDOWNS);return c[`${s}_${t}`]||0;}catch{return 0;}}
function setCooldown(s,t){try{const c=fs.readJsonSync(ARQUIVO_COOLDOWNS);c[`${s}_${t}`]=Date.now();fs.writeJsonSync(ARQUIVO_COOLDOWNS,c);}catch{}}
function isVip(sender){if(ehDono(sender))return true;try{const v=fs.readJsonSync(ARQUIVO_VIPS);return!!v[sender];}catch{return false;}}
function addVip(sender,nome="VIP"){try{const v=fs.readJsonSync(ARQUIVO_VIPS);v[sender]={nome,desde:Date.now()};fs.writeJsonSync(ARQUIVO_VIPS,v);}catch{}}
function removeVip(sender){try{const v=fs.readJsonSync(ARQUIVO_VIPS);delete v[sender];fs.writeJsonSync(ARQUIVO_VIPS,v);}catch{}}
function listarVips(){try{return fs.readJsonSync(ARQUIVO_VIPS);}catch{return{};}}

// ════════════════════════════════════════════════
// ✅ PLAY CACHE
// ════════════════════════════════════════════════
function salvarPlayCache(dados){const chave=`play_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;playCacheMap.set(chave,{...dados,criadoEm:Date.now()});setTimeout(()=>playCacheMap.delete(chave),10*60*1000);return chave;}
function obterPlayCache(chave){return playCacheMap.get(chave)||null;}
function removerPlayCache(chave){playCacheMap.delete(chave);}

// ════════════════════════════════════════════════
// ✅ SELO
// ════════════════════════════════════════════════
function criarSeloBot(jid){const num=CONFIG.NUMERO_BOT;return{key:{participant:"0@s.whatsapp.net",remoteJid:jid||"status@broadcast",fromMe:false},message:{contactMessage:{displayName:CONFIG.NOME_BOT,vcard:`BEGIN:VCARD\nVERSION:3.0\nN:;${CONFIG.NOME_BOT};;;\nFN:${CONFIG.NOME_BOT}\nitem1.TEL;waid=${num}:+${num}\nitem1.X-ABLabel:WhatsApp\nEND:VCARD`,contextInfo:{forwardingScore:1,isForwarded:true}}}};}

// ════════════════════════════════════════════════
// ✅ LOADING
// ════════════════════════════════════════════════
const FRAMES_LOADING=["⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛  0%","🟦🟦⬛⬛⬛⬛⬛⬛⬛⬛ 20%","🟦🟦🟦🟦⬛⬛⬛⬛⬛⬛ 40%","🟦🟦🟦🟦🟦🟦⬛⬛⬛⬛ 60%","🟦🟦🟦🟦🟦🟦🟦🟦⬛⬛ 80%","🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% ✅"];
async function barraCarregamento(sock,jid,seloBot,titulo,callbackDownload){
  let loadingMsg=null;
  try{loadingMsg=await sock.sendMessage(jid,{text:bBloco(`⏬ ${titulo}`,[FRAMES_LOADING[0]])},{quoted:seloBot});}catch{}
  const downloadPromise=callbackDownload();
  for(let i=1;i<=4;i++){await new Promise(r=>setTimeout(r,700));if(loadingMsg){try{await sock.sendMessage(jid,{text:bBloco(`⏬ ${titulo}`,[FRAMES_LOADING[i]]),edit:loadingMsg.key});}catch{}}}
  const resultado=await downloadPromise;
  if(loadingMsg){try{await sock.sendMessage(jid,{text:bBloco(`⏬ ${titulo}`,[FRAMES_LOADING[5]]),edit:loadingMsg.key});}catch{}}
  await new Promise(r=>setTimeout(r,400));
  return resultado;
}

async function rodarLoadingHacker(sock,chatJid,msgAlvo,titulo,formato){
  const tipo=formato==="mp3"?"áudio":"vídeo";
  const passos=[`${B_TOP}\n${bTitle("[ 📂 ] Invadindo servidor...")}\n${bLine("🎯",`_alvo: ${titulo}_`)}\n${B_BOT}`,`${B_TOP}\n${bTitle("[ 🛰️ ] Escaneando rede...")}\n${bLine("📡","_capturando pacotes..._")}\n${B_BOT}`,`${B_TOP}\n${bTitle("[ 🟢 ] Acesso concedido.")}\n${bLine("✅","_Bypass completo._")}\n${B_BOT}`,`${B_TOP}\n${bTitle(`[ 🔍 ] Analisando ${tipo}...`)}\n${bLine("🧬","_rastreando metadados..._")}\n${B_BOT}`,`${B_TOP}\n${bTitle("[ 📡 ] Extraindo pacotes...")}\n${bLine("💾","_compilando arquivo..._")}\n${B_BOT}`,`${B_TOP}\n${bTitle("[ ✅ ] Missão concluída.")}\n${bLine("🚀","_Enviando resultado..._")}\n${B_BOT}`];
  const loadingMsg=await sock.sendMessage(chatJid,{text:passos[0]},{quoted:msgAlvo});
  for(let i=1;i<passos.length;i++){await new Promise(r=>setTimeout(r,900));try{await sock.sendMessage(chatJid,{text:passos[i],edit:loadingMsg.key});}catch{break;}}
  return loadingMsg;
}

// ════════════════════════════════════════════════
// ✅ MENU — CARROSSEL
// ════════════════════════════════════════════════
function buildSecoes(isDono){
  const E=ME;
  const principal={title:`${E.principal} MENUS`,highlight_label:"LORDE LÁ DJUM v3.5",rows:[
    {header:`${E.principal} MENU-PRINCIPAL`,title:"_comandos principais._",id:"cat_principal"},
    {header:`${E.downloads} MENU-DOWNLOADS`,title:"_download de conteúdo._",id:"cat_downloads"},
    {header:`${E.musicas} MENU-MÚSICAS`,title:"_músicas, letras, bio._",id:"cat_musicas"},
    {header:`${E.figurinhas} MENU-FIGURINHAS`,title:"_stickers e criações._",id:"cat_figurinhas"},
    {header:`${E.brincadeiras} MENU-BRINCADEIRAS`,title:"_jogos e diversão._",id:"cat_brincadeiras"},
    {header:`${E.coins} MENU-COINS`,title:"_moedas e apostas._",id:"cat_coins"},
    {header:`${E.alteradores} MENU-ALTERADORES`,title:"_IA, voz, áudio, imagem._",id:"cat_alteradores"},
    {header:`${E.logos} MENU-LOGOS`,title:"_logos, memes, utilidades._",id:"cat_logos"},
    {header:`${E.pesquisas} MENU-PESQUISAS`,title:"_pesquisas e informação._",id:"cat_pesquisas"},
    {header:`${E.animes} MENU-ANIMES`,title:"_animes e mangás._",id:"cat_animes"},
    {header:`${E.rpg} MENU-RPG`,title:"_aventura e batalhas._",id:"cat_rpg"},
    {header:`${E.ias} MENU-IAs`,title:"_modelos de IA._",id:"cat_ias"},
    {header:`${E.plaquinhas} MENU-PLAQUINHAS`,title:"_frases e cantadas._",id:"cat_plaquinhas"},
    {header:`${E.mais18} MENU+18`,title:"_exclusivo VIPs._",id:"cat_18"},
    {header:`${E.adm} MENU-ADM`,title:"_administração._",id:"cat_adm"},
  ]};
  if(isDono)principal.rows.push({header:`${E.dono} MENU-DONO`,title:"_apenas dono._",id:"cat_dono"});
  const extras={title:`${E.extras} EXTRAS`,highlight_label:"LORDE LÁ DJUM v3.5",rows:[
    {header:`${E.assistente} ISAÍAS IA`,title:"_chama pelo nome no grupo!_",id:"cat_assistente"},
    {header:"👨‍💻 CRIADOR",title:"_info do criador._",id:"cat_criador"},
    {header:"📡 PING",title:"_status do bot._",id:"cat_ping"},
    {header:"👑 DONOS",title:"_lista de donos._",id:"cat_donos"},
    {header:"💰 ALUGAR BOT",title:"_planos de aluguel._",id:"cat_alugar_info"},
  ]};
  return[principal,extras];
}

function gerarSubmenu(catId,P){
  const E=ME;const em=E.e||E.principal||"🌀";
  if(catId==="cat_principal")return bBloco(`𝑰𝑵𝑭𝑶𝒔 𝑩𝑶𝑻 【${em}】`,[bLine("🤖",`*Bot:* ${CONFIG.NOME_BOT}`),bLine("👑",`*Criador:* ${CONFIG.DONO_NOME}`),bLine("📞",CONFIG.DONO_NUM),B_SEP,bLine(em,`*${P}menu* / *${P}ping* / *${P}stats* / *${P}sobre*`),bLine(em,`*${P}id* / *${P}regras* / *${P}dono* / *${P}alugar*`),bLine(em,`*${P}pp* [código] → _acesso_`),bLine(em,`*${P}setmenu* [emoji] → _mudar emojis_`)]);
  if(catId==="cat_assistente")return bBloco(`𝑰𝑺𝑨Í𝑨𝑺 𝑰𝑨 【${em}】`,[bLine("💡","*Em grupos:* menciona o nome!"),bLine("📱","*No privado:* fala directamente!"),B_SEP,bLine("💬","_\"Isaías, baixa Calema te amo\"_"),bLine("💬","_\"Isaías, que tempo em Luanda?\"_"),bLine("💬","_\"Isaías, faz uma piada\"_"),B_SEP,bLine(em,`*${P}assistente* → _activar no grupo_`),bLine(em,`*${P}isaias-off* → _desactivar_`)]);
  if(catId==="cat_downloads")return bBloco(`𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃'𝐬 【${em}】`,[bLine("🎵","*YOUTUBE*"),bLine(em,`*${P}play* [música] → _banner c/ botões_`),bLine(em,`*${P}mp3* / *${P}mp4* / *${P}mp4hd*`),bLine(em,`*${P}ytsearch* [pesquisa]`),B_SEP,bLine("📱","*REDES SOCIAIS*"),bLine(em,`*${P}tiktok* / *${P}instagram* / *${P}twitter*`),bLine(em,`*${P}facebook* / *${P}kwai* / *${P}spotify*`),bLine(em,`*${P}soundcloud*`),B_SEP,bLine("📌","*PINTEREST*"),bLine(em,`*${P}pin* [busca] → _imagens_`),bLine(em,`*${P}pin* [busca] | [qtd] → _até 10 imagens_`),bLine(em,`*${P}pinpack* [busca] → _pack de stickers_`),bLine(em,`*${P}pinvideo* [link] → _vídeo de pin_`),B_SEP,bLine("🖼️","*FICHEIROS*"),bLine(em,`*${P}mediafire* / *${P}apk*`),bLine(em,`*${P}qr* / *${P}tourl* / *${P}mostre*`)]);
  if(catId==="cat_musicas")return bBloco(`𝐌Ú𝐒𝐈𝐂𝐀𝐬 【${em}】`,[bLine("🎙️","*IDENTIFICAÇÃO*"),bLine(em,`*${P}busca* ↩️ áudio → _reconhece música_`),bLine(em,`*${P}shazam* → _diversão ⚡⚡_`),B_SEP,bLine("📝","*INFORMAÇÃO*"),bLine(em,`*${P}letra* / *${P}cifra* / *${P}bio* / *${P}album*`),B_SEP,bLine("📻","*DESCOBERTA*"),bLine(em,`*${P}recomenda* [género] / *${P}top10* [país]`)]);
  if(catId==="cat_figurinhas")return bBloco(`𝐅𝐈𝐆𝐔𝐑𝐈𝐍𝐇𝐀𝐬 【${em}】`,[bLine(em,`*${P}sticker* → _imagem/vídeo ➜ sticker_`),bLine(em,`*${P}sf* → _sticker ➜ foto_`),bLine(em,`*${P}brat* [texto] → _brat sticker_`),bLine(em,`*${P}figurinha* [nº]`)]);
  if(catId==="cat_brincadeiras")return bBloco(`𝐁𝐑𝐈𝐍𝐂𝐀𝐃𝐄𝐈𝐑𝐀𝐬 【${em}】`,[bLine("🎮","*GRUPO:*"),bLine(em,"quiz/vof/completar/caca/guerra/stop"),B_SEP,bLine("🎲","*SOLO:*"),bLine(em,"matematica/jokenpo/dado/cara-coroa"),bLine(em,"adivinhar/velocidade/roleta/aki/aposta"),bLine(em,`*${P}8ball* [pergunta] 🎱`),B_SEP,bLine("😂","*DIVERSÃO:*"),bLine(em,"piada/conselho/poema/historia/perfil/cara/ship/fofoca"),bLine(em,`*${P}cantada* 💘 / *${P}inunca* 🎯 / *${P}conselhobiblico* 📖`),B_SEP,bLine("⚔️","*PvP:*"),bLine(em,`*${P}batalha* @user [apostas]`),B_SEP,bLine("🏆","rank/toprank/nivel")]);
  if(catId==="cat_coins")return bBloco(`𝐂𝐎𝐈𝐍𝐬 & 𝐄𝐂𝐎𝐍𝐎𝐌𝐈𝐀 【${em}】`,[bLine(em,`*${P}moedas* / *${P}diario* / *${P}topcoins*`),bLine(em,`*${P}dar* @user [qtd] / *${P}roubar* @user`),bLine(em,`*${P}aposta* [qtd] / *${P}nivel* / *${P}inventario*`),B_SEP,bLine("💼","*TRABALHO:*"),bLine(em,`*${P}trabalhar* ⏱2h / *${P}minerar* ⏱3h`),bLine(em,`*${P}pescar* ⏱90min / *${P}cacada* ⏱2.5h`),bLine(em,`*${P}bau* ⏱4h / *${P}missao* ⏱24h`),bLine(em,`*${P}treinar* ⏱1h / *${P}dormir* ⏱8h`),bLine(em,`*${P}explorar* ⏱1.5h / *${P}viajar*`),bLine(em,`*${P}crimes* ⏱6h / *${P}mendigar* ⏱30min`)]);
  if(catId==="cat_alteradores")return bBloco(`𝐀𝐋𝐓𝐄𝐑𝐀𝐃𝐎𝐑𝐄𝐬 【${em}】`,[bLine("🔊","*VOZ:*"),bLine(em,`*${P}vz* [texto]`),B_SEP,bLine("📝","*TRANSCRIÇÃO:*"),bLine(em,`*${P}transcrever* / *${P}resumiraudio* / *${P}traduziraudio*`),B_SEP,bLine("🧠","*IA:*"),bLine(em,`*${P}ia* / *${P}resumir* / *${P}traduzir*`),B_SEP,bLine("🖼️","*IMAGEM:*"),bLine(em,`*${P}fotocopia* / *${P}fotoparaia* / *${P}resumirfoto*`)]);
  if(catId==="cat_logos")return bBloco(`𝐋𝐎𝐆𝐎𝐬 & 𝐔𝐓𝐈𝐋𝐈𝐃𝐀𝐃𝐄𝐬 【${em}】`,[bLine(em,`*${P}meme* / *${P}logo* / *${P}card*`),bLine(em,`*${P}calc* / *${P}encurtar* / *${P}qr*`),bLine(em,`*${P}horario* / *${P}tempo* / *${P}cotacao*`),bLine(em,`*${P}ver* / *${P}apagadas* / *${P}placar*`),B_SEP,bLine("📦","*CASES DINÂMICAS:*"),bLine(em,`*${P}addcase* [nome] → _adicionar comando_`),bLine(em,`*${P}cases* → _listar cases_`),bLine(em,`*${P}extraircase* [nome] → _ver código_`),bLine(em,`*${P}delcase* [nome] → _remover_`)]);
  if(catId==="cat_pesquisas")return bBloco(`𝐏𝐄𝐒𝐐𝐔𝐈𝐒𝐀𝐬 【${em}】`,[bLine("📰","*NOTÍCIAS:*"),bLine(em,`*${P}noticias* / *${P}hoje* / *${P}fato*`),B_SEP,bLine("🌍","*INFO:*"),bLine(em,`*${P}pais* / *${P}wikipedia* / *${P}signo*`),bLine(em,`*${P}definir* / *${P}sinonimo*`),B_SEP,bLine("🎬","*ENTRETENIMENTO:*"),bLine(em,`*${P}filme* / *${P}serie* / *${P}livro*`),B_SEP,bLine("💹","*FINANÇAS:*"),bLine(em,`*${P}cripto* / *${P}converter* / *${P}previsao*`)]);
  if(catId==="cat_animes")return bBloco(`𝐀𝐍𝐈𝐌𝐄𝐬 【${em}】`,[bLine(em,`*${P}anime* / *${P}topanimes* / *${P}animealeatorio*`),bLine(em,`*${P}fraseanime* / *${P}quizanime*`)]);
  if(catId==="cat_rpg")return bBloco(`𝐑𝐏𝐆 【${em}】`,[bLine(em,`*${P}rpgstart* → _criar personagem_`),bLine(em,`*${P}rpgstatus* / *${P}rpgataque* / *${P}rpgcurar*`),bLine(em,`*${P}rpgsorte* / *${P}rpgclasse*`)]);
  if(catId==="cat_ias")return bBloco(`𝐈𝐀𝐬 【${em}】`,[bLine(em,`*${P}gpt* / *${P}gemini* / *${P}deepseek* / *${P}ia*`),bLine("💡","_Em grupos: chama Isaías pelo nome!_"),bLine("📱","_No privado: fala directamente!_")]);
  if(catId==="cat_plaquinhas")return bBloco(`𝐏𝐋𝐀𝐐𝐔𝐈𝐍𝐇𝐀𝐬 【${em}】`,[bLine(em,`*${P}cantada* 💘 / *${P}inunca* 🎯`),bLine(em,`*${P}conselhobiblico* 📖 / *${P}frasemotivacional* 💪`),bLine(em,`*${P}piadacurta* 😂 / *${P}curiosidade* 🤔`),bLine(em,`*${P}bomdia* ☀️ / *${P}boanoite* 🌙`)]);
  if(catId==="cat_18")return bBloco(`𝐌𝐄𝐍𝐔 +𝟏𝟖 【${em}】`,[bLine("⚠️","*EXCLUSIVO PARA VIPS*"),B_SEP,bLine(em,`*${P}piada18* / *${P}truth* / *${P}dare*`),bLine(em,`*${P}crush* / *${P}seduzir* / *${P}beijo* / *${P}abraco*`),bLine(em,`*${P}tapa* / *${P}flirt* / *${P}casal*`),B_SEP,bLine("💰",`*${P}alugar* para ser VIP`)]);
  if(catId==="cat_adm"||catId==="adm")return bBloco(`𝐀𝐃𝐌𝐈𝐍𝐬 【${em}】`,[bLine("👥","banir/add/addadmin/removeadmin"),bLine("👥","silenciar/dessilenciar/addvip/vips"),bLine("📢","all/att/aviso/link/sorteio"),bLine("⚙️","fechar/abrir/bot/anti-link"),bLine("⚙️","nomegrupo/descgrupo/fotogrupo/scanlink")]);
  if(catId==="cat_dono")return bBloco(`𝐃𝐎𝐍𝐎 【${em}】`,[bLine(em,`*${CONFIG.PREFIXO}ergue-se* / *${CONFIG.PREFIXO}set* / *${CONFIG.PREFIXO}out*`),bLine(em,`*${CONFIG.PREFIXO}prefixo* / *${CONFIG.PREFIXO}setfoto* / *${CONFIG.PREFIXO}chaton*`),bLine(em,`*${CONFIG.PREFIXO}sms* / *${CONFIG.PREFIXO}gsms*`),bLine(em,`*${CONFIG.PREFIXO}setmenu* [emoji] → _mudar emojis_`),B_SEP,bLine("👑",`*${CONFIG.DONO_NOME}* | 📞 ${CONFIG.DONO_NUM}`)]);
  return null;
}

async function enviarMenuPrincipal(sock,jid,msg,isDono,sender,isAdmin,seloBot){
  const P=CONFIG.PREFIXO;
  const agora=new Date();
  const hora=agora.toLocaleTimeString("pt-AO",{timeZone:"Africa/Luanda",hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const nomeUser=(msg.pushName||"").trim()||sender.split("@")[0].split(":")[0];
  const cargo=isDono?"👑 Criador":(isAdmin?"👮 Administrador":"👤 Utilizador");
  const secoes=buildSecoes(isDono);
  const em=ME.e||ME.principal||"🌀";
  const textoMenu=`${B_TOP}\n${bTitle(`𝑰𝑵𝑭𝑶𝒔 𝑩𝑶𝑻 𝑼𝑺𝑬𝑹`)}\n${B_MID}\n${bLine("🤖",`*Bot*: ${CONFIG.NOME_BOT}`)}\n${bLine("👤",`*Usuário*: ${nomeUser}`)}\n${bLine("🎖️",`*Cargo*: ${cargo}`)}\n${bLine("⌨️",`*Prefixo*: ${P}`)}\n${bLine("🕐",`*Hora*: ${hora}`)}\n${bLine("💎",`*VIP*: ${isVip(sender)?"✅":"❌"}`)}\n${B_BOT}`;
  try{
    const payload={caption:textoMenu,footer:CONFIG.NOME_BOT,optionText:"≡ ABRIR MENU",nativeFlow:[{text:"≡ Categorias",sections:secoes,icon:"default"},{text:"📢 Canal",url:CONFIG.CANAL_URL,useWebview:false}]};
    if(botFotoBuffer)payload.image=botFotoBuffer;else if(ppBotUrl)payload.image={url:ppBotUrl};
    await sock.sendMessage(jid,payload,{quoted:seloBot});return;
  }catch(e){console.log("⚠️ NativeFlow:",e.message);}
  try{
    if(botFotoBuffer)await sock.sendMessage(jid,{image:botFotoBuffer,caption:textoMenu},{quoted:seloBot});
    else if(ppBotUrl)await sock.sendMessage(jid,{image:{url:ppBotUrl},caption:textoMenu},{quoted:seloBot});
    else await sock.sendMessage(jid,{text:textoMenu},{quoted:seloBot});
    await new Promise(r=>setTimeout(r,600));
    await sock.sendMessage(jid,{listMessage:{title:`🌀 ${CONFIG.NOME_BOT}`,description:"Selecciona uma categoria:",footerText:`© ${CONFIG.NOME_BOT}`,buttonText:"≡ MENU",listType:1,sections:secoes}});return;
  }catch{}
  try{await sock.sendMessage(jid,{text:textoMenu},{quoted:seloBot});}catch{}
  const menu=`${B_TOP}\n${bTitle("📂 CATEGORIAS")}\n${B_MID}\n${bLine(em,"*1*→Principal | *2*→Downloads | *3*→Músicas")}\n${bLine(em,"*4*→Figurinhas | *5*→Brincadeiras | *6*→Coins")}\n${bLine(em,"*7*→Alteradores | *8*→Logos | *9*→Pesquisas")}\n${bLine(em,"*0*→+18 (VIP)")}\n${B_BOT}`;
  await sock.sendMessage(jid,{text:menu},{quoted:seloBot});
  menuEsperandoResposta.set(`${jid}_${sender}`,{isDono,timestamp:Date.now()});
  setTimeout(()=>menuEsperandoResposta.delete(`${jid}_${sender}`),120000);
}


async function enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono){
  if(catId==="cat_assistente"){await sock.sendMessage(jid,{text:bBloco("🤖 ISAÍAS IA",[bLine("💡","*Em grupos:* menciona o nome dele!"),bLine("💡","*No privado:* fala directamente!"),B_SEP,bLine("💬","_\"Isaías, baixa música do Calema\"_"),bLine("💬","_\"Isaías, que tempo em Luanda?\"_"),bLine("💡",`*!isaias-off* para desactivar no grupo`)])},{quoted:seloBot});return;}
  if(catId==="cat_ping"){const ini=Date.now();await sock.sendMessage(jid,{text:"⏳"});await sock.sendMessage(jid,{text:bBloco("📡 PING",[bLine("🏓",`*${Date.now()-ini}ms*`),bLine("⏱️",`${Math.floor(process.uptime()/60)} min`),bLine("💾",`${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`),bLine("🌐",CONFIG.IS_SERVER?"☁️ Servidor":"📱 Local")])},{quoted:seloBot});return;}
  if(catId==="cat_donos"){await sock.sendMessage(jid,{text:bBloco("👑 DONOS",[bLine("👑",`*${CONFIG.DONO_NOME}*`),bLine("📞",CONFIG.DONO_NUM)])},{quoted:seloBot});return;}
  if(catId==="cat_alugar_info"||catId==="cat_alugar"){await sock.sendMessage(jid,{text:gerarTextoAlugar()},{quoted:seloBot});return;}
  if(catId==="cat_criador"){let ppD=null;try{ppD=await sock.profilePictureUrl(CONFIG.DONO_JID,"image");}catch{}const tD=bBloco("👨‍💻 CRIADOR",[bLine("🏷️",`*${CONFIG.DONO_NOME}*`),bLine("📞",CONFIG.DONO_NUM)]);if(ppD)await sock.sendMessage(jid,{image:{url:ppD},caption:tD},{quoted:seloBot});else await sock.sendMessage(jid,{text:tD},{quoted:seloBot});return;}
  const texto=gerarSubmenu(catId,CONFIG.PREFIXO);
  if(!texto)return;
  try{await reagir(sock,{key:{remoteJid:jid,...msg?.key}},msg?.key?"✅":"⚡");}catch{}
  await new Promise(r=>setTimeout(r,300));
  if(botFotoBuffer)await sock.sendMessage(jid,{image:botFotoBuffer,caption:texto},{quoted:seloBot});
  else if(ppBotUrl)await sock.sendMessage(jid,{image:{url:ppBotUrl},caption:texto},{quoted:seloBot});
  else await sock.sendMessage(jid,{text:texto},{quoted:seloBot});
}

function gerarTextoAlugar(){return bBloco("💰 ALUGUEL BOT",[bLine("🎁","*Grátis* - 3 dias (KZ 0,00)"),bLine("🎈","*Lite* - 5 dias (KZ 500)"),bLine("🍀","*Basic* - 1 semana (KZ 700)"),bLine("🪙","*Gold* - 2 semanas (KZ 1200)"),bLine("💎","*Diamond* - 1 mês (KZ 2000)"),bLine("🚀","*Ultra* - 3 meses (KZ 3500)"),B_SEP,bLine("📲","+244926612801"),bLine("⏰","Suporte 24h")]);}

// ════════════════════════════════════════════════
// ✅ FUNÇÕES DE IA
// ════════════════════════════════════════════════
function runCmd(cmd){return new Promise((resolve,reject)=>{exec(cmd,{timeout:180000,maxBuffer:150*1024*1024,env:{...process.env,TMPDIR:process.env.TMPDIR}},(err,stdout,stderr)=>{if(err)reject(new Error(stderr||err.message));else resolve(stdout.trim());});});}
function encontrarArquivo(pasta,prefixo){try{const arqs=fs.readdirSync(pasta).filter(f=>f.startsWith(prefixo)&&!f.endsWith(".part")&&!f.endsWith(".ytdl"));if(!arqs.length)return null;const p=path.join(pasta,arqs[0]);return fs.statSync(p).size>3000?p:null;}catch{return null;}}

async function chatIA(prompt,sistema="És um assistente simpático que responde em português de Angola. Sê direto."){
  for(const modelo of["llama-3.1-8b-instant","mixtral-8x7b-32768"]){try{const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:modelo,messages:[{role:"system",content:sistema},{role:"user",content:prompt}],max_tokens:800,temperature:0.7},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:20000,httpsAgent});const resp=data.choices?.[0]?.message?.content?.trim();if(resp&&resp.length>2)return resp;}catch(e){console.log(`❌ Groq ${modelo}:`,e.message);}}
  try{const{data}=await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(sistema)}&model=openai-large`,{timeout:25000,responseType:"text",httpsAgent});const resp=typeof data==="string"?data.trim():String(data).trim();if(resp.length>5)return resp;}catch{}
  return "❌ IA indisponível.";
}

async function transcreverComGroq(buffer){const formData=new FormData();formData.append("file",buffer,{filename:"audio.ogg",contentType:"audio/ogg"});formData.append("model","whisper-large-v3");formData.append("response_format","json");const{data}=await axios.post("https://api.groq.com/openai/v1/audio/transcriptions",formData,{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,...formData.getHeaders()},timeout:60000,httpsAgent});const texto=data?.text?.trim();if(!texto)throw new Error("Áudio não audível");return texto;}

async function textoParaFala(texto,voz=CONFIG.VOZ_TTS){const tempId=Date.now(),tempTxt=`./downloads/tts_in_${tempId}.txt`,tempOut=`./downloads/tts_out_${tempId}.mp3`;try{const textoLimpo=texto.replace(/[*_~`#]/g,"").replace(/\n+/g,". ").slice(0,1800);if(!textoLimpo.trim())throw new Error("Texto vazio");fs.writeFileSync(tempTxt,textoLimpo,"utf8");await runCmd(`${EDGETTS_CMD} --voice "${voz}" --file "${tempTxt}" --write-media "${tempOut}"`);if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<500)throw new Error("TTS inválido");return tempOut;}finally{try{fs.removeSync(tempTxt);}catch{}}}

async function reconhecerMusica(buf){const formData=new FormData();formData.append("file",buf,{filename:"audio.ogg",contentType:"audio/ogg"});formData.append("api_token","test");formData.append("return","apple_music,spotify");const{data}=await axios.post("https://api.audd.io/",formData,{headers:{...formData.getHeaders()},timeout:30000,httpsAgent});return data;}

async function analisarImagem(imagemBuffer,instrucao){let mimeType="image/jpeg";if(imagemBuffer[0]===0x89&&imagemBuffer[1]===0x50)mimeType="image/png";const base64=imagemBuffer.toString("base64");for(const modelo of["meta-llama/llama-4-scout-17b-16e-instruct","meta-llama/llama-4-maverick-17b-128e-instruct"]){try{const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:modelo,messages:[{role:"user",content:[{type:"image_url",image_url:{url:`data:${mimeType};base64,${base64}`}},{type:"text",text:instrucao}]}],max_tokens:1000,temperature:0.3},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:30000,httpsAgent});const resp=data.choices?.[0]?.message?.content?.trim();if(resp&&resp.length>2)return resp;}catch(e){console.log(`❌ ${modelo}:`,e.message);}}throw new Error("Modelos de visão falharam.");}

async function buscarImagemInternet(query){try{const{data}=await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,{timeout:8000,httpsAgent});if(data?.originalimage?.source)return data.originalimage.source;if(data?.thumbnail?.source)return data.thumbnail.source;}catch{}try{const{data}=await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,{timeout:8000,httpsAgent});if(data?.originalimage?.source)return data.originalimage.source;if(data?.thumbnail?.source)return data.thumbnail.source;}catch{}return null;}

async function uploadParaTelegraph(buffer){const formData=new FormData();let mimeType="image/jpeg",ext="jpg";if(buffer[0]===0x89&&buffer[1]===0x50){mimeType="image/png";ext="png";}formData.append("file",buffer,{filename:`img.${ext}`,contentType:mimeType});const{data}=await axios.post("https://telegra.ph/upload",formData,{headers:{...formData.getHeaders()},timeout:30000,httpsAgent});if(data?.[0]?.src)return `https://telegra.ph${data[0].src}`;throw new Error("Telegraph falhou");}
async function uploadParaCatbox(buffer,nome,mimeType){const formData=new FormData();formData.append("reqtype","fileupload");formData.append("fileToUpload",buffer,{filename:nome,contentType:mimeType});const{data}=await axios.post("https://catbox.moe/user/api.php",formData,{headers:{...formData.getHeaders()},timeout:180000,httpsAgent,maxContentLength:Infinity,maxBodyLength:Infinity});const url=String(data).trim();if(!url.startsWith("http"))throw new Error("Catbox falhou");return url;}

// ════════════════════════════════════════════════
// ✅ SCRAPERS
// ════════════════════════════════════════════════
async function scraperHub(endpoint){const{data}=await axios.get(`${CONFIG.SCRAPER_HUB_URL}${endpoint}`,{timeout:30000,httpsAgent});return data;}
async function scraperTikTokVideo(url){try{const data=await scraperHub(`/api/tiktok/video?url=${encodeURIComponent(url)}`);if(data?.url||data?.video)return{url:data.url||data.video,title:data.title||"TikTok"};}catch{}const{data}=await axios.post("https://www.tikwm.com/api/",`url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`,{headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Mozilla/5.0"},timeout:30000,httpsAgent});const d=data?.data;if(!d)throw new Error("Sem dados");return{url:d.hdplay||d.play,title:d.title||"TikTok"};}
async function scraperTikTokSearch(query,limit=10){try{const data=await scraperHub(`/api/tiktok/search?q=${encodeURIComponent(query)}&limit=${limit}`);return data?.resultados||data?.results||data?.videos||[];}catch{return[];}}
async function scraperTikTokTrending(region="AO",limit=10){try{const data=await scraperHub(`/api/tiktok/trending?region=${region}&limit=${limit}`);return data?.resultados||data?.results||data?.videos||[];}catch{return[];}}
async function scraperTikTokUser(username){try{const data=await scraperHub(`/api/tiktok/user?username=${encodeURIComponent(username)}`);return data?.resultado||data?.result||data?.user||null;}catch{return null;}}
async function scraperYouTubeSearch(query,limit=5){try{const data=await scraperHub(`/api/youtube/search?q=${encodeURIComponent(query)}&limit=${limit}`);return data?.resultados||data?.results||data?.videos||[];}catch{return[];}}
async function downloadViaScraperHub(url,formato){const resp=await axios.post(`${CONFIG.SCRAPER_HUB_URL}/api/youtube/download`,{url,formato},{timeout:180000,httpsAgent});if(!resp.data?.filename)throw new Error("Scraper Hub: sem filename");const filename=resp.data.filename;const fileResp=await axios.get(`${CONFIG.SCRAPER_HUB_URL}/api/youtube/file/${filename}`,{responseType:"arraybuffer",timeout:180000,httpsAgent});return Buffer.from(fileResp.data);}

// ════════════════════════════════════════════════
// ✅ DOWNLOADS — Sem downloader.js externo
// ════════════════════════════════════════════════
async function downloadMusica(entrada,altaQualidade=false){
  const isUrl=entrada.startsWith("http");
  const nomeBase=`mus_${Date.now()}`;
  const saida=path.join("./downloads",`${nomeBase}.%(ext)s`);
  const quality=altaQualidade?"0":"5";

  // 1. yt-dlp directo (mais fiável)
  const fontes=isUrl?[entrada]:[
    `ytsearch1:${entrada}`,
    `ytsearch1:${entrada.split(" ").slice(0,5).join(" ")} official audio`,
  ];
  for(const fonte of fontes){
    try{
      const cmd=`${YTDLP_CMD} -x --audio-format mp3 --audio-quality ${quality} --no-playlist --no-warnings --no-check-certificate --geo-bypass -o "${saida}" "${fonte}"`;
      await runCmd(cmd);
      const arq=encontrarArquivo("./downloads",nomeBase);
      if(arq&&fs.statSync(arq).size>3000)return arq;
    }catch(e){console.log(`⚠️ mp3 yt-dlp:`,e.message.slice(0,80));}
  }

  // 2. Scraper Hub fallback
  try{
    const buf=await downloadViaScraperHub(entrada,"mp3");
    const p=path.join("./downloads",`mus_hub_${Date.now()}.mp3`);
    fs.writeFileSync(p,buf);
    if(fs.statSync(p).size>3000)return p;
    fs.removeSync(p);
  }catch(e){console.log("⚠️ Scraper Hub mp3:",e.message);}

  // 3. Piped/Invidious (servidor)
  if(CONFIG.IS_SERVER){
    try{
      const resultados=await buscarYouTubePiped(entrada);
      if(resultados.length){
        const vid=resultados[0].url.match(/(?:v=|youtu\.be\/)([^&\n?]+)/)?.[1];
        if(vid){
          for(const inst of PIPED_INSTANCES){
            try{
              const{data}=await axios.get(`${inst}/streams/${vid}`,{timeout:12000,httpsAgent});
              const audioStream=(data?.audioStreams||[]).filter(s=>s.mimeType?.includes("audio")).sort((a,b)=>(b.bitrate||0)-(a.bitrate||0));
              if(audioStream[0]?.url){
                const resp=await axios.get(audioStream[0].url,{responseType:"arraybuffer",timeout:120000,httpsAgent,maxContentLength:Infinity});
                const p=path.join("./downloads",`mus_piped_${Date.now()}.mp3`);
                fs.writeFileSync(p,Buffer.from(resp.data));
                if(fs.statSync(p).size>3000)return p;
                fs.removeSync(p);
              }
            }catch{continue;}
          }
        }
      }
    }catch(e){console.log("⚠️ Piped mp3:",e.message);}
  }
  return null;
}

async function downloadVideo(entrada,height=480){
  const isUrl=entrada.startsWith("http");
  const nomeBase=`vid_${Date.now()}`;
  const saida=path.join("./downloads",`${nomeBase}.%(ext)s`);
  const pesquisa=isUrl?entrada:`ytsearch1:${entrada}`;

  // 1. yt-dlp — tenta formatos progressivamente
  const formatos=[
    `best[height<=${height}][ext=mp4]/best[height<=${height}]/best[ext=mp4]/best/worst`,
    `18`,  // 360p mp4 directo
    `worst`,
  ];
  for(const fmt of formatos){
    try{
      const cmd=`${YTDLP_CMD} -f "${fmt}" --no-playlist --no-warnings --no-check-certificate --geo-bypass -o "${saida}" "${pesquisa}"`;
      await runCmd(cmd);
      const arq=encontrarArquivo("./downloads",nomeBase);
      if(arq){
        const tam=fs.statSync(arq).size;
        if(tam>10000&&tam<100*1024*1024)return arq;
        try{fs.removeSync(arq);}catch{}
      }
    }catch(e){console.log(`⚠️ mp4 yt-dlp (${fmt}):`,e.message.slice(0,60));}
  }

  // 2. Scraper Hub fallback
  try{
    const buf=await downloadViaScraperHub(entrada,"mp4");
    const p=path.join("./downloads",`vid_hub_${Date.now()}.mp4`);
    fs.writeFileSync(p,buf);
    const tam=fs.statSync(p).size;
    if(tam>10000&&tam<100*1024*1024)return p;
    fs.removeSync(p);
  }catch(e){console.log("⚠️ Scraper Hub mp4:",e.message);}

  return null;
}

async function downloadVideoHD(entrada,height=720){
  const isUrl=entrada.startsWith("http"),pesquisa=isUrl?entrada:`ytsearch1:${entrada}`;
  const nomeBase=`vidhd_${Date.now()}`,saida=`./downloads/${nomeBase}.mp4`;
  const LIMITE=90*1024*1024,MAX_SIZE="90M";const baseArgs=getYtDlpArgs();
  const fmt=`bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/bestvideo+bestaudio/best`;
  const tentarSalvar=(arq)=>{if(!arq)return null;try{const tam=fs.statSync(arq).size;if(tam>10000&&tam<=LIMITE)return arq;if(fs.existsSync(arq))fs.removeSync(arq);}catch{}return null;};
  try{await runCmd(`${YTDLP_CMD} ${baseArgs} --max-filesize ${MAX_SIZE} -f "${fmt}" --merge-output-format mp4 -o "${saida}" "${pesquisa}"`);const r=tentarSalvar(saida)||tentarSalvar(encontrarArquivo("./downloads",nomeBase));if(r)return{filePath:r,quality:`${height}p`,sizeMB:(fs.statSync(r).size/1024/1024).toFixed(1)};}catch(e){console.log(`⚠️ yt-dlp HD:`,e.message);}
  const r=await downloadVideo(entrada);
  if(r)return{filePath:r,quality:"480p",sizeMB:(fs.statSync(r).size/1024/1024).toFixed(1)};
  throw new Error("Não consegui baixar.");
}

async function dlRedeSocial(url){
  const nomeBase=`dl_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`;
  try{await runCmd(`${YTDLP_CMD} --no-check-certificate --no-playlist -f "best[ext=mp4]/best" -o "${saida}" "${url}"`);const arq=encontrarArquivo("./downloads",nomeBase);if(arq)return{filePath:arq};}catch{}
  throw new Error("Não consegui baixar.");
}
async function dlSpotify(query){const arq=await downloadMusica(query,true);if(arq)return{filePath:arq};throw new Error("Spotify: não encontrei.");}
async function dlSoundcloud(query){const isUrl=query.startsWith("http"),nomeBase=`sc_${Date.now()}`,saida=`./downloads/${nomeBase}.%(ext)s`,fonte=isUrl?query:`scsearch1:${query}`;try{await runCmd(`${YTDLP_CMD} --no-check-certificate -x --audio-format mp3 --audio-quality 0 --no-playlist --no-warnings -o "${saida}" "${fonte}"`);const arq=encontrarArquivo("./downloads",nomeBase);if(arq)return{filePath:arq};}catch{}const arqFb=await downloadMusica(query,true);if(arqFb)return{filePath:arqFb};throw new Error("SoundCloud: não encontrei.");}
async function dlMediafire(url){try{const{data}=await axios.get(url,{headers:{"User-Agent":"Mozilla/5.0"},timeout:15000,httpsAgent});const match=data.match(/href="(https:\/\/download\d+\.mediafire\.com\/[^"]+)"/);if(match)return{url:match[1],title:decodeURIComponent(match[1].split("/").pop().split("?")[0])||"file"};throw new Error("Link não encontrado.");}catch(e){throw new Error("MediaFire: "+e.message);}}
async function dlApk(query){try{const{data}=await axios.get(`https://liteapks.com/?s=${encodeURIComponent(query)}`,{headers:{"User-Agent":"Mozilla/5.0"},timeout:15000,httpsAgent});const regex=/href="(https:\/\/liteapks\.com\/[a-z0-9-]+\.html)"/g;let m;const results=[];while((m=regex.exec(data))!==null&&results.length<3){const u=m[1];if(!u.includes("page/")&&!results.find(r=>r===u))results.push(u);}if(!results.length)throw new Error("Não encontrei.");return{url:results[0],title:results[0].split("/").pop().replace(".html","").replace(/-/g," ")};}catch(e){throw new Error("APK: "+e.message);}}

// ════════════════════════════════════════════════
// ✅ PINTEREST — busca múltiplas imagens
// ════════════════════════════════════════════════
async function buscarPinterest(busca,qtd=5){
  let imagens=[];
  // Fonte 1 — API siputzx
  try{
    const{data}=await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(busca)}`,{timeout:20000,httpsAgent});
    imagens=(data?.data||[]).map(x=>x?.image_url||x?.images_url||x?.url).filter(u=>typeof u==="string"&&/^https?:\/\//i.test(u)).slice(0,qtd);
  }catch(e){console.log("⚠️ Pinterest API1:",e.message);}
  // Fonte 2 — Scraper Hub
  if(!imagens.length){try{const data=await scraperHub(`/api/pinterest/search?q=${encodeURIComponent(busca)}&limit=${qtd}&type=image`);const r=data?.resultados||data?.results||data?.pins||[];imagens=r.map(x=>{if(typeof x==="string")return x;return x?.image_url||x?.url||x?.src||"";}).filter(u=>u&&/^https?:\/\//i.test(u)).slice(0,qtd);}catch(e){console.log("⚠️ Pinterest Hub:",e.message);}}
  // Fonte 3 — Wikipedia fallback
  if(!imagens.length){try{const imgUrl=await buscarImagemInternet(busca);if(imgUrl)imagens=[imgUrl];}catch{}}
  return imagens;
}

// ════════════════════════════════════════════════
// ✅ STICKER / ÁUDIO
// ════════════════════════════════════════════════
async function criarSticker(imagemBuffer,isAnimated=false){const tempId=Date.now(),tempIn=`./downloads/stk_in_${tempId}.tmp`,tempOut=`./downloads/stk_out_${tempId}.webp`;try{fs.writeFileSync(tempIn,imagemBuffer);const cmd=isAnimated?`${FFMPEG_CMD} -i "${tempIn}" -t 5 -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=12" -c:v libwebp -quality 70 -preset default -loop 0 -an -vsync 0 "${tempOut}" -y -loglevel error`:`${FFMPEG_CMD} -i "${tempIn}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -c:v libwebp -quality 90 "${tempOut}" -y -loglevel error`;await new Promise((resolve,reject)=>{exec(cmd,{timeout:30000,env:{...process.env}},(err)=>err?reject(err):resolve());});if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<100)throw new Error("WebP inválido");return fs.readFileSync(tempOut);}finally{try{fs.removeSync(tempIn);}catch{}try{fs.removeSync(tempOut);}catch{}}}
async function stickerParaFoto(buf,isAnimated=false){const tempId=Date.now(),tempIn=`./downloads/sf_in_${tempId}.webp`,tempOut=`./downloads/sf_out_${tempId}.${isAnimated?"mp4":"jpg"}`;try{fs.writeFileSync(tempIn,buf);const cmd=isAnimated?`${FFMPEG_CMD} -i "${tempIn}" -c:v libx264 -pix_fmt yuv420p -movflags faststart "${tempOut}" -y -loglevel error`:`${FFMPEG_CMD} -i "${tempIn}" -frames:v 1 -q:v 2 "${tempOut}" -y -loglevel error`;await new Promise((resolve,reject)=>{exec(cmd,{timeout:30000,env:{...process.env}},(err)=>err?reject(err):resolve());});if(!fs.existsSync(tempOut)||fs.statSync(tempOut).size<100)throw new Error("Conversão inválida");return{buffer:fs.readFileSync(tempOut),isVideo:isAnimated};}catch(e){return{buffer:buf,isVideo:false,isWebP:true};}finally{try{fs.removeSync(tempIn);}catch{}try{fs.removeSync(tempOut);}catch{}}}

async function enviarAudio(sock,jid,filePath,msgCitada){
  if(!fs.existsSync(filePath))throw new Error("Ficheiro não encontrado");
  const oggPath=path.join("./downloads",`ogg_${Date.now()}.ogg`);let converteu=false;
  try{await new Promise((res,rej)=>exec(`${FFMPEG_CMD} -i "${filePath}" -c:a libopus -b:a 64k -ar 24000 -ac 1 -vn "${oggPath}" -y -loglevel error`,{timeout:60000,env:{...process.env}},(err)=>err?rej(err):res()));if(fs.existsSync(oggPath)&&fs.statSync(oggPath).size>500)converteu=true;}catch{}
  const usePath=converteu?oggPath:filePath;const mime=converteu?"audio/ogg; codecs=opus":"audio/mpeg";
  const buf=fs.readFileSync(usePath);const cleanup=()=>{if(converteu&&fs.existsSync(oggPath))try{fs.removeSync(oggPath);}catch{}};
  try{await sock.sendMessage(jid,{audio:buf,mimetype:mime,ptt:false},msgCitada?{quoted:msgCitada}:{});cleanup();return;}catch{}
  try{const url=await uploadParaCatbox(buf,path.basename(usePath),mime);await sock.sendMessage(jid,{audio:{url},mimetype:mime,ptt:false},msgCitada?{quoted:msgCitada}:{});cleanup();return;}catch{}
  try{await sock.sendMessage(jid,{document:fs.readFileSync(filePath),mimetype:"audio/mpeg",fileName:path.basename(filePath)},msgCitada?{quoted:msgCitada}:{});cleanup();}catch(e){cleanup();throw e;}
}
async function enviarVideo(sock,jid,filePath,caption,mentions,msgCitada){
  if(!fs.existsSync(filePath))throw new Error("Vídeo não encontrado");
  const buf=fs.readFileSync(filePath);
  try{await sock.sendMessage(jid,{video:buf,caption,mentions},msgCitada?{quoted:msgCitada}:{});return;}catch{}
  try{const url=await uploadParaCatbox(buf,path.basename(filePath),"video/mp4");await sock.sendMessage(jid,{video:{url},caption,mentions},msgCitada?{quoted:msgCitada}:{});return;}catch{}
  await sock.sendMessage(jid,{document:buf,mimetype:"video/mp4",fileName:path.basename(filePath),caption},msgCitada?{quoted:msgCitada}:{});
}

async function downloadImagemDaMensagem(msg){try{if(msg.message?.imageMessage)return await downloadMediaMessage(msg,"buffer",{});}catch{}const ctx=msg.message?.extendedTextMessage?.contextInfo;if(!ctx?.quotedMessage)return null;if(ctx.quotedMessage.imageMessage){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage};return await downloadMediaMessage(qm,"buffer",{});}catch{}}return null;}
async function downloadAudioDaMensagem(msg){const tipos=["audioMessage","pttMessage"];for(const tipo of tipos){if(msg.message?.[tipo]){try{return{buffer:await downloadMediaMessage(msg,"buffer",{})};}catch{}}}const ctx=msg.message?.extendedTextMessage?.contextInfo;if(!ctx?.quotedMessage)return null;for(const tipo of tipos){if(ctx.quotedMessage[tipo]){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage};return{buffer:await downloadMediaMessage(qm,"buffer",{})};}catch{}}}return null;}
async function downloadQualquerMidia(msg){const m=msg.message;if(!m)return null;const tipos=[{chave:"imageMessage",mime:"image/jpeg",ext:"jpg"},{chave:"videoMessage",mime:"video/mp4",ext:"mp4"},{chave:"audioMessage",mime:"audio/ogg",ext:"ogg"},{chave:"pttMessage",mime:"audio/ogg",ext:"ogg"},{chave:"documentMessage",mime:"application/octet-stream",ext:"bin"},{chave:"stickerMessage",mime:"image/webp",ext:"webp"}];for(const t of tipos){if(m[t.chave]){try{const buf=await downloadMediaMessage(msg,"buffer",{});const mime=m[t.chave].mimetype||t.mime;const ext=mime.split("/")[1]?.split(";")[0]||t.ext;const nome=m[t.chave].fileName||`midia_${Date.now()}.${ext}`;return{buffer:buf,mime,nome};}catch{}}}const ctx=m.extendedTextMessage?.contextInfo;if(ctx?.quotedMessage){for(const t of tipos){if(ctx.quotedMessage[t.chave]){try{const qm={key:{remoteJid:msg.key.remoteJid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:ctx.quotedMessage};const buf=await downloadMediaMessage(qm,"buffer",{});const mime=ctx.quotedMessage[t.chave].mimetype||t.mime;const ext=mime.split("/")[1]?.split(";")[0]||t.ext;const nome=ctx.quotedMessage[t.chave].fileName||`midia_${Date.now()}.${ext}`;return{buffer:buf,mime,nome};}catch{}}}}return null;}

async function reagir(sock,msg,emoji="⏳"){try{await sock.sendMessage(msg.key.remoteJid,{react:{text:emoji,key:msg.key}});}catch{}}
async function enviarComSelo(sock,jid,texto,seloBot,q=null){const opts=q?{quoted:q}:{quoted:seloBot};try{if(botFotoBuffer)await sock.sendMessage(jid,{image:botFotoBuffer,caption:texto},opts);else if(ppBotUrl)await sock.sendMessage(jid,{image:{url:ppBotUrl},caption:texto},opts);else await sock.sendMessage(jid,{text:texto},{quoted:seloBot});}catch{try{await sock.sendMessage(jid,{text:texto},{quoted:seloBot});}catch{}}}
async function banirComContagem(sock,jid,sender,msgKey,motivo="Infração"){const banKey=`${jid}_${sender}`;if(banEmCurso.has(banKey))return;banEmCurso.add(banKey);try{try{await sock.sendMessage(jid,{delete:msgKey});}catch{}for(let i=5;i>=0;i--){try{await sock.sendMessage(jid,{text:bLine("⏳",`*${i}...*`)});}catch{}await new Promise(r=>setTimeout(r,900));}try{await sock.sendMessage(jid,{text:bBloco("🔨 BAN",[bLine("🚨",`@${sender.split("@")[0]} foi *BANIDO!*`),bLine("📝",`Motivo: ${motivo}`)]),mentions:[sender]});}catch{}await new Promise(r=>setTimeout(r,500));try{await sock.groupParticipantsUpdate(jid,[sender],"remove");}catch{}}finally{setTimeout(()=>banEmCurso.delete(banKey),5000);}}

function extrairBotaoClicado(msg){const legado=msg.message?.buttonsResponseMessage?.selectedButtonId;if(legado)return legado;const nativeFlow=msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage;if(nativeFlow?.paramsJson){try{const p=JSON.parse(nativeFlow.paramsJson);if(p.id)return p.id;}catch{}}const template=msg.message?.templateButtonReplyMessage?.selectedId;if(template)return template;return null;}

// ════════════════════════════════════════════════
// ✅ ASSISTENTE — GRUPO vs PRIVADO
// ════════════════════════════════════════════════
function detectarChamadaAssistente(texto){
  // Verifica se o texto menciona o nome do assistente
  if(!texto)return false;
  const t=removerAcentos(texto.trim().toLowerCase());
  return NOMES_ASSISTENTE.some(n=>{
    const nL=removerAcentos(n);
    return t.startsWith(nL+" ")||t.startsWith(nL+",")||t.startsWith(nL+"!")||t.startsWith(nL+"?")||t===nL||t.includes(" "+nL+" ")||t.includes(","+nL)||t.includes(" "+nL+",");
  });
}

function removerNomeAssistente(texto){
  let t=texto.trim();
  for(const nome of NOMES_ASSISTENTE){
    const regex=new RegExp(`^${nome}[,!?. ]+`,"i");
    t=t.replace(regex,"").trim();
  }
  return t||texto;
}

function adicionarHistorico(jid,role,content){if(!assistenteHistoria[jid])assistenteHistoria[jid]=[];assistenteHistoria[jid].push({role,content});if(assistenteHistoria[jid].length>MAX_HISTORIA_IA*2)assistenteHistoria[jid]=assistenteHistoria[jid].slice(-MAX_HISTORIA_IA*2);}

async function classificarIntencao(pergunta){
  const sistema=`Classificador de intenções para bot WhatsApp. Responde APENAS JSON puro.
Intenções: DOWNLOADS_MUSICA, DOWNLOADS_VIDEO, DOWNLOADS_TIKTOK, CALCULADORA, TEMPO, HORARIO, MOEDAS, ALUGAR, PING, IA_PERGUNTA, IA_PIADA, IA_HISTORIA, IA_POEMA, DESCONHECIDO
Formato: {"intencao":"NOME","parametro":"texto ou vazio","confianca":0-100}`;
  try{const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:"llama-3.1-8b-instant",messages:[{role:"system",content:sistema},{role:"user",content:pergunta}],max_tokens:200,temperature:0.1},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:12000,httpsAgent});const resp=data.choices?.[0]?.message?.content?.trim();const m=resp?.match(/\{[\s\S]+\}/);if(m)return JSON.parse(m[0]);}catch(e){console.log("❌ classificarIntencao:",e.message);}
  return{intencao:"DESCONHECIDO",parametro:"",confianca:0};
}

async function respostaAssistente(pergunta,historico=[],nomeUser){
  const sistema=`Você é Isaías, assistente do bot LORDE LÁ DJUM v3.5 no WhatsApp. Responde em português de Angola. Seja direto, amigável e natural. O utilizador chama-se ${nomeUser}.`;
  try{const msgs=[{role:"system",content:sistema},...historico.slice(-MAX_HISTORIA_IA*2),{role:"user",content:pergunta}];const{data}=await axios.post("https://api.groq.com/openai/v1/chat/completions",{model:"llama-3.1-8b-instant",messages:msgs,max_tokens:600,temperature:0.8},{headers:{Authorization:`Bearer ${CONFIG.GROQ_KEY}`,"Content-Type":"application/json"},timeout:20000,httpsAgent});return data.choices?.[0]?.message?.content?.trim()||"Desculpa, tenta de novo!";}
  catch{return"Desculpa, tive um problema. Tenta de novo!";}
}

async function executarAssistente(sock,jid,msg,sender,seloBot,texto,isDono,isAdmin,isGrupo){
  // ✅ LÓGICA CORRIGIDA:
  // Em GRUPOS: só responde se mencionarem o nome "Isaías"
  // No PRIVADO: responde a tudo directamente
  if(isGrupo){
    if(!detectarChamadaAssistente(texto))return false; // Ignora se não mencionou o nome
  }
  // No privado: continua sem verificar nome

  const nomeUser=sender.split("@")[0].split(":")[0];
  const perguntaLimpa=isGrupo?removerNomeAssistente(texto).trim():texto.trim();
  if(!perguntaLimpa)return isGrupo?true:false;

  await reagir(sock,msg,"🤔");
  try{
    const{intencao,parametro,confianca}=await classificarIntencao(perguntaLimpa);
    console.log(`🤖 IA: ${intencao} (${confianca}%) "${parametro}"`);
    adicionarHistorico(jid,"user",perguntaLimpa);
    const envR=async(txt,emoji="🤖")=>{await sock.sendMessage(jid,{text:txt},{quoted:seloBot});await reagir(sock,msg,emoji);adicionarHistorico(jid,"assistant",txt.slice(0,200));};

    if(intencao==="DOWNLOADS_MUSICA"&&parametro){await reagir(sock,msg,"🎵");const arq=await barraCarregamento(sock,jid,seloBot,`A baixar: ${parametro}`,()=>downloadMusica(parametro,false));if(arq&&fs.existsSync(arq)){try{await enviarAudio(sock,jid,arq,seloBot);await reagir(sock,msg,"✅");addXP(sender,5);adicionarHistorico(jid,"assistant","✅ Aqui está a música!");setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);}catch(e){await envR(bBloco("❌ ERRO",[bLine("💡",`Tenta *!mp3 ${parametro}*`)]),"❌");}}else{await envR(bBloco("❌ NÃO ENCONTREI",[bLine("💡",`Tenta *!mp3 ${parametro}*`)]),"❌");}return true;}
    if(intencao==="DOWNLOADS_VIDEO"&&parametro){await reagir(sock,msg,"🎬");const saida=await barraCarregamento(sock,jid,seloBot,`A baixar vídeo: ${parametro}`,()=>downloadVideo(parametro,480));if(saida&&fs.existsSync(saida)){try{await enviarVideo(sock,jid,saida,bLine("🎬",`_© ${CONFIG.NOME_BOT}_`),[sender],seloBot);await reagir(sock,msg,"✅");addXP(sender,5);setTimeout(()=>{try{fs.removeSync(saida);}catch{}},15000);}catch(e){await envR(bBloco("❌ ERRO",[bLine("💡",`Tenta *!mp4 ${parametro}*`)]),"❌");}}else{await envR(bBloco("❌ NÃO ENCONTREI",[bLine("💡",`Tenta *!mp4 ${parametro}*`)]),"❌");}return true;}
    if(intencao==="DOWNLOADS_TIKTOK"&&parametro){await reagir(sock,msg,"📱");try{const r=await barraCarregamento(sock,jid,seloBot,"A baixar TikTok...",()=>scraperTikTokVideo(parametro));await sock.sendMessage(jid,{video:{url:r.url},caption:bLine("📱",r.title||"TikTok")},{quoted:seloBot});await reagir(sock,msg,"✅");addXP(sender,5);}catch{await envR(bBloco("❌ ERRO",[bLine("💡","Tenta *!tiktok [link]*")]),"❌");}return true;}
    if(intencao==="CALCULADORA"&&parametro){try{const res=calcularSeguro(parametro);await envR(bBloco("🔢 CÁLCULO",[bLine("🔢",`*${parametro}* = *${res}*`)]),"✅");}catch{try{const resp=await chatIA(`Calcula: ${parametro}. Só o resultado.`);await envR(bBloco("🔢 CÁLCULO",[bLine("🔢",`${parametro} = *${resp}*`)]),"✅");}catch{await envR(bBloco("❌ ERRO",[bLine("💡","Expressão inválida.")]),"❌");};}return true;}
    if(intencao==="TEMPO"){const cidade=parametro||"Luanda";try{const res=await axios.get(`https://wttr.in/${encodeURIComponent(cidade)}?format=j1`,{timeout:10000,httpsAgent});const cur=res.data.current_condition[0];await envR(bBloco(`🌤️ ${cidade.toUpperCase()}`,[bLine("🌡️",`*${cur.temp_C}°C* — ${cur.weatherDesc[0].value}`),bLine("💧",`${cur.humidity}% | 💨 ${cur.windspeedKmph}km/h`)]),"✅");}catch{const resp=await chatIA(`Clima em ${cidade} agora? 2 linhas.`);await envR(bBloco(`🌤️ ${cidade.toUpperCase()}`,[bLine("☁️",resp)]),"✅");}return true;}
    if(intencao==="HORARIO"){const agora=new Date();const opc=(tz)=>({timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false});await envR(bBloco("🕐 HORÁRIO",[bLine("🇦🇴",`Angola: *${agora.toLocaleTimeString("pt-AO",opc("Africa/Luanda"))}*`),bLine("🇧🇷",`Brasil: *${agora.toLocaleTimeString("pt-BR",opc("America/Sao_Paulo"))}*`),bLine("🇵🇹",`Portugal: *${agora.toLocaleTimeString("pt-PT",opc("Europe/Lisbon"))}*`)]),"🕐");return true;}
    if(intencao==="MOEDAS"){await envR(bBloco("💰 MOEDAS",[bLine("💰",`*${nomeUser}*, tens *${getCoins(sender)}* moedas!`),bLine("🎁",`Usa *!diario* para ganhar mais!`)]),"💰");return true;}
    if(intencao==="ALUGAR"){await sock.sendMessage(jid,{text:gerarTextoAlugar()},{quoted:seloBot});adicionarHistorico(jid,"assistant","Info de aluguel!");return true;}
    if(intencao==="PING"){const ini=Date.now();await envR(bBloco("📡 PING",[bLine("🏓",`*${Date.now()-ini}ms* | ⏱️ ${Math.floor(process.uptime()/60)} min`)]),"📡");return true;}

    // IA geral
    await reagir(sock,msg,"🧠");
    let prompt=parametro||perguntaLimpa;
    if(intencao==="IA_PIADA")prompt="Conta uma piada engraçada em português de Angola.";
    else if(intencao==="IA_HISTORIA")prompt=`Escreve história curta sobre: ${parametro||"algo interessante"}. Máx 200 palavras.`;
    else if(intencao==="IA_POEMA")prompt=`Escreve poema de 4-6 versos sobre: ${parametro||"Angola"}.`;
    const resp=await respostaAssistente(prompt,assistenteHistoria[jid]||[],nomeUser);
    await sock.sendMessage(jid,{text:resp},{quoted:seloBot});
    await reagir(sock,msg,"🧠");
    adicionarHistorico(jid,"user",prompt);
    adicionarHistorico(jid,"assistant",resp);
    addXP(sender,2);
    return true;
  }catch(e){console.error("❌ Assistente:",e.message);try{await sock.sendMessage(jid,{text:bBloco("😔 ERRO",[bLine("💡","Tenta de novo ou usa *!menu*!")])},{quoted:seloBot});}catch{}return true;}
}

// ════════════════════════════════════════════════
// ✅ JOGOS
// ════════════════════════════════════════════════
const VOF_BANCO=[{p:"O sol é uma estrela.",r:"verdadeiro"},{p:"A baleia é um peixe.",r:"falso"},{p:"O coração tem 4 câmaras.",r:"verdadeiro"},{p:"Angola tem 18 províncias.",r:"verdadeiro"},{p:"A água ferve a 50°C.",r:"falso"},{p:"O elefante é o maior animal terrestre.",r:"verdadeiro"},{p:"A Lua tem atmosfera.",r:"falso"},{p:"Luanda é capital de Angola.",r:"verdadeiro"}];
const QUIZ_BANCO=[{p:"Capital de Angola?",r:"luanda"},{p:"Maior planeta do sistema solar?",r:"jupiter"},{p:"Moeda de Angola?",r:"kwanza"},{p:"Quantos continentes existem?",r:"7"},{p:"Capital do Brasil?",r:"brasilia"},{p:"Em que ano Angola se tornou independente?",r:"1975"}];
const COMPLETAR_BANCO=[{i:"ANG_LA",c:"angola",d:"País da África Austral"},{i:"LU_NDA",c:"luanda",d:"Capital de Angola"},{i:"FU_BOL",c:"futebol",d:"Desporto popular"},{i:"KW_NZA",c:"kwanza",d:"Moeda de Angola"}];
const CACA_BANCO=[{palavra:"ANGOLA",dica:"País da África Austral"},{palavra:"LUANDA",dica:"Capital de Angola"},{palavra:"FUTEBOL",dica:"Desporto popular"},{palavra:"AFRICA",dica:"Continente"},{palavra:"KWANZA",dica:"Moeda de Angola"}];
const GUERRA_BANCO=[{palavra:"ANGOLA",dica:"País África"},{palavra:"LUANDA",dica:"Capital Angola"},{palavra:"FUTEBOL",dica:"Desporto"},{palavra:"DIAMANTE",dica:"Pedra preciosa"},{palavra:"OCEANO",dica:"Massa de água"}];

async function gerarJogoIA(tipo,categoria=null,usadas=[]){
  const sistema="Gerador de jogos educativos. Responde APENAS JSON puro.";
  let prompt="";
  if(tipo==="quiz"){const ev=usadas.length>0?`Evita: ${usadas.slice(-6).join(" | ")}`:"";prompt=`Quiz ${categoria?`sobre:"${categoria}"`:"variado"}. ${ev} JSON: {"pergunta":"Capital de Angola?","resposta":"luanda"}.`;}
  if(tipo==="completar"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:"";prompt=`Palavra Completa. ${ev} JSON: {"inicial":"A_G_LA","completa":"angola","dica":"País África"}.`;}
  if(tipo==="caca"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:"";prompt=`Palavra Caça. ${ev} JSON: {"palavra":"ANGOLA","dica":"País"}. MAIÚSCULAS 4-8 letras.`;}
  if(tipo==="guerra"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(", ")}`:"";prompt=`Palavra Forca. ${ev} JSON: {"palavra":"FUTEBOL","dica":"Desporto"}. 5-9 letras MAIÚSCULAS.`;}
  if(tipo==="vof"){const ev=usadas.length>0?`Evita: ${usadas.slice(-4).join(" | ")}`:"";prompt=`Afirmação V/F. ${ev} JSON: {"pergunta":"O sol é uma estrela.","resposta":"verdadeiro"}.`;}
  try{const resp=await chatIA(prompt,sistema);const m=resp.match(/\{[^{}]+\}/);if(!m)throw new Error("no JSON");const p=JSON.parse(m[0]);
    if(tipo==="quiz"&&p.pergunta&&p.resposta)return{p:p.pergunta,r:p.resposta.toLowerCase().trim()};
    if(tipo==="completar"&&p.inicial&&p.completa)return{i:p.inicial,c:p.completa.toLowerCase().trim(),d:p.dica||"Completa"};
    if(tipo==="caca"&&p.palavra)return{palavra:p.palavra.toUpperCase().replace(/[^A-Z]/g,""),dica:p.dica||"Encontra"};
    if(tipo==="guerra"&&p.palavra)return{palavra:p.palavra.toUpperCase().replace(/[^A-Z]/g,""),dica:p.dica||"Palavra"};
    if(tipo==="vof"&&p.pergunta&&p.resposta)return{p:p.pergunta,r:p.resposta.toLowerCase().trim()};
  }catch(e){console.log(`❌ gerarJogoIA(${tipo}):`,e.message);}
  return null;
}

async function proximaPergunta(sock,jid,seloBot){
  const loop=jogoLoop[jid];if(!loop||!loop.activo)return;
  const{tipo,categoria,usadas=[]}=loop;
  let p=await gerarJogoIA(tipo,categoria,usadas);
  if(!p){if(tipo==="quiz")p=selecionarSemRepetir(QUIZ_BANCO,usadas);if(tipo==="vof")p=selecionarSemRepetir(VOF_BANCO,usadas);if(tipo==="completar")p=selecionarSemRepetir(COMPLETAR_BANCO,usadas);if(tipo==="caca")p=selecionarSemRepetir(CACA_BANCO,usadas);if(tipo==="guerra")p=selecionarSemRepetir(GUERRA_BANCO,usadas);}
  if(!p){loop.usadas=[];if(tipo==="quiz")p=QUIZ_BANCO[Math.floor(Math.random()*QUIZ_BANCO.length)];if(tipo==="vof")p=VOF_BANCO[Math.floor(Math.random()*VOF_BANCO.length)];if(tipo==="completar")p=COMPLETAR_BANCO[Math.floor(Math.random()*COMPLETAR_BANCO.length)];if(tipo==="caca")p=CACA_BANCO[Math.floor(Math.random()*CACA_BANCO.length)];if(tipo==="guerra")p=GUERRA_BANCO[Math.floor(Math.random()*GUERRA_BANCO.length)];}
  if(!p){delete jogoLoop[jid];delete jogoAtivo[jid];return;}
  const idP=p.p||p.palavra||p.c||p.i;loop.usadas=[...(loop.usadas||[]),idP];loop.rodada=(loop.rodada||0)+1;
  const R=`Rodada *${loop.rodada}*`;const S=`\n${bLine("🛑",`*${CONFIG.PREFIXO}stop*`)}`;
  if(tipo==="quiz"){jogoAtivo[jid]={tipo:"quiz",r:p.r};loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="quiz"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:bBloco(`⏰ TEMPO — QUIZ`,[bLine("✅",`Resposta: *${p.r.toUpperCase()}*`)])},{quoted:seloBot});delete jogoAtivo[jid];setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}},25000);await sock.sendMessage(jid,{text:bBloco(`🎮 QUIZ — ${R}`,[bLine("❓",`*${p.p}*`),bLine("⏰","25s | 🏆 +50 XP")])+S},{quoted:seloBot});}
  if(tipo==="vof"){jogoAtivo[jid]={tipo:"vof",r:p.r};loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="vof"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:bBloco("⏰ TEMPO — V/F",[bLine("✅",`Resposta: *${p.r.toUpperCase()}*`)])},{quoted:seloBot});delete jogoAtivo[jid];setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}},20000);await sock.sendMessage(jid,{text:bBloco(`✅❌ V/F — ${R}`,[bLine("❓",`*${p.p}*`),bLine("💬","verdadeiro / falso"),bLine("⏰","20s")])+S},{quoted:seloBot});}
  if(tipo==="completar"){jogoAtivo[jid]={tipo:"completar",r:p.c};loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="completar"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:bBloco("⏰ TEMPO",[bLine("✅",`Resposta: *${p.c.toUpperCase()}*`)])},{quoted:seloBot});delete jogoAtivo[jid];setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}},25000);await sock.sendMessage(jid,{text:bBloco(`🔤 COMPLETA — ${R}`,[bLine("❓",`*${p.i}*`),bLine("💡",p.d),bLine("⏰","25s")])+S},{quoted:seloBot});}
  if(tipo==="caca"){jogoAtivo[jid]={tipo:"caca",r:p.palavra.toLowerCase()};loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="caca"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:bBloco("⏰ TEMPO",[bLine("✅",`Palavra: *${p.palavra}*`)])},{quoted:seloBot});delete jogoAtivo[jid];setTimeout(()=>proximaPergunta(sock,jid,seloBot),5000);}},45000);await sock.sendMessage(jid,{text:bBloco(`🔍 CAÇA-PALAVRAS — ${R}`,[`\`\`\`\n${gerarGrade(p.palavra)}\n\`\`\``,bLine("💡",p.dica),bLine("⏰","45s")])+S},{quoted:seloBot});}
  if(tipo==="guerra"){jogoAtivo[jid]={tipo:"guerra",palavra:p.palavra,dica:p.dica,letrasAcertadas:[],letrasErradas:[],maxErros:6};loop.timeoutHandle=setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="guerra"&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:bBloco("⏰ TEMPO",[bLine("✅",`Palavra: *${p.palavra}*`)])},{quoted:seloBot});delete jogoAtivo[jid];setTimeout(()=>proximaPergunta(sock,jid,seloBot),5000);}},90000);await sock.sendMessage(jid,{text:bBloco(`⚔️ FORCA — ${R}`,[bLine("🔤",p.palavra.split("").map(()=>"_").join(" ")),bLine("💡",p.dica),bLine("❤️","❤️❤️❤️❤️❤️❤️"),bLine("⏰","90s")])+S},{quoted:seloBot});}
}

async function varreduraGrupos(sock){try{console.log("🔍 Scan grupos...");await new Promise(r=>setTimeout(r,4000));const grupos=await sock.groupFetchAllParticipating();let activados=0;for(const[gJid,meta] of Object.entries(grupos)){try{const participantes=(meta.participants||[]).map(p=>extrairJid(p.id||p));const donoNoGrupo=participantes.find(p=>ehDono(p));if(donoNoGrupo){gruposAtivados.add(gJid);activados++;await new Promise(r=>setTimeout(r,300));}}catch{}}console.log(`✅ Scan: ${activados} grupo(s).`);}catch(e){console.log("❌ Scan:",e.message);}}

async function executarReconhecimentoMusica(sock,jid,msg,sender,seloBot){
  const audioData=await downloadAudioDaMensagem(msg);
  if(!audioData){await sock.sendMessage(jid,{text:bBloco("🎵 BUSCA",[bLine("💡",`↩️ Responde nota de voz com *${CONFIG.PREFIXO}busca*`)])},{quoted:seloBot});return;}
  await reagir(sock,msg,"🎵");
  await sock.sendMessage(jid,{text:bBloco("🎵 A RECONHECER...",[bLine("⏳","A identificar a música...")])},{quoted:seloBot});
  try{
    const resultado=await reconhecerMusica(audioData.buffer);
    if(resultado.status==="success"&&resultado.result){
      const r=resultado.result;const spotify=r.spotify?.external_urls?.spotify||"";const coverUrl=r.spotify?.album?.images?.[0]?.url||null;
      const textoMusica=bBloco("🎵 MÚSICA IDENTIFICADA",[bLine("🎵",`*${r.title}*`),bLine("👤",r.artist),bLine("💿",r.album||"N/A"),...(spotify?[bLine("🟢",spotify)]:[])]); 
      if(coverUrl)await sock.sendMessage(jid,{image:{url:coverUrl},caption:textoMusica},{quoted:seloBot});else await sock.sendMessage(jid,{text:textoMusica},{quoted:seloBot});
      await reagir(sock,msg,"🎵");addXP(sender,5);
    }else{await reagir(sock,msg,"❌");await sock.sendMessage(jid,{text:bBloco("❌ NÃO RECONHECI",[bLine("💡","Tenta áudio mais claro.")])},{quoted:seloBot});}
  }catch(e){await reagir(sock,msg,"❌");await sock.sendMessage(jid,{text:bBloco("❌ ERRO",[bLine("💡",e.message)])},{quoted:seloBot});}
}

// ════════════════════════════════════════════════
// ✅ PLAY BANNER + BOTÕES
// ════════════════════════════════════════════════
function montarLegendaPlay(item){return `${B_TOP}\n${bTitle("🎵 "+item.titulo)}\n${B_MID}\n${bLine("👤","Canal: "+item.autor)}\n${item.duracao?bLine("⏱️","Duração: "+item.duracao)+"\n":""}\n${bLine("✨","Selecciona o formato desejado.")}\n${B_BOT}`;}

async function processarComandoPlay(sock,chatJid,msg,query){
  if(!query||!query.trim()){await sock.sendMessage(chatJid,{text:bBloco("⚠️ PLAY",[bLine("💡",`*${CONFIG.PREFIXO}play <nome da música>*`)])},{quoted:criarSeloBot(chatJid)});return;}
  await sock.sendMessage(chatJid,{react:{text:"🔎",key:msg.key}});
  let videos=[];
  try{videos=await scraperYouTubeSearch(query,1);}catch{}
  if(!videos.length){try{const piped=await buscarYouTubePiped(query);if(piped.length)videos=piped;}catch{}}
  if(!videos.length){try{const j=await runCmd(`${YTDLP_CMD} --dump-json --no-playlist --no-warnings ${getYtDlpArgs()} "ytsearch1:${query}" 2>/dev/null`);const linhas=j.trim().split("\n").filter(l=>l.trim().startsWith("{"));videos=linhas.map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);}catch{}}
  if(!videos.length){await sock.sendMessage(chatJid,{react:{text:"❌",key:msg.key}});await sock.sendMessage(chatJid,{text:bBloco("❌ PLAY",[bLine("💡",`Não encontrei: _${query}_`)])},{quoted:criarSeloBot(chatJid)});return;}
  const v=videos[0];
  const item={titulo:(v.title||v.titulo||query).slice(0,60),autor:v.uploader||v.channel||v.canal||v.uploaderName||"N/A",duracao:v.duration?formatarDuracao(v.duration||v.duracao||0):null,thumbnail:v.thumbnail||v.miniatura||null,url:v.webpage_url||v.url||v.link||`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,query,chatJid};
  const chave=salvarPlayCache(item);
  const seloBot=criarSeloBot(chatJid);
  const legenda=montarLegendaPlay(item)+`\n\n👉 Responde: *mp3*, *mp4* ou *doc*\n🆔 \`${chave}\``;
  let bannerMsg=null;

  // Tenta com imagem, cai para texto se falhar
  if(item.thumbnail){
    try{
      bannerMsg=await sock.sendMessage(chatJid,{
        image:{url:item.thumbnail},
        caption:legenda,
        footer:CONFIG.NOME_BOT,
        buttons:[
          {buttonId:`play_mp3_${chave}`,buttonText:{displayText:"🎵 MP3"},type:1},
          {buttonId:`play_mp4_${chave}`,buttonText:{displayText:"🎬 MP4"},type:1},
          {buttonId:`play_doc_${chave}`,buttonText:{displayText:"📄 DOC"},type:1},
        ],
        headerType:4
      },{quoted:msg});
    }catch{}
  }
  if(!bannerMsg){
    try{
      bannerMsg=await sock.sendMessage(chatJid,{
        text:legenda,
        footer:CONFIG.NOME_BOT
      },{quoted:msg});
    }catch{bannerMsg=await sock.sendMessage(chatJid,{text:legenda},{quoted:msg});}
  }

  const itemCached=obterPlayCache(chave);
  if(itemCached)itemCached.bannerKey=bannerMsg?.key;
  await sock.sendMessage(chatJid,{react:{text:"✅",key:msg.key}});
}

async function processarBotaoPlay(sock,msg){
  const chatJid=msg.key.remoteJid;
  let formato=null,chave=null;
  const btnId=extrairBotaoClicado(msg);
  if(btnId&&btnId.startsWith("play_")){const partes=btnId.split("_");formato=partes[1];chave=partes.slice(2).join("_");}
  else{const body=getTexto(msg).toLowerCase().trim();const ctx=msg.message?.extendedTextMessage?.contextInfo;if(ctx?.quotedMessage?.imageMessage?.caption){const cap=ctx.quotedMessage.imageMessage.caption;const match=cap.match(/🆔 `([^`]+)`/);if(match){chave=match[1];if(body.includes("mp3"))formato="mp3";else if(body.includes("mp4"))formato="mp4";else if(body.includes("doc"))formato="doc";}}if(!formato||!chave)return false;}
  const item=obterPlayCache(chave);
  if(!item){await sock.sendMessage(chatJid,{text:bBloco("⌛ EXPIRADO",[bLine("💡",`Usa *!play* novamente.`)])},{quoted:msg});return true;}
  if(item.bannerKey){try{await sock.sendMessage(chatJid,{delete:item.bannerKey});}catch{}}
  const loadingMsg=await rodarLoadingHacker(sock,chatJid,msg,item.titulo,formato);
  let arquivoFinal=null;
  try{
    if(formato==="mp3"){arquivoFinal=await downloadMusica(item.url||item.query,false);if(!arquivoFinal||!fs.existsSync(arquivoFinal))throw new Error("Download falhou");const buf=fs.readFileSync(arquivoFinal);try{await sock.sendMessage(chatJid,{delete:loadingMsg.key});}catch{}await sock.sendMessage(chatJid,{audio:buf,mimetype:"audio/mpeg",fileName:`${item.titulo}.mp3`},{quoted:msg});}
    else if(formato==="mp4"){arquivoFinal=await downloadVideo(item.url||item.query,480);if(!arquivoFinal||!fs.existsSync(arquivoFinal))throw new Error("Download falhou");const buf=fs.readFileSync(arquivoFinal);try{await sock.sendMessage(chatJid,{delete:loadingMsg.key});}catch{}await sock.sendMessage(chatJid,{video:buf,caption:bLine("🎬",item.titulo),mimetype:"video/mp4"},{quoted:msg});}
    else if(formato==="doc"){arquivoFinal=await downloadMusica(item.url||item.query,true);if(!arquivoFinal||!fs.existsSync(arquivoFinal))throw new Error("Download falhou");const buf=fs.readFileSync(arquivoFinal);try{await sock.sendMessage(chatJid,{delete:loadingMsg.key});}catch{}await sock.sendMessage(chatJid,{document:buf,mimetype:"audio/mpeg",fileName:`${item.titulo}.mp3`},{quoted:msg});}
    await sock.sendMessage(chatJid,{react:{text:"✅",key:msg.key}});
  }catch(e){console.error("❌ [PLAY]:",e.message);try{await sock.sendMessage(chatJid,{text:bBloco("⛔ FALHA",[bLine("❌",`_${e.message}_`)]),edit:loadingMsg.key});}catch{await sock.sendMessage(chatJid,{text:bBloco("⛔ FALHA",[bLine("❌",`_${e.message}_`)])},{quoted:msg});}await sock.sendMessage(chatJid,{react:{text:"❌",key:msg.key}});}
  finally{if(arquivoFinal&&fs.existsSync(arquivoFinal)){try{fs.removeSync(arquivoFinal);}catch{}}removerPlayCache(chave);}
  return true;
}

// ════════════════════════════════════════════════
// ✅ TODOS OS COMANDOS
// ════════════════════════════════════════════════
const TODOS_COMANDOS=new Set(["menu","ajuda","sobre","setfoto","alugar","ativaraluguel","statusbot","addai","pp","assistente","isaias-on","isaias-off","isaias-reset","setmenu","play","mp3","mp4","mp4hd","mostre","foto","doc","qr","tourl","ytsearch","tiktok","ttsearch","tttrend","ttuser","instagram","twitter","facebook","kwai","spotify","soundcloud","mediafire","apk","pinterest","pinvideo","pin","sticker","sf","brat","figurinha","figu","piada","conselho","historia","poema","perfil","denunciar","cara","ship","fofoca","quiz","completar","vof","caca","guerra","stop","rank","toprank","matematica","jokenpo","dado","cara-coroa","adivinhar","velocidade","roleta","aki","aposta","shazam","busca","moedas","diario","dar","roubar","topcoins","vz","transcrever","audiotexto","resumiraudio","traduziraudio","audioparaia","ia","resumir","traduzir","fotocopia","fotoparaia","resumirfoto","traduzirfoto","editar","meme","logo","card","calc","encurtar","cotacao","tempo","horario","ping","stats","regras","info","dono","donos","id","ver","apagadas","placar","scanlink","criador","piada18","truth","dare","crush","seduzir","beijo","abraco","tapa","flirt","casal","banir","add","addadmin","removeadmin","fechar","abrir","silenciar","dessilenciar","silenciados","all","att","aviso","link","sorteio","nomegrupo","descgrupo","fotogrupo","apagar","bloq","desbloq","bot","anti-link","vozbot","verifica","addvip","removevip","vips","ergue-se","set","out","prefixo","prefixos","chaton","sms","gsms","cantada","inunca","conselhobiblico","frasemotivacional","piadacurta","curiosidade","bomdia","boanoite","anime","topanimes","animealeatorio","fraseanime","quizanime","rpgstart","rpgstatus","rpgataque","rpgcurar","rpgsorte","rpgclasse","gpt","gemini","deepseek","letra","cifra","bio","album","recomenda","top10","noticias","hoje","fato","pais","wikipedia","signo","definir","sinonimo","previsao","filme","serie","livro","cripto","converter","bau","trabalhar","minerar","pescar","cacada","treinar","missao","dormir","8ball","batalha","inventario","loja","comprar","nivel","crimes","mendigar","explorar","viajar","pinpack","addcase","extraircase","cases","delcase"]);

// ════════════════════════════════════════════════
// ✅ START BOT
// ════════════════════════════════════════════════
let tentativasReconexao=0;

async function startBot(){
  await autoSetup();
  try{
    const{version}=await fetchLatestBaileysVersion();
    const{state,saveCreds}=await useMultiFileAuthState("./sessao");
    const sock=makeWASocket({version,auth:state,printQRInTerminal:false,getMessage:async()=>({conversation:""}),generateHighQualityLinkPreview:false,fetchAgent:httpsAgent,logger:silentLogger,connectTimeoutMs:60000,keepAliveIntervalMs:10000,retryRequestDelayMs:2000,maxMsgRetryCount:3,defaultQueryTimeoutMs:180000});
    sock.ev.on("creds.update",saveCreds);
    setInterval(()=>{try{const now=Date.now();for(const[k,v] of playCacheMap.entries()){if(now-v.criadoEm>15*60*1000)playCacheMap.delete(k);}}catch{}},5*60*1000);

    if(!sock.authState.creds.registered){
      const phoneNumber=CONFIG.NUMERO_BOT.replace(/\D/g,"");
      console.log("⏳ A aguardar ligação...");
      await new Promise(r=>setTimeout(r,8000));
      if(!sock.authState.creds.registered){
        try{const code=await sock.requestPairingCode(phoneNumber);const codeFmt=code?.match(/.{1,4}/g)?.join("-")||code;console.log(`\n${B_TOP}\n${bTitle("🔑 CÓDIGO: "+codeFmt)}\n${bLine("📞","+"+phoneNumber)}\n${B_BOT}\n`);}
        catch(e){console.error("❌ Erro código:",e.message);process.exit(1);}
      }
    }

    sock.ev.on("connection.update",async({connection,lastDisconnect})=>{
      if(connection==="close"){const codigo=lastDisconnect?.error?.output?.statusCode,motivo=lastDisconnect?.error?.message||"desconhecido";console.log(`\n❌ Desconectado | ${codigo} | ${motivo}`);if(codigo===DisconnectReason.loggedOut||codigo===401){if(motivo.includes("conflict")){setTimeout(()=>startBot(),15000);return;}process.exit(0);}tentativasReconexao++;setTimeout(()=>startBot(),Math.min(5000*tentativasReconexao,60000));}
      if(connection==="open"){tentativasReconexao=0;console.log(`\n${B_TOP}\n${bTitle("✅ BOT CONECTADO!")}\n${bLine("📱","+"+CONFIG.NUMERO_BOT)}\n${bLine("🌐",CONFIG.IS_SERVER?"☁️ Servidor":"📱 Local")}\n${B_BOT}\n`);try{ppBotUrl=await sock.profilePictureUrl(sock.user.id,"image");}catch{ppBotUrl=null;}setTimeout(()=>varreduraGrupos(sock),5000);}
    });

    sock.ev.on("group-participants.update",async(update)=>{
      try{const{id,participants,action}=update;if(!participants||!Array.isArray(participants))return;
        if(action==="add"){for(const participante of participants){const p=extrairJid(participante);if(!p||!p.includes("@"))continue;try{const meta=await sock.groupMetadata(id);const admins=meta.participants.filter(m=>m.admin).map(m=>extrairJid(m.id||m));const mentions=[p,...admins];let ppUser=null;try{ppUser=await sock.profilePictureUrl(p,"image");}catch{}const listaAdm=admins.length>0?admins.map(a=>bLine("👮",`@${a.split("@")[0]}`)).join("\n"):"_(sem admins)_";const texto=`${B_TOP}\n${bTitle("🎉 BEM-VINDO!")}\n${B_MID}\n${bLine("👋",`Olá @${p.split("@")[0]}! 🤗`)}\n${bLine("🏘️",`Bem-vindo(a) ao *${meta.subject}*!`)}\n${B_MID}\n${bLine("📋","*REGRAS:*")}\n${bLine("❌","Sem links | Sem spam")}\n${bLine("✅","Respeita todos")}\n${B_MID}\n${bLine("🤖",`Chama *Isaías* para me falar!\n   _"Isaías, ..."_`)}\n${bLine("⌨️",`Ou usa *${CONFIG.PREFIXO}menu*`)}\n${B_BOT}`;if(ppUser)await sock.sendMessage(id,{image:{url:ppUser},caption:texto,mentions});else await sock.sendMessage(id,{text:texto,mentions});}catch(e){console.log("❌ Boas-vindas:",e.message);}}}
        if(action==="remove"){for(const participante of participants){const p=extrairJid(participante);if(!p||!p.includes("@"))continue;try{await sock.sendMessage(id,{text:bLine("👋",`@${p.split("@")[0]} BAZAAA... 😂💨`),mentions:[p]});}catch{}}}
      }catch(e){console.log("❌ group-participants:",e.message);}
    });

    sock.ev.on("messages.upsert",async({messages,type})=>{
      try{
        if(type!=="notify")return;
        const msg=messages[0];if(!msg?.message)return;
        const jid=msg.key.remoteJid,isGrupo=jid.endsWith("@g.us");
        if(jid==="status@broadcast")return;
        if(msg.key.fromMe)return;
        // ✅ SKIP REACÇÕES DE EMOJI, POLLS, E SYSTEM MSGS
        const tipoMsg=Object.keys(msg.message||{})[0]||"";
        const TIPOS_IGNORAR=["reactionMessage","pollUpdateMessage","senderKeyDistributionMessage","protocolMessage","ephemeralMessage","callLogMessage","groupInviteMessage","requestPhoneNumberMessage","keepInMessageList","pinInChatMessage","orderMessage","invoiceMessage","productMessage","botInvokeMessage","interactiveResponseMessage"];
        if(TIPOS_IGNORAR.includes(tipoMsg))return;
        // ✅ SKIP mensagens de bots externos (Meta AI, etc.)
        if(msg.message?.botInvokeMessage)return;
        if(msg.verifiedBizName)return; // ignora mensagens de bots verificados
        // ✅ SKIP emojis escritos como texto ("😂", "👍", "❤️")
        const textoRaw=(msg.message?.conversation||msg.message?.extendedTextMessage?.text||"").trim();
        if(textoRaw.length>0&&textoRaw.length<=8){
          const emojiRegex=/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}\u{1F300}-\u{1F9FF}\u200d\uFE0F\u20E3\u{E0000}-\u{E01FF}]+$/u;
          if(emojiRegex.test(textoRaw))return;
        }
        // ✅ SKIP prefixo sozinho sem comando ("!")
        if(textoRaw===CONFIG.PREFIXO)return;

        const seloBot=criarSeloBot(jid);
        const sender=extrairJid(isGrupo?(msg.key.participant||""):msg.key.remoteJid);
        const isDono=ehDono(sender);
        const texto=getTexto(msg);
        // ✅ Nome de exibição: usa pushName (nome do WhatsApp) ou número
        const nomeExibicao=(msg.pushName||"").trim()||sender.split("@")[0].split(":")[0];

        // ✅ SKIP MÍDIA SEM TEXTO (stickers, fotos sem legenda, áudio, ptt)
        // NÃO processar nada para essas mensagens
        if(eMidiaSemTexto(msg)) return;

        const mencoes=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];

        // Cache msgs
        if(!cacheMsg[jid])cacheMsg[jid]={};
        cacheMsg[jid][msg.key.id]={sender,texto:texto||"",tipo:getTipoMsg(msg),timestamp:Date.now()};
        const cK=Object.keys(cacheMsg[jid]);if(cK.length>MAX_CACHE_MSG)delete cacheMsg[jid][cK[0]];

        // Detectar msgs apagadas
        if(msg.message?.protocolMessage?.type===0){const kD=msg.message.protocolMessage.key,mDI=kD?.id,jD=kD?.remoteJid||jid;const mC=cacheMsg[jD]?.[mDI]||cacheMsg[jid]?.[mDI];if(mC&&(mC.texto||mC.tipo)){if(!msgApagadas[jid])msgApagadas[jid]=[];msgApagadas[jid].push({...mC,apagadoEm:Date.now()});if(msgApagadas[jid].length>30)msgApagadas[jid].shift();}return;}

        // View-once cache
        {const m=msg.message;const voMsg=m?.viewOnceMessage?.message||m?.viewOnceMessageV2?.message||m?.viewOnceMessageV2Extension?.message;if(voMsg){(async()=>{try{const buf=await downloadMediaMessage(msg,"buffer",{});const tipo=voMsg.videoMessage?"video":(voMsg.audioMessage||voMsg.pttMessage)?"audio":"imagem";if(!cacheViewOnce[jid])cacheViewOnce[jid]={};cacheViewOnce[jid][msg.key.id]={tipo,buf,sender,timestamp:Date.now()};setTimeout(()=>{if(cacheViewOnce[jid]?.[msg.key.id])delete cacheViewOnce[jid][msg.key.id];},60*60*1000);}catch{}})();}}

        if(isGrupo){if(!historyMsgs[jid])historyMsgs[jid]=[];historyMsgs[jid].push({key:msg.key,sender,texto:texto||"",timestamp:Date.now()});if(historyMsgs[jid].length>MAX_HISTORY)historyMsgs[jid].shift();addXP(sender,2);registarAtividade(sender,jid);salvarNoBuffer(jid,{sender,texto,mencoes,timestamp:Date.now()});}

        // ✅ BOTÕES PLAY (prioridade máxima)
        if(msg.message?.buttonsResponseMessage||msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage||msg.message?.templateButtonReplyMessage){
          const btnId=extrairBotaoClicado(msg);
          if(btnId&&btnId.startsWith("play_")){const tratou=await processarBotaoPlay(sock,msg);if(tratou)return;}
          if(btnId&&btnId.startsWith("cat_")){await enviarSubmenu(sock,jid,msg,btnId,seloBot,sender,isDono);return;}
        }

        // List response (menu carrossel)
        const listResp=msg.message?.listResponseMessage;
        if(listResp){const catId=listResp.singleSelectReply?.selectedRowId;if(catId&&catId.startsWith("cat_")){if(isGrupo&&!isDono&&!gruposAtivados.has(jid))return;if(chatsDesativados.has(jid)&&!isDono)return;let isAdmin2=isDono;if(isGrupo&&!isDono){try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p));isAdmin2=admins.includes(sender);}catch{}}if(!isDono&&!senhasAprovadas.has(sender)){if(isGrupo&&isAdmin2){senhasAprovadas.add(sender);}else return;}await enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono);return;}}

        // Interactive response
        const interResp=msg.message?.interactiveResponseMessage;
        if(interResp){let catId=null;try{const nf=interResp.nativeFlowResponseMessage;if(nf?.paramsJson){const params=JSON.parse(nf.paramsJson);catId=params.id||params.selectedId||params.rowId||null;}}catch{}if(!catId)catId=interResp.body||null;if(catId){if(catId.startsWith("play_")){const tratou=await processarBotaoPlay(sock,msg);if(tratou)return;}if(catId.startsWith("cat_")){if(isGrupo&&!isDono&&!gruposAtivados.has(jid))return;if(chatsDesativados.has(jid)&&!isDono)return;await enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono);return;}}}

        // !ergue-se
        if(isDono&&isGrupo&&texto===`${CONFIG.PREFIXO}ergue-se`){gruposAtivados.add(jid);const caption=bBloco("✅ ERGUE-TE! 🤴🏽",[bLine("🔒","Anti-link: *ACTIVO*"),bLine("🤖","Isaías: Menciona o nome dele!"),bLine("🌐",CONFIG.IS_SERVER?"☁️ Servidor":"📱 Local"),bLine("💡",`Usa *${CONFIG.PREFIXO}menu*!`)]);await reagir(sock,msg,"✅");if(botFotoBuffer)await sock.sendMessage(jid,{image:botFotoBuffer,caption},{quoted:seloBot});else await sock.sendMessage(jid,{text:caption},{quoted:seloBot});return;}

        // ✅ ALUGUEL — grupos precisam de aluguel activo
        if(isGrupo&&!isDono){
          const aluguelActivo=gruposAtivados.has(jid)||verificarAluguel(jid);
          if(!aluguelActivo){
            // Notifica só se usou um comando com prefixo
            if(texto&&texto.startsWith(CONFIG.PREFIXO)&&texto.trim()!==CONFIG.PREFIXO){
              await sock.sendMessage(jid,{text:bBloco("⏰ ALUGUEL INACTIVO",[bLine("❌","Bot sem aluguel activo neste grupo!"),bLine("💰",`Contacta *${CONFIG.DONO_NUM}* para alugar.`)])},{quoted:seloBot});
            }
            return;
          }
          // ✅ Aluguel activo = todos auto-aprovados, sem necessidade de !pp
          if(!senhasAprovadas.has(sender)) senhasAprovadas.add(sender);
          // Verificar se expirou durante sessão
          await verificarExpiracaoAluguel(sock,jid);
        }
        // No PRIVADO — a senha (!pp) ainda é necessária (tratada abaixo)
        if(chatsDesativados.has(jid)&&!isDono)return;

        let isAdmin=isDono;
        if(isGrupo&&!isDono){try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p));isAdmin=admins.includes(sender);}catch{}}

        if(isGrupo&&!isAdmin&&(membrosSilenciados[jid]||[]).includes(sender)){try{await sock.sendMessage(jid,{delete:msg.key});}catch{};return;}
        if(isGrupo&&!isAdmin&&ehMencaoStatus(msg,texto)){banirComContagem(sock,jid,sender,msg.key,"Menção de status ⛔");return;}
        if(isGrupo&&!isAdmin&&!antiLinkDesativado.has(jid)&&LINK_RX.test(texto)){banirComContagem(sock,jid,sender,msg.key,"Link proibido 🔗❌");return;}
        if(isGrupo&&!isAdmin&&mencoes.length>5){banirComContagem(sock,jid,sender,msg.key,"Spam de menções 📢❌");return;}

        // ✅ GATE !pp — antes de tudo
        if(texto.startsWith(CONFIG.PREFIXO)){
          const args2=texto.slice(CONFIG.PREFIXO.length).trim().split(/\s+/);
          const cmd2=args2[0]?.toLowerCase();
          if(cmd2==="pp"){
            const codigoFornecido=args2.slice(1).join(" ").trim();
            if(!codigoFornecido){await sock.sendMessage(jid,{text:bBloco("🔑 PALAVRA-PASSE",[bLine("💡",`Uso: *${CONFIG.PREFIXO}pp [código]*`)])},{quoted:seloBot});return;}
            if(codigoFornecido===CONFIG.SENHA_BOT){senhasAprovadas.add(sender);await sock.sendMessage(jid,{text:bBloco("✅ ACESSO LIBERADO! 🎉",[bLine("🎉","Bem-vindo(a)!"),bLine("🤖","Chama *Isaías* no grupo ou fala directamente no privado!"),bLine("💡",`Usa *${CONFIG.PREFIXO}menu*!`)])},{quoted:seloBot});await reagir(sock,msg,"✅");}
            else{await sock.sendMessage(jid,{text:bBloco("❌ CÓDIGO ERRADO",[bLine("💡",`Contacta ${CONFIG.DONO_NUM}.`)])},{quoted:seloBot});await reagir(sock,msg,"❌");}
            return;
          }
        }

        // ✅ ASSISTENTE IA — mensagens SEM prefixo
        if(texto&&!texto.startsWith(CONFIG.PREFIXO)){
          // Gate de senha
          if(!isDono&&!senhasAprovadas.has(sender)){
            if(texto.trim()===CONFIG.SENHA_BOT){senhasAprovadas.add(sender);await sock.sendMessage(jid,{text:bBloco("✅ ACESSO LIBERADO!",[bLine("💡",`Usa *${CONFIG.PREFIXO}menu*!`)])},{quoted:seloBot});return;}
            // Em grupos: só notifica se mencionou o Isaías
            if(isGrupo&&detectarChamadaAssistente(texto)){await sock.sendMessage(jid,{text:bBloco("🔒 ACESSO RESTRITO",[bLine("💡",`Usa *${CONFIG.PREFIXO}pp [código]* para entrar.`),bLine("📞",`Contacta ${CONFIG.DONO_NUM}`)])},{quoted:seloBot});return;}
            // No privado: avisa para fazer !pp
            if(!isGrupo){const chave=`pw_${sender}_${jid}`;if(!pedidoSenha.has(chave)){pedidoSenha.add(chave);setTimeout(()=>pedidoSenha.delete(chave),60000);await sock.sendMessage(jid,{text:bBloco("🔒 ACESSO RESTRITO",[bLine("💡",`Usa *${CONFIG.PREFIXO}pp [código]* para entrar.`),bLine("📞",`Contacta ${CONFIG.DONO_NUM}`)])},{quoted:seloBot});}}
            return;
          }

          // ✅ Tenta o assistente — passa isGrupo para lógica correcta
          const foiAssistente=await executarAssistente(sock,jid,msg,sender,seloBot,texto,isDono,isAdmin,isGrupo);
          if(foiAssistente)return;

          // Números para menu fallback
          if(/^[0-9]$/.test(texto.trim())){const chaveMenu=`${jid}_${sender}`;const estadoMenu=menuEsperandoResposta.get(chaveMenu);if(estadoMenu&&(Date.now()-estadoMenu.timestamp)<120000){const catId=MENU_NUMEROS[texto.trim()];if(catId){if(catId==="cat_dono"&&!estadoMenu.isDono){await sock.sendMessage(jid,{text:bLine("🔒","Apenas o dono.")},{quoted:seloBot});return;}menuEsperandoResposta.delete(chaveMenu);await enviarSubmenu(sock,jid,msg,catId,seloBot,sender,isDono);return;}}}

          // Resposta play (mp3/mp4/doc em texto)
          const bodyLower=texto.toLowerCase().trim();
          const ctx=msg.message?.extendedTextMessage?.contextInfo;
          if(ctx?.quotedMessage?.imageMessage?.caption){const cap=ctx.quotedMessage.imageMessage.caption;const match=cap.match(/🆔 `([^`]+)`/);if(match){const chave=match[1];let formato=null;if(bodyLower==="mp3"||bodyLower.includes("mp3"))formato="mp3";else if(bodyLower==="mp4"||bodyLower.includes("mp4"))formato="mp4";else if(bodyLower==="doc"||bodyLower.includes("doc"))formato="doc";if(formato){const item=obterPlayCache(chave);if(item){const fakeBtnMsg={...msg,message:{...msg.message,buttonsResponseMessage:{selectedButtonId:`play_${formato}_${chave}`}}};await processarBotaoPlay(sock,fakeBtnMsg);return;}}}}
          return;
        }

        // Sem texto mas com prefixo — informa
        if(texto.trim()===CONFIG.PREFIXO){await reagir(sock,msg,"🌀");await sock.sendMessage(jid,{text:bBloco("🌀 PREFIXO",[bLine("⌨️",`Prefixo: *${CONFIG.PREFIXO}*`),bLine("💡",`Usa *${CONFIG.PREFIXO}menu* ou chama _Isaías_!`)])},{quoted:seloBot});return;}

        // Gate de senha para comandos
        if(!isDono&&!senhasAprovadas.has(sender)){if(isGrupo&&isAdmin){senhasAprovadas.add(sender);}else{const chave=`pw_${sender}_${jid}`;if(!pedidoSenha.has(chave)){pedidoSenha.add(chave);setTimeout(()=>pedidoSenha.delete(chave),60000);await sock.sendMessage(jid,{text:bBloco("🔒 ACESSO RESTRITO",[bLine("💡",`Usa *${CONFIG.PREFIXO}pp [código]* para entrar.`),bLine("📞",`Contacta ${CONFIG.DONO_NUM}`)])},{quoted:seloBot});}return;}}

        if(!isDono&&!verificarRateLimit(sender)){await reagir(sock,msg,"⏳");return;}

        const args=texto.slice(CONFIG.PREFIXO.length).trim().split(/\s+/);
        const comando=args.shift().toLowerCase();
        await reagir(sock,msg,"⏳");
        salvarStats(comando,sender);

        // ═══════════════════════════════════════
        // ✅ JOGOS ACTIVOS — respostas inline
        // ═══════════════════════════════════════
        if(isGrupo&&jogoAtivo[jid]){
          const jogo=jogoAtivo[jid],resp=texto.toLowerCase().trim(),loop=jogoLoop[jid];
          const acertou=async(xp)=>{addXP(sender,xp);addCoins(sender,xp/2|0);await reagir(sock,msg,"🎉");await sock.sendMessage(jid,{text:bBloco("🎉 CORRETO!",[bLine("✅",`@${sender.split("@")[0]} acertou!`),bLine("🏆",`+${xp} XP | +${xp/2|0} 💰`),...(loop?.activo?[bLine("⏳","Próxima em 3s...")]:[])]),mentions:[sender]},{quoted:seloBot});if(loop?.timeoutHandle)clearTimeout(loop.timeoutHandle);delete jogoAtivo[jid];if(loop?.activo)setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);};
          if(jogo.tipo==="quiz"&&resp===jogo.r){await acertou(50);return;}
          if(jogo.tipo==="completar"&&resp===jogo.r){await acertou(40);return;}
          if(jogo.tipo==="caca"&&resp===jogo.r){await acertou(60);return;}
          if(jogo.tipo==="matematica"&&resp===jogo.r){await acertou(30);return;}
          if(jogo.tipo==="vof"){const ru=resp==="v"?"verdadeiro":resp==="f"?"falso":resp;if(ru==="verdadeiro"||ru==="falso"){if(ru===jogo.r){await acertou(30);}else{await reagir(sock,msg,"❌");await sock.sendMessage(jid,{text:bBloco("❌ ERRADO",[bLine("✅",`Resposta: *${jogo.r.toUpperCase()}*`)])},{quoted:seloBot});if(loop?.timeoutHandle)clearTimeout(loop.timeoutHandle);delete jogoAtivo[jid];if(loop?.activo)setTimeout(()=>proximaPergunta(sock,jid,seloBot),3000);}return;}}
          if(jogo.tipo==="guerra"){const lP=texto.toUpperCase().trim().replace(/[^A-Z]/g,"");if(!lP)return;if(lP===jogo.palavra){await acertou(80);return;}if(lP.length===1){if(jogo.letrasAcertadas.includes(lP)||jogo.letrasErradas.includes(lP)){await sock.sendMessage(jid,{text:bLine("⚠️",`*${lP}* já foi usada!\n\n${mostrarGuerraEstado(jogo)}`)},{quoted:seloBot});return;}if(jogo.palavra.includes(lP)){jogo.letrasAcertadas.push(lP);const pM=jogo.palavra.split("").map(l=>jogo.letrasAcertadas.includes(l)?l:"_").join(" ");if(!pM.includes("_")){await acertou(80);return;}await sock.sendMessage(jid,{text:bLine("✅",`*${lP}* está!\n\n${mostrarGuerraEstado(jogo)}`)},{quoted:seloBot});}else{jogo.letrasErradas.push(lP);if(jogo.letrasErradas.length>=jogo.maxErros){await sock.sendMessage(jid,{text:bBloco("💀 FIM!",[bLine("📝",`Palavra: *${jogo.palavra}*`),...(loop?.activo?[bLine("⏳","Próxima em 5s...")]:[])])},{quoted:seloBot});if(loop?.timeoutHandle)clearTimeout(loop.timeoutHandle);delete jogoAtivo[jid];if(loop?.activo)setTimeout(()=>proximaPergunta(sock,jid,seloBot),5000);}else{await sock.sendMessage(jid,{text:bLine("❌",`*${lP}* NÃO está!\n\n${mostrarGuerraEstado(jogo)}`)},{quoted:seloBot});}}return;}}
        }

        if(jogoAdivinhar[jid]){const num=parseInt(texto.trim());if(!isNaN(num)){const jogo=jogoAdivinhar[jid];jogo.tentativas++;if(num===jogo.numero){const xp=Math.max(10,50-jogo.tentativas*5);addXP(sender,xp);addCoins(sender,xp/2|0);await sock.sendMessage(jid,{text:bBloco("🎉 CORRETO!",[bLine("🎯",`Era o *${jogo.numero}*!`),bLine("🎲",`Tentativas: *${jogo.tentativas}*`),bLine("🏆",`+${xp} XP`)]),mentions:[sender]},{quoted:seloBot});delete jogoAdivinhar[jid];return;}else{const dica=num<jogo.numero?"📈 Mais alto!":"📉 Mais baixo!";if(jogo.tentativas>=20){await sock.sendMessage(jid,{text:bBloco("💀 FIM!",[bLine("📝",`Era o *${jogo.numero}*!`)])},{quoted:seloBot});delete jogoAdivinhar[jid];return;}try{if(jogo.msgKey)await sock.sendMessage(jid,{text:bBloco("🎯 ADIVINHAR",[bLine(dica.split(" ")[0],dica),bLine("🎲",`Tentativas: *${jogo.tentativas}*`)]),edit:jogo.msgKey});}catch{await sock.sendMessage(jid,{text:bBloco("🎯",[bLine(dica.split(" ")[0],dica)])},{quoted:seloBot});}return;}}}

        if(jogoVelocidade[jid]){const jogo=jogoVelocidade[jid];if(texto.toLowerCase().trim()===jogo.palavra){const tempo=((Date.now()-jogo.inicio)/1000).toFixed(1);const xp=tempo<5?100:tempo<10?70:tempo<20?50:30;addXP(sender,xp);addCoins(sender,xp/2|0);await sock.sendMessage(jid,{text:bBloco("⚡ INCRÍVEL!",[bLine("✅",`${tempo}s!`),bLine("🏆",`+${xp} XP | +${xp/2|0} 💰`)]),mentions:[sender]},{quoted:seloBot});delete jogoVelocidade[jid];return;}}

        // ✅ Wake word áudio (só no privado ou se activado no grupo)
        const audioMsgDireto=msg.message?.audioMessage||msg.message?.pttMessage;
        if(audioMsgDireto&&!vozBotDesativado.has(jid)){
          // Áudio só é processado se: privado OU activado explicitamente
          const voiceLimitKey=`voice_${sender}`,agoraV=Date.now();
          if(!userRateLimit[voiceLimitKey]||(agoraV-userRateLimit[voiceLimitKey])>3000){
            userRateLimit[voiceLimitKey]=agoraV;
            (async()=>{try{
              const audioData=await downloadAudioDaMensagem(msg);if(!audioData)return;
              const transcricao=await transcreverComGroq(audioData.buffer);
              // Em grupo: só se mencionar Isaías na transcrição
              if(isGrupo&&!detectarChamadaAssistente(transcricao))return;
              const pergunta=isGrupo?removerNomeAssistente(transcricao).trim():transcricao;
              if(!pergunta)return;
              await reagir(sock,msg,"🎙️");
              await sock.sendMessage(jid,{text:bLine("🎙️",`_"${transcricao}"_`)},{quoted:seloBot});
              const resposta=await chatIA(pergunta);
              try{const audioPath=await textoParaFala(resposta);await enviarAudio(sock,jid,audioPath,seloBot);try{fs.removeSync(audioPath);}catch{};}catch{await sock.sendMessage(jid,{text:bBloco("🤖 ISAÍAS",[bLine("🤖",resposta)])},{quoted:seloBot});}
              addXP(sender,5);
            }catch(e){console.log("❌ Wake word:",e.message);}})();
          }
          return;
        }

        if(comandosBloqueados.has(jid)&&!isAdmin&&!["bloq","desbloq","pp"].includes(comando)){await sock.sendMessage(jid,{text:bLine("🔒","*Comandos bloqueados!*")},{quoted:seloBot});await reagir(sock,msg,"🔒");return;}

        // ════════════════════════════════════════
        // ✅ COMANDO ERRADO — SIMILARIDADE + STICKER
        // ════════════════════════════════════════
        if(!TODOS_COMANDOS.has(comando)){
          // ✅ Verifica se é uma case dinâmica (código guardado)
          const cases=carregarCases();
          if(cases[comando]){
            const caseEntry=cases[comando];
            try{
              // Contexto completo passado para a case
              const caseCtx={
                sock,jid,msg,sender,seloBot,args,texto,
                isDono,isAdmin,isGrupo,mencoes,nomeExibicao,CONFIG,
                B_TOP,B_MID,B_BOT,B_SEP,bLine,bBloco,bTitle,
                chatIA,reagir,addXP,addCoins,getCoins,isVip,
                downloadMusica,downloadVideo,axios,fs,path,
                extrairJid,removerAcentos,formatarDuracao,
                criarSticker,stickerParaFoto,
                FRAMES_LOADING,getYtDlpArgs,runCmd,
              };
              const fn=new Function(`return (${caseEntry.codigo})`);
              await fn()(caseCtx);
            }catch(caseErr){
              console.error(`❌ Case !${comando}:`,caseErr.message);
              await sock.sendMessage(jid,{text:bBloco("❌ ERRO NA CASE",[
                bLine("📦",`*!${comando}*`),
                bLine("🔴",caseErr.message.slice(0,120)),
                bLine("💡","Usa *!extraircase "+comando+"* para ver o código"),
              ])},{quoted:seloBot});
            }
            return;
          }
          // Comando mesmo não existe — sugestão de similaridade
          const todosComandosComCases=[...TODOS_COMANDOS,...Object.keys(cases)];
          const cmdSimilar=encontrarComandoSimilar(comando,todosComandosComCases);
          await reagir(sock,msg,"❓");
          if(cmdSimilar){
            await sock.sendMessage(jid,{text:`❌ *!${comando}* não existe. Quiseste *!${cmdSimilar}* ? 😅`},{quoted:seloBot});
          }else{
            await sock.sendMessage(jid,{text:`❌ *!${comando}* não existe. Usa *!menu* 😅`},{quoted:seloBot});
          }
          return;
        }

        const CMDS_ADMIN=["banir","addadmin","removeadmin","fechar","abrir","all","att","anti-link","bot","link","sorteio","verifica","silenciar","dessilenciar","silenciados","add","aviso","apagar","vozbot","bloq","desbloq","nomegrupo","descgrupo","fotogrupo","scanlink","addai","addvip","removevip","vips"];
        if(CMDS_ADMIN.includes(comando)&&!isAdmin){await sock.sendMessage(jid,{text:bLine("🔒","*Apenas administradores.*")},{quoted:seloBot});await reagir(sock,msg,"🚫");return;}
        const CMDS_DONO=["out","prefixo","prefixos","set","chaton","sms","gsms","setfoto"];
        if(CMDS_DONO.includes(comando)&&!isDono){await sock.sendMessage(jid,{text:bLine("🔒","*Apenas o dono.*")},{quoted:seloBot});await reagir(sock,msg,"🚫");return;}
        const CMDS_18=["piada18","truth","dare","crush","seduzir","beijo","abraco","tapa","flirt","casal"];
        if(CMDS_18.includes(comando)&&!isDono&&!isVip(sender)){await sock.sendMessage(jid,{text:bBloco("🔞 VIP EXCLUSIVO",[bLine("💡",`Usa *${CONFIG.PREFIXO}alugar* para ser VIP 💎`)])},{quoted:seloBot});await reagir(sock,msg,"🔞");return;}

        // ═══════════════════════════════════════
        //   ✅ HANDLERS DOS COMANDOS
        // ═══════════════════════════════════════

        // ─── SETMENU ───
        if(comando==="setmenu"){if(!isDono){await sock.sendMessage(jid,{text:bBloco("🔒 ACESSO NEGADO",[bLine("❌","Apenas o dono.")])},{quoted:seloBot});return;}const novoEmoji=args[0]?.trim();if(!novoEmoji){await sock.sendMessage(jid,{text:bBloco("⚙️ SETMENU",[bLine("💡",`*${CONFIG.PREFIXO}setmenu* [emoji]`),bLine("💡",`Ex: *${CONFIG.PREFIXO}setmenu* 🔥`),B_SEP,bLine(ME.e||"🌀",`Actual: *${ME.e||ME.principal}*`)])},{quoted:seloBot});return;}Object.keys(ME).forEach(k=>{ME[k]=novoEmoji;});ME.e=novoEmoji;salvarEmojis(ME);await sock.sendMessage(jid,{text:bBloco("✅ EMOJIS ACTUALIZADOS",[bLine("✅",`Todos os menus usam: *${novoEmoji}*`),bLine("💡",`Usa *${CONFIG.PREFIXO}menu* para ver!`)])},{quoted:seloBot});await reagir(sock,msg,"✅");return;}

        // ─── PP ───
        if(comando==="pp"){const codigoFornecido=args.join(" ").trim();if(!codigoFornecido){await sock.sendMessage(jid,{text:bBloco("🔑 PALAVRA-PASSE",[bLine("💡",`Uso: *${CONFIG.PREFIXO}pp [código]*`)])},{quoted:seloBot});return;}if(codigoFornecido===CONFIG.SENHA_BOT){senhasAprovadas.add(sender);await sock.sendMessage(jid,{text:bBloco("✅ ACESSO LIBERADO!",[bLine("🎉","Bem-vindo(a)!"),bLine("🤖","Chama *Isaías* no grupo!"),bLine("💡",`Usa *${CONFIG.PREFIXO}menu*!`)])},{quoted:seloBot});await reagir(sock,msg,"✅");}else{await sock.sendMessage(jid,{text:bBloco("❌ CÓDIGO ERRADO",[bLine("💡",`Contacta ${CONFIG.DONO_NUM}.`)])},{quoted:seloBot});await reagir(sock,msg,"❌");}return;}

        // ─── ASSISTENTE ───
        if(comando==="assistente"||comando==="isaias-on"){assistenteAtivo.add(jid);await sock.sendMessage(jid,{text:bBloco("🤖 ISAÍAS IA",[bLine("✅","Activado!"),bLine("💡","*Em grupos:* menciona o nome dele!"),bLine("📱","*No privado:* fala directamente!"),bLine("💬","_\"Isaías, baixa música...\"_")])},{quoted:seloBot});await reagir(sock,msg,"🤖");return;}
        if(comando==="isaias-off"){assistenteAtivo.delete(jid);delete assistenteHistoria[jid];await sock.sendMessage(jid,{text:bBloco("🔴 ISAÍAS DESACTIVADO",[bLine("💡",`Usa *!assistente* para religar.`)])},{quoted:seloBot});await reagir(sock,msg,"🔴");return;}
        if(comando==="isaias-reset"){delete assistenteHistoria[jid];await sock.sendMessage(jid,{text:bBloco("🔄 CONVERSA REINICIADA",[bLine("✅","Histórico apagado!")])},{quoted:seloBot});await reagir(sock,msg,"🔄");return;}

        // ─── MENU / INFO ───
        if(comando==="setfoto"){const imgBuf=await downloadImagemDaMensagem(msg);if(!imgBuf){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde imagem com *${CONFIG.PREFIXO}setfoto*`)},{quoted:seloBot});return;}botFotoBuffer=imgBuf;fs.writeFileSync(BOT_FOTO_PATH,imgBuf);await sock.sendMessage(jid,{image:imgBuf,caption:bBloco("✅ FOTO ACTUALIZADA",[bLine("✅","Foto do bot actualizada!")])},{quoted:seloBot});await reagir(sock,msg,"✅");return;}
        // ─── ALUGAR ───
        if(comando==="alugar"){
          if(!args[0]){await sock.sendMessage(jid,{text:gerarTextoAlugar()},{quoted:seloBot});await reagir(sock,msg,"💰");return;}
          if(!isDono){await sock.sendMessage(jid,{text:"❌ Apenas o *dono* pode activar o aluguel."},{quoted:seloBot});return;}
          if(!isGrupo){await sock.sendMessage(jid,{text:"❌ Usa *!alugar [dias]* dentro do grupo a activar."},{quoted:seloBot});return;}
          const diasArg=parseInt(args[0]);
          if(isNaN(diasArg)||diasArg<1){await sock.sendMessage(jid,{text:bBloco("💰 ALUGUEL",[bLine("💡","Uso: *!alugar [dias]*"),bLine("💡","Ex: *!alugar 3* → 3 dias | *!alugar 30* → 1 mês")])},{quoted:seloBot});return;}
          const expira=ativarAluguel(jid,diasArg);
          gruposAtivados.add(jid);
          const dataExpira=new Date(expira).toLocaleDateString("pt-AO",{timeZone:"Africa/Luanda",day:"2-digit",month:"2-digit",year:"numeric"});
          await sock.sendMessage(jid,{text:bBloco("✅ ALUGUEL ACTIVADO!",[bLine("📅",`Duração: *${diasArg} dias*`),bLine("⏳",`Expira: *${dataExpira}*`),bLine("🔓","Membros dispensados de *!pp*"),bLine("🤖","Bot activo neste grupo!")])},{quoted:seloBot});
          await reagir(sock,msg,"✅");
          return;
        }

        // ─── ATIVARALUGUEL redirect ───
        if(comando==="ativaraluguel"){await sock.sendMessage(jid,{text:"💡 Usa *!alugar [dias]* directamente no grupo."},{quoted:seloBot});return;}

        // ─── STATUS BOT ───
        if(comando==="statusbot"){
          const al=infoAluguel(jid);const ativo=verificarAluguel(jid);const diasR=diasRestantes(jid);
          if(!isGrupo){await sock.sendMessage(jid,{text:bBloco("📊 STATUS",[bLine("📱","Privado — sempre activo!")])},{quoted:seloBot});return;}
          if(ativo&&al){
            const dataExp=new Date(al.expiraEm).toLocaleDateString("pt-AO",{timeZone:"Africa/Luanda",day:"2-digit",month:"2-digit",year:"numeric"});
            await sock.sendMessage(jid,{text:bBloco("📊 STATUS BOT",[bLine("✅","Aluguel: *ACTIVO* 🟢"),bLine("📅",`Expira: *${dataExp}*`),bLine("⏳",`Restam: *${diasR} dias*`)])},{quoted:seloBot});
          }else{
            await sock.sendMessage(jid,{text:bBloco("📊 STATUS BOT",[bLine("❌","Aluguel: *INACTIVO* 🔴"),bLine("💰",`*!alugar [dias]* para activar`)])},{quoted:seloBot});
          }
          return;
        }
        if(comando==="addai"){if(!isGrupo){await sock.sendMessage(jid,{text:bLine("❌","Só em grupos.")},{quoted:seloBot});return;}try{await sock.groupParticipantsUpdate(jid,["867051314767696@bot"],"add");await sock.sendMessage(jid,{text:bLine("✅","Meta AI adicionada!")},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="menu"||comando==="ajuda"){const sub=args[0]?.toLowerCase();const catMap={principal:"cat_principal",downloads:"cat_downloads",musicas:"cat_musicas",figurinhas:"cat_figurinhas",brincadeiras:"cat_brincadeiras",coins:"cat_coins",alteradores:"cat_alteradores",logos:"cat_logos",pesquisas:"cat_pesquisas",animes:"cat_animes",rpg:"cat_rpg",ias:"cat_ias",plaquinhas:"cat_plaquinhas","18":"cat_18",adm:"cat_adm",dono:"cat_dono",assistente:"cat_assistente"};if(sub&&catMap[sub]){await enviarSubmenu(sock,jid,msg,catMap[sub],seloBot,sender,isDono);}else{await enviarMenuPrincipal(sock,jid,msg,isDono,sender,isAdmin,seloBot);}return;}
        if(comando==="sobre"){await enviarComSelo(sock,jid,bBloco("🤖 SOBRE",[bLine("🤖",`*${CONFIG.NOME_BOT}*`),bLine("👑",`*${CONFIG.DONO_NOME}*`),bLine("📦","@itsliaaa/baileys"),bLine("✅","Estética cases.js style"),bLine("✅","Isaías só responde quando mencionado"),bLine("✅","!pin — Pinterest multi-imagem"),bLine("✅","30+ comandos"),bLine("🟢",`© ${CONFIG.NOME_BOT} — 24/7`)]),seloBot);return;}
        if(comando==="set"){const novaSenha=args.join(" ").replace(/['"]/g,"").trim();if(!novaSenha){await sock.sendMessage(jid,{text:bLine("🔑",`*${CONFIG.PREFIXO}set [nova_senha]*`)},{quoted:seloBot});return;}CONFIG.SENHA_BOT=novaSenha;senhasAprovadas.clear();await sock.sendMessage(jid,{text:bBloco("✅ SENHA ALTERADA",[bLine("🔑",`Senha: *${novaSenha}*`)])},{quoted:seloBot});await reagir(sock,msg,"🔑");return;}
        if(comando==="id"){await sock.sendMessage(jid,{text:bBloco("📱 INFO",[bLine("📱",`_${sender}_`),bLine("👑",`Dono: ${isDono?"✅":"❌"} | 👮 Admin: ${isAdmin?"✅":"❌"}`),bLine("💎",`VIP: ${isVip(sender)?"✅":"❌"}`),bLine("🔑",`Acesso: ${senhasAprovadas.has(sender)||isDono?"✅":"❌"}`)])},{quoted:seloBot});return;}
        if(comando==="out"){if(!isGrupo){await sock.sendMessage(jid,{text:bLine("❌","Só em grupos.")},{quoted:seloBot});return;}try{await sock.sendMessage(jid,{text:bLine("👋","*Bot a sair...*")},{quoted:seloBot});await new Promise(r=>setTimeout(r,1000));await sock.groupLeave(jid);}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="prefixo"||comando==="prefixos"){
          if(!args[0]){
            // Resposta bonita mostrando o prefixo actual (imagem 1)
            const textoP=bBloco("⌨️ PREFIXO",[
              bLine("⌨️",`Prefixo actual: *${CONFIG.PREFIXO}*`),
              bLine("💡","Para mudar: *!prefixo [símbolo]*"),
              B_SEP,
              bLine("📋","*Comandos usam:* "+CONFIG.PREFIXO+"play, "+CONFIG.PREFIXO+"mp3, "+CONFIG.PREFIXO+"menu..."),
            ]);
            try{
              await sock.sendMessage(jid,{
                text:textoP,
                footer:CONFIG.NOME_BOT,
                buttons:[{buttonId:"copy_prefix",buttonText:{displayText:`『 ${CONFIG.PREFIXO} 』Copiar Prefixo`},type:1}],
                headerType:1
              },{quoted:seloBot});
            }catch{
              await sock.sendMessage(jid,{text:textoP},{quoted:seloBot});
            }
            return;
          }
          const novoPref=args[0].trim().charAt(0);
          CONFIG.PREFIXO=novoPref;
          await sock.sendMessage(jid,{text:bBloco("✅ PREFIXO ALTERADO",[bLine("⌨️",`Novo prefixo: *${novoPref}*`)])},{quoted:seloBot});
          return;
        }
        if(comando==="ping"){const ini=Date.now();await sock.sendMessage(jid,{text:"⏳"});await sock.sendMessage(jid,{text:bBloco("📡 PING",[bLine("🏓",`*${Date.now()-ini}ms*`),bLine("⏱️",`${Math.floor(process.uptime()/60)} min`),bLine("💾",`${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB`),bLine("🌐",CONFIG.IS_SERVER?"☁️ Servidor":"📱 Local")])},{quoted:seloBot});return;}
        if(comando==="stats"){const s=fs.readJsonSync(ARQUIVO_STATS);const top=Object.entries(s.comandos||{}).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n],i)=>`◎ ${i+1}. *${CONFIG.PREFIXO}${c}* — ${n}x`).join("\n");await sock.sendMessage(jid,{text:bBloco("📊 STATS",[bLine("🔢",`Total: *${s.total||0}*`),B_SEP,top])},{quoted:seloBot});return;}
        if(comando==="regras"){await sock.sendMessage(jid,{text:bBloco("📋 REGRAS",[bLine("❌","Sem links"),bLine("❌","Sem spam"),bLine("❌","Sem ofensas"),bLine("❌","Sem status"),bLine("✅","Respeita todos"),B_SEP,bLine("⚡","Ban automático 5→0!")])},{quoted:seloBot});return;}
        if(comando==="dono"||comando==="criador"){let ppD=null;try{ppD=await sock.profilePictureUrl(CONFIG.DONO_JID,"image");}catch{}const tD=bBloco("👑 CRIADOR",[bLine("🏷️",`*${CONFIG.DONO_NOME}*`),bLine("📞",CONFIG.DONO_NUM),bLine("💰",`*!alugar* para alugar o bot!`)]);if(ppD)await sock.sendMessage(jid,{image:{url:ppD},caption:tD},{quoted:seloBot});else await sock.sendMessage(jid,{text:tD},{quoted:seloBot});await reagir(sock,msg,"👑");return;}
        if(comando==="donos"){await sock.sendMessage(jid,{text:bBloco("👑 DONOS",[bLine("👑",`*${CONFIG.DONO_NOME}*`),bLine("📞",CONFIG.DONO_NUM)])},{quoted:seloBot});return;}

        // ─── VIP ───
        if(comando==="addvip"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}addvip* @user`)},{quoted:seloBot});return;}addVip(alvo,alvo.split("@")[0]);senhasAprovadas.add(alvo);await sock.sendMessage(jid,{text:bBloco("💎 VIP ADICIONADO",[bLine("💎",`@${alvo.split("@")[0]} é agora VIP!`)]),mentions:[alvo]},{quoted:seloBot});await reagir(sock,msg,"💎");return;}
        if(comando==="removevip"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}removevip* @user`)},{quoted:seloBot});return;}removeVip(alvo);await sock.sendMessage(jid,{text:bLine("❌",`@${alvo.split("@")[0]} removido dos VIPs.`),mentions:[alvo]},{quoted:seloBot});return;}
        if(comando==="vips"){const vips=listarVips();const lista=Object.entries(vips);if(!lista.length){await sock.sendMessage(jid,{text:bLine("📭","Nenhum VIP.")},{quoted:seloBot});return;}const t=lista.map(([j,info],i)=>`◎ ${i+1}. 💎 *${info.nome||j.split("@")[0]}*`).join("\n");await sock.sendMessage(jid,{text:bBloco("💎 VIPS",[t,B_SEP,bLine("💎",`Total: *${lista.length}*`)])},{quoted:seloBot});return;}

        // ─── PLAY ───
        if(comando==="play"){await processarComandoPlay(sock,jid,msg,args.join(" ").trim());return;}
        if(comando==="mp3"&&args.length>0){const entrada=args.join(" ");await reagir(sock,msg,"🎵");let arqFinal=null;try{arqFinal=await barraCarregamento(sock,jid,seloBot,`A baixar MP3: _${entrada.slice(0,40)}_`,()=>downloadMusica(entrada,false));}catch(e){console.log("❌ mp3:",e.message);}if(!arqFinal||!fs.existsSync(arqFinal)){await sock.sendMessage(jid,{text:bBloco("❌ NÃO ENCONTREI",[bLine("💡",`_${entrada}_`)])},{quoted:seloBot});await reagir(sock,msg,"❌");return;}try{await enviarAudio(sock,jid,arqFinal,seloBot);await reagir(sock,msg,"✅");addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}setTimeout(()=>{try{fs.removeSync(arqFinal);}catch{}},15000);return;}
        if(comando==="mp4"&&args.length>0){const entrada=args.join(" ");await reagir(sock,msg,"🎬");let saida=null;try{saida=await barraCarregamento(sock,jid,seloBot,`A baixar vídeo: _${entrada.slice(0,40)}_`,()=>downloadVideo(entrada,480));}catch(e){console.log("❌ mp4:",e.message);}if(!saida||!fs.existsSync(saida)){await sock.sendMessage(jid,{text:bBloco("❌ NÃO ENCONTREI",[bLine("💡","Tenta outro link ou nome.")])},{quoted:seloBot});await reagir(sock,msg,"❌");return;}try{await enviarVideo(sock,jid,saida,bLine("🎬",`_© ${CONFIG.NOME_BOT}_`),[sender],seloBot);await reagir(sock,msg,"✅");addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}setTimeout(()=>{try{fs.removeSync(saida);}catch{}},15000);return;}
        if(comando==="mp4hd"&&args.length>0){const entrada=args.join(" ");await reagir(sock,msg,"📹");let result=null;try{result=await barraCarregamento(sock,jid,seloBot,`A baixar vídeo 720p...`,()=>downloadVideoHD(entrada,720));}catch(e){console.log("❌ mp4hd:",e.message);}if(!result||!result.filePath||!fs.existsSync(result.filePath)){await sock.sendMessage(jid,{text:bBloco("❌ NÃO ENCONTREI",[bLine("💡","Tenta *!mp4*.")])},{quoted:seloBot});await reagir(sock,msg,"❌");return;}try{await enviarVideo(sock,jid,result.filePath,bLine("📹",`${result.quality} | 💾 ${result.sizeMB}MB`),[sender],seloBot);await reagir(sock,msg,"✅");addXP(sender,5);setTimeout(()=>{try{fs.removeSync(result.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="ytsearch"&&args.length>0){const query=args.join(" ");let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🔍 YOUTUBE",[bLine("🔍",`_${query}_`),FRAMES_LOADING[0]])},{quoted:seloBot});}catch{}const videos=await scraperYouTubeSearch(query,5);if(loadMsg){try{await sock.sendMessage(jid,{text:bBloco("🔍 YOUTUBE",[bLine("🔍",`_${query}_`),FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}}await new Promise(r=>setTimeout(r,300));if(!videos.length){await sock.sendMessage(jid,{text:bLine("❌","Nenhum resultado.")},{quoted:seloBot});return;}const lista=videos.slice(0,5).map((v,i)=>`◎ *${i+1}.* 🎵 ${(v.title||v.titulo||"N/A").slice(0,40)}\n   ⏱️ ${formatarDuracao(v.duration||0)}`).join("\n\n");if(videos[0]?.thumbnail)await sock.sendMessage(jid,{image:{url:videos[0].thumbnail},caption:bBloco("🔎 YOUTUBE — "+query,[lista])},{quoted:seloBot});else await sock.sendMessage(jid,{text:bBloco("🔎 YOUTUBE — "+query,[lista])},{quoted:seloBot});await reagir(sock,msg,"🔍");return;}

        // ─── TIKTOK ───
        if(comando==="tiktok"){const url=args[0];if(!url||!url.startsWith("http")){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}tiktok* [link]`)},{quoted:seloBot});return;}await reagir(sock,msg,"📱");let result=null;try{result=await barraCarregamento(sock,jid,seloBot,"A baixar TikTok...",()=>scraperTikTokVideo(url));}catch{}if(!result){await sock.sendMessage(jid,{text:bLine("❌","Não consegui.")},{quoted:seloBot});await reagir(sock,msg,"❌");return;}try{await sock.sendMessage(jid,{video:{url:result.url},caption:bLine("📱",result.title||"TikTok")},{quoted:seloBot});await reagir(sock,msg,"✅");addXP(sender,5);}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="ttsearch"&&args.length>0){const query=args.join(" ");const videos=await scraperTikTokSearch(query,5);if(!videos.length){await sock.sendMessage(jid,{text:bLine("❌","Nenhum resultado.")},{quoted:seloBot});return;}const lista=videos.slice(0,5).map((v,i)=>`◎ *${i+1}.* ${(v.title||v.desc||"TikTok").slice(0,40)}\n   🔗 ${v.video||v.url||""}`).join("\n\n");await sock.sendMessage(jid,{text:bBloco("🔍 TIKTOK — "+query,[lista])},{quoted:seloBot});await reagir(sock,msg,"🔍");return;}
        if(comando==="tttrend"){const videos=await scraperTikTokTrending("AO",5);if(!videos.length){await sock.sendMessage(jid,{text:bLine("❌","Não consegui buscar.")},{quoted:seloBot});return;}const lista=videos.slice(0,5).map((v,i)=>`◎ *${i+1}.* 🔥 ${(v.title||v.desc||"TikTok").slice(0,40)}`).join("\n\n");await sock.sendMessage(jid,{text:bBloco("🔥 TRENDING TIKTOK 🇦🇴",[lista])},{quoted:seloBot});await reagir(sock,msg,"🔥");return;}
        if(comando==="ttuser"&&args.length>0){const user=await scraperTikTokUser(args[0]);if(!user){await sock.sendMessage(jid,{text:bLine("❌",`Não encontrei: ${args[0]}`)},{quoted:seloBot});return;}const texto_user=bBloco("📱 TIKTOK USER",[bLine("👤",`*${user.nickname||user.nome||args[0]}*`),bLine("🔖",`@${user.username||args[0]}`),bLine("👥",`Seguidores: *${user.seguidores||0}*`)]);if(user.foto||user.avatar)await sock.sendMessage(jid,{image:{url:user.foto||user.avatar},caption:texto_user},{quoted:seloBot});else await sock.sendMessage(jid,{text:texto_user},{quoted:seloBot});return;}

        // ─── PINTEREST ───
        if(comando==="pinterest"&&args.length>0){const query=args.join(" ");let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("📌 PINTEREST",[bLine("🔍",`_${query}_`),FRAMES_LOADING[0]])},{quoted:seloBot});}catch{}const pins=await buscarPinterest(query,1);if(loadMsg){try{await sock.sendMessage(jid,{text:bBloco("📌 PINTEREST",[bLine("🔍",`_${query}_`),FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}}await new Promise(r=>setTimeout(r,300));if(!pins.length){await sock.sendMessage(jid,{text:bLine("❌","Nenhuma imagem.")},{quoted:seloBot});return;}try{await sock.sendMessage(jid,{image:{url:pins[0]},caption:bLine("📌",`Pinterest: ${query}`)},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}

        // ─── !pin — PINTEREST MULTI-IMAGEM ───
        if(comando==="pin"){
          const q=args.join(" ").trim();
          if(!q)return sock.sendMessage(jid,{text:bBloco("📌 PIN",[bLine("💡",`*${CONFIG.PREFIXO}pin* [busca]`),bLine("💡",`*${CONFIG.PREFIXO}pin* [busca] | [qtd] → _até 10 imagens_`),bLine("💡",`Ex: *${CONFIG.PREFIXO}pin* anime dark | 5`)])},{quoted:seloBot});
          let [busca,qtdTxt]=q.split("|");
          busca=(busca||"").trim();
          const qtd=Math.max(1,Math.min(10,parseInt(qtdTxt)||5));
          if(busca.length<2){await sock.sendMessage(jid,{text:bLine("📌","Diz melhor o que procuras.")},{quoted:seloBot});return;}
          await reagir(sock,msg,"⏳");
          try{
            const imagens=await buscarPinterest(busca,qtd);
            if(!imagens.length){await reagir(sock,msg,"❌");await sock.sendMessage(jid,{text:bBloco("❌ PINTEREST",[bLine("💡",`Não encontrei nada para *${busca}*.`)])},{quoted:seloBot});return;}
            let enviadas=0;
            for(let i=0;i<imagens.length;i++){
              try{
                await sock.sendMessage(jid,{image:{url:imagens[i]},caption:`📌 *${busca}*\n${i+1}/${imagens.length}${i===0?"\n\n_via Pinterest_":""}`},{quoted:i===0?seloBot:undefined});
                enviadas++;
                if(i<imagens.length-1)await new Promise(r=>setTimeout(r,800));
              }catch{}
            }
            if(!enviadas){await reagir(sock,msg,"❌");await sock.sendMessage(jid,{text:bLine("📌","Encontrei mas não consegui enviar. Tenta outra vez.")},{quoted:seloBot});return;}
            await reagir(sock,msg,"✅");
            if(enviadas<imagens.length)await sock.sendMessage(jid,{text:bLine("📌",`Enviei *${enviadas}* de ${imagens.length}.`)},{quoted:seloBot});
          }catch(e){console.error("[PIN ERROR]",e?.message||e);await reagir(sock,msg,"💔");await sock.sendMessage(jid,{text:bLine("📌","Erro ao buscar no Pinterest.")},{quoted:seloBot});}
          return;
        }

        if(comando==="pinvideo"&&args.length>0){const url=args[0];let result=null;try{result=await barraCarregamento(sock,jid,seloBot,"A baixar Pinterest vídeo...",async()=>{try{const data=await scraperHub(`/api/pinterest/pin?url=${encodeURIComponent(url)}`);return data?.resultado||data?.result||data?.pin||null;}catch{try{const{data}=await axios.get(`https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(url)}`,{timeout:15000,httpsAgent});return data?.data||null;}catch{return null;}}});}catch{}if(!result){await sock.sendMessage(jid,{text:bLine("❌","Não consegui.")},{quoted:seloBot});return;}const videoUrl=result.video||result.url||result.link;if(!videoUrl){await sock.sendMessage(jid,{text:bLine("❌","Sem vídeo nesse pin.")},{quoted:seloBot});return;}await sock.sendMessage(jid,{video:{url:videoUrl},caption:bLine("📌","Pinterest")},{quoted:seloBot});await reagir(sock,msg,"✅");return;}

        // ─── REDES SOCIAIS ───
        if(["instagram","twitter","facebook","kwai"].includes(comando)&&args.length>0){const emojis={instagram:"📸",twitter:"🐦",facebook:"📘",kwai:"📹"};const emoji=emojis[comando];const url=args[0];await reagir(sock,msg,emoji);let r=null;try{r=await barraCarregamento(sock,jid,seloBot,`A baixar ${comando}...`,()=>dlRedeSocial(url));}catch{}if(!r){await sock.sendMessage(jid,{text:bLine("❌","Não consegui.")},{quoted:seloBot});await reagir(sock,msg,"❌");return;}try{await enviarVideo(sock,jid,r.filePath,bLine(emoji,comando.charAt(0).toUpperCase()+comando.slice(1)),[sender],seloBot);await reagir(sock,msg,"✅");addXP(sender,5);setTimeout(()=>{try{fs.removeSync(r.filePath);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="spotify"&&args.length>0){const entrada=args.join(" ");await reagir(sock,msg,"🟢");let arq=null;try{arq=await barraCarregamento(sock,jid,seloBot,`A baixar Spotify...`,()=>dlSpotify(entrada).then(r=>r.filePath));}catch{}if(!arq){await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});return;}try{await enviarAudio(sock,jid,arq,seloBot);await reagir(sock,msg,"✅");addXP(sender,5);setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="soundcloud"&&args.length>0){const entrada=args.join(" ");await reagir(sock,msg,"🔶");let arq=null;try{arq=await barraCarregamento(sock,jid,seloBot,"A baixar SoundCloud...",()=>dlSoundcloud(entrada).then(r=>r.filePath));}catch{}if(!arq){await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});return;}try{await enviarAudio(sock,jid,arq,seloBot);await reagir(sock,msg,"✅");addXP(sender,5);setTimeout(()=>{try{fs.removeSync(arq);}catch{}},15000);}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="mediafire"&&args.length>0){const url=args[0];await reagir(sock,msg,"📦");try{const result=await dlMediafire(url);await sock.sendMessage(jid,{document:{url:result.url},fileName:result.title,mimetype:"application/octet-stream",caption:bLine("📦",`*${result.title}*`)},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="apk"&&args.length>0){const query=args.join(" ");await reagir(sock,msg,"📲");try{const result=await dlApk(query);await sock.sendMessage(jid,{text:bBloco("📲 APK",[bLine("📱",`*${result.title}*`),bLine("🔗",result.url)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="qr"){const dado=args.join(" ");if(!dado){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}qr* [texto/url]`)},{quoted:seloBot});return;}try{await sock.sendMessage(jid,{image:{url:`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(dado)}&qzone=2&ecc=M`},caption:bLine("🔲","*QR CODE*")},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="mostre"&&args.length>0){const query=args.join(" ");let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🔍 MOSTRE",[bLine("🔍",`_${query}_`),FRAMES_LOADING[2]])},{quoted:seloBot});}catch{}const imageUrl=await buscarImagemInternet(query);if(loadMsg){try{await sock.sendMessage(jid,{text:bBloco("🔍 MOSTRE",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}}await new Promise(r=>setTimeout(r,300));if(!imageUrl){await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});return;}await sock.sendMessage(jid,{image:{url:imageUrl},caption:bLine("🖼️",`*${query}*`)},{quoted:seloBot});await reagir(sock,msg,"✅");return;}
        if(comando==="foto"&&args[0]){try{await sock.sendMessage(jid,{image:{url:args.join("")},caption:"📷"},{quoted:seloBot});await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="doc"&&args[0]){try{const url=args.join(""),nome=decodeURIComponent(url.split("/").pop().split("?")[0])||"documento";await sock.sendMessage(jid,{document:{url},fileName:nome,mimetype:"application/octet-stream",caption:"📄"},{quoted:seloBot});await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="tourl"){const midia=await downloadQualquerMidia(msg);if(!midia){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde mídia com *${CONFIG.PREFIXO}tourl*`)},{quoted:seloBot});return;}let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🔗 A GERAR LINK",[FRAMES_LOADING[0]])},{quoted:seloBot});}catch{}try{let url;if(midia.mime.startsWith("image/")&&!midia.mime.includes("webp")){try{url=await uploadParaTelegraph(midia.buffer);}catch{url=await uploadParaCatbox(midia.buffer,midia.nome,midia.mime);}}else{url=await uploadParaCatbox(midia.buffer,midia.nome,midia.mime);}if(loadMsg){try{await sock.sendMessage(jid,{text:bBloco("🔗 LINK GERADO",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}}await new Promise(r=>setTimeout(r,300));await sock.sendMessage(jid,{text:bBloco("🔗 LINK GERADO",[bLine("📎",`*${midia.nome}*`),bLine("🌐",url)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message.slice(0,80))},{quoted:seloBot});}return;}

        // ─── FIGURINHAS ───
        if(comando==="sticker"){const quotedMsg=msg.message.extendedTextMessage?.contextInfo?.quotedMessage;const iM=quotedMsg?.imageMessage,vM=quotedMsg?.videoMessage;if(!iM&&!vM){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde imagem/vídeo com *${CONFIG.PREFIXO}sticker*`)},{quoted:seloBot});return;}const isAnim=!!vM;await sock.sendMessage(jid,{text:bLine("🎭","A criar sticker... ⏳")},{quoted:seloBot});try{const buf=await downloadMediaMessage({message:quotedMsg,key:msg.key},"buffer",{});const webpBuf=await criarSticker(buf,isAnim);await sock.sendMessage(jid,{sticker:webpBuf},{quoted:seloBot});await reagir(sock,msg,"✅");}catch{try{const buf=await downloadMediaMessage({message:quotedMsg,key:msg.key},"buffer",{});await sock.sendMessage(jid,{sticker:buf},{quoted:seloBot});await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});await reagir(sock,msg,"❌");}}return;}
        if(comando==="sf"){const ctx=msg.message?.extendedTextMessage?.contextInfo,quotedMsg=ctx?.quotedMessage,stickerMsgD=msg.message?.stickerMessage,stickerMsgQ=quotedMsg?.stickerMessage,stickerMsg=stickerMsgD||stickerMsgQ;if(!stickerMsg){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde sticker com *${CONFIG.PREFIXO}sf*`)},{quoted:seloBot});return;}const isAnimated=stickerMsg.isAnimated||false;try{let buf;if(stickerMsgD)buf=await downloadMediaMessage(msg,"buffer",{});else{const qm={key:{remoteJid:jid,id:ctx.stanzaId||"",participant:ctx.participant||"",fromMe:false},message:quotedMsg};buf=await downloadMediaMessage(qm,"buffer",{});}if(!buf||buf.length<100)throw new Error("Sticker inválido");const resultado=await stickerParaFoto(buf,isAnimated);if(resultado.isVideo)await sock.sendMessage(jid,{video:resultado.buffer,mimetype:"video/mp4",caption:bLine("🎥","Convertido!")},{quoted:seloBot});else await sock.sendMessage(jid,{image:resultado.buffer,caption:bLine("🖼️","Convertido!")},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="brat"){const textoBrat=args.join(" ")||"brat";try{const url=`https://api.memegen.link/images/custom/~p${encodeURIComponent(textoBrat)}/_.jpg?background=d4c5a0&width=512&height=512`;const{data}=await axios.get(url,{responseType:"arraybuffer",timeout:15000,httpsAgent});const buf=await criarSticker(Buffer.from(data),false);await sock.sendMessage(jid,{sticker:buf},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="figurinha"||comando==="figu"){const quantidade=Math.min(parseInt(args[0])||1,5);await reagir(sock,msg,"🎭");const emojis=["😂","😍","🔥","💀","😭","🤣","😎","🥺","😤","💪"];for(let i=0;i<quantidade;i++){try{const emoji=emojis[Math.floor(Math.random()*emojis.length)];const url=`https://api.memegen.link/images/custom/~p${encodeURIComponent(emoji)}/_.png?width=512&height=512`;const{data}=await axios.get(url,{responseType:"arraybuffer",timeout:10000,httpsAgent});const buf=await criarSticker(Buffer.from(data),false);await sock.sendMessage(jid,{sticker:buf},{quoted:seloBot});await new Promise(r=>setTimeout(r,500));}catch{}}return;}
        if(comando==="shazam"){await reagir(sock,msg,"⚡");await sock.sendMessage(jid,{text:"⚡️"},{quoted:seloBot});await new Promise(r=>setTimeout(r,500));await sock.sendMessage(jid,{text:"⚡️"});return;}
        if(comando==="busca"){await executarReconhecimentoMusica(sock,jid,msg,sender,seloBot);return;}

        // ─── BRINCADEIRAS ───
        if(comando==="piada"){try{const p=await chatIA("Conta uma piada curta e engraçada em português de Angola.");await sock.sendMessage(jid,{text:bBloco("😂 PIADA",[bLine("😂",p)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="conselho"&&args.length>0){const sit=args.join(" ");try{const resp=await chatIA(`Dá um conselho para: "${sit}".`);await sock.sendMessage(jid,{text:bBloco("💡 CONSELHO",[bLine("💡",resp)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="historia"){const tema=args.join(" ")||"Angola";try{const h=await chatIA(`Escreve uma história curta sobre: "${tema}". Máx 200 palavras.`);await sock.sendMessage(jid,{text:bBloco("📖 HISTÓRIA",[bLine("📖",h)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="poema"){const tema=args.join(" ")||"Angola";try{const p=await chatIA(`Escreve um poema de 4-8 versos sobre: "${tema}".`,"Poeta angolano.");await sock.sendMessage(jid,{text:bBloco("✍️ POEMA",[bLine("✍️",p)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="perfil"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:bLine("💡","↩️ Menciona alguém!")},{quoted:seloBot});return;}const ehZoada=Math.random()<0.5,LISTA=ehZoada?PERFIS_ZOADA:PERFIS_ELOGIO;const desc=LISTA[Math.floor(Math.random()*LISTA.length)];let ppAlvo=null;try{ppAlvo=await sock.profilePictureUrl(alvo,"image");}catch{}const textoFinal=bBloco(ehZoada?"😂 PERFIL ZOADO":"🌟 PERFIL ELOGIO",[bLine(ehZoada?"😂":"🌟",desc),bLine("📱",`+${alvo.split("@")[0]}`)]);if(ppAlvo)await sock.sendMessage(jid,{image:{url:ppAlvo},caption:textoFinal,mentions:[alvo]},{quoted:seloBot});else await sock.sendMessage(jid,{text:textoFinal,mentions:[alvo]},{quoted:seloBot});await reagir(sock,msg,ehZoada?"😂":"🌟");return;}
        if(comando==="cara"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}cara* @user`)},{quoted:seloBot});return;}const nota=Math.floor(Math.random()*10)+1;await sock.sendMessage(jid,{text:bBloco("📊 AVALIAÇÃO",[bLine("👤",`@${alvo.split("@")[0]}`),bLine("⭐",`Nota: *${nota}/10* ${nota>=8?"🔥😍":nota>=5?"😊👍":"😬💀"}`)]),mentions:[alvo]},{quoted:seloBot});return;}
        if(comando==="ship"){const a1=extrairJid(mencoes[0]),a2=extrairJid(mencoes[1]);if(!a1||!a2){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}ship* @user1 @user2`)},{quoted:seloBot});return;}const percent=Math.floor(Math.random()*100)+1;const barra=`${"💕".repeat(Math.floor(percent/10))}${"⬛".repeat(10-Math.floor(percent/10))}`;await sock.sendMessage(jid,{text:bBloco("💘 SHIP",[bLine("👥",`@${a1.split("@")[0]} + @${a2.split("@")[0]}`),bLine("💕",`${barra} *${percent}%*`),bLine("💬",percent>=80?"Perfeito! 😍":percent>=60?"Muito compatíveis! 😊":percent>=40?"Pode funcionar! 🤔":"Hmmm... 😅")]),mentions:[a1,a2]},{quoted:seloBot});return;}
        if(comando==="fofoca"){if(!isGrupo){await sock.sendMessage(jid,{text:bLine("❌","Só em grupos.")},{quoted:seloBot});return;}try{const meta=await sock.groupMetadata(jid);const membros=meta.participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p));if(membros.length<2){await sock.sendMessage(jid,{text:bLine("❌","Poucos membros.")},{quoted:seloBot});return;}const a=membros[Math.floor(Math.random()*membros.length)];const b=membros.filter(m=>m!==a)[Math.floor(Math.random()*(membros.length-1))];const fofocas=[`Dizem que @${a.split("@")[0]} tem crush em @${b.split("@")[0]}! 😱`,`@${a.split("@")[0]} apagou as mensagens antes de tu veres... 👀`,`@${a.split("@")[0]} é o que finge não ler mas vê tudo! 😂`,`Fontes confiáveis: @${a.split("@")[0]} e @${b.split("@")[0]} têm segredos! 🤫`];await sock.sendMessage(jid,{text:bBloco("📢 FOFOCA 🗣️",[bLine("📢",fofocas[Math.floor(Math.random()*fofocas.length)])]),mentions:[a,b]},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="denunciar"){const ctx3=msg.message?.extendedTextMessage?.contextInfo;if(!ctx3?.participant){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde mensagem com *${CONFIG.PREFIXO}denunciar [motivo]*`)},{quoted:seloBot});return;}try{const den=extrairJid(ctx3.participant),mot=args.join(" ")||"Sem motivo";const meta=await sock.groupMetadata(jid);for(const a of meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p))){try{await sock.sendMessage(a,{text:bBloco("🚨 DENÚNCIA",[bLine("👤",`@${den.split("@")[0]}`),bLine("📝",mot)]),mentions:[den]});}catch{}}await sock.sendMessage(jid,{text:bLine("✅","Denúncia enviada!")},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}

        // ─── JOGOS ───
        if(["quiz","vof","completar","caca","guerra"].includes(comando)&&jogoLoop[jid]?.activo){await sock.sendMessage(jid,{text:bLine("⚠️",`Jogo activo! Usa *${CONFIG.PREFIXO}stop*`)},{quoted:seloBot});return;}
        if(["quiz","vof","completar","caca","guerra"].includes(comando)){const categoria=args.length>0?args.join(" "):null;const tipos={quiz:"🎮 QUIZ",vof:"✅❌ V/F",completar:"🔤 COMPLETA",caca:"🔍 CAÇA-PALAVRAS",guerra:"⚔️ FORCA"};jogoLoop[jid]={tipo:comando,categoria,activo:true,usadas:[],rodada:0};await sock.sendMessage(jid,{text:bBloco(`${tipos[comando]} INICIADO`,[bLine("✅","Jogo iniciado!"),bLine("💡",categoria?`Categoria: *${categoria.toUpperCase()}*`:"🎲 Variado"),bLine("🛑",`*${CONFIG.PREFIXO}stop* para parar`)])},{quoted:seloBot});await reagir(sock,msg,"🎮");setTimeout(()=>proximaPergunta(sock,jid,seloBot),2000);return;}
        if(comando==="stop"){if(jogoLoop[jid]&&jogoLoop[jid].activo){if(jogoLoop[jid].timeoutHandle)clearTimeout(jogoLoop[jid].timeoutHandle);const rodadas=jogoLoop[jid].rodada||0;delete jogoLoop[jid];delete jogoAtivo[jid];delete jogoAdivinhar[jid];delete jogoVelocidade[jid];await sock.sendMessage(jid,{text:bBloco("🛑 JOGO PARADO",[bLine("📊",`Rodadas: *${rodadas}*`)])},{quoted:seloBot});await reagir(sock,msg,"🛑");}else{await sock.sendMessage(jid,{text:bLine("❌","Não há jogo activo.")},{quoted:seloBot});}return;}
        if(comando==="rank"){const r=fs.readJsonSync(ARQUIVO_RANK);const n=sender.split("@")[0];const d=r[n]||{xp:0,nivel:1,msgs:0};const bar="█".repeat(Math.min(10,Math.floor((d.xp%100)/10)))+"░".repeat(10-Math.min(10,Math.floor((d.xp%100)/10)));await sock.sendMessage(jid,{text:bBloco("🏆 RANK",[bLine("⭐",`Nível: *${d.nivel}* | ✨ XP: *${d.xp}*`),bLine("📊",`[${bar}]`),bLine("💬",`Msgs: *${d.msgs}*`)])},{quoted:seloBot});return;}
        if(comando==="toprank"){const r=fs.readJsonSync(ARQUIVO_RANK);const medalhas=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];const top=Object.entries(r).sort((a,b)=>b[1].xp-a[1].xp).slice(0,10).map(([n,d],i)=>`${medalhas[i]} +${n} — Nv.*${d.nivel}* | *${d.xp}* XP`).join("\n");await sock.sendMessage(jid,{text:bBloco("🏆 TOP 10 XP",[top||"◎ Sem dados"])},{quoted:seloBot});return;}
        if(comando==="matematica"){const desafio=MATEMATICA_BANCO();jogoAtivo[jid]={tipo:"matematica",r:desafio.resposta};await sock.sendMessage(jid,{text:bBloco("🧮 DESAFIO MATEMÁTICO",[bLine("❓",`Quanto é ${desafio.pergunta}?`),bLine("⏰","15s")])},{quoted:seloBot});setTimeout(async()=>{if(jogoAtivo[jid]?.tipo==="matematica"){await sock.sendMessage(jid,{text:bBloco("⏰ TEMPO",[bLine("✅",`Resposta: *${desafio.resposta}*`)])},{quoted:seloBot});delete jogoAtivo[jid];}},15000);return;}
        if(comando==="jokenpo"){const opcoes=["pedra","papel","tesoura"];const bot=opcoes[Math.floor(Math.random()*3)];const user=args[0]?.toLowerCase();if(!["pedra","papel","tesoura"].includes(user)){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}jokenpo* [pedra/papel/tesoura]`)},{quoted:seloBot});return;}let resultado;if(user===bot)resultado="🤝 *Empate!*";else if((user==="pedra"&&bot==="tesoura")||(user==="papel"&&bot==="pedra")||(user==="tesoura"&&bot==="papel")){resultado="🎉 *Ganhaste!*";addXP(sender,20);addCoins(sender,10);}else{resultado="😅 *Bot ganhou!*";}await sock.sendMessage(jid,{text:bBloco("✊ JOKENPO",[bLine("👤",`Tu: *${user}*`),bLine("🤖",`Bot: *${bot}*`),B_SEP,bLine("🏆",resultado)])},{quoted:seloBot});return;}
        if(comando==="dado"){const lados=parseInt(args[0])||6;const resultado=Math.floor(Math.random()*lados)+1;await sock.sendMessage(jid,{text:bBloco(`🎲 DADO ${lados}`,[bLine("🎲",`Resultado: *${resultado}*`)])},{quoted:seloBot});await reagir(sock,msg,"🎲");return;}
        if(comando==="cara-coroa"){const resultado=Math.random()<0.5?"CARA 😊":"COROA 👑";const escolha=args[0]?.toLowerCase();let texto2=bBloco("🪙 CARA OU COROA",[bLine("🪙",`Resultado: *${resultado}*`)]);if(escolha&&["cara","coroa"].includes(escolha)){const acertou=(escolha==="cara"&&resultado.includes("CARA"))||(escolha==="coroa"&&resultado.includes("COROA"));if(acertou){texto2+="\n"+bLine("✅","*Acertaste!* +20 XP");addXP(sender,20);}else{texto2+="\n"+bLine("❌","*Erraste!*");}}await sock.sendMessage(jid,{text:texto2},{quoted:seloBot});return;}
        if(comando==="adivinhar"){if(jogoAdivinhar[jid]){await sock.sendMessage(jid,{text:bLine("🎯","Jogo activo! Adivinha de 1-100.")},{quoted:seloBot});return;}const numero=Math.floor(Math.random()*100)+1;const jM=await sock.sendMessage(jid,{text:bBloco("🎯 ADIVINHAR NÚMERO",[bLine("💡","_Adivinha de 1 a 100!_")])},{quoted:seloBot});jogoAdivinhar[jid]={numero,tentativas:0,msgKey:jM?.key};setTimeout(()=>{if(jogoAdivinhar[jid]){delete jogoAdivinhar[jid];sock.sendMessage(jid,{text:bBloco("⏰ TEMPO",[bLine("📝",`Era o *${numero}*!`)])},{quoted:seloBot});}},5*60*1000);return;}
        if(comando==="velocidade"){if(jogoVelocidade[jid]){await sock.sendMessage(jid,{text:bLine("⚡","Jogo activo!")},{quoted:seloBot});return;}const palavra=PALAVRAS_VELOCIDADE[Math.floor(Math.random()*PALAVRAS_VELOCIDADE.length)];await sock.sendMessage(jid,{text:bBloco("⚡ VELOCIDADE",[bLine("💡","Digita o mais rápido:"),`\`\`\`${palavra}\`\`\``,bLine("⏰","Já!")])},{quoted:seloBot});jogoVelocidade[jid]={palavra,inicio:Date.now()};setTimeout(()=>{if(jogoVelocidade[jid]){delete jogoVelocidade[jid];sock.sendMessage(jid,{text:bBloco("⏰ TEMPO",[bLine("📝",`Era: *${palavra}*`)])},{quoted:seloBot});}},30000);return;}
        if(comando==="roleta"){const disparo=Math.floor(Math.random()*6)+1===1;if(disparo){await sock.sendMessage(jid,{text:bBloco("🔫 ROLETA RUSSA",[bLine("💀","*BANG!* Fui eliminado!")]),mentions:[sender]},{quoted:seloBot});await reagir(sock,msg,"💀");}else{await sock.sendMessage(jid,{text:bBloco("🔫 ROLETA RUSSA",[bLine("😅","*CLICK!* Sobreviveste!"),bLine("🏆","+50 XP")])},{quoted:seloBot});addXP(sender,50);await reagir(sock,msg,"😅");}return;}
        if(comando==="aki"){const acertou=Math.random()<0.7;if(acertou){const p=["Cristiano Ronaldo","Michael Jackson","Barack Obama","Lionel Messi","Elon Musk"][Math.floor(Math.random()*5)];await sock.sendMessage(jid,{text:bBloco("🎩 AKINATOR",[bLine("🎯",`Acho que és... *${p}*?`)])},{quoted:seloBot});}else{await sock.sendMessage(jid,{text:bBloco("🎩 AKINATOR",[bLine("😵","Não consigo adivinhar! +100 XP")])},{quoted:seloBot});addXP(sender,100);}return;}
        if(comando==="aposta"&&args.length>0){const qtd=parseInt(args[0]);if(isNaN(qtd)||qtd<=0){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}aposta* [quantidade]`)},{quoted:seloBot});return;}const saldo=getCoins(sender);if(saldo<qtd){await sock.sendMessage(jid,{text:bBloco("❌ SALDO INSUFICIENTE",[bLine("💰",`Tens: *${saldo}* 💰`)])},{quoted:seloBot});return;}const resultado=Math.random()<0.5?"CARA 😊":"COROA 👑";const escolha=args[1]?.toLowerCase()||"cara";const ganhou=(escolha==="cara"&&resultado.includes("CARA"))||(escolha==="coroa"&&resultado.includes("COROA"));if(ganhou){addCoins(sender,qtd);await sock.sendMessage(jid,{text:bBloco("🎰 APOSTA",[bLine("🪙",`*${resultado}*`),bLine("✅",`*GANHASTE!* +${qtd} 💰`),bLine("💰",`Saldo: *${getCoins(sender)}*`)])},{quoted:seloBot});await reagir(sock,msg,"🎉");}else{setCoins(sender,saldo-qtd);await sock.sendMessage(jid,{text:bBloco("🎰 APOSTA",[bLine("🪙",`*${resultado}*`),bLine("❌",`*PERDESTE!* -${qtd} 💰`),bLine("💰",`Saldo: *${getCoins(sender)}*`)])},{quoted:seloBot});await reagir(sock,msg,"😭");}return;}

        // ─── COINS ───
        if(comando==="moedas"){await sock.sendMessage(jid,{text:bBloco("💰 MOEDAS",[bLine("👤",`*${sender.split("@")[0]}*`),bLine("💰",`Saldo: *${getCoins(sender)}*`),B_SEP,bLine("🎁",`*${CONFIG.PREFIXO}diario* → +100 diário`)])},{quoted:seloBot});return;}
        if(comando==="diario"){const agora=Date.now(),ultimoDiario=getCooldown(sender,"diario"),COOLDOWN=24*60*60*1000;if(agora-ultimoDiario<COOLDOWN){const restante=Math.ceil((COOLDOWN-(agora-ultimoDiario))/3600000);await sock.sendMessage(jid,{text:bBloco("⏰ JÁ COLETASTE",[bLine("⏰",`Volta em *${restante}h*`)])},{quoted:seloBot});return;}const ganho=100+Math.floor(Math.random()*50);addCoins(sender,ganho);setCooldown(sender,"diario");await sock.sendMessage(jid,{text:bBloco("🎁 RECOMPENSA DIÁRIA",[bLine("🎉",`+*${ganho}* moedas!`),bLine("💰",`Total: *${getCoins(sender)}*`)])},{quoted:seloBot});await reagir(sock,msg,"🎁");return;}
        if(comando==="dar"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}dar* @user [quantidade]`)},{quoted:seloBot});return;}const quantidade=parseInt(args[args.length-1])||0;if(quantidade<=0){await sock.sendMessage(jid,{text:bLine("❌","Quantidade inválida.")},{quoted:seloBot});return;}if(getCoins(sender)<quantidade){await sock.sendMessage(jid,{text:bLine("❌",`Saldo insuficiente! Tens: *${getCoins(sender)}* 💰`)},{quoted:seloBot});return;}setCoins(sender,getCoins(sender)-quantidade);addCoins(alvo,quantidade);await sock.sendMessage(jid,{text:bBloco("💸 ENVIADO",[bLine("✅",`Enviaste *${quantidade}* 💰 para @${alvo.split("@")[0]}!`)]),mentions:[alvo]},{quoted:seloBot});await reagir(sock,msg,"💸");return;}
        if(comando==="roubar"){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}roubar* @user`)},{quoted:seloBot});return;}if(alvo===sender){await sock.sendMessage(jid,{text:bLine("❌","Não podes roubar a ti mesmo!")},{quoted:seloBot});return;}const moedasAlvo=getCoins(alvo);if(moedasAlvo<=0){await sock.sendMessage(jid,{text:bLine("❌","Sem moedas!"),mentions:[alvo]},{quoted:seloBot});return;}if(Math.random()>0.5){const roubado=Math.min(Math.floor(moedasAlvo*0.1)+Math.floor(Math.random()*20),moedasAlvo);setCoins(alvo,moedasAlvo-roubado);addCoins(sender,roubado);await sock.sendMessage(jid,{text:bBloco("🦹 ROUBO!",[bLine("💰",`Roubaste *${roubado}* 💰 de @${alvo.split("@")[0]}!`)]),mentions:[alvo]},{quoted:seloBot});await reagir(sock,msg,"🦹");}else{const perda=Math.floor(getCoins(sender)*0.05)+10;setCoins(sender,Math.max(0,getCoins(sender)-perda));await sock.sendMessage(jid,{text:bBloco("👮 FALHADO",[bLine("❌",`Foste apanhado! -${perda} 💰`)]),mentions:[alvo]},{quoted:seloBot});await reagir(sock,msg,"👮");}return;}
        if(comando==="topcoins"){try{const c=fs.readJsonSync(ARQUIVO_COINS);const medalhas=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];const top=Object.entries(c).sort((a,b)=>(b[1].moedas||0)-(a[1].moedas||0)).slice(0,10).map(([n,d],i)=>`${medalhas[i]} +${n.split("@")[0]} — *${d.moedas||0}* 💰`).join("\n");await sock.sendMessage(jid,{text:bBloco("💰 TOP 10 RICOS",[top||"◎ Sem dados"])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}

        // ─── ALTERADORES ───
        if(comando==="vz"){const ctxVz=msg.message?.extendedTextMessage?.contextInfo,quotedVz=ctxVz?.quotedMessage;let textoParaFalar="";if(quotedVz)textoParaFalar=quotedVz.conversation||quotedVz.extendedTextMessage?.text||"";if(!textoParaFalar&&args.length>0)textoParaFalar=args.join(" ");if(!textoParaFalar){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}vz* [texto]`)},{quoted:seloBot});return;}let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🔊 VOZ",[bLine("⏳","A converter..."),FRAMES_LOADING[2]])},{quoted:seloBot});}catch{}try{const audioPath=await textoParaFala(textoParaFalar);if(loadMsg){try{await sock.sendMessage(jid,{text:bBloco("🔊 VOZ",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}}await new Promise(r=>setTimeout(r,300));await enviarAudio(sock,jid,audioPath,seloBot);try{fs.removeSync(audioPath);}catch{}await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="transcrever"||comando==="audiotexto"){const d=await downloadAudioDaMensagem(msg);if(!d){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde áudio com *${CONFIG.PREFIXO}transcrever*`)},{quoted:seloBot});return;}let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("📝 A TRANSCREVER",[FRAMES_LOADING[2]])},{quoted:seloBot});}catch{}try{const t=await transcreverComGroq(d.buffer);if(loadMsg){try{await sock.sendMessage(jid,{text:bBloco("📝 A TRANSCREVER",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}}await new Promise(r=>setTimeout(r,300));await sock.sendMessage(jid,{text:bBloco("📝 TRANSCRIÇÃO",[bLine("📝",t)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="resumiraudio"){const d=await downloadAudioDaMensagem(msg);if(!d){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde áudio`)},{quoted:seloBot});return;}try{const t=await transcreverComGroq(d.buffer);const r=await chatIA(`Resume: "${t}"`);await sock.sendMessage(jid,{text:bBloco("🎙️ RESUMO",[bLine("📝",r)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="traduziraudio"){const idioma=args[0]||"português";const d=await downloadAudioDaMensagem(msg);if(!d){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde áudio com *${CONFIG.PREFIXO}traduziraudio [idioma]*`)},{quoted:seloBot});return;}try{const t=await transcreverComGroq(d.buffer);const tr=await chatIA(`Traduz para ${idioma}: "${t}"`);await sock.sendMessage(jid,{text:bBloco("🌍 TRADUÇÃO",[bLine("🌍",tr)])},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="audioparaia"){const d=await downloadAudioDaMensagem(msg);if(!d){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde áudio`)},{quoted:seloBot});return;}try{const t=await transcreverComGroq(d.buffer);const r=await chatIA(t);await sock.sendMessage(jid,{text:bBloco("🧠 IA + ÁUDIO",[bLine("🧠",r)])},{quoted:seloBot});await reagir(sock,msg,"🧠");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="ia"&&args.length>0){const pergunta=args.join(" ");let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🧠 IA",[bLine("⏳","A processar..."),FRAMES_LOADING[1]])},{quoted:seloBot});}catch{}try{const resp=await chatIA(pergunta);if(loadMsg){try{await sock.sendMessage(jid,{text:bBloco("🧠 IA",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}}await new Promise(r=>setTimeout(r,300));await sock.sendMessage(jid,{text:bBloco("🧠 IA",[bLine("🧠",resp)])},{quoted:seloBot});await reagir(sock,msg,"🧠");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="resumir"){const ctx2=msg.message?.extendedTextMessage?.contextInfo;const msgC=ctx2?.quotedMessage?.conversation||ctx2?.quotedMessage?.extendedTextMessage?.text||"";if(!msgC){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde mensagem com *${CONFIG.PREFIXO}resumir*`)},{quoted:seloBot});return;}try{const resp=await chatIA(`Resume: "${msgC}"`);await sock.sendMessage(jid,{text:bBloco("📝 RESUMO",[bLine("📝",resp)])},{quoted:seloBot});await reagir(sock,msg,"📝");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="traduzir"&&args.length>1){const idioma=args[0],textT=args.slice(1).join(" ");try{const resp=await chatIA(`Traduz para ${idioma}: "${textT}"`);await sock.sendMessage(jid,{text:bBloco("🌍 TRADUÇÃO",[bLine("🌍",resp)])},{quoted:seloBot});await reagir(sock,msg,"🌍");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="fotocopia"){const imgBuf=await downloadImagemDaMensagem(msg);if(!imgBuf){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde imagem com *${CONFIG.PREFIXO}fotocopia*`)},{quoted:seloBot});return;}let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🖼️ A LER TEXTO",[FRAMES_LOADING[2]])},{quoted:seloBot});}catch{}try{const t=await analisarImagem(imgBuf,"Lê e transcreve TODO o texto visível. Em português.");if(loadMsg){try{await sock.sendMessage(jid,{text:bBloco("🖼️ A LER TEXTO",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}}await new Promise(r=>setTimeout(r,300));await sock.sendMessage(jid,{text:bBloco("📄 TEXTO EXTRAÍDO",[bLine("📄",t)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="fotoparaia"){const imgBuf=await downloadImagemDaMensagem(msg);if(!imgBuf){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde imagem com *${CONFIG.PREFIXO}fotoparaia [pergunta]*`)},{quoted:seloBot});return;}let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🖼️ A ANALISAR",[FRAMES_LOADING[2]])},{quoted:seloBot});}catch{}try{const instrucao=args.join(" ")?`Responde: "${args.join(" ")}". Em português.`:"Descreve detalhadamente. Em português.";const resp=await analisarImagem(imgBuf,instrucao);if(loadMsg){try{await sock.sendMessage(jid,{text:bBloco("🖼️ A ANALISAR",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}}await new Promise(r=>setTimeout(r,300));await sock.sendMessage(jid,{text:bBloco("🧠 IA + IMAGEM",[bLine("🧠",resp)])},{quoted:seloBot});await reagir(sock,msg,"🧠");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="resumirfoto"){const imgBuf=await downloadImagemDaMensagem(msg);if(!imgBuf){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde imagem`)},{quoted:seloBot});return;}try{const resumo=await analisarImagem(imgBuf,"Faz um resumo objetivo. Em português.");await sock.sendMessage(jid,{text:bBloco("📝 RESUMO DA IMAGEM",[bLine("📝",resumo)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="traduzirfoto"){const idioma=args[0]||"português";const imgBuf=await downloadImagemDaMensagem(msg);if(!imgBuf){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde imagem`)},{quoted:seloBot});return;}try{const resultado=await analisarImagem(imgBuf,`Lê e traduz para ${idioma}.`);await sock.sendMessage(jid,{text:bBloco("🌍 TRADUÇÃO DA IMAGEM",[bLine("🌍",resultado)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="editar"){const instrucao=args.join(" ").trim();if(!instrucao){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}editar* [instrução] ↩️ imagem`)},{quoted:seloBot});return;}const imgBuf=await downloadImagemDaMensagem(msg);if(!imgBuf){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde imagem com *${CONFIG.PREFIXO}editar [instrução]*`)},{quoted:seloBot});return;}try{const descricao=await analisarImagem(imgBuf,`Descreve para poder editar com: "${instrucao}". Em português.`);await sock.sendMessage(jid,{text:bBloco("🎨 ANÁLISE PARA EDIÇÃO",[bLine("💡",`_${instrucao}_`),B_SEP,bLine("📝",descricao)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message.slice(0,100))},{quoted:seloBot});}return;}

        // ─── LOGOS / UTILS ───
        if(comando==="meme"){const partes=args.join(" ").split("|");if(partes.length<2){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}meme* [texto1|texto2]`)},{quoted:seloBot});return;}try{await sock.sendMessage(jid,{image:{url:`https://api.memegen.link/images/drake/${encodeURIComponent(partes[0].trim())}/${encodeURIComponent(partes[1].trim())}.jpg?width=512`},caption:bLine("😂","*MEME*")},{quoted:seloBot});await reagir(sock,msg,"😂");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="logo"){const textoLogo=args.join(" ").trim();if(!textoLogo){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}logo* [texto]`)},{quoted:seloBot});return;}try{await sock.sendMessage(jid,{image:{url:`https://api.memegen.link/images/custom/${encodeURIComponent(textoLogo)}/_.jpg?background=000000&width=512&height=256`},caption:bLine("🎨",`*LOGO: ${textoLogo}*`)},{quoted:seloBot});await reagir(sock,msg,"🎨");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="card"){const textoCard=args.join(" ").trim();if(!textoCard){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}card* [texto]`)},{quoted:seloBot});return;}try{await sock.sendMessage(jid,{image:{url:`https://api.memegen.link/images/buzz/${encodeURIComponent(textoCard)}/${encodeURIComponent("@"+sender.split("@")[0])}.jpg?width=512`},caption:bLine("🃏","*CARD*")},{quoted:seloBot});await reagir(sock,msg,"🃏");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="calc"){const expr=args.join(" ");if(!expr){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}calc* [expressão]`)},{quoted:seloBot});return;}try{const resultado=calcularSeguro(expr);await sock.sendMessage(jid,{text:bBloco("🔢 CALCULADORA",[bLine("🔢",`*${expr}* = *${resultado}*`)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch{await sock.sendMessage(jid,{text:bLine("❌","Expressão inválida!")},{quoted:seloBot});}return;}
        if(comando==="encurtar"){const url=args[0];if(!url||!url.startsWith("http")){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}encurtar* [url]`)},{quoted:seloBot});return;}try{const{data}=await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,{timeout:10000,httpsAgent});const urlE=String(data).trim();if(!urlE.startsWith("http"))throw new Error("Falha");await sock.sendMessage(jid,{text:bBloco("🔗 LINK ENCURTADO",[bLine("🔗",urlE)])},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="cotacao"){try{const resp=await chatIA("Cotações actuais do Kwanza (AOA) para USD, EUR, BRL. Formato curto.","Sê direto.");await sock.sendMessage(jid,{text:bBloco("💱 COTAÇÕES KWANZA",[bLine("💱",resp)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="tempo"){if(!args[0]){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}tempo* [cidade]`)},{quoted:seloBot});return;}const local=args.join(" ");try{const res=await axios.get(`https://wttr.in/${encodeURIComponent(local)}?format=j1`,{timeout:10000,httpsAgent});const cur=res.data.current_condition[0];await sock.sendMessage(jid,{text:bBloco("🌤️ "+local.toUpperCase(),[bLine("🌡️",`*${cur.temp_C}°C* — ${cur.weatherDesc[0].value}`),bLine("💧",`${cur.humidity}% | 💨 ${cur.windspeedKmph}km/h`)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Cidade não encontrada.")},{quoted:seloBot});}return;}
        if(comando==="horario"){const agora=new Date();const opc=(tz)=>({timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false});await sock.sendMessage(jid,{text:bBloco("🕐 HORÁRIO MUNDIAL",[bLine("🇦🇴",`Angola: *${agora.toLocaleTimeString("pt-AO",opc("Africa/Luanda"))}*`),bLine("🇧🇷",`Brasil: *${agora.toLocaleTimeString("pt-BR",opc("America/Sao_Paulo"))}*`),bLine("🇵🇹",`Portugal: *${agora.toLocaleTimeString("pt-PT",opc("Europe/Lisbon"))}*`),bLine("🇺🇸",`EUA: *${agora.toLocaleTimeString("en-US",opc("America/New_York"))}*`)])},{quoted:seloBot});return;}
        if(comando==="ver"){const ctx=msg.message?.extendedTextMessage?.contextInfo,stanzaId=ctx?.stanzaId;if(!ctx||!stanzaId){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde view-once com *${CONFIG.PREFIXO}ver*`)},{quoted:seloBot});return;}const quemEnviou=ctx.participant?`@${ctx.participant.split("@")[0].split(":")[0]}`:"alguém";const mentions=ctx.participant?[ctx.participant]:[];const cached=cacheViewOnce[jid]?.[stanzaId];if(cached){try{if(cached.tipo==="video")await sock.sendMessage(jid,{video:cached.buf,caption:bLine("🔓",`De: ${quemEnviou}`),mentions},{quoted:seloBot});else if(cached.tipo==="audio")await sock.sendMessage(jid,{audio:cached.buf,mimetype:"audio/ogg; codecs=opus",ptt:false},{quoted:seloBot});else await sock.sendMessage(jid,{image:cached.buf,caption:bLine("🔓",`De: ${quemEnviou}`),mentions},{quoted:seloBot});await reagir(sock,msg,"🔓");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}const qMsg=ctx.quotedMessage;if(qMsg){let innerMsg=null;for(const key of["viewOnceMessage","viewOnceMessageV2","viewOnceMessageV2Extension"]){if(qMsg[key]?.message){innerMsg=qMsg[key].message;break;}}if(innerMsg){try{const fakeMsg={key:{remoteJid:jid,id:stanzaId,participant:ctx.participant||"",fromMe:false},message:innerMsg};const buf=await downloadMediaMessage(fakeMsg,"buffer",{});if(innerMsg.imageMessage)await sock.sendMessage(jid,{image:buf,caption:bLine("🔓",`De: ${quemEnviou}`),mentions},{quoted:seloBot});else if(innerMsg.videoMessage)await sock.sendMessage(jid,{video:buf,caption:bLine("🔓",`De: ${quemEnviou}`),mentions},{quoted:seloBot});else if(innerMsg.audioMessage||innerMsg.pttMessage)await sock.sendMessage(jid,{audio:buf,mimetype:"audio/ogg; codecs=opus",ptt:false},{quoted:seloBot});await reagir(sock,msg,"🔓");}catch{await sock.sendMessage(jid,{text:bLine("❌","Expirada.")},{quoted:seloBot});}return;}}await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});return;}
        if(comando==="apagadas"){const lista=msgApagadas[jid]||[];if(!lista.length){await sock.sendMessage(jid,{text:bLine("📭","Nenhuma msg apagada.")},{quoted:seloBot});return;}const ultimas=lista.slice(-10).reverse();const textoLista=ultimas.map(m=>{const hora=new Date(m.apagadoEm).toLocaleTimeString("pt-AO",{timeZone:"Africa/Luanda",hour:"2-digit",minute:"2-digit"});return `${bLine("👤",`+${m.sender?.split("@")[0]||"?"} 🕐 ${hora}`)}\n${bLine("💬",m.texto?`_"${m.texto.slice(0,60)}"_`:`_(${m.tipo})_`)}`;}).join("\n│\n");await sock.sendMessage(jid,{text:bBloco("🕵️ MSGS APAGADAS",[textoLista])},{quoted:seloBot});return;}
        if(comando==="placar"){const busca=args.join(" ").trim();if(!busca){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}placar* [equipa/jogo]`)},{quoted:seloBot});return;}try{const resp=await chatIA(`Dá o último placar de: "${busca}". Direto.`,"Especialista desportivo.");await sock.sendMessage(jid,{text:bBloco("⚽ PLACAR",[bLine("⚽",resp)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}

        // ─── PLAQUINHAS ───
        if(comando==="cantada"){const c=CANTADAS_BANCO[Math.floor(Math.random()*CANTADAS_BANCO.length)];await sock.sendMessage(jid,{text:bBloco("💘 CANTADA",[bLine("💘",`_"${c}"_`)])},{quoted:seloBot});await reagir(sock,msg,"💘");return;}
        if(comando==="inunca"){const f=INUNCA_BANCO[Math.floor(Math.random()*INUNCA_BANCO.length)];await sock.sendMessage(jid,{text:bBloco("🎯 EU NUNCA...",[bLine("🎯",`*${f}*`),bLine("💡","_Quem já fez, beba!_ 🥤")])},{quoted:seloBot});await reagir(sock,msg,"🎯");return;}
        if(comando==="conselhobiblico"){const v=CONSELHOS_BIBLICOS[Math.floor(Math.random()*CONSELHOS_BIBLICOS.length)];await sock.sendMessage(jid,{text:bBloco("📖 PALAVRA DE DEUS",[bLine("📖",`_${v}_`)])},{quoted:seloBot});await reagir(sock,msg,"📖");return;}
        if(comando==="frasemotivacional"){try{const r=await chatIA("Dá uma frase motivacional poderosa. Curta e impactante. Em português.");await sock.sendMessage(jid,{text:bBloco("💪 MOTIVAÇÃO",[bLine("💪",`_"${r}"_`)])},{quoted:seloBot});await reagir(sock,msg,"💪");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="piadacurta"){try{const r=await chatIA("Conta uma piada curta e engraçada em 2-3 linhas. Em português de Angola.");await sock.sendMessage(jid,{text:bBloco("😂 PIADA CURTA",[bLine("😂",r)])},{quoted:seloBot});await reagir(sock,msg,"😂");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="curiosidade"){try{const r=await chatIA("Dá uma curiosidade incrível. Começa com 'Sabia que...'. Em português.");await sock.sendMessage(jid,{text:bBloco("🤔 CURIOSIDADE",[bLine("🤔",r)])},{quoted:seloBot});await reagir(sock,msg,"🤔");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="bomdia"){try{const r=await chatIA("Escreve mensagem de bom dia positiva. Em português de Angola.");await sock.sendMessage(jid,{text:bBloco("☀️ BOM DIA!",[bLine("☀️",r)])},{quoted:seloBot});await reagir(sock,msg,"☀️");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="boanoite"){try{const r=await chatIA("Escreve mensagem de boa noite carinhosa. Em português de Angola.");await sock.sendMessage(jid,{text:bBloco("🌙 BOA NOITE!",[bLine("🌙",r)])},{quoted:seloBot});await reagir(sock,msg,"🌙");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}

        // ─── PESQUISAS ───
        if(comando==="signo"){const entrada=(args[0]||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");const aliasSignos={aries:"aries",touro:"touro",gemeos:"gemeos",cancer:"cancer",leao:"leao",virgem:"virgem",libra:"libra",escorpiao:"escorpiao",sagitario:"sagitario",capricornio:"capricornio",aquario:"aquario",peixes:"peixes"};const chave=aliasSignos[entrada];if(!chave){const lista=Object.values(SIGNOS_INFO).map(s=>`${s.emoji} ${s.nome}`).join(" | ");await sock.sendMessage(jid,{text:bBloco("⭐ SIGNOS",[bLine("💡",`*${CONFIG.PREFIXO}signo* [signo]`),B_SEP,bLine("📋",lista)])},{quoted:seloBot});return;}const s=SIGNOS_INFO[chave];const horoscopo=await chatIA(`Dá um horóscopo de 3 linhas para ${s.nome} hoje. Sê positivo.`).catch(()=>"O universo reserva surpresas para hoje!");await sock.sendMessage(jid,{text:bBloco(`${s.emoji} ${s.nome.toUpperCase()}`,[bLine("📅",`*Data:* ${s.data}`),bLine("🔮",`*Elemento:* ${s.elem}`),bLine("🌟",`*Regente:* ${s.regente}`),B_SEP,bLine("✨","*Horóscopo:*"),bLine("💫",horoscopo)])},{quoted:seloBot});await reagir(sock,msg,"⭐");return;}
        if(comando==="wikipedia"&&args.length>0){const query=args.join(" ");let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("📚 WIKIPEDIA",[bLine("🔍",`_${query}_`),FRAMES_LOADING[1]])},{quoted:seloBot});}catch{}try{const{data}=await axios.get(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,{timeout:10000,httpsAgent});if(loadMsg)try{await sock.sendMessage(jid,{text:bBloco("📚 WIKIPEDIA",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}await new Promise(r=>setTimeout(r,300));const resumo=(data.extract||"Sem descrição.").slice(0,400)+"...";let imgUrl=data.originalimage?.source||data.thumbnail?.source||null;const textoWiki=bBloco("📚 "+query.toUpperCase(),[bLine("📝",resumo),bLine("🔗",`https://pt.wikipedia.org/wiki/${encodeURIComponent(data.title||query)}`)]);if(imgUrl)await sock.sendMessage(jid,{image:{url:imgUrl},caption:textoWiki},{quoted:seloBot});else await sock.sendMessage(jid,{text:textoWiki},{quoted:seloBot});await reagir(sock,msg,"📚");}catch{if(loadMsg)try{await sock.sendMessage(jid,{text:bBloco("📚 WIKIPEDIA",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}try{const resp=await chatIA(`Explica "${query}" em 3-4 linhas. Em português.`);await sock.sendMessage(jid,{text:bBloco("📚 "+query.toUpperCase(),[bLine("📝",resp)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}}return;}
        if(comando==="noticias"){const tema=args.join(" ")||"Angola e África";let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("📰 A BUSCAR",[bLine("🔍",`_${tema}_`),FRAMES_LOADING[1]])},{quoted:seloBot});}catch{}try{const resp=await chatIA(`Dá 5 notícias recentes sobre "${tema}". Formato: 📰 *Título* — _resumo 1 linha_`,"Jornalista.");if(loadMsg)try{await sock.sendMessage(jid,{text:bBloco("📰 NOTÍCIAS",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}await new Promise(r=>setTimeout(r,300));await sock.sendMessage(jid,{text:bBloco("📰 NOTÍCIAS — "+tema.toUpperCase(),[resp])},{quoted:seloBot});await reagir(sock,msg,"📰");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="hoje"){try{const dia=new Date().toLocaleDateString("pt-AO",{timeZone:"Africa/Luanda",day:"numeric",month:"long",year:"numeric"});const resp=await chatIA(`Eventos históricos em ${dia}. Lista 3-5. Formato: 📅 *Ano* — _Evento_`);await sock.sendMessage(jid,{text:bBloco("📅 EFEMÉRIDES",[bLine("📅",`*${dia.toUpperCase()}*`),B_SEP,resp])},{quoted:seloBot});await reagir(sock,msg,"📅");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="fato"){try{const resp=await chatIA("Conta um facto curioso. Começa com 'Sabia que...'.");await sock.sendMessage(jid,{text:bBloco("💡 FACTO CURIOSO",[bLine("💡",resp)])},{quoted:seloBot});await reagir(sock,msg,"💡");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="pais"&&args.length>0){const pais=args.join(" ");try{const resp=await chatIA(`Informações sobre "${pais}": capital, população, língua, moeda, continente e 1 curiosidade.`);let flag=null;try{flag=await buscarImagemInternet(`bandeira ${pais}`);}catch{}const textoP=bBloco("🌍 "+pais.toUpperCase(),[bLine("📝",resp)]);if(flag)await sock.sendMessage(jid,{image:{url:flag},caption:textoP},{quoted:seloBot});else await sock.sendMessage(jid,{text:textoP},{quoted:seloBot});await reagir(sock,msg,"🌍");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}
        if(comando==="previsao"&&args.length>0){const cidade=args.join(" ");try{const res=await axios.get(`https://wttr.in/${encodeURIComponent(cidade)}?format=j1`,{timeout:10000,httpsAgent});const dias=res.data.weather?.slice(0,3)||[];const nomesDias=["Hoje","Amanhã","Depois"];const linhas=[bLine("📍",`*${cidade.toUpperCase()}*`)];dias.forEach((d,i)=>{const desc=d.hourly?.[4]?.weatherDesc?.[0]?.value||"N/A";const chuva=d.hourly?.[4]?.chanceofrain||"0";linhas.push(bLine("🌤️",`*${nomesDias[i]}:* ${desc} — ${d.mintempC}°↔${d.maxtempC}° 💧${chuva}%`));});await sock.sendMessage(jid,{text:bBloco("🌤️ PREVISÃO 3 DIAS",linhas)},{quoted:seloBot});await reagir(sock,msg,"🌤️");}catch{await sock.sendMessage(jid,{text:bLine("❌","Cidade não encontrada.")},{quoted:seloBot});}return;}
        if(comando==="filme"&&args.length>0){const nome=args.join(" ");let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🎬 FILME",[bLine("🔍",`_${nome}_`),FRAMES_LOADING[1]])},{quoted:seloBot});}catch{}try{const resp=await chatIA(`Info sobre o filme "${nome}": ano, director, elenco (3), sinopse (2 linhas), nota IMDB, género.`);if(loadMsg)try{await sock.sendMessage(jid,{text:bBloco("🎬 FILME",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}await new Promise(r=>setTimeout(r,300));let poster=null;try{poster=await buscarImagemInternet(`${nome} filme poster`);}catch{}const textoF=bBloco("🎬 "+nome.toUpperCase(),[bLine("📝",resp)]);if(poster)await sock.sendMessage(jid,{image:{url:poster},caption:textoF},{quoted:seloBot});else await sock.sendMessage(jid,{text:textoF},{quoted:seloBot});await reagir(sock,msg,"🎬");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}
        if(comando==="serie"&&args.length>0){const nome=args.join(" ");try{const resp=await chatIA(`Info sobre a série "${nome}": ano, criador, elenco, sinopse, nº temporadas, nota, plataforma.`);let poster=null;try{poster=await buscarImagemInternet(`${nome} série poster`);}catch{}const textoS=bBloco("📺 "+nome.toUpperCase(),[bLine("📝",resp)]);if(poster)await sock.sendMessage(jid,{image:{url:poster},caption:textoS},{quoted:seloBot});else await sock.sendMessage(jid,{text:textoS},{quoted:seloBot});await reagir(sock,msg,"📺");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}
        if(comando==="livro"&&args.length>0){const nome=args.join(" ");try{const resp=await chatIA(`Info sobre o livro "${nome}": autor, ano, género, sinopse (2 linhas), nota e curiosidade.`);await sock.sendMessage(jid,{text:bBloco("📚 LIVRO — "+nome.toUpperCase(),[bLine("📝",resp)])},{quoted:seloBot});await reagir(sock,msg,"📚");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}
        if(comando==="cripto"){const moeda=(args[0]||"bitcoin").toLowerCase();let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("💹 CRIPTO",[bLine("🔍",`_${moeda}_`),FRAMES_LOADING[1]])},{quoted:seloBot});}catch{}try{const idMap={btc:"bitcoin",eth:"ethereum",bnb:"binancecoin",sol:"solana",xrp:"ripple",doge:"dogecoin",ada:"cardano",matic:"matic-network"};const coinId=idMap[moeda]||moeda;const{data}=await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,brl&include_24hr_change=true`,{timeout:10000,httpsAgent});if(loadMsg)try{await sock.sendMessage(jid,{text:bBloco("💹 CRIPTO",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}await new Promise(r=>setTimeout(r,300));const info=data[coinId];if(info){const change=(info.usd_24h_change||0).toFixed(2);const seta=parseFloat(change)>=0?"📈":"📉";await sock.sendMessage(jid,{text:bBloco("💹 "+moeda.toUpperCase(),[bLine("💵",`USD: *$${(info.usd||0).toLocaleString("pt-BR")}*`),bLine("🇧🇷",`BRL: *R$${(info.brl||0).toLocaleString("pt-BR")}*`),bLine(seta,`24h: *${change}%*`)])},{quoted:seloBot});}else throw new Error("Moeda não encontrada");await reagir(sock,msg,"💹");}catch{if(loadMsg)try{await sock.sendMessage(jid,{text:bBloco("💹 CRIPTO",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}try{const resp=await chatIA(`Preço actual de ${moeda} em USD e BRL. Sê direto.`);await sock.sendMessage(jid,{text:bBloco("💹 "+moeda.toUpperCase(),[bLine("📊",resp)])},{quoted:seloBot});await reagir(sock,msg,"💹");}catch{await sock.sendMessage(jid,{text:bLine("❌","Moeda não encontrada.")},{quoted:seloBot});}}return;}
        if(comando==="converter"&&args.length>=3){const [qtdStr,moeda1,moeda2]=args;const qtd=parseFloat(qtdStr);if(isNaN(qtd)){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}converter* [quantidade] [moeda1] [moeda2]`)},{quoted:seloBot});return;}try{const resp=await chatIA(`Converte ${qtd} ${moeda1} para ${moeda2}. Sê direto.`,"Especialista em câmbio.");await sock.sendMessage(jid,{text:bBloco("💱 CONVERSOR",[bLine("💱",`*${qtd} ${moeda1.toUpperCase()} =*`),bLine("✅",resp)])},{quoted:seloBot});await reagir(sock,msg,"💱");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não consegui.")},{quoted:seloBot});}return;}
        if(comando==="definir"&&args.length>0){const palavra=args.join(" ");try{const resp=await chatIA(`Define "${palavra}" em português. Classe gramatical e frase exemplo.`);await sock.sendMessage(jid,{text:bBloco("📖 "+palavra.toUpperCase(),[bLine("📝",resp)])},{quoted:seloBot});await reagir(sock,msg,"📖");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}
        if(comando==="sinonimo"&&args.length>0){const palavra=args.join(" ");try{const resp=await chatIA(`Lista 8 sinónimos de "${palavra}" em português. Formato: *Palavra* — _contexto_`);await sock.sendMessage(jid,{text:bBloco("📝 SINÓNIMOS — "+palavra.toUpperCase(),[resp])},{quoted:seloBot});await reagir(sock,msg,"📝");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}

        // ─── MÚSICAS ───
        if(comando==="letra"&&args.length>0){const musica=args.join(" ");let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🎵 LETRA",[bLine("🔍",`_${musica}_`),FRAMES_LOADING[1]])},{quoted:seloBot});}catch{}try{const resp=await chatIA(`Escreve a letra de "${musica}". Se não souberes, diz.`);if(loadMsg)try{await sock.sendMessage(jid,{text:bBloco("🎵 LETRA",[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}await new Promise(r=>setTimeout(r,300));await sock.sendMessage(jid,{text:bBloco("🎵 "+musica.toUpperCase(),[resp])},{quoted:seloBot});await reagir(sock,msg,"🎵");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="cifra"&&args.length>0){const musica=args.join(" ");try{const resp=await chatIA(`Acordes/cifra de "${musica}". Compacto.`);await sock.sendMessage(jid,{text:bBloco("🎸 CIFRA — "+musica.toUpperCase(),[resp])},{quoted:seloBot});await reagir(sock,msg,"🎸");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="bio"&&args.length>0){const artista=args.join(" ");try{const resp=await chatIA(`Biografia curta (150 palavras) de "${artista}": origem, estilo, álbuns, curiosidade.`);let foto=null;try{foto=await buscarImagemInternet(artista);}catch{}const textoB=bBloco("🎤 BIO: "+artista.toUpperCase(),[bLine("📝",resp)]);if(foto)await sock.sendMessage(jid,{image:{url:foto},caption:textoB},{quoted:seloBot});else await sock.sendMessage(jid,{text:textoB},{quoted:seloBot});await reagir(sock,msg,"🎤");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}
        if(comando==="album"&&args.length>0){const artista=args.join(" ");try{const resp=await chatIA(`5 álbuns mais famosos de "${artista}". Formato: 📀 *Nome* (Ano)`);await sock.sendMessage(jid,{text:bBloco("💿 DISCOGRAFIA — "+artista.toUpperCase(),[resp])},{quoted:seloBot});await reagir(sock,msg,"💿");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}
        if(comando==="recomenda"&&args.length>0){const genero=args.join(" ");try{const resp=await chatIA(`5 músicas do género "${genero}". Formato: 🎵 *Nome* — *Artista*`);await sock.sendMessage(jid,{text:bBloco("🎧 RECOMENDAÇÕES — "+genero.toUpperCase(),[resp])},{quoted:seloBot});await reagir(sock,msg,"🎧");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="top10"){const pais=args.join(" ")||"Angola";try{const resp=await chatIA(`Top 10 músicas em "${pais}" actualmente. Formato: 🏆 Nº. *Nome* — *Artista*`);await sock.sendMessage(jid,{text:bBloco("🏆 TOP 10 — "+pais.toUpperCase(),[resp])},{quoted:seloBot});await reagir(sock,msg,"🏆");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}

        // ─── ANIMES ───
        if(comando==="anime"&&args.length>0){const nome=args.join(" ");try{const resp=await chatIA(`Info sobre o anime "${nome}": estúdio, ano, episódios, género, sinopse (2 linhas), nota MAL.`,"Otaku especialista.");let img=null;try{img=await buscarImagemInternet(`${nome} anime poster`);}catch{}const textoA=bBloco("🎌 "+nome.toUpperCase(),[bLine("📝",resp)]);if(img)await sock.sendMessage(jid,{image:{url:img},caption:textoA},{quoted:seloBot});else await sock.sendMessage(jid,{text:textoA},{quoted:seloBot});await reagir(sock,msg,"🎌");}catch{await sock.sendMessage(jid,{text:bLine("❌","Não encontrei.")},{quoted:seloBot});}return;}
        if(comando==="topanimes"){try{const resp=await chatIA("Top 10 melhores animes. Formato: 🏆 Nº. *Nome* — Género","Especialista em animes.");await sock.sendMessage(jid,{text:bBloco("🎌 TOP ANIMES",[resp])},{quoted:seloBot});await reagir(sock,msg,"🎌");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="animealeatorio"){const a=ANIMES_INFO[Math.floor(Math.random()*ANIMES_INFO.length)];let img=null;try{img=await buscarImagemInternet(`${a.nome} anime poster`);}catch{}const textoAA=bBloco("🎌 ANIME ALEATÓRIO",[bLine("🎌",`*${a.nome}*`),bLine("🎭",`Género: ${a.gen}`),bLine("📺",`Episódios: ${a.ep}`),bLine("⭐",`Nota: ${a.nota}/10`)]);if(img)await sock.sendMessage(jid,{image:{url:img},caption:textoAA},{quoted:seloBot});else await sock.sendMessage(jid,{text:textoAA},{quoted:seloBot});await reagir(sock,msg,"🎌");return;}
        if(comando==="fraseanime"){try{const resp=await chatIA("Dá uma frase épica de um personagem de anime. Formato: _\"frase\"_ — *Personagem* (Anime)","Otaku especialista.");await sock.sendMessage(jid,{text:bBloco("🎌 FRASE DE ANIME",[bLine("✨",resp)])},{quoted:seloBot});await reagir(sock,msg,"✨");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="quizanime"){try{const resp=await chatIA("Cria uma pergunta de quiz sobre animes. Formato: ❓ *Pergunta*? Resposta: ||spoiler||","Quiz animes.");await sock.sendMessage(jid,{text:bBloco("🎌 QUIZ ANIME",[bLine("❓",resp)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}

        // ─── RPG ───
        if(comando==="rpgstart"){if(!rpgPersonagens)rpgPersonagens={};if(rpgPersonagens[sender]){const p=rpgPersonagens[sender];const barHP="█".repeat(Math.floor((p.hp/p.hpMax)*10))+"░".repeat(10-Math.floor((p.hp/p.hpMax)*10));await sock.sendMessage(jid,{text:bBloco("⚔️ PERSONAGEM JÁ EXISTE",[bLine("👤",`*${p.nome}* | *${p.classe}*`),bLine("⭐",`Nível: *${p.nivel}*`),bLine("❤️",`HP: [${barHP}] *${p.hp}/${p.hpMax}*`),bLine("⚔️",`ATK: *${p.atk}* | DEF: *${p.def}*`),bLine("💰",`Ouro: *${p.ouro}*`)])},{quoted:seloBot});return;}const classes=["Guerreiro","Mago","Arqueiro","Paladino","Assassino"];const classe=classes[Math.floor(Math.random()*classes.length)];const statsClasse={Guerreiro:{hp:120,atk:15,def:12},Mago:{hp:80,atk:25,def:6},Arqueiro:{hp:100,atk:18,def:9},Paladino:{hp:130,atk:12,def:15},Assassino:{hp:90,atk:22,def:7}};const st=statsClasse[classe];rpgPersonagens[sender]={nome:sender.split("@")[0],classe,nivel:1,xp:0,hp:st.hp,hpMax:st.hp,atk:st.atk,def:st.def,ouro:50};salvarRpg();await sock.sendMessage(jid,{text:bBloco("⚔️ PERSONAGEM CRIADO",[bLine("👤",`*${rpgPersonagens[sender].nome}*`),bLine("🛡️",`Classe: *${classe}*`),bLine("❤️",`HP: *${st.hp}* | ⚔️ ATK: *${st.atk}* | 🛡️ DEF: *${st.def}*`),bLine("💰","Ouro: *50*"),B_SEP,bLine("💡",`*!rpgstatus* | *!rpgataque* | *!rpgcurar* | *!rpgsorte*`)])},{quoted:seloBot});await reagir(sock,msg,"⚔️");return;}
        if(comando==="rpgstatus"){if(!rpgPersonagens?.[sender]){await sock.sendMessage(jid,{text:bLine("⚔️",`Usa *${CONFIG.PREFIXO}rpgstart* primeiro!`)},{quoted:seloBot});return;}const p=rpgPersonagens[sender];const barHP="█".repeat(Math.floor((p.hp/p.hpMax)*10))+"░".repeat(10-Math.floor((p.hp/p.hpMax)*10));await sock.sendMessage(jid,{text:bBloco("⚔️ STATUS — "+p.nome.toUpperCase(),[bLine("🛡️",`Classe: *${p.classe}* | Nível: *${p.nivel}*`),bLine("❤️",`HP: [${barHP}] *${p.hp}/${p.hpMax}*`),bLine("⚔️",`ATK: *${p.atk}* | DEF: *${p.def}*`),bLine("✨",`XP: *${p.xp}* | 💰 Ouro: *${p.ouro}*`)])},{quoted:seloBot});return;}
        if(comando==="rpgataque"){if(!rpgPersonagens?.[sender]){await sock.sendMessage(jid,{text:bLine("⚔️",`Usa *${CONFIG.PREFIXO}rpgstart* primeiro!`)},{quoted:seloBot});return;}const p=rpgPersonagens[sender];const inimigos=["Goblin","Orc","Dragão Jovem","Bandido","Lobo Sombrio","Esqueleto","Troll"];const inimigo=inimigos[Math.floor(Math.random()*inimigos.length)];const hpInimigo=Math.floor(Math.random()*60)+30;const atkInimigo=Math.floor(Math.random()*15)+5;const danoJogador=Math.max(1,p.atk+Math.floor(Math.random()*10)-3);const danoInimigo=Math.max(0,atkInimigo-p.def+Math.floor(Math.random()*5));if(danoJogador>hpInimigo*0.4){const xpGanho=Math.floor(hpInimigo*0.8);const ouroGanho=Math.floor(Math.random()*20)+5;p.xp+=xpGanho;p.ouro+=ouroGanho;if(p.xp>=p.nivel*100){p.nivel++;p.hpMax+=10;p.hp=p.hpMax;p.atk+=2;p.def+=1;}salvarRpg();await sock.sendMessage(jid,{text:bBloco("⚔️ VITÓRIA!",[bLine("⚔️",`Derrotaste um *${inimigo}*!`),bLine("💥",`Dano: *${danoJogador}*`),bLine("✨",`XP: +${xpGanho} | 💰 Ouro: +${ouroGanho}`)])},{quoted:seloBot});await reagir(sock,msg,"⚔️");}else{p.hp=Math.max(1,p.hp-danoInimigo);salvarRpg();await sock.sendMessage(jid,{text:bBloco("⚔️ BATALHA DIFÍCIL",[bLine("⚔️",`Enfrentaste um *${inimigo}*`),bLine("💥",`Dano causado: *${danoJogador}*`),bLine("❤️",`Dano recebido: *${danoInimigo}* | HP: *${p.hp}/${p.hpMax}*`)])},{quoted:seloBot});await reagir(sock,msg,"😤");}return;}
        if(comando==="rpgcurar"){if(!rpgPersonagens?.[sender]){await sock.sendMessage(jid,{text:bLine("⚔️",`Usa *${CONFIG.PREFIXO}rpgstart* primeiro!`)},{quoted:seloBot});return;}const p=rpgPersonagens[sender];const custo=20;if(p.ouro<custo){await sock.sendMessage(jid,{text:bBloco("💰 OURO INSUFICIENTE",[bLine("❌",`Precisas de *${custo}* ouro. Tens: *${p.ouro}*`)])},{quoted:seloBot});return;}const cura=Math.floor(p.hpMax*0.4);p.hp=Math.min(p.hpMax,p.hp+cura);p.ouro-=custo;salvarRpg();await sock.sendMessage(jid,{text:bBloco("💚 CURADO!",[bLine("💚",`HP restaurado: *+${cura}*`),bLine("❤️",`HP actual: *${p.hp}/${p.hpMax}*`),bLine("💰",`Ouro restante: *${p.ouro}*`)])},{quoted:seloBot});await reagir(sock,msg,"💚");return;}
        if(comando==="rpgsorte"){if(!rpgPersonagens?.[sender]){await sock.sendMessage(jid,{text:bLine("⚔️",`Usa *${CONFIG.PREFIXO}rpgstart* primeiro!`)},{quoted:seloBot});return;}const p=rpgPersonagens[sender];const eventos=[{msg:"Encontraste uma moeda! +10 ouro.",ouro:10,hp:0},{msg:"Um mercador deu-te uma poção! +20 HP.",ouro:0,hp:20},{msg:"Caíste numa armadilha! -15 HP.",ouro:0,hp:-15},{msg:"Ganhaste a lotaria! +30 ouro!",ouro:30,hp:0},{msg:"Treino surpresa! +5 XP.",ouro:0,hp:0,xp:5},{msg:"Encontraste um baú! +25 ouro.",ouro:25,hp:0}];const ev=eventos[Math.floor(Math.random()*eventos.length)];p.ouro=Math.max(0,p.ouro+(ev.ouro||0));p.hp=Math.max(1,Math.min(p.hpMax,p.hp+(ev.hp||0)));if(ev.xp)p.xp+=(ev.xp||0);salvarRpg();await sock.sendMessage(jid,{text:bBloco("🎲 SORTE DO DIA",[bLine("🎲",ev.msg),bLine("📊",`HP: *${p.hp}/${p.hpMax}* | 💰 *${p.ouro}*`)])},{quoted:seloBot});await reagir(sock,msg,"🎲");return;}
        if(comando==="rpgclasse"){if(!rpgPersonagens?.[sender]){await sock.sendMessage(jid,{text:bLine("⚔️",`Usa *${CONFIG.PREFIXO}rpgstart* primeiro!`)},{quoted:seloBot});return;}const p=rpgPersonagens[sender];const descClasses={Guerreiro:"🗡️ Mestre do combate. Alto HP e defesa.",Mago:"🔮 Poder mágico devastador. Baixa defesa mas ATK altíssimo.",Arqueiro:"🏹 Ataques à distância. Equilíbrio entre ATK e HP.",Paladino:"🛡️ Tanque supremo. Alta defesa e HP.",Assassino:"🗡️ Velocidade e precisão. Alto ATK."};await sock.sendMessage(jid,{text:bBloco("⚔️ CLASSE: "+p.classe.toUpperCase(),[bLine("🛡️",descClasses[p.classe]||"Classe especial."),bLine("📊",`Nível: *${p.nivel}* | XP: *${p.xp}*`)])},{quoted:seloBot});return;}

        // ─── IAs ───
        if(["gpt","gemini","deepseek"].includes(comando)&&args.length>0){const perg=args.join(" ");const nomes={gpt:{nome:"🤖 GPT",sistema:"Você é o ChatGPT da OpenAI. Responde em português de forma precisa."},gemini:{nome:"💎 GEMINI",sistema:"Você é o Gemini do Google. Responde em português de forma inteligente."},deepseek:{nome:"🔵 DEEPSEEK",sistema:"Você é o DeepSeek. Responde em português com raciocínio detalhado."}};const info=nomes[comando];let loadMsg=null;try{loadMsg=await sock.sendMessage(jid,{text:bBloco(info.nome,[bLine("⏳","A processar..."),FRAMES_LOADING[2]])},{quoted:seloBot});}catch{}try{const resp=await chatIA(perg,info.sistema);if(loadMsg)try{await sock.sendMessage(jid,{text:bBloco(info.nome,[FRAMES_LOADING[5]]),edit:loadMsg.key});}catch{}await new Promise(r=>setTimeout(r,300));await sock.sendMessage(jid,{text:bBloco(info.nome,[bLine("💬",`_${perg}_`),B_SEP,bLine("🤖",resp)])},{quoted:seloBot});await reagir(sock,msg,"🤖");}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}

        // ─── +18 VIP ───
        if(comando==="piada18"){const p=await chatIA("Conta uma piada adulta (+18) engraçada em português. Não seja ofensiva.","Humorista adulto.");await sock.sendMessage(jid,{text:bBloco("🔞 PIADA +18",[bLine("😏",p)])},{quoted:seloBot});return;}
        if(comando==="truth"){const t=VERDADES_18[Math.floor(Math.random()*VERDADES_18.length)];await sock.sendMessage(jid,{text:bBloco("🎯 TRUTH",[bLine("❓",t)])},{quoted:seloBot});return;}
        if(comando==="dare"){const d=DESAFIOS_18[Math.floor(Math.random()*DESAFIOS_18.length)];await sock.sendMessage(jid,{text:bBloco("🎲 DARE",[bLine("🔥",d)])},{quoted:seloBot});return;}
        if(comando==="crush"){const membros=isGrupo?(await sock.groupMetadata(jid).catch(()=>({participants:[]}))).participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p)).filter(m=>m!==sender):[];const alvo=membros.length>0?membros[Math.floor(Math.random()*membros.length)]:null;await sock.sendMessage(jid,{text:bBloco("💘 CRUSH",[bLine("💘",alvo?`Teu crush secreto é @${alvo.split("@")[0]}! 😍`:"Sem membros!")]),mentions:alvo?[alvo]:[]},{quoted:seloBot});return;}
        if(["seduzir","beijo","abraco","tapa","flirt","casal"].includes(comando)){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}${comando}* @user`)},{quoted:seloBot});return;}const emojisAcao={seduzir:"😏",beijo:"😘",abraco:"🤗",tapa:"👋",flirt:"💋",casal:"💑"};const frasesAcao={seduzir:`😏 @${sender.split("@")[0]} está a seduzir @${alvo.split("@")[0]}! 🔥`,beijo:`😘 @${sender.split("@")[0]} deu um beijo em @${alvo.split("@")[0]}! 💋`,abraco:`🤗 @${sender.split("@")[0]} abraçou @${alvo.split("@")[0]}! ❤️`,tapa:`👋 @${sender.split("@")[0]} deu um tapa em @${alvo.split("@")[0]}! 💥`,flirt:`💋 @${sender.split("@")[0]} está a flirtar com @${alvo.split("@")[0]}! 😍`,casal:`💑 @${sender.split("@")[0]} e @${alvo.split("@")[0]} estão juntos! ❤️`};await sock.sendMessage(jid,{text:bBloco(emojisAcao[comando]+" "+comando.toUpperCase(),[bLine(emojisAcao[comando],frasesAcao[comando])]),mentions:[sender,alvo]},{quoted:seloBot});await reagir(sock,msg,emojisAcao[comando]);return;}

        // ─── BRINCADEIRAs EXTRAS ───

        // 8BALL
        if(comando==="8ball"){
          const pergunta=args.join(" ");
          if(!pergunta){await sock.sendMessage(jid,{text:`❌ *!8ball* [pergunta]`},{quoted:seloBot});return;}
          const respostas=["✅ *Sim, definitivamente!*","✅ *Com certeza!*","✅ *Sem dúvida!*","✅ *Podes contar com isso!*","🤔 *Talvez... quem sabe?*","🤔 *Pergunta mais tarde.*","🤔 *Não tenho a certeza.*","🤔 *Os sinais são confusos.*","❌ *Não acredito que sim.*","❌ *As perspectivas não são boas.*","❌ *Muito duvidoso.*","❌ *Definitivamente não!*","😂 *Só se chover a cima!*","😂 *Deus te livre dessa ideia!*","🔮 *O universo diz: talvez amanhã!*"];
          const resp=respostas[Math.floor(Math.random()*respostas.length)];
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("🎱 BOLA MÁGICA")}
${B_MID}
${bLine("❓",`_${pergunta}_`)}
${B_MID}
${bLine("🎱",resp)}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,"🎱");return;
        }

        // BaÚ DO TESOURO
        if(comando==="bau"){
          const cooldownKey="bau";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=4*60*60*1000;
          if(agora-ultimo<COOL){const h=Math.ceil((COOL-(agora-ultimo))/3600000);await sock.sendMessage(jid,{text:`⏰ Volta em *${h}h* para abrir outro baú!`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const roll=Math.random();
          let premio="",emoji="",moedas=0,xp=0;
          if(roll<0.05){premio="💎 *JACKPOT!* Encontraste um diamante!";emoji="💎";moedas=500;xp=100;}
          else if(roll<0.15){premio="🥇 *RARO!* Moedas de ouro!";emoji="🥇";moedas=200;xp=50;}
          else if(roll<0.35){premio="🪙 Algumas moedas brilhantes!";emoji="🪙";moedas=80;xp=20;}
          else if(roll<0.60){premio="🎁 Um presente modesto.";emoji="🎁";moedas=30;xp=10;}
          else if(roll<0.80){premio="📜 Um mapa do tesouro inútil! 😂";emoji="📜";moedas=5;xp=5;}
          else{premio="🕷️ Apenas aranhas e pó! 💀";emoji="🕷️";moedas=0;xp=2;}
          if(moedas>0)addCoins(sender,moedas);
          addXP(sender,xp);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("📦 BAÚ DO TESOURO")}
${B_MID}
${bLine("🔓","Abriste o baú...")}
${bLine(emoji,premio)}
${moedas>0?bLine("💰",`+*${moedas}* moedas | +*${xp}* XP`):bLine("😢","Melhor sorte próxima vez!")}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,emoji||"📦");return;
        }

        // TRABALHAR
        if(comando==="trabalhar"){
          const cooldownKey="trabalhar";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=2*60*60*1000;
          if(agora-ultimo<COOL){const m=Math.ceil((COOL-(agora-ultimo))/60000);await sock.sendMessage(jid,{text:`⏰ Estás cansado! Descansa *${m} min* antes de trabalhar de novo.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const trabalhos=[{nome:"Vendedor de pão",ganho:Math.floor(Math.random()*40)+20,desc:"Acordaste às 5h a vender pão na rua! 🍞"},
            {nome:"Mecânico",ganho:Math.floor(Math.random()*80)+40,desc:"Consertaste 3 carros hoje! 🔧"},
            {nome:"Agricultor",ganho:Math.floor(Math.random()*50)+25,desc:"Trabalhaste no campo o dia todo! 🌾"},
            {nome:"Cozinheiro",ganho:Math.floor(Math.random()*60)+30,desc:"Fizeste a melhor muamba da cidade! 🍲"},
            {nome:"Professor",ganho:Math.floor(Math.random()*70)+35,desc:"Deste aulas o dia inteiro! 📚"},
            {nome:"Músico",ganho:Math.floor(Math.random()*90)+10,desc:"Tocaste na rua e o povo adorou! 🎵"},
            {nome:"Motorista",ganho:Math.floor(Math.random()*65)+30,desc:"Transportaste passageiros o dia todo! 🚗"},
            {nome:"Pedreiro",ganho:Math.floor(Math.random()*75)+40,desc:"Construíste uma parede inteira! 🧱"},
            {nome:"Pescador",ganho:Math.floor(Math.random()*55)+20,desc:"Apanhaste muitos peixes hoje! 🐟"},
            {nome:"Hacker",ganho:Math.floor(Math.random()*150)+50,desc:"Trabalho suspeito mas pagou bem! 💻"},
          ];
          const t=trabalhos[Math.floor(Math.random()*trabalhos.length)];
          addCoins(sender,t.ganho);addXP(sender,15);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("💼 TRABALHO")}
${B_MID}
${bLine("👷",`*${t.nome}*`)}
${bLine("📖",t.desc)}
${B_MID}
${bLine("💰",`+*${t.ganho}* moedas | +*15* XP`)}
${bLine("💰",`Total: *${getCoins(sender)}* moedas`)}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,"💼");return;
        }

        // MINERAR
        if(comando==="minerar"){
          const cooldownKey="minerar";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=3*60*60*1000;
          if(agora-ultimo<COOL){const h=Math.ceil((COOL-(agora-ultimo))/60000);await sock.sendMessage(jid,{text:`⏰ A mina ainda está instável! Volta em *${h} min*.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const minerais=[
            {nome:"💎 Diamante",chance:0.05,moedas:300,xp:80},
            {nome:"🥇 Ouro",chance:0.15,moedas:150,xp:40},
            {nome:"💎 Esmeralda",chance:0.10,moedas:200,xp:55},
            {nome:"🪨 Ferro",chance:0.30,moedas:50,xp:15},
            {nome:"🪵 Carvão",chance:0.25,moedas:20,xp:8},
            {nome:"🪨 Pedra",chance:0.15,moedas:5,xp:3},
          ];
          const roll=Math.random();let acumulado=0;let mineral=minerais[minerais.length-1];
          for(const m of minerais){acumulado+=m.chance;if(roll<=acumulado){mineral=m;break;}}
          addCoins(sender,mineral.moedas);addXP(sender,mineral.xp);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("⛏️ MINERAÇÃO")}
${B_MID}
${bLine("⛏️","Entraste na mina funda...")}
${bLine("✨",`Encontraste: *${mineral.nome}*`)}
${bLine("💰",`+*${mineral.moedas}* moedas | +*${mineral.xp}* XP`)}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,"⛏️");return;
        }

        // PESCAR
        if(comando==="pescar"){
          const cooldownKey="pescar";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=90*60*1000;
          if(agora-ultimo<COOL){const m=Math.ceil((COOL-(agora-ultimo))/60000);await sock.sendMessage(jid,{text:`⏰ O peixe fugiu! Volta em *${m} min* para pescar de novo.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const peixes=[
            {nome:"🐋 Baleia!!!",moedas:400,xp:100,desc:"IMPOSSÍVEL! Apanhaste uma baleia!"},
            {nome:"🦈 Tubarão",moedas:200,xp:60,desc:"Que corajoso! Um tubarão!"},
            {nome:"🐟 Atum grande",moedas:100,xp:30,desc:"Óptima pescaria!"},
            {nome:"🐠 Peixe tropical",moedas:60,xp:20,desc:"Peixe bonito!"},
            {nome:"🐡 Peixe-balão",moedas:40,xp:12,desc:"Cuidado com os espinhos!"},
            {nome:"🦀 Caranguejo",moedas:25,xp:8,desc:"Pelo menos é algo!"},
            {nome:"👟 Um sapato velho",moedas:2,xp:3,desc:"Que sorte azarada! 😂"},
            {nome:"🪼 Água-viva",moedas:5,xp:5,desc:"Ai! Levaste uma picada!"},
          ];
          const roll=Math.random();
          const peixe=roll<0.02?peixes[0]:roll<0.08?peixes[1]:roll<0.20?peixes[2]:roll<0.40?peixes[3]:roll<0.55?peixes[4]:roll<0.70?peixes[5]:roll<0.85?peixes[6]:peixes[7];
          addCoins(sender,peixe.moedas);addXP(sender,peixe.xp);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("🎣 PESCA")}
${B_MID}
${bLine("🎣","Lançaste a cana...")}
${bLine("🐟",`Apanhaste: *${peixe.nome}*`)}
${bLine("📖",peixe.desc)}
${bLine("💰",`+*${peixe.moedas}* moedas | +*${peixe.xp}* XP`)}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,"🎣");return;
        }

        // TREINAR
        if(comando==="treinar"){
          const cooldownKey="treinar";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=60*60*1000;
          if(agora-ultimo<COOL){const m=Math.ceil((COOL-(agora-ultimo))/60000);await sock.sendMessage(jid,{text:`⏰ Ainda estás a recuperar! Descansa *${m} min*.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const treinos=["Fizeste 100 flexões! 💪","Correste 10km! 🏃","Levantaste 50kg! 🏋️","Fizeste yoga por 2h! 🧘","Nadaste 2km! 🏊","Treinaste artes marciais! 🥋","Jogaste futebol por 2h! ⚽"];
          const t=treinos[Math.floor(Math.random()*treinos.length)];
          const xpGanho=Math.floor(Math.random()*30)+20;
          addXP(sender,xpGanho);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("💪 TREINO")}
${B_MID}
${bLine("💪",t)}
${bLine("✨",`+*${xpGanho}* XP`)}
${bLine("⭐",`XP total: *${(()=>{try{const r=fs.readJsonSync(ARQUIVO_RANK);return r[sender.split("@")[0]]?.xp||0;}catch{return 0;}})()}*`)}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,"💪");return;
        }

        // CAÇADA
        if(comando==="cacada"){
          const cooldownKey="cacada";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=2.5*60*60*1000;
          if(agora-ultimo<COOL){const m=Math.ceil((COOL-(agora-ultimo))/60000);await sock.sendMessage(jid,{text:`⏰ Os animais fugiram! Volta em *${m} min*.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const presas=[
            {nome:"🦁 Leão",moedas:250,xp:70,desc:"Caçaste um leão! Lendário!"},
            {nome:"🐘 Elefante",moedas:300,xp:80,desc:"Incrível! Um elefante enorme!"},
            {nome:"🦌 Veado",moedas:100,xp:30,desc:"Boa pontaria!"},
            {nome:"🐗 Javali",moedas:70,xp:20,desc:"Resistiu mas conseguiste!"},
            {nome:"🐇 Coelho",moedas:30,xp:10,desc:"Pelo menos é algo para comer!"},
            {nome:"🦅 Águia",moedas:120,xp:35,desc:"Difícil de apanhar!"},
            {nome:"💨 Nada",moedas:5,xp:5,desc:"Os animais fugiram todos! 😅"},
          ];
          const roll=Math.random();
          const presa=roll<0.05?presas[0]:roll<0.10?presas[1]:roll<0.25?presas[5]:roll<0.45?presas[2]:roll<0.62?presas[3]:roll<0.82?presas[4]:presas[6];
          addCoins(sender,presa.moedas);addXP(sender,presa.xp);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("🏹 CAÇADA")}
${B_MID}
${bLine("🏹","Entras na floresta...")}
${bLine("🎯",`Capturaste: *${presa.nome}*`)}
${bLine("📖",presa.desc)}
${bLine("💰",`+*${presa.moedas}* moedas | +*${presa.xp}* XP`)}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,"🏹");return;
        }

        // MISSÃO DIÁRIA
        if(comando==="missao"){
          const cooldownKey="missao";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=24*60*60*1000;
          if(agora-ultimo<COOL){const h=Math.ceil((COOL-(agora-ultimo))/3600000);await sock.sendMessage(jid,{text:`⏰ Missão já completada! Próxima em *${h}h*.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const missoes=[
            {titulo:"🗡️ Destruir o Chefe Inimigo",moedas:200,xp:80,desc:"Derrotaste o líder dos bandidos!"},
            {titulo:"🏰 Defender a Aldeia",moedas:150,xp:60,desc:"Protegeste os aldeões com honra!"},
            {titulo:"📜 Entregar a Mensagem Secreta",moedas:120,xp:50,desc:"Missão sigilosa completada!"},
            {titulo:"💎 Recuperar o Diamante Roubado",moedas:250,xp:90,desc:"Heróico! O diamante está a salvo!"},
            {titulo:"🌊 Salvar o Pescador",moedas:100,xp:40,desc:"Saltaste ao mar sem hesitar!"},
            {titulo:"🔥 Apagar o Incêndio",moedas:130,xp:55,desc:"Salvaste a aldeia das chamas!"},
          ];
          const m=missoes[Math.floor(Math.random()*missoes.length)];
          addCoins(sender,m.moedas);addXP(sender,m.xp);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("⚔️ MISSÃO CONCLUÍDA!")}
${B_MID}
${bLine("📋",`*${m.titulo}*`)}
${bLine("📖",m.desc)}
${bLine("💰",`+*${m.moedas}* moedas | +*${m.xp}* XP`)}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,"⚔️");return;
        }

        // DORMIR
        if(comando==="dormir"){
          const cooldownKey="dormir";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=8*60*60*1000;
          if(agora-ultimo<COOL){const h=Math.ceil((COOL-(agora-ultimo))/3600000);await sock.sendMessage(jid,{text:`😴 Ainda estás com sono! Volta a dormir em *${h}h*.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const sonhos=["Sonhaste que eras ricaço! 💸","Sonhaste que voavas sobre Luanda! ✈️","Sonhaste que eras presidente! 🏛️","Tiveste pesadelos com a factura! 😱","Sonhaste com o teu crush! 😍","Dormiste tão bem que roncast! 😴","Dormiste em cima do telemóvel e enviaste msgs aleatórias! 😂"];
          const sonho=sonhos[Math.floor(Math.random()*sonhos.length)];
          const moedas=Math.floor(Math.random()*20)+5;const xp=Math.floor(Math.random()*15)+5;
          addCoins(sender,moedas);addXP(sender,xp);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("😴 DORMISTE BEM!")}
${B_MID}
${bLine("💤",sonho)}
${bLine("💰",`+*${moedas}* moedas | +*${xp}* XP`)}
${bLine("💡","Descansado e pronto para o dia!")}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,"😴");return;
        }

        // EXPLORAR
        if(comando==="explorar"){
          const cooldownKey="explorar";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=1.5*60*60*1000;
          if(agora-ultimo<COOL){const m=Math.ceil((COOL-(agora-ultimo))/60000);await sock.sendMessage(jid,{text:`⏰ Ainda estás a explorar! Volta em *${m} min*.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const locais=["🏜️ Deserto do Namibe","🌿 Floresta da Maiombe","🏔️ Serra da Leba","🌊 Costa de Benguela","🏙️ Luanda de noite","🗺️ Ruínas do Antigo Reino do Kongo","⛰️ Montanhas do Huambo"];
          const local=locais[Math.floor(Math.random()*locais.length)];
          const eventos=["Encontraste um mapa antigo! 🗺️","Descobriste uma caverna escondida! 🕳️","Encontraste um aldeão simpático! 😊","Caíste num buraco e levaste um susto! 😱","Viste um pôr do sol incrível! 🌅","Encontraste moedas perdidas! 💰","Foste atacado por um mosquito gigante! 🦟😂"];
          const evento=eventos[Math.floor(Math.random()*eventos.length)];
          const moedas=Math.floor(Math.random()*60)+10;const xp=Math.floor(Math.random()*25)+10;
          addCoins(sender,moedas);addXP(sender,xp);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("🗺️ EXPLORAÇÃO")}
${B_MID}
${bLine("📍",`Exploraste: *${local}*`)}
${bLine("🔍",evento)}
${bLine("💰",`+*${moedas}* moedas | +*${xp}* XP`)}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,"🗺️");return;
        }

        // VIAJAR
        if(comando==="viajar"){
          const destinos=["🇦🇴 Luanda","🇧🇷 Brasil","🇵🇹 Portugal","🇯🇵 Japão","🇺🇸 EUA","🇫🇷 Paris","🇿🇦 África do Sul","🇦🇪 Dubai","🇬🇧 Londres","🇮🇹 Roma"];
          const d=destinos[Math.floor(Math.random()*destinos.length)];
          try{const r=await chatIA(`Faz uma descrição divertida e curta de visitar ${d} por 2 linhas. Em português angolano.`);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("✈️ VIAGEM")}
${B_MID}
${bLine("✈️",`Viajaste para: *${d}*`)}
${bLine("📖",r)}
${B_BOT}`},{quoted:seloBot});}
          catch{await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("✈️ VIAGEM")}
${B_MID}
${bLine("✈️",`Viajaste para: *${d}*`)}
${bLine("📖","Que viagem incrível! Voltaste com muitas histórias!")}
${B_BOT}`},{quoted:seloBot});}
          await reagir(sock,msg,"✈️");return;
        }

        // CRIMES
        if(comando==="crimes"){
          const cooldownKey="crimes";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=6*60*60*1000;
          if(agora-ultimo<COOL){const h=Math.ceil((COOL-(agora-ultimo))/3600000);await sock.sendMessage(jid,{text:`⏰ A polícia ainda te anda à procura! Espera *${h}h*.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const sucesso=Math.random()>0.45;
          if(sucesso){
            const moedas=Math.floor(Math.random()*200)+50;addCoins(sender,moedas);
            const crimes2=["Assaltaste o banco! 🏦","Hackeaste o sistema do governo! 💻","Vendeste mangos roubados! 🥭😂","Roubaste o carro do vizinho! 🚗","Falsificaste documentos! 📄"];
            const c=crimes2[Math.floor(Math.random()*crimes2.length)];
            await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("🦹 CRIME")}
${B_MID}
${bLine("🦹",c)}
${bLine("💰",`+*${moedas}* moedas roubadas!`)}
${bLine("⚠️","Não te apanharam... desta vez! 😈")}
${B_BOT}`},{quoted:seloBot});
            await reagir(sock,msg,"😈");
          }else{
            const multa=Math.min(getCoins(sender),Math.floor(Math.random()*100)+50);setCoins(sender,getCoins(sender)-multa);
            await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("👮 APANHADO!")}
${B_MID}
${bLine("🚔","A polícia apanhou-te!")}
${bLine("💸",`Multa: *-${multa}* moedas!`)}
${bLine("😭","Da próxima pensa melhor! 😂")}
${B_BOT}`},{quoted:seloBot});
            await reagir(sock,msg,"🚔");
          }
          return;
        }

        // MENDIGAR
        if(comando==="mendigar"){
          const cooldownKey="mendigar";const agora=Date.now();const ultimo=getCooldown(sender,cooldownKey);const COOL=30*60*1000;
          if(agora-ultimo<COOL){const m=Math.ceil((COOL-(agora-ultimo))/60000);await sock.sendMessage(jid,{text:`⏰ Tens vergonha demais! Espera *${m} min*.`},{quoted:seloBot});return;}
          setCooldown(sender,cooldownKey);
          const resultados=[
            {msg:"Um velhote simpático deu-te um kwanza! 👴",moedas:1},
            {msg:"Ninguém te ligou... 😢",moedas:0},
            {msg:"Uma criança deu-te o seu lanche! 🍞",moedas:5},
            {msg:"Um milionário atirou-te 50 kwanzas! 💸",moedas:50},
            {msg:"Alguém ofereceu-te trabalho em vez de dinheiro! 😂",moedas:3},
            {msg:"Uma senhora deu-te uma marmita! 🍲",moedas:8},
          ];
          const r=resultados[Math.floor(Math.random()*resultados.length)];
          if(r.moedas>0)addCoins(sender,r.moedas);
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("🤲 MENDIGO")}
${B_MID}
${bLine("🤲",r.msg)}
${r.moedas>0?bLine("💰",`+*${r.moedas}* moedas`):bLine("😢","Nada hoje...")}
${B_BOT}`},{quoted:seloBot});
          await reagir(sock,msg,r.moedas>50?"🤑":"🤲");return;
        }

        // BATALHA PvP
        if(comando==="batalha"){
          const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);
          if(!alvo||!alvo.includes("@")||alvo===sender){await sock.sendMessage(jid,{text:`❌ *!batalha* @user — Desafia alguém!`},{quoted:seloBot});return;}
          const moedas_apostadas=parseInt(args[args.length-1])||50;
          if(getCoins(sender)<moedas_apostadas){await sock.sendMessage(jid,{text:`❌ Saldo insuficiente! Precisas de *${moedas_apostadas}* moedas.`},{quoted:seloBot});return;}
          const vencedor=Math.random()<0.5?sender:alvo;const perdedor=vencedor===sender?alvo:sender;
          const golpes=["soco devastador 👊","chute voador 🦵","cabeçada brutal 🗣️","rasteira fulminante 👟","golpe de cotovelo 💪"];
          const golpe=golpes[Math.floor(Math.random()*golpes.length)];
          addCoins(vencedor,moedas_apostadas);setCoins(perdedor,Math.max(0,getCoins(perdedor)-moedas_apostadas));
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("⚔️ BATALHA PvP")}
${B_MID}
${bLine("🥊",`@${sender.split("@")[0]} vs @${alvo.split("@")[0]}`)}
${bLine("💥",`Golpe decisivo: *${golpe}!*`)}
${B_MID}
${bLine("🏆",`Vencedor: @${vencedor.split("@")[0]}!`)}
${bLine("💰",`+*${moedas_apostadas}* moedas`)}
${B_BOT}`,mentions:[sender,alvo]},{quoted:seloBot});
          await reagir(sock,msg,"⚔️");return;
        }

        // NÍVEL / INVENTÁRIO / LOJA (simplificados)
        if(comando==="nivel"){
          try{const r=fs.readJsonSync(ARQUIVO_RANK);const n=sender.split("@")[0];const d=r[n]||{xp:0,nivel:1,msgs:0};const prox=d.nivel*100;const progresso=d.xp%100;const barra="█".repeat(Math.floor(progresso/10))+"░".repeat(10-Math.floor(progresso/10));
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("⭐ NÍVEL")}
${B_MID}
${bLine("⭐",`Nível: *${d.nivel}*`)}
${bLine("📊",`[${barra}] *${progresso}/${prox}* XP`)}
${bLine("💬",`Msgs: *${d.msgs}*`)}
${bLine("💰",`Moedas: *${getCoins(sender)}*`)}
${B_BOT}`},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:`❌ Erro.`},{quoted:seloBot});}return;
        }

        if(comando==="inventario"){
          await sock.sendMessage(jid,{text:`${B_TOP}
${bTitle("🎒 INVENTÁRIO")}
${B_MID}
${bLine("💰",`Moedas: *${getCoins(sender)}*`)}
${bLine("⭐",`VIP: *${isVip(sender)?"✅ Sim":"❌ Não"}*`)}
${bLine("💡","Usa *!bau*, *!trabalhar*, *!pescar*")}
${bLine("💡","para ganhar mais itens!")}
${B_BOT}`},{quoted:seloBot});return;
        }

        // ─── PINPACK — Pack de stickers ───
        if(comando==="pinpack"){
          const query=args.join(" ").trim();
          if(!query){await sock.sendMessage(jid,{text:`❌ *!pinpack* [termo]\nEx: *!pinpack* Robin`},{quoted:seloBot});return;}
          await reagir(sock,msg,"⏳");
          let loadMsg=null;
          try{loadMsg=await sock.sendMessage(jid,{text:bBloco("🎭 PINPACK",[bLine("🔍",`A buscar: _${query}_`),FRAMES_LOADING[2]])},{quoted:seloBot});}catch{}
          try{
            // Busca imagens do Pinterest
            const imagens=await buscarPinterest(query,10);
            if(!imagens.length){
              await reagir(sock,msg,"❌");
              if(loadMsg)try{await sock.sendMessage(jid,{text:`❌ Não encontrei imagens para *${query}*`,edit:loadMsg.key});}catch{}
              return;
            }
            if(loadMsg)try{await sock.sendMessage(jid,{text:bBloco("🎭 PINPACK",[bLine("✅",`${imagens.length} imagens — A criar stickers...`),FRAMES_LOADING[4]]),edit:loadMsg.key});}catch{}
            // Converte cada imagem em sticker
            let enviados=0;
            await sock.sendMessage(jid,{text:`${B_TOP}\n${bTitle("🎭 PACK: "+query.toUpperCase())}\n${bLine("📦",`A enviar *${imagens.length}* stickers...`)}\n${B_BOT}`},{quoted:seloBot});
            for(let i=0;i<imagens.length;i++){
              try{
                const{data}=await axios.get(imagens[i],{responseType:"arraybuffer",timeout:15000,httpsAgent});
                const buf=Buffer.from(data);
                let stkBuf;
                try{stkBuf=await criarSticker(buf,false);}
                catch{stkBuf=buf;} // fallback: envia imagem raw como sticker
                await sock.sendMessage(jid,{sticker:stkBuf},{quoted:seloBot});
                enviados++;
                await new Promise(r=>setTimeout(r,600));
              }catch(e){console.log("⚠️ sticker",i,e.message);}
            }
            await reagir(sock,msg,"✅");
            if(enviados>0)await sock.sendMessage(jid,{text:bLine("✅",`Pack *${query}* concluído! *${enviados}* stickers enviados.`)},{quoted:seloBot});
            else await sock.sendMessage(jid,{text:`❌ Não consegui criar os stickers.`},{quoted:seloBot});
          }catch(e){
            console.error("[PINPACK]",e.message);
            await reagir(sock,msg,"❌");
            await sock.sendMessage(jid,{text:`❌ Erro: ${e.message.slice(0,80)}`},{quoted:seloBot});
          }
          return;
        }



        // ═══════════════════════════════════════
        // ✅ CASES — Comandos dinâmicos (código)
        // ═══════════════════════════════════════

        // ─── !addcase [nome] ───
        // Salva um bloco de código como comando dinâmico
        // Uso: !addcase chorar\nasync(ctx)=>{ ... }
        if(comando==="addcase"){
          if(!isDono&&!isAdmin){await sock.sendMessage(jid,{text:"❌ Apenas *dono/admin* pode adicionar cases."},{quoted:seloBot});return;}
          const linhas=texto.slice(CONFIG.PREFIXO.length).trim().split("\n");
          const nomeCru=(linhas[0]||"").replace(/^addcase\s*/i,"").trim();
          const nomeCase=nomeCaseLimpo(nomeCru);
          const codigoLinhas=linhas.slice(1).join("\n").trim();

          if(!nomeCase){
            await sock.sendMessage(jid,{text:bBloco("📦 ADDCASE",[
              bLine("💡","*!addcase [nome]*"),
              bLine("📝","A seguir ao nome, escreve o código:"),
              B_SEP,
              "```",
              "!addcase saudacao",
              "async(ctx)=>{",
              "  const{sock,jid,seloBot}=ctx;",
              "  await sock.sendMessage(jid,{text:'Olá! 👋'},{quoted:seloBot});",
              "}",
              "```",
              B_SEP,
              bLine("🔧","Contexto disponível: sock, jid, msg, sender,"),
              bLine("🔧","seloBot, args, isDono, isAdmin, isGrupo,"),
              bLine("🔧","mencoes, nomeExibicao, CONFIG, chatIA,"),
              bLine("🔧","B_TOP,B_MID,B_BOT,bLine,bBloco,reagir,axios"),
            ])},{quoted:seloBot});
            return;
          }

          if(!codigoLinhas){
            await sock.sendMessage(jid,{text:`❌ Falta o código! Escreve após *!addcase ${nomeCase}* numa nova linha.`},{quoted:seloBot});
            return;
          }

          // Valida se é função JS válida
          try{
            new Function(`return (${codigoLinhas})`);
          }catch(syntaxErr){
            await sock.sendMessage(jid,{text:bBloco("❌ ERRO DE SINTAXE",[
              bLine("🔴",`*${syntaxErr.message}*`),
              bLine("💡","Verifica o código e tenta de novo."),
            ])},{quoted:seloBot});
            return;
          }

          const cases=carregarCases();
          const overwrite=!!cases[nomeCase];
          cases[nomeCase]={
            codigo:codigoLinhas,
            autor:nomeExibicao,
            criadoEm:Date.now(),
          };
          salvarCases(cases);

          await sock.sendMessage(jid,{text:bBloco(`${overwrite?"🔄 CASE ACTUALIZADA":"✅ CASE ADICIONADA"}`,[
            bLine("📦",`Nome: *!${nomeCase}*`),
            bLine("👤",`Autor: *${nomeExibicao}*`),
            bLine("💡","Usa directamente como *!"+nomeCase+"*"),
            bLine("📤","*!extraircase "+nomeCase+"* para ver o código"),
          ])},{quoted:seloBot});
          await reagir(sock,msg,"✅");
          return;
        }

        // ─── !extraircase [nome] ───
        // Retorna o código de uma case
        if(comando==="extraircase"){
          const nomeCase=nomeCaseLimpo(args.join(" "));
          if(!nomeCase){
            await sock.sendMessage(jid,{text:`❌ *!extraircase* [nome]`},{quoted:seloBot});
            return;
          }
          const cases=carregarCases();
          const entry=cases[nomeCase];
          if(!entry){
            await sock.sendMessage(jid,{text:`❌ Case *${nomeCase}* não existe. Usa *!cases* para ver a lista.`},{quoted:seloBot});
            return;
          }
          const codigo=entry.codigo||"";
          const info=bBloco(`📦 CASE: ${nomeCase.toUpperCase()}`,[
            bLine("👤",`Autor: *${entry.autor||"?"}*`),
            bLine("📅",`Criada: *${new Date(entry.criadoEm||0).toLocaleDateString("pt-AO")}*`),
            bLine("📋","Código abaixo 👇"),
          ]);
          await sock.sendMessage(jid,{text:info},{quoted:seloBot});
          // Envia o código em bloco separado (mais fácil de copiar)
          await sock.sendMessage(jid,{text:`\`\`\`\n!addcase ${nomeCase}\n${codigo}\n\`\`\``},{quoted:seloBot});
          await reagir(sock,msg,"📤");
          return;
        }

        // ─── !cases ───
        // Lista todas as cases dinâmicas
        if(comando==="cases"){
          const cases=carregarCases();
          const lista=Object.entries(cases);
          if(!lista.length){
            await sock.sendMessage(jid,{text:bBloco("📦 CASES",[
              bLine("📭","Nenhuma case adicionada ainda!"),
              bLine("💡","Usa *!addcase [nome]* para adicionar"),
            ])},{quoted:seloBot});
            return;
          }
          const linhas=lista.map(([n,e])=>bLine("📦",`*!${n}* — _por ${e.autor||"?"}_ (${new Date(e.criadoEm||0).toLocaleDateString("pt-AO")})`));
          linhas.push(B_SEP);
          linhas.push(bLine("📤","*!extraircase [nome]* para ver código"));
          linhas.push(bLine("🗑️","*!delcase [nome]* para remover"));
          await sock.sendMessage(jid,{text:bBloco(`📦 CASES DINÂMICAS (${lista.length})`,linhas)},{quoted:seloBot});
          return;
        }

        // ─── !delcase [nome] ───
        // Remove uma case
        if(comando==="delcase"){
          if(!isDono&&!isAdmin){await sock.sendMessage(jid,{text:"❌ Apenas *dono/admin* pode remover cases."},{quoted:seloBot});return;}
          const nomeCase=nomeCaseLimpo(args.join(" "));
          if(!nomeCase){await sock.sendMessage(jid,{text:`❌ *!delcase* [nome]`},{quoted:seloBot});return;}
          const cases=carregarCases();
          if(!cases[nomeCase]){await sock.sendMessage(jid,{text:`❌ Case *${nomeCase}* não existe.`},{quoted:seloBot});return;}
          delete cases[nomeCase];
          salvarCases(cases);
          await sock.sendMessage(jid,{text:bLine("✅",`Case *!${nomeCase}* removida!`)},{quoted:seloBot});
          await reagir(sock,msg,"🗑️");
          return;
        }

        // ─── ADM ───
        if(comando==="bloq"){comandosBloqueados.add(jid);await sock.sendMessage(jid,{text:bLine("🔒","*Comandos bloqueados!*")},{quoted:seloBot});return;}
        if(comando==="desbloq"){comandosBloqueados.delete(jid);await sock.sendMessage(jid,{text:bLine("🔓","*Comandos desbloqueados!*")},{quoted:seloBot});return;}
        if(comando==="bot"){const op=args.join(" ").toLowerCase();if(op.includes("off")){chatsDesativados.add(jid);await sock.sendMessage(jid,{text:bLine("🔴","*BOT OFF!*")},{quoted:seloBot});}else if(op.includes("on")){chatsDesativados.delete(jid);await sock.sendMessage(jid,{text:bLine("✅","*BOT ON!*")},{quoted:seloBot});}return;}
        if(comando==="anti-link"){const op=args[0]?.toLowerCase();if(op==="off"){antiLinkDesativado.add(jid);await sock.sendMessage(jid,{text:bLine("⚠️","*Anti-link DESACTIVADO!*")},{quoted:seloBot});}else{antiLinkDesativado.delete(jid);await sock.sendMessage(jid,{text:bLine("✅","*Anti-link ACTIVADO!*")},{quoted:seloBot});}return;}
        if(comando==="vozbot"){const op=args[0]?.toLowerCase();if(op==="off"){vozBotDesativado.add(jid);await sock.sendMessage(jid,{text:bLine("🔇","*Voz desactivada!*")},{quoted:seloBot});}else if(op==="on"){vozBotDesativado.delete(jid);await sock.sendMessage(jid,{text:bLine("🎙️","*Voz activada!*")},{quoted:seloBot});}else{await sock.sendMessage(jid,{text:bBloco("🎙️ VOZ BOT",[bLine("📊",`Estado: ${vozBotDesativado.has(jid)?"🔇 OFF":"🟢 ON"}`),bLine("💡",`*${CONFIG.PREFIXO}vozbot on/off*`)])},{quoted:seloBot});}return;}
        if(comando==="silenciar"&&isGrupo){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Menciona com *${CONFIG.PREFIXO}silenciar*`)},{quoted:seloBot});return;}if(!membrosSilenciados[jid])membrosSilenciados[jid]=[];if(!membrosSilenciados[jid].includes(alvo)){membrosSilenciados[jid].push(alvo);salvarSilenciados();}await sock.sendMessage(jid,{text:bLine("🔇",`@${alvo.split("@")[0]} silenciado!`),mentions:[alvo]},{quoted:seloBot});return;}
        if(comando==="dessilenciar"&&isGrupo){const alvo=extrairJid(mencoes[0]||msg.message?.extendedTextMessage?.contextInfo?.participant);if(!alvo||!alvo.includes("@")){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Menciona com *${CONFIG.PREFIXO}dessilenciar*`)},{quoted:seloBot});return;}if(membrosSilenciados[jid]){membrosSilenciados[jid]=membrosSilenciados[jid].filter(m=>m!==alvo);salvarSilenciados();}await sock.sendMessage(jid,{text:bLine("🔊",`@${alvo.split("@")[0]} dessilenciado!`),mentions:[alvo]},{quoted:seloBot});return;}
        if(comando==="silenciados"&&isGrupo){const lista=membrosSilenciados[jid]||[];if(!lista.length){await sock.sendMessage(jid,{text:bLine("🔊","Nenhum silenciado.")},{quoted:seloBot});return;}await sock.sendMessage(jid,{text:bBloco("🔇 SILENCIADOS",[lista.map((m,i)=>`◎ ${i+1}. @${m.split("@")[0]}`).join("\n")])},{quoted:seloBot});return;}
        if(comando==="nomegrupo"&&isGrupo){const novoNome=args.join(" ").trim();if(!novoNome){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}nomegrupo* [nome]`)},{quoted:seloBot});return;}try{await sock.groupUpdateSubject(jid,novoNome);await sock.sendMessage(jid,{text:bLine("✅",`Nome: *${novoNome}*`)},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="descgrupo"&&isGrupo){const novaDesc=args.join(" ").trim();if(!novaDesc){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}descgrupo* [desc]`)},{quoted:seloBot});return;}try{await sock.groupUpdateDescription(jid,novaDesc);await sock.sendMessage(jid,{text:bLine("✅","Descrição actualizada!")},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="fotogrupo"&&isGrupo){const imgBuf=await downloadImagemDaMensagem(msg);if(!imgBuf){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Responde imagem com *${CONFIG.PREFIXO}fotogrupo*`)},{quoted:seloBot});return;}try{await sock.updateProfilePicture(jid,imgBuf);await sock.sendMessage(jid,{text:bLine("✅","Foto actualizada!")},{quoted:seloBot});await reagir(sock,msg,"✅");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="add"&&isGrupo){if(!args[0]){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}add* [número]`)},{quoted:seloBot});return;}let numero=args[0].replace(/[^\d]/g,"");if(numero.startsWith("00"))numero=numero.slice(2);if(numero.length===9)numero=`244${numero}`;try{const result=await sock.groupParticipantsUpdate(jid,[`${numero}@s.whatsapp.net`],"add");const status=result?.[0]?.status;if(status===200){await sock.sendMessage(jid,{text:bLine("✅",`+${numero} adicionado!`)},{quoted:seloBot});}else if(status===408){await sock.sendMessage(jid,{text:bLine("❌","Sem WhatsApp.")},{quoted:seloBot});}else if(status===403){await sock.sendMessage(jid,{text:bLine("⚠️","Não permite adição.")},{quoted:seloBot});}else{await reagir(sock,msg,"✅");}}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="banir"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant);if(!alvo){await sock.sendMessage(jid,{text:bLine("💡","↩️ Responde a mensagem.")},{quoted:seloBot});return;}try{await sock.groupParticipantsUpdate(jid,[alvo],"remove");await sock.sendMessage(jid,{text:bBloco("🔨 BAN",[bLine("✅",`@${alvo.split("@")[0]} BANIDO! 🔨`)]),mentions:[alvo]},{quoted:seloBot});await reagir(sock,msg,"🔨");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="addadmin"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant);if(!alvo){await sock.sendMessage(jid,{text:bLine("💡","↩️ Responde a mensagem.")},{quoted:seloBot});return;}try{await sock.groupParticipantsUpdate(jid,[alvo],"promote");await sock.sendMessage(jid,{text:bLine("👑",`@${alvo.split("@")[0]} é admin!`),mentions:[alvo]},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="removeadmin"&&isGrupo){const alvo=extrairJid(msg.message.extendedTextMessage?.contextInfo?.participant);if(!alvo){await sock.sendMessage(jid,{text:bLine("💡","↩️ Responde a mensagem.")},{quoted:seloBot});return;}try{await sock.groupParticipantsUpdate(jid,[alvo],"demote");await sock.sendMessage(jid,{text:bLine("✅","Admin removido!")},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="fechar"&&isGrupo){try{await sock.groupSettingUpdate(jid,"announcement");await sock.sendMessage(jid,{text:bLine("🔒","*Grupo fechado!*")},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="abrir"&&isGrupo){try{await sock.groupSettingUpdate(jid,"not_announcement");await sock.sendMessage(jid,{text:bLine("🔓","*Grupo aberto!*")},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="all"&&isGrupo){try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p));await sock.sendMessage(jid,{text:bBloco("📢 ATENÇÃO!",[todos.map(p=>`@${p.split("@")[0]}`).join(" ")]),mentions:todos},{quoted:seloBot});}catch{}return;}
        if(comando==="att"&&isGrupo){try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p));await sock.sendMessage(jid,{text:`📣${todos.map(()=>"\u200B").join("")}`,mentions:todos},{quoted:seloBot});}catch{}return;}
        if(comando==="aviso"&&isGrupo){const avisoTxt=args.join(" ");if(!avisoTxt){await sock.sendMessage(jid,{text:bLine("💡",`*${CONFIG.PREFIXO}aviso* [mensagem]`)},{quoted:seloBot});return;}try{const meta=await sock.groupMetadata(jid),todos=meta.participants.map(p=>extrairJid(p.id||p));await sock.sendMessage(jid,{text:bBloco("📢 AVISO!",[avisoTxt,B_SEP,todos.map(p=>`@${p.split("@")[0]}`).join(" ")]),mentions:todos},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="link"&&isGrupo){try{const codigo=await sock.groupInviteCode(jid);await sock.sendMessage(jid,{text:bBloco("🔗 LINK DO GRUPO",[bLine("🔗",`https://chat.whatsapp.com/${codigo}`)])},{quoted:seloBot});}catch{await sock.sendMessage(jid,{text:bLine("❌","Erro.")},{quoted:seloBot});}return;}
        if(comando==="sorteio"&&isGrupo){try{const meta=await sock.groupMetadata(jid),membros=meta.participants.filter(p=>!p.admin).map(p=>extrairJid(p.id||p));if(!membros.length){await sock.sendMessage(jid,{text:bLine("❌","Sem membros.")},{quoted:seloBot});return;}const vencedor=membros[Math.floor(Math.random()*membros.length)];await sock.sendMessage(jid,{text:bBloco("🎉 SORTEIO!",[bLine("🏆",`@${vencedor.split("@")[0]}! 🎊`)]),mentions:[vencedor]},{quoted:seloBot});await reagir(sock,msg,"🎉");}catch{}return;}
        if(comando==="verifica"&&isGrupo){const buffer=bufferMsgs[jid]||[];try{const meta=await sock.groupMetadata(jid),admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p)),infrat={};for(const m of buffer){if(admins.includes(m.sender)||ehDono(m.sender))continue;if(LINK_RX.test(m.texto))infrat[m.sender]=true;}const lista=Object.keys(infrat);for(const inf of lista){try{await sock.groupParticipantsUpdate(jid,[inf],"remove");}catch{}}await sock.sendMessage(jid,{text:bBloco("🔨 VERIFICAÇÃO",[bLine("✅",`*${lista.length}* banido(s) por links!`)])},{quoted:seloBot});}catch{}return;}
        if(comando==="apagar"&&isGrupo){const ctx3=msg.message?.extendedTextMessage?.contextInfo;if(!ctx3?.stanzaId){await sock.sendMessage(jid,{text:bLine("💡",`↩️ Cita mensagem com *${CONFIG.PREFIXO}apagar*`)},{quoted:seloBot});return;}try{await sock.sendMessage(jid,{delete:{remoteJid:jid,id:ctx3.stanzaId,participant:ctx3.participant||""}});await reagir(sock,msg,"🗑️");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="scanlink"&&isGrupo){const historico=historyMsgs[jid]||[];if(!historico.length){await sock.sendMessage(jid,{text:bLine("📭","Sem histórico.")},{quoted:seloBot});return;}let loadMsg2=null;try{loadMsg2=await sock.sendMessage(jid,{text:bBloco("🔍 SCANLINK",[bLine("🔍",`A varrer ${historico.length} msgs...`),FRAMES_LOADING[0]])},{quoted:seloBot});}catch{}try{const meta=await sock.groupMetadata(jid);const admins=meta.participants.filter(p=>p.admin).map(p=>extrairJid(p.id||p));const membrosActuais=new Set(meta.participants.map(p=>extrairJid(p.id||p)));let deletados=0,banidos=0;const banidosSet=new Set();const linksEncontrados=[];for(const h of historico){if(!h.texto||!LINK_RX.test(h.texto))continue;if(admins.includes(h.sender)||ehDono(h.sender))continue;linksEncontrados.push(h);}if(loadMsg2){try{await sock.sendMessage(jid,{text:bBloco("🔍 SCANLINK",[FRAMES_LOADING[5]]),edit:loadMsg2.key});}catch{}}await new Promise(r=>setTimeout(r,300));if(!linksEncontrados.length){await sock.sendMessage(jid,{text:bBloco("✅ CHAT LIMPO!",[bLine("🎉","Nenhum link encontrado!")])},{quoted:seloBot});return;}for(const h of linksEncontrados){try{await sock.sendMessage(jid,{delete:h.key});deletados++;}catch{}await new Promise(r=>setTimeout(r,300));}for(const h of linksEncontrados){if(banidosSet.has(h.sender)||!membrosActuais.has(h.sender))continue;try{await sock.groupParticipantsUpdate(jid,[h.sender],"remove");await sock.sendMessage(jid,{text:bLine("🚨",`@${h.sender.split("@")[0]} — *BAN!*`),mentions:[h.sender]});banidosSet.add(h.sender);banidos++;}catch{}await new Promise(r=>setTimeout(r,500));}historyMsgs[jid]=[];await sock.sendMessage(jid,{text:bBloco("✅ SCAN CONCLUÍDO!",[bLine("🗑️",`Eliminadas: *${deletados}*`),bLine("🔨",`Banidos: *${banidos}*`)])},{quoted:seloBot});await reagir(sock,msg,"🔨");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",`Erro: ${e.message}`)},{quoted:seloBot});}return;}

        // ─── DONO ───
        if(comando==="chaton"){const ativos=[...gruposAtivados];if(!ativos.length){await sock.sendMessage(jid,{text:bLine("📭","Nenhum grupo activo.")},{quoted:seloBot});return;}try{const grupos=await sock.groupFetchAllParticipating();const linhas=ativos.map((gJid,i)=>{const nome=grupos[gJid]?.subject||gJid;const membros=grupos[gJid]?.participants?.length||"?";return bLine("🟢",`*${i+1}.* *${nome}* — 👥 ${membros}`);}).join("\n");await sock.sendMessage(jid,{text:bBloco(`🏘️ GRUPOS ACTIVOS (${ativos.length})`,[linhas])},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="sms"){const ativos=[...gruposAtivados];if(!ativos.length||!args.length){if(!ativos.length){await sock.sendMessage(jid,{text:bLine("❌","Nenhum grupo activo.")},{quoted:seloBot});return;}try{const grupos=await sock.groupFetchAllParticipating();const lista=ativos.map((gJid,i)=>bLine("📋",`*${i+1}.* ${grupos[gJid]?.subject||gJid}`)).join("\n");await sock.sendMessage(jid,{text:bBloco("📢 SMS PRIVADA",[lista,B_SEP,bLine("💡",`*${CONFIG.PREFIXO}sms [nº] [msg]*`)])},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}const idx=parseInt(args[0]);if(isNaN(idx)||idx<1||idx>ativos.length){await sock.sendMessage(jid,{text:bLine("❌","Número de grupo inválido.")},{quoted:seloBot});return;}const grupoJid=ativos[idx-1];const mensagem=args.slice(1).join(" ").trim();if(!mensagem){await sock.sendMessage(jid,{text:bLine("❌","Escreve a mensagem!")},{quoted:seloBot});return;}try{const grupos=await sock.groupFetchAllParticipating();const nomeGrupo=grupos[grupoJid]?.subject||"Grupo";const meta=await sock.groupMetadata(grupoJid);const membros=meta.participants.map(p=>extrairJid(p.id||p));await sock.sendMessage(jid,{text:bLine("📤",`A enviar para *${membros.length}* membros... ⏳`)},{quoted:seloBot});let enviados=0,erros=0;for(const membro of membros){if(ehDono(membro))continue;try{await sock.sendMessage(membro,{text:bBloco("📢 MENSAGEM PRIVADA",[mensagem,B_SEP,bLine("👑",CONFIG.DONO_NOME),bLine("🏘️",nomeGrupo)])});enviados++;await new Promise(r=>setTimeout(r,600));}catch{erros++;}}await sock.sendMessage(jid,{text:bBloco("✅ SMS ENVIADA!",[bLine("📊",`${enviados} enviados | ❌ ${erros} erros`)])},{quoted:seloBot});await reagir(sock,msg,"📢");}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="gsms"){const ativos=[...gruposAtivados];if(!ativos.length){await sock.sendMessage(jid,{text:bLine("❌","Nenhum grupo activo.")},{quoted:seloBot});return;}if(!args.length){try{const grupos=await sock.groupFetchAllParticipating();const lista=ativos.map((gJid,i)=>bLine("📋",`*${i+1}.* ${grupos[gJid]?.subject||gJid}`)).join("\n");await sock.sendMessage(jid,{text:bBloco("📣 AVISO NO GRUPO",[lista,B_SEP,bLine("💡",`*${CONFIG.PREFIXO}gsms [nº] [msg]*`)])},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}const idx=parseInt(args[0]);if(isNaN(idx)||idx<1||idx>ativos.length){await sock.sendMessage(jid,{text:bLine("❌","Número inválido.")},{quoted:seloBot});return;}const grupoJid=ativos[idx-1];const mensagem=args.slice(1).join(" ").trim();if(!mensagem){await sock.sendMessage(jid,{text:bLine("❌","Escreve a mensagem!")},{quoted:seloBot});return;}try{const meta=await sock.groupMetadata(grupoJid);const todos=meta.participants.map(p=>extrairJid(p.id||p));await sock.sendMessage(grupoJid,{text:bBloco("📣 AVISO!",[mensagem,B_SEP,`${todos.map(()=>"\u200B").join("")}`]),mentions:todos});await sock.sendMessage(jid,{text:bBloco("✅ AVISO ENVIADO!",[bLine("👥",`${todos.length} mencionados`)])},{quoted:seloBot});}catch(e){await sock.sendMessage(jid,{text:bLine("❌",e.message)},{quoted:seloBot});}return;}
        if(comando==="info"){await sock.sendMessage(jid,{text:bBloco("ℹ️ INFO",[bLine("💡",`Usa *${CONFIG.PREFIXO}menu*`),bLine("🤖","Ou chama _Isaías_ no grupo!")])},{quoted:seloBot});return;}

      }catch(e){console.error("❌ Erro handler:",e.message);try{await reagir(sock,msg,"❌");}catch{}}
    });

  }catch(e){
    console.error("❌ Erro crítico startBot:",e.message);
    tentativasReconexao++;
    setTimeout(()=>startBot(),Math.min(5000*tentativasReconexao,60000));
  }
}

startBot();

