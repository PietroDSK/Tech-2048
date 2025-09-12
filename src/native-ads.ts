// src/native-ads.ts
import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  InterstitialAdOptions,
} from '@capacitor-community/admob'

// Unidades de TESTE do Google (ok só em DEV)
const TEST_BANNER_UNIT = 'ca-app-pub-3940256099942544/6300978111'
const TEST_INTERSTITIAL_UNIT = 'ca-app-pub-3940256099942544/1033173712'

// Contador local para frequência de interstitial
const KEY_ATTEMPTS = 'tech2048_mobile_attempts'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function initAdMob() {
  if (!isNative()) return
  // Em produção REMOVA initializeForTesting
  await AdMob.initialize({ initializeForTesting: true })
}

export async function showBannerBottom(unitId?: string) {
  if (!isNative()) return
  const options: BannerAdOptions = {
    adId: unitId ?? TEST_BANNER_UNIT,
    adSize: BannerAdSize.SMART_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
  }
  await AdMob.showBanner(options)
}

export async function hideBanner() {
  if (!isNative()) return
  try {
    await AdMob.hideBanner()
  } catch {
    // ignora se não houver banner ativo
  }
}

export async function maybeShowInterstitialEvery(freq = 3, unitId?: string) {
  if (!isNative()) return
  const n = (parseInt(localStorage.getItem(KEY_ATTEMPTS) ?? '0', 10) || 0) + 1
  localStorage.setItem(KEY_ATTEMPTS, String(n))
  if (n % freq !== 0) return

  const opts: InterstitialAdOptions = {
    adId: unitId ?? TEST_INTERSTITIAL_UNIT,
  }
  await AdMob.prepareInterstitial(opts)
  await AdMob.showInterstitial()
}
