import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import { OpenLocationCode } from "open-location-code";
import { supabase } from "@/lib/supabase";
import successBg from "@/assets/success-bg.png";
import errorBg from "@/assets/error-bg.png";
import popBgDefault from "@/assets/pop-bg-default.png";
import popBgExpanded from "@/assets/pop-bg-expanded.png";
import checkIcon from "@/assets/check-icon.png";
import checkIconLight from "@/assets/check-icon-light.svg";
import crossIcon from "@/assets/cross-icon.png";
import failedIconLight from "@/assets/failed-light.svg";
import hamburgerMenu from "@/assets/hamburger-menu.svg";
import currentLocationIcon from "@/assets/current-location.svg";
import deliveryRiderIcon from "@/assets/delivery-rider.svg";
import buttonPrimary from "@/assets/button-primary-wide.png";
import infoIcon from "@/assets/delivery-tip-info.svg";
import closeIcon from "@/assets/cross-icon.svg";
import cancelIcon from "@/assets/cancel-ico.svg";
import radioFilled from "@/assets/radio-fill.svg";
import radioEmpty from "@/assets/radio-empty.svg";
import { Order, dev_updateOrderStatus } from "@/lib/orders";
import { useTheme } from "next-themes";

const OrderDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId } = useParams<{ orderId: string }>();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

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
    const [redirectTimer, setRedirectTimer] = useState(30);

    const cancelReasons = [
        "I changed my mind",
        "Wrong address selected",
        "Payment issue",
        "Expected quicker delivery",
        "Found a better alternative",
        "Other"
    ];

    // Refs for click outside
    const menuRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);

    // Fetch Order logic
    useEffect(() => {
        const fetchOrder = async () => {
            if (location.state?.order && location.state.order.addresses) {
                setOrder(location.state.order);
                setLoading(false);
                return;
            }

            if (orderId) {
                try {
                    const { data, error } = await supabase
                        .from('orders')
                        .select('*, addresses(*)')
                        .eq('id', orderId)
                        .single();

                    if (data) {
                        setOrder(data as Order);
                    } else {
                        console.error("Order not found", error);
                    }
                } catch (e) {
                    console.error("Failed to fetch order", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchOrder();

        // Real-time subscription
        let channel: any;

        const setupSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && orderId) {
                channel = supabase
                    .channel(`order-details-${orderId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'orders',
                            filter: `id=eq.${orderId}`
                        },
                        (payload) => {
                            console.log('Order details real-time update:', payload);
                            // Merge updated fields into current order
                            setOrder(prev => prev ? { ...prev, ...payload.new } : (payload.new as Order));
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

    // Timer Logic (mock countdown for "Assigning partner")
    useEffect(() => {
        if (order?.status === 'processing' && timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer, order?.status]);

    // Redirect Timer for Cancelled/Failed Orders
    useEffect(() => {
        if ((order?.status === 'cancelled' || order?.status === 'failed') && redirectTimer > 0) {
            const interval = setInterval(() => {
                setRedirectTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else if ((order?.status === 'cancelled' || order?.status === 'failed') && redirectTimer === 0) {
            navigate("/home");
        }
    }, [redirectTimer, order?.status, navigate]);

    // Wallet debit is now handled automatically via secure Postgres Triggers on the backend.

    // Click outside to close menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                hamburgerRef.current &&
                !hamburgerRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    // Decode Plus Code or use default
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

            const metadata = {
                ...(order.metadata || {}),
                cancelled_by: 'user',
                cancel_reason_type: reasonText,
                cancelled_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled', metadata })
                .eq('id', order.id);

            if (error) throw error;

            // Optimistic update
            setOrder({
                ...order,
                status: 'cancelled',
                metadata
            });
            setShowCancelPopup(false);

            // Navigate to cancelled screen (or re-render this screen as cancelled)
            // The requirement says "Order Details screen... Render different layouts based on status".
            // So we should just stay here and let the UI update to "cancelled" state.
            // However, existing flow navigated to '/order-cancelled'.
            // Let's stick to the new requirement: "Order Details screen... Render... cancelled".
            // So we update state and stay here.

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

    if (loading || !order) {
        return <div className="h-full w-full bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    // --- CONFIG FOR DIFFERENT STATES ---
    const getStatusConfig = (currentOrder: Order) => {
        // Default / Processing
        let config = {
            bgImage: successBg,
            mainIcon: isDarkMode ? checkIcon : checkIconLight,
            headerTitle: "Order Successful",
            statusTitle: "Your order is being processed!",
            statusAmount: currentOrder.amount,
            showMap: true,
            deliveryText: "We’re assigning a delivery\npartner soon!",
            deliverySubText: "Assigning a delivery partner in the next 2 minutes.",
            transactionNote: "No charges yet — your wallet will only be debited after you confirm the delivery.",
            canCancel: true
        };

        if (currentOrder.status === 'success' || currentOrder.status === 'delivered') {
            config = {
                bgImage: successBg,
                mainIcon: isDarkMode ? checkIcon : checkIconLight,
                headerTitle: "Order Delivered",
                statusTitle: "Order delivered successfully!",
                statusAmount: currentOrder.amount,
                showMap: true,
                deliveryText: "Order Delivered",
                deliverySubText: "Your package has arrived.",
                transactionNote: "Amount deducted from your wallet.",
                canCancel: false
            };
        } else if (currentOrder.status === 'failed') {
            config = {
                bgImage: errorBg,
                mainIcon: isDarkMode ? crossIcon : failedIconLight,
                headerTitle: "Order Failed",
                statusTitle: "Order could not be processed",
                statusAmount: currentOrder.amount,
                showMap: false,
                deliveryText: "Payment Failed",
                // @ts-ignore
                deliverySubText: currentOrder.metadata?.failure_reason || "Something went wrong.",
                transactionNote: "If any amount was deducted, it will be refunded instantly.",
                canCancel: false
            };
        } else if (currentOrder.status === 'cancelled') {
            config = {
                bgImage: errorBg,
                mainIcon: isDarkMode ? cancelIcon : failedIconLight,
                headerTitle: "Order Cancelled",
                statusTitle: "Order Cancelled",
                statusAmount: currentOrder.amount,
                showMap: false,
                deliveryText: "Order Cancelled",
                // @ts-ignore
                deliverySubText: currentOrder.metadata?.cancel_reason_type || "Order cancelled by user.",
                transactionNote: "Refund has been initiated to your wallet.",
                canCancel: false
            };
        }

        return config;
    };

    const statusConfig = getStatusConfig(order);

    // --- RENDER ---
    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom animate-in fade-in duration-500 relative"
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${statusConfig.bgImage})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Glow - Green for Success, Red/Orange for others if needed, but user asked for Green for Order Success */}
            {!isDarkMode && (
                <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] rounded-full blur-[100px] opacity-30 pointer-events-none z-0 ${order?.status === 'success' || order?.status === 'delivered' || order?.status === 'processing' ? 'bg-[#0D992F]' : 'bg-[#FF3B30]'}`} />
                // Using Red for failed/cancelled to be semantic, Green for success/processing.
            )}
            {/* DEV CONTROLS */}
            {import.meta.env.DEV && (
                <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 bg-black/90 p-2 rounded-lg border border-red-500/50 shadow-xl pointer-events-auto">
                    <span className="text-white text-[10px] font-bold text-center border-b border-white/20 pb-1">DEV CONTROLS</span>
                    <button
                        onClick={async () => {
                            try {
                                await dev_updateOrderStatus(order.id, 'success');
                            } catch (e) {
                                console.error("Dev update failed (likely RLS), proceeding with local mock", e);
                            }
                            setOrder({ ...order, status: 'success' });
                        }}
                        className="px-2 py-1 bg-green-600 text-white text-[10px] rounded hover:bg-green-500"
                    >
                        Set Success
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                await dev_updateOrderStatus(order.id, 'failed');
                            } catch (e) {
                                console.error("Dev update failed (likely RLS), proceeding with local mock", e);
                            }
                            setOrder({ ...order, status: 'failed' });
                        }}
                        className="px-2 py-1 bg-red-600 text-white text-[10px] rounded hover:bg-red-500"
                    >
                        Set Failed
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                await dev_updateOrderStatus(order.id, 'cancelled');
                            } catch (e) {
                                console.error("Dev update failed (likely RLS), proceeding with local mock", e);
                            }
                            setOrder({ ...order, status: 'cancelled', metadata: { ...order.metadata, cancel_reason_type: 'Simulated dev cancellation' } as any });
                        }}
                        className="px-2 py-1 bg-gray-600 text-white text-[10px] rounded hover:bg-gray-500"
                    >
                        Set Cancelled
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex-none px-5 pt-4 flex items-center justify-between z-10 mb-[21px] relative">
                <div className="w-6" /> {/* Spacer */}
                <h1 className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {statusConfig.headerTitle}
                </h1>
                <button
                    ref={hamburgerRef}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-6 h-6 flex items-center justify-center"
                >
                    <img src={hamburgerMenu} alt="Menu" className={`w-full h-full ${!isDarkMode ? 'brightness-0' : ''}`} />
                </button>

                {/* Hamburger Menu Dropdown */}
                {isMenuOpen && (
                    <div
                        ref={menuRef}
                        className="absolute top-[50px] right-[20px] rounded-[12px] flex flex-col items-start overflow-hidden z-50 border border-white/20"
                        style={{
                            width: "145px",
                            height: "auto",
                            minHeight: "69px",
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                        }}
                    >
                        {/* Need Help? */}
                        <button className="w-full text-left px-[12px] py-[8px] text-white text-[12px] font-medium font-sans hover:bg-white/10 transition-colors">
                            Need Help?
                        </button>

                        {/* Divider (Only if canCancel) */}
                        {statusConfig.canCancel && <div className="w-full h-[0.5px]" />}

                        {/* Cancel Order (Only if canCancel) */}
                        {statusConfig.canCancel && (
                            <div
                                className="w-full px-[12px] py-[8px] flex items-start justify-between cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={() => {
                                    if (timer > 0) {
                                        setShowCancelPopup(true);
                                        setIsMenuOpen(false);
                                    }
                                }}
                            >
                                <span className={`text-[12px] font-medium font-sans ${timer === 0 ? 'text-[#878787]' : 'text-white'}`}>
                                    {timer > 0 ? `Cancel Order (${timer}s)` : 'Cancel Order (unavailable)'}
                                </span>
                                {timer === 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowInfoPopup(true);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-[14px] h-[14px] ml-1 flex-shrink-0 mt-[2px]"
                                    >
                                        <img src={infoIcon} alt="Info" className="w-full h-full" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden px-5 pb-[10px] flex flex-col items-center">
                {/* Main Icon */}
                <div className="w-[62px] h-[62px] mb-[35px]">
                    <img src={statusConfig.mainIcon} alt="Status" className="w-full h-full object-contain" />
                </div>

                {/* Status Text */}
                <h2 className={`text-[18px] font-bold font-sans mb-[1px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {statusConfig.statusTitle}
                </h2>

                {/* Amount */}
                <p className={`text-[25px] font-medium font-sans mb-[39px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    ₹{(statusConfig.statusAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>

                {/* Delivery Container */}
                <div className="w-full mb-[16px] flex flex-col">
                    {/* Header Row (Top Container) */}
                    <div
                        className={`w-full px-[16px] py-[9px] flex justify-between items-start z-10 shrink-0 rounded-t-[14px] bg-black`}
                        style={{
                            backgroundColor: "#000000",
                            border: isDarkMode ? "none" : "1px solid #E9EAEB",
                            borderBottom: "none"
                        }}
                    >
                        <span className={`text-[12px] font-medium font-sans whitespace-nowrap mr-2 text-white`}>
                            Delivering to - {order.addresses?.label || location.state?.savedAddress?.tag || "Home"}
                        </span>
                        <span className={`text-[12px] font-medium font-sans text-right leading-tight text-white`}>
                            {getAddressDisplay()}
                        </span>
                    </div>

                    {/* Status & Map Container (Bottom Container) */}
                    <div
                        className={`w-full rounded-b-[14px] flex ${isDarkMode ? 'bg-white/10' : 'bg-white'}`}
                        style={{
                            backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.34)" : "#FFFFFF",
                            padding: "12px",
                            marginTop: 0,
                            border: isDarkMode ? "none" : "1px solid #E9EAEB",
                            borderTop: "none"
                        }}
                    >
                        {/* Left Text */}
                        <div className="flex-1 flex flex-col justify-start pr-2">
                            <p className={`text-[14px] font-medium font-sans leading-snug mb-[12px] whitespace-pre-line ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {statusConfig.deliveryText}
                            </p>
                            <p className={`text-[12px] font-light font-sans leading-snug mb-[4px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {statusConfig.deliverySubText}
                            </p>
                        </div>

                        {/* Mini Map (Only if showMap is true) */}
                        {statusConfig.showMap && (
                            <div
                                className="shrink-0 relative rounded-[8px] overflow-hidden"
                                style={{
                                    width: "110px",
                                    height: "82px",
                                    backgroundColor: "#1A1A1A"
                                }}
                            >
                                <Map
                                    {...viewState}
                                    style={{ width: "100%", height: "100%" }}
                                    mapStyle={isDarkMode ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"}
                                    attributionControl={false}
                                    interactive={false}
                                >
                                    {/* Dashed Route Line */}
                                    <Source id="route" type="geojson" data={routeGeoJson as any}>
                                        <Layer {...routeLayer} />
                                    </Source>

                                    {/* Delivery/User Location Marker */}
                                    <Marker latitude={viewState.latitude} longitude={viewState.longitude}>
                                        <img src={currentLocationIcon} alt="User" className="w-4 h-4" />
                                    </Marker>

                                    {/* Mock Rider Marker (only for processing?) */}
                                    {order.status === 'processing' && (
                                        <Marker
                                            latitude={viewState.latitude + 0.002}
                                            longitude={viewState.longitude + 0.002}
                                        >
                                            <img src={deliveryRiderIcon} alt="Rider" className="w-6 h-6" />
                                        </Marker>
                                    )}
                                </Map>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction Details Container */}
                <div
                    className="w-full rounded-[13px] p-[12px] mb-[29px]"
                    style={{
                        height: "auto",
                        backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.34)" : "#FFFFFF",
                        border: isDarkMode ? "none" : "1px solid #E9EAEB"
                    }}
                >
                    <h3 className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Transaction Details
                    </h3>
                    <div className={`w-full h-[1px] mt-[10px] mb-[10px] ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E9EAEB]'}`} />

                    <div className="flex justify-between items-center mb-[8px]">
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}>Transaction Number</span>
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}>{order.id.slice(0, 8).toUpperCase()}...</span>
                    </div>

                    <div className="flex justify-between items-center mb-[8px]">
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}>Date & Time</span>
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}>
                            {new Date(order.created_at).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
                            })}
                        </span>
                    </div>

                    <div className="flex justify-between items-center mb-[12px]">
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-normal' : 'text-black'}`}>Payment Mode</span>
                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white font-bold' : 'text-black'}`}>grid.pe Wallet</span>
                    </div>

                    <p className={`text-[13px] font-normal font-sans mb-[14px] leading-snug ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                        {statusConfig.transactionNote}
                    </p>

                    {statusConfig.canCancel && (
                        <p className={`text-[13px] font-normal font-sans leading-snug ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            If you need to cancel, you can do so within 30 seconds or before a delivery partner is assigned, whichever is earlier.
                        </p>
                    )}
                </div>

                {/* Footer CTA */}
                <div className="w-full">
                    {order?.status === 'cancelled' || order?.status === 'failed' ? (
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => navigate("/home")}
                                className={`w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans ${!isDarkMode ? 'bg-black rounded-full' : ''}`}
                                style={{
                                    backgroundImage: isDarkMode ? `url(${buttonPrimary})` : 'none',
                                    backgroundSize: "100% 100%",
                                    backgroundRepeat: "no-repeat",
                                }}
                            >
                                Redirecting to Home in {redirectTimer}s
                            </button>
                            <p className={`mt-[12px] text-center text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                                (so you don’t sit here questioning your life choices — again)
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate("/home")}
                            className={`w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans ${!isDarkMode ? 'bg-black rounded-full' : ''}`}
                            style={{
                                backgroundImage: isDarkMode ? `url(${buttonPrimary})` : 'none',
                                backgroundSize: "100% 100%",
                                backgroundRepeat: "no-repeat",
                            }}
                        >
                            Go Home
                        </button>
                    )}
                </div>
            </div>

            {/* Info Popup (Toaster) */}
            {showInfoPopup && (
                <div
                    className="absolute inset-0 z-50 flex items-start justify-center pt-4 bg-black/50 backdrop-blur-sm safe-area-top"
                    onClick={() => {
                        setShowInfoPopup(false);
                        setIsMenuOpen(true);
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative rounded-[12px] border border-white/20 p-[12px] flex items-start"
                        style={{
                            width: "362px",
                            height: "auto",
                            minHeight: "79px",
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            backdropFilter: "blur(14px)",
                            WebkitBackdropFilter: "blur(14px)",
                        }}
                    >
                        <p className="text-white text-[12px] font-medium font-sans leading-[1.4] pr-6">
                            The cancellation window has expired. <br />
                            If something went wrong or you need help, we’ve got your back — reach out anytime.
                        </p>
                        <button
                            onClick={() => {
                                setShowInfoPopup(false);
                                setIsMenuOpen(true);
                            }}
                            className="absolute top-[12px] right-[12px] w-[16px] h-[16px]"
                        >
                            <img src={closeIcon} alt="Close" className="w-full h-full" />
                        </button>
                    </div>
                </div>
            )}

            {/* Cancel Order Popup */}
            {showCancelPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-5">
                    <div
                        className={`relative rounded-[13px] p-[22px] w-full max-w-[353px] flex flex-col items-center border ${isDarkMode ? 'border-white/10' : 'bg-white border-[#E9EAEB]'}`}
                        style={isDarkMode ? {
                            backgroundImage: `url(${cancelReason === 5 ? popBgExpanded : popBgDefault})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                        } : {}}
                    >
                        {/* Icon */}
                        <div className="w-[32px] h-[32px] mb-[16px]">
                            <img src={cancelIcon} alt="Cancel" className="w-full h-full" style={!isDarkMode ? { filter: 'invert(1)' } : undefined} />
                        </div>

                        {/* Header */}
                        <h2 className={`text-[18px] font-bold font-sans mb-[8px] text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Cancel Order?
                        </h2>

                        {/* Subtext */}
                        <p className={`w-full text-[12px] font-medium font-satoshi text-center leading-[140%] mb-[24px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            We’re not mad. Just disappointed. Help us understand why you’re cancelling. It helps us improve your experience (and emotionally prepare for this moment).
                        </p>

                        {/* Reason List Container */}
                        <div
                            className="flex flex-col mb-[24px] overflow-hidden w-full"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.60)" : "#F9F9F9",
                                borderRadius: "12px",
                                border: isDarkMode ? 'none' : '1px solid #E9EAEB'
                            }}
                        >
                            {/* Title inside container */}
                            <div className="pt-[14px] px-[12px]">
                                <p className={`text-[12px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    Reason for Cancellation? (Required)
                                </p>
                            </div>

                            {/* Divider */}
                            <div className={`mt-[14px] w-full h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-[#E9EAEB]'}`} />

                            {/* List */}
                            <div>
                                {cancelReasons.map((reason, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setCancelReason(index)}
                                        className={`w-full h-[44px] flex items-center px-[12px] cursor-pointer ${index !== cancelReasons.length - 1 ? (isDarkMode ? 'border-b border-white/5' : 'border-b border-[#E9EAEB]') : ''
                                            } ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors`}
                                    >
                                        <img
                                            src={cancelReason === index ? radioFilled : radioEmpty}
                                            alt="radio"
                                            className="w-[16px] h-[16px] mr-[12px]"
                                            style={{
                                                filter: cancelReason === index
                                                    ? 'invert(35%) sepia(87%) saturate(3025%) hue-rotate(224deg) brightness(97%) contrast(92%)'
                                                    : 'invert(35%) sepia(87%) saturate(3025%) hue-rotate(224deg) brightness(97%) contrast(92%) opacity(0.6)'
                                            }}
                                        />
                                        <span className={`text-[13px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                            {reason}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Other Input */}
                            {cancelReason === 5 && (
                                <div className="w-full p-[12px] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <textarea
                                        value={otherReason}
                                        onChange={(e) => setOtherReason(e.target.value)}
                                        placeholder="Tell us more..."
                                        className={`w-full h-[80px] rounded-[12px] border p-[12px] text-[13px] font-sans focus:outline-none resize-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-white/20 placeholder:text-[#6F6F6F]' : 'bg-transparent border-[#E9EAEB] text-black focus:border-[#CCCCCC] placeholder:text-black/40'}`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="w-full flex gap-[12px] justify-center">
                            <button
                                onClick={() => setShowCancelPopup(false)}
                                className={`rounded-full text-white text-[14px] font-medium font-sans flex items-center justify-center shrink-0 ${!isDarkMode ? 'bg-black' : ''}`}
                                style={{
                                    width: '158px',
                                    height: '37px',
                                    backgroundImage: isDarkMode ? `url(${buttonPrimary})` : 'none',
                                    backgroundSize: "100% 100%",
                                    backgroundRepeat: "no-repeat",
                                }}
                            >
                                Fine, I'll stay
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                className="rounded-full bg-[#FF3B30] text-white text-[14px] font-medium font-sans hover:bg-[#FF3B30]/90 transition-colors shrink-0 flex items-center justify-center"
                                style={{
                                    width: '158px',
                                    height: '37px',
                                }}
                            >
                                Pull the plug
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderDetails;
