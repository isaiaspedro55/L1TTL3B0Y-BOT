const express = require("express");
const state = require("./state");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <h1>L1TTL3B0Y ULTRA PRO V5</h1>
    <p>Status: ${state.status}</p>
    <p>Última mensagem: ${state.lastMessage}</p>
  `);
});

app.get("/api/status", (req, res) => {
  res.json(state);
});

app.listen(3000, () => {
  console.log("🌐 Painel V5 rodando em http://localhost:3000");
});
