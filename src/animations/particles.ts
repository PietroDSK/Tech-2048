// src/animations/particles.ts
import Phaser from "phaser";

type BurstEmitter = any; // compat: diferentes builds/d.ts variam bastante

function ensurePixelTexture(scene: Phaser.Scene, key = "__mergeParticle") {
  if (!scene.textures.exists(key)) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture(key, 12, 12);
    g.destroy();
  }
}

/**
 * Garante um único emitter reutilizável (on:false) chamado 'em_merge'.
 * Em algumas builds de Phaser, scene.add.particles(...) já retorna um Emitter.
 * Em outras, retorna um Manager com um emitter “default”.
 * Este helper abstrai isso e te devolve algo que tem `.explode(...)`.
 */
export function ensureParticles(scene: Phaser.Scene): BurstEmitter {
  ensurePixelTexture(scene);
  const name = "em_merge";

  // se já existe, retorna
  const existing = scene.children.getByName(name) as BurstEmitter | null;
  if (existing) return existing;

  // cria um emitter único, pausado (on:false), com config padrão
  // NÃO usamos createEmitter em nenhuma hipótese.
  const em = (scene.add as any).particles(0, 0, "__mergeParticle", {
    on: false,                 // emitimos apenas via explode()
    quantity: 0,               // padrão
    speed: { min: 80, max: 180 },
    lifespan: { min: 200, max: 400 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 250,
    blendMode: "ADD"
  }) as BurstEmitter;

  em.setName?.(name);
  return em;
}

/**
 * Dispara uma “explosão” de partículas em (x,y).
 * `tint` é opcional; se fornecido, tenta aplicar no emitter.
 */
export function burstAt(scene: Phaser.Scene, x: number, y: number, quantity = 10, tint?: number) {
  const em = ensureParticles(scene);
  em.setPosition?.(x, y);

  // compat: algumas builds expõem setTint, outras `setTintFill` ou aceitam tint em config
  if (typeof tint === "number") {
    if (typeof em.setTint === "function") em.setTint(tint);
    else if (typeof em.setTintFill === "function") em.setTintFill(tint);
    // se nada existir, ignora — explosão funciona do mesmo jeito
  }

  // dispara sem depender de manager/child-emitters
  em.explode?.(quantity, x, y);
}
