import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { useTheme } from "next-themes";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import buttonRemoveCard from "@/assets/button-remove-card.png";
import buttonCancel from "@/assets/button-cancel-wide.png";
import mpinInputError from "@/assets/mpin-input-error.png";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

const DeleteAccountOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const { showToaster } = useCustomToaster();

  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(20);
  const [canResend, setCanResend] = useState(false);

  const dismissKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide();
    } else {
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleResend = () => {
    setOtp("");
    setTimeLeft(20);
    setCanResend(false);
    showToaster("OTP sent successfully", 'success');
  };

  const handleCancel = () => {
    navigate((location.state as any)?.originPath || "/settings");
  };

  const handleDelete = () => {
    if (otp.length === 6) {
      navigate("/account-deleted");
    }
  };

  const isComplete = otp.length === 6;

  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col pb-safe pb-4 relative"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light Mode Red Glow Blob */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: "#FF1E1E",
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}

      <div className="px-5 pt-safe pt-4 flex items-center relative z-50 mb-8">
        <div className="absolute left-5">
          <BackButton onClick={() => navigate(-1)} />
        </div>

        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans w-full text-center`}>Delete Account</h1>
      </div>

      <div className="px-5 flex-1 flex flex-col items-center relative z-10">
        {/* Title Section */}
        <div className="mb-8 w-full">
          <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans mb-[6px] leading-tight`}>
            Confirm Deletion
          </h2>
          <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-sans leading-relaxed`}>
            OTP time. The last gate before your grand exit. Choose your fate.
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-8 w-full flex flex-col items-center">
          <div className="w-full text-left mb-[24px]">
            <h3 className={`${isDarkMode ? 'text-[#707070]' : 'text-black/50'} text-[14px] font-bold font-sans uppercase mb-[6px]`}>
              CONFIRM VERIFICATION CODE
            </h3>
            <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-italic font-sans italic`}>
              Enter the digits we sent. Or don't. There's still time to turn around.
            </p>
          </div>

          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(val) => {
              const numericOnly = val.replace(/\D/g, '').slice(0, 6);
              setOtp(numericOnly);
              if (numericOnly.length === 6) {
                dismissKeyboard();
              }
            }}
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={`w-[52px] h-[68px] rounded-[7px] text-[24px] font-bold ${isDarkMode
                    ? 'bg-[#191919]/30 border border-white/20 text-white'
                    : 'bg-[#F7F8FA] border border-[#E6E8EB] text-black'
                    }`}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {/* Helper Links - Below Input */}
          <div className="flex justify-between w-full max-w-[364px] mt-4 px-1">
            <button
              onClick={() => navigate("/delete-account-mobile", { state: location.state, replace: true })}
              className="text-[14px] font-sans text-[#5260FE] underline opacity-80"
            >
              Wrong number? Fix it here.
            </button>

            <button
              onClick={handleResend}
              disabled={!canResend}
              className={`text-[14px] font-sans ${canResend ? 'text-[#5260FE]' : isDarkMode ? 'text-white/40' : 'text-black/40'}`}
            >
              {canResend ? "Resend OTP" : `Resend OTP in ${timeLeft}s`}
            </button>
          </div>
        </div>

      </div>

      {/* Footer Button */}
      <div className="px-5 pb-safe pb-4 mt-auto flex flex-col gap-3 relative z-10">
        <button
          className={`w-full h-[48px] relative flex items-center justify-center transition-transform ${!isComplete ? "opacity-50 grayscale pointer-events-none" : "active:scale-95"
            }`}
          onClick={handleDelete}
          disabled={!isComplete}
        >
          {isDarkMode ? (
            <img
              src={buttonRemoveCard}
              alt="Delete Account"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full bg-[#FF3B30] pointer-events-none" />
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
            <img
              src={buttonCancel}
              alt="Cancel"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full rounded-full pointer-events-none" style={{ backgroundColor: '#EBEBEB' }} />
          )}
          <span className={`relative z-10 ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-semibold font-sans`}>
            Cancel
          </span>
        </button>
      </div>
    </div>
  );
};

export default DeleteAccountOTP;
