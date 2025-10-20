import Phaser from "phaser";
import { listUnlockedIds } from "../achievements/tracker";
import { ACHIEVEMENTS, ModuleKey } from "../achievements/achievements";
import { CODEX } from "./codexData";

type Entry = typeof CODEX[number];

export default class TechCodexScene extends Phaser.Scene {
  private search = "";
  private filterModule: ModuleKey | "ALL" = "ALL";
  private listCont!: Phaser.GameObjects.Container;
  private readCont!: Phaser.GameObjects.Container;
  private maskRect!: Phaser.GameObjects.Rectangle;
  private scrollY = 0;
  private rowH = 54;
  private visible: Entry[] = [];
  private unlocked = new Set<string>();
  private isNarrow = false;
  private drawer?: Phaser.GameObjects.Container;

  constructor() {
    super("TechCodexScene");
  }

  create() {
    const { width, height } = this.scale;
    this.isNarrow = width < 640;

    // bg
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0f1c);
    this.add.text(24, 24, "Tech Codex", {
      fontSize: "26px",
      color: "#c8e9ff",
      fontFamily: "Arial, Helvetica, sans-serif",
    });
    this.add.text(24, 56, "Conhecimento que você desbloqueia jogando. Pesquise, filtre e leia.", {
      fontSize: "14px",
      color: "#8fb7d1",
      fontFamily: "Arial, Helvetica, sans-serif",
    });

    // estado de desbloqueio -> codexId vindo das conquistas desbloqueadas
    const unlockedIds = new Set(listUnlockedIds());
    for (const a of ACHIEVEMENTS) if (a.codexId && unlockedIds.has(a.id)) this.unlocked.add(a.codexId);

    // barra lateral (categorias)
    const side = this.add.container(24, 96);
    const cats: (ModuleKey | "ALL")[] = ["ALL", "CPU", "RAM", "GPU", "IO", "NET", "PSU"];
    let y = 0;
    cats.forEach((cat) => {
      const txt = this.add
        .text(0, y, cat === "ALL" ? "Todos" : cat, {
          fontSize: "14px",
          color: "#e0efff",
          backgroundColor: "#122235",
          padding: { left: 10, right: 10, top: 6, bottom: 6 },
          fontFamily: "Arial, Helvetica, sans-serif",
        })
        .setInteractive({ useHandCursor: true });
      txt.on("pointerdown", () => {
        this.filterModule = cat as any;
        this.refreshList();
      });
      side.add(txt);
      y += 34;
    });

    // Campo de busca
    const searchBg = this.add
      .rectangle(180, 94, Math.max(220, width * 0.38), 28, 0x112233, 1)
      .setStrokeStyle(1, 0x2a90b8, 0.8)
      .setOrigin(0, 0);
    const searchTxt = this.add
      .text(188, 108, "buscar...", {
        fontSize: "13px",
        color: "#9bb0c3",
        fontFamily: "Arial, Helvetica, sans-serif",
      })
      .setOrigin(0, 0.5);
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.search += e.key;
      } else if (e.key === "Backspace") this.search = this.search.slice(0, -1);
      else if (e.key === "Escape") this.search = "";
      searchTxt.setText(this.search || "buscar...");
      this.scrollY = 0;
      this.refreshList();
    });

    // Lista (mascarada)
    this.maskRect = this.add
      .rectangle(180, 140, Math.max(240, width * 0.42), height - 180, 0x000000, 0)
      .setOrigin(0, 0);
    const mask = this.maskRect.createGeometryMask();

    this.listCont = this.add.container(180, 140);
    this.listCont.setMask(mask);

    // Painel de leitura (direita) ou drawer no mobile
    if (this.isNarrow) {
      this.readCont = this.add.container(0, 0); // não usado diretamente
    } else {
      this.readCont = this.add.container(width * 0.64, 96);
    }

    // rolagem
    this.input.on(
      "wheel",
      (_p: any, _g: any, _dx: number, dy: number) => {
        if (
          this.input.activePointer.x < this.maskRect.x ||
          this.input.activePointer.x > this.maskRect.x + this.maskRect.width ||
          this.input.activePointer.y < this.maskRect.y ||
          this.input.activePointer.y > this.maskRect.y + this.maskRect.height
        )
          return;
        this.scrollY = Phaser.Math.Clamp(this.scrollY - dy, -9999, 0);
        this.listCont.y = 140 + this.scrollY;
        this.refreshListWindow(); // virtualização
      },
      this,
    );

    // toque: arrastar para rolar
    let dragging = false;
    let ly = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (
        p.x >= this.maskRect.x &&
        p.x <= this.maskRect.x + this.maskRect.width &&
        p.y >= this.maskRect.y &&
        p.y <= this.maskRect.y + this.maskRect.height
      ) {
        dragging = true;
        ly = p.y;
      }
    });
    this.input.on("pointerup", () => (dragging = false));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      const dy = p.y - ly;
      ly = p.y;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -9999, 0);
      this.listCont.y = 140 + this.scrollY;
      this.refreshListWindow();
    });

    this.refreshList();
  }

  // atualiza lista com busca + filtro (rederiza janela visível)
  private refreshList() {
    const q = (this.search || "").toLowerCase();
    const matches = (e: Entry) =>
      (this.filterModule === "ALL" || e.module === this.filterModule) &&
      (q === "" ||
        e.title.toLowerCase().includes(q) ||
        e.body.join(" ").toLowerCase().includes(q));

    this.visible = CODEX.filter(matches);
    this.refreshListWindow();

    // seletor default: primeiro desbloqueado
    const firstUnlocked = this.visible.find((e) => this.unlocked.has(e.id));
    if (firstUnlocked && !this.isNarrow) this.openEntry(firstUnlocked);
    else if (!this.isNarrow) this.openEntry(null);
  }

  private refreshListWindow() {
    const { height } = this.scale;

    const rowH = this.rowH;
    const totalH = this.visible.length * rowH;
    const viewH = this.maskRect.height;
    const startIdx = Math.max(0, Math.floor((-this.scrollY - 20) / rowH) - 6);
    const endIdx = Math.min(this.visible.length, startIdx + Math.ceil(viewH / rowH) + 12);

    this.listCont.removeAll(true);
    let y = startIdx * rowH;

    for (let i = startIdx; i < endIdx; i++) {
      const e = this.visible[i];
      const unlocked = this.unlocked.has(e.id);
      const bg = this.add
        .rectangle(0, y, this.maskRect.width, rowH - 6, unlocked ? 0x112233 : 0x0d1626, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, unlocked ? 0x2a90b8 : 0x24364f, 0.8);
      const title = this.add
        .text(12, y + rowH / 2, e.title, {
          fontSize: "14px",
          color: unlocked ? "#e7f7ff" : "#8ea3b8",
          fontFamily: "Arial, Helvetica, sans-serif",
        })
        .setOrigin(0, 0.5);
      const lock = this.add
        .text(this.maskRect.width - 18, y + rowH / 2, unlocked ? "🔓" : "🔒", {
          fontSize: "14px",
          color: "#c8e9ff",
        })
        .setOrigin(0.5);
      const hit = this.add
        .zone(0, y, this.maskRect.width, rowH - 6)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: unlocked });

      if (unlocked) {
        const open = () => this.openEntry(e);
        hit.on("pointerdown", open);
        bg.on("pointerdown", open);
        title.on("pointerdown", open);
      }

      this.listCont.add([bg, title, lock, hit]);
      y += rowH;
    }

    // fundo de altura total para rolagem consistente
    const spacer = this.add.rectangle(0, totalH, 1, 1, 0, 0).setOrigin(0, 0);
    this.listCont.add(spacer);
  }

  private openEntry(entry: Entry | null) {
    this.readCont.removeAll(true);
    const { width, height } = this.scale;

    if (this.isNarrow) {
      // mobile: abre como drawer full-screen
      this.openEntryDrawer(entry);
      return;
    }

    const panel = this.add
      .rectangle(0, 0, width * 0.32, height - 120, 0x0e1a2b, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x2a90b8, 0.8);
    this.readCont.add(panel);

    if (!entry) {
      const msg = this.add
        .text(16, 16, "Jogue para desbloquear conteúdos do Codex!", {
          fontSize: "16px",
          color: "#9bb0c3",
          fontFamily: "Arial, Helvetica, sans-serif",
          wordWrap: { width: panel.width - 32 },
        })
        .setOrigin(0, 0);
      this.readCont.add(msg);
      return;
    }

    const unlocked = this.unlocked.has(entry.id);
    const title = this.add.text(16, 12, entry.title, { fontSize: "18px", color: "#c8e9ff", fontFamily: "Arial, Helvetica, sans-serif" });
    this.readCont.add(title);

    const sub = this.add.text(16, 40, unlocked ? "Desbloqueado" : "Bloqueado", {
      fontSize: "12px",
      color: unlocked ? "#9be35a" : "#ff8b66",
      fontFamily: "Arial, Helvetica, sans-serif",
    });
    this.readCont.add(sub);

    // progresso simples
    const unlockedCount = Array.from(this.unlocked).length;
    const total = CODEX.length;
    const pct = Math.floor((unlockedCount / Math.max(1, total)) * 100);
    const barBg = this.add.rectangle(16, 66, panel.width - 32, 8, 0x13243a).setOrigin(0, 0.5);
    const bar = this.add.rectangle(16, 66, ((panel.width - 32) * pct) / 100, 8, 0x2a90b8).setOrigin(0, 0.5);
    this.readCont.add(barBg);
    this.readCont.add(bar);

    // corpo
    const bodyStr = entry.body.join("\n\n");
    const body = this.add.text(16, 96, bodyStr, {
      fontSize: "14px",
      color: "#e8f3ff",
      fontFamily: "Arial, Helvetica, sans-serif",
      wordWrap: { width: panel.width - 32 },
    });
    this.readCont.add(body);

    // voltar ao painel
    const back = this.add
      .text(panel.width - 16, panel.height - 14, "‹ Voltar ao Painel", {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#1b2a3a",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
        fontFamily: "Arial, Helvetica, sans-serif",
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start("PanelScene"));
    this.readCont.add(back);
  }

  private openEntryDrawer(entry: Entry | null) {
    const { width, height } = this.scale;
    if (this.drawer) this.drawer.destroy(true);

    const c = this.add.container(0, height);
    this.drawer = c;

    const panel = this.add
      .rectangle(0, 0, width, height, 0x0e1a2b, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x2a90b8, 0.8);
    c.add(panel);

    const title = this.add.text(16, 16, entry ? entry.title : "Bloqueado", {
      fontSize: "18px",
      color: "#c8e9ff",
      fontFamily: "Arial, Helvetica, sans-serif",
    });
    c.add(title);

    const bodyStr =
      entry && entry.body ? entry.body.join("\n\n") : "Jogue para desbloquear este conteúdo.";
    const body = this.add.text(16, 56, bodyStr, {
      fontSize: "15px",
      color: "#e8f3ff",
      fontFamily: "Arial, Helvetica, sans-serif",
      wordWrap: { width: width - 32 },
    });
    c.add(body);

    const close = this.add
      .text(width - 16, 16, "Fechar ✕", {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#1b2a3a",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
        fontFamily: "Arial, Helvetica, sans-serif",
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    close.on("pointerdown", () => {
      this.tweens.add({
        targets: c,
        y: height,
        duration: 180,
        ease: "sine.in",
        onComplete: () => c.destroy(true),
      });
    });
    c.add(close);

    this.tweens.add({ targets: c, y: 0, duration: 200, ease: "sine.out" });
  }
}
