// Progressão derivada do Painel (pontos por módulo) -> perks ativos no jogo
// Integre isto ao seu tracker real se já tiver: aqui usamos localStorage “tech2048.achievements” como base.

export type ModuleKey = "CPU" | "RAM" | "GPU" | "IO" | "NET" | "PSU";

export type ActiveUpgrades = {
  scoreBonusPct: number;    // bônus cumulativo de score (capado)
  undoExtra: number;        // undos extras iniciais (0..2)
  safeSpawnPct: number;     // % chance de escolher célula "segura"
  ghostPreview: boolean;    // GPU: prévia de movimento
  overclockCharges: number; // CPU: cargas de overclock por partida (1..2)
  secondChance: boolean;    // PSU: 1x salvar do game over criando 1 espaço
  spawnFourBiasPct: number; // IO: leve viés para surgir 4
  fluxGainPerMove: number;  // IO: (gancho para medidor de fluxo – não usado aqui)
  surgeOnMilestones: boolean; // PSU: após 1024/2048, próximo spawn é 4
};

// Você já deve ter algo que agregue pontos por módulo.
// Para exemplo, somamos pontos de conquistas guardadas no localStorage.
function getModulePoints(): Record<ModuleKey, number> {
  try {
    const raw = JSON.parse(localStorage.getItem("tech2048.achievements") || "{}");
    // raw.unlocked: { id: "date" }
    // Vamos mapear ids -> módulos/pontos se você tiver essa tabela em outro lugar.
    // Como fallback, considere 0 para tudo.
  } catch {}
  // Em produção, substitua por sua função real (ex.: getModuleProgress do seu tracker).
  return { CPU: 0, RAM: 0, GPU: 0, IO: 0, NET: 0, PSU: 0 };
}

// Pequeno helper de tier
function tier(points: number, t: number[]) { // retorna 0..3
  let lvl = 0;
  if (points >= (t[2] ?? 1e9)) lvl = 3;
  else if (points >= (t[1] ?? 1e9)) lvl = 2;
  else if (points >= (t[0] ?? 1e9)) lvl = 1;
  return lvl;
}

export function computeUpgrades(): ActiveUpgrades {
  // Se você já possui getModuleProgress() real, use-o aqui:
  // const mod = getModuleProgress();
  // Para este drop-in, chamamos getModulePoints() acima (placeholder).
  const mod = getModulePoints();

  const cpuT = tier(mod.CPU, [25, 40, 60]);
  const ramT = tier(mod.RAM, [15, 30, 45]);
  const gpuT = tier(mod.GPU, [15, 30, 45]);
  const ioT  = tier(mod.IO,  [10, 20, 30]);
  const netT = tier(mod.NET, [10, 20, 30]);
  const psuT = tier(mod.PSU, [10, 20, 35]);

  let scoreBonusPct = 0;
  scoreBonusPct += cpuT * 2; // +2% por tier de CPU
  scoreBonusPct += netT * 1; // +1% por tier de NET
  if (scoreBonusPct > 12) scoreBonusPct = 12;

  return {
    scoreBonusPct,
    undoExtra: Math.min(ramT, 2),
    safeSpawnPct: [0, 2, 4, 6][ramT],
    ghostPreview: gpuT >= 1,
    overclockCharges: Math.min(1 + Math.floor(cpuT / 2), 2), // 1..2
    secondChance: psuT >= 2,
    spawnFourBiasPct: [0, 1, 2, 3][ioT],
    fluxGainPerMove: [0, 1, 2, 3][ioT],
    surgeOnMilestones: psuT >= 1,
  };
}

export type { ActiveUpgrades as Upgrades };
