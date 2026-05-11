import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUser } from '@/contexts/UserContext';
import { useAsset } from '@/hooks/useAsset';
import BackButton from '@/components/ui/BackButton';
import { useWebScroll } from '@/hooks/useWebScroll';
import WalletSkeleton from '@/components/skeletons/WalletSkeleton';
const Wallet = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const { isWalletActivated, activateWallet, isInitializing } = useUser();
  const [activeTab, setActiveTab] = useState<'how-it-works' | 'refund-policy'>('how-it-works');
  const walletBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);
  const walletLogoAsset = useAsset(ASSETS.WALLET_LOGO, ASSETS.WALLET_LOGO);
  const switchTabBackground = useAsset(ASSETS.SWITCHTAB, ASSETS.SWITCHTAB);
  const selectedTabBackground = useAsset(ASSETS.SELECTEDTAB, ASSETS.SELECTEDTAB);
  const primaryButton = useAsset(ASSETS.BUTTON_PRIMARY_WIDE, ASSETS.BUTTON_PRIMARY_WIDE);
  useEffect(() => {
    if (!isInitializing && isWalletActivated) {
      navigate(ROUTES.WALLET_CREATED, { replace: true });
    }
  }, [isWalletActivated, isInitializing, navigate]);
  if (isInitializing) {
    return <WalletSkeleton />;
  }
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col safe-top bg-background`}
      style={{
        backgroundImage: `url(${walletBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header Container (Fixed) */}
      <div className="shrink-0 w-full relative z-10 pt-4 px-5">
        {/* Back Button */}
        <BackButton onClick={() => navigate(-1)} className="absolute left-5 top-4" />
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src={walletLogoAsset}
            alt="Wallet Logo"
            style={{
              width: '159px',
              height: '57px',
              filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0)',
            }}
          />
        </div>
        {/* Switch Tab */}
        <div
          className="mt-[42px] mx-auto relative flex items-center justify-center"
          style={{
            width: '362px',
            height: '62px',
            backgroundImage: isDarkMode ? `url(${switchTabBackground})` : 'none',
            backgroundColor: isDarkMode ? 'transparent' : 'hsla(var(--primary) / 0.06)',
            borderRadius: '31px',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            border: isDarkMode ? 'none' : '1px solid hsla(var(--primary) / 0.1)',
          }}
        >
          <div className="flex w-full h-full relative">
            {/* Selection Indicator */}
            <div
              className={`absolute top-[4px] transition-all duration-300 ease-in-out flex items-center justify-center`}
              style={{
                width: '173px',
                height: '54px',
                backgroundImage: isDarkMode ? `url(${selectedTabBackground})` : 'none',
                backgroundColor: isDarkMode ? 'transparent' : 'hsl(var(--primary))',
                borderRadius: '27px',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                left: 0,
                transform: activeTab === 'how-it-works' ? 'translateX(4px)' : 'translateX(185px)',
                boxShadow: isDarkMode ? 'none' : '0px 4px 12px hsla(var(--primary) / 0.2)',
              }}
            />
            {/* Buttons */}
            <button
              onClick={() => setActiveTab('how-it-works')}
              className={`flex-1 relative z-10 h-full flex items-center justify-center transition-colors duration-300`}
            >
              <span
                className={`font-sans text-[12px] ${activeTab === 'how-it-works' ? 'text-white font-bold' : isDarkMode ? 'text-white/50 font-bold' : 'text-primary font-medium'}`}
              >
                How it works
              </span>
            </button>
            <button
              onClick={() => setActiveTab('refund-policy')}
              className={`flex-1 relative z-10 h-full flex items-center justify-center transition-colors duration-300`}
            >
              <span
                className={`font-sans text-[12px] ${activeTab === 'refund-policy' ? 'text-white font-bold' : isDarkMode ? 'text-white/50 font-bold' : 'text-primary font-medium'}`}
              >
                Refund Policy
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* Main Content (Scrollable) */}
      <div
        className={`flex-1 w-full px-5 pt-[28px] no-scrollbar pb-[20px] ${activeTab === 'refund-policy' ? 'overflow-hidden' : 'overflow-y-auto'}`}
      >
        {/* Content Pointers */}
        <div className="flex flex-col gap-[24px]">
          {activeTab === 'how-it-works' ? (
            <>
              {/* Point 1 */}
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  />
                  <h3 className={`text-foreground text-[16px] font-medium font-sans`}>
                    Your amount is held, not charged
                  </h3>
                </div>
                <p className={`text-muted-foreground text-[14px] font-normal font-sans pl-[14px]`}>
                  The money stays in your wallet and is only deducted after successful delivery.
                </p>
              </div>
              {/* Point 2 */}
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  />
                  <h3
                    className={`text-foreground dark:text-white text-[16px] font-medium font-sans`}
                  >
                    You’re always in control
                  </h3>
                </div>
                <p className={`text-muted-foreground text-[14px] font-normal font-sans pl-[14px]`}>
                  Amount is released only after OTP-based delivery confirmation.
                </p>
              </div>
              {/* Point 3 */}
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  />
                  <h3
                    className={`text-foreground dark:text-white text-[16px] font-medium font-sans`}
                  >
                    Cancel anytime before OTP
                  </h3>
                </div>
                <p className={`text-muted-foreground text-[14px] font-normal font-sans pl-[14px]`}>
                  No delivery = no deduction. Refunds are instant if you cancel before confirmation.
                </p>
              </div>
              {/* Point 4 */}
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  />
                  <h3
                    className={`text-foreground dark:text-white text-[16px] font-medium font-sans`}
                  >
                    Withdraw anytime
                  </h3>
                </div>
                <p className={`text-muted-foreground text-[14px] font-normal font-sans pl-[14px]`}>
                  Transfer your wallet balance directly to your bank account — fast and secure.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Point 1 */}
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  />
                  <h3
                    className={`text-foreground dark:text-white text-[16px] font-medium font-sans`}
                  >
                    What happens if I cancel the order?
                  </h3>
                </div>
                <p className={`text-muted-foreground text-[14px] font-normal font-sans pl-[14px]`}>
                  You get a full refund instantly if it’s cancelled before the 30s timer after an
                  order is placed. Note: Multiple cancellations may lead to a small cancellation fee
                  which will be applicable on future order.
                </p>
              </div>
              {/* Point 2 */}
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  />
                  <h3
                    className={`text-foreground dark:text-white text-[16px] font-medium font-sans`}
                  >
                    Is there any withdrawal fee?
                  </h3>
                </div>
                <p className={`text-muted-foreground text-[14px] font-normal font-sans pl-[14px]`}>
                  No! There’s no withdrawal fee. You are allowed to withdraw your entire wallet
                  balance in your preferred source of payment.
                </p>
              </div>
              {/* Point 3 */}
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  />
                  <h3
                    className={`text-foreground dark:text-white text-[16px] font-medium font-sans`}
                  >
                    Will my wallet be auto-charged?
                  </h3>
                </div>
                <p className={`text-muted-foreground text-[14px] font-normal font-sans pl-[14px]`}>
                  Never. We only deduct once your delivery is completed and verified by you.
                </p>
              </div>
              {/* Point 4 */}
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  />
                  <h3
                    className={`text-foreground dark:text-white text-[16px] font-medium font-sans`}
                  >
                    Can I top up my Grid.Pe wallet?
                  </h3>
                </div>
                <p className={`text-muted-foreground text-[14px] font-normal font-sans pl-[14px]`}>
                  Yes! You can add money anytime for faster future orders. There are tiers to the
                  wallet, which allows you to add higher amounts.
                </p>
              </div>
              {/* Point 5 */}
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  />
                  <h3
                    className={`text-foreground dark:text-white text-[16px] font-medium font-sans`}
                  >
                    How long does a withdrawal take?
                  </h3>
                </div>
                <p className={`text-muted-foreground text-[14px] font-normal font-sans pl-[14px]`}>
                  Withdrawals are processed instantly, and should reflect in your source of payment
                  method within 30 minutes.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Footer CTA (Fixed) */}
      <div className="shrink-0 px-5 safe-bottom pb-4 pt-4 w-full bg-transparent">
        <button
          onClick={async () => {
            try {
              await activateWallet();
              navigate(ROUTES.WALLET_CREATED, { replace: true });
            } catch (err) {
              console.error('[GetStarted] Failed:', err);
            }
          }}
          className={`w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans transition-all active:scale-95 ${!isDarkMode ? 'bg-primary rounded-full' : ''}`}
          style={{
            backgroundImage: isDarkMode ? `url(${primaryButton})` : 'none',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};
export default Wallet;
