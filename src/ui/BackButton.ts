// src/ui/BackButton.ts
import Phaser from "phaser";
import { getTheme } from "../theme";

export class BackButton extends Phaser.GameObjects.Container {
  private g!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, label = "Voltar", onClick?: () => void) {
    super(scene, x, y);
    scene.add.existing(this);

    const c = getTheme().colors;
    const w = 92, h = 34, r = 8;

    this.g = scene.add.graphics();
    this.add(this.g);

    const txt = scene.add.text(0, 0, label, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      color: c.text,
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add(txt);

    this.draw(c, w, h, r, 0.18);

    this.setSize(w, h);
    this.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    this.on("pointerover", () => { this.draw(c, w, h, r, 0.45); this.setScale(1.02); });
    this.on("pointerout",  () => { this.draw(c, w, h, r, 0.18); this.setScale(1.0); });
    this.on("pointerdown", () => { scene.tweens.add({ targets: this, scale: 0.96, duration: 70 }); });
    this.on("pointerup",   () => { scene.tweens.add({ targets: this, scale: 1.0, duration: 80, ease: "back.out(2.2)" }); onClick?.(); });
  }

  private draw(c: any, w: number, h: number, r: number, fillAlpha: number) {
    this.g.clear();
    this.g.fillStyle(0x000000, fillAlpha);
    this.g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    this.g.lineStyle(1, Phaser.Display.Color.HexStringToColor(c.primary).color, 0.8);
    this.g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  }
}
