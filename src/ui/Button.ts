// src/ui/Button.ts
import Phaser from "phaser";
import { getTheme } from "../theme";

export type UIButtonVariant = "primary" | "secondary" | "ghost";
export type UIButtonSize = "sm" | "md" | "lg";

export type UIButtonTheme = {
  bg: string;
  bgHover: string;
  text: string;
  stroke: string;
  ghostText: string;
  ghostStroke: string;
};

export function mapThemeToButtonTheme(c = getTheme().colors): UIButtonTheme {
  return {
    bg: c.surfaceAlt,
    bgHover: c.gridHighlight,
    text: c.text,
    stroke: c.primary,
    ghostText: c.text,
    ghostStroke: c.gridHighlight,
  };
}

type UIButtonConfig = {
  x: number;
  y: number;
  label: string;
  variant?: UIButtonVariant;
  size?: UIButtonSize;
  theme?: UIButtonTheme;
  width?: number; // largura mínima
  onClick?: () => void;
};

export class UIButton extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Graphics;
  private lbl!: Phaser.GameObjects.Text;
  private _enabled = true;
  private _variant: UIButtonVariant;
  private _size: UIButtonSize;
  private _minWidth: number;
  private colors: UIButtonTheme;

  // guardo dimensões para hitbox/redraw
  private _w = 220;
  private _h = 44;
  private _radius = 18;

  constructor(scene: Phaser.Scene, cfg: UIButtonConfig) {
    super(scene, cfg.x, cfg.y);
    scene.add.existing(this);

    this._variant = cfg.variant ?? "primary";
    this._size = cfg.size ?? "md";
    this._minWidth = cfg.width ?? 220;
    this.colors = cfg.theme ?? mapThemeToButtonTheme();

    const { w, h, fontSize, radius } = this.measure();
    this._w = w; this._h = h; this._radius = radius;

    this.bg = scene.add.graphics();
    this.add(this.bg);
    this.redrawRounded(this.bg);

    this.lbl = scene.add
      .text(0, 0, cfg.label, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${fontSize}px`,
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.add(this.lbl);

    this.setLabel(cfg.label);
    this.applyVariantColors();

    // área clicável 100% do retângulo
    this.setSize(this._w, this._h);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-this._w / 2, -this._h / 2, this._w, this._h),
      Phaser.Geom.Rectangle.Contains,
    ).setScrollFactor(0).setDepth(5);

    this.on("pointerover", () => {
      if (!this._enabled) return;
      const fill =
        this._variant === "ghost" ? this.colors.ghostStroke : this.colors.bgHover;
      this.redrawRounded(this.bg, fill);
      this.setScale(1.02);
    });
    this.on("pointerout", () => {
      if (!this._enabled) return;
      this.applyVariantColors();
      this.setScale(1);
    });
    this.on("pointerdown", () => {
      if (!this._enabled) return;
      scene.tweens.add({ targets: this, scale: 0.97, duration: 60, ease: "sine.out" });
    });
    this.on("pointerup", () => {
      if (!this._enabled) return;
      scene.tweens.add({ targets: this, scale: 1.0, duration: 80, ease: "back.out(2.2)" });
      cfg.onClick?.();
    });
  }

  private measure() {
    const sizes: Record<UIButtonSize, { h: number; font: number; radius: number }> = {
      sm: { h: 34, font: 14, radius: 14 },
      md: { h: 44, font: 18, radius: 18 },
      lg: { h: 56, font: 22, radius: 22 },
    };
    const s = sizes[this._size];
    return { w: this._minWidth, h: s.h, fontSize: s.font, radius: s.radius };
  }

  private redrawRounded(g: Phaser.GameObjects.Graphics, fillHex?: string) {
    const strokeHex =
      this._variant === "ghost" ? this.colors.ghostStroke : this.colors.stroke;
    const fill =
      this._variant === "ghost"
        ? 0x000000
        : Phaser.Display.Color.HexStringToColor(fillHex ?? this.colors.bg).color;

    g.clear();
    g.fillStyle(fill, this._variant === "ghost" ? 0 : 1);
    g.fillRoundedRect(-this._w / 2, -this._h / 2, this._w, this._h, this._radius);
    g.lineStyle(
      2,
      Phaser.Display.Color.HexStringToColor(strokeHex).color,
      1,
    );
    g.strokeRoundedRect(-this._w / 2, -this._h / 2, this._w, this._h, this._radius);

    const c = getTheme().colors;
    this.lbl?.setColor(this._variant === "ghost" ? c.text : this.colors.text);
  }

  private applyVariantColors() {
    this.redrawRounded(this.bg);
  }

  setEnabled(v: boolean) {
    this._enabled = v;
    const alpha = v ? 1 : 0.5;
    this.setAlpha(alpha);
    this.disableInteractive();
    if (v)
      this.setInteractive(
        new Phaser.Geom.Rectangle(-this._w / 2, -this._h / 2, this._w, this._h),
        Phaser.Geom.Rectangle.Contains,
      );
  }

  setLabel(text: string) {
    this.lbl.setText(text);
  }

  setTheme(theme: UIButtonTheme) {
    this.colors = theme;
    this.applyVariantColors();
  }

  setMinWidth(w: number) {
    this._minWidth = w;
    const { h, radius } = this.measure();
    this._w = w; this._h = h; this._radius = radius;
    this.setSize(this._w, this._h);
    this.redrawRounded(this.bg);
    // atualiza hitarea
    this.setInteractive(
      new Phaser.Geom.Rectangle(-this._w / 2, -this._h / 2, this._w, this._h),
      Phaser.Geom.Rectangle.Contains,
    );
  }
}
