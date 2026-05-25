import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLocationContext } from '@/contexts/LocationContext';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';

interface LocationDisplayProps {
  variant?: 'splash' | 'header';
  onClick?: () => void;
}

const LocationDisplay = React.memo(({ variant = 'header', onClick }: LocationDisplayProps) => {
  const { shortName, fullAddress, loading, isRefreshing, permissionDenied } = useLocationContext();
  const isDark = useIsDarkMode() || variant === 'splash'; // Splash is always dark

  const textColor = isDark ? 'text-white' : 'text-black';
  const mutedTextColor = isDark ? 'text-white/60' : 'text-black/60';
  const iconColor = isDark ? '#FFFFFF' : '#5260FE';

  if (loading && !shortName) {
    return (
      <div className="flex flex-col gap-1 w-full max-w-[250px]">
        <div className="flex items-center gap-1">
          <MapPin size={16} color={iconColor} />
          <Skeleton width={100} height={16} baseColor={isDark ? '#222' : '#ebebeb'} highlightColor={isDark ? '#444' : '#f5f5f5'} />
        </div>
        <Skeleton width={180} height={12} baseColor={isDark ? '#222' : '#ebebeb'} highlightColor={isDark ? '#444' : '#f5f5f5'} />
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <button onClick={onClick} className="flex flex-col gap-1 text-left w-full max-w-[250px]">
        <div className="flex items-center gap-1">
          <MapPin size={16} color={iconColor} />
          <span className={`text-[14px] font-bold font-satoshi tracking-wider uppercase ${textColor}`}>
            Set Location
          </span>
          {variant === 'header' && <ChevronDown className={`w-4 h-4 shrink-0 ${textColor}`} />}
        </div>
        <span className={`text-[12px] font-medium truncate w-full block ${mutedTextColor}`}>
          Location permission denied
        </span>
      </button>
    );
  }

  return (
    <button onClick={onClick} className={`flex flex-col gap-1 text-left w-full ${variant === 'header' ? 'max-w-[70%]' : 'max-w-full'}`}>
      <div className="flex items-center gap-1 relative">
        <MapPin size={16} color={iconColor} />
        <div className="relative overflow-hidden h-[20px] flex items-center">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={shortName || 'unknown'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className={`text-[14px] font-bold font-satoshi tracking-wider uppercase ${textColor}`}
            >
              {shortName || 'Unknown Location'}
            </motion.span>
          </AnimatePresence>
        </div>
        {variant === 'header' && <ChevronDown className={`w-4 h-4 shrink-0 ${textColor}`} />}
        
        {/* Subtle Shimmer for Stale Cache Refreshing */}
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse ml-1"
          />
        )}
      </div>

      <div className="relative overflow-hidden h-[16px] flex items-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={fullAddress || 'unknown'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-[12px] font-medium truncate w-full block ${mutedTextColor}`}
          >
            {fullAddress || 'Fetching details...'}
          </motion.span>
        </AnimatePresence>
      </div>
    </button>
  );
});

LocationDisplay.displayName = 'LocationDisplay';
export default LocationDisplay;
