// src/ui/NeonCard.ts
import Phaser from "phaser";
import { getTheme } from "../theme";

export class NeonCard extends Phaser.GameObjects.Container {
  private g!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    super(scene, x, y);
    scene.add.existing(this);

    const c = getTheme().colors;
    this.g = scene.add.graphics();
    this.add(this.g);

    // glow
    const glow = scene.add.graphics();
    glow.fillStyle(Phaser.Display.Color.HexStringToColor(c.glow).color, 0.2);
    glow.fillRoundedRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 18);
    this.addAt(glow, 0);

    this.redraw(w, h, 16, c);
  }

  private redraw(w: number, h: number, r: number, c: any) {
    this.g.clear();
    this.g.fillStyle(Phaser.Display.Color.HexStringToColor(c.surfaceAlt).color, 1);
    this.g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    this.g.lineStyle(2, Phaser.Display.Color.HexStringToColor(c.gridHighlight).color, 0.8);
    this.g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  }
}
