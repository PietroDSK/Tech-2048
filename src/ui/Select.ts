// src/ui/Select.ts
import Phaser from "phaser";
import { getTheme } from "../theme";

/**
 * Select tipo PCB (dropdown) com estilo placa de circuito
 */
export class Select extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Graphics;
  private labelTxt!: Phaser.GameObjects.Text;
  private valueTxt!: Phaser.GameObjects.Text;
  private arrow!: Phaser.GameObjects.Graphics;
  private hitZone!: Phaser.GameObjects.Zone;
  private dropdown?: Phaser.GameObjects.Container;
  private dropdownBg?: Phaser.GameObjects.Graphics;
  private dropdownItems: Phaser.GameObjects.Container[] = [];

  private _index: number;
  private _options: string[];
  private _label: string;
  private _isOpen = false;
  private w = 0;
  private h = 50;
  private onChange: (index: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    options: string[],
    initialIndex: number,
    onChange: (index: number) => void
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this._options = options;
    this._index = Phaser.Math.Clamp(initialIndex, 0, options.length - 1);
    this._label = label;
    this.onChange = onChange;

    const maxW = Math.min(360, scene.scale.width * 0.82);
    this.w = maxW;

    this.build();
    this.makeInteractive();
    this.setDepth(100);
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

    // Value text (valor selecionado)
    this.valueTxt = this.scene.add
      .text(this.w / 2 - 40, 0, this._options[this._index], {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: c.primary || "#14ffe1",
      })
      .setOrigin(1, 0.5);
    this.valueTxt.setResolution(2);
    this.add(this.valueTxt);

    // Arrow (seta para baixo)
    this.arrow = this.scene.add.graphics();
    this.drawArrow(false);
    this.add(this.arrow);

    this.setSize(this.w, this.h);
  }

  private drawArrow(isOpen: boolean) {
    const c = getTheme().colors;
    const primaryColor = Phaser.Display.Color.HexStringToColor(c.primary || "#14ffe1").color;
    const arrowX = this.w / 2 - 18;
    const arrowY = 0;

    this.arrow.clear();
    this.arrow.fillStyle(primaryColor, 0.8);

    if (isOpen) {
      // Seta para cima
      this.arrow.fillTriangle(
        arrowX - 5, arrowY + 3,
        arrowX + 5, arrowY + 3,
        arrowX, arrowY - 3
      );
    } else {
      // Seta para baixo
      this.arrow.fillTriangle(
        arrowX - 5, arrowY - 3,
        arrowX + 5, arrowY - 3,
        arrowX, arrowY + 3
      );
    }
  }

  private makeInteractive() {
    this.hitZone = this.scene.add
      .zone(0, 0, this.w, this.h)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.add(this.hitZone);

    this.hitZone.on("pointerup", () => {
      if (this._isOpen) {
        this.closeDropdown();
      } else {
        this.openDropdown();
      }
    });
  }

  private openDropdown() {
    if (this._isOpen || this._options.length === 0) return;

    this._isOpen = true;
    this.drawArrow(true);

    const c = getTheme().colors;
    const surfaceColor = Phaser.Display.Color.HexStringToColor(c.surfaceAlt || "#1a1a24").color;
    const primaryColor = Phaser.Display.Color.HexStringToColor(c.primary || "#14ffe1").color;

    const itemHeight = 44;
    const dropdownH = this._options.length * itemHeight;

    // Container do dropdown
    this.dropdown = this.scene.add.container(0, this.h / 2 + 8);
    this.dropdown.setDepth(1000);

    // Background do dropdown
    this.dropdownBg = this.scene.add.graphics();
    this.dropdownBg.fillStyle(surfaceColor, 1);
    this.dropdownBg.fillRoundedRect(-this.w / 2, 0, this.w, dropdownH, 14);
    this.dropdownBg.lineStyle(2.5, primaryColor, 0.9);
    this.dropdownBg.strokeRoundedRect(-this.w / 2, 0, this.w, dropdownH, 14);
    this.dropdown.add(this.dropdownBg);

    // Criar itens
    this.dropdownItems = [];
    this._options.forEach((option, index) => {
      const itemY = index * itemHeight + itemHeight / 2;
      const itemContainer = this.scene.add.container(0, itemY);

      // Highlight se selecionado
      if (index === this._index) {
        const highlight = this.scene.add.graphics();
        highlight.fillStyle(primaryColor, 0.15);
        highlight.fillRoundedRect(-this.w / 2 + 4, -itemHeight / 2 + 2, this.w - 8, itemHeight - 4, 10);
        itemContainer.add(highlight);
      }

      // Texto do item
      const itemText = this.scene.add
        .text(0, 0, option, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "15px",
          color: index === this._index ? c.primary : c.text,
        })
        .setOrigin(0.5);
      itemText.setResolution(2);
      itemContainer.add(itemText);

      // Hit zone do item
      const itemHitZone = this.scene.add
        .zone(0, 0, this.w, itemHeight)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      itemContainer.add(itemHitZone);

      itemHitZone.on("pointerover", () => {
        itemText.setScale(1.05);
      });

      itemHitZone.on("pointerout", () => {
        itemText.setScale(1);
      });

      itemHitZone.on("pointerup", () => {
        this.selectOption(index);
      });

      this.dropdown!.add(itemContainer);
      this.dropdownItems.push(itemContainer);
    });

    this.add(this.dropdown);

    // Animação de abertura
    this.dropdown.setAlpha(0);
    this.dropdown.setScale(1, 0.8);
    this.scene.tweens.add({
      targets: this.dropdown,
      alpha: 1,
      scaleY: 1,
      duration: 150,
      ease: "back.out(2)",
    });

    // Fechar ao clicar fora
    this.scene.input.once("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const bounds = this.getBounds();
      const dropBounds = this.dropdown!.getBounds();
      if (!Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y) &&
          !Phaser.Geom.Rectangle.Contains(dropBounds, pointer.x, pointer.y)) {
        this.closeDropdown();
      }
    });
  }

  private closeDropdown() {
    if (!this._isOpen || !this.dropdown) return;

    this._isOpen = false;
    this.drawArrow(false);

    // Animação de fechamento
    this.scene.tweens.add({
      targets: this.dropdown,
      alpha: 0,
      scaleY: 0.8,
      duration: 120,
      ease: "sine.in",
      onComplete: () => {
        this.dropdown?.destroy();
        this.dropdown = undefined;
        this.dropdownItems = [];
      },
    });
  }

  private selectOption(index: number) {
    if (index === this._index) {
      this.closeDropdown();
      return;
    }

    this._index = index;
    this.valueTxt.setText(this._options[index]);
    this.closeDropdown();
    this.onChange(index);

    // Efeito visual de seleção
    this.scene.tweens.add({
      targets: this.valueTxt,
      scale: { from: 1.1, to: 1 },
      duration: 200,
      ease: "back.out(2)",
    });
  }

  getIndex(): number {
    return this._index;
  }

  getValue(): string {
    return this._options[this._index];
  }

  destroy(fromScene?: boolean) {
    this.dropdown?.destroy();
    super.destroy(fromScene);
  }
}
