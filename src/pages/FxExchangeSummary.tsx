import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ChevronRight } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { supabase, USER_ID } from "@/lib/supabase";
import { createAddress, getAuthUserId } from "@/lib/addresses";
import bgLight from "@/assets/bg-light.png";
import currencyIcon from "@/assets/currency.svg";
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
import infoIcon from "@/assets/delivery-tip-info.svg";
import chevronSmall from "@/assets/chevron-small.svg";
import { SlideToPay } from "@/components/SlideToPay";
import AddressSelectionSheet from "@/components/AddressSelectionSheet";
import { SavedAddress } from "@/types";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import Map, { Marker } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import { calculateDistance, HUB_COORDS, normalizeCity } from "@/lib/utils";
import { setBadge } from "@/utils/badge";
import { useWebScroll } from "@/hooks/useWebScroll";

const FxExchangeSummary = () => {
  const { containerOverflow } = useWebScroll();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToaster } = useCustomToaster();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";
    const { walletBalance, rewardPoints: availableRewardPoints, refreshBalance } = useUser();

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

    // No longer fetching wallet data here, using walletBalance from UserContext
    const hasInsufficientBalance = amount > walletBalance;

    const [isRewardsOpen, setIsRewardsOpen] = useState(false);
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(true);
    const [isPayOpen, setIsPayOpen] = useState(true); // Default open for breakdown
    const [showDeliveryTipPopup, setShowDeliveryTipPopup] = useState(false);

    // Address State
    const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
    const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);

    useEffect(() => {
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
            return `${base} - ${savedAddress.postcode} `;
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
    const [timer, setTimer] = useState(600); // 10 minutes in seconds
    const [tipAmount, setTipAmount] = useState(0);
    const [customTipValue, setCustomTipValue] = useState("");

    // Dynamic Quote State
    const [quoteLoading, setQuoteLoading] = useState(true);
    const [quoteData, setQuoteData] = useState<{
        delivery_fee: number;
        platform_fee: number;
        gst: number;
        gst_rate: number;
        total_payable: number;
    } | null>(null);

    // Total amount to be held from wallet is the INR converted value (e.g., ₹923)
    // and not the source currency amount (e.g., $10).
    const rewardPointsValue = rewardApplied && rewardPoints ? parseInt(rewardPoints, 10) : 0;
    const rewardDiscount = rewardPointsValue * 0.025;
    const serviceAmount = (markupAmount || 0) + (flatFee || 0);

    // Fetch Quote
    React.useEffect(() => {
        const fetchQuote = async () => {
            setQuoteLoading(true);
            try {
                let distance = 1.2; // Fallback
                if (savedAddress?.latitude && savedAddress?.longitude) {
                    distance = calculateDistance(
                        HUB_COORDS.FX.lat,
                        HUB_COORDS.FX.lng,
                        savedAddress.latitude,
                        savedAddress.longitude
                    );
                }

                // For FX, p_amount is finalAmount (receive) and p_service_amount is (markup + flatFee)
                const { data, error } = await supabase.rpc('get_order_quote', {
                    p_amount: finalAmount,
                    p_order_type: 'fx',
                    p_service_amount: serviceAmount,
                    p_distance_km: parseFloat(distance.toFixed(2))
                });

                if (error) throw error;
                setQuoteData(data);
            } catch (err) {
                console.error("Failed to fetch FX order quote", err);
                showToaster("Failed to calculate order fees. Please try again.", 'error');
            } finally {
                setQuoteLoading(false);
            }
        };

        if (finalAmount > 0) {
            fetchQuote();
        } else {
            setQuoteLoading(false);
        }
    }, [finalAmount, serviceAmount]);

    const deliveryFee = quoteData?.delivery_fee || 0;
    const platformFee = quoteData?.platform_fee || 0;
    const gst = quoteData?.gst || 0;
    // Total hold amount = receive amount + all fees + gst + tips - rewards
    // Note: baseTotal from quote is receive + delivery + platform + gst. 
    // We add markup + flatFee (serviceAmount) and tips, and subtract rewards.
    const holdAmount = (finalAmount || 0) + serviceAmount + deliveryFee + platformFee + gst + tipAmount - rewardDiscount;
    const totalAmount = holdAmount;

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
            if (totalAmount > walletBalance) {
                showToaster("Insufficient wallet balance.", 'error');
                return;
            }

            let addressId = savedAddress?.id;

            if (!addressId && savedAddress) {
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
                        latitude: Number(savedAddress.latitude) || 0,
                        longitude: Number(savedAddress.longitude) || 0,
                        contact_name: savedAddress.name,
                        contact_phone: savedAddress.phone
                    });
                    addressId = newAddress.id;
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

            // Check Service Availability & Get Zone ID
            const { data: zoneId, error: zoneError } = await supabase.rpc('check_service_availability', {
                p_lat: Number(savedAddress?.latitude) || 0,
                p_lng: Number(savedAddress?.longitude) || 0
            });

            if (zoneError) {
                console.error("Zone check failed:", zoneError);
                showToaster("Failed to verify service availability. Please try again.", 'error');
                return;
            }

            if (!zoneId) {
                navigate('/not-available');
                return;
            }

            // NEW: Wallet Hold - Moves available_balance -> held_balance before order insert
            const { error: holdError } = await supabase.rpc('wallet_hold', {
                p_user_id: userId,
                p_amount: totalAmount,
                p_order_id: null,
                p_description: 'Order Placement Hold (FX)'
            });

            if (holdError) {
                console.error("Wallet hold failed:", holdError);
                showToaster(holdError.message || "Failed to secure funds. Please check your balance.", 'error');
                return;
            }


            const receiveAmount = finalAmount - tipAmount;
            const cleanedReceiveAmount = Math.round(receiveAmount * 100) / 100;
            const cleanedHoldAmount = Math.round(holdAmount * 100) / 100;

            // Calculate Dynamic Rider Earnings
            let riderEarnings = 0;
            let pickupLocation: string | null = null; // Hub UUID
            let pickupAddress: string | null = null; // Human-readable hub address

            try {
                let distance = 1.2;
                if (savedAddress?.latitude && savedAddress?.longitude) {
                    distance = calculateDistance(
                        HUB_COORDS.FX.lat,
                        HUB_COORDS.FX.lng,
                        savedAddress.latitude,
                        savedAddress.longitude
                    );

                    // NEW: Fetch active hubs for the user's city
                    const { data: hubs, error: hubsError } = await supabase
                        .from('hubs')
                        .select('id, location_name, city')
                        .eq('city', normalizeCity(savedAddress.city));


                    if (hubs && hubs.length > 0) {
                        // Use the first active hub for the city as coordinates are missing for individual hubs
                        const nearest = hubs[0];
                        pickupLocation = nearest.id;
                        pickupAddress = `${nearest.location_name}, ${nearest.city}`;
                    } else {
                        console.error('HUB FETCH FAILED: No active hubs found for city:', normalizeCity(savedAddress.city));
                    }
                }


                const { data: userProfile, error: userError } = await supabase
                    .from('profiles')
                    .select('phone')
                    .eq('id', userId)
                    .single();

                if (userError || !userProfile?.phone) {
                    throw new Error("Please add a phone number to your profile to proceed.");
                }

                const customerPhoneNumber = userProfile.phone;

                const deliveryAddressText = (savedAddress as any).address_line 
                    || (savedAddress as any).full_address 
                    || savedAddress?.tag 
                    || getAddressDisplay();

                const { data: earnings, error: earningsError } = await supabase.rpc('calculate_rider_earning', {
                    dist_km: parseFloat(distance.toFixed(2)),
                    cash_amount: finalAmount
                });

                if (!earningsError && earnings !== null) {
                    riderEarnings = parseFloat(earnings);
                } else {
                    console.error("Rider earnings RPC failed, using 0 fallback:", earningsError);
                }
            } catch (err) {
                console.error("Failed to calculate dynamic data:", err);
            }

            const createOrderDirectly = async (aid: string, rcvAmt: number, hldAmt: number, phone: string | null, pAddress: string | null, dAddressText: string) => {
                const payload = {
                    user_id: userId,
                    address_id: aid,
                    zone_id: zoneId, // Tagging with the zone_id from RPC
                    amount: rcvAmt, // What user receives
                    total_amount: hldAmt, // What is deducted/held from wallet
                    payment_mode: 'WALLET',
                    order_type: 'FX_EXCHANGE',
                    currency: 'INR',
                    status: 'pending',
                    type: 'fx',
                    rider_earnings: riderEarnings,
                    hub_id: pickupLocation, // Hub UUID
                    pickup_location: pAddress, // Human-readable Hub Address
                    delivery_address_text: dAddressText,
                    customer_phone_number: phone,
                    delivery_location: `POINT(${savedAddress?.longitude || 0} ${savedAddress?.latitude || 0})`,
                    otp_code: Math.floor(100000 + Math.random() * 900000).toString(),
                    delivery_fee: deliveryFee,
                    service_fee: platformFee, // Mapped from platformFee
                    gst: gst,
                    delivery_tip: tipAmount,
                    reward_points: rewardPointsValue,
                    meta_data: {
                        is_fx: true,
                        receive_amount: rcvAmt,
                        hold_amount: hldAmt,
                        from_currency: fromCurrency,
                        to_currency: toCurrency,
                        fx_rate: fxRate,
                        markup_amount: markupAmount,
                        flat_fee: flatFee,
                        source_amount: amount,
                        base_rate: fxRate,
                        markup: markupAmount,
                        delivery_fee: deliveryFee,
                        service_fee: platformFee,
                        gst: gst,
                        delivery_tip: tipAmount,
                        reward_points: rewardPointsValue,
                        delivery_address: dAddressText,
                        quote_id: quoteData ? 'RPC_FETCHED' : 'FALLBACK',
                        client_source: 'frontend_v1'
                    }
                };

                if (!payload.hub_id) console.error("DEBUG: hub_id is NULL");

                if (!payload.customer_phone_number) console.error("DEBUG: (FX) customer_phone_number fetch failed or is NULL");
                if (!payload.pickup_location) console.error("DEBUG: (FX) pickup_location (hub address) fetch failed or is NULL");
                if (!payload.delivery_address_text) console.error("DEBUG: (FX) delivery_address_text is NULL");



                const { data, error } = await supabase
                    .from('orders')
                    .insert([payload])
                    .select()
                    .single();

                if (error) {
                    console.error('Supabase FX Insert Error:', error);
                    throw new Error(`Database error: ${error.message || "Failed to insert order"}`);
                }

                if (!data) {
                    throw new Error("FX Order creation failed: No data returned from database.");
                }

                return data;
            };

            try {
                const { data: userProfile, error: profileError } = await supabase
                    .from('profiles')
                    .select('phone')
                    .eq('id', userId)
                    .single();

                if (profileError || !userProfile?.phone) {
                    throw new Error("A valid phone number is required to place an order.");
                }
                const customerPhoneNumber = userProfile.phone;

                const dAddressText = (savedAddress as any).address_line 
                    || (savedAddress as any).full_address 
                    || savedAddress?.tag 
                    || getAddressDisplay();

                const orderData = await createOrderDirectly(addressId, cleanedReceiveAmount, cleanedHoldAmount, customerPhoneNumber, pickupAddress, dAddressText);
                const finalOrderId = orderData.id;

                // Update app badge
                setBadge(1);

                // Refresh balance after successful order & hold
                await refreshBalance();

                navigate(`/fx-success/${finalOrderId}`, {
                    state: {
                        totalAmount: amount,
                        receiveAmount: receiveAmount,
                        savedAddress: savedAddress,
                        order: orderData,
                        isFx: true
                    }
                });
            } catch (orderError: any) {
                console.error("First FX order attempt failed:", orderError);

                // Handle Stale Address ID (Foreign Key Violation)
                const isAddressError = orderError.message?.toLowerCase().includes('foreign key') ||
                    orderError.message?.toLowerCase().includes('address_id') ||
                    orderError.code === '23503';

                if (isAddressError && savedAddress) {
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
                        const updatedAddr = { ...savedAddress, id: newAddressId };
                        setSavedAddress(updatedAddr);
                        localStorage.setItem("gridpe_user_address", JSON.stringify(updatedAddr));

                        const { data: retryProfile, error: retryError } = await supabase
                            .from('profiles')
                            .select('phone')
                            .eq('id', userId)
                            .single();

                        if (retryError || !retryProfile?.phone) {
                            throw new Error("A valid phone number is required to proceed.");
                        }

                        const retryPhone = retryProfile.phone;
                        const retryDAddressText = (updatedAddr as any).address_line 
                            || (updatedAddr as any).full_address 
                            || updatedAddr?.tag 
                            || getAddressDisplay();

                        const retryData = await createOrderDirectly(newAddressId, cleanedReceiveAmount, cleanedHoldAmount, retryPhone, pickupAddress, retryDAddressText);
                        const finalRetryOrderId = retryData.id;

                        if (finalRetryOrderId) {
                            setBadge(1);
                            navigate(`/fx-success/${finalRetryOrderId}`, {
                                state: {
                                    totalAmount: amount,
                                    receiveAmount: receiveAmount,
                                    savedAddress: updatedAddr,
                                    order: retryData,
                                    isFx: true
                                }
                            });
                            return; // Success after retry
                        }
                    } catch (retryErr: any) {
                        console.error("Retry failed", retryErr);
                        throw new Error(`Retry failed: ${retryErr.message}`);
                    }
                }

                throw orderError;
            }
        } catch (error: any) {
            console.error("Final catch in handlePay (FX):", error);
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
        } else if (points > availableRewardPoints) {
            setRewardError(`You only have ${availableRewardPoints.toLocaleString()} points.`);
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
        boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(0,0,0,0.05)"
    };

    const viewState = {
        latitude: 12.9716,
        longitude: 77.5946,
        zoom: 12,
    };

    return (
        <div
            className={`h-full w-full ${containerOverflow} flex flex-col safe-area-top safe-area-bottom relative`}
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Purple Glow Orb */}
            {!isDarkMode && (
                <div
                    className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0"
                />
            )}

            {/* Header */}
            <div
                className="flex-none px-5 pt-safe pt-4 flex items-center justify-between z-10 mb-6"
            >
                <BackButton onClick={() => navigate(-1)} />
                <h1 className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    FX Exchange
                </h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 space-y-[10px] no-scrollbar pb-[280px] relative z-10">


                {/* Address Section */}
                <div
                    style={containerStyle}
                    className="w-full relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => setIsAddressSheetOpen(true)}
                >
                    <div className="flex items-start py-[11px] px-[12px]">
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

                <div style={containerStyle} className="w-full py-[11px] px-[12px] flex items-center justify-between mt-[10px]">
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
                            <img src={deliveryIcon} alt="Delivery" className={`w-6 h-6 ${!isDarkMode ? 'brightness-0' : ''}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[14px] font-medium font-sans ${isDarkMode ? "text-white" : "text-black"}`}>
                                Standard Delivery
                            </span>
                            <span className={`text-[14px] font-normal font-sans ${isDarkMode ? "text-white/60" : "text-black"}`}>
                                Deliver now
                            </span>
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


                <div style={containerStyle} className="w-full pt-[10px] px-[11px] pb-[12px]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[16px] font-medium font-sans ${isDarkMode ? "text-white" : "text-black"}`}>KYC Security Check</span>
                        <span className="text-[16px]">ðŸ”</span>
                    </div>
                    <ul className={`list-disc pl-4 space-y-2 text-[13px] font-normal font-sans leading-snug ${isDarkMode ? "text-white/80 marker:text-white/60" : "text-black marker:text-black"}`}>
                        <li>Your KYC has been verified. Please keep your original ID ready when accepting your cash delivery.</li>
                        <li>Your delivery partner’s name, photo, and KYC details will be visible before drop-off.</li>
                        <li>Please verify their ID before accepting the cash.</li>
                    </ul>
                    <div className={`w-full h-[1px] my-3 ${isDarkMode ? "bg-white/10" : "bg-[#E6E8EB]"}`} />
                    <p className={`text-[12px] font-normal font-sans ${isDarkMode ? "text-white/40" : "text-black"}`}>
                        Both parties must match KYC details before the transaction is completed.
                    </p>
                </div>

                <div style={containerStyle} className="w-full overflow-hidden">
                    <button
                        className="w-full py-[13px] px-[12px] flex items-center justify-between"
                        onClick={() => setIsRewardsOpen(!isRewardsOpen)}
                    >
                        <span className={`text-[16px] font-medium font-sans ${isDarkMode ? "text-white" : "text-black"}`}>Redeem Reward Points</span>
                        <img
                            src={chevronDownIcon}
                            alt="Toggle"
                            className={`w-4 h-4 transition-transform ${isRewardsOpen ? 'rotate-180' : ''} ${!isDarkMode ? 'brightness-0' : ''}`}
                        />
                    </button>
                    {isRewardsOpen && (
                        <div className="px-[12px] pb-[16px]">
                            <p className={`text-[14px] font-medium font-sans -mt-[7px] mb-[21px] ${isDarkMode ? "text-white" : "text-black"}`}>
                                You have {availableRewardPoints.toLocaleString()} points available (₹{(availableRewardPoints * 0.025).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
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
                                {rewardError || (rewardApplied ? `Applied: ₹${rewardDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} discount` : "500 points = ₹12.50")}
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
                                    A small tip, goes a big way! Totally optional – but your rider will appreciate it â¤ï¸
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


                {/* Price Breakdown */}
                <div className={`mt-[18px] mb-[150px] ${isDarkMode ? "bg-[#191919]/[0.31] border-white/5" : "bg-white border-[#E6E8EB] shadow-sm"} border backdrop-blur-[25px] overflow-hidden transition-all duration-300 relative ${isBreakdownOpen ? 'h-[270px] rounded-[13px]' : 'h-[64px] rounded-[8px]'}`}>
                    {/* Header Section */}
                    <div className={`pt-[14px] px-[12px] flex justify-between items-start ${!isBreakdownOpen ? 'pb-[12px]' : ''}`}>
                        <div className="text-left">
                            <h4 className={`text-[15px] font-medium font-satoshi leading-tight ${isDarkMode ? "text-white" : "text-black"}`}>Price Breakdown</h4>
                            <p className={`text-[13px] font-satoshi mt-[6px] ${isDarkMode ? "text-white" : "text-black font-medium"}`}>Incl. all taxes & charges</p>
                        </div>
                        <button
                            onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                            className="w-6 h-6 flex items-center justify-center absolute top-[12px] right-[12px] active:scale-95 transition-transform"
                        >
                            <img
                                src={chevronSmall}
                                alt="Toggle"
                                className={`w-6 h-6 transition-transform duration-300 ${isBreakdownOpen ? 'rotate-180' : 'rotate-0'} ${!isDarkMode ? "invert" : ""}`}
                            />
                        </button>
                    </div>

                    <div className={`px-[12px] flex flex-col items-center transition-opacity duration-300 ${isBreakdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {/* First Divider */}
                        <div className={`h-[1px] ${isDarkMode ? "bg-[#202020]" : "bg-[#E6E8EB]"} w-[338px] mt-[10px]`} />

                        <div className="w-full mt-[10px] flex flex-col gap-0 text-[13px] font-satoshi">
                            {/* Base Rate */}
                            <div className="flex justify-between items-center h-[18px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>Base Rate</span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>1 {fromCurrency} = {currencySymbols[toCurrency] || ''}{fxRate.toFixed(2)}</span>
                            </div>

                            {/* Amount Entered */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>
                                    Amount Entered: {currencySymbols[fromCurrency] || ''}{amount}
                                </span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                    {currencySymbols[toCurrency] || ''}{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Markup/Spread */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>Markup/Spread (0.60%)</span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                    - {currencySymbols[toCurrency] || ''}{markupAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Explanation Title */}
                            <p className={`text-[13px] font-regular leading-tight mt-[12px] ${isDarkMode ? "text-white/50" : "text-black"}`}>
                                Markup/Spread (0.60%) — This is Grid.Pe's margin on conversion, lower than airport kiosks.
                            </p>

                            {/* Flat Fee */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>Flat Fee</span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                    - {currencySymbols[toCurrency] || ''}{flatFee}
                                </span>
                            </div>

                            {/* Delivery & Platform Fee */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>Delivery & Platform Fee</span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                    {currencySymbols[toCurrency] || ''}{(deliveryFee + platformFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* GST */}
                            <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                <span className={`${isDarkMode ? "text-white" : "text-black"}`}>
                                    GST ({((quoteData?.gst_rate || 0.18) * 100).toFixed(0)}% on fees)
                                </span>
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                    {currencySymbols[toCurrency] || ''}{gst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Reward Points */}
                            {rewardApplied && (
                                <div className="flex justify-between items-center h-[18px] mt-[8px]">
                                    <span className={`${isDarkMode ? "text-white/70" : "text-black/60"} text-[13px]`}>Reward Discount ({rewardPointsValue} pts)</span>
                                    <span className="text-[#FF3B30] font-bold text-[13px]">-₹{rewardDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>

                        {/* Second Divider */}
                        <div className={`h-[1px] ${isDarkMode ? "bg-[#202020]" : "bg-[#E6E8EB]"} w-[338px] mt-[8px]`} />

                        {/* Final Amount */}
                        <div className="w-full mt-[8px] flex justify-between items-center h-[20px]">
                            <span className={`text-[15px] font-medium font-satoshi ${isDarkMode ? "text-white" : "text-black"}`}>Final Amount You'll Receive</span>
                            <span className={`text-[13px] font-bold font-satoshi ${isDarkMode ? "text-white" : "text-black"}`}>
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
                className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col pt-[26px] px-[20px] pb-safe pb-4 shadow-none ${isDarkMode ? "bg-[#171717]/30 backdrop-blur-[24px]" : "bg-white border-t border-x border-[#E9EAEB]"}`}
                style={{
                    minHeight: "255px",
                    borderTopLeftRadius: "32px",
                    borderTopRightRadius: "32px",
                }}
            >
                <p className={`text-[18px] font-bold font-sans mb-[16px] ${isDarkMode ? "text-white" : "text-black"}`}>
                    {quoteLoading ? "Calculating fees..." : `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} will be held from wallet`}
                </p>
                <p className={`text-[16px] font-medium font-sans mb-[34px] ${totalAmount > walletBalance ? 'text-[#FF3B30]' : isDarkMode ? 'text-white' : 'text-black'}`}>
                    {quoteLoading ? "Syncing pricing..." : totalAmount > walletBalance ? "Insufficient funds in wallet" : "You won’t be charged unless the delivery is completed."}
                </p>
                <SlideToPay
                    onComplete={handlePay}
                    disabled={!savedAddress || totalAmount > walletBalance || quoteLoading}
                    label={quoteLoading ? "Calculating..." : totalAmount > walletBalance ? "Low Balance" : "Slide to Pay"}
                />
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
                                Tipping isn’t mandatory – but it goes directly to them and helps support their daily hustle, fuel, and hard work.
                                Even a small amount makes a big difference. Every rupee = recognition. 💙
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowDeliveryTipPopup(false)}
                        className={cn(
                            "relative z-10 mt-6 px-8 h-[36px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform overflow-hidden",
                            isDarkMode ? "glass-container glass-physics-clear grow-0" : "bg-black"
                        )}
                        style={{
                            '--glass-specular-intensity': '0.2'
                        } as any}
                    >
                        {isDarkMode && (
                            <>
                                <div className="glass-lens" />
                                <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: 'var(--glass-tint)' }} />
                                <span className="glass-rim-v2" />
                            </>
                        )}
                        <X className="w-4 h-4 text-white relative z-10" />
                        <span className="text-white text-[14px] font-sans relative z-10">Close</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default FxExchangeSummary;


