// src/ui/MenuButton.ts
import Phaser from "phaser";
import { UIButton, mapThemeToButtonTheme } from "./Button";
import { getTheme } from "../theme";

export class MenuButton extends UIButton {
  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, widthOverride?: number) {
    super(scene, {
      x, y,
      label,
      variant: "primary",
      size: "lg",
      width: widthOverride ?? Math.min(360, scene.scale.width * 0.84),
      theme: mapThemeToButtonTheme(getTheme().colors),
      onClick
    });
    // A hitbox já é configurada no UIButton (retângulo centralizado).
    // Não sobrescrever aqui evita inconsistências.
  }
}
