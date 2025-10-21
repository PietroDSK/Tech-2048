// src/ui/Button.ts

import Phaser from "phaser";
import { getTheme } from "../theme";

export type UIButtonVariant = "primary" | "secondary" | "ghost";
export type UIButtonSize = "sm" | "md" | "lg";

export type UIButtonTheme = {
  bg: string;         // "#RRGGBB"
  bgHover: string;    // "#RRGGBB"
  text: string;       // "#RRGGBB" or CSS color
  stroke: string;     // "#RRGGBB"
  ghostText: string;  // "#RRGGBB"
  ghostStroke: string;// "#RRGGBB"
};

export type UIButtonOpts = {
  x: number;
  y: number;
  label: string;
  size?: UIButtonSize;
  variant?: UIButtonVariant;
  width?: number;     // largura mínima
  height?: number;    // altura fixa (opcional)
  theme: UIButtonTheme;
  onClick?: () => void;
  disabled?: boolean;
  depth?: number;
};

function toIntColor(input: string | undefined, fallback = "#000000") {
  const hex = (typeof input === "string" && input.trim().length > 0) ? input : fallback;
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

export function mapThemeToButtonTheme(c: {
  panel?: string;
  panelHover?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
  textDim?: string;
}): UIButtonTheme {
  const val = (s: string | undefined, fb: string) =>
    (typeof s === "string" && s.trim().length > 0) ? s : fb;

  return {
    bg:          val(c.panel ?? c.primary,                     "#0c0c0f"),
    bgHover:     val(c.panelHover ?? c.secondary ?? c.primary, "#14141a"),
    text:        val(c.text,                                   "#ffffff"),
    stroke:      val(c.accent,                                 "#6bd8ff"),
    ghostText:   val(c.textDim ?? c.text,                      "#a3a3a3"),
    ghostStroke: val(c.accent ?? c.textDim,                    "#4ef9e0"),
  };
}

/**
 * UIButton:
 * - Fundo arredondado via Graphics
 * - Texto centralizado
 * - Área clicável = hitZone (100% do fundo) + fallback no Container (retângulo)
 * - Eventos ligados na hitZone **e** no Container (não duplica clique)
 */
export class UIButton extends Phaser.GameObjects.Container {
  private bgRect!: Phaser.GameObjects.Rectangle;
  private border!: Phaser.GameObjects.Graphics;
  private inner!: Phaser.GameObjects.Graphics;
  private traces!: Phaser.GameObjects.Graphics;
  private vias!: Phaser.GameObjects.Graphics;
  private shine!: Phaser.GameObjects.Rectangle;
  private leds: Phaser.GameObjects.Arc[] = [];
  private electron?: Phaser.GameObjects.Arc;

  private labelObj!: Phaser.GameObjects.Text;
  private hitZone!: Phaser.GameObjects.Zone; // área clicável principal
  private _opts: UIButtonOpts;

  private _size: UIButtonSize;
  private _variant: UIButtonVariant;
  private _minWidth?: number;
  private _fixedHeight?: number;

  private _w = 0;
  private _h = 0;
  private _radius = 14;
  private _isDisabled = false;
  private pulseAnim?: Phaser.Tweens.Tween;
  private paths: Phaser.Math.Vector2[][] = [];

  constructor(scene: Phaser.Scene, opts: UIButtonOpts) {
    super(scene, opts.x, opts.y);
    this._opts = opts;
    this._size = opts.size ?? "md";
    this._variant = opts.variant ?? "primary";
    this._minWidth = opts.width;
    this._fixedHeight = opts.height;
    this._isDisabled = !!opts.disabled;

    scene.add.existing(this);
    if (opts.depth != null) this.setDepth(opts.depth);

    // label (precisa criar primeiro para medir)
    const fontSize = this.sizeToFont(this._size);
    this.labelObj = scene.add.text(0, 0, opts.label, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: `${fontSize}px`,
      color: this.resolveTextColor(),
      align: "center",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.labelObj.setResolution(2);

    // medir e desenhar
    const { w, h, radius } = this.measure();
    this._w = Math.max(this._minWidth ?? 0, w);
    this._h = h;
    this._radius = radius;

    // Construir estilo PCB
    this.buildPCBStyle();
    this.add(this.labelObj);

    // hitZone 100% do botão
    this.hitZone = scene.add.zone(0, 0, this._w, this._h).setOrigin(0.5);
    this.hitZone.setInteractive({ cursor: "pointer", useHandCursor: true });
    this.add(this.hitZone);
    this.bringToTop(this.hitZone);

    // fallback: também deixar o Container interativo com retângulo do mesmo tamanho
    this.setSize(this._w, this._h);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-this._w / 2, -this._h / 2, this._w, this._h),
      Phaser.Geom.Rectangle.Contains
    );

    // Eventos pela hitZone (principal)
    this.hitZone.on("pointerover", this.onOver, this);
    this.hitZone.on("pointerout",  this.onOut,  this);
    this.hitZone.on("pointerdown", this.onDown, this);
    this.hitZone.on("pointerup",   this.onUp,   this);

    // Eventos no Container (fallback)
    this.on("pointerover", this.onOver, this);
    this.on("pointerout",  this.onOut,  this);
    this.on("pointerdown", this.onDown, this);
    this.on("pointerup",   this.onUp,   this);

    if (this._isDisabled) {
      this.disableAllInteraction();
      this.setAlpha(0.75);
    }
  }

  setLabel(text: string) {
    this.labelObj.setText(text);
  }

  setVariant(variant: UIButtonVariant) {
    this._variant = variant;
  }

  setDisabled(state: boolean) {
    this._isDisabled = state;
    if (state) {
      this.disableAllInteraction();
      this.setAlpha(0.6);
    } else {
      this.enableAllInteraction();
      this.setAlpha(1);
    }
  }

  destroy(fromScene?: boolean) {
    if (this.electron) this.scene.tweens.killTweensOf(this.electron);
    this.pulseAnim?.remove();
    this.pulseAnim = undefined;
    super.destroy(fromScene);
  }

  setEnabled(enabled: boolean) {
    this.setDisabled(!enabled);
  }

  // ===== Internos =====

  private sizeToFont(size: UIButtonSize) {
    switch (size) {
      case "sm": return 18;
      case "lg": return 28;
      default:   return 22;
    }
  }

  private measure() {
    const paddingX = this._size === "lg" ? 28 : this._size === "sm" ? 18 : 22;
    const paddingY = this._size === "lg" ? 16 : this._size === "sm" ? 10 : 12;
    const radius   = this._size === "lg" ? 18 : this._size === "sm" ? 12 : 14;

    const bounds = this.labelObj.getBounds();
    const textW = Math.ceil(bounds.width);
    const textH = Math.ceil(bounds.height);

    const targetW = textW + paddingX * 2;
    const targetH = this._fixedHeight ?? (textH + paddingY * 2);

    return { w: targetW, h: targetH, radius };
  }

  private buildPCBStyle() {
    const theme = this._opts.theme;
    // Usar cores apropriadas do tema
    const surfaceColor = Phaser.Display.Color.HexStringToColor(
      this.getThemeColor('surfaceAlt', '#1a1a24')
    ).color;
    const innerSurfaceColor = Phaser.Display.Color.HexStringToColor(
      this.getThemeColor('surface', '#0f0f16')
    ).color;

    const primaryColor = toIntColor(theme.stroke, "#14ffe1");

    // Background (usando Graphics para ter cantos arredondados)
    const bgGraphics = this.scene.add.graphics();
    bgGraphics.fillStyle(surfaceColor, 1);
    bgGraphics.fillRoundedRect(-this._w / 2, -this._h / 2, this._w, this._h, this._radius);
    this.add(bgGraphics);

    // Border (duplo)
    this.border = this.scene.add.graphics();
    this.border.lineStyle(3, primaryColor, 0.9);
    this.border.strokeRoundedRect(-this._w / 2, -this._h / 2, this._w, this._h, this._radius);
    this.border.lineStyle(1, primaryColor, 0.5);
    this.border.strokeRoundedRect(-this._w / 2 + 5, -this._h / 2 + 5, this._w - 10, this._h - 10, this._radius - 4);
    this.add(this.border);

    // Inner panel
    this.inner = this.scene.add.graphics();
    this.inner
      .fillStyle(innerSurfaceColor, 0.55)
      .fillRoundedRect(-this._w / 2 + 8, -this._h / 2 + 8, this._w - 16, this._h - 16, this._radius - 6);
    this.add(this.inner);

    // Traces e vias
    this.traces = this.scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.vias = this.scene.add.graphics();
    this.drawTraces(primaryColor);
    this.add(this.traces);
    this.add(this.vias);

    // LEDs nos cantos
    const ledR = 3;
    const offs = 10;
    const pts = [
      { x: -this._w / 2 + offs, y: -this._h / 2 + offs },
      { x: this._w / 2 - offs, y: -this._h / 2 + offs },
      { x: -this._w / 2 + offs, y: this._h / 2 - offs },
      { x: this._w / 2 - offs, y: this._h / 2 - offs },
    ];
    this.leds = pts.map((p) =>
      this.scene.add
        .circle(p.x, p.y, ledR, primaryColor, 0.7)
        .setBlendMode(Phaser.BlendModes.ADD),
    );
    this.add(this.leds);

    // Shine effect
    this.shine = this.scene.add
      .rectangle(-this._w * 0.25, -this._h * 0.6, this._w * 0.9, this._h * 0.4, 0xffffff, 0.05)
      .setOrigin(0, 0)
      .setAngle(18);
    this.add(this.shine);

    // Iniciar animações
    this.startIdleAnimations();
  }

  private drawTraces(primaryColor: number) {
    const lineW = 1.5;

    this.traces.clear();
    this.vias.clear();
    this.paths = [];

    const cols = 3;
    const rows = 2;
    const pad = { x: 18, y: 12 };
    const gx = (i: number) => -this._w / 2 + pad.x + (i * (this._w - pad.x * 2)) / (cols - 1);
    const gy = (j: number) => -this._h / 2 + pad.y + (j * (this._h - pad.y * 2)) / (rows - 1);

    const pairs: Array<[number, number, number, number, "vh" | "hv"]> = [
      [0, 0, 0, 1, "vh"],
      [2, 0, 2, 1, "vh"],
      [0, 1, 1, 1, "hv"],
      [1, 1, 2, 1, "hv"],
    ];

    this.traces.lineStyle(lineW, primaryColor, 0.55);
    this.vias.fillStyle(primaryColor, 0.7);

    for (const [cx1, cy1, cx2, cy2, mode] of pairs) {
      const A = new Phaser.Math.Vector2(gx(cx1), gy(cy1));
      const B = new Phaser.Math.Vector2(gx(cx2), gy(cy2));
      const mid = mode === "vh" ? new Phaser.Math.Vector2(A.x, B.y) : new Phaser.Math.Vector2(B.x, A.y);

      this.paths.push([A, mid, B]);

      this.traces.strokePoints([A, mid, B], false);
      this.vias.fillCircle(mid.x, mid.y, 2);
    }
  }

  private startIdleAnimations() {
    // Shine animation
    this.scene.tweens.add({
      targets: this.shine,
      alpha: { from: 0.04, to: 0.08 },
      yoyo: true,
      duration: 1600,
      repeat: -1,
      ease: "sine.inOut",
    });

    // LEDs animation
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

  private drawRoundedRect(
    g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number
  ) {
    const maxR = Math.min(r, Math.min(w, h) / 2);
    g.beginPath();
    g.moveTo(x + maxR, y);
    g.lineTo(x + w - maxR, y);
    g.arc(x + w - maxR, y + maxR, maxR, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(360), false);
    g.lineTo(x + w, y + h - maxR);
    g.arc(x + w - maxR, y + h - maxR, maxR, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(90), false);
    g.lineTo(x + maxR, y + h);
    g.arc(x + maxR, y + h - maxR, maxR, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(180), false);
    g.lineTo(x, y + maxR);
    g.arc(x + maxR, y + maxR, maxR, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270), false);
    g.closePath();
  }

  /** Mantém hitZone e fallback do Container com o tamanho atual. */
  private refreshHitAreas() {
    // hitZone
    if (this.hitZone) {
      this.hitZone.setSize(this._w, this._h).setOrigin(0.5);
      if (!this._isDisabled) this.hitZone.setInteractive({ cursor: "pointer", useHandCursor: true });
      this.bringToTop(this.hitZone);
    }
    // Container fallback
    this.setSize(this._w, this._h);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-this._w / 2, -this._h / 2, this._w, this._h),
      Phaser.Geom.Rectangle.Contains
    );
    if (this.input && !this._isDisabled) this.input.cursor = "pointer";
  }

  private disableAllInteraction() {
    this.hitZone?.disableInteractive();
    this.disableInteractive();
  }

  private enableAllInteraction() {
    this.refreshHitAreas();
  }

  private isGhost() {
    return this._variant === "ghost";
  }

  private getThemeColor(key: string, fallback: string): string {
    // Pegar do tema global do jogo
    try {
      const theme = getTheme();
      return (theme.colors as any)[key] || fallback;
    } catch {
      return fallback;
    }
  }

  private onOver() {
    if (this._isDisabled) return;

    const primaryColor = toIntColor(this._opts.theme.stroke, "#14ffe1");

    // Animar border e LEDs
    this.scene.tweens.add({
      targets: [this.border],
      alpha: 1,
      duration: 120,
      ease: "sine.out",
    });
    this.scene.tweens.add({
      targets: this.leds,
      alpha: 1,
      scale: 1.12,
      duration: 120,
      ease: "sine.out",
    });

    // Criar e animar elétron
    if (!this.electron) {
      this.electron = this.scene.add.circle(0, 0, 3, primaryColor, 1).setBlendMode(Phaser.BlendModes.ADD);
      this.add(this.electron);
    }
    this.scene.tweens.killTweensOf(this.electron);
    this.runElectron();
    this.electron.setAlpha(1);
  }

  private onOut() {
    if (this._isDisabled) return;

    // Reverter animações
    this.scene.tweens.add({
      targets: [this.border],
      alpha: 0.9,
      duration: 120,
      ease: "sine.out",
    });
    this.scene.tweens.add({
      targets: this.leds,
      alpha: 0.7,
      scale: 1.0,
      duration: 120,
      ease: "sine.out",
    });

    // Parar elétron
    if (this.electron) {
      this.scene.tweens.killTweensOf(this.electron);
      this.electron.setAlpha(0);
    }
  }

  private runElectron() {
    if (!this.electron || this.paths.length === 0) return;
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

  private onDown() {
    if (this._isDisabled) return;
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.985,
      scaleY: 0.985,
      duration: 70,
      ease: "sine.out",
    });
    this.ripple(0xffffff, 0.12);
  }

  private onUp() {
    if (this._isDisabled) return;
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 110,
      ease: "back.out(2)",
    });
    this._opts.onClick?.();
  }

  private ripple(color: number, alpha = 0.15) {
    const r = Math.max(this._w, this._h) * 0.6;
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

  private resolveTextColor() {
    const t = this._opts.theme;
    return this._variant === "ghost" ? t.ghostText : t.text;
  }
}
