/**
 * Font utilities para Tech-2048
 *
 * Fornece fontes tech consistentes e garante resolução 2x em todos os textos
 */

/**
 * Fonte tech principal (fallback para Arial se Google Fonts falhar)
 */
export const TECH_FONT = '"Rajdhani", "Orbitron", "Arial", sans-serif';

/**
 * Fonte mono para códigos e números
 */
export const TECH_MONO_FONT = '"Roboto Mono", "Courier New", monospace';

/**
 * Cria um objeto de estilo de texto com fonte tech e resolução otimizada
 */
export function createTextStyle(config: {
  fontSize: string;
  color?: string;
  fontStyle?: "normal" | "bold" | "italic";
  align?: "left" | "center" | "right";
  wordWrap?: { width: number };
  backgroundColor?: string;
  padding?: { x?: number; y?: number; left?: number; right?: number; top?: number; bottom?: number };
  mono?: boolean;
}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: config.mono ? TECH_MONO_FONT : TECH_FONT,
    fontSize: config.fontSize,
    color: config.color || "#ffffff",
    fontStyle: config.fontStyle || "normal",
    align: config.align || "left",
    wordWrap: config.wordWrap,
    backgroundColor: config.backgroundColor,
    padding: config.padding,
  };
}

/**
 * Aplica resolução 2x em um texto (melhora qualidade em telas de alta densidade)
 */
export function applyHighResolution(text: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
  text.setResolution(2);
  return text;
}

/**
 * Helper para criar texto com fonte tech e alta resolução
 */
export function createTechText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string | string[],
  config: {
    fontSize: string;
    color?: string;
    fontStyle?: "normal" | "bold" | "italic";
    align?: "left" | "center" | "right";
    wordWrap?: { width: number };
    backgroundColor?: string;
    padding?: { x?: number; y?: number; left?: number; right?: number; top?: number; bottom?: number };
    mono?: boolean;
    shadow?: {
      x?: number;
      y?: number;
      color?: string;
      blur?: number;
      stroke?: boolean;
      fill?: boolean;
    };
  }
): Phaser.GameObjects.Text {
  const style = createTextStyle(config);
  const text = scene.add.text(x, y, content, style);

  // Sempre aplicar resolução 2x
  applyHighResolution(text);

  // Aplicar sombra se especificada
  if (config.shadow) {
    text.setShadow(
      config.shadow.x || 0,
      config.shadow.y || 0,
      config.shadow.color || "#000000",
      config.shadow.blur || 0,
      config.shadow.stroke !== false,
      config.shadow.fill !== false
    );
  }

  return text;
}

/**
 * Carrega fontes Google Fonts
 * Deve ser chamado no BootScene
 */
export function loadGoogleFonts(): Promise<void> {
  return new Promise((resolve) => {
    // Criar link para Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&family=Roboto+Mono:wght@400;500;600;700&display=swap';

    link.onload = () => {
      console.log('[Fonts] Google Fonts carregadas com sucesso');
      resolve();
    };

    link.onerror = () => {
      console.warn('[Fonts] Falha ao carregar Google Fonts, usando fallback');
      resolve(); // Não bloquear o jogo
    };

    document.head.appendChild(link);

    // Timeout de segurança
    setTimeout(() => {
      console.log('[Fonts] Timeout alcançado, continuando...');
      resolve();
    }, 3000);
  });
}
