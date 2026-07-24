const mongoose = require('mongoose');
const crypto = require('crypto');

let isConnected = false;

async function connectMongo(uri) {
  if (!uri) {
    console.log('⚠️ MONGODB_URI não definido, usando modo arquivo JSON');
    return false;
  }
  if (isConnected) return true;
  try {
    console.log('🍃 Conectando ao MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB conectado com sucesso!');
    return true;
  } catch (e) {
    console.log('❌ Falha MongoDB:', e.message);
    console.log('⚠️ Continuando em modo JSON...');
    return false;
  }
}

// ===== ENCRYPTION HELPERS (AES-256-GCM) =====
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.createHash('sha256').update('L1TTL3B0Y-ENTERPRISE-SECRET-2026').digest();
function encrypt(text){
  try{
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }catch{ return text; }
}
function decrypt(enc){
  try{
    if(!enc || !enc.includes(':')) return enc;
    const [ivHex, authTagHex, encrypted] = enc.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex,'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex,'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }catch{ return enc; }
}

// ===== CONFIG =====
const ConfigSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now },
  encrypted: { type: Boolean, default: false }
});

// ===== SESSION WHATSAPP =====
const SessionSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  creds: { type: mongoose.Schema.Types.Mixed },
  keys: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
});

// ===== RANK =====
const UserRankSchema = new mongoose.Schema({
  jid: { type: String, unique: true, required: true },
  xp: { type: Number, default: 0 },
  nivel: { type: Number, default: 1 },
  msgs: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

// ===== ENTERPRISE USERS (DASHBOARD AUTH) =====
const EnterpriseUserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, lowercase:true, trim:true },
  email: { type: String, unique: true, required: true, lowercase:true, trim:true },
  password: { type: String, required: true }, // bcrypt hash
  role: { type: String, enum:['owner','admin','moderator','viewer'], default:'viewer' },
  twoFAEnabled: { type: Boolean, default:false },
  twoFASecret: { type: String, default:'' },
  avatar: { type: String, default:'' },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default:0 },
  lockUntil: { type: Date },
  isActive: { type: Boolean, default:true },
  permissions: { type: [String], default:[] }, // ex: ['bot:control','groups:manage']
  apiKey: { type: String, default:'' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ===== AUDIT LOGS =====
const AuditLogSchema = new mongoose.Schema({
  user: { type: String, required:true },
  action: { type: String, required:true },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// ===== BOT BACKUP =====
const BackupSchema = new mongoose.Schema({
  id: { type: String, unique:true, required:true },
  type: { type: String, enum:['auto','manual'], default:'auto' },
  data: { type: mongoose.Schema.Types.Mixed },
  size: { type: Number },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Config = mongoose.models.Config || mongoose.model('Config', ConfigSchema);
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const UserRank = mongoose.models.UserRank || mongoose.model('UserRank', UserRankSchema);
const EnterpriseUser = mongoose.models.EnterpriseUser || mongoose.model('EnterpriseUser', EnterpriseUserSchema);
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
const Backup = mongoose.models.Backup || mongoose.model('Backup', BackupSchema);

async function getConfig(key, defaultValue = null) {
  try {
    if (!isConnected) return defaultValue;
    const doc = await Config.findOne({ key });
    if(!doc) return defaultValue;
    if(doc.encrypted){
      try{
        return JSON.parse(decrypt(doc.value));
      }catch{
        return decrypt(doc.value);
      }
    }
    return doc.value;
  } catch { return defaultValue; }
}

async function setConfig(key, value, encryptFlag=false) {
  try {
    if (!isConnected) return false;
    let toStore = value;
    if(encryptFlag){
      toStore = encrypt(typeof value === 'string' ? value : JSON.stringify(value));
    }
    await Config.findOneAndUpdate(
      { key },
      { value: toStore, encrypted: encryptFlag, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    return true;
  } catch (e) {
    console.log('❌ setConfig erro:', e.message);
    return false;
  }
}

async function saveSessionToMongo(id, creds) {
  try {
    if (!isConnected) return;
    await Session.findOneAndUpdate(
      { id },
      { creds, updatedAt: new Date() },
      { upsert: true }
    );
  } catch (e) { console.log('⚠️ saveSession:', e.message); }
}

async function loadSessionFromMongo(id) {
  try {
    if (!isConnected) return null;
    const doc = await Session.findOne({ id });
    return doc ? doc.creds : null;
  } catch { return null; }
}

async function createAuditLog(user, action, details, ip){
  try{
    if(!isConnected) return;
    await AuditLog.create({user, action, details, ip});
  }catch{}
}

module.exports = {
  connectMongo,
  getConfig,
  setConfig,
  saveSessionToMongo,
  loadSessionFromMongo,
  createAuditLog,
  encrypt,
  decrypt,
  Config,
  Session,
  UserRank,
  EnterpriseUser,
  AuditLog,
  Backup,
  isConnected: () => isConnected,
  mongoose
};
