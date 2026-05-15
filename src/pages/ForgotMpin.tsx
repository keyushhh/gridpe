import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useTheme } from 'next-themes';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import ButtonSpinner from '@/components/ui/ButtonSpinner';
const ForgotMpin = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const { phoneNumber } = useUser();
  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const dismissKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide();
    } else {
      (document.activeElement as HTMLElement)?.blur();
    }
  };
  // Extract last 4 digits or use default if empty
  const last4 = phoneNumber && phoneNumber.length >= 4 ? phoneNumber.slice(-4) : '1234';
  const otpFocusRef = useRef<HTMLDivElement>(null);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Delayed focus for OTP input
  useLayoutEffect(() => {
    if (step === 'VERIFY') {
      const timer = setTimeout(() => {
        otpFocusRef.current?.querySelector('input')?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step]);
  const handleRequestOTP = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setStep('VERIFY');
    setResendTimer(20);
  };
  const handleResend = () => {
    if (resendTimer === 0) {
      setResendTimer(20);
      // Simulate resend
    }
  };
  const handleSubmit = async () => {
    if (otp.length < 6) return;
    setIsLoading(true);
    // Simulate verify
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (otp === '123456') {
      navigate(ROUTES.MPIN_SETTINGS, { state: { resetMpin: true } });
    } else {
      setError('Invalid OTP');
      setIsLoading(false);
    }
  };
  const isDisabled = step === 'REQUEST';
  return (
    <div
      className="h-screen w-full overflow-hidden flex flex-col pt-4 safe-top relative"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Purple Glow Blob */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: '#5260FE',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-center relative z-10">
        <div className="absolute left-5">
          <BackButton onClick={() => navigate(-1)} />
        </div>
        {/* Header Title: Centered */}
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans text-center`}
        >
          Forgot MPIN?
        </h1>
      </div>
      {/* Content */}
      <div className="px-5 flex flex-col w-full relative z-10">
        {/* Subtext */}
        <p
          className={`mt-[46px] ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans text-left leading-relaxed max-w-[340px]`}
        >
          {step === 'REQUEST'
            ? `We'll send a one-time password (OTP) to your registered number ending in ••${last4}`
            : `OTP sent! If it doesn't show up in 30 seconds, don't stare at the screen–just tap resend.`}
        </p>
        {/* OTP Input - Single Instance */}
        <div className="mt-10 flex flex-col items-center w-full">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={val => {
              const numericOnly = val.replace(/\D/g, '').slice(0, 6);
              setOtp(numericOnly);
              setError('');
              if (numericOnly.length === 6) {
                dismissKeyboard();
              }
            }}
            ref={otpFocusRef as any}
            disabled={isDisabled}
            className={isDisabled ? 'opacity-50' : 'opacity-100'}
          >
            <InputOTPGroup className="gap-[10px]">
              {[0, 1, 2, 3, 4, 5].map(index => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={`h-[48px] w-[48px] rounded-[7px] text-2xl font-semibold transition-all bg-cover bg-center ${
                    isDarkMode ? 'text-white' : 'text-black'
                  } ${
                    error
                      ? 'border border-red-500 ring-1 ring-red-500'
                      : isDarkMode
                        ? 'border-none ring-1 ring-white/10'
                        : 'bg-brand-bg-light border border-brand-border-light'
                  }`}
                  style={{
                    backgroundImage: isDarkMode ? `url(${ASSETS.OTP_INPUT_FIELD})` : 'none',
                    backgroundColor: isDarkMode ? 'transparent' : undefined,
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-red-500 text-sm mt-2 w-full text-left pl-1">{error}</p>}
          {/* Resend Link - Only in Verify Step, Right Aligned */}
          {step === 'VERIFY' && (
            <div className="w-full flex justify-end mt-4 px-1 max-w-[340px]">
              <button
                onClick={handleResend}
                disabled={resendTimer > 0}
                className={`text-[14px] font-normal ${resendTimer > 0 ? 'text-brand-primary' : isDarkMode ? 'text-white underline' : 'text-black underline'}`}
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Bottom CTA */}
      <div className="mt-auto px-5 safe-bottom pb-4 w-full relative z-10">
        <Button
          onClick={step === 'REQUEST' ? handleRequestOTP : handleSubmit}
          disabled={isLoading || (step === 'VERIFY' && otp.length < 6)}
          className="w-full h-[48px] bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full text-[16px] font-medium font-sans"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <ButtonSpinner />
              {step === 'REQUEST' ? 'Sending...' : 'Verifying...'}
            </span>
          ) : step === 'REQUEST' ? (
            'Request OTP'
          ) : (
            'Submit'
          )}
        </Button>
      </div>
    </div>
  );
};
export default ForgotMpin;
