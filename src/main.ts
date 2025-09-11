import '../styles.css'
import { Game } from './game'
import { setupKeyboard, setupTouch } from './input'
import { getBest, setBest, getLabelsPref, setLabelsPref, getGameState, setGameState, clearGameState, getSoundPref, setSoundPref, getLangPref, setLangPref, type Lang } from './storage'
import { SFX } from './sfx'
import { applyI18n } from './i18n'
import { showGameOver } from './ui'

const canvas = document.getElementById('game') as HTMLCanvasElement
const scoreEl = document.getElementById('score')!
const bestEl = document.getElementById('best')!
const btnNew = document.getElementById('newGame') as HTMLButtonElement
const chkLabels = document.getElementById('toggleLabels') as HTMLInputElement
const chkSound = document.getElementById('toggleSound') as HTMLInputElement
const langSelect = document.getElementById('langSelect') as HTMLSelectElement

const sfx = new SFX()
const game = new Game(canvas); game.setSFX(sfx)

// Preferências
chkLabels.checked = getLabelsPref(); game.setLabels(chkLabels.checked)
chkSound.checked = getSoundPref(); sfx.enabled = chkSound.checked
let lang: Lang = getLangPref(); langSelect.value = lang; applyI18n(lang)

function updateUI(){ scoreEl.textContent = String(game.score); if(game.score > game.best){ game.setBest(game.score); setBest(game.best); bestEl.textContent = String(game.best) } }

btnNew.addEventListener('click', () => { game.newGame(); updateUI(); saveState() })
chkLabels.addEventListener('change', () => { game.setLabels(chkLabels.checked); setLabelsPref(chkLabels.checked); game.render() })
chkSound.addEventListener('change', () => { sfx.enabled = chkSound.checked; setSoundPref(chkSound.checked) })
langSelect.addEventListener('change', () => { lang = langSelect.value as Lang; setLangPref(lang); applyI18n(lang) })

setupKeyboard((dir)=>{ game.step(dir); updateUI(); saveState(); checkEnd() })
setupTouch(canvas, (dir)=>{ game.step(dir); updateUI(); saveState(); checkEnd() })

const saved = getGameState()
if(saved){ try{ (game as any).board.loadFrom(saved.cells); (game as any).score = saved.score; game.render(); updateUI() } catch { game.newGame(); updateUI() } } else { game.newGame(); updateUI() }

function saveState(){ const snap = (game as any).snapshot(); setGameState(snap) }
function checkEnd(){ if((game as any).inputLocked) return; if(!(game as any)['board'].canMove()){ setTimeout(()=>{ showGameOver(lang, (game as any).score).then(res => { clearGameState(); if(res==='new'){ game.newGame(); updateUI() } }) }, 20) } }

// --- PWA SW registration ---
// add types for import.meta.env via vite-env.d.ts
const isProd = (import.meta as any).env?.PROD === true
if ('serviceWorker' in navigator) {
  if (isProd) {
    navigator.serviceWorker.register('sw.js').catch(()=>{})
  } else {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
    if ('caches' in globalThis) { (caches as CacheStorage).keys().then(keys => keys.forEach(k => (caches as CacheStorage).delete(k))) }
  }
}