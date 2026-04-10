import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import MpinSheet from "@/components/MpinSheet";
import { useAsset } from "@/hooks/useAsset";
import kycBadge from "@/assets/kyc-badge.png";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import popupBg from "@/assets/popup-bg.png";
import buttonCloseBg from "@/assets/button-close.png";
import mpinIcon from "@/assets/mpin-icon.png";
import mpinPopupLight from "@/assets/mpin-popup-light.png";

const MpinSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const [showMpinSheet, setShowMpinSheet] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [sheetMode, setSheetMode] = useState<'change' | 'reset'>('change');
  const bannerAsset = useAsset("security-complete");

  useEffect(() => {
    if (location.state?.resetMpin) {
      setSheetMode('reset');
      setShowMpinSheet(true);
      // Clean up state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div
      className="min-h-screen flex flex-col pt-4 safe-area-top safe-area-bottom font-sans relative"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light Mode Status Blob (Top Glow — Purple) */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: "#5260FE",
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}

      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-center relative z-10">
        <button
          onClick={() => navigate('/security-dashboard')}
          className={`w-10 h-10 rounded-full border ${isDarkMode ? 'border-white/20 bg-black/20 backdrop-blur-md' : 'border-[#E6E8EB] bg-white'} flex items-center justify-center absolute left-5`}
        >
          <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
        </button>
        {/* Header: Satoshi Medium 22px, Centered */}
        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans text-center`}>MPIN</h1>
      </div>

      {/* Content */}
      <div className="px-5 flex flex-col relative z-10">
        {/* Body Text: Spacing 46px from header, Satoshi Bold 16px */}
        <p className={`mt-[46px] ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold leading-[22px]`}>
          For your security, this MPIN will be used to log in, approve payments, and keep the wrong hands out.
        </p>

        {/* Status Card */}
        <div className="mt-6 flex justify-center">
          <div
            className={`w-[362px] h-[101px] rounded-xl relative overflow-hidden flex items-center px-5 shrink-0 ${!isDarkMode ? 'border border-[#E9EAEB]' : ''}`}
            style={isDarkMode ? {
              backgroundImage: `url(${bannerAsset})`,
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat"
            } : {
              backgroundColor: 'rgba(28, 185, 86, 0.1)',
              borderColor: '#1CB956',
            }}
          >
            <div className="flex flex-col w-full gap-1">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {!isDarkMode ? (
                    <div
                      className="w-6 h-6"
                      style={{
                        backgroundColor: "#1CB956",
                        WebkitMaskImage: `url(${kycBadge})`,
                        maskImage: `url(${kycBadge})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                      }}
                    />
                  ) : (
                    <img src={kycBadge} alt="Secure" className="w-6 h-6 object-contain" />
                  )}
                  <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-medium`}>MPIN Set</span>
                </div>
              </div>
              <p className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black/50'} text-[13px] font-normal leading-tight mt-1`}>
                Your MPIN's set. Want to update it? Tap 'Change MPIN' below.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-auto px-5 pb-20 relative z-10">
        <Button
          onClick={() => {
            setSheetMode('change');
            setShowMpinSheet(true);
          }}
          className="w-full h-[48px] bg-[#5260FE] hover:bg-[#5260FE]/90 text-white rounded-full text-[16px] font-medium"
        >
          Change MPIN
        </Button>
      </div>

      {/* MPIN Sheet in 'change' mode */}
      {showMpinSheet && (
        <MpinSheet
          mode={sheetMode}
          onClose={() => setShowMpinSheet(false)}
          onSuccess={() => {
            setShowMpinSheet(false);
            setShowSuccessPopup(true);
          }}
        />
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-md bg-black/40"
            onClick={() => setShowSuccessPopup(false)}
          />

          {/* Popup Box */}
          <div
            className={`relative rounded-[13px] z-10 flex flex-col items-center ${isDarkMode ? '' : ''}`}
            style={isDarkMode ? {
              backgroundImage: `url(${popupBg})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              width: '362px',
              height: '199px',
            } : {
              backgroundImage: `url(${mpinPopupLight})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              width: '362px',
              height: '199px',
            }}
          >
            {/* Icon — 26x26, 22px from top */}
            <div className="flex items-center justify-center" style={{ marginTop: '22px' }}>
              <img
                src={mpinIcon}
                alt="Locked"
                className="object-contain"
                style={{
                  width: '26px',
                  height: '26px',
                  filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0)',
                }}
              />
            </div>

            {/* Header — Satoshi Bold 16px, 12px below icon */}
            <h2
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans text-center`}
              style={{ marginTop: '12px' }}
            >
              MPIN Updated!
            </h2>

            {/* Body Pill — 318x73px, radius 16px, 24px below heading */}
            <div
              className={`${isDarkMode ? 'bg-[#090909]' : 'bg-white'} flex items-center px-4`}
              style={{
                marginTop: '24px',
                width: '318px',
                height: '73px',
                borderRadius: '16px',
              }}
            >
              <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-[120%] text-left font-sans`}>
                All set. Just don't write it on a sticky note. Or worse—use 1234 again.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setShowSuccessPopup(false)}
            className="relative z-10 mt-6 px-8 py-3 rounded-full flex items-center justify-center gap-2 w-[160px]"
            style={isDarkMode ? {
              backgroundImage: `url(${buttonCloseBg})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
            } : {
              backgroundColor: '#5260FE',
            }}
          >
            <X className="w-4 h-4 text-white" />
            <span className="text-white text-[14px] font-medium">Close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MpinSettings;
