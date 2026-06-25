import React from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { UpdateStatus } from '../hooks/useAppUpdateCheck';

interface UpdatePromptProps {
  status: UpdateStatus;
  storeUrl: string;
  onDismiss: () => void;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({ status, storeUrl, onDismiss }) => {
  if (status !== 'soft') return null;

  const isForce = false;
  
  const isDarkMode = (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) || 
                     (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                     
  const primaryColor = '#5260FE';
  const bgColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0A0A12';
  const subtextColor = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(10,10,18,0.5)';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const secondaryBtnText = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(10,10,18,0.35)';

  const handleUpdate = async () => {
    try {
      if (Capacitor.getPlatform() !== 'web') {
        // @ts-expect-error - Bypass TS error in this Capacitor version
        await App.openUrl({ url: storeUrl });
      } else {
        window.open(storeUrl, '_blank');
      }
    } catch (e) {
      console.error('Failed to open store URL', e);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000000,
      }}
      onClick={!isForce ? onDismiss : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 48px)',
          maxWidth: '360px',
          backgroundColor: bgColor,
          borderRadius: '24px',
          padding: '28px 24px',
          border: `0.5px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'updatePromptPopIn 0.3s ease-out forwards',
        }}
      >
        <style>
          {`
            @keyframes updatePromptPopIn {
              from { transform: scale(0.92); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}
        </style>

        {isForce ? (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
          </svg>
        )}

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: textColor, margin: '0 0 8px 0', fontFamily: 'Satoshi, sans-serif' }}>
          {isForce ? 'Update Required' : 'Update Available'}
        </h2>
        
        <p style={{ fontSize: '14px', color: subtextColor, lineHeight: 1.6, margin: '0 0 24px 0', fontFamily: 'Satoshi, sans-serif' }}>
          {isForce 
            ? 'This version is no longer supported. Please update to continue using Grid.Pe.' 
            : 'A new version of Grid.Pe is available with improvements and fixes.'}
        </p>

        <button
          onClick={handleUpdate}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '100px',
            backgroundColor: primaryColor,
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '15px',
            border: 'none',
            fontFamily: 'Satoshi, sans-serif',
            cursor: 'pointer',
            transition: 'filter 0.15s ease',
            marginBottom: isForce ? '0' : '8px',
          }}
          onPointerDown={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
          onPointerUp={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
          onPointerLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
        >
          {isForce ? 'Update Grid.Pe' : 'Update Now'}
        </button>

        {!isForce && (
          <button
            onClick={onDismiss}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: 'transparent',
              color: secondaryBtnText,
              fontWeight: 500,
              fontSize: '14px',
              border: 'none',
              fontFamily: 'Satoshi, sans-serif',
              cursor: 'pointer',
            }}
          >
            Maybe Later
          </button>
        )}
      </div>
    </div>
  );
};

export default UpdatePrompt;
