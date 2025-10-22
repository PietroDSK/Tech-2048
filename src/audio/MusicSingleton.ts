// src/audio/music-singleton.ts

import { PlaylistManager, Track } from "./PlaylistManager";

import Phaser from "phaser";

type GameWithMusic = Phaser.Game & { __musicMgr?: PlaylistManager };

// Definição das 4 soundtracks
const TRACKS: Track[] = [
    {
    id: "digital_drift",
    name: "Digital Drift",
    stems: {
      synth: "music_drift_synth",
      bass: "music_drift_bass",
      drums: "music_drift_drums",
      percussion: "music_drift_percussion",
      fx: "music_drift_fx",
    },
    bpm: 90,
    beatsPerBar: 4,
    barsPerLoop: 4,
  },
  {
    id: "neon_labyrinth",
    name: "Neon Labyrinth",
    stems: {
      keys: "music_neon_keys",
      bass: "music_neon_bass",
      drums: "music_neon_drums",
    },
    bpm: 90,
    beatsPerBar: 4,
    barsPerLoop: 4,
  },
  {
    id: "digital_drift_jazz",
    name: "Digital Drift Jazz",
    stems: {
      keys: "music_drift_jazz_keys",
      bass: "music_drift_jazz_bass",
      drums: "music_drift_jazz_drums",
      guitar: "music_drift_jazz_guitar",
    },
    bpm: 90,
    beatsPerBar: 4,
    barsPerLoop: 4,
  },
  {
    id: "infinite_equations",
    name: "Infinite Equations",
    stems: {
      keys: "music_eq_keyboard",
      synth: "music_eq_synth",
      bass: "music_eq_bass",
      drums: "music_eq_drums",
      percussion: "music_eq_percussion",
      fx: "music_eq_fx",
    },
    bpm: 90,
    beatsPerBar: 4,
    barsPerLoop: 4,
  },
];

export function getGlobalMusic(scene: Phaser.Scene): PlaylistManager {
  const game = scene.game as GameWithMusic;

  // Cria uma única vez
  if (!game.__musicMgr) {
    game.__musicMgr = new PlaylistManager(scene, TRACKS);
    // Quando o jogo inteiro fechar, destruímos a instância
    game.events.once(Phaser.Core.Events.DESTROY, () => {
      try { game.__musicMgr?.destroy(); } catch {}
      game.__musicMgr = undefined;
    });
  } else {
    // Reencaixa a cena atual (caso o manager use tweens/scene internamente)
    if (typeof (game.__musicMgr as any).attach === "function") {
      (game.__musicMgr as any).attach(scene);
    } else {
      // fallback: reatribui a cena (se não existir attach())
      (game.__musicMgr as any).scene = scene;
    }
  }

  return game.__musicMgr;
}
