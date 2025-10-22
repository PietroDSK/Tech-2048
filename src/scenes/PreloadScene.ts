// src/scenes/PreloadScene.ts
import Phaser from 'phaser';

// Neon Labyrinth
import neonKeysOgg from '../assets/audio/neon-labyrinth/neon_labyrinth_keyboard.ogg';
import neonKeysMp3 from '../assets/audio/neon-labyrinth/neon_labyrinth_keyboard.mp3';
import neonBassOgg from '../assets/audio/neon-labyrinth/neon_labyrinth_bass.ogg';
import neonBassMp3 from '../assets/audio/neon-labyrinth/neon_labyrinth_bass.mp3';
import neonDrumsOgg from '../assets/audio/neon-labyrinth/neon_labyrinth_drums.ogg';
import neonDrumsMp3 from '../assets/audio/neon-labyrinth/neon_labyrinth_drums.mp3';

// Digital Drift
import driftSynthMp3 from '../assets/audio/Digital Drift Stems/Digital Drift (Synth).mp3';
import driftBassMp3 from '../assets/audio/Digital Drift Stems/Digital Drift (Bass).mp3';
import driftDrumsMp3 from '../assets/audio/Digital Drift Stems/Digital Drift (Drums).mp3';
import driftPercussionMp3 from '../assets/audio/Digital Drift Stems/Digital Drift (Percussion).mp3';
import driftFxMp3 from '../assets/audio/Digital Drift Stems/Digital Drift (FX).mp3';

// Digital Drift Jazz
import driftJazzKeysMp3 from '../assets/audio/Digital Drift Stems Jazz/Digital Drift (Keyboard).mp3';
import driftJazzBassMp3 from '../assets/audio/Digital Drift Stems Jazz/Digital Drift (Bass).mp3';
import driftJazzDrumsMp3 from '../assets/audio/Digital Drift Stems Jazz/Digital Drift (Drums).mp3';
import driftJazzGuitarMp3 from '../assets/audio/Digital Drift Stems Jazz/Digital Drift (Guitar).mp3';

// Infinite Equations
import eqKeyboardMp3 from '../assets/audio/Infinite Equations Stems/Infinite Equations (Keyboard).mp3';
import eqSynthMp3 from '../assets/audio/Infinite Equations Stems/Infinite Equations (Synth).mp3';
import eqBassMp3 from '../assets/audio/Infinite Equations Stems/Infinite Equations (Bass).mp3';
import eqDrumsMp3 from '../assets/audio/Infinite Equations Stems/Infinite Equations (Drums).mp3';
import eqPercussionMp3 from '../assets/audio/Infinite Equations Stems/Infinite Equations (Percussion).mp3';
import eqFxMp3 from '../assets/audio/Infinite Equations Stems/Infinite Equations (FX).mp3';

export class PreloadScene extends Phaser.Scene {
  constructor(){ super('PreloadScene'); }

  preload() {
    // Neon Labyrinth
    this.load.audio('music_neon_keys',  [neonKeysOgg, neonKeysMp3]);
    this.load.audio('music_neon_bass',  [neonBassOgg, neonBassMp3]);
    this.load.audio('music_neon_drums', [neonDrumsOgg, neonDrumsMp3]);

    // Digital Drift
    this.load.audio('music_drift_synth', driftSynthMp3);
    this.load.audio('music_drift_bass', driftBassMp3);
    this.load.audio('music_drift_drums', driftDrumsMp3);
    this.load.audio('music_drift_percussion', driftPercussionMp3);
    this.load.audio('music_drift_fx', driftFxMp3);

    // Digital Drift Jazz
    this.load.audio('music_drift_jazz_keys', driftJazzKeysMp3);
    this.load.audio('music_drift_jazz_bass', driftJazzBassMp3);
    this.load.audio('music_drift_jazz_drums', driftJazzDrumsMp3);
    this.load.audio('music_drift_jazz_guitar', driftJazzGuitarMp3);

    // Infinite Equations
    this.load.audio('music_eq_keyboard', eqKeyboardMp3);
    this.load.audio('music_eq_synth', eqSynthMp3);
    this.load.audio('music_eq_bass', eqBassMp3);
    this.load.audio('music_eq_drums', eqDrumsMp3);
    this.load.audio('music_eq_percussion', eqPercussionMp3);
    this.load.audio('music_eq_fx', eqFxMp3);
  }

  create() { this.scene.start('MenuScene'); }
}
