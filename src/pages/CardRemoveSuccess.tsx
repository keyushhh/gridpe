import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import successBg from "@/assets/success-bg.png";
import checkIcon from "@/assets/check-icon.svg";
import checkIconLight from "@/assets/check-icon-light.svg";
import buttonPrimaryWide from "@/assets/button-primary-wide.png";
import darkBgCta from "@/assets/darkbg-cta.png";
import { useTheme } from "next-themes";

const CardRemoveSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(30);

  // Get last4 from state, fallback if missing
  const last4 = location.state?.last4 || "XXXX";

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/cards");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col items-center relative safe-area-top px-6 pt-4 pb-safe pb-4"
      style={isDarkMode ? {
        backgroundImage: `url(${successBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } : {
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Light Mode Green Glow Blob */}
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

      {/* Header */}
      <div className="w-full pt-4 flex justify-center relative z-10">
        <h1 className={`${isDarkMode ? 'text-white font-satoshi' : 'text-black font-sans'} text-[22px] font-medium`}>My Cards</h1>
      </div>

      <div className="flex-1 flex flex-col items-center w-full relative z-10">
        {/* Icon: 62x62px, 22px below heading */}
        <div className="mt-[22px]">
          <img
            src={isDarkMode ? checkIcon : checkIconLight}
            alt="Success"
            className="w-[62px] h-[62px] object-contain"
          />
        </div>

        {/* Title/Subtext: Satoshi Bold 18px, 25px below icon */}
        <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-bold text-center leading-tight mt-[25px] px-4 font-sans`}>
          You have successfully removed a card ending with **** {last4}
        </h2>

        {/* Body Text: 14px below subtext */}
        <p className={`${isDarkMode ? 'text-white/80' : 'text-black'} text-[14px] text-center leading-relaxed max-w-[320px] mt-[14px] font-sans`}>
          Your card has been successfully removed, but you can add it back anytime you want from the ‘My Cards’ section!
        </p>

        {/* CTA: 190px below body text */}
        <button
          onClick={() => navigate("/cards")}
          className={`flex items-center justify-center ${isDarkMode ? 'text-foreground' : 'text-white'} text-[14px] font-medium transition-transform active:scale-95 mt-auto rounded-full`}
          style={isDarkMode ? {
            backgroundImage: `url(${darkBgCta})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            width: '362px',
            height: '48px'
          } : {
            backgroundColor: '#000000',
            width: '362px',
            height: '48px'
          }}
        >
          Redirecting Back in {countdown}s...
        </button>
      </div>
    </div>
  );
};

export default CardRemoveSuccess;
