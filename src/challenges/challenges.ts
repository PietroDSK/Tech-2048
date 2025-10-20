export type ChallengeMod =
  | { type: "board_size"; w: number; h: number }
  | { type: "walls"; cells: {x:number,y:number}[] }
  | { type: "spawn_ratio"; fourPct: number }         // 0..25
  | { type: "ban_corner"; corner: "tl"|"tr"|"bl"|"br" }
  | { type: "move_limit"; maxMoves: number }
  | { type: "no_undo", value: true }
  | { type: "disable_overclock", value: true }
  | { type: "fog_of_war", value: true }
  | { type: "timer"; perMoveMs: number };

export type ChallengeGoal =
  | { kind: "reach_tile"; value: number }
  | { kind: "max_moves_le"; value: number }
  | { kind: "combo_n_times"; size: number; times: number }
  | { kind: "row_target"; row: "top"|"bottom"; value: number; count: number };

export type Challenge = {
  id: string;
  name: string;
  description: string;
  mods: ChallengeMod[];
  goals: ChallengeGoal[];
  reward: { modulePoints?: Partial<Record<"CPU"|"RAM"|"GPU"|"IO"|"NET"|"PSU", number>>; badgeId?: string };
  seed?: string;
  season?: string;
};

export const CHALLENGES: Challenge[] = [
  {
    id: "iron_core",
    name: "Iron Core",
    description: "5x5, sem undo, chegue em 2048 com ≤110 movimentos.",
    mods: [
      { type: "board_size", w: 5, h: 5 },
      { type: "no_undo", value: true },
      { type: "move_limit", maxMoves: 110 }
    ],
    goals: [
      { kind: "reach_tile", value: 2048 },
      { kind: "max_moves_le", value: 110 }
    ],
    reward: { modulePoints: { CPU: 10, PSU: 5 }, badgeId: "iron_core_badge" },
    seed: "IC-5x5-110"
  },
  {
    id: "blind_run",
    name: "Blind Run",
    description: "Fog of War, sem preview, alcance 1024.",
    mods: [
      { type: "fog_of_war", value: true },
      { type: "disable_overclock", value: true }
    ],
    goals: [ { kind: "reach_tile", value: 1024 } ],
    reward: { modulePoints: { GPU: 8, RAM: 4 }, badgeId: "blind_badge" }
  }
];
