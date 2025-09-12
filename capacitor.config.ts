import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.crowstudios.tech2048',
  appName: '2048 tech',
  android: { allowMixedContent: false},
  webDir: 'dist'
};

export default config;
