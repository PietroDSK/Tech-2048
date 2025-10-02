// src/animations/transitions.ts
import Phaser from "phaser";

export type SwapDir = "left" | "right" | "up" | "down";

function offsetBy(dir: SwapDir, progress: number, w: number, h: number) {
  switch (dir) {
    case "left":  return { outX: -progress * w, outY: 0, inX: (1 - progress) * w - w, inY: 0 };
    case "right": return { outX:  progress * w, outY: 0, inX: w - (progress * w),    inY: 0 - 0 };
    case "up":    return { outX: 0, outY: -progress * h, inX: 0, inY: (1 - progress) * h - h };
    case "down":  return { outX: 0, outY:  progress * h, inX: 0, inY: h - (progress * h) };
  }
}

/**
 * Faz swap (slide) entre a cena atual e a `targetKey`.
 * Duração curta e responsiva; bloqueia input até finalizar.
 */
export function swapTo(
  scene: Phaser.Scene,
  targetKey: string,
  data?: any,
  dir: SwapDir = "right",
  duration = 320
) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  scene.input.enabled = false;

  scene.scene.transition({
    target: targetKey,
    duration,
    moveAbove: true, // garante que a cena alvo aparece por cima
    sleep: false,
    data: { ...data, __swapFrom: opposite(dir) },
    onUpdate: function (progress: number) {
      const { outX, outY, inX, inY } = offsetBy(dir, progress, w, h);
      // desloca a câmera atual (OUT)
      scene.cameras.main.setScroll(outX, outY);

      // desloca a câmera da cena alvo (IN)
      const target = scene.scene.get(targetKey) as Phaser.Scene | undefined;
      if (target?.cameras?.main) {
        target.cameras.main.setScroll(inX, inY);
      }
    },
    onUpdateScope: scene,
    onComplete: () => {
      // reseta scroll e reabilita input na cena alvo
      const target = scene.scene.get(targetKey) as Phaser.Scene | undefined;
      if (target?.cameras?.main) target.cameras.main.setScroll(0, 0);
      target?.input && (target.input.enabled = true);

      // limpa scroll da cena antiga também (se reaparecer no futuro)
      scene.cameras.main.setScroll(0, 0);
    }
  });
}

export function opposite(dir: SwapDir): SwapDir {
  return dir === "left" ? "right"
    : dir === "right" ? "left"
    : dir === "up" ? "down"
    : "up";
}

/** Cena chamou `create` e quer entrar com swap (caso foi iniciada via swapTo). */
export function enterWithSwap(scene: Phaser.Scene, data: any) {
  const dir = (data && data.__swapFrom) as SwapDir | undefined;
  if (!dir) return;
  const w = scene.scale.width;
  const h = scene.scale.height;
  const start =
    dir === "left"  ? { x: -w, y: 0 } :
    dir === "right" ? { x:  w, y: 0 } :
    dir === "up"    ? { x: 0, y: -h } :
                      { x: 0, y:  h };
  scene.cameras.main.setScroll(start.x, start.y);

  scene.tweens.add({
    targets: scene.cameras.main,
    scrollX: 0,
    scrollY: 0,
    duration: 320,
    ease: "Cubic.Out"
  });
}
