import { useEffect } from 'react';

// Global registry of active close handlers for bottom sheets and modals.
// These are executed in LIFO (Last In, First Out) order when a back button
// or back-swipe is detected.
const closeHandlers: (() => void)[] = [];

export const registerBackCloseHandler = (onClose: () => void) => {
  if (!closeHandlers.includes(onClose)) {
    closeHandlers.push(onClose);
  }
};

export const unregisterBackCloseHandler = (onClose: () => void) => {
  const index = closeHandlers.indexOf(onClose);
  if (index !== -1) {
    closeHandlers.splice(index, 1);
  }
};

export const handleBackButtonGesture = (): boolean => {
  if (closeHandlers.length > 0) {
    const handler = closeHandlers[closeHandlers.length - 1];
    handler();
    return true; // Successfully intercepted and handled
  }
  return false; // No modal/sheet was active
};

/**
 * Custom hook to intercept back button presses and back swipe gestures
 * to cleanly dismiss the bottom sheet/modal without leaving the page.
 */
export const useBackButtonHandler = (isOpen: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!isOpen) return;

    // Push a dummy state to history to intercept native popstate/back-swipe
    const stateId = { modalOpen: true, timestamp: Date.now() };
    window.history.pushState(stateId, '');

    const handlePopState = (e: PopStateEvent) => {
      // The back button / swipe back gesture was fired natively
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    registerBackCloseHandler(onClose);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      unregisterBackCloseHandler(onClose);

      // Clean up the dummy state if we're closing via direct user interaction (e.g., backdrop click)
      if (window.history.state && window.history.state.modalOpen) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
};
