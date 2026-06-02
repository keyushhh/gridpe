import React from 'react';
import { hapticMedium, hapticWarning } from '@/utils/haptics';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import popupBg from '../assets/popup-bg-remove.png';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

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
  const isDarkMode = useIsDarkMode();

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pb-[32px] pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10 bg-black/40 backdrop-blur-md pointer-events-auto"
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal Content */}
      <div
        className="relative z-20 w-[360px] max-w-[90%] flex flex-col items-center pointer-events-auto"
        style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
      >
        {/* Card Background Container */}
        <div
          className="relative w-full overflow-hidden rounded-[32px] pt-[28px] pb-[22px] px-[17px]"
          style={
            isDarkMode
              ? {
                  backgroundImage: `url(${popupBg})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }
              : {
                  backgroundColor: '#FFFFFF',
                }
          }
        >
          {/* Text Content */}
          <div className="mb-8 flex flex-col items-start text-left">
            <h2
              className="text-black dark:text-white text-[18px] font-bold font-satoshi mb-4"
            >
              {title}
            </h2>
            <p
              className="text-black dark:text-white/80 text-[16px] font-medium leading-relaxed font-satoshi"
            >
              {description}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={e => {
                e.stopPropagation();
                const destructiveActions = [
                  'Remove Card',
                  'Remove Account',
                  'Yes, Delete',
                  'Delete',
                  'Remove',
                ];
                if (destructiveActions.some(action => primaryText.includes(action))) {
                  hapticWarning();
                } else {
                  hapticMedium();
                }
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
                    backgroundColor:
                      primaryText === 'Remove Card' ||
                      primaryText === 'Remove Account' ||
                      primaryText === 'Yes, Delete'
                        ? '#FA1515'
                        : '#5260FE', // #FA1515 for Remove, Blue for others
                  }}
                />
              )}
              <span className="relative z-10 text-white text-[16px] font-bold font-satoshi">
                {primaryText}
              </span>
            </button>

            <button
              onClick={e => {
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
              <span
                className="relative z-10 text-brand-bg-deep dark:text-white text-[16px] font-bold font-satoshi"
              >
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
