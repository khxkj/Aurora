import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.khxkj.aurora',
  appName: 'AURORA',
  webDir: 'dist',
  server: {
    // Load packaged files (not a remote URL)
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#05070f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    // Native HTTP so AI calls work on iPhone (bypasses WebView CORS)
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
