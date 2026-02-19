import React from 'react';
import { useTheme } from "next-themes";
import popupBg from '../assets/popup-bg-remove.png';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  primaryButtonSrc: string;
  primaryText: string;
  onPrimaryClick: () => void;
  secondaryButtonSrc: string; // The Cancel button
  secondaryText: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  primaryButtonSrc,
  primaryText,
  onPrimaryClick,
  secondaryButtonSrc,
  secondaryText,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pb-[32px]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-[360px] max-w-[90%] flex flex-col items-center">
        {/* Card Background Container */}
        <div
          className="relative w-full overflow-hidden rounded-[32px] p-8 pb-10"
          style={isDarkMode ? {
            backgroundImage: `url(${popupBg})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          } : {
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Text Content */}
          <div className="mb-6 space-y-2 text-left">
            <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-bold font-satoshi`}>
              {title}
            </h2>
            <p className={`${isDarkMode ? 'text-white/80' : 'text-black'} text-[16px] font-medium leading-relaxed font-satoshi`}>
              {description}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrimaryClick();
              }}
              className="w-full h-[48px] relative active:scale-95 transition-transform flex items-center justify-center"
            >
              {isDarkMode ? (
                <img
                  src={primaryButtonSrc}
                  alt="Primary Action"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div
                  className="absolute inset-0 w-full h-full rounded-full pointer-events-none"
                  style={{
                    backgroundColor: primaryText === 'Remove Card' || primaryText === 'Remove Account' ? '#FA1515' : '#5260FE' // #FA1515 for Remove, Blue for others
                  }}
                />
              )}
              <span className="relative z-10 text-white text-[16px] font-bold font-satoshi">
                {primaryText}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-full h-[48px] relative active:scale-95 transition-transform flex items-center justify-center"
            >
              {isDarkMode ? (
                <img
                  src={secondaryButtonSrc}
                  alt="Cancel"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full rounded-full pointer-events-none bg-[#F2F3F5]" />
              )}
              <span className={`relative z-10 ${isDarkMode ? 'text-white' : 'text-[#09090B]'} text-[16px] font-bold font-satoshi`}>
                {secondaryText}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
