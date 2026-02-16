import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import bgDarkMode from "@/assets/bg-dark-mode.png";

const FxIntro = () => {
    const navigate = useNavigate();
    const { walletTier } = useUser();

    // Redirect if not starter (though navigation should handle this)
    React.useEffect(() => {
        if (walletTier !== 'Starter') {
            navigate('/fx-exchange', { replace: true });
        }
    }, [walletTier, navigate]);

    return (
        <div
            className="min-h-screen w-full overflow-y-auto no-scrollbar scroll-smooth safe-area-bottom animate-in fade-in duration-500 relative"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                fontFamily: "'Satoshi', sans-serif"
            }}
        >
            {/* Header */}
            <div
                className="px-5 flex items-center justify-between z-10 mb-[21px] relative"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-white text-[22px] font-medium font-sans">
                    FX Exchange
                </h1>
                <div className="w-10" />
            </div>

            <div className="px-5 pb-[100px]">
                {/* Main Heading */}
                <h2 className="mt-[46px] text-white text-[16px] font-bold font-satoshi">
                    Requires Pro Wallet or above & KYC Verification
                </h2>

                {/* Prerequisites Section */}
                <div className="mt-[24px]">
                    <h3 className="text-white text-[16px] font-medium font-satoshi">
                        To access international FX, you’ll need:
                    </h3>
                    <ul className="mt-[10px] space-y-1">
                        <li className="flex items-start gap-2">
                            <span className="text-white text-[14px] leading-relaxed">•</span>
                            <span className="text-white text-[14px] font-regular font-satoshi leading-relaxed">
                                Passport/KYC — For secure, compliant transactions.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-white text-[14px] leading-relaxed">•</span>
                            <span className="text-white text-[14px] font-regular font-satoshi leading-relaxed">
                                Pro Wallet Upgrade — Unlock premium FX rates & fraud protection.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Why Upgrade Section */}
                <div className="mt-[14px]">
                    <h3 className="text-white text-[16px] font-bold font-satoshi">
                        Why Upgrade for FX Exchange?
                    </h3>
                    <div className="mt-[16px] space-y-[6px]">
                        <div className="flex items-start gap-2">
                            <span className="text-white text-[14px] leading-relaxed">•</span>
                            <span className="text-white text-[14px] font-regular font-satoshi leading-relaxed">
                                🔒 Verified & Secure — Every FX transaction is fully KYC-verified, ensuring compliance and passport-level safety.
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-white text-[14px] leading-relaxed">•</span>
                            <span className="text-white text-[14px] font-regular font-satoshi leading-relaxed">
                                🛡 Fraud Protection — Prevents misuse and keeps your money safe at all times.
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-white text-[14px] leading-relaxed">•</span>
                            <span className="text-white text-[14px] font-regular font-satoshi leading-relaxed">
                                💱 Best FX Rates — Access premium live conversion rates, lower than airport kiosks and money changers.
                            </span>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-[220px] pb-10">
                    <button
                        onClick={() => navigate('/wallet-settings')}
                        className="w-full h-[48px] bg-[#5260FE] rounded-full text-white text-[16px] font-bold active:scale-95 transition-transform shadow-xl shadow-[#5260FE]/20"
                    >
                        Upgrade Wallet & Verify KYC
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FxIntro;
