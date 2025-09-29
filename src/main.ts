// src/main.ts
import Phaser from "phaser";
import MenuScene from "./scenes/MenuScene";
import ModesScene from "./scenes/ModesScene";
import OptionsScene from "./scenes/OptionsScene";
import GameScene from "./scenes/GameScene";
import { theme } from "./theme";

new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: theme.bg,
  parent: "app",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  // A PRIMEIRA cena é a que abre por padrão (Menu)
  scene: [MenuScene, ModesScene, OptionsScene, GameScene],
});
