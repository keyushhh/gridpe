import { ASSETS } from '@/constants/assets';
import React, { useEffect, useState } from 'react';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import { X } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useSafeArea } from '@/hooks/useSafeArea';
const GlobalCustomToaster: React.FC = () => {
  const { isVisible, message, type, hideToaster } = useCustomToaster();
  const isDarkMode = useIsDarkMode();
  const { bottom: bottomInset } = useSafeArea();
  const [progress, setProgress] = useState(0);
  const duration = 4000; // 4 seconds to match loader animation spec
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    if (isVisible) {
      if (type === 'error' || type === 'delete') {
        hapticError();
      } else if (type === 'success') {
        hapticSuccess();
      }
      setProgress(0);
      const startTime = Date.now();
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);
      }, 10);
      timer = setTimeout(() => {
        hideToaster();
      }, duration);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [isVisible, message, type, hideToaster, duration]);
  if (!isVisible) return null;
  const getIcon = () => {
    switch (type) {
      case 'success':
        return isDarkMode ? ASSETS.SUCCESS : ASSETS.CHECK_ICON_LIGHT;
      case 'error':
        return isDarkMode ? ASSETS.FAILED : ASSETS.FAILED_LIGHT;
      case 'delete':
        return ASSETS.TRASH_DELETE;
      default:
        return isDarkMode ? ASSETS.SUCCESS : ASSETS.CHECK_ICON_LIGHT;
    }
  };
  const getRadialGradient = () => {
    if (type === 'success') {
      return isDarkMode
        ? 'radial-gradient(50% 50% at 50% 50%, rgba(0, 237, 81, 0.12) 0%, rgba(0, 237, 123, 0) 100%)'
        : 'radial-gradient(50% 50% at 50% 50%, rgba(12, 126, 75, 0.1) 0%, rgba(12, 126, 75, 0) 100%)';
    }
    if (type === 'error' || type === 'delete') {
      return isDarkMode
        ? 'radial-gradient(50% 50% at 50% 50%, rgba(240, 66, 72, 0.13) 0%, rgba(240, 66, 72, 0) 100%)'
        : 'radial-gradient(50% 50% at 50% 50%, rgba(167, 0, 0, 0.1) 0%, rgba(167, 0, 0, 0) 100%)';
    }
    return isDarkMode
      ? 'radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)'
      : 'radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 100%)';
  };
  const getLoaderColor = () => {
    if (type === 'success') return isDarkMode ? '#00ED51' : '#0C7E4B';
    if (type === 'error' || type === 'delete') return isDarkMode ? '#F04248' : '#A70000';
    return isDarkMode ? '#FFFFFF' : '#000000';
  };
  return (
    <div
      className="fixed left-0 right-0 z-[10000] flex justify-center pointer-events-none px-5"
      style={{ bottom: `calc(100px + ${bottomInset}px)` }}
    >
      <div
        className="flex items-center pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-300 relative overflow-hidden"
        style={{
          width: '362px',
          minHeight: '63px',
          borderRadius: '12px',
          backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
          border: isDarkMode ? '0.8px solid rgba(255, 255, 255, 0.16)' : '0.8px solid #E9EAEB',
          padding: '12px 14px',
          boxShadow: isDarkMode ? 'none' : '0px 8px 16px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Radial Gradient Ellipse behind icon */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '230px',
            height: '230px',
            left: '-90px', // Positioned behind the icon
            top: '50%',
            transform: 'translateY(-50%)',
            background: getRadialGradient(),
            zIndex: 0,
          }}
        />
        {/* Content */}
        <div className="relative z-10 flex items-center w-full">
          <div className="flex-shrink-0 w-[35px] h-[35px] flex items-center justify-center">
            {type === 'delete' ? (
              <img loading="lazy"
                src={ASSETS.TRASH_DELETE}
                alt="Delete"
                className="w-[26px] h-[26px] object-contain"
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(11%) sepia(87%) saturate(7405%) hue-rotate(352deg) brightness(101%) contrast(114%)',
                }}
              />
            ) : (
              <img src={getIcon()} alt={type} className="w-full h-full object-contain" />
            )}
          </div>
          <div className="ml-3 flex-1">
            <span
              className={`text-[14px] font-normal font-satoshi leading-[140%] ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {message}
            </span>
          </div>
          <button
            onClick={hideToaster}
            className={`ml-2 flex-shrink-0 w-8 h-8 flex items-center justify-center transition-colors ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-black/40 hover:text-black'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Animated Loader Line */}
        <div
          className="absolute bottom-0 left-0 h-[2px]"
          style={{
            width: `${progress}%`,
            backgroundColor: getLoaderColor(),
            transition: progress === 0 ? 'none' : 'width 100ms linear',
          }}
        />
      </div>
    </div>
  );
};
export default GlobalCustomToaster;
