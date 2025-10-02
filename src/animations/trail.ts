// src/animations/trail.ts
import Phaser from "phaser";

export class TileTrail {
  rt: Phaser.GameObjects.RenderTexture;

  constructor(scene: Phaser.Scene) {
    this.rt = scene.add
      .renderTexture(0, 0, scene.scale.width, scene.scale.height)
      .setOrigin(0, 0)
      .setScrollFactor(1) // segue a câmera
      .setDepth(0.7) // abaixo dos tiles, acima do grid base
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.ADD); // aditivo = brilho do rastro, sem “escurecer” o grid
  }

  /** Desenha um snapshot do container atual */
  addSnapshot(obj: Phaser.GameObjects.Container) {
    // Dica: temporariamente aumenta a alpha do obj se quiser um rastro mais intenso
    const prev = (obj as any).alpha ?? 1;
    (obj as any).alpha = 1;
    this.rt.draw(obj, obj.x, obj.y);
    (obj as any).alpha = prev;

    // ⚠️ Removido o fill preto global — era ele que criava o “sobreado” do grid
  }

  /** Limpa tudo (usar antes/depois de animações longas) */
  clear() {
    this.rt.clear();
  }
}
