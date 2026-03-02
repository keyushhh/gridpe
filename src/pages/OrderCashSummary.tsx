import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { useTheme } from "next-themes";
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
import cardIcon from "@/assets/card-icon.svg";
import infoTipIcon from "@/assets/info-tip.svg";
import deliveryTipLightBg from "@/assets/delivery-tip-light.png";
import { SlideToPay } from "@/components/SlideToPay";
import AddressSelectionSheet from "@/components/AddressSelectionSheet";

import { supabase, USER_ID } from "@/lib/supabase";
import { createAddress, getAuthUserId } from "@/lib/addresses";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import { useUser } from "@/contexts/UserContext";

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
    plusCode?: string;
}

const OrderCashSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToaster } = useCustomToaster();
    const { amount } = location.state || { amount: "0.00" };
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';
    const { walletBalance } = useUser();
    const [isRewardsOpen, setIsRewardsOpen] = useState(false);
    const [isPayOpen, setIsPayOpen] = useState(false);
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
        // Construct a nice display string: House, Area, City - Zip
        // If displayAddress is already formatted well (like from Nominatim), we can use it,
        // but the user might want specific "House, Area" format.
        // The previous hardcoded one was: "C102, Pubali Estate, Guwahati - 781005"
        // My SavedAddress has: house, area, city, postcode.

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

    // Calculations
    const parsedAmount = parseFloat((amount || "0").toString().replace(/,/g, "")) || 0;
    const parsedRewardPoints = rewardApplied && rewardPoints ? parseInt(rewardPoints, 10) : 0;
    const deliveryFee = 30;
    const gst = parsedAmount * 0.18;
    const platformFee = 6.60;
    const totalAmount = parsedAmount - parsedRewardPoints + deliveryFee + gst + platformFee + tipAmount;

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
            const userId = await getAuthUserId();
            if (!userId) {
                showToaster("You must be logged in to place an order.", 'error');
                return;
            }

            if (totalAmount > walletBalance) {
                showToaster("Insufficient funds in wallet.", 'error');
                return;
            }

            let addressId = savedAddress?.id;

            if (!addressId && savedAddress) {
                // Address exists in state but not DB (e.g. from previous local storage structure or temp selection)
                // We must create it.
                try {
                    const newAddress = await createAddress({
                        user_id: userId,
                        label: savedAddress.tag,
                        apartment: savedAddress.house,
                        area: savedAddress.area,
                        landmark: savedAddress.landmark || "",
                        city: savedAddress.city,
                        state: savedAddress.state,
                        plus_code: savedAddress.plusCode || null,
                        latitude: 0, // Fallback if missing
                        longitude: 0, // Fallback if missing
                        contact_name: savedAddress.name,
                        contact_phone: savedAddress.phone
                    });
                    addressId = newAddress.id;

                    // Update local state to include the new ID to prevent re-creation
                    const updatedAddr = { ...savedAddress, id: addressId };
                    setSavedAddress(updatedAddr);
                    localStorage.setItem("gridpe_user_address", JSON.stringify(updatedAddr));

                } catch (err) {
                    console.error("Failed to save address before order", err);
                    showToaster("Failed to save address details. Please try again.", 'error');
                    return;
                }
            }

            if (!addressId) {
                showToaster("Please select a valid address.", 'error');
                return;
            }

            try {
                // VERIFICATION LOG:
                console.log("Creating Order with payload:", {
                    item_value: parsedAmount,
                    delivery_fee: deliveryFee,
                    delivery_tip: tipAmount,
                    gst: gst,
                    platform_fee: platformFee,
                    address_id: addressId,
                });

                const cleanedAmount = Math.round(totalAmount * 100) / 100;

                const { data: orderData, error: invokeError } = await supabase.functions.invoke('create-order', {
                    body: {
                        amount: cleanedAmount,
                        address_id: addressId,
                        order_type: 'CASH_ORDER',
                        transaction_type: 'held',
                        meta_data: {
                            item_value: parsedAmount,
                            delivery_fee: deliveryFee,
                            delivery_tip: tipAmount,
                            gst: gst,
                            platform_fee: platformFee,
                        }
                    }
                });

                if (invokeError) throw invokeError;
                if (orderData?.error) throw new Error(orderData.error);

                const orderStub = { id: orderData?.order_id || orderData?.id };

                navigate(`/order-details/${orderStub.id}`, {
                    state: {
                        totalAmount: totalAmount,
                        savedAddress: savedAddress,
                        order: orderStub
                    }
                });
            } catch (orderError: any) {
                // Retry Logic: If address ID is invalid (FK violation), try to create a new address record
                // Error code 23503 is foreign_key_violation in Postgres
                if (orderError?.code === '23503' || orderError?.message?.includes('foreign key constraint')) {
                    console.log("Stale address ID detected. Creating new address record...");
                    try {
                        const newAddress = await createAddress({
                            user_id: userId,
                            label: savedAddress.tag,
                            apartment: savedAddress.house,
                            area: savedAddress.area,
                            landmark: savedAddress.landmark || "",
                            city: savedAddress.city,
                            state: savedAddress.state,
                            plus_code: savedAddress.plusCode || null,
                            latitude: 0,
                            longitude: 0,
                            contact_name: savedAddress.name,
                            contact_phone: savedAddress.phone
                        });

                        const newAddressId = newAddress.id;
                        // Update local state
                        const updatedAddr = { ...savedAddress, id: newAddressId };
                        setSavedAddress(updatedAddr);
                        localStorage.setItem("gridpe_user_address", JSON.stringify(updatedAddr));

                        // Retry Order Creation
                        const cleanedRetryAmount = Math.round(totalAmount * 100) / 100;

                        const { data: retryData, error: retryInvokeError } = await supabase.functions.invoke('create-order', {
                            body: {
                                amount: cleanedRetryAmount,
                                address_id: newAddressId,
                                order_type: 'CASH_ORDER',
                                transaction_type: 'held',
                                meta_data: {
                                    item_value: parsedAmount,
                                    delivery_fee: deliveryFee,
                                    delivery_tip: tipAmount,
                                    gst: gst,
                                    platform_fee: platformFee,
                                }
                            }
                        });

                        if (retryInvokeError) throw retryInvokeError;
                        if (retryData?.error) throw new Error(retryData.error);

                        const retryOrderStub = { id: retryData?.order_id || retryData?.id };

                        navigate(`/order-details/${retryOrderStub.id}`, {
                            state: {
                                totalAmount: totalAmount,
                                savedAddress: updatedAddr,
                                order: retryOrderStub
                            }
                        });
                        return; // Success after retry
                    } catch (retryError) {
                        console.error("Retry failed", retryError);
                        // Fall through to generic error
                    }
                }

                throw orderError; // Re-throw if not recoverable or retry failed
            }
        } catch (error: any) {
            console.error("Failed to create order", error);
            showToaster(`Failed to place order: ${error.message || "Please try again."}`, 'error');
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
        backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.30)" : "#FFFFFF",
        backdropFilter: isDarkMode ? "blur(24px)" : "none",
        WebkitBackdropFilter: isDarkMode ? "blur(24px)" : "none",
        border: isDarkMode ? "0.65px solid rgba(255, 255, 255, 0.20)" : "1px solid #E9EAEB",
        borderRadius: "13px",
        boxShadow: "none"
    };

    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom relative"
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Purple Glow */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}

            <div className="flex-none px-5 pt-[24px] flex items-center justify-between z-10 mb-6">
                <button
                    onClick={() => navigate("/order-cash")}
                    className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md relative z-20 ${isDarkMode ? 'bg-white/10' : 'bg-white border border-[#E6E8EB]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Order Cash
                </h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 space-y-[10px] no-scrollbar pb-[280px] relative z-10">
                {/* Address Container */}
                <div
                    style={containerStyle}
                    className="w-full relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => setIsAddressSheetOpen(true)}
                >
                    <div
                        className="flex items-start py-[11px] px-[12px]"
                    >
                        <div
                            className={`w-[52px] h-[52px] shrink-0 flex items-center justify-center mr-[12px] ${!isDarkMode ? 'bg-white border border-black rounded-full' : ''}`}
                            style={isDarkMode ? {
                                backgroundImage: `url(${circleButtonBg})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center'
                            } : {}}
                        >
                            <img src={locationIcon} alt="Location" className={`w-[22px] h-[22px] ${!isDarkMode ? 'brightness-0' : ''}`} />
                        </div>
                        <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between">
                                <span className={`text-[16px] font-medium font-sans capitalize ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {savedAddress ? savedAddress.tag : "No Address"}
                                </span>
                                <img
                                    src={chevronDownIcon}
                                    alt="Toggle"
                                    className={`w-4 h-4 ${!isDarkMode ? 'brightness-0' : ''}`}
                                />
                            </div>
                            <p className={`text-[14px] font-normal font-sans mt-1 leading-tight line-clamp-2 ${isDarkMode ? 'text-white/80' : 'text-black'}`}>
                                {getAddressDisplay()}
                            </p>
                        </div>
                    </div>
                </div>

                <div style={containerStyle} className="w-full py-[11px] px-[12px] flex items-center justify-between">
                    <div className="flex items-center gap-[12px]">
                        <div
                            className={`w-[52px] h-[52px] shrink-0 flex items-center justify-center ${!isDarkMode ? 'bg-white border border-black rounded-full' : ''}`}
                            style={isDarkMode ? {
                                backgroundImage: `url(${circleButtonBg})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center'
                            } : {}}
                        >
                            <img src={deliveryIcon} alt="Delivery" className={`w-[24px] h-[24px] ${!isDarkMode ? 'brightness-0' : ''}`} />
                        </div>
                        <div>
                            <p className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>Delivery</p>
                            <p className={`text-[14px] font-normal font-sans ${isDarkMode ? 'text-white/60' : 'text-black'}`}>Deliver now</p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100"
                        onClick={() => navigate("/schedule-delivery")}
                    >
                        <img src={calendarIcon} alt="Calendar" className={`w-[18px] h-[18px] ${!isDarkMode ? 'brightness-0' : ''}`} />
                        <span className={`text-[14px] font-medium font-sans underline underline-offset-2 ${isDarkMode ? 'text-white' : 'text-[#5260FE]'}`}>Want it later?</span>
                    </div>
                </div>

                <div className="py-2">
                    <p className={`text-[14px] font-medium font-sans ${isDarkMode ? 'text-white/50' : 'text-black'}`}>
                        Want more flexibility?
                    </p>
                    <p className={`text-[14px] font-normal font-sans mt-1 leading-tight ${isDarkMode ? 'text-white/50' : 'text-black'}`}>
                        Schedule your delivery for later and pick a time-slot that suits you the best.
                    </p>
                </div>

                <div style={containerStyle} className="w-full pt-[10px] px-[11px] pb-[12px]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>KYC Security Check</span>
                        <span className="text-[16px]">🔐</span>
                    </div>
                    <ul className={`list-disc pl-4 space-y-2 text-[13px] font-normal font-sans leading-snug ${isDarkMode ? 'text-white/80 marker:text-white/60' : 'text-black marker:text-black'}`}>
                        <li>Your KYC has been verified. Please keep your original ID ready when accepting your cash delivery.</li>
                        <li>Your delivery partner’s name, photo, and KYC details will be visible before drop-off.</li>
                        <li>Please verify their ID before accepting the cash.</li>
                    </ul>
                    <div className={`w-full h-[1px] my-3 ${isDarkMode ? 'bg-white/10' : 'bg-[#E6E8EB]'}`} />
                    <p className={`text-[12px] font-normal font-sans ${isDarkMode ? 'text-white/40' : 'text-black'}`}>
                        Both parties must match KYC details before the transaction is completed.
                    </p>
                </div>

                <div style={containerStyle} className="w-full overflow-hidden">
                    <button
                        className="w-full py-[13px] px-[12px] flex items-center justify-between"
                        onClick={() => setIsRewardsOpen(!isRewardsOpen)}
                    >
                        <span className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>Redeem Reward Points</span>
                        <img
                            src={chevronDownIcon}
                            alt="Toggle"
                            className={`w-4 h-4 transition-transform ${isRewardsOpen ? 'rotate-180' : ''} ${!isDarkMode ? 'brightness-0' : ''}`}
                        />
                    </button>
                    {isRewardsOpen && (
                        <div className="px-[12px] pb-[16px]">
                            <p className={`text-[14px] font-medium font-sans -mt-[7px] mb-[21px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                You have 12,000 points available
                            </p>
                            <div className="flex items-center gap-[12px]">
                                <div className="relative flex-1 h-[45px]">
                                    <input
                                        type="text"
                                        value={rewardPoints}
                                        onChange={handleRewardChange}
                                        placeholder="Enter reward points"
                                        className={`w-full h-full rounded-full px-4 font-sans text-[12px] focus:outline-none border ${isDarkMode ? 'bg-white/5 text-white border-white/20' : 'bg-white text-black border-[#E6E8EB]'} ${rewardError ? 'border-[#FF3B30]' : ''}`}
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
                                    className={`shrink-0 flex items-center justify-center transition-opacity active:scale-95 disabled:opacity-50 rounded-full ${!isDarkMode ? 'bg-black' : ''}`}
                                    style={isDarkMode ? {
                                        width: "102px",
                                        height: "45px",
                                        backgroundImage: `url(${applyButtonBg})`,
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center'
                                    } : {
                                        width: "102px",
                                        height: "45px"
                                    }}
                                >
                                    <span className="text-white text-[14px] font-bold font-sans">
                                        {rewardApplied ? "Applied" : "Apply"}
                                    </span>
                                </button>
                            </div>
                            <p className={`text-[12px] font-normal font-sans mt-2 ${rewardError ? 'text-[#FF3B30]' : isDarkMode ? 'text-white/40' : 'text-black'}`}>
                                {rewardError || "Minimum 500 points to redeem"}
                            </p>
                        </div>
                    )}
                </div>

                {isTipContainerVisible && (
                    <div
                        style={containerStyle}
                        className="w-full overflow-hidden"
                    >
                        <div
                            className={`flex items-center justify-between px-[12px] ${isTipCollapsed ? 'py-[14px]' : 'pt-[14px] pb-[2px]'}`}
                            onClick={() => {
                                if (isTipCollapsed) setIsTipCollapsed(false);
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>Delivery Tip</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeliveryTipPopup(true);
                                    }}
                                    className="flex items-center justify-center w-[16px] h-[16px]"
                                >
                                    <img src={isDarkMode ? deliveryInfoIcon : infoTipIcon} alt="Info" className={`w-full h-full ${!isDarkMode ? '' : 'brightness-0 opacity-100 invert-[38%] sepia-[68%] saturate-[3440%] hue-rotate-[197deg] brightness-[102%] contrast-[106%]'}`} style={isDarkMode ? { filter: 'none' } : {}} />
                                </button>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCollapseTip();
                                }}
                            >
                                <img
                                    src={chevronDownIcon}
                                    alt="Collapse"
                                    className={`w-4 h-4 transition-transform duration-200 ${!isTipCollapsed ? 'rotate-180' : ''} ${!isDarkMode ? 'brightness-0' : ''}`}
                                />
                            </button>
                        </div>

                        {!isTipCollapsed && (
                            <div className="px-[12px] pb-[16px]">
                                <p className={`text-[13px] font-normal font-sans mb-5 leading-snug ${isDarkMode ? 'text-white/80' : 'text-black'}`}>
                                    A small tip, goes a big way! Totally optional — but your rider will appreciate it ❤️
                                </p>
                                <div className="flex items-center gap-3">
                                    {['10', '20', '30'].map((val) => (
                                        <div key={val} className="relative shrink-0" style={{ width: '74px', height: '38px' }}>
                                            <button
                                                onClick={() => handleTipSelect(val)}
                                                className={`relative block w-full h-full transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none ${val === '20' ? 'rounded-[19px]' : ''} ${!isDarkMode ? 'rounded-full' : ''}`}
                                                style={isDarkMode ? {
                                                    backgroundImage: `url(${selectedTipOption === val ? selectedPillBg : pillBg})`,
                                                    backgroundSize: '100% 100%',
                                                    backgroundRepeat: 'no-repeat',
                                                    boxSizing: 'border-box'
                                                } : { backgroundColor: selectedTipOption === val ? '#5260FE' : '#FFFFFF', border: '1px solid #E6E8EB' }}
                                            >
                                                {/* Content Wrapper */}
                                                <div
                                                    className={`absolute left-0 right-0 flex justify-center items-center gap-[10px] z-20 ${val === '20' ? 'top-[2px]' : 'top-1/2 -translate-y-1/2'}`}
                                                >
                                                    <span className={`font-medium font-sans text-[15px] leading-none ${isDarkMode || selectedTipOption === val ? 'text-white' : 'text-black'}`}>
                                                        ₹{val}
                                                    </span>

                                                    {selectedTipOption === val && (
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleClearTip(e);
                                                                setIsTipContainerVisible(false);
                                                            }}
                                                            className="cursor-pointer hover:opacity-80 flex items-center justify-center w-[12px] h-[12px]"
                                                        >
                                                            <img src={crossIcon} alt="Remove" className="w-full h-full object-contain" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Most Tipped Banner - Only for 20 */}
                                                {val === '20' && (
                                                    <div className="absolute top-[23px] left-0 right-0 h-[14px] bg-[#5260FE] flex items-center justify-center z-10 pointer-events-none">
                                                        <span className="text-white text-[7px] font-bold font-sans uppercase tracking-wider leading-none">
                                                            MOST TIPPED
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                    <div className="relative shrink-0" style={{ width: '74px', height: '38px' }}>
                                        <button
                                            onClick={() => handleTipSelect('other')}
                                            className={`relative flex items-center justify-center transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none ${selectedTipOption === 'other' ? 'flex-row gap-[10px]' : ''} ${!isDarkMode ? 'rounded-full' : ''}`}
                                            style={isDarkMode ? {
                                                width: '74px',
                                                height: '38px',
                                                minWidth: '74px',
                                                minHeight: '38px',
                                                maxWidth: '74px',
                                                maxHeight: '38px',
                                                backgroundImage: `url(${selectedTipOption === 'other' ? selectedPillBg : pillBg})`,
                                                backgroundSize: '100% 100%',
                                                backgroundRepeat: 'no-repeat',
                                                boxSizing: 'border-box'
                                            } : {
                                                width: '74px',
                                                height: '38px',
                                                backgroundColor: selectedTipOption === 'other' ? '#5260FE' : '#FFFFFF',
                                                border: '1px solid #E6E8EB'
                                            }}
                                        >
                                            <span className={`font-medium font-sans text-[15px] z-20 relative leading-none ${isDarkMode || selectedTipOption === 'other' ? 'text-white' : 'text-black'}`}>Other</span>
                                            {selectedTipOption === 'other' && (
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClearCustomTip();
                                                    }}
                                                    className="z-30 cursor-pointer hover:opacity-80 flex items-center justify-center w-[12px] h-[12px]"
                                                >
                                                    <img src={crossIcon} alt="Remove" className="w-full h-full object-contain" />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {selectedTipOption === 'other' && (
                                    <div className={`mt-[15px] h-[48px] w-full rounded-full border flex items-center pl-4 pr-4 ${isDarkMode ? 'bg-[#191919] border-white/10' : 'bg-white border-[#E6E8EB]'}`}>
                                        <span className={`font-medium font-sans mr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>₹</span>
                                        <input
                                            type="text"
                                            placeholder="Enter tip amount"
                                            value={customTipValue}
                                            onChange={handleCustomTipChange}
                                            className={`bg-transparent font-sans text-[14px] focus:outline-none flex-1 ${isDarkMode ? 'text-white placeholder:text-white/30' : 'text-black placeholder:text-black/30'}`}
                                        />
                                        <button
                                            onClick={tipAmount > 0 ? handleClearCustomTip : handleApplyCustomTip}
                                            className="text-[#5260FE] text-[13px] font-medium font-sans ml-2"
                                        >
                                            {tipAmount > 0 ? "Clear" : "Apply"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div style={containerStyle} className="w-full overflow-hidden">
                    <div
                        className={`w-full px-[12px] flex flex-col cursor-pointer transition-all pt-[14px] ${isPayOpen ? 'pb-0' : 'pb-[14px]'}`}
                        onClick={() => setIsPayOpen(!isPayOpen)}
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <span className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>To Pay</span>
                                <span className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    +₹{amount}
                                </span>
                            </div>
                            <img
                                src={chevronDownIcon}
                                alt="Toggle"
                                className={`w-4 h-4 transition-transform duration-200 ${isPayOpen ? 'rotate-180' : ''} ${!isDarkMode ? 'brightness-0' : ''}`}
                            />
                        </div>
                        <p className={`text-[12px] font-normal font-sans mt-[6px] ${isDarkMode ? 'text-white/60' : 'text-black'}`}>
                            Incl. all taxes & charges
                        </p>
                        {isPayOpen && (
                            <div className="w-full mt-[10px]">
                                <div className={`w-full h-[1px] mb-[10px] ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E6E8EB]'}`} />
                                <div className="flex justify-between items-center mb-[2px]">
                                    <span className={`font-light font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Item Value</span>
                                    <span className={`font-bold font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{parsedAmount}</span>
                                </div>
                                {rewardApplied && (
                                    <div className="flex justify-between items-center mb-[2px]">
                                        <span className={`font-light font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Reward Points</span>
                                        <span className="text-[#FF3B30] font-bold font-sans text-[13px]">-₹{parsedRewardPoints}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className={`font-light font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Delivery Fee | 1.2 kms</span>
                                    <span className={`font-bold font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{deliveryFee}</span>
                                </div>
                                <p className={`font-light font-sans text-[13px] mt-[12px] mb-[8px] leading-snug ${isDarkMode ? 'text-white/50' : 'text-black'}`}>
                                    This fee fairly goes to our delivery partners for delivering your orders.
                                </p>
                                <div className={`w-full h-[1px] mb-[8px] ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E6E8EB]'}`} />
                                <div className="flex justify-between items-center mb-[2px]">
                                    <span className={`font-light font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Delivery Tip</span>
                                    {tipAmount > 0 ? (
                                        <span
                                            className={`font-bold font-sans text-[13px] cursor-pointer hover:underline ${isDarkMode ? 'text-white' : 'text-black'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsTipContainerVisible(true);
                                            }}
                                        >
                                            ₹{tipAmount}
                                        </span>
                                    ) : (
                                        <span
                                            className="text-[#5260FE] cursor-pointer font-medium font-sans text-[13px] relative z-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsTipContainerVisible(true);
                                                setIsTipCollapsed(false);
                                            }}
                                        >
                                            Add Tip
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center mb-[2px]">
                                    <span className={`font-light font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>GST (18%)</span>
                                    <span className={`font-bold font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{gst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-[8px]">
                                    <span className={`font-light font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Platform Fee</span>
                                    <span className={`font-bold font-sans text-[13px] ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{platformFee.toFixed(2)}</span>
                                </div>
                                <div className={`w-full h-[1px] mb-[8px] ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E6E8EB]'}`} />
                                <div className="flex justify-between items-center pb-[18px]">
                                    <span className={`font-medium font-sans text-[15px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Total Payable</span>
                                    <span className={`font-bold font-sans text-[15px] ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        )}
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
                    backgroundColor: isDarkMode ? "rgba(23, 23, 23, 0.31)" : "#FFFFFF",
                    borderTopLeftRadius: "32px",
                    borderTopRightRadius: "32px",
                    paddingTop: "26px",
                    paddingLeft: "20px",
                    paddingRight: "20px",
                    paddingBottom: "54px",
                    backdropFilter: isDarkMode ? "blur(24px)" : "blur(25px)",
                    WebkitBackdropFilter: isDarkMode ? "blur(24px)" : "blur(25px)",
                    boxShadow: "none",
                    borderTop: isDarkMode ? "none" : "1px solid #E9EAEB",
                    borderLeft: isDarkMode ? "none" : "1px solid #E9EAEB",
                    borderRight: isDarkMode ? "none" : "1px solid #E9EAEB",
                }}
            >
                <p className={`text-[18px] font-bold font-sans mb-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Amount will be held from wallet
                </p>
                <p className={`text-[16px] font-medium font-sans mb-[34px] ${totalAmount > walletBalance ? 'text-[#FF3B30]' : isDarkMode ? 'text-white' : 'text-black'}`}>
                    {totalAmount > walletBalance ? "Insufficient funds in wallet" : "You won’t be charged unless the delivery is completed."}
                </p>
                <SlideToPay onComplete={handlePay} disabled={!savedAddress || totalAmount > walletBalance} />
            </div>

            {/* Delivery Tip Popup */}
            {showDeliveryTipPopup && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div
                        className={`relative p-0 z-10 flex flex-col items-center ${isDarkMode ? 'rounded-2xl border border-white/10' : 'rounded-[13px] shadow-xl'}`}
                        style={{
                            width: isDarkMode ? '320px' : '362px',
                            height: isDarkMode ? 'auto' : '306px',
                            backgroundImage: isDarkMode ? `url(${popupBg})` : `url(${deliveryTipLightBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: 'transparent',
                        }}
                    >
                        <img
                            src={isDarkMode ? popupCardIcon : cardIcon}
                            alt="Delivery Tip"
                            className={`object-contain ${isDarkMode ? 'w-8 h-8 mb-4' : 'w-[30px] h-[30px] mt-[19px]'}`}
                        />

                        <h2 className={`font-sans ${isDarkMode ? 'text-[18px] font-medium mb-4 text-white' : 'text-[16px] font-bold mt-[15px] text-black'}`}>
                            Delivery Tip
                        </h2>

                        <div
                            className={`rounded-xl px-[12px] ${isDarkMode ? 'w-full py-[11px] bg-black' : 'w-[318px] h-[172px] mt-[24px] bg-white rounded-[16px] pt-[11px]'}`}
                        >
                            <p className={`font-sans leading-[140%] text-left mb-[6px] ${isDarkMode ? 'text-[13px] font-normal text-white' : 'text-[13px] font-normal text-black'}`}>
                                Our delivery partners ride through traffic, harsh weather, and long distances to bring your cash safely to your door.
                            </p>
                            <p className={`font-sans leading-[140%] text-left ${isDarkMode ? 'text-[13px] font-normal text-white' : 'text-[13px] font-normal text-black'}`}>
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
                        className={`relative z-10 mt-6 px-8 py-3 rounded-full flex items-center justify-center gap-2 ${isDarkMode ? '' : 'bg-[#5260FE] shadow-lg'}`}
                        style={isDarkMode ? {
                            backgroundImage: `url(${buttonCloseBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        } : {}}
                    >
                        <X className={`w-4 h-4 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                        <span className={`text-[14px] font-sans ${isDarkMode ? 'text-black' : 'text-white'}`}>Close</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrderCashSummary;
