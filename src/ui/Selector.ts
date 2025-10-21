// src/ui/Selector.ts
import Phaser from "phaser";
import { getTheme } from "../theme";

export class Selector extends Phaser.GameObjects.Container {
  private valueText!: Phaser.GameObjects.Text;
  private index = 0;
  private options: string[];
  private glowLayer!: Phaser.GameObjects.Graphics;
  private bg!: Phaser.GameObjects.Graphics;
  private circuitDetails!: Phaser.GameObjects.Graphics;
  private leftArrow!: Phaser.GameObjects.Container;
  private rightArrow!: Phaser.GameObjects.Container;
  private pulseAnim?: Phaser.Tweens.Tween;

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
    const h = 50, r = 14;

    const strokeColor = Phaser.Display.Color.HexStringToColor(c.primary || c.gridHighlight).color;

    // glow layer
    this.glowLayer = scene.add.graphics();
    this.glowLayer.lineStyle(4, strokeColor, 0.2);
    this.glowLayer.setBlendMode(Phaser.BlendModes.ADD);
    this.glowLayer.strokeRoundedRect(-w/2 - 2, -h/2 - 2, w + 4, h + 4, r + 2);

    // fundo
    this.bg = scene.add.graphics();
    this.bg.fillStyle(Phaser.Display.Color.HexStringToColor(c.surfaceAlt).color, 1);
    this.bg.fillRoundedRect(-w/2, -h/2, w, h, r);
    this.bg.lineStyle(2.5, strokeColor, 1);
    this.bg.strokeRoundedRect(-w/2, -h/2, w, h, r);

    // detalhes de circuito
    this.circuitDetails = scene.add.graphics();
    this.drawCircuitDetails(w, h, strokeColor);

    // label à esquerda
    const lbl = scene.add.text(-w/2 + 18, 0, label, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "16px",
      color: c.text,
    }).setOrigin(0, 0.5);

    // setas com estilo tech
    this.leftArrow = this.createTechArrow(scene, -w/2 + w * 0.38, 0, "left", c, strokeColor);
    this.rightArrow = this.createTechArrow(scene, w/2 - w * 0.38, 0, "right", c, strokeColor);

    // valor CENTRALIZADO com destaque
    this.valueText = scene.add.text(0, 0, options[this.index], {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
      color: c.primary || c.text,
    }).setOrigin(0.5);

    this.leftArrow.setInteractive({ useHandCursor: true });
    this.rightArrow.setInteractive({ useHandCursor: true });

    this.leftArrow.on("pointerup", () => {
      this.index = (this.index - 1 + this.options.length) % this.options.length;
      this.valueText.setText(this.options[this.index]);
      this.flashArrow(this.leftArrow);
      onChange(this.index);
    });

    this.rightArrow.on("pointerup", () => {
      this.index = (this.index + 1) % this.options.length;
      this.valueText.setText(this.options[this.index]);
      this.flashArrow(this.rightArrow);
      onChange(this.index);
    });

    this.add([this.glowLayer, this.bg, this.circuitDetails, lbl, this.leftArrow, this.rightArrow, this.valueText]);
    this.setSize(w, h);

    // animação de glow
    this.pulseAnim = scene.tweens.add({
      targets: this.glowLayer,
      alpha: { from: 0.3, to: 0.6 },
      duration: 1800,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }

  private createTechArrow(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: "left" | "right",
    colors: any,
    strokeColor: number
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const size = 20;

    // background circle
    const bg = scene.add.graphics();
    bg.fillStyle(strokeColor, 0.15);
    bg.fillCircle(0, 0, size / 2);
    bg.lineStyle(2, strokeColor, 0.8);
    bg.strokeCircle(0, 0, size / 2);

    // arrow
    const arrow = scene.add.graphics();
    arrow.lineStyle(2.5, strokeColor, 1);

    if (direction === "left") {
      arrow.beginPath();
      arrow.moveTo(3, 0);
      arrow.lineTo(-3, -5);
      arrow.lineTo(-3, 5);
      arrow.closePath();
      arrow.fillStyle(strokeColor, 1);
      arrow.fillPath();
    } else {
      arrow.beginPath();
      arrow.moveTo(-3, 0);
      arrow.lineTo(3, -5);
      arrow.lineTo(3, 5);
      arrow.closePath();
      arrow.fillStyle(strokeColor, 1);
      arrow.fillPath();
    }

    container.add([bg, arrow]);
    container.setSize(size, size);
    return container;
  }

  private drawCircuitDetails(w: number, h: number, color: number) {
    const x = -w / 2;
    const y = -h / 2;

    this.circuitDetails.lineStyle(1.5, color, 0.5);

    // Cantos
    const cornerSize = 8;

    // Superior esquerdo
    this.circuitDetails.lineBetween(x + 4, y + cornerSize, x + 4, y + 4);
    this.circuitDetails.lineBetween(x + 4, y + 4, x + cornerSize, y + 4);
    this.circuitDetails.fillStyle(color, 0.7);
    this.circuitDetails.fillCircle(x + 4, y + 4, 1.5);

    // Superior direito
    this.circuitDetails.lineBetween(x + w - 4, y + cornerSize, x + w - 4, y + 4);
    this.circuitDetails.lineBetween(x + w - 4, y + 4, x + w - cornerSize, y + 4);
    this.circuitDetails.fillCircle(x + w - 4, y + 4, 1.5);

    // Inferior esquerdo
    this.circuitDetails.lineBetween(x + 4, y + h - cornerSize, x + 4, y + h - 4);
    this.circuitDetails.lineBetween(x + 4, y + h - 4, x + cornerSize, y + h - 4);
    this.circuitDetails.fillCircle(x + 4, y + h - 4, 1.5);

    // Inferior direito
    this.circuitDetails.lineBetween(x + w - 4, y + h - cornerSize, x + w - 4, y + h - 4);
    this.circuitDetails.lineBetween(x + w - 4, y + h - 4, x + w - cornerSize, y + h - 4);
    this.circuitDetails.fillCircle(x + w - 4, y + h - 4, 1.5);

    // Linhas decorativas
    const midY = h / 2;
    this.circuitDetails.lineStyle(1, color, 0.25);
    this.circuitDetails.lineBetween(x + w * 0.12, y + midY, x + w * 0.25, y + midY);
    this.circuitDetails.lineBetween(x + w * 0.75, y + midY, x + w * 0.88, y + midY);
  }

  private flashArrow(arrow: Phaser.GameObjects.Container) {
    this.scene.tweens.add({
      targets: arrow,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 1, to: 0.7 },
      duration: 150,
      yoyo: true,
      ease: "sine.out",
    });
  }

  destroy(fromScene?: boolean) {
    this.pulseAnim?.remove();
    this.pulseAnim = undefined;
    super.destroy(fromScene);
  }
}
