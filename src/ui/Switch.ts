// src/ui/Switch.ts
import Phaser from "phaser";
import { getTheme } from "../theme";

/**
 * Switch tipo PCB (toggle ON/OFF)
 * Estilo placa de circuito com animações tech
 */
export class Switch extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Graphics;
  private track!: Phaser.GameObjects.Graphics;
  private thumb!: Phaser.GameObjects.Graphics;
  private thumbLed!: Phaser.GameObjects.Arc;
  private labelTxt!: Phaser.GameObjects.Text;
  private statusTxt!: Phaser.GameObjects.Text;
  private hitZone!: Phaser.GameObjects.Zone;

  private _value: boolean;
  private _label: string;
  private w = 0;
  private h = 50;
  private switchW = 60;
  private switchH = 28;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    initialValue: boolean,
    onChange: (value: boolean) => void
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this._value = initialValue;
    this._label = label;

    const maxW = Math.min(360, scene.scale.width * 0.82);
    this.w = maxW;

    this.build();
    this.makeInteractive(onChange);
    this.updateVisuals();
  }

  private build() {
    const c = getTheme().colors;
    const surfaceColor = Phaser.Display.Color.HexStringToColor(c.surfaceAlt || "#1a1a24").color;
    const primaryColor = Phaser.Display.Color.HexStringToColor(c.primary || "#14ffe1").color;

    // Background
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(surfaceColor, 1);
    this.bg.fillRoundedRect(-this.w / 2, -this.h / 2, this.w, this.h, 14);
    this.bg.lineStyle(2.5, primaryColor, 0.9);
    this.bg.strokeRoundedRect(-this.w / 2, -this.h / 2, this.w, this.h, 14);
    this.add(this.bg);

    // Label
    this.labelTxt = this.scene.add
      .text(-this.w / 2 + 18, 0, this._label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "16px",
        color: c.text,
      })
      .setOrigin(0, 0.5);
    this.labelTxt.setResolution(2);
    this.add(this.labelTxt);

    // Status text
    this.statusTxt = this.scene.add
      .text(this.w / 2 - this.switchW - 20, 0, "", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        color: c.textDim,
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5);
    this.statusTxt.setResolution(2);
    this.add(this.statusTxt);

    // Switch track (fundo do switch)
    this.track = this.scene.add.graphics();
    this.add(this.track);

    // Switch thumb (bolinha que desliza)
    this.thumb = this.scene.add.graphics();
    this.add(this.thumb);

    // LED no thumb
    this.thumbLed = this.scene.add
      .circle(0, 0, 3, primaryColor, 0.8)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.thumbLed);

    // Animação de pulso no LED
    this.scene.tweens.add({
      targets: this.thumbLed,
      alpha: { from: 0.6, to: 1 },
      scale: { from: 0.9, to: 1.1 },
      yoyo: true,
      duration: 800,
      repeat: -1,
      ease: "sine.inOut",
    });

    this.setSize(this.w, this.h);
  }

  private makeInteractive(onChange: (value: boolean) => void) {
    this.hitZone = this.scene.add
      .zone(0, 0, this.w, this.h)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.add(this.hitZone);

    this.hitZone.on("pointerup", () => {
      this._value = !this._value;
      this.updateVisuals();
      onChange(this._value);

      // Efeito de clique
      this.scene.tweens.add({
        targets: this,
        scaleX: 0.98,
        scaleY: 0.98,
        duration: 60,
        yoyo: true,
        ease: "sine.out",
      });
    });
  }

  private updateVisuals() {
    const c = getTheme().colors;
    const primaryColor = Phaser.Display.Color.HexStringToColor(c.primary || "#14ffe1").color;
    const surfaceColor = Phaser.Display.Color.HexStringToColor(c.surface || "#0f0f16").color;

    const switchX = this.w / 2 - this.switchW / 2 - 12;
    const switchY = 0;

    // Redesenhar track
    this.track.clear();
    if (this._value) {
      // ON - preenchido com cor primária
      this.track.fillStyle(primaryColor, 0.3);
      this.track.lineStyle(2, primaryColor, 0.9);
    } else {
      // OFF - apenas outline
      this.track.fillStyle(surfaceColor, 0.8);
      this.track.lineStyle(2, primaryColor, 0.4);
    }
    this.track.fillRoundedRect(
      switchX - this.switchW / 2,
      switchY - this.switchH / 2,
      this.switchW,
      this.switchH,
      this.switchH / 2
    );
    this.track.strokeRoundedRect(
      switchX - this.switchW / 2,
      switchY - this.switchH / 2,
      this.switchW,
      this.switchH,
      this.switchH / 2
    );

    // Posição do thumb
    const thumbRadius = this.switchH / 2 - 4;
    const thumbOffsetX = this._value ? this.switchW / 2 - thumbRadius - 4 : -this.switchW / 2 + thumbRadius + 4;
    const thumbX = switchX + thumbOffsetX;

    // Animar thumb
    this.scene.tweens.add({
      targets: [this.thumb, this.thumbLed],
      x: thumbX,
      y: switchY,
      duration: 200,
      ease: "back.out(2)",
    });

    // Redesenhar thumb
    this.thumb.clear();
    this.thumb.fillStyle(primaryColor, 1);
    this.thumb.fillCircle(0, 0, thumbRadius);
    this.thumb.lineStyle(2, 0xffffff, 0.3);
    this.thumb.strokeCircle(0, 0, thumbRadius);

    // Atualizar texto de status
    this.statusTxt.setText(this._value ? "ON" : "OFF");
    this.statusTxt.setColor(this._value ? c.primary || "#14ffe1" : c.textDim || "#666");
  }

  getValue(): boolean {
    return this._value;
  }

  setValue(value: boolean) {
    if (this._value !== value) {
      this._value = value;
      this.updateVisuals();
    }
  }
}
