import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { PhoneInput } from '@/components/PhoneInput';
import { Button } from '@/components/ui/button';

import ButtonSpinner from '@/components/ui/ButtonSpinner';
import { GpButton } from '@/components/ui/GpButton';

interface PhoneInputSectionProps {
  initialValue: string;
  isLoading: boolean;
  onPhoneChange: (val: string) => void;
  onRequestOTP: () => void;
  error?: string;
}

const PhoneInputSection = React.forwardRef<HTMLInputElement, PhoneInputSectionProps>(({
  initialValue,
  isLoading,
  onPhoneChange,
  onRequestOTP,
  error: parentError,
}, ref) => {
  const [phoneNumber, setPhoneNumber] = useState(initialValue);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref && typeof ref !== 'function' && ref.current) {
        ref.current.focus();
      } else {
        inputRef.current?.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [ref]);

  const handleChange = useCallback(
    (val: string) => {
      setPhoneNumber(val);
      setLocalError('');
      onPhoneChange(val);
    },
    [onPhoneChange]
  );

  const handleSubmit = useCallback(() => {
    if (phoneNumber.length < 10) {
      setLocalError("Don't ghost us, drop your number.");
      return;
    }
    onRequestOTP();
  }, [phoneNumber, onRequestOTP]);

  return (
    <>
      <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-[26px] font-medium text-foreground">Let's get started!</h2>
        <p className="text-muted-foreground text-[14px] font-normal">
          We'll send a one-time code for instant access.
        </p>
      </div>

      <div className="animate-fade-in space-y-2" style={{ animationDelay: '0.3s' }}>
        <PhoneInput
          ref={ref || inputRef}
          value={phoneNumber}
          onChange={handleChange}
          countryCode="+91"
          placeholder="Enter your mobile number"
          error={!!(localError || parentError)}
        />
        {(localError || parentError) && (
          <p className="text-red-500 text-sm">{localError || parentError}</p>
        )}
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <GpButton
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={isLoading || phoneNumber.length === 0}
        >
          Request OTP
        </GpButton>
      </div>
    </>
  );
});

export default memo(PhoneInputSection);
