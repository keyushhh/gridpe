import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { useUser } from "@/contexts/UserContext";
import { useAsset } from "@/hooks/useAsset";
import { useTheme } from "next-themes";

const FxIntro = () => {
    const navigate = useNavigate();
    const { walletTier } = useUser();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";
    const mainBg = useAsset("main-bg");
    const fxBanner = useAsset("fx-banner");

    useEffect(() => {
        if (walletTier !== "Starter") {
            navigate("/fx-exchange");
        }
    }, [walletTier, navigate]);

    return (
        <div
            className="min-h-screen w-full overflow-y-auto no-scrollbar scroll-smooth animate-in fade-in duration-500 relative flex flex-col items-center"
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${mainBg})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                fontFamily: "'Satoshi', sans-serif"
            }}
        >

            {/* Header */}
            <div className="shrink-0 relative flex items-center justify-between w-full px-5 pt-safe pt-4 pb-0 z-50">
                <BackButton onClick={() => navigate(-1)} />
                <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi absolute left-1/2 -translate-x-1/2`}>

                    FX Exchange
                </h1>
                <div className="w-10 h-10" />
            </div>

            {/* Content Container */}
            <div className="w-full max-w-sm px-5 flex-1 flex flex-col items-center relative z-10">
                
                {/* Banner Section */}
                <div className="mt-8 w-full h-[180px] rounded-[24px] overflow-hidden relative flex items-center justify-center border border-white/5 shadow-2xl">
                    <img 
                        src={fxBanner} 
                        alt="FX Banner" 
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <span className="text-white text-[24px] font-bold tracking-tight">FX PRO</span>
                        <span className="text-white/80 text-[14px]">International Payments</span>
                    </div>
                    {/* Glass Overlay for depth */}
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                </div>

                {/* Main Heading */}
                <h2 className={`mt-8 ${isDarkMode ? "text-white" : "text-black"} text-[16px] font-bold font-satoshi text-center leading-tight`}>
                    Requires Pro Wallet or above<br/>& KYC Verification
                </h2>

                {/* Prerequisites Section */}
                <div className="mt-6 w-full">
                    <h3 className={`${isDarkMode ? "text-white" : "text-black"} text-[16px] font-medium font-satoshi`}>
                        To access international FX, you’ll need:
                    </h3>
                    <ul className="mt-[10px] space-y-3">
                        <li className="flex items-start gap-2">
                            <span className={`${isDarkMode ? "text-white" : "text-black"} text-[14px] font-regular font-satoshi leading-[140%]`}>
                                • Passport/KYC — For secure, compliant transactions.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className={`${isDarkMode ? "text-white" : "text-black"} text-[14px] font-regular font-satoshi leading-[140%]`}>
                                • Pro Wallet Upgrade — Unlock premium FX rates & fraud protection.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Why Upgrade Section */}
                <div className="mt-10 w-full">
                    <h3 className={`${isDarkMode ? "text-white" : "text-black"} text-[18px] font-bold font-satoshi mb-4 text-left w-full`}>
                        Why Upgrade for FX?
                    </h3>
                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <span className="text-[18px] pt-[2px]">🔒</span>
                            <div className="flex flex-col">
                                <span className={`${isDarkMode ? "text-white" : "text-black"} text-[15px] font-bold font-satoshi leading-tight mb-1`}>Verified & Secure</span>
                                <p className={`${isDarkMode ? "text-white/60" : "text-black/60"} text-[14px] font-regular font-satoshi leading-tight`}>
                                    Every FX transaction is fully KYC-verified, ensuring compliance and safety.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-[18px] pt-[2px]">🛡️</span>
                            <div className="flex flex-col">
                                <span className={`${isDarkMode ? "text-white" : "text-black"} text-[15px] font-bold font-satoshi leading-tight mb-1`}>Fraud Protection</span>
                                <p className={`${isDarkMode ? "text-white/60" : "text-black/60"} text-[14px] font-regular font-satoshi leading-tight`}>
                                    Prevents misuse and keeps your money safe at all times.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-[18px] pt-[2px]">💱</span>
                            <div className="flex flex-col">
                                <span className={`${isDarkMode ? "text-white" : "text-black"} text-[15px] font-bold font-satoshi leading-tight mb-1`}>Best FX Rates</span>
                                <p className={`${isDarkMode ? "text-white/60" : "text-black/60"} text-[14px] font-regular font-satoshi leading-tight`}>
                                    Access premium live conversion rates, lower than airport kiosks.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-auto w-full pb-safe pb-6 flex justify-center">
                    <button
                        onClick={() => navigate("/wallet-settings")}
                        className="w-full h-[52px] bg-[#5260FE] rounded-full text-white text-[16px] font-medium font-satoshi active:scale-95 transition-transform shadow-xl shadow-[#5260FE]/20 flex items-center justify-center"
                    >
                        Upgrade Wallet & Verify KYC
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FxIntro;
