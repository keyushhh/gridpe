import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { useUser } from '@/contexts/UserContext';
import { useWalletStore } from '@/store/useWalletStore';
import { supabase } from '@/lib/supabase';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/utils/format';
import { useKeypad } from '@/hooks/useKeypad';
import Keypad from '@/components/Keypad';
const tierWithdrawMap = {
  Starter: ASSETS.STARTER_WITHDRAW,
  Pro: ASSETS.PRO_WITHDRAW,
  Elite: ASSETS.ELITE_WITHDRAW,
  Supreme: ASSETS.SUPREME_WITHDRAW,
};
const tierWithdrawMapLight = {
  Starter: ASSETS.STARTER_WITHDRAW_LIGHT,
  Pro: ASSETS.PRO_WITHDRAW_LIGHT,
  Elite: ASSETS.ELITE_WITHDRAW_LIGHT,
  Supreme: ASSETS.SUPREME_WITHDRAW_LIGHT,
};
interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}
const WalletWithdraw = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const walletTier = useWalletStore((state) => state.walletTier);
  const walletBalance = useWalletStore((state) => state.walletBalance);
  const isRenewalPending = useWalletStore((state) => state.isRenewalPending);
  const userId = profile?.id;
  const isDarkMode = useIsDarkMode();
  const { amount, handleKeyPress, handleBackspace, setPillAmount, amountVal, isZero, setAmount } =
    useKeypad();
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [withdrawFull, setWithdrawFull] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setWithdrawals] = useState<Withdrawal[]>([]);
  const withdrawalLimits: Record<string, number> = {
    Starter: 3000,
    Pro: 10000,
    Elite: 50000,
    Supreme: walletBalance,
  };
  const currentLimit = withdrawalLimits[walletTier] || 3000;
  const fetchData = async () => {
    const { data: wData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (wData) {
      setWithdrawals(wData);
    }
  };
  useEffect(() => {
    if (!userId) return;
    fetchData();
    const channel = supabase
      .channel('wallet-withdraw-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` },
        fetchData
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${userId}`,
        },
        fetchData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${userId}` },
        fetchData
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onKeyPress = (key: string) => {
    handleKeyPress(key);
    if (withdrawFull) setWithdrawFull(false);
    setError(null);
  };
  const onBackspace = () => {
    handleBackspace();
    if (withdrawFull) setWithdrawFull(false);
    setError(null);
  };
  const handleAmountSelect = (val: string) => {
    setPillAmount(val);
    if (withdrawFull) setWithdrawFull(false);
    setError(null);
  };
  const canWithdraw =
    amountVal > 0 &&
    amountVal <= Math.min(walletBalance, currentLimit) &&
    walletBalance > 0 &&
    !loading &&
    !isRenewalPending;
  const handleWithdraw = () => {
    if (!canWithdraw) return;
    navigate(ROUTES.SELECT_PAYMENT_METHOD, { state: { amount: amountVal } });
  };
  const isWalletLocked = walletBalance > 0 && amountVal > walletBalance;
  return (
    <div
      className={`h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-top ${isDarkMode ? 'bg-background' : 'bg-background'}`}
      style={
        isDarkMode
          ? {
              backgroundColor: 'hsl(var(--background))',
              backgroundImage: `url(${ASSETS.BG_DARK_MODE})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
            }
          : {}
      }
    >
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{ backgroundColor: 'hsl(var(--primary))', filter: 'blur(60px)', opacity: 0.8 }}
        />
      )}
      <div className="px-5 pt-4 flex items-center justify-between z-10 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium font-sans`}
        >
          Withdraw
        </h1>
        <div className="w-10" />
      </div>
      <div
        className="flex-1 flex flex-col overflow-y-auto no-scrollbar"
        onClick={() => setShowKeypad(false)}
      >
        <div className="px-5 mb-8 mt-[39px] z-10 shrink-0">
          <div
            className={`w-full min-h-[120px] rounded-[18px] flex flex-col justify-start pt-4 px-6 relative overflow-hidden ${isDarkMode ? '' : 'border border-border'}`}
            style={{
              backgroundImage: `url(${isDarkMode ? tierWithdrawMap[walletTier as keyof typeof tierWithdrawMap] : tierWithdrawMapLight[walletTier as keyof typeof tierWithdrawMap]})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-sans`}
            >
              WALLET BALANCE
            </span>
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[34px] font-bold font-sans mt-[10px]`}
            >
              {formatINR(walletBalance)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center pt-[32px] z-10 shrink-0">
          <div
            onClick={e => {
              e.stopPropagation();
              setShowKeypad(true);
            }}
            className={`flex items-center justify-center transition-opacity duration-200 cursor-pointer ${isZero ? 'opacity-50' : 'opacity-100'}`}
          >
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[32px] font-normal font-sans mr-1`}
            >
              ₹
            </span>
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[32px] font-bold font-sans`}
            >
              {amount}
            </span>
          </div>
          <div
            className={`w-[238px] h-[1px] mt-[4.5px] ${isDarkMode ? 'bg-border' : 'bg-border'}`}
          />
          <p
            className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[12px] font-sans font-normal mt-[8px]`}
          >
            Total Available Balance {formatINR(walletBalance)}
          </p>
          {error && (
            <p
              className={`text-destructive text-[12px] font-medium font-sans mt-[8px] max-w-[80%] text-center`}
            >
              {error}
            </p>
          )}
          {isRenewalPending && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mx-5">
              <p className="text-red-500 text-[13px] text-center font-medium">
                Withdrawals are locked. Please complete your subscription renewal to continue.
              </p>
            </div>
          )}
          <div className="flex gap-4 mt-[17px]">
            {['500', '1000', '5000'].map(val => (
              <button
                key={val}
                onClick={e => {
                  e.stopPropagation();
                  handleAmountSelect(val);
                }}
                className="relative h-[30px] flex items-center justify-center px-3 py-[6px] transition-transform active:scale-95 disabled:opacity-50"
                disabled={parseFloat(val) > walletBalance || parseFloat(val) > currentLimit}
              >
                <div
                  className="absolute inset-0 w-full h-full"
                  style={
                    isDarkMode
                      ? {
                          backgroundImage: `url(${ASSETS.PILL_CONTAINER_BG})`,
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat',
                        }
                      : { backgroundColor: '#000000', borderRadius: '15px' }
                  }
                />
                <span className={`relative z-10 text-white text-[12px] font-medium font-sans`}>
                  ₹{val}
                </span>
              </button>
            ))}
          </div>
          {!showKeypad && (
            <>
              <div className="w-full flex flex-col items-center mt-[23px]">
                <div
                  className={`flex items-center gap-2 ${walletTier === 'Supreme' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => {
                    if (walletTier === 'Supreme') {
                      const newVal = !withdrawFull;
                      setWithdrawFull(newVal);
                      if (newVal) setAmount(walletBalance.toFixed(2));
                      setError(null);
                    }
                  }}
                >
                  <img
                    src={withdrawFull ? ASSETS.CHECK_BOX_SELECTED : ASSETS.EMPTY_CHECKBOX}
                    alt=""
                    className="w-5 h-5"
                    style={
                      !withdrawFull && !isDarkMode
                        ? { filter: 'invert(1)' }
                        : walletTier !== 'Supreme'
                          ? {
                              filter:
                                'brightness(0) saturate(100%) invert(48%) sepia(0%) saturate(6%) hue-rotate(188deg) brightness(97%) contrast(89%)',
                            }
                          : {}
                    }
                  />
                  <span
                    className={`${walletTier === 'Supreme' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-muted-foreground'} text-[14px] font-medium font-sans`}
                  >
                    Withdraw full wallet balance
                  </span>
                </div>
              </div>
              {walletTier !== 'Supreme' && (
                <p
                  className={`${isDarkMode ? 'text-white' : 'text-black'} text-[12px] font-normal font-sans mt-[11px] leading-snug text-center w-[360px]`}
                >
                  Your current wallet plan does not allow you to withdraw your full wallet balance.
                </p>
              )}
              <div
                className={`relative mt-[24px] mx-auto w-[362px] rounded-[13px] overflow-hidden ${isDarkMode ? '' : 'border border-border'}`}
              >
                {isDarkMode && (
                  <div
                    className="absolute inset-0 rounded-[13px] pointer-events-none"
                    style={{
                      padding: '0.63px',
                      background:
                        'linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
                      WebkitMask:
                        'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                    }}
                  />
                )}
                <div
                  className={`w-full h-full px-[12px] py-[8px] flex flex-col ${isDarkMode ? 'backdrop-blur-[25.02px]' : ''}`}
                  style={{ backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : 'transparent' }}
                >
                  <h3
                    className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`}
                  >
                    Please note:
                  </h3>
                  <div className="flex flex-col gap-[10px] mt-[14px]">
                    {[
                      'Withdrawals take up to 30 minutes to reflect in your account.',
                      'The amount will be sent to your linked payment method only.',
                      'You can’t add money again for the next 24 hours after a withdrawal.',
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-[10px]">
                        <span
                          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] leading-tight mt-1`}
                        >
                          •
                        </span>
                        <p
                          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-normal font-sans leading-snug text-left`}
                        >
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div
        className={`w-full relative rounded-t-[32px] overflow-hidden shrink-0 ${isDarkMode ? '' : 'bg-muted border-t border-border'}`}
        onClick={e => e.stopPropagation()}
      >
        {isDarkMode && (
          <div
            className="absolute inset-0 rounded-t-[32px] pointer-events-none"
            style={{
              padding: '0.63px',
              background:
                'linear-gradient(to bottom right, rgba(255,255,255,0.12), rgba(0,0,0,0.20))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
            }}
          />
        )}
        <div
          className="w-full h-full p-[20px] safe-bottom pb-4 backdrop-blur-[25px]"
          style={{ backgroundColor: isDarkMode ? 'rgba(23, 23, 23, 0.31)' : '#F1F5F9' }}
        >
          <div className="flex flex-col gap-[10px] items-center relative z-10">
            {showKeypad && (
              <Keypad onKeyPress={onKeyPress} onBackspace={onBackspace} isDarkMode={isDarkMode} />
            )}
            <div className={`w-full flex flex-col gap-[10px] ${showKeypad ? 'mt-[32px]' : 'mt-0'}`}>
              <Button
                onClick={handleWithdraw}
                disabled={!canWithdraw}
                className={`w-full h-[48px] text-white rounded-full text-[16px] font-medium font-sans ${
                  canWithdraw
                    ? 'bg-primary hover:bg-primary/90'
                    : isDarkMode
                      ? 'bg-primary/50 cursor-not-allowed'
                      : 'bg-primary/30 cursor-not-allowed'
                }`}
              >
                {loading
                  ? 'Processing...'
                  : isWalletLocked
                    ? 'Insufficient Balance'
                    : isZero
                      ? 'Enter Amount'
                      : 'Proceed'}
              </Button>
              <button
                onClick={() => navigate(-1)}
                className={`w-full h-[48px] rounded-full ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium active:scale-95 transition-transform flex items-center justify-center ${isDarkMode ? '' : 'bg-muted border border-border'}`}
                style={
                  isDarkMode
                    ? {
                        backgroundImage: `url(${ASSETS.CANCEL_CTA})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }
                    : {}
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WalletWithdraw;
