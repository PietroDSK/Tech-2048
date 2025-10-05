// src/ui/MenuIcon.ts
import Phaser from "phaser";
import { getTheme } from "../theme";
import { swapTo } from "../animations/transitions";

export class MenuIcon extends Phaser.GameObjects.Container {
  private circle!: Phaser.GameObjects.Arc;
  private hit!: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    const c = getTheme().colors;
    const r = 18;

    // sombra
    const shadow = scene.add.circle(2, 4, r, 0x000000, 0.35).setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.circle = scene.add.circle(0, 0, r, Phaser.Display.Color.HexStringToColor(c.surfaceAlt).color, 1)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(c.primary).color);

    // ícone hambúrguer
    const g = scene.add.graphics();
    g.lineStyle(3, Phaser.Display.Color.HexStringToColor(c.text).color, 1);
    const w = 12; const s = 5;
    g.strokeLineShape(new Phaser.Geom.Line(-w/2, -s, w/2, -s));
    g.strokeLineShape(new Phaser.Geom.Line(-w/2, 0,   w/2, 0));
    g.strokeLineShape(new Phaser.Geom.Line(-w/2, s,   w/2, s));

    // área de clique (grande)
    this.hit = scene.add.circle(0, 0, r + 8, 0x000000, 0.001).setInteractive({ useHandCursor: true });

    this.add([shadow, this.circle, g, this.hit]);
    this.setSize((r + 8) * 2, (r + 8) * 2);
    this.setDepth(1005).setScrollFactor(0);

    this.hit.on("pointerover", () => this.setScale(1.05));
    this.hit.on("pointerout",  () => this.setScale(1.0));
    this.hit.on("pointerdown", () => scene.tweens.add({ targets: this, scale: 0.92, duration: 60 }));
    this.hit.on("pointerup",   () => {
      scene.tweens.add({ targets: this, scale: 1.0, duration: 80, ease: "back.out(2.2)" });
      swapTo(scene, "MenuScene", {}, "left");
    });
  }
}
