const KEY_BEST = 'tech2048_best'
const KEY_PREF_LABELS = 'tech2048_labels'
const KEY_STATE = 'tech2048_state'
const KEY_SOUND = 'tech2048_sound'
const KEY_LANG = 'tech2048_lang'

export function getBest(): number { return Number(localStorage.getItem(KEY_BEST) ?? 0) }
export function setBest(v: number) { localStorage.setItem(KEY_BEST, String(v)) }
export function getLabelsPref(): boolean { return localStorage.getItem(KEY_PREF_LABELS) === '1' }
export function setLabelsPref(v: boolean) { localStorage.setItem(KEY_PREF_LABELS, v ? '1' : '0') }
export function getSoundPref(): boolean { const v = localStorage.getItem(KEY_SOUND); return v === null ? true : v === '1' }
export function setSoundPref(v: boolean) { localStorage.setItem(KEY_SOUND, v ? '1' : '0') }

export type Lang = 'pt-BR' | 'en'
export function getLangPref(): Lang { const v = localStorage.getItem(KEY_LANG) as Lang | null; return (v === 'en' ? 'en' : 'pt-BR') }
export function setLangPref(v: Lang) { localStorage.setItem(KEY_LANG, v) }

export interface SavedState { score: number; cells: number[][] }
export function getGameState(): SavedState | null {
  const raw = localStorage.getItem(KEY_STATE); if(!raw) return null
  try { const obj = JSON.parse(raw); if(Array.isArray(obj.cells) && typeof obj.score==='number') return obj } catch {}
  return null
}
export function setGameState(state: SavedState) { localStorage.setItem(KEY_STATE, JSON.stringify(state)) }
export function clearGameState(){ localStorage.removeItem(KEY_STATE) }