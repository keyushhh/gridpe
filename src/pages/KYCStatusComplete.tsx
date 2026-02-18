import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import bannerComplete from "@/assets/banner-complete.png";
import kycBadge from "@/assets/kyc-badge.png";
import { Button } from "@/components/ui/button";

const KYCStatusComplete = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  // Reused banner styles
  const commonClasses = "w-full h-[80px] rounded-xl flex items-center justify-between px-4 relative overflow-hidden pt-[17px] pl-[17px] pb-[15px]";
  const bgStyle = {
    backgroundImage: `url(${bannerComplete})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: "#0a0a12",
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-12 flex items-center relative z-50 mb-8">
        <button
          onClick={handleGoBack}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/20 backdrop-blur-md absolute left-5"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white text-[18px] font-semibold font-sans w-full text-center">KYC</h1>
      </div>

      {/* Content Container */}
      <div className="px-5 flex-1">
        {/* Banner */}
        <div className={commonClasses} style={bgStyle}>
          <div className="flex flex-col justify-center w-full h-full">
            <div className="flex items-center gap-2">
              <img src={kycBadge} className="w-[24px] h-[24px] object-contain" alt="Badge" />
              <span className="text-white text-[18px] font-medium font-sans">Looks Good!</span>
            </div>
            <span className="text-[#7E7E7E] text-[13px] font-normal font-sans mt-[2px]">Your KYC status looks good and completed.</span>
          </div>
        </div>

        {/* Sub-text */}
        <div className="mt-4">
          <p className="text-white text-[14px] font-normal font-sans leading-snug">
            There’s nothing to be done here anymore, you’re good to continue! If anything seems sus, we’ll let you know!
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
