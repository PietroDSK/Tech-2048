// animations/score.ts
export function scoreFly(scene: Phaser.Scene, x: number, y: number, value: number) {
  const txt = scene.add.text(x, y, `+${value}`, {
    fontFamily: 'Inter, system-ui',
    fontSize: '20px'
  }).setOrigin(0.5).setDepth(999).setAlpha(0.9);

  scene.tweens.add({
    targets: txt,
    y: y - 30,
    alpha: 0,
    duration: 600,
    ease: 'Sine.Out',
    onComplete: () => txt.destroy()
  });
}
