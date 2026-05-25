import { ASSETS } from '@/constants/assets';
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { Loader2 } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { formatINR } from '@/utils/format';
import { useKeypad } from '@/hooks/useKeypad';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import Keypad from '@/components/Keypad';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { useWebScroll } from '@/hooks/useWebScroll';
const WalletAddMoney = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const { showToaster } = useCustomToaster();
  const isDarkMode = useIsDarkMode();
  const location = useLocation() as { state: { balance?: string; from?: string } };
  const {
    walletLimit,
    walletBalance,
    walletTier,
    refreshBalance,
    fetchProfileData,
    refreshTransactions,
    isRenewalPending,
    profile,
  } = useUser();
  const userId = profile?.id;
  const currentBalance = walletBalance || 0;
  const fromWallet = location.state?.from === 'wallet';
  const [isLoading, setIsLoading] = useState(false);
  const isInternationalUser = (profile?.country !== 'India' && profile?.country !== 'IN') || (profile?.kyc_document_type === 'passport');
  const { amount, handleKeyPress, handleBackspace, setPillAmount, amountVal, isZero } = useKeypad();
  const isExceedingLimit =
    amountVal + currentBalance > walletLimit || currentBalance + 500 > walletLimit;
  const handleAmountSelect = (val: string) => {
    if (isExceedingLimit) return;
    setPillAmount(val);
  };
  const getNextTier = (currentTier: string) => {
    const tiers = ['Starter', 'Pro', 'Elite', 'Supreme'];
    const index = tiers.indexOf(currentTier);
    if (index >= 0 && index < tiers.length - 1) {
      return tiers[index + 1];
    }
    return null;
  };
  const nextTier = getNextTier(walletTier);
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col safe-top safe-bottom bg-background`}
      style={{
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between z-10">
        <BackButton onClick={() => (fromWallet ? navigate(-1) : navigate(ROUTES.HOME))} />
        <h1
          className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Wallet
        </h1>
        <div className="w-10" />
      </div>
      {/* Flexible Balance Area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-4 pb-4 min-h-0 overflow-y-auto no-scrollbar shrink">
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
        <div className="w-[238px] h-[1px] bg-muted mt-[4.5px]" />
        <p
          className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[12px] font-sans font-normal mt-[8px] mb-[17px] text-center px-4`}
        >
          Available Balance: {formatINR(currentBalance)} • Wallet Capacity:{' '}
          {formatINR(walletLimit, { showSymbol: true, maximumFractionDigits: 0 })}
        </p>
        {amountVal > 0 && Math.floor(amountVal) < 500 && (
          <p className="text-destructive text-[12px] font-normal font-sans mb-[17px] -mt-[12px]">
            Amount needs to be ₹500 or more
          </p>
        )}
        <div className="flex gap-4 mb-2">
          {['500', '1000', '1500'].map(val => (
            <button
              key={val}
              onClick={() => handleAmountSelect(val)}
              className="relative h-[30px] flex items-center justify-center px-3 py-[6px] transition-transform active:scale-95"
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
              {!isDarkMode && (
                <div className="absolute inset-0 w-full h-full bg-black rounded-full" />
              )}
              <span
                className={`relative z-10 text-[12px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-white'}`}
              >
                +₹{val}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Fixed Bottom Area for Keypad */}
      <div className="shrink-0 w-full flex flex-col justify-end mt-auto">
        <div className="w-full px-5 pb-[12px]">
          <div
            className="w-full min-h-[72px] rounded-[13px] flex flex-col justify-center border border-border"
            style={{
              padding: '9px 19px',
              backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : 'hsl(var(--background))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isDarkMode ? 'inset 0 0 0 0.63px rgba(255, 255, 255, 0.12)' : 'none',
            }}
          >
            <p
              className={`text-[14px] font-medium font-sans mb-[4px] leading-none ${isExceedingLimit ? 'text-destructive' : isDarkMode ? 'text-white' : 'text-black'}`}
            >
              Note:
            </p>
            <p
              className={`text-[13px] font-normal font-sans leading-snug ${isExceedingLimit ? 'text-destructive' : isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {isExceedingLimit
                ? `This would exceed your ₹${walletLimit.toLocaleString('en-IN')} wallet limit`
                : 'Minimum top-up is ₹500. UPI payments are always free.'}
            </p>
          </div>
          {isRenewalPending && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-[13px] text-center font-medium">
                Wallet features are locked. Please complete your subscription renewal to continue.
              </p>
            </div>
          )}
        </div>
        <div
          className={`w-full relative rounded-t-[32px] overflow-hidden shrink-0 ${!isDarkMode ? 'border-t border-border' : ''}`}
        >
          {isDarkMode && (
            <div
              className="absolute inset-0 rounded-t-[32px] pointer-events-none"
              style={{
                padding: '0.63px', // Border width
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
            <Keypad
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              isDarkMode={isDarkMode}
            />
            <div className="flex flex-col gap-[10px] items-center relative z-10">
              <div className="w-full mt-[32px]">
                <Button
                  onClick={async () => {
                    if (isExceedingLimit && nextTier) {
                      navigate(ROUTES.SUBSCRIPTIONS);
                      return;
                    }
                    const val = amountVal;
                    if (Math.floor(val) >= 500) {
                      if (isInternationalUser) {
                        navigate(ROUTES.INTERNATIONAL_PAYMENT, {
                          state: { amount: val, currency: 'USD', flow: 'wallet_topup' }
                        });
                        return;
                      }

                      try {
                        setIsLoading(true);
                        const currentUserId = userId;
                        const { data, error } = await supabase.functions.invoke(
                          'create-razorpay-order',
                          {
                            body: {
                              amount: val,
                              userId: currentUserId,
                              type: 'wallet_topup',
                            },
                            headers: {
                              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                            },
                          }
                        );
                        if (error) {
                          if (import.meta.env.DEV) console.error('[edge function error]', error);
                          let errorMessage = error.message || 'Failed to create payment order';
                          // Try to extract the specific error message from the response body
                          try {
                            const errorResponse = (
                              error as { context?: { json: () => Promise<{ error?: string }> } }
                            ).context;
                            if (errorResponse) {
                              const body = await errorResponse.json();
                              if (body && body.error) {
                                errorMessage = body.error;
                              }
                            }
                          } catch (e) {
                            console.warn('Could not parse error response body:', e);
                          }
                          if (
                            errorMessage.includes('Wallet not found') ||
                            errorMessage.includes('404')
                          ) {
                            navigate(ROUTES.WALLET, { replace: true });
                            throw new Error('Wallet not found. Redirecting to Intro...');
                          }
                          throw new Error(errorMessage);
                        }
                        let order = data;
                        if (typeof data === 'string') {
                          try {
                            order = JSON.parse(data);
                          } catch (e) {
                            console.error('Could not parse data string:', data);
                            throw new Error('Failed to parse payment order response');
                          }
                        }
                        if (!order || !order.id) {
                          console.error('Raw order data:', order);
                          throw new Error('Invalid Razorpay order response');
                        }
                        const options = {
                          key: String(import.meta.env.VITE_RAZORPAY_KEY_ID),
                          amount: Number(order.amount),
                          currency: order.currency,
                          name: 'Grid.pe',
                          description: 'Wallet Top-up',
                          order_id: order.id,
                          handler: async function (response: {
                            razorpay_order_id: string;
                            razorpay_payment_id: string;
                            razorpay_signature: string;
                          }) {
                            try {
                              const { data: verifyData, error: verifyError } =
                                await supabase.functions.invoke('verify-payment', {
                                  body: {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                  },
                                });
                              if (verifyError) {
                                if (import.meta.env.DEV) console.error('[edge function error]', verifyError);
                                throw verifyError;
                              }
                              let verification = verifyData;
                              if (typeof verifyData === 'string') {
                                verification = JSON.parse(verifyData);
                              }
                              if (verification && verification.success) {
                                await new Promise(resolve => { const t = setTimeout(resolve, 2000); if (false) clearTimeout(t); });
                                await refreshBalance(currentUserId);
                                await fetchProfileData(currentUserId);
                                await refreshTransactions(currentUserId);
                                navigate(ROUTES.WALLET_TOPUP_SUCCESS, {
                                  state: {
                                    totalAmount: val,
                                    creditAmount: val,
                                    paymentMethod: 'razorpay',
                                    transactionId: verification?.transactionData?.id,
                                  },
                                });
                              } else {
                                navigate(ROUTES.WALLET_TOPUP_FAILED, {
                                  state: {
                                    error: verification?.message || 'Payment verification failed.',
                                  },
                                });
                              }
                            } catch (err) {
                              console.error('Verification error', err);
                              showToaster('Something went wrong during verification.', 'error');
                            }
                          },
                          theme: {
                            color: 'hsl(var(--primary))',
                          },
                          modal: {
                            ondismiss: function () {
                              setIsLoading(false);
                              navigate(ROUTES.WALLET_TOPUP_FAILED, {
                                state: { error: 'Payment was cancelled.' },
                              });
                            },
                          },
                        };
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const rzp = new (window as any).Razorpay(options);
                        rzp.on(
                          'payment.failed',
                          function (paymentError: {
                            error: { code: string; description: string };
                          }) {
                            console.error('Payment Failed:', paymentError.error);
                            setIsLoading(false);
                            navigate(ROUTES.WALLET_TOPUP_FAILED, {
                              state: {
                                error:
                                  paymentError.error.description ||
                                  'Payment failed at the gateway.',
                              },
                            });
                          }
                        );
                        try {
                          rzp.open();
                        } catch (openErr) {
                          console.error(
                            'Razorpay open error:',
                            JSON.stringify(openErr, Object.getOwnPropertyNames(openErr))
                          );
                          throw openErr; // Propagate to the outer catch
                        }
                        } catch (err: unknown) {
                          console.error(
                            'RAZORPAY_FAILURE:',
                            JSON.stringify(err, Object.getOwnPropertyNames(err))
                          );
                          const errorMessage = err instanceof Error ? err.message : 'Failed to initiate payment.';
                          showToaster(errorMessage, 'error');
                        } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                  disabled={isLoading || isRenewalPending}
                  className={`w-full h-[48px] text-white rounded-full text-[16px] font-medium font-sans ${
                    (isExceedingLimit && nextTier) ||
                    (Math.floor(amountVal) >= 500 && !isLoading && !isRenewalPending)
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-primary/50 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isExceedingLimit && nextTier ? (
                    `Upgrade to ${nextTier}`
                  ) : (
                    'Add Money'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WalletAddMoney;
