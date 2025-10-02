// src/ads/ads.ts
import {
  AdMob,
  AdOptions,
  InterstitialAdPluginEvents,
  RewardAdOptions,
  RewardAdPluginEvents,
  AdLoadInfo,
  AdMobRewardItem,
  AdmobConsentStatus,
  AdmobConsentDebugGeography,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

/**
 * Configuração dos IDs de anúncio.
 * Troque pelos IDs reais antes de publicar.
 */
type AdConfig = {
  interstitialId: string;
  rewardedId: string;
  testMode?: boolean;
  // Consentimento (UMP)
  requestConsent?: boolean;
  forceEEA?: boolean; // força simulação EEA para testes
  testDeviceIds?: string[];
};

const DEFAULT_CFG: AdConfig = {
  // IDs de TESTE do Google (seguro para desenvolvimento)
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
  testMode: true,
  requestConsent: true,
};

let CFG: AdConfig = { ...DEFAULT_CFG };

// Estado interno
let listenersAttached = false;
let interstitialReady = false;
let rewardedReady = false;
const rewardCallbacks = new Set<() => void>();

/** No web/PWA, tudo é no-op. */
const IS_NATIVE = Capacitor.isNativePlatform();

function attachListenersOnce() {
  if (!IS_NATIVE || listenersAttached) return;
  listenersAttached = true;

  AdMob.addListener(InterstitialAdPluginEvents.Loaded, (_info: AdLoadInfo) => {
    interstitialReady = true;
  });
  AdMob.addListener(RewardAdPluginEvents.Loaded, (_info: AdLoadInfo) => {
    rewardedReady = true;
  });
  AdMob.addListener(RewardAdPluginEvents.Rewarded, (_r: AdMobRewardItem) => {
    // Dispara callbacks registrados
    for (const cb of rewardCallbacks) {
      try {
        cb();
      } catch {
        // ignora erros do callback
      }
    }
  });
}

/**
 * Opcional: inicialização e consentimento (UMP).
 * Chame uma vez no bootstrap do app (ex.: src/main.ts).
 */
export async function initializeAds(opts?: Partial<AdConfig>) {
  if (!IS_NATIVE) return;
  if (opts) setAdConfig(opts);

  attachListenersOnce();

  await AdMob.initialize();

  // iOS: tracking authorization
  try {
    const tracking = await AdMob.trackingAuthorizationStatus();
    if (tracking.status === 'notDetermined') {
      await AdMob.requestTrackingAuthorization();
    }
  } catch {
    // silencioso: Android não precisa disso
  }

  // UMP / consentimento (UE/UK)
  if (CFG.requestConsent) {
    try {
      const consentInfo = await AdMob.requestConsentInfo({
        debugGeography: CFG.forceEEA
          ? AdmobConsentDebugGeography.EEA
          : undefined,
        testDeviceIdentifiers: CFG.testDeviceIds,
      });
      if (consentInfo.isConsentFormAvailable &&
          consentInfo.status === AdmobConsentStatus.REQUIRED) {
        await AdMob.showConsentForm();
      }
    } catch {
      // não bloqueia inicialização se UMP falhar
    }
  }
}

/** Permite alterar IDs/flags em runtime (antes de preparar anúncios). */
export function setAdConfig(cfg: Partial<AdConfig>) {
  CFG = { ...CFG, ...cfg };
}

/**
 * --- INTERSTITIAL ---
 */
export async function prepareInterstitial(adId?: string): Promise<void> {
  if (!IS_NATIVE) return;
  attachListenersOnce();
  interstitialReady = false;

  const options: AdOptions = {
    adId: adId ?? CFG.interstitialId,
    // `isTesting` não é necessário se você usar os ad units de teste
    // mas manter `testMode` evita surpresas se alguém trocar os IDs:
    isTesting: CFG.testMode,
  };
  await AdMob.prepareInterstitial(options);
}

export async function showInterstitialIfReady(): Promise<boolean> {
  if (!IS_NATIVE) return false;
  if (!interstitialReady) return false;

  await AdMob.showInterstitial();
  interstitialReady = false;

  // opcional: já prepara próxima
  prepareInterstitial().catch(() => {});
  return true;
}

/**
 * --- REWARDED VIDEO ---
 */
export async function prepareRewarded(adId?: string): Promise<void> {
  if (!IS_NATIVE) return;
  attachListenersOnce();
  rewardedReady = false;

  const options: RewardAdOptions = {
    adId: adId ?? CFG.rewardedId,
    isTesting: CFG.testMode,
  };
  await AdMob.prepareRewardVideoAd(options);
}

export async function showRewardedIfReady(): Promise<boolean> {
  if (!IS_NATIVE) return false;
  if (!rewardedReady) return false;

  await AdMob.showRewardVideoAd();
  rewardedReady = false;

  // opcional: já prepara próxima
  prepareRewarded().catch(() => {});
  return true;
}

/**
 * onReward: registra um callback para quando o usuário concluir
 * um rewarded e ganhar a recompensa.
 *
 * Uso:
 *   const off = onReward(() => giveUndo());
 *   // ...para remover depois:
 *   off();
 */
export function onReward(cb: () => void): () => void {
  rewardCallbacks.add(cb);
  return () => rewardCallbacks.delete(cb);
}

/**
 * Helpers de inspeção (úteis em debug/telemetria)
 */
export function isInterstitialReady() {
  return interstitialReady;
}
export function isRewardedReady() {
  return rewardedReady;
}
