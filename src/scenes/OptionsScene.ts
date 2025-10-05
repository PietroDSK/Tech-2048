// src/scenes/OptionsScene.ts
import Phaser from "phaser";
import { getTheme } from "../theme";
import { t, setLang, getLang } from "../i18n";
import { UIButton, mapThemeToButtonTheme } from "../ui/Button";
import { Selector } from "../ui/Selector";
import { MenuIcon } from "../ui/MenuIcon";
import { getSettings, saveSettings } from "../storage";

export default class OptionsScene extends Phaser.Scene {
  constructor() { super("OptionsScene"); }

  create() {
    const c = getTheme().colors;
    const { width } = this.scale;

    this.cameras.main.setBackgroundColor(c.bg);

    // menu topo direito
    new MenuIcon(this, width - 30, 30);

    const title = this.add.text(24, 40, t("options"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "28px",
      color: c.text,
    }).setOrigin(0, 0.5);
    title.setShadow(0, 0, c.glow, 14, true, true);

    const settings = getSettings();
    const ui = mapThemeToButtonTheme(c);
    const fullW = Math.min(360, width * 0.82);

    // --- Música ---
    let musicOn = settings.music !== false;
    const btnMusic = new UIButton(this, {
      x: width / 2,
      y: 140,
      label: `${t("music")}  ${musicOn ? t("on") : t("off")}`,
      size: "md",
      variant: "primary",
      theme: ui,
      width: fullW,
      onClick: () => {
        musicOn = !musicOn;
        const newSettings = { ...getSettings(), music: musicOn };
        saveSettings(newSettings);
        btnMusic.setLabel(`${t("music")}  ${musicOn ? t("on") : t("off")}`);

        // Efeito imediato no áudio global da cena de opções (se tiver algo tocando)
        if (!musicOn) this.sound.stopAll();
      },
    });

    // --- Efeitos Sonoros ---
    let sfxOn = settings.sound !== false;
    const btnSfx = new UIButton(this, {
      x: width / 2,
      y: 200,
      label: `${t("sound_effects")}  ${sfxOn ? t("on") : t("off")}`,
      size: "md",
      variant: "primary",
      theme: ui,
      width: fullW,
      onClick: () => {
        sfxOn = !sfxOn;
        const newSettings = { ...getSettings(), sound: sfxOn };
        saveSettings(newSettings);
        btnSfx.setLabel(`${t("sound_effects")}  ${sfxOn ? t("on") : t("off")}`);
      },
    });

    // --- Idioma (Selector centralizado, setas nas extremidades) ---
    const lang = getLang();
    const options = [
      { code: "pt", label: t("portuguese") },
      { code: "en", label: t("english")  },
    ];
    const initialIndex = Math.max(0, options.findIndex(o => o.code === lang));

    new Selector(
      this,
      width / 2,
      260,
      t("language"),
      options.map(o => o.label),
      initialIndex,
      (idx) => {
        const code = options[idx].code as "pt" | "en";
        setLang(code);
        this.scene.restart(); // reaplica textos
      }
    );
  }
}
