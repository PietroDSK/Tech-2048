import '../styles.css'
import { Game } from './game'
import { setupKeyboard, setupTouch } from './input'
import {
  getBest, setBest,
  getLabelsPref, setLabelsPref,
  getGameState, setGameState, clearGameState,
  getSoundPref, setSoundPref,
  getLangPref, setLangPref,
  type Lang
} from './storage'
import { SFX } from './sfx'
import { applyI18n } from './i18n'
import { showGameOver, ensureSettingsMenu, openSettingsMenu, closeSettingsMenu } from './ui'
import { AdsManager } from './ads'
import { isNative, initAdMob, showBannerBottom, hideBanner, maybeShowInterstitialEvery } from './native-ads'
import { ensureWebConsent, reopenConsent } from './consent'
// --- DOM refs ---
const canvas = document.getElementById('game') as HTMLCanvasElement
const scoreEl = document.getElementById('score')!
const bestEl = document.getElementById('best')!
const btnNew = document.getElementById('newGame') as HTMLButtonElement | null
const btnMenu = document.getElementById('btnMenu') as HTMLButtonElement

// --- Core ---
const sfx = new SFX()
const game = new Game(canvas); game.setSFX(sfx)

// --- Preferências iniciais ---
game.setLabels(getLabelsPref())
sfx.enabled = getSoundPref()
let lang: Lang = getLangPref()
applyI18n(lang)

function updateUI() {
  scoreEl.textContent = String(game.score)
  if (game.score > game.best) {
    game.setBest(game.score)
    setBest(game.best)
    bestEl.textContent = String(game.best)
  }
}

// --- Menu (overlay) ---
ensureSettingsMenu()
const menuOverlay = document.getElementById('menuOverlay') as HTMLDivElement
const menuLabels = document.getElementById('menuToggleLabels') as HTMLInputElement
const menuSound = document.getElementById('menuToggleSound') as HTMLInputElement
const menuLang = document.getElementById('menuLangSelect') as HTMLSelectElement
const menuNew = document.getElementById('menuNewGame') as HTMLButtonElement
const menuClose = document.getElementById('menuClose') as HTMLButtonElement

btnMenu?.addEventListener('click', () => {
  // sincroniza antes de abrir
  menuLabels.checked = (game as any).useLabels ?? false
  menuSound.checked = (sfx as any).enabled ?? true
  menuLang.value = lang
  openSettingsMenu()
})
menuOverlay?.addEventListener('click', (e) => { if (e.target === menuOverlay) closeSettingsMenu() })
menuClose?.addEventListener('click', () => closeSettingsMenu())

menuLabels?.addEventListener('change', () => {
  game.setLabels(menuLabels.checked)
  setLabelsPref(menuLabels.checked)
  game.render()
})
menuSound?.addEventListener('change', () => {
  sfx.enabled = menuSound.checked
  setSoundPref(menuSound.checked)
})
menuLang?.addEventListener('change', () => {
  lang = menuLang.value as Lang
  setLangPref(lang)
  applyI18n(lang)
})

// --- Ads (web + nativo) ---
const ads = new AdsManager({
  // Troque para 'adsense' e preencha clientId/slot se quiser usar AdSense no web
  network: 'adsense', // 'none' | 'adsense' | 'custom'
  adsenseClientId: "ca-pub-8826867524630571",
  adsenseBannerSlotId: '2306720556',
  bannerHTML: `
    <a href="https://example.com" target="_blank" rel="noopener" class="ad-box" style="display:block;text-decoration:none">
      <div class="ad-placeholder">Seu banner 300×250</div>
    </a>
  `,
  interstitialHTML: `
    <a href="https://example.com" target="_blank" rel="noopener" class="ad-box" style="display:block;text-decoration:none">
      <div class="ad-placeholder">Interstitial promo</div>
    </a>
  `,
  mobileFrequency: 3,
})

// Inicialização condicionada a plataforma
;(async () => {
  if (await isNative()) {
    // App Android (Capacitor): AdMob nativo
    await initAdMob()
    await showBannerBottom() // banner nativo no rodapé
  } else {
    // Web / navegdor: banner lateral no painel
    ads.initDesktopBanner()
  }
})()

// --- Novo jogo (do menu) com interstitial por plataforma ---
menuNew?.addEventListener('click', async () => {
  if (await isNative()) {
    await maybeShowInterstitialEvery(3) // a cada 3 partidas no Android (AdMob nativo)
  } else {
    await ads.maybeShowMobileInterstitial() // web/mobile
  }
  game.newGame()
  updateUI()
  closeSettingsMenu()
})

// --- Controles extras (se existir botão "Novo jogo" fora do menu) ---
btnNew?.addEventListener('click', async () => {
  if (await isNative()) {
    await maybeShowInterstitialEvery(3)
  } else {
    await ads.maybeShowMobileInterstitial()
  }
  game.newGame()
  updateUI()
  saveState()
})

// --- Input ---
setupKeyboard((dir) => { game.step(dir); updateUI(); saveState(); checkEnd() })
setupTouch(canvas, (dir) => { game.step(dir); updateUI(); saveState(); checkEnd() })

// --- Estado salvo ---
const saved = getGameState()
if (saved) {
  try {
    (game as any).board.loadFrom(saved.cells)
    (game as any).score = saved.score
    game.render()
    updateUI()
  } catch {
    game.newGame()
    updateUI()
  }
} else {
  game.newGame()
  updateUI()
}

function saveState() {
  const snap = (game as any).snapshot()
  setGameState(snap)
}

function checkEnd() {
  if ((game as any).inputLocked) return
  if (!(game as any)['board'].canMove()) {
    setTimeout(() => {
      showGameOver(lang, (game as any).score).then(async res => {
        clearGameState()
        if (res === 'new') {
          if (await isNative()) {
            await maybeShowInterstitialEvery(3)
          } else {
            await ads.maybeShowMobileInterstitial()
          }
          game.newGame()
          updateUI()
        }
      })
    }, 20)
  }
}

// --- PWA SW registration (seguro para itch.io e ignorado no app nativo) ---
const isProd = (import.meta as any).env?.PROD === true
function inIframe() { try { return window.self !== window.top } catch { return true } }
function ensurePWABanner() {
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

;(async () => {
  const native = await isNative()
  if ('serviceWorker' in navigator) {
    if (!native && isProd && !inIframe()) {
      try { await navigator.serviceWorker.register('sw.js') } catch (err) { console.warn('SW register failed:', err) }
    } else {
      // Em DEV, em iframe (itch) ou no app nativo → não manter SW
      navigator.serviceWorker.getRegistrations?.().then(rs => rs.forEach(r => r.unregister()))
      if ('caches' in globalThis) {
        (caches as CacheStorage).keys().then(keys => keys.forEach(k => (caches as CacheStorage).delete(k)))
      }
      if (!native) ensurePWABanner()
    }
  } else {
    if (!native) ensurePWABanner()
  }
})()

ensureWebConsent(lang, (consented) => {
  if (consented) ads.initDesktopBanner()
})

function wirePrivacyLink(currentLang: Lang) {
  const btn = document.getElementById('privacyLink')
  if (!btn) return
  btn.addEventListener('click', (ev) => {
    ev.preventDefault?.()
    reopenConsent(currentLang)
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => wirePrivacyLink(lang))
} else {
  wirePrivacyLink(lang)
}


function onLanguageChanged(newLang: Lang) {
  applyI18n(newLang)
  wirePrivacyLink(newLang)
}

