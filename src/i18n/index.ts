// src/i18n/index.ts
type Lang = "pt" | "en" | "es" | "ru" | "zh" | "ja";

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
    menu_continue: "Continuar",
    menu_play_classic: "Jogar Clássico",
    menu_other_modes: "Outros Modos",
    menu_codex: "Painel/Codex",
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
    spanish: "Español",
    russian: "Русский",
    chinese: "中文",
    japanese: "日本語",
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

    // Evolution Panel
    panel_title: "Painel de Evolução",
    panel_subtitle: "Complete conquistas para ativar módulos. Toque em um chip para ver progresso e atalhos do Codex.",
    tech_codex: "Tech Codex",
    module_progress: "%{unlocked}/%{total}",
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
    menu_continue: "Continue",
    menu_play_classic: "Play Classic",
    menu_other_modes: "Other Modes",
    menu_codex: "Panel/Codex",
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
    spanish: "Español",
    russian: "Русский",
    chinese: "中文",
    japanese: "日本語",
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

    // Evolution Panel
    panel_title: "Evolution Panel",
    panel_subtitle: "Complete achievements to activate modules. Tap a chip to see progress and Codex shortcuts.",
    tech_codex: "Tech Codex",
    module_progress: "%{unlocked}/%{total}",
  },

  es: {
    // General
    title: "2048 TECH",
    back: "Volver",
    goal: "META",

    // Buttons / HUD
    btn_undo: "↩︎ Deshacer",
    btn_reward_undo: "+1 Deshacer (Anuncio)",
    ad_loading_try_again: "Anuncio cargando. Intenta de nuevo.",
    reward_undo_received: "¡+1 Deshacer recibido!",

    // Undo
    no_undos: "No hay deshaceres disponibles.",
    nothing_to_undo: "Nada que deshacer.",
    move_undone: "Movimiento deshecho.",

    // Game Over / Win
    reached_value: "¡Alcanzaste %{v}!",
    no_moves_game_over: "¡Sin movimientos! Fin del juego.",
    continue_endless: "Continuar (Infinito)",
    retry: "Intentar de nuevo",

    // Menu
    menu_title: "Tech 2048",
    menu_subtitle: "Juego de rompecabezas tecnológico",
    menu_continue: "Continuar",
    menu_play_classic: "Jugar Clásico",
    menu_other_modes: "Otros Modos",
    menu_codex: "Panel/Codex",
    menu_options: "Opciones",
    menu_exit: "Salir",
    menu_modes_locked: "Desbloquea al alcanzar 2048",
    unlock_2048_hint: "Completa 2048 en modo clásico para desbloquear",
    play_classic: "Jugar Clásico",
    other_modes: "Otros Modos",
    themes: "Temas",
    options: "Opciones",
    unlock_other_modes_hint: "Completa 2048 en Clásico para desbloquear",
    footer_game_name: "Tech-2048",

    // Options Scene
    music: "Música",
    sound_effects: "Efectos de Sonido",
    vibration: "Vibración",
    language: "Idioma",
    on: "ACTIVADO",
    off: "DESACTIVADO",
    portuguese: "Português",
    english: "English",
    spanish: "Español",
    russian: "Русский",
    chinese: "中文",
    japanese: "日本語",
    privacy_and_cookies: "Privacidad y Cookies",

    // Game Modes
    mode_4096: "4096",
    mode_endless: "Infinito",
    mode_custom_6x6: "Personalizado 6x6",

    // Theme Scene
    selected: "Seleccionado",
    select: "Seleccionar",
    locked: "Bloqueado",

    // UI Menu Settings
    tech_labels: "Etiquetas Tech",
    sound: "Sonido",
    new_game: "Nuevo Juego",
    close: "Cerrar",
    cancel: "Cancelar",

    // Game Over Modal
    game_over_title: "Fin del Juego",
    game_over_score: "Puntuación: %{score}",
    try_again: "Intentar de Nuevo",

    // Evolution Panel
    panel_title: "Panel de Evolución",
    panel_subtitle: "Completa logros para activar módulos. Toca un chip para ver el progreso y los atajos del Codex.",
    tech_codex: "Tech Codex",
    module_progress: "%{unlocked}/%{total}",
  },

  ru: {
    // General
    title: "2048 TECH",
    back: "Назад",
    goal: "ЦЕЛЬ",

    // Buttons / HUD
    btn_undo: "↩︎ Отменить",
    btn_reward_undo: "+1 Отмена (Реклама)",
    ad_loading_try_again: "Реклама загружается. Попробуйте снова.",
    reward_undo_received: "+1 Отмена получена!",

    // Undo
    no_undos: "Нет доступных отмен.",
    nothing_to_undo: "Нечего отменять.",
    move_undone: "Ход отменен.",

    // Game Over / Win
    reached_value: "Вы достигли %{v}!",
    no_moves_game_over: "Нет ходов! Игра окончена.",
    continue_endless: "Продолжить (Бесконечный)",
    retry: "Попробовать снова",

    // Menu
    menu_title: "Tech 2048",
    menu_subtitle: "Технологическая головоломка",
    menu_continue: "Продолжить",
    menu_play_classic: "Играть Классика",
    menu_other_modes: "Другие Режимы",
    menu_codex: "Панель/Codex",
    menu_options: "Настройки",
    menu_exit: "Выход",
    menu_modes_locked: "Разблокируйте, достигнув 2048",
    unlock_2048_hint: "Завершите 2048 в классическом режиме для разблокировки",
    play_classic: "Играть Классика",
    other_modes: "Другие Режимы",
    themes: "Темы",
    options: "Настройки",
    unlock_other_modes_hint: "Завершите 2048 в Классике для разблокировки",
    footer_game_name: "Tech-2048",

    // Options Scene
    music: "Музыка",
    sound_effects: "Звуковые Эффекты",
    vibration: "Вибрация",
    language: "Язык",
    on: "ВКЛ",
    off: "ВЫКЛ",
    portuguese: "Português",
    english: "English",
    spanish: "Español",
    russian: "Русский",
    chinese: "中文",
    japanese: "日本語",
    privacy_and_cookies: "Конфиденциальность и Cookies",

    // Game Modes
    mode_4096: "4096",
    mode_endless: "Бесконечный",
    mode_custom_6x6: "Пользовательский 6x6",

    // Theme Scene
    selected: "Выбрано",
    select: "Выбрать",
    locked: "Заблокировано",

    // UI Menu Settings
    tech_labels: "Tech Метки",
    sound: "Звук",
    new_game: "Новая Игра",
    close: "Закрыть",
    cancel: "Отмена",

    // Game Over Modal
    game_over_title: "Игра Окончена",
    game_over_score: "Счет: %{score}",
    try_again: "Попробовать Снова",

    // Evolution Panel
    panel_title: "Панель Эволюции",
    panel_subtitle: "Выполняйте достижения для активации модулей. Нажмите на чип, чтобы увидеть прогресс и ярлыки Codex.",
    tech_codex: "Tech Codex",
    module_progress: "%{unlocked}/%{total}",
  },

  zh: {
    // General
    title: "2048 科技",
    back: "返回",
    goal: "目标",

    // Buttons / HUD
    btn_undo: "↩︎ 撤销",
    btn_reward_undo: "+1 撤销（广告）",
    ad_loading_try_again: "广告加载中，请重试。",
    reward_undo_received: "+1 撤销已获得！",

    // Undo
    no_undos: "没有可用的撤销。",
    nothing_to_undo: "没有可撤销的内容。",
    move_undone: "已撤销移动。",

    // Game Over / Win
    reached_value: "你达到了 %{v}！",
    no_moves_game_over: "没有移动了！游戏结束。",
    continue_endless: "继续（无尽模式）",
    retry: "重试",

    // Menu
    menu_title: "科技 2048",
    menu_subtitle: "科技益智游戏",
    menu_continue: "继续",
    menu_play_classic: "经典模式",
    menu_other_modes: "其他模式",
    menu_codex: "面板/Codex",
    menu_options: "选项",
    menu_exit: "退出",
    menu_modes_locked: "达到2048解锁",
    unlock_2048_hint: "在经典模式中完成2048以解锁",
    play_classic: "经典模式",
    other_modes: "其他模式",
    themes: "主题",
    options: "选项",
    unlock_other_modes_hint: "在经典模式中完成2048以解锁",
    footer_game_name: "Tech-2048",

    // Options Scene
    music: "音乐",
    sound_effects: "音效",
    vibration: "振动",
    language: "语言",
    on: "开启",
    off: "关闭",
    portuguese: "Português",
    english: "English",
    spanish: "Español",
    russian: "Русский",
    chinese: "中文",
    japanese: "日本語",
    privacy_and_cookies: "隐私和Cookies",

    // Game Modes
    mode_4096: "4096",
    mode_endless: "无尽",
    mode_custom_6x6: "自定义 6x6",

    // Theme Scene
    selected: "已选择",
    select: "选择",
    locked: "已锁定",

    // UI Menu Settings
    tech_labels: "科技标签",
    sound: "声音",
    new_game: "新游戏",
    close: "关闭",
    cancel: "取消",

    // Game Over Modal
    game_over_title: "游戏结束",
    game_over_score: "分数：%{score}",
    try_again: "重试",

    // Evolution Panel
    panel_title: "进化面板",
    panel_subtitle: "完成成就以激活模块。点击芯片查看进度和Codex快捷方式。",
    tech_codex: "Tech Codex",
    module_progress: "%{unlocked}/%{total}",
  },

  ja: {
    // General
    title: "2048 テック",
    back: "戻る",
    goal: "目標",

    // Buttons / HUD
    btn_undo: "↩︎ 元に戻す",
    btn_reward_undo: "+1 元に戻す（広告）",
    ad_loading_try_again: "広告を読み込んでいます。もう一度お試しください。",
    reward_undo_received: "+1 元に戻すを獲得しました！",

    // Undo
    no_undos: "元に戻すがありません。",
    nothing_to_undo: "元に戻すものがありません。",
    move_undone: "移動を元に戻しました。",

    // Game Over / Win
    reached_value: "%{v}に到達しました！",
    no_moves_game_over: "移動できません！ゲームオーバー。",
    continue_endless: "続ける（エンドレス）",
    retry: "もう一度",

    // Menu
    menu_title: "テック 2048",
    menu_subtitle: "テクノロジーパズルゲーム",
    menu_continue: "続ける",
    menu_play_classic: "クラシックをプレイ",
    menu_other_modes: "その他のモード",
    menu_codex: "パネル/Codex",
    menu_options: "オプション",
    menu_exit: "終了",
    menu_modes_locked: "2048に到達してロック解除",
    unlock_2048_hint: "クラシックモードで2048を完了してロック解除",
    play_classic: "クラシックをプレイ",
    other_modes: "その他のモード",
    themes: "テーマ",
    options: "オプション",
    unlock_other_modes_hint: "クラシックで2048を完了してロック解除",
    footer_game_name: "Tech-2048",

    // Options Scene
    music: "音楽",
    sound_effects: "効果音",
    vibration: "バイブレーション",
    language: "言語",
    on: "オン",
    off: "オフ",
    portuguese: "Português",
    english: "English",
    spanish: "Español",
    russian: "Русский",
    chinese: "中文",
    japanese: "日本語",
    privacy_and_cookies: "プライバシーとCookies",

    // Game Modes
    mode_4096: "4096",
    mode_endless: "エンドレス",
    mode_custom_6x6: "カスタム 6x6",

    // Theme Scene
    selected: "選択済み",
    select: "選択",
    locked: "ロック中",

    // UI Menu Settings
    tech_labels: "テックラベル",
    sound: "サウンド",
    new_game: "新しいゲーム",
    close: "閉じる",
    cancel: "キャンセル",

    // Game Over Modal
    game_over_title: "ゲームオーバー",
    game_over_score: "スコア：%{score}",
    try_again: "もう一度",

    // Evolution Panel
    panel_title: "進化パネル",
    panel_subtitle: "実績を達成してモジュールを有効化します。チップをタップして進捗とCodexのショートカットを表示します。",
    tech_codex: "Tech Codex",
    module_progress: "%{unlocked}/%{total}",
  },
};

let currentLang: Lang = "pt";

// Inicializar idioma baseado no localStorage
function initLang() {
  try {
    const stored = localStorage.getItem("settings_v1");
    if (stored) {
      const settings = JSON.parse(stored);
      const validLangs: Lang[] = ["pt", "en", "es", "ru", "zh", "ja"];
      if (validLangs.includes(settings.lang)) {
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
