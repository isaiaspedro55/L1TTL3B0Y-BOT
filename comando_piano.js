// ════════════════════════════════════════════════
// ✅ COMANDO !PIANO — Piano interativo (HTML)
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const PIANO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Piano</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; user-select: none; }
  html, body { height: 100%; }
  body {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; padding: 20px 14px;
    background: #F3ECE0;
    font-family: 'Inter', system-ui, sans-serif;
    touch-action: manipulation;
  }

  .card {
    width: 100%;
    max-width: 980px;
    background: #FFFDF9;
    border-radius: 28px;
    padding: 28px 28px 24px;
    box-shadow: 0 1px 2px rgba(61,42,24,0.06), 0 20px 44px rgba(61,42,24,0.14);
    border: 1px solid #E9DFCE;
    text-align: center;
  }

  .top-row {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }

  h1 {
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-size: clamp(24px, 4.2vw, 34px);
    color: #3D2A18;
    letter-spacing: 0.2px;
  }

  #display {
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: clamp(13px, 2.6vw, 15px);
    color: #8A6A3F;
    background: #F6EEDD;
    border: 1px solid #E9DBBF;
    border-radius: 20px;
    padding: 5px 16px;
    min-width: 110px;
  }

  .sub {
    color: #A9977E;
    font-size: 13px;
    margin: 6px 0 20px;
  }

  /* ---------- Teclado ---------- */
  .piano-wrap {
    background: linear-gradient(180deg, #3D2A18, #2A1B0E);
    border-radius: 18px;
    padding: 14px 12px 18px;
    box-shadow: inset 0 6px 18px rgba(0,0,0,0.45), 0 10px 24px rgba(61,42,24,0.25);
  }

  .keys {
    position: relative;
    width: 100%;
    height: clamp(150px, 26vw, 220px);
  }

  .white {
    position: absolute;
    top: 0;
    height: 100%;
    background: linear-gradient(180deg, #FFFDF8 0%, #F4EEE1 92%, #E9E0CB 100%);
    border: 1px solid #D8CDB4;
    border-top: none;
    border-radius: 0 0 9px 9px;
    box-shadow: 0 3px 0 #C9BC9C, inset 0 -10px 14px rgba(139,109,58,0.08);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 10px;
    font-size: clamp(9px, 1.6vw, 12px);
    font-weight: 500;
    color: #A9967A;
    font-family: 'Inter', sans-serif;
    transition: transform 0.045s ease, background 0.045s ease, box-shadow 0.045s ease;
    cursor: pointer;
    z-index: 1;
  }
  .white.on {
    transform: translateY(2.5px);
    background: linear-gradient(180deg, #F6E4B8, #EAD08F);
    box-shadow: 0 0.5px 0 #C9BC9C;
    color: #8A6A2F;
  }

  .black {
    position: absolute;
    top: 0;
    height: 62%;
    background: linear-gradient(180deg, #4A3A2C, #241A10 60%, #150F09);
    border: 1px solid #0D0906;
    border-top: none;
    border-radius: 0 0 6px 6px;
    box-shadow: 0 5px 8px rgba(0,0,0,0.5), inset 0 -4px 6px rgba(255,255,255,0.06);
    z-index: 5;
    cursor: pointer;
    transition: transform 0.045s ease, background 0.045s ease;
  }
  .black.on {
    transform: translateY(2.5px);
    background: linear-gradient(180deg, #8A6A2F, #5C4A1E);
  }

  .btn-row { margin-top: 22px; }

  button.play {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: clamp(14px, 2.6vw, 16px);
    color: #FFFDF9;
    background: #B5652E;
    border: none;
    border-radius: 999px;
    padding: 13px 30px;
    box-shadow: 0 4px 0 #8C4A1E;
    cursor: pointer;
    transition: transform 0.06s ease, box-shadow 0.06s ease;
    letter-spacing: 0.2px;
  }
  button.play:active { transform: translateY(3px); box-shadow: 0 1px 0 #8C4A1E; }
  button.play.stop { background: #6B7280; box-shadow: 0 4px 0 #4B5160; }
  button.play.stop:active { box-shadow: 0 1px 0 #4B5160; }

  @media (max-width: 480px) {
    .card { padding: 20px 14px 18px; border-radius: 22px; }
    .piano-wrap { padding: 10px 6px 14px; }
  }
</style>
</head>
<body>

<div class="card">
  <div class="top-row">
    <h1>Piano</h1>
    <div id="display">pronto</div>
  </div>
  <p class="sub">2 oitavas completas · C4 → C6 · toque nas teclas</p>

  <div class="piano-wrap">
    <div class="keys" id="keys"></div>
  </div>

  <div class="btn-row">
    <button class="play" id="playBtn">Tocar Happy Birthday</button>
  </div>
</div>

<script>
(function () {
  var NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var START = 60, END = 84; // C4 .. C6
  var keysEl = document.getElementById('keys');
  var display = document.getElementById('display');
  var byMidi = {};

  function isBlack(m) { return NAMES[m % 12].indexOf('#') > -1; }
  function noteName(m) { return NAMES[m % 12] + (Math.floor(m / 12) - 1); }
  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  var whites = [];
  for (var m = START; m <= END; m++) if (!isBlack(m)) whites.push(m);
  var whiteWidth = 100 / whites.length;
  var whiteIndex = {};
  whites.forEach(function (m, i) { whiteIndex[m] = i; });

  var blackWidth = whiteWidth * 0.58;

  for (var m = START; m <= END; m++) {
    var el = document.createElement('div');
    el.dataset.midi = m;
    if (isBlack(m)) {
      el.className = 'black';
      var leftWhiteIdx = whiteIndex[m - 1];
      el.style.width = blackWidth + '%';
      el.style.left = ((leftWhiteIdx + 1) * whiteWidth - blackWidth / 2) + '%';
    } else {
      el.className = 'white';
      el.style.width = whiteWidth + '%';
      el.style.left = (whiteIndex[m] * whiteWidth) + '%';
      if (m % 12 === 0) el.textContent = noteName(m);
    }
    byMidi[m] = el;
    keysEl.appendChild(el);
  }

  var ctx = null;
  function audio() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(midi, dur, at) {
    var a = audio(); if (!a) return;
    var t = at || a.currentTime, f = freq(midi);
    var master = a.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.5, t + 0.012);
    master.gain.exponentialRampToValueAtTime(0.2, t + 0.12);
    master.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    master.connect(a.destination);
    [[1, 1], [2, 0.3], [3, 0.1]].forEach(function (h) {
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f * h[0], t);
      g.gain.setValueAtTime(h[1], t);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.15);
    });
  }

  function flash(midi, dur) {
    var el = byMidi[midi]; if (!el) return;
    display.textContent = noteName(midi);
    el.classList.add('on');
    setTimeout(function () { el.classList.remove('on'); }, Math.max(120, dur * 800));
  }

  function press(midi) { tone(midi, 0.9); flash(midi, 0.5); }

  keysEl.addEventListener('pointerdown', function (e) {
    var el = e.target.closest('.white, .black');
    if (!el) return;
    e.preventDefault();
    press(parseInt(el.dataset.midi, 10));
  });

  // Happy Birthday (instrumental)
  var SONG = [
    [67,.5],[67,.5],[69,1],[67,1],[72,1],[71,2],
    [67,.5],[67,.5],[69,1],[67,1],[74,1],[72,2],
    [67,.5],[67,.5],[79,1],[76,1],[72,1],[71,1],[69,2],
    [77,.5],[77,.5],[76,1],[72,1],[74,1],[72,3]
  ];
  var BEAT = 60 / 108, playing = false, timers = [];
  var btn = document.getElementById('playBtn');

  function stop() {
    timers.forEach(clearTimeout); timers = [];
    playing = false;
    btn.textContent = 'Tocar Happy Birthday';
    btn.classList.remove('stop');
    display.textContent = 'pronto';
  }

  btn.addEventListener('click', function () {
    if (playing) { stop(); return; }
    var a = audio(); if (!a) return;
    playing = true;
    btn.textContent = 'Parar';
    btn.classList.add('stop');
    display.textContent = 'tocando';
    var t0 = a.currentTime + 0.15, acc = 0;
    SONG.forEach(function (n) {
      var dur = n[1] * BEAT * 0.92, when = t0 + acc * BEAT;
      tone(n[0], dur, when);
      timers.push(setTimeout(function () { flash(n[0], dur); }, (when - a.currentTime) * 1000));
      acc += n[1];
    });
    timers.push(setTimeout(function () {
      display.textContent = 'feliz aniversário';
      playing = false;
      btn.textContent = 'Tocar Happy Birthday';
      btn.classList.remove('stop');
    }, (acc * BEAT + 0.6) * 1000));
  });
})();
</script>
</body>
</html>`;

async function enviarPiano(sock, jid, quotedMsg) {
  const htmlPayload = {
    response_id: "piano_" + Date.now(),
    sections: [
      {
        view_model: {
          primitive: {
            __typename: "GenAIaeacdsnwHtmlPrimitive",
            payload: PIANO_HTML,
            trusted_sources: ["nixel.dev"]
          },
          __typename: "GenAISingleLayoutViewModel",
          height: "full",
          full_screen: true
        }
      }
    ]
  };

  const content = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: "🎹 Piano" }],
          unifiedResponse: {
            data: Buffer.from(JSON.stringify(htmlPayload)).toString("base64")
          },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
            forwardOrigin: 4
          }
        }
      }
    }
  };

  const fullMsg = generateWAMessageFromContent(jid, content, {
    userJid: sock.authState?.creds?.me?.id || sock.user?.id,
    timestamp: new Date(),
  });

  await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id });
  return fullMsg;
}

module.exports = { enviarPiano };

