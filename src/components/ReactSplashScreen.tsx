import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationDisplay from './LocationDisplay';
import { useLocationStore } from '@/store/useLocationStore';

interface ReactSplashScreenProps {
  onComplete: () => void;
}

const MIN_SPLASH_TIME = 2200;
const MAX_SPLASH_TIME = 3200;

export const ReactSplashScreen: React.FC<ReactSplashScreenProps> = ({ onComplete }) => {
  const initialized = useLocationStore((state) => state.initialized);
  const loading = useLocationStore((state) => state.loading);
  const shortName = useLocationStore((state) => state.shortName);
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
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A12] text-white safe-top safe-bottom"
        >
          {/* Main Content Area shifted slightly up */}
          <div className="flex flex-col items-center justify-center -mt-24 space-y-8 w-full px-8">
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            >
              <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold font-satoshi tracking-tight">Grid.Pe</h1>
              </div>
            </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
               className="w-full flex justify-center"
            >
              <LocationDisplay variant="splash" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReactSplashScreen;
