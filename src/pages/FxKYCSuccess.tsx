import { ASSETS } from '@/constants/assets';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useUser } from '@/contexts/UserContext';
import ButtonSpinner from '@/components/ui/ButtonSpinner';
const FxKYCSuccess = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { setPassportVerifiedInDb } = useUser();
  const [loading, setLoading] = useState(false);
  const handleGoToFx = async () => {
    setLoading(true);
    try {
      await setPassportVerifiedInDb(true);
      navigate(ROUTES.FX_EXCHANGE, { replace: true });
    } catch (err) {
      console.error('Failed to persist passport verification:', err);
      setLoading(false);
    }
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
      {/* Header — "KYC" */}
      <div className="shrink-0 relative flex items-center justify-center w-full px-5 safe-top pt-4 pb-0 z-50">
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi`}
        >
          KYC
        </h1>
      </div>
      {/* Content Container */}
      <div className="w-full max-w-sm px-5 flex-1 flex flex-col items-center relative z-10 pb-8">
        {/* Check Icon — 22px below header */}
        <div className="mt-8 flex items-center justify-center">
          <img loading="lazy"
            src={isDarkMode ? ASSETS.CHECK_ICON : ASSETS.CHECK_ICON_LIGHT}
            alt="Success"
            className="w-[62px] h-[62px] object-contain animate-in zoom-in-50 duration-500"
          />
        </div>
        {/* Sub-heading — 35px below check icon */}
        <h2
          className={`mt-8 ${isDarkMode ? 'text-white' : 'text-black'} text-[20px] font-bold text-center leading-tight font-satoshi`}
        >
          Your KYC details has been submitted successfully!
        </h2>
        {/* Body text — 14px below sub-heading */}
        <p
          className={`mt-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[16px] font-normal text-center leading-relaxed font-satoshi`}
        >
          We've received your KYC details. Verification typically takes under 30 minutes.
        </p>
        <div className="flex-1 min-h-[40px]" />
        {/* Actions */}
        <div className="w-full flex flex-col items-center gap-4">
          <button
            onClick={handleGoToFx}
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
              'Go to FX Exchange'
            )}
          </button>
          {/* Disclaimer — 12px below CTA */}
          <p
            className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[12px] text-center font-satoshi`}
          >
            (Because refreshing the screen won't make it go faster.)
          </p>
        </div>
        {/* Footer Text — pushed to bottom contextually */}
        <div className="mt-12 w-full safe-bottom">
          <p
            className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[13px] text-center leading-snug font-satoshi`}
          >
            If accepted, you'll officially be one of us. If rejected... it's probably your lighting.
          </p>
        </div>
      </div>
    </div>
  );
};
export default FxKYCSuccess;
