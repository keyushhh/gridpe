import React from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const NetworkAlertBanner: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const openDeviceSettings = async () => {
    try {
      if (Capacitor.getPlatform() === 'ios') {
        // @ts-ignore
        await App.openUrl({ url: 'App-Prefs:' });
      } else if (Capacitor.getPlatform() === 'android') {
        // @ts-ignore
        await App.openUrl({ url: 'android.settings.SETTINGS' });
      }
    } catch {
      try {
        // @ts-ignore
        await App.openUrl({ url: 'app-settings:' });
      } catch {
        if (import.meta.env.DEV) {
          console.warn('[NetworkAlertBanner] Failed to open device settings');
        }
      }
    }
  };

  const bannerBg = isDarkMode ? 'rgba(30, 30, 32, 0.96)' : 'rgba(245, 245, 247, 0.96)';
  const border = isDarkMode ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(0,0,0,0.06)';
  const text1Color = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const btnBg = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(28,28,30,0.08)';
  const btnActiveBg = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(28,28,30,0.14)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top)',
        left: '50%',
        width: 'calc(100% - 32px)',
        maxWidth: '398px',
        marginTop: '8px',
        padding: '16px 16px 14px 16px',
        backgroundColor: bannerBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: border,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        transform: show ? 'translate(-50%, 0)' : 'translate(-50%, -120%)',
        transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF9500" style={{ flexShrink: 0 }}>
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
        <span style={{ fontSize: '15px', fontWeight: 700, color: text1Color, lineHeight: 1.35, fontFamily: 'Satoshi, sans-serif' }}>
          Turn Off Airplane Mode or Use Wi-Fi to Access Data
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <button
          onClick={openDeviceSettings}
          style={{
            marginTop: '12px',
            padding: '12px 28px',
            backgroundColor: '#5260FE',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: '9999px',
            border: 'none',
            fontFamily: 'Satoshi, sans-serif',
            cursor: 'pointer',
            letterSpacing: '-0.1px',
            transition: 'filter 0.15s ease',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 10,
          }}
          onPointerDown={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
          onPointerUp={(e) => { e.currentTarget.style.filter = 'none'; }}
          onPointerLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
        >
          Open Settings
        </button>
      </div>
    </div>
  );
};

export default NetworkAlertBanner;
