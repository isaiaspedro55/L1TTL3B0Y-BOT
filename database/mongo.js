const mongoose = require('mongoose');

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

const ConfigSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  creds: { type: mongoose.Schema.Types.Mixed },
  keys: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
});

const UserRankSchema = new mongoose.Schema({
  jid: { type: String, unique: true, required: true },
  xp: { type: Number, default: 0 },
  nivel: { type: Number, default: 1 },
  msgs: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

const Config = mongoose.models.Config || mongoose.model('Config', ConfigSchema);
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
const UserRank = mongoose.models.UserRank || mongoose.model('UserRank', UserRankSchema);

async function getConfig(key, defaultValue = null) {
  try {
    if (!isConnected) return defaultValue;
    const doc = await Config.findOne({ key });
    return doc ? doc.value : defaultValue;
  } catch { return defaultValue; }
}

async function setConfig(key, value) {
  try {
    if (!isConnected) return false;
    await Config.findOneAndUpdate(
      { key },
      { value, updatedAt: new Date() },
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

module.exports = {
  connectMongo,
  getConfig,
  setConfig,
  saveSessionToMongo,
  loadSessionFromMongo,
  Config,
  Session,
  UserRank,
  isConnected: () => isConnected,
  mongoose
};
