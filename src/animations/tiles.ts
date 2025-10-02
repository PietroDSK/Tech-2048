import { tweenTo } from './tweens-helper';

export function spawnPop(tile: Phaser.GameObjects.Container, scene: Phaser.Scene) {
  tile.setScale(0.6);
  scene.tweens.add({
    targets: tile,
    scale: 1,
    duration: 120,
    ease: 'Back.Out',
  });
}

export function moveTile(tile: Phaser.GameObjects.Container, x: number, y: number, scene: Phaser.Scene, onComplete?: () => void) {
  scene.tweens.add({
    targets: tile,
    x, y,
    duration: 90,        // responsivo e rápido
    ease: 'Cubic.Out',
    onComplete
  });
}

// animations/mergePulse.ts

export async function mergePulse(tile: Phaser.GameObjects.Container, scene: Phaser.Scene) {
  await tweenTo(scene, { targets: tile, scale: 1.07, duration: 70, ease: 'Sine.Out' });
  await tweenTo(scene, { targets: tile, scale: 1.00, duration: 90, ease: 'Sine.InOut' });
}
