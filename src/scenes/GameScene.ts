// src/scenes/GameScene.ts

import { getSettings, setUnlocked2048 } from "../storage";
import { getTheme, getTileColor } from "../theme";
import { hideBanner, showBannerBottom } from "../native-ads";
import {
  onReward,
  prepareInterstitial,
  prepareRewarded,
  showInterstitialIfReady,
  showRewardedIfReady,
} from "../ads/ads";

import { MenuIcon } from "../ui/MenuIcon";
import Phaser from "phaser";
import { TileTrail } from "../animations/trail";
import { getGlobalMusic } from "../audio/MusicSingleton";
import { swapTo } from "../animations/transitions";
import { t } from "../i18n";

// -----------------------------------------------------------------------------
// Tipos e helpers
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

// -----------------------------------------------------------------------------
// Ícones de botão (vetor sem curvas especiais)
class CircleIconButton extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Arc;
  private iconVec?: Phaser.GameObjects.Container;
  private badge?: Phaser.GameObjects.Text;
  private hitZone!: Phaser.GameObjects.Zone;
  private radius: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    colors: { fill: string; stroke: string; text: string; glow: string },
    onClick: () => void,
    withBadge = false,
    variant: "undo" | "reward" = "undo",
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    this.radius = radius;

    const fill = Phaser.Display.Color.HexStringToColor(colors.fill).color;
    const stroke = Phaser.Display.Color.HexStringToColor(colors.stroke).color;

    const shadow = scene.add
      .circle(2, 4, radius * 1.05, 0x000000, 0.35)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(0);

    this.bg = scene.add
      .circle(0, 0, radius, fill, 1)
      .setStrokeStyle(2, stroke, 1)
      .setDepth(1);

    this.iconVec = this.buildVectorIcon(variant, stroke);
    this.add([shadow, this.bg, this.iconVec]);

    this.setSize(radius * 2, radius * 2);

    if (withBadge) {
      this.badge = scene.add
        .text(radius * 0.85, -radius * 0.85, "×0", {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: `${Math.max(10, Math.round(radius * 0.45))}px`,
          color: "#000",
          backgroundColor: colors.glow,
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(3);
      this.badge.setResolution(2);
      this.add(this.badge);
    }

    this.hitZone = scene.add.zone(0, 0, radius * 2, radius * 2).setOrigin(0.5);
    this.hitZone.setInteractive({ useHandCursor: true });
    this.add(this.hitZone);

    this.hitZone.on("pointerdown", () => {
      scene.tweens.add({
        targets: this,
        scale: 0.9,
        duration: 70,
        ease: "sine.out",
      });
    });
    this.hitZone.on("pointerup", () => {
      scene.tweens.add({
        targets: this,
        scale: 1.0,
        duration: 90,
        ease: "back.out(2.2)",
      });
      onClick();
    });
    this.hitZone.on("pointerout", () => {
      scene.tweens.add({
        targets: this,
        scale: 1.0,
        duration: 90,
        ease: "back.out(2.2)",
      });
    });

    // animações a cada 3s
    this.scene.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        if (variant === "undo") {
          this.scene.tweens.add({
            targets: this.iconVec,
            angle: (this.iconVec!.angle + 360),
            duration: 700,
            ease: "cubic.out",
          });
        } else {
          this.scene.tweens.add({
            targets: this.iconVec,
            scale: { from: 1, to: 1.12 },
            yoyo: true,
            duration: 420,
            ease: "sine.out",
          });
        }
      },
    });

    this.setDepth(2000);
  }

  setBadge(text: string) {
    this.badge?.setText(text);
  }

  private buildVectorIcon(
    variant: "undo" | "reward",
    strokeColor: number,
  ): Phaser.GameObjects.Container {
    const cont = this.scene.add.container(0, 0).setDepth(2);
    const thick = Math.max(2, Math.round(this.radius * 0.16));

    if (variant === "undo") {
      // Arco aproximado por segmentos + triângulo da seta
      const g = this.scene.add.graphics().setDepth(2);
      g.lineStyle(thick, strokeColor, 1);

      const R = this.radius * 0.62;
      const steps = 28;
      const startRad = Phaser.Math.DegToRad(40);
      const endRad = Phaser.Math.DegToRad(300);

      let prevX = Math.cos(startRad) * R;
      let prevY = Math.sin(startRad) * R;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const a = Phaser.Math.Linear(startRad, endRad, t);
        const x = Math.cos(a) * R;
        const y = Math.sin(a) * R;
        g.lineBetween(prevX, prevY, x, y);
        prevX = x;
        prevY = y;
      }

      const ax = Math.cos(endRad) * R;
      const ay = Math.sin(endRad) * R;
      const s = this.radius * 0.34;
      const head = this.scene.add.graphics();
      head.fillStyle(strokeColor, 1);
      head.fillTriangle(
        ax,
        ay,
        ax - s * 0.85,
        ay - s * 0.3,
        ax - s * 0.6,
        ay + s * 0.7,
      );

      cont.add([g, head]);
    } else {
      // Presente (gift) com retângulos arredondados + triângulos
      const g = this.scene.add.graphics().setDepth(2);
      g.lineStyle(thick, strokeColor, 1);

      const w = this.radius * 1.15;
      const h = this.radius * 0.9;
      const r = Math.max(3, Math.round(this.radius * 0.22));

      // corpo
      g.fillStyle(0x000000, 0);
      g.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, r);
      g.strokeRoundedRect(-w / 2, -h / 2 + 4, w, h, r);

      // tampa
      const lid = this.scene.add.graphics();
      lid.lineStyle(thick, strokeColor, 1);
      lid.fillStyle(0x000000, 0);
      lid.fillRoundedRect(-w / 2, -h / 2 - r, w, r * 1.2, r);
      lid.strokeRoundedRect(-w / 2, -h / 2 - r, w, r * 1.2, r);

      // fita
      g.lineBetween(0, -h / 2 + 4, 0, h / 2 + 4);

      // laço (triângulos)
      const bow = this.scene.add.graphics();
      bow.fillStyle(strokeColor, 1);
      const bx = 0,
        by = -h / 2 - r * 0.25;
      const t = r * 0.9;
      bow.fillTriangle(bx, by, bx - t * 1.2, by - t * 0.8, bx - t * 1.4, by + t * 0.2);
      bow.fillTriangle(bx, by, bx + t * 1.2, by - t * 0.8, bx + t * 1.4, by + t * 0.2);

      cont.add([g, lid, bow]);
    }

    return cont.setSize(this.radius * 2, this.radius * 2);
  }
}

// -----------------------------------------------------------------------------
// Cena principal
export default class GameScene extends Phaser.Scene {
  private mode!: GameMode;
  private cfg!: ModeConfig;
  private settings = getSettings();
  private theme = getTheme();

  private rows!: number;
  private cols!: number;
  private values!: number[][];
  private ids!: (Id | 0)[][];
  private seqId = 1;

  // Layout
  private safeTop = 76;
  private sideMargin = 16;
  private boardX!: number;
  private boardY!: number;
  private cellSize!: number;
  private gap = 10;

  // Objetos/estado
  private tiles = new Map<Id, Phaser.GameObjects.Container>();
  private dragStart?: Phaser.Math.Vector2;
  private music: any;
  private audioCtx: AudioContext | null = null;
  private score = 0;
  private reached2048 = false;
  private failedRuns = 0;

  // Undo / Rewarded
  private powerups = { undo: 0 };
  private undoStack: Array<{
    values: number[][];
    ids: (Id | 0)[][];
    score: number;
  }> = [];
  private undoBtn?: CircleIconButton;
  private rewardBtn?: CircleIconButton;

  // FX
  private gridFX?: Phaser.GameObjects.Graphics;

  constructor() {
    super("GameScene");
  }

  create(data: GameModeData) {
    this.theme = getTheme();
    this.input.setTopOnly(true);
    this.mode = (data?.mode ?? "classic") as GameMode;
    this.cfg = configFromMode(data);
    this.rows = this.cfg.rows;
    this.cols = this.cfg.cols;

    // trilha (um pouco mais rápida e translúcida)
    this.data.set("tileTrail", new TileTrail(this));

    new MenuIcon(this, this.scale.width - 30, 30);

    this.setupLayoutAndGrid();
    this.drawBoardBg();
    this.createGridFX();

    this.spawnRandomTile();
    this.spawnRandomTile();

    this.registerInputs();
    this.fullRepaint();
    this.paintHeaderHud();

    // Ads
    showBannerBottom().catch(() => {});
    prepareInterstitial().catch(() => {});
    prepareRewarded().catch(() => {});
    onReward?.(() => {
      this.powerups.undo++;
      this.updateUndoHud();
      this.feedbackToast(t("reward_undo_received"));
    });

    const bootAudio = async () => {
      try {
        if (this.sound.locked) await this.sound.unlock();
        const ctx = (this.sound as Phaser.Sound.SoundManager).context;
        if (ctx && ctx.state !== "running") await ctx.resume();

        if (this.settings.music !== false) {
          this.music = getGlobalMusic(this);
          (this.music as any).attach?.(this);
          if (!(this.music as any).isStarted?.()) this.music.init?.();
          this.music.updateByScore?.(this.score);
        }

        this.input.off("pointerdown", bootAudio as any);
        this.input.keyboard?.off("keydown", bootAudio as any);
      } catch (e) {
        console.warn("[GameScene] Falha ao desbloquear áudio:", e);
      }
    };

    this.input.once("pointerdown", bootAudio);
    this.input.keyboard?.once("keydown", bootAudio);

    this.hookAppLifecycle();
  }

  // ---------------------------------------------------------------------------
  // Header (título + botões)
  private paintHeaderHud() {
    const { width } = this.scale;
    const c = this.theme.colors;

    const headerY = this.boardY - 54;

    const title = this.add
      .text(this.sideMargin + 8, headerY, t("title"), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "26px",
        color: c.text,
      })
      .setOrigin(0, 0.5);
    title.setShadow(0, 0, c.glow, 16, true, true);
    title.setResolution(2);

    const sub = this.add
      .text(
        this.sideMargin + 10,
        headerY + 22,
        `${this.mode.toUpperCase()} • ${this.rows}x${this.cols} • ${t("goal")}: ${
          this.cfg.endless ? "∞" : this.cfg.target
        }`,
        {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "13px",
          color: c.textDim,
        },
      )
      .setOrigin(0, 0.5)
      .setAlpha(0.95);
    sub.setResolution(2);

    const right = width - this.sideMargin - 8;
    const radius = 18;

    this.undoBtn = new CircleIconButton(
      this,
      right - radius,
      headerY,
      radius,
      { fill: c.surfaceAlt, stroke: c.primary, text: c.text, glow: c.primary },
      () => this.tryUndo(),
      true,
      "undo",
    );

    this.rewardBtn = new CircleIconButton(
      this,
      right - radius,
      headerY - (radius * 2 + 10),
      radius * 0.9,
      { fill: c.surfaceAlt, stroke: c.gridHighlight, text: c.text, glow: c.primary },
      async () => {
        const shown = await showRewardedIfReady();
        if (!shown) {
          await prepareRewarded();
          this.feedbackToast(t("ad_loading_try_again"));
        }
      },
      false,
      "reward",
    );

    this.add.existing(this.undoBtn);
    this.add.existing(this.rewardBtn);
    this.undoBtn.setDepth(2000);
    this.rewardBtn.setDepth(2000);
    this.updateUndoHud();
  }

  private updateUndoHud() {
    this.undoBtn?.setBadge(`×${this.powerups.undo}`);
  }

  // ---------------------------------------------------------------------------
  // Layout e placa
  private setupLayoutAndGrid() {
    const { width, height } = this.scale;
    const usableW = width - this.sideMargin * 2;
    const usableH = height - this.safeTop - 28;
    const maxBoard = Math.min(usableW, usableH);

    this.cellSize = Math.floor(
      (maxBoard - this.gap * (this.cols + 1)) / this.cols,
    );

    const boardW = this.getBoardWidth();
    const boardH = this.getBoardHeight();

    this.boardX = Math.floor((width - boardW) / 2);
    const areaTop = this.safeTop + Math.max(0, (usableH - boardH) / 2);
    this.boardY = Math.floor(areaTop);

    this.values = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(0),
    );
    this.ids = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(0),
    );
  }
  private getBoardWidth() {
    return this.cellSize * this.cols + this.gap * (this.cols + 1);
  }
  private getBoardHeight() {
    return this.cellSize * this.rows + this.gap * (this.rows + 1);
  }
  private cellXY(r: number, c: number) {
    const x = this.boardX + this.gap + c * (this.cellSize + this.gap);
    const y = this.boardY + this.gap + r * (this.cellSize + this.gap);
    return { x, y };
  }

  private drawBoardBg() {
    const c = this.theme.colors;
    const W = this.getBoardWidth();
    const H = this.getBoardHeight();
    const x = this.boardX,
      y = this.boardY;

    // Glow externo
    const glow = this.add.graphics().setDepth(0);
    glow.fillStyle(Phaser.Display.Color.HexStringToColor(c.glow).color, 0.22);
    glow.fillRoundedRect(x - 10, y - 10, W + 20, H + 20, 22);

    // Placa
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(c.surface).color, 1);
    g.fillRoundedRect(x, y, W, H, 18);

    // Linhas das células
    g.lineStyle(1, Phaser.Display.Color.HexStringToColor(c.gridLine).color, 1);
    for (let r = 0; r < this.rows; r++)
      for (let ccol = 0; ccol < this.cols; ccol++) {
        const { x: cx, y: cy } = this.cellXY(r, ccol);
        g.strokeRoundedRect(cx, cy, this.cellSize, this.cellSize, 10);
      }

    this.cameras.main.setBackgroundColor(c.bg);
  }

  private createGridFX() {
    this.gridFX?.destroy();
    const c = this.theme.colors;
    const fx = this.add
      .graphics()
      .setPosition(this.boardX, this.boardY)
      .setDepth(0.8)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.7);

    const W = this.getBoardWidth(),
      H = this.getBoardHeight();
    fx.lineStyle(
      2,
      Phaser.Display.Color.HexStringToColor(c.primary).color,
      0.55,
    );
    fx.strokeRoundedRect(6, 6, W - 12, H - 12, 16);
    this.gridFX = fx;
  }

  // ---------------------------------------------------------------------------
  // Tiles (cor chapada + legibilidade garantida)
  private spawnRandomTile(): boolean {
    const empty: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.values[r][c] === 0) empty.push({ r, c });
    if (!empty.length) return false;
    const { r, c } = Phaser.Utils.Array.GetRandom(empty);
    const v = Math.random() < 0.9 ? 2 : 4;
    const id = this.seqId++;
    this.values[r][c] = v;
    this.ids[r][c] = id;
    this.createTile(id, r, c, v, true);
    return true;
  }

  private createTile(id: Id, r: number, c: number, value: number, pop = false) {
    const tcol = this.theme.colors;
    const { x, y } = this.cellXY(r, c);

    const cont = this.add.container(x, y).setDepth(1);
    const core = this.add.container(this.cellSize / 2, this.cellSize / 2);

    const w = this.cellSize,
      h = this.cellSize;

    // sombra
    const shadow = this.add.graphics();
    shadow
      .fillStyle(0x000000, 0.35)
      .fillRoundedRect(-w * 0.45, -h * 0.4, w * 0.9, h * 0.9, 12)
      .setAlpha(0.35)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    // cor chapada (ajustada para contraste com a superfície)
    const baseHex = getTileColor(value) || tcol.primary || "#66b8e0";
    const fillHex = adjustColorForSurface(baseHex, tcol.surface, 2.2);
    const fillInt = Phaser.Display.Color.HexStringToColor(fillHex).color;

    const body = this.add.graphics();
    body.fillStyle(fillInt, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 12);

    // borda
    const border = this.add.graphics();
    border
      .lineStyle(2, Phaser.Display.Color.HexStringToColor(tcol.primary).color, 1)
      .strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

    // texto (auto claro/escuro)
    const txtColor = readableTextColor(fillHex, "#FFFFFF", "#0B0F14");
    const txt = this.add
      .text(0, 0, String(value), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.floor(this.cellSize * 0.38)}px`,
        color: txtColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    txt.setResolution(2);
    if (txtColor === "#FFFFFF") txt.setShadow(0, 0, tcol.glow, 6, true, true);
    else txt.setShadow(0, 0, "#000000", 2, true, true);

    core.add([shadow, body, border, txt]);
    cont.add(core);

    cont.setData("core", core);
    cont.setData("body", body);
    cont.setData("txt", txt);

    this.tiles.set(id, cont);

    // POP do centro (apenas um anel de borda)
    if (pop) {
      const pulse = this.add.graphics();
      pulse
        .lineStyle(3, Phaser.Display.Color.HexStringToColor(tcol.primary).color, 0.9)
        .strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      core.add(pulse);
      pulse.setScale(1.15);
      this.tweens.add({
        targets: pulse,
        scale: 1.0,
        alpha: { from: 0.9, to: 0 },
        duration: 240,
        ease: "Cubic.Out",
        onComplete: () => pulse.destroy(),
      });

      // ring visual adicional
      ringPulse(this, x + w / 2, y + h / 2, 0xffffff, 14, 200);
    }
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
        const v = this.values[r][c],
          id = this.ids[r][c];
        if (v !== 0 && id !== 0) this.createTile(id, r, c, v);
      }
  }

  // ---------------------------------------------------------------------------
  // Lógica / movimento
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
    this.undoStack.push({
      values: this.clone2D(this.values),
      ids: this.clone2D(this.ids),
      score: this.score,
    });
    if (this.undoStack.length > 20) this.undoStack.shift();
  }

  private tryUndo() {
    if (this.powerups.undo <= 0) {
      this.feedbackToast(t("no_undos"));
      return;
    }
    const snap = this.undoStack.pop();
    if (!snap) {
      this.feedbackToast(t("nothing_to_undo"));
      return;
    }
    this.powerups.undo--;
    this.updateUndoHud();

    this.values = this.clone2D(snap.values);
    this.ids = this.clone2D(snap.ids);
    this.score = snap.score;
    this.registry.set("score", this.score);
    this.fullRepaint();
    this.feedbackToast(t("move_undone"));
  }

  private slideWithPaths(vals: number[], ids: (Id | 0)[]): SlideResult {
    const n = vals.length;
    const compactVals: number[] = [];
    const compactIds: Id[] = [];
    const ops: SlideResult["ops"] = [];
    const mergesOut: number[] = [];

    for (let i = 0; i < n; i++)
      if (vals[i] !== 0) {
        compactVals.push(vals[i]);
        compactIds.push(ids[i] as Id);
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
      if (from !== to) ops.push({ type: "move", id: idAtTo as number, from, to });
    }
    for (const op of ops)
      if (op.type === "merge") {
        op.fromA = origPos[op.survivorId];
        op.fromB = origPos[op.consumedId];
      }

    const moved = outValues.some((v, i) => v !== vals[i]);
    return { outValues, outIds, moved, merges: mergesOut, ops };
  }

  private async move(dir: Dir) {
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
      // sem movimento: efeitinho leve e som de bump
      this.playBumpSfx();
      tinyBump(this); // leve zoom da câmera
      return;
    }

    this.pushUndoSnapshot();
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
      this.showOverlay(t("reached_value", { v: boardMax }), true);
      return;
    }
    this.spawnRandomTile();
    if (!this.canMove()) {
      this.onGameOver();
      this.showOverlay(t("no_moves_game_over"), false);
    }
  }

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
        }
        const c = index;
        const r = reverse ? this.rows - 1 - idx : idx;
        return { r, c };
      };

      const tweens: Phaser.Tweens.Tween[] = [];
      const toComplete: Phaser.Tweens.Tween[] = [];

      // Moves com duração proporcional + 140ms extras (mais fluido/lento)
      for (const g of allOps)
        for (const op of g.ops)
          if (op.type === "move") {
            const to = idxToRC(g.axis, g.index, op.to, g.reverse);
            const cont = this.tiles.get(op.id);
            if (!cont) continue;
            const { x: tx, y: ty } = rcToXY(to.r, to.c);
            const dx = tx - cont.x,
              dy = ty - cont.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.5) {
              cont.setPosition(tx, ty);
              continue;
            }

            const dur = Phaser.Math.Clamp(60 + dist * 0.5 + 140, 160, 340);

            const core = (cont.getData("core") as Phaser.GameObjects.Container) ?? cont;
            this.tweens.add({
              targets: core,
              scaleX: 0.96,
              scaleY: 1.04,
              duration: 130,
              ease: "sine.out",
            });

            const tw = this.tweens.add({
              targets: cont,
              x: tx,
              y: ty,
              duration: dur,
              ease: "quart.out",
              onUpdate: () => trail?.addSnapshot(cont),
              onComplete: () => {
                this.tweens.add({
                  targets: core,
                  scaleX: 1.0,
                  scaleY: 1.0,
                  duration: 130,
                  ease: "sine.out",
                });
              },
            });
            tweens.push(tw);
          }

      // Merges (curva leve via Path) + efeitos e SOM (todos os merges)
      for (const g of allOps)
        for (const op of g.ops)
          if (op.type === "merge") {
            const to = idxToRC(g.axis, g.index, op.to, g.reverse);
            const A = this.tiles.get(op.survivorId);
            const B = this.tiles.get(op.consumedId);
            if (!A || !B) continue;

            // som em todos os merges
            this.playMergeSfx(op.newValue);

            const { x: tx, y: ty } = rcToXY(to.r, to.c);
            const cx = tx + this.cellSize / 2,
              cy = ty + this.cellSize / 2;

            const midX = (A.x + tx) / 2 + (Math.random() * 8 - 4);
            const midY = (A.y + ty) / 2 + (Math.random() * 8 - 4);

            const applyMerge = () => {
              const tcol = this.theme.colors;
              const body = A.getData("body") as
                | Phaser.GameObjects.Graphics
                | undefined;
              const txt = A.getData("txt") as
                | Phaser.GameObjects.Text
                | undefined;

              const baseHex = getTileColor(op.newValue) || tcol.primary || "#66b8e0";
              const fillHex = adjustColorForSurface(baseHex, tcol.surface, 2.2);
              const fillInt = Phaser.Display.Color.HexStringToColor(fillHex).color;

              if (body) {
                body.clear();
                body
                  .fillStyle(fillInt, 1)
                  .fillRoundedRect(
                    -this.cellSize / 2,
                    -this.cellSize / 2,
                    this.cellSize,
                    this.cellSize,
                    12,
                  );
              }
              if (txt) {
                const cTxt = readableTextColor(fillHex, "#FFFFFF", "#0B0F14");
                txt.setText(String(op.newValue)).setColor(cTxt).setResolution(2);
                if (cTxt === "#FFFFFF")
                  txt.setShadow(0, 0, tcol.glow, 6, true, true);
                else txt.setShadow(0, 0, "#000000", 2, true, true);
              }

              // efeitos simples
              impactEffect(this, cx, cy, (A.getData("core") as Phaser.GameObjects.Container) ?? A, op.newValue, this.theme.colors.primary);
              floatLabel(this, cx, cy - 12, `+${op.newValue}`, "#9be1ff");
              if (op.newValue >= 1024) slowMo(this, 0.85, 120);
              this.onMerge(op.newValue);
            };

            const dur = 240;
            this.tweens.add({
              targets: A,
              x: tx,
              y: ty,
              duration: dur,
              ease: "quart.out",
            });

            // path para B (curvadinho). Path.cubicBezierTo existe em Phaser 3
            const path = new Phaser.Curves.Path(B.x, B.y);
            path.cubicBezierTo(midX, midY, tx, ty, tx, ty);
            const follower: any = { t: 0, vec: new Phaser.Math.Vector2() };
            const twB = this.tweens.add({
              targets: follower,
              t: 1,
              duration: dur,
              ease: "quart.out",
              onUpdate: () => {
                path.getPoint(follower.t, follower.vec);
                B.setPosition(follower.vec.x, follower.vec.y);
                (this.data.get("tileTrail") as TileTrail | undefined)?.addSnapshot(B);
              },
              onComplete: () => {
                B.destroy(true);
                this.tiles.delete(op.consumedId);
                applyMerge();
              },
            });
            tweens.push(twB);
            toComplete.push(twB);
          }

      if (tweens.length === 0) {
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

  // ---------------------------------------------------------------------------
  // UI / feedback
  private feedbackToast(text: string) {
    const { width } = this.scale;
    const c = this.theme.colors;
    const toast = this.add
      .text(width / 2, this.boardY - 70, text, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "14px",
        color: c.bg,
        backgroundColor: c.primary,
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    toast.setResolution(2);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      yoyo: true,
      hold: 900,
      duration: 160,
      onComplete: () => toast.destroy(),
    });
  }

  private playMergeSfx(value: number) {
    if (!this.settings.sound) return;
    try {
      if (!this.audioCtx)
        this.audioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      const ctx = this.audioCtx!;
      const now = ctx.currentTime;

      const step = Math.max(0, Math.log2(value) - 1);
      const base = 220;
      const freq = base * Math.pow(1.12246, step);

      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      const g = ctx.createGain();
      const A = 0.01,
        D = 0.12;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + A);
      g.gain.exponentialRampToValueAtTime(0.0001, now + A + D);

      osc.connect(g).connect(ctx.destination);

      // "click" percussivo breve (ruído)
      const noiseBuf = ctx.createBuffer(
        1,
        Math.floor(ctx.sampleRate * 0.02),
        ctx.sampleRate,
      );
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.8;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.setValueAtTime(1200, now);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.18, now);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      noise.connect(hp).connect(ng).connect(ctx.destination);

      osc.start(now);
      noise.start(now);
      osc.stop(now + A + D + 0.02);
      noise.stop(now + 0.08);
    } catch {}
  }

  private playBumpSfx() {
    if (!this.settings.sound) return;
    try {
      if (!this.audioCtx)
        this.audioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      const ctx = this.audioCtx!;
      const now = ctx.currentTime;

      const freqs = [160, 90];
      const total = 0.15;
      for (const f of freqs) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(f, now);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + total);
        o.connect(g).connect(ctx.destination);
        o.start(now);
        o.stop(now + total + 0.02);
      }

      // ruído abafado
      const noiseBuf = ctx.createBuffer(
        1,
        Math.floor(ctx.sampleRate * 0.02),
        ctx.sampleRate,
      );
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.7;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(300, now);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.12, now);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      src.connect(lp).connect(ng).connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.08);
    } catch {}
  }

  private showOverlay(text: string, win: boolean) {
    const { width, height } = this.scale;
    const c = this.theme.colors;

    const bg = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
      .setDepth(1000)
      .setScrollFactor(0);
    const box = this.add
      .rectangle(
        width / 2,
        height / 2,
        Math.floor(width * 0.82),
        260,
        Phaser.Display.Color.HexStringToColor(c.surfaceAlt).color,
        1,
      )
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(c.primary).color)
      .setDepth(1001)
      .setScrollFactor(0);

    const msg = this.add
      .text(width / 2, height / 2 - 52, text, {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "22px",
        color: c.text,
        align: "center",
        wordWrap: { width: Math.floor(width * 0.7) },
      })
      .setOrigin(0.5)
      .setDepth(1002)
      .setScrollFactor(0);
    msg.setResolution(2);

    const btnTry = this.add
      .text(width / 2, height / 2 + 34, win ? t("continue_endless") : t("retry"), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "18px",
        color: c.bg,
        backgroundColor: c.primary,
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(1002)
      .setInteractive({ useHandCursor: true });
    btnTry.setResolution(2);
    btnTry.on("pointerup", () => {
      this.tweens.add({
        targets: [box, msg, btnTry, btnMenu],
        alpha: 0,
        duration: 120,
        ease: "sine.in",
      });
      this.tweens.add({
        targets: bg,
        alpha: 0,
        duration: 120,
        ease: "sine.in",
      });
      if (win) this.cfg.endless = true;
      else
        this.scene.restart({
          mode: this.mode,
          rows: this.rows,
          cols: this.cols,
        });
    });

    const btnMenu = this.add
      .text(width / 2, height / 2 + 84, t("back"), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "16px",
        color: c.textDim,
        backgroundColor: Phaser.Display.Color.RGBToString(0, 0, 0, 0),
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(1002)
      .setInteractive({ useHandCursor: true });
    btnMenu.setResolution(2);
    btnMenu.on("pointerup", () => {
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
    });

    box.setScale(0.95).setAlpha(0);
    [msg, btnTry, btnMenu].forEach((o: any) => (o.alpha = 0));
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

  // ---------------------------------------------------------------------------
  // Input / housekeeping
  private registerInputs() {
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") this.move("left");
      else if (k === "arrowright" || k === "d") this.move("right");
      else if (k === "arrowup" || k === "w") this.move("up");
      else if (k === "arrowdown" || k === "s") this.move("down");
      else if (k === "u") this.tryUndo();
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

  private onMerge(v: number) {
    this.score += v;
    this.registry.set("score", this.score);
    this.music?.updateByScore?.(this.score);
    if (this.score === 1024 || this.score === 2048)
      this.music?.accentMilestone?.();
  }

  onGameOver() {
    this.failedRuns++;
    if (this.failedRuns % 3 === 0) {
      showInterstitialIfReady().then((shown) => {
        if (!shown) prepareInterstitial();
      });
    } else {
      prepareInterstitial();
    }
  }

  private hookAppLifecycle() {
    const pause = () => {
      try {
        (this.music as any)?.pause?.();
        (this.sound as any).context?.suspend?.();
      } catch {}
    };
    const resume = () => {
      try {
        (this.sound as any).context?.resume?.();
        (this.music as any)?.resume?.();
      } catch {}
    };
    this.game.events.on(Phaser.Core.Events.BLUR, pause, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, pause, this);
    this.game.events.on(Phaser.Core.Events.PAUSE, pause, this);
    this.game.events.on(Phaser.Core.Events.FOCUS, resume, this);
    this.game.events.on(Phaser.Core.Events.VISIBLE, resume, this);
    this.game.events.on(Phaser.Core.Events.RESUME, resume, this);
    document.addEventListener("visibilitychange", () => {
      document.hidden ? pause() : resume();
    });
  }

  shutdown() {
    hideBanner().catch(() => {});
  }
  destroy() {}
}

// -----------------------------------------------------------------------------
// ==== Mini efeitos utilitários (sem dependências externas) ====

// pulse de anel simples
function ringPulse(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  radius: number,
  duration = 200,
) {
  const ring = scene.add.circle(x, y, radius * 0.5, color, 0.18).setDepth(2);
  scene.tweens.add({
    targets: ring,
    radius: radius * 1.6,
    alpha: 0,
    duration,
    ease: "quad.out",
    onComplete: () => ring.destroy(),
  });
}

// texto flutuante
function floatLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color = "#ffffff",
) {
  const lbl = scene.add
    .text(x, y, text, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      color,
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  lbl.setResolution(2);
  scene.tweens.add({
    targets: lbl,
    y: y - 18,
    alpha: { from: 1, to: 0 },
    duration: 500,
    ease: "sine.out",
    onComplete: () => lbl.destroy(),
  });
}

// leve slow motion
function slowMo(scene: Phaser.Scene, scale = 0.85, ms = 120) {
  const cam = scene.cameras.main;
  const old = cam.timeScale ?? 1;
  cam.timeScale = scale;
  scene.time.delayedCall(ms, () => (cam.timeScale = old));
}

// impacto visual no merge
function impactEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  target: Phaser.GameObjects.GameObject,
  value: number,
  ringHex: string,
) {
  const ringCol = Phaser.Display.Color.HexStringToColor(ringHex).color;
  const magnitude = Phaser.Math.Clamp((Math.log2(value) - 1) * 0.015, 0.01, 0.05);
  scene.cameras.main.shake(120, magnitude);
  ringPulse(scene, x, y, ringCol, 18 + Math.min(24, Math.log2(value) * 2), 220);

  scene.tweens.add({
    targets: target as any,
    scaleX: { from: 1.0, to: 1.07 },
    scaleY: { from: 1.0, to: 0.94 },
    yoyo: true,
    duration: 140,
    ease: "sine.out",
  });
}

// bump bem leve quando não move
function tinyBump(scene: Phaser.Scene) {
  const cam = scene.cameras.main;
  const ox = cam.x,
    oy = cam.y;
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: 100,
    yoyo: true,
    onUpdate: (tw) => {
      const v = (tw.getValue() as number) * 1.2;
      cam.setScroll(ox + v, oy);
    },
    onComplete: () => cam.setScroll(ox, oy),
  });
}

// -----------------------------------------------------------------------------
// ==== Helpers de cor/contraste robustos (sem gradiente) ====
type RGB = { r: number; g: number; b: number };

function parseHex(input: any): RGB {
  if (typeof input !== "string") return { r: 0, g: 0, b: 0 };
  let hex = input.trim();
  if (hex.startsWith("0x")) hex = "#" + hex.slice(2);
  const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
  if (short) {
    return {
      r: parseInt(short[1] + short[1], 16),
      g: parseInt(short[2] + short[2], 16),
      b: parseInt(short[3] + short[3], 16),
    };
  }
  const long = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (long) {
    return {
      r: parseInt(long[1], 16),
      g: parseInt(long[2], 16),
      b: parseInt(long[3], 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}
function toHex(c: RGB): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const h = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}
function lighten(hex: string, pct: number) {
  const c = parseHex(hex);
  const f = pct / 100;
  return toHex({
    r: c.r + (255 - c.r) * f,
    g: c.g + (255 - c.g) * f,
    b: c.b + (255 - c.b) * f,
  });
}
function darken(hex: string, pct: number) {
  const c = parseHex(hex);
  const f = 1 - pct / 100;
  return toHex({ r: c.r * f, g: c.g * f, b: c.b * f });
}
function srgbToLin(c: number) {
  const v = Math.max(0, Math.min(255, c)) / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function luminance(hex: string) {
  const { r, g, b } = parseHex(hex);
  const R = srgbToLin(r),
    G = srgbToLin(g),
    B = srgbToLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrastRatio(a: string, b: string) {
  const L1 = luminance(a),
    L2 = luminance(b);
  const hi = Math.max(L1, L2),
    lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
/** Ajusta a cor do tile se estiver muito parecida com a superfície. */
function adjustColorForSurface(tileHex: string, surfaceHex: string, min = 2.0) {
  let out = tileHex || "#666666";
  let tries = 0;

  if (contrastRatio(out, surfaceHex) >= min) return out;

  const tileIsDarker = luminance(out) < luminance(surfaceHex);
  while (contrastRatio(out, surfaceHex) < min && tries++ < 10) {
    out = tileIsDarker ? lighten(out, 6) : darken(out, 6);
  }
  return out;
}
/** Escolhe cor clara/escura de texto para legibilidade. */
function readableTextColor(
  bgHex: string,
  light = "#FFFFFF",
  dark = "#0B0F14",
) {
  const cLight = contrastRatio(light, bgHex);
  const cDark = contrastRatio(dark, bgHex);
  return cLight >= cDark ? light : dark;
}
