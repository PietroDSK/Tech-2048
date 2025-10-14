// src/privacy/consent.ts
import { Capacitor } from '@capacitor/core';

export async function showPrivacyOptions(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // Chama o plugin nativo (definido abaixo)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { UmpConsent } = (window as any).Capacitor.Plugins;
    try {
      await UmpConsent.showPrivacyOptionsForm();
    } catch (err) {
      console.warn('Privacy options indisponível ou não requerida:', err);
    }
  } else {
    // Web (Funding Choices / Privacy & Messaging JS API)
    // A chamada deve ir na callbackQueue
    (window as any).googlefc = (window as any).googlefc || {};
    (window as any).googlefc.callbackQueue = (window as any).googlefc.callbackQueue || [];
    (window as any).googlefc.callbackQueue.push(() => {
      try {
        (window as any).googlefc.showRevocationMessage();
      } catch (err) {
        console.warn('Falha ao reabrir consentimento (web):', err);
      }
    });
  }
}
