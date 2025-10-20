import Phaser from "phaser";
import { getTheme } from "../theme";

/**
 * Botão tipo "PCB" (placa de circuito), responsivo e com efeitos de hover/press.
 * Assinatura: (scene, x, y, label, onClick, widthOverride?)
 */
export class MenuButton extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Rectangle;
  private border!: Phaser.GameObjects.Graphics;
  private inner!: Phaser.GameObjects.Graphics;
  private traces!: Phaser.GameObjects.Graphics;
  private vias!: Phaser.GameObjects.Graphics;
  private shine!: Phaser.GameObjects.Rectangle;
  private labelTxt!: Phaser.GameObjects.Text;
  private hit!: Phaser.GameObjects.Zone;
  private leds: Phaser.GameObjects.Arc[] = [];
  private electron?: Phaser.GameObjects.Arc;

  private paths: Phaser.Math.Vector2[][] = [];
  private w: number;
  private h: number;
  private theme = getTheme();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    widthOverride?: number
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    const maxW = Math.min(360, scene.scale.width * 0.84);
    this.w = Math.max(220, Math.round(widthOverride ?? maxW));
    this.h = Math.max(52, Math.round(56 * this.scaleFactor()));

    this.build(label);
    this.makeInteractive(onClick);
    this.playIdleAnim();
    this.setDepth(100);
  }

  // ---------------------------- drawing ----------------------------

  private build(label: string) {
    const c = this.theme.colors;
    const base = Phaser.Display.Color.HexStringToColor(c.surfaceAlt).color;
    const primary = Phaser.Display.Color.HexStringToColor(c.primary).color;

    this.bg = this.scene.add.rectangle(0, 0, this.w, this.h, base, 1).setOrigin(0.5);
    this.add(this.bg);

    this.border = this.scene.add.graphics();
    this.border.lineStyle(3, primary, 0.9);
    this.border.strokeRoundedRect(-this.w / 2, -this.h / 2, this.w, this.h, 14);
    this.border.lineStyle(1, primary, 0.5);
    this.border.strokeRoundedRect(-this.w / 2 + 5, -this.h / 2 + 5, this.w - 10, this.h - 10, 10);
    this.add(this.border);

    this.inner = this.scene.add.graphics();
    this.inner
      .fillStyle(Phaser.Display.Color.HexStringToColor(c.surface).color, 0.55)
      .fillRoundedRect(-this.w / 2 + 8, -this.h / 2 + 8, this.w - 16, this.h - 16, 8);
    this.add(this.inner);

    this.traces = this.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.vias = this.scene.add.graphics();
    this.drawTraces(primary);
    this.add(this.traces);
    this.add(this.vias);

    const ledR = 4;
    const offs = 10;
    const pts = [
      { x: -this.w / 2 + offs, y: -this.h / 2 + offs },
      { x: this.w / 2 - offs, y: -this.h / 2 + offs },
      { x: -this.w / 2 + offs, y: this.h / 2 - offs },
      { x: this.w / 2 - offs, y: this.h / 2 - offs },
    ];
    this.leds = pts.map((p) =>
      this.scene.add
        .circle(p.x, p.y, ledR, primary, 0.7)
        .setBlendMode(Phaser.BlendModes.ADD),
    );
    this.add(this.leds);

    this.shine = this.scene.add
      .rectangle(-this.w * 0.25, -this.h * 0.6, this.w * 0.9, this.h * 0.4, 0xffffff, 0.05)
      .setOrigin(0, 0)
      .setAngle(18);
    this.add(this.shine);

    this.labelTxt = this.scene.add
      .text(0, 0, label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.round(this.h * 0.42)}px`,
        color: c.text,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.labelTxt.setResolution(2);
    this.add(this.labelTxt);
  }

  private drawTraces(primaryInt: number) {
    const lineW = 2;

    this.traces.clear();
    this.vias.clear();
    this.paths = [];

    const cols = 4;
    const rows = 3;
    const pad = { x: 18, y: 14 };
    const gx = (i: number) => -this.w / 2 + pad.x + (i * (this.w - pad.x * 2)) / (cols - 1);
    const gy = (j: number) => -this.h / 2 + pad.y + (j * (this.h - pad.y * 2)) / (rows - 1);

    const pairs: Array<[number, number, number, number, "vh" | "hv"]> = [
      [0, 1, 0, 2, "vh"],
      [1, 2, 2, 1, "hv"],
      [0, 2, 1, 2, "hv"],
      [3, 0, 3, 2, "vh"],
      [1, 0, 3, 1, "hv"],
    ];

    this.traces.lineStyle(lineW, primaryInt, 0.55);
    this.vias.fillStyle(primaryInt, 0.7);

    for (const [cx1, cy1, cx2, cy2, mode] of pairs) {
      const A = new Phaser.Math.Vector2(gx(cx1), gy(cy1));
      const B = new Phaser.Math.Vector2(gx(cx2), gy(cy2));
      const mid = mode === "vh" ? new Phaser.Math.Vector2(A.x, B.y) : new Phaser.Math.Vector2(B.x, A.y);

      this.paths.push([A, mid, B]);

      this.traces.strokePoints([A, mid, B], false);
      this.vias.fillCircle(mid.x, mid.y, 2.2);
    }
  }

  // ---------------------------- interatividade ----------------------------

  private makeInteractive(onClick: () => void) {
    this.hit = this.scene.add
      .zone(0, 0, Math.max(44, this.w), Math.max(44, this.h))
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.add(this.hit);

    this.hit.on("pointerover", () => this.onHover(true));
    this.hit.on("pointerout", () => this.onHover(false));
    this.hit.on("pointerdown", () => this.onPress());
    this.hit.on("pointerup", () => {
      this.onHover(false); // garante stop de animação ao soltar fora
      this.onRelease();
      onClick?.();
    });
  }

  private onHover(enter: boolean) {
    const c = this.theme.colors;
    const primary = Phaser.Display.Color.HexStringToColor(c.primary).color;

    this.scene.tweens.add({
      targets: [this.border],
      alpha: enter ? 1 : 0.9,
      duration: 120,
      ease: "sine.out",
    });
    this.scene.tweens.add({
      targets: this.leds,
      alpha: enter ? 1 : 0.7,
      scale: enter ? 1.12 : 1.0,
      duration: 120,
      ease: "sine.out",
    });

    if (enter) {
      if (!this.electron) {
        this.electron = this.scene.add.circle(0, 0, 3, primary, 1).setBlendMode(Phaser.BlendModes.ADD);
        this.add(this.electron);
      }
      // 🔧 importante: matar tweens antigos antes de iniciar outro
      this.scene.tweens.killTweensOf(this.electron);
      this.runElectron();
      this.electron.setAlpha(1);
    } else {
      if (this.electron) {
        this.scene.tweens.killTweensOf(this.electron); // <-- correção do erro
        this.electron.setAlpha(0);
      }
    }
  }

  private onPress() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.985,
      scaleY: 0.985,
      duration: 70,
      ease: "sine.out",
    });
    this.ripple(0xffffff, 0.12);
  }

  private onRelease() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 110,
      ease: "back.out(2)",
    });
  }

  private runElectron() {
    if (!this.electron) return;
    const path = Phaser.Utils.Array.GetRandom(this.paths);
    if (!path) return;

    this.electron.setAlpha(1);
    this.electron.setPosition(path[0].x, path[0].y);

    const hop = (i: number) => {
      if (!this.electron) return;
      if (i >= path.length - 1) {
        this.scene.tweens.add({ targets: this.electron, alpha: 0, duration: 120 });
        return;
      }
      const P = path[i];
      const Q = path[i + 1];
      this.scene.tweens.add({
        targets: this.electron,
        x: Q.x,
        y: Q.y,
        duration: 140,
        ease: "sine.inOut",
        onComplete: () => hop(i + 1),
      });
    };
    hop(0);
  }

  // ---------------------------- animations ----------------------------

  private playIdleAnim() {
    this.scene.tweens.add({
      targets: this.shine,
      alpha: { from: 0.04, to: 0.08 },
      yoyo: true,
      duration: 1600,
      repeat: -1,
      ease: "sine.inOut",
    });
    this.scene.tweens.add({
      targets: this.leds,
      alpha: { from: 0.6, to: 0.9 },
      yoyo: true,
      duration: 900,
      repeat: -1,
      ease: "sine.inOut",
      delay: (_t: any, i: number) => i * 120,
    });
  }

  private ripple(color: number, alpha = 0.15) {
    const r = Math.max(this.w, this.h) * 0.6;
    const ring = this.scene.add.circle(0, 0, 6, color, alpha).setBlendMode(Phaser.BlendModes.ADD);
    this.add(ring);
    this.scene.tweens.add({
      targets: ring,
      radius: r,
      alpha: 0,
      duration: 260,
      ease: "quad.out",
      onComplete: () => ring.destroy(),
    });
  }

  // ---------------------------- utils ----------------------------

  private scaleFactor() {
    const w = this.scene.scale.width;
    return Phaser.Math.Clamp(w / 750, 0.85, 1.15);
  }

  setLabel(text: string) {
    this.labelTxt.setText(text);
    const maxWidth = this.w - 40;
    while (this.labelTxt.width > maxWidth) {
      const fs = parseInt(this.labelTxt.style.fontSize as string) - 1;
      if (fs < 12) break;
      this.labelTxt.setFontSize(fs);
    }
  }

  setEnabled(enabled: boolean) {
    if (enabled) this.hit.setInteractive({ useHandCursor: true });
    else this.hit.disableInteractive();
    this.setAlpha(enabled ? 1 : 0.6);
  }

  // mata tweens do “elétron” ao destruir o botão
  destroy(fromScene?: boolean): void {
    if (this.electron) this.scene.tweens.killTweensOf(this.electron);
    super.destroy(fromScene);
  }
}
