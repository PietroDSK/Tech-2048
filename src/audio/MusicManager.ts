// src/audio/MusicManager.ts
import Phaser from 'phaser';

type StemKey = 'keys' | 'bass' | 'drums';
type StemHandle = {
  key: StemKey;
  sound: Phaser.Sound.BaseSound;
  targetVolume: number;
};

export class MusicManager {
  private scene: Phaser.Scene;
  private stems = new Map<StemKey, StemHandle>();
  private started = false;
  private enabled = true;

  // ajuste para seus loops
  private bpm = 90;
  private beatsPerBar = 4;
  private barsPerLoop = 4;
  private baseVolume = 0.5;
  private loopLengthSec = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.loopLengthSec = (60 / this.bpm) * this.beatsPerBar * this.barsPerLoop;
  }

  init() {
    this.stems.set('keys',  { key: 'keys',  sound: this.scene.sound.add('music_keys',  { loop: true, volume: 0 }), targetVolume: 0 });
    this.stems.set('bass',  { key: 'bass',  sound: this.scene.sound.add('music_bass',  { loop: true, volume: 0 }), targetVolume: 0 });
    this.stems.set('drums', { key: 'drums', sound: this.scene.sound.add('music_drums', { loop: true, volume: 0 }), targetVolume: 0 });

    this.startAllSynced();

    this.scene.game.events.on(Phaser.Core.Events.BLUR,  () => this.pause());
    this.scene.game.events.on(Phaser.Core.Events.FOCUS, () => this.resume());
  }

	private isPlayable(s: Phaser.Sound.BaseSound) {
  	// NoAudioSound não tem áudio real
  	return !(s instanceof (Phaser.Sound as any).NoAudioSound);
	}


private startAllSynced() {
  if (this.started) return;
  this.stems.forEach(({ sound }) => {
    if (this.isPlayable(sound)) sound.play({ delay: 0 }); // seu delay sync aqui
  });
  this.fadeTo('keys', this.baseVolume * 0.6, 1200);
  this.started = true;
}

  /** Chame quando a pontuação mudar */
  updateByScore(score: number) {
    if (!this.enabled) return;

    // 0+   -> keys
    // 256+ -> bass
    // 1024+-> drums
    this.ensureStem('keys',  this.baseVolume * 0.6);
    this.ensureStem('bass',  score >= 256  ? this.baseVolume * 0.65 : 0);
    this.ensureStem('drums', score >= 1024 ? this.baseVolume * 0.75 : 0);
  }

  /** "Acento" musical sem SFX: micro-swell de keys/drums */
  accentMilestone(durationMs = 380) {
    const keys  = this.stems.get('keys')?.sound;
    const drums = this.stems.get('drums')?.sound;

    if (keys) {
      const back = (keys as any).volume ?? 0.5;
      this.scene.tweens.add({
        targets: keys, volume: back * 1.2, duration: durationMs/2, yoyo: true, ease: 'Sine.easeOut'
      });
    }
    if (drums && (drums as any).volume > 0) {
      const back = (drums as any).volume;
      this.scene.tweens.add({
        targets: drums, volume: Math.min(back * 1.25, 1), duration: durationMs/2, yoyo: true, ease: 'Sine.easeOut'
      });
    }
  }


private ensureStem(key: StemKey, vol: number) {
  const stem = this.stems.get(key);
  if (!stem) return;
  stem.targetVolume = vol;
  if (!this.isPlayable(stem.sound)) return;
  this.scene.tweens.add({ targets: stem.sound as any, volume: vol, duration: 450, ease: 'Sine.easeInOut' });
}

  private fadeTo(key: StemKey, vol: number, ms = 800) {
    const stem = this.stems.get(key);
    if (!stem) return;
    stem.targetVolume = vol;
    this.scene.tweens.add({ targets: stem.sound, volume: vol, duration: ms, ease: 'Sine.easeInOut' });
  }

  pause()  { this.stems.forEach(({ sound }) => sound.pause()); }
  resume() { this.stems.forEach(({ sound }) => sound.resume()); }

  muteAll(muted: boolean) {
    this.enabled = !muted;
    this.scene.sound.mute = muted;
  }

  destroy() {
    this.stems.forEach(({ sound }) => sound.destroy());
    this.stems.clear();
  }
}
