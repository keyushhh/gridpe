import { Capacitor } from '@capacitor/core';

const isWeb = Capacitor.getPlatform() === 'web';

/**
 * Returns the overflow class for a page-level container.
 * On web: allows vertical scrolling with hidden scrollbar.
 * On native: keeps overflow-hidden (existing behavior).
 */
export const useWebScroll = () => {
  return {
    isWeb,
    /** Replace 'overflow-hidden' with this on page containers */
    containerOverflow: isWeb ? 'overflow-y-auto scrollbar-hide' : 'overflow-hidden',
  };
};
