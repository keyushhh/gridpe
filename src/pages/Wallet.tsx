import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAsset } from "@/hooks/useAsset";

const Wallet = () => {
    const navigate = useNavigate();
    const { isWalletActivated } = useUser();
    const [activeTab, setActiveTab] = useState<'how-it-works' | 'refund-policy'>('how-it-works');

    const walletBg = useAsset("wallet-bg");
    const gridPeLogo = useAsset("pe-logo");
    const switchTabBackground = useAsset("switch-tab-bg");
    const selectedTabBackground = useAsset("selected-tab-bg");
    const primaryButton = useAsset("button-primary");

    useEffect(() => {
        if (isWalletActivated) {
            navigate('/wallet-created', { replace: true });
        }
    }, [isWalletActivated, navigate]);

    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${walletBg})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Header Container (Fixed) */}
            <div className="shrink-0 flex flex-col items-center w-full relative z-10">

                {/* Back Button Row */}
                <div className="w-full px-5 pt-12 flex items-center justify-start">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md z-20"
                    >
                        <ChevronLeft className="w-6 h-6 text-foreground" />
                    </button>
                </div>

                {/* Logo */}
                <div className="mt-[-20px] flex justify-center pointer-events-none">
                    <img
                        src={gridPeLogo}
                        alt="Grid.Pe"
                        style={{ width: '150px', height: '101px' }}
                    />
                </div>

                {/* Switch Tab */}
                <div
                    className="mt-[66px] relative flex items-center justify-center"
                    style={{
                        width: '362px',
                        height: '62px',
                        backgroundImage: `url(${switchTabBackground})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <div className="flex w-full h-full relative">
                        {/* Selection Indicator */}
                        <div
                            className={`absolute top-[4px] transition-all duration-300 ease-in-out flex items-center justify-center`}
                            style={{
                                width: '173px',
                                height: '54px',
                                backgroundImage: `url(${selectedTabBackground})`,
                                backgroundSize: '100% 100%',
                                backgroundRepeat: 'no-repeat',
                                left: 0,
                                transform: activeTab === 'how-it-works' ? 'translateX(4px)' : 'translateX(185px)'
                            }}
                        />

                        {/* Buttons */}
                        <button
                            onClick={() => setActiveTab('how-it-works')}
                            className="flex-1 relative z-10 h-full flex items-center justify-center text-white"
                        >
                            <span
                                className="font-sans font-bold text-[12px]"
                                style={{ opacity: activeTab === 'how-it-works' ? 1 : 0.5 }}
                            >
                                How it works
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('refund-policy')}
                            className="flex-1 relative z-10 h-full flex items-center justify-center text-white"
                        >
                            <span
                                className="font-sans font-bold text-[12px]"
                                style={{ opacity: activeTab === 'refund-policy' ? 1 : 0.5 }}
                            >
                                Refund Policy
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content (Scrollable) */}
            <div className="flex-1 w-full px-5 pt-[28px] overflow-y-auto no-scrollbar pb-[20px]">
                {/* Content Pointers */}
                <div className="flex flex-col gap-[24px]">
                    {activeTab === 'how-it-works' ? (
                        <>
                            {/* Point 1 */}
                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    <h3 className="text-foreground text-[16px] font-medium font-sans">
                                        Your amount is held, not charged
                                    </h3>
                                </div>
                                <p className="text-muted-foreground text-[14px] font-normal font-sans pl-[14px]">
                                    The money stays in your wallet and is only deducted after successful delivery.
                                </p>
                            </div>

                            {/* Point 2 */}
                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    <h3 className="text-white text-[16px] font-medium font-sans">
                                        You’re always in control
                                    </h3>
                                </div>
                                <p className="text-[#A4A4A4] text-[14px] font-normal font-sans pl-[14px]">
                                    Amount is released only after OTP-based delivery confirmation.
                                </p>
                            </div>

                            {/* Point 3 */}
                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    <h3 className="text-white text-[16px] font-medium font-sans">
                                        Cancel anytime before OTP
                                    </h3>
                                </div>
                                <p className="text-[#A4A4A4] text-[14px] font-normal font-sans pl-[14px]">
                                    No delivery = no deduction. Refunds are instant if you cancel before confirmation.
                                </p>
                            </div>

                            {/* Point 4 */}
                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    <h3 className="text-white text-[16px] font-medium font-sans">
                                        Withdraw anytime
                                    </h3>
                                </div>
                                <p className="text-[#A4A4A4] text-[14px] font-normal font-sans pl-[14px]">
                                    Transfer your wallet balance directly to your bank account — fast and secure.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Point 1 */}
                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    <h3 className="text-white text-[16px] font-medium font-sans">
                                        What happens if I cancel the order?
                                    </h3>
                                </div>
                                <p className="text-[#A4A4A4] text-[14px] font-normal font-sans pl-[14px]">
                                    You get a full refund instantly if it’s cancelled before the 30s timer after an order is placed. Note: Multiple cancellations may lead to a small cancellation fee which will be applicable on future order.
                                </p>
                            </div>

                            {/* Point 2 */}
                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    <h3 className="text-white text-[16px] font-medium font-sans">
                                        Is there any withdrawal fee?
                                    </h3>
                                </div>
                                <p className="text-[#A4A4A4] text-[14px] font-normal font-sans pl-[14px]">
                                    No! There’s no withdrawal fee. You are allowed to withdraw your entire wallet balance in your preferred source of payment.
                                </p>
                            </div>

                            {/* Point 3 */}
                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    <h3 className="text-white text-[16px] font-medium font-sans">
                                        Will my wallet be auto-charged?
                                    </h3>
                                </div>
                                <p className="text-[#A4A4A4] text-[14px] font-normal font-sans pl-[14px]">
                                    Never. We only deduct once your delivery is completed and verified by you.
                                </p>
                            </div>

                            {/* Point 4 */}
                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    <h3 className="text-white text-[16px] font-medium font-sans">
                                        Can I top up my Grid.Pe wallet?
                                    </h3>
                                </div>
                                <p className="text-[#A4A4A4] text-[14px] font-normal font-sans pl-[14px]">
                                    Yes! You can add money anytime for faster future orders. There are tiers to the wallet, which allows you to add higher amounts.
                                </p>
                            </div>

                            {/* Point 5 */}
                            <div className="flex flex-col gap-[4px]">
                                <div className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                    <h3 className="text-white text-[16px] font-medium font-sans">
                                        How long does a withdrawal take?
                                    </h3>
                                </div>
                                <p className="text-[#A4A4A4] text-[14px] font-normal font-sans pl-[14px]">
                                    Withdrawals are processed instantly, and should reflect in your source of payment method within 30 minutes.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Footer CTA (Fixed) */}
            <div className="shrink-0 px-5 pb-[30px] pt-4 w-full bg-transparent">
                <button
                    onClick={() => {
                        navigate('/wallet-created');
                    }}
                    className="w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans"
                    style={{
                        backgroundImage: `url(${primaryButton})`,
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                    }}
                >
                    Get Started
                </button>
            </div>

        </div>
    );
};

export default Wallet;
