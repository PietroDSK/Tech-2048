/**
 * GameSaveManager - Gerencia salvamento e carregamento do estado do jogo
 */

export interface GameSaveState {
  // Estado do tabuleiro
  board: number[][];
  score: number;

  // Upgrades e recursos
  upgrades: Record<string, number | boolean>;

  // Configurações do jogo
  mode?: string;
  difficulty?: string;

  // Metadata
  timestamp: number;
  version: string;
}

const SAVE_KEY = "tech2048.gameSave";
const SAVE_VERSION = "1.0.0";

export class GameSaveManager {
  /**
   * Salva o estado atual do jogo
   */
  static saveGame(state: Omit<GameSaveState, "timestamp" | "version">): void {
    try {
      const saveData: GameSaveState = {
        ...state,
        timestamp: Date.now(),
        version: SAVE_VERSION,
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      console.log("[GameSave] Game saved successfully", saveData);
    } catch (error) {
      console.error("[GameSave] Failed to save game:", error);
    }
  }

  /**
   * Carrega o estado salvo do jogo
   */
  static loadGame(): GameSaveState | null {
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (!savedData) {
        console.log("[GameSave] No saved game found");
        return null;
      }

      const state = JSON.parse(savedData) as GameSaveState;

      // Validar versão
      if (state.version !== SAVE_VERSION) {
        console.warn("[GameSave] Save version mismatch, clearing old save");
        this.clearSave();
        return null;
      }

      // Validar dados básicos
      if (!state.board || !Array.isArray(state.board) || typeof state.score !== "number") {
        console.warn("[GameSave] Invalid save data, clearing");
        this.clearSave();
        return null;
      }

      console.log("[GameSave] Game loaded successfully", state);
      return state;
    } catch (error) {
      console.error("[GameSave] Failed to load game:", error);
      this.clearSave();
      return null;
    }
  }

  /**
   * Verifica se existe um jogo salvo
   */
  static hasSavedGame(): boolean {
    const save = this.loadGame();
    return save !== null;
  }

  /**
   * Limpa o jogo salvo
   */
  static clearSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
      console.log("[GameSave] Save cleared");
    } catch (error) {
      console.error("[GameSave] Failed to clear save:", error);
    }
  }

  /**
   * Obtém informações sobre o jogo salvo sem carregar tudo
   */
  static getSaveInfo(): { score: number; timestamp: number } | null {
    const save = this.loadGame();
    if (!save) return null;

    return {
      score: save.score,
      timestamp: save.timestamp,
    };
  }
}
