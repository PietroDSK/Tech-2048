// src/theme/index.ts

// =====================
// Tipos
// =====================
export type ThemeKey = "neon-pcb" | "cyberpunk-magenta" | "ocean-cyan";
export type ThemeName = ThemeKey; // compat

export type Theme = {
  key: ThemeKey;
  name: string;
  requires2048?: boolean;
  colors: {
    // plano de fundo e superfícies
    bg: string;         // cor de fundo da cena
    surface: string;    // tabuleiro (placa)
    surfaceAlt: string; // cartões/botões (um pouco mais claro p/ botões)
    // identidade / linhas / brilho
    primary: string;       // contornos/acento (um pouco mais claro)
    glow: string;          // cor para sombras/glow
    gridLine: string;      // linhas das células
    gridHighlight: string; // realce/moldura
    // texto
    text: string;
    textDim: string;
  };
  /** Paleta fixa (2..2048) — cores sólidas escuras→claras */
  tilePalette: string[];
};

// =====================
// Cores base dos temas
// (surfaceAlt e primary ligeiramente mais claros p/ botões)
// =====================
const pcb: Theme["colors"] = {
  bg:            "#080c14",
  surface:       "#0c1420",
  surfaceAlt:    "#132235", // ↑
  primary:       "#1ec2ff", // ↑
  glow:          "#6bd8ff",
  gridLine:      "#1c2a38",
  gridHighlight: "#2a4a66",
  text:          "#e0f8ff",
  textDim:       "#8ac6da",
};

const punk: Theme["colors"] = {
  bg:            "#0a0610",
  surface:       "#100c1e",
  surfaceAlt:    "#1b1433", // ↑
  primary:       "#b068ff", // ↑
  glow:          "#d19eff",
  gridLine:      "#211b30",
  gridHighlight: "#3a2e57",
  text:          "#f0eaff",
  textDim:       "#c9b4e3",
};

const ocean: Theme["colors"] = {
  bg:            "#040c12",
  surface:       "#07141f",
  surfaceAlt:    "#0f2434", // ↑
  primary:       "#2fa0ff", // ↑
  glow:          "#66c1ff",
  gridLine:      "#14283c",
  gridHighlight: "#2a4a66",
  text:          "#e4f8ff",
  textDim:       "#9ed7ea",
};

// =====================
// Paletas FIXAS (sólidas) — escuras → claras (11 passos)
// índice 0 = valor 2, índice 10 = 2048
// =====================
const PCB_TILE_PALETTE = [
  "#0a2333", "#0e2e45", "#123957", "#154469", "#19507c",
  "#1d5b8e", "#2066a0", "#2774b4", "#3b8cc8", "#66b8e0", "#9fe6ff",
];
const PUNK_TILE_PALETTE = [
  "#1a0033", "#220544", "#2b0b56", "#351368", "#401b7a",
  "#4c278d", "#5835a0", "#644db4", "#7e6fca", "#a79ae3", "#e2c8ff",
];
const OCEAN_TILE_PALETTE = [
  "#0a1e2b", "#0d2736", "#103042", "#123a4e", "#15445a",
  "#185066", "#1a5a73", "#1f6b88", "#2a86a6", "#56b7d1", "#bfeaff",
];

// =====================
// Catálogo de temas
// =====================
export const themes: Record<ThemeKey, Theme> = {
  "neon-pcb": {
    key: "neon-pcb",
    name: "Neon PCB",
    colors: pcb,
    tilePalette: PCB_TILE_PALETTE,
  },
  "cyberpunk-magenta": {
    key: "cyberpunk-magenta",
    name: "Cyberpunk Magenta",
    requires2048: true,
    colors: punk,
    tilePalette: PUNK_TILE_PALETTE,
  },
  "ocean-cyan": {
    key: "ocean-cyan",
    name: "Ocean Cyan",
    colors: ocean,
    tilePalette: OCEAN_TILE_PALETTE,
  },
};

// =====================
// Persistência e seleção
// =====================
const LS_KEY = "t2048_theme_key";
let currentKey: ThemeKey =
  (typeof localStorage !== "undefined" &&
    (localStorage.getItem(LS_KEY) as ThemeKey)) || "neon-pcb";

export function setThemeKey(key: ThemeKey) {
  if (!themes[key]) return;
  currentKey = key;
  try { localStorage.setItem(LS_KEY, key); } catch {}
}
export function getThemeKey(): ThemeKey { return currentKey; }
export function getTheme(): Theme { return themes[currentKey] || themes["neon-pcb"]; }
export function getAllThemes(): Theme[] { return Object.values(themes); }
export function getThemeKeys(): ThemeKey[] { return Object.keys(themes) as ThemeKey[]; }
export function getThemeByKey(key: ThemeKey): Theme { return themes[key] || themes["neon-pcb"]; }

// =====================
// Compat antiga
// =====================
export function setThemeName(name: ThemeName) { setThemeKey(name as ThemeKey); }
export function getThemeName(): ThemeName { return getThemeKey(); }

// =====================
// Paleta por valor
// =====================
const valueToIndex: Record<number, number> = {
  2:0,4:1,8:2,16:3,32:4,64:5,128:6,256:7,512:8,1024:9,2048:10
};
function clampIndex(len: number, idx: number) { return Math.max(0, Math.min(len - 1, idx)); }

export function getTileColor(value: number, themeKey?: ThemeKey): string {
  const t = themeKey ? getThemeByKey(themeKey) : getTheme();
  const idx = valueToIndex[value] ?? t.tilePalette.length - 1;
  return t.tilePalette[clampIndex(t.tilePalette.length, idx)];
}
export function getTileColorForKey(key: ThemeKey, value: number): string {
  const t = getThemeByKey(key);
  const idx = valueToIndex[value] ?? t.tilePalette.length - 1;
  return t.tilePalette[clampIndex(t.tilePalette.length, idx)];
}
export function getTileColorForName(name: ThemeName, value: number): string {
  return getTileColorForKey(name as ThemeKey, value);
}
