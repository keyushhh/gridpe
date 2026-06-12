import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Zap, BadgePercent, CalendarClock, BadgeDollarSign, Sparkles, Loader2 } from 'lucide-react';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

declare const Cashfree: any;
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

  const handleUpgradeClick = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-pro-subscription', {
        body: { userId, billingCycle }
      });
      
      if (error || !data) {
        console.error('Failed to initiate payment', error);
        setIsLoading(false);
        return;
      }
      
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const payment_session_id = parsedData?.payment_session_id || parsedData?.data?.payment_session_id;
      const order_id = parsedData?.order_id || parsedData?.data?.order_id;
      
      console.log("Initializing Cashfree with Session ID:", payment_session_id);

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
        
        cashfree.checkout(checkoutOptions).then(async (result: any) => {
          if (result.error) {
            console.error('Payment failed or cancelled.');
            setIsLoading(false);
          } else {
            await verifyPayment(order_id);
          }
        });
      }
    } catch (err: any) {
      console.error(err);
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
         console.error('Payment verification failed.', error);
      } else if (data?.success) {
         await fetchProfileData?.();
         navigate(ROUTES.PRO_SUCCESS, { 
           state: { 
             billingCycle: data.billing_cycle, 
             expiresAt: data.expires_at 
           } 
         });
      } else {
         console.error('Payment not completed.', data?.error);
      }
    } catch (err) {
      console.error('Verification error', err);
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
      <div className="pt-safe-top">
        <div className="h-[72px] flex items-center px-[22px] relative mt-[8px]">
          <div className="absolute left-[22px] z-10">
            <BackButton onClick={() => navigate(-1)} />
          </div>
          <div className="w-full flex justify-center">
            <img 
              src={gridpeProSvg} 
              alt="Grid.Pe Pro" 
              className="w-[114px] h-[50px] object-contain"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-[22px] pb-[40px]">

        {/* Subheading */}
        <p className="text-white font-satoshi font-normal text-[16px] mt-[40px] text-center">
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
        <div className="w-full mt-[4px] flex gap-3">
          {/* Monthly Card */}
          <div 
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 rounded-[16px] p-[16px] cursor-pointer transition-all border ${
              billingCycle === 'monthly' 
                ? 'border-[#CA8429] bg-[#CA8429]/[0.02]' 
                : 'border-white/5 bg-[#0B0B0B]'
            }`}
          >
            <div className={`font-satoshi font-bold text-[16px] leading-none mb-[12px] ${billingCycle === 'monthly' ? 'text-white' : 'text-white/50'}`}>
              Monthly
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
                ? 'border-[#CA8429] bg-[#CA8429]/[0.02]' 
                : 'border-white/5 bg-[#0B0B0B]'
            }`}
          >
            <div className="flex items-center justify-between mb-[12px]">
              <div className={`font-satoshi font-bold text-[16px] leading-none ${billingCycle === 'annual' ? 'text-white' : 'text-white/50'}`}>
                Annual
              </div>
              <div className="bg-[#0D3B1D] text-[#4ADE80] font-satoshi font-bold text-[10px] px-2 py-1 rounded-full leading-none">
                SAVE 16%
              </div>
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
          variant="glass"
          className="w-full h-[48px] shadow-xl transition-all mt-[18px]"
          style={{ '--glass-specular-intensity': '0.2' } as React.CSSProperties}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <span className="text-white font-satoshi font-semibold text-[16px]">
              Upgrade to Grid.Pe Pro
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
