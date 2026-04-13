import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAsset } from "@/hooks/useAsset";
import { useTheme } from "next-themes";

const FxIntro = () => {
    const navigate = useNavigate();
    const { walletTier } = useUser();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";
    const mainBg = useAsset("main-bg");

    React.useEffect(() => {
        if (walletTier !== "Starter") {
            navigate("/fx-exchange");
        }
    }, [walletTier, navigate]);

    return (
        <div
            className="min-h-screen w-full overflow-y-auto no-scrollbar scroll-smooth safe-area-top animate-in fade-in duration-500 relative flex flex-col items-center"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${mainBg})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                fontFamily: "'Satoshi', sans-serif"
            }}
        >

            {/* Header */}
            <div className="shrink-0 relative flex items-center justify-center w-full px-5 pt-4 pb-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className={`absolute left-5 w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform ${isDarkMode ? 'bg-white/10 backdrop-blur-md' : 'bg-white border border-[#E9EAEB]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi`}>
                    FX Exchange
                </h1>
            </div>

            {/* Content Container - Increased max-width to accommodate content and margins */}
            <div className="w-full max-w-[410px] px-[24px] relative z-10">
                {/* Main Heading */}
                <h2 className={`mt-[46px] ${isDarkMode ? "text-white" : "text-black"} text-[16px] font-bold font-satoshi whitespace-nowrap`}>
                    Requires Pro Wallet or above & KYC Verification
                </h2>

                {/* Prerequisites Section */}
                <div className="mt-[24px]">
                    <h3 className={`${isDarkMode ? "text-white" : "text-black"} text-[16px] font-medium font-satoshi`}>
                        To access international FX, you’ll need:
                    </h3>
                    <ul className="mt-[10px] space-y-2">
                        <li className="flex items-start gap-2">
                            <span className={`${isDarkMode ? "text-white" : "text-black"} text-[14px] font-regular font-satoshi leading-[120%]`}>
                                • Passport/KYC — For secure, compliant transactions.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className={`${isDarkMode ? "text-white" : "text-black"} text-[14px] font-regular font-satoshi leading-[120%]`}>
                                • Pro Wallet Upgrade — Unlock premium FX rates & fraud protection.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Why Upgrade Section */}
                <div className="mt-[45px]">
                    <h3 className={`${isDarkMode ? "text-white" : "text-black"} text-[16px] font-bold font-satoshi`}>
                        Why Upgrade for FX Exchange?
                    </h3>
                    <div className="mt-[16px] space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="text-[15px] pt-[2px]">🔒</span>
                            <p className={`${isDarkMode ? "text-white" : "text-black"} text-[15px] font-regular font-satoshi leading-[120%]`}>
                                <span className="font-bold">Verified & Secure</span> — Every FX transaction is fully KYC-verified, ensuring compliance and passport-level safety.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-[15px] pt-[2px]">🛡️</span>
                            <p className={`${isDarkMode ? "text-white" : "text-black"} text-[15px] font-regular font-satoshi leading-[120%]`}>
                                <span className="font-bold">Fraud Protection</span> — Prevents misuse and keeps your money safe at all times.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-[15px] pt-[2px]">💱</span>
                            <p className={`${isDarkMode ? "text-white" : "text-black"} text-[15px] font-regular font-satoshi leading-[120%]`}>
                                <span className="font-bold">Best FX Rates</span> — Access premium live conversion rates, lower than airport kiosks and money changers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-auto pb-safe pb-4 flex justify-center">
                    <button
                        onClick={() => navigate("/wallet-settings")}
                        className="w-[362px] h-[48px] bg-[#5260FE] rounded-full text-white text-[16px] font-medium font-satoshi active:scale-95 transition-transform shadow-xl shadow-[#5260FE]/20"
                    >
                        Upgrade Wallet & Verify KYC
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FxIntro;
