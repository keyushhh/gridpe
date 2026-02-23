import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { ChevronLeft } from "lucide-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import { SlideToPay } from "@/components/SlideToPay";
import starterSub from "@/assets/starter-subscription.png";
import proSub from "@/assets/pro-subscription.png";
import eliteSub from "@/assets/elite-subscription.png";
import supremeSub from "@/assets/supreme-subscription.png";

// Light Mode Assets
import starterSubLight from "@/assets/light-cards/starter-subscription-light.png";
import proSubLight from "@/assets/light-cards/pro-subscription-light.png";
import eliteSubLight from "@/assets/light-cards/elite-subscription-light.png";
import supremeSubLight from "@/assets/light-cards/supreme-subscription-light.png";

import subscriptionChip from "@/assets/subscription-chip.png";
import autoRefreshIcon from "@/assets/auto-refresh.svg";
import { tierChipColorMap } from "@/lib/walletTiers";

const subscriptionBanners: Record<string, string> = {
    Starter: starterSub,
    Pro: proSub,
    Elite: eliteSub,
    Supreme: supremeSub,
};

const subscriptionBannersLight: Record<string, string> = {
    Starter: starterSubLight,
    Pro: proSubLight,
    Elite: eliteSubLight,
    Supreme: supremeSubLight,
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

import { useUser, WalletTier } from "@/contexts/UserContext";

const SubscriptionSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';
    const { setWalletTier, walletTier } = useUser();
    const { tier, paymentMethod } = location.state || { tier: "", paymentMethod: "" };

    const bannerImage = isDarkMode ? (subscriptionBanners[tier] || starterSub) : (subscriptionBannersLight[tier] || starterSubLight);

    return (
        <div
            className={`h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
            style={{
                fontFamily: "'Satoshi', sans-serif",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Header */}
            <div className="shrink-0 relative flex items-center justify-center w-full px-5 pt-6 pb-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className={`absolute left-5 w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform ${isDarkMode ? 'bg-white/10 backdrop-blur-md' : 'bg-white border border-[#E9EAEB]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi`}>
                    Monthly Subscription
                </h1>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center pt-[36px] px-5">
                {/* Subscription Banner */}
                <div
                    className={`w-full max-w-[362px] h-[70px] rounded-[20px] relative ${!isDarkMode ? 'border border-[#E9EAEB]' : ''}`}
                    style={{
                        backgroundImage: `url(${bannerImage})`,
                        backgroundSize: isDarkMode ? "100% 100%" : "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        border: !isDarkMode ? "1px solid #F2F2F7" : "none",
                    }}
                >
                    {/* Banner Text */}
                    <div className="absolute top-[13px] left-[77px] flex flex-col">
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-satoshi`}>
                            WALLET - {tier?.toUpperCase() || "PRO"}
                        </span>
                        <span className={`${isDarkMode ? 'text-white/70' : 'text-black/70'} text-[12px] italic font-satoshi mt-[8px]`}>
                            Billed monthly. Cancel anytime.
                        </span>
                    </div>
                    {/* Chip */}
                    <div
                        className="absolute top-[13px] right-[13px] w-[77px] h-[23px] rounded-full flex items-center justify-center gap-[4px]"
                        style={isDarkMode
                            ? {
                                backgroundImage: `url(${subscriptionChip})`,
                                backgroundSize: "100% 100%",
                                backgroundRepeat: "no-repeat",
                            }
                            : {
                                backgroundColor: tierChipColorMap[tier as WalletTier] || '#000000',
                            }
                        }
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
                    className={`w-full max-w-[362px] mt-[18px] rounded-[13px] flex flex-col gap-[10px] relative border ${isDarkMode ? 'bg-[#191919]/31 backdrop-blur-25 border-white/12' : 'bg-white border-[#E9EAEB]'}`}
                    style={{
                        padding: "14px 11px",
                    }}
                >
                    {/* Border overlay */}
                    {isDarkMode && (
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
                    )}

                    {/* Heading */}
                    <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold leading-[120%] font-satoshi`}>
                        To Pay
                    </h2>

                    {/* Body */}
                    <p className={`${isDarkMode ? 'text-[#A4A4A4] font-light' : 'text-black/80 font-normal'} text-[14px] leading-[139%] font-satoshi`}>
                        No additional taxes apply. Processing fee is inclusive of all charges.
                    </p>

                    {/* Divider */}
                    <div className={`w-[340px] h-[1px] mx-auto ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E9EAEB]'}`} />

                    {/* Monthly Subscription Fee Row */}
                    <div className="flex justify-between items-center mt-[2px]">
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-[139%] font-satoshi`}>
                            Monthly Subscription Fee
                        </span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-bold leading-[120%] font-satoshi`}>
                            ₹{tierPrice[tier] || 0}
                        </span>
                    </div>

                    {/* First payment note */}
                    <p className={`${isDarkMode ? 'text-[#A4A4A4] font-normal' : 'text-black/80 font-normal'} text-[12px] leading-[139%] font-satoshi -mt-[2px]`}>
                        First payment will be charged today.
                    </p>

                    {/* Divider */}
                    <div className={`w-[340px] h-[1px] mx-auto -mt-[2px] ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E9EAEB]'}`} />

                    {/* Total Payable Row */}
                    <div className="flex justify-between items-center -mt-[2px]">
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-[139%] font-satoshi`}>
                            Total Payable
                        </span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-bold leading-[120%] font-satoshi`}>
                            ₹{tierPrice[tier] || 0}
                        </span>
                    </div>
                </div>

                {/* Second Container */}
                <div
                    className={`w-full max-w-[362px] min-h-[65px] mt-[14px] rounded-[13px] relative flex items-center border ${isDarkMode ? 'bg-[#191919]/31 backdrop-blur-25 border-white/12' : 'bg-white border-[#E9EAEB]'}`}
                    style={{
                        padding: "12px 10px",
                    }}
                >
                    {isDarkMode && (
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
                    )}
                    <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal leading-[147%] font-satoshi`}>
                        Renews automatically every month on your billing date. Cancel anytime from Settings — no extra charges.
                    </p>
                </div>

                {/* Next Payment Date Container */}
                <div
                    className={`w-full max-w-[362px] mt-[14px] rounded-[13px] relative flex justify-between items-center border ${isDarkMode ? 'bg-[#5260FE]/21 backdrop-blur-25 border-white/12' : 'bg-[#E2E4FF] border-[#5260FE]'}`}
                    style={{
                        padding: "14px 11px",
                    }}
                >
                    {isDarkMode && (
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
                    )}
                    <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-[139%] font-satoshi`}>
                        Next Payment Date
                    </span>
                    <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-bold leading-[120%] font-satoshi`}>
                        {(() => {
                            const next = new Date();
                            next.setMonth(next.getMonth() + 1);
                            const day = String(next.getDate()).padStart(2, "0");
                            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
                            return `${day} ${months[next.getMonth()]} ${next.getFullYear()}`;
                        })()}
                    </span>
                </div>

                {/* Status Text for Upgrade/Downgrade */}
                {(() => {
                    const stateFlow = location.state?.flow;
                    // User Request: 
                    // "upgrading from starter to any tier, the small note will not appear"
                    // "should appear only from pro till supreme, and whilte downgrading, it should appear on all the tiers"

                    const shouldShowNote =
                        stateFlow === 'downgrade' ||
                        (stateFlow === 'upgrade' && walletTier !== 'Starter');

                    if (!shouldShowNote) return null;

                    const actionVerb = stateFlow === 'downgrade' ? 'downgraded' : 'upgraded';

                    return (
                        <p className={`w-full max-w-[362px] mt-[14px] text-[14px] font-normal leading-[140%] font-satoshi text-left ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Your wallet will be {actionVerb} to {tier} Wallet. Changes will take place on your next billing date. Till then you may enjoy the benefits of {walletTier} Wallet.
                        </p>
                    );
                })()}
            </div>

            {/* Slide to Pay */}
            <div className="px-5 mt-auto pb-[42px] pt-[24px] shrink-0">
                <SlideToPay
                    onComplete={() => {
                        if (tier) {
                            setWalletTier(tier as WalletTier);
                        }

                        if (location.state?.flow === 'downgrade') {
                            navigate("/wallet-created");
                        } else {
                            navigate("/wallet-upgrade-success", { state: { tier, flow: location.state?.flow }, replace: true });
                        }
                    }}
                    label={location.state?.flow === 'downgrade' ? "Confirm Downgrade" : "Start Monthly Subscription"}
                />
            </div>
        </div>
    );
};

export default SubscriptionSummary;
