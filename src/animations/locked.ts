
import { tweenTo } from './tweens-helper';

export async function lockedWobble(target: Phaser.GameObjects.GameObject & { y: number }, scene: Phaser.Scene) {
  const baseY = (target as any).y ?? 0;
  await tweenTo(scene, { targets: target, angle: -4, duration: 70, ease: 'Sine.InOut' });
  await tweenTo(scene, { targets: target, angle:  4, duration: 110, ease: 'Sine.InOut', yoyo: true, repeat: 1 });
  await tweenTo(scene, { targets: target, angle:  0, duration: 70, ease: 'Sine.Out' });
  await tweenTo(scene, { targets: target, y: baseY + 6, duration: 90, ease: 'Back.Out', yoyo: true });
}
