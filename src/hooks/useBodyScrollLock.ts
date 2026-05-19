import { useEffect } from 'react';

/**
 * Custom hook to completely lock the body scroll when a bottom sheet or modal is open.
 * Uses position: fixed on the body to prevent any background scroll bleed, especially on iOS/Safari.
 */
export const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (!isLocked) return;

    // Save original styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    // Save current scroll position to restore it later
    const scrollY = window.scrollY;

    // Apply strict scroll lock
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;

    return () => {
      // Restore original styles
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = '';

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
};
