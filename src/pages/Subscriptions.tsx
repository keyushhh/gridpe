import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { ChevronLeft } from "lucide-react";
import { useUser, WalletTier } from "@/contexts/UserContext";
import { tiers, fetchTierPrices } from "@/lib/walletTiers";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import { formatINR } from "@/utils/format";
import bgDarkMode from "@/assets/bg-dark-mode.png";

// Import Assets
import subStarterBg from "@/assets/subscription-starter.png";
import subProBg from "@/assets/subscription-pro.png";
import subEliteBg from "@/assets/subscription-elite.png";
import subSupremeBg from "@/assets/subscription-supreme.png";

// Light Mode Assets
import subStarterBgLight from "@/assets/light-cards/subscription-starter-light.png";
import subProBgLight from "@/assets/light-cards/subscription-pro-light.png";
import subEliteBgLight from "@/assets/light-cards/subscription-elite-light.png";
import subSupremeBgLight from "@/assets/light-cards/subscription-supreme-light.png";

import downgradeChip from "@/assets/downgrade-chip.png";
import { supabase, USER_ID } from "@/lib/supabase";

const subscriptionBgs: Record<WalletTier, string> = {
    Starter: subStarterBg,
    Pro: subProBg,
    Elite: subEliteBg,
    Supreme: subSupremeBg,
};

const subscriptionBgsLight: Record<WalletTier, string> = {
    Starter: subStarterBgLight,
    Pro: subProBgLight,
    Elite: subEliteBgLight,
    Supreme: subSupremeBgLight,
};

const nextTierMap: Record<WalletTier, WalletTier | null> = {
    Starter: 'Pro',
    Pro: 'Elite',
    Elite: 'Supreme',
    Supreme: null,
};

const Subscriptions = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';
    const { walletTier, walletLimit, scheduledDowngrade, completeScheduledDowngrade, lastDowngradeLoss, walletBalance, subscriptionPrice, isRenewalPending, paymentStatus, profile, fetchProfileData } = useUser();
    const { showToaster } = useCustomToaster();
    const queryClient = useQueryClient();

    const [tierPrices, setTierPrices] = React.useState<Record<string, number>>({});
    const [isSubscriptionActive, setIsSubscriptionActive] = React.useState<boolean>(true);
    const [isLoadingPay, setIsLoadingPay] = React.useState(false);

    React.useEffect(() => {
        const loadPrices = async () => {
            try {
                const prices = await fetchTierPrices();
                setTierPrices(prices);
            } catch (err) {
                console.error("Failed to fetch tier prices", err);
            }
        };
        loadPrices();

        const checkSubscriptionStatus = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const currentUserId = session?.user?.id || USER_ID;
                if (!currentUserId) return;

                const { data: subData } = await supabase
                    .from('user_subscriptions')
                    .select('status, current_period_end')
                    .eq('user_id', currentUserId)
                    .maybeSingle();

                // If they are on a paid tier but don't have an active subscription record or it's expired
                let isActive = false;
                if (subData) {
                    isActive = subData.status === 'active' && new Date(subData.current_period_end) > new Date();
                } else if (profile?.subscription_status === 'active') {
                    // Fallback to profile status if subscription table record is missing
                    isActive = true;
                }

                if (paymentStatus === 'pending' || isRenewalPending) {
                    isActive = false;
                }

                setIsSubscriptionActive(isActive);
            } catch (err) {
                console.warn("Failed to check generic subscription status", err);
            }
        };

        if (walletTier !== 'Starter') {
            checkSubscriptionStatus();
        } else {
            setIsSubscriptionActive(true);
        }
    }, [walletTier, paymentStatus, isRenewalPending, profile?.subscription_status]);

    const currentTierConfig = tiers.find(t => t.name === walletTier);

    if (!currentTierConfig) return null;

    const isProPlus = walletTier !== 'Starter';
    const isStarterDowngrade = scheduledDowngrade?.tier === 'Starter';
    const containerHeight = scheduledDowngrade ? '190px' : (isProPlus ? '195px' : '166px');
    const displayTier = isStarterDowngrade ? 'Starter' : walletTier;
    const backgroundImage = isDarkMode ? subscriptionBgs[displayTier] : subscriptionBgsLight[displayTier];
    const backgroundPosition = "top calc(50% + 20px)";
    const nextTier = nextTierMap[walletTier];
    const upgradePrice = nextTier ? tierPrices[nextTier.toLowerCase()] || 0 : 0;

    // Calculate consumption
    const consumptionPercentage = Math.min((walletBalance / walletLimit) * 100, 100);

    const handleUpgrade = () => {
        if (nextTier && !scheduledDowngrade) {
            navigate('/wallet-tier/' + nextTier.toLowerCase(), {
                state: { fromSubscriptionDashboard: true }
            });
        }
    };

    const handleRenew = async () => {
        if (isLoadingPay) return;
        setIsLoadingPay(true);
        try {
            // If we have a scheduled downgrade, we are renewing for that new tier
            const targetTierName = (isRenewalPending && scheduledDowngrade?.tier) ? scheduledDowngrade.tier : walletTier;
            const selectedTierName = targetTierName.toLowerCase() as 'pro' | 'elite' | 'supreme';
            const priceToPay = (isRenewalPending && scheduledDowngrade?.tier) ? (tierPrices[scheduledDowngrade.tier] || subscriptionPrice) : subscriptionPrice;
            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`;

            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            const payload = {
                amount: priceToPay,
                userId: currentUserId || "414c977e-6f70-4f57-bfa1-af0a8a2053a4",
                type: "subscription_renewal",
                tier_name: selectedTierName
            };

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create subscription order');
            }

            const data = await response.json();

            // 🛠️ The FIX: Parse the data if Supabase returned it as a raw string
            let order = data;
            if (typeof data === 'string') {
                try {
                    order = JSON.parse(data);
                } catch (e) {
                    throw new Error("Failed to parse subscription order response");
                }
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                order_id: order.id,
                name: "Grid.pe",
                description: `${selectedTierName.toUpperCase()} Renewal`,
                handler: async function (response) {
                    try {
                        setIsLoadingPay(true);
                        const verifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-subscription`;
                        const verifyResponse = await fetch(verifyUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                            },
                            body: JSON.stringify({
                                ...response,
                                tier_name: selectedTierName,
                                user_id: currentUserId || '414c977e-6f70-4f57-bfa1-af0a8a2053a4'
                            }),
                        });

                        const verifyData = await verifyResponse.json();

                        if (!verifyResponse.ok) {
                            throw new Error(verifyData.error || verifyData.message || 'Verification failed');
                        }

                        if (verifyData.success) {
                            await fetchProfileData();
                            await queryClient.invalidateQueries({ queryKey: ['wallet'] });
                            navigate('/wallet-upgrade-success', {
                                state: {
                                    tier: targetTierName,
                                    flow: isRenewalPending ? 'downgrade' : 'upgrade',
                                    message: isRenewalPending ? `Downgraded to ${targetTierName} Successfully` : `Subscription Renewed for ${walletTier}`
                                },
                            });
                        }
                    } catch (err: unknown) {
                        const errorMessage = err instanceof Error ? err.message : 'Please contact support.';
                        console.error("Renewal verification error:", errorMessage);
                        alert(`Payment successful, but verification failed: ${errorMessage}`);
                    } finally {
                        setIsLoadingPay(false);
                        setIsSubscriptionActive(true); // Optimistically set active
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsLoadingPay(false);
                    }
                },
                theme: { color: "#5260FE" }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (paymentError: { error: { code: string; description: string } }) {
                console.error("Payment Failed:", paymentError.error);
                setIsLoadingPay(false);
            });

            rzp.open();

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            console.error("Renewal error:", errorMessage);
            alert("Error: " + errorMessage);
            setIsLoadingPay(false);
        }
    };

    // Toast for loss if it just happened
    React.useEffect(() => {
        if (lastDowngradeLoss && lastDowngradeLoss > 0) {
            showToaster(`You have lost ${formatINR(lastDowngradeLoss)} due to the wallet downgrade.`, 'error');
        }
    }, [lastDowngradeLoss, showToaster]);

    return (
        <div
            className={`h-full w-full overflow-y-auto overscroll-y-contain flex flex-col pb-safe pb-4 ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
            style={{
                fontFamily: "'Satoshi', sans-serif",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Purple Glow (Top Center) */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}
            {/* Header */}
            <header className="px-5 pt-safe pt-4 pb-2 flex items-center relative z-10 shrink-0">
                <button
                    onClick={() => navigate('/more')}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border active:bg-white/10 absolute left-5 ${isDarkMode ? 'border-white/20' : 'border-[#E9EAEB]'}`}
                >
                    <ChevronLeft className={`${isDarkMode ? 'text-white' : 'text-black'} w-6 h-6`} />
                </button>
                <h1 className={`w-full text-center ${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-satoshi`}>
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
                        backgroundPosition: backgroundPosition,
                        backgroundRepeat: "no-repeat",
                        border: !isDarkMode ? "1px solid #F2F2F7" : "none",
                    }}
                >
                    {/* Price Chip or Scheduled Chip */}
                    <div
                        className={`absolute flex items-center justify-center z-20 rounded-[100px] ${scheduledDowngrade ? '' : 'text-white'}`}
                        style={{
                            top: "14px",
                            right: "14px",
                            padding: scheduledDowngrade ? "4px 10px" : "0",
                            width: scheduledDowngrade ? "auto" : "88px",
                            height: scheduledDowngrade ? "22px" : "24px",
                            backgroundColor: scheduledDowngrade
                                ? (isDarkMode ? "transparent" : "#000000")
                                : "#000000",
                            border: scheduledDowngrade && isDarkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
                        }}
                    >
                        <span className={`${scheduledDowngrade ? 'text-white text-[10px] whitespace-nowrap' : 'font-satoshi font-medium text-[10px]'}`}>
                            {scheduledDowngrade ? "Downgrade Scheduled" : currentTierConfig.badge}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="absolute top-[12px] left-[77px] flex flex-col pr-4">
                        <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-satoshi uppercase`}>
                            {walletTier}
                        </span>

                        <div className="flex items-baseline gap-1 mt-[5px]">
                            <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[32px] font-bold font-satoshi`}>
                                {formatINR(walletLimit)}
                            </span>
                            <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium font-satoshi opacity-70`}>
                                / wallet limit
                            </span>
                        </div>

                        <div className="flex flex-col mt-[16px] -ml-[60px]" style={{ width: '326px' }}>
                            {scheduledDowngrade && (
                                <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[13px] font-medium font-satoshi leading-[1.3] ${(!isSubscriptionActive && isProPlus) ? 'mb-4' : ''}`}>
                                    Note: Downgrade to {scheduledDowngrade.tier} will take effect on {(() => {
                                        const d = new Date(scheduledDowngrade.effectiveDate);
                                        const day = String(d.getDate()).padStart(2, "0");
                                        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
                                        return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
                                    })()}.
                                </p>
                            )}

                            {/* Renew CTA */}
                            {(isProPlus && !isSubscriptionActive) && (
                                <button
                                    onClick={handleRenew}
                                    disabled={isLoadingPay}
                                    className={`w-full h-[48px] rounded-full ${isDarkMode ? 'bg-[#5260FE]' : 'bg-black'} text-white text-[16px] font-medium font-satoshi active:scale-95 transition-transform flex items-center justify-center mb-3`}
                                >
                                    {isLoadingPay ? "Processing..." : `Renew Now ₹${isRenewalPending && scheduledDowngrade ? (tierPrices[scheduledDowngrade.tier.toLowerCase()] || subscriptionPrice) : subscriptionPrice}/month`}
                                </button>
                            )}

                            {/* Upgrade CTA */}
                            {nextTier && isSubscriptionActive && !scheduledDowngrade && (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={isProPlus && (paymentStatus === 'pending' || isRenewalPending || profile?.subscription_status === 'pending')}
                                    className={`w-full h-[48px] rounded-full text-white text-[16px] font-medium font-satoshi flex items-center justify-center ${isProPlus && (paymentStatus === 'pending' || isRenewalPending || profile?.subscription_status === 'pending') ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-[#5260FE] active:scale-95 transition-transform mb-3'}`}
                                >
                                    Upgrade Now ₹{upgradePrice}/month
                                </button>
                            )}

                            {/* Next Billing Date */}
                            {isProPlus && isSubscriptionActive && (
                                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-satoshi mt-[8px] block text-left`}>
                                    Next billing date: {(() => {
                                        const next = new Date();
                                        next.setMonth(next.getMonth() + 1);
                                        const day = String(next.getDate()).padStart(2, "0");
                                        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
                                        return `${day} ${months[next.getMonth()]}, ${next.getFullYear()}`;
                                    })()}
                                </span>
                            )}

                            {isProPlus && !isSubscriptionActive && (
                                <span className={`text-[#FF453A] text-[14px] font-medium font-satoshi mt-0 mb-2 block text-center`}>
                                    Subscription Payment Pending
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallet Limit Section or Scheduled Section */}
            <div className={`px-5 ${scheduledDowngrade ? 'mt-[31px]' : 'mt-[43px]'} flex flex-col items-center`}>
                {!scheduledDowngrade && (
                    <>
                        <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-satoshi text-center`}>
                            You’ve got {formatINR(walletLimit)} wallet limit
                        </h2>

                        <p className="text-[#7E7E7E] text-[14px] font-medium font-satoshi mt-[9px] text-center px-4">
                            {walletTier === 'Starter'
                                ? "This is a free subscription"
                                : `This is a ₹${currentTierConfig.badge.replace(/[^\d]/g, '')} per month recurring subscription. Amount will be deducted automatically from your linked bank/UPI account.`}
                        </p>

                        {/* Progress Bar (Loader) */}
                        <div className={`w-full h-[14px] rounded-full mt-[22px] overflow-hidden ${isDarkMode ? 'bg-[#2A2A2A]' : 'bg-[#E9EAEB]'}`}>
                            <div
                                className="h-full bg-[#797AFE] transition-all duration-500"
                                style={{ width: `${consumptionPercentage}%` }}
                            />
                        </div>
                    </>
                )}

                {/* Note or Benefits List */}
                {!scheduledDowngrade ? (
                    <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-satoshi mt-[16px] text-left w-full`}>
                        Note: Your wallet will not be active once it reached it’s limit. To avoid wallet freezing, we recommend you to upgrade your wallet.
                    </p>
                ) : (
                    <div className="w-full flex flex-col">
                        <h3 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium font-satoshi`}>Until then, you still enjoy</h3>
                        <ul className="mt-[6px] flex flex-col gap-[2px]">
                            {[
                                `${formatINR(walletLimit)} wallet breathing room`,
                                "Fast withdrawals under 30 mins (we swear)",
                                `₹${walletTier === 'Elite' ? '25,000' : '10,000'}/day top-ups without breaking a sweat`
                            ].map((benefit, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-[8px] shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                                    <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-satoshi opacity-80`}>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Manage Subscription CTA Section */}
                <div className="mt-auto pb-safe pb-4 w-full flex flex-col items-center">
                    {scheduledDowngrade && (
                        <div className={`w-[326px] min-h-[80px] rounded-[12px] border p-[10px] flex flex-col mb-[24px] ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-[#E9EAEB]'}`}>
                            <span className={`${isDarkMode ? 'text-[#8F8F8F]' : 'text-black'} text-[10px] font-medium font-satoshi`}>Note:</span>
                            <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-normal font-satoshi mt-[10px] leading-tight pr-4`}>
                                Make sure to withdraw or use your wallet balance before the effective downgrade date. Any balance above the new tier limit will be <span className="text-[#F04248] font-bold">lost forever</span>.
                            </p>
                        </div>
                    )}

                    <button
                        disabled={walletTier === 'Starter' || !!scheduledDowngrade || !isSubscriptionActive}
                        onClick={() => navigate('/manage-subscription')}
                        className={`w-[362px] h-[48px] rounded-full flex items-center justify-center text-[16px] font-medium font-satoshi transition-all active:scale-95 ${walletTier === 'Starter' || !!scheduledDowngrade || !isSubscriptionActive
                            ? isDarkMode
                                ? 'bg-transparent border border-white/10 text-white/50'
                                : 'bg-transparent border border-[#E9EAEB] text-black/50'
                            : 'bg-[#5260FE] text-white'
                            }`}
                    >
                        Manage Subscription
                    </button>

                    {walletTier === 'Starter' && !scheduledDowngrade && (
                        <p className="text-[#7E7E7E] text-[14px] font-medium font-satoshi mt-[12px] text-center w-[362px]">
                            There’s nothing to manage here, this is the lowest you can go.
                        </p>
                    )}

                    {scheduledDowngrade && (
                        <div className="flex flex-col items-start mt-[12px]" style={{ width: '362px' }}>
                            <p className="text-[#7E7E7E] text-[14px] font-medium font-satoshi text-left w-full">
                                Plan changes are locked until your downgrade takes effect.
                            </p>

                            {/* DEV TESTING TOOL */}
                            <button
                                onClick={() => {
                                    completeScheduledDowngrade();
                                    // Use a slight timeout to ensure state update is processed or just check context after
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
