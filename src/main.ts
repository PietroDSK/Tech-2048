import Phaser from "phaser";
import { Capacitor } from "@capacitor/core";

// Scenes (ajuste conforme seu projeto)
import MenuScene from "./scenes/MenuScene";
import GameScene from "./scenes/GameScene";
import OptionsScene from "./scenes/OptionsScene";
import ThemeScene from "./scenes/ThemeScene";

// AdMob wrappers
import {
  initializeAds,
  prepareInterstitial,
  prepareRewarded,
  setAdConfig,
} from "./ads/ads";

/**
 * Boot do app.
 * - Inicializa AdMob (apenas em nativo)
 * - Pré-carrega interstitial e rewarded
 * - Sobe Phaser
 */
async function boot() {
  // Config de anúncios (troque os IDs no release)
  setAdConfig({
    // interstitialId: "ca-app-pub-XXXX/YYYY",
    // rewardedId: "ca-app-pub-XXXX/ZZZZ",
    testMode: true,          // => deixe false no release
    requestConsent: true,    // UMP (consentimento) quando aplicável
    // forceEEA: true,       // use só para testar fluxo de consentimento
    // testDeviceIds: ["HASH_DO_DEVICE"],
  });

  if (Capacitor.isNativePlatform()) {
    // 1) Inicializa o SDK + UMP/Tracking (iOS) de forma segura
    await initializeAds();

    // 2) Pré-carrega os formatos que você usa no jogo
    await Promise.all([
      prepareInterstitial(),
      prepareRewarded(),
    ]);
  }

  // 3) Sobe o Phaser
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 480,
    height: 800,
    backgroundColor: "#0b0f14",
    parent: "app",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scene: [
      MenuScene,
      OptionsScene,
      ThemeScene,
      GameScene,
    ],
  };

  new Phaser.Game(config);
}

boot();
