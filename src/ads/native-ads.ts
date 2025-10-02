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
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';

let isShowing = false;

export async function showBannerBottom(adId?: string) {
  if (!Capacitor.isNativePlatform()) return;
  if (isShowing) return; // evita chamadas duplicadas

  const options: BannerAdOptions = {
    adId: adId ?? TEST_BANNER,
    adSize: BannerAdSize.ADAPTIVE_BANNER, // se preferir: BannerAdSize.BANNER
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    // isTesting: true, // desnecessário usando ad unit de teste
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
