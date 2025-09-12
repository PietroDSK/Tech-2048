import { Capacitor } from '@capacitor/core'
import {
  AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize,
  BannerAdPluginEvents, BannerAd, InterstitialAd, InterstitialAdOptions
} from '@capacitor-community/admob'

const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713'
const TEST_BANNER_UNIT = 'ca-app-pub-3940256099942544/6300978111'
const TEST_INTERSTITIAL_UNIT = 'ca-app-pub-3940256099942544/1033173712'

const KEY_ATTEMPTS = 'tech2048_mobile_attempts'

export async function isNative(): Promise<boolean> {
  return Capacitor.isNativePlatform()
}

export async function initAdMob() {
  if (!Capacitor.isNativePlatform()) return
  // Em DEV: initializeForTesting true (remove em prod)
  await AdMob.initialize({ initializeForTesting: true })
  // (Opcional) tracking authorization para iOS; no Android ignora
}

let bannerId: string | null = null

export async function showBannerBottom(unitId?: string) {
  if (!Capacitor.isNativePlatform()) return
  // Ocupa largura da tela (smart banner)
  const options: BannerAdOptions = {
    adId: unitId ?? TEST_BANNER_UNIT,
    adSize: BannerAdSize.SMART_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0
  }
  const { adId } = await BannerAd.show(options)
  bannerId = adId
  // (Opcional) listeners
  BannerAd.addListener(BannerAdPluginEvents.Loaded, () => {})
  BannerAd.addListener(BannerAdPluginEvents.SizeChanged, () => {})
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform()) return
  try { await BannerAd.hide() } catch {}
  bannerId = null
}

export async function maybeShowInterstitialEvery(freq=3, unitId?: string) {
  if (!Capacitor.isNativePlatform()) return
  const n = (parseInt(localStorage.getItem(KEY_ATTEMPTS) ?? '0', 10) || 0) + 1
  localStorage.setItem(KEY_ATTEMPTS, String(n))
  if (n % freq !== 0) return

  const opts: InterstitialAdOptions = {
    adId: unitId ?? TEST_INTERSTITIAL_UNIT,
  }
  await InterstitialAd.load(opts)
  await InterstitialAd.show()
}
