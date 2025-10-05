// src/scenes/ThemeScene.ts
import Phaser from "phaser";
import {
  getTheme,
  themes,
  ThemeKey,
  setThemeKey,
  getTileColorForKey,
} from "../theme";
import { t } from "../i18n";
import { UIButton, mapThemeToButtonTheme } from "../ui/Button";
import { MenuIcon } from "../ui/MenuIcon";
import { hasUnlocked2048 } from "../storage";

export default class ThemeScene extends Phaser.Scene {
  constructor() {
    super("ThemeScene");
  }

  create() {
    const c = getTheme().colors;
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(c.bg);

    // menu topo direito
    new MenuIcon(this, width - 30, 30);

    const title = this.add
      .text(24, 40, t("themes"), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "28px",
        color: c.text,
      })
      .setOrigin(0, 0.5);
    title.setShadow(0, 0, c.glow, 14, true, true);

    const keys = Object.keys(themes) as ThemeKey[];
    const cardW = Math.min(300, width * 0.84);
    const cardH = 160;

    // trava: somente neon-pcb liberado até 2048
    const unlocked = hasUnlocked2048();
    const alwaysFreeKey: ThemeKey = "neon-pcb" as ThemeKey;

    let y = 130;

    keys.forEach((key) => {
      const theme = themes[key];
      const cardX = width / 2;

      // glow atrás do card
      const glow = this.add.graphics();
      glow.fillStyle(
        Phaser.Display.Color.HexStringToColor(theme.colors.glow).color,
        0.18,
      );
      glow.fillRoundedRect(
        cardX - cardW / 2 - 6,
        y - 6,
        cardW + 12,
        cardH + 12,
        16,
      );

      // card
      const card = this.add.graphics();
      card.fillStyle(
        Phaser.Display.Color.HexStringToColor(theme.colors.surfaceAlt).color,
        1,
      );
      card.fillRoundedRect(cardX - cardW / 2, y, cardW, cardH, 14);
      card.lineStyle(
        2,
        Phaser.Display.Color.HexStringToColor(theme.colors.gridHighlight).color,
        1,
      );
      card.strokeRoundedRect(cardX - cardW / 2, y, cardW, cardH, 14);

      // título do tema
      const titleText = this.add
        .text(cardX - cardW / 2 + 14, y + 14, theme.name, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "16px",
          color: theme.colors.text,
          fontStyle: "bold",
        })
        .setOrigin(0, 0);

      // preview 2x2 (não será coberto por nada)
      const cell = 40,
        gap = 10;
      let px = cardX - cardW / 2 + 14,
        py = y + 46;
      for (let i = 0; i < 4; i++) {
        const val = [2, 4, 8, 16][i];
        const g = this.add.graphics();
        g.fillStyle(
          Phaser.Display.Color.HexStringToColor(
            getTileColorForKey(key, val),
          ).color,
          1,
        );
        g.fillRoundedRect(px, py, cell, cell, 8);
        g.lineStyle(
          2,
          Phaser.Display.Color.HexStringToColor(theme.colors.primary).color,
          1,
        );
        g.strokeRoundedRect(px, py, cell, cell, 8);
        const txt = this.add
          .text(px + cell / 2, py + cell / 2, String(val), {
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "16px",
            color: val <= 4 ? theme.colors.text : theme.colors.bg,
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        px += cell + gap;
        if (i === 1) {
          px = cardX - cardW / 2 + 14;
          py += cell + gap;
        }
      }

      const isCurrent = getTheme().key === key;
      const locked = !unlocked && key !== alwaysFreeKey;

      // botão (fica dentro do card, no canto inferior direito)
      const btn = new UIButton(this, {
        x: cardX + cardW / 2 - 80,
        y: y + cardH - 24,
        label: locked
          ? t("locked")
          : isCurrent
          ? t("selected")
          : t("select"),
        variant: locked ? "ghost" : isCurrent ? "secondary" : "primary",
        size: "sm",
        width: 120,
        theme: mapThemeToButtonTheme(theme.colors),
        onClick: () => {
          if (locked) return;
          setThemeKey(key);
          this.scene.restart();
        },
      });

      // Se estiver bloqueado: desabilita e coloca a mensagem ABAIXO do card
      let extraSpacing = 24; // espaçamento padrão após o card
      if (locked) {
        btn.setEnabled(false);

        // mensagem centralizada abaixo do card (fora do card, sem cobertura)
        const hint = this.add
          .text(
            cardX,
            y + cardH + 10,
            t("unlock_other_modes_hint"),
            {
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "12px",
              color: theme.colors.textDim,
              align: "center",
              wordWrap: { width: cardW * 0.96 },
            },
          )
          .setOrigin(0.5, 0);

        // aumenta o espaçamento vertical para acomodar a mensagem
        extraSpacing = 10 + hint.height + 24;
      }

      // próximo bloco
      y += cardH + extraSpacing;
    });
  }
}
