import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import backspaceIcon from "@/assets/backspace.png";
import { isWeakMpin } from "@/utils/validationUtils";

// Reusing InputOTP components from shadcn/ui
import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { OTPInputContext } from "input-otp";
import mpinInputSuccess from "@/assets/mpin-input-success.png";
import mpinInputError from "@/assets/mpin-input-error.png";
import { Button } from "@/components/ui/button";

// Custom Slot to handle masking
const MaskedInputOTPSlot = ({ index, className, style }: { index: number; className?: string; style?: React.CSSProperties }) => {
    const inputOTPContext = useContext(OTPInputContext);
    const slot = inputOTPContext?.slots[index];
    const char = slot?.char;

    return (
        <div
            className={className}
            style={style}
        >
            {char ? "*" : ""}
        </div>
    );
};

interface MpinSheetProps {
    onClose: () => void;
    mode?: 'verify' | 'change' | 'reset';
    onSuccess?: () => void;
}

const MpinSheet = ({ onClose, mode = 'verify', onSuccess }: MpinSheetProps) => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';
    const { mpin: storedMpin, setMpin: saveMpin } = useUser();

    // State for steps
    type Step = 'VERIFY_OLD' | 'CREATE_NEW' | 'SUCCESS';
    const [step, setStep] = useState<Step>(() => {
        if (mode === 'reset') return 'CREATE_NEW';
        return mode === 'change' ? 'VERIFY_OLD' : 'VERIFY_OLD';
    });

    // Verify State
    const [verifyMpin, setVerifyMpin] = useState("");
    const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Create State
    const [newMpin, setNewMpin] = useState("");
    const [confirmMpin, setConfirmMpin] = useState("");
    const [activeField, setActiveField] = useState<'new' | 'confirm'>('new');
    const [createError, setCreateError] = useState("");
    const [createSuccess, setCreateSuccess] = useState(false);

    const title = step === 'CREATE_NEW' ? "Change MPIN" : "Enter MPIN";

    // --- Step 1: Verify Logic ---
    useEffect(() => {
        if (step !== 'VERIFY_OLD') return;

        let timeoutId: NodeJS.Timeout;

        if (verifyMpin.length === 4) {
            if (verifyMpin === storedMpin) {
                setVerifyStatus('success');

                timeoutId = setTimeout(() => {
                    if (mode === 'change') {
                        setStep('CREATE_NEW');
                        // Reset create state just in case
                        setNewMpin("");
                        setConfirmMpin("");
                        setCreateError("");
                        setCreateSuccess(false);
                        setActiveField('new');
                    } else {
                        if (onSuccess) onSuccess();
                        // If simple verify mode, we might want to close or let parent handle
                    }
                }, 300);

            } else {
                setVerifyStatus('error');
                timeoutId = setTimeout(() => {
                    setVerifyMpin("");
                    setVerifyStatus('idle');
                }, 500);
            }
        } else {
            setVerifyStatus('idle');
        }

        return () => clearTimeout(timeoutId);
    }, [verifyMpin, storedMpin, onSuccess, mode, step]);

    // --- Step 2: Create Logic ---
    useEffect(() => {
        if (step !== 'CREATE_NEW') return;

        setCreateSuccess(false);
        setCreateError("");

        // 1. Check New MPIN Weakness (only if complete)
        if (newMpin.length === 4) {
            const check = isWeakMpin(newMpin);
            if (check.weak) {
                setCreateError("Let's stop you right there, try something less predictable?");
                return;
            }
        }

        // 2. Check Match (only if both complete)
        if (newMpin.length === 4 && confirmMpin.length === 4) {
            if (newMpin !== confirmMpin) {
                setCreateError("Bro... seriously? That's not even close.");
            } else {
                // Success!
                setCreateSuccess(true);
            }
        } else {
            // If typing new mpin and it's valid so far, clear error
            if (newMpin.length === 4 && !isWeakMpin(newMpin).weak) {
                setCreateError("");
            }
        }

    }, [newMpin, confirmMpin, step]);


    // --- Input Handlers ---
    const handleKeyPress = (key: string) => {
        if (step === 'VERIFY_OLD') {
            if (verifyMpin.length < 4) setVerifyMpin(prev => prev + key);
        } else if (step === 'CREATE_NEW') {
            if (activeField === 'new') {
                if (newMpin.length < 4) {
                    const next = newMpin + key;
                    setNewMpin(next);
                    // Auto-switch focus if filled
                    if (next.length === 4) setActiveField('confirm');
                }
            } else {
                if (confirmMpin.length < 4) setConfirmMpin(prev => prev + key);
            }
        }
    };

    const handleBackspace = () => {
        if (step === 'VERIFY_OLD') {
            setVerifyMpin(prev => prev.slice(0, -1));
        } else if (step === 'CREATE_NEW') {
            if (activeField === 'new') {
                setNewMpin(prev => prev.slice(0, -1));
            } else {
                setConfirmMpin(prev => prev.slice(0, -1));
                // Optional: Auto-switch back if empty? No, usually annoying.
            }
        }
    };

    const handleSave = () => {
        saveMpin(newMpin);
        if (onSuccess) onSuccess();
        onClose();
    };

    const KeypadButton = ({ label, onClick, icon }: { label?: string; onClick?: () => void; icon?: React.ReactNode }) => (
        <button
            onClick={onClick}
            className="w-[113px] h-[65px] bg-[#000000] rounded-xl flex items-center justify-center active:bg-white/10 transition-colors"
        >
            {icon ? icon : <span className="text-white font-bold font-sans text-[32px]">{label}</span>}
        </button>
    );

    const isPredictableError = createError.includes("predictable");
    const isMismatchError = createError.includes("close");

    // Light mode slot styling
    const getSlotBg = (status: 'idle' | 'success' | 'error' | 'active') => {
        if (!isDarkMode) return '#FFFFFF';
        return 'rgba(26, 26, 46, 0.5)';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end">
            {/* Full screen backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Animation Wrapper */}
            <div className="relative w-full h-[92%] animate-in slide-in-from-bottom duration-300">

                {/* Underlying Sheet (The Stacked Effect) */}
                <div
                    className="absolute top-0 left-4 right-4 bottom-0 rounded-t-[22px]"
                    style={{ backgroundColor: isDarkMode ? '#070511' : '#E5E5E5' }}
                />

                {/* Main Sheet */}
                <div
                    className="absolute top-[14px] left-0 right-0 bottom-0 rounded-t-[22px] overflow-hidden flex flex-col"
                    style={{ backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }}
                >

                    {/* Header */}
                    <div className="px-5 pt-4 flex items-center justify-between relative z-50">
                        <div className="w-[40px]" /> {/* Spacer */}
                        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-medium font-sans`}>{title}</h1>
                        <button
                            onClick={onClose}
                            className={`w-[40px] h-[40px] flex items-center justify-center rounded-full transition-colors ${isDarkMode ? 'bg-[#1C1C1E] active:bg-[#2C2C2E]' : 'bg-[#F2F2F7] active:bg-[#E5E5EA]'}`}
                        >
                            <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col items-center pt-[60px] gap-8 overflow-y-auto">

                        {/* STEP 1: VERIFY OLD */}
                        {step === 'VERIFY_OLD' && (
                            <>
                                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-normal font-sans`}>
                                    {mode === 'change' ? "Enter your current MPIN" : "Enter your MPIN"}
                                </span>

                                <div className="flex flex-col gap-4">
                                    <InputOTP maxLength={4} value={verifyMpin} readOnly>
                                        <InputOTPGroup className="gap-4">
                                            {[0, 1, 2, 3].map(index => (
                                                <MaskedInputOTPSlot
                                                    key={index}
                                                    index={index}
                                                    className={`flex items-center justify-center h-[54px] w-[81px] rounded-[12px] border-none text-[32px] font-bold transition-all bg-cover bg-center ring-1 ${isDarkMode ? 'text-white' : 'text-black'
                                                        } ${verifyStatus === 'error' ? 'ring-red-500' :
                                                            verifyStatus === 'success' ? 'ring-green-500' :
                                                                isDarkMode ? 'ring-white/10' : 'ring-black/10'
                                                        }`}
                                                    style={{
                                                        backgroundColor: getSlotBg(verifyStatus),
                                                        backgroundImage: verifyStatus === 'error' ? `url(${mpinInputError})` :
                                                            verifyStatus === 'success' ? `url(${mpinInputSuccess})` : undefined
                                                    }}
                                                />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>

                                    {mode !== 'change' && (
                                        <button
                                            onClick={() => navigate('/forgot-mpin')}
                                            className="text-[#5260FE]/80 text-[14px] underline underline-offset-2 self-start"
                                        >
                                            Forgot MPIN?
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* STEP 2: CREATE NEW */}
                        {step === 'CREATE_NEW' && (
                            <div className="flex flex-col items-center w-full px-6 gap-6">
                                {/* Section 1: Create */}
                                <div className="flex flex-col items-center gap-2 w-full">
                                    <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-normal font-sans`}>Create a secure 4 digit MPIN</span>
                                    <span className={`${isDarkMode ? 'text-[#545454]' : 'text-black/40'} text-[14px] font-normal font-sans text-center whitespace-nowrap`}>
                                        No birthdays, 0000s or '6969' please. We've seen it all.
                                    </span>

                                    <div onClick={() => setActiveField('new')} className="mt-2 cursor-pointer">
                                        <InputOTP maxLength={4} value={newMpin} readOnly>
                                            <InputOTPGroup className="gap-4">
                                                {[0, 1, 2, 3].map(index => (
                                                    <MaskedInputOTPSlot
                                                        key={index}
                                                        index={index}
                                                        className={`flex items-center justify-center h-[54px] w-[81px] rounded-[12px] border-none text-[32px] font-bold transition-all bg-cover bg-center ring-1 ${isDarkMode ? 'text-white' : 'text-black'
                                                            } ${isPredictableError ? 'ring-red-500' :
                                                                createSuccess ? 'ring-green-500' :
                                                                    activeField === 'new' ? 'ring-[#5260FE]' :
                                                                        isDarkMode ? 'ring-white/10' : 'ring-black/10'
                                                            }`}
                                                        style={{
                                                            backgroundColor: getSlotBg(isPredictableError ? 'error' : createSuccess ? 'success' : 'idle'),
                                                            backgroundImage: isPredictableError ? `url(${mpinInputError})` :
                                                                createSuccess ? `url(${mpinInputSuccess})` : undefined
                                                        }}
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                </div>

                                {/* Section 2: Re-enter */}
                                <div className="flex flex-col items-center gap-2 w-full">
                                    <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-normal font-sans`}>Re-enter MPIN</span>

                                    <div onClick={() => setActiveField('confirm')} className="cursor-pointer">
                                        <InputOTP maxLength={4} value={confirmMpin} readOnly>
                                            <InputOTPGroup className="gap-4">
                                                {[0, 1, 2, 3].map(index => (
                                                    <MaskedInputOTPSlot
                                                        key={index}
                                                        index={index}
                                                        className={`flex items-center justify-center h-[54px] w-[81px] rounded-[12px] border-none text-[32px] font-bold transition-all bg-cover bg-center ring-1 ${isDarkMode ? 'text-white' : 'text-black'
                                                            } ${isMismatchError ? 'ring-red-500' :
                                                                createSuccess ? 'ring-green-500' :
                                                                    activeField === 'confirm' ? 'ring-[#5260FE]' :
                                                                        isDarkMode ? 'ring-white/10' : 'ring-black/10'
                                                            }`}
                                                        style={{
                                                            backgroundColor: getSlotBg(isMismatchError ? 'error' : createSuccess ? 'success' : 'idle'),
                                                            backgroundImage: isMismatchError ? `url(${mpinInputError})` :
                                                                createSuccess ? `url(${mpinInputSuccess})` : undefined
                                                        }}
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>

                                    {(createError) && (
                                        <p className="text-red-500 text-[14px] font-normal text-center mt-1">{createError}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Success CTA - Rendered in main flow */}
                        {step === 'CREATE_NEW' && createSuccess && (
                            <div className="w-full mt-auto px-5 pb-10">
                                <Button
                                    onClick={handleSave}
                                    className="w-full h-[48px] bg-[#5260FE] hover:bg-[#5260FE]/90 text-white rounded-full text-[16px] font-medium"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        )}

                    </div>

                    {/* Footer / Keypad - Only render if NOT success */}
                    {!(step === 'CREATE_NEW' && createSuccess) && (
                        <div
                            className="rounded-t-[30px] p-[20px] pb-[40px]"
                            style={{ backgroundColor: isDarkMode ? '#05050B' : '#F2F2F7' }}
                        >
                            {/* Keypad */}
                            <div className="flex flex-col gap-[10px] items-center">
                                {/* Row 1 */}
                                <div className="flex gap-[10px]">
                                    <KeypadButton label="1" onClick={() => handleKeyPress("1")} />
                                    <KeypadButton label="2" onClick={() => handleKeyPress("2")} />
                                    <KeypadButton label="3" onClick={() => handleKeyPress("3")} />
                                </div>
                                {/* Row 2 */}
                                <div className="flex gap-[10px]">
                                    <KeypadButton label="4" onClick={() => handleKeyPress("4")} />
                                    <KeypadButton label="5" onClick={() => handleKeyPress("5")} />
                                    <KeypadButton label="6" onClick={() => handleKeyPress("6")} />
                                </div>
                                {/* Row 3 */}
                                <div className="flex gap-[10px]">
                                    <KeypadButton label="7" onClick={() => handleKeyPress("7")} />
                                    <KeypadButton label="8" onClick={() => handleKeyPress("8")} />
                                    <KeypadButton label="9" onClick={() => handleKeyPress("9")} />
                                </div>
                                {/* Row 4 */}
                                <div className="flex gap-[10px]">
                                    <div className="w-[113px] h-[65px]" /> {/* Empty */}
                                    <KeypadButton label="0" onClick={() => handleKeyPress("0")} />
                                    <KeypadButton
                                        onClick={handleBackspace}
                                        icon={<img src={backspaceIcon} alt="Backspace" className="w-[18px] h-[18px] object-contain" />}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MpinSheet;
