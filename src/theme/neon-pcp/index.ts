// src/theme.ts
// Neon PCB — azul/ciano/verde com cobre (trilhas)
export type Theme = {
  key: string;
  name: string;
  colors: {
    bg: string;
    bgAlt: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textDim: string;

    primary: string;   // Neon Blue
    secondary: string; // Neon Green
    accent: string;    // Copper
    info: string;
    success: string;
    warning: string;
    danger: string;

    gridLine: string;
    gridHighlight: string;
    glow: string;
    shadow: string;
  };
};

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");
  const base = hex.replace("#", "");
  return `#${base}${a}`;
}

export const theme: Theme = {
  key: "neon-pcb",
  name: "Neon PCB",
  colors: {
    bg: "#0A0F1C",
    bgAlt: "#0D1426",
    surface: "#12192B",
    surfaceAlt: "#1B2740",
    text: "#E6F7FF",
    textDim: "#9FB3C8",

    primary: "#00F0FF",
    secondary: "#00FF88",
    accent: "#FF6F00",
    info: "#45B7FF",
    success: "#00E676",
    warning: "#FFC400",
    danger: "#FF4D4D",

    gridLine: "#1F2B47",
    gridHighlight: "#27406B",
    glow: withAlpha("#00F0FF", 0.55),
    shadow: withAlpha("#000000", 0.55),
  },
};

const tileScale = [
  "#0E162B", // base
  "#00A9FF", // 2
  "#00E0FF", // 4
  "#00FFDD", // 8
  "#00FF88", // 16
  "#66FF66", // 32
  "#A6FF00", // 64
  "#FFD200", // 128
  "#FF9E00", // 256
  "#FF6F00", // 512
  "#FF4D00", // 1024
  "#FF2E63", // 2048
  "#B300FF", // 4096+
];

export function getTileColor(value: number): string {
  if (value <= 1) return tileScale[0];
  const idx = Math.min(Math.log2(value), 12);
  return tileScale[Math.max(1, Math.floor(idx))];
}

export default theme;
