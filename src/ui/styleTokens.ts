// Paleta base "tech" aplicada por cima do tema atual (sem substituir o tema)
export const Ui = {
  radius: 18,
  padding: 12,
  gridRadius: 22,
  tileRadius: 20,
  fontFamily:
    'Exo, Orbitron, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
};

export type BadgeOpts = {
  x: number; y: number;
  label: string; value: string | number;
  visible?: boolean;
};
