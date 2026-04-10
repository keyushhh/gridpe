import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig & { ios?: { allowsBackForwardNavigationGestures?: boolean } } = {
  appId: 'com.gridpe.customer',
  appName: 'Grid.Pe',
  webDir: 'dist',
  server: {
    url: 'http://192.168.29.138:8080',
    cleartext: true,
    androidScheme: 'https'
  },
  ios: {
    allowsLinkPreview: true,
    handleApplicationNotifications: true,
    allowsBackForwardNavigationGestures: true
  }
};

export default config;