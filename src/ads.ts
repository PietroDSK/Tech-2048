// src/ads.ts
type Network = 'none' | 'adsense' | 'custom'

export interface AdsConfig {
  network: Network
  // AdSense
  adsenseClientId?: string // ex: 'ca-pub-XXXXXXXXXXXXXXX'
  adsenseBannerSlotId?: string // opcional, se quiser usar <ins> com data-ad-slot
  // Custom HTML (fallback / testes)
  bannerHTML?: string
  interstitialHTML?: string
  // Frequência do interstitial no mobile
  mobileFrequency?: number // default: 3
}

const KEY_MOBILE_COUNT = 'tech2048_mobile_attempts'

export class AdsManager {
  cfg: AdsConfig
  constructor(cfg: AdsConfig){
    this.cfg = { mobileFrequency: 3, ...cfg }
  }

  /** Desktop: coloca/banner no #adSidebarSlot */
  initDesktopBanner(){
    const slot = document.getElementById('adSidebarSlot')
    if (!slot) return
    slot.innerHTML = ''

    if (this.cfg.network === 'adsense' && this.cfg.adsenseClientId) {
      this.injectAdSenseScriptOnce(this.cfg.adsenseClientId)
      const ins = document.createElement('ins')
      ins.className = 'adsbygoogle'
      ins.style.display = 'block'
      ins.style.width = '300px'
      ins.style.height = '250px'
      ins.setAttribute('data-ad-client', this.cfg.adsenseClientId)
      if (this.cfg.adsenseBannerSlotId) ins.setAttribute('data-ad-slot', this.cfg.adsenseBannerSlotId)
      slot.appendChild(ins)
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      return
    }

    // Fallback: HTML custom / placeholder
    slot.innerHTML = this.cfg.bannerHTML ?? `
      <div class="ad-box">
        <div class="ad-placeholder">Seu banner 300×250 aqui</div>
      </div>`
  }

  /** Mobile: incrementa contador e mostra interstitial quando chegar na frequência */
  async maybeShowMobileInterstitial(): Promise<void> {
    if (!this.isMobile()) return
    const freq = this.cfg.mobileFrequency ?? 3
    const n = (parseInt(localStorage.getItem(KEY_MOBILE_COUNT) ?? '0', 10) || 0) + 1
    localStorage.setItem(KEY_MOBILE_COUNT, String(n))
    if (n % freq !== 0) return

    // Constrói overlay se necessário
    let overlay = document.getElementById('adInterstitial') as HTMLDivElement | null
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.id = 'adInterstitial'
      overlay.className = 'modal hidden'
      overlay.innerHTML = `
        <div class="modal-dialog" role="dialog" aria-labelledby="adTitle">
          <div class="modal-header">
            <h3 id="adTitle">Publicidade</h3>
          </div>
          <div class="modal-body">
            <div id="adInterstitialSlot" class="ad-box">
              <div class="ad-placeholder">Interstitial</div>
            </div>
          </div>
          <div class="modal-actions">
            <button id="adClose" class="btn ghost">Fechar</button>
          </div>
        </div>`
      document.body.appendChild(overlay)
      // Fechar por clique fora
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeInterstitial()
      })
      document.getElementById('adClose')?.addEventListener('click', () => this.closeInterstitial())
    }

    // Alimenta conteúdo
    const slot = document.getElementById('adInterstitialSlot') as HTMLDivElement
    slot.innerHTML = ''

    if (this.cfg.network === 'adsense' && this.cfg.adsenseClientId) {
      // AdSense para web tem interstitial "Auto Ads". Como alternativa,
      // você pode usar uma DIV com criativo/HTML próprio ou outro fornecedor.
      // Aqui mantemos um placeholder por padrão:
      slot.innerHTML = this.cfg.interstitialHTML ?? `
        <div class="ad-placeholder">Interstitial (HTML custom)</div>`
      // Caso use uma lib de interstitial web, invoque-a aqui.
    } else {
      slot.innerHTML = this.cfg.interstitialHTML ?? `
        <div class="ad-placeholder">Interstitial (HTML custom)</div>`
    }

    // Mostra overlay
    overlay.classList.remove('hidden')
    overlay.classList.add('show')
    await this.wait(50)
  }

  closeInterstitial(){
    const overlay = document.getElementById('adInterstitial')
    if (!overlay) return
    overlay.classList.remove('show')
    overlay.classList.add('hidden')
  }

  private injectAdSenseScriptOnce(clientId: string){
    if (document.querySelector(`script[data-adsense="${clientId}"]`)) return
    const s = document.createElement('script')
    s.async = true
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`
    s.setAttribute('crossorigin', 'anonymous')
    s.setAttribute('data-adsense', clientId)
    document.head.appendChild(s)
  }

  private isMobile(){
    return window.matchMedia('(max-width: 899px)').matches
  }
  private wait(ms:number){ return new Promise(res => setTimeout(res, ms)) }
}
