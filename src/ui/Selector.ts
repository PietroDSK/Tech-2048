// src/ui/Selector.ts
import Phaser from "phaser";
import { getTheme } from "../theme";

export class Selector extends Phaser.GameObjects.Container {
  private valueText!: Phaser.GameObjects.Text;
  private index = 0;
  private options: string[];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    options: string[],
    initialIndex: number,
    onChange: (idx: number) => void
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    const c = getTheme().colors;
    this.options = options;
    this.index = Phaser.Math.Clamp(initialIndex, 0, options.length - 1);

    const w = Math.min(360, scene.scale.width * 0.82);
    const h = 44, r = 14;

    // fundo
    const g = scene.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(c.surfaceAlt).color, 1);
    g.fillRoundedRect(-w/2, -h/2, w, h, r);
    g.lineStyle(2, Phaser.Display.Color.HexStringToColor(c.gridHighlight).color, 1);
    g.strokeRoundedRect(-w/2, -h/2, w, h, r);

    // label à esquerda
    const lbl = scene.add.text(-w/2 + 14, 0, label, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "16px",
      color: c.text,
    }).setOrigin(0, 0.5);

    // setas nas EXTREMIDADES
    const left = scene.add.text(-w/2 + 28, 0, "◀", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: c.text,
    }).setOrigin(0.5)
     .setInteractive({ useHandCursor: true });

    const right = scene.add.text(w/2 - 28, 0, "▶", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: c.text,
    }).setOrigin(0.5)
     .setInteractive({ useHandCursor: true });

    // valor CENTRALIZADO
    this.valueText = scene.add.text(0, 0, options[this.index], {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "16px",
      color: c.text,
    }).setOrigin(0.5);

    left.on("pointerup", () => {
      this.index = (this.index - 1 + this.options.length) % this.options.length;
      this.valueText.setText(this.options[this.index]);
      onChange(this.index);
    });
    right.on("pointerup", () => {
      this.index = (this.index + 1) % this.options.length;
      this.valueText.setText(this.options[this.index]);
      onChange(this.index);
    });

    this.add([g, lbl, left, right, this.valueText]);
    this.setSize(w, h);
  }
}
