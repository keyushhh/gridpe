import { Capacitor } from '@capacitor/core';

let isInitialized = false;

async function initialize(): Promise<void> {
  if (!Capacitor.isNativePlatform() || isInitialized) return;
  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    await FirebaseCrashlytics.setEnabled({ enabled: true });
    isInitialized = true;
  } catch (e) {
    // Crashlytics unavailable — fail silently, never block app startup
  }
}

async function setUser(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;
  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    await FirebaseCrashlytics.setUserId({ userId });
  } catch (e) {
    // fail silently
  }
}

async function clearUser(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;
  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    await FirebaseCrashlytics.setUserId({ userId: '' });
  } catch (e) {
    // fail silently
  }
}

async function recordError(error: Error, context?: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;
  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    if (context) {
      await FirebaseCrashlytics.setCustomKey({ key: 'context', value: context, type: 'string' });
    }
    await FirebaseCrashlytics.recordException({
      message: `${error.name}: ${error.message}`,
    });
  } catch (e) {
    // fail silently
  }
}

async function log(message: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;
  try {
    const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
    await FirebaseCrashlytics.log({ message });
  } catch (e) {
    // fail silently
  }
}

export const crashlytics = {
  initialize,
  setUser,
  clearUser,
  recordError,
  log,
} as const;
