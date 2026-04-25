import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig & { ios?: { allowsBackForwardNavigationGestures?: boolean } } = {
  appId: 'com.gridpe.customer',
  appName: 'Grid.Pe',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    allowsLinkPreview: true,
    handleApplicationNotifications: true,
    allowsBackForwardNavigationGestures: true,
    scrollEnabled: true
  },
  android: {
    backgroundColor: "#0A0A12",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;