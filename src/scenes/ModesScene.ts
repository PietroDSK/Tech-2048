// src/scenes/ModesScene.ts
import Phaser from "phaser";
import { getTheme } from "../theme";
import { MenuButton } from "../ui/MenuButton";
import { swapTo } from "../animations/transitions";
import { t } from "../i18n";
import { MenuIcon } from "../ui/MenuIcon";
import { hasUnlocked2048 } from "../storage";

export default class ModesScene extends Phaser.Scene {
  constructor() { super("ModesScene"); }

  create() {
    const unlocked = hasUnlocked2048();

    // Se entrou via deep-link/bug antes de desbloquear, manda de volta ao menu
    if (!unlocked) {
      swapTo(this, "MenuScene", {}, "left");
      return;
    }

    const c = getTheme().colors;
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(c.bg);

    // menu no topo direito
    new MenuIcon(this, width - 30, 30);

    const title = this.add.text(24, 40, t("other_modes"), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "28px",
      color: c.text,
    }).setOrigin(0, 0.5);
    title.setShadow(0, 0, c.glow, 14, true, true);

    const cx = width / 2;
    let y = height * 0.28;
    const btnWidth = Math.min(360, width * 0.84);

    new MenuButton(this, cx, y, t("mode_4096"), () => swapTo(this, "GameScene", { mode: "4096" as const }, "right"), btnWidth);
    y += 88;
    new MenuButton(this, cx, y, t("mode_endless"), () => swapTo(this, "GameScene", { mode: "endless" as const }, "right"), btnWidth);
    y += 88;
    new MenuButton(this, cx, y, t("mode_custom_6x6"), () =>
      swapTo(this, "GameScene", { mode: "custom" as const, rows: 6, cols: 6 }, "right"), btnWidth);
  }
}
