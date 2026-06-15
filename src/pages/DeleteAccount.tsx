import { ASSETS } from '@/constants/assets';
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hapticWarning } from '@/utils/haptics';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { LocationState } from '@/types/navigation';
type OptionType = 'deactivate' | 'delete';
const DeleteAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const [selectedOption, setSelectedOption] = useState<OptionType>('deactivate');
  const originPath = (location.state as LocationState)?.originPath || ROUTES.SECURITY_DASHBOARD;
  const handleGoBack = () => {
    navigate(-1);
  };
  const handleProceed = () => {
    hapticWarning();
    const state = { originPath };
    if (selectedOption === 'deactivate') {
      navigate(ROUTES.CONFIRM_DEACTIVATION, { state });
    } else {
      navigate(ROUTES.DELETE_ACCOUNT_REASONS, { state });
    }
  };
  const OptionCard = ({
    type,
    title,
    description,
    paddingY = 'py-[13px]',
  }: {
    type: OptionType;
    title: string;
    description: string;
    paddingY?: string;
  }) => {
    const isSelected = selectedOption === type;
    return (
      <div
        className={`w-full relative px-[10px] ${paddingY} flex items-start gap-[14px] cursor-pointer rounded-xl`}
        onClick={() => setSelectedOption(type)}
        style={
          isDarkMode
            ? {
                backgroundImage: `url(${ASSETS.OPTION_CONTAINER_BG})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
              }
            : {
                backgroundColor: '#FFFFFF',
                border: '1px solid #E9EAEB',
              }
        }
      >
        {/* Radio Button */}
        <div className="shrink-0 mt-[2px]">
          <img
            src={isSelected ? ASSETS.RADIO_ON : ASSETS.RADIO_OFF}
            alt={isSelected ? 'Selected' : 'Not Selected'}
            className="w-[18px] h-[18px] object-contain"
          />
        </div>
        {/* Content */}
        <div className="flex flex-col">
          <h3
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans leading-none`}
          >
            {title}
          </h3>
          <div className="h-[9.5px]" />
          <p
            className={`${isDarkMode ? 'text-[#C4C4C4]' : 'text-black/60'} text-[12px] font-normal font-sans leading-relaxed`}
          >
            {description}
          </p>
        </div>
      </div>
    );
  };
  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-bottom pb-4 relative"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Red Glow Blob */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: '#FF1E1E',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <div className="px-5 safe-top pt-4 flex items-center relative z-50 mb-0">
        <div className="absolute left-5">
          <BackButton onClick={handleGoBack} />
        </div>
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans w-full text-center`}
        >
          What's the move?
        </h1>
      </div>
      {/* Content Container */}
      <div className="px-5 flex-1 flex flex-col relative z-10">
        {/* Text Group Wrapper */}
        <div className="flex flex-col mt-[46px] mb-[36px]">
          {/* Secondary Header */}
          <h2
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans`}
          >
            What would you like to do?
          </h2>
          {/* Subheader */}
          <div className="h-[6px]" />
          <p
            className={`${isDarkMode ? 'text-[#C4C4C4]' : 'text-black/60'} text-[14px] font-medium font-sans`}
          >
            You can pause your account or go nuclear. Up to you.
          </p>
        </div>
        {/* Options */}
        <div className="flex flex-col gap-[10px]">
          <OptionCard
            type="deactivate"
            title="Deactivate Account"
            description={
              "Temporarily disable your account. You can come back anytime. Recommended if you're just taking a break. You can actually say, \u201cwe were on a break!\u201d and mean it."
            }
            paddingY="py-[13px]"
          />
          <OptionCard
            type="delete"
            title="Delete Account"
            description="This will wipe your account, order and history. You won't be able to reverse this."
            paddingY="py-[12px]"
          />
        </div>
      </div>
      {/* Footer / CTA */}
      <div className="px-5 safe-bottom pb-4 mt-auto flex flex-col gap-3 relative z-10">
        {/* Proceed Button */}
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleProceed}
        >
          {isDarkMode ? (
            <img
              src={ASSETS.BUTTON_REMOVE_CARD}
              alt="Proceed"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full bg-brand-error pointer-events-none" />
          )}
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">
            Proceed
          </span>
        </button>
        {/* Cancel Button */}
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleGoBack}
        >
          {isDarkMode ? (
            <img
              src={ASSETS.BUTTON_CANCEL_WIDE}
              alt="Cancel"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full rounded-full pointer-events-none"
              style={{ backgroundColor: '#EBEBEB' }}
            />
          )}
          <span
            className={`relative z-10 ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-semibold font-sans`}
          >
            Cancel
          </span>
        </button>
      </div>
    </div>
  );
};
export default DeleteAccount;
