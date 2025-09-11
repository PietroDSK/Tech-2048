export type Lang = 'pt-BR' | 'en'
type Dict = Record<string, string>
const pt: Dict = {
  'title': '2048 TECH','score': 'Pontuação','best': 'Recorde','newGame': 'Novo jogo',
  'labels': 'Rótulos Tech','sound': 'Sons','hint': 'Use as setas do teclado (ou arraste no celular). Combine blocos iguais para chegar em 2048.','lang': 'Idioma',
  'alert.gameOver.title': 'Fim de jogo','alert.gameOver.desc': 'Pontuação: {score}','alert.gameOver.new': 'Novo jogo','alert.gameOver.close': 'Fechar',
}
const en: Dict = {
  'title': '2048 TECH','score': 'Score','best': 'Best','newGame': 'New Game',
  'labels': 'Tech Labels','sound': 'Sound','hint': 'Use arrow keys (or swipe on mobile). Merge equal tiles to reach 2048.','lang': 'Language',
  'alert.gameOver.title': 'Game Over','alert.gameOver.desc': 'Score: {score}','alert.gameOver.new': 'New Game','alert.gameOver.close': 'Close',
}
const DICTS: Record<Lang, Dict> = { 'pt-BR': pt, 'en': en }
export function t(lang: Lang, key: string, vars?: Record<string, string|number>): string {
  const dict = DICTS[lang] ?? pt; let s = dict[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  return s
}
export function applyI18n(lang: Lang){
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n!; el.innerText = t(lang, key)
  })
}