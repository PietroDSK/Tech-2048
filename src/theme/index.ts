// src/themes/index.ts
import { getSettings, saveSettings } from "../storage";
import { theme as neonPcbTheme, getTileColor as getTileColorPCB } from "./neon-pcp/";
import { cyberpunkTheme, getTileColor as getTileColorCyber } from "./cyberpunk/";


export const themes = {
  [neonPcbTheme.key]: neonPcbTheme,
  [cyberpunkTheme.key]: cyberpunkTheme,
};

export function getTheme() {
  const key = getSettings().themeKey;
  return themes[key] ?? neonPcbTheme;
}

export function listThemes() {
  return Object.values(themes).map(t => ({ key: t.key, name: t.name }));
}

export function setThemeKey(key: string) {
  const s = getSettings();
  s.themeKey = themes[key] ? key : neonPcbTheme.key;
  saveSettings(s);
}

export function getTileColor(value: number): string {
  const key = getSettings().themeKey;
  if (key === cyberpunkTheme.key) return getTileColorCyber(value);
  return getTileColorPCB(value);
}

export function getTileColorForKey(themeKey: string, value: number): string {
  if (themeKey === cyberpunkTheme.key) return getTileColorCyber(value);
  // default
  return getTileColorPCB(value);
}
