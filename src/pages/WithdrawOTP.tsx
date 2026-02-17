import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
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

const WithdrawOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { phoneNumber } = useUser();
    const [otp, setOtp] = useState("");
    const { showToaster } = useCustomToaster();
    const [isVerified, setIsVerified] = useState(false);
    const { selectedMethod, amount } = location.state || {};

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

    const allMethods = [
        { id: "cred", name: "CRED UPI", icon: credIcon },
        { id: "gpay", name: "Google Pay UPI", icon: gpayIcon },
        { id: "phonepe", name: "PhonePe UPI", icon: phonepeIcon },
        { id: "upi-id", name: "UPI ID", subtitle: "Required" },
        { id: "hdfc-card", name: "3232 **** **** 5233", icon: hdfcLogo },
        { id: "amazon", name: "Amazon Pay Wallet", icon: amazonIcon },
        { id: "netbanking", name: "HDFC Netbanking", icon: hdfcLogo, subtitle: "Savings account | 5233" },
    ];

    const method = allMethods.find(m => m.id === selectedMethod) || allMethods[4]; // Default to HDFC card if not found

    const handleVerify = () => {
        if (isVerified) {
            // Flow: withdraw > failed > retry > success
            const attempts = parseInt(sessionStorage.getItem('withdrawal_attempts') || '0');

            if (attempts === 0) {
                // First attempt: Fail
                sessionStorage.setItem('withdrawal_attempts', '1');
                navigate("/wallet-withdraw-failed", { state: { ...location.state, amount } });
            } else {
                // Subsequent attempts: Success
                // Clear attempts for next time flow starts from scratch
                sessionStorage.removeItem('withdrawal_attempts');
                navigate("/wallet-withdraw-success", { state: { ...location.state, amount } });
            }
        } else if (otp.length === 6) {
            showToaster("Invalid OTP. Please enter 123456 for testing.", 'error');
        }
    };

    return (
        <div
            className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom pb-10"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Header */}
            <div className="px-5 pt-12 flex items-center justify-between relative z-10 shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md relative z-20"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-white text-[22px] font-medium leading-[120%] font-satoshi absolute left-1/2 -translate-x-1/2">
                    Withdraw
                </h1>
            </div>

            <div className="flex-1 flex flex-col px-5 pt-[34px]">
                {/* Sub-text - 34px below header */}
                <p className="text-white text-[16px] font-bold font-satoshi leading-tight mb-[25px]">
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
                                    className="w-[52px] h-[68px] rounded-[7px] border-none text-white text-[24px] font-bold relative overflow-hidden"
                                    style={{
                                        backgroundColor: "rgba(25, 25, 25, 0.31)",
                                        backdropFilter: "blur(23.51px)",
                                        WebkitBackdropFilter: "blur(23.51px)",
                                    }}
                                >
                                    {/* Gradient Border Overlay - 0.59px */}
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
                                </InputOTPSlot>
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                {/* Awaiting Row - 12px below input */}
                <div className="flex items-center justify-between w-full mt-3">
                    <div className="flex items-center gap-3">
                        <img src={isVerified ? verifiedCircleIcon : awaitingIcon} alt="Status" className="w-[20px] h-[20px]" />
                        <span className="text-white text-[12px] font-normal font-satoshi">
                            {isVerified ? "OTP Verified" : "Awaiting OTP verification"}
                        </span>
                    </div>
                    {!isVerified && (
                        <button className="text-[#5260FE] text-[14px] font-normal font-satoshi underline">
                            Resend OTP in 20s
                        </button>
                    )}
                </div>

                {/* Info Text - 176px below awaiting row */}
                <div className="mt-[176px]">
                    <p className="text-white text-[16px] font-bold font-satoshi leading-tight mb-[12px]">
                        Your amount will be credited in this selected mode of payment.
                    </p>

                    {/* Payment Container */}
                    <div
                        className="w-[363px] h-[66px] rounded-[22px] flex items-center px-[10px] relative overflow-hidden"
                        style={{
                            backgroundColor: "rgba(25, 25, 25, 0.31)",
                            backdropFilter: "blur(25.02px)",
                            WebkitBackdropFilter: "blur(25.02px)",
                        }}
                    >
                        {/* Gradient Border Overlay - 0.63px */}
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

                        {method.icon && (
                            <img src={method.icon} alt={method.name} className="w-[32px] h-[32px] object-contain shrink-0" />
                        )}
                        <div className={`flex flex-col flex-1 ${(method.icon || method.id === 'upi-id') ? 'ml-[12px]' : ''}`}>
                            <span className="text-white text-[16px] font-bold font-sans">
                                {method.name}
                            </span>
                            {method.subtitle && (
                                <span className="text-white/40 text-[12px] font-medium font-sans">
                                    {method.subtitle}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-10 flex flex-col gap-3">
                <button
                    onClick={handleVerify}
                    disabled={!isComplete}
                    className={`w-full h-[48px] rounded-full text-white text-[16px] font-medium flex items-center justify-center transition-all ${isComplete ? "active:scale-95 opacity-100" : "opacity-30 pointer-events-none"
                        }`}
                    style={{
                        backgroundColor: "#5260FE"
                    }}
                >
                    Withdraw
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="w-full h-[48px] rounded-full text-white text-[16px] font-medium active:scale-95 transition-transform flex items-center justify-center"
                    style={{
                        backgroundImage: `url(${cancelCta})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat"
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default WithdrawOTP;
