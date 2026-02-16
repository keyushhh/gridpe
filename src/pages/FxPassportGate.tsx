import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useUser } from "@/contexts/UserContext";
import bgDarkMode from "@/assets/bg-dark-mode.png";

// Assets
import walletStarter from "@/assets/fx-wallet-starter.png";
import walletPro from "@/assets/fx-wallet-pro.png";
import walletElite from "@/assets/fx-wallet-elite.png";
import walletSupreme from "@/assets/fx-wallet-supreme.png";
import iconDone from "@/assets/done.svg";
import iconCurrent from "@/assets/current.svg";
import iconPending from "@/assets/pending.svg";

const FxPassportGate = () => {
    const navigate = useNavigate();
    const { walletTier, isPassportVerified } = useUser();

    // Mapping for assets and tier names
    const tierConfig: Record<string, { bg: string; text: string }> = {
        'Starter': { bg: walletStarter, text: 'STARTER' },
        'Pro': { bg: walletPro, text: 'PRO' },
        'Elite': { bg: walletElite, text: 'ELITE' },
        'Supreme': { bg: walletSupreme, text: 'SUPREME' },
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
            className="min-h-screen w-full overflow-y-auto no-scrollbar scroll-smooth safe-area-bottom animate-in fade-in duration-500 relative flex flex-col items-center"
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
                className="w-full px-5 flex items-center justify-between z-10 mb-[21px] relative"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-white text-[24px] font-medium font-sans">
                    FX Exchange
                </h1>
                <div className="w-10" />
            </div>

            <div className="w-full max-w-[360px] px-5 flex flex-col items-center">
                {/* Tier Container */}
                <div
                    className="w-[360px] h-[101px] rounded-[20px] relative overflow-hidden mt-2 shrink-0"
                    style={{
                        backgroundImage: `url(${currentTier.bg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="absolute top-[14px] left-[63px] right-4">
                        <h3 className="text-white text-[14px] font-bold tracking-tight">
                            WALLET - {currentTier.text}
                        </h3>
                        <p className="text-white/80 text-[11px] font-medium leading-[130%] mt-[5px]">
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
                    <div className="absolute left-[44px] top-[14px] bottom-[14px] w-[1px] border-l border-dashed border-white/20" />

                    {/* Step 1 */}
                    <div className="flex items-center gap-4 relative py-3">
                        <div className="w-6 h-6 rounded-full bg-[#0a0a12] relative z-10 flex items-center justify-center">
                            <img src={iconDone} alt="Done" className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[14px] font-medium">Standard KYC Complete</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-4 relative py-3">
                        <div className="w-6 h-6 rounded-full bg-[#0a0a12] relative z-10 flex items-center justify-center">
                            <img src={iconCurrent} alt="Current" className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[14px] font-medium">Passport Verification</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center gap-4 relative py-3">
                        <div className="w-6 h-6 rounded-full bg-[#0a0a12] relative z-10 flex items-center justify-center">
                            <img src={iconPending} alt="Pending" className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[14px] font-medium">FX Enabled</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="w-full mt-auto pt-10 pb-10 flex flex-col items-center">
                    <button
                        onClick={() => navigate('/kyc-form?flow=fx')}
                        className="w-full h-[48px] bg-[#5260FE] rounded-full text-white text-[16px] font-medium active:scale-95 transition-transform"
                    >
                        Continue with Passport KYC
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-[18px] text-white/40 text-[14px] font-medium active:scale-95 transition-transform"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FxPassportGate;
