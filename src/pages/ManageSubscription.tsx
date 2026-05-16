import { ASSETS } from '@/constants/assets';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import BackButton from '@/components/ui/BackButton';
import { useUser, WalletTier } from '@/contexts/UserContext';
import { tiers } from '@/lib/walletTiers';
import { formatINR } from '@/utils/format';
// Import Assets
// Light Mode Assets
const subscriptionBgs: Record<WalletTier, string> = {
  Starter: ASSETS.SUBSCRIPTION_STARTER,
  Pro: ASSETS.SUBSCRIPTION_PRO,
  Elite: ASSETS.SUBSCRIPTION_ELITE,
  Supreme: ASSETS.SUBSCRIPTION_SUPREME,
};
const subscriptionBgsLight: Record<WalletTier, string> = {
  Starter: ASSETS.SUBSCRIPTION_STARTER_LIGHT,
  Pro: ASSETS.SUBSCRIPTION_PRO_LIGHT,
  Elite: ASSETS.SUBSCRIPTION_ELITE_LIGHT,
  Supreme: ASSETS.SUBSCRIPTION_SUPREME_LIGHT,
};
const ManageSubscription = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { walletTier, walletLimit, scheduleDowngrade } = useUser();
  const currentTierConfig = tiers.find(t => t.name === walletTier);
  if (!currentTierConfig) return null;
  const handleCancel = async () => {
    try {
      const isoDate = new Date();
      isoDate.setDate(isoDate.getDate() + 31);
      await scheduleDowngrade('Starter', isoDate.toISOString().split('T')[0]);
      navigate(ROUTES.SUBSCRIPTIONS);
    } catch (error: unknown) {
      console.error('Cancellation scheduling failed:', error);
    }
  };
  const backgroundImage = isDarkMode
    ? subscriptionBgs[walletTier]
    : subscriptionBgsLight[walletTier];
  return (
    <div
      className={`h-full w-full overflow-y-auto overscroll-y-contain flex flex-col safe-top safe-bottom pb-4 ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'}`}
      style={{
        fontFamily: "'Satoshi', sans-serif",
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header */}
      <header className="px-5 pt-4 pb-2 flex items-center relative z-10 shrink-0">
        <div className="absolute left-5">
          <BackButton onClick={() => navigate(-1)} />
        </div>
        <h1
          className={`w-full text-center ${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-satoshi`}
        >
          Manage Subscription
        </h1>
      </header>
      {/* Current Wallet Tier Container */}
      <div className="px-5 mt-[31px]">
        <div
          className="w-[360px] mx-auto rounded-[20px] relative overflow-hidden h-[144px]"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
            border: !isDarkMode ? '1px solid #F2F2F7' : 'none',
          }}
        >
          {/* Price Chip */}
          <div
            className="absolute flex items-center justify-center rounded-full text-[10px] font-medium text-white z-20"
            style={{
              top: '12px',
              right: '12px',
              width: '88px',
              height: '24px',
              backgroundImage: `url(${currentTierConfig.chip})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {currentTierConfig.badge}
          </div>
          {/* Content */}
          <div className="absolute top-[12px] left-[77px] flex flex-col">
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-satoshi uppercase`}
            >
              {walletTier}
            </span>
            <div className="flex items-baseline gap-1 mt-[5px]">
              <span
                className={`${isDarkMode ? 'text-white' : 'text-black'} text-[32px] font-bold font-satoshi`}
              >
                {formatINR(walletLimit)}
              </span>
              <span
                className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium font-satoshi opacity-70`}
              >
                / wallet limit
              </span>
            </div>
          </div>
          {/* Next Billing Date */}
          <span
            className={`${isDarkMode ? 'text-white' : 'text-black'} absolute bottom-[15px] left-[15px] text-[14px] font-medium font-satoshi`}
          >
            Next billing date:{' '}
            {(() => {
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
              return `${day} ${months[next.getMonth()]}, ${next.getFullYear()}`;
            })()}
          </span>
        </div>
      </div>
      {/* Benefits Section */}
      <div className="mt-[24px] pl-[37px] pr-5">
        <h2
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium font-satoshi mb-[6px]`}
        >
          Plan benefits you’ll be missing
        </h2>
        <ul
          className={`${isDarkMode ? 'text-white' : 'text-black'} font-regular text-[14px] font-satoshi flex flex-col gap-1`}
        >
          <li className="flex items-start gap-2">
            <span
              className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
            />
            <span>
              Higher wallet limit of {currentTierConfig.walletLimit} (Starter is capped at{' '}
              {tiers[0].walletLimit})
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
            />
            <span>Faster top-ups — up to {currentTierConfig.dailyTopUpLimit}</span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
            />
            <span>Quick withdrawals — usually under 30 minutes</span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
            />
            <span>
              {currentTierConfig.verification || 'Verified KYC'} for smoother, unrestricted
              transactions
            </span>
          </li>
        </ul>
      </div>
      {/* Note Container */}
      <div className="mt-auto mb-4 flex flex-col items-center">
        <div
          className={`w-[326px] rounded-[12px] p-[10px] border ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white border-brand-border-light'}`}
        >
          <h3
            className={`${isDarkMode ? 'text-brand-text-dim' : 'text-black'} text-[12px] font-bold font-satoshi`}
          >
            Note:
          </h3>
          <p
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-regular font-satoshi mt-[7px]`}
          >
            Before downgrading or cancelling, make sure your wallet balance is used — once it’s
            gone, it’s really gone.
          </p>
        </div>
        {/* CTAs */}
        <div className="mt-[48px] flex flex-col gap-[12px]">
          <button
            onClick={() => navigate(ROUTES.DOWNGRADE_PLAN)}
            className="w-[362px] h-[48px] rounded-full bg-brand-primary text-white text-[16px] font-medium font-satoshi active:scale-95 transition-transform flex items-center justify-center shadow-lg shadow-brand-primary/20"
          >
            Downgrade Plan
          </button>
          <button
            onClick={handleCancel}
            className={`w-[362px] h-[48px] rounded-full text-[16px] font-medium font-satoshi active:scale-95 transition-transform flex items-center justify-center overflow-hidden relative ${isDarkMode ? 'text-white' : 'text-black bg-[#EBEBEB]'}`}
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${ASSETS.ADD_PAYMENT_CTA})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {}
            }
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
};
export default ManageSubscription;
