import { ASSETS } from '@/constants/assets';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useWebScroll } from '@/hooks/useWebScroll';
const AccountRetrieved = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const handleBackHome = () => {
    navigate(ROUTES.HOME);
  };
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col items-center pt-4 safe-bottom pb-4 px-5 safe-top relative`}
      style={
        isDarkMode
          ? {
              backgroundImage: `url(${ASSETS.ACCOUNT_RETRIEVED_BG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : {
              backgroundColor: '#FFFFFF',
            }
      }
    >
      {/* Light Mode Green Glow Blob */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: '#0C7E4B',
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
        Crisis Averted
      </h1>
      {/* Icon - 21px below heading */}
      <div className="mt-[21px] mb-[35px] relative z-10">
        <img loading="lazy"
          src={isDarkMode ? ASSETS.CHECK_ICON_LARGE : ASSETS.CHECK_ICON_LIGHT}
          alt="Success"
          className="w-[62px] h-[62px] object-contain"
        />
      </div>
      {/* Subtext - 35px below icon (handled by mb-[35px] above) */}
      <h2
        className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans mb-[32px] text-center leading-tight relative z-10`}
      >
        You panicked, we caught you.
      </h2>
      {/* Container */}
      <div
        className={`w-full relative px-[15px] py-[11px] flex flex-col rounded-2xl z-10 ${!isDarkMode ? 'border border-brand-border-light' : ''}`}
        style={
          isDarkMode
            ? {
                backgroundImage: `url(${ASSETS.ACC_RETRIEVED_CONTAINER})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
              }
            : {
                backgroundColor: '#FFFFFF',
              }
        }
      >
        <p
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium font-sans`}
          style={{ lineHeight: '140%' }}
        >
          Everything's back. You're safe, we're chill, no one cried. (Okay maybe just a little.)
        </p>
        <p
          className={`${isDarkMode ? 'text-[#AFAFAF]' : 'text-black'} text-[16px] font-normal font-sans mt-3`}
          style={{ lineHeight: '120%' }}
        >
          Account reactivated. Let's pretend this emotional dip never happened. We got you.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.6)]"></div>
          <span
            className={`${isDarkMode ? 'text-[#D0D0D0]' : 'text-black'} text-[12px] font-normal font-sans`}
          >
            We don't talk about the last 2 minutes.
          </span>
        </div>
      </div>
      {/* Footer / Action */}
      <div className="w-full mt-auto relative z-10">
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleBackHome}
        >
          {isDarkMode ? (
            <img loading="lazy"
              src={ASSETS.BUTTON_PRIMARY_WIDE}
              alt="Back Home"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full pointer-events-none bg-black" />
          )}
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">
            Back Home
          </span>
        </button>
      </div>
    </div>
  );
};
export default AccountRetrieved;
