import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import BackButton from '@/components/ui/BackButton';
import { SlideToPay } from '@/components/SlideToPay';
import { WalletTier } from '@/contexts/UserContext';
import { useWalletStore } from '@/store/useWalletStore';
import { tierChipColorMap, fetchTierPrices } from '@/lib/walletTiers';
import { formatINR } from '@/utils/format';
const subscriptionBanners: Record<string, string> = {
  Starter: ASSETS.STARTER_SUBSCRIPTION,
  Pro: ASSETS.PRO_SUBSCRIPTION,
  Elite: ASSETS.ELITE_SUBSCRIPTION,
  Supreme: ASSETS.SUPREME_SUBSCRIPTION,
};
const subscriptionBannersLight: Record<string, string> = {
  Starter: ASSETS.STARTER_SUBSCRIPTION_LIGHT,
  Pro: ASSETS.PRO_SUBSCRIPTION_LIGHT,
  Elite: ASSETS.ELITE_SUBSCRIPTION_LIGHT,
  Supreme: ASSETS.SUPREME_SUBSCRIPTION_LIGHT,
};
const chipContent: Record<string, string> = {
  Starter: 'FREE',
  Pro: '₹25/month',
  Elite: '₹50/month',
  Supreme: '₹100/month',
};
import { supabase } from '@/lib/supabase';
const DowngradeSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useIsDarkMode();
  const scheduleDowngrade = useWalletStore((state) => state.scheduleDowngrade);
  const walletBalance = useWalletStore((state) => state.walletBalance);
  const { tier } = location.state || { tier: '' };
  const bannerImage = isDarkMode
    ? subscriptionBanners[tier] || ASSETS.STARTER_SUBSCRIPTION
    : subscriptionBannersLight[tier] || ASSETS.STARTER_SUBSCRIPTION_LIGHT;
  const [tierPrices, setTierPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const prices = await fetchTierPrices();
        setTierPrices(prices);
      } catch (err) {
        console.error('Failed to fetch tier prices', err);
      }
    };
    loadPrices();
  }, []);
  const selectedTierPrice = tierPrices[tier] || 0;
  // Hardcoded max limits per tier for comparison during downgrade flow
  const tierLimits: Record<string, number> = {
    Starter: 5000,
    Pro: 15000,
    Elite: 50000,
    Supreme: 150000,
  };
  const nextLimit = tierLimits[tier] || 0;
  const isBalanceOverLimit = walletBalance > nextLimit;
  // Calculate effective date (e.g. 1 month from now)
  const getEffectiveDate = () => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    const day = String(next.getDate()).padStart(2, '0');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${day} ${months[next.getMonth()]} ${next.getFullYear()}`;
  };
  const effectiveDate = getEffectiveDate();
  return (
    <div
      className={`h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-top ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
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
      {/* Header */}
      <div className="shrink-0 relative flex items-center justify-center w-full px-5 pt-4 pb-0 z-10">
        <div className="absolute left-5">
          <BackButton onClick={() => navigate(-1)} />
        </div>
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi`}
        >
          Monthly Subscription
        </h1>
      </div>
      {/* Content */}
      <div className="flex-1 flex flex-col items-center pt-[36px] px-5">
        {/* Subscription Banner */}
        <div
          className="w-full max-w-[362px] h-[95px] rounded-[20px] relative overflow-hidden"
          style={{
            backgroundImage: `url(${bannerImage})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'calc(50% + 50px) center',
            border: !isDarkMode ? '1px solid #F2F2F7' : 'none',
          }}
        >
          {/* Banner Text */}
          <div className="absolute top-[13px] left-[77px] flex flex-col">
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-satoshi uppercase`}
            >
              WALLET - {tier}
            </span>
            <span
              className={`${isDarkMode ? 'text-white/70' : 'text-black/70'} text-[12px] italic font-satoshi mt-[8px]`}
            >
              Billed monthly. Cancel anytime.
            </span>
          </div>
          {/* Chip */}
          <div
            className="absolute top-[13px] right-[13px] w-[77px] h-[23px] rounded-full flex items-center justify-center gap-[4px]"
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${ASSETS.SUBSCRIPTION_CHIP})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }
                : {
                    backgroundColor: tierChipColorMap[tier as WalletTier] || '#000000',
                  }
            }
          >
            <span className="text-white text-[10px] font-medium leading-[140%] tracking-[-0.3px] font-satoshi">
              {chipContent[tier] || 'FREE'}
            </span>
            {tier !== 'Starter' && (
              <img loading="eager" decoding="async" src={ASSETS.AUTO_REFRESH} alt="" className="w-[10px] h-[10px]" />
            )}
          </div>
        </div>
        {/* To Pay Container */}
        <div
          className={`w-full max-w-[362px] mt-[18px] rounded-[13px] flex flex-col gap-[10px] relative border ${isDarkMode ? 'bg-brand-card-dark/31 backdrop-blur-25 border-white/12' : 'bg-white border-brand-border-light'}`}
          style={{
            padding: '14px 11px',
          }}
        >
          {/* Border overlay */}
          {isDarkMode && (
            <div
              className="absolute inset-0 pointer-events-none rounded-[13px]"
              style={{
                padding: '0.63px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
          )}
          {/* Heading */}
          <h2
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold leading-[120%] font-satoshi`}
          >
            To Pay
          </h2>
          {/* Body */}
          <p
            className={`${isDarkMode ? 'text-brand-text-placeholder font-light' : 'text-black/80 font-normal'} text-[14px] leading-[139%] font-satoshi`}
          >
            No additional taxes apply. Processing fee is inclusive of all charges.
          </p>
          {/* Divider */}
          <div
            className={`w-[340px] h-[1px] mx-auto ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`}
          />
          {/* Monthly Subscription Fee Row */}
          <div className="flex justify-between items-center mt-[2px]">
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-[139%] font-satoshi`}
            >
              Monthly Subscription Fee
            </span>
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-bold leading-[120%] font-satoshi`}
            >
              ₹{selectedTierPrice}
            </span>
          </div>
          {/* First payment note */}
          <p
            className={`${isDarkMode ? 'text-brand-text-placeholder font-normal' : 'text-black/80 font-normal'} text-[12px] leading-[139%] font-satoshi -mt-[2px]`}
          >
            You will be charged ₹{selectedTierPrice} on {effectiveDate}.
          </p>
          {/* Divider */}
          <div
            className={`w-[340px] h-[1px] mx-auto -mt-[2px] ${isDarkMode ? 'bg-brand-border-dark' : 'bg-brand-border-light'}`}
          />
          {/* Total Payable Row */}
          <div className="flex justify-between items-center -mt-[2px]">
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-[139%] font-satoshi`}
            >
              Total Payable
            </span>
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-bold leading-[120%] font-satoshi`}
            >
              ₹0
            </span>
          </div>
        </div>
        {/* Second Container */}
        <div
          className={`w-full max-w-[362px] min-h-[65px] mt-[14px] rounded-[13px] relative flex items-center border ${isDarkMode ? 'bg-brand-card-dark/31 backdrop-blur-25 border-white/12' : 'bg-white border-brand-border-light'}`}
          style={{
            padding: '12px 10px',
          }}
        >
          {/* Border overlay */}
          {isDarkMode && (
            <div
              className="absolute inset-0 pointer-events-none rounded-[13px]"
              style={{
                padding: '0.63px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
          )}
          <p
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal leading-[147%] font-satoshi`}
          >
            Renews automatically every month on your billing date. Cancel anytime from Settings — no
            extra charges.
          </p>
        </div>
        {/* Next Payment Date Container */}
        <div
          className={`w-full max-w-[362px] mt-[14px] rounded-[13px] relative flex justify-between items-center border ${isDarkMode ? 'bg-brand-primary/21 backdrop-blur-25 border-white/12' : 'bg-[#E2E4FF] border-brand-primary'}`}
          style={{
            padding: '14px 11px',
          }}
        >
          {/* Border overlay */}
          {isDarkMode && (
            <div
              className="absolute inset-0 pointer-events-none rounded-[13px]"
              style={{
                padding: '0.63px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
          )}
          <span
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium leading-[139%] font-satoshi`}
          >
            Next Payment Date
          </span>
          <span
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-bold leading-[120%] font-satoshi`}
          >
            {effectiveDate}
          </span>
        </div>
        {/* Status Text for Downgrade */}
        <p
          className={`w-full max-w-[362px] mt-[14px] text-[14px] font-normal leading-[140%] font-satoshi text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Your wallet will be downgraded to {tier} Wallet. Changes will take place on your next
          billing date. Any balance above the new limit will be{' '}
          <span className="text-[#FF0000] font-bold">lost forever</span>.
        </p>
        {/* Over Limit Warning */}
        {isBalanceOverLimit && (
          <div
            className={`mt-[14px] w-full max-w-[362px] rounded-[12px] p-[10px] border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white border-brand-border-light'}`}
          >
            <h3
              className={`${isDarkMode ? 'text-brand-text-dim' : 'text-black'} text-[12px] font-bold font-satoshi`}
            >
              Note:
            </h3>
            <p
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-medium font-satoshi mt-[7px]`}
            >
              Your current balance ({formatINR(walletBalance)}) exceeds the {tier} limit (
              {formatINR(nextLimit)}).{' '}
              <span className="text-[#FF0000] font-bold">
                Before downgrading... make sure your wallet balance is used
              </span>{' '}
              — once it’s gone, it’s really gone.
            </p>
          </div>
        )}
      </div>
      <div className="px-5 mt-auto safe-bottom pb-4 pt-4 shrink-0">
        <SlideToPay
          onComplete={async () => {
            try {
              if (tier) {
                // 1. Set the scheduled_tier_id and tier_change_date
                // Using ISO format for the database
                const isoDate = new Date();
                isoDate.setMonth(isoDate.getMonth() + 1);
                await scheduleDowngrade(tier as WalletTier, isoDate.toISOString().split('T')[0]);
              }
              navigate(ROUTES.SUBSCRIPTIONS);
            } catch (error: unknown) {
              console.error('Payment or scheduling failed:', error);
              // Optionally handle dismiss or error here
            }
          }}
          label="Confirm Downgrade"
        />
      </div>
    </div>
  );
};
export default DowngradeSummary;
