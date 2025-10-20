import Phaser from "phaser";

export function showToast(scene: Phaser.Scene, text: string, duration = 2000) {
  const { width } = scene.scale;
  const bg = scene.add.rectangle(width/2, 60, width * 0.9, 60, 0x000000, 0.6).setOrigin(0.5);
  const tx = scene.add.text(width/2, 60, text, {
    fontSize: "14px",
    color: "#ffffff",
    wordWrap: { width: width * 0.85 }
  }).setOrigin(0.5);

  bg.setDepth(1000); tx.setDepth(1001);

  scene.tweens.add({ targets: [bg, tx], y: "+=10", alpha: { from: 0, to: 1 }, duration: 220, ease: "Sine.Out" });

  scene.time.delayedCall(duration, () => {
    scene.tweens.add({
      targets: [bg, tx],
      y: "-=10",
      alpha: 0,
      duration: 220,
      ease: "Sine.In",
      onComplete: () => { bg.destroy(); tx.destroy(); }
    });
  });
}
