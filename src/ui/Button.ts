// src/ui/Button.ts
import Phaser from "phaser";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonColors {
  bg: string;
  fg: string;
  hoverBg?: string;
  border?: string;
  glow?: string;
}
export interface ButtonTheme {
  primary: ButtonColors;
  secondary: ButtonColors;
  ghost: ButtonColors;
  danger: ButtonColors;
}
export interface ButtonOpts {
  x: number;
  y: number;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: number;
  onClick?: () => void;
  theme: ButtonTheme;
}

const SIZE_MAP = {
  sm: { font: 14, padX: 14, padY: 8, height: 32, radius: 8 },
  md: { font: 18, padX: 20, padY: 10, height: 40, radius: 10 },
  lg: { font: 26, padX: 28, padY: 14, height: 52, radius: 12 },
};

export class UIButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private _variant: ButtonVariant;
  private _size: ButtonSize;
  private colors: ButtonColors;
  private opts: ButtonOpts;
  private _enabled = true;
  private _loading = false;
  private _width?: number;

  constructor(scene: Phaser.Scene, opts: ButtonOpts) {
    super(scene, opts.x, opts.y);
    this.opts = opts;
    this._variant = opts.variant ?? "primary";
    this._size = opts.size ?? "md";
    this._width = opts.width;

    const size = SIZE_MAP[this._size];
    this.colors = this.pickColors();

    const bgColor = Phaser.Display.Color.HexStringToColor(this.colors.bg).color;
    const borderColor = this.colors.border
      ? Phaser.Display.Color.HexStringToColor(this.colors.border).color
      : bgColor;

    this.bg = scene.add
      .rectangle(0, 0, 10, size.height, bgColor, 1)
      .setOrigin(0.5); // apenas origem central
    if (this.colors.border) {
      this.bg.setStrokeStyle(1, borderColor, 0.7);
    }

    this.label = scene.add
      .text(0, 0, opts.label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${size.font}px`,
        color: this.colors.fg,
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    this.add([this.bg, this.label]);
    scene.add.existing(this);

    this.relayout();
    this.makeInteractive();

    this.on("pointerover", () => this.hover(true));
    this.on("pointerout", () => this.hover(false));
    this.on("pointerdown", () => this.press(true));
    this.on("pointerup", () => {
      this.press(false);
      if (this._enabled && !this._loading) this.opts.onClick?.();
    });

    this.setDepth(900);
    this.setScrollFactor(0);
  }

  private pickColors(): ButtonColors {
    const t = this.opts.theme;
    return this._variant === "primary"
      ? t.primary
      : this._variant === "secondary"
      ? t.secondary
      : this._variant === "danger"
      ? t.danger
      : t.ghost;
  }

  private makeInteractive() {
    const w = this.bg.width;
    const h = this.bg.height;
    this.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  private relayout() {
    const size = SIZE_MAP[this._size];
    const textW = Math.ceil(this.label.width || this.label.getBounds().width);
    const w = Math.max(this._width ?? 0, textW + size.padX * 2, 64);

    this.bg.setSize(w, size.height);
    this.bg.setOrigin(0.5); // sempre centralizado no container
    this.bg.x = 0;
    this.bg.y = 0;

    this.label.setOrigin(0.5);
    this.label.x = 0;
    this.label.y = 0;

    if (this.colors.glow) {
      this.label.setShadow(0, 0, this.colors.glow, 10, true, true);
    }

    this.removeInteractive();
    this.makeInteractive();
  }

  private hover(on: boolean) {
    if (!this._enabled || this._loading) return;
    const to = Phaser.Display.Color.HexStringToColor(
      on ? this.colors.hoverBg ?? this.colors.bg : this.colors.bg,
    ).color;
    this.scene.tweens.add({
      targets: this.bg,
      fillColor: to,
      duration: 100,
      ease: "sine.out",
    });
    this.scene.tweens.add({
      targets: this,
      scale: on ? 1.03 : 1,
      duration: 100,
      ease: "sine.out",
    });
  }

  private press(on: boolean) {
    if (!this._enabled || this._loading) return;
    this.scene.tweens.add({
      targets: this,
      scale: on ? 0.98 : 1.0,
      duration: 80,
      ease: "sine.out",
    });
  }

  // --- API pública ---
  setEnabled(v: boolean) {
    this._enabled = v;
    this.alpha = v ? 1 : 0.6;
    this.disableInteractive();
    if (v) this.makeInteractive();
  }

  setLoading(v: boolean) {
    this._loading = v;
    this.label.setText(v ? "..." : this.opts.label);
    this.alpha = v ? 0.8 : 1;
    this.relayout();
  }

  setVariant(variant: ButtonVariant) {
    this._variant = variant;
    this.colors = this.pickColors();
    this.bg.fillColor = Phaser.Display.Color.HexStringToColor(
      this.colors.bg,
    ).color;
    this.label.setColor(this.colors.fg);
  }

  /** Renomeado para evitar conflito com Container.setSize(width, height) */
  setButtonSize(size: ButtonSize) {
    this._size = size;
    const s = SIZE_MAP[size];
    this.label.setFontSize(s.font);
    this.relayout();
  }

  setWidth(w?: number) {
    this._width = w;
    this.relayout();
  }

  setLabel(text: string) {
    this.opts.label = text;
    this.label.setText(text);
    this.relayout();
  }
}

// mapeamento de tema -> cores dos botões
export function mapThemeToButtonTheme(themeColors: {
  primary: string;
  secondary: string;
  text: string;
  textDim: string;
  bg: string;
  glow?: string;
  surface?: string;
}): ButtonTheme {
  return {
    primary: {
      bg: themeColors.primary,
      fg: themeColors.bg,
      hoverBg: themeColors.secondary,
      glow: themeColors.glow,
    },
    secondary: {
      bg: themeColors.surface ?? "#2a2a2a",
      fg: themeColors.text,
      hoverBg: themeColors.primary,
      border: themeColors.primary,
      glow: themeColors.glow,
    },
    ghost: {
      bg: "#00000000",
      fg: themeColors.text,
      hoverBg: "#ffffff18",
      border: themeColors.textDim,
      glow: themeColors.glow,
    },
    danger: {
      bg: "#e8516b",
      fg: "#0b0b0b",
      hoverBg: "#ff6b85",
      glow: themeColors.glow,
    },
  };
}
