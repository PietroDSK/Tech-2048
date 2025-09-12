// src/native-ads.ts
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  type AdMobBannerSize,
  AdmobConsentStatus,
} from '@capacitor-community/admob';

/** Chame isso no boot do app (ex.: main.ts) */
export async function initAds() {
  if (Capacitor.getPlatform() === 'web') return; // TWA/PWA não tem camada nativa
  await AdMob.initialize();

  // (Opcional) GDPR/UMP: solicita/mostra consentimento quando necessário
  const consentInfo = await AdMob.requestConsentInfo();
  if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
    await AdMob.showConsentForm();
  }
}

/** Mostra um banner fixo. Use seu adUnitId real aqui. */
export async function showBanner(adUnitId: string) {
  if (Capacitor.getPlatform() === 'web') return;

  // Ajusta o padding da UI conforme a altura do banner
  AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: AdMobBannerSize) => {
    document.body.style.paddingBottom = `${size.height}px`;
  });

  const options: BannerAdOptions = {
    adId: adUnitId,
    adSize: BannerAdSize.ADAPTIVE_BANNER,    // ou BannerAdSize.BANNER
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    // isTesting: true, // habilite em dev
    // npa: true,       // non-personalized ads se precisar
  };

  await AdMob.showBanner(options);
}

export async function hideBanner() {
  if (Capacitor.getPlatform() === 'web') return;
  await AdMob.hideBanner();
}

export async function removeBanner() {
  if (Capacitor.getPlatform() === 'web') return;
  document.body.style.paddingBottom = '0px';
  await AdMob.removeBanner();
}
