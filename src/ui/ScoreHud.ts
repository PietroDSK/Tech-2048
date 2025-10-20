import Phaser from "phaser";

export class ScoreHud extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private valueTxt!: Phaser.GameObjects.Text;
  private displayValue = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, theme: any) {
    super(scene, x, y);
    scene.add.existing(this);

    const c = theme.colors;
    this.bg = scene.add.rectangle(0, 0, 140, 46, Phaser.Display.Color.HexStringToColor(c.surfaceAlt).color, 1)
      .setOrigin(1, 0.5)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(c.primary).color, 1);
    this.add(this.bg);

    this.label = scene.add.text(-140, -6, "SCORE", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "12px",
      color: c.textDim,
      letterSpacing: 1.5 as any
    }).setOrigin(0, 0.5);
    this.add(this.label);

    this.valueTxt = scene.add.text(-12, 8, "0", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "22px",
      color: c.text,
      fontStyle: "bold",
    }).setOrigin(1, 0.5);
    this.add(this.valueTxt);

    this.setDepth(2000);
  }

  resizeToText() {
  const w = Math.max(120, this.valueTxt.width + 80);
  this.bg.width = w;
  this.label.x = -w + 20;
  this.valueTxt.x = -12;
}
  setTheme(theme: any) {
    const c = theme.colors;
    this.bg.setFillStyle(Phaser.Display.Color.HexStringToColor(c.surfaceAlt).color, 1)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(c.primary).color, 1);
    this.label.setColor(c.textDim);
    this.valueTxt.setColor(c.text);
  }

  /** Atualiza rapidamente sem animação (ex.: no create) */
  set(value: number) {
    this.displayValue = value|0;
    this.valueTxt.setText(String(this.displayValue));
    this.resizeToText();
  }

  /** Anima a contagem até `value` e dá um flash discreto */
  to(value: number) {
    const from = this.displayValue|0;
    const to = value|0;
    if (to === from) return;
    this.scene.tweens.addCounter({
      from, to,
      duration: Phaser.Math.Clamp(250 + Math.min(900, (to-from)*0.4), 250, 800),
      ease: "quad.out",
      onUpdate: (tw) => {
        this.displayValue = Math.floor(tw.getValue() as number);
        this.valueTxt.setText(String(this.displayValue));
      }
    });
    // flash sutil
    this.scene.tweens.add({
      targets: this.bg, alpha: { from: 1, to: 0.7 }, yoyo: true, duration: 120
    });
    this.resizeToText();
  }
}
