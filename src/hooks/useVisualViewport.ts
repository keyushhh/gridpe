import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useVisualViewport = () => {
  const [viewportHeight, setViewportHeight] = useState<number>(window.innerHeight);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Fallback if visualViewport is not supported
    if (!window.visualViewport) return;

    let rafId: number;

    const handleResize = () => {
      if (!window.visualViewport) return;

      // Use requestAnimationFrame to smooth out the rapid resize events
      // and prevent Layout Thrashing
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const currentHeight = window.visualViewport!.height;
        const screenHeight = window.innerHeight;
        
        // If the visual viewport is significantly smaller than the innerHeight,
        // it usually means the software keyboard is open.
        const isKeyboardVisible = currentHeight < screenHeight * 0.85;

        setViewportHeight(currentHeight);
        setIsKeyboardOpen(isKeyboardVisible);
      });
    };

    // Initial check
    handleResize();

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  return { viewportHeight, isKeyboardOpen };
};
