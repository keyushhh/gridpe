import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import errorBg from "@/assets/error-bg.png";
import cancelledIco from "@/assets/cancelled-ico.svg";
import failedLightIcon from "@/assets/failed-light.svg";
import darkbgCta from "@/assets/darkbg-cta.png";
import { useTheme } from "next-themes";
import { formatINR } from "@/utils/format";

const OrderCancelled = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const [seconds, setSeconds] = useState(28);

  const orderAmount = location.state?.order?.amount || 2000;

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/home");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div
      className={`fixed inset-0 w-full h-full flex flex-col safe-area-top safe-area-bottom overflow-hidden ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-white'}`}
      style={{
        backgroundImage: isDarkMode ? `url(${errorBg})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Red Glowing Orb for Light Mode */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#EF4444] rounded-full blur-[120px] opacity-[0.15] pointer-events-none" />
      )}

      <div className="flex flex-col items-center px-[35px] safe-area-top relative z-10" style={{ paddingTop: "24px" }}>
        {/* Header */}
        <h1 className={`text-[22px] font-medium font-satoshi text-center leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Order Cancelled
        </h1>

        {/* Status Icon - 21px below header */}
        <div className="mt-[21px] flex items-center justify-center">
          <img src={isDarkMode ? cancelledIco : failedLightIcon} alt="Cancelled" style={{ width: '62px', height: '62px' }} />
        </div>

        {/* Sub-text - 35px below icon */}
        <p className={`mt-[35px] text-[18px] font-bold font-satoshi text-center leading-[140%] ${isDarkMode ? 'text-white' : 'text-black'}`}>
          We’re sorry for the inconvenience!
        </p>

        {/* Info Box - 32px below sub-text */}
        <div
          className={`mt-[32px] p-4 rounded-[12px] border ${isDarkMode ? 'border-white/10 bg-white/[0.06]' : 'border-[#E9EAEB] bg-[#F7F8FA]'}`}
          style={{ width: "362px", backdropFilter: isDarkMode ? "blur(25px)" : "none" }}
        >
          <p className={`text-[16px] font-medium font-satoshi mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Your order for amount {formatINR(orderAmount)} has been cancelled.
          </p>
          <p className={`text-[14px] font-normal font-satoshi leading-[150%] mb-4 ${isDarkMode ? 'text-white/60' : 'text-[#7E7E7E]'}`}>
            Since you’ve reported the rider’s KYC and rejected to accept the order, the amount will be refunded in your wallet within 30 minutes. We will look into this matter! Thanks for keeping Grid.Pe safe.
          </p>
          {/* Status Dot */}
          <div className="flex items-start gap-2">
            <div className="w-[12px] h-[12px] rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)] mt-0.5" />
            <span className={`text-[12px] font-normal font-satoshi ${isDarkMode ? 'text-[#D0D0D0]' : 'text-[#7E7E7E]'}`}>Delivery rejected due to flagged verification.</span>
          </div>
        </div>

        {/* Countdown CTA - mt-12 */}
        <button
          onClick={() => navigate("/home")}
          className={`mt-12 h-[48px] flex items-center justify-center active:scale-95 transition-transform rounded-full ${!isDarkMode ? 'bg-black' : ''}`}
          style={{
            width: "362px",
            backgroundImage: isDarkMode ? `url(${darkbgCta})` : "none",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          <span className="text-white text-[16px] font-medium font-satoshi">
            Redirecting Home in {seconds}s...
          </span>
        </button>
      </div>
    </div>
  );
};

export default OrderCancelled;
