import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import infoIcon from "@/assets/infopurple.svg";
import credLightIcon from "@/assets/cred-light.png";
import { SlideToPay } from "@/components/SlideToPay";

const OrderSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { amount, retry, paymentMethod } = location.state || { amount: "0.00", retry: false, paymentMethod: null };
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';

    const parsedAmount = parseFloat(amount) || 0;
    const processingFee = 5.0;
    const platformFee = 0.0;
    const totalPayable = parsedAmount + processingFee + platformFee;

    const containerStyle: React.CSSProperties = {
        backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.31)" : "#FFFFFF",
        backdropFilter: isDarkMode ? "blur(20px)" : "none",
        WebkitBackdropFilter: isDarkMode ? "blur(20px)" : "none",
        borderRadius: "22px",
        position: "relative",
        border: isDarkMode ? "none" : "1px solid #E9EAEB",
        boxShadow: isDarkMode ? "none" : "0px 4px 12px rgba(0,0,0,0.02)",
    };

    const StrokeOverlay22 = () => (
        <div
            className="absolute inset-0 pointer-events-none rounded-[22px]"
            style={{
                padding: "0.63px",
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))",
                WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
            }}
        />
    );

    const StrokeOverlay13 = () => (
        <div
            className="absolute inset-0 pointer-events-none rounded-[13px]"
            style={{
                padding: "0.63px",
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.20))",
                WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
            }}
        />
    );

    const Divider = () => (
        <div className={`w-full h-[1px] mx-auto ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E9EAEB]'}`} />
    );

    return (
        <div
            className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom pb-8 relative"
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Purple Glow (Top Center) */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}

            {/* Header */}
            <div className="px-5 pt-12 pb-2 flex items-center justify-between relative z-10 shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'bg-white/10 backdrop-blur-md' : 'bg-white border border-[#E9EAEB]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>

                <h1 className={`text-[19px] font-medium leading-[120%] font-sans absolute left-1/2 -translate-x-1/2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Order Summary
                </h1>

                <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center pt-[34px] px-5 relative z-10">
                {/* Payment Method Header */}
                <div className="w-full flex items-center mb-[12px]">
                    <span className={`text-[16px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Payment Method
                    </span>
                </div>

                {/* Payment Method Container */}
                <div
                    className="w-full h-[66px] rounded-[22px] flex items-center px-[15px] overflow-hidden"
                    style={containerStyle}
                >
                    {isDarkMode && <StrokeOverlay22 />}

                    {paymentMethod?.icon && (
                        <img
                            src={paymentMethod.id === 'cred' && !isDarkMode ? credLightIcon : paymentMethod.icon}
                            alt={paymentMethod.name}
                            className="w-[32px] h-[32px] object-contain"
                        />
                    )}
                    <span className={`ml-[20px] text-[16px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {paymentMethod?.name || "Selected Payment Method"}
                    </span>
                </div>

                {/* To Pay Container */}
                <div
                    className="w-full mt-[15px] flex flex-col px-[11px] py-[12px] overflow-hidden rounded-[13px]"
                    style={{ ...containerStyle, borderRadius: "13px", paddingTop: "12px", paddingBottom: "12px" }}
                >
                    {isDarkMode && <StrokeOverlay13 />}

                    <span className={`text-[16px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        To Pay
                    </span>

                    <p className={`text-[14px] font-normal font-sans mt-[6px] leading-tight ${isDarkMode ? 'text-white/60' : 'text-black'}`}>
                        No additional taxes apply. Processing fee is inclusive of all charges.
                    </p>

                    <div className="mt-[10px] mb-[10px]">
                        <Divider />
                    </div>

                    {/* Wallet Top Up */}
                    <div className="flex items-center justify-between w-full px-1">
                        <span className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Wallet top up
                        </span>
                        <span className={`text-[14px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            ₹{parsedAmount}
                        </span>
                    </div>

                    {/* Processing Fee */}
                    <div className="flex items-center justify-between w-full mt-[8px] px-1">
                        <div className="flex items-center gap-[6px]">
                            <span className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                Processing Fee
                            </span>
                            <img
                                src={infoIcon}
                                alt="Info"
                                className="w-[12px] h-[12px]"
                                style={!isDarkMode ? { filter: 'invert(34%) sepia(85%) saturate(2311%) hue-rotate(222deg) brightness(101%) contrast(101%)' } : {}}
                            />
                        </div>
                        <span className={`text-[14px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            ₹{processingFee.toFixed(2)}
                        </span>
                    </div>

                    {/* Platform Fee */}
                    <div className="flex items-center justify-between w-full mt-[8px] px-1">
                        <span className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Platform Fee
                        </span>
                        <span className={`text-[14px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            ₹{platformFee.toFixed(2)}
                        </span>
                    </div>

                    <div className="mt-[8px] mb-[8px]">
                        <Divider />
                    </div>

                    {/* Total Payable */}
                    <div className="flex items-center justify-between w-full px-1">
                        <span className={`text-[15px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Total Payable
                        </span>
                        <span className={`text-[15px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            ₹{totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Info Container */}
                <div
                    className="w-full mt-[14px] overflow-hidden rounded-[13px]"
                    style={{ ...containerStyle, borderRadius: "13px", paddingTop: "12px", paddingBottom: "12px" }}
                >
                    {isDarkMode && <StrokeOverlay13 />}

                    <div className="flex items-start gap-[10px] px-[14px]">
                        <img
                            src={infoIcon}
                            alt="Info"
                            className="w-[12px] h-[12px] mt-[4px]"
                            style={!isDarkMode ? { filter: 'invert(34%) sepia(85%) saturate(2311%) hue-rotate(222deg) brightness(101%) contrast(101%)' } : {}}
                        />

                        <p className={`text-[13px] font-normal font-sans leading-snug ${isDarkMode ? 'text-white/60' : 'text-[#000000]'}`}>
                            This fee helps cover gateway and transaction costs. UPI methods are free.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Slider CTA */}
            <div className="w-full px-5 pb-[20px]">
                <SlideToPay
                    onComplete={() => {
                        if (retry) {
                            // Pass the original entered amount for wallet credit
                            navigate('/wallet-topup-success', { state: { totalAmount: totalPayable, creditAmount: parsedAmount, paymentMethod } });
                        } else {
                            navigate('/wallet-topup-failed', { state: { amount } });
                        }
                    }}
                    label="Confirm and Place Order"
                />
            </div>
        </div>
    );
};

export default OrderSummary;
