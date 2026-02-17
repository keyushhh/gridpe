import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { tiers } from "@/lib/walletTiers";
import infoBg from "@/assets/info bg.png";
import bgDarkMode from "@/assets/bg-dark-mode.png";

const WalletTierDetails = () => {
    const { tierId } = useParams<{ tierId: string }>();
    const navigate = useNavigate();
    const { walletTier, setWalletTier } = useUser();
    const currentTier = tiers.find(t => t.name.toLowerCase() === tierId?.toLowerCase());

    if (!currentTier) return null;

    return (
        <div
            className="h-full w-full text-white flex flex-col relative overflow-y-auto no-scrollbar font-satoshi safe-area-top safe-area-bottom"
            style={{
                fontFamily: "'Satoshi', sans-serif",
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >

            {/* Header Section */}
            <div className="relative flex items-center justify-center px-5 pt-12 pb-2 shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute left-5 top-12 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md active:scale-95 transition-transform z-10"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-white text-[22px] font-medium text-center">
                    Wallet Settings
                </h1>
            </div>

            {/* Content Container */}
            <div
                className="relative w-[362px] mx-auto flex flex-col mt-[28px] px-[14px] pt-[14px] pb-6 rounded-[20px]"
                style={{
                    backgroundImage: `url(${currentTier.headerImage})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* Chip Badge */}
                <div
                    className="absolute flex items-center justify-center rounded-full text-[10px] font-medium text-white z-20"
                    style={{
                        top: "12px",
                        right: "12px",
                        width: "88px",
                        height: "24px",
                        backgroundImage: `url(${currentTier.chip})`,
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                    }}
                >
                    {currentTier.badge}
                </div>

                {/* Wallet Limit Header */}
                <div className="flex flex-col items-start pl-[63px]">
                    <span className="text-white text-[15px] font-medium tracking-normal">
                        {currentTier.name.toUpperCase()}
                    </span>

                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-white text-[34px] font-bold leading-none">
                            {currentTier.walletLimit}
                        </span>
                        <span className="text-white/70 text-[16px] font-medium mb-[2px]">
                            / wallet limit
                        </span>
                    </div>
                </div>

                {/* Info Container */}
                <div
                    className="w-[334px] mt-[16px] rounded-[13px] p-[10px] overflow-y-auto no-scrollbar"
                    style={{
                        height: currentTier.infoHeight,
                        backgroundImage: `url(${infoBg})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        paddingBottom: currentTier.name === 'Pro' ? '20px' : '10px',
                    }}
                >
                    {/* Info List */}
                    <div className="flex flex-col gap-[10px]">
                        {/* Verification */}
                        <div>
                            <p className="text-[#8F8F8F] text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi">Verification</p>
                            <p className="text-white text-[12px] font-medium tracking-[0px] font-satoshi">{currentTier.detailedVerification}</p>
                        </div>

                        {/* Wallet Limit & Daily Top Up Row */}
                        <div className="flex items-start">
                            {/* Wallet Limit */}
                            <div className="w-auto">
                                <p className="text-[#8F8F8F] text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi">Wallet limit</p>
                                <p className="text-white text-[12px] font-medium tracking-[0px] font-satoshi">{currentTier.walletLimit}</p>
                            </div>

                            {/* Daily Top Up Limit - 100px gap */}
                            <div className="ml-[100px]">
                                <p className="text-[#8F8F8F] text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi">Daily top up limit</p>
                                <p className="text-white text-[12px] font-medium tracking-[0px] font-satoshi">{currentTier.dailyTopUpLimit}</p>
                            </div>
                        </div>

                        {/* Withdrawals */}
                        <div>
                            <p className="text-[#8F8F8F] text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi">Withdrawals</p>
                            <p className="text-white text-[12px] font-medium tracking-[0px] font-satoshi">{currentTier.withdrawals}</p>
                        </div>

                        {/* Limitations */}
                        <div>
                            <p className="text-[#8F8F8F] text-[12px] font-medium tracking-[-0.3px] mb-0 font-satoshi">Limitations</p>
                            <ul className="list-disc pl-4 text-white text-[12px] font-medium tracking-[0px] font-satoshi">
                                {currentTier.detailedLimitations.split(/\d\.\s/).filter(Boolean).map((limitation, index) => (
                                    <li key={index} className="leading-snug">{limitation.trim()}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Why you're on STARTER? */}
                <div className="mt-[10px]">
                    <h3 className="text-white text-[16px] font-medium tracking-[-0.3px] mb-[6px] font-satoshi">{currentTier.whyTitle}</h3>
                    <ul className="list-disc pl-4 text-[#A4A4A4] text-[14px] font-light tracking-[-0.3px] font-satoshi leading-[152%]">
                        {currentTier.whyContent.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                </div>

                {/* Craving more power? */}
                {currentTier.powerTitle && (
                    <div className="mt-[10px]">
                        <h3 className="text-white text-[16px] font-medium tracking-[-0.3px] mb-[6px] font-satoshi">{currentTier.powerTitle}</h3>
                        <p className="text-[#A4A4A4] text-[14px] font-light tracking-[-0.3px] font-satoshi leading-[152%] whitespace-pre-line">
                            {currentTier.powerContent}
                        </p>
                    </div>
                )}

                {/* Downgrade Options */}
                {currentTier.downgradeTitle && (
                    <div className="mt-[10px]">
                        <h3 className="text-white text-[16px] font-medium tracking-[-0.3px] mb-[6px] font-satoshi">{currentTier.downgradeTitle}</h3>
                        <p className="text-[#A4A4A4] text-[14px] font-light tracking-[-0.3px] font-satoshi leading-[152%] whitespace-pre-line">
                            {currentTier.downgradeContent}
                        </p>
                    </div>
                )}

                {/* Note Container */}
                <div className="w-[334px] mt-[20px] mx-auto rounded-[10px] border border-[#2C2C2C] pt-[10px] pr-[10px] pl-[10px] pb-[20px]">
                    <h3 className="text-[#8F8F8F] text-[12px] font-bold tracking-[-0.3px] mb-[7px] font-satoshi">Note:</h3>
                    <p className="text-[#FFFFFF] text-[12px] font-medium leading-[131%] font-satoshi">
                        {currentTier.note}
                    </p>
                </div>

                {/* CTA Button */}
                {/* CTA Button */}
                {(() => {
                    const currentTierIndex = tiers.findIndex(t => t.name === walletTier);
                    const viewedTierIndex = tiers.findIndex(t => t.name === currentTier.name);
                    const isDowngrade = viewedTierIndex < currentTierIndex;
                    const isUpgrade = viewedTierIndex > currentTierIndex;
                    const isCurrent = viewedTierIndex === currentTierIndex;

                    const handleAction = () => {
                        if (isUpgrade) {
                            navigate(currentTier.buttonAction, {
                                state: { flow: 'upgrade', tier: currentTier.name },
                                replace: true
                            });
                        } else if (isDowngrade) {
                            navigate('/subscription-details', {
                                state: { flow: 'downgrade', tier: currentTier.name }
                            });
                        }
                    };

                    if (isCurrent) {
                        // User said "if he's already on starter, and clicks on starter, the current [compare plans] is fine."
                        // But for other tiers, if they are on it, disabled or "Current Plan"?
                        // Design implies we might just show "Current Plan" or keep default button if it's "Compare Plans" for starter.
                        // Let's stick to default button text/action for Starter (which is Compare Plans / settings)
                        // For others, maybe "Current Plan" disabled?
                        if (currentTier.name === 'Starter') {
                            return (
                                <button
                                    onClick={() => navigate(currentTier.buttonAction)}
                                    className="w-full h-[52px] rounded-full bg-[#6C72FF] text-white text-[16px] font-bold active:scale-95 transition-transform flex items-center justify-center shadow-lg shadow-[#6C72FF]/20 mt-[20px]"
                                >
                                    {currentTier.buttonText}
                                </button>
                            );
                        }
                        return (
                            <button
                                disabled
                                className="w-full h-[52px] rounded-full bg-[#2C2C2C] text-white/50 text-[16px] font-bold flex items-center justify-center mt-[20px]"
                            >
                                Current Plan
                            </button>
                        );
                    }

                    return (
                        <button
                            onClick={handleAction}
                            className="w-full h-[52px] rounded-full bg-[#6C72FF] text-white text-[16px] font-bold active:scale-95 transition-transform flex items-center justify-center shadow-lg shadow-[#6C72FF]/20 mt-[20px]"
                        >
                            {isDowngrade ? "Downgrade Now" : "Upgrade Now"}
                        </button>
                    );
                })()}
            </div>
        </div>
    );
};

export default WalletTierDetails;
