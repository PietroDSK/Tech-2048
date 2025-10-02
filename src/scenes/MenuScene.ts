// src/scenes/MenuScene.ts
import Phaser from "phaser";
import { getTheme } from "../theme/index";
import { t } from "../i18n";
import { enterWithSwap, swapTo } from "../animations/transitions";
import { UIButton, mapThemeToButtonTheme } from "../ui/Button";

export default class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create(data: any) {
    const theme = getTheme();
    const uiTheme = mapThemeToButtonTheme(theme.colors);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(theme.colors.bg);
    enterWithSwap(this, data);

    const halo = this.add.graphics();
    halo.fillStyle(Phaser.Display.Color.HexStringToColor(theme.colors.glow).color, 0.22);
    halo.fillRoundedRect(width * 0.08, height * 0.12, width * 0.84, height * 0.76, 24);

    const title = this.add.text(width / 2, height * 0.20, "TECH-2048", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "44px",
      color: theme.colors.text,
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5).setDepth(5);
    title.setShadow(0, 0, theme.colors.glow, 18, true, true);

    this.add.text(width / 2, height * 0.26, t("title"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: theme.colors.textDim,
    }).setOrigin(0.5).setAlpha(0.95).setDepth(5);

    const panel = this.add.graphics().setDepth(4);
    const pw = width * 0.84, ph = height * 0.56;
    const px = (width - pw) / 2, py = height * 0.30;
    panel.fillStyle(Phaser.Display.Color.HexStringToColor(theme.colors.surface).color, 1);
    panel.fillRoundedRect(px, py, pw, ph, 18);
    panel.lineStyle(1, Phaser.Display.Color.HexStringToColor(theme.colors.primary).color, 0.28);
    panel.strokeRoundedRect(px, py, pw, ph, 18);

    const y1 = py + ph * 0.22;
    const y2 = py + ph * 0.44;
    const y3 = py + ph * 0.66;
    const y4 = py + ph * 0.88;

    const btnClassic = new UIButton(this, {
      x: width/2, y: y1, label: t("playClassic"),
      variant: "primary", size: "lg", theme: uiTheme,
      onClick: () => swapTo(this, "GameScene", { mode: "classic" }, "right")
    });
    const btnOther = new UIButton(this, {
      x: width/2, y: y2, label: t("otherModes"),
      variant: "secondary", size: "lg", theme: uiTheme,
      onClick: () => swapTo(this, "ModesScene", {}, "right")
    });
    const btnThemes = new UIButton(this, {
      x: width/2, y: y3, label: "Temas",
      variant: "secondary", size: "lg", theme: uiTheme,
      onClick: () => swapTo(this, "ThemeScene", {}, "right")
    });
    const btnOptions = new UIButton(this, {
      x: width/2, y: y4, label: t("options"),
      variant: "ghost", size: "lg", theme: uiTheme,
      onClick: () => swapTo(this, "OptionsScene", {}, "right")
    });

    const exit = new UIButton(this, {
      x: width/2, y: py + ph + 50, label: t("exit"),
      variant: "ghost", size: "md", theme: uiTheme,
      onClick: () => {
        const ok = confirm(t("confirmExit"));
        if (ok) { try { (window as any).close?.(); } catch {} this.game.destroy(true); }
      }
    });
    exit.setDepth(5);

    // animação de entrada
    const items = [btnClassic, btnOther, btnThemes, btnOptions, exit];
    [title, panel, ...items].forEach((o, i) => {
      o.setAlpha(0); (o as any).y += 16;
      this.tweens.add({ targets: o, alpha: 1, y: (o as any).y - 16, duration: 260, ease: "Cubic.Out", delay: i * 40 });
    });

    // halo pulso sutil
    this.tweens.add({ targets: halo, alpha: { from: 0.18, to: 0.28 }, duration: 1500, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }
}
