import Phaser from "phaser";
import { getModuleProgress } from "../achievements/tracker";
import { PANEL_NODES, PANEL_COLORS } from "./panelLayout";
import { ModuleChip } from "./ModuleChip";
import { CircuitBoard } from "./CircuitBoard";
import { ACHIEVEMENTS } from "../achievements/achievements";
import { showToast } from "../ui/Toast";

export default class PanelScene extends Phaser.Scene {
  constructor() { super("PanelScene"); }

  create() {
    const { width } = this.scale;

    // Fundo PCB + trilhas
    new CircuitBoard(this);

    this.add.text(24, 24, "Painel de Evolução", {
      fontSize: "26px", color: "#c8e9ff", fontFamily: "Arial, Helvetica, sans-serif"
    });

    // dica
    this.add.text(24, 56, "Complete conquistas para ativar módulos. Toque em um chip para ver progresso e atalhos do Codex.", {
      fontSize: "14px", color: "#8fb7d1"
    });

    const progress = getModuleProgress();

    // Instancia chips com níveis por threshold
    for (const node of PANEL_NODES) {
      const pts = progress[node.key] || 0;
      const t = node.thresholds;
      let lvl: 0|1|2|3 = 0;
      if      (pts >= (t[2] ?? Infinity)) lvl = 3;
      else if (pts >= (t[1] ?? Infinity)) lvl = 2;
      else if (pts >= (t[0] ?? Infinity)) lvl = 1;

      const chip = new ModuleChip(this, node, lvl);
      this.add.existing(chip);

      chip.on("pointerdown", () => {
        const list = ACHIEVEMENTS.filter(a => a.module === node.key);
        const unlockedIds = JSON.parse(localStorage.getItem("tech2048.achievements") || "{}").unlocked || {};
        const unlockedCount = list.filter(a => unlockedIds[a.id]).length;
        const lines = list.map(a => `${unlockedIds[a.id] ? "✅" : "⬜️"} ${a.name}`).join("\n");
        const color = `#${PANEL_COLORS[node.key].toString(16).padStart(6, "0")}`;
        showToast(this, `${node.title} — ${unlockedCount}/${list.length}\n${lines}`, 3200);
        this.tweens.add({ targets: chip, angle: { from: -1, to: 1 }, yoyo: true, duration: 100 });
      });
    }

    // botão para abrir Codex
    const btn = this.add.text(width - 24, 24, "Tech Codex ›", {
      fontSize: "16px", color: "#ffffff", backgroundColor: "#1b2a3a", padding: { left: 10, right: 10, top: 6, bottom: 6 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => this.scene.start("TechCodexScene"));
  }
}
