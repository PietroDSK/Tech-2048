import { getSettings } from "./storage";

export type Lang = "pt-BR" | "en";

const dict = {
  pt: {
    title: "Tech 2048",
    playClassic: "Jogar Clássico",
    otherModes: "Outros Modos",
    options: "Opções",
    exit: "Sair",
    modesTitle: "Modos de Jogo",
    mode4096: "4096",
    modeEndless: "Infinito",
    modeCustom: "Tabuleiro Personalizado",
    locked: "Bloqueado (alcance 2048 para desbloquear)",
    back: "Voltar",
    optionsTitle: "Opções",
    sound: "Som",
    animations: "Animações",
    language: "Idioma",
    portuguese: "Português",
    english: "Inglês",
    resetProgress: "Redefinir progresso (bloqueios)",
    confirmExit: "Deseja realmente sair?",
    progressCleared: "Progresso redefinido!",
  },
  en: {
    title: "Tech 2048",
    playClassic: "Play Classic",
    otherModes: "Other Modes",
    options: "Options",
    exit: "Exit",
    modesTitle: "Game Modes",
    mode4096: "4096",
    modeEndless: "Endless",
    modeCustom: "Custom Board",
    locked: "Locked (reach 2048 to unlock)",
    back: "Back",
    optionsTitle: "Options",
    sound: "Sound",
    animations: "Animations",
    language: "Language",
    portuguese: "Portuguese",
    english: "English",
    resetProgress: "Reset progress (locks)",
    confirmExit: "Do you really want to exit?",
    progressCleared: "Progress reset!",
  },
};

export type I18nKey = keyof typeof dict["pt"];

export function t(key: I18nKey): string {
  const lang = getSettings().lang;
  const d = dict[lang] || dict.pt;
  return d[key] ?? key;
}
