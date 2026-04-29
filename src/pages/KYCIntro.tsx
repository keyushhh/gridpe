import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import BackButton from "@/components/ui/BackButton";
import { X } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import iconKyc from "@/assets/icon-kyc.svg";
import popupBg from "@/assets/popup-bg.png";
import buttonCloseBg from "@/assets/button-close.png";
import { cn } from "@/lib/utils";
import { useWebScroll } from "@/hooks/useWebScroll";

const KYCIntro = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const [showWhyModal, setShowWhyModal] = useState(false);

  const benefits = [
    {
      title: "Higher Wallet Limits",
      description: "Boost your wallet size and daily top-up cap with verified KYC."
    },
    {
      title: "Cash Deposit & Withdrawal",
      description: "Enable secure cash pickups and quick bank withdrawals."
    },
    {
      title: "Secure, Verified Transactions",
      description: "Enjoy safer transactions and faster refunds with verified identity."
    },
    {
      title: "Faster Upgrades & Processing",
      description: "Get quicker top-ups, seamless upgrades, and wallet priority access."
    }
  ];

  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col relative`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-2 relative z-10">
        <BackButton onClick={() => navigate(-1)} />

        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans`}>KYC</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 relative z-10">
        <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-sans leading-relaxed mb-6`}>
          Complete your eKYC to start using grid.pe with all it's features:
        </p>

        <div className="space-y-5">
          {benefits.map((benefit, index) => (
            <div key={index}>
              <div className="flex items-center gap-2">
                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-xl leading-none`}>•</span>
                <h3 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-sans`}>
                  {benefit.title}
                </h3>
              </div>
              <p className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black/50'} text-[13px] font-normal font-sans ml-4 mt-1`}>
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto pb-safe pb-4 space-y-4 relative z-10 flex flex-col items-center">
        <button
          onClick={() => navigate('/kyc-form')}
          className="w-[362px] h-[48px] rounded-full text-white font-medium text-[16px] btn-gradient font-sans flex items-center justify-center"
        >
          Start KYC
        </button>
        <button
          onClick={() => setShowWhyModal(true)}
          className={`w-full text-center ${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-sans underline underline-offset-2`}
        >
          Why is this needed?
        </button>
      </div>

      {/* Why KYC Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-md bg-black/40"
            onClick={() => setShowWhyModal(false)}
          />

          {/* Popup Box */}
          <div
            className={`relative rounded-2xl p-6 max-w-[320px] w-full z-10 ${!isDarkMode ? 'bg-white' : ''}`}
            style={isDarkMode ? {
              backgroundImage: `url(${popupBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}}
          >
            <div className="flex flex-col items-center">
              <img src={iconKyc} alt="KYC" className={`w-8 h-8 mb-4 ${!isDarkMode ? 'filter brightness-0' : ''}`} />
              <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans mb-4`}>
                Know Your Customer
              </h2>
              <div className={`${isDarkMode ? 'bg-[#0a0a12]/80' : 'bg-[#F8F9FA]'} rounded-xl p-4`}>
                <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-sans leading-relaxed`}>
                  In accordance with the Reserve Bank of India (RBI) regulations, completion of eKYC is mandatory to enable wallet functionalities such as fund transfers, cash withdrawals, and account upgrades. This ensures compliance, enhances security, and enables uninterrupted access to regulated financial services.
                </p>
              </div>
            </div>
          </div>

          {/* Close Button - Outside the popup */}
          <button
                        onClick={() => setShowWhyModal(false)}
                        className={cn(
                            "relative z-10 mt-6 px-8 h-[36px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform overflow-hidden",
                            isDarkMode ? "glass-container glass-physics-clear grow-0" : "bg-black"
                        )}
                        style={{
                            '--glass-specular-intensity': '0.2'
                        } as any}
                    >
                        {isDarkMode && (
                            <>
                                <div className="glass-lens" />
                                <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: 'var(--glass-tint)' }} />
                                <span className="glass-rim-v2" />
                            </>
                        )}
                        <X className="w-4 h-4 text-white relative z-10" />
                        <span className="text-white text-[14px] font-sans relative z-10">Close</span>
                    </button>
        </div>
      )}
    </div>
  );
};

export default KYCIntro;

