// src/ui/BackButton.ts
import Phaser from "phaser";
import { UIButton, mapThemeToButtonTheme } from "./Button";
import { getTheme } from "../theme";
import { swapTo } from "../animations/transitions";

export class BackButton extends UIButton {
  constructor(scene: Phaser.Scene, x: number, y: number, label = "Menu") {
    const t = getTheme();
    super(scene, {
      x, y,
      label,
      variant: "ghost",
      size: "sm",
      theme: mapThemeToButtonTheme(t.colors),
      onClick: () => swapTo(scene, "MenuScene", {}, "left")
    });
    this.setDepth(900).setScrollFactor(0);
  }
}
