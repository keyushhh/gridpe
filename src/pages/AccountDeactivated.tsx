import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';

import { GpButton } from '@gridpe-app/ui';
import { useWebScroll } from '@/hooks/useWebScroll';
import { useAuth } from '@/hooks/useAuth';
const AccountDeactivated = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { logout } = useAuth();
  const [countdown, setCountdown] = useState(30);
  useEffect(() => {
    if (countdown <= 0) {
      logout();
      return;
    }
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, navigate, logout]);
  const handlePanicked = () => {
    navigate(ROUTES.SECURITY_DASHBOARD);
  };
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col items-center safe-top safe-bottom pb-4 relative`}
      style={
        isDarkMode
          ? {
              backgroundImage: `url(${ASSETS.WARNING_BACKGROUND})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : {
              backgroundColor: '#FFFFFF',
            }
      }
    >
      {/* Light Mode Yellow Glow Blob */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[191px] h-[46px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: '#FACC15',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <div className="flex flex-col items-center pt-4 relative z-10">
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[26px] font-medium font-sans`}
        >
          Deactivated
        </h1>
        {/* Icon */}
        <img loading="lazy" decoding="async"           src={ASSETS.SAD}
          alt="Sad Face"
          className="w-[62px] h-[62px] mt-[12px]"
          style={
            !isDarkMode
              ? {
                  filter:
                    'brightness(0) saturate(100%) invert(75%) sepia(60%) saturate(600%) hue-rotate(5deg) brightness(105%) contrast(95%)',
                }
              : undefined
          }
        />
        {/* Sub-heading */}
        <p
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans mt-[35px]`}
        >
          So we really are on a break, huh?
        </p>
      </div>
      {/* Info Container */}
      <div
        className={`w-[362px] mt-[35px] relative z-10 ${!isDarkMode ? 'rounded-xl border' : ''}`}
        style={
          isDarkMode
            ? {
                backgroundImage: `url(${ASSETS.CONTAINER_BG})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                paddingTop: '11px',
                paddingLeft: '15px',
                paddingBottom: '11px',
                paddingRight: '15px',
              }
            : {
                backgroundColor: '#FFFFFF',
                borderColor: '#E9EAEB',
                paddingTop: '11px',
                paddingLeft: '15px',
                paddingBottom: '11px',
                paddingRight: '15px',
              }
        }
      >
        {/* Title */}
        <h3
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium font-sans leading-tight`}
        >
          We won't beg. But we will be a little dramatic.
        </h3>
        {/* Body */}
        <p
          className={`${isDarkMode ? 'text-brand-text-subtle' : 'text-black'} text-[13px] font-normal font-sans leading-relaxed mt-[17px]`}
        >
          Deactivating won't fix your commitment issues. But go ahead... we'll be here, sipping
          sadness and session tokens.
        </p>
        {/* Status Row */}
        <div className="flex items-center gap-[6px] mt-[23px]">
          <img loading="lazy" decoding="async" src={ASSETS.WARNING_ELLIPSE} alt="Status" className="w-[14px] h-[14px]" />
          <span
            className={`${isDarkMode ? 'text-brand-text-subtle' : 'text-black/60'} text-[13px] font-normal font-sans`}
          >
            You haven't ghosted us completely.
          </span>
        </div>
      </div>
      <div className="w-[362px] mt-auto relative z-10">
        <GpButton
          variant="secondary"
          size="lg"
          onClick={handlePanicked}
        >
          I Panicked!
        </GpButton>
      </div>
      {/* Redirect Text */}
      <p
        className={`${isDarkMode ? 'text-brand-text-subtle' : 'text-black/60'} text-[14px] font-normal font-sans mt-[15px] relative z-10`}
      >
        (Redirecting in {countdown}s..)
      </p>
    </div>
  );
};
export default AccountDeactivated;
