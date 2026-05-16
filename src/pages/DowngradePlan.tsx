import { ASSETS } from '@/constants/assets';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useUser, WalletTier } from '@/contexts/UserContext';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { tiers, tierIconMap } from '@/lib/walletTiers';
// Import Assets
// Light Mode Assets
const currentActiveBgs: Record<WalletTier, string> = {
  Starter: ASSETS.CURRENT_ACTIVE_STARTER,
  Pro: ASSETS.CURRENT_ACTIVE_PRO,
  Elite: ASSETS.CURRENT_ACTIVE_ELITE,
  Supreme: ASSETS.CURRENT_ACTIVE_SUPREME,
};
const currentActiveBgsLight: Record<WalletTier, string> = {
  Starter: ASSETS.CURRENT_ACTIVE_STARTER_LIGHT,
  Pro: ASSETS.CURRENT_ACTIVE_PRO_LIGHT,
  Elite: ASSETS.CURRENT_ACTIVE_ELITE_LIGHT,
  Supreme: ASSETS.CURRENT_ACTIVE_SUPREME_LIGHT,
};
const downgradeBgs: Record<WalletTier, string> = {
  Starter: ASSETS.DOWNGRADE_STARTER,
  Pro: ASSETS.DOWNGRADE_PRO,
  Elite: ASSETS.DOWNGRADE_ELITE,
  Supreme: ASSETS.DOWNGRADE_SUPREME,
};
const downgradeBgsLight: Record<WalletTier, string> = {
  Starter: ASSETS.DOWNGRADE_STARTER_LIGHT,
  Pro: ASSETS.DOWNGRADE_PRO_LIGHT,
  Elite: ASSETS.DOWNGRADE_ELITE_LIGHT,
  Supreme: ASSETS.DOWNGRADE_SUPREME_LIGHT,
};
const DowngradePlan = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { walletTier, setWalletTier } = useUser();
  const [selectedTier, setSelectedTier] = useState<WalletTier | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const currentConfig = tiers.find(t => t.name === walletTier);
  // Get available downgrade options
  const tierOrder: WalletTier[] = ['Starter', 'Pro', 'Elite', 'Supreme'];
  const currentIndex = tierOrder.indexOf(walletTier);
  const downgradeOptions = tiers
    .filter(t => {
      const index = tierOrder.indexOf(t.name);
      return index < currentIndex;
    })
    .reverse(); // Show higher tiers first (e.g. for Elite, show Pro then Starter)
  const handleSwitch = (tier: WalletTier) => {
    setSelectedTier(tier);
    setIsConfirmed(false); // Reset confirmation when changing selection
  };
  const handleConfirm = () => {
    if (selectedTier && isConfirmed) {
      navigate(ROUTES.DOWNGRADE_SUMMARY, { state: { tier: selectedTier, flow: 'downgrade' } });
    }
  };
  if (!currentConfig) return null;
  return (
    <div
      className={`absolute inset-0 overflow-y-auto overscroll-y-contain flex flex-col safe-top safe-bottom pb-4 ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      style={{
        fontFamily: "'Satoshi', sans-serif",
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Purple Glow (Top Center) */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      <header className="px-5 pt-4 pb-2 flex items-center relative z-10">
        <div className="absolute left-5">
          <BackButton onClick={() => navigate(-1)} />
        </div>
        <h1
          className={`w-full text-center ${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-satoshi`}
        >
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
            backgroundImage: isDarkMode ? `url(${currentActiveBgs[walletTier]})` : 'none',
            backgroundColor: isDarkMode ? 'transparent' : selectedTier ? '#EDEDED' : '#EFF0FF',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            border: !isDarkMode
              ? selectedTier
                ? '1px solid #F2F2F7'
                : '1px solid rgba(82, 96, 254, 0.4)'
              : 'none',
          }}
        >
          {/* Diamond Icon (Light Mode) */}
          {!isDarkMode && (
            <img
              src={tierIconMap[walletTier]}
              alt={`${walletTier} Diamond`}
              className="absolute top-[-5px] left-[-10px] w-[80px] h-[80px] z-20 object-contain"
            />
          )}
          {/* Chip */}
          <div
            className={`absolute top-[12px] right-[12px] w-[86px] h-[23px] flex items-center justify-center rounded-full ${!isDarkMode ? 'bg-brand-primary' : ''} z-20`}
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${ASSETS.CURRENT_ACTIVE_CHIP})`,
                    backgroundSize: 'cover',
                  }
                : {}
            }
          >
            <span className="text-white text-[10px] font-medium font-satoshi">Current Active</span>
          </div>
          {/* Selection Overlay (Inactive State - Dark Mode Only) */}
          {isDarkMode && selectedTier && (
            <div className="absolute inset-0 bg-[#0D0D0D]/50 pointer-events-none z-10" />
          )}
          {/* Content */}
          <div className="absolute top-[51px] left-[12px] right-[12px]">
            <span
              className={`text-[15px] font-bold font-satoshi uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {walletTier} WALLET
            </span>
            {/* Row 1: Verification, Wallet Limit & Withdraw Limit */}
            <div className="mt-[8px] flex items-start">
              {/* Verification */}
              <div className="flex flex-col w-[118px]">
                <span className="text-brand-text-dim text-[12px] font-regular font-satoshi">
                  Verification
                </span>
                <span
                  className={`text-[12px] ${isDarkMode ? 'font-regular' : 'font-medium'} font-satoshi mt-[1px] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {currentConfig.detailedVerification}
                </span>
              </div>
              {/* Wallet Limit */}
              <div className="flex flex-col w-[100px] ml-1">
                <span className="text-brand-text-dim text-[12px] font-regular font-satoshi">
                  Wallet limit
                </span>
                <span
                  className={`text-[12px] ${isDarkMode ? 'font-regular' : 'font-medium'} font-satoshi mt-[1px] ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {currentConfig.walletLimit}
                </span>
              </div>
              {/* Withdraw Limit */}
              <div className="flex flex-col">
                <span className="text-brand-text-dim text-[12px] font-regular font-satoshi">
                  Withdraw limit
                </span>
                <span
                  className={`text-[12px] ${isDarkMode ? 'font-regular' : 'font-medium'} font-satoshi mt-[1px] ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {currentConfig.withdrawLimit}
                </span>
              </div>
            </div>
            {/* Row 2: Limitations */}
            <div className="mt-[8px] flex flex-col pr-8">
              <span className="text-brand-text-dim text-[12px] font-regular font-satoshi">
                Limitations
              </span>
              <p
                className={`text-[12px] ${isDarkMode ? 'font-regular' : 'font-medium'} font-satoshi mt-[1px] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {currentConfig.limitations}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Downgrade Containers */}
      <div
        className={`px-5 mt-[12px] flex flex-col gap-[12px] items-center ${selectedTier ? 'pb-[300px]' : 'pb-20'}`}
      >
        {downgradeOptions.map(tier => (
          <div
            key={tier.name}
            onClick={() => handleSwitch(tier.name as WalletTier)}
            className={`w-[362px] ${tier.name === 'Starter' ? 'h-[260px]' : 'h-[276px]'} rounded-[13px] relative overflow-hidden shrink-0 transition-all cursor-pointer`}
            style={{
              backgroundImage: isDarkMode
                ? `url(${downgradeBgs[tier.name as WalletTier]})`
                : 'none',
              backgroundColor: isDarkMode
                ? 'transparent'
                : selectedTier === tier.name
                  ? '#EFF0FF'
                  : '#EDEDED',
              backgroundSize: 'cover',
              backgroundPosition: 'top center',
              border: !isDarkMode
                ? selectedTier === tier.name
                  ? '1px solid rgba(82, 96, 254, 0.4)'
                  : '1px solid #F2F2F7'
                : selectedTier === tier.name
                  ? '0.8px solid #5260FE'
                  : '2px solid transparent',
            }}
          >
            {/* Diamond Icon (Light Mode) */}
            {!isDarkMode && (
              <img
                src={tierIconMap[tier.name as WalletTier]}
                alt={`${tier.name} Diamond`}
                className="absolute top-[-5px] left-[-10px] w-[80px] h-[80px] z-20 object-contain"
              />
            )}
            {/* Selection Overlay */}
            {isDarkMode && selectedTier === tier.name && (
              <div className="absolute inset-0 bg-[#0E1350]/20 pointer-events-none z-10" />
            )}
            <div
              className={`absolute top-[12px] right-[12px] flex items-center justify-center rounded-full text-[10px] font-medium z-20 ${isDarkMode ? 'text-white' : 'text-white bg-black'}`}
              style={
                isDarkMode
                  ? {
                      width: '88px',
                      height: '24px',
                      backgroundImage: `url(${tier.chip})`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                    }
                  : {
                      width: '88px',
                      height: '24px',
                    }
              }
            >
              {tier.badge}
            </div>
            {/* Content */}
            <div className="absolute top-[51px] left-[12px] right-[12px]">
              <span
                className={`text-[15px] font-bold font-satoshi uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                {tier.name} WALLET
              </span>
              <div className="mt-[8px] flex items-start">
                {/* Verification */}
                <div className="flex flex-col w-[118px]">
                  <span className="text-brand-text-dim text-[12px] font-regular font-satoshi">
                    Verification
                  </span>
                  <span
                    className={`text-[12px] ${isDarkMode ? 'font-regular' : 'font-medium'} font-satoshi mt-[1px] leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {tier.name === 'Starter' ? (
                      <>
                        Mobile number,
                        <br />
                        basic information
                      </>
                    ) : (
                      tier.detailedVerification
                    )}
                  </span>
                </div>
                {/* Wallet Limit */}
                <div className="flex flex-col w-[100px] ml-1">
                  <span className="text-brand-text-dim text-[12px] font-regular font-satoshi">
                    Wallet limit
                  </span>
                  <span
                    className={`text-[12px] ${isDarkMode ? 'font-regular' : 'font-medium'} font-satoshi mt-[1px] ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {tier.walletLimit}
                  </span>
                </div>
                {/* Withdraw Limit */}
                <div className="flex flex-col">
                  <span className="text-brand-text-dim text-[12px] font-regular font-satoshi">
                    Withdraw limit
                  </span>
                  <span
                    className={`text-[12px] ${isDarkMode ? 'font-regular' : 'font-medium'} font-satoshi mt-[1px] ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {tier.withdrawLimit}
                  </span>
                </div>
              </div>
              {/* Row 2: Limitations */}
              <div className="mt-[8px] flex flex-col pr-8">
                <span className="text-brand-text-dim text-[12px] font-regular font-satoshi">
                  Limitations
                </span>
                <span
                  className={`text-[12px] ${isDarkMode ? 'font-regular' : 'font-medium'} font-satoshi mt-[1px] ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {tier.name === 'Starter' ? 'Add money cooldown' : tier.limitations}
                </span>
              </div>
              {/* CTA */}
              <div className="mt-[16px] flex justify-center w-full px-[10px]">
                <button
                  onClick={() => handleSwitch(tier.name)}
                  className={`w-full h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-medium font-satoshi active:scale-95 transition-transform ${isDarkMode ? '' : 'bg-black'}`}
                  style={
                    isDarkMode
                      ? {
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }
                      : {}
                  }
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
        <div
          className={`fixed bottom-0 left-0 right-0 flex flex-col items-center pt-[20px] safe-bottom pb-4 z-[100] ${isDarkMode ? 'bg-black' : 'bg-white border-t border-brand-border-light'}`}
        >
          {/* Note Container */}
          <div
            className={`w-[340px] min-h-[50px] rounded-[10px] border flex items-start p-[9px_10px] relative ${isDarkMode ? 'border-white/10' : 'border-brand-border-light'}`}
            onClick={() => setIsConfirmed(!isConfirmed)}
          >
            {/* Custom Checkbox */}
            <div
              className={`w-5 h-5 rounded-[4px] border-2 shrink-0 transition-colors flex items-center justify-center ${
                isConfirmed
                  ? 'bg-brand-primary border-brand-primary'
                  : isDarkMode
                    ? 'border-brand-primary'
                    : 'border-brand-primary'
              }`}
            >
              {isConfirmed && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path
                    d="M1 5L4.5 8.5L11 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            {/* Note Text */}
            <p
              className={`ml-3 text-[12px] font-regular font-satoshi leading-[1.3] pr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              I understand that downgrading will remove my {walletTier} benefits, reduce my wallet
              limit, and any additional balance above the new limit will be{' '}
              <span className="text-[#FF0000] font-bold">lost forever</span>.
            </p>
          </div>
          {/* Warning Text */}
          <p
            className={`w-[362px] mt-[42px] text-[12px] font-regular font-satoshi leading-[1.4] text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Most {walletTier} users keep their plan for faster withdrawals and higher limits. Are
            you sure you want to switch?
          </p>
          {/* CTA Button */}
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={`w-[362px] h-[48px] mt-[12px] rounded-full flex items-center justify-center text-[16px] font-medium font-satoshi active:scale-95 transition-all ${
              isConfirmed
                ? 'bg-brand-primary text-white'
                : isDarkMode
                  ? 'bg-brand-primary/20 text-white/50'
                  : 'bg-[#EBEBEB] text-black/50'
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
