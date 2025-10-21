// src/scenes/OptionsScene.ts

import { UIButton, mapThemeToButtonTheme } from "../ui/Button";
import { getLang, setLang, t } from "../i18n";
import { getSettings, saveSettings } from "../storage";

import { MenuIcon } from "../ui/MenuIcon";
import Phaser from "phaser";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { getTheme } from "../theme";
import { showPrivacyOptions } from "../privacy/consent";

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

    // --- Música (Switch) ---
    new Switch(
      this,
      width / 2,
      140,
      t("music"),
      settings.music !== false,
      (value) => {
        const newSettings = { ...getSettings(), music: value };
        saveSettings(newSettings);

        // Efeito imediato no áudio global da cena de opções (se tiver algo tocando)
        if (!value) this.sound.stopAll();
      }
    );

    // --- Efeitos Sonoros (Switch) ---
    new Switch(
      this,
      width / 2,
      210,
      t("sound_effects"),
      settings.sound !== false,
      (value) => {
        const newSettings = { ...getSettings(), sound: value };
        saveSettings(newSettings);
      }
    );

    // --- Idioma (Select dropdown) ---
    const lang = getLang();
    const options = [
      { code: "pt", label: t("portuguese") },
      { code: "en", label: t("english")  },
      { code: "es", label: t("spanish")  },
      { code: "ru", label: t("russian")  },
      { code: "zh", label: t("chinese")  },
      { code: "ja", label: t("japanese") },
    ];
    const initialIndex = Math.max(0, options.findIndex(o => o.code === lang));

    new Select(
      this,
      width / 2,
      280,
      t("language"),
      options.map(o => o.label),
      initialIndex,
      (idx: number) => {
        const code = options[idx].code as "pt" | "en" | "es" | "ru" | "zh" | "ja";
        setLang(code);
        this.scene.restart(); // reaplica textos
      }
    );

    // --- Privacidade & Cookies (reabre o consentimento) ---
    new UIButton(this, {
      x: width / 2,
      y: 350,
      label: t("privacy_and_cookies"), // use t(...) se já tiver chave no seu i18n
      size: "md",
      variant: "secondary",
      theme: ui,
      width: fullW,
      onClick: async () => {
        try {
          await showPrivacyOptions();
        } catch (err) {
          // Em algumas regiões/dispositivos pode não haver formulário disponível
          console.warn("Opções de privacidade indisponíveis:", err);
        }
      },
    });
  }
}
