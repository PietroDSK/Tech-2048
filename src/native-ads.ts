// src/native-ads.ts
import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  BannerAdOptions, BannerAdPosition, BannerAdSize,
  BannerAdPluginEvents, BannerAd,
  InterstitialAd, InterstitialAdOptions
} from '@capacitor-community/admob'

const TEST_BANNER_UNIT = 'ca-app-pub-3940256099942544/6300978111'
const TEST_INTERSTITIAL_UNIT = 'ca-app-pub-3940256099942544/1033173712'

const KEY_ATTEMPTS = 'tech2048_mobile_attempts'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function initAdMob() {
  if (!isNative()) return
  await AdMob.initialize({ initializeForTesting: true }) // REMOVER em produção
}

export async function showBannerBottom(unitId?: string) {
  if (!isNative()) return
  const options: BannerAdOptions = {
    adId: unitId ?? TEST_BANNER_UNIT,
    adSize: BannerAdSize.SMART_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
  }
  const { adId } = await BannerAd.show(options)
  // listeners opcionais
  BannerAd.addListener(BannerAdPluginEvents.Loaded, () => {})
  BannerAd.addListener(BannerAdPluginEvents.SizeChanged, () => {})
  return adId
}

export async function hideBanner() {
  if (!isNative()) return
  try { await BannerAd.hide() } catch {}
}

export async function maybeShowInterstitialEvery(freq = 3, unitId?: string) {
  if (!isNative()) return
  const n = (parseInt(localStorage.getItem(KEY_ATTEMPTS) ?? '0', 10) || 0) + 1
  localStorage.setItem(KEY_ATTEMPTS, String(n))
  if (n % freq !== 0) return
  const opts: InterstitialAdOptions = { adId: unitId ?? TEST_INTERSTITIAL_UNIT }
  await InterstitialAd.load(opts)
  await InterstitialAd.show()
}
