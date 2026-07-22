import { ASSETS } from '@/constants/assets';
import { LocationState } from '@/types/navigation';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { GpSectionLabel } from '@gridpe-app/ui';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { hashMpin } from '@/utils/cryptoUtils';
import { crashlytics } from '@/lib/crashlytics';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
const DeleteAccountOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const { profile } = useUser();
  const [mpin, setMpin] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dismissKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      try {
        Keyboard.hide();
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[DeleteAccountOTP] native call failed:', err);
      }
    } else {
      (document.activeElement as HTMLElement)?.blur();
    }
  };
  // Reset error state whenever the user edits the MPIN again
  useEffect(() => {
    setIsError(false);
  }, [mpin]);
  const handleCancel = () => {
    navigate((location.state as LocationState)?.originPath || ROUTES.SETTINGS);
  };
  const handleDelete = async () => {
    if (mpin.length !== 4 || !profile?.id) return;
    setIsSubmitting(true);
    try {
      const hashedInput = await hashMpin(mpin);
      if (hashedInput !== profile.mpin_hash) {
        setIsError(true);
        setMpin('');
        setIsSubmitting(false);
        return;
      }
      const { error } = await (supabase.from('profiles') as any)
        .update({ deletion_requested_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (error) throw error;
      navigate(ROUTES.ACCOUNT_DELETED);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[DeleteAccountOTP] Failed to submit deletion request:', err);
      crashlytics.recordError(err instanceof Error ? err : new Error('Failed to submit account deletion request'), 'DeleteAccountOTP.handleDelete');
      setIsSubmitting(false);
    }
  };
  const isComplete = mpin.length === 4;
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
      <div className="px-5 safe-top pt-4 flex items-center relative z-50 mb-8">
        <div className="absolute left-5">
          <BackButton onClick={() => navigate(-1)} />
        </div>
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans w-full text-center`}
        >
          Delete Account
        </h1>
      </div>
      <div className="px-5 flex-1 flex flex-col items-center relative z-10">
        {/* Title Section */}
        <div className="mb-8 w-full">
          <h2
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans mb-[6px] leading-tight`}
          >
            Confirm Deletion
          </h2>
          <p
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-sans leading-relaxed`}
          >
            The last gate before your grand exit. Enter your MPIN to confirm.
          </p>
        </div>
        {/* MPIN Input */}
        <div className="mb-8 w-full flex flex-col items-center">
          <div className="w-full text-left mb-[24px]">
            <GpSectionLabel>
              ENTER MPIN
            </GpSectionLabel>
            <p
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-italic font-sans italic`}
            >
              Just to be sure it's really you. Or don't. There's still time to turn around.
            </p>
          </div>
          <InputOTP
            maxLength={4}
            value={mpin}
            onChange={val => {
              const numericOnly = val.replace(/\D/g, '').slice(0, 4);
              setMpin(numericOnly);
              if (numericOnly.length === 4) {
                dismissKeyboard();
              }
            }}
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3].map(index => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={`w-[52px] h-[68px] rounded-[7px] text-[24px] font-bold ${
                    isError ? 'border border-brand-error ring-1 ring-brand-error' : ''
                  } ${
                    isDarkMode
                      ? 'bg-brand-card-dark/30 border border-white/20 text-white'
                      : 'bg-brand-bg-light border border-brand-border-light text-black'
                  }`}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {isError && (
            <p className="text-brand-error text-[12px] font-medium font-sans mt-3 w-full max-w-[364px]">
              Incorrect MPIN. Try again.
            </p>
          )}
        </div>
      </div>
      {/* Footer Button */}
      <div className="px-5 safe-bottom pb-4 mt-auto flex flex-col gap-3 relative z-10">
        <button
          className={`w-full h-[48px] relative flex items-center justify-center transition-transform ${
            !isComplete || isSubmitting ? 'opacity-50 grayscale pointer-events-none' : 'active:scale-95'
          }`}
          onClick={handleDelete}
          disabled={!isComplete || isSubmitting}
        >
          {isDarkMode ? (
            <img loading="lazy"
              src={ASSETS.BUTTON_REMOVE_CARD}
              alt="Delete Account"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full bg-brand-error pointer-events-none" />
          )}
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">
            I'll Miss You
          </span>
        </button>
        {/* Cancel */}
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
export default DeleteAccountOTP;
