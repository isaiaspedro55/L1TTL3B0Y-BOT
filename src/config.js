/**
 * L1TTL3B0Y BOT + DARK BOT Dashboard Adaptado
 * Configuração Central - Todas variáveis vêm do Render → Environment
 * Adaptado de dark-bot para L1TTL3B0Y - tá no beijo, tá Ladjum 🌀
 */
'use strict';

require('dotenv').config();

function env(key, fallback = '') {
  const v = process.env[key];
  if (v == null) return fallback;
  return String(v).trim().replace(/^['"]|['"]$/g, '');
}
function num(key, fallback) {
  const v = Number(env(key, String(fallback)));
  return Number.isFinite(v) ? v : fallback;
}
function digits(key, fallback = '') {
  return env(key, fallback).replace(/\D/g, '');
}

const port    = num('PORT', 10000);
const nodeEnv = env('NODE_ENV', 'development');

module.exports = {
  port,
  nodeEnv,
  isProd: nodeEnv === 'production',
  isProduction: nodeEnv === 'production',

  sessionSecret: env('SESSION_SECRET', env('JWT_SECRET', 'l1ttl3boy-dark-secret-2026-$1M-tá-no-beijo-tá-ladjum-🌀')),
  appUrl:        env('APP_URL', env('RENDER_EXTERNAL_URL', `http://localhost:${port}`)),

  // Canal WhatsApp (aparece no menu dark e no menu L1TTL3B0Y)
  channelUrl: env('WHATSAPP_CHANNEL_URL', env('CHANNEL_LINK', 'https://whatsapp.com/channel/0029VbC8voN4Y9lszc9VuT2D')),

  owner: {
    name:     env('OWNER_NAME', env('DONO_NOME', 'ISAÍAS PEDRO')),
    number:   digits('OWNER_NUMBER', env('OWNER_NUMBER', env('DONO_NUM', '926612801'))),
    username: env('OWNER_USERNAME', 'isaias').toLowerCase(),
    password: env('OWNER_PASSWORD', env('SENHA_BOT', 'lordinho2025')),
  },

  bot: {
    name:   env('BOT_NAME', 'L1TTL3B0Y ULTRA PRO V4.0'),
    number: digits('BOT_NUMBER', env('BOT_NUMBER', '244954260707')),
    prefix: env('BOT_PREFIX', env('PREFIX', '!')),
    prefixes: env('PREFIXES', '!,.,/,#,$,%,-,+'),
  },

  mongodb: { uri: env('MONGODB_URI', '') },

  cloudinary: {
    cloud_name: env('CLOUDINARY_CLOUD_NAME', ''),
    api_key:    env('CLOUDINARY_API_KEY', ''),
    api_secret: env('CLOUDINARY_API_SECRET', ''),
  },

  ai: {
    groqApiKey:       env('GROQ_API_KEY', env('GROQ_KEY', '')),
    geminiApiKey:     env('GEMINI_API_KEY', ''),
    openrouterApiKey: env('OPENROUTER_API_KEY', ''),
    openaiApiKey:     env('OPENAI_API_KEY', ''),
    model:            env('AI_MODEL', ''),
    groqKey:       env('GROQ_API_KEY', env('GROQ_KEY', '')),
    geminiKey:     env('GEMINI_API_KEY', ''),
    openaiKey:     env('OPENAI_API_KEY', ''),
    openrouterKey: env('OPENROUTER_API_KEY', ''),
  },

  tenorApiKey: env('TENOR_API_KEY', ''),

  // L1TTL3B0Y extras
  dono: {
    jid: env('DONO_JID', '169853876965546@lid'),
    nome: env('DONO_NOME', 'ISAÍAS PEDRO'),
    num: env('DONO_NUM', '926 612 801'),
  },

  // Limites
  maxYoutubeSeconds: num('MAX_YOUTUBE_SECONDS', 5400),
  stickerVideoMaxSec: num('STICKER_VIDEO_MAX_SEC', 8),
};
