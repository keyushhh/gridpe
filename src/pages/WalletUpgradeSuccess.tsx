import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import successBg from "@/assets/success-bg.png";
import checkIcon from "@/assets/check-icon.png";

const WalletUpgradeSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tier } = location.state || { tier: "" };

    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col items-center relative safe-area-top safe-area-bottom px-5"
            style={{
                backgroundImage: `url(${successBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Heading */}
            <div className="w-full pt-6 flex justify-center">
                <h1 className="text-white text-[22px] font-medium leading-[120%] font-satoshi">
                    Wallet Upgraded
                </h1>
            </div>

            {/* Check Icon with Confetti */}
            <div className="mt-[16px] flex justify-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none z-0">
                    <DotLottieReact
                        src="https://lottie.host/b8c059a0-44f6-4063-931d-97446df3f817/kBvN9GRUXy.lottie"
                        loop={true}
                        autoplay
                    />
                </div>
                <img src={checkIcon} alt="Success" className="w-[62px] h-[62px] object-contain relative z-10" />
            </div>

            {/* Subheading */}
            <h2 className="text-white text-[18px] font-bold font-satoshi text-center mt-[35px] leading-[140%]">
                Extra space, extra power - all yours! 🎉
            </h2>

            {/* Details Container */}
            <div
                className="w-[362px] h-[162px] mt-[35px] rounded-[13px] relative"
                style={{
                    backgroundColor: "rgba(0, 0, 0, 0.20)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    backdropFilter: "blur(25px)",
                    WebkitBackdropFilter: "blur(25px)",
                    padding: "12px 14px",
                }}
            >
                <p className="text-[#AFAFAF] text-[16px] font-normal font-sans leading-[120%] tracking-[0px]">
                    Your wallet has been upgraded to {tier?.toUpperCase() || "PRO"}.
                    <br />
                    Benefits include:
                </p>
                <ul className="list-disc pl-4 mt-[17px] text-[#AFAFAF] text-[16px] font-normal font-sans leading-[120%] tracking-[0px]">
                    <li>Wallet limit ₹15,000</li>
                    <li>Faster deposits & withdrawals</li>
                    <li>Priority support</li>
                    <li>Deposit limit increased to ₹10,000/day</li>
                </ul>
            </div>

            {/* CTA Button */}
            <div className="w-full mt-auto mb-[50px] flex justify-center">
                <button
                    onClick={() => {
                        if (location.state?.fromSubscriptionDashboard) {
                            navigate("/subscriptions", { replace: true });
                        } else {
                            navigate("/wallet-created", { replace: true });
                        }
                    }}
                    className="w-[361px] h-[48px] rounded-[296px] bg-[#5260FE] flex items-center justify-center text-white text-[16px] font-bold font-satoshi active:scale-95 transition-transform"
                >
                    {location.state?.fromSubscriptionDashboard ? "Go to Subscriptions" : "View Wallet"}
                </button>
            </div>
        </div>
    );
};

export default WalletUpgradeSuccess;
