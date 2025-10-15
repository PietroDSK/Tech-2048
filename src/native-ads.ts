import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  RewardInterstitialAdOptions,
} from '@capacitor-community/admob'

import { Capacitor } from '@capacitor/core'

const TEST_BANNER_UNIT = 'ca-app-pub-3940256099942544/6300978111'
const TEST_INTERSTITIAL_UNIT = 'ca-app-pub-3940256099942544/1033173712'

const KEY_ATTEMPTS = 'tech2048_mobile_attempts'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function initAdMob() {
  if (!isNative()) return
  // Em produção: coloque initializeForTesting: false
  await AdMob.initialize({ initializeForTesting: false })
  // (sem setRequestConfiguration aqui)
}

export async function showBannerBottom(unitId?: string) {
  if (!isNative()) return
  const options: BannerAdOptions = {
    adId: 'ca-app-pub-8826867524630571/7466971879',
    adSize: BannerAdSize.SMART_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
  }
  await AdMob.showBanner(options)
}

export async function hideBanner() {
  if (!isNative()) return
  try { await AdMob.hideBanner() } catch {}
}

export async function maybeShowInterstitialEvery(freq = 3, unitId?: string) {
  if (!isNative()) return
  const n = (parseInt(localStorage.getItem(KEY_ATTEMPTS) ?? '0', 10) || 0) + 1
  localStorage.setItem(KEY_ATTEMPTS, String(n))
  if (n % freq !== 0) return

  const opts: RewardInterstitialAdOptions = { adId: 'ca-app-pub-8826867524630571/6669912483' }
  await AdMob.prepareInterstitial(opts)
  await AdMob.showInterstitial()
}
