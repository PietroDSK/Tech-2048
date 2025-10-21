import Phaser from "phaser";
import { getModuleProgress } from "../achievements/tracker";
import { PANEL_NODES } from "./panelLayout";
import { ModuleChip } from "./ModuleChip";
import { ModuleConnections } from "./ModuleConnections";
import { ACHIEVEMENTS } from "../achievements/achievements";
import { showToast } from "../ui/Toast";
import { getTheme } from "../theme";
import { t } from "../i18n";
import { MenuIcon } from "../ui/MenuIcon";
import { UIButton, mapThemeToButtonTheme } from "../ui/Button";

type ThemeColors = ReturnType<typeof getTheme>["colors"];

export default class PanelScene extends Phaser.Scene {
  constructor() { super("PanelScene"); }

  create() {
    const { width, height } = this.scale;
    const theme = getTheme();
    const c = theme.colors;

    // Fundo de tela
    this.cameras.main.setBackgroundColor(c.bg);

    // Fundo com grid sutil
    this.createGridBackground(width, height, c);

    // ========================================
    // HEADER SUPERIOR
    // ========================================
    this.createHeader(width, c);

    // ========================================
    // ÁREA DE CONTEÚDO (CHIPS)
    // ========================================
    const contentTop = 120;
    const contentHeight = height - contentTop - 80;

    // Criar conexões limpas entre módulos
    new ModuleConnections(this, contentTop, contentHeight, width);

    const progress = getModuleProgress();

    // Criar chips com posições relativas ao container
    for (const node of PANEL_NODES) {
      const pts = progress[node.key] || 0;
      const thresholds = node.thresholds;
      let lvl: 0|1|2|3 = 0;
      if      (pts >= (thresholds[2] ?? Infinity)) lvl = 3;
      else if (pts >= (thresholds[1] ?? Infinity)) lvl = 2;
      else if (pts >= (thresholds[0] ?? Infinity)) lvl = 1;

      const chip = new ModuleChip(this, node, lvl);
      this.add.existing(chip);
      chip.setDepth(15);

      // Posicionar chip com coordenadas absolutas
      const chipX = node.x * width;
      const chipY = contentTop + node.y * contentHeight;
      chip.setPosition(chipX, chipY);

      // Evento de clique
      chip.on("pointerdown", () => {
        const list = ACHIEVEMENTS.filter(a => a.module === node.key);
        const unlockedIds = JSON.parse(localStorage.getItem("tech2048.achievements") || "{}").unlocked || {};
        const unlockedCount = list.filter(a => unlockedIds[a.id]).length;
        const lines = list.map(a => `${unlockedIds[a.id] ? "✅" : "⬜️"} ${a.name}`).join("\n");
        showToast(this, `${node.title} — ${unlockedCount}/${list.length}\n${lines}`, 3200);
        this.tweens.add({ targets: chip, angle: { from: -1, to: 1 }, yoyo: true, duration: 100 });
      });
    }

    // ========================================
    // FOOTER COM BOTÃO TECH CODEX
    // ========================================
    this.createFooter(width, height, c);
  }

  private createGridBackground(width: number, height: number, c: ThemeColors) {
    const grid = this.add.graphics();
    grid.setDepth(-10);

    // Grid sutil
    const gridColor = Phaser.Display.Color.HexStringToColor(c.gridLine || "#1a2332").color;
    grid.lineStyle(1, gridColor, 0.15);

    const spacing = 40;

    // Linhas verticais
    for (let x = 0; x < width; x += spacing) {
      grid.lineBetween(x, 0, x, height);
    }

    // Linhas horizontais
    for (let y = 0; y < height; y += spacing) {
      grid.lineBetween(0, y, width, y);
    }
  }

  private createHeader(width: number, c: ThemeColors) {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(Phaser.Display.Color.HexStringToColor(c.surface || "#0f0f16").color, 0.85);
    headerBg.fillRoundedRect(0, 0, width, 110, { tl: 0, tr: 0, bl: 16, br: 16 });
    headerBg.setDepth(100);

    // Borda inferior com glow
    const borderGlow = this.add.graphics();
    borderGlow.lineStyle(2, Phaser.Display.Color.HexStringToColor(c.primary || "#66b8e0").color, 0.3);
    borderGlow.lineBetween(0, 110, width, 110);
    borderGlow.setDepth(101);
    borderGlow.setBlendMode(Phaser.BlendModes.ADD);

    // Menu icon no canto superior direito
    new MenuIcon(this, width - 30, 30);

    // Título
    const title = this.add.text(24, 28, t("panel_title"), {
      fontSize: "32px",
      color: c.text,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontStyle: "bold"
    }).setOrigin(0, 0);
    title.setShadow(0, 0, c.glow, 16, true, true);
    title.setResolution(2);
    title.setDepth(200);

    // Subtítulo
    const subtitle = this.add.text(24, 70, t("panel_subtitle"), {
      fontSize: "14px",
      color: c.textDim,
      fontFamily: "Arial, Helvetica, sans-serif",
      wordWrap: { width: width - 48 }
    }).setOrigin(0, 0);
    subtitle.setResolution(2);
    subtitle.setDepth(200);
  }

  private createFooter(width: number, height: number, c: ThemeColors) {
    const footerHeight = 70;
    const footerY = height - footerHeight;

    // Fundo do footer
    const footerBg = this.add.graphics();
    footerBg.fillStyle(Phaser.Display.Color.HexStringToColor(c.surface || "#0f0f16").color, 0.85);
    footerBg.fillRoundedRect(0, footerY, width, footerHeight, { tl: 16, tr: 16, bl: 0, br: 0 });
    footerBg.setDepth(100);

    // Borda superior com glow
    const borderGlow = this.add.graphics();
    borderGlow.lineStyle(2, Phaser.Display.Color.HexStringToColor(c.primary || "#66b8e0").color, 0.3);
    borderGlow.lineBetween(0, footerY, width, footerY);
    borderGlow.setDepth(101);
    borderGlow.setBlendMode(Phaser.BlendModes.ADD);

    // Botão Tech Codex centralizado no footer
    const buttonTheme = mapThemeToButtonTheme(c);
    new UIButton(this, {
      x: width / 2,
      y: footerY + footerHeight / 2,
      label: `${t("tech_codex")} ›`,
      theme: buttonTheme,
      width: 200,
      height: 48,
      depth: 200,
      onClick: () => this.scene.start("TechCodexScene")
    });
  }
}
