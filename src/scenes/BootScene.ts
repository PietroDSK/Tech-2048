// BootScene.ts
import { loadGoogleFonts } from "../util/fonts";

export class BootScene extends Phaser.Scene {
  constructor(){ super('BootScene'); }

  async create() {
    // Load tech fonts first
    await loadGoogleFonts();

    const btn = this.add.text(this.scale.width/2, this.scale.height/2, 'TAP TO START', {
      fontSize: '28px', color: '#0ff', backgroundColor: '#222', padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const start = async () => {
      try {
        if (this.sound.locked) await this.sound.unlock();
        const ctx = (this.sound as Phaser.Sound.SoundManager).context;
        if (ctx && ctx.state !== 'running') await ctx.resume();
        this.scene.start('PreloadScene'); // daí carrega assets e vai pra GameScene
      } catch (e) {
        console.warn('Unlock falhou:', e);
      }
    };

    btn.on('pointerdown', start);
    this.input.keyboard?.once('keydown', start);
  }
}
