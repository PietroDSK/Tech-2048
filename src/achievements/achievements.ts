// Definição das conquistas e metadados de "módulo" do painel

export type ModuleKey = "CPU" | "RAM" | "GPU" | "IO" | "NET" | "PSU";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  module: ModuleKey;
  points: number; // para somar progresso geral do painel
  // dica educacional atrelada (aparece no Tech Codex quando desbloqueado)
  codexId?: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "reach_512",
    name: "Boot Sequence",
    description: "Alcance o bloco 512 no modo clássico.",
    module: "PSU",
    points: 10,
    codexId: "powers_of_two",
  },
  {
    id: "reach_1024",
    name: "RAM Warm-up",
    description: "Alcance o bloco 1024 no modo clássico.",
    module: "RAM",
    points: 15,
    codexId: "binary_intro",
  },
  {
    id: "reach_2048",
    name: "Active Core",
    description: "Alcance o bloco 2048 no modo clássico.",
    module: "CPU",
    points: 25,
    codexId: "cpu_basics",
  },
  {
    id: "no_undo_win",
    name: "Pure Skill",
    description: "Vença sem usar undo.",
    module: "GPU",
    points: 15,
    codexId: "gpu_shaders",
  },
  {
    id: "combo_three",
    name: "Data Burst",
    description: "Faça 3 merges no mesmo movimento.",
    module: "IO",
    points: 10,
    codexId: "io_buses",
  },
  {
    id: "rank_submit",
    name: "Uplink",
    description: "Envie sua primeira pontuação ao ranking.",
    module: "NET",
    points: 10,
    codexId: "net_latency",
  },
];

export function getAchievementById(id: string) {
  return ACHIEVEMENTS.find(a => a.id === id)!;
}
