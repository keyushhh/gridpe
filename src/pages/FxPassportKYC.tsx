import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Camera, CheckCircle2, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import bgDarkMode from "@/assets/bg-dark-mode.png";

const FxPassportKYC = () => {
    const navigate = useNavigate();
    const { setPassportVerified } = useUser();
    const [step, setStep] = useState<'upload' | 'processing' | 'success'>('upload');
    const [files, setFiles] = useState<{ front: boolean; back: boolean }>({ front: false, back: false });

    const handleUpload = (type: 'front' | 'back') => {
        // Simulate file selection
        setFiles(prev => ({ ...prev, [type]: true }));
    };

    const handleSubmit = () => {
        setStep('processing');
        // Simulate API call
        setTimeout(() => {
            setPassportVerified(true);
            setStep('success');
        }, 3000);
    };

    return (
        <div
            className="min-h-screen w-full overflow-y-auto no-scrollbar scroll-smooth safe-area-bottom animate-in fade-in duration-500 relative"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                fontFamily: "'Satoshi', sans-serif"
            }}
        >
            {/* Header */}
            <div
                className="px-5 flex items-center justify-between z-10 mb-[21px] relative"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-white text-[22px] font-medium font-sans">
                    Passport Verification
                </h1>
                <div className="w-10" />
            </div>

            <div className="px-5 pb-10">
                {step === 'upload' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mt-8">
                            <h2 className="text-white text-[20px] font-bold">Scan your Passport</h2>
                            <p className="text-white/50 text-[14px] mt-2">Please upload clear photos of your passport pages.</p>
                        </div>

                        <div className="mt-10 space-y-6">
                            {/* Front Page */}
                            <div className="space-y-3">
                                <p className="text-white/70 text-[14px] font-medium ml-1">Front Page (Data Page)</p>
                                <button
                                    onClick={() => handleUpload('front')}
                                    className={`w-full aspect-[1.6/1] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${files.front ? 'border-[#5260FE] bg-[#5260FE]/5' : 'border-white/10 bg-white/5'
                                        }`}
                                >
                                    {files.front ? (
                                        <>
                                            <CheckCircle2 className="w-10 h-10 text-[#5260FE]" />
                                            <span className="text-white text-[14px] font-medium">Filename_Passport_Front.jpg</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                <Camera className="w-6 h-6 text-white/40" />
                                            </div>
                                            <span className="text-white/40 text-[14px] font-medium">Click to scan/upload</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Back Page */}
                            <div className="space-y-3">
                                <p className="text-white/70 text-[14px] font-medium ml-1">Back Page (Address Page)</p>
                                <button
                                    onClick={() => handleUpload('back')}
                                    className={`w-full aspect-[1.6/1] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${files.back ? 'border-[#5260FE] bg-[#5260FE]/5' : 'border-white/10 bg-white/5'
                                        }`}
                                >
                                    {files.back ? (
                                        <>
                                            <CheckCircle2 className="w-10 h-10 text-[#5260FE]" />
                                            <span className="text-white text-[14px] font-medium">Filename_Passport_Back.jpg</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                <Camera className="w-6 h-6 text-white/40" />
                                            </div>
                                            <span className="text-white/40 text-[14px] font-medium">Click to scan/upload</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mt-12">
                            <button
                                disabled={!files.front || !files.back}
                                onClick={handleSubmit}
                                className={`w-[362px] h-[54px] rounded-full text-white text-[16px] font-medium transition-all shadow-xl ${files.front && files.back ? 'bg-[#5260FE] shadow-[#5260FE]/20 active:scale-95' : 'bg-white/10 text-white/20'
                                    }`}
                            >
                                Submit Verification
                            </button>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="mt-20 flex flex-col items-center justify-center animate-in fade-in duration-700">
                        <div className="relative">
                            <Loader2 className="w-20 h-20 text-[#5260FE] animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-[#5260FE]/10 rounded-full blur-xl" />
                            </div>
                        </div>
                        <h3 className="mt-10 text-white text-[22px] font-bold">Verifying Details</h3>
                        <p className="mt-3 text-white/50 text-[15px] text-center max-w-[280px]">
                            Please wait while our system cross-checks your passport information.
                        </p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="mt-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="w-[100px] h-[100px] bg-[#5260FE]/10 rounded-full flex items-center justify-center">
                            <div className="w-[70px] h-[70px] bg-[#5260FE] rounded-full flex items-center justify-center shadow-2xl shadow-[#5260FE]/50">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        <h3 className="mt-10 text-white text-[24px] font-bold text-center">Passport Verified!</h3>
                        <p className="mt-4 text-white/60 text-[16px] text-center max-w-[300px] leading-relaxed">
                            Your identity has been successfully confirmed. You now have full access to International FX Exchange.
                        </p>

                        <div className="mt-12 w-full">
                            <button
                                onClick={() => navigate('/fx-exchange')}
                                className="w-[362px] h-[54px] bg-[#5260FE] rounded-full text-white text-[16px] font-medium active:scale-95 transition-transform shadow-xl shadow-[#5260FE]/20"
                            >
                                Open FX Exchange
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FxPassportKYC;
