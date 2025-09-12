// consent.ts with i18n support
// src/consent.ts
import type { Lang } from './i18n'
import { applyI18n } from './i18n'

export type ConsentChoice = 'granted' | 'denied'

export interface ConsentState {
  ad_user_data: ConsentChoice
  ad_personalization: ConsentChoice
  ad_storage: ConsentChoice
  analytics_storage: ConsentChoice
  functionality_storage: ConsentChoice
  security_storage: ConsentChoice
}

const KEY = 'tech2048_consent_v1'

export function getStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as ConsentState
  } catch {
    return null
  }
}
export function storeConsent(c: ConsentState) {
  localStorage.setItem(KEY, JSON.stringify(c))
}
export function applyConsentToGtag(c: ConsentState) {
  try {
    // @ts-ignore
    window.gtag && window.gtag('consent', 'update', {
      ad_user_data: c.ad_user_data,
      ad_personalization: c.ad_personalization,
      ad_storage: c.ad_storage,
      analytics_storage: c.analytics_storage,
      functionality_storage: c.functionality_storage,
      security_storage: c.security_storage
    })
  } catch {}
}

export function ensureWebConsent(lang: Lang, onFinalize?: (consentedForAds: boolean) => void) {
  const existing = getStoredConsent()
  if (existing) {
    applyConsentToGtag(existing)
    applyI18n(lang)
    onFinalize?.(existing.ad_storage === 'granted' && existing.ad_user_data === 'granted')
    return
  }
  openConsentModal(lang, onFinalize)
}

export function reopenConsent(lang?: Lang) {
  const overlay = document.getElementById('consentOverlay') as HTMLDivElement | null
  if (overlay) {
    overlay.classList.remove('hidden')
    overlay.classList.add('show')
    if (lang) applyI18n(lang)
    return
  }
  if (lang) openConsentModal(lang)
}

function openConsentModal(lang: Lang, onFinalize?: (consentedForAds: boolean) => void) {
  if (document.getElementById('consentOverlay')) {
    const overlay = document.getElementById('consentOverlay')!
    overlay.classList.remove('hidden')
    overlay.classList.add('show')
    applyI18n(lang)
    return
  }

  const overlay = document.createElement('div')
  overlay.id = 'consentOverlay'
  overlay.className = 'modal show'
  overlay.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-labelledby="consentTitle">
      <div class="modal-header">
        <h3 id="consentTitle" data-i18n="consent.title">Privacidade & Cookies</h3>
      </div>
      <div class="modal-body consent-body">
        <div class="consent-row">
          <div style="flex:1">
            <label data-i18n="consent.essential.title">Essenciais</label>
            <p data-i18n="consent.essential.desc">Usamos armazenamento essencial para idioma, preferências do jogo e operação básica. (Sempre ativo)</p>
          </div>
        </div>
        <div class="consent-row">
          <div style="flex:1">
            <label data-i18n="consent.analytics.title">Analíticos</label>
            <p data-i18n="consent.analytics.desc">Ajuda a entender o uso do jogo para melhorar (ex.: métricas anônimas).</p>
          </div>
          <div><input id="chkAnalytics" type="checkbox" /></div>
        </div>
        <div class="consent-row">
          <div style="flex:1">
            <label data-i18n="consent.ads.title">Publicidade</label>
            <p data-i18n="consent.ads.desc">Permite anúncios personalizados/medição. Desmarque para não personalizados ou sem anúncios.</p>
          </div>
          <div><input id="chkAds" type="checkbox" /></div>
        </div>
      </div>
      <div class="modal-actions">
        <button id="btnReject" class="btn ghost inline" data-i18n="consent.onlyEssentials">Somente essenciais</button>
        <button id="btnAccept" class="btn primary inline" data-i18n="consent.acceptAll">Aceitar tudo</button>
      </div>
    </div>`

  document.body.appendChild(overlay)
  applyI18n(lang)

  const chkAnalytics = overlay.querySelector('#chkAnalytics') as HTMLInputElement
  const chkAds = overlay.querySelector('#chkAds') as HTMLInputElement
  chkAnalytics.checked = false
  chkAds.checked = false

  const close = () => { overlay.classList.remove('show'); overlay.classList.add('hidden') }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })

  overlay.querySelector('#btnAccept')!.addEventListener('click', () => {
    const c: ConsentState = {
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      ad_storage: 'granted',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      security_storage: 'granted'
    }
    storeConsent(c); applyConsentToGtag(c); close(); onFinalize?.(true)
  })

  overlay.querySelector('#btnReject')!.addEventListener('click', () => {
    const c: ConsentState = {
      ad_user_data: chkAds.checked ? 'granted' : 'denied',
      ad_personalization: chkAds.checked ? 'granted' : 'denied',
      ad_storage: chkAds.checked ? 'granted' : 'denied',
      analytics_storage: chkAnalytics.checked ? 'granted' : 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
    }
    storeConsent(c); applyConsentToGtag(c); close(); onFinalize?.(c.ad_storage === 'granted' && c.ad_user_data === 'granted')
  })

  const reopen = document.getElementById('privacyLink')
  reopen?.addEventListener('click', () => {
    overlay.classList.remove('hidden')
    overlay.classList.add('show')
    applyI18n(lang)
  })
}
