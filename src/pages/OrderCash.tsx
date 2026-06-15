import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentOrders } from '@/lib/orders';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { useWebScroll } from '@/hooks/useWebScroll';
const OrderCash = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const [amount, setAmount] = useState<string>(() => {
    const initialAmount = location.state?.amount;
    return initialAmount ? Number(initialAmount).toFixed(2) : '0.00';
  });
  const isDarkMode = useIsDarkMode();

  const { profile } = useUser();
  const userId = profile?.id;
    const monthlyLimit = tierName.toLowerCase() === 'pro' ? 100000 : 25000;

  const recentOrdersQuery = useQuery({
    queryKey: ['recent-orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        return await fetchRecentOrders(userId);
      } catch (e) {
        console.error('recentOrdersQuery unexpected error:', e);
        return [];
      }
    },
    enabled: !!userId,
  });

  const transactionHistory = recentOrdersQuery.data ?? [];

  const { todayCashSum, monthCashSum } = React.useMemo(() => {
    let todaySum = 0;
    let monthSum = 0;
    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const excludedStatuses = ['cancelled', 'failed', 'rejected'];

    transactionHistory.forEach((tx: any) => {
      if (excludedStatuses.includes(tx.status)) return;
      
      const txDate = new Date(tx.created_at);
      const txAmount = Number(tx.amount) || 0;

      if (txDate.toDateString() === todayStr) {
        todaySum += txAmount;
      }
      
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        monthSum += txAmount;
      }
    });

    return { todayCashSum: todaySum, monthCashSum: monthSum };
  }, [transactionHistory]);
  const handleKeyPress = (key: string) => {
    setAmount(prev => {
      if (prev === '0.00') {
        return key === '.' ? '0.' : key;
      }
      if (key === '.' && prev.includes('.')) {
        return prev;
      }
      if (prev.includes('.')) {
        const [whole, decimal] = prev.split('.');
        if (decimal && decimal.length >= 2) {
          return prev;
        }
      }
      return prev + key;
    });
  };
  const handleBackspace = () => {
    setAmount(prev => {
      if (prev.length <= 1) return '0.00';
      if (prev === '0.00') return '0.00';
      return prev.slice(0, -1);
    });
  };
  const handlePillClick = (val: string) => {
    setAmount(val);
  };
  const KeypadButton = ({
    label,
    onClick,
    icon,
  }: {
    label?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`w-[113px] h-[65px] rounded-xl flex items-center justify-center active:bg-brand-primary active:text-white transition-colors group shadow-sm ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}
    >
      {icon ? (
        <div className="group-active:brightness-200">
          {React.cloneElement(icon as React.ReactElement, {
            style: { filter: isDarkMode ? 'brightness(0) saturate(100%) invert(1)' : 'brightness(0)' },
            className: `${(icon as React.ReactElement).props.className} group-active:filter-none`,
          })}
        </div>
      ) : (
        <span className={`font-bold font-sans text-[32px] group-active:text-white ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {label}
        </span>
      )}
    </button>
  );
  const isZero = amount === '0.00';

  const numericAmount = parseFloat(amount) || 0;
  const isDailyLimitExceeded = todayCashSum + numericAmount > dailyLimit;
  const isMonthlyLimitExceeded = monthCashSum + numericAmount > monthlyLimit;

  let errorMessage = '';
  if (numericAmount > 0 && numericAmount < 500) {
    errorMessage = 'Amount needs to be ₹500 or more';
  } else if (numericAmount > 0 && isDailyLimitExceeded) {
    errorMessage = `Daily limit exceeded. You can only order ₹${Math.max(0, dailyLimit - todayCashSum).toLocaleString('en-IN')} more today.`;
  } else if (numericAmount > 0 && isMonthlyLimitExceeded) {
    errorMessage = `Monthly limit exceeded. You can only order ₹${Math.max(0, monthlyLimit - monthCashSum).toLocaleString('en-IN')} more this month.`;
  }

  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col safe-top safe-bottom relative`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      <div className="px-5 pt-4 flex items-center justify-between z-10">
        <BackButton onClick={() => navigate(ROUTES.HOME)} />
        <h1
          className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Order Cash
        </h1>
        <div className="w-10" />
      </div>
      {/* Flexible Balance Area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-4 pb-4 min-h-0 overflow-y-auto no-scrollbar shrink w-full z-10">
        <div
          className={`flex items-center justify-center transition-opacity duration-200 ${isZero ? 'opacity-50' : 'opacity-100'}`}
        >
          <span
            className={`text-[32px] font-bold font-sans mr-1 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            ₹
          </span>
          <span
            className={`text-[32px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            {amount}
          </span>
        </div>
        <div
          className={`w-[238px] h-[1px] my-6 ${isDarkMode ? 'bg-[#373737]' : 'bg-brand-border-light'}`}
        />
        {errorMessage && (
          <p className="text-brand-error text-[12px] font-normal font-sans mb-[17px] mt-[8px]">
            {errorMessage}
          </p>
        )}
        <div className="flex gap-4 mb-2">
          {['500', '1000', '1500'].map(val => (
            <button
              key={val}
              onClick={() => handlePillClick(val)}
              className={`relative h-[30px] flex items-center justify-center px-3 py-[6px] transition-transform active:scale-95 ${!isDarkMode ? 'rounded-full bg-black' : ''}`}
            >
              {isDarkMode && (
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url(${ASSETS.PILL_CONTAINER_BG})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              )}
              <span className={`relative z-10 text-[12px] font-medium font-sans text-white`}>
                +₹{val}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Fixed Bottom Area for Keypad */}
      <div className="shrink-0 w-full flex flex-col justify-end mt-auto z-10">
        <div className="w-full px-5 pb-[12px]">
          <div
            className={`w-full min-h-[61px] relative flex flex-col justify-center px-[18px] py-[10px] ${!isDarkMode ? 'bg-white rounded-[16px] border border-brand-border-light' : ''}`}
            style={
              isDarkMode
                ? {
                    backgroundImage: `url(${ASSETS.ORDER_CASH_INFO_BG})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }
                : {}
            }
          >
            <p
              className={`text-[14px] font-medium font-sans mb-[4px] leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Pay securely via UPI, card, or net banking
            </p>
            <p
              className={`text-[13px] font-light font-sans leading-snug ${isDarkMode ? 'text-white' : 'text-black/60'}`}
            >
              Funds held in escrow — released only when you verify delivery.
            </p>
          </div>
        </div>
        <div
          className={`w-full relative rounded-t-[32px] overflow-hidden shrink-0 ${!isDarkMode ? 'border-t border-brand-border-light' : ''}`}
        >
          {isDarkMode && (
            <div
              className="absolute inset-0 rounded-t-[32px] pointer-events-none"
              style={{
                padding: '0.63px',
                background:
                  'linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
              }}
            />
          )}
          <div
            className="w-full h-full p-[20px] pb-[40px] backdrop-blur-[25px]"
            style={{
              backgroundColor: isDarkMode ? 'rgba(23, 23, 23, 0.31)' : '#F1F5F9',
            }}
          >
            <div className="flex flex-col gap-[10px] items-center relative z-10">
              <div className="flex gap-[10px]">
                <KeypadButton label="1" onClick={() => handleKeyPress('1')} />
                <KeypadButton label="2" onClick={() => handleKeyPress('2')} />
                <KeypadButton label="3" onClick={() => handleKeyPress('3')} />
              </div>
              <div className="flex gap-[10px]">
                <KeypadButton label="4" onClick={() => handleKeyPress('4')} />
                <KeypadButton label="5" onClick={() => handleKeyPress('5')} />
                <KeypadButton label="6" onClick={() => handleKeyPress('6')} />
              </div>
              <div className="flex gap-[10px]">
                <KeypadButton label="7" onClick={() => handleKeyPress('7')} />
                <KeypadButton label="8" onClick={() => handleKeyPress('8')} />
                <KeypadButton label="9" onClick={() => handleKeyPress('9')} />
              </div>
              <div className="flex gap-[10px]">
                <KeypadButton label="." onClick={() => handleKeyPress('.')} />
                <KeypadButton label="0" onClick={() => handleKeyPress('0')} />
                <KeypadButton
                  onClick={handleBackspace}
                  icon={
                    <img
                      src={ASSETS.BACKSPACE}
                      alt="Backspace"
                      className="w-[18px] h-[18px] object-contain"
                    />
                  }
                />
              </div>
              <div className="w-full mt-[32px]">
                <Button
                  onClick={() =>
                    navigate(ROUTES.ORDER_CASH_SUMMARY, {
                      state: {
                        amount,
                        isScheduledFlow: location.state?.isScheduledFlow,
                      },
                    })
                  }
                  disabled={numericAmount < 500 || isDailyLimitExceeded || isMonthlyLimitExceeded}
                  className="w-full h-[48px] bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full text-[16px] font-medium font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {numericAmount < 500 ? 'Min. ₹500' : isDailyLimitExceeded || isMonthlyLimitExceeded ? 'Limit Exceeded' : 'Continue to Pay'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OrderCash;
