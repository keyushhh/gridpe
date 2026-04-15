import { Badge } from '@capawesome/capacitor-badge';

export const setBadge = async (count: number) => {
  try {
    if (count > 0) {
      await Badge.set({ count });
    } else {
      await Badge.clear();
    }
  } catch (e) {
    // silently fail if not supported or permission denied
    console.warn('Failed to set app badge', e);
  }
};
