import { useNavigate } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "next-themes";

import bgDarkMode from "@/assets/bg-dark-mode.png";
import tierCardActive from "@/assets/selected wallet.png";
import tierCardInactive from "@/assets/non selected card.png";
import { tiers, tierSettingsCardMap, tierSettingsCardMapLight, tierCarouselActiveMap, tierCarouselInactiveMap, tierCarouselActiveMapDark, tierCarouselInactiveMapDark, tierChipColorMap } from "@/lib/walletTiers";

const WalletSettings = () => {
    const navigate = useNavigate();
    const { walletTier, resetForDemo, scheduledDowngrade } = useUser();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme !== 'light';

    const currentTier =
        tiers.find((tier) => tier.name === walletTier) || tiers[0];

    const handleUpgrade = () => {
        if (scheduledDowngrade) return;
        const currentIndex = tiers.findIndex(t => t.name === walletTier);
        const nextTier = tiers[currentIndex + 1];
        if (nextTier) {
            navigate('/subscription-details', {
                state: { flow: 'upgrade', tier: nextTier.name }
            });
        }
    };
    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom"
            style={{
                fontFamily: "'Satoshi', sans-serif",
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Status Blob (Top Glow) */}
            {!isDarkMode && (
                <div
                    className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
                    style={{
                        backgroundColor: "#5260FE",
                        filter: "blur(60px)",
                        opacity: 0.8,
                        mixBlendMode: "normal"
                    }}
                />
            )}

            {/* Header */}
            <div className="shrink-0 relative flex items-center justify-between w-full px-5 pt-4 pb-0 z-10">
                <BackButton onClick={() => navigate(-1)} />

                <h1 className={`text-[22px] font-medium tracking-normal text-center absolute left-1/2 -translate-x-1/2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Wallet Settings
                </h1>
                <div className="w-10 h-10" /> {/* Spacer for centering */}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 w-full overflow-y-auto no-scrollbar pb-[40px]">

                {/* -------- TOP TIER SUMMARY CARD -------- */}
                <div className="px-5 mb-[20px] mt-[28px]">
                    <div
                        className={`relative w-full rounded-[28px] overflow-hidden ${!isDarkMode ? 'border border-[#E9EAEB]' : ''}`}
                        style={{
                            backgroundImage: `url(${isDarkMode ? tierSettingsCardMap[currentTier.name] : tierSettingsCardMapLight[currentTier.name]})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                        }}
                    >
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center pl-[77px] pt-[14px]">
                                <div className="flex flex-col items-start">
                                    <span className={`text-[15px] font-medium tracking-normal ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {currentTier.name.toUpperCase()}
                                    </span>

                                    <div className="flex items-end gap-2 mt-1">
                                        <span className={`text-[34px] font-bold leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            {currentTier.walletLimit}
                                        </span>
                                        <span className={`text-[16px] font-medium mb-[2px] ${isDarkMode ? 'text-white/70' : 'text-black/50'}`}>
                                            / wallet limit
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-[17px] mb-[17px] px-6">
                                {walletTier === 'Supreme' ? (
                                    <button
                                        disabled
                                        className="mx-auto h-[48px] flex items-center justify-center rounded-full text-white text-[16px] font-medium transition-transform opacity-50 cursor-not-allowed"
                                        style={{ background: "#6C72FF", width: "326px", maxWidth: "100%" }}
                                    >
                                        Current Plan
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleUpgrade}
                                        className={`mx-auto h-[48px] flex items-center justify-center rounded-full text-white text-[18px] font-medium active:scale-95 transition-transform ${scheduledDowngrade ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        style={{ background: "#6C72FF", width: "326px", maxWidth: "100%" }}
                                        disabled={!!scheduledDowngrade}
                                    >
                                        {currentTier.buttonText}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* -------- TIERS CAROUSEL -------- */}
                <div className="mb-2">
                    <div className="flex overflow-x-auto no-scrollbar px-5 gap-4 pb-4 snap-x snap-mandatory">
                        {tiers.map((tier) => {
                            const isActive = walletTier === tier.name;

                            // Choose card background based on theme
                            let cardBg: string;
                            if (isDarkMode) {
                                cardBg = isActive ? tierCarouselActiveMapDark[tier.name] : tierCarouselInactiveMapDark[tier.name];
                            } else {
                                cardBg = isActive ? tierCarouselActiveMap[tier.name] : tierCarouselInactiveMap[tier.name];
                            }

                            // Choose chip style based on theme
                            const chipStyle = isDarkMode
                                ? {
                                    backgroundImage: `url(${tier.chip})`,
                                    backgroundSize: "100% 100%",
                                    backgroundRepeat: "no-repeat",
                                }
                                : {
                                    backgroundColor: tierChipColorMap[tier.name],
                                    borderRadius: '12px',
                                };

                            return (
                                <div
                                    key={tier.name}
                                    onClick={() => navigate(`/wallet-tier/${tier.name.toLowerCase()}`)}
                                    className="snap-center shrink-0 relative transition-transform cursor-pointer active:scale-95"
                                    style={{ width: "205px", height: "276px" }}
                                >
                                    {/* Selected / Non-selected background ONLY */}
                                    <div
                                        className="absolute inset-0 rounded-[13px] overflow-hidden"
                                        style={{
                                            backgroundImage: `url(${cardBg})`,
                                            backgroundSize: "100% 100%",
                                            backgroundRepeat: "no-repeat",
                                        }}
                                    />

                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start">
                                            {/* Chip badge with text (top-right) */}
                                            <div
                                                className="absolute flex items-center justify-center rounded-full text-[10px] font-medium text-white z-20"
                                                style={{
                                                    top: "13px",
                                                    right: "13px",
                                                    width: "88px",
                                                    height: "24px",
                                                    ...chipStyle,
                                                }}
                                            >
                                                {tier.badge}
                                            </div>
                                        </div>

                                        <h3
                                            className={`text-[15px] font-bold leading-none absolute z-10 ${isDarkMode ? 'text-white' : 'text-black'}`}
                                            style={{ top: "51px", left: "13px" }}
                                        >
                                            {tier.name.toUpperCase()} WALLET
                                        </h3>

                                        <div
                                            className="absolute flex flex-col gap-[6px] pl-[13px] w-full pr-[13px]"
                                            style={{ top: "83px" }}
                                        >
                                            <div>
                                                <p className={`text-[12px] font-medium mb-0 ${isDarkMode ? 'text-white/50' : 'text-black/40'}`}>
                                                    Verification
                                                </p>
                                                <p className={`text-[12px] font-medium whitespace-nowrap overflow-hidden text-ellipsis ${isDarkMode ? 'text-white' : 'text-black'}`}>{tier.verification}</p>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div>
                                                    <p className={`text-[12px] font-medium mb-0 ${isDarkMode ? 'text-white/50' : 'text-black/40'}`}>
                                                        Wallet limit
                                                    </p>
                                                    <p className={`text-[12px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{tier.walletLimit}</p>
                                                </div>
                                                <div>
                                                    <p className={`text-[12px] font-medium mb-0 ${isDarkMode ? 'text-white/50' : 'text-black/40'}`}>
                                                        Daily top up
                                                    </p>
                                                    <p className={`text-[12px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{tier.dailyTopUpLimit}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className={`text-[12px] font-medium mb-0 ${isDarkMode ? 'text-white/50' : 'text-black/40'}`}>
                                                    Withdraw limit
                                                </p>
                                                <p className={`text-[12px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{tier.withdrawLimit}</p>
                                            </div>

                                            <div>
                                                <p className={`text-[12px] font-medium mb-0 ${isDarkMode ? 'text-white/50' : 'text-black/40'}`}>
                                                    Limitations
                                                </p>
                                                <p className={`text-[12px] font-medium leading-snug ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                    {tier.limitations}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* -------- INFO SECTIONS -------- */}
                <div className="px-5 pb-5 flex flex-col gap-4">
                    <div>
                        <h3 className={`text-[16px] font-medium mb-[6px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            How to Upgrade?
                        </h3>
                        <ul className="flex flex-col gap-[2px] list-disc pl-6">
                            <li className={`text-[16px] font-light leading-[1.4] tracking-[-0.3px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Complete full KYC verification
                            </li>
                            <li className={`text-[16px] font-light leading-[1.4] tracking-[-0.3px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Submit PAN (mandatory)
                            </li>
                            <li className={`text-[16px] font-light leading-[1.4] tracking-[-0.3px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Actively use your wallet for faster upgrades
                            </li>
                            <li className={`text-[16px] font-light leading-[1.4] tracking-[-0.3px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Need higher business limits? Submit GST details
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className={`text-[16px] font-medium mb-[6px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Why Limits?
                        </h3>
                        <p className={`text-[16px] font-light leading-[1.4] tracking-[-0.3px] mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Wallets in India are governed by RBI-regulated limits to ensure fund
                            security and prevent misuse.
                            Your tier helps us serve you better, safely, and responsibly.
                        </p>
                    </div>

                    {/* -------- RESET SECTION (DEMO ONLY) -------- */}
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                resetForDemo();
                                navigate('/');
                            }}
                            className={`w-full h-[48px] flex items-center justify-center rounded-full text-[14px] font-medium border active:scale-95 transition-transform ${isDarkMode
                                ? 'text-white/40 border-white/10'
                                : 'text-black/40 border-black/10'
                                }`}
                        >
                            Reset Account (Demo Only)
                        </button>
                        <p className={`text-[10px] text-center mt-2 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>
                            This will clear all transactions, balance, and KYC status.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletSettings;
