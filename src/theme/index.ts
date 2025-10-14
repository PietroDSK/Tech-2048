// src/theme/index.ts

export type ThemeKey = "neon-pcb" | "cyberpunk-magenta" | "ocean-cyan";

export type Theme = {
  key: ThemeKey;
  name: string;
  requires2048?: boolean;
  colors: {
    // plano de fundo e superfícies
    bg: string;            // cor de fundo da cena
    surface: string;       // tabuleiro (placa)
    surfaceAlt: string;    // caixas/overlays/cards
    // identidade / linhas / brilho
    primary: string;       // contornos e acento
    glow: string;          // cor para sombras/glow
    gridLine: string;      // linhas das células
    gridHighlight: string; // realce/moldura
    // texto
    text: string;
    textDim: string;
  };
  /** paleta dos tiles (2..2048). Hex string "#RRGGBB" */
  tilePalette: string[];
};

// ---------- Temas -------------------------------------------------------------

const pcb: Theme["colors"] = {
  // Fundo bem escuro, quase preto-azulado
  bg: "#080c14",
  // Superfície mais escura e azulada (anteriormente verde-petróleo)
  surface: "#0c1420",
  // Cartões/botões um pouco mais claro que a superfície
  surfaceAlt: "#101a28",
  // Primário: ciano elétrico, um pouco mais escuro
  primary: "#101a28",
  // Brilho: ciano forte e frio
  glow: "#1ec2ff",
  // Linha da grade: azul escuro e frio
  gridLine: "#1c2a38",
  // Destaque da grade: azul acinzentado frio
  gridHighlight: "#24405a",
  // Texto: branco azulado muito claro
  text: "#e0f8ff",
  // Texto fraco: ciano-acinzentado frio
  textDim: "#78b8cc",
};

const punk: Theme["colors"] = {
  // Fundo: roxo escuro, quase preto
  bg: "#0a0610",
  // Superfície: azul-marinho púrpura
  surface: "#100c1e",
  // Cartões/botões: um pouco mais claro
  surfaceAlt: "#140f25",
  // Primário: Roxo elétrico frio (magenta menos quente)
  primary: "#9d40ff",
  // Brilho: roxo mais vibrante
  glow: "#ad58ff",
  // Linha da grade: roxo escuro
  gridLine: "#211b30",
  // Destaque da grade: roxo acinzentado
  gridHighlight: "#302645",
  // Texto: branco-púrpura frio
  text: "#f0eaff",
  // Texto fraco: cinza-púrpura frio
  textDim: "#bfa0d9",
};

const ocean: Theme["colors"] = {
  // Fundo: azul-marinho muito escuro
  bg: "#040c12",
  // Superfície: azul profundo do oceano
  surface: "#07141f",
  // Cartões/botões: um pouco mais claro
  surfaceAlt: "#0a1b28",
  // Primário: Azul puro e profundo (menos ciano)
  primary: "#188bff",
  // Brilho: azul vibrante
  glow: "#30aaff",
  // Linha da grade: azul escuro e frio
  gridLine: "#14283c",
  // Destaque da grade: azul acinzentado profundo
  gridHighlight: "#204058",
  // Texto: branco-azul muito claro
  text: "#e4f8ff",
  // Texto fraco: azul-claro suave e frio
  textDim: "#8ccce0",
};

export const themes: Record<ThemeKey, Theme> = {
  "neon-pcb": {
    key: "neon-pcb",
    name: "Neon PCB",
    colors: pcb, // Mantendo a variável de cores principal 'pcb'
    // Paleta de cores alterada para cianos e azuis mais frios e profundos
    tilePalette: [
      "#00FFFF", "#00E0E0", "#00C0C0", "#00A0A0", "#008080",
      "#006060", "#004040", "#002020", "#001010", "#000808", "#000404",
    ],
  },
  "cyberpunk-magenta": {
    key: "cyberpunk-magenta",
    name: "Cyberpunk Magenta",
    requires2048: true,
    colors: punk, // Mantendo a variável de cores principal 'punk'
    // Paleta de cores alterada para tons de roxo e azul-púrpura mais frios
    tilePalette: [
      "#5D3FD3", "#4A2FCB", "#381FC3", "#250FBB", "#1300B3",
      "#0B0096", "#07007A", "#03005D", "#000041", "#000025", "#00000C",
    ],
  },
  "ocean-cyan": {
    key: "ocean-cyan",
    name: "Ocean Cyan",
    colors: ocean, // Mantendo a variável de cores principal 'ocean'
    // Paleta de cores alterada para tons de azul e ciano-esverdeado muito frios e oceânicos
    tilePalette: [
      "#1E90FF", "#00BFFF", "#00CED1", "#20B2AA", "#48D1CC",
      "#40E0D0", "#6495ED", "#ADD8E6", "#B0E0E6", "#F0F8FF", "#FFFFFF",
    ],
  },
};

// ---------- Seleção/persistência ---------------------------------------------

const LS_KEY = "t2048_theme_key";
let currentKey: ThemeKey =
  (typeof localStorage !== "undefined" &&
    (localStorage.getItem(LS_KEY) as ThemeKey)) || "neon-pcb";

export function setThemeKey(key: ThemeKey) {
  if (!themes[key]) return;
  currentKey = key;
  try { localStorage.setItem(LS_KEY, key); } catch {}
}

export function getTheme(): Theme {
  return themes[currentKey] || themes["neon-pcb"];
}

// ---------- Paleta por valor --------------------------------------------------

const valueToIndex: Record<number, number> = {
  2:0,4:1,8:2,16:3,32:4,64:5,128:6,256:7,512:8,1024:9,2048:10
};

function clampIndex(len: number, idx: number) {
  return Math.max(0, Math.min(len - 1, idx));
}

/** Cor HEX do tile no tema atual */
export function getTileColor(value: number): string {
  const { tilePalette } = getTheme();
  const idx = valueToIndex[value] ?? tilePalette.length - 1;
  return tilePalette[clampIndex(tilePalette.length, idx)];
}

/** Útil para preview de temas sem trocar o atual */
export function getTileColorForKey(key: ThemeKey, value: number): string {
  const t = themes[key] || themes["neon-pcb"];
  const idx = valueToIndex[value] ?? t.tilePalette.length - 1;
  return t.tilePalette[clampIndex(t.tilePalette.length, idx)];
}
