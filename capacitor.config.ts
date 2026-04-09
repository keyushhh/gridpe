import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAPACITOR_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.gridpe.customer',
  appName: 'Grid.Pe',
  webDir: 'dist',
  ...(isDev && {
    server: {
      url: 'http://Z390.local:8080',
      cleartext: true
    }
  })
};

export default config;