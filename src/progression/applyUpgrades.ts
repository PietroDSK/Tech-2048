import type { ActiveUpgrades } from "./upgrades";

export function applySpawnLogic(
  baseSpawn: 2 | 4,
  gridFillPct: number,
  u: ActiveUpgrades,
  force4: boolean
): 2 | 4 {
  if (force4) return 4;

  let result: 2 | 4 = baseSpawn;

  // IO: leve viés para 4
  if (Math.random() * 100 < u.spawnFourBiasPct) result = 4;

  // PSU: se tabuleiro ~lotado e saiu 2, pequena chance virar 4
  if (gridFillPct >= 0.8 && result === 2) {
    if (Math.random() * 100 < 1 + u.spawnFourBiasPct) result = 4;
  }

  return result;
}

export function applyScore(
  baseMergeValue: number,
  u: ActiveUpgrades,
  inStreak: boolean,
  overclockThisMove: boolean
): number {
  let mult = 1 + u.scoreBonusPct / 100;
  if (inStreak) mult *= 1.02;          // bônus leve para sequência de merges em jogadas seguidas
  if (overclockThisMove) mult *= 1.15; // overclock buff só nesta jogada
  return Math.floor(baseMergeValue * mult);
}
