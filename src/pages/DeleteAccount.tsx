import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
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
  const [selectedOption, setSelectedOption] = useState<OptionType>('deactivate');

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleProceed = () => {
    const state = { originPath: (location.state as any)?.originPath };
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
        className={`w-full relative px-[10px] ${paddingY} flex items-start gap-[14px] cursor-pointer`}
        onClick={() => setSelectedOption(type)}
        style={{
          backgroundImage: `url(${optionContainerBg})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat'
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
          <h3 className="text-white text-[14px] font-medium font-sans leading-none">{title}</h3>
          <div className="h-[9.5px]" />
          <p className="text-[#C4C4C4] text-[12px] font-normal font-sans leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: "#0a0a12",
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 flex items-center relative z-50 mb-0">
        <button
          onClick={handleGoBack}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/20 backdrop-blur-md absolute left-5"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white text-[22px] font-medium font-sans w-full text-center">What’s the move?</h1>
      </div>

      {/* Content Container */}
      <div className="px-5 flex-1 flex flex-col">

        {/* Text Group Wrapper */}
        <div className="flex flex-col mt-[46px] mb-[36px]">
          {/* Secondary Header */}
          <h2 className="text-white text-[18px] font-bold font-sans">What would you like to do?</h2>

          {/* Subheader */}
          <div className="h-[6px]" />
          <p className="text-[#C4C4C4] text-[14px] font-normal font-sans">
            You can pause your account or go nuclear. Up to you.
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-[10px]">
          <OptionCard
            type="deactivate"
            title="Deactivate Account"
            description="Temporarily disable your account. You can come back anytime. Recommended if you’re just taking a break. You can actually say, “we were on a break!” and mean it."
            paddingY="py-[13px]"
          />

          <OptionCard
            type="delete"
            title="Delete Account"
            description="This will wipe your account, order history, and wallet. You won’t be able to reverse this."
            paddingY="py-[12px]"
          />
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="px-5 pb-10 mt-auto flex flex-col gap-3">
        {/* Proceed Button */}
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleProceed}
        >
          <img
            src={buttonRemoveCard}
            alt="Proceed"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
          />
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">Proceed</span>
        </button>

        {/* Cancel Button */}
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleGoBack}
        >
          <img
            src={buttonCancel}
            alt="Cancel"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
          />
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">Cancel</span>
        </button>
      </div>
    </div>
  );
};

export default DeleteAccount;
