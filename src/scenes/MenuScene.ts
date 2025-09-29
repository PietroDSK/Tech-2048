// src/scenes/MenuScene.ts
import Phaser from "phaser";
import { theme } from "../theme";
import { t } from "../i18n";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(theme.bg);

    // Halo de fundo
    const halo = this.add.graphics();
    halo.fillStyle(Phaser.Display.Color.HexStringToColor(theme.stroke).color, 0.12);
    halo.fillRoundedRect(width * 0.08, height * 0.12, width * 0.84, height * 0.76, 24);

    // Título
    const title = this.add.text(width / 2, height * 0.20, "TECH-2048", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "44px",
      color: theme.hudTitle,
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);
    title.setShadow(0, 0, theme.stroke, 18, true, true);

    // Sub
    this.add.text(width / 2, height * 0.26, t("title"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: theme.hudSub,
    }).setOrigin(0.5).setAlpha(0.95);

    // Painel central
    const panel = this.add.graphics();
    const pw = width * 0.84, ph = height * 0.52;
    const px = (width - pw) / 2, py = height * 0.30;
    panel.fillStyle(Phaser.Display.Color.HexStringToColor(theme.panel).color, 1);
    panel.fillRoundedRect(px, py, pw, ph, 18);
    panel.lineStyle(1, Phaser.Display.Color.HexStringToColor(theme.stroke).color, 0.28);
    panel.strokeRoundedRect(px, py, pw, ph, 18);

    // Botões
    const makeBtn = (y: number, label: string, onClick: () => void) => {
      const btn = this.add.text(width / 2, y, label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "26px",
        color: theme.tileTextDark,
        backgroundColor: theme.hudTitle,
        padding: { left: 28, right: 28, top: 14, bottom: 14 },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.setShadow(0, 0, theme.stroke, 10, true, true);

      btn.on("pointerover", () =>
        btn.setStyle({ backgroundColor: theme.stroke })
      );
      btn.on("pointerout", () =>
        btn.setStyle({ backgroundColor: theme.hudTitle })
      );
      btn.on("pointerdown", () => {
        this.tweens.add({ targets: btn, scale: 0.96, duration: 70, yoyo: true });
        onClick();
      });
      return btn;
    };

    makeBtn(py + ph * 0.25, t("playClassic"), () => this.scene.start("GameScene", { mode: "classic" }));
    makeBtn(py + ph * 0.45, t("otherModes"), () => this.scene.start("ModesScene"));
    makeBtn(py + ph * 0.65, t("options"), () => this.scene.start("OptionsScene"));

    // “Sair”
    const exit = this.add.text(width / 2, py + ph + 40, t("exit"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: theme.hudSub,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    exit.on("pointerover", () => exit.setColor(theme.hudTitle));
    exit.on("pointerout", () => exit.setColor(theme.hudSub));
    exit.on("pointerdown", () => {
      const ok = confirm(t("confirmExit"));
      if (ok) {
        try { (window as any).close?.(); } catch {}
        this.game.destroy(true);
      }
    });
  }
}
