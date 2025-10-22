import Phaser from "phaser";
import { getTheme } from "../theme";
import { TECH_FONT } from "../util/fonts";

export function showToast(scene: Phaser.Scene, text: string, duration = 2000) {
  const { width } = scene.scale;
  const theme = getTheme();
  const c = theme.colors;

  // Converte cores hex para int
  const surfaceColor = Phaser.Display.Color.HexStringToColor(c.surfaceAlt || "#1a1a24").color;
  const primaryColor = Phaser.Display.Color.HexStringToColor(c.primary || "#66b8e0").color;

  // Fundo com borda PCB
  const bgGraphics = scene.add.graphics().setDepth(1000);
  const w = width * 0.9;
  const h = Math.max(60, 80); // Altura mínima aumentada para textos longos
  const x = width / 2;
  const y = 80;

  // Fundo principal
  bgGraphics.fillStyle(surfaceColor, 0.95);
  bgGraphics.fillRoundedRect(x - w/2, y - h/2, w, h, 12);

  // Borda externa
  bgGraphics.lineStyle(2, primaryColor, 0.8);
  bgGraphics.strokeRoundedRect(x - w/2, y - h/2, w, h, 12);

  // Borda interna (detalhes PCB)
  bgGraphics.lineStyle(1, primaryColor, 0.4);
  bgGraphics.strokeRoundedRect(x - w/2 + 4, y - h/2 + 4, w - 8, h - 8, 10);

  // Texto com cor do tema
  const tx = scene.add.text(x, y, text, {
    fontSize: "13px",
    color: c.text || "#ffffff",
    fontFamily: TECH_FONT,
    align: "center",
    wordWrap: { width: w - 24 }
  }).setOrigin(0.5).setDepth(1001);
  tx.setResolution(2);

  // Animação de entrada
  bgGraphics.setAlpha(0);
  tx.setAlpha(0);
  scene.tweens.add({
    targets: [bgGraphics, tx],
    y: "+=10",
    alpha: { from: 0, to: 1 },
    duration: 220,
    ease: "back.out(1.5)"
  });

  // Animação de saída
  scene.time.delayedCall(duration, () => {
    scene.tweens.add({
      targets: [bgGraphics, tx],
      y: "-=10",
      alpha: 0,
      duration: 220,
      ease: "sine.in",
      onComplete: () => {
        bgGraphics.destroy();
        tx.destroy();
      }
    });
  });
}
