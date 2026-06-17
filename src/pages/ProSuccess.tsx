import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { ASSETS } from '@/constants/assets';
import ButtonSpinner from '@/components/ui/ButtonSpinner';

const ProSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const [loading, setLoading] = useState(false);

  const state = location.state as { billingCycle?: string; expiresAt?: string } | undefined;
  const billingCycle = state?.billingCycle || 'monthly';
  
  // Format expiration date nicely
  const expirationDate = state?.expiresAt 
    ? new Date(state.expiresAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : billingCycle === 'annual' 
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleGoHome = () => {
    setLoading(true);
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center relative overflow-y-auto no-scrollbar scroll-smooth animate-in fade-in duration-500"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.SUCCESS_BG})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Satoshi', sans-serif",
      }}
    >
      {/* Light Mode — Green Glowing Orb */}
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
      <div className="shrink-0 relative flex items-center justify-center w-full px-5 safe-top pt-4 pb-0 z-50">
        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi`}>
          Grid.Pe Pro
        </h1>
      </div>

      {/* Content Container */}
      <div className="w-full max-w-sm px-5 flex-1 flex flex-col items-center relative z-10 pb-8">

        {/* Check Icon */}
        <div className="mt-8 flex items-center justify-center">
          <img loading="lazy"
            src={isDarkMode ? ASSETS.CHECK_ICON : ASSETS.CHECK_ICON_LIGHT}
            alt="Success"
            className="w-[62px] h-[62px] object-contain animate-in zoom-in-50 duration-500"
          />
        </div>

        {/* Headline */}
        <h2 className={`mt-8 ${isDarkMode ? 'text-white' : 'text-black'} text-[20px] font-bold text-center leading-tight font-satoshi`}>
          You're officially a Grid.Pe Pro member!
        </h2>

        {/* Body copy */}
        <p className={`mt-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[16px] font-normal text-center leading-relaxed font-satoshi`}>
          Your delivery limits are now upgraded to ₹25,000/day. Enjoy faster cash, first.
        </p>

        <div className="flex-1 min-h-[40px]" />

        {/* Actions */}
        <div className="w-full flex flex-col items-center gap-4">
          <button
            onClick={handleGoHome}
            disabled={loading}
            className={`w-full h-[52px] flex items-center justify-center text-[16px] font-bold text-white transition-all active:scale-95 rounded-full shadow-xl shadow-brand-primary/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            style={{
              backgroundImage: isDarkMode ? `url(${ASSETS.DARKBG_CTA})` : 'none',
              backgroundColor: isDarkMode ? '#5260FE' : '#000000',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <ButtonSpinner />
                Please wait...
              </span>
            ) : (
              'Go to Homepage'
            )}
          </button>

          {/* Sub-CTA hint */}
          <p className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[12px] text-center font-satoshi`}>
            (Your limits just leveled up.)
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 w-full safe-bottom">
          <p className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[13px] text-center leading-snug font-satoshi`}>
            Pro members get cash first. Everyone else waits. Welcome to the good side.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ProSuccess;
