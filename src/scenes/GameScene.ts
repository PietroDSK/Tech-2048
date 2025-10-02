// src/scenes/GameScene.ts
import Phaser from "phaser";
import { getSettings, setUnlocked2048 } from "../storage";
import { getTheme, getTileColor } from "../theme/index";
import { UIButton, mapThemeToButtonTheme } from "../ui/Button";

// Helpers de animação (todas compatíveis com TS/Phaser 3.90)
import { tweenTo } from "../animations/tweens-helper";
import { mergePulse } from "../animations/tiles";
import { zoomPunch, shakeOnMerge, flashWin } from "../animations/camera";
import { scoreFly } from "../animations/score";
import { ensureParticles, burstAt } from "../animations/particles";
import { TileTrail } from "../animations/trail";
import { fadeOverlay } from "../animations/ui";
import { BackButton } from "../ui/BackButton";
import { swapTo } from "../animations/transitions";
import { MusicManager } from "../audio/MusicManager";

// Ads
import { hideBanner, showBannerBottom } from "../native-ads";
import {
  prepareInterstitial,
  showInterstitialIfReady,
  prepareRewarded,
  showRewardedIfReady,
  onReward, // <- registrador para o reward
} from "../ads/ads";

type GameMode = "classic" | "4096" | "endless" | "custom";
interface GameModeData {
  mode: GameMode;
  rows?: number;
  cols?: number;
}
interface ModeConfig {
  rows: number;
  cols: number;
  target: number;
  endless: boolean;
}
type Dir = "left" | "right" | "up" | "down";
type Id = number;

function clampInt(n: number, min: number, max: number) {
  n = Math.floor(Number(n) || 0);
  return Math.max(min, Math.min(max, n));
}
function configFromMode(data?: Partial<GameModeData>): ModeConfig {
  const mode = (data?.mode ?? "classic") as GameMode;
  if (mode === "4096")
    return { rows: 4, cols: 4, target: 4096, endless: false };
  if (mode === "endless")
    return { rows: 4, cols: 4, target: Number.MAX_SAFE_INTEGER, endless: true };
  if (mode === "custom") {
    const rows = clampInt(data?.rows ?? 8, 2, 16);
    const cols = clampInt(data?.cols ?? 8, 2, 16);
    const target = Math.max(rows, cols) >= 10 ? 4096 : 2048;
    return { rows, cols, target, endless: false };
  }
  return { rows: 4, cols: 4, target: 2048, endless: false };
}

interface SlideResult {
  outValues: number[];
  outIds: (Id | 0)[];
  moved: boolean;
  merges: number[];
  ops: Array<
    | { type: "move"; id: Id; from: number; to: number }
    | {
        type: "merge";
        survivorId: Id;
        consumedId: Id;
        fromA: number;
        fromB: number;
        to: number;
        newValue: number;
      }
  >;
}

export default class GameScene extends Phaser.Scene {
  private mode!: GameMode;
  private cfg!: ModeConfig;
  private settings = getSettings();
  private reached2048 = false;

  private rows!: number;
  private cols!: number;
  private values!: number[][];
  private ids!: (Id | 0)[][];
  private seqId = 1;

  private boardX!: number;
  private boardY!: number;
  private cellSize!: number;
  private gap = 10;

  private tiles = new Map<Id, Phaser.GameObjects.Container>();
  private dragStart?: Phaser.Math.Vector2;

  private audioCtx: AudioContext | null = null;
  private theme = getTheme();
  private music!: MusicManager;
  private score = 0;

  private failedRuns = 0;

  // --- Powerups/Rewarded ---
  private powerups = { undo: 0 };
  private undoStack: Array<{
    values: number[][];
    ids: (Id | 0)[][];
    score: number;
  }> = [];

  // HUD refs
  private undoBtn?: UIButton;
  private rewardBtn?: UIButton;
  private undoCounterText?: Phaser.GameObjects.Text;

  // FX
  private gridFX?: Phaser.GameObjects.Graphics;

  constructor() {
    super("GameScene");
  }

  create(data: GameModeData) {
    this.theme = getTheme();
    this.mode = (data?.mode ?? "classic") as GameMode;
    this.cfg = configFromMode(data);
    this.rows = this.cfg.rows;
    this.cols = this.cfg.cols;

    // Partículas
    ensureParticles(this);

    // Score base
    this.registry.set("score", 0);

    // Rastro opcional (RenderTexture)
    this.data.set("tileTrail", new TileTrail(this));
    new BackButton(this, 50, 26, "Menu");

    this.setupLayoutAndGrid();
    this.drawBoardBg();
    this.createGridFX();
    this.spawnRandomTile();
    this.spawnRandomTile();
    this.registerInputs();
    this.fullRepaint();
    this.paintHud();

    // BANNER
    showBannerBottom().catch(() => {});

    // INTERSTITIAL/REWARDED
    prepareInterstitial().catch(() => {});
    prepareRewarded().catch(() => {});
    onReward?.(() => {
      // Callback do wrapper quando o usuário ganha a recompensa
      this.powerups.undo++;
      this.updateUndoHud();
      this.feedbackToast("+1 Undo recebido!");
    });

    // --- BOOT DE ÁUDIO (gesto do usuário obrigatório em mobile) ---
    const bootAudio = async () => {
      try {
        if (this.sound.locked) {
          await this.sound.unlock();
        }
        const ctx = (this.sound as Phaser.Sound.SoundManager).context;
        if (ctx && ctx.state !== "running") {
          await ctx.resume();
        }

        // Inicia o gerenciador de música após o unlock
        this.music = new MusicManager(this);
        this.music.init();

        // Sincroniza música com o score atual
        this.music.updateByScore(this.score);

        // Após boot, removemos os listeners para evitar múltiplas inits
        this.input.off("pointerdown", bootAudio as any);
        this.input.keyboard?.off("keydown", bootAudio as any);
      } catch (e) {
        console.warn("[GameScene] Falha ao desbloquear áudio:", e);
      }
    };

    // Gesto por toque (mobile) OU tecla (desktop)
    this.input.once("pointerdown", bootAudio);
    this.input.keyboard?.once("keydown", bootAudio);
  }

  // ---------- HUD ----------
  private paintHud() {
    const { width } = this.scale;
    const t = this.theme.colors;

    // Título e subtítulo (mantidos)
    const title = this.add
      .text(width / 2, this.boardY - 56, `TECH-2048`, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "24px",
        color: t.text,
      })
      .setOrigin(0.5);
    title.setShadow(0, 0, t.glow, 16, true, true);

    const modeTxt = `${this.mode.toUpperCase()}  •  ${this.rows}x${
      this.cols
    }  •  META: ${this.cfg.endless ? "∞" : this.cfg.target}`;
    this.add
      .text(width / 2, this.boardY - 28, modeTxt, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        color: t.textDim,
      })
      .setOrigin(0.5)
      .setAlpha(0.95);

    // --- Botões HUD (reposicionados e alinhados à direita) ---
    const uiTheme = mapThemeToButtonTheme(t);
    const btnY = this.boardY - 86; // sobe acima do título para não colidir
    const rightEdge = this.boardX + this.getBoardWidth();

    // Cria primeiro (posicionamos depois, pois precisamos dos widths)
    this.rewardBtn = new UIButton(this, {
      x: 0,
      y: 0,
      label: "🎁 +1 Undo (Ad)",
      variant: "primary",
      size: "sm",
      theme: uiTheme,
      onClick: async () => {
        const shown = await showRewardedIfReady();
        if (!shown) {
          await prepareRewarded();
          this.feedbackToast("Anúncio carregando. Tente novamente.");
        }
      },
    }).setScrollFactor(0);

    // Undo: também com x,y
    this.undoBtn = new UIButton(this, {
      x: 0,
      y: 0,
      label: "↩︎ Undo",
      variant: "secondary",
      size: "sm",
      theme: uiTheme,
      onClick: () => this.tryUndo(),
    }).setScrollFactor(0);

    // Badge "×N" acoplado ao Undo
    this.undoCounterText = this.add
      .text(0, 0, "×0", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        color: t.bg,
        backgroundColor: t.primary,
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
      .setAlpha(0.95)
      .setScrollFactor(0);

    // Layout final (direita -> esquerda)
    this.layoutHudButtons({ y: btnY, rightEdge, gap: 8 });

    this.updateUndoHud();
  }

  private layoutHudButtons(opts: {
    y: number;
    rightEdge: number;
    gap: number;
  }) {
    const { y, rightEdge, gap } = opts;

    // Garantir cálculo após ter displayWidth
    // Reward (mais à direita)
    const rw = this.rewardBtn!.displayWidth ?? 120;
    const rh = this.rewardBtn!.displayHeight ?? 32;
    this.rewardBtn!.setPosition(rightEdge - 12 - rw / 2, y);

    // Undo à esquerda do Reward
    const uw = this.undoBtn!.displayWidth ?? 90;
    this.undoBtn!.setPosition(this.rewardBtn!.x - rw / 2 - gap - uw / 2, y);

    // Badge à direita do Undo
    const ub = this.undoBtn!.getBounds();
    const badgeX = ub.right + 10;
    const badgeY = y;
    this.undoCounterText!.setPosition(badgeX, badgeY);

    // Z-order para ficar sobre a UI
    this.rewardBtn!.setDepth(1002);
    this.undoBtn!.setDepth(1002);
    this.undoCounterText!.setDepth(1003);
  }

  private updateUndoHud() {
    if (!this.undoCounterText || !this.undoBtn) return;
    this.undoCounterText.setText(`×${this.powerups.undo}`);

    // Reposiciona a badge caso o botão mude de tamanho (traduções/tema)
    const ub = this.undoBtn.getBounds();
    this.undoCounterText.setPosition(ub.right + 10, this.undoBtn.y);
  }

  private feedbackToast(text: string) {
    const { width } = this.scale;
    const t = this.theme.colors;
    const toast = this.add
      .text(width / 2, this.boardY - 80, text, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        color: t.bg,
        backgroundColor: t.primary,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      yoyo: true,
      hold: 900,
      duration: 160,
      onComplete: () => toast.destroy(),
    });
  }

  private getBoardWidth() {
    return this.cellSize * this.cols + this.gap * (this.cols + 1);
  }
  private getBoardHeight() {
    return this.cellSize * this.rows + this.gap * (this.rows + 1);
  }

  private cellLocalXY(r: number, c: number) {
    const x = this.gap + c * (this.cellSize + this.gap);
    const y = this.gap + r * (this.cellSize + this.gap);
    return { x, y };
  }

  private drawBoardBg() {
    const t = this.theme.colors;
    const boardW = this.getBoardWidth();
    const boardH = this.getBoardHeight();
    const x = this.boardX,
      y = this.boardY;

    const glow = this.add.graphics().setDepth(0);
    const g = this.add.graphics().setDepth(0);
    glow.fillStyle(Phaser.Display.Color.HexStringToColor(t.glow).color, 0.25);
    glow.fillRoundedRect(x - 8, y - 8, boardW + 16, boardH + 16, 22);

    g.fillStyle(Phaser.Display.Color.HexStringToColor(t.surface).color, 1);
    g.fillRoundedRect(x, y, boardW, boardH, 18);

    g.lineStyle(1, Phaser.Display.Color.HexStringToColor(t.gridLine).color, 1);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const { x: cx, y: cy } = this.cellXY(r, c);
        g.strokeRoundedRect(cx, cy, this.cellSize, this.cellSize, 10);
      }
    }
    g.lineStyle(
      1,
      Phaser.Display.Color.HexStringToColor(t.gridHighlight).color,
      0.35,
    );
    g.strokeRoundedRect(x + 6, y + 6, boardW - 12, boardH - 12, 16);

    this.cameras.main.setBackgroundColor(t.bg);
  }

  // ---------- Layout / Grid ----------
  private setupLayoutAndGrid() {
    const { width, height } = this.scale;
    const maxBoardW = Math.min(width * 0.92, height * 0.8);
    this.cellSize = Math.floor(
      (maxBoardW - this.gap * (this.cols + 1)) / this.cols,
    );
    const boardW = this.getBoardWidth();
    const boardH = this.getBoardHeight();
    this.boardX = Math.floor((width - boardW) / 2);
    this.boardY = Math.floor((height - boardH) / 2);

    this.values = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(0),
    );
    this.ids = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(0),
    );
  }
  private cellXY(r: number, c: number) {
    const x = this.boardX + this.gap + c * (this.cellSize + this.gap);
    const y = this.boardY + this.gap + r * (this.cellSize + this.gap);
    return { x, y };
  }

  // ---------- Spawn / Render ----------
  private spawnRandomTile(): boolean {
    const empty: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.values[r][c] === 0) empty.push({ r, c });
    if (!empty.length) return false;
    const spot = Phaser.Utils.Array.GetRandom(empty);
    const value = Math.random() < 0.9 ? 2 : 4;
    const id = this.seqId++;
    this.values[spot.r][spot.c] = value;
    this.ids[spot.r][spot.c] = id;
    this.createTile(id, spot.r, spot.c, value, true);
    return true;
  }

  private createTile(id: Id, r: number, c: number, value: number, pop = false) {
    const t = this.theme.colors;
    const { x, y } = this.cellXY(r, c);
    const cont = this.add.container(x, y).setDepth(1);
    cont.setScale(0.6); // POP de spawn

    const fillHex = Phaser.Display.Color.HexStringToColor(
      getTileColor(value),
    ).color;

    const glow = this.add
      .rectangle(
        this.cellSize / 2,
        this.cellSize / 2,
        this.cellSize * 1.1,
        this.cellSize * 1.1,
        fillHex,
        0.12,
      )
      .setOrigin(0.5);

    const rect = this.add
      .rectangle(0, 0, this.cellSize, this.cellSize, fillHex, 1)
      .setOrigin(0)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(t.primary).color)
      .setDepth(1);

    const txt = this.add
      .text(this.cellSize / 2, this.cellSize / 2, String(value), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.floor(this.cellSize * 0.38)}px`,
        color: value <= 4 ? t.text : t.bg,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    txt.setShadow(0, 0, t.glow, 10, true, true);

    cont.add([glow, rect, txt]);

    // Guardar refs explícitas
    cont.setData("rect", rect);
    cont.setData("txt", txt);

    this.tiles.set(id, cont);

    if (pop)
      tweenTo(this, {
        targets: cont,
        scale: 1,
        duration: 120,
        ease: "Back.Out",
      });
    else cont.setScale(1);
  }

  private destroyTile(id: Id) {
    const t = this.tiles.get(id);
    if (t) {
      t.destroy(true);
      this.tiles.delete(id);
    }
  }

  private fullRepaint() {
    for (const [, t] of this.tiles) t.destroy(true);
    this.tiles.clear();
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) {
        const v = this.values[r][c];
        const id = this.ids[r][c];
        if (v !== 0 && id !== 0) this.createTile(id, r, c, v);
      }
  }

  // ---------- Lógica base ----------
  private getBoardMax(): number {
    let m = 0;
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) m = Math.max(m, this.values[r][c]);
    return m;
  }
  private canMove(): boolean {
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.values[r][c] === 0) return true;
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) {
        const v = this.values[r][c];
        if (r + 1 < this.rows && this.values[r + 1][c] === v) return true;
        if (c + 1 < this.cols && this.values[r][c + 1] === v) return true;
      }
    return false;
  }

  private clone2D<T>(m: T[][]): T[][] {
    return m.map((row) => row.slice());
  }

  private pushUndoSnapshot() {
    // guarda estado ANTES da jogada
    this.undoStack.push({
      values: this.clone2D(this.values),
      ids: this.clone2D(this.ids),
      score: this.score,
    });
    // limita pilha (para não crescer sem fim)
    if (this.undoStack.length > 20) this.undoStack.shift();
  }

  private tryUndo() {
    if (this.powerups.undo <= 0) {
      this.feedbackToast("Sem Undos disponíveis.");
      return;
    }
    const snap = this.undoStack.pop();
    if (!snap) {
      this.feedbackToast("Nada para desfazer.");
      return;
    }
    this.powerups.undo--;
    this.updateUndoHud();

    // restaura estado
    this.values = this.clone2D(snap.values);
    this.ids = this.clone2D(snap.ids);
    this.score = snap.score;
    this.registry.set("score", this.score);
    this.fullRepaint();
    this.feedbackToast("Jogada desfeita.");
  }

  private slideWithPaths(vals: number[], ids: (Id | 0)[]): SlideResult {
    const n = vals.length;
    const compactVals: number[] = [];
    const compactIds: Id[] = [];
    const ops: SlideResult["ops"] = [];
    const mergesOut: number[] = [];

    for (let i = 0; i < n; i++) {
      if (vals[i] !== 0) {
        compactVals.push(vals[i]);
        compactIds.push(ids[i] as Id);
      }
    }

    const outValues: number[] = [];
    const outIds: (Id | 0)[] = [];
    let read = 0,
      write = 0;

    while (read < compactVals.length) {
      if (
        read < compactVals.length - 1 &&
        compactVals[read] === compactVals[read + 1]
      ) {
        const newV = compactVals[read] * 2;
        const survivor = compactIds[read];
        const consumed = compactIds[read + 1];

        outValues.push(newV);
        outIds.push(survivor);
        mergesOut.push(newV);

        ops.push({
          type: "merge",
          survivorId: survivor,
          consumedId: consumed,
          fromA: -1,
          fromB: -1,
          to: write,
          newValue: newV,
        });

        read += 2;
        write += 1;
      } else {
        outValues.push(compactVals[read]);
        outIds.push(compactIds[read]);
        read++;
        write++;
      }
    }
    while (outValues.length < n) {
      outValues.push(0);
      outIds.push(0);
    }

    const origPos: Record<number, number> = {};
    for (let i = 0; i < n; i++) if (ids[i] !== 0) origPos[ids[i] as number] = i;

    for (let to = 0; to < n; to++) {
      const idAtTo = outIds[to];
      if (idAtTo === 0) continue;
      const from = origPos[idAtTo];
      ops.push({ type: "move", id: idAtTo, from, to });
    }
    for (const op of ops)
      if (op.type === "merge") {
        op.fromA = origPos[op.survivorId];
        op.fromB = origPos[op.consumedId];
      }

    const moved =
      outValues.length !== vals.length ||
      outValues.some((v, i) => v !== vals[i]);

    return { outValues, outIds, moved, merges: mergesOut, ops };
  }

  // ---------- Movimento ----------
  private async move(dir: Dir) {
    // snapshot antes de mover (para Undo)
    const beforeValues = this.clone2D(this.values);
    const beforeIds = this.clone2D(this.ids);
    const beforeScore = this.score;

    let anyMoved = false;
    const mergesAll: number[] = [];
    const allOps: Array<{
      axis: "row" | "col";
      index: number;
      reverse: boolean;
      ops: SlideResult["ops"];
    }> = [];

    if (dir === "left" || dir === "right") {
      for (let r = 0; r < this.rows; r++) {
        let vals = this.values[r].slice();
        let ids = this.ids[r].slice();
        const reverse = dir === "right";
        if (reverse) {
          vals = vals.reverse();
          ids = ids.reverse();
        }
        const res = this.slideWithPaths(vals, ids);
        anyMoved = anyMoved || res.moved;
        mergesAll.push(...res.merges);
        const outV = reverse ? res.outValues.slice().reverse() : res.outValues;
        const outI = reverse ? res.outIds.slice().reverse() : res.outIds;
        this.values[r] = outV;
        this.ids[r] = outI;
        allOps.push({ axis: "row", index: r, reverse, ops: res.ops });
      }
    } else {
      for (let c = 0; c < this.cols; c++) {
        let vals: number[] = [],
          ids: (Id | 0)[] = [];
        for (let r = 0; r < this.rows; r++) {
          vals.push(this.values[r][c]);
          ids.push(this.ids[r][c]);
        }
        const reverse = dir === "down";
        if (reverse) {
          vals = vals.reverse();
          ids = ids.reverse();
        }
        const res = this.slideWithPaths(vals, ids);
        anyMoved = anyMoved || res.moved;
        mergesAll.push(...res.merges);
        const outV = reverse ? res.outValues.slice().reverse() : res.outValues;
        const outI = reverse ? res.outIds.slice().reverse() : res.outIds;
        for (let r = 0; r < this.rows; r++) {
          this.values[r][c] = outV[r];
          this.ids[r][c] = outI[r];
        }
        allOps.push({ axis: "col", index: c, reverse, ops: res.ops });
      }
    }

    if (!anyMoved) {
      this.shakeNoMove(dir as any);
      return;
    }

    // só empilha o snapshot se de fato houve movimento
    this.pushUndoSnapshot();
    // substitui topo pelo snapshot correto (antes da jogada atual)
    this.undoStack[this.undoStack.length - 1] = {
      values: beforeValues,
      ids: beforeIds,
      score: beforeScore,
    };

    await this.animateOps(allOps);

    const maxThisMove = mergesAll.length ? Math.max(...mergesAll) : 0;
    if (!this.reached2048 && maxThisMove >= 2048) {
      this.reached2048 = true;
      setUnlocked2048();
    }
    const boardMax = this.getBoardMax();
    if (!this.cfg.endless && boardMax >= this.cfg.target) {
      this.showOverlay(`Você atingiu ${boardMax}!`, true);
      return;
    }
    this.spawnRandomTile();
    if (!this.canMove()) {
      this.onGameOver();
      this.showOverlay("Sem movimentos! Fim de jogo.", false);
    }
  }

  // ---------- Animação de ops ----------
  private animateOps(
    allOps: Array<{
      axis: "row" | "col";
      index: number;
      reverse: boolean;
      ops: SlideResult["ops"];
    }>,
  ): Promise<void> {
    return new Promise((resolve) => {
      const trail: TileTrail | undefined = this.data.get("tileTrail");
      trail?.clear();
      const rcToXY = (r: number, c: number) => this.cellXY(r, c);
      const idxToRC = (
        axis: "row" | "col",
        index: number,
        idx: number,
        reverse: boolean,
      ) => {
        if (axis === "row") {
          const r = index;
          const c = reverse ? this.cols - 1 - idx : idx;
          return { r, c };
        } else {
          const c = index;
          const r = reverse ? this.rows - 1 - idx : idx;
          return { r, c };
        }
      };

      const tweens: Phaser.Tweens.Tween[] = [];
      const toComplete: Phaser.Tweens.Tween[] = [];

      // 1) Moves
      for (const group of allOps) {
        for (const op of group.ops)
          if (op.type === "move") {
            const toRC = idxToRC(group.axis, group.index, op.to, group.reverse);
            const cont = this.tiles.get(op.id);
            if (!cont) continue;
            const { x, y } = rcToXY(toRC.r, toRC.c);
            if (this.settings.animations) {
              const tw = this.tweens.add({
                targets: cont,
                x,
                y,
                duration: 110,
                ease: "quad.out",
                onUpdate: () => {
                  if (trail) trail.addSnapshot(cont);
                },
              });
              tweens.push(tw);
            } else {
              cont.setPosition(x, y);
            }
          }
      }

      // 2) Merges
      for (const group of allOps) {
        for (const op of group.ops)
          if (op.type === "merge") {
            const toRC = idxToRC(group.axis, group.index, op.to, group.reverse);
            const contA = this.tiles.get(op.survivorId);
            const contB = this.tiles.get(op.consumedId);
            if (!contA || !contB) continue;

            const { x: tx, y: ty } = rcToXY(toRC.r, toRC.c);
            const cx = tx + this.cellSize / 2;
            const cy = ty + this.cellSize / 2;

            const applyMergeVisual = () => {
              let rect = contA.getData("rect") as
                | Phaser.GameObjects.Rectangle
                | undefined;
              let txt = contA.getData("txt") as
                | Phaser.GameObjects.Text
                | undefined;

              if (!rect || !txt) {
                const list = (contA as any)
                  .list as Phaser.GameObjects.GameObject[];
                rect = list?.find(
                  (o) => o instanceof Phaser.GameObjects.Rectangle,
                ) as Phaser.GameObjects.Rectangle | undefined;
                txt = list?.find(
                  (o) => o instanceof Phaser.GameObjects.Text,
                ) as Phaser.GameObjects.Text | undefined;
              }
              if (!rect || !txt) return;

              const fill = Phaser.Display.Color.HexStringToColor(
                getTileColor(op.newValue),
              ).color;
              rect.fillColor = fill;
              txt.setText(String(op.newValue));
              txt.setColor(
                op.newValue <= 4
                  ? this.theme.colors.text
                  : this.theme.colors.bg,
              );

              mergePulse(contA, this);
              burstAt(this, cx, cy, 12);
              scoreFly(this, cx, cy - 12, op.newValue);

              this.onMerge(op.newValue);
              if (op.newValue >= 512) shakeOnMerge(this, 0.003, 120);
              if (op.newValue >= 1024) zoomPunch(this);
              if (op.newValue === 2048) flashWin(this);

              this.playMergeSfx(op.newValue);
            };

            if (this.settings.animations) {
              const twA = this.tweens.add({
                targets: contA,
                x: tx,
                y: ty,
                duration: 110,
                ease: "quad.out",
              });
              const twB = this.tweens.add({
                targets: contB,
                x: tx,
                y: ty,
                duration: 110,
                ease: "quad.out",
                onUpdate: () => {
                  if (trail) trail.addSnapshot(contB);
                },
                onComplete: () => {
                  contB.destroy(true);
                  this.tiles.delete(op.consumedId);
                  applyMergeVisual();
                },
              });
              tweens.push(twA, twB);
              toComplete.push(twB);
            } else {
              contA.setPosition(tx, ty);
              contB.destroy(true);
              this.tiles.delete(op.consumedId);
              applyMergeVisual();
            }
          }
      }

      if (!this.settings.animations || tweens.length === 0) {
        trail?.clear();
        this.fullRepaint();
        resolve();
        return;
      }
      const last = toComplete.length
        ? toComplete[toComplete.length - 1]
        : tweens[tweens.length - 1];
      last.setCallback("onComplete", () => {
        trail?.clear();
        this.fullRepaint();
        resolve();
      });
    });
  }

  // ---------- SFX ----------
  private playMergeSfx(value: number) {
    if (!this.settings.sound) return;
    try {
      if (!this.audioCtx)
        this.audioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      const ctx = this.audioCtx!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const step = Math.log2(value) - 1; // 2->0, 4->1, ...
      const base = 220; // A3
      const freq = base * Math.pow(1.12246, step);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  // ---------- Overlay ----------
  private showOverlay(text: string, win: boolean) {
    const { width, height } = this.scale;
    const t = this.theme.colors;
    const uiTheme = mapThemeToButtonTheme(t);

    const Z_BG = 1000,
      Z_BOX = 1001,
      Z_TXT = 1002;

    const bg = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setDepth(Z_BG)
      .setScrollFactor(0);
    const box = this.add
      .rectangle(
        width / 2,
        height / 2,
        Math.floor(width * 0.82),
        260,
        Phaser.Display.Color.HexStringToColor(t.surfaceAlt).color,
        1,
      )
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(t.primary).color)
      .setDepth(Z_BOX)
      .setScrollFactor(0);

    const msg = this.add
      .text(width / 2, height / 2 - 52, text, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "22px",
        color: t.text,
        align: "center",
        wordWrap: { width: Math.floor(width * 0.7) },
      })
      .setOrigin(0.5)
      .setDepth(Z_TXT)
      .setScrollFactor(0);

    const btnTry = new UIButton(this, {
      x: width / 2,
      y: height / 2 + 34,
      label: win ? "Continuar (Endless)" : "Tentar de novo",
      variant: "primary",
      size: "md",
      theme: uiTheme,
      onClick: () => {
        // saída
        this.tweens.add({
          targets: [box, msg],
          alpha: 0,
          duration: 120,
          ease: "sine.in",
          onComplete: () => {
            bg.destroy();
            box.destroy();
            msg.destroy();
            if (win) this.cfg.endless = true;
            else
              this.scene.restart({
                mode: this.mode,
                rows: this.rows,
                cols: this.cols,
              });
          },
        });
        this.tweens.add({
          targets: bg,
          alpha: 0,
          duration: 120,
          ease: "sine.in",
        });
      },
    });
    btnTry.setDepth(Z_TXT).setScrollFactor(0);

    const btnMenu = new UIButton(this, {
      x: width / 2,
      y: height / 2 + 84,
      label: "Menu",
      variant: "ghost",
      size: "md",
      theme: uiTheme,
      onClick: () => {
        this.tweens.add({
          targets: [box, msg, btnTry, btnMenu],
          alpha: 0,
          duration: 100,
          ease: "sine.in",
        });
        this.tweens.add({
          targets: bg,
          alpha: 0,
          duration: 100,
          ease: "sine.in",
        });
        swapTo(this, "MenuScene", {}, "left");
      },
    });
    btnMenu.setDepth(Z_TXT).setScrollFactor(0);

    // entrada
    box.setScale(0.95);
    box.setAlpha(0);
    [msg, btnTry, btnMenu].map((o) => ((o as any).alpha = 0));
    this.tweens.add({
      targets: [bg],
      alpha: { from: 0, to: 0.6 },
      duration: 140,
      ease: "sine.out",
    });
    this.tweens.add({
      targets: [box],
      alpha: 1,
      duration: 160,
      ease: "sine.out",
    });
    this.tweens.add({
      targets: [box],
      scale: 1,
      duration: 160,
      ease: "back.out",
    });
    this.tweens.add({
      targets: [msg, btnTry, btnMenu],
      alpha: 1,
      duration: 180,
      ease: "sine.out",
      delay: 40,
    });
  }

  // ---------- Input ----------
  private registerInputs() {
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") this.move("left");
      else if (k === "arrowright" || k === "d") this.move("right");
      else if (k === "arrowup" || k === "w") this.move("up");
      else if (k === "arrowdown" || k === "s") this.move("down");
      else if (k === "u") this.tryUndo(); // atalho para testes
    });

    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (p: Phaser.Input.Pointer) => {
        this.dragStart = new Phaser.Math.Vector2(p.x, p.y);
      },
    );
    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      if (!this.dragStart) return;
      const end = new Phaser.Math.Vector2(p.x, p.y);
      const delta = end.clone().subtract(this.dragStart);
      this.dragStart = undefined;
      const TH = 22;
      if (delta.length() < TH) return;
      if (Math.abs(delta.x) > Math.abs(delta.y))
        this.move(delta.x > 0 ? "right" : "left");
      else this.move(delta.y > 0 ? "down" : "up");
    });
  }

  // --- GRID FX ---
  private createGridFX() {
    this.gridFX?.destroy();

    const t = this.theme.colors;
    const boardW = this.getBoardWidth();
    const boardH = this.getBoardHeight();

    const fx = this.add
      .graphics()
      .setPosition(this.boardX, this.boardY)
      .setDepth(0.8)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.75)
      .setScrollFactor(1);

    fx.clear();
    fx.lineStyle(
      1,
      Phaser.Display.Color.HexStringToColor(t.gridHighlight).color,
      0.85,
    );
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const { x: cx, y: cy } = this.cellLocalXY(r, c);
        fx.strokeRoundedRect(cx, cy, this.cellSize, this.cellSize, 10);
      }
    }

    fx.lineStyle(
      2,
      Phaser.Display.Color.HexStringToColor(t.primary).color,
      0.6,
    );
    fx.strokeRoundedRect(6, 6, boardW - 12, boardH - 12, 16);

    this.gridFX = fx;
  }

  private pulseGridFX() {
    if (!this.gridFX) return;
    this.tweens.add({
      targets: this.gridFX,
      alpha: 0.25,
      duration: 700,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 1,
    });
  }

  private flashGridFXOnce() {
    if (!this.gridFX) return;
    this.tweens.add({
      targets: this.gridFX,
      alpha: 1,
      duration: 120,
      ease: "quad.out",
      yoyo: true,
    });
  }

  private shakeNoMove(dir: "left" | "right" | "up" | "down") {
    const cam = this.cameras.main;
    const intensity = 0.006;
    cam.shake(140, intensity);
  }

  private updateScore(score: number) {
    this.music?.updateByScore?.(score);
  }

  shutdown() {
    this.music?.destroy();
    hideBanner().catch(() => {});
  }
  destroy() {
    this.music?.destroy();
  }
  private onMerge(value: number) {
    this.score += value;
    this.registry.set("score", this.score);
    this.updateScore(this.score);

    if (this.score === 1024 || this.score === 2048) {
      this.music?.accentMilestone?.();
    }
  }

  onGameOver() {
    this.failedRuns++;
    if (this.failedRuns % 3 === 0) {
      showInterstitialIfReady().then((shown) => {
        if (!shown) prepareInterstitial(); // garante pré-carregamento
      });
    } else {
      prepareInterstitial();
    }
  }
}
