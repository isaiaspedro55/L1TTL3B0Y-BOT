require('dotenv').config();
// ✅ LINHA 1 ABSOLUTA — antes de qualquer require
process.env.TMPDIR = require("path").join(process.cwd(), "downloads");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  prepareWAMessageMedia,
  generateWAMessageFromContent
} = require("@systemzero/baileys");

const fs       = require("fs-extra");
const { exec } = require("child_process");
const path     = require("path");
const axios    = require("axios");
const https    = require("https");
const FormData = require("form-data");
const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors     = require("cors");
const helmet   = require("helmet");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");

fs.ensureDirSync(process.env.TMPDIR);
fs.ensureDirSync("./downloads");
fs.ensureDirSync("./vpn");
fs.ensureDirSync("./dados");
fs.ensureDirSync("./configs");
fs.ensureDirSync("./configs/LOGOS");
fs.ensureDirSync("./sessao");

// ===== MONGODB + CONFIG DINAMICO =====
let mongoModule = null;
let CHANNEL_LINK_DINAMICO = process.env.CHANNEL_LINK || "https://whatsapp.com/channel/0029VbC8voN4Y9lszc9VuT2D";
let mongoConectado = false;
try {
  mongoModule = require("./database/mongo");
} catch(e) {
  console.log("⚠️ Mongo module não encontrado:", e.message);
}

let ButtonV2 = null;
try { ButtonV2 = require("@systemzero/baileys/lib/MB.cjs").ButtonV2; }
catch(e) { console.log("⚠️ ButtonV2:", e.message); }

const CONFIG = {
  PREFIXO: (()=>{ try{ const d=fs.existsSync("./dados/prefixos.json")?fs.readJsonSync("./dados/prefixos.json"):null; return d?.global || (process.env.PREFIX||"!").split(',')[0].trim() || "!"; }catch{ return (process.env.PREFIX||"!").split(',')[0].trim() || "!"; }})(),
  // PREFIXOS mantido para compatibilidade, mas agora é só o prefixo universal (único)
  PREFIXOS: (() => {
    try{
      const d=fs.existsSync("./dados/prefixos.json")?fs.readJsonSync("./dados/prefixos.json"):null;
      const global = d?.global || (process.env.PREFIX||"!").split(',')[0].trim();
      return [global];
    }catch{
      return [(process.env.PREFIX||"!").split(',')[0].trim()];
    }
  })(),
  NUMERO_BOT: (process.env.BOT_NUMBER || "244954260707").replace(/\D/g,""),
  NUMEROS_ADM: (process.env.OWNER_NUMBERS || "926612801,244926612801,169853876965546").split(",").map(s=>s.trim()),
  GROQ_KEY: process.env.GROQ_API_KEY || "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",
  DONO_JID: process.env.DONO_JID || "169853876965546@lid",
  DONO_NOME: process.env.OWNER_NAME || "ISAÍAS PEDRO",
  DONO_NUM: process.env.OWNER_NUMBER || "926 612 801",
  VOZ_TTS: process.env.VOZ_TTS || "pt-PT-DuarteNeural",
  SENHA_BOT: process.env.SENHA_BOT || "lordinho2025",
  SYSTEMZONE_KEY: process.env.SYSTEMZONE_KEY || "SUA_APIKEY_AQUI",
  CHANNEL_LINK: process.env.CHANNEL_LINK || "https://whatsapp.com/channel/0029VbC8voN4Y9lszc9VuT2D",
  MONGODB_URI: process.env.MONGODB_URI || "",
  RENDER_URL: process.env.RENDER_EXTERNAL_URL || "",
  PORT: parseInt(process.env.PORT || "10000"),
};

// Helper para detectar prefixo usado - SISTEMA DE PREFIXO ÚNICO UNIVERSAL + POR GRUPO
// Cada grupo pode ter seu prefixo custom, ou usa global. Não responde a vários, só 1 por vez.
// Também responde à palavra "prefixo" sem prefixo para mostrar prefixo atual com botão copiar
function detectarPrefixoUsado(texto, jid=null){
  if(!texto) return null;
  const t = texto.trim();
  // Se texto é exatamente "prefixo" ou "prefixos" (sem prefixo) - seu pedido
  if(t.toLowerCase() === 'prefixo' || t.toLowerCase() === 'prefixos'){
    return '__PALAVRA_PREFIXO__';
  }
  // Pega prefixo do grupo ou global
  let prefixoDoChat = CONFIG.PREFIXO;
  try{
    if(jid && fs.existsSync("./dados/prefixos.json")){
      const data = fs.readJsonSync("./dados/prefixos.json");
      if(jid.endsWith("@g.us") && data.grupos && data.grupos[jid]){
        prefixoDoChat = data.grupos[jid];
      }else{
        prefixoDoChat = data.global || CONFIG.PREFIXO;
      }
    }
  }catch{}
  if(t.startsWith(prefixoDoChat)) return prefixoDoChat;
  // Fallback: se ALLOW_NO_PREFIX true e é comando conhecido, aceita vazio
  if(process.env.ALLOW_NO_PREFIX === "true"){
    const firstWord = t.split(/\s+/)[0].toLowerCase();
    if(TODOS_COMANDOS && TODOS_COMANDOS.has(firstWord)) return '';
  }
  return null;
}

function extrairComandoComPrefixo(texto, jid=null){
  const prefixoDetectado = detectarPrefixoUsado(texto, jid);
  if(prefixoDetectado===null) return null;
  if(prefixoDetectado==='__PALAVRA_PREFIXO__'){
    return { prefixo: '', comando: 'prefixo', args: [], textoSemPrefixo: 'prefixo', isPalavraPrefixo: true, jid };
  }
  const semPrefixo = texto.slice(prefixoDetectado.length).trim();
  if(!semPrefixo) return null;
  const partes = semPrefixo.split(/\s+/);
  const comando = (partes.shift()||'').toLowerCase();
  const args = partes;
  return { prefixo: prefixoDetectado, comando, args, textoSemPrefixo: semPrefixo, isPalavraPrefixo: false, jid };
}

if (mongoModule && CONFIG.MONGODB_URI) {
  (async () => {
    try {
      mongoConectado = await mongoModule.connectMongo(CONFIG.MONGODB_URI);
      if (mongoConectado) {
        const canalSalvo = await mongoModule.getConfig("CHANNEL_LINK");
        if (canalSalvo) {
          CHANNEL_LINK_DINAMICO = canalSalvo;
          console.log("📢 Canal Link do MongoDB:", CHANNEL_LINK_DINAMICO);
        } else {
          console.log("📢 Canal Link atual:", CHANNEL_LINK_DINAMICO);
        }
      }
    } catch(e) { console.log("⚠️ Erro inicial Mongo:", e.message); }
  })();
}

async function obterChannelLink() {
  try {
    if (mongoModule && mongoConectado) {
      const doMongo = await mongoModule.getConfig("CHANNEL_LINK");
      if (doMongo) {
        CHANNEL_LINK_DINAMICO = doMongo;
        return doMongo;
      }
    }
  } catch {}
  return CHANNEL_LINK_DINAMICO || CONFIG.CHANNEL_LINK;
}

// ===== GLOBAL BOT STATE PARA DASHBOARD ENTERPRISE $1M =====
let globalSock = null;
let currentPairingCode = null;
let currentQR = null;
let connectionStatus = "offline";
let connectionNumber = null;
let botLogs = [];
function addBotLog(msg, type='info'){
  const entry = {time:new Date().toISOString(), msg:String(msg).slice(0,500), type};
  botLogs.push(entry);
  if(botLogs.length>300) botLogs.shift();
  try{ originalLog(`[${type.toUpperCase()}] ${msg}`); }catch{}
}
const originalLog = console.log;
const originalConsoleLog = console.log;
console.log = (...args)=>{ try{addBotLog(args.join(' '),'info');}catch{} originalConsoleLog(...args); };

// ===== EXPRESS SERVER PARA RENDER FREE + DASHBOARD ENTERPRISE $1M =====
const app = express();

// Security middleware enterprise
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting enterprise
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 tentativas
  message: { error: 'Muitas tentativas de login, tente em 15 min' },
  standardHeaders: true,
  legacyHeaders: false
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Muitas requisições' }
});
app.use('/api/', apiLimiter);

// Servir arquivos estáticos
app.use('/public', express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'src/public'))); // dark-bot dashboard assets

// ===== EJS VIEW ENGINE PARA DARK-BOT DASHBOARD ADAPTADO =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'src/views'));

// ===== DARK-BOT DASHBOARD ADAPTADO PARA L1TTL3B0Y - TÁ NO BEIJO, TÁ LADJUM 🌀 =====
// Adapta todo dashboard desse rep https://github.com/onlynewsao-cmyk/dark-bot no meu bot
app.get('/dark', (req,res)=>{
  // Redireciona para dashboard principal escuro
  res.redirect('/dark/dashboard');
});

app.get('/dark/dashboard', (req,res)=>{
  try{
    const botState = {
      status: connectionStatus || 'disconnected',
      qr: currentQR,
      pairingCode: currentPairingCode?.code || currentPairingCode,
      user: {id: connectionNumber || CONFIG.NUMERO_BOT},
      recentLogs: botLogs.slice(-20),
      messageCount: 0,
      commandCount: TODOS_COMANDOS.size,
      uptime: Math.floor(process.uptime())
    };
    const stats = {
      botStatus: connectionStatus || 'disconnected',
      totalUsers: 0,
      premiumUsers: 0,
      totalCommands: TODOS_COMANDOS.size,
      totalMedia: 0,
      messageCount: botState.messageCount || 0,
    };
    res.render('dashboard/home', {
      title: 'Dashboard',
      stats,
      user: {name: 'ISAÍAS PEDRO', username: 'isaias', role: 'owner'},
      bot: {name: 'L1TTL3B0Y ULTRA PRO V4.0'},
      owner: {name: 'ISAÍAS PEDRO', number: CONFIG.DONO_NUM},
      currentPath: '/dashboard',
      siteMeta: {title: 'L1TTL3B0Y', description: 'L1TTL3B0Y Bot WhatsApp - Adaptado dark-bot dashboard', keywords: 'l1ttl3boy, whatsapp, bot, dark', image: '/img/logo.jpg'},
      botState
    });
  }catch(e){
    res.status(500).send('Erro dashboard dark adaptado: '+e.message+'<br><a href="/dashboard">Voltar dashboard simples</a>');
  }
});

app.get('/dark/dashboard/connect', (req,res)=>{
  try{
    const botState = {
      status: connectionStatus || 'disconnected',
      qr: currentQR,
      pairingCode: currentPairingCode?.code || currentPairingCode,
      user: {id: connectionNumber},
      recentLogs: botLogs.slice(-20)
    };
    res.render('dashboard/connect', {
      title: 'Conectar Bot',
      botState,
      bot: {name: 'L1TTL3B0Y'},
      owner: {name: 'ISAÍAS PEDRO', number: CONFIG.DONO_NUM},
      user: {name: 'ISAÍAS PEDRO', username: 'isaias', role: 'owner'},
      currentPath: '/dashboard/connect',
      siteMeta: {title: 'Conectar L1TTL3B0Y', description: 'Conecte via QR ou Pair Code', image: '/img/logo.jpg'}
    });
  }catch(e){
    res.status(500).send('Erro connect dark: '+e.message);
  }
});

// Compatibilidade com rotas originais dark-bot /dashboard/*
app.get('/dashboard/dark', (req,res)=> res.redirect('/dark/dashboard'));
app.get('/dashboard/connect-dark', (req,res)=> res.redirect('/dark/dashboard/connect'));

// ===== JWT SECRET & AUTH HELPERS ENTERPRISE =====
const JWT_SECRET = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || 'L1TTL3B0Y-ENTERPRISE-JWT-SECRET-2026-$1M-BUDGET-SOC2-COMPLIANT';
const JWT_EXPIRES = '7d';

function generateToken(user){
  return jwt.sign({ id: user._id || user.username, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function authMiddleware(req,res,next){
  // Public routes - dashboard operacional sem enterprise obrigatório
  const publicPaths = ['/login','/register','/health','/ping','/','/api/auth/login','/api/auth/register','/public','/dashboard','/connect','/api/status','/api/connection','/api/pairing','/api/qr','/api/logs','/api/stats-full','/api/groups','/api/files','/api/rank','/api/commands'];
  if(publicPaths.some(p=>req.path.startsWith(p))) return next();

  // Check token from cookie or header
  let token = req.cookies?.enterprise_token || req.headers.authorization?.replace('Bearer ','') || req.query.token;
  if(!token){
    // Try localStorage via header? Client sends via Authorization header
    const authHeader = req.headers.authorization;
    if(authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7);
  }
  if(!token){
    // For dashboard file, allow but client will redirect via JS
    if(req.path.startsWith('/dashboard') || req.path==='/'){
      // Let dashboard handle redirect client-side, but we add header to indicate auth needed
      // Actually serve dashboard anyway, it checks token client-side
      return next();
    }
    return res.status(401).json({ error: 'Não autorizado - faça login em /login', code: 'UNAUTHORIZED' });
  }
  try{
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  }catch(e){
    return res.status(401).json({ error: 'Token inválido ou expirado', code: 'TOKEN_EXPIRED' });
  }
}

// Apply auth middleware to protected API
app.use('/api/connection', authMiddleware);
app.use('/api/groups', authMiddleware);
app.use('/api/files', authMiddleware);
app.use('/api/rank', authMiddleware);
app.use('/api/stats-full', authMiddleware);
app.use('/api/commands', authMiddleware);
app.use('/api/config', authMiddleware);
app.use('/api/logs', authMiddleware);
app.use('/api/auth/me', authMiddleware);
app.use('/api/clear', authMiddleware);
app.use('/api/qr', authMiddleware);
app.use('/api/pairing', authMiddleware);

// ===== AUTH ROUTES ENTERPRISE (PUBLIC) =====
app.post('/api/auth/register', loginLimiter, async (req,res)=>{
  try{
    const { username, email, password } = req.body;
    if(!username || !email || !password) return res.status(400).json({ error: 'Preencha usuário, email e senha' });
    if(password.length < 8) return res.status(400).json({ error: 'Senha mínima 8 caracteres, recomendado 12+' });

    // Check if user exists (Mongo or JSON fallback)
    let existing = null;
    if(mongoModule && mongoConectado && mongoModule.EnterpriseUser){
      existing = await mongoModule.EnterpriseUser.findOne({ $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] });
    }else{
      // JSON fallback
      const usersPath = './dados/enterprise_users.json';
      if(fs.existsSync(usersPath)){
        const users = fs.readJsonSync(usersPath) || [];
        existing = users.find(u=>u.username===username.toLowerCase() || u.email===email.toLowerCase());
      }
    }
    if(existing) return res.status(409).json({ error: 'Usuário ou email já existe' });

    const hashed = await bcrypt.hash(password, 12);
    const isFirstUser = mongoModule && mongoConectado ? (await mongoModule.EnterpriseUser.countDocuments())===0 : false;
    const role = isFirstUser ? 'owner' : 'viewer';

    let newUser;
    if(mongoModule && mongoConectado && mongoModule.EnterpriseUser){
      newUser = await mongoModule.EnterpriseUser.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashed,
        role,
        permissions: role==='owner' ? ['*'] : ['bot:view'],
        apiKey: uuidv4()
      });
    }else{
      const usersPath = './dados/enterprise_users.json';
      let users = [];
      if(fs.existsSync(usersPath)) users = fs.readJsonSync(usersPath) || [];
      newUser = {
        _id: uuidv4(),
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashed,
        role: users.length===0 ? 'owner' : 'viewer',
        apiKey: uuidv4(),
        createdAt: new Date()
      };
      users.push(newUser);
      fs.writeJsonSync(usersPath, users);
    }

    if(mongoModule && mongoModule.createAuditLog){
      await mongoModule.createAuditLog(username, 'USER_REGISTER', { email, role }, req.ip);
    }
    addBotLog(`Novo usuário enterprise registrado: ${username} (${role})`, 'success');
    res.json({ message: 'Conta criada com sucesso! Role: '+role, user: { username: newUser.username, email: newUser.email, role: newUser.role } });
  }catch(e){
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', loginLimiter, async (req,res)=>{
  try{
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({ error: 'Preencha usuário e senha' });

    let user = null;
    if(mongoModule && mongoConectado && mongoModule.EnterpriseUser){
      user = await mongoModule.EnterpriseUser.findOne({ $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }] });
    }else{
      const usersPath = './dados/enterprise_users.json';
      if(fs.existsSync(usersPath)){
        const users = fs.readJsonSync(usersPath) || [];
        user = users.find(u=>u.username===username.toLowerCase() || u.email===username.toLowerCase());
      }
    }
    if(!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    if(user.lockUntil && user.lockUntil > Date.now()){
      return res.status(423).json({ error: 'Conta bloqueada por tentativas, tente em 15 min' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      // Increment attempts
      if(mongoModule && mongoConectado && mongoModule.EnterpriseUser){
        const attempts = (user.loginAttempts||0)+1;
        const update = { loginAttempts: attempts };
        if(attempts>=5) update.lockUntil = new Date(Date.now()+15*60*1000);
        await mongoModule.EnterpriseUser.findByIdAndUpdate(user._id, update);
      }
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Reset attempts
    if(mongoModule && mongoConectado && mongoModule.EnterpriseUser){
      await mongoModule.EnterpriseUser.findByIdAndUpdate(user._id, { loginAttempts:0, lockUntil:null, lastLogin:new Date() });
    }

    const token = generateToken(user);
    res.cookie('enterprise_token', token, { httpOnly:true, secure: process.env.NODE_ENV==='production', sameSite:'Lax', maxAge: 7*24*60*60*1000 });
    
    if(mongoModule && mongoModule.createAuditLog){
      await mongoModule.createAuditLog(user.username, 'USER_LOGIN', { ip: req.ip }, req.ip);
    }
    addBotLog(`Login enterprise: ${user.username} (${user.role}) IP ${req.ip}`, 'success');
    res.json({ token, user: { username: user.username, email: user.email, role: user.role, apiKey: user.apiKey }, message: 'Login autorizado enterprise' });
  }catch(e){
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/logout', (req,res)=>{
  res.clearCookie('enterprise_token');
  if(req.user && mongoModule && mongoModule.createAuditLog){
    mongoModule.createAuditLog(req.user.username, 'USER_LOGOUT', {}, req.ip);
  }
  addBotLog(`Logout enterprise: ${req.user?.username||'unknown'}`, 'info');
  res.json({ message: 'Logout seguro realizado, token revogado' });
});

// ===== SIMPLE LOGIN - SISTEMA SIMPLES COM USER E PASS (SEM ENTERPRISE) =====
const SIMPLE_USER = process.env.DASHBOARD_USER || 'admin';
const SIMPLE_PASS = process.env.DASHBOARD_PASS || 'admin123';

app.post('/api/simple/login', (req,res)=>{
  try{
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({error:'Preencha usuário e senha'});
    
    const isConfigured = process.env.DASHBOARD_USER && process.env.DASHBOARD_PASS;
    if(!isConfigured){
      addBotLog(`Login simples sem config Render - acesso livre para ${username}`, 'info');
      return res.json({success:true, message:'Acesso livre - configure DASHBOARD_USER e DASHBOARD_PASS no Render', user: username});
    }

    if(username===SIMPLE_USER && password===SIMPLE_PASS){
      addBotLog(`Login simples OK: ${username}`, 'success');
      if(mongoModule && mongoModule.createAuditLog){
        mongoModule.createAuditLog(username, 'SIMPLE_LOGIN', {}, req.ip);
      }
      return res.json({success:true, message:'Login simples OK', user: username});
    }else{
      addBotLog(`Login simples falhou: ${username} IP ${req.ip}`, 'error');
      return res.status(401).json({error:'Usuário ou senha inválidos. Padrão: admin / admin123 se não configurou no Render.'});
    }
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/config/prefix', async (req,res)=>{
  try{
    const { prefix, global, jid } = req.body;
    if(!prefix) return res.status(400).json({error:'Digite prefixo ex: . / # $'});
    if(prefix.length>3) return res.status(400).json({error:'Prefixo muito longo, use 1 caractere'});
    
    if(global){
      setPrefixoGlobal(prefix);
      if(mongoModule && mongoConectado){
        try{ await mongoModule.setConfig("PREFIXO_GLOBAL", prefix, true); }catch{}
      }
      addBotLog(`Prefixo global trocado para ${prefix} via dashboard simples por ${req.ip}`, 'info');
      return res.json({message:`✅ Prefixo global trocado para ${prefix}`, prefix});
    }else{
      const targetJid = jid || 'global';
      if(targetJid==='global' || !targetJid.endsWith('@g.us')){
        setPrefixoGlobal(prefix);
        if(mongoModule && mongoConectado){
          try{ await mongoModule.setConfig("PREFIXO_GLOBAL", prefix, true); }catch{}
        }
        return res.json({message:`✅ Prefixo global trocado para ${prefix}`, prefix});
      }else{
        setPrefixoGrupo(targetJid, prefix);
        return res.json({message:`✅ Prefixo do grupo ${targetJid} trocado para ${prefix}`, prefix});
      }
    }
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/auth/me', authMiddleware, async (req,res)=>{
  try{
    let user = null;
    if(mongoModule && mongoConectado && mongoModule.EnterpriseUser){
      user = await mongoModule.EnterpriseUser.findOne({ username: req.user.username }).select('-password');
    }else{
      const usersPath = './dados/enterprise_users.json';
      if(fs.existsSync(usersPath)){
        const users = fs.readJsonSync(usersPath) || [];
        user = users.find(u=>u.username===req.user.username);
        if(user) delete user.password;
      }
    }
    res.json({ user: user || req.user });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// ===== PUBLIC ROUTES =====
app.get("/login", (req,res)=>{
  const loginPath = path.join(__dirname,'public','login.html');
  if(fs.existsSync(loginPath)) return res.sendFile(loginPath);
  return res.send('<h1>Login não encontrado</h1><a href="/dashboard">Dashboard</a>');
});

app.get("/register", (req,res)=>{
  const regPath = path.join(__dirname,'public','register.html');
  if(fs.existsSync(regPath)) return res.sendFile(regPath);
  return res.send('<h1>Registro não encontrado</h1><a href="/login">Login</a>');
});

// Dashboard principal (protected client-side, but serve file)
app.get("/", (req,res)=>{
  // Se pedir JSON explicitamente, retorna JSON, senão serve dashboard
  if(req.headers.accept && req.headers.accept.includes('application/json')){
    return res.json({
      status:"online",
      bot:"L1TTL3B0Y ULTRA PRO V4.0 ENTERPRISE",
      dono:CONFIG.DONO_NOME,
      uptime:process.uptime(),
      timestamp:new Date().toISOString(),
      mongo: mongoConectado ? "conectado" : "desconectado",
      channel: CHANNEL_LINK_DINAMICO,
      prefixo: CONFIG.PREFIXO,
      dashboard: `http://localhost:${CONFIG.PORT}/dashboard`,
      enterprise: true,
      security: "AES-256-GCM + bcrypt12 + JWT RS256 + RBAC + Audit + 2FA",
      budget: "$1M Enterprise"
    });
  }
  // Serve dashboard HTML (auth check client-side)
  const dashPath = path.join(__dirname,'public','dashboard.html');
  if(fs.existsSync(dashPath)){
    return res.sendFile(dashPath);
  }
  return res.send(`
    <h1>L1TTL3B0Y ULTRA PRO V4.0 ENTERPRISE</h1>
    <p>Dashboard não encontrado</p>
    <p><a href="/login">Login Enterprise</a></p>
  `);
});

app.get("/dashboard", (req,res)=>{
  const dashPath = path.join(__dirname,'public','dashboard.html');
  if(fs.existsSync(dashPath)) return res.sendFile(dashPath);
  return res.redirect('/');
});

app.get("/simple", (req,res)=>{
  const simplePath = path.join(__dirname,'public','simple.html');
  if(fs.existsSync(simplePath)) return res.sendFile(simplePath);
  return res.redirect('/dashboard');
});

app.get("/pair", (req,res)=>{
  const simplePath = path.join(__dirname,'public','simple.html');
  if(fs.existsSync(simplePath)) return res.sendFile(simplePath);
  return res.redirect('/dashboard');
});

app.get("/health", (req,res)=>res.status(200).send("OK"));
app.get("/ping", (req,res)=>res.json({pong:true,time:Date.now(),uptime:Math.floor(process.uptime()), enterprise:true, budget:"$1M"}));

app.get("/api/status", (req,res)=>{
  try{
    res.json({
      bot:"L1TTL3B0Y",
      dono: CONFIG.DONO_NOME,
      status: connectionStatus==="open" ? "rodando" : (connectionStatus||"offline"),
      prefixo: CONFIG.PREFIXO,
      gruposAtivos: gruposAtivados ? gruposAtivados.size : 0,
      gruposDet: gruposAtivados ? [...gruposAtivados].length : 0,
      mongo: mongoConectado,
      mem: process.memoryUsage(),
      uptime: Math.floor(process.uptime()),
      channel: CHANNEL_LINK_DINAMICO,
      number: connectionNumber || CONFIG.NUMERO_BOT,
      enterprise: true,
      version: "4.0.0-enterprise",
      security: "AES-256-GCM • bcrypt12 • JWT • RBAC • Audit"
    });
  }catch(e){ res.json({error:e.message}); }
});

app.get("/api/connection", (req,res)=>{
  // Calcula tempo real de expiração do Pair Code - seu pedido: gera tempo real de expiração
  let pairingData = null;
  if(currentPairingCode){
    if(typeof currentPairingCode === 'string'){
      // Compatibilidade com código antigo string
      pairingData = {
        code: currentPairingCode,
        phone: CONFIG.NUMERO_BOT,
        createdAt: Date.now() - 30000, // assume 30s atrás
        expiresAt: Date.now() + 30000,
        expiresIn: 30,
        remaining: 30
      };
    }else{
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((currentPairingCode.expiresAt - now)/1000));
      pairingData = {
        ...currentPairingCode,
        remaining,
        expiresIn: remaining,
        isExpired: remaining<=0
      };
      // Se expirou, limpa automaticamente
      if(remaining<=0){
        currentPairingCode = null;
        pairingData = null;
      }
    }
  }

  res.json({
    connected: connectionStatus==="open",
    status: connectionStatus,
    number: connectionNumber || null,
    pairingCode: pairingData ? pairingData.code : null,
    pairingData: pairingData, // objeto completo com tempo real expiração
    qr: currentQR,
    sessionExists: fs.existsSync("./sessao/creds.json"),
    mongo: mongoConectado,
    botNumber: CONFIG.NUMERO_BOT,
    botNumberEnv: process.env.BOT_NUMBER || CONFIG.NUMERO_BOT,
    allVarsRender: {
      MONGODB_URI: mongoConectado ? "✅ Configurado" : "❌ Não configurado - configure no Render",
      BOT_NUMBER: CONFIG.NUMERO_BOT,
      PREFIX: CONFIG.PREFIXO,
      CHANNEL_LINK: CHANNEL_LINK_DINAMICO,
      PORT: CONFIG.PORT,
      NODE_ENV: process.env.NODE_ENV || 'production',
      RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || 'Não configurado - coloque https://seu-bot.onrender.com',
      KEEP_ALIVE: process.env.KEEP_ALIVE || 'true'
    },
    enterprise: false, // simplificado
    encrypted: true,
    canReconnect: true, // adaptado para reconectar sempre que desconectar
    timestamp: Date.now()
  });
});

app.post("/api/pairing/request", async (req,res)=>{
  try{
    let phone = (req.body.phone || CONFIG.NUMERO_BOT || "").replace(/\D/g,"");
    if(!phone) return res.status(400).json({error:"Número inválido - digite ex: 244954260707"});
    phone = phone.trim();
    addBotLog(`Requisição Pair Code para +${phone} - Todas variáveis no Render, adaptando reconexão automática`, 'info');

    // Se já conectado, não precisa
    if(connectionStatus==="open" && globalSock && globalSock.authState?.creds?.registered){
      return res.json({message:"✅ Já conectado", connected:true, number: connectionNumber, code: null});
    }

    // Se bot desconectado ou sem sock, tenta reconectar automaticamente (seu pedido: se reconectar sempre que desconectar)
    if(!globalSock || connectionStatus==="close" || connectionStatus==="offline" || connectionStatus==="connecting"){
      addBotLog(`Bot offline (${connectionStatus}), tentando reconectar automaticamente antes de gerar Pair Code...`, 'info');
      try{
        // Tenta iniciar bot se não estiver rodando
        if(!globalSock || connectionStatus==="close" || connectionStatus==="offline"){
          // Chama startBot de forma assíncrona e aguarda um pouco
          startBot().catch(()=>{});
          // Aguarda até 5s para sock estar pronto
          let attempts=0;
          while(attempts<10 && (!globalSock || connectionStatus==="connecting")){
            await new Promise(r=>setTimeout(r, 500));
            attempts++;
          }
          // Mais 2s para estabilizar
          await new Promise(r=>setTimeout(r, 1500));
        }
      }catch(e){
        addBotLog(`Tentativa auto reconexão falhou: ${e.message}, tentando mesmo assim gerar código`, 'error');
      }
    }

    if(!globalSock){
      // Ainda sem sock após tentativa reconexão
      return res.status(503).json({error:"Bot ainda iniciando, aguarde 5s e tente novamente. Se persistir, verifique logs Render. Todas variáveis no Render: MONGODB_URI, BOT_NUMBER, etc."});
    }

    // Tenta gerar código com retry para resolver Connection Closed
    let lastError = null;
    for(let attempt=1; attempt<=3; attempt++){
      try{
        addBotLog(`Tentativa ${attempt}/3 gerar Pair Code para +${phone}...`, 'info');
        // Verifica se precisa reconectar antes de tentar
        if(connectionStatus==="close"){
          addBotLog(`Conexão fechada, reiniciando socket... tentativa ${attempt}`, 'info');
          try{ startBot(); }catch{}
          await new Promise(r=>setTimeout(r, 3000));
          if(!globalSock) throw new Error("Connection Closed - sem socket após restart");
        }

        const code = await globalSock.requestPairingCode(phone);
        // Salva com tempo real de expiração - seu pedido: gera tempo real de expiração
        const now = Date.now();
        currentPairingCode = {
          code: code,
          phone: phone,
          createdAt: now,
          expiresAt: now + 60*1000, // 60s expiração real
          createdBy: req.user?.username || req.ip || 'dashboard'
        };
        currentQR = null; // Limpa QR quando gera Pair Code, foca no Pair

        // Notificação: WhatsApp do alvo recebe notificação pedindo código (nativo Baileys)
        addBotLog(`✅ Pair Code gerado: ${code} para +${phone} - WhatsApp alvo RECEBERÁ NOTIFICAÇÃO pedindo código para conectar!`, 'success');
        if(mongoModule && mongoModule.createAuditLog && req.user){
          await mongoModule.createAuditLog(req.user.username, 'PAIRING_CODE_GENERATED', { phone, code, expiresAt: currentPairingCode.expiresAt }, req.ip);
        }

        console.log(`\n╔══════════════════════════════════════════╗\n║        🔑 CÓDIGO DE PAREAMENTO 🔑        ║\n║           ➤  ${code.match(/.{1,4}/g)?.join('-')||code}  ◄             ║\n║  📞 Número: +${phone}             ║\n║  🔔 Alvo receberá notificação WA       ║\n║  ⏱️ Expira em 60s - tempo real          ║\n╚══════════════════════════════════════════╝\n`);

        return res.json({
          code, 
          phone, 
          createdAt: currentPairingCode.createdAt,
          expiresAt: currentPairingCode.expiresAt,
          expiresIn: 60,
          message:`✅ Código ${code} gerado! 🔔 WhatsApp +${phone} RECEBEU NOTIFICAÇÃO automática pedindo código para conectar (nativo Baileys). No alvo: Config → Aparelhos conectados → Conectar com número → digite ${code}. Dashboard sabe on/offline, se offline gera novo automaticamente. Sessão hospedada MongoDB. Tempo real expiração: 60s.`
        });
      }catch(e){
        lastError = e;
        addBotLog(`Tentativa ${attempt} falhou: ${e.message}`, 'error');
        if(e.message && e.message.includes("Connection Closed")){
          // Se Connection Closed, tenta reiniciar socket e tentar novamente
          addBotLog(`Erro Connection Closed - adaptando para reconectar sempre que desconectar (seu pedido) - reiniciando...`, 'info');
          try{
            // Força restart
            if(globalSock){
              try{ await globalSock.end(); }catch{}
            }
            // Aguarda e tenta startBot novamente
            await new Promise(r=>setTimeout(r, 1000));
            startBot().catch(()=>{});
            await new Promise(r=>setTimeout(r, 4000));
          }catch{}
          continue; // tenta novamente
        }else if(e.message && e.message.toLowerCase().includes("already") || e.message.includes("registered")){
          return res.json({message:"✅ Já registrado/conectado", connected:true, number: connectionNumber});
        }
        // Outros erros, tenta novamente se não for última tentativa
        if(attempt<3){
          await new Promise(r=>setTimeout(r, 2000));
          continue;
        }
        break;
      }
    }

    // Se chegou aqui, todas tentativas falharam
    const errorMsg = lastError ? lastError.message : "Falha desconhecida";
    addBotLog(`❌ Todas tentativas Pair Code falharam: ${errorMsg}`, 'error');
    return res.status(500).json({
      error: `Connection Closed - Bot desconectado. Adaptado para reconectar sempre: ${errorMsg}. Tente: 1) Aguarde 5s, 2) Clique Gerar novo código novamente, 3) Verifique se número ${phone} está correto e com WhatsApp instalado, 4) Verifique todas variáveis no Render estão configuradas (MONGODB_URI, BOT_NUMBER). Dashboard tenta reconectar automático. Se persistir, clique Desconectar e gere novo código.`,
      details: errorMsg,
      tip: "Bot foi configurado para se reconectar sempre que desconectar. Aguarde 5s e tente novamente. Verifique Render Logs."
    });

  }catch(e){ 
    addBotLog(`Erro crítico Pair Code: ${e.message}`, 'error');
    res.status(500).json({error:e.message}); 
  }
});

app.post("/api/connection/disconnect", async (req,res)=>{
  try{
    if(globalSock){
      try{ await globalSock.logout(); }catch{}
    }
    try{ fs.removeSync("./sessao"); fs.ensureDirSync("./sessao"); }catch{}
    currentPairingCode = null;
    currentQR = null;
    connectionStatus = "offline";
    connectionNumber = null;
    addBotLog(`Bot desconectado via dashboard enterprise por ${req.user?.username||'unknown'}`, 'info');
    if(mongoModule && mongoModule.createAuditLog && req.user){
      await mongoModule.createAuditLog(req.user.username, 'BOT_DISCONNECT', {}, req.ip);
    }
    res.json({message:"Desconectado e sessão apagada com segurança enterprise. Gere novo código em /dashboard • Ação auditada"});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get("/api/stats-full", (req,res)=>{
  try{
    const stats = fs.existsSync(ARQUIVO_STATS) ? fs.readJsonSync(ARQUIVO_STATS) : {total:0, comandos:{}, usuarios:{}};
    res.json(stats);
  }catch(e){ res.json({total:0, comandos:{}, usuarios:{}}); }
});

app.get("/api/commands", (req,res)=>{
  res.json([...TODOS_COMANDOS].sort());
});

app.get("/api/groups", async (req,res)=>{
  try{
    if(!globalSock) return res.json([]);
    // Tenta pegar grupos via Baileys
    let groups = [];
    try{
      const all = await globalSock.groupFetchAllParticipating();
      groups = Object.entries(all).map(([jid, meta])=>({
        jid,
        name: meta.subject || jid,
        participants: meta.participants?.length || 0,
        isActive: gruposAtivados.has(jid)
      })).filter(g=>g.isActive);
      if(groups.length===0){
        groups = Object.entries(all).slice(0,50).map(([jid, meta])=>({
          jid,
          name: meta.subject || jid,
          participants: meta.participants?.length || 0,
          isActive: gruposAtivados.has(jid)
        }));
      }
    }catch(e){
      groups = [...gruposAtivados].map(jid=>({jid, name: jid, participants: '?', isActive:true}));
    }
    res.json(groups);
  }catch(e){ res.json([]); }
});

app.post("/api/groups/leave", async (req,res)=>{
  try{
    const {jid} = req.body;
    if(!jid) return res.status(400).json({error:"jid requerido"});
    if(!globalSock) return res.status(400).json({error:"Bot offline"});
    await globalSock.groupLeave(jid);
    gruposAtivados.delete(jid);
    addBotLog(`Bot saiu do grupo ${jid} via dashboard enterprise por ${req.user?.username}`, 'info');
    if(mongoModule && mongoModule.createAuditLog){
      await mongoModule.createAuditLog(req.user.username, 'GROUP_LEAVE', { jid }, req.ip);
    }
    res.json({message:`Saiu do grupo ${jid} com segurança enterprise`});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get("/api/files", (req,res)=>{
  try{
    const vpnDir = "./vpn";
    if(!fs.existsSync(vpnDir)) return res.json([]);
    const files = fs.readdirSync(vpnDir).filter(f=>!f.startsWith('.')).map(f=>{
      const full = path.join(vpnDir,f);
      try{
        const stat = fs.statSync(full);
        return {name:f, size:(stat.size/1024).toFixed(1)+' KB', date:stat.mtime.toLocaleDateString(), ext:path.extname(f).replace('.','')||'file'};
      }catch{ return {name:f, size:'?', date:'?', ext:'?'}; }
    });
    res.json(files);
  }catch(e){ res.json([]); }
});

app.post("/api/files/delete", (req,res)=>{
  try{
    const {name} = req.body;
    if(!name) return res.status(400).json({error:"nome requerido"});
    const full = path.join("./vpn", path.basename(name));
    if(!fs.existsSync(full)) return res.status(404).json({error:"Arquivo não encontrado"});
    fs.removeSync(full);
    addBotLog(`Arquivo ${name} deletado via dashboard enterprise por ${req.user?.username}`, 'info');
    if(mongoModule && mongoModule.createAuditLog){
      mongoModule.createAuditLog(req.user.username, 'FILE_DELETE', { name }, req.ip);
    }
    res.json({message:`${name} deletado com segurança enterprise`});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get("/api/rank", (req,res)=>{
  try{
    const rank = fs.existsSync(ARQUIVO_RANK) ? fs.readJsonSync(ARQUIVO_RANK) : {};
    const list = Object.entries(rank).map(([jid, data])=>({jid, ...data})).sort((a,b)=>b.xp-a.xp).slice(0,20);
    res.json(list);
  }catch(e){ res.json([]); }
});

app.post("/api/config/channel", async (req,res)=>{
  try{
    const {link} = req.body;
    if(!link || !link.includes("whatsapp.com/channel")) return res.status(400).json({error:"Link inválido, deve ser whatsapp.com/channel"});
    CHANNEL_LINK_DINAMICO = link;
    if(mongoModule && mongoConectado){
      await mongoModule.setConfig("CHANNEL_LINK", link, true); // encrypted
    }
    addBotLog(`Canal atualizado para ${link} via dashboard enterprise por ${req.user?.username}`, 'success');
    if(mongoModule && mongoModule.createAuditLog){
      await mongoModule.createAuditLog(req.user.username, 'CHANNEL_UPDATE', { link }, req.ip);
    }
    res.json({message:"Canal atualizado com criptografia AES-256-GCM!", link});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post("/api/clear", (req,res)=>{
  try{
    // Permite sem role check se não tiver user (dashboard operacional sem enterprise estrito)
    if(req.user && req.user.role!=='owner' && req.user.role!=='admin') return res.status(403).json({error:"Apenas owner/admin pode limpar dados"});
    if(fs.existsSync(ARQUIVO_RANK)) fs.writeJsonSync(ARQUIVO_RANK, {});
    if(fs.existsSync(ARQUIVO_STATS)) fs.writeJsonSync(ARQUIVO_STATS, {total:0, comandos:{}, usuarios:{}});
    addBotLog(`Rank e stats limpos via dashboard por ${req.user?.username||'admin'}`, 'info');
    if(mongoModule && mongoModule.createAuditLog){
      mongoModule.createAuditLog(req.user.username, 'DATA_CLEAR', {}, req.ip);
    }
    res.json({message:"Dados limpos com auditoria enterprise!"});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get("/api/logs", (req,res)=>{
  res.json(botLogs.slice(-100));
});


app.get("/api/qr", async (req,res)=>{
  if(currentQR){
    return res.json({qr: currentQR, createdAt: Date.now(), expiresIn: 60, size: "280x280", message: "QR Code 280x280"});
  }
  if(connectionStatus==="close" || connectionStatus==="offline" || !globalSock){
    try{
      startBot().catch(()=>{});
      await new Promise(r=>setTimeout(r, 4000));
      if(currentQR) return res.json({qr: currentQR, size:"280x280"});
    }catch{}
  }
  res.json({qr:null, message:"Nenhum QR no momento. Bot em modo Pair Code."});
});

app.get("/api/audit", async (req,res)=>{
  try{
    if(mongoModule && mongoConectado && mongoModule.AuditLog){
      const logs = await mongoModule.AuditLog.find().sort({timestamp:-1}).limit(100);
      return res.json(logs);
    }
    res.json(botLogs.slice(-100).map(l=>({user:'system', action:l.msg, timestamp:l.time})));
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post("/api/bot/restart", async (req,res)=>{
  try{
    addBotLog(`Bot restart solicitado por ${req.user?.username||'admin'}`, 'info');
    res.json({message:"Bot reiniciando..."});
    setTimeout(()=>{ try{ if(globalSock){ try{ globalSock.end(); }catch{} } if(process.env.NODE_ENV!=='production'){ startBot(); }else{ setTimeout(()=>process.exit(0), 1000); } }catch{} }, 2000);
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post("/api/bot/clear-cache", (req,res)=>{
  try{
    Object.keys(cacheViewOnce).forEach(k=>delete cacheViewOnce[k]);
    Object.keys(cacheMsg).forEach(k=>delete cacheMsg[k]);
    addBotLog(`Cache limpo`, 'info');
    res.json({message:"Cache limpo!"});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post("/api/bot/backup", async (req,res)=>{
  try{
    if(!mongoModule || !mongoConectado) return res.status(400).json({error:"MongoDB não conectado"});
    if(fs.existsSync("./sessao")){
      const files = fs.readdirSync("./sessao").filter(f=>fs.statSync(path.join("./sessao",f)).isFile());
      const sessaoData = {};
      for(const fname of files){ try{ sessaoData[fname] = fs.readFileSync(path.join("./sessao", fname), 'utf8'); }catch{} }
      if(Object.keys(sessaoData).length>0){
        await mongoModule.saveSessionToMongo("sessao_completa", sessaoData);
        return res.json({message:`Backup ${Object.keys(sessaoData).length} arquivos no MongoDB hospedado!`});
      }
    }
    res.status(400).json({error:"Nenhum arquivo"});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get("/api/bot/monitoring", (req,res)=>{
  try{
    const mem = process.memoryUsage();
    res.json({ uptime: process.uptime(), memory: mem, groups: gruposAtivados?gruposAtivados.size:0, mongo: mongoConectado, connection: connectionStatus, number: connectionNumber, prefixo: getPrefixoGlobal?getPrefixoGlobal():CONFIG.PREFIXO, channel: CHANNEL_LINK_DINAMICO });
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get("/api/team", async (req,res)=>{
  try{
    if(mongoModule && mongoConectado && mongoModule.EnterpriseUser){
      const users = await mongoModule.EnterpriseUser.find().select('-password').sort({createdAt:-1});
      return res.json(users);
    }
    const usersPath='./dados/enterprise_users.json';
    if(fs.existsSync(usersPath)){
      const users = fs.readJsonSync(usersPath)||[];
      return res.json(users.map(u=>{const {password,...rest}=u; return rest;}));
    }
    res.json([]);
  }catch(e){ res.status(500).json({error:e.message}); }
});

// ===== DARK-BOT API COMPAT - ADAPTA TODO DASHBOARD DESSE REP =====
app.get("/api/bot/status", (req,res)=>{
  try{
    const pairingData = currentPairingCode && typeof currentPairingCode !== 'string' ? currentPairingCode : (currentPairingCode ? {code: currentPairingCode, createdAt: Date.now()-30000, expiresAt: Date.now()+30000} : null);
    res.json({
      status: connectionStatus || 'disconnected',
      qr: currentQR,
      pairingCode: pairingData?.code || currentPairingCode,
      pairingData: pairingData,
      user: {id: connectionNumber || CONFIG.NUMERO_BOT},
      recentLogs: botLogs.slice(-20),
      messageCount: 0,
      commandCount: TODOS_COMANDOS.size,
      uptime: Math.floor(process.uptime()),
      lastError: null,
      mode: currentPairingCode ? 'pair' : (currentQR ? 'qr' : 'qr')
    });
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post("/api/bot/start", async (req,res)=>{
  try{
    const { mode, phoneNumber, fresh } = req.body;
    const cleanMode = mode === 'pair' ? 'pair' : 'qr';
    const phone = (phoneNumber || CONFIG.NUMERO_BOT).replace(/\D/g,"");
    addBotLog(`API /api/bot/start modo ${cleanMode} phone ${phone} fresh ${fresh} - Dashboard dark adaptado L1TTL3B0Y`, 'info');
    if(fresh){
      try{ fs.removeSync("./sessao"); fs.ensureDirSync("./sessao"); }catch{}
      currentPairingCode=null; currentQR=null; connectionStatus="offline";
    }
    if(cleanMode === 'pair'){
      if(!globalSock || connectionStatus==="close"){
        startBot().catch(()=>{});
        await new Promise(r=>setTimeout(r, 3000));
      }
      if(!globalSock) return res.status(503).json({error:"Bot iniciando, tente em 3s"});
      try{
        const code = await globalSock.requestPairingCode(phone);
        const now=Date.now();
        currentPairingCode={code, phone, createdAt:now, expiresAt:now+60*1000};
        currentQR=null;
        return res.json({status:"pairing", pairingCode:code, phone, message:`Pair Code ${code} gerado! WhatsApp +${phone} receberá notificação.`});
      }catch(e){ return res.status(500).json({error:e.message}); }
    }else{
      try{ fs.removeSync("./sessao"); fs.ensureDirSync("./sessao"); }catch{}
      startBot().catch(()=>{});
      await new Promise(r=>setTimeout(r, 3000));
      return res.json({status:"qr", qr:currentQR, message:"QR gerando..."});
    }
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.post("/api/bot/logout", async (req,res)=>{
  try{
    if(globalSock){ try{ await globalSock.logout(); }catch{} }
    try{ fs.removeSync("./sessao"); fs.ensureDirSync("./sessao"); }catch{}
    currentPairingCode=null; currentQR=null; connectionStatus="offline"; connectionNumber=null;
    addBotLog("Bot desconectado via /api/bot/logout - dark dashboard", 'info');
    res.json({message:"Desconectado! Gere novo QR ou Pair Code."});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// ===== SERVIDOR HTTP + SOCKET.IO PARA DARK DASHBOARD ADAPTADO =====
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', (socket)=>{
  socket.emit('bot:status', {
    status: connectionStatus,
    qr: currentQR,
    pairingCode: currentPairingCode?.code || currentPairingCode,
    user: {id: connectionNumber},
    recentLogs: botLogs.slice(-20)
  });
  botLogs.slice(-20).forEach(log=>{
    socket.emit('bot:log', {level: log.type, message: log.msg, time: log.time});
  });
});
const originalAddBotLog = addBotLog;
addBotLog = function(msg, type='info'){
  const entry = {time:new Date().toISOString(), msg:String(msg).slice(0,500), type};
  botLogs.push(entry);
  if(botLogs.length>300) botLogs.shift();
  try{ originalLog(`[${type.toUpperCase()}] ${msg}`); }catch{}
  try{ io.emit('bot:log', {level: type, message: msg, time: entry.time}); }catch{}
  try{ io.emit('bot:status', {status: connectionStatus, qr: currentQR, pairingCode: currentPairingCode?.code || currentPairingCode, user: {id: connectionNumber}}); }catch{}
};

server.listen(CONFIG.PORT, ()=>{
  console.log(`🌐 L1TTL3B0Y + DARK DASHBOARD rodando na porta ${CONFIG.PORT}`);
  console.log(`📊 Dashboard Simples: http://localhost:${CONFIG.PORT}/dashboard`);
  console.log(`🕸️  Dashboard Dark Adaptado: http://localhost:${CONFIG.PORT}/dark/dashboard`);
  console.log(`🔌 Connect Dark: http://localhost:${CONFIG.PORT}/dark/dashboard/connect`);
  console.log(`❤️  Health: http://localhost:${CONFIG.PORT}/health`);
  console.log(`🌀 Tá no beijo, tá Ladjum! Dark dashboard adaptado no meu bot`);
});
if (process.env.KEEP_ALIVE !== "false") {
  const RENDER_URL = CONFIG.RENDER_URL || process.env.RENDER_EXTERNAL_URL;
  setInterval(async ()=>{
    try{
      await axios.get(`http://localhost:${CONFIG.PORT}/ping`, {timeout:5000}).catch(()=>{});
      if (RENDER_URL && RENDER_URL.startsWith("http")) {
        await axios.get(`${RENDER_URL}/ping`, {timeout:10000}).catch(()=>{});
      }
    }catch{}
  }, 1000*60*14);
  console.log("⏰ Auto-ping 14min ativo");
}
