import Phaser from "phaser";
import { PANEL_CONNECTIONS, PANEL_NODES } from "./panelLayout";
import { lowGfxMode, getUIScale, isMobile } from "../util/mobile";

export class CircuitBoard extends Phaser.GameObjects.Container {
  private rt!: Phaser.GameObjects.RenderTexture;
  private traces!: Phaser.GameObjects.Graphics;
  private signals: Phaser.GameObjects.Arc[] = [];
  private zoom = 1;
  private baseScale = 1;
  private dragging = false;
  private lastX = 0; private lastY = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    const { width, height } = scene.scale;

    // PRE-RENDER GRID EM RT (leve)
    this.rt = scene.add.renderTexture(0, 0, width, height).setOrigin(0,0).setDepth(-2);
    this.add(this.rt);
    this.drawGridRT(width, height);

    // TRILHAS
    this.traces = scene.add.graphics().setDepth(-1);
    this.traces.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.traces);
    this.redrawTraces();

    // SINAIS (menos no modo leve)
    if (!lowGfxMode()) this.loopSignals();

    // Zoom inicial
    const ui = getUIScale(750);
    this.baseScale = Phaser.Math.Clamp(ui * 1.05, 0.9, 1.15);
    this.setScale(this.baseScale);

    // Pan/zoom simples (drag + double tap)
    this.setSize(width, height);
    this.setInteractive(new Phaser.Geom.Rectangle(0,0,width,height), Phaser.Geom.Rectangle.Contains);
    this.on("pointerdown", (p: Phaser.Input.Pointer) => { this.dragging = true; this.lastX = p.x; this.lastY = p.y; });
    this.on("pointerup", ()=> this.dragging = false);
    this.on("pointerout", ()=> this.dragging = false);
    this.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.x += (p.x - this.lastX);
      this.y += (p.y - this.lastY);
      this.lastX = p.x; this.lastY = p.y;
    });
    this.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (p.getDuration() < 220 && p.getDistance() < 6) {
        // double tap check
        const now = performance.now() as number;
        const last = (this as any)._lastTap || 0;
        (this as any)._lastTap = now;
        if (now - last < 260) this.toggleZoom(p.x, p.y);
      }
    });
  }

  private toggleZoom(cx: number, cy: number) {
    const target = this.zoom > 1 ? 1 : 1.25;
    const start = this.zoom;
    const dx = (cx - this.x) * (1 - target/start);
    const dy = (cy - this.y) * (1 - target/start);
    this.scene.tweens.add({
      targets: this,
      zoom: target,
      duration: 180,
      ease: "sine.out",
      onUpdate: () => {
        const t = (this.zoom - start)/(target - start || 1);
        this.setScale(this.baseScale * (start + (target - start)*t));
        this.x -= dx * 0.05; this.y -= dy * 0.05;
      }
    });
    this.zoom = target;
  }

  private drawGridRT(w: number, h: number) {
    const g = this.scene.add.graphics();
    const step = w < 480 ? 20 : 16; // menos denso no cel
    g.fillStyle(0x0a1322, 1).fillRect(0,0,w,h);
    g.lineStyle(1, 0x103050, 0.45);
    for (let x=0; x<w; x+=step) g.lineBetween(x, 0, x, h);
    for (let y=0; y<h; y+=step) g.lineBetween(0, y, w, y);
    g.fillStyle(0x1c385e, 0.55);
    for (let y=0; y<h; y+=step*2)
      for (let x=((y/step)%2===0? step : step*2); x<w; x+=step*2)
        g.fillCircle(x, y, 1.1);

    this.rt.draw(g, 0, 0);
    g.destroy();
  }

  private redrawTraces() {
    const { width, height } = this.scene.scale;
    const getPt = (k: string) => {
      const n = PANEL_NODES.find(n => n.key === k)!;
      return new Phaser.Math.Vector2(n.x*width, n.y*height);
    };

    this.traces.clear();
    const lw = (isMobile()? 2 : 3);
    this.traces.lineStyle(lw, 0x2a90b8, 0.55);
    for (const [a, b, mode] of PANEL_CONNECTIONS) {
      const A = getPt(a), B = getPt(b);
      const mid = mode === "hv" ? new Phaser.Math.Vector2(B.x, A.y) : new Phaser.Math.Vector2(A.x, B.y);
      this.traces.strokePoints([A, mid, B], false);
      this.traces.fillStyle(0x2a90b8, 0.55).fillCircle(mid.x, mid.y, lw+0.5);
    }
  }

  private loopSignals() {
    const { width, height } = this.scene.scale;
    const pick = () => Phaser.Math.RND.pick(PANEL_CONNECTIONS);
    const pt = (k: string) => {
      const n = PANEL_NODES.find(n => n.key===k)!;
      return new Phaser.Math.Vector2(n.x*width, n.y*height);
    };

    for (let i=0;i<4;i++) {
      const s = this.scene.add.circle(0,0, 3, 0x59c8ff, 1).setBlendMode(Phaser.BlendModes.ADD);
      this.add(s); this.signals.push(s);

      const travel = () => {
        const [a,b,mode] = pick();
        const A = pt(a), B = pt(b);
        const mid = mode==="hv" ? new Phaser.Math.Vector2(B.x, A.y) : new Phaser.Math.Vector2(A.x, B.y);
        const path = [A, mid, B];
        s.setPosition(path[0].x, path[0].y);
        const dur = 1000 + Math.random()*800;
        let idx = 0;
        const stepTo = () => {
          const P = path[idx], Q = path[idx+1];
          if (!Q) { this.scene.time.delayedCall(200, travel); return; }
          this.scene.tweens.add({
            targets: s, x: Q.x, y: Q.y, duration: dur/2, ease: "sine.inOut",
            onComplete: () => { idx++; stepTo(); }
          });
        };
        stepTo();
      };
      this.scene.time.delayedCall(i*200, travel);
    }
  }
}
