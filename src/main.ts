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
import ModesScene from "./scenes/ModesScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { BootScene } from "./scenes/BootScene";

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
    testMode: true, // => deixe false no release
    requestConsent: true, // UMP (consentimento) quando aplicável
    // forceEEA: true,       // use só para testar fluxo de consentimento
    // testDeviceIds: ["HASH_DO_DEVICE"],
  });

  if (Capacitor.isNativePlatform()) {
    // 1) Inicializa o SDK + UMP/Tracking (iOS) de forma segura
    await initializeAds();

    // 2) Pré-carrega os formatos que você usa no jogo
    await Promise.all([prepareInterstitial(), prepareRewarded()]);
  }

  const DPR = Math.min(window.devicePixelRatio || 1, 2); // 2 já resolve a maioria dos blurs

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
      width: 390, // ou 360x640, defina sua base
      height: 780,
      zoom: 1, // deixe o Phaser controlar o ajuste
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true, // evite arredondar no render global
    },
    resolution: DPR,
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scene: [PreloadScene,MenuScene, OptionsScene, ThemeScene, GameScene,ModesScene],
  };

  new Phaser.Game(config);
}

boot();
