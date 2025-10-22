import Phaser from "phaser";
import { TECH_FONT, TECH_MONO_FONT } from "../util/fonts";

/**
 * ScoreHud - Display de pontuação com estilo PCB/circuito
 * Posicionado centralizado no topo da tela
 */
export class ScoreHud extends Phaser.GameObjects.Container {
  private panel!: Phaser.GameObjects.Graphics;
  private pcbDetails!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private valueTxt!: Phaser.GameObjects.Text;
  private displayValue = 0;
  private leds: Phaser.GameObjects.Arc[] = [];
  private traces!: Phaser.GameObjects.Graphics;
  private currentTween?: Phaser.Tweens.Tween;

  private currentTheme: any;
  private panelWidth = 280;
  private panelHeight = 70;

  constructor(scene: Phaser.Scene, x: number, y: number, theme: any) {
    super(scene, x, y);
    scene.add.existing(this);

    this.currentTheme = theme;

    this.buildCircuitStyle(theme);

    this.setDepth(2000);
  }

  private buildCircuitStyle(theme: any) {
    const c = theme.colors;

    // Cores do tema
    const surfaceColor = Phaser.Display.Color.HexStringToColor(c.surface || "#0f0f16").color;
    const surfaceAltColor = Phaser.Display.Color.HexStringToColor(c.surfaceAlt || "#1a1a24").color;
    const primaryColor = Phaser.Display.Color.HexStringToColor(c.primary || "#66b8e0").color;
    const glowColor = Phaser.Display.Color.HexStringToColor(c.glow || "#4ef9e0").color;

    // === PAINEL PRINCIPAL ===
    this.panel = this.scene.add.graphics();

    // Fundo do painel
    this.panel.fillStyle(surfaceAltColor, 0.95);
    this.panel.fillRoundedRect(-this.panelWidth/2, -this.panelHeight/2, this.panelWidth, this.panelHeight, 16);

    // Borda principal
    this.panel.lineStyle(3, primaryColor, 0.9);
    this.panel.strokeRoundedRect(-this.panelWidth/2, -this.panelHeight/2, this.panelWidth, this.panelHeight, 16);

    // Borda interna (detalhe PCB)
    this.panel.lineStyle(1, primaryColor, 0.4);
    this.panel.strokeRoundedRect(-this.panelWidth/2 + 6, -this.panelHeight/2 + 6, this.panelWidth - 12, this.panelHeight - 12, 12);

    this.add(this.panel);

    // === DETALHES PCB ===
    this.pcbDetails = this.scene.add.graphics();

    // Painel interno para os números
    this.pcbDetails.fillStyle(surfaceColor, 0.6);
    this.pcbDetails.fillRoundedRect(-this.panelWidth/2 + 12, -this.panelHeight/2 + 12, this.panelWidth - 24, this.panelHeight - 24, 10);

    // Linhas de circuito decorativas
    this.pcbDetails.lineStyle(2, primaryColor, 0.3);

    // Linha horizontal superior
    this.pcbDetails.lineBetween(-this.panelWidth/2 + 20, -this.panelHeight/2 + 18, -this.panelWidth/2 + 60, -this.panelHeight/2 + 18);
    this.pcbDetails.lineBetween(this.panelWidth/2 - 60, -this.panelHeight/2 + 18, this.panelWidth/2 - 20, -this.panelHeight/2 + 18);

    // Linha horizontal inferior
    this.pcbDetails.lineBetween(-this.panelWidth/2 + 20, this.panelHeight/2 - 18, -this.panelWidth/2 + 60, this.panelHeight/2 - 18);
    this.pcbDetails.lineBetween(this.panelWidth/2 - 60, this.panelHeight/2 - 18, this.panelWidth/2 - 20, this.panelHeight/2 - 18);

    // Vias (pontos de conexão)
    this.pcbDetails.fillStyle(primaryColor, 0.6);
    this.pcbDetails.fillCircle(-this.panelWidth/2 + 20, -this.panelHeight/2 + 18, 2.5);
    this.pcbDetails.fillCircle(this.panelWidth/2 - 20, -this.panelHeight/2 + 18, 2.5);
    this.pcbDetails.fillCircle(-this.panelWidth/2 + 20, this.panelHeight/2 - 18, 2.5);
    this.pcbDetails.fillCircle(this.panelWidth/2 - 20, this.panelHeight/2 - 18, 2.5);

    this.add(this.pcbDetails);

    // === TRACES ANIMADAS ===
    this.traces = this.scene.add.graphics();
    this.traces.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.traces);

    // === LEDs INDICADORES ===
    const ledPositions = [
      { x: -this.panelWidth/2 + 15, y: 0 },
      { x: this.panelWidth/2 - 15, y: 0 }
    ];

    for (const pos of ledPositions) {
      const led = this.scene.add.circle(pos.x, pos.y, 3.5, glowColor, 0.8);
      led.setBlendMode(Phaser.BlendModes.ADD);
      this.leds.push(led);
      this.add(led);
    }

    // Animação de LEDs
    this.scene.tweens.add({
      targets: this.leds,
      alpha: { from: 0.5, to: 1 },
      yoyo: true,
      duration: 1200,
      repeat: -1,
      ease: "sine.inOut",
      delay: (_t: any, i: number) => i * 200
    });

    // === TEXTOS ===
    // Label "SCORE"
    this.label = this.scene.add.text(0, -this.panelHeight/2 + 20, "SCORE", {
      fontFamily: TECH_FONT,
      fontSize: "11px",
      color: c.textDim || "#8ea3b8",
      letterSpacing: 2.5 as any,
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);
    this.label.setResolution(2);
    this.add(this.label);

    // Valor do score
    this.valueTxt = this.scene.add.text(0, this.panelHeight/2 - 22, "0", {
      fontFamily: TECH_MONO_FONT,
      fontSize: "28px",
      color: c.text || "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);
    this.valueTxt.setResolution(2);
    this.valueTxt.setShadow(0, 0, c.glow || "#4ef9e0", 12, false, true);
    this.add(this.valueTxt);

    // Iniciar animação de traces
    this.animateTraces(primaryColor);
  }

  private animateTraces(primaryColor: number) {
    // Desenhar traces animadas
    const updateTraces = () => {
      this.traces.clear();

      const time = this.scene.time.now * 0.001;
      const pulse = Math.sin(time * 2) * 0.3 + 0.5;

      this.traces.lineStyle(1.5, primaryColor, 0.2 + pulse * 0.2);

      // Trace superior esquerda
      const x1 = -this.panelWidth/2 + 20;
      const x2 = -this.panelWidth/2 + 60;
      const y = -this.panelHeight/2 + 18;
      const progress = (time % 2) / 2;
      const traceX = Phaser.Math.Linear(x1, x2, progress);

      this.traces.lineBetween(x1, y, traceX, y);
      this.traces.fillStyle(primaryColor, 0.8);
      this.traces.fillCircle(traceX, y, 2);
    };

    this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: updateTraces
    });
  }

  resizeToText() {
    // Mantém tamanho fixo para layout consistente
  }

  setTheme(theme: any) {
    this.currentTheme = theme;

    // Reconstruir com novo tema
    this.removeAll(true);
    this.leds = [];
    this.buildCircuitStyle(theme);
  }

  /** Atualiza rapidamente sem animação (ex.: no create) */
  set(value: number) {
    this.displayValue = value | 0;
    this.valueTxt.setText(this.formatScore(this.displayValue));
  }

  /** Anima a contagem até `value` e dá um flash discreto */
  to(value: number) {
    const to = value | 0;
    console.log(`[ScoreHud.to] current: ${this.displayValue}, target: ${to}`);
    if (to === this.displayValue) {
      console.log(`[ScoreHud.to] SKIPPED - values are the same`);
      return;
    }

    // Cancelar tween anterior se existir
    if (this.currentTween) {
      console.log(`[ScoreHud.to] Canceling previous tween`);
      this.currentTween.remove();
      this.currentTween = undefined;
    }

    const from = this.displayValue | 0;

    this.currentTween = this.scene.tweens.addCounter({
      from, to,
      duration: Phaser.Math.Clamp(250 + Math.min(900, (to - from) * 0.4), 250, 800),
      ease: "quad.out",
      onUpdate: (tw) => {
        this.displayValue = Math.floor(tw.getValue() as number);
        this.valueTxt.setText(this.formatScore(this.displayValue));
      },
      onComplete: () => {
        console.log(`[ScoreHud.to] onComplete fired! Setting to ${to}`);
        // Garantir que o valor final seja exato
        this.displayValue = to;
        this.valueTxt.setText(this.formatScore(this.displayValue));
        this.currentTween = undefined;
      }
    });

    // Flash no painel
    this.scene.tweens.add({
      targets: this.panel,
      alpha: { from: 1, to: 0.7 },
      yoyo: true,
      duration: 100
    });

    // Pulso nos LEDs
    this.scene.tweens.add({
      targets: this.leds,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 0.8, to: 1 },
      yoyo: true,
      duration: 150,
      ease: "back.out(2)"
    });

    // Glow no texto
    const c = this.currentTheme.colors;
    this.scene.tweens.add({
      targets: this.valueTxt,
      alpha: { from: 1, to: 0.8 },
      yoyo: true,
      duration: 100,
      onComplete: () => {
        this.valueTxt.setShadow(0, 0, c.glow || "#4ef9e0", 16, false, true);
        this.scene.tweens.add({
          targets: this.valueTxt,
          alpha: 1,
          duration: 200
        });
      }
    });
  }

  private formatScore(value: number): string {
    // Formata com separadores de milhares
    return value.toLocaleString('pt-BR');
  }
}
