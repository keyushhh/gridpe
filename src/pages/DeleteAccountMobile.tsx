import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import inputFieldBg from "@/assets/input-field-bg.png";
import buttonCancel from "@/assets/button-cancel-wide.png";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

const DeleteAccountMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const { phoneNumber } = useUser();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Normalize user's phone number (remove +91, spaces) for comparison
  const normalizedUserPhone = phoneNumber.replace(/\D/g, "").slice(-10);

  useEffect(() => {
    if (mobile.length === 10) {
      if (mobile !== normalizedUserPhone) {
        setError("Please enter the same number you used to login to grid.pe");
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [mobile, normalizedUserPhone]);

  const isValid = mobile.length === 10 && !error;

  const handleRequestOtp = () => {
    navigate("/delete-account-otp", {
      state: {
        ...location.state,
        mobile
      }
    });
  };

  const handleCancel = () => {
    navigate((location.state as any)?.originPath || "/settings", { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

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
        <button
          onClick={handleGoBack}
          className={`w-10 h-10 rounded-full border ${isDarkMode ? 'border-white/20 bg-black/20 backdrop-blur-md' : 'border-[#E6E8EB] bg-white'} flex items-center justify-center absolute left-5`}
        >
          <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
        </button>
        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans w-full text-center`}>Delete Account</h1>
      </div>

      <div className="px-5 flex-1 flex flex-col relative z-10">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans mb-[6px] leading-tight`}>
            Confirm Deletion
          </h2>
          <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-sans leading-relaxed`}>
            Still doing this? Okay... enter your number so we can at least say goodbye properly.
          </p>
        </div>

        {/* Mobile Input */}
        <div className="space-y-2">
          <h3 className={`${isDarkMode ? 'text-[#707070]' : 'text-black/50'} text-[14px] font-bold font-sans uppercase mb-[6px]`}>
            CONFIRM MOBILE NUMBER
          </h3>
          <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-italic font-sans italic mb-[6px]`}>
            We won't call. We won't cry. We just need to know if it's really you.
          </p>
          <div
            className={`w-full h-[48px] rounded-full flex items-center px-6 justify-between border transition-all duration-200 ${error ? "border-[#FF3B30] bg-[#FF3B30]/10" : "border-transparent"
              }`}
            style={isDarkMode ? {
              backgroundImage: error ? undefined : `url(${inputFieldBg})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundColor: error ? undefined : 'transparent'
            } : {
              backgroundColor: error ? undefined : '#FFFFFF',
              border: error ? undefined : '1px solid #E9EAEB',
            }}
          >
            <div className="flex items-center gap-4 flex-1">
              <span className={`${isDarkMode ? 'text-white/60' : 'text-black/40'} text-[14px]`}>+91</span>
              <div className={`h-4 w-px ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}></div>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(val);
                }}
                placeholder="9876543210"
                className={`bg-transparent border-none outline-none text-[14px] w-full font-sans tracking-wide ${isDarkMode
                  ? 'text-white placeholder:text-white/20'
                  : 'text-black placeholder:text-black/20'
                  }`}
              />
            </div>
          </div>
          {error && (
            <p className="text-[#FF3B30] text-[12px] font-medium font-sans px-4">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Footer Button */}
      <div className="px-5 pb-safe pb-4 mt-auto flex flex-col gap-3 relative z-10">
        <Button
          onClick={handleRequestOtp}
          disabled={!isValid}
          className="w-full h-[48px] rounded-full text-[16px] font-medium font-sans bg-[#5260FE] hover:bg-[#5260FE]/90 text-white border-none disabled:opacity-50"
        >
          Request OTP
        </Button>

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
          <span className={`relative z-10 ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium font-sans`}>
            Cancel
          </span>
        </button>
      </div>
    </div>
  );
};

export default DeleteAccountMobile;
