import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { formatINR } from '@/utils/format';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useQueryClient } from '@tanstack/react-query';
import { useUser, WalletTier } from '@/contexts/UserContext';
import { useWalletStore } from '@/store/useWalletStore';
import { supabase } from '@/lib/supabase';
import { useWebScroll } from '@/hooks/useWebScroll';
const WalletUpgradeSuccess = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const { tier, flow, message } = location.state || { tier: '', flow: 'upgrade', message: '' };
  const isDarkMode = useIsDarkMode();
  const queryClient = useQueryClient();
  const { fetchProfileData } = useUser();
  const setWalletTier = useWalletStore((state) => state.setWalletTier);
  const [tierDetails, setTierDetails] = useState<{
    name: string;
    max_wallet_balance: number;
    daily_topup_limit: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDowngrade = flow === 'downgrade' || message?.toLowerCase().includes('downgrade');
  useEffect(() => {
    const loadTierDetails = async () => {
      if (!tier) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('wallet_tiers')
          .select('name, max_wallet_balance, daily_topup_limit')
          .ilike('name', tier)
          .single();
        if (error) throw error;
        if (data) {
          setTierDetails(data);
        }
      } catch (err) {
        console.error('Error fetching tier details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTierDetails();
    // Refresh wallet data and other related user data
    fetchProfileData();
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    // Refresh session to reflect new tier if updated on backend
    supabase.auth.refreshSession();
    // Update the local context with the new tier
    if (tier) {
      setWalletTier(tier as WalletTier);
    }
  }, [queryClient, setWalletTier, tier, fetchProfileData]);
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col items-center relative safe-top safe-bottom px-5 bg-background dark:bg-background ${isDarkMode ? 'dark:bg-[url("@/assets/success-bg.png")] dark:bg-cover dark:bg-center' : 'bg-white'}`}
    >
      {!isDarkMode && (
        <div
          className="absolute top-[-150px] left-1/2 transform -translate-x-1/2 w-[500px] h-[400px] pointer-events-none z-0"
          style={{
            background: isDowngrade
              ? 'radial-gradient(circle, rgba(12, 126, 75, 0.12) 0%, rgba(255, 255, 255, 0) 75%)'
              : 'radial-gradient(circle, rgba(12, 126, 75, 0.12) 0%, rgba(255, 255, 255, 0) 75%)',
            filter: 'blur(50px)',
          }}
        />
      )}
      <div className="w-full pt-4 flex justify-center z-10">
        <h1 className="text-foreground dark:text-white text-[22px] font-medium leading-[120%] font-satoshi">
          {isDowngrade ? 'Wallet Downgraded' : 'Wallet Upgraded'}
        </h1>
      </div>
      <div className="mt-[16px] flex justify-center relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none z-0">
          <DotLottieReact
            src="https://lottie.host/b8c059a0-44f6-4063-931d-97446df3f817/kBvN9GRUXy.lottie"
            loop={true}
            autoplay
          />
        </div>
        <img
          src={isDarkMode ? ASSETS.CHECK_ICON : ASSETS.CHECK_ICON_LIGHT}
          alt="Success"
          className="w-[62px] h-[62px] object-contain relative z-10"
        />
      </div>
      <h2 className="text-foreground dark:text-white text-[18px] font-bold font-satoshi text-center mt-[35px] leading-[140%] z-10 px-4">
        {isDowngrade
          ? 'Tier updated successfully - continue exploring!'
          : 'Extra space, extra power - all yours! 🎉'}
      </h2>
      <div
        className="w-full max-w-[362px] min-h-[162px] mt-[35px] rounded-[13px] relative z-10 border border-border"
        style={
          isDarkMode
            ? {
                backgroundColor: 'rgba(0, 0, 0, 0.20)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                padding: '12px 14px',
              }
            : {
                backgroundColor: 'transparent',
                padding: '12px 14px',
              }
        }
      >
        <p className="text-foreground dark:text-muted-foreground text-[16px] font-medium font-sans leading-[120%] tracking-[0px]">
          Your wallet has been {isDowngrade ? 'downgraded' : 'upgraded'} to{' '}
          {tierDetails?.name?.toUpperCase() || tier?.toUpperCase() || 'PRO'}.
          <br />
          Benefits include:
        </p>
        <ul className="list-disc pl-4 mt-[17px] text-muted-foreground text-[16px] font-normal font-sans leading-[120%] tracking-[0px]">
          <li>Wallet limit {formatINR(tierDetails?.max_wallet_balance || 15000)}</li>
          <li>Faster deposits & withdrawals</li>
          <li>Priority support</li>
          <li>Deposit limit {formatINR(tierDetails?.daily_topup_limit || 10000)}/day</li>
        </ul>
      </div>
      <div className="w-full mt-auto mb-[50px] flex flex-col gap-[12px] items-center z-10">
        <button
          onClick={() => {
            navigate(ROUTES.WALLET_CREATED, {
              replace: true,
              state: {
                transitionSuccess: {
                  type: isDowngrade ? 'downgrade' : 'upgrade',
                  tier: tierDetails?.name || tier,
                },
              },
            });
          }}
          className={`w-full max-w-[361px] h-[48px] rounded-[296px] flex items-center justify-center text-[16px] font-medium font-satoshi active:scale-95 transition-transform text-white ${
            isDarkMode ? '' : 'bg-black'
          }`}
          style={
            isDarkMode
              ? {
                  backgroundImage: `url(${ASSETS.DARKBG_CTA})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  border: 'none',
                }
              : {}
          }
        >
          View Wallet
        </button>
        <button
          onClick={() => {
            navigate(ROUTES.SUBSCRIPTIONS, { replace: true });
          }}
          className={`w-full max-w-[361px] h-[48px] rounded-[296px] flex items-center justify-center text-[16px] font-medium font-satoshi active:scale-95 transition-transform ${
            isDarkMode
              ? 'text-white bg-white/10 backdrop-blur-md border border-white/20'
              : 'text-black bg-white border border-border'
          }`}
        >
          View Subscriptions
        </button>
      </div>
    </div>
  );
};
export default WalletUpgradeSuccess;
