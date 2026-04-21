import React, {  useState, useEffect  } from 'react';
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { hapticMedium } from "@/utils/haptics";
import BackButton from "@/components/ui/BackButton";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import autoFetchBg from "@/assets/auto-fetch.png";
import manualEntryBg from "@/assets/manual-entry.png";
import radioFilled from "@/assets/radio-filled.png";
import radioEmpty from "@/assets/radio-empty.png";
import recommendedBadge from "@/assets/recommended.png";
import otpInputField from "@/assets/otp-input-field.png";
import awaitingOtp from "@/assets/awaiting-otp.png";
import verifiedIcon from "@/assets/verified.png";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/PhoneInput";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { fetchBankDetails, getBankLogo } from "@/utils/bankUtils";
import { createBankAccount, BankAccount } from "@/lib/banking";
import { USER_ID } from "@/lib/supabase";

type Selection = "auto" | "manual";

interface RazorpayBankDetails {
  BANK: string;
  BRANCH: string;
  CITY: string;
  IFSC: string;
  // Add other fields if needed
}

const AddBank = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const [selection, setSelection] = useState<Selection>("auto");

  // Auto Flow State
  const [mobile, setMobile] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Manual Flow State
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("Savings Account");
  const [bankDetails, setBankDetails] = useState<RazorpayBankDetails | null>(null); // To store fetched details

  // Timer logic for OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
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
          setBankName("");
          setBankDetails(null);
        }
      } else {
        setBankName("");
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
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setShowOtpInput(true);
    setResendTimer(30);
  };

  const handleVerifyOtp = async () => {
    if (otp !== "123456") return; // Simple validation

    setIsLoading(true);
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    // For now, simulate success by navigating with added account state
    // In a real flow, we'd fetch the newly linked accounts first
    const mockAccount: BankAccount = {
      id: "linked-" + Date.now(),
      user_id: USER_ID,
      bank_name: "HDFC Bank",
      account_type: "Savings Account",
      account_number: "XXXX XXXX 1234",
      account_holder_name: "Test User",
      ifsc_code: "HDFC0001234",
      branch_name: "HDFC Bank, Main Branch",
      is_default: true,
      logo_url: null,
      created_at: new Date().toISOString()
    };

    navigate("/banking", { state: { accountsAdded: true, selectedAccounts: [mockAccount] } });
  };

  // Helper to title case string (e.g. "GUWAHATI" -> "Guwahati")
  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  const handleManualVerify = async () => {
    if (!bankDetails) return;

    setIsLoading(true);
    const formattedBranch = toTitleCase(bankDetails.BRANCH);

    try {
      const newAccount: Omit<BankAccount, 'id' | 'created_at' | 'masked_number'> = {
        user_id: USER_ID,
        bank_name: bankDetails.BANK,
        account_type: accountType,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        ifsc_code: ifscCode,
        branch_name: formattedBranch,
        is_default: false,
        logo_url: null,
      };

      const savedAccount = await createBankAccount(newAccount);
      setIsLoading(false);
      navigate("/banking", { state: { accountsAdded: true, selectedAccounts: [savedAccount] } });
    } catch (error) {
      console.error("Error adding bank account:", error);
      setIsLoading(false);
    }
  };

  const isButtonDisabled = () => {
    if (selection === "auto") {
      if (isLoading) return true;
      if (!showOtpInput) return mobile.length < 10;
      return otp.length < 6;
    } else {
      // Manual flow validation
      const accountsMatch = accountNumber && confirmAccountNumber && accountNumber === confirmAccountNumber;
      const isIfscValid = ifscCode.length === 11 && bankName.length > 0;
      const hasHolderName = accountHolderName.trim().length > 0;
      return !accountsMatch || !isIfscValid || !hasHolderName;
    }
  };

  const getButtonText = () => {
    if (selection === "auto") {
      if (isLoading) return showOtpInput ? "Verifying..." : "Requesting...";
      return showOtpInput ? "Continue" : "Request OTP";
    }
    return "Verify Bank Account";
  };

  const handleButtonClick = () => {
    hapticMedium();
    if (selection === "auto") {
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

  const showMatchError = touchedConfirm && confirmAccountNumber.length > 0 && accountNumber !== confirmAccountNumber;

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col relative safe-area-top safe-area-bottom overflow-hidden"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between shrink-0 z-10">
        <BackButton onClick={() => navigate(-1)} />

        <h1 className={`${isDarkMode ? 'text-foreground' : 'text-black'} text-[18px] font-semibold`}>Banking</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 mt-8 overflow-y-auto overscroll-y-none scrollbar-hide pb-32">
        <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium leading-relaxed mb-8`}>
          Whether you like shortcuts or full control â€”
          <br />
          weâ€™ve got you.
        </p>

        {/* Options */}
        <div className="space-y-4">
          {/* Auto Fetch */}
          <div
            className={`relative rounded-2xl p-[12px] border transition-all duration-200 overflow-hidden ${selection === "auto"
              ? (isDarkMode ? "border-white/20 bg-white/5" : "border-[#E9EAEB] bg-[#F7F8FA]")
              : (isDarkMode ? "border-white/10 bg-black/20" : "border-[#E9EAEB] bg-white")
              }`}
            onClick={() => setSelection("auto")}
          >
            {/* Background Asset - Dark Mode Only */}
            {isDarkMode && (
              <div
                className="absolute inset-0 z-0 opacity-100"
                style={{
                  backgroundImage: `url(${autoFetchBg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}

            {/* Content Layer */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <img
                    src={selection === "auto" ? radioFilled : radioEmpty}
                    alt="radio"
                    className="w-5 h-5 shrink-0"
                    style={!isDarkMode && selection !== "auto" ? { filter: 'invert(1)' } : undefined}
                  />
                  <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium`}>
                    Auto-fetch bank accounts
                  </span>
                </div>
                {/* Recommended Badge */}
                <div
                  className="flex items-center justify-center rounded-[4px]" // rounded matched asset roughly? Asset might be pills.
                  style={isDarkMode ? {
                    width: '109px',
                    height: '25px',
                    backgroundImage: `url(${recommendedBadge})`,
                    backgroundSize: 'cover'
                  } : {
                    width: '109px',
                    height: '25px',
                    backgroundColor: '#0D992F',
                    borderRadius: '20px'
                  }}
                >
                  <span className="text-white text-[12px] font-medium mb-[1px]">Recommended</span>
                </div>
              </div>

              {/* Description */}
              <div className="pl-9">
                <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[13px] leading-relaxed`}>
                  Let Anumati do the digging. Weâ€™ll fetch your linked<br />
                  accounts in a snap.<br />
                  Safe, fast, and totally RBI-approved.
                </p>
              </div>
            </div>
          </div>

          {/* Manual Entry */}
          <div
            className={`relative rounded-2xl p-[12px] border transition-all duration-200 overflow-hidden flex items-center ${selection === "manual"
              ? (isDarkMode ? "border-white/20 bg-white/5" : "border-[#E9EAEB] bg-[#F7F8FA]")
              : (isDarkMode ? "border-white/10 bg-black/20" : "border-[#E9EAEB] bg-white")
              }`}
            onClick={() => setSelection("manual")}
            style={{ height: "64px" }}
          >
            {/* Background Asset - Dark Mode Only */}
            {isDarkMode && (
              <div
                className="absolute inset-0 z-0 opacity-100"
                style={{
                  backgroundImage: `url(${manualEntryBg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}

            {/* Content Layer */}
            <div className="relative z-10 flex items-center gap-4 w-full">
              <img
                src={selection === "manual" ? radioFilled : radioEmpty}
                alt="radio"
                className="w-5 h-5 shrink-0"
                style={!isDarkMode && selection !== "manual" ? { filter: 'invert(1)' } : undefined}
              />
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium`}>
                Add bank account manually
              </span>
            </div>
          </div>
        </div>

        {/* Input Section - Conditional Rendering */}
        {selection === 'auto' ? (
          <div className="mt-[18px] animate-fade-in">
            <label className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-sans mb-4 block`}>
              Bank-registered mobile number
            </label>
            <PhoneInput
              value={mobile}
              onChange={setMobile}
              countryCode="+91"
              placeholder="Enter your mobile number"
              disabled={showOtpInput}
              className={!isDarkMode ? "bg-[#F7F8FA] border-[#E6E8EB] text-black" : ""}
            />

            {/* OTP Section */}
            {showOtpInput && (
              <div className="mt-8 animate-fade-in space-y-4">
                <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[14px]`}>
                  An OTP has been sent to your registered mobile number.
                </p>

                <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                  <InputOTPGroup className="gap-2 w-full justify-between">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={`h-[52px] w-12 rounded-[7px] border-none text-xl font-semibold transition-all bg-cover bg-center ${isDarkMode ? 'text-white ring-white/10' : 'text-black ring-black/10 bg-[#F7F8FA]'}`}
                        style={isDarkMode ? {
                          backgroundImage: `url(${otpInputField})`,
                          backgroundColor: 'transparent'
                        } : {
                          backgroundColor: '#F7F8FA',
                          border: '1px solid #E6E8EB'
                        }}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <img src={awaitingOtp} alt="pending" className="w-5 h-5" />
                    <span className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[13px]`}>Awaiting OTP verification</span>
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
            <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-sans`}>
              Enter your account details:
            </h2>

            {/* Account Number */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Account Number"
                value={"*".repeat(accountNumber.length)}
                onChange={handleMaskedChange}
                className={`w-full h-[48px] rounded-full px-5 text-[14px] font-normal font-sans outline-none transition-colors ${isDarkMode
                  ? "bg-[#191919]/30 border-[0.65px] border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                  : "bg-[#F7F8FA] border border-[#E6E8EB] text-black placeholder:text-black/40 focus:border-black/20"
                  } ${accountNumber.length > 0 ? "tracking-widest" : ""
                  }`}
              />

              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  placeholder="Confirm Account Number"
                  value={confirmAccountNumber}
                  onChange={(e) => {
                    setConfirmAccountNumber(e.target.value);
                    setTouchedConfirm(false);
                  }}
                  onBlur={() => setTouchedConfirm(true)}
                  className={`w-full h-[48px] rounded-full px-5 text-[14px] font-normal font-sans outline-none transition-colors ${isDarkMode
                    ? "bg-[#191919]/30 border-[0.65px] text-white placeholder:text-white/40"
                    : "bg-[#F7F8FA] border text-black placeholder:text-black/40"
                    } ${confirmAccountNumber.length > 0 ? "tracking-widest" : ""
                    } ${showMatchError
                      ? "border-red-500/50 focus:border-red-500"
                      : (isDarkMode ? "border-white/20 focus:border-white/40" : "border-[#E6E8EB] focus:border-black/20")
                    }`}
                />
                {showMatchError && (
                  <p className="text-red-500 text-[11px] ml-5">
                    Account numbers do not match
                  </p>
                )}
              </div>

              {/* Account Holder Name */}
              <input
                type="text"
                placeholder="Account Holder Name"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                className={`w-full h-[48px] rounded-full px-5 text-[14px] font-normal font-sans outline-none transition-colors ${isDarkMode
                  ? "bg-[#191919]/30 border-[0.65px] border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                  : "bg-[#F7F8FA] border border-[#E6E8EB] text-black placeholder:text-black/40 focus:border-black/20"
                  }`}
              />

              {/* Account Type Selection */}
              <div className="flex flex-col gap-3">
                <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[13px] ml-5`}>
                  Account Type
                </p>
                <div className="flex gap-3">
                  {['Savings Account', 'Current Account'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setAccountType(type)}
                      className={`flex-1 h-[40px] rounded-full text-[13px] font-medium transition-all duration-200 ${accountType === type
                        ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                        : (isDarkMode ? 'bg-white/5 text-white/60 border border-white/10' : 'bg-[#F7F8FA] text-black/60 border border-[#E6E8EB]')
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
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    maxLength={11}
                    className={`w-full h-[48px] rounded-full pl-5 pr-24 text-[14px] font-normal font-sans outline-none transition-colors uppercase ${isDarkMode
                      ? "bg-[#191919]/30 border-[0.65px] border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                      : "bg-[#F7F8FA] border border-[#E6E8EB] text-black placeholder:text-black/40 focus:border-black/20"
                      }`}
                  />
                  <button
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-[#5260FE] text-[13px] font-medium hover:text-[#5260FE]/80 transition-colors"
                    onClick={() => window.open("https://www.ifsccodebank.com/search-by-IFSC-code.aspx", "_blank", "noopener,noreferrer")}
                  >
                    Search IFSC?
                  </button>
                </div>

                {/* Bank Name Success State */}
                {bankName && (
                  <div className="flex items-center gap-2 mt-4 ml-1">
                    <span className={`${isDarkMode ? 'text-white' : 'text-black'} font-bold text-[16px] leading-snug`}>{bankName}</span>
                    <img src={verifiedIcon} alt="verified" className="w-[18px] h-[18px]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 left-0 w-full px-5 flex justify-center z-20">
        <Button
          variant="gradient"
          className="w-full h-[48px] rounded-full text-[16px] font-sans font-medium transition-all duration-200"
          onClick={handleButtonClick}
          disabled={isButtonDisabled()}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {getButtonText().replace("...", "")}...
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

