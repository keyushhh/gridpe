import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useWebScroll } from '@/hooks/useWebScroll';
const AccountDeleted = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const [timeLeft, setTimeLeft] = useState(30);
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleTimeout();
    }
  }, [timeLeft]);
  const handleTimeout = () => {
    localStorage.removeItem('gridpe_user_state');
    localStorage.removeItem('gridpe_user_cards');
    localStorage.removeItem('gridpe_user_bank_accounts');
    localStorage.removeItem('gridpe_user_mpin');
    navigate(ROUTES.HOME);
  };
  const handleTakeMeBack = () => {
    navigate(ROUTES.ACCOUNT_RETRIEVED);
  };
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col items-center pt-4 safe-bottom pb-4 px-5 safe-top relative`}
      style={
        isDarkMode
          ? {
              backgroundImage: `url(${ASSETS.ACCOUNT_DELETED_BG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : {
              backgroundColor: '#FFFFFF',
            }
      }
    >
      {/* Light Mode Red Glow Blob */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: '#FF1E1E',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <h1
        className={`${isDarkMode ? 'text-white' : 'text-black'} text-[26px] font-medium font-sans relative z-10`}
      >
        Delete Account
      </h1>
      {/* Icon - 21px below heading */}
      <div className="mt-[21px] mb-[35px] relative z-10">
        <img loading="lazy"
          src={isDarkMode ? ASSETS.SAD_FACE : ASSETS.SAD_FACE_RED}
          alt="Sad Face"
          className="w-[62px] h-[62px] object-contain"
        />
      </div>
      {/* Subtext - 35px below icon (handled by mb-[35px] above) */}
      <h2
        className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans mb-[32px] text-center leading-tight relative z-10`}
      >
        And just like that... you ghosted us.
      </h2>
      {/* Container */}
      <div
        className={`w-full relative px-[15px] py-[11px] flex flex-col rounded-2xl z-10 ${!isDarkMode ? 'border border-brand-border-light' : ''}`}
        style={
          isDarkMode
            ? {
                backgroundImage: `url(${ASSETS.DELETE_ACC_CONTAINER})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
              }
            : {
                backgroundColor: '#FFFFFF',
              }
        }
      >
        <p
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium font-sans mb-[12px]`}
          style={{ lineHeight: '140%' }}
        >
          No worries — it's not like we cried or anything.
        </p>
        <div
          className={`${isDarkMode ? 'text-[#AFAFAF]' : 'text-black'} text-[16px] font-normal font-sans mb-[12px]`}
          style={{ lineHeight: '120%' }}
        >
          <p className="mb-1">No judgment though — digital breakups happen.</p>
          <p>
            But if the loneliness hits different at 3AM, you can come back. Just wait 24 hours.
            We're petty, not cruel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand-error shadow-[0_0_8px_rgba(255,59,48,0.6)]"></div>
          <span
            className={`${isDarkMode ? 'text-[#D0D0D0]' : 'text-black'} text-[12px] font-normal font-sans`}
          >
            Deleted but still in our feels.
          </span>
        </div>
      </div>
      {/* Footer / Action */}
      <div className="w-full mt-auto flex flex-col items-center relative z-10">
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleTakeMeBack}
        >
          {isDarkMode ? (
            <img loading="lazy"
              src={ASSETS.BUTTON_CANCEL_WIDE}
              alt="Take Me Back"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full pointer-events-none bg-black" />
          )}
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">
            Ugh, Take Me Back
          </span>
        </button>
        <p
          className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[13px] font-sans mt-[8px]`}
        >
          (Redirecting in {timeLeft}s..)
        </p>
      </div>
    </div>
  );
};
export default AccountDeleted;
