// ════════════════════════════════════════════════
// ✅ FONTES — estilos de letra unicode (!setletra / !verletras)
// ════════════════════════════════════════════════

function construir(baseUp, baseLow, baseDig, excUp = {}, excLow = {}) {
  return function (texto) {
    return String(texto)
      .split("")
      .map((c) => {
        const code = c.charCodeAt(0);
        if (excUp[c]) return excUp[c];
        if (excLow[c]) return excLow[c];
        if (code >= 65 && code <= 90) return String.fromCodePoint(baseUp + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(baseLow + (code - 97));
        if (baseDig !== null && code >= 48 && code <= 57) return String.fromCodePoint(baseDig + (code - 48));
        return c;
      })
      .join("");
  };
}

const normal = (t) => String(t);

const italic = construir(0x1d434, 0x1d44e, null, {}, { h: "ℎ" });

const boldItalic = construir(0x1d468, 0x1d482, null);

const script = construir(0x1d49c, 0x1d4b6, null,
  { B: "ℬ", E: "ℰ", F: "Ⅎ", H: "ℋ", I: "ℐ", L: "ℒ", M: "ℳ", R: "ℛ" },
  { e: "ℯ", g: "ℊ", o: "ℴ" }
);

const boldScript = construir(0x1d4d0, 0x1d4ea, null);

const fraktur = construir(0x1d504, 0x1d51e, null,
  { C: "ℭ", H: "ℌ", I: "ℑ", R: "ℜ", Z: "ℨ" }, {}
);

const boldFraktur = construir(0x1d56c, 0x1d586, null);

const doubleStruck = construir(0x1d538, 0x1d552, 0x1d7d8,
  { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" }, {}
);

const sansSerif = construir(0x1d5a0, 0x1d5ba, 0x1d7e2);

const sansSerifBold = construir(0x1d5d4, 0x1d5ee, 0x1d7ec);

const monoEsp = construir(0x1d670, 0x1d68a, 0x1d7f6);

const fullWidth = construir(0xff21, 0xff41, 0xff10);

const bold = construir(0x1d400, 0x1d41a, 0x1d7ce);

// Nome exactamente como aparece nas imagens do "Tipo de Letra" (Word/Office)
const FONTES = {
  "Abadi": normal,
  "Abadi ExtraLight": italic,
  "ADLaM Display": fullWidth,
  "Agency FR": monoEsp,
  "Amasis MT Pro Light": script,
  "Amasis MT Pro Medium": boldScript,
  "Angsana New": fraktur,
  "AngsanaUPC": boldFraktur,
  "Aparajita": doubleStruck,
  "Aptos": boldItalic,
  "Aptos Black": bold,
  "Calibri Light": sansSerif,
  "Calibri": sansSerifBold,
};

const NOMES_FONTES = Object.keys(FONTES);

function encontrarFonte(nomeBusca) {
  if (!nomeBusca) return null;
  const alvo = String(nomeBusca).trim().toLowerCase();
  const chave = NOMES_FONTES.find((n) => n.toLowerCase() === alvo);
  return chave || null;
}

function aplicarFonte(nomeFonte, texto) {
  const fn = FONTES[nomeFonte] || normal;
  try {
    return fn(texto);
  } catch {
    return String(texto);
  }
}

module.exports = { FONTES, NOMES_FONTES, encontrarFonte, aplicarFonte };

