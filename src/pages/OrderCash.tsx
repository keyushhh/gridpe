import { ASSETS } from '@/constants/assets';
import { crashlytics } from '@/lib/crashlytics';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useUser } from '@/contexts/UserContext';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentOrders } from '@/lib/orders';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import BackButton from '@/components/ui/BackButton';
import { GpButton } from '@gridpe-app/ui';
import { useWebScroll } from '@/hooks/useWebScroll';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { supabase } from '@/lib/supabase';
import { Mic, Loader2 } from 'lucide-react';
import { VoiceConfirmationSheet } from '@/components/VoiceConfirmationSheet';

interface VoiceConfirmationState {
  isOpen: boolean;
  amount: number;
  transcript: string;
}

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
  const { showToaster } = useCustomToaster();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceConfirmation, setVoiceConfirmation] = useState<VoiceConfirmationState | null>(null);

  const { isRecording, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();

  const tierName = profile?.plan_tier ?? 'free';
  const dailyLimit = tierName.toLowerCase() === 'pro' ? 10000 : 5000;
  const monthlyLimit = tierName.toLowerCase() === 'pro' ? 100000 : 25000;
  const userId = profile?.id;

  const handleMicClick = async () => {
    if (isTranscribing) return;

    if (isRecording) {
      setIsTranscribing(true);
      try {
        const blob = await stopRecording();
        if (!blob) {
          setIsTranscribing(false);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            const { data, error } = await supabase.functions.invoke('voice-cash-order', {
              body: {
                audio: base64Audio,
                preferred_language: profile?.preferred_language || 'en',
                mime_type: blob.type || 'audio/webm',
              },
            });

            if (error) {
              throw error;
            }

            if (data?.extractedAmount && typeof data.extractedAmount === 'number') {
              setVoiceConfirmation({
                isOpen: true,
                amount: data.extractedAmount,
                transcript: data.transcript || '',
              });
            } else if (data?.transcript) {
              showToaster(`Heard "${data.transcript}", but couldn't detect amount. Please adjust manually.`, 'error');
            } else {
              showToaster('Could not detect amount from voice. Please try again.', 'error');
            }
          } catch (err) {
            crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'OrderCash.voiceOrder');
            showToaster('Voice recognition failed. Please try again.', 'error');
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        setIsTranscribing(false);
        crashlytics.recordError(err instanceof Error ? err : new Error(String(err)), 'OrderCash.stopRecording');
        showToaster('Recording stopped unexpectedly.', 'error');
      }
    } else {
      const started = await startRecording();
      if (!started) {
        showToaster(recorderError || 'Microphone access denied or unavailable.', 'error');
      }
    }
  };

  const recentOrdersQuery = useQuery({
    queryKey: ['recent-orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        return await fetchRecentOrders(userId);
      } catch (e) {
        if (import.meta.env.DEV) console.error('recentOrdersQuery unexpected error:', e);
        crashlytics.recordError(e instanceof Error ? e : new Error('OrderCash recentOrdersQuery failed'), 'OrderCash.recentOrdersQuery');
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
      className={`min-h-[100dvh] max-h-[100dvh] w-full ${containerOverflow} flex flex-col safe-top safe-bottom relative`}
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
          className={`w-[238px] h-[1px] my-6 ${isDarkMode ? 'bg-brand-border-mid' : 'bg-brand-border-light'}`}
        />
        {errorMessage && (
          <p className="text-brand-error text-[12px] font-normal font-sans mb-[17px] mt-[8px]">
            {errorMessage}
          </p>
        )}
        {/* Voice Request Mic Button (Directly below amount, ABOVE quick pills) */}
        <div className="mb-4 flex items-center justify-center">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isTranscribing}
            className={`h-[38px] px-4 rounded-full flex items-center gap-2 relative overflow-hidden transition-all duration-300 active:scale-95 group ${
              isRecording
                ? 'bg-gradient-to-b from-red-500 via-rose-600 to-red-700 text-white border border-red-300/60 shadow-[0_0_16px_rgba(239,68,68,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] animate-pulse'
                : isTranscribing
                  ? 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 text-slate-800 border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.6)] cursor-wait'
                  : 'bg-gradient-to-b from-white via-slate-100 to-slate-300 hover:from-white hover:to-slate-200 text-slate-900 border border-white/80 shadow-[0_3px_12px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(0,0,0,0.2)]'
            }`}
          >
            {/* Brushed metal reflection sheen overlay */}
            {!isRecording && (
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/70 to-transparent pointer-events-none rounded-t-full" />
            )}
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-800 relative z-10" />
                <span className="text-[13px] font-medium font-sans text-slate-800 relative z-10">Processing voice...</span>
              </>
            ) : isRecording ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <Mic className="w-4 h-4 text-white relative z-10" />
                <span className="text-[13px] font-medium font-sans text-white relative z-10">Listening... Tap when done</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-slate-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] relative z-10" />
                <span className="text-[13px] font-semibold font-sans text-slate-900 tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] relative z-10">
                  Speak Amount
                </span>
              </>
            )}
          </button>
        </div>

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
              You're charged now — refunded automatically if delivery isn't completed.
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
                    <img loading="lazy"
                      src={ASSETS.BACKSPACE}
                      alt="Backspace"
                      className="w-[18px] h-[18px] object-contain"
                    />
                  }
                />
              </div>
              <div className="w-full mt-[32px]">
                <GpButton
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
                </GpButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Confirmation Sheet */}
      <VoiceConfirmationSheet
        isOpen={Boolean(voiceConfirmation?.isOpen)}
        amount={voiceConfirmation?.amount || 0}
        transcript={voiceConfirmation?.transcript || ''}
        preferredLanguage={profile?.preferred_language || 'en'}
        isDarkMode={isDarkMode}
        onConfirm={(confirmedAmount) => {
          setAmount(confirmedAmount.toFixed(2));
          setVoiceConfirmation(null);
        }}
        onEditManually={() => {
          setVoiceConfirmation(null);
        }}
        onClose={() => {
          setVoiceConfirmation(null);
        }}
      />
    </div>
  );
};
export default OrderCash;
