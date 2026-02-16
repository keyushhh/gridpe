import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useUser, WalletTier } from "@/contexts/UserContext";
import { tiers } from "@/lib/walletTiers";
import bgDarkMode from "@/assets/bg-dark-mode.png";

// Import Assets
import currentActiveChip from "@/assets/current-active-chip.png";
import currentActiveStarter from "@/assets/current-active-starter.png";
import currentActivePro from "@/assets/current-active-pro.png";
import currentActiveElite from "@/assets/current-active-elite.png";
import currentActiveSupreme from "@/assets/current-active-supreme.png";

import downgradeStarter from "@/assets/downgrade-starter.png";
import downgradePro from "@/assets/downgrade-pro.png";
import downgradeElite from "@/assets/downgrade-elite.png";
import downgradeSupreme from "@/assets/downgrade-supreme.png";

const currentActiveBgs: Record<WalletTier, string> = {
    Starter: currentActiveStarter,
    Pro: currentActivePro,
    Elite: currentActiveElite,
    Supreme: currentActiveSupreme,
};

const downgradeBgs: Record<WalletTier, string> = {
    Starter: downgradeStarter,
    Pro: downgradePro,
    Elite: downgradeElite,
    Supreme: downgradeSupreme,
};

const DowngradePlan = () => {
    const navigate = useNavigate();
    const { walletTier, setWalletTier } = useUser();
    const [selectedTier, setSelectedTier] = useState<WalletTier | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const currentConfig = tiers.find(t => t.name === walletTier);

    // Get available downgrade options
    const tierOrder: WalletTier[] = ['Starter', 'Pro', 'Elite', 'Supreme'];
    const currentIndex = tierOrder.indexOf(walletTier);
    const downgradeOptions = tiers.filter(t => {
        const index = tierOrder.indexOf(t.name);
        return index < currentIndex;
    }).reverse(); // Show higher tiers first (e.g. for Elite, show Pro then Starter)

    const handleSwitch = (tier: WalletTier) => {
        setSelectedTier(tier);
        setIsConfirmed(false); // Reset confirmation when changing selection
    };

    const handleConfirm = () => {
        if (selectedTier && isConfirmed) {
            navigate("/downgrade-summary", { state: { tier: selectedTier, flow: 'downgrade' } });
        }
    };

    if (!currentConfig) return null;

    return (
        <div
            className="absolute inset-0 overflow-y-auto overscroll-y-contain flex flex-col safe-area-top safe-area-bottom pb-10"
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
            <header className="px-5 pt-12 pb-2 flex items-center relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 active:bg-white/10 absolute left-5"
                >
                    <ChevronLeft className="text-white w-6 h-6" />
                </button>
                <h1 className="w-full text-center text-white text-[22px] font-medium font-satoshi">
                    Downgrade Plan
                </h1>
            </header>

            {/* Current Active Container */}
            <div className="px-5 mt-[31px]">
                <div
                    className="w-[362px] h-[202px] mx-auto rounded-[13px] relative overflow-hidden shrink-0 cursor-pointer"
                    onClick={() => {
                        setSelectedTier(null);
                        setIsConfirmed(false);
                    }}
                    style={{
                        backgroundImage: `url(${currentActiveBgs[walletTier]})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    {/* Chip */}
                    <div
                        className="absolute top-[12px] right-[12px] w-[86px] h-[23px] flex items-center justify-center"
                        style={{
                            backgroundImage: `url(${currentActiveChip})`,
                            backgroundSize: "cover",
                        }}
                    >
                        <span className="text-white text-[10px] font-medium font-satoshi">Current Active</span>
                    </div>

                    {/* Selection Overlay (Inactive State) */}
                    {selectedTier && (
                        <div className="absolute inset-0 bg-[#0D0D0D]/50 pointer-events-none z-10" />
                    )}

                    {/* Content */}
                    <div className="absolute top-[51px] left-[12px] right-[12px]">
                        <span className="text-white text-[15px] font-bold font-satoshi uppercase">
                            {walletTier} WALLET
                        </span>

                        {/* Row 1: Verification, Wallet Limit & Withdraw Limit */}
                        <div className="mt-[12px] flex items-start">
                            {/* Verification */}
                            <div className="flex flex-col w-[118px]">
                                <span className="text-[#8F8F8F] text-[12px] font-regular font-satoshi">Verification</span>
                                <span className="text-white text-[12px] font-regular font-satoshi mt-[1px] leading-tight">
                                    {currentConfig.detailedVerification}
                                </span>
                            </div>

                            {/* Wallet Limit */}
                            <div className="flex flex-col w-[100px] ml-1">
                                <span className="text-[#8F8F8F] text-[12px] font-regular font-satoshi">Wallet limit</span>
                                <span className="text-white text-[12px] font-regular font-satoshi mt-[1px]">
                                    {currentConfig.walletLimit}
                                </span>
                            </div>

                            {/* Withdraw Limit */}
                            <div className="flex flex-col">
                                <span className="text-[#8F8F8F] text-[12px] font-regular font-satoshi">Withdraw limit</span>
                                <span className="text-white text-[12px] font-regular font-satoshi mt-[1px]">
                                    {currentConfig.withdrawLimit}
                                </span>
                            </div>
                        </div>

                        {/* Row 2: Limitations */}
                        <div className="mt-[12px] flex flex-col pr-8">
                            <span className="text-[#8F8F8F] text-[12px] font-regular font-satoshi">Limitations</span>
                            <p className="text-white text-[12px] font-regular font-satoshi mt-[1px] leading-tight">
                                {currentConfig.limitations}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Downgrade Containers */}
            <div className={`px-5 mt-[12px] flex flex-col gap-[12px] items-center ${selectedTier ? 'pb-[300px]' : 'pb-10'}`}>
                {downgradeOptions.map((tier) => (
                    <div
                        key={tier.name}
                        onClick={() => handleSwitch(tier.name as WalletTier)}
                        className={`w-[362px] ${tier.name === 'Starter' ? 'h-[260px]' : 'h-[276px]'} rounded-[13px] relative overflow-hidden shrink-0 transition-all cursor-pointer ${selectedTier === tier.name ? 'border-[0.8px] border-[#5260FE]' : 'border-2 border-transparent'
                            }`}
                        style={{
                            backgroundImage: `url(${downgradeBgs[tier.name as WalletTier]})`,
                            backgroundSize: "cover",
                            backgroundPosition: "top center",
                        }}
                    >
                        {/* Selection Overlay */}
                        {selectedTier === tier.name && (
                            <div className="absolute inset-0 bg-[#0E1350]/20 pointer-events-none z-10" />
                        )}
                        {/* Tier Chip */}
                        <div
                            className="absolute top-[12px] right-[12px] flex items-center justify-center rounded-full text-[10px] font-medium text-white z-20"
                            style={{
                                width: "88px",
                                height: "24px",
                                backgroundImage: `url(${tier.chip})`,
                                backgroundSize: "100% 100%",
                                backgroundRepeat: "no-repeat",
                            }}
                        >
                            {tier.badge}
                        </div>

                        {/* Content */}
                        <div className="absolute top-[51px] left-[12px] right-[12px]">
                            <span className="text-white text-[15px] font-bold font-satoshi uppercase">
                                {tier.name} WALLET
                            </span>

                            <div className="mt-[12px] flex items-start">
                                {/* Verification */}
                                <div className="flex flex-col w-[118px]">
                                    <span className="text-[#8F8F8F] text-[12px] font-regular font-satoshi">Verification</span>
                                    <span className="text-white text-[12px] font-regular font-satoshi mt-[1px] leading-tight">
                                        {tier.name === 'Starter' ? 'Mobile number, basic information' : tier.detailedVerification}
                                    </span>
                                </div>

                                {/* Wallet Limit */}
                                <div className="flex flex-col w-[100px] ml-1">
                                    <span className="text-[#8F8F8F] text-[12px] font-regular font-satoshi">Wallet limit</span>
                                    <span className="text-white text-[12px] font-regular font-satoshi mt-[1px]">
                                        {tier.walletLimit}
                                    </span>
                                </div>

                                {/* Withdraw Limit */}
                                <div className="flex flex-col">
                                    <span className="text-[#8F8F8F] text-[12px] font-regular font-satoshi">Withdraw limit</span>
                                    <span className="text-white text-[12px] font-regular font-satoshi mt-[1px]">
                                        {tier.withdrawLimit}
                                    </span>
                                </div>
                            </div>

                            {/* Row 2: Limitations */}
                            <div className="mt-[12px] flex flex-col pr-8">
                                <span className="text-[#8F8F8F] text-[12px] font-regular font-satoshi">Limitations</span>
                                <span className="text-white text-[12px] font-regular font-satoshi mt-[1px]">
                                    {tier.name === 'Starter' ? 'Add money cooldown' : tier.limitations}
                                </span>
                            </div>

                            {/* CTA */}
                            <div className="mt-[16px] flex justify-center w-full px-[10px]">
                                <button
                                    onClick={() => handleSwitch(tier.name)}
                                    className="w-full h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-medium font-satoshi active:scale-95 transition-transform"
                                    style={{
                                        backgroundColor: "rgba(0,0,0,0.6)",
                                        border: "1px solid rgba(255,255,255,0.1)"
                                    }}
                                >
                                    Switch to {tier.name}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Fixed Bottom Confirmation Container */}
            {selectedTier && (
                <div className="fixed bottom-0 left-0 right-0 bg-black flex flex-col items-center pt-[20px] pb-[42px] z-[100]">
                    {/* Note Container */}
                    <div
                        className="w-[340px] h-[50px] rounded-[10px] border border-white/10 flex items-start p-[9px_10px] relative overflow-hidden"
                        onClick={() => setIsConfirmed(!isConfirmed)}
                    >
                        {/* Custom Checkbox */}
                        <div
                            className={`w-5 h-5 rounded-[4px] border-2 shrink-0 transition-colors flex items-center justify-center ${isConfirmed ? 'bg-[#5260FE] border-[#5260FE]' : 'border-[#5260FE]'
                                }`}
                        >
                            {isConfirmed && (
                                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                    <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>

                        {/* Note Text */}
                        <p className="ml-3 text-white text-[12px] font-normal font-satoshi leading-[1.3] pr-2">
                            I understand that downgrading will remove my {walletTier} benefits and reduce my wallet limit.
                        </p>
                    </div>

                    {/* Warning Text */}
                    <p className="w-[362px] mt-[42px] text-white text-[12px] font-normal font-satoshi leading-[1.4] text-left">
                        Most {walletTier} users keep their plan for faster withdrawals and higher limits. Are you sure you want to switch?
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={handleConfirm}
                        disabled={!isConfirmed}
                        className={`w-[362px] h-[48px] mt-[12px] rounded-full flex items-center justify-center text-white text-[16px] font-medium font-satoshi active:scale-95 transition-all ${isConfirmed ? 'bg-[#5260FE]' : 'bg-[#5260FE]/20 text-white/50'
                            }`}
                    >
                        Confirm Downgrade
                    </button>
                </div>
            )}
        </div>
    );
};

export default DowngradePlan;
