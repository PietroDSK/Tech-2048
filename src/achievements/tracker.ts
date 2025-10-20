// Salva/consulta progresso e expõe helpers para desbloquear, pontuar e medir módulos.

import { ACHIEVEMENTS, ModuleKey } from "./achievements";

const KEY = "tech2048.achievements";
const KEY_POINTS = "tech2048.achievementPoints";

export type AchievementState = {
  unlocked: Record<string, string>; // id -> ISO date
};

function loadState(): AchievementState {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return { unlocked: {} };
  }
}

function saveState(st: AchievementState) {
  localStorage.setItem(KEY, JSON.stringify(st));
}

export function listUnlockedIds(): string[] {
  const st = loadState();
  return Object.keys(st.unlocked || {});
}

export function isUnlocked(id: string): boolean {
  const st = loadState();
  return !!st.unlocked?.[id];
}

export function unlock(id: string): boolean {
  if (isUnlocked(id)) return false;
  const st = loadState();
  st.unlocked = st.unlocked || {};
  st.unlocked[id] = new Date().toISOString();
  saveState(st);

  // soma pontuação
  const all = ACHIEVEMENTS.find(a => a.id === id);
  const curr = Number(localStorage.getItem(KEY_POINTS) || "0");
  localStorage.setItem(KEY_POINTS, String(curr + (all?.points || 0)));

  return true;
}

export function getTotalPoints(): number {
  return Number(localStorage.getItem(KEY_POINTS) || "0");
}

export function getModuleProgress(): Record<ModuleKey, number> {
  // soma pontos por módulo
  const res: Record<ModuleKey, number> = {
    CPU: 0, RAM: 0, GPU: 0, IO: 0, NET: 0, PSU: 0,
  };
  const ids = new Set(listUnlockedIds());
  for (const a of ACHIEVEMENTS) {
    if (ids.has(a.id)) res[a.module] += a.points;
  }
  return res;
}
