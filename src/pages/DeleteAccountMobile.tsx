import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import inputFieldBg from "@/assets/input-field-bg.png";
import buttonCancel from "@/assets/button-cancel-wide.png";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

const DeleteAccountMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    navigate((location.state as any)?.originPath || "/home");
  };

  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: "#0a0a12",
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 flex items-center relative z-50 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/20 backdrop-blur-md absolute left-5"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white text-[22px] font-medium font-sans w-full text-center">Delete Account</h1>
      </div>

      <div className="px-5 flex-1 flex flex-col">
        {/* Title Section */}
        <div className="mb-8">
          <h2 className="text-white text-[16px] font-bold font-sans mb-[6px] leading-tight">
            Confirm Deletion
          </h2>
          <p className="text-white text-[14px] font-normal font-sans leading-relaxed">
            Still doing this? Okay... enter your number so we can at least say goodbye properly.
          </p>
        </div>

        {/* Mobile Input */}
        <div className="space-y-2">
          <h3 className="text-[#707070] text-[14px] font-bold font-sans uppercase mb-[6px]">
            CONFIRM MOBILE NUMBER
          </h3>
          <p className="text-white text-[14px] font-italic font-sans italic mb-[6px]">
            We won’t call. We won’t cry. We just need to know if it’s really you.
          </p>
          <div
            className={`w-full h-[48px] rounded-full flex items-center px-6 justify-between border transition-all duration-200 ${error ? "border-[#FF3B30] bg-[#FF3B30]/10" : "border-transparent"
              }`}
            style={{
              backgroundImage: error ? undefined : `url(${inputFieldBg})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundColor: error ? undefined : 'transparent'
            }}
          >
            <div className="flex items-center gap-4 flex-1">
              <span className="text-white/60 text-[14px]">+91</span>
              <div className="h-4 w-px bg-white/10"></div>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(val);
                }}
                placeholder="9876543210"
                className="bg-transparent border-none outline-none text-white text-[14px] w-full placeholder:text-white/20 font-sans tracking-wide"
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
      <div className="px-5 pb-10 mt-auto flex flex-col gap-3">
        <Button
          onClick={handleRequestOtp}
          disabled={!isValid}
          className="w-full h-[48px] rounded-full text-[16px] font-medium bg-[#5260FE] hover:bg-[#5260FE]/90 text-white border-none disabled:opacity-50"
        >
          Request OTP
        </Button>

        {/* Cancel */}
        <button
          className="w-full h-[48px] relative flex items-center justify-center active:scale-95 transition-transform"
          onClick={handleCancel}
        >
          <img
            src={buttonCancel}
            alt="Cancel"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
          />
          <span className="relative z-10 text-white text-[16px] font-semibold font-sans">
            Cancel
          </span>
        </button>
      </div>
    </div>
  );
};

export default DeleteAccountMobile;
