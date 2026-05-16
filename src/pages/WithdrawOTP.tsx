import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { useUser } from '@/contexts/UserContext';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { supabase } from '@/lib/supabase';
import { verifyVPA } from '@/lib/banking';
import ButtonSpinner from '@/components/ui/ButtonSpinner';
const WithdrawOTP = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const location = useLocation();
  const { phoneNumber, refreshBalance, profile } = useUser();
  const userId = profile?.id;
  const isDarkMode = useIsDarkMode();
  const [otp, setOtp] = useState('');
  const { showToaster } = useCustomToaster();
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState(false);
  const dismissKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide();
    } else {
      (document.activeElement as HTMLElement)?.blur();
    }
  };
  // location.state might have upiId (from manual) or nothing (for auto)
  const {
    selectedMethod,
    amount,
    upiId: initialUpiId,
    paymentMethod: stateMethod,
  } = location.state || {};
  const [actualUpiId, setActualUpiId] = useState(initialUpiId);
  const isComplete = otp.length === 6;
  useEffect(() => {
    if (phoneNumber) {
      showToaster(`OTP sent to +91 ${phoneNumber}`, 'success');
    }
  }, [phoneNumber, showToaster]);
  useEffect(() => {
    if (otp === '123456') {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  }, [otp]);
  // Clear verification states when the UPI ID changes (user manual entry or re-selection)
  useEffect(() => {
    setVerificationError(false);
    setVerifiedName(null);
  }, [actualUpiId]);
  // Ghost VPA & Verification Logic
  useEffect(() => {
    const runVerification = async () => {
      let targetUpi = actualUpiId;
      // 1. Ghost VPA Generation (Skip if manual UPI ID was already provided)
      if (!targetUpi && phoneNumber && stateMethod?.id !== 'upi-id') {
        const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10); // Last 10 digits
        if (stateMethod?.id === 'gpay') {
          targetUpi = `${cleanPhone}@okicici`;
        } else if (stateMethod?.id === 'phonepe') {
          targetUpi = `${cleanPhone}@ybl`;
        }
      }
      if (!targetUpi) return;
      setActualUpiId(targetUpi);
      setVerifying(true);
      setVerificationError(false);
      try {
        const result = await verifyVPA(targetUpi);
        if (result.success) {
          setVerifiedName(result.registered_name);
        }
        // No setting verificationError here anymore (optimistic)
      } catch (err) {
        console.error('VPA Verification Error:', err);
      } finally {
        setVerifying(false);
      }
    };
    if (
      stateMethod?.id === 'gpay' ||
      stateMethod?.id === 'phonepe' ||
      stateMethod?.id === 'upi-id'
    ) {
      runVerification();
    }
  }, [stateMethod, phoneNumber, actualUpiId]);
  // Priority: 1. stateMethod (passed from prev screen), 2. fallback
  const method = { ...(stateMethod || { id: 'unknown', name: 'Transfer' }) };
  // UI Sync: Show ID string instead of generic name for manual mode or fallback
  if ((method.id === 'upi-id' || verificationError) && actualUpiId) {
    method.name = actualUpiId;
  }
  const handleVerify = async () => {
    if (isVerified) {
      if (!userId) {
        showToaster('Authentication error. Please log in again.', 'error');
        return;
      }
      setLoading(true);
      try {
        // 1. Create payout record based on selected method
        if (
          stateMethod?.id === 'upi-id' ||
          stateMethod?.id === 'gpay' ||
          stateMethod?.id === 'phonepe'
        ) {
          // Atomic RPC: deducts wallets.available_balance + inserts payout in one transaction
          const { error: rpcError } = await supabase.rpc('wallet_withdraw', {
            p_user_id: userId,
            p_amount: parseFloat(amount),
            p_payout_method: 'upi',
            p_vpa: actualUpiId,
            p_description: 'Wallet Withdrawal',
          });
          if (rpcError) {
            setVerificationError(true);
            throw new Error(rpcError.message);
          }
          showToaster('Withdrawal request initiated successfully!', 'success');
        } else {
          // Atomic RPC for Bank Account, Wallet, and Card withdrawals
          const payoutMethod =
            stateMethod?.id === 'bank-account'
              ? 'bank_transfer'
              : stateMethod?.id === 'wallet'
                ? 'wallet'
                : 'card';
          const { error: rpcError } = await supabase.rpc('wallet_withdraw', {
            p_user_id: userId,
            p_amount: parseFloat(amount),
            p_payout_method: payoutMethod,
            p_vpa: stateMethod?.id === 'bank-account' ? selectedMethod : method?.name || null,
            p_description: 'Wallet Withdrawal',
          });
          if (rpcError) {
            setVerificationError(true);
            throw new Error(rpcError.message);
          }
          showToaster('Withdrawal request initiated successfully!', 'success');
        }
        // 2. Wait for DB transaction to fully commit, then refresh
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refreshBalance();
        navigate(ROUTES.WALLET_WITHDRAW_SUCCESS, { state: { ...location.state, amount } });
      } catch (err: unknown) {
        console.error('Withdrawal error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed. Please try again.';
        showToaster(errorMessage, 'error');
        navigate(ROUTES.WALLET_WITHDRAW_FAILED, {
          state: { ...location.state, amount, error: errorMessage },
        });
      } finally {
        setLoading(false);
      }
    } else if (otp.length === 6) {
      showToaster('Invalid OTP. Please enter 123456 for testing.', 'error');
    }
  };
  return (
    <div
      className={`h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-top bg-background`}
      style={
        isDarkMode
          ? {
              backgroundImage: `url(${ASSETS.BG_DARK_MODE})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
            }
          : {}
      }
    >
      {/* Light Mode Status Blob (Top Glow) */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between relative z-10 shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi absolute left-1/2 -translate-x-1/2`}
        >
          Withdraw
        </h1>
      </div>
      <div className="flex-1 flex flex-col px-5 pt-[34px] z-10">
        {/* Sub-text - 34px below header */}
        <p
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-satoshi leading-tight mb-[25px]`}
        >
          An OTP has been sent to your registered mobile number, linked with the mode of payment you
          have selected. Please enter the OTP to proceed with the withdrawal process.
        </p>
        {/* OTP Input - 25px below sub-text */}
        <div className="w-full flex justify-center mb-3">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={val => {
              const numericOnly = val.replace(/\D/g, '').slice(0, 6);
              setOtp(numericOnly);
              if (numericOnly.length === 6) {
                dismissKeyboard();
              }
            }}
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map(index => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={`w-[52px] h-[68px] rounded-[7px] border-none ${isDarkMode ? 'text-white' : 'text-black'} text-[24px] font-bold relative overflow-hidden`}
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : 'hsl(var(--muted))',
                    backdropFilter: isDarkMode ? 'blur(23.51px)' : 'none',
                    WebkitBackdropFilter: isDarkMode ? 'blur(23.51px)' : 'none',
                  }}
                >
                  {/* Gradient Border Overlay - 0.59px */}
                  {isDarkMode && (
                    <div
                      className="absolute inset-0 pointer-events-none rounded-[7px]"
                      style={{
                        padding: '0.59px',
                        background:
                          'linear-gradient(135deg, rgba(255, 255, 255, 0.20), rgba(255, 255, 255, 0.02))',
                        WebkitMask:
                          'linear-gradient(white 0 0) content-box, linear-gradient(white 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                      }}
                    />
                  )}
                  {!isDarkMode && (
                    <div className="absolute inset-0 border border-border rounded-[7px] pointer-events-none" />
                  )}
                </InputOTPSlot>
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {/* Awaiting Row - 12px below input */}
        <div className="flex items-center justify-between w-full mt-3">
          <div className="flex items-center gap-3">
            <img
              src={isVerified ? ASSETS.VERIFIED_CIRCLE : ASSETS.AWAITING}
              alt="Status"
              className={`w-[20px] h-[20px] ${isDarkMode ? '' : isVerified ? '' : 'brightness-0 opacity-40'}`}
            />
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black/60'} text-[12px] font-normal font-satoshi`}
            >
              {isVerified ? 'OTP Verified' : 'Awaiting OTP verification'}
            </span>
          </div>
          {!isVerified && (
            <button className="text-primary text-[14px] font-normal font-satoshi underline">
              Resend OTP in 20s
            </button>
          )}
        </div>
        {/* Verification Result / Fallback */}
        <div className="mt-6">
          {verifying ? (
            <p
              className={`text-[14px] animate-pulse ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}
            >
              Verifying UPI connection...
            </p>
          ) : verificationError ? (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-[12px]">
              <p className="text-destructive text-[14px] font-medium font-satoshi">
                We couldn't find a linked account. Please enter your UPI ID manually.
              </p>
              <button
                onClick={() =>
                  navigate(ROUTES.SELECT_PAYMENT_METHOD, { state: { amount, forceManual: true } })
                }
                className="mt-2 text-primary text-[14px] font-bold underline"
              >
                Re-select Payment Method
              </button>
            </div>
          ) : verifiedName ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p
                className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[14px] font-medium font-satoshi`}
              >
                Sending to: <span className="font-bold text-primary">{verifiedName}</span>
              </p>
            </div>
          ) : null}
        </div>
        {/* Info Text - Spaced out */}
        <div className="mt-auto mb-8">
          <p
            className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-satoshi leading-tight mb-[12px]`}
          >
            Your amount will be credited in this selected mode of payment.
          </p>
          {/* Payment Container */}
          <div
            className={`w-full h-[66px] rounded-[22px] flex items-center px-[10px] relative overflow-hidden ${isDarkMode ? '' : 'border border-border'}`}
            style={{
              backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : 'transparent',
              backdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
              WebkitBackdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
            }}
          >
            {/* Gradient Border Overlay - 0.63px */}
            {isDarkMode && (
              <div
                className="absolute inset-0 pointer-events-none rounded-[22px]"
                style={{
                  padding: '0.63px',
                  background:
                    'linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.20))',
                  WebkitMask: 'linear-gradient(white 0 0) content-box, linear-gradient(white 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
            )}
            {method.icon && (
              <img
                src={method.icon}
                alt={method.name}
                className="w-[32px] h-[32px] object-contain shrink-0"
              />
            )}
            <div
              className={`flex flex-col flex-1 ${method.icon || method.id === 'upi-id' ? 'ml-[12px]' : ''}`}
            >
              <span
                className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans`}
              >
                {method.name}
              </span>
              {method.subtitle && (
                <span
                  className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[12px] font-medium font-sans`}
                >
                  {method.subtitle}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 safe-bottom pb-4 flex flex-col gap-3 z-10">
        <button
          onClick={handleVerify}
          disabled={
            !isComplete ||
            loading ||
            ((stateMethod?.id === 'upi-id' ||
              stateMethod?.id === 'gpay' ||
              stateMethod?.id === 'phonepe') &&
              !actualUpiId)
          }
          className={`w-full h-[48px] rounded-full text-white text-[16px] font-medium flex items-center justify-center transition-all ${
            isComplete &&
            !loading &&
            (!(
              stateMethod?.id === 'upi-id' ||
              stateMethod?.id === 'gpay' ||
              stateMethod?.id === 'phonepe'
            ) ||
              actualUpiId)
              ? 'active:scale-95 opacity-100'
              : 'opacity-30 pointer-events-none'
          }`}
          style={{
            backgroundColor: 'hsl(var(--primary))',
          }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <ButtonSpinner />
              Processing...
            </span>
          ) : (
            'Withdraw'
          )}
        </button>
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
  );
};
export default WithdrawOTP;
