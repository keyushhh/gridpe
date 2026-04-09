import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gridpe.customer',
  appName: 'Grid.Pe',
  webDir: 'dist',
  server: {
    url: 'https://late-spiders-enjoy.loca.lt',
    cleartext: true
  }
};

export default config;
