export function playUnlockSfx(scene: Phaser.Scene) {
  // placeholder: um beep synth com detune via WebAudio (ou toca um .mp3/.wav)
  scene.sound.play("sfx_unlock", { volume: 0.7 });
}
