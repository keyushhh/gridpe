import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import noInternetData from '../assets/no-internet.json';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useNetworkStatus } from '../utils/useNetworkStatus';

const NoInternet: React.FC = () => {
  const isDarkMode = useIsDarkMode();
  const { isReconnecting } = useNetworkStatus();

  return (
    <div className="desktop-backdrop fixed inset-0 w-full h-full" style={{ backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF' }}>
      <main 
        className="mobile-frame h-full w-full flex flex-col mx-auto relative sm:max-w-[430px] sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] sm:ring-1 sm:ring-white/10"
        style={{
          backgroundColor: isDarkMode ? '#0A0A12' : '#FFFFFF',
          transform: 'translateZ(0)',
        }}
      >
        <div
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
          className="h-full w-full flex flex-col items-center justify-center overflow-hidden"
        >
          <div 
            className="flex flex-col items-center justify-center w-full"
            style={{ 
              marginTop: '-40px',
              padding: '0 24px'
            }}
          >
            <DotLottieReact
              data={noInternetData}
              loop
              autoplay
              style={{ width: 220, height: 220, marginBottom: '8px' }}
            />
            <h1
              style={{
                fontFamily: 'Satoshi, sans-serif',
                fontSize: '28px',
                fontWeight: 600,
                letterSpacing: '-0.5px',
                margin: '0 0 8px 0',
                color: isDarkMode ? '#FFFFFF' : '#0A0A12',
              }}
            >
              No Connection
            </h1>
            <p
              style={{
                fontFamily: 'Satoshi, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                maxWidth: '240px',
                textAlign: 'center',
                lineHeight: 1.65,
                margin: '0 0 32px 0',
                color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(10,10,18,0.45)',
              }}
            >
              Your internet connection appears to be offline.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontFamily: 'Satoshi, sans-serif',
                width: '100%',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '100px',
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '0.1px',
                boxShadow: 'none',
                outline: 'none',
                backgroundColor: '#5260FE',
                border: 'none',
                color: '#FFFFFF',
                transition: 'filter 0.15s ease',
                pointerEvents: isReconnecting ? 'none' : 'auto',
                animation: isReconnecting ? 'pulseReconnect 0.8s infinite ease-in-out' : 'none'
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.filter = 'brightness(0.85)';
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            >
              {isReconnecting ? 'Reconnecting...' : 'Try again'}
            </button>
            <style>{`
              @keyframes pulseReconnect {
                0% { opacity: 1; }
                50% { opacity: 0.6; }
                100% { opacity: 1; }
              }
            `}</style>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoInternet;
