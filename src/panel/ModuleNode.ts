import Phaser from "phaser";
import { PANEL_COLORS, PanelNode } from "./panelLayout";

export class ModuleNode extends Phaser.GameObjects.Container {
  private circle: Phaser.GameObjects.Arc;
  private glow: Phaser.GameObjects.Arc;
  private title: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, node: PanelNode, points: number) {
    const { width, height } = scene.scale;
    const x = node.x * width;
    const y = node.y * height;
    super(scene, x, y);

    const baseColor = PANEL_COLORS[node.key];

    // círculo base
    this.circle = scene.add.circle(0, 0, 34, baseColor, 0.25).setStrokeStyle(2, baseColor, 0.9);
    this.add(this.circle);

    // brilho
    this.glow = scene.add.circle(0, 0, 48, baseColor, 0.10);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.glow);

    // título
    this.title = scene.add.text(0, 50, node.title, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      color: "#ffffff",
    }).setOrigin(0.5, 0.5);
    this.add(this.title);

    this.setDepth(5);
    this.setLevelVisual(node, points);

    // animação respirando
    scene.tweens.add({
      targets: this.glow,
      scale: { from: 0.95, to: 1.05 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    // hover
    this.setSize(96, 96);
    this.setInteractive({ useHandCursor: true })
      .on("pointerover", () => this.circle.setScale(1.07))
      .on("pointerout", () => this.circle.setScale(1.0));
  }

  setLevelVisual(node: PanelNode, points: number) {
    // níveis simples: altera alpha e stroke conforme thresholds
    const t = node.thresholds;
    let lvl = 0;
    if (points >= (t[2] || Infinity)) lvl = 3;
    else if (points >= (t[1] || Infinity)) lvl = 2;
    else if (points >= (t[0] || Infinity)) lvl = 1;

    const alphas = [0.25, 0.45, 0.65, 0.9];
    const stroke = [2, 3, 4, 5];

    this.circle.fillAlpha = alphas[lvl];
    this.circle.setStrokeStyle(stroke[lvl], (this.circle.strokeColor || 0xffffff) as number, 1);
    this.glow.alpha = 0.08 + lvl * 0.06;
  }
}
