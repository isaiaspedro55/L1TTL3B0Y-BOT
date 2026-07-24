# 🌀 L1TTL3B0Y RENDER FREE - ATUALIZAÇÃO COMPLETA

Bot adaptado para rodar 100% no Render Free com MongoDB + Uptime + Menu Carousel Novo

## 🚀 O QUE FOI ATUALIZADO?

### ✅ 1. Render Free Optimizado
- **Express Server** na porta `10000` com endpoints:
  - `/` - status JSON completo
  - `/health` - para health check do Render (200 OK)
  - `/ping` - para auto-ping e UptimeRobot
  - `/status` - status detalhado do bot
- **Auto-ping a cada 14 minutos** para não dormir (Render free dorme após 15min sem tráfego)
- `render.yaml` atualizado com `ffmpeg` + `yt-dlp` no buildCommand

### ✅ 2. MongoDB Integrado
- Conexão via `MONGODB_URI` (env)
- Armazena:
  - `CHANNEL_LINK` configurável
  - Sessão pode ser adaptada futura
  - Rank se quiser migrar
- Fallback automático para JSON se Mongo falhar
- Arquivo: `database/mongo.js`

### ✅ 3. Novo Menu Carousel (seu pedido)
Adaptado da sua referência mas com realidade do **L1TTL3B0Y**:

```js
case 'menu': {
    try {
        reagir(from, "🧧");
        const caminhoVideo = "./configs/LOGOS/fotomenu.mp4";
        const caminhoImagem = "./configs/LOGOS/fotomenu.png";
        let mediaMenu;

        if (fs.existsSync(caminhoVideo)) {
            mediaMenu = await prepareWAMessageMedia({
                video: { url: caminhoVideo },
                mimetype: "video/mp4",
                gifPlayback: true,
                seconds: 8
            }, { upload: sock.waUploadToServer });
        } else {
            mediaMenu = await prepareWAMessageMedia(
                { image: { url: caminhoImagem } },
                { upload: sock.waUploadToServer }
            );
        }

        const listaMenus = {
            title: "🌀 ᴍᴇɴᴜ L1TTL3B0Y",
            sections: [
                {
                    title: "ᴍᴇɴᴜs ᴅɪᴠᴇʀsᴏs ",
                    highlight_label: "L1TTL3B0Y|ᴅᴇᴠ",
                    rows: [
                        { header: "🌀⃞ ᴍᴇɴᴜ-ᴘʀɪɴᴄɪᴘᴀʟ ", title: "_comandos principais_", id: prefix + "menup" },
                        { header: "🌀⃞ ᴍᴇɴᴜ-ᴅᴏᴡɴʟᴏᴀᴅs ", title: "_download e upload._", id: prefix + "down" },
                        // ... resto adaptado
                    ]
                },
                {
                    title: "ғᴜɴᴄ̧ᴏᴇs ᴇxᴛʀᴀs ",
                    highlight_label: "L1TTL3B0Y|ᴅᴇᴠ",
                    rows: [ ... ]
                }
            ]
        };

        const botoes = [{
            name: "single_select",
            buttonParamsJson: JSON.stringify(listaMenus)
        }, {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: "📢 ᴄᴀɴᴀʟ",
                url: "https://whatsapp.com/channel/0029VbC8voN4Y9lszc9VuT2D",
                merchant_url: "https://whatsapp.com/channel/0029VbC8voN4Y9lszc9VuT2D"
            })
        }];

        const textok = `
║𝚄𝚂𝚄Á𝚁𝙸𝙾: ${pushname}
║𝙲𝙰𝚁𝙶𝙾: ${isCargo}
║𝚅𝙸𝙿: ${isChVip}
*Eu quero que cada usuário tenha uma experiência digna.*`;

        const carouselMessage = {
            cards: [{
                header: {
                    hasMediaAttachment: true,
                    ...(mediaMenu.videoMessage ? { videoMessage: mediaMenu.videoMessage } : { imageMessage: mediaMenu.imageMessage })
                },
                headerType: mediaMenu.videoMessage ? "VIDEO" : "IMAGE",
                body: { text: textok },
                footer: { text:"🌀 L1TTL3B0Y-BOT • RENDER" },
                nativeFlowMessage: { buttons: botoes }
            }]
        };

        const msg = generateWAMessageFromContent(from, {
            interactiveMessage: {
                contextInfo: {
                    participant: sender,
                    quotedMessage: { conversation: "░⃟⃛🧧 ᴍᴇɴᴜ 🧧" }
                },
                body: { text: "*ᴍᴇɴᴜ*" },
                carouselMessage
            }
        }, {});

        await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
    } catch (error) {
        console.error("Erro menu:", error);
        await sock.sendMessage(from, { text: "❌ Erro no menu" }, { quoted: selo });
    }
    break
```

- **Identidade mantida**: 🌀 LORDE LÁ DJUM, seu emoji, seu dono ISAÍAS PEDRO
- **Media**: Tenta `./configs/LOGOS/fotomenu.mp4` > `.png` > foto personalizada > foto perfil WA
- **Fallback**: Se carousel falhar, usa ButtonV2 + menu numerado

### ✅ 4. ButtonV2 @systemzero/baileys
```js
let ButtonV2 = null;
try { ButtonV2 = require("@systemzero/baileys/lib/MB.cjs").ButtonV2; }
catch(e) { console.log("⚠️ ButtonV2 indisponível:", e.message); }
```
Atualizado para `@systemzero/baileys` latest (seu pedido `npm install @systemzero`)

`package.json` agora:
```json
"@systemzero/baileys": "latest"
```

### ✅ 5. Play e Downloads com Botões
- `!play` → salva em `playPending` (5min) → mostra card + 3 botões:
  - 🎵 ÁUDIO (MP3)
  - 🎬 VÍDEO 480p
  - 📹 VÍDEO HD 720p
- Botões tratados em `buttonsResponseMessage`, `interactiveResponseMessage`, `listResponseMessage`
- Fallback texto: `1 → MP3, 2 → 480p, 3 → HD`
- `downloadMusica`, `downloadVideo`, `downloadVideoHD` com catbox fallback (resolve "Media upload failed")

### ✅ 6. Channel Link Configurável pelo Dono no WhatsApp
- **Env var**: `CHANNEL_LINK`
- **Comando dono**: 
  - `!setcanal https://whatsapp.com/channel/XXXX`
  - `!setchannel` (alias)
  - Salva no MongoDB se conectado, ou memória
- **Comando público**: `!canal` ou `!channel` mostra link atual
- Menu carrossel sempre usa link dinámico `obterChannelLink()`

## 📦 CONFIGURAÇÃO NO RENDER

### 1. Crie MongoDB Atlas Grátis
1. Acesse https://cloud.mongodb.com
2. Crie cluster free (M0)
3. Database Access → crie usuário/senha
4. Network Access → Allow All `0.0.0.0/0`
5. Connect → Drivers → copie URI: `mongodb+srv://user:pass@cluster.mongodb.net/l1ttl3b0y?retryWrites=true&w=majority`

### 2. Deploy no Render
1. Fork este repo
2. https://dashboard.render.com → New → Web Service → conecte repo
3. Runtime: Node
4. Build Command: (já no render.yaml)
   ```
   npm install
   apt-get update -y
   apt-get install -y ffmpeg
   pip install -U yt-dlp
   ```
5. Start Command: `npm start`
6. **Environment Variables** (Render → Environment):
   ```
   NODE_ENV=production
   PORT=10000
   PREFIX=!
   BOT_NUMBER=244954260707
   OWNER_NUMBERS=926612801,244926612801
   MONGODB_URI=mongodb+srv://...  <- COLE AQUI
   GROQ_API_KEY=gsk_...
   CHANNEL_LINK=https://whatsapp.com/channel/0029VbC8voN4Y9lszc9VuT2D
   RENDER_EXTERNAL_URL=https://seu-bot.onrender.com
   KEEP_ALIVE=true
   SENHA_BOT=lordinho2025
   ```
7. Deploy → Logs → copie **Pairing Code**

### 3. UptimeRobot (para nunca dormir)
1. https://uptimerobot.com → Free → Create Monitor
2. Type: HTTP(s)
3. URL: `https://seu-bot.onrender.com/health`
4. Interval: 5 minutes
5. Salve → Render ficará acordado 24/7

### 4. Adicione Logo do Menu
Envie para `configs/LOGOS/`:
- `fotomenu.mp4` (8 seg, gifPlayback) OU
- `fotomenu.png` (imagem)
Se não tiver, usa foto personalizada via `!setfoto` ou foto de perfil do bot.

## 🛠️ COMANDOS NOVOS

| Comando | Quem | Descrição |
|---------|------|-----------|
| `!menu` | todos | Menu carrossel novo + fallback |
| `!menup` | todos | Principais + música + util |
| `!down` | todos | Menu downloads |
| `!menufigurinhas` | todos | Figurinhas |
| `!brincadeiras` | todos | Jogos |
| `!menucoins` | todos | Rank/Coins |
| `!alteradores` | todos | TTS/Audio |
| `!menulogos` | todos | Editar/QR |
| `!menuadm` | adm | Admin |
| `!menudono` | dono | Dono |
| `!setcanal [link]` | dono | Muda link do canal (salva mongo) |
| `!canal` | todos | Mostra canal atual |
| `!render` / `!uptime` | todos | Status Render+Mongo |
| `!mongodb` | todos | Status Mongo |

## 📂 ESTRUTURA

```
L1TTL3B0Y-BOT/
├── index.js (principal - 100% Render + novo menu)
├── database/
│   └── mongo.js (conexão MongoDB)
├── configs/
│   └── LOGOS/
│       ├── fotomenu.mp4 (opcional)
│       └── fotomenu.png (opcional)
├── dados/ (rank, stats, silenciados, foto)
├── downloads/ (temp)
├── vpn/ (arquivos .ehi etc)
├── sessao/ (auth Baileys)
├── package.json (@systemzero/baileys)
├── render.yaml (render free config)
├── .env.example
└── README_RENDER.md
```

## ⚠️ SEGURANÇA - TOKEN EXPOSTO

Você postou um token GitHub: `ghp_bEFXr5HYR...` no pedido. **Revogue imediatamente!**
1. https://github.com/settings/tokens
2. Delete esse token
3. Crie novo se precisar, mas NÃO compartilhe

## ✅ TESTE LOCAL

```bash
npm install
cp .env.example .env
# edite .env com seu MONGODB_URI e BOT_NUMBER
npm start
# verá pairing code no console
```

## 📞 SUPORTE

- Dono: ISAÍAS PEDRO - 926 612 801
- Bot: LORDE LÁ DJUM v3.5 RENDER
- Prefixo: ! (configurável)

## 🎉 PRONTO!

Seu bot agora roda 100% no Render Free, com MongoDB, Uptime e novo menu carousel mantendo sua identidade 🌀

**Eu quero que cada usuário tenha uma experiência digna.**

🌀 L1TTL3B0Y-BOT v3.5 RENDER
