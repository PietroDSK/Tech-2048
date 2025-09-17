export type Lang = "pt-BR" | "en";
type Dict = Record<string, string>;
const pt: Dict = {
  title: "2048 TECH",
  score: "Pontuação",
  best: "Recorde",
  newGame: "Novo jogo",
  labels: "Rótulos Tech",
  sound: "Sons",
  hint: "Use as setas do teclado (ou arraste no celular). Combine blocos iguais para chegar em 2048.",
  lang: "Idioma",
  "alert.gameOver.title": "Fim de jogo",
  "alert.gameOver.desc": "Pontuação: {score}",
  "alert.gameOver.new": "Novo jogo",
  "alert.gameOver.close": "Fechar",
  "privacy.link": "Preferências de privacidade",
  "consent.title": "Privacidade & Cookies",
  "consent.essential.title": "Essenciais",
  "consent.essential.desc":
    "Usamos armazenamento essencial para idioma, preferências do jogo e operação básica. (Sempre ativo)",
  "consent.analytics.title": "Analíticos",
  "consent.analytics.desc":
    "Ajuda a entender o uso do jogo para melhorar (ex.: métricas anônimas).",
  "consent.ads.title": "Publicidade",
  "consent.ads.desc":
    "Permite anúncios personalizados/medição. Desmarque para não personalizados ou sem anúncios.",
  "consent.acceptAll": "Aceitar tudo",
  "consent.onlyEssentials": "Somente essenciais",
};
const en: Dict = {
  title: "2048 TECH",
  score: "Score",
  best: "Best",
  newGame: "New Game",
  labels: "Tech Labels",
  sound: "Sound",
  hint: "Use arrow keys (or swipe on mobile). Merge equal tiles to reach 2048.",
  lang: "Language",
  "alert.gameOver.title": "Game Over",
  "alert.gameOver.desc": "Score: {score}",
  "alert.gameOver.new": "New Game",
  "alert.gameOver.close": "Close",
  "privacy.link": "Privacy preferences",
  "consent.title": "Privacy & Cookies",
  "consent.essential.title": "Essential",
  "consent.essential.desc":
    "We use essential storage for language, game prefs and core operation. (Always active)",
  "consent.analytics.title": "Analytics",
  "consent.analytics.desc":
    "Helps understand usage to improve (e.g., anonymous metrics).",
  "consent.ads.title": "Advertising",
  "consent.ads.desc":
    "Enables personalized ads/measurement. Uncheck for non-personalized or no ads.",
  "consent.acceptAll": "Accept all",
  "consent.onlyEssentials": "Only essentials",
};
const DICTS: Record<Lang, Dict> = { "pt-BR": pt, en: en };
export function t(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[lang] ?? pt;
  let s = dict[key] ?? key;
  if (vars)
    for (const [k, v] of Object.entries(vars))
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  return s;
}
export function applyI18n(lang: Lang) {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n!;
    el.innerText = t(lang, key);
  });
}
