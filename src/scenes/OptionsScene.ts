// src/scenes/OptionsScene.ts
import Phaser from "phaser";
import { getTheme } from "../theme";
import { getSettings, saveSettings, resetProgress } from "../storage";
import { enterWithSwap, swapTo } from "../animations/transitions";
import { UIButton, mapThemeToButtonTheme } from "../ui/Button";
import { BackButton } from "../ui/BackButton";

export default class OptionsScene extends Phaser.Scene {
  constructor() { super("OptionsScene"); }

  create(data: any) {
    const theme = getTheme();
    const uiTheme = mapThemeToButtonTheme(theme.colors);
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(theme.colors.bg);
    enterWithSwap(this, data);

    new BackButton(this, 50, 26, "Menu");

    const halo = this.add.graphics();
    halo.fillStyle(Phaser.Display.Color.HexStringToColor(theme.colors.glow).color, 0.22);
    halo.fillRoundedRect(width * 0.06, height * 0.08, width * 0.88, height * 0.84, 24);

    const title = this.add.text(width/2, height*0.14, "Opções", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "36px",
      color: theme.colors.text,
      fontStyle: "bold"
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    const pw = width * 0.84, ph = height * 0.64;
    const px = (width - pw) / 2, py = height * 0.20;
    panel.fillStyle(Phaser.Display.Color.HexStringToColor(theme.colors.surface).color, 1);
    panel.fillRoundedRect(px, py, pw, ph, 18);
    panel.lineStyle(1, Phaser.Display.Color.HexStringToColor(theme.colors.primary).color, 0.28);
    panel.strokeRoundedRect(px, py, pw, ph, 18);

    const s = getSettings();

    // linha 1 — Som
    this.add.text(px + 28, py + ph*0.22, "Som", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: theme.colors.textDim
    });

    const btnSound = new UIButton(this, {
      x: px + pw - 120, y: py + ph*0.22,
      label: s.sound ? "Ligado" : "Desligado",
      variant: s.sound ? "primary" : "secondary",
      size: "md",
      theme: uiTheme,
      onClick: () => {
        const cur = getSettings();
        const next = { ...cur, sound: !cur.sound };
        saveSettings(next);
        btnSound.setLabel(next.sound ? "Ligado" : "Desligado");
        btnSound.setVariant(next.sound ? "primary" : "secondary");
      }
    });

    // linha 2 — Animações
    this.add.text(px + 28, py + ph*0.38, "Animações", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: theme.colors.textDim
    });

    const btnAnim = new UIButton(this, {
      x: px + pw - 120, y: py + ph*0.38,
      label: s.animations ? "Ligadas" : "Desligadas",
      variant: s.animations ? "primary" : "secondary",
      size: "md",
      theme: uiTheme,
      onClick: () => {
        const cur = getSettings();
        const next = { ...cur, animations: !cur.animations };
        saveSettings(next);
        btnAnim.setLabel(next.animations ? "Ligadas" : "Desligadas");
        btnAnim.setVariant(next.animations ? "primary" : "secondary");
      }
    });

    // linha 3 — Reset progresso
    const btnReset = new UIButton(this, {
      x: width/2, y: py + ph*0.62,
      label: "Redefinir Progresso",
      variant: "danger", size: "md",
      theme: uiTheme,
      onClick: () => {
        if (confirm("Tem certeza que deseja apagar o progresso?")) {
          resetProgress();
          alert("Progresso apagado.");
        }
      }
    });

    // linha 4 — Voltar / Menu
    const btnMenu = new UIButton(this, {
      x: width/2, y: py + ph*0.82,
      label: "Menu",
      variant: "ghost", size: "lg",
      theme: uiTheme,
      onClick: () => swapTo(this, "MenuScene", {}, "left")
    });

    // entrada suave
    [title, panel, btnSound, btnAnim, btnReset, btnMenu].forEach((o, i) => {
      (o as any).alpha = 0; (o as any).y += 16;
      this.tweens.add({ targets: o, alpha: 1, y: (o as any).y - 16, duration: 220, ease: "Cubic.Out", delay: i*40 });
    });

    this.tweens.add({ targets: halo, alpha: { from: 0.18, to: 0.28 }, duration: 1500, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }
}
