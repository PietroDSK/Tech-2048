import { tweenTo } from './tweens-helper';

export function shakeOnMerge(scene: Phaser.Scene, strength = 0.003, duration = 120) {
  scene.cameras.main.shake(duration, strength);
}

export function flashWin(scene: Phaser.Scene) {
  scene.cameras.main.flash(160, 255, 255, 255);
}


export async function zoomPunch(scene: Phaser.Scene) {
  const cam = scene.cameras.main;
  const base = cam.zoom;
  await tweenTo(scene, { targets: cam, zoom: base * 1.03, duration: 90, ease: 'Sine.Out' });
  await tweenTo(scene, { targets: cam, zoom: base,        duration: 120, ease: 'Sine.InOut' });
}
