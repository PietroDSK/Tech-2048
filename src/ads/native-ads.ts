// src/native-ads.ts
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Use um ID de teste do Google no dev. Troque no release.
const TEST_BANNER = 'ca-app-pub-8826867524630571/6669912483';
const Banner = 'ca-app-pub-8826867524630571~8330215188';
let isShowing = false;

export async function showBannerBottom(adId?: string) {
  if (!Capacitor.isNativePlatform()) return;
  if (isShowing) return; // evita chamadas duplicadas

  const options: BannerAdOptions = {
    adId: Banner,
    adSize: BannerAdSize.ADAPTIVE_BANNER, // se preferir: BannerAdSize.BANNER
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: false, // true = ID de teste
  };

  AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
    isShowing = false;
  });
  AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
    isShowing = true;
  });

  await AdMob.showBanner(options);
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform()) return;
  if (!isShowing) return;
  try {
    await AdMob.hideBanner();
  } finally {
    isShowing = false;
  }
}
