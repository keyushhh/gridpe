import { ASSETS } from '@/constants/assets';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useAsset } from '@/hooks/useAsset';
import { Button } from '@/components/ui/button';
const KYCStatusComplete = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const bannerAsset = useAsset(ASSETS.SECURITY_COMPLETE, ASSETS.SECURITY_ACTIVE_LIGHT);
  const handleGoBack = () => {
    navigate(ROUTES.SECURITY_DASHBOARD);
  };
  return (
    <div
      className="h-[100dvh] w-full overflow-hidden flex flex-col safe-top relative"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.SUCCESS_BG})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Status Blob (Top Glow — Green for success) */}
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
      <div className="px-5 pt-4 flex items-center relative z-10 mb-8">
        <div className="absolute left-5">
          <BackButton onClick={handleGoBack} />
        </div>
        <h1
          className={`${isDarkMode ? 'text-white font-satoshi' : 'text-black font-sans'} text-[22px] font-medium w-full text-center`}
        >
          KYC
        </h1>
      </div>
      {/* Content Container */}
      <div className="px-5 flex-1">
        {/* Banner — same as SecurityDashboard "Looks Good!" banner */}
        <div
          className={`w-full h-[80px] rounded-xl flex items-center justify-between px-4 relative overflow-hidden pt-[17px] pl-[17px] pb-[15px] ${!isDarkMode ? 'border border-brand-border-light' : ''}`}
          style={{
            backgroundImage: `url(${bannerAsset})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF',
          }}
        >
          <div className="flex flex-col justify-center w-full h-full">
            <div className="flex items-center gap-2">
              {!isDarkMode ? (
                <div
                  className="w-[24px] h-[24px]"
                  style={{
                    backgroundColor: '#1CB956',
                    WebkitMaskImage: `url(${ASSETS.KYC_BADGE})`,
                    maskImage: `url(${ASSETS.KYC_BADGE})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                  }}
                />
              ) : (
                <img loading="lazy"
                  src={ASSETS.KYC_BADGE}
                  className="w-[24px] h-[24px] object-contain"
                  alt="Badge"
                />
              )}
              <span
                className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-medium font-sans`}
              >
                Looks Good!
              </span>
            </div>
            <span
              className={`${isDarkMode ? 'text-brand-text-muted' : 'text-black/50'} text-[13px] font-normal font-sans mt-[2px]`}
            >
              Your KYC status looks good and completed.
            </span>
          </div>
        </div>
        {/* Sub-text */}
        <div className="mt-4">
          <p
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-sans leading-snug`}
          >
            There's nothing to be done here anymore, you're good to continue! If anything seems sus,
            we'll let you know!
          </p>
        </div>
      </div>
      {/* Footer / CTA */}
      <div className="px-5 safe-bottom pb-4 mt-auto">
        <Button
          className={`w-full h-[48px] text-white rounded-full font-semibold text-[16px] ${isDarkMode ? 'border-none' : 'bg-brand-primary hover:bg-brand-primary/90'}`}
          style={
            isDarkMode
              ? {
                  backgroundImage: `url(${ASSETS.DARKBG_CTA})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}
          }
          onClick={handleGoBack}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};
export default KYCStatusComplete;
