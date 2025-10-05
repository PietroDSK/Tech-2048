// src/animations/transitions.ts
import Phaser from "phaser";

export type TransitionDir = "none" | "fade" | "left" | "right" | "up" | "down";

/**
 * Transição segura entre cenas.
 * - Desabilita input durante a troca;
 * - FADE: fade-out da atual, start da target e stop da atual;
 * - NONE: troca imediata (start + stop);
 * - LEFT/RIGHT/UP/DOWN: por robustez, atualmente fazem fallback para FADE.
 */
export function swapTo(
  from: Phaser.Scene,
  targetKey: string,
  data: any = {},
  dir: TransitionDir = "fade",
  duration = 280
) {
  const scenePlugin = from.scene;          // ScenePlugin
  const currentKey = from.scene.key;
  const cam = from.cameras.main;

  // Evita cliques durante a transição
  if (from.input) from.input.enabled = false;

  // Já estou indo pra mesma cena? Apenas reinicia com dados.
  if (currentKey === targetKey) {
    scenePlugin.restart(data);
    if (from.input) from.input.enabled = true;
    return;
  }

  // Troca imediata
  if (dir === "none") {
    scenePlugin.start(targetKey, data);
    // garante que a cena anterior não continue rodando por trás
    scenePlugin.stop(currentKey);
    return;
  }

  // Para "left/right/up/down", usamos fallback para fade (estável)
  // Você pode implementar slide real depois se quiser.
  // FADE padrão (robusto)
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    // inicia a cena destino
    scenePlugin.start(targetKey, data);
    // interrompe a atual (nada continua por trás)
    scenePlugin.stop(currentKey);
  });

  // Fallback extra: se algo travar no evento, ainda trocamos
  from.time.delayedCall(duration + 80, () => {
    // Se por algum motivo a atual ainda está ativa, força troca
    if ((scenePlugin as any).isActive?.(currentKey)) {
      scenePlugin.start(targetKey, data);
      scenePlugin.stop(currentKey);
    }
  });

  cam.fadeOut(duration, 0, 0, 0);
}
