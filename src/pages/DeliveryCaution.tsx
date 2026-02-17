import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import warningBg from '@/assets/warning-background.png';
import cautionIcon from '@/assets/caution.svg';

import awaitingIcon from '@/assets/awaiting.svg';
import radioOn from '@/assets/radio-fill.svg';
import radioOff from '@/assets/radio-empty.svg';
import checkboxOn from '@/assets/check-box-selected.png';
import checkboxOff from '@/assets/check-box-outline-blank.png';
import { ChevronLeft } from 'lucide-react';
import bgDarkMode from '@/assets/bg-dark-mode.png';

const DeliveryCaution = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'caution' | 'mismatch' | 'identify' | 'verification_progress' | 'verification_success' | 'otp_display'>('caution');
    const [displayOtp] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
    const [selectedOption, setSelectedOption] = useState<string | null>('yes');
    const [isAgreed, setIsAgreed] = useState(false);
    const [isPhotoTaken, setIsPhotoTaken] = useState(false);

    useEffect(() => {
        if (step === 'verification_progress') {
            const timer = setTimeout(() => {
                setStep('verification_success');
            }, 15000); // 15 seconds

            return () => clearTimeout(timer);
        } else if (step === 'otp_display') {
            const timer = setTimeout(() => {
                navigate('/order-delivered');
            }, 15000); // 15 seconds

            return () => clearTimeout(timer);
        }
    }, [step, navigate]);

    const handleProceed = () => {
        if (step === 'caution') {
            setStep('mismatch');
        } else if (step === 'mismatch') {
            setStep('identify');
        } else if (step === 'identify') {
            setStep('verification_progress');
        } else if (step === 'verification_success') {
            // "Get OTP" action -> Show OTP Display
            setStep('otp_display');
        } else if (step === 'otp_display') {
            // Future: Handle OTP completion or navigation
            navigate('/');
        }
    };

    const handleBack = () => {
        if (step === 'identify') {
            setStep('mismatch');
            setIsPhotoTaken(false);
        } else if (step === 'mismatch') {
            setStep('caution');
        } else {
            navigate(-1);
        }
    };

    const handleCancel = () => {
        console.log("Cancelling delivery");
        navigate('/order-cancelled');
    };

    const handleTakePhoto = () => {
        setIsPhotoTaken(true);
    };

    const handleRetake = () => {
        setIsPhotoTaken(false);
    };

    return (
        <div
            className="fixed inset-0 w-full flex flex-col items-center bg-[#0a0a12] text-white safe-area-top overflow-y-auto"
            style={{
                backgroundImage: `url(${step === 'identify' ? bgDarkMode : warningBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {step === 'caution' ? (
                <>
                    {/* Header */}
                    <h1 className="mt-[60px] text-[22px] font-medium font-satoshi text-center">
                        Delivery Caution
                    </h1>

                    {/* Icon */}
                    <img
                        src={cautionIcon}
                        alt="Caution"
                        className="mt-[21px] w-[62px] h-[62px]"
                    />

                    {/* Sub-text */}
                    <h2 className="mt-[35px] text-[18px] font-bold font-satoshi text-center">
                        Identity Mismatch Detected
                    </h2>

                    {/* Note Container */}
                    <div className="mt-[32px] w-[362px] h-[79px] rounded-[13px] bg-white/[0.06] backdrop-blur-md border border-white/10 p-[11px] flex items-center">
                        <p className="text-[16px] font-normal font-satoshi leading-[120%] text-left opacity-90">
                            We couldn’t verify the delivery partner’s identity.
                            For your safety, please confirm whether you want to continue with this delivery.
                        </p>
                    </div>

                    {/* Options Container */}
                    <div className="mt-[10px] w-[362px] rounded-[13px] bg-white/[0.06] backdrop-blur-md border border-white/10 flex flex-col overflow-hidden">
                        <p className="px-[14px] pt-[8px] text-[14px] font-medium font-satoshi text-white">
                            Do you want to proceed with the delivery?
                        </p>

                        {/* Divider */}
                        <div className="mt-[14px] w-full h-[1px] bg-[#747474] opacity-23" />

                        {/* Option 1 */}
                        <button
                            onClick={() => setSelectedOption('yes')}
                            className="mt-[8px] px-[14px] flex items-center gap-[16px] w-full text-left"
                        >
                            <img
                                src={selectedOption === 'yes' ? radioOn : radioOff}
                                alt="Radio"
                                className="w-[20px] h-[20px]"
                            />
                            <span className="text-[14px] font-normal font-satoshi text-white">
                                Yes, let’s do this!
                            </span>
                        </button>

                        {/* Divider */}
                        <div className="mt-[9px] w-full h-[1px] bg-[#747474] opacity-23" />

                        {/* Option 2 */}
                        <button
                            onClick={() => setSelectedOption('no')}
                            className="mt-[8px] px-[14px] pb-[8px] flex items-center gap-[16px] w-full text-left h-full"
                        >
                            <img
                                src={selectedOption === 'no' ? radioOn : radioOff}
                                alt="Radio"
                                className="w-[20px] h-[20px]"
                            />
                            <span className="text-[14px] font-normal font-satoshi text-white">
                                No, I’d rather not gamble at my doorstep.
                            </span>
                        </button>
                    </div>

                    {/* Conditional Content */}
                    {selectedOption === 'no' && (
                        <div className="w-[362px] mt-[31px] px-[0px]">
                            <p className="text-[15px] font-bold font-satoshi text-white">
                                We’re so sorry for the inconvenience.
                            </p>
                            <p className="mt-[13px] text-[14px] font-normal font-satoshi text-white opacity-80 leading-relaxed">
                                The amount held in your wallet for this order will be refunded within 30 minutes if you proceed with the cancellation of the order. No additional charges.
                            </p>

                            <div className="mt-[26px] flex items-center gap-[14px]">
                                <img src={awaitingIcon} alt="Awaiting" className="w-[14px] h-[14px]" />
                                <span className="text-[12px] font-normal font-satoshi text-[#D0D0D0]">
                                    Awaiting delivery confirmation
                                </span>
                            </div>

                            <button
                                onClick={handleCancel}
                                className="mt-[50px] w-full h-[48px] rounded-full bg-[#1A1A1A] border border-white/10 text-white text-[16px] font-medium font-satoshi active:scale-[0.98] transition-transform"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {selectedOption === 'yes' && (
                        <div className="w-[362px] mt-[31px] px-[0px]">
                            <p className="text-[15px] font-bold font-satoshi text-white">
                                Please follow the on-screen instructions to go ahead with the delivery.
                            </p>

                            <button
                                onClick={handleProceed}
                                className="mt-[135px] w-full h-[48px] rounded-full bg-[#5260FE] text-white text-[16px] font-medium font-satoshi active:scale-[0.98] transition-transform"
                            >
                                Proceed
                            </button>
                        </div>
                    )}
                </>
            ) : step === 'mismatch' ? (
                /* Identity Mismatch Screen */
                <>
                    {/* Header */}
                    <h1 className="mt-[60px] text-[22px] font-medium font-satoshi text-center text-white">
                        Identity Mismatch
                    </h1>

                    {/* Icon */}
                    <img
                        src={cautionIcon}
                        alt="Caution"
                        className="mt-[21px] w-[62px] h-[62px]"
                    />

                    {/* Sub-text */}
                    <h2 className="mt-[24px] text-[18px] font-bold font-satoshi text-center text-white">
                        Proceed with Caution
                    </h2>

                    {/* Warning Note */}
                    <div className="mt-[24px] w-[362px] rounded-[13px] bg-white/[0.06] backdrop-blur-md border border-white/10 p-[16px]">
                        <p className="text-[14px] font-normal font-satoshi leading-[140%] text-left text-white/90">
                            You can continue with the delivery, but please confirm that you understand the risk. Grid.Pe will review this delivery part for safety, and the payout will be held temporarily.
                        </p>
                    </div>

                    {/* Checklist Container */}
                    <div className="mt-[12px] w-[362px] rounded-[13px] bg-black/20 backdrop-blur-md border border-white/5 p-[16px]">
                        <p className="text-[14px] font-bold font-satoshi text-white mb-[8px]">
                            Checklist:
                        </p>
                        <ol className="list-decimal list-outside pl-[16px] text-[13px] font-normal font-satoshi text-white/80 space-y-[4px] leading-[140%]">
                            <li>I confirm the rider does not fully match the verified KYC</li>
                            <li>I still want to proceed with this delivery</li>
                            <li>I agree to provide a photo of the person delivering the order</li>
                        </ol>
                    </div>

                    {/* Agreement Checkbox */}
                    <button
                        onClick={() => setIsAgreed(!isAgreed)}
                        className="mt-[24px] w-[362px] flex items-start gap-[12px] text-left"
                    >
                        <img
                            src={isAgreed ? checkboxOn : checkboxOff}
                            alt="Check"
                            className="w-[20px] h-[20px] mt-[2px]"
                        />
                        <span className="text-[13px] font-normal font-satoshi text-white/90 leading-[130%]">
                            I agree to all the points and will be responsible for this delivery if anything goes wrong.
                        </span>
                    </button>


                    {/* Actions */}
                    <div className="mt-auto mb-[40px] w-[362px] flex flex-col gap-[12px]">
                        <button
                            onClick={handleProceed}
                            disabled={!isAgreed}
                            className={`w-full h-[48px] rounded-full text-white text-[16px] font-medium font-satoshi transition-all ${isAgreed
                                ? 'bg-[#5260FE] active:scale-[0.98]'
                                : 'bg-[#5260FE]/50 cursor-not-allowed'
                                }`}
                        >
                            Proceed with Delivery
                        </button>

                        <button
                            onClick={handleCancel}
                            className="w-full h-[48px] rounded-full bg-[#1A1A1A] border border-white/10 text-white text-[16px] font-medium font-satoshi active:scale-[0.98] transition-transform"
                        >
                            Cancel Delivery
                        </button>
                    </div>
                </>
            ) : step === 'identify' ? (
                /* Identify Delivery Partner Screen */
                <>
                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className="absolute top-[60px] left-[24px] w-[40px] h-[40px] flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md active:scale-90 transition-transform z-10"
                    >
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>

                    {/* Header */}
                    <h1 className="mt-[120px] w-[362px] text-[26px] font-medium font-satoshi text-left leading-tight">
                        Identify Delivery Partner
                    </h1>

                    {/* Body Text 1 */}
                    <p className="mt-[16px] w-[362px] text-[14px] font-medium font-satoshi text-white/90">
                        Take a photo of the delivery partner
                    </p>

                    {/* Body Text 2 */}
                    <p className="mt-[11px] w-[362px] text-[12px] font-normal font-satoshi text-white leading-[140%]">
                        This helps us ensure your safety.<br />
                        Make sure their face is clearly visible and not blurry.
                    </p>

                    {/* Camera Viewport */}
                    <div className="mt-[24px] w-[360px] h-[387px] rounded-[13px] bg-black overflow-hidden relative border border-white/10">
                        {!isPhotoTaken ? (
                            <div className="w-full h-full flex items-center justify-center">
                                {/* Camera Placeholder */}
                                <div className="w-[60px] h-[60px] rounded-full border-2 border-white/20 flex items-center justify-center">
                                    <div className="w-[50px] h-[50px] rounded-full bg-white/10" />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-[#1E1E1E] flex items-center justify-center">
                                {/* Captured Photo Placeholder */}
                                <p className="text-white/50 text-[14px]">Photo Captured</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto mb-[40px] w-[362px] flex flex-col gap-[12px]">
                        {!isPhotoTaken ? (
                            <button
                                onClick={handleTakePhoto}
                                className="w-full h-[48px] rounded-full bg-[#5260FE] text-white text-[16px] font-medium font-satoshi active:scale-[0.98] transition-transform"
                            >
                                Take Photo
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleProceed} /* Assuming submit just proceeds for now */
                                    className="w-full h-[48px] rounded-full bg-[#5260FE] text-white text-[16px] font-medium font-satoshi active:scale-[0.98] transition-transform"
                                >
                                    Submit
                                </button>
                                <button
                                    onClick={handleRetake}
                                    className="w-full h-[48px] rounded-full bg-[#1A1A1A] border border-white/10 text-white text-[16px] font-medium font-satoshi active:scale-[0.98] transition-transform"
                                >
                                    Retake
                                </button>
                            </>
                        )}
                    </div>
                </>
            ) : (
                /* Verification Screens (Progress & Success) */
                <>
                    {/* Header */}
                    <h1 className="mt-[60px] text-[22px] font-medium font-satoshi text-center text-white">
                        Identity Mismatch
                    </h1>

                    {/* Icon */}
                    <img
                        src={cautionIcon}
                        alt="Caution"
                        className="mt-[21px] w-[62px] h-[62px]"
                    />

                    {/* Status Text */}
                    <h2 className="mt-[24px] text-[18px] font-bold font-satoshi text-center text-white">
                        {step === 'verification_progress' ? 'Verification in Progress' : 'Verification Succesful'}
                    </h2>

                    {/* Info Container */}
                    <div className="mt-[24px] w-[362px] rounded-[13px] bg-white/[0.06] backdrop-blur-md border border-white/10 p-[16px]">
                        <p className="text-[14px] font-normal font-satoshi leading-[140%] text-left text-white/90">
                            {step === 'verification_progress'
                                ? "We’re verifying this delivery for your safety. This usually takes under a minute."
                                : "We’ve recorded your confirmation and the rider’s identity evidence."
                            }
                        </p>
                        {step === 'verification_success' && (
                            <p className="mt-[16px] text-[14px] font-normal font-satoshi leading-[140%] text-left text-white/90">
                                Please submit the OTP to finish the delivery.
                            </p>
                        )}
                        {step === 'otp_display' && (
                            <p className="mt-[16px] text-[14px] font-normal font-satoshi leading-[140%] text-left text-white/90">
                                Please submit the OTP to finish the delivery.
                            </p>
                        )}
                    </div>

                    {/* Status Indicator / Action / OTP Display */}
                    <div className="mt-[24px] w-[362px]">
                        {step === 'verification_progress' ? (
                            <div className="flex items-center gap-[12px]">
                                <div className="relative flex items-center justify-center w-[14px] h-[14px]">
                                    <div className="absolute inline-flex h-full w-full rounded-full bg-[#FFD600] opacity-75 animate-ping"></div>
                                    <img src={awaitingIcon} alt="Awaiting" className="relative w-[14px] h-[14px] z-10" />
                                </div>
                                <span className="text-[13px] font-normal font-satoshi text-white/80">
                                    Awaiting rider verification
                                </span>
                            </div>
                        ) : step === 'otp_display' ? (
                            <>
                                {/* OTP Digits Container - Starts 20px below info container (which corresponds to mt-[24px] of this parent div really, or we can add mt here) */}
                                {/* The parent `div` has `mt-[24px]`. The previous sibling was `w-[362px]... p-[16px]`.
                                    The user asked for "otp container should start 20px below the first container."
                                    This parent div `mt-[24px]` separates it from the info container. so we are close.
                                    Let's use `mb-6` inside for spacing the OTP digits? Or just render them.
                                */}

                                <div className="w-full flex justify-center mb-[24px]">
                                    <div className="flex gap-2">
                                        {displayOtp.split('').map((digit, index) => (
                                            <div
                                                key={index}
                                                className="w-[48px] h-[64px] rounded-[7px] flex items-center justify-center text-white text-[32px] font-bold font-satoshi relative overflow-hidden"
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
                                                {digit}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status for OTP step */}
                                <div className="flex items-center gap-[12px]">
                                    <div className="relative flex items-center justify-center w-[14px] h-[14px]">
                                        <div className="absolute inline-flex h-full w-full rounded-full bg-[#FFD600] opacity-75 animate-ping"></div>
                                        <img src={awaitingIcon} alt="Awaiting" className="relative w-[14px] h-[14px] z-10" />
                                    </div>
                                    <span className="text-[13px] font-normal font-satoshi text-white/80">
                                        Awaiting delivery confirmation
                                    </span>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={handleProceed}
                                className="w-full h-[48px] rounded-full bg-transparent border border-white/20 text-white text-[16px] font-medium font-satoshi active:scale-[0.98] transition-transform"
                            >
                                Get OTP
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Spacer for bottom safe area */}
            <div className="h-[20px]" />
        </div>
    );
};

export default DeliveryCaution;
