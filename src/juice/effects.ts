// src/juice/effects.ts
import Phaser from "phaser";

type AnyGO = Phaser.GameObjects.GameObject & {
  x?: number;
  y?: number;
  scale?: number;
  preFX?: any;
  postFX?: any;
};

/** Anel que expande e desaparece (compatível com Phaser 3 e 4) */
export function ringPulse(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color = 0xffffff,
  radius = 16,
  duration = 200
) {
  const g = scene.add.graphics({ x, y });
  g.lineStyle(3, color, 0.9);
  g.strokeCircle(0, 0, 1);

  scene.tweens.add({
    targets: g,
    alpha: { from: 0.9, to: 0 },
    scale: { from: 1, to: radius },
    duration,
    ease: "Cubic.Out",
    onComplete: () => g.destroy(),
  });
}

/** Mini “punch” elástico no alvo. */
export function popPunch(
  scene: Phaser.Scene,
  target: AnyGO,
  amt = 0.12,
  duration = 110,
  opts?: { yoyo?: boolean; delay?: number }
) {
  if (!target) return;
  const baseScale = (target as any).scale || 1;

  const tw = scene.tweens.add({
    targets: target,
    scale: { from: baseScale * (1 - amt), to: baseScale * (1 + amt) },
    yoyo: opts?.yoyo ?? true,
    duration,
    delay: opts?.delay ?? 0,
    ease: "Back.Out",
  });

  // Glow opcional (se o runtime tiver FX). Ignora em Canvas/sem suporte.
  try {
    const fx = (target as any).postFX?.addGlow?.(0xffff99, 2, 0, false, 0.5, 6);
    if (fx) {
      scene.time.delayedCall((opts?.delay ?? 0) + duration + 80, () => fx.destroy());
    }
  } catch {}

  return tw;
}

/** Chacoalhada rápida de câmera (micro impacto). */
export function cameraKick(
  scene: Phaser.Scene,
  duration = 90,
  intensity = 0.004
) {
  try {
    scene.cameras.main.shake(duration, intensity);
  } catch {
    // Em casos raros sem main camera configurada, ignore silenciosamente
  }
}

/** Label flutuando que sobe e some (ex.: +256). */
export function floatLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color = "#fff"
) {
  const label = scene.add
    .text(x, y, text, {
      fontFamily: "Inter, Arial, Helvetica, sans-serif",
      fontSize: "22px",
      color,
      stroke: "#000",
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  scene.tweens.add({
    targets: label,
    y: y - 36,
    alpha: { from: 1, to: 0 },
    duration: 700,
    ease: "Quad.Out",
    onComplete: () => label.destroy(),
  });
}

/** Breve “bullet-time” global via timeScale. */
export function slowMo(scene: Phaser.Scene, factor = 0.5, ms = 250) {
  const t = scene.time;
  const prev = t.timeScale ?? 1;
  t.timeScale = factor;
  scene.time.delayedCall(ms, () => {
    t.timeScale = prev;
  });
}

/** Confete sem usar ParticleEmitter (funciona no Phaser 3 e 4). */
export function confettiBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey = "spark",
  count = 28
) {
  // Fallback: gera textura 4x4 caso não exista
  if (!scene.textures.exists(textureKey)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
    g.generateTexture(textureKey, 4, 4);
    g.destroy();
  }

  for (let i = 0; i < count; i++) {
    const spr = scene.add
      .image(x, y, textureKey)
      .setDepth(100)
      .setAlpha(1)
      .setScale(Phaser.Math.FloatBetween(0.6, 1.0))
      .setBlendMode(Phaser.BlendModes.ADD);

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.Between(140, 320);
    const kickUp = Phaser.Math.Between(80, 140);
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed - kickUp;
    const dur = Phaser.Math.Between(500, 800);

    scene.tweens.add({
      targets: spr,
      x: x + dx,
      y: y + dy + Phaser.Math.Between(160, 260), // queda simulada
      rotation: Phaser.Math.FloatBetween(-1.5, 1.5),
      alpha: { from: 1, to: 0 },
      scale: { from: spr.scale, to: 0 },
      ease: "Cubic.Out",
      duration: dur,
      onComplete: () => spr.destroy(),
    });
  }
}

/** Combo pronto para “ações importantes” (ex.: merge). */
export function juicyImpact(
  scene: Phaser.Scene,
  x: number,
  y: number,
  target?: AnyGO
) {
  if (target) popPunch(scene, target, 0.10, 120, { yoyo: true });
  ringPulse(scene, x, y, 0xffe066, 16, 180);
  cameraKick(scene, 90, 0.0035);
  // confete leve; remova se não quiser em todo impacto
  confettiBurst(scene, x, y, "spark", 16);
}
