
export function fadeOverlay(scene: Phaser.Scene, show: boolean) {
  let ov = scene.children.getByName('ui_overlay') as Phaser.GameObjects.Rectangle;
  if (!ov) {
    ov = scene.add.rectangle(scene.scale.width/2, scene.scale.height/2, scene.scale.width, scene.scale.height, 0x000000, 0.6)
      .setName('ui_overlay')
      .setAlpha(0)
      .setScrollFactor(0)
      .setDepth(1000);
  }
  scene.tweens.add({
    targets: ov,
    alpha: show ? 0.6 : 0,
    duration: 160,
    ease: 'Sine.Out'
  });
}
