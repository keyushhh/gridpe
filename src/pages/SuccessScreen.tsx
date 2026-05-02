import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useUser } from "@/contexts/UserContext";
import successBg from "@/assets/success-bg.png";
import checkIconSvg from "@/assets/check-icon.svg";
import checkIconLight from "@/assets/check-icon-light.svg";
import darkBgCta from "@/assets/darkbg-cta.png";
import confetti from "canvas-confetti";

const SuccessScreen = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const state = location.state || {};

  const isFxFlow = searchParams.get("flow") === "fx" || state.flow === "fx";
  const { kycStatus, fetchProfileData, setPassportVerifiedInDb } = useUser();
  const isWaitingForRealtime = state.isWaitingForRealtime;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Success Animation Trigger
  useEffect(() => {
    if (kycStatus === 'verified' && !hasCelebrated) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5260FE', '#0C7E4B', '#FFFFFF']
      });
      setHasCelebrated(true);
    }
  }, [kycStatus, hasCelebrated]);

  // Handle Redirect after verification
  useEffect(() => {
    if (kycStatus === 'verified') {
      if (isFxFlow) {
        setPassportVerifiedInDb(true);
      }
      const timer = setTimeout(() => {
        // Immediate navigation after short celebration
        navigate(isFxFlow ? "/fx-exchange" : "/home", { replace: true });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [kycStatus, navigate, isFxFlow, setPassportVerifiedInDb]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfileData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getHeading = () => {
    if (kycStatus === 'verified') return "Verification Successful!";
    if ((kycStatus === 'pending' || kycStatus === 'in_review') && isWaitingForRealtime) return "Finalizing verification with Didit...";
    return "Your KYC details has been submitted successfully!";
  };

  const getBodyText = () => {
    if (kycStatus === 'verified') return "You're all set! Your account is now verified and all features are unlocked.";
    if ((kycStatus === 'pending' || kycStatus === 'in_review') && isWaitingForRealtime) return "We're just wrapping things up. This usually takes a few seconds.";
    return "We've received your KYC details. Verification typically takes under 30 minutes.";
  };

  return (
    <div
      className="h-[100dvh] w-full flex flex-col items-center relative overflow-hidden safe-top"
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
      <div className="w-full pt-4 flex justify-center relative z-10">
        <h1 className={`${isDarkMode ? 'text-white font-satoshi' : 'text-black font-sans'} text-[22px] font-medium`}>KYC</h1>
      </div>

      {/* Check Icon — 22px below header */}
      <div className="mt-[22px]">
        {kycStatus === 'verified' ? (
          <img
            src={isDarkMode ? checkIconSvg : checkIconLight}
            alt="Success"
            className="w-[62px] h-[62px] object-contain animate-bounce"
          />
        ) : (
          <div className="w-[62px] h-[62px] border-4 border-[#5260FE] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Sub-heading — 35px below check icon */}
      <h2
        className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-bold text-center leading-tight font-sans mt-[35px]`}
        style={{ width: '310px' }}
      >
        {getHeading()}
      </h2>

      {/* Body text — 14px below sub-heading */}
      <p
        className={`${isDarkMode ? 'text-white/80' : 'text-black'} text-[16px] font-normal text-center leading-relaxed font-sans mt-[14px]`}
        style={{ maxWidth: '320px' }}
      >
        {getBodyText()}
      </p>

      {/* CTA Section - using flex-1 to push footer text down */}
      <div className="flex-1" />
      <div className="pb-4 space-y-4 relative z-10 w-full flex flex-col items-center">
        <button
          onClick={() => {
            if (kycStatus === 'verified') {
              navigate(isFxFlow ? "/fx-exchange" : "/home", { replace: true });
            } else {
              handleManualRefresh();
            }
          }}
          disabled={isRefreshing && kycStatus !== 'verified'}
          className={`flex items-center justify-center text-[16px] font-medium transition-transform active:scale-95 rounded-full font-sans disabled:opacity-50`}
          style={{
            backgroundImage: isDarkMode ? `url(${darkBgCta})` : 'none',
            backgroundColor: isDarkMode ? '#5260FE' : '#000000',
            color: '#FFFFFF',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '100%',
            height: '52px'
          }}
        >
          {kycStatus === 'verified' 
            ? (isFxFlow ? "Go to FX Exchange" : "Verification Complete. Redirecting...")
            : (isRefreshing ? "Checking database..." : "Waiting... Tap to Refresh")
          }
        </button>

        {/* Disclaimer — 12px below CTA */}
        <p className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[12px] text-center font-sans mt-[12px]`}>
          {kycStatus === 'verified' 
            ? "(You're officially part of the elite now.)"
            : "(Because refreshing the screen won't make it go faster.)"
          }
        </p>
      </div>

      {/* Footer Text — pushed to bottom */}
      <div className="mt-auto safe-bottom pb-4 px-4">
        <p className={`${isDarkMode ? 'text-white' : 'text-black/60'} text-[13px] text-center leading-snug font-sans`}>
          {kycStatus === 'verified'
            ? "Your account features have been fully unlocked."
            : "If accepted, you'll officially be one of us. If rejected... it's probably your lighting."
          }
        </p>
      </div>
    </div>
  );
};

export default SuccessScreen;
