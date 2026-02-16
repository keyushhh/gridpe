import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import locationIcon from "@/assets/location.svg";
import deliveryIcon from "@/assets/delivery.svg";
import calendarIcon from "@/assets/calendar.svg";
import chevronDownIcon from "@/assets/chevron-down.svg";
import circleButtonBg from "@/assets/circle-button.png";
import applyButtonBg from "@/assets/apply-button-bg.png";
import checkSvg from "@/assets/check.svg";
import pillBg from "@/assets/pill.png";
import selectedPillBg from "@/assets/selected-pill.png";
import crossIcon from "@/assets/cross-icon.png";
import deliveryInfoIcon from "@/assets/delivery-tip-info.svg";
import popupBg from "@/assets/popup-bg.png";
import buttonCloseBg from "@/assets/button-close.png";
import popupCardIcon from "@/assets/card-ico.svg";
import chevronSmall from "@/assets/chevron-small.svg";
import { SlideToPay } from "@/components/SlideToPay";
import AddressSelectionSheet from "@/components/AddressSelectionSheet";
import { createOrder } from "@/lib/orders";
import { createAddress } from "@/lib/addresses";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SavedAddress {
    id?: string;
    tag: string;
    house: string;
    area: string;
    landmark?: string;
    name: string;
    phone: string;
    displayAddress: string;
    city: string;
    state: string;
    postcode: string;
}

const FxExchangeSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Accept full FX state
    const {
        amount = 100,
        fxRate = 87.36,
        fromCurrency = 'USD',
        toCurrency = 'INR',
        convertedAmount = 0,
        markupAmount = 0,
        flatFee = 150,
        finalAmount = 0,
        markupPercent = 0.006,
        currencySymbols = {}
    } = location.state || {};

    const [isRewardsOpen, setIsRewardsOpen] = useState(false);
    const [isPayOpen, setIsPayOpen] = useState(true); // Default open for breakdown
    const [showDeliveryTipPopup, setShowDeliveryTipPopup] = useState(false);

    // Address State
    const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
    const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);

    React.useEffect(() => {
        const addressStr = localStorage.getItem("gridpe_user_address");
        if (addressStr) {
            try {
                setSavedAddress(JSON.parse(addressStr));
            } catch (e) {
                console.error("Failed to parse saved address", e);
            }
        }
    }, []);

    const handleAddressSelect = (address: SavedAddress | null) => {
        setSavedAddress(address);
        if (address) {
            setIsAddressSheetOpen(false);
        }
    };

    const getAddressDisplay = () => {
        if (!savedAddress) return "Add Address";
        const parts = [savedAddress.house, savedAddress.area, savedAddress.city];
        const base = parts.filter(Boolean).join(", ");
        if (savedAddress.postcode) {
            return `${base} - ${savedAddress.postcode}`;
        }
        return base;
    };

    // Rewards State
    const [rewardPoints, setRewardPoints] = useState("");
    const [rewardError, setRewardError] = useState("");
    const [rewardApplied, setRewardApplied] = useState(false);

    // Tip State
    const [isTipContainerVisible, setIsTipContainerVisible] = useState(false);
    const [isTipCollapsed, setIsTipCollapsed] = useState(false);
    const [selectedTipOption, setSelectedTipOption] = useState<string | null>(null);
    const [tipAmount, setTipAmount] = useState(0);
    const [customTipValue, setCustomTipValue] = useState("");

    // Total amount to be held from wallet is the source amount in INR (if applicable) 
    // or just the conversion amount. Usually FX checkout holds the source currency equivalent.
    // For this flow, we'll use 'amount' as the value to be held if from local wallet.
    const totalAmount = amount;

    const handleTipSelect = (option: string) => {
        setSelectedTipOption(option);
        if (option === "other") {
            setTipAmount(0);
        } else {
            setTipAmount(parseInt(option, 10));
        }
    };

    const handleClearTip = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedTipOption(null);
        setTipAmount(0);
        setCustomTipValue("");
    };

    const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            setCustomTipValue(val);
        }
    };

    const handleApplyCustomTip = () => {
        const val = parseInt(customTipValue, 10);
        if (!isNaN(val) && val > 0) {
            setTipAmount(val);
        }
    };

    const handleClearCustomTip = () => {
        setCustomTipValue("");
        setTipAmount(0);
        setSelectedTipOption(null);
        setIsTipContainerVisible(false);
    };

    const handleCollapseTip = () => {
        if (tipAmount > 0) {
            setIsTipCollapsed(!isTipCollapsed);
        } else {
            setIsTipContainerVisible(false);
            setIsTipCollapsed(false);
        }
    };

    const handlePay = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to place an order.");
                return;
            }

            let addressId = savedAddress?.id;

            if (!addressId && savedAddress) {
                try {
                    const newAddress = await createAddress({
                        user_id: user.id,
                        label: savedAddress.tag,
                        apartment: savedAddress.house,
                        area: savedAddress.area,
                        landmark: savedAddress.landmark || "",
                        city: savedAddress.city,
                        state: savedAddress.state,
                        plus_code: null,
                        latitude: 0,
                        longitude: 0,
                        contact_name: savedAddress.name,
                        contact_phone: savedAddress.phone
                    });
                    addressId = newAddress.id;
                    const updatedAddr = { ...savedAddress, id: addressId };
                    setSavedAddress(updatedAddr);
                    localStorage.setItem("gridpe_user_address", JSON.stringify(updatedAddr));
                } catch (err) {
                    console.error("Failed to save address before order", err);
                    toast.error("Failed to save address details. Please try again.");
                    return;
                }
            }

            if (!addressId) {
                toast.error("Please select a valid address.");
                return;
            }

            try {
                const order = await createOrder({
                    user_id: user.id,
                    amount: totalAmount,
                    address_id: addressId,
                    status: 'processing',
                    payment_mode: 'wallet',
                });

                navigate(`/fx-success/${order.id}`, {
                    state: {
                        totalAmount: totalAmount,
                        savedAddress: savedAddress,
                        order: order,
                        isFx: true
                    }
                });
            } catch (orderError: any) {
                if (orderError?.code === '23503' || orderError?.message?.includes('foreign key constraint')) {
                    try {
                        const newAddress = await createAddress({
                            user_id: user.id,
                            label: savedAddress.tag,
                            apartment: savedAddress.house,
                            area: savedAddress.area,
                            landmark: savedAddress.landmark || "",
                            city: savedAddress.city,
                            state: savedAddress.state,
                            plus_code: null,
                            latitude: 0,
                            longitude: 0,
                            contact_name: savedAddress.name,
                            contact_phone: savedAddress.phone
                        });

                        const newAddressId = newAddress.id;
                        const updatedAddr = { ...savedAddress, id: newAddressId };
                        setSavedAddress(updatedAddr);
                        localStorage.setItem("gridpe_user_address", JSON.stringify(updatedAddr));

                        const order = await createOrder({
                            user_id: user.id,
                            amount: totalAmount,
                            address_id: newAddressId,
                            status: 'processing',
                            payment_mode: 'wallet',
                        });

                        navigate(`/fx-success/${order.id}`, {
                            state: {
                                totalAmount: totalAmount,
                                savedAddress: updatedAddr,
                                order: order,
                                isFx: true
                            }
                        });
                        return;
                    } catch (retryError) {
                        console.error("Retry failed", retryError);
                    }
                }
                throw orderError;
            }
        } catch (error: any) {
            console.error("Failed to create order", error);
            toast.error(`Failed to place order: ${error.message || "Please try again."}`);
        }
    };

    const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            setRewardPoints(val);
            setRewardError("");
            if (rewardApplied) {
                setRewardApplied(false);
            }
        }
    };

    const handleApplyReward = () => {
        if (!rewardPoints) return;
        const points = parseInt(rewardPoints, 10);
        if (isNaN(points) || points < 500) {
            setRewardError("Minimum 500 points to redeem.");
            setRewardApplied(false);
        } else {
            setRewardError("");
            setRewardApplied(true);
        }
    };

    const containerStyle = {
        backgroundColor: "rgba(25, 25, 25, 0.30)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "0.65px solid rgba(255, 255, 255, 0.20)",
        borderRadius: "13px",
    };

    return (
        <div
            className="h-full w-full overflow-y-auto no-scrollbar scroll-smooth"
            style={{
                backgroundColor: "#0a0a12",
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="px-5 pt-6 flex items-center justify-between z-10 mb-6"
                style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}>
                <button
                    onClick={() => navigate("/fx-exchange")}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md relative z-20"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-white text-[24px] font-medium font-sans">
                    FX Exchange
                </h1>
                <div className="w-10" />
            </div>

            <div className="px-5 space-y-[10px] pb-[280px]">
                {/* Address Container */}
                <div
                    style={containerStyle}
                    className="w-full relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => setIsAddressSheetOpen(true)}
                >
                    <div className="flex items-start py-[11px] px-[12px]">
                        <div
                            className="w-[52px] h-[52px] shrink-0 flex items-center justify-center mr-[12px]"
                            style={{
                                backgroundImage: `url(${circleButtonBg})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center'
                            }}
                        >
                            <img src={locationIcon} alt="Location" className="w-[22px] h-[22px]" />
                        </div>
                        <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between">
                                <span className="text-white text-[16px] font-medium font-sans capitalize">
                                    {savedAddress ? savedAddress.tag : "No Address"}
                                </span>
                                <img
                                    src={chevronDownIcon}
                                    alt="Toggle"
                                    className="w-4 h-4"
                                />
                            </div>
                            <p className="text-white/80 text-[14px] font-normal font-sans mt-1 leading-tight line-clamp-2">
                                {getAddressDisplay()}
                            </p>
                        </div>
                    </div>
                </div>

                <div style={containerStyle} className="w-full py-[11px] px-[12px] flex items-center justify-between">
                    <div className="flex items-center gap-[12px]">
                        <div
                            className="w-[52px] h-[52px] shrink-0 flex items-center justify-center"
                            style={{
                                backgroundImage: `url(${circleButtonBg})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center'
                            }}
                        >
                            <img src={deliveryIcon} alt="Delivery" className="w-[24px] h-[24px]" />
                        </div>
                        <div>
                            <p className="text-white text-[14px] font-medium font-sans">Delivery</p>
                            <p className="text-white/60 text-[14px] font-normal font-sans">Deliver now</p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100"
                        onClick={() => navigate("/schedule-delivery")}
                    >
                        <img src={calendarIcon} alt="Calendar" className="w-[18px] h-[18px]" />
                        <span className="text-white text-[14px] font-medium font-sans underline underline-offset-2">Want it later?</span>
                    </div>
                </div>

                <div className="py-2">
                    <p className="text-white/50 text-[14px] font-medium font-sans">
                        Want more flexibility?
                    </p>
                    <p className="text-white/50 text-[14px] font-normal font-sans mt-1 leading-tight">
                        Schedule your delivery for later and pick a time-slot that suits you the best.
                    </p>
                </div>

                <div style={containerStyle} className="w-full pt-[10px] px-[11px] pb-[12px]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-white text-[16px] font-medium font-sans">KYC Security Check</span>
                        <span className="text-[16px]">🔐</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-2 text-white/80 text-[13px] font-normal font-sans leading-snug marker:text-white/60">
                        <li>Your KYC has been verified. Please keep your original ID ready when accepting your cash delivery.</li>
                        <li>Your delivery partner’s name, photo, and KYC details will be visible before drop-off.</li>
                        <li>Please verify their ID before accepting the cash.</li>
                    </ul>
                    <div className="w-full h-[1px] bg-white/10 my-3" />
                    <p className="text-white/40 text-[12px] font-normal font-sans">
                        Both parties must match KYC details before the transaction is completed.
                    </p>
                </div>

                <div style={containerStyle} className="w-full overflow-hidden">
                    <button
                        className="w-full py-[13px] px-[12px] flex items-center justify-between"
                        onClick={() => setIsRewardsOpen(!isRewardsOpen)}
                    >
                        <span className="text-white text-[16px] font-medium font-sans">Redeem Reward Points</span>
                        <img
                            src={chevronDownIcon}
                            alt="Toggle"
                            className={`w-4 h-4 transition-transform ${isRewardsOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {isRewardsOpen && (
                        <div className="px-[12px] pb-[16px]">
                            <p className="text-white text-[14px] font-medium font-sans -mt-[7px] mb-[21px]">
                                You have 12,000 points available
                            </p>
                            <div className="flex items-center gap-[12px]">
                                <div className="relative flex-1 h-[45px]">
                                    <input
                                        type="text"
                                        value={rewardPoints}
                                        onChange={handleRewardChange}
                                        placeholder="Enter reward points"
                                        className={`w-full h-full bg-white/5 rounded-[14px] px-4 text-white font-sans text-[12px] focus:outline-none border ${rewardError ? 'border-[#FF3B30]' : 'border-white/20'}`}
                                    />
                                    {rewardApplied && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <img src={checkSvg} alt="Applied" className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleApplyReward}
                                    disabled={!rewardPoints}
                                    className="shrink-0 flex items-center justify-center transition-opacity active:scale-95 disabled:opacity-50"
                                    style={{
                                        width: "102px",
                                        height: "45px",
                                        backgroundImage: `url(${applyButtonBg})`,
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    <span className="text-white text-[14px] font-bold font-sans">
                                        {rewardApplied ? "Applied" : "Apply"}
                                    </span>
                                </button>
                            </div>
                            <p className={`text-[12px] font-normal font-sans mt-2 ${rewardError ? 'text-[#FF3B30]' : 'text-white/40'}`}>
                                {rewardError || "Minimum 500 points to redeem"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Price Breakdown Container (Replaced "To Pay") */}
                <div
                    style={containerStyle}
                    className={`mt-[10px] w-full bg-[#191919]/[0.31] border border-white/5 backdrop-blur-[25px] overflow-hidden transition-all duration-300 relative ${isPayOpen ? 'h-[270px] rounded-[13px]' : 'h-[64px] rounded-[8px]'}`}
                >
                    {/* Header Section */}
                    <div className={`pt-[14px] px-[12px] flex justify-between items-start ${!isPayOpen ? 'pb-[12px]' : ''}`}>
                        <div className="text-left">
                            <h4 className="text-[15px] font-medium font-sans leading-tight text-white">Price Breakdown</h4>
                            <p className="text-[13px] text-white font-sans mt-[6px]">Incl. all taxes & charges</p>
                        </div>
                        <button
                            onClick={() => setIsPayOpen(!isPayOpen)}
                            className="w-6 h-6 flex items-center justify-center absolute top-[12px] right-[12px] active:scale-95 transition-transform"
                        >
                            <img
                                src={chevronSmall}
                                alt="Toggle"
                                className={`w-6 h-6 transition-transform duration-300 ${isPayOpen ? 'rotate-180' : 'rotate-0'}`}
                            />
                        </button>
                    </div>

                    <div className={`px-[12px] flex flex-col items-center transition-opacity duration-300 ${isPayOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {/* First Divider */}
                        <div className="h-[1px] bg-[#202020] w-[338px] mt-[10px]" />

                        <div className="w-full mt-[10px] flex flex-col gap-0 text-white">
                            {/* Base Rate */}
                            <div className="flex justify-between items-center h-[18px]">
                                <span className="text-[13px] font-regular font-sans">Base Rate</span>
                                <span className="text-[13px] font-bold font-sans">1 {fromCurrency} = {currencySymbols[toCurrency] || ''}{fxRate.toFixed(2)}</span>
                            </div>

                            {/* Amount Entered */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className="text-[13px] font-regular font-sans">
                                    Amount Entered: {currencySymbols[fromCurrency] || ''}{amount}
                                </span>
                                <span className="text-[13px] font-bold font-sans">
                                    {currencySymbols[toCurrency] || ''}{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Markup/Spread */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className="text-[13px] font-regular font-sans">Markup/Spread ({(markupPercent * 100).toFixed(2)}%)</span>
                                <span className="text-[13px] font-bold font-sans">
                                    - {currencySymbols[toCurrency] || ''}{markupAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Explanation Title */}
                            <p className="text-[13px] font-regular font-sans text-white/50 leading-tight mt-[12px]">
                                Markup/Spread ({(markupPercent * 100).toFixed(2)}%) – This is Grid.Pe's margin on conversion, lower than airport kiosks.
                            </p>

                            {/* Flat Fee */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className="text-[13px] font-regular font-sans">Flat Fee</span>
                                <span className="text-[13px] font-bold font-sans">
                                    - {currencySymbols[toCurrency] || ''}{flatFee}
                                </span>
                            </div>
                        </div>

                        {/* Second Divider */}
                        <div className="h-[1px] bg-[#202020] w-[338px] mt-[8px]" />

                        {/* Final Amount */}
                        <div className="w-full mt-[8px] flex justify-between items-center h-[20px] text-white">
                            <span className="text-[15px] font-medium font-sans">Final Amount You'll Receive</span>
                            <span className="text-[13px] font-bold font-sans">
                                {currencySymbols[toCurrency] || ''}{finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="h-4 flex-none" />
            </div>

            <AddressSelectionSheet
                isOpen={isAddressSheetOpen}
                onClose={() => setIsAddressSheetOpen(false)}
                onAddressSelect={handleAddressSelect}
            />

            <div
                className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom flex flex-col"
                style={{
                    height: "255px",
                    backgroundColor: "rgba(23, 23, 23, 0.31)",
                    borderTopLeftRadius: "32px",
                    borderTopRightRadius: "32px",
                    paddingTop: "26px",
                    paddingLeft: "20px",
                    paddingRight: "20px",
                    paddingBottom: "54px",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)"
                }}
            >
                <p className="text-white text-[18px] font-bold font-sans mb-[16px]">
                    Amount will be held from wallet
                </p>
                <p className="text-white text-[16px] font-medium font-sans mb-[34px]">
                    You won’t be charged unless the delivery is completed.
                </p>
                <SlideToPay onComplete={handlePay} disabled={!savedAddress} />
            </div>

            {/* Delivery Tip Popup */}
            {showDeliveryTipPopup && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div
                        className="relative rounded-2xl p-6 max-w-[320px] w-full z-10 flex flex-col items-center text-center border border-white/10"
                        style={{
                            backgroundImage: `url(${popupBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <img src={popupCardIcon} alt="Delivery Tip" className="w-8 h-8 mb-4 object-contain" />
                        <h2 className="text-white text-[18px] font-medium mb-4 font-sans">Delivery Tip</h2>
                        <div className="bg-black rounded-xl w-full px-[12px] py-[11px]">
                            <p className="text-white text-[13px] font-normal font-sans leading-relaxed text-left mb-[6px]">
                                Our delivery partners ride through traffic, harsh weather, and long distances to bring your cash safely to your door.
                            </p>
                            <p className="text-white text-[13px] font-normal font-sans leading-relaxed text-left">
                                Tipping isn’t mandatory — but it goes directly to them and helps support their daily hustle, fuel, and hard work.
                                <br />
                                Even a small amount makes a big difference.
                                <br />
                                Every rupee = recognition. 💙
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowDeliveryTipPopup(false)}
                        className="relative z-10 mt-6 px-8 py-3 rounded-full flex items-center justify-center gap-2"
                        style={{
                            backgroundImage: `url(${buttonCloseBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <X className="w-4 h-4 text-foreground" />
                        <span className="text-foreground text-[14px] font-sans">Close</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default FxExchangeSummary;
