import Phaser from "phaser";
import { listUnlockedIds } from "../achievements/tracker";
import { ACHIEVEMENTS, ModuleKey } from "../achievements/achievements";
import { CODEX } from "./codexData";
import { getTheme } from "../theme";
import { MenuIcon } from "../ui/MenuIcon";
import { PANEL_COLORS } from "../panel/panelLayout";

type Entry = typeof CODEX[number];
type ThemeColors = ReturnType<typeof getTheme>["colors"];

/**
 * TechCodexScene - Redesign completo com foco em mobile
 *
 * Layout:
 * - Header fixo com título e stats
 * - Filtros em chips horizontais (scroll horizontal)
 * - Cards de entradas em grid responsivo
 * - Modal full-screen para leitura
 */
export default class TechCodexScene extends Phaser.Scene {
  private unlocked = new Set<string>();
  private filterModule: ModuleKey | "ALL" = "ALL";
  private searchQuery = "";
  private scrollY = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private maskRect!: Phaser.GameObjects.Rectangle;
  private detailModal?: Phaser.GameObjects.Container;

  constructor() {
    super("TechCodexScene");
  }

  create() {
    const { width, height } = this.scale;
    const theme = getTheme();
    const c = theme.colors;

    // Fundo
    this.cameras.main.setBackgroundColor(c.bg);
    this.createGridBackground(width, height, c);

    // Carregar desbloqueios
    const unlockedIds = new Set(listUnlockedIds());
    for (const a of ACHIEVEMENTS) {
      if (a.codexId && unlockedIds.has(a.id)) {
        this.unlocked.add(a.codexId);
      }
    }

    // Header fixo
    this.createHeader(width, c);

    // Filtros horizontais
    this.createFilters(width, c);

    // Área de conteúdo com máscara
    const contentTop = 180;
    const contentHeight = height - contentTop;

    this.maskRect = this.add.rectangle(0, contentTop, width, contentHeight, 0x000000, 0)
      .setOrigin(0, 0);
    const mask = this.maskRect.createGeometryMask();

    this.contentContainer = this.add.container(0, contentTop);
    this.contentContainer.setMask(mask);

    // Renderizar cards
    this.renderCards(width, contentHeight, c);

    // Touch scroll
    this.setupScrolling();
  }

  private createGridBackground(width: number, height: number, c: ThemeColors) {
    const grid = this.add.graphics();
    grid.setDepth(-10);

    const gridColor = Phaser.Display.Color.HexStringToColor(c.gridLine || "#1a2332").color;
    grid.lineStyle(1, gridColor, 0.1);

    const spacing = 40;
    for (let x = 0; x < width; x += spacing) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += spacing) {
      grid.lineBetween(0, y, width, y);
    }
  }

  private createHeader(width: number, c: ThemeColors) {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(Phaser.Display.Color.HexStringToColor(c.surface || "#0f0f16").color, 0.9);
    headerBg.fillRoundedRect(0, 0, width, 120, { tl: 0, tr: 0, bl: 16, br: 16 });
    headerBg.setDepth(100);

    // Borda inferior
    const borderGlow = this.add.graphics();
    borderGlow.lineStyle(2, Phaser.Display.Color.HexStringToColor(c.primary || "#66b8e0").color, 0.3);
    borderGlow.lineBetween(0, 120, width, 120);
    borderGlow.setDepth(101);
    borderGlow.setBlendMode(Phaser.BlendModes.ADD);

    // Menu icon
    new MenuIcon(this, width - 30, 30);

    // Título
    const title = this.add.text(24, 28, "Tech Codex", {
      fontSize: "32px",
      color: c.text,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontStyle: "bold"
    }).setOrigin(0, 0);
    title.setShadow(0, 0, c.glow, 16, true, true);
    title.setResolution(2);
    title.setDepth(200);

    // Stats de progresso
    const unlockedCount = this.unlocked.size;
    const total = CODEX.length;
    const percentage = Math.floor((unlockedCount / total) * 100);

    const stats = this.add.text(24, 70, `${unlockedCount}/${total} Desbloqueados (${percentage}%)`, {
      fontSize: "14px",
      color: c.textDim,
      fontFamily: "Arial, Helvetica, sans-serif"
    }).setOrigin(0, 0);
    stats.setResolution(2);
    stats.setDepth(200);

    // Barra de progresso
    const barWidth = 200;
    const barX = 24;
    const barY = 95;

    const barBg = this.add.graphics();
    barBg.fillStyle(Phaser.Display.Color.HexStringToColor(c.gridLine || "#1a2332").color, 0.5);
    barBg.fillRoundedRect(barX, barY, barWidth, 8, 4);
    barBg.setDepth(200);

    const barFill = this.add.graphics();
    barFill.fillStyle(Phaser.Display.Color.HexStringToColor(c.primary || "#66b8e0").color, 0.8);
    barFill.fillRoundedRect(barX, barY, (barWidth * percentage) / 100, 8, 4);
    barFill.setDepth(201);
    barFill.setBlendMode(Phaser.BlendModes.ADD);
  }

  private createFilters(_width: number, c: ThemeColors) {
    const filterY = 135;
    const categories: Array<{ key: ModuleKey | "ALL", label: string }> = [
      { key: "ALL", label: "Todos" },
      { key: "CPU", label: "CPU" },
      { key: "RAM", label: "RAM" },
      { key: "GPU", label: "GPU" },
      { key: "IO", label: "I/O" },
      { key: "NET", label: "NET" },
      { key: "PSU", label: "PSU" },
    ];

    let x = 16;
    const chipHeight = 32;

    for (const cat of categories) {
      const isActive = this.filterModule === cat.key;
      const color = cat.key === "ALL" ?
        Phaser.Display.Color.HexStringToColor(c.primary || "#66b8e0").color :
        PANEL_COLORS[cat.key as ModuleKey];

      // Background do chip
      const chipBg = this.add.graphics();
      chipBg.setDepth(150);

      if (isActive) {
        chipBg.fillStyle(color, 0.3);
        chipBg.lineStyle(2, color, 0.9);
      } else {
        chipBg.fillStyle(color, 0.1);
        chipBg.lineStyle(1, color, 0.4);
      }

      const labelText = this.add.text(0, 0, cat.label, {
        fontSize: "13px",
        color: c.text,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontStyle: isActive ? "bold" : "normal"
      });
      labelText.setResolution(2);

      const chipWidth = labelText.width + 24;
      chipBg.fillRoundedRect(x, filterY, chipWidth, chipHeight, 16);
      chipBg.strokeRoundedRect(x, filterY, chipWidth, chipHeight, 16);

      labelText.setPosition(x + chipWidth / 2, filterY + chipHeight / 2);
      labelText.setOrigin(0.5);
      labelText.setDepth(151);

      // Hit zone
      const hitZone = this.add.zone(x, filterY, chipWidth, chipHeight)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(152);

      hitZone.on("pointerdown", () => {
        this.filterModule = cat.key;
        this.scrollY = 0;
        this.scene.restart();
      });

      // Hover effect
      hitZone.on("pointerover", () => {
        this.tweens.add({
          targets: chipBg,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100,
          ease: "back.out(2)"
        });
      });

      hitZone.on("pointerout", () => {
        chipBg.setScale(1);
      });

      x += chipWidth + 12;
    }
  }

  private renderCards(width: number, _contentHeight: number, c: ThemeColors) {
    this.contentContainer.removeAll(true);

    // Filtrar entradas
    const entries = CODEX.filter(entry => {
      if (this.filterModule !== "ALL" && entry.module !== this.filterModule) {
        return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return entry.title.toLowerCase().includes(q) ||
               entry.body.join(" ").toLowerCase().includes(q);
      }
      return true;
    });

    // Layout responsivo
    const cardWidth = Math.min(340, width - 32);
    const cardHeight = 120;
    const gap = 16;
    const cols = Math.floor((width - 32) / (cardWidth + gap));
    const startX = (width - (cols * (cardWidth + gap) - gap)) / 2;

    let x = startX;
    let y = 16;
    let col = 0;

    for (const entry of entries) {
      const isUnlocked = this.unlocked.has(entry.id);

      this.createCard(entry, x, y, cardWidth, cardHeight, isUnlocked, c);

      col++;
      if (col >= cols) {
        col = 0;
        x = startX;
        y += cardHeight + gap;
      } else {
        x += cardWidth + gap;
      }
    }

    // Mensagem se vazio
    if (entries.length === 0) {
      const emptyMsg = this.add.text(width / 2, 100, "Nenhuma entrada encontrada", {
        fontSize: "16px",
        color: c.textDim,
        fontFamily: "Arial, Helvetica, sans-serif"
      }).setOrigin(0.5);
      this.contentContainer.add(emptyMsg);
    }
  }

  private createCard(
    entry: Entry,
    x: number,
    y: number,
    w: number,
    h: number,
    isUnlocked: boolean,
    c: ThemeColors
  ) {
    const container = this.add.container(x, y);

    // Background com cor do módulo (com fallback para cor padrão)
    const moduleColor = PANEL_COLORS[entry.module as ModuleKey] || 0x66b8e0;
    const bg = this.add.graphics();

    if (isUnlocked) {
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(c.surface || "#0f0f16").color, 0.8);
      bg.lineStyle(2, moduleColor, 0.6);
    } else {
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(c.surface || "#0f0f16").color, 0.4);
      bg.lineStyle(1, moduleColor, 0.3);
    }

    bg.fillRoundedRect(0, 0, w, h, 12);
    bg.strokeRoundedRect(0, 0, w, h, 12);
    container.add(bg);

    // Tag do módulo
    const moduleColorHex = `#${moduleColor.toString(16).padStart(6, '0')}`;
    const tag = this.add.text(12, 12, entry.module || "???", {
      fontSize: "11px",
      color: c.text || "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
      backgroundColor: moduleColorHex,
      padding: { x: 8, y: 4 }
    });
    tag.setResolution(2);
    container.add(tag);

    // Título
    const title = this.add.text(12, 40, entry.title, {
      fontSize: "16px",
      color: isUnlocked ? c.text : c.textDim,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontStyle: "bold",
      wordWrap: { width: w - 40 }
    });
    title.setResolution(2);
    container.add(title);

    // Preview do corpo (apenas se desbloqueado)
    if (isUnlocked) {
      const preview = `${entry.body[0].substring(0, 80)}...`;
      const bodyPreview = this.add.text(12, 68, preview, {
        fontSize: "12px",
        color: c.textDim || "#8ea3b8",
        fontFamily: "Arial, Helvetica, sans-serif",
        wordWrap: { width: w - 24 }
      });
      bodyPreview.setResolution(2);
      container.add(bodyPreview);
    } else {
      // Ícone de cadeado
      const lockIcon = this.add.text(w / 2, h / 2 + 10, "🔒", {
        fontSize: "24px"
      }).setOrigin(0.5);
      container.add(lockIcon);
    }

    // Hit zone
    const hitZone = this.add.zone(0, 0, w, h)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: isUnlocked });

    if (isUnlocked) {
      hitZone.on("pointerdown", () => {
        this.openDetailModal(entry, c);
      });

      hitZone.on("pointerover", () => {
        this.tweens.add({
          targets: container,
          scaleX: 1.02,
          scaleY: 1.02,
          duration: 150,
          ease: "back.out(1.5)"
        });
      });

      hitZone.on("pointerout", () => {
        container.setScale(1);
      });
    }

    container.add(hitZone);
    this.contentContainer.add(container);
  }

  private openDetailModal(entry: Entry, c: ThemeColors) {
    const { width, height } = this.scale;

    // Container do modal
    const modal = this.add.container(0, height);
    modal.setDepth(1000);
    this.detailModal = modal;

    // Overlay escuro
    const overlay = this.add.rectangle(0, -height, width, height, 0x000000, 0.85)
      .setOrigin(0, 0)
      .setInteractive();
    modal.add(overlay);

    // Painel de conteúdo
    const panelHeight = height * 0.85;
    const panelY = height - panelHeight;

    const panel = this.add.graphics();
    const panelModuleColor = PANEL_COLORS[entry.module as ModuleKey] || 0x66b8e0;
    panel.fillStyle(Phaser.Display.Color.HexStringToColor(c.surface || "#0f0f16").color, 1);
    panel.fillRoundedRect(0, panelY, width, panelHeight, { tl: 24, tr: 24, bl: 0, br: 0 });
    panel.lineStyle(2, panelModuleColor, 0.8);
    panel.strokeRoundedRect(0, panelY, width, panelHeight, { tl: 24, tr: 24, bl: 0, br: 0 });
    modal.add(panel);

    // Botão fechar
    const closeBtn = this.add.text(width - 24, panelY + 24, "✕", {
      fontSize: "28px",
      color: c.text,
      fontFamily: "Arial, Helvetica, sans-serif"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on("pointerdown", () => this.closeDetailModal());
    modal.add(closeBtn);

    // Tag do módulo
    const modalModuleColor = PANEL_COLORS[entry.module as ModuleKey] || 0x66b8e0;
    const modalModuleColorHex = `#${modalModuleColor.toString(16).padStart(6, '0')}`;
    const tag = this.add.text(24, panelY + 24, entry.module || "???", {
      fontSize: "12px",
      color: c.text || "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
      backgroundColor: modalModuleColorHex,
      padding: { x: 10, y: 5 }
    });
    tag.setResolution(2);
    modal.add(tag);

    // Título
    const title = this.add.text(24, panelY + 60, entry.title, {
      fontSize: "24px",
      color: c.text,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontStyle: "bold",
      wordWrap: { width: width - 48 }
    });
    title.setResolution(2);
    modal.add(title);

    // Corpo com scroll
    const bodyContainer = this.add.container(0, panelY + 110);
    const bodyText = this.add.text(24, 0, entry.body.join("\n\n"), {
      fontSize: "15px",
      color: c.text,
      fontFamily: "Arial, Helvetica, sans-serif",
      lineSpacing: 8,
      wordWrap: { width: width - 48 }
    });
    bodyText.setResolution(2);
    bodyContainer.add(bodyText);
    modal.add(bodyContainer);

    // Animar entrada
    this.tweens.add({
      targets: modal,
      y: 0,
      duration: 300,
      ease: "back.out(1.2)"
    });
  }

  private closeDetailModal() {
    if (!this.detailModal) return;

    const { height } = this.scale;
    this.tweens.add({
      targets: this.detailModal,
      y: height,
      duration: 250,
      ease: "sine.in",
      onComplete: () => {
        this.detailModal?.destroy(true);
        this.detailModal = undefined;
      }
    });
  }

  private setupScrolling() {
    let isDragging = false;
    let lastY = 0;

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 180) return; // Não rolar no header/filtros
      isDragging = true;
      lastY = pointer.y;
    });

    this.input.on("pointerup", () => {
      isDragging = false;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;

      const deltaY = pointer.y - lastY;
      lastY = pointer.y;

      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, -5000, 0);
      this.contentContainer.y = 180 + this.scrollY;
    });

    // Mouse wheel
    this.input.on("wheel", (_p: any, _g: any, _dx: number, dy: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY - dy, -5000, 0);
      this.contentContainer.y = 180 + this.scrollY;
    });
  }
}
