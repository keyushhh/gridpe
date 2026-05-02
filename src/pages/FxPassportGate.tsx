import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
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
    const { walletTier, isPassportVerified, fetchProfileData } = useUser();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";
    const mainBg = useAsset("main-bg");
    const [isLoading, setIsLoading] = useState(true);

    // Mapping for assets and tier names
    const tierConfig: Record<string, { dark: string; light: string; text: string }> = {
        'Starter': { dark: walletStarter, light: walletStarterLight, text: 'STARTER' },
        'Pro': { dark: walletPro, light: walletProLight, text: 'PRO' },
        'Elite': { dark: walletElite, light: walletEliteLight, text: 'ELITE' },
        'Supreme': { dark: walletSupreme, light: walletSupremeLight, text: 'SUPREME' },
    };

    const currentTier = tierConfig[walletTier] || tierConfig['Pro'];

    useEffect(() => {
        let cancelled = false;
        const checkAccess = async () => {
            try {
                await fetchProfileData();
            } catch (err) {
                console.error('Failed to fetch profile in FxPassportGate:', err);
            }
            if (!cancelled) {
                setIsLoading(false);
            }
        };
        checkAccess();
        return () => { cancelled = true; };
    }, [fetchProfileData]);

    useEffect(() => {
        if (isLoading) return;
        if (walletTier === 'Starter') {
            navigate('/fx-intro');
        } else if (isPassportVerified) {
            navigate('/fx-exchange');
        }
    }, [isLoading, walletTier, isPassportVerified, navigate]);

    if (isLoading) {
        return (
            <div className={`min-h-screen w-full flex items-center justify-center ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-white'}`}>
                <svg className={`animate-spin h-8 w-8 ${isDarkMode ? 'text-white' : 'text-[#5260FE]'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen w-full overflow-y-auto no-scrollbar flex flex-col items-center relative animate-in fade-in duration-500 ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-white'}`}
            style={{
                backgroundImage: `url(${mainBg})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                fontFamily: "'Satoshi', sans-serif"
            }}
        >
            {/* Header */}
            <div className="shrink-0 relative flex items-center justify-between w-full px-5 safe-top pt-4 pb-0 z-50">
                <BackButton onClick={() => navigate(-1)} />

                <h1 className={`${isDarkMode ? "text-white" : "text-black"} text-[22px] font-medium font-sans absolute left-1/2 -translate-x-1/2`}>
                    FX Exchange
                </h1>
                <div className="w-10 h-10" />
            </div>

            <div className="w-full max-w-sm px-5 flex flex-col items-center flex-1 pb-10">
                {/* Tier Container */}
                <div
                    className="w-full h-[101px] rounded-[20px] relative overflow-hidden mt-6 shrink-0"
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
                <div className="w-full aspect-square max-w-[260px] -mt-2 relative z-0 flex items-center justify-center">
                    <DotLottieReact
                        src="https://lottie.host/288d606e-e2aa-4ba6-bc35-eb24029c38e8/BufkfUcJsW.lottie"
                        loop
                        autoplay
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>

                {/* Steps Section */}
                <div className="w-full px-4 -mt-4 mb-8 space-y-0 relative">
                    {/* Vertical Dotted Line */}
                    <div className={`absolute left-[28px] top-[14px] bottom-[14px] w-[1px] border-l border-dashed ${isDarkMode ? "border-white/20" : "border-[#E9EAEB]"}`} />

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
                        <div className={`w-6 h-6 rounded-full ${isDarkMode ? (isDarkMode ? "bg-[#0a0a12]" : "bg-white") : "bg-[#CCFFDE]"} border ${isDarkMode ? "border-white/20" : "border-[#E9EAEB]"} relative z-10 flex items-center justify-center overflow-hidden`}>
                            {isDarkMode ? <img src={iconPending} alt="Pending" className="w-6 h-6 opacity-30" /> : <div className="w-2 h-2 rounded-full bg-[#1CB956]" />}
                        </div>
                        <span className={`${isDarkMode ? "text-white/40" : "text-black/40"} text-[14px] font-medium font-satoshi`}>FX Enabled</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="w-full mt-auto flex flex-col items-center safe-bottom pb-4">
                    <button
                        onClick={() => navigate('/kyc-form?flow=fx')}
                        className="w-full h-[52px] bg-[#5260FE] rounded-full text-white text-[16px] font-bold active:scale-95 transition-transform shadow-xl shadow-[#5260FE]/20"
                    >
                        Continue with Passport KYC
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className={`mt-5 ${isDarkMode ? "text-white/40" : "text-black/40"} text-[14px] font-medium active:scale-95 transition-transform hover:underline underline-offset-4`}
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FxPassportGate;
