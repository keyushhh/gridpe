import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "next-themes";
import { useAsset } from "@/hooks/useAsset";

// Assets
import walletStarter from "@/assets/fx-wallet-starter.png";
import walletPro from "@/assets/fx-wallet-pro.png";
import walletElite from "@/assets/fx-wallet-elite.png";
import walletSupreme from "@/assets/fx-wallet-supreme.png";

// New light cards
import walletStarterLight from "@/assets/light-cards/fx-wallet-starter-light.png";
import walletProLight from "@/assets/light-cards/fx-wallet-pro-light.png";
import walletEliteLight from "@/assets/light-cards/fx-wallet-elite-light.png";
import walletSupremeLight from "@/assets/light-cards/fx-wallet-supreme-light.png";

import iconDone from "@/assets/done.svg";
import iconCurrent from "@/assets/current.svg";
import iconPending from "@/assets/pending.svg";

const FxPassportGate = () => {
    const navigate = useNavigate();
    const { walletTier, isPassportVerified } = useUser();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";
    const mainBg = useAsset("main-bg");

    // Mapping for assets and tier names
    const tierConfig: Record<string, { dark: string; light: string; text: string }> = {
        'Starter': { dark: walletStarter, light: walletStarterLight, text: 'STARTER' },
        'Pro': { dark: walletPro, light: walletProLight, text: 'PRO' },
        'Elite': { dark: walletElite, light: walletEliteLight, text: 'ELITE' },
        'Supreme': { dark: walletSupreme, light: walletSupremeLight, text: 'SUPREME' },
    };

    const currentTier = tierConfig[walletTier] || tierConfig['Pro'];

    React.useEffect(() => {
        if (walletTier === 'Starter') {
            navigate('/fx-intro', { replace: true });
        } else if (isPassportVerified) {
            navigate('/fx-exchange', { replace: true });
        }
    }, [walletTier, isPassportVerified, navigate]);

    return (
        <div
            className={`h-screen w-full overflow-hidden flex flex-col pt-4 safe-area-top relative ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-white'}`}
            style={{
                backgroundImage: `url(${mainBg})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                fontFamily: "'Satoshi', sans-serif"
            }}
        >
            {/* Header */}
            <div
                className="w-full px-5 flex items-center justify-between z-10 mb-[21px] relative"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${isDarkMode ? "bg-white/10 backdrop-blur-md" : "bg-white border border-[#E9EAEB]"}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-black"}`} />
                </button>
                <h1 className={`${isDarkMode ? "text-white" : "text-black"} text-[24px] font-medium font-sans`}>
                    FX Exchange
                </h1>
                <div className="w-10" />
            </div>

            <div className="w-full max-w-[360px] px-5 flex flex-col items-center flex-1">
                {/* Tier Container */}
                <div
                    className="w-[360px] h-[101px] rounded-[20px] relative overflow-hidden mt-2 shrink-0"
                    style={{
                        backgroundImage: `url(${isDarkMode ? currentTier.dark : currentTier.light})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: !isDarkMode ? "1px solid #E9EAEB" : "none"
                    }}
                >
                    <div className="absolute top-[14px] left-[63px] right-4">
                        <h3 className={`${isDarkMode ? "text-white" : "text-black"} text-[14px] font-bold tracking-tight`}>
                            WALLET - {currentTier.text}
                        </h3>
                        <p className={`${isDarkMode ? "text-white/80" : "text-black/80"} text-[11px] font-medium leading-[130%] mt-[5px]`}>
                            As a {currentTier.text} user, your standard KYC is complete. However, international FX regulations require a verified Passport for all currency exchanges.
                        </p>
                    </div>
                </div>

                {/* Lottie Animation */}
                <div className="w-full aspect-square max-w-[280px] -mt-4 relative z-0">
                    <DotLottieReact
                        src="https://lottie.host/288d606e-e2aa-4ba6-bc35-eb24029c38e8/BufkfUcJsW.lottie"
                        loop
                        autoplay
                    />
                </div>

                {/* Steps Section */}
                <div className="w-full px-8 -mt-2 space-y-0 relative">
                    {/* Vertical Dotted Line */}
                    <div className={`absolute left-[44px] top-[14px] bottom-[14px] w-[1px] border-l border-dashed ${isDarkMode ? "border-white/20" : "border-[#E9EAEB]"}`} />

                    {/* Step 1 */}
                    <div className="flex items-center gap-4 relative py-3">
                        <div className={`w-6 h-6 rounded-full ${isDarkMode ? "bg-[#0a0a12]" : "bg-white"} relative z-10 flex items-center justify-center`}>
                            <img src={iconDone} alt="Done" className="w-6 h-6" />
                        </div>
                        <span className={`${isDarkMode ? "text-white" : "text-black"} text-[14px] font-medium font-satoshi`}>Standard KYC Complete</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-4 relative py-3">
                        <div className={`w-6 h-6 rounded-full ${isDarkMode ? "bg-[#0a0a12]" : "bg-white"} relative z-10 flex items-center justify-center`}>
                            <img src={iconCurrent} alt="Current" className="w-6 h-6" />
                        </div>
                        <span className={`${isDarkMode ? "text-white" : "text-black"} text-[14px] font-medium font-satoshi`}>Passport Verification</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center gap-4 relative py-3">
                        <div className={`w-6 h-6 rounded-full ${isDarkMode ? "bg-[#0a0a12]" : "bg-[#CCFFDE]"} relative z-10 flex items-center justify-center`}>
                            {isDarkMode && <img src={iconPending} alt="Pending" className="w-6 h-6" />}
                        </div>
                        <span className={`${isDarkMode ? "text-white" : "text-black"} text-[14px] font-medium font-satoshi`}>FX Enabled</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="w-full mt-auto pt-4 pb-safe pb-4 flex flex-col items-center">
                    <button
                        onClick={() => navigate('/kyc-form?flow=fx')}
                        className="w-full h-[48px] bg-[#5260FE] rounded-full text-white text-[16px] font-medium active:scale-95 transition-transform"
                    >
                        Continue with Passport KYC
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className={`mt-[18px] ${isDarkMode ? "text-white/40" : "text-black/40"} text-[14px] font-medium active:scale-95 transition-transform`}
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FxPassportGate;
