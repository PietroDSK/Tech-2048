// src/ui/Button.ts
import Phaser from "phaser";

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
    stroke:      val(c.accent,                                 "#14ffe1"),
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
  private bg!: Phaser.GameObjects.Graphics;
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

    // fundo
    this.bg = scene.add.graphics();
    this.add(this.bg);

    // label
    const fontSize = this.sizeToFont(this._size);
    this.labelObj = scene.add.text(0, 0, opts.label, {
      fontFamily: "Montserrat, Arial, sans-serif",
      fontSize: `${fontSize}px`,
      color: this.resolveTextColor(),
      align: "center",
    }).setOrigin(0.5);
    this.add(this.labelObj);

    // medir e desenhar
    const { w, h, radius } = this.measure();
    this._w = Math.max(this._minWidth ?? 0, w);
    this._h = h;
    this._radius = radius;

    this.redraw();

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

  setMinWidth(w: number) {
    this._minWidth = w;
    const { w: mw, h, radius } = this.measure();
    this._w = Math.max(w, mw);
    this._h = h; this._radius = radius;
    this.redraw();
    this.refreshHitAreas();
  }

  resize(minWidth?: number, fixedHeight?: number) {
    if (minWidth != null) this._minWidth = minWidth;
    if (fixedHeight != null) this._fixedHeight = fixedHeight;
    const { w, h, radius } = this.measure();
    this._w = Math.max(this._minWidth ?? 0, w);
    this._h = h; this._radius = radius;
    this.redraw();
    this.refreshHitAreas();
  }

  setLabel(text: string) {
    this.labelObj.setText(text);
    const { w, h, radius } = this.measure();
    this._w = Math.max(this._minWidth ?? 0, w);
    this._h = h; this._radius = radius;
    this.redraw();
    this.refreshHitAreas();
  }

  setVariant(variant: UIButtonVariant) {
    this._variant = variant;
    this.redraw();
  }

  setDisabled(state: boolean) {
    this._isDisabled = state;
    if (state) {
      this.disableAllInteraction();
      this.setAlpha(0.75);
    } else {
      this.enableAllInteraction();
      this.setAlpha(1);
    }
    this.redraw();
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

  private redraw() {
    const theme = this._opts.theme;

    const baseBg  = theme.bg; // hover é tratado em onOver/onOut
    const stroke  = this.isGhost() ? theme.ghostStroke : theme.stroke;
    const textCol = this.isGhost() ? theme.ghostText  : theme.text;

    // limpar
    this.bg.clear();

    // fundo (ghost não preenche)
    if (!this.isGhost()) {
      const fillInt = toIntColor(baseBg, "#0c0c0f");
      this.bg.fillStyle(fillInt, 1);
      this.drawRoundedRect(this.bg, -this._w / 2, -this._h / 2, this._w, this._h, this._radius);
      this.bg.fillPath();
    }

    // stroke
    const strokeInt = toIntColor(stroke, "#14ffe1");
    this.bg.lineStyle(2, strokeInt, this.isGhost() ? 0.9 : 1);
    this.drawRoundedRect(this.bg, -this._w / 2, -this._h / 2, this._w, this._h, this._radius);
    this.bg.strokePath();

    // label
    this.labelObj.setColor(textCol);
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

  private onOver() {
    if (this._isDisabled) return;
    const t = this._opts.theme;
    const saveBg = t.bg;
    this._opts.theme = { ...t, bg: t.bgHover };
    this.redraw();
    this._opts.theme = { ...t, bg: saveBg };
  }

  private onOut() {
    if (this._isDisabled) return;
    this.redraw();
  }

  private onDown() {
    if (this._isDisabled) return;
    this.setAlpha(0.9);
  }

  private onUp() {
    if (this._isDisabled) return;
    this.setAlpha(1);
    this._opts.onClick?.();
  }

  private resolveTextColor() {
    const t = this._opts.theme;
    return this._variant === "ghost" ? t.ghostText : t.text;
  }
}
