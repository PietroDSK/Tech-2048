// src/juice/effects.ts

import Phaser from "phaser";

type AnyGO = Phaser.GameObjects.GameObject & {
  x?: number;
  y?: number;
  scale?: number;
  preFX?: any;
  postFX?: any;
};

/** Anel que expande e desaparece */
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

/** Mini “punch” elástico no alvo */
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

  // Glow opcional (quando suportado)
  try {
    const fx = (target as any).postFX?.addGlow?.(0x9be1ff, 2, 0, false, 0.5, 6);
    if (fx) scene.time.delayedCall((opts?.delay ?? 0) + duration + 80, () => fx.destroy());
  } catch {}

  return tw;
}

/** Chacoalhada rápida de câmera */
export function cameraKick(scene: Phaser.Scene, duration = 90, intensity = 0.004) {
  try { scene.cameras.main.shake(duration, intensity); } catch {}
}

/** Label flutuante (ex.: +256) */
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

/** Breve “bullet-time” global */
export function slowMo(scene: Phaser.Scene, factor = 0.5, ms = 250) {
  const t = scene.time;
  const prev = t.timeScale ?? 1;
  t.timeScale = factor;
  scene.time.delayedCall(ms, () => { t.timeScale = prev; });
}

/** Confete sem ParticleEmitter (Phaser 3/4 safe) */
export function confettiBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey = "spark",
  count = 28
) {
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
      y: y + dy + Phaser.Math.Between(160, 260),
      rotation: Phaser.Math.FloatBetween(-1.5, 1.5),
      alpha: { from: 1, to: 0 },
      scale: { from: spr.scale, to: 0 },
      ease: "Cubic.Out",
      duration: dur,
      onComplete: () => spr.destroy(),
    });
  }
}

/** Impacto “genérico” (compat) */
export function juicyImpact(scene: Phaser.Scene, x: number, y: number, target?: AnyGO) {
  if (target) popPunch(scene, target, 0.10, 120, { yoyo: true });
  ringPulse(scene, x, y, 0x9be1ff, 16, 180);
  confettiBurst(scene, x, y, "spark", 16);
  cameraKick(scene, 90, 0.0035);
}

/** Impacto que escala com o valor do merge (sempre toca/animam) */
export function impactByValue(
  scene: Phaser.Scene,
  x: number,
  y: number,
  target: AnyGO | undefined,
  value: number,
  opts?: { color?: number }
) {
  const lv = Math.max(1, Math.log2(Math.max(2, value))); // 2->1, 4->2, ...
  const color = opts?.color ?? 0x9be1ff;

  // Punch sempre (amplitude suave por nível)
  const amt = Phaser.Math.Clamp(0.06 + lv * 0.005, 0.06, 0.13);
  if (target) popPunch(scene, target, amt, 120, { yoyo: true });

  // Anel sempre (raio cresce levemente por nível)
  const radius = Phaser.Math.Clamp(12 + lv * 1.6, 12, 26);
  ringPulse(scene, x, y, color, radius, 170);

  // Confete a partir de 32
  if (value >= 32) {
    const count = value >= 256 ? 22 : 12;
    confettiBurst(scene, x, y, "spark", count);
  }

  // Micro shake a partir de 512
  if (value >= 512) cameraKick(scene, 90, 0.0035);
}
