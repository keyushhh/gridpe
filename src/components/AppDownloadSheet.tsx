import React, { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import appDownloadSheetImg from '../assets/app-download-sheet.png';

let hasBeenDismissedThisSession = false;

export default function AppDownloadSheet({ forceOpen = false, onClose, onDismiss, description }: { forceOpen?: boolean, onClose?: () => void, onDismiss?: () => void, description?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = y;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startYRef.current === null) return;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = y - startYRef.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
    startYRef.current = null;
  };

  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
      setIsClosing(false);
      return;
    }

    if (hasBeenDismissedThisSession) return;

    // 1. Check if it's already been shown in this session
    const hasShown = sessionStorage.getItem('gridpe_app_prompt_shown');
    if (hasShown) return;

    // 2. Check if it's native app
    if (Capacitor.isNativePlatform()) return;

    // 3. Check if it's a mobile browser
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    const isMobile = isIOS || isAndroid;

    // Check if we are on a desktop browser that's just small, vs actual mobile
    if (!isMobile) return;

    // Show after 1.5s delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem('gridpe_app_prompt_shown', 'true');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Return null if completely hidden
  if (!isVisible && !isClosing) return null;

  const handleClose = () => {
    hasBeenDismissedThisSession = true;
    sessionStorage.setItem('gridpe_app_prompt_shown', 'true');
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose?.();
      onDismiss?.();
      window.dispatchEvent(new CustomEvent('appSheetDismissed'));
    }, 300); // match animation duration
  };

  const handleDownload = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    if (isIOS) {
      window.location.href = 'https://apps.apple.com/app/gridpe/[YOUR_APP_ID]';
    } else {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.gridpe.customer';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[99999] transition-opacity duration-300 ${isVisible && !isClosing ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      {/* Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1C20] rounded-t-[16px] z-[100000] sm:max-w-[430px] sm:mx-auto h-[466px] flex flex-col items-center ${
          dragY === 0 ? 'transition-transform duration-300 ease-out' : ''
        } ${isVisible && !isClosing ? 'translate-y-0' : 'translate-y-full'}`}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="absolute top-3 w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />

        <img loading="lazy" 
          src={appDownloadSheetImg} 
          alt="App Download" 
          className="w-[170px] h-[157px] mt-[58px]" 
        />
        
        <h2 
          className="mt-[22px] font-bold text-[22px] text-gray-900 dark:text-white leading-tight" 
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          Get the Grid.Pe App
        </h2>
        
        <p 
          className="mt-[11px] font-normal text-[14px] text-gray-600 dark:text-[#A0A0A0] w-[274px] text-center"
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          {description ?? "Faster checkout, live order tracking & instant notifications"}
        </p>
        
        <button 
          onClick={handleDownload}
          className="mt-[22px] w-[332px] h-[48px] bg-[#5260FE] text-white font-medium text-[14px] rounded-full flex items-center justify-center transition-colors hover:bg-[#404bcf]"
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          Download the app
        </button>
        
        <button 
          onClick={handleClose}
          className="mt-[11px] w-[332px] h-[48px] bg-[#2C2C2C] text-white font-medium text-[14px] rounded-full flex items-center justify-center transition-colors hover:bg-[#1a1a1a]"
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          Continue on web
        </button>
      </div>
    </>
  );
}
