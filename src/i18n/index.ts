// src/i18n/index.ts
type Lang = "pt" | "en";

const messages: Record<Lang, Record<string, string>> = {
  pt: {
    // Gerais
    title: "2048 TECH",
    back: "Voltar",
    goal: "META",

    // Botões / HUD
    btn_undo: "↩︎ Undo",
    btn_reward_undo: "+1 Undo (Ad)",
    ad_loading_try_again: "Anúncio carregando. Tente novamente.",
    reward_undo_received: "+1 Undo recebido!",

    // Undo
    no_undos: "Sem Undos disponíveis.",
    nothing_to_undo: "Nada para desfazer.",
    move_undone: "Jogada desfeita.",

    // Game Over / Win
    reached_value: "Você atingiu %{v}!",
    no_moves_game_over: "Sem movimentos! Fim de jogo.",
    continue_endless: "Continuar (Endless)",
    retry: "Tentar de novo",

    // Menu
    menu_title: "Tech 2048",
    menu_subtitle: "Jogo de puzzle tecnológico",
    menu_play_classic: "Jogar Clássico",
    menu_other_modes: "Outros Modos",
    menu_options: "Opções",
    menu_exit: "Sair",
    menu_modes_locked: "Desbloqueie ao atingir 2048",
    unlock_2048_hint: "Complete 2048 no modo clássico para desbloquear",
    play_classic: "Jogar Clássico",
    other_modes: "Outros modos",
    themes: "Temas",
    options: "Opções",
    unlock_other_modes_hint: "Conclua 2048 no Clássico para desbloquear",
    footer_game_name: "Tech-2048",

    // Options Scene
    music: "Música",
    sound_effects: "Efeitos sonoros",
    vibration: "Vibração",
    language: "Idioma",
    on: "LIGADO",
    off: "DESLIGADO",
    portuguese: "Português",
    english: "English",
    privacy_and_cookies: "Privacidade & Cookies",

    // Game Modes
    mode_4096: "4096",
    mode_endless: "Endless",
    mode_custom_6x6: "Personalizado 6x6",

    // Theme Scene
    selected: "Selecionado",
    select: "Selecionar",
    locked: "Bloqueado",

    // UI Menu Settings
    tech_labels: "Rótulos Tech",
    sound: "Sons",
    new_game: "Novo jogo",
    close: "Fechar",
    cancel: "Cancelar",

    // Game Over Modal
    game_over_title: "Fim de Jogo",
    game_over_score: "Pontuação: %{score}",
    try_again: "Tentar Novamente",
  },

  en: {
    // General
    title: "2048 TECH",
    back: "Back",
    goal: "GOAL",

    // Buttons / HUD
    btn_undo: "↩︎ Undo",
    btn_reward_undo: "+1 Undo (Ad)",
    ad_loading_try_again: "Ad is loading. Try again.",
    reward_undo_received: "+1 Undo received!",

    // Undo
    no_undos: "No undos available.",
    nothing_to_undo: "Nothing to undo.",
    move_undone: "Move undone.",

    // Game Over / Win
    reached_value: "You reached %{v}!",
    no_moves_game_over: "No moves left! Game Over.",
    continue_endless: "Continue (Endless)",
    retry: "Try again",

    // Menu
    menu_title: "Tech 2048",
    menu_subtitle: "Technological puzzle game",
    menu_play_classic: "Play Classic",
    menu_other_modes: "Other Modes",
    menu_options: "Options",
    menu_exit: "Exit",
    menu_modes_locked: "Unlock by reaching 2048",
    unlock_2048_hint: "Complete 2048 in classic mode to unlock",
    play_classic: "Play Classic",
    other_modes: "Other Modes",
    themes: "Themes",
    options: "Options",
    unlock_other_modes_hint: "Complete 2048 in Classic to unlock",
    footer_game_name: "Tech-2048",

    // Options Scene
    music: "Music",
    sound_effects: "Sound Effects",
    vibration: "Vibration",
    language: "Language",
    on: "ON",
    off: "OFF",
    portuguese: "Português",
    english: "English",
    privacy_and_cookies: "Privacy & Cookies",
    // Game Modes
    mode_4096: "4096",
    mode_endless: "Endless",
    mode_custom_6x6: "Custom 6x6",

    // Theme Scene
    selected: "Selected",
    select: "Select",
    locked: "Locked",

    // UI Menu Settings
    tech_labels: "Tech Labels",
    sound: "Sound",
    new_game: "New Game",
    close: "Close",
    cancel: "Cancel",

    // Game Over Modal
    game_over_title: "Game Over",
    game_over_score: "Score: %{score}",
    try_again: "Try Again",
  },
};

let currentLang: Lang = "pt";

// Inicializar idioma baseado no localStorage
function initLang() {
  try {
    const stored = localStorage.getItem("settings_v1");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.lang === "en" || settings.lang === "pt") {
        currentLang = settings.lang;
      }
    }
  } catch {}
}

// Inicializar na primeira execução
initLang();

export function setLang(lang: Lang) {
  currentLang = lang;
  // Sincronizar com o sistema de settings
  try {
    const stored = localStorage.getItem("settings_v1");
    const settings = stored ? JSON.parse(stored) : {};
    settings.lang = lang;
    localStorage.setItem("settings_v1", JSON.stringify(settings));
  } catch {}
}

export function getLang(): Lang {
  return currentLang;
}

/**
 * Função de tradução
 * - Usa a chave definida no dicionário
 * - Suporta placeholders: %{nome}
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = messages[currentLang] || {};
  let msg = dict[key] || key;

  if (params) {
    Object.keys(params).forEach((p) => {
      msg = msg.replace(`%{${p}}`, String(params[p]));
    });
  }
  return msg;
}

export default {
  t,
  setLang,
  getLang,
};
