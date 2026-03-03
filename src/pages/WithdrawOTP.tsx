import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import upiIcon from "@/assets/upi.png";
import credIcon from "@/assets/cred.png";
import gpayIcon from "@/assets/gpay.png";
import phonepeIcon from "@/assets/phonepe.png";
import hdfcLogo from "@/assets/hdfc-bank-logo.png";
import amazonIcon from "@/assets/amazon.png";
import awaitingIcon from "@/assets/awaiting.svg";
import verifiedCircleIcon from "@/assets/verified-circle.svg";
import cancelCta from "@/assets/cancel-cta.png";
import { useUser } from "@/contexts/UserContext";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import { supabase, USER_ID } from "@/lib/supabase";
import { createPayout, initiateUPIDisbursement, verifyVPA } from "@/lib/banking";

const WithdrawOTP = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const location = useLocation();
    const { phoneNumber, refreshBalance } = useUser();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';

    const [otp, setOtp] = useState("");
    const { showToaster } = useCustomToaster();
    const [isVerified, setIsVerified] = useState(false);
    const [verifiedName, setVerifiedName] = useState<string | null>(null);
    const [verificationError, setVerificationError] = useState(false);

    // location.state might have upiId (from manual) or nothing (for auto)
    const { selectedMethod, amount, upiId: initialUpiId, paymentMethod: stateMethod } = location.state || {};
    const [actualUpiId, setActualUpiId] = useState(initialUpiId);

    const isComplete = otp.length === 6;

    useEffect(() => {
        if (phoneNumber) {
            showToaster(`OTP sent to +91 ${phoneNumber}`, 'success');
        }
    }, [phoneNumber, showToaster]);

    useEffect(() => {
        if (otp === "123456") {
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
                console.error("VPA Verification Error:", err);
            } finally {
                setVerifying(false);
            }
        };

        if (stateMethod?.id === 'gpay' || stateMethod?.id === 'phonepe' || stateMethod?.id === 'upi-id') {
            runVerification();
        }
    }, [stateMethod, phoneNumber]);

    // Priority: 1. stateMethod (passed from prev screen), 2. fallback
    const method = { ...(stateMethod || { id: "unknown", name: "Transfer" }) };
    // UI Sync: Show ID string instead of generic name for manual mode or fallback
    if ((method.id === "upi-id" || verificationError) && actualUpiId) {
        method.name = actualUpiId;
    }

    const handleVerify = async () => {
        if (isVerified) {
            setLoading(true);
            try {
                // 1. Create payout record based on selected method
                if (stateMethod?.id === 'upi-id' || stateMethod?.id === 'gpay' || stateMethod?.id === 'phonepe') {
                    // Atomic RPC: deducts wallets.available_balance + inserts payout in one transaction
                    const { error: rpcError } = await supabase.rpc('wallet_withdraw', {
                        p_user_id: USER_ID,
                        p_amount: parseFloat(amount),
                        p_payout_method: 'upi',
                        p_vpa: actualUpiId,
                        p_description: 'Wallet Withdrawal'
                    });

                    if (rpcError) {
                        setVerificationError(true);
                        throw new Error(rpcError.message);
                    }
                    showToaster("Withdrawal request initiated successfully!", 'success');
                } else {
                    // Legacy/Existing logic for other methods (Bank Cards, etc.)
                    let payoutPayload: any = {
                        user_id: USER_ID,
                        amount: parseFloat(amount),
                        currency: 'INR'
                    };

                    if (stateMethod?.id === 'bank-account') {
                        payoutPayload = {
                            ...payoutPayload,
                            bank_account_id: selectedMethod,
                            payout_method: 'bank_account'
                        };
                    } else if (stateMethod?.id === 'wallet') {
                        payoutPayload = {
                            ...payoutPayload,
                            wallet_name: method.name,
                            payout_method: 'wallet'
                        };
                    }
                    await createPayout(payoutPayload);
                }

                // 2. Wait for DB transaction to fully commit, then refresh
                await new Promise(resolve => setTimeout(resolve, 2000));
                await refreshBalance();

                navigate("/wallet-withdraw-success", { state: { ...location.state, amount } });
            } catch (err: any) {
                console.error("Withdrawal error:", err);
                showToaster(err.message || "Withdrawal failed. Please try again.", 'error');
                navigate("/wallet-withdraw-failed", { state: { ...location.state, amount, error: err.message } });
            } finally {
                setLoading(false);
            }
        } else if (otp.length === 6) {
            showToaster("Invalid OTP. Please enter 123456 for testing.", 'error');
        }
    };

    return (
        <div
            className={`h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom pb-10 ${isDarkMode ? '' : 'bg-white'}`}
            style={isDarkMode ? {
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            } : {}}
        >
            {/* Light Mode Status Blob (Top Glow) */}
            {!isDarkMode && (
                <div
                    className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
                    style={{
                        backgroundColor: "#5260FE",
                        filter: "blur(60px)",
                        opacity: 0.8,
                        mixBlendMode: "normal"
                    }}
                />
            )}

            {/* Header */}
            <div className="px-5 pt-12 flex items-center justify-between relative z-10 shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md relative z-20 ${isDarkMode ? 'bg-white/10' : 'bg-[#F5F5F5] border border-[#E9EAEB]'
                        }`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[22px] font-medium leading-[120%] font-satoshi absolute left-1/2 -translate-x-1/2`}>
                    Withdraw
                </h1>
            </div>

            <div className="flex-1 flex flex-col px-5 pt-[34px] z-10">
                {/* Sub-text - 34px below header */}
                <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-satoshi leading-tight mb-[25px]`}>
                    An OTP has been sent to your registered mobile number, linked with the mode of payment you have selected. Please enter the OTP to proceed with the withdrawal process.
                </p>

                {/* OTP Input - 25px below sub-text */}
                <div className="w-full flex justify-center mb-3">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className={`w-[52px] h-[68px] rounded-[7px] border-none ${isDarkMode ? 'text-white' : 'text-black'} text-[24px] font-bold relative overflow-hidden`}
                                    style={{
                                        backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.31)" : "#F2F2F2",
                                        backdropFilter: isDarkMode ? "blur(23.51px)" : "none",
                                        WebkitBackdropFilter: isDarkMode ? "blur(23.51px)" : "none",
                                    }}
                                >
                                    {/* Gradient Border Overlay - 0.59px */}
                                    {isDarkMode && (
                                        <div
                                            className="absolute inset-0 pointer-events-none rounded-[7px]"
                                            style={{
                                                padding: "0.59px",
                                                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.20), rgba(255, 255, 255, 0.02))",
                                                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                                WebkitMaskComposite: "xor",
                                                maskComposite: "exclude",
                                            }}
                                        />
                                    )}
                                    {!isDarkMode && (
                                        <div className="absolute inset-0 border border-[#E9EAEB] rounded-[7px] pointer-events-none" />
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
                            src={isVerified ? verifiedCircleIcon : awaitingIcon}
                            alt="Status"
                            className={`w-[20px] h-[20px] ${isDarkMode ? '' : (isVerified ? '' : 'brightness-0 opacity-40')}`}
                        />
                        <span className={`${isDarkMode ? 'text-white' : 'text-black/60'} text-[12px] font-normal font-satoshi`}>
                            {isVerified ? "OTP Verified" : "Awaiting OTP verification"}
                        </span>
                    </div>
                    {!isVerified && (
                        <button className="text-[#5260FE] text-[14px] font-normal font-satoshi underline">
                            Resend OTP in 20s
                        </button>
                    )}
                </div>

                {/* Verification Result / Fallback */}
                <div className="mt-6">
                    {verifying ? (
                        <p className={`text-[14px] animate-pulse ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Verifying UPI connection...</p>
                    ) : verificationError ? (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-[12px]">
                            <p className="text-red-500 text-[14px] font-medium font-satoshi">
                                We couldn't find a linked account. Please enter your UPI ID manually.
                            </p>
                            <button
                                onClick={() => navigate('/select-payment-method', { state: { amount, forceManual: true } })}
                                className="mt-2 text-[#5260FE] text-[14px] font-bold underline"
                            >
                                Re-select Payment Method
                            </button>
                        </div>
                    ) : verifiedName ? (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <p className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[14px] font-medium font-satoshi`}>
                                Sending to: <span className="font-bold text-[#6C72FF]">{verifiedName}</span>
                            </p>
                        </div>
                    ) : null}
                </div>

                {/* Info Text - Spaced out */}
                <div className="mt-[140px]">
                    <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-satoshi leading-tight mb-[12px]`}>
                        Your amount will be credited in this selected mode of payment.
                    </p>

                    {/* Payment Container */}
                    <div
                        className={`w-[363px] h-[66px] rounded-[22px] flex items-center px-[10px] relative overflow-hidden ${isDarkMode ? '' : 'border border-[#E9EAEB]'}`}
                        style={{
                            backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.31)" : "transparent",
                            backdropFilter: isDarkMode ? "blur(25.02px)" : "none",
                            WebkitBackdropFilter: isDarkMode ? "blur(25.02px)" : "none",
                        }}
                    >
                        {/* Gradient Border Overlay - 0.63px */}
                        {isDarkMode && (
                            <div
                                className="absolute inset-0 pointer-events-none rounded-[22px]"
                                style={{
                                    padding: "0.63px",
                                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.20))",
                                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                    WebkitMaskComposite: "xor",
                                    maskComposite: "exclude",
                                }}
                            />
                        )}

                        {method.icon && (
                            <img src={method.icon} alt={method.name} className="w-[32px] h-[32px] object-contain shrink-0" />
                        )}
                        <div className={`flex flex-col flex-1 ${(method.icon || method.id === 'upi-id') ? 'ml-[12px]' : ''}`}>
                            <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-sans`}>
                                {method.name}
                            </span>
                            {method.subtitle && (
                                <span className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-[12px] font-medium font-sans`}>
                                    {method.subtitle}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 pb-10 flex flex-col gap-3 z-10">
                <button
                    onClick={handleVerify}
                    disabled={!isComplete || loading || ((stateMethod?.id === 'upi-id' || stateMethod?.id === 'gpay' || stateMethod?.id === 'phonepe') && !actualUpiId)}
                    className={`w-full h-[48px] rounded-full text-white text-[16px] font-medium flex items-center justify-center transition-all ${isComplete && !loading && (!((stateMethod?.id === 'upi-id' || stateMethod?.id === 'gpay' || stateMethod?.id === 'phonepe')) || actualUpiId) ? "active:scale-95 opacity-100" : "opacity-30 pointer-events-none"
                        }`}
                    style={{
                        backgroundColor: "#5260FE"
                    }}
                >
                    {loading ? "Processing..." : "Withdraw"}
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className={`w-full h-[48px] rounded-full ${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-medium active:scale-95 transition-transform flex items-center justify-center ${isDarkMode ? '' : 'bg-[#F2F2F2] border border-[#E9EAEB]'}`}
                    style={isDarkMode ? {
                        backgroundImage: `url(${cancelCta})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat"
                    } : {}}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default WithdrawOTP;
