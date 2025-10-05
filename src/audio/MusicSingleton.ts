// src/audio/music-singleton.ts
import Phaser from "phaser";
import { MusicManager } from "./MusicManager";

type GameWithMusic = Phaser.Game & { __musicMgr?: MusicManager };

export function getGlobalMusic(scene: Phaser.Scene): MusicManager {
  const game = scene.game as GameWithMusic;

  // Cria uma única vez
  if (!game.__musicMgr) {
    game.__musicMgr = new MusicManager(scene);
    // Quando o jogo inteiro fechar, destruímos a instância
    game.events.once(Phaser.Core.Events.DESTROY, () => {
      try { game.__musicMgr?.destroy(); } catch {}
      game.__musicMgr = undefined;
    });
  } else {
    // Reencaixa a cena atual (caso o manager use tweens/scene internamente)
    // @ts-expect-error — acesso intencional
    if (typeof (game.__musicMgr as any).attach === "function") {
      (game.__musicMgr as any).attach(scene);
    } else {
      // fallback: reatribui a cena (se não existir attach())
      (game.__musicMgr as any).scene = scene;
    }
  }

  return game.__musicMgr;
}
