import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useUser } from '@/contexts/UserContext';
import { LocationState } from '@/types/navigation';
import { InputOTP } from '@/components/ui/input-otp';
import { hashMpin } from '@/utils/cryptoUtils';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { useWebScroll } from '@/hooks/useWebScroll';
// Custom Slot to handle masking and styling - matching MpinSheet.
// UPI-style: show the digit briefly (1s) then replace with a bullet.
const MASK_DELAY_MS = 1000;
const MASK_CHAR = '•';
const MaskedSlot = ({
  char,
  hasFakeCaret,
  isActive,
  isError,
  isValid,
  isDarkMode,
}: {
  char: string | null;
  hasFakeCaret: boolean;
  isActive: boolean;
  isError: boolean;
  isValid: boolean;
  isDarkMode: boolean;
}) => {
  const { containerOverflow } = useWebScroll();
  const [masked, setMasked] = React.useState(true);
  const prevCharRef = React.useRef<string | null | undefined>(undefined);
  React.useEffect(() => {
    if (char && char !== prevCharRef.current) {
      prevCharRef.current = char;
      setMasked(false);
      const t = setTimeout(() => setMasked(true), MASK_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (!char) {
      prevCharRef.current = undefined;
      setMasked(true);
    }
  }, [char]);
  return (
    <div
      className={`relative flex items-center justify-center h-[54px] w-[81px] rounded-[12px] border-none text-[32px] font-bold transition-all bg-cover bg-center ring-1 ${
        isDarkMode ? 'text-white' : 'text-black'
      } ${
        isError
          ? 'ring-red-500'
          : isValid
            ? 'ring-green-500'
            : isActive
              ? 'ring-brand-primary'
              : isDarkMode
                ? 'ring-white/10'
                : 'ring-black/10'
      }`}
      style={{
        backgroundColor: isDarkMode ? 'rgba(26, 26, 46, 0.5)' : '#FFFFFF',
        backgroundImage: isDarkMode
          ? isError
            ? `url(${ASSETS.MPIN_INPUT_ERROR})`
            : isValid
              ? `url(${ASSETS.MPIN_INPUT_SUCCESS})`
              : undefined
          : undefined,
      }}
    >
      {char ? (masked ? MASK_CHAR : char) : ''}
      {hasFakeCaret && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-px h-8 ${isDarkMode ? 'bg-white' : 'bg-black'} animate-caret-blink`} />
        </div>
      )}
    </div>
  );
};
const ConfirmDeactivation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const originPath = (location.state as LocationState)?.originPath || ROUTES.SETTINGS;
  const isDarkMode = useIsDarkMode();
  const { profile } = useUser();
  const [mpin, setMpinState] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isError, setIsError] = useState(false);
  const dismissKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      try {
        Keyboard.hide();
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[ConfirmDeactivation] native call failed:', err);
      }
    } else {
      (document.activeElement as HTMLElement)?.blur();
    }
  };
  useEffect(() => {
    // Reset states on change
    setIsValid(false);
    setIsError(false);
    const verifyDeactivationMpin = async () => {
      if (mpin.length === 4) {
        const hashedInput = await hashMpin(mpin);
        const targetHash = profile?.mpin_hash;
        if (hashedInput === targetHash) {
          setIsValid(true);
        } else {
          setIsError(true);
        }
      }
    };
    verifyDeactivationMpin();
  }, [mpin, profile?.mpin_hash]);
  const handleDeactivate = () => {
    if (!isValid) return;
    navigate(ROUTES.ACCOUNT_DEACTIVATED);
  };
  const handleBack = () => {
    navigate(-1);
  };
  const handleCancel = () => {
    navigate(originPath);
  };
  return (
    <div
      className={`h-full w-full flex flex-col safe-bottom pb-4 relative`}
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
          <BackButton onClick={handleBack} />
        </div>
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-medium font-sans w-full text-center`}
        >
          Deactivate
        </h1>
      </div>
      {/* Content */}
      <div className="px-5 flex-1 flex flex-col mt-[46px] relative z-10">
        {/* Texts */}
        <h2
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-bold font-sans`}
        >
          Confirm Deactivation
        </h2>
        <div className="h-[6px]" />
        <p
          className={`${isDarkMode ? 'text-brand-text-subtle' : 'text-black/60'} text-[14px] font-normal font-sans`}
        >
          Just to be sure — enter your MPIN to confirm.
        </p>
        {/* Input Label */}
        <div className="mt-[36px] mb-[12px]">
          <span
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}
          >
            Enter MPIN
          </span>
        </div>
        {/* MPIN Input */}
        <div className="w-full">
          <InputOTP
            maxLength={4}
            value={mpin}
            onChange={val => {
              const numericOnly = val.replace(/\D/g, '').slice(0, 4);
              setMpinState(numericOnly);
              if (numericOnly.length === 4) {
                dismissKeyboard();
              }
            }}
            inputMode="numeric"
            render={({ slots }) => (
              <div className="flex gap-4">
                {slots.map((slot, idx) => (
                  <MaskedSlot
                    key={idx}
                    char={slot.char}
                    hasFakeCaret={slot.hasFakeCaret}
                    isActive={slot.isActive}
                    isError={isError}
                    isValid={isValid}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            )}
          />
        </div>
      </div>
      {/* Footer / CTA */}
      <div className="px-5 safe-bottom pb-4 mt-auto flex flex-col gap-3 relative z-10">
        {/* Deactivate Button */}
        <button
          className={`w-full h-[48px] relative flex items-center justify-center transition-all ${
            isValid ? 'active:scale-95' : 'opacity-50 grayscale cursor-not-allowed'
          }`}
          onClick={handleDeactivate}
          disabled={!isValid}
        >
          {isDarkMode ? (
            <img loading="lazy"
              src={ASSETS.BUTTON_REMOVE_CARD}
              alt="Deactivate Account"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full bg-brand-error pointer-events-none" />
          )}
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">
            Deactivate Account
          </span>
        </button>
        {/* Cancel Button */}
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleCancel}
        >
          {isDarkMode ? (
            <img loading="lazy"
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
export default ConfirmDeactivation;
