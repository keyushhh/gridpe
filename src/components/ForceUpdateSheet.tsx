import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { ASSETS } from '@/constants/assets';

interface ForceUpdateSheetProps {
  storeUrl: string;
  onClose?: () => void;
}

const ForceUpdateSheet: React.FC<ForceUpdateSheetProps> = ({ storeUrl, onClose }) => {
  const isDarkMode = useIsDarkMode();
  const isDev = import.meta.env?.DEV;
  const [isUpdating, setIsUpdating] = useState(false);

  // Block Android hardware back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = App.addListener('backButton', () => {
      // Do nothing — block back button when force update is showing
    });
    return () => {
      handler.then(h => h.remove());
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // @ts-ignore - Bypass TS error in this Capacitor version
      await App.openUrl({ url: storeUrl });
    } catch (e) {
      console.error('Failed to open store URL:', e);
    }
    // Reset after 3s in case user cancels from store
    setTimeout(() => {
      setIsUpdating(false);
    }, 3000);
  };

  const mainBg = isDarkMode ? ASSETS.BG_DARK_MODE : ASSETS.BG_LIGHT;

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999998,
        display: 'flex',
        justifyContent: 'center',
        background: isDarkMode ? '#0a0a12' : '#FFFFFF',
      }}>
        {isDev && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-[9999999] bg-red-500 text-white px-4 py-2 rounded-full font-bold cursor-pointer"
          >
            Close (Dev)
          </button>
        )}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          height: '100%',
          overflow: 'hidden',
        }}>
          {/* FULL SCREEN BACKDROP */}
          <div 
            className="absolute inset-0 pointer-events-auto"
            style={{ 
              backgroundImage: `url(${mainBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />

          {/* Overlay to ensure readability */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          />

          {/* LOGO + TAGLINE */}
          <div 
            className="absolute left-1/2 top-[18%] flex flex-col items-center pointer-events-none"
            style={{ transform: 'translateX(-50%)', width: '100%' }}
          >
            <img src={ASSETS.GRIDPE_LOGO} alt="grid.pe" className={`h-12 mb-3 ${isDarkMode ? 'dark:invert-0' : 'invert'}`} />
            <p className={`text-[18px] font-normal text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Cash access, reimagined.
            </p>
          </div>

          {/* Sheet Container */}
          <div
            className="absolute bottom-0 left-0 right-0 z-[999999] w-full pointer-events-auto flex flex-col items-center"
            style={{
              animation: 'slideUpSpring 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
        <div 
          className="w-[362px] flex flex-col items-center"
          style={{
            backgroundColor: isDarkMode ? '#131313' : '#FFFFFF',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* Inner Content */}
          <div className="w-full flex flex-col items-center px-[16px] pb-[32px] pt-[52px]">
            {/* Image */}
            <img 
              src={isDarkMode ? ASSETS.FORCE_UPDATE_DARK : ASSETS.FORCE_UPDATE_LIGHT} 
              alt="Update available" 
              className="w-[183px] h-[139px] object-contain"
            />

            {/* NEW UPDATE IS AVAILABLE */}
            <p 
              className="mt-[15px] text-[12px] font-satoshi font-bold text-[#999999] uppercase"
              style={{ letterSpacing: '0.05em' }}
            >
              NEW UPDATE IS AVAILABLE
            </p>

            {/* Headline */}
            <h2 
              className={`mt-[11px] text-[22px] font-satoshi font-bold text-center w-[290px] ${isDarkMode ? 'text-[#FFFFFF]' : 'text-[#191711]'}`}
              style={{ lineHeight: '1.2' }}
            >
              Update your application to the latest version
            </h2>

            {/* Subtext */}
            <p 
              className={`mt-[23px] text-[14px] font-satoshi font-regular text-center px-2 ${isDarkMode ? 'text-[#FFFFFF]' : 'text-[#191711]'}`}
              style={{ opacity: 0.8 }}
            >
              A brand new version of our app is available to download. Please update your app to use all of our amazing features.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleUpdate}
              className="mt-[44px] w-[331px] h-[48px] rounded-full flex items-center justify-center text-white font-satoshi font-bold text-[16px] transition-opacity active:opacity-80"
              style={{ backgroundColor: '#5260FE' }}
            >
              {isUpdating ? 'Opening Store...' : 'Update Now'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Inline styles for animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUpSpring {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
        </div>
      </div>
    </>
  );
};

export default ForceUpdateSheet;
