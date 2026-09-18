// ════════════════════════════════════════════════
// ✅ COMANDO !COBRA — Snake compacto 4×4 DINÂMICO
// ════════════════════════════════════════════════
const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const COBRA_HTML = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

<title>Cobra 4×4</title>

<style>
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: radial-gradient(
    circle at 50% 0%,
    #1b2a1b,
    #05130a 72%
  );

  display: flex;
  align-items: center;
  justify-content: center;

  font-family:
    -apple-system,
    Segoe UI,
    Roboto,
    Arial,
    sans-serif;

  overflow: hidden;
  color: #eaffea;
}

/* ═══════════════════════════════════════
   CONTAINER COMPACTO
═══════════════════════════════════════ */

.wrap {
  width: min(100%, 176px);
  padding: 5px;
  overflow: visible;
}

/* ═══════════════════════════════════════
   PLACAR
═══════════════════════════════════════ */

.hud {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 5px;
  padding: 5px 8px;

  border-radius: 8px;

  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
}

.hud b {
  color: #7CFC91;
  font-size: 12px;
}

.hud span {
  font-size: 9px;
  opacity: .78;
}

/* ═══════════════════════════════════════
   TABULEIRO 4×4
═══════════════════════════════════════ */

#board {
  width: 100%;
  aspect-ratio: 1 / 1;

  border-radius: 9px;

  background: #0c1f10;
  border: 1px solid #234d29;

  box-shadow:
    inset 0 0 14px rgba(0,0,0,.5),
    0 5px 14px rgba(0,0,0,.35);

  display: block;
}

/* ═══════════════════════════════════════
   CONTROLOS
═══════════════════════════════════════ */

.controls {
  margin-top: 7px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 7px;
}

/* JOYSTICK */

.joystick {
  position: relative;

  width: 76px;
  height: 50px;

  flex: 0 0 76px;

  border-radius: 25px;

  touch-action: none;

  background:
    radial-gradient(
      circle,
      #285f34,
      #15351c
    );

  border: 1px solid #3c7d49;

  box-shadow:
    inset 0 2px 5px rgba(0,0,0,.45),
    0 3px 7px rgba(0,0,0,.35);
}

.joystick::after {
  content: '↕ ↔';

  position: absolute;
  inset: 0;

  display: grid;
  place-items: center;

  color: rgba(234,255,234,.28);

  font-size: 13px;
}

.stick {
  position: absolute;

  z-index: 1;

  width: 25px;
  height: 25px;

  left: 25px;
  top: 12px;

  border-radius: 50%;

  background:
    linear-gradient(
      145deg,
      #9affaa,
      #328445
    );

  border: 1px solid #b9ffc2;

  box-shadow:
    0 2px 4px rgba(0,0,0,.5);

  transition:
    transform .06s linear;
}

/* PAUSA */

#pause {
  width: 24px;
  height: 24px;

  padding: 0;

  border: 0;
  border-radius: 50%;

  color: #eaffea;

  background: #285f34;

  font-size: 11px;

  cursor: pointer;
}

#pause:active {
  transform: scale(.92);
}

/* ═══════════════════════════════════════
   OVERLAY
═══════════════════════════════════════ */

.overlay {
  position: fixed;
  inset: 0;

  padding: 16px;

  background: rgba(0,0,0,.76);

  display: none;

  align-items: center;
  justify-content: center;

  flex-direction: column;

  text-align: center;

  gap: 7px;

  z-index: 5;
}

.overlay.show {
  display: flex;
}

.overlay h2 {
  margin: 0;

  font-size: 21px;

  color: #7CFC91;
}

.overlay div {
  max-width: 210px;

  font-size: 12px;

  opacity: .86;
}

.overlay button {
  margin-top: 4px;

  padding: 8px 18px;

  border: none;
  border-radius: 18px;

  background: #3ea34f;

  color: #fff;

  font-size: 13px;

  font-weight: 600;

  cursor: pointer;

  pointer-events: auto;

  touch-action: manipulation;
}

.overlay button:active {
  transform: scale(.95);
}
</style>
</head>

<body>

<div class="wrap">

  <!-- PLACAR -->

  <div class="hud">

    <div>
      🐍
      <b id="score">0</b>
    </div>

    <span id="recorde">
      Recorde: 0
    </span>

  </div>

  <!-- TABULEIRO -->

  <canvas
    id="board"
    aria-label="Tabuleiro Snake 4 por 4">
  </canvas>

  <!-- CONTROLOS -->

  <div
    class="controls"
    aria-label="Controlos da cobra">

    <div
      id="joystick"
      class="joystick"
      role="application"
      aria-label="Arrasta para controlar a cobra">

      <div
        id="stick"
        class="stick">
      </div>

    </div>

    <button
      id="pause"
      aria-label="Pausar">
      Ⅱ
    </button>

  </div>

</div>


<!-- ═══════════════════════════════════════
     TELA DE INÍCIO / FIM
═══════════════════════════════════════ -->

<div
  class="overlay"
  id="overlay">

  <h2 id="overlayTitle">
    🐍 Cobra 4×4
  </h2>

  <div id="overlayMsg">
    Arrasta o analógico para guiar a cobra.
    Come a maçã!
  </div>

  <button id="startBtn">
    Jogar
  </button>

</div>


<script>

(function(){

  // ═══════════════════════════════════════
  // ELEMENTOS
  // ═══════════════════════════════════════

  const canvas =
    document.getElementById("board");

  const ctx =
    canvas.getContext("2d");

  const scoreEl =
    document.getElementById("score");

  const recordeEl =
    document.getElementById("recorde");

  const pauseBtn =
    document.getElementById("pause");

  const overlay =
    document.getElementById("overlay");

  const overlayTitle =
    document.getElementById("overlayTitle");

  const overlayMsg =
    document.getElementById("overlayMsg");

  const startBtn =
    document.getElementById("startBtn");

  const joystick =
    document.getElementById("joystick");

  const stick =
    document.getElementById("stick");


  // ═══════════════════════════════════════
  // CONFIGURAÇÃO
  // ═══════════════════════════════════════

  const cols = 4;
  const rows = 4;

  let cell = 0;

  let snake = [];

  let food = null;

  let dir = {
    x: 1,
    y: 0
  };

  let nextDir = {
    x: 1,
    y: 0
  };

  let score = 0;

  let recorde =
    parseInt(
      localStorage.getItem(
        "cobra_recorde_4x4"
      ) || "0",
      10
    ) || 0;

  let alive = false;

  let paused = false;

  let timerId = null;

  let joystickPointer = null;

  let aIniciar = false;


  // ═══════════════════════════════════════
  // VELOCIDADE
  // ═══════════════════════════════════════

  const VELOCIDADE_INICIAL = 360;

  const VELOCIDADE_MINIMA = 155;

  const ACELERACAO_POR_COMIDA = 18;


  // ═══════════════════════════════════════
  // MOSTRAR RECORDE
  // ═══════════════════════════════════════

  recordeEl.textContent =
    "Recorde: " + recorde;


  // ═══════════════════════════════════════
  // REDIMENSIONAR TABULEIRO
  // ═══════════════════════════════════════

  function resize(){

    const size =
      canvas.clientWidth ||
      canvas.parentElement.clientWidth;

    canvas.width = size;

    canvas.height = size;

    cell = size / cols;

    if(snake.length){

      draw();

    }

  }


  window.addEventListener(
    "resize",
    resize
  );


  // ═══════════════════════════════════════
  // VELOCIDADE ATUAL
  // ═══════════════════════════════════════

  function velocidadeAtual(){

    const nivel =
      Math.floor(score / 10);

    return Math.max(
      VELOCIDADE_MINIMA,
      VELOCIDADE_INICIAL -
      nivel * ACELERACAO_POR_COMIDA
    );

  }


  // ═══════════════════════════════════════
  // INICIAR NOVO JOGO
  // ═══════════════════════════════════════

  function novoJogo(){

    clearTimeout(timerId);

    snake = [

      {
        x: 2,
        y: 2
      },

      {
        x: 1,
        y: 2
      }

    ];


    dir = {
      x: 1,
      y: 0
    };


    nextDir = {
      x: 1,
      y: 0
    };


    score = 0;

    alive = true;

    paused = false;


    scoreEl.textContent =
      score;

    pauseBtn.textContent =
      "Ⅱ";


    overlay.classList.remove(
      "show"
    );

    overlay.style.display =
      "none";


    colocarComida();

    draw();

    agendarPasso();

  }


  // ═══════════════════════════════════════
  // AGENDAR MOVIMENTO
  // ═══════════════════════════════════════

  function agendarPasso(){

    clearTimeout(timerId);

    if(!alive){

      return;

    }


    timerId = setTimeout(

      function(){

        passo();

      },

      velocidadeAtual()

    );

  }


  // ═══════════════════════════════════════
  // COLOCAR COMIDA
  // ═══════════════════════════════════════

  function colocarComida(){

    const livres = [];


    for(
      let y = 0;
      y < rows;
      y++
    ){

      for(
        let x = 0;
        x < cols;
        x++
      ){

        const ocupado =
          snake.some(
            function(s){

              return (
                s.x === x &&
                s.y === y
              );

            }
          );


        if(!ocupado){

          livres.push({
            x: x,
            y: y
          });

        }

      }

    }


    if(!livres.length){

      venceu();

      return;

    }


    food =
      livres[
        Math.floor(
          Math.random() *
          livres.length
        )
      ];

  }


  // ═══════════════════════════════════════
  // MOVIMENTO DA COBRA
  // ═══════════════════════════════════════

  function passo(){

    if(
      !alive ||
      paused
    ){

      return;

    }


    // aplica direção
    dir = {
      x: nextDir.x,
      y: nextDir.y
    };


    // nova cabeça

    const head = {

      x:
        snake[0].x +
        dir.x,

      y:
        snake[0].y +
        dir.y

    };


    // ═══════════════════════════════════
    // ATRAVESSAR BORDAS
    // ═══════════════════════════════════

    if(head.x < 0){

      head.x =
        cols - 1;

    }

    if(head.x >= cols){

      head.x = 0;

    }

    if(head.y < 0){

      head.y =
        rows - 1;

    }

    if(head.y >= rows){

      head.y = 0;

    }


    // ═══════════════════════════════════
    // VERIFICAR COMIDA
    // ═══════════════════════════════════

    const vaiComer =
      food &&
      head.x === food.x &&
      head.y === food.y;


    // ═══════════════════════════════════
    // COLISÃO
    // ═══════════════════════════════════

    const corpoParaColisao =
      vaiComer
        ? snake
        : snake.slice(0, -1);


    const bateu =
      corpoParaColisao.some(
        function(s){

          return (
            s.x === head.x &&
            s.y === head.y
          );

        }
      );


    if(bateu){

      fimDeJogo();

      return;

    }


    // ═══════════════════════════════════
    // ADICIONAR CABEÇA
    // ═══════════════════════════════════

    snake.unshift(head);


    // ═══════════════════════════════════
    // COMEU
    // ═══════════════════════════════════

    if(vaiComer){

      score += 10;

      scoreEl.textContent =
        score;


      colocarComida();

    }

    else{

      // remove cauda

      snake.pop();

    }


    draw();

    agendarPasso();

  }


  // ═══════════════════════════════════════
  // DEFINIR DIREÇÃO
  // ═══════════════════════════════════════

  function setDir(x, y){

    if(!alive){

      return;

    }


    // não permite virar diretamente
    // para trás

    if(
      dir.x === -x &&
      dir.y === -y
    ){

      return;

    }


    // também evita sequência impossível

    if(
      nextDir.x === -x &&
      nextDir.y === -y
    ){

      return;

    }


    nextDir = {
      x: x,
      y: y
    };

  }


  // ═══════════════════════════════════════
  // DESENHAR TABULEIRO
  // ═══════════════════════════════════════

  function draw(){

    if(!cell){

      return;

    }


    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    // fundo

    ctx.fillStyle =
      "#0c1f10";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    // ═══════════════════════════════════
    // GRELHA 4×4
    // ═══════════════════════════════════

    ctx.strokeStyle =
      "rgba(255,255,255,.10)";

    ctx.lineWidth = 1;


    for(
      let i = 0;
      i <= cols;
      i++
    ){

      ctx.beginPath();

      ctx.moveTo(
        i * cell,
        0
      );

      ctx.lineTo(
        i * cell,
        canvas.height
      );

      ctx.stroke();


      ctx.beginPath();

      ctx.moveTo(
        0,
        i * cell
      );

      ctx.lineTo(
        canvas.width,
        i * cell
      );

      ctx.stroke();

    }


    // ═══════════════════════════════════
    // COMIDA
    // ═══════════════════════════════════

    if(food){

      const fx =
        food.x * cell +
        cell / 2;

      const fy =
        food.y * cell +
        cell / 2;


      // maçã

      ctx.fillStyle =
        "#ff5f5f";

      ctx.beginPath();

      ctx.arc(
        fx,
        fy + cell * .04,
        cell * .23,
        0,
        Math.PI * 2
      );

      ctx.fill();


      // brilho

      ctx.fillStyle =
        "rgba(255,255,255,.55)";

      ctx.beginPath();

      ctx.arc(
        fx - cell * .08,
        fy - cell * .07,
        cell * .05,
        0,
        Math.PI * 2
      );

      ctx.fill();


      // folha

      ctx.fillStyle =
        "#8CFF9E";

      ctx.fillRect(
        fx + cell * .05,
        fy - cell * .25,
        cell * .13,
        cell * .07
      );

    }


    // ═══════════════════════════════════
    // COBRA
    // ═══════════════════════════════════

    snake.forEach(
      function(s, i){

        const pad =
          cell * .10;


        const x =
          s.x * cell + pad;

        const y =
          s.y * cell + pad;

        const tamanho =
          cell - pad * 2;


        // cabeça

        ctx.fillStyle =
          i === 0
            ? "#8CFF9E"
            : "#3ea34f";


        ctx.beginPath();


        if(ctx.roundRect){

          ctx.roundRect(
            x,
            y,
            tamanho,
            tamanho,
            cell * .16
          );

        }

        else{

          ctx.rect(
            x,
            y,
            tamanho,
            tamanho
          );

        }


        ctx.fill();


        // ═══════════════════════════════
        // OLHOS DA CABEÇA
        // ═══════════════════════════════

        if(i === 0){

          ctx.fillStyle =
            "#07140a";


          const eyeSize =
            cell * .055;


          let e1x,
              e1y,
              e2x,
              e2y;


          if(dir.x !== 0){

            e1x =
              x +
              tamanho * .68;

            e2x =
              x +
              tamanho * .68;

            e1y =
              y +
              tamanho * .30;

            e2y =
              y +
              tamanho * .68;

          }

          else{

            e1x =
              x +
              tamanho * .30;

            e2x =
              x +
              tamanho * .68;

            e1y =
              y +
              tamanho * .30;

            e2y =
              y +
              tamanho * .30;

          }


          ctx.beginPath();

          ctx.arc(
            e1x,
            e1y,
            eyeSize,
            0,
            Math.PI * 2
          );

          ctx.fill();


          ctx.beginPath();

          ctx.arc(
            e2x,
            e2y,
            eyeSize,
            0,
            Math.PI * 2
          );

          ctx.fill();

        }

      }
    );

  }


  // ═══════════════════════════════════════
  // FIM DE JOGO
  // ═══════════════════════════════════════

  function fimDeJogo(){

    alive = false;

    clearTimeout(timerId);


    if(score > recorde){

      recorde = score;


      localStorage.setItem(
        "cobra_recorde_4x4",
        String(recorde)
      );


      recordeEl.textContent =
        "Recorde: " + recorde;

    }


    mostrarOverlay(
      "💀 Fim de jogo",
      "Pontuação: " + score,
      "Jogar de novo"
    );

  }


  // ═══════════════════════════════════════
  // VITÓRIA
  // ═══════════════════════════════════════

  function venceu(){

    alive = false;

    clearTimeout(timerId);


    if(score > recorde){

      recorde = score;


      localStorage.setItem(
        "cobra_recorde_4x4",
        String(recorde)
      );


      recordeEl.textContent =
        "Recorde: " + recorde;

    }


    mostrarOverlay(
      "🏆 Venceste!",
      "Preencheste todo o tabuleiro 4×4. Pontuação: " + score,
      "Jogar de novo"
    );

  }


  // ═══════════════════════════════════════
  // OVERLAY
  // ═══════════════════════════════════════

  function mostrarOverlay(
    titulo,
    mensagem,
    botao
  ){

    overlayTitle.textContent =
      titulo;

    overlayMsg.textContent =
      mensagem;

    startBtn.textContent =
      botao;

    overlay.classList.add(
      "show"
    );

    overlay.style.display =
      "flex";

  }


  // ═══════════════════════════════════════
  // PAUSA
  // ═══════════════════════════════════════

  pauseBtn.onclick =
    function(){

      if(!alive){

        return;

      }


      paused =
        !paused;


      if(paused){

        pauseBtn.textContent =
          "▶";

        mostrarOverlay(
          "⏸️ Pausado",
          "O jogo está pausado.",
          "Continuar"
        );

      }

      else{

        pauseBtn.textContent =
          "Ⅱ";

        overlay.classList.remove(
          "show"
        );

        overlay.style.display =
          "none";

        agendarPasso();

      }

    };


  // ═══════════════════════════════════════
  // JOYSTICK
  // ═══════════════════════════════════════

  function atualizarJoystick(
    clientX,
    clientY
  ){

    const r =
      joystick.getBoundingClientRect();


    const cx =
      r.left + r.width / 2;

    const cy =
      r.top + r.height / 2;


    let dx =
      clientX - cx;

    let dy =
      clientY - cy;


    const distancia =
      Math.hypot(dx, dy);


    const limite = 14;


    if(distancia > limite){

      dx *=
        limite / distancia;

      dy *=
        limite / distancia;

    }


    stick.style.transform =
      "translate(" +
      dx +
      "px," +
      dy +
      "px)";


    // só muda direção
    // quando o movimento for suficiente

    if(
      Math.hypot(
        clientX - cx,
        clientY - cy
      ) >= 7
    ){

      if(
        Math.abs(dx) >
        Math.abs(dy)
      ){

        setDir(
          dx > 0
            ? 1
            : -1,
          0
        );

      }

      else{

        setDir(
          0,
          dy > 0
            ? 1
            : -1
        );

      }

    }

  }


  function resetJoystick(){

    joystickPointer =
      null;

    stick.style.transform =
      "translate(0,0)";

  }


  joystick.addEventListener(
    "pointerdown",
    function(e){

      e.preventDefault();

      joystickPointer =
        e.pointerId;

      joystick.setPointerCapture(
        e.pointerId
      );

      atualizarJoystick(
        e.clientX,
        e.clientY
      );

    }
  );


  joystick.addEventListener(
    "pointermove",
    function(e){

      if(
        e.pointerId ===
        joystickPointer
      ){

        e.preventDefault();

        atualizarJoystick(
          e.clientX,
          e.clientY
        );

      }

    }
  );


  joystick.addEventListener(
    "pointerup",
    resetJoystick
  );


  joystick.addEventListener(
    "pointercancel",
    resetJoystick
  );


  // ═══════════════════════════════════════
  // TECLADO
  // ═══════════════════════════════════════

  document.addEventListener(
    "keydown",
    function(e){

      const teclas = {

        ArrowUp: [0,-1],

        ArrowDown: [0,1],

        ArrowLeft: [-1,0],

        ArrowRight: [1,0],

        w: [0,-1],

        W: [0,-1],

        s: [0,1],

        S: [0,1],

        a: [-1,0],

        A: [-1,0],

        d: [1,0],

        D: [1,0]

      };


      if(teclas[e.key]){

        e.preventDefault();

        setDir(
          teclas[e.key][0],
          teclas[e.key][1]
        );

      }

    }
  );


  // ═══════════════════════════════════════
  // INICIAR / CONTINUAR
  // ═══════════════════════════════════════

  function iniciarJogo(e){

    if(e){

      e.preventDefault();

      e.stopPropagation();

    }


    if(aIniciar){

      return;

    }


    aIniciar = true;


    // se estava pausado,
    // apenas continua

    if(
      alive &&
      paused
    ){

      paused = false;

      pauseBtn.textContent =
        "Ⅱ";

      overlay.classList.remove(
        "show"
      );

      overlay.style.display =
        "none";

      agendarPasso();

    }

    else{

      novoJogo();

    }


    setTimeout(
      function(){

        aIniciar = false;

      },
      250
    );

  }


  startBtn.addEventListener(
    "click",
    iniciarJogo
  );


  startBtn.addEventListener(
    "pointerup",
    iniciarJogo
  );


  // ═══════════════════════════════════════
  // INICIALIZAÇÃO
  // ═══════════════════════════════════════

  resize();

  novoJogo();

})();

</script>

</body>
</html>`;


// ════════════════════════════════════════════════
// 📤 ENVIAR COBRA PELO WHATSAPP
// ════════════════════════════════════════════════

async function enviarCobra(
  sock,
  jid,
  quotedMsg
){

  const htmlPayload = {

    response_id:
      "cobra_4x4_" +
      Date.now(),

    sections: [

      {

        view_model: {

          primitive: {

            __typename:
              "GenAIaeacdsnwHtmlPrimitive",

            payload:
              COBRA_HTML,

            trusted_sources: [
              "nixel.dev"
            ]

          },

          __typename:
            "GenAISingleLayoutViewModel",

          height:
            "full",

          full_screen:
            true

        }

      }

    ]

  };


  const content = {

    botForwardedMessage: {

      message: {

        richResponseMessage: {

          messageType: 1,

          submessages: [

            {

              messageType: 2,

              messageText:
                "🐍 Cobra 4×4"

            }

          ],

          unifiedResponse: {

            data:
              Buffer.from(
                JSON.stringify(
                  htmlPayload
                )
              ).toString("base64")

          },

          contextInfo: {

            forwardingScore: 1,

            isForwarded: true,

            forwardedAiBotMessageInfo: {

              botJid:
                "867051314767696@bot"

            },

            forwardOrigin: 4

          }

        }

      }

    }

  };


  const fullMsg =
    generateWAMessageFromContent(
      jid,
      content,
      {

        userJid:
          sock.authState?.creds?.me?.id ||
          sock.user?.id,

        timestamp:
          new Date()

      }
    );


  await sock.relayMessage(
    jid,
    fullMsg.message,
    {
      messageId:
        fullMsg.key.id
    }
  );


  return fullMsg;

}


// ════════════════════════════════════════════════
// EXPORTAR
// ════════════════════════════════════════════════

module.exports = {
  enviarCobra
};
