// src/audio/PlaylistManager.ts
import Phaser from "phaser";

// Stems possíveis em cada soundtrack
export type StemKey = "keys" | "synth" | "bass" | "drums" | "percussion" | "fx" | "guitar";

type StemHandle = {
  key: StemKey;
  sound: Phaser.Sound.BaseSound;
  targetVolume: number;
};

export type Track = {
  id: string;
  name: string;
  stems: Partial<Record<StemKey, string>>; // Nem todas as tracks têm todos os stems
  bpm: number;
  beatsPerBar: number;
  barsPerLoop: number;
};

export class PlaylistManager {
  private scene: Phaser.Scene;
  private tracks: Track[] = [];
  private currentTrackIndex = -1;
  private previousTrackIndex = -1;
  private stems = new Map<StemKey, StemHandle>();
  private started = false;
  private enabled = true;
  private baseVolume = 0.5;
  private loopLengthSec = 0;

  constructor(scene: Phaser.Scene, tracks: Track[]) {
    this.scene = scene;
    this.tracks = tracks;
  }

  init() {
    // Selecionar primeira música aleatoriamente
    this.selectRandomTrack();
    this.loadCurrentTrack();
    this.startAllSynced();

    this.scene.game.events.on(Phaser.Core.Events.BLUR, () => this.pause());
    this.scene.game.events.on(Phaser.Core.Events.FOCUS, () => this.resume());
  }

  private selectRandomTrack() {
    if (this.tracks.length === 0) {
      console.error("[PlaylistManager] No tracks available");
      return;
    }

    if (this.tracks.length === 1) {
      this.currentTrackIndex = 0;
      return;
    }

    // Selecionar track aleatório diferente do anterior
    let newIndex: number;
    do {
      newIndex = Math.floor(Math.random() * this.tracks.length);
    } while (newIndex === this.previousTrackIndex);

    this.previousTrackIndex = this.currentTrackIndex;
    this.currentTrackIndex = newIndex;

    const track = this.tracks[this.currentTrackIndex];
    console.log(`[PlaylistManager] Selected track: ${track.name}`);
  }

  private loadCurrentTrack() {
    if (this.currentTrackIndex < 0 || !this.tracks[this.currentTrackIndex]) {
      return;
    }

    const track = this.tracks[this.currentTrackIndex];

    // Calcular duração do loop
    this.loopLengthSec =
      (60 / track.bpm) * track.beatsPerBar * track.barsPerLoop;

    // Limpar stems anteriores
    this.stems.forEach(({ sound }) => {
      if (sound) {
        sound.stop();
        sound.destroy();
      }
    });
    this.stems.clear();

    // Criar stems dinamicamente baseado no que a track tem
    Object.entries(track.stems).forEach(([stemKey, audioKey]) => {
      if (audioKey) {
        this.stems.set(stemKey as StemKey, {
          key: stemKey as StemKey,
          sound: this.scene.sound.add(audioKey, { loop: true, volume: 0 }),
          targetVolume: 0,
        });
      }
    });

    console.log(`[PlaylistManager] Loaded ${this.stems.size} stems for ${track.name}`);

    // Configurar evento para trocar de música ao final do loop
    const loopMs = this.loopLengthSec * 1000;
    this.scene.time.addEvent({
      delay: loopMs,
      loop: true,
      callback: () => this.checkShouldSwitchTrack(),
    });
  }

  private checkShouldSwitchTrack() {
    // Trocar de música com 30% de chance a cada loop
    if (Math.random() < 0.3) {
      this.switchToNextTrack();
    }
  }

  private switchToNextTrack() {
    console.log("[PlaylistManager] Switching to next track...");

    // Fade out atual
    this.fadeOutAll(1500);

    // Após fade out, trocar música
    this.scene.time.delayedCall(1500, () => {
      this.selectRandomTrack();
      this.loadCurrentTrack();
      this.startAllSynced();

      // Restaurar volumes baseado no score
      const score = this.scene.registry.get("score") || 0;
      this.updateByScore(score);
    });
  }

  private fadeOutAll(duration = 800) {
    this.stems.forEach(({ sound }) => {
      if (this.isPlayable(sound)) {
        this.scene.tweens.add({
          targets: sound,
          volume: 0,
          duration,
          ease: "Sine.easeInOut",
          onComplete: () => {
            sound.stop();
          },
        });
      }
    });
  }

  private isPlayable(s: Phaser.Sound.BaseSound) {
    return !(s instanceof (Phaser.Sound as any).NoAudioSound);
  }

  private startAllSynced() {
    this.stems.forEach(({ sound }) => {
      if (this.isPlayable(sound)) {
        sound.play({ delay: 0 });
      }
    });

    // Fade in do primeiro stem melódico (keys ou synth)
    if (this.stems.has("keys")) {
      this.fadeTo("keys", this.baseVolume * 0.6, 1200);
    } else if (this.stems.has("synth")) {
      this.fadeTo("synth", this.baseVolume * 0.6, 1200);
    }

    this.started = true;
  }

  /** Chame quando a pontuação mudar */
  updateByScore(score: number) {
    if (!this.enabled) return;

    // 0+ -> Melodia (keys/synth/guitar)
    if (this.stems.has("keys")) {
      this.ensureStem("keys", this.baseVolume * 0.6);
    }
    if (this.stems.has("synth")) {
      this.ensureStem("synth", this.baseVolume * 0.6);
    }
    if (this.stems.has("guitar")) {
      this.ensureStem("guitar", score >= 128 ? this.baseVolume * 0.5 : 0);
    }

    // 256+ -> Bass
    if (this.stems.has("bass")) {
      this.ensureStem("bass", score >= 256 ? this.baseVolume * 0.65 : 0);
    }

    // 512+ -> Percussion
    if (this.stems.has("percussion")) {
      this.ensureStem("percussion", score >= 512 ? this.baseVolume * 0.6 : 0);
    }

    // 1024+ -> Drums
    if (this.stems.has("drums")) {
      this.ensureStem("drums", score >= 1024 ? this.baseVolume * 0.75 : 0);
    }

    // 2048+ -> FX
    if (this.stems.has("fx")) {
      this.ensureStem("fx", score >= 2048 ? this.baseVolume * 0.5 : 0);
    }
  }

  /** "Acento" musical sem SFX: micro-swell de keys/drums */
  accentMilestone(durationMs = 380) {
    const keys = this.stems.get("keys")?.sound;
    const drums = this.stems.get("drums")?.sound;

    if (keys) {
      const back = (keys as any).volume ?? 0.5;
      this.scene.tweens.add({
        targets: keys,
        volume: back * 1.2,
        duration: durationMs / 2,
        yoyo: true,
        ease: "Sine.easeOut",
      });
    }
    if (drums && (drums as any).volume > 0) {
      const back = (drums as any).volume;
      this.scene.tweens.add({
        targets: drums,
        volume: Math.min(back * 1.25, 1),
        duration: durationMs / 2,
        yoyo: true,
        ease: "Sine.easeOut",
      });
    }
  }

  private ensureStem(key: StemKey, vol: number) {
    const stem = this.stems.get(key);
    if (!stem) return;
    stem.targetVolume = vol;
    if (!this.isPlayable(stem.sound)) return;
    this.scene.tweens.add({
      targets: stem.sound as any,
      volume: vol,
      duration: 450,
      ease: "Sine.easeInOut",
    });
  }

  private fadeTo(key: StemKey, vol: number, ms = 800) {
    const stem = this.stems.get(key);
    if (!stem) return;
    stem.targetVolume = vol;
    this.scene.tweens.add({
      targets: stem.sound,
      volume: vol,
      duration: ms,
      ease: "Sine.easeInOut",
    });
  }

  pause() {
    this.stems.forEach(({ sound }) => sound.pause());
  }

  resume() {
    this.stems.forEach(({ sound }) => sound.resume());
  }

  muteAll(muted: boolean) {
    this.enabled = !muted;
    this.scene.sound.mute = muted;
  }

  destroy() {
    this.stems.forEach(({ sound }) => sound.destroy());
    this.stems.clear();
  }

  public attach(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public isStarted(): boolean {
    return this.started === true;
  }
}
