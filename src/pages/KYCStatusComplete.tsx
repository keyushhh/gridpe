import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { useAsset } from "@/hooks/useAsset";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import kycBadge from "@/assets/kyc-badge.png";
import { Button } from "@/components/ui/button";

const KYCStatusComplete = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const bannerAsset = useAsset("security-complete");

  const handleGoBack = () => {
    navigate("/security-dashboard");
  };

  return (
    <div
      className="h-[100dvh] w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom relative"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light Mode Status Blob (Top Glow — Green for success) */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: "#0C7E4B",
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}

      {/* Header */}
      <div className="px-5 pt-12 flex items-center relative z-10 mb-8">
        <button
          onClick={handleGoBack}
          className={`w-10 h-10 rounded-full border ${isDarkMode ? 'border-white/20 bg-black/20 backdrop-blur-md' : 'border-[#E6E8EB] bg-white'} flex items-center justify-center absolute left-5`}
        >
          <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
        </button>
        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans w-full text-center`}>KYC</h1>
      </div>

      {/* Content Container */}
      <div className="px-5 flex-1">
        {/* Banner — same as SecurityDashboard "Looks Good!" banner */}
        <div
          className={`w-full h-[80px] rounded-xl flex items-center justify-between px-4 relative overflow-hidden pt-[17px] pl-[17px] pb-[15px] ${!isDarkMode ? 'border border-[#E9EAEB]' : ''}`}
          style={{
            backgroundImage: `url(${bannerAsset})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF',
          }}
        >
          <div className="flex flex-col justify-center w-full h-full">
            <div className="flex items-center gap-2">
              {!isDarkMode ? (
                <div
                  className="w-[24px] h-[24px]"
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
                <img src={kycBadge} className="w-[24px] h-[24px] object-contain" alt="Badge" />
              )}
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-medium font-sans`}>Looks Good!</span>
            </div>
            <span className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black/50'} text-[13px] font-normal font-sans mt-[2px]`}>Your KYC status looks good and completed.</span>
          </div>
        </div>

        {/* Sub-text */}
        <div className="mt-4">
          <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-sans leading-snug`}>
            There's nothing to be done here anymore, you're good to continue! If anything seems sus, we'll let you know!
          </p>
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="px-5 pb-10 mt-auto">
        <Button
          className="w-full h-[48px] bg-[#5260FE] hover:bg-[#5260FE]/90 text-white rounded-full font-semibold text-[16px]"
          onClick={handleGoBack}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default KYCStatusComplete;
