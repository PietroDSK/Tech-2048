import Phaser from "phaser";

export class Badge extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
    super(scene, x, y);
    const bg = scene.add.rectangle(0, 0, 140, 28, 0x112233, 0.8).setOrigin(0.5).setStrokeStyle(1, 0x2a90b8, 0.8);
    const tx = scene.add.text(0, 0, label, { fontSize: "12px", color: "#c8e9ff" }).setOrigin(0.5);
    this.add(bg); this.add(tx);
  }
}
