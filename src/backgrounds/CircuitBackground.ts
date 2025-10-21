// === Fundo animado de circuitos eletrônicos ===
import Phaser from "phaser";

interface CircuitNode {
  x: number;
  y: number;
  connections: number[]; // índices de outros nós
  pulseOffset: number; // offset de animação
}

interface CircuitPulse {
  fromIdx: number;
  toIdx: number;
  progress: number; // 0 a 1
  color: number;
  speed: number;
}

export class CircuitBackground {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private nodes: CircuitNode[] = [];
  private pulses: CircuitPulse[] = [];
  private width: number;
  private height: number;
  private primaryColor: number;
  private secondaryColor: number;
  private glowColor: number;
  private updateTimer?: Phaser.Time.TimerEvent;
  private pulseTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    colors: { primary: string; secondary: string; glow: string },
    depth = -1,
  ) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    this.primaryColor = Phaser.Display.Color.HexStringToColor(colors.primary).color;
    this.secondaryColor = Phaser.Display.Color.HexStringToColor(colors.secondary).color;
    this.glowColor = Phaser.Display.Color.HexStringToColor(colors.glow).color;

    this.graphics = scene.add.graphics().setDepth(depth);
    this.graphics.setBlendMode(Phaser.BlendModes.ADD);

    this.generateCircuitPattern();
    this.startAnimation();
  }

  private generateCircuitPattern() {
    // Gera uma grade de nós com algumas variações
    const nodeSpacingX = 80;
    const nodeSpacingY = 80;
    const cols = Math.ceil(this.width / nodeSpacingX) + 2;
    const rows = Math.ceil(this.height / nodeSpacingY) + 2;

    // Criar nós em uma grade irregular
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        // Adiciona variação aleatória à posição
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;

        const x = col * nodeSpacingX + offsetX;
        const y = row * nodeSpacingY + offsetY;

        // Nem todos os pontos viram nós (70% de chance)
        if (Math.random() > 0.3) {
          this.nodes.push({
            x,
            y,
            connections: [],
            pulseOffset: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    // Conectar nós próximos para criar o padrão de circuito
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const maxConnections = 2 + Math.floor(Math.random() * 2); // 2-3 conexões

      // Encontrar nós próximos
      const nearby: Array<{ idx: number; dist: number }> = [];
      for (let j = 0; j < this.nodes.length; j++) {
        if (i === j) continue;
        const other = this.nodes[j];
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < nodeSpacingX * 1.8 && dist > 10) {
          nearby.push({ idx: j, dist });
        }
      }

      // Ordenar por distância e conectar aos mais próximos
      nearby.sort((a, b) => a.dist - b.dist);
      for (let k = 0; k < Math.min(maxConnections, nearby.length); k++) {
        const targetIdx = nearby[k].idx;
        // Evitar duplicatas
        if (!node.connections.includes(targetIdx)) {
          node.connections.push(targetIdx);
        }
      }
    }
  }

  private startAnimation() {
    // Atualizar pulsos continuamente
    this.updateTimer = this.scene.time.addEvent({
      delay: 16, // ~60 FPS
      loop: true,
      callback: () => this.update(),
    });

    // Gerar novos pulsos periodicamente - reduzido delay para mais ação
    this.pulseTimer = this.scene.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => this.spawnPulse(),
    });
  }

  private spawnPulse() {
    // Escolher um nó aleatório que tenha conexões
    const validNodes = this.nodes.filter((n) => n.connections.length > 0);
    if (validNodes.length === 0) return;

    const startNode = Phaser.Utils.Array.GetRandom(validNodes);
    const startIdx = this.nodes.indexOf(startNode);

    if (startNode.connections.length === 0) return;

    const targetIdx = Phaser.Utils.Array.GetRandom(startNode.connections);

    // Variar cores entre primária e secundária
    const color = Math.random() > 0.5 ? this.primaryColor : this.secondaryColor;

    this.pulses.push({
      fromIdx: startIdx,
      toIdx: targetIdx,
      progress: 0,
      color,
      speed: 0.008 + Math.random() * 0.012, // velocidade variável
    });

    // Limitar número de pulsos simultâneos - aumentado para mais ação
    if (this.pulses.length > 40) {
      this.pulses.shift();
    }
  }

  private update() {
    this.graphics.clear();

    // Desenhar todas as conexões (linhas estáticas) - aumentado opacidade e espessura
    this.graphics.lineStyle(1.5, this.primaryColor, 0.4);
    for (const node of this.nodes) {
      for (const connIdx of node.connections) {
        const target = this.nodes[connIdx];
        if (!target) continue;

        // Desenhar linha base
        this.graphics.lineBetween(node.x, node.y, target.x, target.y);
      }
    }

    // Desenhar nós (pontos estáticos com pulso sutil) - aumentado tamanho e intensidade
    const time = this.scene.time.now * 0.001;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const pulse = Math.sin(time * 2 + node.pulseOffset) * 0.3 + 0.7;
      const radius = 2.5 + pulse * 0.8;

      this.graphics.fillStyle(this.glowColor, 0.6 * pulse);
      this.graphics.fillCircle(node.x, node.y, radius);
    }

    // Atualizar e desenhar pulsos
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i];
      pulse.progress += pulse.speed;

      if (pulse.progress >= 1) {
        this.pulses.splice(i, 1);
        continue;
      }

      const from = this.nodes[pulse.fromIdx];
      const to = this.nodes[pulse.toIdx];
      if (!from || !to) continue;

      // Interpolação da posição do pulso
      const x = Phaser.Math.Linear(from.x, to.x, pulse.progress);
      const y = Phaser.Math.Linear(from.y, to.y, pulse.progress);

      // Desenhar pulso com glow - aumentado tamanho e intensidade
      const alpha = Math.sin(pulse.progress * Math.PI) * 0.95; // fade in/out mais intenso

      // Glow externo maior
      this.graphics.fillStyle(pulse.color, alpha * 0.5);
      this.graphics.fillCircle(x, y, 10);

      // Glow médio
      this.graphics.fillStyle(pulse.color, alpha * 0.7);
      this.graphics.fillCircle(x, y, 6);

      // Core do pulso
      this.graphics.fillStyle(pulse.color, alpha);
      this.graphics.fillCircle(x, y, 3.5);

      // Trail atrás do pulso - mais grosso e visível
      if (pulse.progress > 0.1) {
        const trailProgress = pulse.progress - 0.1;
        const trailX = Phaser.Math.Linear(from.x, to.x, trailProgress);
        const trailY = Phaser.Math.Linear(from.y, to.y, trailProgress);
        this.graphics.lineStyle(3, pulse.color, alpha * 0.7);
        this.graphics.lineBetween(trailX, trailY, x, y);
      }
    }

    // Adicionar linhas decorativas extras (componentes de placa-mãe)
    if (Math.random() > 0.98) {
      this.drawRandomComponent();
    }
  }

  private drawRandomComponent() {
    // Desenha componentes decorativos aleatórios (capacitores, resistores, etc)
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;
    const type = Math.floor(Math.random() * 3);

    this.graphics.lineStyle(1, this.secondaryColor, 0.15);

    if (type === 0) {
      // Capacitor simples (retângulo pequeno)
      const w = 8 + Math.random() * 6;
      const h = 4 + Math.random() * 4;
      this.graphics.strokeRect(x - w / 2, y - h / 2, w, h);
    } else if (type === 1) {
      // Resistor (linha com retângulo)
      const len = 12 + Math.random() * 8;
      this.graphics.lineBetween(x - len, y, x - len / 3, y);
      this.graphics.strokeRect(x - len / 3, y - 2, len / 1.5, 4);
      this.graphics.lineBetween(x + len / 3, y, x + len, y);
    } else {
      // IC chip (retângulo maior com pinos)
      const w = 10 + Math.random() * 8;
      const h = 6 + Math.random() * 6;
      this.graphics.strokeRect(x - w / 2, y - h / 2, w, h);
      // Pinos
      for (let i = 0; i < 4; i++) {
        const py = y - h / 2 + (i / 3) * h;
        this.graphics.lineBetween(x - w / 2 - 2, py, x - w / 2, py);
        this.graphics.lineBetween(x + w / 2, py, x + w / 2 + 2, py);
      }
    }
  }

  setAlpha(alpha: number) {
    this.graphics.setAlpha(alpha);
  }

  destroy() {
    this.updateTimer?.remove();
    this.pulseTimer?.remove();
    this.graphics.destroy();
  }
}
