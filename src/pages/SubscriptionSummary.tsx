import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useTheme } from 'next-themes';
import BackButton from '@/components/ui/BackButton';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { SlideToPay } from '@/components/SlideToPay';
import { supabase } from '@/lib/supabase';
// Light Mode Assets
import { tierChipColorMap, fetchTierPrices } from '@/lib/walletTiers';
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
import { useUser, WalletTier } from '@/contexts/UserContext';
const SubscriptionSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const queryClient = useQueryClient();
  const {
    setWalletTier,
    walletTier,
    scheduleDowngrade,
    subscriptionPrice,
    profile,
    paymentStatus,
    scheduledDowngrade,
    fetchProfileData,
  } = useUser();
  const userId = profile?.id;
  const { tier, paymentMethod } = location.state || { tier: '', paymentMethod: '' };
  const [isLoading, setIsLoading] = useState(false);
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
  const selectedTierPrice = tierPrices[tier.toLowerCase()] || 0;
  const currentTierPrice = tierPrices[walletTier.toLowerCase()] || 0;
  const isDowngrade = location.state?.flow === 'downgrade' || selectedTierPrice < currentTierPrice;
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
  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const selectedTierName = tier.toLowerCase() as 'pro' | 'elite' | 'supreme';
      const validTiers = ['pro', 'elite', 'supreme'];
      if (!validTiers.includes(selectedTierName)) {
        throw new Error(
          `Invalid tier: ${tier}. Subscription is only available for Pro, Elite, or Supreme tiers.`
        );
      }
      // 1. Manually call the function URL
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`;
      const currentUserId = userId;
      const payload = {
        amount: selectedTierPrice,
        userId: currentUserId,
        type: 'tier_upgrade',
        tier_name: selectedTierName,
      };
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }
      const data = await response.json();
      // 🛠️ The FIX: Parse if raw string
      let order = data;
      if (typeof data === 'string') {
        try {
          order = JSON.parse(data);
        } catch (e) {
          throw new Error('Failed to parse subscription order response');
        }
      }
      // 2. Open Razorpay using the order_id
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: 'Grid.pe',
        description: `${selectedTierName.toUpperCase()} Upgrade`,
        handler: async function (response: any) {
          try {
            setIsLoading(true);
            const verifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-subscription`;
            const verifyResponse = await fetch(verifyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({
                ...response,
                tier_name: selectedTierName,
                user_id: currentUserId,
              }),
            });
            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || verifyData.message || 'Verification failed');
            }
            if (verifyData.success) {
              // Immediately refresh the wallet data
              await fetchProfileData();
              await queryClient.invalidateQueries({ queryKey: ['wallet'] });
              navigate(ROUTES.WALLET_UPGRADE_SUCCESS, {
                state: {
                  tier,
                  flow: location.state?.flow,
                  message: `Subscription Renewed for ${tier}`,
                },
              });
            }
          } catch (err: any) {
            console.error('Verification error:', err.message || err);
            alert(
              `Payment successful, but verification failed: ${err.message || 'Please contact support.'}`
            );
          } finally {
            setIsLoading(false);
          }
        },
        theme: { color: '#5260FE' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('RAZORPAY_FAILURE:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      alert('Error: ' + (error.message || 'An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };
  const bannerImage = isDarkMode
    ? subscriptionBanners[tier] || ASSETS.STARTER_SUBSCRIPTION
    : subscriptionBannersLight[tier] || ASSETS.STARTER_SUBSCRIPTION_LIGHT;
  return (
    <div
      className={`h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-top ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
      style={{
        fontFamily: "'Satoshi', sans-serif",
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
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
          className={`w-full max-w-[362px] h-[70px] rounded-[20px] relative overflow-hidden ${!isDarkMode ? 'border border-[#E9EAEB]' : ''}`}
          style={{
            backgroundImage: `url(${bannerImage})`,
            backgroundSize: isDowngrade ? 'auto 100%' : 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: isDowngrade ? 'calc(50% + 40px) center' : 'center',
            border: !isDarkMode ? '1px solid #F2F2F7' : 'none',
          }}
        >
          {/* Banner Text */}
          <div className="absolute top-[13px] left-[77px] flex flex-col">
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-satoshi`}
            >
              WALLET - {tier?.toUpperCase() || 'PRO'}
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
              <img src={ASSETS.AUTO_REFRESH} alt="" className="w-[10px] h-[10px]" />
            )}
          </div>
        </div>
        {/* To Pay Container */}
        <div
          className={`w-full max-w-[362px] mt-[18px] rounded-[13px] flex flex-col gap-[10px] relative border ${isDarkMode ? 'bg-[#191919]/31 backdrop-blur-25 border-white/12' : 'bg-white border-[#E9EAEB]'}`}
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
            className={`${isDarkMode ? 'text-[#A4A4A4] font-light' : 'text-black/80 font-normal'} text-[14px] leading-[139%] font-satoshi`}
          >
            No additional taxes apply. Processing fee is inclusive of all charges.
          </p>
          {/* Divider */}
          <div
            className={`w-[340px] h-[1px] mx-auto ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E9EAEB]'}`}
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
            className={`${isDarkMode ? 'text-[#A4A4A4] font-normal' : 'text-black/80 font-normal'} text-[12px] leading-[139%] font-satoshi -mt-[2px]`}
          >
            {isDowngrade
              ? `You will be charged ₹${selectedTierPrice} on ${effectiveDate}`
              : 'First payment will be charged today.'}
          </p>
          {/* Divider */}
          <div
            className={`w-[340px] h-[1px] mx-auto -mt-[2px] ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E9EAEB]'}`}
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
              {isDowngrade ? '₹0' : `₹${selectedTierPrice}`}
            </span>
          </div>
        </div>
        {/* Second Container */}
        <div
          className={`w-full max-w-[362px] min-h-[65px] mt-[14px] rounded-[13px] relative flex items-center border ${isDarkMode ? 'bg-[#191919]/31 backdrop-blur-25 border-white/12' : 'bg-white border-[#E9EAEB]'}`}
          style={{
            padding: '12px 10px',
          }}
        >
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
          className={`w-full max-w-[362px] mt-[14px] rounded-[13px] relative flex justify-between items-center border ${isDarkMode ? 'bg-[#5260FE]/21 backdrop-blur-25 border-white/12' : 'bg-[#E2E4FF] border-[#5260FE]'}`}
          style={{
            padding: '14px 11px',
          }}
        >
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
        {/* Status Text for Upgrade/Downgrade */}
        {(() => {
          const stateFlow = location.state?.flow;
          // User Request:
          // "upgrading from starter to any tier, the small note will not appear"
          // "should appear only from pro till supreme, and whilte downgrading, it should appear on all the tiers"
          const shouldShowNote =
            isDowngrade || (stateFlow === 'upgrade' && walletTier !== 'Starter');
          if (!shouldShowNote) return null;
          const actionVerb = isDowngrade ? 'downgraded' : 'upgraded';
          return (
            <p
              className={`w-full max-w-[362px] mt-[14px] text-[14px] font-normal leading-[140%] font-satoshi text-left ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Your wallet will be {actionVerb} to {tier} Wallet. Changes will take place on your
              next billing date. Till then you may enjoy the benefits of {walletTier} Wallet.
            </p>
          );
        })()}
      </div>
      {/* Slide to Pay */}
      <div className="px-5 mt-auto safe-bottom pb-4 pt-4 shrink-0">
        <SlideToPay
          onComplete={async () => {
            if (isDowngrade) {
              if (tier) {
                const isoDate = new Date();
                isoDate.setMonth(isoDate.getMonth() + 1);
                await scheduleDowngrade(tier as WalletTier, isoDate.toISOString().split('T')[0]);
              }
              navigate(ROUTES.SUBSCRIPTIONS);
            } else {
              handleUpgrade();
            }
          }}
          label={
            isLoading
              ? 'Processing...'
              : isDowngrade
                ? 'Confirm Downgrade'
                : 'Start Monthly Subscription'
          }
          disabled={
            isLoading ||
            (!isDowngrade &&
              walletTier !== 'Starter' &&
              (!!scheduledDowngrade ||
                paymentStatus === 'pending' ||
                (profile as any)?.subscription_status === 'pending'))
          }
        />
      </div>
    </div>
  );
};
export default SubscriptionSummary;
