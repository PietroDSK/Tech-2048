// src/scenes/ThemeScene.ts
import Phaser from "phaser";
import { getTheme, themes, setThemeKey, getTileColorForKey } from "../theme";
import { hasUnlocked2048 } from "../storage";
import { enterWithSwap } from "../animations/transitions";
import { BackButton } from "../ui/BackButton";

type ThemeKey = keyof typeof themes;

export default class ThemeScene extends Phaser.Scene {
  constructor() { super("ThemeScene"); }

  create(data:any) {
    const activeTheme = getTheme();
    const { width, height } = this.scale;
    const unlocked = hasUnlocked2048();

    this.cameras.main.setBackgroundColor(activeTheme.colors.bg);
    enterWithSwap(this, data);

    new BackButton(this, 50, 26, "Menu");

    // Halo / título
    const halo = this.add.graphics();
    halo.fillStyle(Phaser.Display.Color.HexStringToColor(activeTheme.colors.glow).color, 0.22);
    halo.fillRoundedRect(width * 0.06, height * 0.08, width * 0.88, height * 0.84, 24);

    const title = this.add.text(width / 2, height * 0.12, "Temas", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "38px",
      color: activeTheme.colors.text,
      fontStyle: "bold",
    }).setOrigin(0.5);
    title.setShadow(0, 0, activeTheme.colors.glow, 16, true, true);

    // Painel (viewport da lista)
    const pw = Math.floor(width * 0.88);
    const ph = Math.floor(height * 0.72);
    const px = Math.floor((width - pw) / 2);
    const py = Math.floor(height * 0.18);

    const panel = this.add.graphics();
    panel.fillStyle(Phaser.Display.Color.HexStringToColor(activeTheme.colors.surface).color, 1);
    panel.fillRoundedRect(px, py, pw, ph, 18);
    panel.lineStyle(1, Phaser.Display.Color.HexStringToColor(activeTheme.colors.primary).color, 0.28);
    panel.strokeRoundedRect(px, py, pw, ph, 18);

    // Container da lista ANCORADO no canto do painel
    const listContainer = this.add.container(px, py);

    // Máscara geométrica (não adicionada à display list)
    const maskGfx = this.make.graphics({ x: 0, y: 0, add: false });
    maskGfx.fillStyle(0xffffff, 1).fillRoundedRect(px, py, pw, ph, 18);
    const geoMask = maskGfx.createGeometryMask();
    listContainer.setMask(geoMask);

    // Grid de cards (coordenadas LOCAIS dentro do listContainer)
    const colCount = width >= 700 ? 2 : 1;
    const margin = 18;
    const cardW = Math.floor((pw - margin * (colCount + 1)) / colCount);
    const cardH = 260;

    const entries = Object.values(themes);
    entries.forEach((th, idx) => {
      const col = idx % colCount;
      const row = Math.floor(idx / colCount);
      const localX = margin + col * (cardW + margin);
      const localY = margin + row * (cardH + margin);
      const card = this.drawThemeCard(localX, localY, cardW, cardH, th.key as ThemeKey, unlocked);
      listContainer.add(card);

      // animação de entrada
      card.setAlpha(0);
      card.y += 14;
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: card.y - 14,
        duration: 220,
        ease: "Cubic.Out",
        delay: 40 + idx * 30
      });
    });

    // Scroll (move só o listContainer.y). Limites em coordenadas LOCAIS.
    const totalRows = Math.ceil(entries.length / colCount);
    const contentHeight = margin + totalRows * (cardH + margin);
    const minY = Math.min(0, ph - contentHeight); // valor negativo se conteúdo > viewport
    const maxY = 0;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    listContainer.y = py; // posição global inicial = py (mas como o container já está em px,py, usamos wheel para mover relativo)
    // Ajuste: como o container já está em (px,py), o movimento deve atuar no 'container.y' RELATIVO ao topo da cena.
    // Vamos armazenar um offset base e mover relativo a ele.
    const baseY = py;

    this.input.on("wheel", (_p: any, _g: any, _dx: number, dy: number) => {
      if (contentHeight <= ph) return;
      const rel = listContainer.y - baseY; // posição relativa (0 no topo)
      const nextRel = clamp(rel - dy, minY, maxY);
      listContainer.y = baseY + nextRel;
    });

    // Voltar (rodapé)
    const back = this.add.text(width / 2, py + ph + 36, "Voltar", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "18px",
      color: activeTheme.colors.text,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start("OptionsScene"));
  }

  private drawThemeCard(
    x: number,
    y: number,
    w: number,
    h: number,
    key: ThemeKey,
    unlocked: boolean
  ): Phaser.GameObjects.Container {
    const activeTheme = getTheme(); // UI
    const theme = themes[key];

    const card = this.add.container(x, y);

    // Card base (desenho em coordenadas LOCAIS do card)
    const g = this.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(theme.colors.surfaceAlt).color, 1);
    g.fillRoundedRect(0, 0, w, h, 14);
    g.lineStyle(
      2,
      Phaser.Display.Color.HexStringToColor(
        key === activeTheme.key ? activeTheme.colors.secondary : activeTheme.colors.gridLine
      ).color,
      0.9
    );
    g.strokeRoundedRect(0, 0, w, h, 14);
    card.add(g);

    // Título
    const title = this.add.text(16, 14, theme.name, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: theme.colors.text,
      fontStyle: key === activeTheme.key ? "bold" : "normal",
    });
    card.add(title);

    // Badge "Atual"
    if (key === activeTheme.key) {
      const badge = this.add.text(w - 16, 16, "Atual", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        color: activeTheme.colors.bg,
        backgroundColor: activeTheme.colors.secondary,
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
      }).setOrigin(1, 0);
      badge.setShadow(0, 0, activeTheme.colors.glow, 8, true, true);
      card.add(badge);
    }

    // Preview (mini tabuleiro) — container local
    const pv = this.add.container(0, 0);
    card.add(pv);
    this.drawPreviewBoard(pv, theme.key, 16, 50, w - 32, 130);

    // Botão
    const canUse = this.isThemeAvailable(key, unlocked);
    const btnLabel = canUse ? (key === activeTheme.key ? "Aplicado" : "Selecionar") : "Bloqueado (alcance 2048)";
    const bgColor = canUse ? (key === activeTheme.key ? activeTheme.colors.gridHighlight : activeTheme.colors.primary) : "#3a405a";
    const fgColor = canUse ? activeTheme.colors.bg : activeTheme.colors.text;

    const btn = this.add.text(w / 2, h - 18, btnLabel, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "16px",
      color: fgColor,
      backgroundColor: bgColor as any,
      padding: { left: 14, right: 14, top: 8, bottom: 8 },
    }).setOrigin(0.5);
    card.add(btn);

    if (canUse && key !== activeTheme.key) {
      btn.setInteractive({ useHandCursor: true });
      btn.on("pointerover", () => btn.setStyle({ backgroundColor: activeTheme.colors.secondary as any }));
      btn.on("pointerout",  () => btn.setStyle({ backgroundColor: bgColor as any }));
      btn.on("pointerdown", () => {
        setThemeKey(key as string);
        this.scene.start("ThemeScene"); // recarrega para refletir tema
      });
    } else if (!canUse) {
      const lock = this.add.text(w - 16, h - 18, "🔒", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "18px",
        color: activeTheme.colors.warning,
      }).setOrigin(1, 1);
      card.add(lock);

      // feedback ao clicar num tema bloqueado (wobble)
      card.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, w, h),
        Phaser.Geom.Rectangle.Contains
      );
      card.on("pointerdown", () => {
        this.tweens.add({
          targets: card,
          angle: { from: -3, to: 3 },
          duration: 90,
          ease: "sine.inOut",
          yoyo: true,
          repeat: 1,
          onComplete: () => this.tweens.add({ targets: card, angle: 0, duration: 70, ease: "sine.out" })
        });
      });
    }

    return card;
  }

  private isThemeAvailable(key: ThemeKey, unlocked2048: boolean): boolean {
    // "neon-pcb" liberado; demais só com 2048
    return key === "neon-pcb" ? true : unlocked2048;
  }

  private drawPreviewBoard(
    container: Phaser.GameObjects.Container,
    themeKey: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const theme = themes[themeKey as keyof typeof themes];
    const gap = 6;
    const rows = 3, cols = 3;
    const cellSize = Math.floor((width - gap * (cols + 1)) / cols);
    const boardW = cellSize * cols + gap * (cols + 1);
    const boardH = cellSize * rows + gap * (rows + 1);

    // Board (local ao container 'pv')
    const g = this.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(theme.colors.surface).color, 1);
    g.fillRoundedRect(x, y, boardW, boardH, 12);
    g.lineStyle(1, Phaser.Display.Color.HexStringToColor(theme.colors.gridLine).color, 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = x + gap + c * (cellSize + gap);
        const cy = y + gap + r * (cellSize + gap);
        g.strokeRoundedRect(cx, cy, cellSize, cellSize, 8);
      }
    }
    g.lineStyle(1, Phaser.Display.Color.HexStringToColor(theme.colors.gridHighlight).color, 0.4);
    g.strokeRoundedRect(x + 4, y + 4, boardW - 8, boardH - 8, 10);
    container.add(g);

    // Tiles fake
    const fakeTiles = [
      { r: 0, c: 0, v: 2 },
      { r: 0, c: 1, v: 4 },
      { r: 1, c: 1, v: 8 },
      { r: 2, c: 2, v: 16 },
    ];

    for (const ft of fakeTiles) {
      const cx = x + gap + ft.c * (cellSize + gap);
      const cy = y + gap + ft.r * (cellSize + gap);
      const fillHex = Phaser.Display.Color.HexStringToColor(getTileColorForKey(themeKey, ft.v)).color;

      const rect = this.add.rectangle(cx, cy, cellSize, cellSize, fillHex, 1).setOrigin(0);
      rect.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(theme.colors.primary).color);

      const txt = this.add.text(cx + cellSize / 2, cy + cellSize / 2, String(ft.v), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.floor(cellSize * 0.38)}px`,
        color: ft.v <= 4 ? theme.colors.text : theme.colors.bg,
        fontStyle: "bold",
      }).setOrigin(0.5);
      txt.setShadow(0, 0, theme.colors.glow, 8, true, true);

      container.add(rect);
      container.add(txt);
    }
  }
}
