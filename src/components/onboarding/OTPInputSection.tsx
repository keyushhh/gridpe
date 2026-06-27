import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { GpButton } from '@gridpe-app/ui';

interface OTPInputSectionProps {
  phoneNumber: string;
  isLoading: boolean;
  resendTimer: number;
  onOtpChange: (val: string) => void;
  onVerifyOTP: () => void;
  onResendOTP: () => void;
  onWrongNumber: () => void;
  otpInputBg?: string;
  error?: string;
}

const OTPInputSection: React.FC<OTPInputSectionProps> = ({
  phoneNumber,
  isLoading,
  resendTimer,
  onOtpChange,
  onVerifyOTP,
  onResendOTP,
  onWrongNumber,
  otpInputBg,
  error: parentError,
}) => {
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');
  const otpFocusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      otpFocusRef.current?.querySelector('input')?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback(
    (val: string) => {
      const numericOnly = val.replace(/\D/g, '').slice(0, 6);
      setOtp(numericOnly);
      setLocalError('');
      onOtpChange(numericOnly);
    },
    [onOtpChange]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-[26px] font-medium text-foreground">Enter your OTP</h2>
        <p className="text-muted-foreground text-[14px] font-normal">
          Code sent to <span className="text-link">+91 {phoneNumber}</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 py-4" ref={otpFocusRef}>
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={handleChange}
          inputMode="numeric"
          pattern="[0-9]*"
          type="tel"
        >
          <InputOTPGroup className="gap-[8px]">
            {[0, 1, 2, 3, 4, 5].map(index => (
              <InputOTPSlot
                key={index}
                index={index}
                className={`h-[48px] w-[48px] rounded-[7px] text-2xl font-semibold transition-all bg-cover bg-center
                text-black dark:text-white
                ${
                  localError || parentError
                    ? 'border border-red-500 ring-1 ring-red-500'
                    : 'bg-brand-bg-light border border-brand-border-light dark:bg-transparent dark:border-none dark:ring-1 dark:ring-white/10'
                }`}
                style={{
                  backgroundImage: otpInputBg ? `url(${otpInputBg})` : 'none',
                  backgroundColor: otpInputBg ? 'transparent' : undefined,
                }}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {(localError || parentError) && (
          <p className="text-red-500 text-[14px] font-normal self-start pl-2 w-full max-w-[360px] mx-auto text-left">
            {localError || parentError}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center text-sm px-1">
        <button onClick={onWrongNumber} className="text-link hover:underline">
          Wrong number? Fix it here.
        </button>
        <button
          onClick={() => {
            if (resendTimer === 0) {
              setOtp('');
              onResendOTP();
            }
          }}
          disabled={resendTimer > 0}
          className={`${resendTimer > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-link hover:underline'}`}
        >
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
        </button>
      </div>

      <GpButton
        onClick={onVerifyOTP}
        isLoading={isLoading}
        disabled={isLoading || otp.length < 6}
      >
        Continue
      </GpButton>
    </div>
  );
};

export default memo(OTPInputSection);
