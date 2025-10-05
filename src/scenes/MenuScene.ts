// src/scenes/MenuScene.ts
import Phaser from "phaser";
import { getTheme } from "../theme";
import { MenuButton } from "../ui/MenuButton";
import { t } from "../i18n";
import { swapTo } from "../animations/transitions";
import { hasUnlocked2048 } from "../storage";

export default class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create() {
    const c = getTheme().colors;
    const { width, height } = this.scale;
    const unlocked = hasUnlocked2048();

    this.cameras.main.setBackgroundColor(c.bg);

    const title = this.add.text(24, 40, t("title"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "32px",
      color: c.text,
    }).setOrigin(0, 0.5);
    title.setShadow(0, 0, c.glow, 16, true, true);

    const cx = width / 2;
    let y = height * 0.28;

    // Largura consistente (e deixa a hitbox por conta do UIButton)
    const btnWidth = Math.min(360, width * 0.84);

    const play = new MenuButton(this, cx, y, t("play_classic"), () =>
      swapTo(this, "GameScene", { mode: "classic" as const }, "right"), btnWidth);
    y += 88;

    const modes = new MenuButton(this, cx, y, t("other_modes"), () => {
      if (!unlocked) return; // proteção extra, mas estará desabilitado
      swapTo(this, "ModesScene", {}, "right");
    }, btnWidth);
    y += 88;

    const themes = new MenuButton(this, cx, y, t("themes"), () =>
      swapTo(this, "ThemeScene", {}, "right"), btnWidth);
    y += 88;

    const options = new MenuButton(this, cx, y, t("options"), () =>
      swapTo(this, "OptionsScene", {}, "right"), btnWidth);

    // Travar "Outros modos" até desbloquear 2048
    if (!unlocked) {
      modes.setEnabled(false);
      // opcional: rótulo abaixo indicando condição
      this.add.text(cx, modes.y + 34, t("unlock_other_modes_hint"), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        color: c.textDim,
      }).setOrigin(0.5, 0);
    }

    // footer
    this.add.text(cx, height - 18, t("footer_game_name"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "12px",
      color: c.textDim,
    }).setOrigin(0.5, 1);
  }
}
