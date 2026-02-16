import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import chevronIcon from "@/assets/chevron.svg";
import addIcon from "@/assets/add.svg";
import codeIcon from "@/assets/code.svg";
import upiIcon from "@/assets/upi.png";
import credIcon from "@/assets/cred.png";
import gpayIcon from "@/assets/gpay.png";
import phonepeIcon from "@/assets/phonepe.png";
import amazonIcon from "@/assets/amazon.png";
import hdfcLogo from "@/assets/hdfc-bank-logo.png";

// Mock payment methods data
interface PaymentMethod {
    id: string;
    name: string;
    icon: string;
    type: "upi" | "card" | "wallet" | "netbanking";
    linked: boolean;
    subtitle?: string;
    hasInput?: boolean;
    inputPlaceholder?: string;
}

const mockPaymentMethods: PaymentMethod[] = [
    // UPI Methods
    { id: "cred", name: "CRED UPI", icon: credIcon, type: "upi", linked: true },
    { id: "gpay", name: "Google Pay UPI", icon: gpayIcon, type: "upi", linked: true },
    { id: "phonepe", name: "PhonePe UPI", icon: phonepeIcon, type: "upi", linked: true },
    { id: "upi-id", name: "UPI ID", icon: "", type: "upi", linked: false, hasInput: true, inputPlaceholder: "Required" },
    // Cards
    { id: "hdfc-card", name: "3232 **** **** 5233", icon: hdfcLogo, type: "card", linked: true },
    // More Options
    { id: "amazon", name: "Amazon Pay Wallet", icon: amazonIcon, type: "wallet", linked: true },
    { id: "netbanking", name: "HDFC Netbanking", icon: hdfcLogo, type: "netbanking", linked: true, subtitle: "Savings account | 5233" },
];

const AddPaymentMethod = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { amount, flow, tier } = location.state || { amount: "0.00", flow: "add-money", tier: "" };

    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

    const hasLinkedMethods = mockPaymentMethods.some((m) => m.linked);
    const title = flow === "withdrawal" ? "Add Payment Method" : (hasLinkedMethods ? "Select Payment" : "Add Payment");

    const upiMethods = mockPaymentMethods.filter((m) => m.type === "upi");
    const cardMethods = mockPaymentMethods.filter((m) => m.type === "card");
    const moreMethods = mockPaymentMethods.filter((m) => m.type === "wallet" || m.type === "netbanking");

    const glassContainerStyle: React.CSSProperties = {
        backgroundColor: "rgba(25, 25, 25, 0.31)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "relative",
        borderRadius: "22px",
    };

    const StrokeOverlay = () => (
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

    const Divider = () => (
        <div className="w-[338px] h-[1px] bg-[#202020] mx-auto" />
    );

    const RadioButton = ({ selected }: { selected: boolean }) => (
        <div
            className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "border-[#6C72FF]" : "border-[#6C72FF]/50"
                }`}
        >
            {selected && (
                <div className="w-[12px] h-[12px] rounded-full bg-[#6C72FF]" />
            )}
        </div>
    );

    const handleProceed = () => {
        if (!selectedMethod) return;
        if (location.state?.flow === "withdrawal") {
            navigate("/select-payment-method", { state: { ...location.state, selectedMethod } });
        } else if (location.state?.flow === "upgrade") {
            navigate("/subscription-details", { state: { ...location.state, paymentMethod: selectedMethod }, replace: true });
        } else {
            navigate("/order-summary", { state: { ...location.state, paymentMethod: selectedMethod } });
        }
    };

    const renderPaymentRow = (method: PaymentMethod, isLast: boolean) => (
        <React.Fragment key={method.id}>
            <div
                className={`flex items-center h-[32px] cursor-pointer ${!isLast ? "mb-[9px]" : ""}`}
                onClick={() => method.linked && setSelectedMethod(method.id)}
            >
                {method.icon ? (
                    <img src={method.icon} alt={method.name} className="w-[32px] h-[32px] object-contain" />
                ) : method.hasInput ? (
                    <div className="w-[32px]" />
                ) : null}

                <div className="flex flex-col ml-[8px] flex-1 min-w-0">
                    <span className={`text-white text-[16px] font-bold font-sans leading-none ${method.subtitle ? "mb-[4px]" : ""}`}>
                        {method.name}
                    </span>
                    {method.subtitle && (
                        <span className="text-white/40 text-[12px] font-medium font-sans leading-none">
                            {method.subtitle}
                        </span>
                    )}
                </div>

                {method.hasInput && (
                    <input
                        type="text"
                        placeholder={method.inputPlaceholder}
                        className="ml-[5px] bg-transparent border-none outline-none text-white text-[14px] font-medium font-sans placeholder:text-[#FAFAFA]/30 flex-1"
                    />
                )}

                <div className="ml-auto pl-2">
                    {method.linked ? (
                        <RadioButton selected={selectedMethod === method.id} />
                    ) : (
                        <RadioButton selected={selectedMethod === method.id} />
                    )}
                </div>
            </div>
            {!isLast && <Divider />}
            {!isLast && <div className="h-[10px]" />}
        </React.Fragment>
    );

    return (
        <div
            className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom pb-8"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Header */}
            <div className="px-5 pt-4 flex items-center justify-between relative z-10 shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md relative z-20"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                <h1 className="text-white text-[22px] font-medium leading-[120%] font-satoshi absolute left-1/2 -translate-x-1/2">
                    {title}
                </h1>

                <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center pt-[34px] px-5">
                {/* UPI Header */}
                <div className="w-full flex items-center mb-[12px]">
                    <img src={upiIcon} alt="UPI" className="w-[32px] h-[32px] object-contain" />
                    <span className="ml-[14px] text-white text-[16px] font-bold font-sans">
                        Pay using any UPI App
                    </span>
                </div>

                {/* UPI Container */}
                <div
                    className="w-[363px] rounded-[22px] flex flex-col px-[10px] overflow-hidden"
                    style={{
                        ...glassContainerStyle,
                        height: "auto",
                        paddingTop: "9px",
                        paddingBottom: "15px",
                    }}
                >
                    <StrokeOverlay />
                    {upiMethods.map((method, i) =>
                        renderPaymentRow(method, i === upiMethods.length - 1)
                    )}
                </div>

                {/* Cards Section */}
                <div className="w-full mt-[36px] flex flex-col">
                    <span className="text-white text-[16px] font-bold font-sans mb-[12px]">
                        Cards
                    </span>

                    {cardMethods.length > 0 ? (
                        <div
                            className="w-[363px] rounded-[22px] flex flex-col px-[10px] overflow-hidden"
                            style={{
                                ...glassContainerStyle,
                                height: "auto",
                                paddingTop: "9px",
                                paddingBottom: "15px",
                            }}
                        >
                            <StrokeOverlay />
                            {cardMethods.map((method, i) =>
                                renderPaymentRow(method, i === cardMethods.length - 1)
                            )}
                        </div>
                    ) : (
                        <div
                            className="w-[363px] h-[66px] rounded-[22px] relative flex flex-col justify-center pl-[20px] pr-[13px] overflow-hidden"
                            style={glassContainerStyle}
                        >
                            <StrokeOverlay />
                            <div className="absolute right-[20px] top-1/2 -translate-y-1/2">
                                <img src={addIcon} alt="Add" className="w-[20px] h-[20px]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white text-[16px] font-bold font-sans leading-none mb-[6px]">
                                    Add a credit or debit card
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-white text-[12px] font-light font-sans leading-none">
                                        Incl.
                                    </span>
                                    <span className="text-white text-[12px] font-bold font-sans leading-none">
                                        ₹9 Processing Fee
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* More Payment Options */}
                <div className="w-full mt-[24px] flex flex-col">
                    <span className="text-white text-[16px] font-bold font-sans mb-[12px]">
                        More Payment Options
                    </span>

                    <div
                        className="w-[363px] rounded-[22px] flex flex-col px-[10px] overflow-hidden"
                        style={{
                            ...glassContainerStyle,
                            height: "auto",
                            paddingTop: "9px",
                            paddingBottom: "15px",
                        }}
                    >
                        <StrokeOverlay />
                        {moreMethods.map((method, i) =>
                            renderPaymentRow(method, i === moreMethods.length - 1)
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom CTAs */}
            <div className="px-5 mt-[32px] mb-[42px] flex flex-col gap-[12px]">
                <button
                    onClick={handleProceed}
                    disabled={!selectedMethod}
                    className={`w-full h-[48px] rounded-full text-white text-[16px] font-bold transition-all flex items-center justify-center ${selectedMethod
                        ? "bg-[#6C72FF] active:scale-95 shadow-lg shadow-[#6C72FF]/20"
                        : "bg-[#6C72FF]/40 cursor-not-allowed"
                        }`}
                >
                    Proceed
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="w-full h-[48px] rounded-full bg-transparent border border-[#2C2C2C] text-white text-[16px] font-bold active:scale-95 transition-transform flex items-center justify-center"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default AddPaymentMethod;