import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import successBg from "@/assets/success-bg.png";
import checkIcon from "@/assets/check-icon.svg";
import checkIconLight from "@/assets/check-icon-light.svg";
import darkBgCta from "@/assets/darkbg-cta.png";

const WalletWithdrawSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';

    const { amount: rawAmount, selectedMethod } = location.state || {};
    const amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount || '0');

    const [timeLeft, setTimeLeft] = useState(30);

    const formattedAmount = (amount || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Handle redirection timer
    useEffect(() => {
        if (timeLeft <= 0) {
            navigate("/home");
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, navigate]);

    return (
        <div
            className={`h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom pb-20 ${isDarkMode ? '' : 'bg-white'}`}
            style={isDarkMode ? {
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${successBg})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            } : {}}
        >
            {/* Light Mode Success Orb (Top Glow) */}
            {!isDarkMode && (
                <div
                    className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
                    style={{
                        backgroundColor: "#0C7E4B",
                        filter: "blur(60px)",
                        opacity: 0.9,
                        mixBlendMode: "normal"
                    }}
                />
            )}

            {/* Header */}
            <div className="px-5 pt-4 flex items-center justify-center relative z-10 shrink-0">
                <button
                    onClick={() => navigate("/wallet-created")}
                    className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md absolute left-5 ${isDarkMode ? 'bg-white/10' : 'bg-[#F2F2F2] border border-[#E9EAEB]'
                        }`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi`}>
                    Withdraw
                </h1>
            </div>

            <div className="flex-1 flex flex-col items-center px-5 pt-[16px] z-10">
                {/* Icon - 16px below heading */}
                <img src={isDarkMode ? checkIcon : checkIconLight} alt="Success" className="w-[62px] h-[62px]" />

                {/* Sub-text - 35px below icon */}
                <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-bold mt-[35px] text-center px-4 font-satoshi`}>
                    Your request has been processed. Big baller energy confirmed. 🎉
                </h2>

                {/* Container - 20px below sub-text */}
                <div
                    className={`mt-[20px] w-[362px] h-[166px] rounded-[13px] relative overflow-hidden flex flex-col items-start justify-center text-left px-[22px] ${isDarkMode ? '' : 'border border-[#E9EAEB]'}`}
                    style={{
                        backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.20)" : "transparent",
                    }}
                >
                    {/* Border Overlay */}
                    {isDarkMode && (
                        <div
                            className="absolute inset-0 pointer-events-none rounded-[13px]"
                            style={{
                                border: '1px solid rgba(255, 255, 255, 0.06)'
                            }}
                        />
                    )}
                    <p className={`${isDarkMode ? 'text-[#AFAFAF]' : 'text-black'} text-[16px] font-normal leading-tight font-satoshi`}>
                        We just moved {formattedAmount} to your bank account. That’s not a withdrawal. That’s a flex. Your bank might even call to check if you’re okay.
                    </p>
                    <div style={{ height: '18px' }} />
                    <p className={`${isDarkMode ? 'text-[#AFAFAF]' : 'text-black'} text-[16px] font-normal leading-tight font-satoshi`}>
                        Give it up to 30 minutes to reflect. Or stare at your account like it owes you interest.
                    </p>
                </div>

                {/* CTAs Section - 71px below container */}
                <div className="mt-[71px] w-full flex flex-col items-center">
                    <button
                        onClick={() => navigate("/wallet-created")}
                        className="w-full h-[48px] rounded-full text-white text-[16px] font-medium flex items-center justify-center active:scale-95 transition-transform bg-[#6C72FF] font-satoshi"
                    >
                        View Withdrawal Status
                    </button>

                    <button
                        onClick={() => navigate("/home")}
                        className={`mt-[10px] w-full h-[48px] rounded-full text-white text-[16px] font-medium flex items-center justify-center active:scale-95 transition-transform font-satoshi ${isDarkMode ? '' : 'bg-black'}`}
                        style={isDarkMode ? {
                            backgroundImage: `url(${darkBgCta})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                        } : {}}
                    >
                        Redirecting Home in {timeLeft}s...
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WalletWithdrawSuccess;
