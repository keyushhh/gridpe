import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "next-themes";
import { useUser } from "@/contexts/UserContext";
import successBg from "@/assets/success-bg.png";
import checkIcon from "@/assets/check-icon.png";
import buttonPrimaryWide from "@/assets/button-primary-wide.png";

const SuccessScreen = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const [searchParams] = useSearchParams();
  const isFxFlow = searchParams.get("flow") === "fx";
  const docType = searchParams.get("doc");
  const { submitKyc } = useUser();
  const [countdown, setCountdown] = useState(30);

  // Set KYC status to pending on mount
  useEffect(() => {
    submitKyc(docType === 'passport');
  }, [submitKyc, docType]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(isFxFlow ? "/fx-exchange" : "/home");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, isFxFlow]);

  return (
    <div
      className="h-full w-full flex flex-col items-center relative overflow-hidden safe-area-top safe-area-bottom px-6"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${successBg})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Light Mode Status Blob (Top Glow) */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: "#5260FE",
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}

      {/* Header */}
      <div className="w-full pt-6 flex justify-center relative">
        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans`}>KYC</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mb-10 relative">
        {/* Icon */}
        <div className="mb-0">
          <img
            src={checkIcon}
            alt="Success"
            className={`w-[130px] h-[130px] object-contain ${!isDarkMode ? 'filter drop-shadow-[0_0_20px_rgba(82,96,254,0.3)]' : ''}`}
          />
        </div>

        {/* Title */}
        <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-bold text-center leading-tight mb-4 font-sans`}>
          Your KYC details has been submitted successfully!
        </h2>

        {/* Subtitle */}
        <p className={`${isDarkMode ? 'text-white/80' : 'text-black/60'} text-[14px] text-center leading-relaxed max-w-[320px] font-sans`}>
          We’ve received your KYC details. Verification typically takes under 30 minutes.
        </p>
      </div>

      {/* Bottom Section */}
      <div className="w-full pb-10 flex flex-col items-center gap-4 relative">
        {/* Countdown Button */}
        <button
          onClick={() => navigate(isFxFlow ? "/fx-exchange" : "/home")}
          className={`flex items-center justify-center ${isDarkMode ? 'text-foreground' : 'text-white'} text-[14px] font-semibold transition-transform active:scale-95 rounded-full`}
          style={{
            backgroundImage: isDarkMode ? `url(${buttonPrimaryWide})` : 'none',
            backgroundColor: isDarkMode ? 'transparent' : '#5260FE',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            width: '362px',
            height: '48px'
          }}
        >
          {isFxFlow ? "Go to FX Exchange" : `Redirecting Home in ${countdown}s...`}
        </button>

        {/* Disclaimer 1 */}
        <p className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[12px] text-center font-sans`}>
          (Because refreshing the screen won’t make it go faster.)
        </p>

        <div className="h-8" /> {/* Spacer */}

        {/* Footer Text */}
        <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[13px] text-center leading-snug px-4 font-sans`}>
          If accepted, you’ll officially be one of us. If rejected... it’s probably your lighting.
        </p>
      </div>
    </div>
  );
};

export default SuccessScreen;
