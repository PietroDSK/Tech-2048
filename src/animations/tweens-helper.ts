// animations/tween-helpers.ts
export function tweenTo(scene: Phaser.Scene, cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise(resolve => {
    const origComplete = cfg.onComplete;
    scene.tweens.add({
      ...cfg,
      onComplete: (...args: any[]) => {
        try { origComplete && (origComplete as Function)(...args); } finally { resolve(); }
      }
    });
  });
}
