// ════════════════════════════════════════════════
// ♟️ COMANDO :DAMAS — DAMAS 10x10
// 100 CASAS · 20 PEÇAS POR JOGADOR
// Tela grande + controles abaixo
// ════════════════════════════════════════════════

const { generateWAMessageFromContent } = require("@itsliaaa/baileys");

const DAMAS_HTML = `<!DOCTYPE html>
<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"
>

<title>Damas 100 Casas</title>

<style>

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  user-select:none;
  -webkit-user-select:none;
  -webkit-tap-highlight-color:transparent;
}

html,body{
  min-height:100%;
}

body{
  display:flex;
  justify-content:center;
  align-items:center;
  padding:8px;
  background:#17120f;
  font-family:Arial,sans-serif;
  color:#fff;
  touch-action:manipulation;
}

.card{
  width:100%;
  max-width:620px;
  background:#241b17;
  border:1px solid #4b382d;
  border-radius:18px;
  padding:10px;
  text-align:center;
  box-shadow:0 12px 35px rgba(0,0,0,.45);
}

.title{
  font-size:24px;
  font-weight:900;
  margin-bottom:3px;
}

.sub{
  font-size:10px;
  color:#c9b8aa;
  margin-bottom:7px;
}

.info{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:5px;
  margin-bottom:7px;
}

.turn{
  flex:1;
  padding:8px;
  border-radius:10px;
  background:#382a23;
  font-size:12px;
  font-weight:700;
}

.score{
  font-size:10px;
  color:#d8c9bf;
}

/* ═══════════════════════════════
   TABULEIRO GRANDE
   ═══════════════════════════════ */

.board-wrap{
  width:100%;
  max-width:500px;
  margin:auto;
  padding:5px;
  background:#120d0b;
  border-radius:12px;
  box-shadow:
    inset 0 0 0 1px #5b4336;
}

.board{
  width:100%;
  aspect-ratio:1;

  display:grid;

  grid-template-columns:
    repeat(10,1fr);

  grid-template-rows:
    repeat(10,1fr);

  overflow:hidden;

  border-radius:7px;
}

.cell{
  position:relative;

  display:flex;

  align-items:center;

  justify-content:center;

  aspect-ratio:1;
}

.light{
  background:#e7d7bd;
}

.dark{
  background:#754c35;
}

.cell.selected{
  box-shadow:
    inset 0 0 0 4px #f4d35e;
}

.cell.move{
  box-shadow:
    inset 0 0 0 4px #7ee081;
}

.cell.capture{
  box-shadow:
    inset 0 0 0 4px #ff7777;
}

.piece{
  width:76%;
  height:76%;

  border-radius:50%;

  display:flex;

  align-items:center;
  justify-content:center;

  font-size:
    clamp(13px,4vw,25px);

  font-weight:900;

  border:2px solid rgba(0,0,0,.35);

  box-shadow:
    0 3px 5px rgba(0,0,0,.45),
    inset 0 2px 3px rgba(255,255,255,.22);
}

.white-piece{
  background:
    linear-gradient(
      #fff,
      #d7d7d7
    );

  color:#4d3325;
}

.black-piece{
  background:
    linear-gradient(
      #353535,
      #111
    );

  color:#fff;
}

.king{
  border:4px solid #e7b84b;
}

.number{
  position:absolute;

  top:2px;
  left:3px;

  font-size:7px;

  opacity:.45;

  color:#000;
}

/* ═══════════════════════════════
   BOTÃO
   ═══════════════════════════════ */

button{
  margin-top:9px;

  border:0;

  border-radius:999px;

  padding:9px 20px;

  background:#d49a52;

  color:#21150f;

  font-size:12px;

  font-weight:900;

  box-shadow:
    0 3px 0 #8b5b2b;
}

button:active{
  transform:translateY(2px);

  box-shadow:
    0 1px 0 #8b5b2b;
}

.help{
  margin-top:7px;

  font-size:9px;

  color:#a99384;

  line-height:1.4;
}

</style>

</head>

<body>

<div class="card">

<div class="title">
♟️ DAMAS
</div>

<div class="sub">
10 × 10 · 100 CASAS · 20 PEÇAS
</div>

<div class="info">

<div
  class="turn"
  id="turn">
  Vez das brancas
</div>

<div
  class="score"
  id="score">
  Brancas: 20 · Pretas: 20
</div>

</div>

<div class="board-wrap">

<div
  class="board"
  id="board">
</div>

</div>

<button id="newGame">
NOVO JOGO
</button>

<div class="help">

Toque numa peça e depois numa casa destacada.<br>
Capturas são obrigatórias.

</div>

</div>

<script>

(function(){

const SIZE = 10;

const boardEl =
document.getElementById("board");

const turnEl =
document.getElementById("turn");

const scoreEl =
document.getElementById("score");

const newGame =
document.getElementById("newGame");

let board = [];

let turn = "white";

let selected = null;

let gameOver = false;


// ═══════════════════════════════
// CRIAR TABULEIRO
// ═══════════════════════════════

function createBoard(){

  board =
  Array.from(
    {length:SIZE},
    function(){

      return Array(SIZE).fill(null);

    }
  );


  // PRETAS

  for(
    let r=0;
    r<4;
    r++
  ){

    for(
      let c=0;
      c<SIZE;
      c++
    ){

      if(
        (r+c)%2===1
      ){

        board[r][c] = {

          color:"black",

          king:false

        };

      }

    }

  }


  // BRANCAS

  for(
    let r=6;
    r<10;
    r++
  ){

    for(
      let c=0;
      c<SIZE;
      c++
    ){

      if(
        (r+c)%2===1
      ){

        board[r][c] = {

          color:"white",

          king:false

        };

      }

    }

  }


  turn = "white";

  selected = null;

  gameOver = false;

  render();

}


// ═══════════════════════════════
// AUXILIARES
// ═══════════════════════════════

function inside(r,c){

  return (
    r>=0 &&
    r<SIZE &&
    c>=0 &&
    c<SIZE
  );

}

function enemy(color){

  return color === "white"
    ? "black"
    : "white";

}


// ═══════════════════════════════
// DIREÇÕES
// ═══════════════════════════════

function directions(){

  return [

    [-1,-1],
    [-1,1],
    [1,-1],
    [1,1]

  ];

}


// ═══════════════════════════════
// MOVIMENTOS
// ═══════════════════════════════

function getMoves(
  r,
  c,
  captureOnly
){

  const piece =
  board[r][c];

  if(!piece) return [];

  if(
    piece.color !== turn
  ) return [];

  const moves = [];


  // ═══════════════════════════
  // DAMA
  // ═══════════════════════════

  if(piece.king){

    directions().forEach(
    function(d){

      let nr =
      r+d[0];

      let nc =
      c+d[1];

      let enemyPiece =
      null;


      while(
        inside(nr,nc)
      ){

        const target =
        board[nr][nc];


        if(!target){

          if(
            !captureOnly &&
            !enemyPiece
          ){

            moves.push({

              r:nr,
              c:nc,
              capture:null

            });

          }

          else if(
            enemyPiece
          ){

            moves.push({

              r:nr,
              c:nc,
              capture:enemyPiece

            });

          }

        }

        else{

          if(
            target.color ===
            piece.color ||
            enemyPiece
          ){

            break;

          }

          enemyPiece = {

            r:nr,
            c:nc

          };

        }


        nr += d[0];

        nc += d[1];

      }

    });

    return moves;

  }


  // ═══════════════════════════
  // PEÇA NORMAL
  // ═══════════════════════════

  directions().forEach(
  function(d){

    const nr =
    r+d[0];

    const nc =
    c+d[1];


    // MOVIMENTO

    if(
      !captureOnly &&
      inside(nr,nc) &&
      !board[nr][nc]
    ){

      const forward =
      piece.color === "white"
      ? d[0] === -1
      : d[0] === 1;


      if(forward){

        moves.push({

          r:nr,
          c:nc,
          capture:null

        });

      }

    }


    // CAPTURA

    const jr =
    r+d[0]*2;

    const jc =
    c+d[1]*2;


    if(
      inside(nr,nc) &&
      inside(jr,jc) &&
      board[nr][nc] &&
      board[nr][nc].color ===
        enemy(piece.color) &&
      !board[jr][jc]
    ){

      moves.push({

        r:jr,
        c:jc,

        capture:{

          r:nr,
          c:nc

        }

      });

    }

  });


  return moves;

}


// ═══════════════════════════════
// CAPTURAS OBRIGATÓRIAS
// ═══════════════════════════════

function allCaptures(color){

  const result = [];

  const oldTurn =
  turn;

  turn = color;


  for(
    let r=0;
    r<SIZE;
    r++
  ){

    for(
      let c=0;
      c<SIZE;
      c++
    ){

      if(
        board[r][c] &&
        board[r][c].color === color
      ){

        const moves =
        getMoves(
          r,
          c,
          true
        );


        if(moves.length){

          result.push({

            r:r,
            c:c,
            moves:moves

          });

        }

      }

    }

  }


  turn = oldTurn;

  return result;

}


function captureRequired(){

  return (
    allCaptures(turn).length > 0
  );

}


// ═══════════════════════════════
// EXECUTAR MOVIMENTO
// ═══════════════════════════════

function executeMove(
  from,
  to
){

  const piece =
  board[from.r][from.c];


  const moves =
  getMoves(
    from.r,
    from.c,
    captureRequired()
  );


  const move =
  moves.find(
    function(m){

      return (
        m.r === to.r &&
        m.c === to.c
      );

    }
  );


  if(!move) return false;


  board[to.r][to.c] =
  piece;

  board[from.r][from.c] =
  null;


  // CAPTURA

  if(move.capture){

    board[
      move.capture.r
    ][
      move.capture.c
    ] = null;

  }


  // PROMOÇÃO

  if(
    !piece.king &&
    (
      (
        piece.color === "white" &&
        to.r === 0
      )
      ||
      (
        piece.color === "black" &&
        to.r === 9
      )
    )
  ){

    piece.king = true;

  }


  // CAPTURA MÚLTIPLA

  if(move.capture){

    const next =
    getMoves(
      to.r,
      to.c,
      true
    );


    if(next.length){

      selected = {

        r:to.r,
        c:to.c

      };

      render();

      return true;

    }

  }


  turn =
  enemy(turn);

  selected = null;

  checkGameOver();

  render();

  return true;

}


// ═══════════════════════════════
// VERIFICAR FIM
// ═══════════════════════════════

function checkGameOver(){

  let white = 0;

  let black = 0;


  for(
    let r=0;
    r<SIZE;
    r++
  ){

    for(
      let c=0;
      c<SIZE;
      c++
    ){

      if(board[r][c]){

        if(
          board[r][c].color ===
          "white"
        ){

          white++;

        }

        else{

          black++;

        }

      }

    }

  }


  if(!white){

    gameOver = true;

    turnEl.textContent =
    "Pretas venceram! 🏆";

    return;

  }


  if(!black){

    gameOver = true;

    turnEl.textContent =
    "Brancas venceram! 🏆";

    return;

  }


  // Verificar movimentos

  const oldTurn =
  turn;


  turn = "white";

  let whiteMoves = false;


  for(
    let r=0;
    r<SIZE;
    r++
  ){

    for(
      let c=0;
      c<SIZE;
      c++
    ){

      if(
        board[r][c] &&
        board[r][c].color ===
        "white" &&
        getMoves(
          r,
          c,
          false
        ).length
      ){

        whiteMoves = true;

      }

    }

  }


  turn = "black";

  let blackMoves = false;


  for(
    let r=0;
    r<SIZE;
    r++
  ){

    for(
      let c=0;
      c<SIZE;
      c++
    ){

      if(
        board[r][c] &&
        board[r][c].color ===
        "black" &&
        getMoves(
          r,
          c,
          false
        ).length
      ){

        blackMoves = true;

      }

    }

  }


  turn = oldTurn;


  if(!whiteMoves){

    gameOver = true;

    turnEl.textContent =
    "Pretas venceram! 🏆";

  }


  if(!blackMoves){

    gameOver = true;

    turnEl.textContent =
    "Brancas venceram! 🏆";

  }

}


// ═══════════════════════════════
// SELECIONAR PEÇA
// ═══════════════════════════════

function selectPiece(r,c){

  if(gameOver) return;

  const piece =
  board[r][c];


  if(
    !piece ||
    piece.color !== turn
  ){

    return;

  }


  const required =
  captureRequired();


  const moves =
  getMoves(
    r,
    c,
    required
  );


  if(!moves.length){

    turnEl.textContent =
    "Essa peça não pode mover.";

    return;

  }


  selected = {

    r:r,
    c:c

  };


  render();

}


// ═══════════════════════════════
// CLIQUE
// ═══════════════════════════════

function clickCell(r,c){

  if(gameOver)
    return;


  if(selected){

    if(
      board[r][c] &&
      board[r][c].color === turn
    ){

      selectPiece(r,c);

      return;

    }


    if(
      executeMove(
        selected,
        {
          r:r,
          c:c
        }
      )
    ){

      return;

    }


    selected = null;

    render();

    return;

  }


  selectPiece(r,c);

}


// ═══════════════════════════════
// DESENHAR
// ═══════════════════════════════

function render(){

  boardEl.innerHTML = "";


  let moves = [];


  if(selected){

    moves =
    getMoves(
      selected.r,
      selected.c,
      captureRequired()
    );

  }


  for(
    let r=0;
    r<SIZE;
    r++
  ){

    for(
      let c=0;
      c<SIZE;
      c++
    ){

      const cell =
      document.createElement(
        "div"
      );


      cell.className =
      "cell " +
      (
        (r+c)%2 === 0
        ? "light"
        : "dark"
      );


      cell.dataset.r = r;

      cell.dataset.c = c;


      // NÚMERO DA CASA

      const number =
      document.createElement(
        "span"
      );

      number.className =
      "number";

      number.textContent =
      r*SIZE+c+1;

      cell.appendChild(
        number
      );


      // SELECIONADA

      if(
        selected &&
        selected.r === r &&
        selected.c === c
      ){

        cell.classList.add(
          "selected"
        );

      }


      // MOVIMENTO

      const possible =
      moves.find(
        function(m){

          return (
            m.r === r &&
            m.c === c
          );

        }
      );


      if(possible){

        cell.classList.add(
          possible.capture
          ? "capture"
          : "move"
        );

      }


      // PEÇA

      if(board[r][c]){

        const piece =
        document.createElement(
          "div"
        );


        piece.className =
        "piece " +
        (
          board[r][c].color ===
          "white"
          ? "white-piece"
          : "black-piece"
        );


        if(board[r][c].king){

          piece.classList.add(
            "king"
          );

          piece.textContent =
          "♛";

        }


        cell.appendChild(
          piece
        );

      }


      cell.addEventListener(
        "pointerdown",
        function(e){

          e.preventDefault();

          clickCell(
            parseInt(
              this.dataset.r,
              10
            ),

            parseInt(
              this.dataset.c,
              10
            )
          );

        }
      );


      boardEl.appendChild(
        cell
      );

    }

  }


  // PLACAR

  let white = 0;

  let black = 0;


  for(
    let r=0;
    r<SIZE;
    r++
  ){

    for(
      let c=0;
      c<SIZE;
      c++
    ){

      if(board[r][c]){

        if(
          board[r][c].color ===
          "white"
        ){

          white++;

        }

        else{

          black++;

        }

      }

    }

  }


  scoreEl.textContent =
  "Brancas: " +
  white +
  " · Pretas: " +
  black;


  if(!gameOver){

    turnEl.textContent =
    turn === "white"
    ? "Vez das brancas"
    : "Vez das pretas";


    if(captureRequired()){

      turnEl.textContent +=
      " · CAPTURA OBRIGATÓRIA";

    }

  }

}


// ═══════════════════════════════
// NOVO JOGO
// ═══════════════════════════════

newGame.addEventListener(
  "click",
  createBoard
);


createBoard();

})();
</script>

</body>
</html>`;


// ════════════════════════════════════════════════
// ENVIAR DAMAS
// ════════════════════════════════════════════════

async function enviarDama(
  sock,
  jid,
  quotedMsg
){

  const htmlPayload = {

    response_id:
      "dama_" + Date.now(),

    sections:[

      {

        view_model:{

          primitive:{

            __typename:
            "GenAIaeacdsnwHtmlPrimitive",

            payload:
            DAMAS_HTML,

            trusted_sources:[
              "nixel.dev"
            ]

          },

          __typename:
          "GenAISingleLayoutViewModel",

          height:"full",

          full_screen:true

        }

      }

    ]

  };


  const content = {

    botForwardedMessage:{

      message:{

        richResponseMessage:{

          messageType:1,

          submessages:[

            {

              messageType:2,

              messageText:
              "♟️ Damas — 100 Casas"

            }

          ],

          unifiedResponse:{

            data:
            Buffer
            .from(
              JSON.stringify(
                htmlPayload
              )
            )
            .toString("base64")

          },

          contextInfo:{

            forwardingScore:1,

            isForwarded:true,

            forwardedAiBotMessageInfo:{

              botJid:
              "867051314767696@bot"

            },

            forwardOrigin:4

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


module.exports = {
  enviarDama
};
