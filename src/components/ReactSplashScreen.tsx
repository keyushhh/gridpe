import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationDisplay from './LocationDisplay';
import { useLocationContext } from '@/contexts/LocationContext';

interface ReactSplashScreenProps {
  onComplete: () => void;
}

const MIN_SPLASH_TIME = 1500;
const MAX_SPLASH_TIME = 2500;

export const ReactSplashScreen: React.FC<ReactSplashScreenProps> = ({ onComplete }) => {
  const { initialized, loading, shortName } = useLocationContext();
  const [isVisible, setIsVisible] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const evaluateDismissal = () => {
      const elapsed = Date.now() - startTime;
      const timeRemainingForMin = Math.max(0, MIN_SPLASH_TIME - elapsed);
      
      // If we have a location (cached or fresh) OR we've hit max time
      if ((initialized && !loading && shortName) || elapsed >= MAX_SPLASH_TIME) {
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, timeRemainingForMin);
      } else {
        // Still waiting for location, setup max timeout fallback
        const maxTimeRemaining = Math.max(0, MAX_SPLASH_TIME - elapsed);
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, maxTimeRemaining);
      }
    };

    evaluateDismissal();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initialized, loading, shortName, startTime]);

  // Notify parent after animation completes
  const handleAnimationComplete = () => {
    if (!isVisible) {
      onComplete();
    }
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          key="react-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col justify-between items-center bg-[#0A0A12] text-white safe-top safe-bottom"
        >
          {/* Top spacer */}
          <div className="flex-1" />

          {/* Center Logo Area */}
          <div className="flex flex-col items-center justify-center animate-pulse">
            <h1 className="text-4xl font-bold font-satoshi tracking-tight">Grid.Pe</h1>
          </div>

          {/* Bottom Location Area */}
          <div className="flex-1 flex flex-col justify-end w-full px-8 pb-12">
            <LocationDisplay variant="splash" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReactSplashScreen;
