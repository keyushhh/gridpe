import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Zap, BadgePercent, CalendarClock, BadgeDollarSign, Sparkles, Loader2 } from 'lucide-react';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { crashlytics } from '@/lib/crashlytics';
import { useCustomToaster } from '@/contexts/CustomToasterContext';

declare const Cashfree: (config: { mode: string }) => {
  checkout: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
};
import proPageBg from '@/assets/pro-page-bg.webp';
import gridpeProSvg from '@/assets/gridpe-pro.svg';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Higher Cash Limits',
    description: '₹25,000/day • ₹1,00,000/month'
  },
  {
    icon: Zap,
    title: 'Priority Deliveries',
    description: 'Prioritized during peak hours'
  },
  {
    icon: BadgePercent,
    title: 'Lower Service Fees',
    description: 'Save on every cash order'
  },
  {
    icon: CalendarClock,
    title: 'Schedule Deliveries',
    description: 'Choose preferred delivery windows'
  },
  {
    icon: BadgeDollarSign,
    title: 'FX Access',
    description: 'Better rates, lower fees'
  },
  {
    icon: Sparkles,
    title: 'Early Access Features',
    description: 'Try new Grid.Pe features first'
  }
];

const ProUpgrade = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { profile, fetchProfileData } = useUser();
  const userId = profile?.id;
  const { showToaster } = useCustomToaster();

  const [activeSubscription, setActiveSubscription] = useState<{
    billing_cycle: 'monthly' | 'annual';
    expires_at: string;
    started_at?: string;
  } | null>(null);

  const effectiveSubscription = activeSubscription || (profile?.plan_tier?.toLowerCase() === 'pro' ? {
    billing_cycle: 'monthly' as const,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    started_at: new Date().toISOString()
  } : null);

  const isPro = profile?.plan_tier?.toLowerCase() === 'pro';
  const isCurrentActivePlan = isPro && billingCycle === effectiveSubscription?.billing_cycle;

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userId || profile?.plan_tier?.toLowerCase() !== 'pro') {
        setActiveSubscription(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('billing_cycle, expires_at, started_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (data) {
          setActiveSubscription(data as any);
          if (data.billing_cycle === 'monthly') {
            setBillingCycle('annual');
          } else {
            setBillingCycle('monthly');
          }
        } else {
          setBillingCycle('annual');
        }
      } catch (err) {
        console.error('Error fetching user subscription:', err);
        setBillingCycle('annual');
      }
    };
    fetchSubscription();
  }, [userId, profile?.plan_tier]);

  const handleDowngrade = async () => {
    if (!userId) return;
    
    const confirmCancel = window.confirm('Are you sure you want to cancel your Pro subscription and downgrade to Basic immediately?');
    if (!confirmCancel) return;

    setIsLoading(true);
    try {
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (subError) throw subError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          plan_tier: 'free' 
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      await fetchProfileData?.();
      showToaster('Successfully downgraded to Basic plan.', 'success');
    } catch (err: any) {
      crashlytics.recordError(
        err instanceof Error ? err : new Error('handleDowngrade failed'),
        'ProUpgrade.handleDowngrade'
      );
      if (import.meta.env.DEV) { console.error('Downgrade error:', err); }
      showToaster('Failed to downgrade. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = async () => {
    if (!userId) return;
    
    if (profile?.plan_tier?.toLowerCase() === 'pro' && billingCycle === effectiveSubscription?.billing_cycle) {
      showToaster('To manage or cancel your subscription, please contact support at support@gridpe.in.', 'info');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-pro-subscription', {
        body: { userId, billingCycle }
      });
      
      if (error || !data) {
        crashlytics.recordError(
          error instanceof Error ? error : new Error('Failed to initiate pro subscription'),
          'ProUpgrade.createSubscription'
        );
        if (import.meta.env.DEV) { console.error('Failed to initiate payment', error); }
        showToaster('Failed to start payment. Please try again.', 'error');
        setIsLoading(false);
        return;
      }
      
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const payment_session_id = parsedData?.payment_session_id || parsedData?.data?.payment_session_id;
      const order_id = parsedData?.order_id || parsedData?.data?.order_id;
      
      if (import.meta.env.DEV) { console.log("Initializing Cashfree with Session ID:", payment_session_id); }

      const isNative = Capacitor.isNativePlatform();
      
      const cashfreeEnv = import.meta.env.VITE_CASHFREE_ENV === 'sandbox' ? 'sandbox' : 'production';
      const cashfree = typeof Cashfree !== 'undefined' ? Cashfree({ mode: cashfreeEnv }) : null;
      
      if (isNative) {
        const checkoutBaseUrl = cashfreeEnv === 'sandbox'
          ? 'https://payments-test.cashfree.com/order'
          : 'https://payments.cashfree.com/order';
        const checkoutUrl = `${checkoutBaseUrl}/#${payment_session_id}`;
        
        const browserFinishListener = await Browser.addListener(
          'browserFinished',
          async () => {
            browserFinishListener.remove();
            await verifyPayment(order_id);
          }
        );
        
        await Browser.open({ url: checkoutUrl, windowName: '_blank' });
        setIsLoading(false);
      } else {
        if (!cashfree) {
          throw new Error('Cashfree SDK not loaded');
        }
        
        const checkoutOptions = {
          paymentSessionId: payment_session_id,
          redirectTarget: '_modal',
        };
        
        cashfree.checkout(checkoutOptions).then(async (result: Record<string, unknown>) => {
          if (result.error) {
            if (import.meta.env.DEV) { console.error('Payment failed or cancelled.'); }
            showToaster('Payment was not completed. Please try again.', 'error');
            setIsLoading(false);
          } else {
            await verifyPayment(order_id);
          }
        });
      }
    } catch (err: unknown) {
      crashlytics.recordError(
        err instanceof Error ? err : new Error('handleUpgradeClick failed'),
        'ProUpgrade.handleUpgradeClick'
      );
      if (import.meta.env.DEV) { console.error(err); }
      showToaster('Something went wrong. Please try again.', 'error');
      setIsLoading(false);
    }
  };

  const verifyPayment = async (order_id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-pro-subscription', {
        body: { order_id }
      });
      if (error) {
         crashlytics.recordError(
           error instanceof Error ? error : new Error('Pro subscription verification failed'),
           'ProUpgrade.verifyPayment'
         );
         if (import.meta.env.DEV) { console.error('Payment verification failed.', error); }
         showToaster('Payment verification failed. Please contact support.', 'error');
      } else if (data?.success) {
         await fetchProfileData?.();
         navigate(ROUTES.PRO_SUCCESS, { 
           state: { 
             billingCycle: data.billing_cycle, 
             expiresAt: data.expires_at 
           } 
         });
      } else {
         if (import.meta.env.DEV) { console.error('Payment not completed.', data?.error); }
         showToaster('Payment not completed. Please try again.', 'error');
      }
    } catch (err) {
      crashlytics.recordError(
        err instanceof Error ? err : new Error('verifyPayment outer catch'),
        'ProUpgrade.verifyPayment.catch'
      );
      if (import.meta.env.DEV) { console.error('Verification error', err); }
      showToaster('Verification error. Please contact support if payment was deducted.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative overflow-y-auto"
      style={{
        backgroundImage: `url(${proPageBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#000',
      }}
    >
      {/* Header */}
      <div className="safe-top">
        <div className="h-[72px] flex items-center px-[22px] relative mt-[8px]">
          <div className="absolute left-[22px] z-10">
            <BackButton onClick={() => navigate(-1)} />
          </div>
          <div className="w-full flex justify-center">
            <img loading="lazy" 
              src={gridpeProSvg} 
              alt="Grid.Pe Pro" 
              className="w-[114px] h-[50px] object-contain"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-[22px] pb-[40px]">

        {/* Active Subscription Info for Pro Users (Top Banner) */}
        {profile?.plan_tier?.toLowerCase() === 'pro' && effectiveSubscription && (
          <div className="w-full bg-[#CA8429]/[0.08] border border-[#CA8429]/20 rounded-[20px] p-[16px] mt-[16px] flex flex-col items-center animate-in slide-in-from-top-4 duration-300">
            <p className="text-brand-pro-gold font-satoshi font-semibold text-[14px] flex items-center gap-1">
              👑 Grid.Pe Pro Member
            </p>
            <p className="text-white/70 font-satoshi text-[13px] mt-[4px] text-center">
              Active since {new Date(effectiveSubscription.started_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-white/50 font-satoshi text-[12px] mt-[2px] text-center">
              Next billing date: {new Date(effectiveSubscription.expires_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}

        {/* Subheading */}
        <p className={`text-white font-satoshi font-normal text-[16px] text-center ${profile?.plan_tier?.toLowerCase() === 'pro' && effectiveSubscription ? 'mt-[24px]' : 'mt-[40px]'}`}>
          Higher limits. Faster deliveries. More flexibility.
        </p>

        {/* Benefits Container */}
        <div className="mt-[18px] w-full bg-black rounded-[28px] p-[24px]">
          <div className="flex flex-col space-y-[16px]">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="flex items-start gap-[12px]">
                  <div className="w-[32px] h-[32px] rounded-[6px] bg-[#6D4E25] flex items-center justify-center shrink-0">
                    <Icon size={18} strokeWidth={1.5} color="white" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <h3 className="text-white font-satoshi font-normal text-[16px] leading-tight mb-[2px]">
                      {benefit.title}
                    </h3>
                    <p className="text-white/50 font-satoshi font-normal text-[14px] leading-snug">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="w-full mt-[12px] flex gap-3">
          {/* Monthly Card */}
          <div 
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 rounded-[16px] p-[16px] cursor-pointer transition-all border ${
              billingCycle === 'monthly' 
                ? 'border-brand-pro-gold bg-[#CA8429]/[0.02]' 
                : 'border-white/5 bg-brand-surface-mid'
            }`}
          >
            <div className="flex items-center justify-between mb-[12px]">
              <div className={`font-satoshi font-bold text-[16px] leading-none ${billingCycle === 'monthly' ? 'text-white' : 'text-white/50'}`}>
                Monthly
              </div>
              {effectiveSubscription?.billing_cycle === 'monthly' && (
                <div className="bg-[#0D3B1D] text-[#4ADE80] font-satoshi font-bold text-[10px] px-2 py-1 rounded-full leading-none">
                  ACTIVE
                </div>
              )}
            </div>
            <div className="flex items-baseline">
              <span className={`font-satoshi font-bold text-[24px] ${billingCycle === 'monthly' ? 'text-white' : 'text-white/50'}`}>₹99</span>
              <span className="font-satoshi font-normal text-[14px] text-white/50 ml-1">/ month</span>
            </div>
          </div>

          {/* Annual Card */}
          <div 
            onClick={() => setBillingCycle('annual')}
            className={`flex-1 rounded-[16px] p-[16px] cursor-pointer transition-all border ${
              billingCycle === 'annual' 
                ? 'border-brand-pro-gold bg-[#CA8429]/[0.02]' 
                : 'border-white/5 bg-brand-surface-mid'
            }`}
          >
            <div className="flex items-center justify-between mb-[12px]">
              <div className={`font-satoshi font-bold text-[16px] leading-none ${billingCycle === 'annual' ? 'text-white' : 'text-white/50'}`}>
                Annual
              </div>
              {effectiveSubscription?.billing_cycle === 'annual' ? (
                <div className="bg-[#0D3B1D] text-[#4ADE80] font-satoshi font-bold text-[10px] px-2 py-1 rounded-full leading-none">
                  ACTIVE
                </div>
              ) : (
                <div className="bg-[#0D3B1D] text-[#4ADE80] font-satoshi font-bold text-[10px] px-2 py-1 rounded-full leading-none">
                  SAVE 16%
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className={`font-satoshi font-bold text-[20px] ${billingCycle === 'annual' ? 'text-white' : 'text-white/50'}`}>₹990</span>
                <span className="font-satoshi font-normal text-[13px] text-white/50 ml-1">/ year</span>
              </div>
              <div className="font-satoshi font-normal text-[13px] text-white/50 mt-[2px]">
                ₹83 / month
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleUpgradeClick}
          disabled={isLoading}
          variant={isCurrentActivePlan ? "glass" : "default"}
          className={`w-full h-[48px] shadow-xl transition-all mt-[18px] ${
            isCurrentActivePlan 
              ? '' 
              : 'bg-[#5260FE] hover:bg-[#5260FE]/90 text-white border-none'
          }`}
          style={isCurrentActivePlan ? ({ '--glass-specular-intensity': '0.2' } as React.CSSProperties) : {}}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <span className="text-white font-satoshi font-medium text-[16px]">
              {profile?.plan_tier?.toLowerCase() === 'pro'
                ? billingCycle === effectiveSubscription?.billing_cycle
                  ? 'Manage Plan'
                  : `Switch to ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)} Plan`
                : 'Upgrade to Grid.Pe Pro'}
            </span>
          )}
        </Button>

        {/* Disclaimer */}
        <p className="text-white/60 font-satoshi italic text-[12px] text-center mt-[16px] max-w-[280px] leading-relaxed">
          Grid.Pe Pro renews automatically. Manage or cancel your subscription anytime.
        </p>
      </div>
    </div>
  );
};

export default ProUpgrade;
