import '../styles.css'
import { Game } from './game'
import { setupKeyboard, setupTouch } from './input'
import { getBest, setBest, getLabelsPref, setLabelsPref, getGameState, setGameState, clearGameState, getSoundPref, setSoundPref, getLangPref, setLangPref, type Lang } from './storage'
import { SFX } from './sfx'
import { applyI18n } from './i18n'
import { showGameOver, ensureSettingsMenu, openSettingsMenu, closeSettingsMenu } from './ui'
import { AdsManager } from './ads'

const canvas = document.getElementById('game') as HTMLCanvasElement
const scoreEl = document.getElementById('score')!
const bestEl = document.getElementById('best')!
const btnNew = document.getElementById('newGame') as HTMLButtonElement | null
const btnMenu = document.getElementById('btnMenu') as HTMLButtonElement

const sfx = new SFX()
const game = new Game(canvas); game.setSFX(sfx)

// Preferências iniciais
game.setLabels(getLabelsPref())
sfx.enabled = getSoundPref()
let lang: Lang = getLangPref(); applyI18n(lang)

function updateUI(){
  scoreEl.textContent = String(game.score)
  if (game.score > game.best) {
    game.setBest(game.score)
    setBest(game.best)
    bestEl.textContent = String(game.best)
  }
}

// Constrói e integra o Menu
ensureSettingsMenu()
const menuOverlay = document.getElementById('menuOverlay') as HTMLDivElement
const menuLabels = document.getElementById('menuToggleLabels') as HTMLInputElement
const menuSound = document.getElementById('menuToggleSound') as HTMLInputElement
const menuLang = document.getElementById('menuLangSelect') as HTMLSelectElement
const menuNew = document.getElementById('menuNewGame') as HTMLButtonElement
const menuClose = document.getElementById('menuClose') as HTMLButtonElement

// Sincroniza antes de abrir
btnMenu?.addEventListener('click', () => {
  menuLabels.checked = (game as any).useLabels ?? false
  menuSound.checked = (sfx as any).enabled ?? true
  menuLang.value = lang
  openSettingsMenu()
})
menuOverlay?.addEventListener('click', (e) => { if (e.target === menuOverlay) closeSettingsMenu() })
menuClose?.addEventListener('click', () => closeSettingsMenu())

menuNew?.addEventListener('click', () => { game.newGame(); updateUI(); closeSettingsMenu() })
menuLabels?.addEventListener('change', () => { game.setLabels(menuLabels.checked); setLabelsPref(menuLabels.checked); game.render() })
menuSound?.addEventListener('change', () => { sfx.enabled = menuSound.checked; setSoundPref(menuSound.checked) })
menuLang?.addEventListener('change', () => { lang = menuLang.value as Lang; setLangPref(lang); applyI18n(lang) })

// Controles extras (se existir botão "Novo jogo" fora do menu)
btnNew?.addEventListener('click', () => { game.newGame(); updateUI(); saveState() })

setupKeyboard((dir)=>{ game.step(dir); updateUI(); saveState(); checkEnd() })
setupTouch(canvas, (dir)=>{ game.step(dir); updateUI(); saveState(); checkEnd() })

const saved = getGameState()
if(saved){
  try { (game as any).board.loadFrom(saved.cells); (game as any).score = saved.score; game.render(); updateUI() }
  catch { game.newGame(); updateUI() }
} else {
  game.newGame(); updateUI()
}



function saveState(){ const snap = (game as any).snapshot(); setGameState(snap) }
function checkEnd(){
  if ((game as any).inputLocked) return
  if (!(game as any)['board'].canMove()){
    setTimeout(()=>{
      showGameOver(lang, (game as any).score).then(res => {
        clearGameState()
        if(res==='new'){ game.newGame(); updateUI() }
      })
    }, 20)
  }
}

// --- PWA SW registration (seguro para itch.io) ---
const isProd = (import.meta as any).env?.PROD === true
function inIframe(){ try { return window.self !== window.top } catch { return true } }
function ensurePWABanner(){
  if (!inIframe()) return
  if (document.getElementById('pwaBanner')) return
  const div = document.createElement('div')
  div.id = 'pwaBanner'
  div.style.cssText = `
    position: fixed; right: 12px; bottom: 12px; z-index: 9999;
    background: #0f1720; border: 1px solid #1a2330; color: #e6f1ff;
    padding: 10px 12px; border-radius: 12px; box-shadow: 0 10px 24px rgba(0,0,0,.25);
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size: 14px;
    display: flex; gap: 10px; align-items: center;
  `
  div.innerHTML = `
    <span>Para instalar como app, abra fora do iframe.</span>
    <button id="openStandalone" style="
      padding: 8px 10px; border-radius: 10px; border: 1px solid #253140;
      background: linear-gradient(180deg,#39c0ff,#2aa8e2); color: #02131c; font-weight: 800; cursor: pointer;
    ">Abrir versão PWA</button>
  `
  document.body.appendChild(div)
  const btn = document.getElementById('openStandalone') as HTMLButtonElement
  btn.addEventListener('click', () => { window.open(location.href, '_blank', 'noopener') })
}

if ('serviceWorker' in navigator) {
  if (isProd && !inIframe()) {
    (async () => {
      try {
        await navigator.serviceWorker.register('sw.js')
      } catch (err) {
        console.warn('SW register failed:', err)
      }
    })()
  } else {
    navigator.serviceWorker.getRegistrations?.().then(rs => rs.forEach(r => r.unregister()))
    if ('caches' in globalThis) {
      (caches as CacheStorage).keys().then(keys => keys.forEach(k => (caches as CacheStorage).delete(k)))
    }
    ensurePWABanner()
  }
} else {
  ensurePWABanner()
}

// --- Ads (configure aqui) ---
const ads = new AdsManager({
  // Troque para 'adsense' e preencha IDs para produção
  network: 'adsense', // 'none' | 'adsense' | 'custom'
  adsenseClientId: 'ca-pub-8826867524630571',
  adsenseBannerSlotId: '2306720556',
  mobileFrequency: 3, // a cada 3 novas partidas no mobile
})

// Banner desktop (só carrega se houver painel visível)
ads.initDesktopBanner()
