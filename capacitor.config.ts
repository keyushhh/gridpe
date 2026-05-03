import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig & {
  ios?: { allowsBackForwardNavigationGestures?: boolean; contentInset?: string },
} = {
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
    // Disable native WebView scroll — the React app owns scrolling, and a
    // native scroll layer over `position: fixed` containers causes the
    // keyboard-resize layout jump on iOS.
    scrollEnabled: false,
    // Always inset content under safe areas, so the WebView doesn't shift
    // when the keyboard / status bar resizes the viewport.
    contentInset: 'always'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
    SystemBars: {
      insetsHandling: 'disable'
    },
    SplashScreen: {
      backgroundColor: '#0A0A12',
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;