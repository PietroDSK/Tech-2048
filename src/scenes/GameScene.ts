// src/scenes/GameScene.ts
import Phaser from "phaser";
import { getSettings, setUnlocked2048 } from "../storage";
import { getTheme, getTileColor } from "../theme/index";
// Animações antigas removidas/otimizadas: tweenTo, mergePulse, zoomPunch, shakeOnMerge, flashWin, scoreFly, burstAt
import { ensureParticles } from "../animations/particles";
import { TileTrail } from "../animations/trail";
import { MenuIcon } from "../ui/MenuIcon";
import { swapTo } from "../animations/transitions";
import { getGlobalMusic } from "../audio/MusicSingleton";
import { hideBanner, showBannerBottom } from "../native-ads";
import {
  prepareInterstitial,
  showInterstitialIfReady,
  prepareRewarded,
  showRewardedIfReady,
  onReward,
} from "../ads/ads";
import { t } from "../i18n";

// >>> Impact Kit
import {
  juicyImpact,
  floatLabel,
  slowMo,
  ringPulse,
  popPunch,
  cameraKick,
  confettiBurst,
} from "../juice/effects";

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
// Botões circulares (Undo / Rewarded)
class CircleIconButton extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Arc;
  private iconTxt?: Phaser.GameObjects.Text;
  private iconImg?: Phaser.GameObjects.Sprite;
  private badge?: Phaser.GameObjects.Text;
  private hitZone!: Phaser.GameObjects.Zone;
  private radius: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    label: string,
    colors: { fill: string; stroke: string; text: string; glow: string },
    onClick: () => void,
    withBadge = false,
    sprite?: { key: string; offsetX?: number; offsetY?: number }, // tiramos 'anim' daqui
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

    if (sprite && scene.textures.exists(sprite.key)) {
      this.iconImg = scene.add
        .sprite(0, 0, sprite.key, 0)
        .setOrigin(0.5)
        .setDepth(2);

      // encaixa confortavelmente no círculo (com margem)
      const desired = radius * 2 * 0.86;
      this.iconImg.setDisplaySize(desired, desired);

      if (sprite.offsetX) this.iconImg.x += sprite.offsetX;
      if (sprite.offsetY) this.iconImg.y += sprite.offsetY;
    } else {
      this.iconTxt = scene.add
        .text(0, 0, label, {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: `${Math.round(radius * 0.95)}px`,
          color: colors.text,
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(2);
    }

    this.add([shadow, this.bg]);
    if (this.iconImg) this.add(this.iconImg);
    if (this.iconTxt) this.add(this.iconTxt);

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

    this.setDepth(2000);
  }

  setBadge(text: string) {
    this.badge?.setText(text);
  }

  // TOCAR ANIMAÇÃO 1x A CADA N MILISSEGUNDOS
  armIdleAnimation(animKey: string, intervalMs = 3000) {
    if (!this.iconImg) return;
    this.iconImg.setFrame(0);
    this.scene.time.addEvent({
      delay: intervalMs,
      loop: true,
      callback: () => {
        // toca 1x (repeat:0 definido no ensureUiAnims)
        this.iconImg!.play(animKey, true);
      },
    });
  }
}
// -----------------------------------------------------------------------------
// Cena
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
  private music: any; // mantido flexível para evitar erro de tipo quando MusicManager não é importado
  private audioCtx: AudioContext | null = null;
  private score = 0;
  private best = 0;
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

  preload() {
    // ...seu preload (se houver)
    this.load.spritesheet("icoUndo", "assets/ui/undo_spin_spritesheet.png", {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet(
      "icoReward",
      "assets/ui/reward_pulse_spritesheet.png",
      {
        frameWidth: 256,
        frameHeight: 256,
      },
    );
  }

  create(data: GameModeData) {
    this.theme = getTheme();
    this.input.setTopOnly(true);
    this.mode = (data?.mode ?? "classic") as GameMode;
    this.cfg = configFromMode(data);
    this.rows = this.cfg.rows;
    this.cols = this.cfg.cols;

    ensureParticles(this); // garante textura 'spark' para confettiBurst
    this.registry.set("score", 0);

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
          // PEGA A MESMA INSTÂNCIA SEMPRE
          this.music = getGlobalMusic(this);
          // reanexa a cena (seu MusicManager agora tem attach())
          (this.music as any).attach?.(this);

          // inicia só na primeira vez
          if (!(this.music as any).isStarted?.()) {
            this.music.init?.();
          }
          this.music.updateByScore?.(this.score);
        }

        this.input.off("pointerdown", bootAudio as any);
        this.input.keyboard?.off("keydown", bootAudio as any);
      } catch (e) {
        console.warn("[GameScene] Falha ao desbloquear áudio:", e);
      }
    };

    // Chame o boot no primeiro input (iOS/web)
    this.input.once("pointerdown", bootAudio);
    this.input.keyboard?.once("keydown", bootAudio);
  }

  private ensureUiAnims() {
    // Smoothing nos ícones mesmo que o jogo use pixelArt:true
    const Filter = Phaser.Textures.FilterMode;
    this.textures.get("icoUndo")?.setFilter?.(Filter.LINEAR);
    this.textures.get("icoReward")?.setFilter?.(Filter.LINEAR);

    // Animações tocam 1x (repeat:0); o loop a cada 3s vamos agendar por timer
    if (!this.anims.exists("ui-undo-spin")) {
      this.anims.create({
        key: "ui-undo-spin",
        frames: this.anims.generateFrameNumbers("icoUndo", {
          start: 0,
          end: 7,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }
    if (!this.anims.exists("ui-reward-pulse")) {
      this.anims.create({
        key: "ui-reward-pulse",
        frames: this.anims.generateFrameNumbers("icoReward", {
          start: 0,
          end: 7,
        }),
        frameRate: 10,
        yoyo: true,
        repeat: 0,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Header (título à esquerda, botões circulares à direita)
  private paintHeaderHud() {
    this.ensureUiAnims();
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

    const sub = this.add
      .text(
        this.sideMargin + 10,
        headerY + 22,
        `${this.mode.toUpperCase()} • ${this.rows}x${this.cols} • ${t(
          "goal",
        )}: ${this.cfg.endless ? "∞" : this.cfg.target}`,
        {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "13px",
          color: c.textDim,
        },
      )
      .setOrigin(0, 0.5)
      .setAlpha(0.95);

    // Botões circulares à direita
    const right = width - this.sideMargin - 8;
    const radius = 18;

    this.undoBtn = new CircleIconButton(
      this,
      right - radius,
      headerY,
      radius,
      "↩",
      { fill: c.surfaceAlt, stroke: c.primary, text: c.text, glow: c.primary },
      () => this.tryUndo(),
      true,
      { key: "icoUndo" },
    );
    this.undoBtn.armIdleAnimation("ui-undo-spin", 3000); // <- roda a cada 3s

    this.rewardBtn = new CircleIconButton(
      this,
      right - radius,
      headerY - (radius * 2 + 10),
      radius * 0.9,
      "🎁",
      {
        fill: c.surfaceAlt,
        stroke: c.gridHighlight,
        text: c.text,
        glow: c.primary,
      },
      async () => {
        const shown = await showRewardedIfReady();
        if (!shown) {
          await prepareRewarded();
          this.feedbackToast(t("ad_loading_try_again"));
        }
      },
      false,
      { key: "icoReward" },
    );
    this.rewardBtn.armIdleAnimation("ui-reward-pulse", 3000);

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
  private cellLocalXY(r: number, c: number) {
    const x = this.gap + c * (this.cellSize + this.gap);
    const y = this.gap + r * (this.cellSize + this.gap);
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

    // Apenas um fio externo suave (sem inner border)
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
  // Tiles (com sombra)
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
    const tc = this.theme.colors;
    const { x, y } = this.cellXY(r, c);
    const cont = this.add.container(x, y).setDepth(1);
    cont.setScale(1); // <- antes era 0.6

    const fillHex = Phaser.Display.Color.HexStringToColor(
      getTileColor(value),
    ).color;

    // sombra (drop) do tile
    const shadow = this.add.graphics();
    shadow
      .fillStyle(0x000000, 0.35)
      .fillRoundedRect(
        this.cellSize * 0.06,
        this.cellSize * 0.1,
        this.cellSize * 0.9,
        this.cellSize * 0.9,
        12,
      )
      .setScale(1.02, 1.05)
      .setAlpha(0.35)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    // corpo do tile
    const body = this.add.graphics();
    body
      .fillStyle(fillHex, 1)
      .fillRoundedRect(0, 0, this.cellSize, this.cellSize, 12)
      .lineStyle(2, Phaser.Display.Color.HexStringToColor(tc.primary).color, 1)
      .strokeRoundedRect(0, 0, this.cellSize, this.cellSize, 12);

    const txt = this.add
      .text(this.cellSize / 2, this.cellSize / 2, String(value), {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: `${Math.floor(this.cellSize * 0.38)}px`,
        color: value <= 4 ? tc.text : tc.bg,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    txt.setShadow(0, 0, tc.glow, 10, true, true);

    cont.add([shadow, body, txt]);
    cont.setData("body", body);
    cont.setData("txt", txt);

    this.tiles.set(id, cont);

    if (pop) {
      // 1) tween de spawn até scale 1.0
      cont.setScale(0.2);
      this.tweens.add({
        targets: cont,
        scaleX: 1.05,
        scaleY: 0.95,
        duration: 110,
        ease: "back.out(2.4)",
        onComplete: () => {
          this.tweens.add({
            targets: cont,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 80,
            ease: "sine.out",
          });
        },
      });

      // 2) efeitos visuais (anel) já no spawn
      ringPulse(
        this,
        x + this.cellSize / 2,
        y + this.cellSize / 2,
        0xffffff,
        14,
        180,
      );

      // 3) pequeno punch DEPOIS do spawn (evita yoyo voltar para 0.2)
      this.time.delayedCall(200, () => {
        // popPunch agora aceita delay/yoyo por opts, mas aqui mantemos padrão
        popPunch(this, cont, 0.06, 110);
      });
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
      ops.push({ type: "move", id: idAtTo as number, from, to });
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
      // toque sutil quando bate na parede
      cameraKick(this, 90, 0.004);
      this.cameras.main.shake(120, 0.004);
      this.playBumpSfx();
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

  // Animações com path/curva leve e squash
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

      // Moves com duração proporcional à distância
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
            const dur = Phaser.Math.Clamp(60 + dist * 0.5, 90, 170);

            // squash ao iniciar e ao parar
            this.tweens.add({
              targets: cont,
              scaleX: 0.96,
              scaleY: 1.04,
              duration: 70,
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
                  targets: cont,
                  scaleX: 1.0,
                  scaleY: 1.0,
                  duration: 70,
                  ease: "sine.out",
                });
              },
            });
            tweens.push(tw);
          }

      // Merges – curva de atração + Impact Kit
      for (const g of allOps)
        for (const op of g.ops)
          if (op.type === "merge") {
            const to = idxToRC(g.axis, g.index, op.to, g.reverse);
            const A = this.tiles.get(op.survivorId);
            const B = this.tiles.get(op.consumedId);
            if (!A || !B) continue;

            const { x: tx, y: ty } = rcToXY(to.r, to.c);
            const cx = tx + this.cellSize / 2,
              cy = ty + this.cellSize / 2;

            // curva curta (meio deslocado) para dar sensação de "ímã"
            const midX = (A.x + tx) / 2 + (Math.random() * 8 - 4);
            const midY = (A.y + ty) / 2 + (Math.random() * 8 - 4);

            const applyMerge = () => {
              const body = A.getData("body") as
                | Phaser.GameObjects.Graphics
                | undefined;
              const txt = A.getData("txt") as
                | Phaser.GameObjects.Text
                | undefined;
              const color = Phaser.Display.Color.HexStringToColor(
                getTileColor(op.newValue),
              ).color;

              if (body) {
                body.clear();
                body
                  .fillStyle(color, 1)
                  .fillRoundedRect(0, 0, this.cellSize, this.cellSize, 12);
                body.lineStyle(
                  2,
                  Phaser.Display.Color.HexStringToColor(
                    this.theme.colors.primary,
                  ).color,
                  1,
                );
                body.strokeRoundedRect(0, 0, this.cellSize, this.cellSize, 12);
              }
              if (txt) {
                txt.setText(String(op.newValue));
                txt.setColor(
                  op.newValue <= 4
                    ? this.theme.colors.text
                    : this.theme.colors.bg,
                );
              }

              // Impact Kit (combo): punch + ring + camera + confetti
              juicyImpact(this, cx, cy, A);
              floatLabel(this, cx, cy - 12, `+${op.newValue}`, "#ffe066");

              // Efeito extra em merges grandes
              if (op.newValue >= 1024) {
                slowMo(this, 0.85, 120);
                confettiBurst(this, cx, cy, "spark");
              }

              this.onMerge(op.newValue);
              this.playMergeSfx(op.newValue);
            };

            // A vai direto; B faz curva e some
            const dur = 120;
            this.tweens.add({
              targets: A,
              x: tx,
              y: ty,
              duration: dur,
              ease: "quart.out",
            });

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
                (
                  this.data.get("tileTrail") as TileTrail | undefined
                )?.addSnapshot(B);
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
    this.tweens.add({
      targets: toast,
      alpha: 1,
      yoyo: true,
      hold: 900,
      duration: 160,
      onComplete: () => toast.destroy(),
    });
  }

  // Substitui a antiga
  private playMergeSfx(value: number) {
    if (!this.settings.sound) return;
    try {
      if (!this.audioCtx)
        this.audioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      const ctx = this.audioCtx!;
      const now = ctx.currentTime;

      // Pitch escala por valor (mantém tua lógica)
      const step = Math.max(0, Math.log2(value) - 1); // 2->0, 4->1, 8->2...
      const base = 220;
      const freq = base * Math.pow(1.12246, step); // ~semitom

      // Camada 1: beep “musical”
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      const g = ctx.createGain();
      const A = 0.005,
        D = 0.12;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + A);
      g.gain.exponentialRampToValueAtTime(0.0001, now + A + D);
      osc.connect(g).connect(ctx.destination);

      // Camada 2: “pop” curto (ruído filtrado) para dar ataque
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

      // Dispara
      osc.start(now);
      noise.start(now);
      osc.stop(now + A + D + 0.02);
      noise.stop(now + 0.08);
    } catch {}
  }

  // NOVO: som de “batida” quando não há movimento no swipe
  private playBumpSfx() {
    if (!this.settings.sound) return;
    try {
      if (!this.audioCtx)
        this.audioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      const ctx = this.audioCtx!;
      const now = ctx.currentTime;

      // Dois sines graves para “thud”
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

      // “tick” curtíssimo (ruído low-pass) pra dar definição
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

    const btnTry = this.add
      .text(
        width / 2,
        height / 2 + 34,
        win ? t("continue_endless") : t("retry"),
        {
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "18px",
          color: c.bg,
          backgroundColor: c.primary,
          padding: { x: 16, y: 10 },
        },
      )
      .setOrigin(0.5)
      .setDepth(1002)
      .setInteractive({ useHandCursor: true });
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
  shutdown() {
    hideBanner().catch(() => {});
  }
  destroy() {}
}
