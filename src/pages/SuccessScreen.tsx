import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useUser } from "@/contexts/UserContext";
import successBg from "@/assets/success-bg.png";
import checkIconSvg from "@/assets/check-icon.svg";
import checkIconLight from "@/assets/check-icon-light.svg";
import buttonPrimaryWide from "@/assets/button-primary-wide.png";
import darkBgCta from "@/assets/darkbg-cta.png";

const SuccessScreen = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const state = location.state || {};

  const isFxFlow = searchParams.get("flow") === "fx" || state.flow === "fx";
  const docType = searchParams.get("doc") || (state.doc ? 'passport' : null);
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
      className="h-[100dvh] w-full flex flex-col items-center relative overflow-hidden safe-area-top safe-area-bottom"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${successBg})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Light Mode Status Blob (Top Glow — Green) */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: "#0C7E4B",
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}

      {/* Header — "KYC" */}
      <div className="w-full pt-12 flex justify-center relative z-10">
        <h1 className={`${isDarkMode ? 'text-white font-satoshi' : 'text-black font-sans'} text-[22px] font-medium`}>KYC</h1>
      </div>

      {/* Check Icon — 22px below header */}
      <div className="mt-[22px]">
        <img
          src={isDarkMode ? checkIconSvg : checkIconLight}
          alt="Success"
          className="w-[62px] h-[62px] object-contain"
        />
      </div>

      {/* Sub-heading — 35px below check icon */}
      <h2
        className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-bold text-center leading-tight font-sans mt-[35px]`}
        style={{ width: '310px' }}
      >
        Your KYC details has been submitted successfully!
      </h2>

      {/* Body text — 14px below sub-heading */}
      <p
        className={`${isDarkMode ? 'text-white/80' : 'text-black'} text-[16px] font-normal text-center leading-relaxed font-sans mt-[14px]`}
        style={{ maxWidth: '320px' }}
      >
        We've received your KYC details. Verification typically takes under 30 minutes.
      </p>

      {/* CTA — 210px below body text */}
      <div className="mt-[210px] flex flex-col items-center">
        <button
          onClick={() => navigate(isFxFlow ? "/fx-exchange" : "/home")}
          className={`flex items-center justify-center text-[16px] font-medium transition-transform active:scale-95 rounded-full font-sans`}
          style={{
            backgroundImage: isDarkMode ? `url(${darkBgCta})` : 'none',
            backgroundColor: isDarkMode ? 'transparent' : '#000000',
            color: isDarkMode ? undefined : '#FFFFFF',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            width: '362px',
            height: '48px'
          }}
        >
          {isFxFlow ? "Go to FX Exchange" : `Redirecting Home in ${countdown}s...`}
        </button>

        {/* Disclaimer — 12px below CTA */}
        <p className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[12px] text-center font-sans mt-[12px]`}>
          (Because refreshing the screen won't make it go faster.)
        </p>
      </div>

      {/* Footer Text — pushed to bottom */}
      <div className="mt-auto pb-10 px-4">
        <p className={`${isDarkMode ? 'text-white' : 'text-black/60'} text-[13px] text-center leading-snug font-sans`}>
          If accepted, you'll officially be one of us. If rejected... it's probably your lighting.
        </p>
      </div>
    </div>
  );
};

export default SuccessScreen;
