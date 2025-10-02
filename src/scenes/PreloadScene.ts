// src/scenes/PreloadScene.ts
import Phaser from 'phaser';
import bassOgg from '../assets/audio/neon-labyrinth/neon_labyrinth_bass.ogg';
import bassMp3 from '../assets/audio/neon-labyrinth/neon_labyrinth_bass.mp3';
import drumsOgg from '../assets/audio/neon-labyrinth/neon_labyrinth_drums.ogg';
import drumsMp3 from '../assets/audio/neon-labyrinth/neon_labyrinth_drums.mp3';
import keysOgg from '../assets/audio/neon-labyrinth/neon_labyrinth_keyboard.ogg';
import keysMp3 from '../assets/audio/neon-labyrinth/neon_labyrinth_keyboard.mp3';
export class PreloadScene extends Phaser.Scene {
  constructor(){ super('PreloadScene'); }

  preload() {
    this.load.audio('music_keys',  [keysOgg, keysMp3]);  // teclado
    this.load.audio('music_bass',  [bassOgg, bassMp3]);  // baixo
    this.load.audio('music_drums', [drumsOgg, drumsMp3]); // bateria
  }

  create() { this.scene.start('MenuScene'); }
}
