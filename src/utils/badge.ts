import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';

export const setBadge = async (count: number) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (count > 0) {
      await Badge.set({ count });
    } else {
      await Badge.clear();
    }
  } catch (e) {
    // silently fail if not supported or permission denied
    if (import.meta.env.DEV) console.warn('Failed to set app badge', e);
  }
};
