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
  bg: "#0b1220",
  surface: "#0f1a28",       // azul petróleo (tabuleiro)
  surfaceAlt: "#0f1e2b",    // cartões/botões (um pouco mais claro)
  primary: "#19dfff",       // ciano
  glow: "#0fd3ff",
  gridLine: "#1a2b3b",
  gridHighlight: "#28485f",
  text: "#e6fbff",
  textDim: "#84d9f2",
};

const punk: Theme["colors"] = {
  bg: "#0d0712",
  surface: "#151022",
  surfaceAlt: "#1a1426",
  primary: "#ff2bd6",
  glow: "#ff58e5",
  gridLine: "#2b1f3a",
  gridHighlight: "#3a2a4f",
  text: "#fbeaff",
  textDim: "#d3b2ea",
};

const ocean: Theme["colors"] = {
  bg: "#071019",
  surface: "#0b1824",
  surfaceAlt: "#0f1f2c",
  primary: "#3ae2ff",
  glow: "#2dd9ff",
  gridLine: "#183245",
  gridHighlight: "#28506b",
  text: "#e8fbff",
  textDim: "#9ed9ee",
};

export const themes: Record<ThemeKey, Theme> = {
  "neon-pcb": {
    key: "neon-pcb",
    name: "Neon PCB",
    colors: pcb,
    tilePalette: [
      "#1fd1d1", "#20e3c2", "#26f0a4", "#3efc7a", "#7bff66",
      "#a7ff4a", "#d6ff3b", "#fff83b", "#ffe03b", "#ffc13b", "#ffa43b",
    ],
  },
  "cyberpunk-magenta": {
    key: "cyberpunk-magenta",
    name: "Cyberpunk Magenta",
    requires2048: true,
    colors: punk,
    tilePalette: [
      "#9a4dff","#b14dff","#ca4dff","#e44dff","#ff4df7",
      "#ff4dd8","#ff4db8","#ff4d98","#ff4d78","#ff4d58","#ff4d38",
    ],
  },
  "ocean-cyan": {
    key: "ocean-cyan",
    name: "Ocean Cyan",
    colors: ocean,
    tilePalette: [
      "#2fc6ff","#35d2ff","#3be0ff","#41ecff","#6af2ff",
      "#8ff7ff","#b3fbff","#cdfcff","#e0fdff","#f1feff","#ffffff",
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
