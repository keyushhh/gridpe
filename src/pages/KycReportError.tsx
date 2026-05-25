import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
const KycReportError = () => {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(30);
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(ROUTES.HOME);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);
  return (
    <div
      className="fixed inset-0 w-full h-full flex flex-col bg-brand-bg-dark safe-top safe-bottom overflow-hidden"
      style={{
        backgroundImage: `url(${ASSETS.ERROR_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex flex-col items-center px-[35px] safe-top" style={{ paddingTop: '24px' }}>
        {/* Header */}
        <h1 className="text-white text-[22px] font-medium font-satoshi text-center leading-tight">
          Verification Failed
        </h1>
        {/* Status Icon - 21px below header */}
        <div className="mt-[21px] flex items-center justify-center">
          <img loading="eager" decoding="async" src={ASSETS.CANCELLED_ICO} alt="Failed" style={{ width: '62px', height: '62px' }} />
        </div>
        {/* Sub-text - 35px below icon */}
        <p className="mt-[35px] text-white text-[18px] font-bold font-satoshi text-center leading-[140%]">
          We’re sorry for the inconvenience! As reported by you, the KYC doesn’t seem right and it’s
          been flagged. We will look into the matter at the earliest. Thank you for keeping Grid.Pe
          safe.
        </p>
        {/* Countdown CTA - 37px below sub-text */}
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-[37px] w-[364px] h-[48px] flex items-center justify-center active:scale-95 transition-transform"
          style={{
            backgroundImage: `url(${ASSETS.DARKBG_CTA})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span className="text-white text-[16px] font-medium font-satoshi">
            Redirecting Home in {seconds}s...
          </span>
        </button>
      </div>
    </div>
  );
};
export default KycReportError;
