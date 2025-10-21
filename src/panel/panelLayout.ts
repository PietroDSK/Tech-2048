import { ModuleKey } from "../achievements/achievements";

export type PanelNode = {
  key: ModuleKey;
  x: number; // 0..1
  y: number; // 0..1
  title: string;
  thresholds: number[];
};

export const PANEL_NODES: PanelNode[] = [
  { key: "CPU", title: "CPU Core", x: 0.50, y: 0.22, thresholds: [25, 40, 60] },
  { key: "RAM", title: "Memory Bank", x: 0.24, y: 0.40, thresholds: [15, 30, 45] },
  { key: "GPU", title: "Graphics Unit", x: 0.76, y: 0.40, thresholds: [15, 30, 45] },
  { key: "IO",  title: "I/O Bus",     x: 0.24, y: 0.72, thresholds: [10, 20, 30] },
  { key: "NET", title: "Net Uplink",  x: 0.76, y: 0.72, thresholds: [10, 20, 30] },
  { key: "PSU", title: "Power Unit",  x: 0.50, y: 0.88, thresholds: [10, 20, 35] },
];

/**
 * Conexões diretas entre módulos (linhas retas simples)
 * Cada conexão é [origem, destino]
 */
export const PANEL_CONNECTIONS: Array<[ModuleKey, ModuleKey]> = [
  // CPU conecta a RAM e GPU
  ["CPU", "RAM"],
  ["CPU", "GPU"],

  // RAM e GPU conectam aos seus barramentos
  ["RAM", "IO"],
  ["GPU", "NET"],

  // IO e NET conectam ao PSU
  ["IO", "PSU"],
  ["NET", "PSU"],
];

export const PANEL_COLORS: Record<ModuleKey, number> = {
  CPU: 0x3be3ff,
  RAM: 0x9be35a,
  GPU: 0xff7ae6,
  IO:  0xffd166,
  NET: 0x66b3ff,
  PSU: 0xff8b66,
};
