import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import { SlideToPay } from "@/components/SlideToPay";
import starterSub from "@/assets/subscription-starter.png";
import proSub from "@/assets/subscription-pro.png";
import eliteSub from "@/assets/subscription-elite.png";
import supremeSub from "@/assets/subscription-supreme.png";
import subscriptionChip from "@/assets/subscription-chip.png";
import autoRefreshIcon from "@/assets/auto-refresh.svg";
import { useUser, WalletTier } from "@/contexts/UserContext";

const subscriptionBanners: Record<string, string> = {
    Starter: starterSub,
    Pro: proSub,
    Elite: eliteSub,
    Supreme: supremeSub,
};

const chipContent: Record<string, string> = {
    Starter: "FREE",
    Pro: "₹25/month",
    Elite: "₹50/month",
    Supreme: "₹100/month",
};

const tierPrice: Record<string, number> = {
    Starter: 0,
    Pro: 25,
    Elite: 50,
    Supreme: 100,
};

const DowngradeSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { walletTier, scheduleDowngrade } = useUser();
    const { tier } = location.state || { tier: "" };

    const bannerImage = subscriptionBanners[tier] || starterSub;

    // Calculate effective date (e.g. 1 month from now)
    const getEffectiveDate = () => {
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        const day = String(next.getDate()).padStart(2, "0");
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        return `${day} ${months[next.getMonth()]} ${next.getFullYear()}`;
    };

    const effectiveDate = getEffectiveDate();

    return (
        <div
            className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom"
            style={{
                fontFamily: "'Satoshi', sans-serif",
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Header */}
            <div className="shrink-0 relative flex items-center justify-center w-full px-5 pt-6 pb-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute left-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-white text-[22px] font-medium leading-[120%] font-satoshi">
                    Monthly Subscription
                </h1>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center pt-[36px] px-5">
                {/* Subscription Banner */}
                <div
                    className="w-[360px] h-[84px] rounded-[20px] relative"
                    style={{
                        backgroundImage: `url(${bannerImage})`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                    }}
                >
                    {/* Banner Text */}
                    <div className="absolute top-[13px] left-[77px] flex flex-col">
                        <span className="text-white text-[14px] font-medium font-satoshi uppercase">
                            WALLET - {tier}
                        </span>
                        <span className="text-white/70 text-[12px] italic font-satoshi mt-[8px]">
                            Billed monthly. Cancel anytime.
                        </span>
                    </div>
                    {/* Chip */}
                    <div
                        className="absolute top-[13px] right-[13px] w-[77px] h-[23px] rounded-full flex items-center justify-center gap-[4px]"
                        style={{
                            backgroundImage: `url(${subscriptionChip})`,
                            backgroundSize: "100% 100%",
                            backgroundRepeat: "no-repeat",
                        }}
                    >
                        <span className="text-white text-[10px] font-medium leading-[140%] tracking-[-0.3px] font-satoshi">
                            {chipContent[tier] || "FREE"}
                        </span>
                        {tier !== "Starter" && (
                            <img src={autoRefreshIcon} alt="" className="w-[10px] h-[10px]" />
                        )}
                    </div>
                </div>

                {/* To Pay Container */}
                <div
                    className="w-[362px] mt-[18px] rounded-[13px] flex flex-col gap-[10px] relative"
                    style={{
                        backgroundColor: "rgba(25, 25, 25, 0.31)",
                        backdropFilter: "blur(25px)",
                        WebkitBackdropFilter: "blur(25px)",
                        padding: "14px 11px",
                    }}
                >
                    {/* Border overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none rounded-[13px]"
                        style={{
                            padding: "0.63px",
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))",
                            WebkitMask:
                                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                        }}
                    />

                    {/* Heading */}
                    <h2 className="text-white text-[16px] font-bold leading-[120%] font-satoshi">
                        To Pay
                    </h2>

                    {/* Body */}
                    <p className="text-[#A4A4A4] text-[14px] font-light leading-[139%] font-satoshi">
                        No additional taxes apply. Processing fee is inclusive of all charges.
                    </p>

                    {/* Divider */}
                    <div className="w-[340px] h-[1px] bg-[#202020] mx-auto" />

                    {/* Monthly Subscription Fee Row */}
                    <div className="flex justify-between items-center mt-[2px]">
                        <span className="text-white text-[14px] font-medium leading-[139%] font-satoshi">
                            Monthly Subscription Fee
                        </span>
                        <span className="text-white text-[14px] font-bold leading-[120%] font-satoshi">
                            ₹{tierPrice[tier] || 0}
                        </span>
                    </div>

                    {/* First payment note */}
                    <p className="text-[#A4A4A4] text-[12px] font-normal leading-[139%] font-satoshi -mt-[2px]">
                        First payment will be charged today.
                    </p>

                    {/* Divider */}
                    <div className="w-[340px] h-[1px] bg-[#202020] mx-auto -mt-[2px]" />

                    {/* Total Payable Row */}
                    <div className="flex justify-between items-center -mt-[2px]">
                        <span className="text-white text-[14px] font-medium leading-[139%] font-satoshi">
                            Total Payable
                        </span>
                        <span className="text-white text-[14px] font-bold leading-[120%] font-satoshi">
                            ₹{tierPrice[tier] || 0}
                        </span>
                    </div>
                </div>

                {/* Second Container */}
                <div
                    className="w-[362px] h-[65px] mt-[14px] rounded-[13px] relative flex items-center"
                    style={{
                        backgroundColor: "rgba(25, 25, 25, 0.31)",
                        backdropFilter: "blur(25px)",
                        WebkitBackdropFilter: "blur(25px)",
                        padding: "12px 10px",
                    }}
                >
                    {/* Border overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none rounded-[13px]"
                        style={{
                            padding: "0.63px",
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))",
                            WebkitMask:
                                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                        }}
                    />
                    <p className="text-white text-[14px] font-normal leading-[147%] font-satoshi">
                        Renews automatically every month on your billing date. Cancel anytime from Settings — no extra charges.
                    </p>
                </div>

                {/* Next Payment Date Container */}
                <div
                    className="w-[362px] mt-[14px] rounded-[13px] relative flex justify-between items-center"
                    style={{
                        backgroundColor: "rgba(82, 96, 254, 0.21)",
                        backdropFilter: "blur(25px)",
                        WebkitBackdropFilter: "blur(25px)",
                        padding: "14px 11px",
                    }}
                >
                    {/* Border overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none rounded-[13px]"
                        style={{
                            padding: "0.63px",
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))",
                            WebkitMask:
                                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                        }}
                    />
                    <span className="text-white text-[14px] font-medium leading-[139%] font-satoshi">
                        Next Payment Date
                    </span>
                    <span className="text-white text-[14px] font-bold leading-[120%] font-satoshi">
                        {effectiveDate}
                    </span>
                </div>

                {/* Status Text for Downgrade */}
                <p className="w-[362px] mt-[14px] text-white text-[14px] font-normal leading-[140%] font-satoshi text-left">
                    Your wallet will be downgraded to {tier} Wallet. Changes will take place on your next billing date. Any balance above the new limit will be <span className="text-[#FF0000] font-bold">lost forever</span>.
                </p>
            </div>

            {/* Slide to Pay */}
            <div className="px-5 mt-auto pb-[42px] pt-[24px] shrink-0">
                <SlideToPay
                    onComplete={() => {
                        if (tier) {
                            scheduleDowngrade(tier as WalletTier, effectiveDate);
                        }
                        navigate("/subscriptions", { replace: true });
                    }}
                    label="Confirm Downgrade"
                />
            </div>
        </div>
    );
};

export default DowngradeSummary;
