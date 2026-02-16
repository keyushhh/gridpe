import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useUser, WalletTier } from "@/contexts/UserContext";
import { tiers } from "@/lib/walletTiers";
import bgDarkMode from "@/assets/bg-dark-mode.png";

// Import Assets
import subStarterBg from "@/assets/subscription-starter.png";
import subProBg from "@/assets/subscription-pro.png";
import subEliteBg from "@/assets/subscription-elite.png";
import subSupremeBg from "@/assets/subscription-supreme.png";
import downgradeChip from "@/assets/downgrade-chip.png";

const subscriptionBgs: Record<WalletTier, string> = {
    Starter: subStarterBg,
    Pro: subProBg,
    Elite: subEliteBg,
    Supreme: subSupremeBg,
};

const upgradePrices: Record<WalletTier, number> = {
    Starter: 25,
    Pro: 50,
    Elite: 100,
    Supreme: 0, // No upgrade from Supreme
};

const nextTierMap: Record<WalletTier, WalletTier | null> = {
    Starter: 'Pro',
    Pro: 'Elite',
    Elite: 'Supreme',
    Supreme: null,
};

const Subscriptions = () => {
    const navigate = useNavigate();
    const { walletTier, walletLimit, walletBalance, scheduledDowngrade, completeScheduledDowngrade } = useUser();
    const currentTierConfig = tiers.find(t => t.name === walletTier);

    if (!currentTierConfig) return null;

    const isProPlus = walletTier !== 'Starter';
    const containerHeight = scheduledDowngrade ? '155px' : (isProPlus ? '195px' : '166px');
    const backgroundImage = subscriptionBgs[walletTier];
    const upgradePrice = upgradePrices[walletTier];
    const nextTier = nextTierMap[walletTier];

    // Calculate consumption
    const consumptionPercentage = Math.min((walletBalance / walletLimit) * 100, 100);

    const handleUpgrade = () => {
        if (nextTier && !scheduledDowngrade) {
            navigate('/wallet-tier/' + nextTier.toLowerCase(), {
                state: { fromSubscriptionDashboard: true }
            });
        }
    };

    return (
        <div
            className="h-full w-full overflow-y-auto overscroll-y-contain flex flex-col safe-area-top safe-area-bottom pb-10"
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
            <header className="px-5 pt-12 pb-2 flex items-center relative z-10 shrink-0">
                <button
                    onClick={() => navigate('/more')}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 active:bg-white/10 absolute left-5"
                >
                    <ChevronLeft className="text-white w-6 h-6" />
                </button>
                <h1 className="w-full text-center text-white text-[22px] font-medium font-satoshi">
                    Subscriptions
                </h1>
            </header>

            {/* Main Container */}
            <div className="px-5 mt-[30px]">
                <div
                    className="w-[360px] mx-auto rounded-[20px] relative overflow-hidden transition-all duration-300"
                    style={{
                        height: containerHeight,
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "top center",
                        backgroundRepeat: "no-repeat",
                    }}
                >
                    {/* Price Chip or Scheduled Chip */}
                    <div
                        className="absolute flex items-center justify-center text-white z-20"
                        style={{
                            top: "12px",
                            right: "12px",
                            width: scheduledDowngrade ? "117px" : "88px",
                            height: scheduledDowngrade ? "23px" : "24px",
                            backgroundImage: `url(${scheduledDowngrade ? downgradeChip : currentTierConfig.chip})`,
                            backgroundSize: "100% 100%",
                            backgroundRepeat: "no-repeat",
                        }}
                    >
                        <span className="font-satoshi font-medium text-[10px]">
                            {scheduledDowngrade ? "Downgrade Scheduled" : currentTierConfig.badge}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="absolute top-[12px] left-[77px] flex flex-col pr-4">
                        <span className="text-white text-[15px] font-medium font-satoshi uppercase">
                            {walletTier}
                        </span>

                        <div className="flex items-baseline gap-1 mt-[5px]">
                            <span className="text-white text-[32px] font-bold font-satoshi">
                                ₹{walletLimit.toLocaleString('en-IN')}
                            </span>
                            <span className="text-white text-[16px] font-medium font-satoshi opacity-70">
                                / wallet limit
                            </span>
                        </div>

                        {scheduledDowngrade ? (
                            <div className="flex flex-col mt-[16px] -ml-[60px]" style={{ width: '326px' }}>
                                <p className="text-white text-[14px] font-medium font-satoshi leading-[1.3]">
                                    Note: Downgrade to {scheduledDowngrade.tier} will take effect on {scheduledDowngrade.effectiveDate}.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Upgrade CTA */}
                                {nextTier && (
                                    <button
                                        onClick={handleUpgrade}
                                        className="w-[260px] h-[48px] mt-[17px] rounded-full bg-[#5260FE] text-white text-[16px] font-bold font-satoshi active:scale-95 transition-transform flex items-center justify-center -ml-[30px]"
                                        style={{
                                            width: '326px',
                                            marginLeft: '-60px' // Adjusting to center properly relative to container since left is 77px
                                        }}
                                    >
                                        Upgrade Now ₹{upgradePrice}/month
                                    </button>
                                )}

                                {/* Next Billing Date */}
                                {isProPlus && (
                                    <span className="text-white text-[14px] font-medium font-satoshi mt-[12px] block text-left -ml-[60px]" style={{ width: '326px' }}>
                                        Next billing date: {(() => {
                                            const next = new Date();
                                            next.setMonth(next.getMonth() + 1);
                                            const day = String(next.getDate()).padStart(2, "0");
                                            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
                                            return `${day} ${months[next.getMonth()]}, ${next.getFullYear()}`;
                                        })()}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Wallet Limit Section or Scheduled Section */}
            <div className={`px-5 ${scheduledDowngrade ? 'mt-[31px]' : 'mt-[43px]'} flex flex-col items-center`}>
                {!scheduledDowngrade && (
                    <>
                        <h2 className="text-white text-[22px] font-medium font-satoshi text-center">
                            You’ve got ₹{walletLimit.toLocaleString('en-IN')} wallet limit
                        </h2>

                        <p className="text-[#7E7E7E] text-[14px] font-medium font-satoshi mt-[9px] text-center px-4">
                            {walletTier === 'Starter'
                                ? "This is a free subscription"
                                : `This is a ₹${currentTierConfig.badge.replace(/[^\d]/g, '')} per month recurring subscription. Amount will be deducted automatically from your linked bank/UPI account.`}
                        </p>

                        {/* Progress Bar (Loader) */}
                        <div className="w-full h-[14px] bg-[#2A2A2A] rounded-full mt-[22px] overflow-hidden">
                            <div
                                className="h-full bg-[#797AFE] transition-all duration-500"
                                style={{ width: `${consumptionPercentage}%` }}
                            />
                        </div>
                    </>
                )}

                {/* Note or Benefits List */}
                {!scheduledDowngrade ? (
                    <p className="text-white text-[14px] font-medium font-satoshi mt-[16px] text-left w-full">
                        Note: Your wallet will not be active once it reached it’s limit. To avoid wallet freezing, we recommend you to upgrade your wallet.
                    </p>
                ) : (
                    <div className="w-full flex flex-col">
                        <h3 className="text-white text-[16px] font-medium font-satoshi">Until then, you still enjoy</h3>
                        <ul className="mt-[6px] flex flex-col gap-[2px]">
                            {[
                                `₹${walletLimit.toLocaleString('en-IN')} wallet breathing room`,
                                "Fast withdrawals under 30 mins (we swear)",
                                `₹${walletTier === 'Elite' ? '25,000' : '10,000'}/day top-ups without breaking a sweat`
                            ].map((benefit, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white mt-[8px] shrink-0" />
                                    <span className="text-white text-[14px] font-normal font-satoshi opacity-80">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Manage Subscription CTA Section */}
                <div className={`${scheduledDowngrade ? 'mt-[100px]' : 'mt-[214px]'} w-full flex flex-col items-center`}>
                    {scheduledDowngrade && (
                        <div className="w-[326px] h-[80px] bg-black rounded-[12px] border border-white/10 p-[10px] flex flex-col mb-[24px]">
                            <span className="text-[#8F8F8F] text-[10px] font-bold font-satoshi">Note:</span>
                            <p className="text-white text-[12px] font-normal font-satoshi mt-[10px] leading-tight pr-4">
                                Make sure to withdraw or use your wallet balance before the effective downgrade date.
                            </p>
                        </div>
                    )}

                    <button
                        disabled={walletTier === 'Starter' || !!scheduledDowngrade}
                        onClick={() => navigate('/manage-subscription')}
                        className={`w-[362px] h-[48px] rounded-full flex items-center justify-center text-white text-[16px] font-bold font-satoshi transition-all
                            ${(walletTier === 'Starter' || !!scheduledDowngrade) ? 'bg-[#1A1A1A] text-white/20' : 'bg-[#5260FE] active:scale-95'}`}
                    >
                        Manage Subscription
                    </button>

                    {walletTier === 'Starter' && !scheduledDowngrade && (
                        <p className="text-[#7E7E7E] text-[14px] font-medium font-satoshi mt-[12px] text-center">
                            There’s nothing to manage here, this is the lowest you can go.
                        </p>
                    )}

                    {scheduledDowngrade && (
                        <div className="w-full flex flex-col items-start px-1 mt-[12px]">
                            <p className="text-[#7E7E7E] text-[14px] font-medium font-satoshi text-left">
                                Plan changes are locked until your downgrade takes effect.
                            </p>

                            {/* DEV TESTING TOOL */}
                            <button
                                onClick={() => {
                                    completeScheduledDowngrade();
                                    // Optionally toast or navigate
                                }}
                                className="mt-8 px-4 py-2 border border-dashed border-[#5260FE] text-[#5260FE] text-[12px] rounded-md opacity-50 hover:opacity-100 transition-opacity self-center"
                            >
                                [Dev Mode] Apply Downgrade Now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Subscriptions;
