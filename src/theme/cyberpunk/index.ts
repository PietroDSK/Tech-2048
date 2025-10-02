// src/themes/cyberpunk.ts
import type { Theme } from "../neon-pcp";

export const cyberpunkTheme: Theme = {
  key: "cyberpunk-magenta",
  name: "Cyberpunk Magenta",
  colors: {
    bg: "#0a0812",
    bgAlt: "#0e0a1a",
    surface: "#151026",
    surfaceAlt: "#1e1535",
    text: "#ffe6ff",
    textDim: "#d2a6e8",

    primary: "#ff00e5",
    secondary: "#66e6ff",
    accent: "#00ffc3",
    info: "#9ad9ff",
    success: "#7dffa3",
    warning: "#ffd166",
    danger: "#ff4d6d",

    gridLine: "#332347",
    gridHighlight: "#4a2d6b",
    glow: "#ff00e58c",      // rgba-ish via hex+a
    shadow: "#0000008c",
  },
};

const tileScale = [
  "#1c0f2e",
  "#2f1744",
  "#421f5e",
  "#5a1d7a",
  "#7b1fa2",
  "#9c27b0",
  "#c2185b",
  "#e91e63",
  "#ff4081",
  "#ff77ff",
  "#ffd1ff",
  "#7dffa3",
  "#00ffc3",
];

export function getTileColor(value: number): string {
  if (value <= 1) return tileScale[0];
  const idx = Math.min(Math.log2(value), 12);
  return tileScale[Math.max(1, Math.floor(idx))];
}
