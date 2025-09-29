// src/scenes/ModesScene.ts
import Phaser from "phaser";
import { theme } from "../theme";
import { t } from "../i18n";
import { hasUnlocked2048 } from "../storage";

export default class ModesScene extends Phaser.Scene {
  private unlocked!: boolean;

  constructor() {
    super("ModesScene");
  }

  create() {
    const { width, height } = this.scale;
    this.unlocked = hasUnlocked2048();
    this.cameras.main.setBackgroundColor(theme.bg);

    // Halo/painel
    const halo = this.add.graphics();
    halo.fillStyle(Phaser.Display.Color.HexStringToColor(theme.stroke).color, 0.12);
    halo.fillRoundedRect(width * 0.08, height * 0.12, width * 0.84, height * 0.76, 24);

    const title = this.add.text(width / 2, height * 0.18, t("modesTitle"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "36px",
      color: theme.hudTitle,
      fontStyle: "bold",
    }).setOrigin(0.5);
    title.setShadow(0, 0, theme.stroke, 16, true, true);

    const panel = this.add.graphics();
    const pw = width * 0.84, ph = height * 0.58;
    const px = (width - pw) / 2, py = height * 0.24;
    panel.fillStyle(Phaser.Display.Color.HexStringToColor(theme.panel).color, 1);
    panel.fillRoundedRect(px, py, pw, ph, 18);
    panel.lineStyle(1, Phaser.Display.Color.HexStringToColor(theme.stroke).color, 0.28);
    panel.strokeRoundedRect(px, py, pw, ph, 18);

    if (!this.unlocked) {
      this.add.text(width / 2, py + 28, t("locked"), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "16px",
        color: theme.hudSub,
      }).setOrigin(0.5);
    }

    const makeBtn = (y: number, label: string, onClick: () => void, enabled = true) => {
      const bgColor = enabled ? theme.hudTitle : "#3a2b54";
      const fgColor = enabled ? theme.tileTextDark : theme.tileTextLight;
      const btn = this.add.text(width / 2, y, label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "24px",
        color: fgColor,
        backgroundColor: bgColor,
        padding: { left: 24, right: 24, top: 12, bottom: 12 },
      }).setOrigin(0.5);

      btn.setShadow(0, 0, theme.stroke, 8, true, true);

      if (enabled) {
        btn.setInteractive({ useHandCursor: true });
        btn.on("pointerover", () => btn.setStyle({ backgroundColor: theme.stroke }));
        btn.on("pointerout",  () => btn.setStyle({ backgroundColor: theme.hudTitle }));
        btn.on("pointerdown", () => {
          this.tweens.add({ targets: btn, scale: 0.97, duration: 70, yoyo: true });
          onClick();
        });
      }
      return btn;
    };

    const enabled = this.unlocked;

    makeBtn(py + ph * 0.30, t("mode4096"),  () => this.scene.start("GameScene", { mode: "4096" }), enabled);
    makeBtn(py + ph * 0.50, t("modeEndless"), () => this.scene.start("GameScene", { mode: "endless" }), enabled);
    makeBtn(py + ph * 0.70, t("modeCustom"),  () => {
      if (!enabled) return;
      const sizeStr = prompt("Size (e.g., 4x4, 8x8, up to 16x16):", "8x8");
      if (!sizeStr) return;
      const m = sizeStr.toLowerCase().match(/^(\d{1,2})x(\d{1,2})$/);
      if (!m) return;
      const rows = Math.min(16, Math.max(2, parseInt(m[1], 10)));
      const cols = Math.min(16, Math.max(2, parseInt(m[2], 10)));
      this.scene.start("GameScene", { mode: "custom", rows, cols });
    }, enabled);

    // Voltar
    const back = this.add.text(width / 2, py + ph + 36, t("back"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: theme.hudSub,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on("pointerover", () => back.setColor(theme.hudTitle));
    back.on("pointerout",  () => back.setColor(theme.hudSub));
    back.on("pointerdown", () => this.scene.start("MenuScene"));
  }
}
