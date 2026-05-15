import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { hapticMedium } from '@/utils/haptics';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/PhoneInput';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { fetchBankDetails, getBankLogo } from '@/utils/bankUtils';
import { createBankAccount, BankAccount } from '@/lib/banking';
import { useWebScroll } from '@/hooks/useWebScroll';
import { useUser } from '@/contexts/UserContext';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import ButtonSpinner from '@/components/ui/ButtonSpinner';
type Selection = 'auto' | 'manual';
interface RazorpayBankDetails {
  BANK: string;
  BRANCH: string;
  CITY: string;
  IFSC: string;
  // Add other fields if needed
}
const AddBank = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { showToaster } = useCustomToaster();
  const { profile } = useUser();
  const userId = profile?.id;
  const isDarkMode = resolvedTheme !== 'light';
  const [selection, setSelection] = useState<Selection>('auto');
  // Auto Flow State
  const [mobile, setMobile] = useState('');
  const handlePhoneChange = (val: string) => {
    const numericOnly = val.replace(/\D/g, '').slice(0, 10);
    setMobile(numericOnly);
    if (numericOnly.length === 10) {
      dismissKeyboard();
    }
  };
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const dismissKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide();
    } else {
      (document.activeElement as HTMLElement)?.blur();
    }
  };
  // Manual Flow State
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('Savings Account');
  const [bankDetails, setBankDetails] = useState<RazorpayBankDetails | null>(null); // To store fetched details
  const otpFocusRef = useRef<HTMLDivElement>(null);

  // Delayed focus for OTP input
  useLayoutEffect(() => {
    if (showOtpInput) {
      const timer = setTimeout(() => {
        otpFocusRef.current?.querySelector('input')?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showOtpInput]);
  // Timer logic for OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);
  // IFSC Validation
  useEffect(() => {
    const fetchDetails = async () => {
      if (ifscCode.length === 11) {
        const details = await fetchBankDetails(ifscCode);
        if (details) {
          setBankDetails(details);
          // Format: {Bank Name}, {Branch Name} {Branch Code}
          // Branch code from last 4 digits of IFSC
          const branchCode = ifscCode.slice(-4);
          const formattedBranch = toTitleCase(details.BRANCH);
          setBankName(`${details.BANK}, ${formattedBranch} ${branchCode}`);
        } else {
          setBankName('');
          setBankDetails(null);
        }
      } else {
        setBankName('');
        setBankDetails(null);
      }
    };
    const timeoutId = setTimeout(fetchDetails, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [ifscCode]);
  const handleRequestOTP = async () => {
    if (mobile.length < 10) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setShowOtpInput(true);
    setResendTimer(30);
  };
  const handleVerifyOtp = async () => {
    if (otp !== '123456') return; // Simple validation
    setIsLoading(true);
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    if (!userId) {
      showToaster('Authentication error. Please log in again.', 'error');
      return;
    }
    // For now, simulate success by navigating with added account state
    // In a real flow, we'd fetch the newly linked accounts first
    const mockAccount: BankAccount = {
      id: 'linked-' + Date.now(),
      user_id: userId,
      bank_name: 'HDFC Bank',
      account_type: 'Savings Account',
      account_number: 'XXXX XXXX 1234',
      account_holder_name: 'Test User',
      ifsc_code: 'HDFC0001234',
      branch_name: 'HDFC Bank, Main Branch',
      is_default: true,
      created_at: new Date().toISOString(),
    };
    navigate(ROUTES.BANKING, { state: { accountsAdded: true, selectedAccounts: [mockAccount] } });
  };
  // Helper to title case string (e.g. "GUWAHATI" -> "Guwahati")
  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };
  const handleManualVerify = async () => {
    if (!bankDetails) return;
    if (!userId) {
      showToaster('Authentication error. Please log in again.', 'error');
      return;
    }
    setIsLoading(true);
    const formattedBranch = toTitleCase(bankDetails.BRANCH);
    try {
      const newAccount: Omit<BankAccount, 'id' | 'created_at' | 'masked_number'> = {
        user_id: userId,
        bank_name: bankDetails.BANK,
        account_type: accountType,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        ifsc_code: ifscCode,
        branch_name: formattedBranch,
        is_default: false,
      };
      const savedAccount = await createBankAccount(newAccount);
      setIsLoading(false);
      navigate(ROUTES.BANKING, {
        state: { accountsAdded: true, selectedAccounts: [savedAccount] },
      });
    } catch (error) {
      console.error('Error adding bank account:', error);
      setIsLoading(false);
    }
  };
  const isButtonDisabled = () => {
    if (selection === 'auto') {
      if (isLoading) return true;
      if (!showOtpInput) return mobile.length < 10;
      return otp.length < 6;
    } else {
      // Manual flow validation
      const accountsMatch =
        accountNumber && confirmAccountNumber && accountNumber === confirmAccountNumber;
      const isIfscValid = ifscCode.length === 11 && bankName.length > 0;
      const hasHolderName = accountHolderName.trim().length > 0;
      return !accountsMatch || !isIfscValid || !hasHolderName;
    }
  };
  const getButtonText = () => {
    if (selection === 'auto') {
      if (isLoading) return showOtpInput ? 'Verifying...' : 'Requesting...';
      return showOtpInput ? 'Continue' : 'Request OTP';
    }
    return 'Verify Bank Account';
  };
  const handleButtonClick = () => {
    hapticMedium();
    if (selection === 'auto') {
      if (showOtpInput) {
        handleVerifyOtp();
      } else {
        handleRequestOTP();
      }
    } else {
      handleManualVerify();
    }
  };
  const handleMaskedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Handle masking: assumes typing/deleting at end of string
    if (val.length < accountNumber.length) {
      setAccountNumber(prev => prev.slice(0, val.length));
    } else {
      const newChars = val.slice(accountNumber.length);
      setAccountNumber(prev => prev + newChars);
    }
  };
  const showMatchError =
    touchedConfirm && confirmAccountNumber.length > 0 && accountNumber !== confirmAccountNumber;
  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col relative safe-top safe-bottom`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between shrink-0 z-10">
        <BackButton onClick={() => navigate(-1)} />
        <h1
          className={`${isDarkMode ? 'text-foreground' : 'text-black'} text-[18px] font-semibold`}
        >
          Banking
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>
      {/* Content */}
      <div className="flex-1 px-5 mt-8 overflow-y-auto overscroll-y-none scrollbar-hide pb-32 min-h-0">
        <p
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium leading-relaxed mb-8`}
        >
          Whether you like shortcuts or full control –
          <br />
          we’ve got you.
        </p>
        {/* Options */}
        <div className="space-y-4">
          {/* Auto Fetch */}
          <div
            className={`relative rounded-2xl p-[12px] border transition-all duration-200 overflow-hidden ${
              selection === 'auto'
                ? isDarkMode
                  ? 'border-white/20 bg-white/5'
                  : 'border-brand-border-light bg-brand-bg-light'
                : isDarkMode
                  ? 'border-white/10 bg-black/20'
                  : 'border-brand-border-light bg-white'
            }`}
            onClick={() => setSelection('auto')}
          >
            {/* Background Asset - Dark Mode Only */}
            {isDarkMode && (
              <div
                className="absolute inset-0 z-0 opacity-100"
                style={{
                  backgroundImage: `url(${ASSETS.AUTO_FETCH})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            {/* Content Layer */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <img
                    src={selection === 'auto' ? ASSETS.RADIO_FILLED : ASSETS.RADIO_EMPTY}
                    alt="radio"
                    className="w-5 h-5 shrink-0"
                    style={
                      !isDarkMode && selection !== 'auto' ? { filter: 'invert(1)' } : undefined
                    }
                  />
                  <span
                    className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium`}
                  >
                    Auto-fetch bank accounts
                  </span>
                </div>
                {/* Recommended Badge */}
                <div
                  className="inline-flex items-center justify-center whitespace-nowrap px-2 py-0.5"
                  style={
                    isDarkMode
                      ? {
                          height: '25px',
                          backgroundImage: `url(${ASSETS.RECOMMENDED})`,
                          backgroundSize: '100% 100%',
                          borderRadius: '20px',
                        }
                      : {
                          height: '25px',
                          backgroundColor: '#0D992F',
                          borderRadius: '20px',
                        }
                  }
                >
                  <span className="text-white text-[12px] font-medium mb-[1px]">Recommended</span>
                </div>
              </div>
              {/* Description */}
              <div className="pl-9">
                <p
                  className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[13px] leading-relaxed`}
                >
                  Let Anumati do the digging. We’ll fetch your linked
                  <br />
                  accounts in a snap.
                  <br />
                  Safe, fast, and totally RBI-approved.
                </p>
              </div>
            </div>
          </div>
          {/* Manual Entry */}
          <div
            className={`relative rounded-2xl p-[12px] border transition-all duration-200 overflow-hidden flex items-center ${
              selection === 'manual'
                ? isDarkMode
                  ? 'border-white/20 bg-white/5'
                  : 'border-brand-border-light bg-brand-bg-light'
                : isDarkMode
                  ? 'border-white/10 bg-black/20'
                  : 'border-brand-border-light bg-white'
            }`}
            onClick={() => setSelection('manual')}
            style={{ height: '64px' }}
          >
            {/* Background Asset - Dark Mode Only */}
            {isDarkMode && (
              <div
                className="absolute inset-0 z-0 opacity-100"
                style={{
                  backgroundImage: `url(${ASSETS.MANUAL_ENTRY})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            {/* Content Layer */}
            <div className="relative z-10 flex items-center gap-4 w-full">
              <img
                src={selection === 'manual' ? ASSETS.RADIO_FILLED : ASSETS.RADIO_EMPTY}
                alt="radio"
                className="w-5 h-5 shrink-0"
                style={!isDarkMode && selection !== 'manual' ? { filter: 'invert(1)' } : undefined}
              />
              <span
                className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium`}
              >
                Add bank account manually
              </span>
            </div>
          </div>
        </div>
        {/* Input Section - Conditional Rendering */}
        {selection === 'auto' ? (
          <div className="mt-[18px] animate-fade-in">
            <label
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-sans mb-4 block`}
            >
              Bank-registered mobile number
            </label>
            <PhoneInput
              value={mobile}
              onChange={handlePhoneChange}
              countryCode="+91"
              placeholder="Enter your mobile number"
              disabled={showOtpInput}
              className={!isDarkMode ? 'bg-brand-bg-light border-brand-border-light text-black' : ''}
            />
            {/* OTP Section */}
            {showOtpInput && (
              <div className="mt-8 animate-fade-in space-y-4">
                <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px]`}>
                  An OTP has been sent to your registered mobile number.
                </p>
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
                  ref={otpFocusRef as any}
                >
                  <InputOTPGroup className="gap-2 w-full justify-between">
                    {[0, 1, 2, 3, 4, 5].map(index => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={`h-[52px] w-12 rounded-[7px] border-none text-xl font-semibold transition-all bg-cover bg-center ${isDarkMode ? 'text-white ring-white/10' : 'text-black ring-black/10 bg-brand-bg-light'}`}
                        style={
                          isDarkMode
                            ? {
                                backgroundImage: `url(${ASSETS.OTP_INPUT_FIELD})`,
                                backgroundColor: 'transparent',
                              }
                            : {
                                backgroundColor: '#F7F8FA',
                                border: '1px solid #E6E8EB',
                              }
                        }
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <img src={ASSETS.AWAITING_OTP} alt="pending" className="w-5 h-5" />
                    <span
                      className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[13px]`}
                    >
                      Awaiting OTP verification
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (resendTimer === 0) {
                        setResendTimer(30);
                      }
                    }}
                    disabled={resendTimer > 0}
                    className={`${isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'} text-[13px] transition-colors disabled:opacity-50`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Didn't receive OTP?"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Manual Entry Form */
          <div className="mt-[18px] animate-fade-in space-y-6">
            <h2
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-sans`}
            >
              Enter your account details:
            </h2>
            {/* Account Number */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Account Number"
                value={'*'.repeat(accountNumber.length)}
                onChange={handleMaskedChange}
                className={`w-full h-[48px] rounded-full px-5 text-[14px] font-normal font-sans outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-brand-card-dark/30 border-[0.65px] border-white/20 text-white placeholder:text-white/40 focus:border-white/40'
                    : 'bg-brand-bg-light border border-brand-border-light text-black placeholder:text-black/40 focus:border-black/20'
                } ${accountNumber.length > 0 ? 'tracking-widest' : ''}`}
              />
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  placeholder="Confirm Account Number"
                  value={confirmAccountNumber}
                  onChange={e => {
                    setConfirmAccountNumber(e.target.value);
                    setTouchedConfirm(false);
                  }}
                  onBlur={() => setTouchedConfirm(true)}
                  className={`w-full h-[48px] rounded-full px-5 text-[14px] font-normal font-sans outline-none transition-colors ${
                    isDarkMode
                      ? 'bg-brand-card-dark/30 border-[0.65px] text-white placeholder:text-white/40'
                      : 'bg-brand-bg-light border text-black placeholder:text-black/40'
                  } ${confirmAccountNumber.length > 0 ? 'tracking-widest' : ''} ${
                    showMatchError
                      ? 'border-red-500/50 focus:border-red-500'
                      : isDarkMode
                        ? 'border-white/20 focus:border-white/40'
                        : 'border-brand-border-light focus:border-black/20'
                  }`}
                />
                {showMatchError && (
                  <p className="text-red-500 text-[11px] ml-5">Account numbers do not match</p>
                )}
              </div>
              {/* Account Holder Name */}
              <input
                type="text"
                placeholder="Account Holder Name"
                value={accountHolderName}
                onChange={e => setAccountHolderName(e.target.value)}
                className={`w-full h-[48px] rounded-full px-5 text-[14px] font-normal font-sans outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-brand-card-dark/30 border-[0.65px] border-white/20 text-white placeholder:text-white/40 focus:border-white/40'
                    : 'bg-brand-bg-light border border-brand-border-light text-black placeholder:text-black/40 focus:border-black/20'
                }`}
              />
              {/* Account Type Selection */}
              <div className="flex flex-col gap-3">
                <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[13px] ml-5`}>
                  Account Type
                </p>
                <div className="flex gap-3">
                  {['Savings Account', 'Current Account'].map(type => (
                    <button
                      key={type}
                      onClick={() => setAccountType(type)}
                      className={`flex-1 h-[40px] rounded-full text-[13px] font-medium transition-all duration-200 ${
                        accountType === type
                          ? isDarkMode
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                          : isDarkMode
                            ? 'bg-white/5 text-white/60 border border-white/10'
                            : 'bg-brand-bg-light text-black/60 border border-brand-border-light'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={ifscCode}
                    onChange={e => setIfscCode(e.target.value.toUpperCase())}
                    maxLength={11}
                    className={`w-full h-[48px] rounded-full pl-5 pr-24 text-[14px] font-normal font-sans outline-none transition-colors uppercase ${
                      isDarkMode
                        ? 'bg-brand-card-dark/30 border-[0.65px] border-white/20 text-white placeholder:text-white/40 focus:border-white/40'
                        : 'bg-brand-bg-light border border-brand-border-light text-black placeholder:text-black/40 focus:border-black/20'
                    }`}
                  />
                  <button
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-primary text-[13px] font-medium hover:text-brand-primary/80 transition-colors"
                    onClick={() =>
                      window.open(
                        'https://www.ifsccodebank.com/search-by-IFSC-code.aspx',
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    Search IFSC?
                  </button>
                </div>
                {/* Bank Name Success State */}
                {bankName && (
                  <div className="flex items-center gap-2 mt-4 ml-1">
                    <span
                      className={`${isDarkMode ? 'text-white' : 'text-black'} font-bold text-[16px] leading-snug`}
                    >
                      {bankName}
                    </span>
                    <img src={ASSETS.VERIFIED} alt="verified" className="w-[18px] h-[18px]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Footer */}
      <div
        className={`sticky bottom-0 left-0 w-full px-5 py-4 flex justify-center z-20 ${isDarkMode ? 'bg-gradient-to-t from-brand-bg-dark via-brand-bg-dark/80 to-transparent' : 'bg-gradient-to-t from-white via-white/80 to-transparent'}`}
      >
        <Button
          variant="gradient"
          className="w-full h-[48px] rounded-full text-[16px] font-sans font-medium transition-all duration-200"
          onClick={handleButtonClick}
          disabled={isButtonDisabled()}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <ButtonSpinner />
              {getButtonText().replace('...', '')}...
            </span>
          ) : (
            getButtonText()
          )}
        </Button>
      </div>
    </div>
  );
};
export default AddBank;
