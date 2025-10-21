import Phaser from "phaser";
import { PANEL_CONNECTIONS, PANEL_NODES, PANEL_COLORS } from "./panelLayout";
import type { ModuleKey } from "../achievements/achievements";

/**
 * Desenha conexões limpas e diretas entre os módulos
 * com partículas animadas fluindo pelas linhas
 */
export class ModuleConnections extends Phaser.GameObjects.Container {
  private lines!: Phaser.GameObjects.Graphics;
  private particles: Phaser.GameObjects.Arc[] = [];
  private particleData: Array<{
    particle: Phaser.GameObjects.Arc;
    path: Phaser.Math.Vector2[];
    progress: number;
    speed: number;
  }> = [];

  constructor(
    scene: Phaser.Scene,
    contentTop: number,
    contentHeight: number,
    width: number
  ) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setDepth(5);

    // Criar gráfico para linhas
    this.lines = scene.add.graphics();
    this.lines.setDepth(5);
    this.add(this.lines);

    // Desenhar conexões
    this.drawConnections(contentTop, contentHeight, width);

    // Criar partículas animadas
    this.createParticles(contentTop, contentHeight, width);
  }

  private drawConnections(contentTop: number, contentHeight: number, width: number) {
    this.lines.clear();

    const getPos = (key: ModuleKey) => {
      const node = PANEL_NODES.find(n => n.key === key)!;
      return new Phaser.Math.Vector2(
        node.x * width,
        contentTop + node.y * contentHeight
      );
    };

    // Desenhar cada conexão
    for (const [fromKey, toKey] of PANEL_CONNECTIONS) {
      const from = getPos(fromKey);
      const to = getPos(toKey);
      const color = PANEL_COLORS[fromKey];

      // Linha principal (mais grossa)
      this.lines.lineStyle(3, color, 0.4);
      this.lines.lineBetween(from.x, from.y, to.x, to.y);

      // Linha de glow (mais fina, brilhante)
      this.lines.lineStyle(1.5, color, 0.8);
      this.lines.lineBetween(from.x, from.y, to.x, to.y);

      // Pontos de conexão
      this.lines.fillStyle(color, 0.6);
      this.lines.fillCircle(from.x, from.y, 4);
      this.lines.fillCircle(to.x, to.y, 4);
    }

    // Aplicar blend mode para efeito de glow
    this.lines.setBlendMode(Phaser.BlendModes.ADD);
  }

  private createParticles(contentTop: number, contentHeight: number, width: number) {
    const getPos = (key: ModuleKey) => {
      const node = PANEL_NODES.find(n => n.key === key)!;
      return new Phaser.Math.Vector2(
        node.x * width,
        contentTop + node.y * contentHeight
      );
    };

    // Criar 2 partículas por conexão
    for (const [fromKey, toKey] of PANEL_CONNECTIONS) {
      const from = getPos(fromKey);
      const to = getPos(toKey);
      const color = PANEL_COLORS[fromKey];

      // Caminho direto
      const path = [from.clone(), to.clone()];

      // Criar 2 partículas com velocidades diferentes
      for (let i = 0; i < 2; i++) {
        const particle = this.scene.add.circle(from.x, from.y, 3, color, 0.9);
        particle.setDepth(6);
        particle.setBlendMode(Phaser.BlendModes.ADD);

        this.particles.push(particle);
        this.particleData.push({
          particle,
          path,
          progress: i * 0.5, // Offset inicial
          speed: 0.003 + Math.random() * 0.002 // Velocidade variável
        });
      }
    }

    // Animar partículas
    this.scene.time.addEvent({
      delay: 16, // ~60fps
      loop: true,
      callback: () => this.updateParticles()
    });
  }

  private updateParticles() {
    for (const data of this.particleData) {
      // Atualizar progresso
      data.progress += data.speed;
      if (data.progress >= 1) {
        data.progress = 0; // Reiniciar
      }

      // Calcular posição ao longo do caminho
      const [start, end] = data.path;
      const x = Phaser.Math.Linear(start.x, end.x, data.progress);
      const y = Phaser.Math.Linear(start.y, end.y, data.progress);

      data.particle.setPosition(x, y);

      // Fade in/out suave
      const alpha = Math.sin(data.progress * Math.PI) * 0.9;
      data.particle.setAlpha(alpha);
    }
  }

  destroy() {
    // Limpar partículas
    for (const particle of this.particles) {
      particle.destroy();
    }
    this.particles = [];
    this.particleData = [];

    super.destroy();
  }
}
