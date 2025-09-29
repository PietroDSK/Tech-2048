// src/scenes/GameScene.ts
import Phaser from "phaser";
import { getSettings, setUnlocked2048 } from "../storage";
// (Opcional) se você tiver um theme.ts, pode importar e usar.
// import { theme } from "../theme";

type GameMode = "classic" | "4096" | "endless" | "custom";
interface GameModeData { mode: GameMode; rows?: number; cols?: number; }
interface ModeConfig { rows: number; cols: number; target: number; endless: boolean; }
type Dir = "left" | "right" | "up" | "down";

function clampInt(n: number, min: number, max: number) {
  n = Math.floor(Number(n) || 0);
  return Math.max(min, Math.min(max, n));
}

function configFromMode(data?: Partial<GameModeData>): ModeConfig {
  const mode = (data?.mode ?? "classic") as GameMode;
  if (mode === "4096")   return { rows: 4, cols: 4, target: 4096, endless: false };
  if (mode === "endless")return { rows: 4, cols: 4, target: Number.MAX_SAFE_INTEGER, endless: true };
  if (mode === "custom") {
    const rows = clampInt(data?.rows ?? 8, 2, 16);
    const cols = clampInt(data?.cols ?? 8, 2, 16);
    const target = Math.max(rows, cols) >= 10 ? 4096 : 2048;
    return { rows, cols, target, endless: false };
  }
  return { rows: 4, cols: 4, target: 2048, endless: false };
}

// ---- tipos auxiliares para path animation
type Id = number;

interface SlideResult {
  // valores finais e ids finais da linha/coluna após o movimento
  outValues: number[];
  outIds: (Id | 0)[];
  moved: boolean;
  merges: number[]; // valores resultantes de merges nesse lance
  // operações de movimentação individuais para animar
  ops: Array<
    | { type: "move"; id: Id; from: number; to: number } // deslocamento simples na linha/coluna
    | { type: "merge"; survivorId: Id; consumedId: Id; fromA: number; fromB: number; to: number; newValue: number }
  >;
}

export default class GameScene extends Phaser.Scene {
  // config/estado
  private mode!: GameMode;
  private cfg!: ModeConfig;
  private settings = getSettings();
  private reached2048 = false;

  // grid lógico
  private rows!: number;
  private cols!: number;
  private values!: number[][];  // valor por célula (0=vazio)
  private ids!: (Id | 0)[][];   // id por célula (0=sem peça)
  private seqId: number = 1;    // gerador de ids

  // UI/coords
  private boardX!: number;
  private boardY!: number;
  private cellSize!: number;
  private gap = 10;

  // peças renderizadas
  private tiles = new Map<Id, Phaser.GameObjects.Container>();

  // input touch
  private dragStart?: Phaser.Math.Vector2;

  // partículas
  private particleKey = "__mergeParticle";

  constructor() { super("GameScene"); }

  create(data: GameModeData) {
    this.mode = (data?.mode ?? "classic") as GameMode;
    this.cfg  = configFromMode(data);
    this.rows = this.cfg.rows;
    this.cols = this.cfg.cols;

    this.makeParticleTexture();        // textura de partícula para merges
    this.setupLayoutAndGrid();         // calcula layout e cria matrizes
    this.drawBoardBgNeon();            // fundo tech/neon
    this.spawnRandomTile();            // duas iniciais
    this.spawnRandomTile();
    this.registerInputs();
    this.fullRepaint();                // desenha todas as peças
    this.paintHud();
  }

  // ==================== TEMA / HUD ====================
  private paintHud() {
    const { width } = this.scale;
    const title = this.add.text(width / 2, this.boardY - 56, `TECH-2048`, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "24px",
      color: "#66e6ff",
    }).setOrigin(0.5);
    title.setShadow(0, 0, "#00e5ff", 16, true, true);

    const modeTxt = `${this.mode.toUpperCase()}  •  ${this.rows}x${this.cols}  •  META: ${this.cfg.endless ? "∞" : this.cfg.target}`;
    const subtitle = this.add.text(width / 2, this.boardY - 28, modeTxt, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "14px",
      color: "#9ad9ff",
    }).setOrigin(0.5).setAlpha(0.95);
  }

  private makeParticleTexture() {
    if (this.textures.exists(this.particleKey)) return;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture(this.particleKey, 12, 12);
    g.destroy();
  }

  private drawBoardBgNeon() {
    const g = this.add.graphics();
    // painel
    const boardW = this.cellSize * this.cols + this.gap * (this.cols + 1);
    const boardH = this.cellSize * this.rows + this.gap * (this.rows + 1);
    const x = this.boardX, y = this.boardY;

    // glow externo
    const glow = this.add.graphics();
    glow.fillStyle(0x00e5ff, 0.12);
    glow.fillRoundedRect(x - 8, y - 8, boardW + 16, boardH + 16, 22);

    // base
    g.fillStyle(0x141824, 1);
    g.fillRoundedRect(x, y, boardW, boardH, 18);

    // grade com neon sutil
    g.lineStyle(1, 0x006dff, 0.25);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const { x: cx, y: cy } = this.cellXY(r, c);
        g.strokeRoundedRect(cx, cy, this.cellSize, this.cellSize, 10);
      }
    }
    this.cameras.main.setBackgroundColor("#0b0f17");
  }

  // ==================== LAYOUT / GRID ====================
  private setupLayoutAndGrid() {
    const { width, height } = this.scale;
    const maxBoardW = Math.min(width * 0.92, height * 0.8);
    this.cellSize = Math.floor((maxBoardW - this.gap * (this.cols + 1)) / this.cols);
    const boardW = this.cellSize * this.cols + this.gap * (this.cols + 1);
    const boardH = this.cellSize * this.rows + this.gap * (this.rows + 1);
    this.boardX = Math.floor((width - boardW) / 2);
    this.boardY = Math.floor((height - boardH) / 2);

    this.values = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.ids    = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
  }

  private cellXY(r: number, c: number) {
    const x = this.boardX + this.gap + c * (this.cellSize + this.gap);
    const y = this.boardY + this.gap + r * (this.cellSize + this.gap);
    return { x, y };
  }

  // ==================== SPAWN / RENDER ====================
  private spawnRandomTile(): boolean {
    const empty: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) if (this.values[r][c] === 0) empty.push({ r, c });
    }
    if (!empty.length) return false;
    const spot = Phaser.Utils.Array.GetRandom(empty);
    const value = Math.random() < 0.9 ? 2 : 4;
    const id = this.seqId++;
    this.values[spot.r][spot.c] = value;
    this.ids[spot.r][spot.c] = id;
    this.createTile(id, spot.r, spot.c, value, true);
    return true;
  }

  private neonColorFor(value: number): number {
    // paleta neon/tech
    if (value >= 4096) return 0x00ffc3; // aqua neon
    switch (value) {
      case 2: return 0x1f2a44;
      case 4: return 0x21355e;
      case 8: return 0x294d85;
      case 16: return 0x2b5ea1;
      case 32: return 0x2f72bd;
      case 64: return 0x3a8de3;
      case 128: return 0x4fabff;
      case 256: return 0x61d0ff;
      case 512: return 0x74ffe1;
      case 1024: return 0x7affb0;
      case 2048: return 0x9cff6b;
      default: return 0x00c9ff;
    }
  }

  private createTile(id: Id, r: number, c: number, value: number, pop = false) {
    const { x, y } = this.cellXY(r, c);
    const cont = this.add.container(x, y);

    // glow (falso) atrás
    const glow = this.add.rectangle(this.cellSize/2, this.cellSize/2, this.cellSize * 1.1, this.cellSize * 1.1, this.neonColorFor(value), 0.15);
    glow.setOrigin(0.5);

    // corpo
    const rect = this.add.rectangle(0, 0, this.cellSize, this.cellSize, this.neonColorFor(value), 1)
      .setOrigin(0)
      .setStrokeStyle(2, 0x00e5ff)
      .setDepth(1);

    const txt = this.add.text(this.cellSize / 2, this.cellSize / 2, String(value), {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: `${Math.floor(this.cellSize * 0.38)}px`,
      color: value <= 4 ? "#99ccff" : "#0b1220",
      fontStyle: "bold",
    }).setOrigin(0.5);
    txt.setShadow(0, 0, "#00e5ff", 12, true, true);

    cont.add([glow, rect, txt]);
    this.tiles.set(id, cont);

    if (pop && this.settings.animations) {
      cont.setScale(0.1);
      this.tweens.add({ targets: cont, scale: 1, duration: 120, ease: "back.out" });
    }
  }

  private destroyTile(id: Id) {
    const t = this.tiles.get(id);
    if (t) { t.destroy(true); this.tiles.delete(id); }
  }

  private fullRepaint() {
    // remove todos e recria (usado pouco)
    for (const [, t] of this.tiles) t.destroy(true);
    this.tiles.clear();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const v = this.values[r][c];
        const id = this.ids[r][c];
        if (v !== 0 && id !== 0) this.createTile(id, r, c, v);
      }
    }
  }

  // ==================== GAME LOGIC ====================
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

  // slide linha/coluna **com paths/ids**
  private slideWithPaths(vals: number[], ids: (Id | 0)[]): SlideResult {
    const n = vals.length;
    const compactVals: number[] = [];
    const compactIds: Id[] = [];
    const ops: SlideResult["ops"] = [];
    let moved = false;
    const mergesOut: number[] = [];

    // coleta não-zeros na ordem
    for (let i = 0; i < n; i++) if (vals[i] !== 0) { compactVals.push(vals[i]); compactIds.push(ids[i] as Id); }

    // resolve merges
    const outValues: number[] = [];
    const outIds: (Id | 0)[] = [];
    let read = 0, write = 0;

    while (read < compactVals.length) {
      if (read < compactVals.length - 1 && compactVals[read] === compactVals[read + 1]) {
        // merge: survivor = primeiro id, consumed = segundo id
        const newV = compactVals[read] * 2;
        const survivor = compactIds[read];
        const consumed = compactIds[read + 1];
        outValues.push(newV);
        outIds.push(survivor);
        mergesOut.push(newV);

        // posições originais dentro da linha **compactada**; para "from" exato, mapearemos já já
        // criamos op merge (fromA/fromB serão mapeados no chamador)
        ops.push({ type: "merge", survivorId: survivor, consumedId: consumed, fromA: -1, fromB: -1, to: write, newValue: newV });

        read += 2;
        write += 1;
      } else {
        outValues.push(compactVals[read]);
        outIds.push(compactIds[read]);
        read += 1;
        write += 1;
      }
    }

    // completar com zeros
    while (outValues.length < n) { outValues.push(0); outIds.push(0); }

    // detectar movimentos (e mapear de índices originais para destinos)
    // criamos um array de pares (id -> origIndex) da linha original:
    const origPos: Record<number, number> = {};
    for (let i = 0; i < n; i++) if (ids[i] !== 0) origPos[ids[i] as number] = i;

    // para cada célula de saída, descubra qual id foi para ali e gere op move/merge
    const usedTarget: Record<number, boolean> = {};
    for (let to = 0; to < n; to++) {
      const idAtTo = outIds[to];
      if (idAtTo === 0) continue;
      const from = origPos[idAtTo];
      if (from !== to) moved = true;
      // mover (básico) — merges ajustaremos logo abaixo
      ops.push({ type: "move", id: idAtTo, from, to });
      usedTarget[to] = true;
    }

    // agora preenche os "fromA/fromB" dos merges olhando os dois ids envolvidos
    for (const op of ops) {
      if (op.type === "merge") {
        op.fromA = origPos[op.survivorId];
        op.fromB = origPos[op.consumedId];
        // já existe um "move" para o survivor; tudo bem, animaremos os dois até o mesmo "to"
      }
    }

    return { outValues, outIds, moved, merges: mergesOut, ops };
  }

  private async move(dir: Dir) {
    // coletar linhas/colunas conforme direção
    let anyMoved = false;
    const mergesAll: number[] = [];

    // snapshots para reconstruir depois
    const oldValues = this.values.map(r => r.slice());
    const oldIds    = this.ids.map(r => r.slice());

    // vamos acumular todas as ops e animar no fim
    const allOps: Array<{ axis: "row" | "col"; index: number; reverse: boolean; ops: SlideResult["ops"] }> = [];

    if (dir === "left" || dir === "right") {
      for (let r = 0; r < this.rows; r++) {
        let vals = this.values[r].slice();
        let ids  = this.ids[r].slice();
        const reverse = dir === "right";
        if (reverse) { vals = vals.reverse(); ids = ids.reverse(); }

        const res = this.slideWithPaths(vals, ids);
        anyMoved = anyMoved || res.moved;
        mergesAll.push(...res.merges);

        // aplicar resultado de volta (considerando reverse)
        const outV = reverse ? res.outValues.slice().reverse() : res.outValues;
        const outI = reverse ? res.outIds.slice().reverse() : res.outIds;
        this.values[r] = outV;
        this.ids[r]    = outI;

        // guardar ops com info da linha
        const ops = res.ops.map(op => {
          if (op.type === "move") {
            return { ...op };
          } else {
            return { ...op };
          }
        });
        allOps.push({ axis: "row", index: r, reverse, ops });
      }
    } else {
      for (let c = 0; c < this.cols; c++) {
        let vals: number[] = [], ids: (Id | 0)[] = [];
        for (let r = 0; r < this.rows; r++) { vals.push(this.values[r][c]); ids.push(this.ids[r][c]); }
        const reverse = dir === "down";
        if (reverse) { vals = vals.reverse(); ids = ids.reverse(); }

        const res = this.slideWithPaths(vals, ids);
        anyMoved = anyMoved || res.moved;
        mergesAll.push(...res.merges);

        // aplicar
        const outV = reverse ? res.outValues.slice().reverse() : res.outValues;
        const outI = reverse ? res.outIds.slice().reverse() : res.outIds;
        for (let r = 0; r < this.rows; r++) { this.values[r][c] = outV[r]; this.ids[r][c] = outI[r]; }

        allOps.push({ axis: "col", index: c, reverse, ops: res.ops });
      }
    }

    if (!anyMoved) return;

    // ANIMAÇÃO POR TRAJETÓRIA:
    await this.animateOps(allOps, oldValues, oldIds);

    // regras pós-movimento
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
      this.showOverlay("Sem movimentos! Fim de jogo.", false);
    }
  }

  private animateOps(
    allOps: Array<{ axis: "row" | "col"; index: number; reverse: boolean; ops: SlideResult["ops"] }>,
    oldValues: number[][],
    oldIds: (Id | 0)[][]
  ): Promise<void> {
    return new Promise((resolve) => {
      // mapeia pos (r,c) -> pixel (x,y) helper:
      const rcToXY = (r: number, c: number) => this.cellXY(r, c);

      // função para converter índice de linha/coluna "compactada" para (r,c) real
      const idxToRC = (axis: "row" | "col", index: number, idx: number, reverse: boolean): { r: number; c: number } => {
        if (axis === "row") {
          const r = index;
          const c = reverse ? (this.cols - 1 - idx) : idx;
          return { r, c };
        } else {
          const c = index;
          const r = reverse ? (this.rows - 1 - idx) : idx;
          return { r, c };
        }
      };

      // precisamos dos containers antigos (antes de aplicar a nova matriz) -> usamos oldIds/oldValues
      // então construímos um snapshot de (id -> container) posicional, mas nossos containers já estão no mapa por id.

      const tweens: Phaser.Tweens.Tween[] = [];
      const toComplete: Phaser.Tweens.Tween[] = [];

      // Primeiro, animamos todos os "moves"
      for (const group of allOps) {
        for (const op of group.ops) {
          if (op.type === "move") {
            const fromRC = idxToRC(group.axis, group.index, op.from, group.reverse);
            const toRC   = idxToRC(group.axis, group.index, op.to,   group.reverse);

            const cont = this.tiles.get(op.id);
            if (!cont) continue;

            const { x, y } = rcToXY(toRC.r, toRC.c);

            if (this.settings.animations) {
              const tw = this.tweens.add({
                targets: cont,
                x, y,
                duration: 110,
                ease: "quad.out",
              });
              tweens.push(tw);
            } else {
              cont.setPosition(x, y);
            }
          }
        }
      }

      // Depois, merges: animamos os dois até o mesmo destino e, ao completar, destruímos o "consumed" e atualizamos o survivor
      for (const group of allOps) {
        for (const op of group.ops) {
          if (op.type === "merge") {
            const fromARC = idxToRC(group.axis, group.index, op.fromA, group.reverse);
            const fromBRC = idxToRC(group.axis, group.index, op.fromB, group.reverse);
            const toRC    = idxToRC(group.axis, group.index, op.to,    group.reverse);

            const contA = this.tiles.get(op.survivorId);
            const contB = this.tiles.get(op.consumedId);
            if (!contA || !contB) continue;

            const { x: tx, y: ty } = rcToXY(toRC.r, toRC.c);

            const completeOne = () => {
              // quando ambos chegarem, consolidamos
              // (simplificação: consolidar ao final do último tween registrado)
            };

            if (this.settings.animations) {
              const twA = this.tweens.add({ targets: contA, x: tx, y: ty, duration: 110, ease: "quad.out" });
              const twB = this.tweens.add({
                targets: contB, x: tx, y: ty, duration: 110, ease: "quad.out",
                onComplete: () => {
                  // destruir B, atualizar A com o novo valor + efeito
                  contB.destroy(true);
                  this.tiles.delete(op.consumedId);

                  // atualiza visual do survivor
                  const rect = contA.list[1] as Phaser.GameObjects.Rectangle;
                  const txt  = contA.list[2] as Phaser.GameObjects.Text;
                  rect.fillColor = this.neonColorFor(op.newValue);
                  txt.setText(String(op.newValue));
                  txt.setColor(op.newValue <= 4 ? "#99ccff" : "#0b1220");

                  // pop vibrante + partículas
                  this.tweens.add({ targets: contA, scale: 1.15, duration: 80, yoyo: true, ease: "back.out" });

                  const emitter = this.add.particles(0, 0, this.particleKey, {
                    x: { min: tx, max: tx + this.cellSize },
                    y: { min: ty, max: ty + this.cellSize },
                    speed: { min: 40, max: 160 },
                    lifespan: 300,
                    quantity: 8,
                    scale: { start: 1, end: 0 },
                    tint: this.neonColorFor(op.newValue),
                    alpha: { start: 0.9, end: 0 },
                    blendMode: "ADD",
                  });
                  this.time.delayedCall(280, () => emitter.destroy());
                }
              });
              tweens.push(twA, twB);
              toComplete.push(twB);
            } else {
              contA.setPosition(tx, ty);
              contB.destroy(true);
              this.tiles.delete(op.consumedId);
              const rect = contA.list[1] as Phaser.GameObjects.Rectangle;
              const txt  = contA.list[2] as Phaser.GameObjects.Text;
              rect.fillColor = this.neonColorFor(op.newValue);
              txt.setText(String(op.newValue));
              txt.setColor(op.newValue <= 4 ? "#99ccff" : "#0b1220");
            }
          }
        }
      }

      if (!this.settings.animations || tweens.length === 0) {
        // sem animação: apenas repintar garante estado
        this.fullRepaint();
        resolve();
        return;
      }

      // aguardar o último tween terminar
      const last = toComplete.length ? toComplete[toComplete.length - 1] : tweens[tweens.length - 1];
      last.setCallback("onComplete", () => {
        // repintar para garantir sincronismo com a matriz final
        this.fullRepaint();
        resolve();
      });
    });
  }

  // ==================== UI OVERLAYS ====================
  private showOverlay(text: string, win: boolean) {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    const box = this.add.rectangle(width / 2, height / 2, width * 0.82, 240, 0x101726, 1)
      .setStrokeStyle(2, 0x00e5ff);

    const msg = this.add.text(width / 2, height / 2 - 42, text, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "22px",
      color: "#c8eaff",
      align: "center",
      wordWrap: { width: width * 0.7 },
    }).setOrigin(0.5);

    const btnTxt = win ? "Continuar (Endless)" : "Tentar de novo";
    const btn = this.add.text(width / 2, height / 2 + 40, btnTxt, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "20px",
      color: "#00121e",
      backgroundColor: "#66e6ff",
      padding: { left: 24, right: 24, top: 12, bottom: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => {
      bg.destroy(); box.destroy(); msg.destroy(); btn.destroy();
      if (win) {
        this.cfg.endless = true; // continua a mesma partida
      } else {
        this.scene.restart({ mode: this.mode, rows: this.rows, cols: this.cols });
      }
    });
  }

  // ==================== INPUT ====================
  private registerInputs() {
    // teclado
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") this.move("left");
      else if (k === "arrowright" || k === "d") this.move("right");
      else if (k === "arrowup" || k === "w") this.move("up");
      else if (k === "arrowdown" || k === "s") this.move("down");
    });

    // swipe
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      this.dragStart = new Phaser.Math.Vector2(p.x, p.y);
    });
    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      if (!this.dragStart) return;
      const end = new Phaser.Math.Vector2(p.x, p.y);
      const delta = end.clone().subtract(this.dragStart);
      this.dragStart = undefined;

      const TH = 22;
      if (delta.length() < TH) return;

      if (Math.abs(delta.x) > Math.abs(delta.y)) this.move(delta.x > 0 ? "right" : "left");
      else this.move(delta.y > 0 ? "down" : "up");
    });
  }
}
