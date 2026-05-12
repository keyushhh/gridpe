import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { ROUTES } from '@/routes';
const HelpReportSuccess = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const [countdown, setCountdown] = useState(30);
  // Reference ID
  const referenceId = '1420250537';
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(ROUTES.HOME); // Redirect to real homepage
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);
  return (
    <div
      className={`fixed inset-0 w-full flex flex-col safe-top overflow-hidden ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      style={{
        backgroundImage: isDarkMode ? `url(${ASSETS.SUCCESS_BG})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Success Glow */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#0D992F] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* Header */}
      <header className="px-5 pt-8 pb-0 flex items-center justify-center relative z-10 shrink-0">
        <h1
          className={`text-[22px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Need Help
        </h1>
      </header>
      <main className="flex-1 flex flex-col items-center px-5 relative z-10">
        {/* Icon: 21px below heading */}
        <div className="mt-[21px] flex items-center justify-center">
          <img src={ASSETS.CHECK_ICON} alt="Success" className="w-[62px] h-[62px]" />
        </div>
        {/* Sub-heading: 35px below icon */}
        <h2
          className={`mt-[35px] text-[18px] font-bold font-satoshi text-center tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Reference ID #{referenceId}
        </h2>
        {/* Body Text 1: 39px below sub-heading */}
        <div className="mt-[39px] w-[341px] mx-auto">
          <p
            className={`text-[16px] font-satoshi font-normal text-center leading-[1.4] ${isDarkMode ? 'text-white' : 'text-brand-text-muted'}`}
          >
            We’ve received your request and our team will review it soon. You’ll get a notification
            in the app as soon as there’s an update.
          </p>
        </div>
        {/* Body Text 2: 20px below Body Text 1 */}
        <div className="mt-[20px] w-[277px] mx-auto text-center">
          <p
            className={`text-[16px] font-satoshi font-normal leading-[1.4] ${isDarkMode ? 'text-white' : 'text-brand-text-muted'}`}
          >
            You can track your request anytime in
            <br />
            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Help & Support.
            </span>
          </p>
        </div>
        {/* Redirecting CTA: 125px below texts */}
        <div className="mt-[125px] w-full px-5">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className={`w-full h-12 rounded-full backdrop-blur-md flex items-center justify-center text-[15px] font-satoshi transition-all active:scale-95 ${isDarkMode ? 'text-white' : 'bg-black text-white'}`}
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${ASSETS.DARKBG_CTA})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    border: 'none',
                  }
                : {}
            }
          >
            Redirecting Back in {countdown}s...
          </button>
        </div>
      </main>
    </div>
  );
};
export default HelpReportSuccess;
