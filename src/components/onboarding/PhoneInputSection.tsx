import React, { useState, useCallback, memo, useEffect, useRef } from "react";
import { PhoneInput } from "@/components/PhoneInput";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";

interface PhoneInputSectionProps {
  initialValue: string;
  isLoading: boolean;
  onPhoneChange: (val: string) => void;
  onRequestOTP: () => void;
  error?: string;
}

const PhoneInputSection: React.FC<PhoneInputSectionProps> = ({
  initialValue,
  isLoading,
  onPhoneChange,
  onRequestOTP,
  error: parentError,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialValue);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const delay = Capacitor.getPlatform() === 'ios' ? 100 : 500;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback((val: string) => {
    setPhoneNumber(val);
    setLocalError("");
    onPhoneChange(val);
  }, [onPhoneChange]);

  const handleSubmit = useCallback(() => {
    if (phoneNumber.length < 10) {
      setLocalError("Don't ghost us, drop your number.");
      return;
    }
    onRequestOTP();
  }, [phoneNumber, onRequestOTP]);

  return (
    <>
      <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-[26px] font-medium text-foreground">Let's get started!</h2>
        <p className="text-muted-foreground text-[14px] font-normal">
          We'll send a one-time code for instant access.
        </p>
      </div>

      <div className="animate-fade-in space-y-2" style={{ animationDelay: "0.3s" }}>
        <PhoneInput
          ref={inputRef}
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

      <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <Button
          variant="gradient"
          className="w-full h-[48px] rounded-full text-[16px] font-medium font-sans"
          onClick={handleSubmit}
          disabled={isLoading || phoneNumber.length === 0}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </span>
          ) : "Request OTP"}
        </Button>
      </div>
    </>
  );
};

export default memo(PhoneInputSection);
