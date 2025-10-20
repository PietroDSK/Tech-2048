import Phaser from "phaser";
import { PANEL_COLORS, PanelNode } from "./panelLayout";

export class ModuleChip extends Phaser.GameObjects.Container {
  private body!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private led!: Phaser.GameObjects.Arc;
  private pins: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene, node: PanelNode, level: 0|1|2|3) {
    const { width, height } = scene.scale;
    const x = node.x * width;
    const y = node.y * height;
    super(scene, x, y);

    const baseColor = PANEL_COLORS[node.key];

    // Corpo do chip
    this.body = scene.add.rectangle(0, 0, 150, 62, baseColor, 0.18)
      .setStrokeStyle(2, baseColor, 0.9).setDepth(2);
    this.body.setOrigin(0.5);

    // Pinos laterais
    const pinW = 8, pinH = 12, n = 5;
    for (let i=0;i<n;i++) {
      const px = -this.body.width/2 - 6, py = -this.body.height/2 + (i+0.7)*(this.body.height/(n+1));
      const pL = scene.add.rectangle(px, py, pinW, pinH, baseColor, 0.9).setOrigin(0.5);
      const pR = scene.add.rectangle(-px, py, pinW, pinH, baseColor, 0.9).setOrigin(0.5);
      pL.setBlendMode(Phaser.BlendModes.ADD);
      pR.setBlendMode(Phaser.BlendModes.ADD);
      this.add(pL); this.add(pR);
      this.pins.push(pL, pR);
    }

    // LED de status
    this.led = scene.add.circle(this.body.width/2 - 12, -this.body.height/2 + 12, 6, baseColor, 0.8);
    this.led.setBlendMode(Phaser.BlendModes.ADD);

    // Rótulo
    this.label = scene.add.text(0, 0, node.title, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      color: "#e7f7ff",
    }).setOrigin(0.5);

    this.add([this.body, this.label, this.led]);
    this.setLevel(level, baseColor);

    // animação de “respirar”
    scene.tweens.add({
      targets: this, scale: { from: 0.995, to: 1.005 }, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.InOut"
    });

    this.setSize(this.body.width + 40, this.body.height + 20);
    this.setInteractive({ useHandCursor: true });
  }

  setLevel(level: 0|1|2|3, baseColor: number) {
    const alphas = [0.18, 0.35, 0.55, 0.75];
    const stroke = [2, 3, 4, 5];
    this.body.setFillStyle(baseColor, alphas[level]).setStrokeStyle(stroke[level], baseColor, 1);
    this.led.setAlpha(0.25 + 0.25*level);

    // brilho nos pinos cresce com nível
    const pinAlpha = [0.55, 0.7, 0.85, 1.0][level];
    this.pins.forEach(p => p.setAlpha(pinAlpha));
  }
}
