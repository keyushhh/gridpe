import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import darkbgCta from "@/assets/darkbg-cta.png";
import riderKycImg from "@/assets/rider-kyc.png";
import hideKycImg from "@/assets/hide-kyc.png";
import lightmodeKycCoverImg from "@/assets/lightmode-kyc-cover.png";
import closeIcon from "@/assets/close.svg";
import popupCloseBtnBg from "@/assets/pop-up-close-btn.png";

const ViewRiderKyc = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const [isRevealed, setIsRevealed] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [rotation, setRotation] = useState(0);

    const toggleReveal = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setRotation(prev => prev + 360);

        // Slower animation (1000ms)
        setTimeout(() => {
            setIsRevealed(!isRevealed);
            setIsAnimating(false);
        }, 1000);
    };

    return (
        <div
            className={`fixed inset-0 w-full h-full flex flex-col safe-area-top safe-area-bottom overflow-hidden ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Purple Glow */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}

            {/* Header */}
            <div
                className="safe-area-top px-5 flex items-center justify-between pb-6"
                style={{ paddingTop: "24px" }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md relative z-20 ${isDarkMode ? 'bg-white/10' : 'bg-white border border-[#E9EAEB]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>

                <h1 className={`text-[18px] font-medium font-satoshi flex-1 text-center pr-10 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Partner KYC
                </h1>
            </div>

            <div className="px-5 flex flex-col items-center">
                {/* KYC Image Container - 43px below header */}
                <div
                    onClick={toggleReveal}
                    className="mt-[43px] rounded-[13px] overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative transition-transform duration-1000 ease-in-out"
                    style={{
                        width: "316px",
                        height: "402px",
                        backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.31)" : "#FFFFFF",
                        backdropFilter: isDarkMode ? "blur(25.02px)" : "none",
                        border: isDarkMode ? "0.63px solid rgba(255, 255, 255, 0.12)" : "1px solid #E9EAEB",
                        perspective: '1000px',
                        transform: `rotateY(${rotation}deg)`
                    }}
                >
                    {/* Main KYC Image */}
                    <img
                        src={riderKycImg}
                        alt="Rider KYC"
                        className={`w-full h-full object-cover transition-all duration-300 ${!isRevealed ? `blur-[20px] ${isDarkMode ? 'brightness-[0.25]' : 'brightness-[0.9]'}` : 'blur-0 brightness-100'}`}
                    />

                    {/* Overlay */}
                    {!isRevealed && !isAnimating && (
                        <div className="absolute inset-0 z-10 transition-opacity duration-300">
                            <img
                                src={isDarkMode ? hideKycImg : lightmodeKycCoverImg}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                            {/* Text Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center">
                                <p className="mt-[162px] text-[18px] font-bold font-satoshi text-center flex items-center justify-center h-[22px] text-white">
                                    Tap to view verified KYC ID
                                </p>
                                <p className="mt-[19px] text-[16px] font-normal font-satoshi text-center leading-[120%] text-white">
                                    Yes, you’re allowed to<br />snoop responsibly.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Close Button - 17px below container */}
                <button
                    onClick={() => navigate(-1)}
                    className={`mt-[17px] w-[137px] h-[42px] flex items-center justify-center gap-[6px] active:scale-95 transition-transform shrink-0 ${!isDarkMode ? 'bg-[#5260FE] rounded-full' : ''}`}
                    style={{
                        backgroundImage: isDarkMode ? `url(${popupCloseBtnBg})` : 'none',
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <img src={closeIcon} alt="" className="w-6 h-6" />
                    <span
                        className="text-[16px] font-medium leading-[120%] font-satoshi text-white"
                    >
                        Close
                    </span>
                </button>

                {/* Need Help CTA - 75px below close button */}
                <div className="mt-[75px] w-[364px]">
                    <button
                        onClick={() => navigate('/report-rider-kyc')}
                        className={`w-full h-[48px] rounded-full text-white text-[16px] font-medium active:scale-95 transition-transform flex items-center justify-center ${!isDarkMode ? 'bg-black' : ''}`}
                        style={{
                            backgroundImage: isDarkMode ? `url(${darkbgCta})` : 'none',
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                        }}
                    >
                        Need Help?
                    </button>
                </div>

                {/* Footer Security Text - 55px below need help */}
                <p className={`mt-[55px] text-[16px] font-medium font-satoshi text-center ${isDarkMode ? 'text-[#9C9C9C]' : 'text-[#7E7E7E]'}`}>
                    (Optional – helps us keep things secure)
                </p>

                {/* Hyperlink - 10px below security text */}
                <button
                    onClick={() => navigate('/verify-rider-kyc')}
                    className={`mt-[10px] text-[16px] font-medium font-satoshi text-center underline pb-10 active:opacity-70 transition-opacity ${isDarkMode ? 'text-white' : 'text-[#5260FE]'}`}
                >
                    Does this KYC look correct?
                </button>
            </div>
        </div>
    );
};

export default ViewRiderKyc;
