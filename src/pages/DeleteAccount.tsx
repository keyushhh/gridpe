import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import radioOn from "@/assets/radio-on.png";
import radioOff from "@/assets/radio-off.png";
import optionContainerBg from "@/assets/option-container-bg.png";
import buttonRemoveCard from "@/assets/button-remove-card.png";
import buttonCancel from "@/assets/button-cancel-wide.png";

type OptionType = 'deactivate' | 'delete';

const DeleteAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const [selectedOption, setSelectedOption] = useState<OptionType>('deactivate');
  const originPath = (location.state as any)?.originPath || "/security-dashboard";

  const handleGoBack = () => {
    navigate(originPath);
  };

  const handleProceed = () => {
    const state = { originPath };
    if (selectedOption === 'deactivate') {
      navigate('/confirm-deactivation', { state });
    } else {
      navigate('/delete-account-reasons', { state });
    }
  };

  const OptionCard = ({
    type,
    title,
    description,
    paddingY = "py-[13px]"
  }: {
    type: OptionType,
    title: string,
    description: string,
    paddingY?: string
  }) => {
    const isSelected = selectedOption === type;

    return (
      <div
        className={`w-full relative px-[10px] ${paddingY} flex items-start gap-[14px] cursor-pointer rounded-xl`}
        onClick={() => setSelectedOption(type)}
        style={isDarkMode ? {
          backgroundImage: `url(${optionContainerBg})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat'
        } : {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E9EAEB',
        }}
      >
        {/* Radio Button */}
        <div className="shrink-0 mt-[2px]">
          <img
            src={isSelected ? radioOn : radioOff}
            alt={isSelected ? "Selected" : "Not Selected"}
            className="w-[18px] h-[18px] object-contain"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <h3 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans leading-none`}>{title}</h3>
          <div className="h-[9.5px]" />
          <p className={`${isDarkMode ? 'text-[#C4C4C4]' : 'text-black/60'} text-[12px] font-normal font-sans leading-relaxed`}>
            {description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom relative"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light Mode Red Glow Blob */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: "#FF1E1E",
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}

      {/* Header */}
      <div className="px-5 pt-6 flex items-center relative z-50 mb-0">
        <button
          onClick={handleGoBack}
          className={`w-10 h-10 rounded-full border ${isDarkMode ? 'border-white/20 bg-black/20 backdrop-blur-md' : 'border-[#E6E8EB] bg-white'} flex items-center justify-center absolute left-5`}
        >
          <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
        </button>
        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans w-full text-center`}>What's the move?</h1>
      </div>

      {/* Content Container */}
      <div className="px-5 flex-1 flex flex-col relative z-10">

        {/* Text Group Wrapper */}
        <div className="flex flex-col mt-[46px] mb-[36px]">
          {/* Secondary Header */}
          <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans`}>What would you like to do?</h2>

          {/* Subheader */}
          <div className="h-[6px]" />
          <p className={`${isDarkMode ? 'text-[#C4C4C4]' : 'text-black/60'} text-[14px] font-medium font-sans`}>
            You can pause your account or go nuclear. Up to you.
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-[10px]">
          <OptionCard
            type="deactivate"
            title="Deactivate Account"
            description={'Temporarily disable your account. You can come back anytime. Recommended if you\'re just taking a break. You can actually say, \u201cwe were on a break!\u201d and mean it.'}
            paddingY="py-[13px]"
          />

          <OptionCard
            type="delete"
            title="Delete Account"
            description="This will wipe your account, order history, and wallet. You won't be able to reverse this."
            paddingY="py-[12px]"
          />
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="px-5 pb-10 mt-auto flex flex-col gap-3 relative z-10">
        {/* Proceed Button */}
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleProceed}
        >
          {isDarkMode ? (
            <img
              src={buttonRemoveCard}
              alt="Proceed"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full bg-[#FF3B30] pointer-events-none" />
          )}
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">Proceed</span>
        </button>

        {/* Cancel Button */}
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleGoBack}
        >
          {isDarkMode ? (
            <img
              src={buttonCancel}
              alt="Cancel"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full pointer-events-none" style={{ backgroundColor: '#EBEBEB' }} />
          )}
          <span className={`relative z-10 ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-semibold font-sans`}>Cancel</span>
        </button>
      </div>
    </div>
  );
};

export default DeleteAccount;
