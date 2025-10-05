import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "crowstudios.tech2048.app",
  appName: "2048 Tech",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // 0 = esconde assim que a WebView inicializar
      launchAutoHide: true,
    },
  },
};
export default config;
