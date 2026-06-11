import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Zap, BadgePercent, CalendarClock, BadgeDollarSign, Sparkles } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import proPageBg from '@/assets/pro-page-bg.webp';
import gridpeProSvg from '@/assets/gridpe-pro.svg';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Higher Cash Limits',
    description: 'Order up to ₹25,000/day and ₹1,00,000/month.'
  },
  {
    icon: Zap,
    title: 'Priority Deliveries',
    description: 'Get your orders prioritized during busy hours.'
  },
  {
    icon: BadgePercent,
    title: 'Lower Service Fees',
    description: 'Save more on every cash delivery.'
  },
  {
    icon: CalendarClock,
    title: 'Schedule Deliveries',
    description: 'Choose preferred delivery windows when available.'
  },
  {
    icon: BadgeDollarSign,
    title: 'FX Access',
    description: 'Enjoy better FX rates and reduced exchange charges.'
  },
  {
    icon: Sparkles,
    title: 'Early Access Features',
    description: 'Try new Grid.Pe features before everyone else.'
  }
];

const ProUpgrade = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

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
              className="w-[168px] h-[72px] object-contain"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-[22px] pb-[40px]">

        {/* Subheading */}
        <p className="text-white font-satoshi font-normal text-[16px] mt-[16px] text-center">
          Higher limits. Faster deliveries. More flexibility.
        </p>

        {/* Benefits Container */}
        <div className="mt-[14px] w-full bg-black rounded-[28px] p-[24px]">
          <div className="flex flex-col space-y-[13px]">
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
          onClick={() => {}}
          variant="glass"
          className="w-full h-[48px] shadow-xl transition-all mt-[18px]"
          style={{ '--glass-specular-intensity': '0.2' } as React.CSSProperties}
        >
          <span className="text-white font-satoshi font-semibold text-[16px]">
            Upgrade to Grid.Pe Pro
          </span>
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
