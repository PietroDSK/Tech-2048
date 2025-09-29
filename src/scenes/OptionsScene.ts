// src/scenes/OptionsScene.ts
import Phaser from "phaser";
import { theme } from "../theme";
import { t } from "../i18n";
import { getSettings, saveSettings, resetProgress } from "../storage";

export default class OptionsScene extends Phaser.Scene {
  private settings = getSettings();

  constructor() {
    super("OptionsScene");
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(theme.bg);

    const halo = this.add.graphics();
    halo.fillStyle(Phaser.Display.Color.HexStringToColor(theme.stroke).color, 0.12);
    halo.fillRoundedRect(width * 0.08, height * 0.12, width * 0.84, height * 0.76, 24);

    const title = this.add.text(width / 2, height * 0.18, t("optionsTitle"), {
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

    let y = py + 90;

    // toggles
    this.mkToggle(width/2, y, t("sound"), this.settings.sound, (v) => { this.settings.sound = v; this.persist(); });
    y += 70;

    this.mkToggle(width/2, y, t("animations"), this.settings.animations, (v) => { this.settings.animations = v; this.persist(); });
    y += 70;

    this.mkLang(width/2, y);
    y += 100;

    // reset progresso
    const resetBtn = this.add.text(width/2, y, t("resetProgress"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: theme.tileTextDark,
      backgroundColor: theme.hudTitle,
      padding: { left: 22, right: 22, top: 12, bottom: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resetBtn.setShadow(0, 0, theme.stroke, 8, true, true);

    resetBtn.on("pointerover", () => resetBtn.setStyle({ backgroundColor: theme.stroke }));
    resetBtn.on("pointerout",  () => resetBtn.setStyle({ backgroundColor: theme.hudTitle }));
    resetBtn.on("pointerdown", () => {
      this.tweens.add({ targets: resetBtn, scale: 0.97, duration: 70, yoyo: true });
      resetProgress();
      alert(t("progressCleared"));
    });

    // voltar
    const back = this.add.text(width / 2, py + ph + 36, t("back"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: theme.hudSub,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on("pointerover", () => back.setColor(theme.hudTitle));
    back.on("pointerout",  () => back.setColor(theme.hudSub));
    back.on("pointerdown", () => this.scene.start("MenuScene"));
  }

  private mkToggle(x: number, y: number, label: string, value: boolean, onChange:(v:boolean)=>void) {
    const text = this.add.text(x, y, `${label}: ${value ? "ON" : "OFF"}`, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "22px",
      color: theme.tileTextLight,
      backgroundColor: "#00000000",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on("pointerover", () => text.setColor(theme.hudTitle));
    text.on("pointerout",  () => text.setColor(theme.tileTextLight));
    text.on("pointerdown", () => {
      value = !value;
      text.setText(`${label}: ${value ? "ON" : "OFF"}`);
      this.tweens.add({ targets: text, scale: 1.06, duration: 60, yoyo: true });
      onChange(value);
    });
  }

  private mkLang(x:number, y:number) {
    this.add.text(x, y, t("language"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "22px",
      color: theme.tileTextLight,
    }).setOrigin(0.5);

    const pt = this.add.text(x - 110, y + 42, t("portuguese"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: this.settings.lang === "pt" ? theme.hudTitle : theme.tileTextLight,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const en = this.add.text(x + 110, y + 42, t("english"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: this.settings.lang === "en" ? theme.hudTitle : theme.tileTextLight,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    pt.on("pointerover", () => pt.setColor(theme.hudTitle));
    pt.on("pointerout",  () => pt.setColor(this.settings.lang === "pt" ? theme.hudTitle : theme.tileTextLight));
    en.on("pointerover", () => en.setColor(theme.hudTitle));
    en.on("pointerout",  () => en.setColor(this.settings.lang === "en" ? theme.hudTitle : theme.tileTextLight));

    pt.on("pointerdown", () => { this.settings.lang = "pt"; this.persist(); this.scene.start("OptionsScene"); });
    en.on("pointerdown", () => { this.settings.lang = "en"; this.persist(); this.scene.start("OptionsScene"); });
  }

  private persist() {
    saveSettings(this.settings);
  }
}
