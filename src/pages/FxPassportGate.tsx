import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useUser } from '@/contexts/UserContext';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useAsset } from '@/hooks/useAsset';
import CardSkeleton from '@/components/skeletons/CardSkeleton';
// Assets
// New light cards
const FxPassportGate = () => {
  const navigate = useNavigate();
  const { isPassportVerified, fetchProfileData } = useUser();
  const isDarkMode = useIsDarkMode();
  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkAccess = async () => {
      try {
        await fetchProfileData();
      } catch (err) {
        console.error('Failed to fetch profile in FxPassportGate:', err);
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    };
    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [fetchProfileData]);
  useEffect(() => {
    if (isLoading) return;
    if (isPassportVerified) {
      navigate(ROUTES.FX_EXCHANGE);
    }
  }, [isLoading, isPassportVerified, navigate]);
  if (isLoading) {
    return (
      <div
        className={`min-h-screen w-full flex flex-col items-center pt-20 px-5 ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      >
        <CardSkeleton height={101} />
        <div className="mt-6 w-full">
          <CardSkeleton height={260} />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`min-h-screen w-full overflow-y-auto no-scrollbar flex flex-col items-center relative animate-in fade-in duration-500 ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      style={{
        backgroundImage: `url(${mainBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Satoshi', sans-serif",
      }}
    >
      {/* Header */}
      <div className="shrink-0 relative flex items-center justify-between w-full px-5 safe-top pt-4 pb-0 z-50">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans absolute left-1/2 -translate-x-1/2`}
        >
          FX Exchange
        </h1>
        <div className="w-10 h-10" />
      </div>
      <div className="w-full max-w-sm px-5 flex flex-col items-center flex-1 pb-10">
        {/* Tier Container */}
        <div
          className={`w-full h-[101px] rounded-[20px] relative overflow-hidden mt-6 shrink-0 ${isDarkMode ? 'bg-gradient-to-r from-brand-primary/20 to-brand-primary/10' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}
          style={{
            border: !isDarkMode ? '1px solid #E9EAEB' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="absolute top-[14px] left-[20px] right-4">
            <h3
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-bold tracking-tight`}
            >
              FX ACCESS
            </h3>
            <p
              className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[11px] font-medium leading-[130%] mt-[5px]`}
            >
              Your standard KYC is complete. However, international FX
              regulations require a verified Passport for all currency exchanges.
            </p>
          </div>
        </div>
        {/* Lottie Animation */}
        <div className="w-full aspect-square max-w-[260px] -mt-2 relative z-0 flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/288d606e-e2aa-4ba6-bc35-eb24029c38e8/BufkfUcJsW.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        {/* Steps Section */}
        <div className="w-full px-4 -mt-4 mb-8 space-y-0 relative">
          {/* Vertical Dotted Line */}
          <div
            className={`absolute left-[28px] top-[14px] bottom-[14px] w-[1px] border-l border-dashed ${isDarkMode ? 'border-white/20' : 'border-brand-border-light'}`}
          />
          {/* Step 1 */}
          <div className="flex items-center gap-4 relative py-3">
            <div
              className={`w-6 h-6 rounded-full ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'} relative z-10 flex items-center justify-center`}
            >
              <img loading="lazy" decoding="async" src={ASSETS.DONE} alt="Done" className="w-6 h-6" />
            </div>
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-satoshi`}
            >
              Standard KYC Complete
            </span>
          </div>
          {/* Step 2 */}
          <div className="flex items-center gap-4 relative py-3">
            <div
              className={`w-6 h-6 rounded-full ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'} relative z-10 flex items-center justify-center`}
            >
              <img loading="lazy" decoding="async" src={ASSETS.CURRENT} alt="Current" className="w-6 h-6" />
            </div>
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-satoshi`}
            >
              Passport Verification
            </span>
          </div>
          {/* Step 3 */}
          <div className="flex items-center gap-4 relative py-3">
            <div
              className={`w-6 h-6 rounded-full ${isDarkMode ? (isDarkMode ? 'bg-brand-bg-dark' : 'bg-white') : 'bg-[#CCFFDE]'} border ${isDarkMode ? 'border-white/20' : 'border-brand-border-light'} relative z-10 flex items-center justify-center overflow-hidden`}
            >
              {isDarkMode ? (
                <img loading="lazy" decoding="async" src={ASSETS.PENDING} alt="Pending" className="w-6 h-6 opacity-30" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-brand-success" />
              )}
            </div>
            <span
              className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[14px] font-medium font-satoshi`}
            >
              FX Enabled
            </span>
          </div>
        </div>
        {/* Actions */}
        <div className="w-full mt-auto flex flex-col items-center safe-bottom pb-4">
          <button
            onClick={() => navigate(`${ROUTES.KYC_FORM}?flow=fx`)}
            className="w-full h-[52px] bg-brand-primary rounded-full text-white text-[16px] font-bold active:scale-95 transition-transform shadow-xl shadow-brand-primary/20"
          >
            Continue with Passport KYC
          </button>
          <button
            onClick={() => navigate(-1)}
            className={`mt-5 ${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[14px] font-medium active:scale-95 transition-transform hover:underline underline-offset-4`}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
export default FxPassportGate;
