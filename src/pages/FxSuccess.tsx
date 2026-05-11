import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "next-themes";
import { hapticSuccess } from "@/utils/haptics";
import bgLight from "@/assets/bg-light.png";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import { OpenLocationCode } from "open-location-code";
import { supabase } from "@/lib/supabase";
import successBg from "@/assets/success-bg.png";
import errorBg from "@/assets/error-bg.png";
import popBgDefault from "@/assets/pop-bg-default.png";
import popBgExpanded from "@/assets/pop-bg-expanded.png";
import checkIcon from "@/assets/check-icon.svg";
import checkIconLight from "@/assets/check-icon-light.svg";
import crossIcon from "@/assets/cross-icon.png";
import failedIconLight from "@/assets/failed-light.svg";
import cancelIconLight from "@/assets/failed-light.svg"; // Fallback if cancelIconLight doesn't exist
import cancelIcon from "@/assets/cancel-ico.svg";
import hamburgerMenu from "@/assets/hamburger-menu.svg";
import currentLocationIcon from "@/assets/current-location.svg";
import deliveryRiderIcon from "@/assets/delivery-rider.svg";
import buttonPrimary from "@/assets/button-primary-wide.png";
import darkBgCta from "@/assets/darkbg-cta.png";
import infoIcon from "@/assets/delivery-tip-info.svg";
import closeIcon from "@/assets/cross-icon.svg";
import radioFilled from "@/assets/radio-fill.svg";
import radioEmpty from "@/assets/radio-empty.svg";
import { getOrderById, cancelOrder } from "@/lib/orders";
import { Order } from "@/types";
import { useUser } from "@/contexts/UserContext";
import DevModeOverlay from "@/components/DevModeOverlay";

const currencySymbols: Record<string, string> = {
    AUD: '$', BRL: 'R$', CAD: '$', CHF: 'Fr', CNY: '¥', CZK: 'Kč', DKK: 'kr', EUR: '€',
    GBP: '£', HKD: '$', HUF: 'Ft', IDR: 'Rp', ILS: '₪', INR: '₹', ISK: 'kr', JPY: '¥',
    KRW: '₩', MXN: '$', MYR: 'RM', NOK: 'kr', NZD: '$', PHP: '₱', PLN: 'zł', RON: 'lei',
    SEK: 'kr', SGD: '$', THB: '฿', TRY: '₺', USD: '$', ZAR: 'R'
};

const FxSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId } = useParams<{ orderId: string }>();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme !== "light";
    const hasDebited = useRef(false);

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const isFx = location.state?.isFx || false;
    const toCurrency = location.state?.order?.metadata?.toCurrency || 'INR';
    const currencySymbol = isFx ? (currencySymbols[toCurrency] || '₹') : '₹';

    // Map State
    const [viewState, setViewState] = useState({
        latitude: 12.9716,
        longitude: 77.5946,
        zoom: 13
    });

    // UI State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showInfoPopup, setShowInfoPopup] = useState(false);
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [cancelReason, setCancelReason] = useState<number | null>(0);
    const [otherReason, setOtherReason] = useState("");
    const [timer, setTimer] = useState(30);

    const cancelReasons = [
        "I changed my mind",
        "Wrong address selected",
        "Payment issue",
        "Expected quicker delivery",
        "Found a better alternative",
        "Other"
    ];

    const menuRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (location.state?.order && location.state.order.status) {
                setOrder(location.state.order);
                setLoading(false);
                return;
            }

            if (orderId) {
                try {
                    const data = await getOrderById(orderId);
                    if (data) {
                        setOrder(data);
                    }
                } catch (e) {
                    console.error("Failed to fetch order", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchOrder();
        hapticSuccess();

        let channel: any;

        const setupSubscription = async () => {
            if (orderId) {
                channel = supabase
                    .channel(`fx-success-${orderId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'fx_orders',
                            filter: `id=eq.${orderId}`
                        },
                        (payload) => {
                            setOrder(prev => prev ? { ...prev, ...payload.new, amount: payload.new.amount_total } : null);
                        }
                    )
                    .subscribe();
            }
        };

        setupSubscription();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [orderId, location.state]);

    useEffect(() => {
        if (order?.status === 'processing' && timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer, order?.status]);

    // Wallet debit when FX order is delivered/success is now handled by Postgres Trigger

    useEffect(() => {
        const addr = order?.addresses || location.state?.savedAddress;
        if (addr?.plus_code) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const olc = new OpenLocationCode() as any;
                const decoded = olc.decode(addr.plus_code);
                setViewState({
                    latitude: decoded.latitudeCenter,
                    longitude: decoded.longitudeCenter,
                    zoom: 14
                });
            } catch (e) {
                console.error("Failed to decode Plus Code", e);
            }
        } else if (addr?.latitude && addr?.longitude) {
            setViewState({
                latitude: addr.latitude,
                longitude: addr.longitude,
                zoom: 14
            });
        }
    }, [order, location.state?.savedAddress]);

    const handleCancelOrder = async () => {
        if (!order) return;
        try {
            const reasonText = cancelReason === 5 ? otherReason : cancelReasons[cancelReason || 0];
                        await cancelOrder(order.id, cancelReasons[cancelReason || 0], reasonText);

            // Re-fetch or optimistically update
            const updatedOrder = await getOrderById(order.id);
            if (updatedOrder) setOrder(updatedOrder);

            setShowCancelPopup(false);
        } catch (e) {
            console.error("Failed to cancel order", e);
        }
    };

    const getAddressDisplay = () => {
        const addr = order?.addresses || location.state?.savedAddress;
        if (!addr) return "Unknown Location";

        // Handle both Address (apartment) and SavedAddress (house) interfaces
        const house = addr.apartment || addr.house;
        const area = addr.area;

        const parts = [house, area];
        const fullString = parts.filter(Boolean).join(", ");
        return fullString.length > 20 ? fullString.substring(0, 20) + "..." : fullString;
    };

    const routeGeoJson: any = {
        type: "Feature",
        properties: {},
        geometry: {
            type: "LineString",
            coordinates: [
                [viewState.longitude, viewState.latitude],
                [viewState.longitude + 0.002, viewState.latitude + 0.002],
            ],
        },
    };

    const routeLayer: any = {
        id: "route-line",
        type: "line",
        paint: {
            "line-color": "#5260FE",
            "line-width": 2,
            "line-dasharray": [2, 1],
        },
    };

    if (loading || !order || !order.status) {
        return <div className={`h-screen w-full flex items-start justify-center font-sans safe-top pt-4 ${isDarkMode ? "bg-[#0a0a12] text-white" : "bg-[#FFFFFF] text-black"}`}>
            <div className="flex flex-col items-center gap-4 mt-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Securing your order...</p>
            </div>
        </div>;
    }

    const getStatusConfig = (currentOrder: Order) => {
        let config = {
            bgImage: successBg,
            mainIcon: isDarkMode ? checkIcon : checkIconLight,
            headerTitle: "Order Successful",
            statusTitle: "We’ll notify you once your FX cash is ready for delivery.",
            statusAmount: isFx ? (location.state?.receiveAmount || (currentOrder.meta_data as any)?.receive_amount || (currentOrder.meta_data as any)?.receiveAmount || currentOrder.amount) : currentOrder.amount,
            showMap: true,
            deliveryText: "We’re assigning a delivery\npartner soon!",
            deliverySubText: "Assigning a delivery partner in the next 2 minutes.",
            transactionNote: "No charges yet — your wallet will only be debited after you confirm the delivery.",
            canCancel: true,
            themeBg: isDarkMode ? "transparent" : "#F5F5F7"
        };

        if (currentOrder.status === 'success' || currentOrder.status === 'delivered') {
            config = {
                ...config,
                mainIcon: isDarkMode ? checkIcon : checkIconLight,
                headerTitle: "Order Delivered",
                statusTitle: "Order delivered successfully!",
                deliveryText: "Order Delivered",
                deliverySubText: "Your package has arrived.",
                transactionNote: "Amount deducted from your wallet.",
                canCancel: false
            };
        } else if (currentOrder.status === 'failed') {
            config = {
                ...config,
                bgImage: errorBg,
                mainIcon: isDarkMode ? crossIcon : failedIconLight,
                headerTitle: "Order Failed",
                statusTitle: "Order could not be processed",
                showMap: false,
                deliveryText: "Payment Failed",
                // @ts-ignore
                deliverySubText: currentOrder.metadata?.failure_reason || "Something went wrong.",
                transactionNote: "If any amount was deducted, it will be refunded instantly.",
                canCancel: false
            };
        } else if (currentOrder.status === 'cancelled') {
            config = {
                ...config,
                bgImage: errorBg,
                mainIcon: isDarkMode ? cancelIcon : cancelIconLight,
                headerTitle: "Order Cancelled",
                statusTitle: "Order Cancelled",
                showMap: false,
                deliveryText: "Order Cancelled",
                // @ts-ignore
                deliverySubText: (currentOrder.meta_data as any)?.cancel_reason_type || "Order cancelled by user.",
                transactionNote: "Refund has been initiated to your wallet.",
                canCancel: false
            };
        }

        return config;
    };

    const statusConfig = getStatusConfig(order);

    return (
        <div
            className={`min-h-screen w-full overflow-y-auto no-scrollbar scroll-smooth safe-bottom animate-in fade-in duration-500 relative ${isDarkMode ? 'text-white' : 'text-black'}`}
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${statusConfig.bgImage})` : `none`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Purple Glow Orb */}
            {!isDarkMode && (
                <div
                    className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] rounded-full blur-[100px] opacity-30 pointer-events-none z-0"
                    style={{
                                                backgroundColor: ['success', 'delivered', 'processing', 'pending', 'out_for_delivery', 'arrived', 'held', 'accepted', 'picked_up'].includes(order?.status || '') ? "#0D992F" : "#FF3B30",
                    }}
                />
            )}
            {/* Header */}
            <div
                className="px-5 safe-top pt-4 flex items-center justify-between z-10 mb-[21px] relative"
            >
                <div className="w-6" />
                <h1 className={isDarkMode ? 'text-[22px] font-medium font-satoshi text-white' : 'text-[18px] font-medium font-sans text-black'}>
                    {statusConfig.headerTitle}
                </h1>
                <button
                    ref={hamburgerRef}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-6 h-6 flex items-center justify-center"
                >
                    <img src={hamburgerMenu} alt="Menu" className={`w-full h-full ${!isDarkMode ? 'brightness-0' : ''}`} />
                </button>

                {isMenuOpen && (
                    <div
                        ref={menuRef}
                        className={`absolute top-[50px] right-[20px] rounded-[12px] flex flex-col items-start overflow-hidden z-50 border ${isDarkMode ? 'border-white/20 bg-black/60 shadow-none' : 'border-black/5 bg-white shadow-lg'}`}
                        style={{
                            width: "145px",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                        }}
                    >
                        <button className={`w-full text-left px-[12px] py-[8px] text-[12px] font-medium font-sans transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'}`}>
                            Need Help?
                        </button>
                        {statusConfig.canCancel && (
                            <div
                                className={`w-full px-[12px] py-[8px] flex items-start justify-between cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                onClick={() => {
                                    if (timer > 0) {
                                        setShowCancelPopup(true);
                                        setIsMenuOpen(false);
                                    }
                                }}
                            >
                                <span className={`text-[12px] font-medium font-sans ${timer === 0 ? (isDarkMode ? 'text-white/40' : 'text-black/40') : (isDarkMode ? 'text-white' : 'text-black')}`}>
                                    {timer > 0 ? `Cancel Order (${timer}s)` : 'Cancel Order (unavailable)'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="px-5 pb-[10px] flex flex-col items-center">
                {/* Main Icon */}
                <div className="w-[62px] h-[62px]">
                    <img src={statusConfig.mainIcon} alt="Status" className="w-full h-full object-contain" />
                </div>

                {/* Sub-text: 22px below icon, Satoshi Bold 18px */}
                <h2 className={`text-[18px] font-bold font-sans mt-[22px] text-center leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {statusConfig.statusTitle}
                </h2>

                {/* Amount: 13px below sub-text, Satoshi Medium 25px */}
                <p className={`text-[25px] font-medium font-sans mt-[13px] mb-[39px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {currencySymbol}{(statusConfig.statusAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>

                {/* Delivery Container */}
                <div className="w-full mb-[16px] flex flex-col">
                    <div
                        className={`w-full px-[16px] py-[9px] flex justify-between items-start z-10 shrink-0 rounded-t-[14px] ${isDarkMode ? "bg-black" : "bg-black border-x border-t border-[#E6E8EB]"}`}
                        style={{
                            backgroundColor: "#000000",
                        }}
                    >
                        <span className={`text-[12px] font-medium font-sans whitespace-nowrap mr-2 text-white`}>
                            Delivering to - {order.addresses?.label || location.state?.savedAddress?.tag || "Home"}
                        </span>
                        <span className={`text-[12px] font-medium font-sans text-right leading-tight text-white`}>
                            {getAddressDisplay()}
                        </span>
                    </div>

                    <div
                        className={`w-full rounded-b-[14px] flex ${isDarkMode ? "bg-white/[0.04]" : "bg-white border border-[#E6E8EB] shadow-sm"}`}
                        style={{
                            padding: "12px",
                            borderTop: isDarkMode ? "none" : "none", // Prevent double border
                        }}
                    >
                        <div className="flex-1 flex flex-col justify-start pr-2">
                            <p className={`text-[14px] font-medium font-sans leading-snug mb-[12px] whitespace-pre-line ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {statusConfig.deliveryText}
                            </p>
                            <p className={`text-[12px] font-light font-sans leading-snug mb-[4px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {statusConfig.deliverySubText}
                            </p>
                        </div>

                        {statusConfig.showMap && (
                            <div
                                className="shrink-0 relative rounded-[8px] overflow-hidden"
                                style={{ width: "110px", height: "82px", backgroundColor: "#1A1A1A" }}
                            >
                                <Map
                                    {...viewState}
                                    style={{ width: "100%", height: "100%" }}
                                    mapStyle={isDarkMode ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"}
                                    attributionControl={false}
                                    interactive={false}
                                >
                                    <Source id="route" type="geojson" data={routeGeoJson as any}>
                                        <Layer {...routeLayer} />
                                    </Source>
                                    <Marker latitude={viewState.latitude} longitude={viewState.longitude}>
                                        <img src={currentLocationIcon} alt="User" className="w-4 h-4" />
                                    </Marker>
                                    {order.status === 'processing' && (
                                        <Marker latitude={viewState.latitude + 0.002} longitude={viewState.longitude + 0.002}>
                                            <img src={deliveryRiderIcon} alt="Rider" className="w-6 h-6" />
                                        </Marker>
                                    )}
                                </Map>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className={`w-full rounded-[13px] p-[12px] mb-[29px] ${isDarkMode ? "bg-white/[0.04]" : "bg-white border border-[#E6E8EB] shadow-sm"}`}
                    style={{ height: "auto" }}
                >
                    <h3 className={`text-[16px] font-medium font-sans ${isDarkMode ? "text-white" : "text-black"}`}>
                        Transaction Details
                    </h3>
                    <div className={`w-full h-[1px] mt-[10px] mb-[10px] ${isDarkMode ? "bg-[#202020]" : "bg-[#E6E8EB]"}`} />

                    <div className="flex justify-between items-center mb-[8px]">
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}>Transaction Number</span>
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}>{order?.id?.substring(0, 8).toUpperCase() || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center mb-[8px]">
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}>Date & Time</span>
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}>
                            {order?.created_at ? new Date(order.created_at).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
                            }) : '...'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center mb-[12px]">
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}>Payment Mode</span>
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}>grid.pe Wallet</span>
                    </div>

                    <div className="flex justify-between items-center mb-[8px]">
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}>Amount Held</span>
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}>₹{(order?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {isFx && (
                        <div className="flex justify-between items-center mb-[8px]">
                            <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}>Final Amount (Cash)</span>
                            <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}>{currencySymbol}{((order.meta_data as any)?.receive_amount || (order.meta_data as any)?.receiveAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}

                    <p className={`text-[13px] font-normal font-sans mb-[14px] leading-snug ${isDarkMode ? "text-white/50" : "text-black"}`}>
                        {statusConfig.transactionNote}
                    </p>

                    {statusConfig.canCancel && (
                        <p className={`text-[13px] font-normal font-sans leading-snug ${isDarkMode ? "text-white" : "text-black"}`}>
                            If you need to cancel, you can do so within 30 seconds or before a delivery partner is assigned, whichever is earlier.
                        </p>
                    )}
                </div>

                <div className="w-full pb-6">
                    <button
                        onClick={() => navigate("/home")}
                        className={`w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans ${!isDarkMode ? 'bg-black rounded-full' : 'rounded-[296px]'}`}
                        style={{
                            backgroundImage: isDarkMode ? `url(${darkBgCta})` : 'none',
                            backgroundSize: "cover",
                            backgroundPosition: 'center',
                            backgroundRepeat: "no-repeat",
                            border: "none",
                        }}
                    >
                        Go Home
                    </button>
                </div>
            </div>

            {showCancelPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-5">
                    <div
                        className={`relative rounded-[13px] p-[22px] w-full max-w-[353px] flex flex-col items-center border ${isDarkMode ? 'border-white/10' : 'border-black/5 shadow-2xl'}`}
                        style={{
                            backgroundImage: `url(${cancelReason === 5 ? popBgExpanded : popBgDefault})`,
                            backgroundSize: '100% 100%',
                            backgroundColor: isDarkMode ? 'transparent' : 'white'
                        }}
                    >
                        <div className="w-[32px] h-[32px] mb-[16px]">
                            <img src={cancelIcon} alt="Cancel" className="w-full h-full" />
                        </div>
                        <h2 className={`text-[18px] font-bold font-sans mb-[8px] text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Cancel Order?
                        </h2>
                        <p className={`text-[13px] font-medium font-sans text-center leading-[1.4] mb-[24px] px-[13px] ${isDarkMode ? 'text-white' : 'text-black/60'}`}>
                            We’re not mad. Just disappointed. Help us understand why you’re cancelling.
                        </p>
                        <div className="w-full flex gap-[12px] justify-center">
                            <button
                                onClick={() => setShowCancelPopup(false)}
                                className="rounded-full text-white text-[14px] font-medium font-sans flex items-center justify-center shrink-0"
                                style={{ width: '158px', height: '37px', backgroundImage: `url(${buttonPrimary})`, backgroundSize: "100% 100%" }}
                            >
                                Fine, I'll stay
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                className="rounded-full bg-[#FF3B30] text-white text-[14px] font-medium font-sans shrink-0 flex items-center justify-center"
                                style={{ width: '158px', height: '37px' }}
                            >
                                Pull the plug
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <DevModeOverlay orderId={orderId} isFx={isFx} />
        </div>
    );
};

export default FxSuccess;
