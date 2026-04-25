import React, { useState } from "react";
import { X, Info, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { hapticWarning } from "@/utils/haptics";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import { Order } from "@/types";
import processingIcon from "@/assets/processing.svg";
import successIcon from "@/assets/success.svg";
import failedIcon from "@/assets/failed.svg";
import refreshIcon from "@/assets/refresh.svg";
import checkIcon from "@/assets/check.svg";
import crossIcon from "@/assets/cross.svg";
import currentLocationIcon from "@/assets/current-location.svg";
import deliveryRiderIcon from "@/assets/delivery-rider.svg";
import hourGlassIcon from "@/assets/hour-glass.svg";
import innerFrameBg from "@/assets/inner-frame.png";
import optionBg from "@/assets/option-bg.png";
import textInputBg from "@/assets/text-input.png";
import transactionDetailsBg from "@/assets/transaction-details.png";
import darkCtaBg from "@/assets/darkbg-cta.png";
import deliveryTipInfo from "@/assets/delivery-tip-info.svg";
import infoTipIcon from "@/assets/info-tip.svg";
import verifiedIcon from "@/assets/verified.svg";
import verifiedCircleIcon from "@/assets/verified-circle.svg";
import pillBg from "@/assets/pill.png";
import selectedPillBg from "@/assets/selected-pill.png";
import crossIconPng from "@/assets/cross-icon.png";
import popupBg from "@/assets/popup-bg.png";
import buttonCloseBg from "@/assets/button-close.png";
import popupCardIcon from "@/assets/card-ico.svg";
import cardIcon from "@/assets/card-icon.svg";
import deliveryTipLightBg from "@/assets/delivery-tip-light.png";
import { cn } from "@/lib/utils";

const currencySymbols: Record<string, string> = {
    AUD: '$', BRL: 'R$', CAD: '$', CHF: 'Fr', CNY: '¥', CZK: 'Kč', DKK: 'kr', EUR: '€',
    GBP: '£', HKD: '$', HUF: 'Ft', IDR: 'Rp', ILS: '₪', INR: '₹', ISK: 'kr', JPY: '¥',
    KRW: '₩', MXN: '$', MYR: 'RM', NOK: 'kr', NZD: '$', PHP: '₱', PLN: 'zł', RON: 'lei',
    SEK: 'kr', SGD: '$', THB: '฿', TRY: '₺', USD: '$', ZAR: 'R'
};

interface OrderDetailsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onCancel?: (orderId: string) => void;
}

const OrderDetailsSheet: React.FC<OrderDetailsSheetProps> = ({ isOpen, onClose, order, onCancel }) => {
    const navigate = useNavigate();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme !== 'light';
    const [rating, setRating] = useState<number>(0);
    const [feedback, setFeedback] = useState("");

    // Tip State from OrderCashSummary
    const [showDeliveryTipPopup, setShowDeliveryTipPopup] = useState(false);
    const [selectedTipOption, setSelectedTipOption] = useState<string | null>(null);
    const [tipAmount, setTipAmount] = useState(0);
    const [customTipValue, setCustomTipValue] = useState("");


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
    };

    if (!isOpen || !order) return null;

    const formatOrderDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            const timeStr = date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            if (isToday) {
                return `Today | ${timeStr}`;
            } else {
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleString('en-IN', { month: 'short' });
                return `${day} ${month} | ${timeStr}`;
            }
        } catch (e) {
            return "Today | 12:00 PM";
        }
    };

    const getStatusConfig = (status: string) => {
        const s = status.toLowerCase();
                if (s === 'processing' || s === 'out_for_delivery' || s === 'arrived' || s === 'accepted' || s === 'picked_up' || s === 'at_store') {
            return {
                color: isDarkMode ? '#FACC15' : '#C09A00',
                bgColor: '#FACC15',
                bgOpacity: 0.21,
                icon: processingIcon,
                statusIcon: refreshIcon,
                label: 'Processing',
                statusFilter: 'brightness(0) saturate(100%) invert(60%) sepia(59%) saturate(1914%) hue-rotate(18deg) brightness(95%) contrast(101%)'
            };
        } else if (s === 'success' || s === 'delivered') {
            return {
                color: '#1CB956',
                bgColor: '#1CB956',
                bgOpacity: 0.21,
                icon: successIcon,
                statusIcon: checkIcon,
                label: 'Success'
            };
        } else {
            return {
                color: '#FF1E1E',
                bgColor: '#FF1E1E',
                bgOpacity: 0.21,
                icon: failedIcon,
                statusIcon: crossIcon,
                label: s === 'cancelled' ? 'Cancelled' : 'Failed',
                statusFilter: 'invert(27%) sepia(91%) saturate(7483%) hue-rotate(356deg) brightness(101%) contrast(106%)'
            };
        }
    };

    const config = getStatusConfig(order.status);
    const s = order.status.toLowerCase();
        const isProcessing = ['processing', 'out_for_delivery', 'arrived', 'accepted', 'picked_up', 'at_store', 'pending'].includes(s);
    const isSuccess = ['success', 'delivered'].includes(s);
    const isFailed = ['failed', 'cancelled'].includes(s);

    const viewState = {
        latitude: order.addresses?.latitude || 12.9716,
        longitude: order.addresses?.longitude || 77.5946,
        zoom: 14.5
    };

    const routeGeoJson = {
        type: "Feature" as const,
        properties: {},
        geometry: {
            type: "LineString" as const,
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

    // Unified render for all states

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Sheet — `transition-all` was animating min-height swings as the
                sheet content loaded, which forces layout reflow each frame.
                Restrict to compositor-only properties. */}
            <div
                className={`relative w-full h-auto min-h-[50vh] max-h-[90vh] rounded-t-[32px] overflow-hidden transition-[transform,opacity] duration-300 shadow-2xl mt-[100px] ${isDarkMode ? '' : 'bg-white'}`}
                style={{
                    background: isDarkMode ? 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)) padding-box, linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.20) 100%) border-box' : undefined,
                    border: isDarkMode ? '0.63px solid transparent' : 'none',
                    borderTopLeftRadius: '32px',
                    borderTopRightRadius: '32px',
                    backdropFilter: isDarkMode ? 'blur(16px)' : 'none',
                    WebkitBackdropFilter: isDarkMode ? 'blur(16px)' : 'none',
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                    WebkitTransform: 'translateZ(0)',
                }}
            >
                {/* Internal Scroller - This ensures padding and scrolling don't break the rounded top corners */}
                <div className="w-full h-full max-h-[inherit] overflow-y-auto custom-scrollbar pt-4 pb-10 px-5 rounded-t-[32px]">
                    {/* Drag Handle Container */}
                    <div className="w-full flex justify-center pb-6">
                        <div className={`w-[48px] h-[5px] rounded-full ${isDarkMode ? 'bg-[#313033]' : 'bg-[#E6E8EB]'}`} />
                    </div>

                    {/* Order Summary Card */}
                    <div
                        className="relative mb-[13px] mx-auto overflow-hidden"
                        style={{
                            width: '362px',
                            height: '137px',
                            background: isDarkMode
                                ? `linear-gradient(${(config.bgColor || config.color)}${Math.round(config.bgOpacity * 255).toString(16).padStart(2, '0')}, ${(config.bgColor || config.color)}${Math.round(config.bgOpacity * 255).toString(16).padStart(2, '0')}) padding-box, linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.20) 100%) border-box`
                                : `${(config.bgColor || config.color)}36`, // ~21% opacity
                            border: isDarkMode ? '0.63px solid transparent' : '1px solid #E9EAEB',
                            borderRadius: '13px',
                            backdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
                            WebkitBackdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
                        }}
                    >
                        {/* Status Frame */}
                        <div className="h-[25px] flex items-center pl-[13.5px]">
                            <div className="flex items-center gap-[6px]">
                                <img src={config.statusIcon} alt="" className="w-[14px] h-[14px]" style={!isDarkMode ? { filter: config.statusFilter } : {}} />
                                <span className="text-[12px] font-bold font-satoshi tracking-wide" style={{ color: config.color }}>
                                    {config.label}
                                </span>
                            </div>
                        </div>

                        {/* Inner Frame */}
                        <div
                            className={`absolute top-[25px] left-0 w-full rounded-b-[13px] ${isDarkMode ? '' : 'bg-white border-t border-[#E9EAEB]'}`}
                            style={{
                                height: '112px',
                                backgroundImage: isDarkMode ? `url(${innerFrameBg})` : 'none',
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        >
                            <img src={config.icon} alt="" className="absolute top-[17px] left-[17px] w-[35px] h-[35px]" />

                            <div className="absolute top-[17px] left-[65px] flex flex-col">
                                <span className={`text-[16px] font-satoshi leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {(order.meta_data as any)?.isFx ? "FX Exchange" : (order.addresses?.label ? `Order to ${order.addresses.label}` : "Cash Order")}
                                </span>
                                <span className={`text-[12px] font-medium font-satoshi mt-1 ${isDarkMode ? 'text-white' : 'text-black/50'}`}>
                                    {formatOrderDate(order.created_at)}
                                </span>
                            </div>

                            <span className={`absolute top-[25px] right-[17px] text-[16px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {(order.meta_data as any)?.isFx
                                    ? `${currencySymbols[(order.meta_data as any).toCurrency as string] || ''}${Number((order.meta_data as any).receiveAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `₹${order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                }
                            </span>

                            <div className="absolute left-[12px] h-[1px]" style={{ top: '65px', width: '338px', backgroundColor: isDarkMode ? '#363636' : '#E6E8EB' }} />

                            <div className="absolute left-[17px] right-[17px] flex justify-between items-center px-0" style={{ top: '78px' }}>
                                <span className={`text-[12px] font-satoshi font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Order ID</span>
                                <span className={`text-[12px] font-bold font-satoshi tracking-wider uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    DTP{order.id.substring(0, 8).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Details Separator */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`flex-1 h-[0.6px] ${isDarkMode ? 'bg-white/10' : 'bg-[#E9EAEB]'}`} />
                        <span className={`text-[12px] font-bold tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-black'}`}>DETAILS</span>
                        <div className={`flex-1 h-[0.6px] ${isDarkMode ? 'bg-white/10' : 'bg-[#E9EAEB]'}`} />
                    </div>

                    {/* Delivery Container - Processing/Success only */}
                    {(isProcessing || isSuccess) && (
                        <div
                            className="relative rounded-[13px] overflow-hidden mb-6 mx-auto"
                            style={{
                                width: '362px',
                                height: '128px',
                                background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.20) 100%) border-box',
                                border: isDarkMode ? '0.63px solid transparent' : '1px solid #E9EAEB',
                                paddingTop: '8px',
                            }}
                        >
                            {/* Address Info Header */}
                            <div className="px-[16px] flex justify-between items-start mb-2">
                                <span className="text-white text-[12px] font-medium font-satoshi">Delivered to - {order.addresses?.label || "Home"}</span>
                                <span className="text-white text-[12px] font-satoshi max-w-[150px] truncate text-right">
                                    {order.addresses?.apartment}, {order.addresses?.area}
                                </span>
                            </div>

                            {isProcessing && (
                                <div className="w-full px-0">
                                    <div className={`relative h-[95px] w-full ${isDarkMode ? 'rounded-[13px] border-[1px] mt-1 bg-[#191919]/34 border-white/5 border-t-0 border-l-0 border-r-0' : 'bg-white'}`}>
                                        <div className="p-[14px]">
                                            <div className="max-w-[170px]">
                                                <p className={`text-[14px] font-medium font-satoshi leading-tight mb-[2px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                    We’re assigning a delivery <br /> partner soon!
                                                </p>
                                                <p className={`text-[12px] font-normal font-satoshi leading-snug ${isDarkMode ? 'text-white/60' : 'text-[#7E7E7E]'}`}>Assigning a delivery partner in the next 2 minutes.</p>
                                            </div>
                                            <div className="absolute top-[13.5px] right-[13.5px] w-[98px] h-[68px] rounded-[6px] overflow-hidden">
                                                <Map
                                                    {...viewState}
                                                    style={{ width: "100%", height: "100%" }}
                                                    mapStyle={isDarkMode ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"}
                                                    attributionControl={false}
                                                    interactive={false}
                                                >
                                                    <Source id="route" type="geojson" data={routeGeoJson}>
                                                        <Layer {...routeLayer} />
                                                    </Source>
                                                    <Marker latitude={viewState.latitude} longitude={viewState.longitude}>
                                                        <div className="animate-pulse">
                                                            <img src={currentLocationIcon} alt="User" className="w-4 h-4" />
                                                        </div>
                                                    </Marker>
                                                    <Marker latitude={viewState.latitude + 0.002} longitude={viewState.longitude + 0.002}>
                                                        <img src={deliveryRiderIcon} alt="Rider" className="w-5 h-5" />
                                                    </Marker>
                                                </Map>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isSuccess && (
                                <div className="w-full px-0">
                                    <div className={`relative h-[95px] w-full ${isDarkMode ? 'rounded-[13px] border-[1px] mt-1 bg-[#191919]/34 border-white/5 border-t-0 border-l-0 border-r-0' : 'bg-white'}`}>
                                        <div className="p-[14px]">
                                            <div className="flex gap-4 items-start">
                                                <div className="w-[64px] h-[68px] relative shrink-0 rounded-[6px] overflow-hidden">
                                                    <img
                                                        src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=80"
                                                        alt="Rider"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Verified Tag Bar */}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-[#16B751] h-[18px] flex items-center justify-center gap-[6px] z-10">
                                                        <img src={verifiedIcon} alt="V" className="w-[12px] h-[12px]" />
                                                        <span className="text-white text-[10px] font-medium font-satoshi">Verified</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 -mt-1">
                                                    <p className={`text-[14px] font-medium font-satoshi leading-tight mb-[6px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                        Your order was successfully delivered by Rohit Khandelwal.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star
                                                                key={s}
                                                                size={20}
                                                                fill={rating >= s ? "#FACC15" : "none"}
                                                                stroke="#FACC15"
                                                                className="cursor-pointer"
                                                                onClick={() => setRating(s)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transaction Details Box - Only for Processing state */}
                    {isProcessing && (
                        <div
                            className="relative w-[362px] mx-auto rounded-[12px] mb-6 overflow-hidden"
                            style={{
                                height: '249px',
                                backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF',
                                backgroundImage: isDarkMode ? `url(${transactionDetailsBg})` : 'none',
                                backgroundSize: '100% 100%',
                                padding: '10px 10px 17px 10px',
                                border: isDarkMode ? 'none' : '1px solid #E9EAEB'
                            }}
                        >
                            <h3 className={`text-[16px] font-medium font-satoshi px-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Transaction Details</h3>

                            <div className={`w-[338px] h-[1px] mt-[10px] mb-[15px] mx-auto ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E6E8EB]'}`} />

                            <div className="flex flex-col gap-[8px] px-1">
                                <div className="flex justify-between items-center">
                                    <span className={`text-[14px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Transaction Number</span>
                                    <span className={`text-[14px] font-bold font-satoshi uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        201239AHSUBW234
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[14px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Date & Time</span>
                                    <span className={`text-[14px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}, {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-[14px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Payment Mode</span>
                                    <span className={`text-[14px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Grid.Pe Wallet</span>
                                </div>

                                <div className="mt-2 flex flex-col gap-4">
                                    <p className={`text-[13px] font-normal font-satoshi leading-tight ${isDarkMode ? 'text-white/40' : 'text-black/50'}`}>
                                        No charges yet — your wallet will only be debited after you confirm the delivery.
                                    </p>
                                    <p className={`text-[13px] font-normal font-satoshi leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        If you need to cancel, you can do so within 30 seconds or before a delivery partner is assigned, whichever is earlier.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tip & Feedback Container - Only for Success state */}
                    {isSuccess && (
                        <div
                            className="mx-auto rounded-[13px] mb-[13px] overflow-y-auto custom-scrollbar relative"
                            style={{
                                width: '362px',
                                height: '367px',
                                background: isDarkMode ? 'rgba(25, 25, 25, 0.30)' : '#FFFFFF',
                                border: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '1px solid #E9EAEB',
                                padding: '14px 15px 24px 15px',
                                backdropFilter: isDarkMode ? 'blur(24px)' : 'none',
                                WebkitBackdropFilter: isDarkMode ? 'blur(24px)' : 'none',
                            }}
                        >
                            {/* Tip Header */}
                            <div className="flex items-center gap-2 mb-[15px]">
                                <span className={`text-[15px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Add Tip</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeliveryTipPopup(true);
                                    }}
                                    className="flex items-center justify-center w-[16px] h-[16px]"
                                >
                                    <img src={isDarkMode ? deliveryTipInfo : infoTipIcon} alt="Info" className={`w-full h-full ${!isDarkMode ? '' : 'brightness-0 opacity-100 invert-[38%] sepia-[68%] saturate-[3440%] hue-rotate-[197deg] brightness-[102%] contrast-[106%]'}`} style={isDarkMode ? { filter: 'none' } : {}} />
                                </button>
                            </div>

                            {/* Tip Subheading */}
                            <p className={`text-[12px] font-normal font-satoshi mb-[15px] leading-tight ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                Your tip goes directly to the rider and Grid.Pe and doesn’t keep any share of it.
                            </p>

                            {/* Tip Chips */}
                            <div className="flex items-center justify-between mb-[22px]">
                                {['10', '20', '30'].map((val) => (
                                    <div key={val} className="relative shrink-0" style={{ width: '78px', height: '37px' }}>
                                        <button
                                            onClick={() => handleTipSelect(val)}
                                            className={`relative block w-full h-full transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none ${val === '20' ? 'rounded-[19px]' : 'rounded-full'}`}
                                            style={isDarkMode ? {
                                                backgroundImage: `url(${selectedTipOption === val ? selectedPillBg : pillBg})`,
                                                backgroundSize: '100% 100%',
                                                backgroundRepeat: 'no-repeat',
                                                boxSizing: 'border-box'
                                            } : { backgroundColor: selectedTipOption === val ? '#5260FE' : '#FFFFFF', border: '1px solid #E6E8EB' }}
                                        >
                                            <div
                                                className={`absolute left-0 right-0 flex justify-center items-center gap-[10px] z-20 ${val === '20' ? 'top-[2.5px]' : 'top-1/2 -translate-y-1/2'}`}
                                            >
                                                <span className={`font-medium font-satoshi text-[15px] leading-none ${isDarkMode || selectedTipOption === val ? 'text-white' : 'text-black'}`}>
                                                    ₹{val}
                                                </span>

                                                {selectedTipOption === val && (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleClearTip(e);
                                                        }}
                                                        className="cursor-pointer hover:opacity-80 flex items-center justify-center w-[12px] h-[12px]"
                                                    >
                                                        <img src={crossIconPng} alt="Remove" className="w-full h-full object-contain" />
                                                    </div>
                                                )}
                                            </div>

                                            {val === '20' && (
                                                <div className="absolute top-[23px] left-0 right-0 h-[14px] bg-[#5260FE] flex items-center justify-center z-10 pointer-events-none">
                                                    <span className="text-white text-[7px] font-bold font-satoshi uppercase tracking-wider leading-none">
                                                        MOST TIPPED
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                ))}
                                <div className="relative shrink-0" style={{ width: '78px', height: '37px' }}>
                                    <button
                                        onClick={() => handleTipSelect('other')}
                                        className={`relative flex items-center justify-center transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none rounded-full ${selectedTipOption === 'other' ? 'flex-row gap-[6px]' : ''}`}
                                        style={isDarkMode ? {
                                            width: '78px',
                                            height: '37px',
                                            backgroundImage: `url(${selectedTipOption === 'other' ? selectedPillBg : pillBg})`,
                                            backgroundSize: '100% 100%',
                                            backgroundRepeat: 'no-repeat',
                                            boxSizing: 'border-box'
                                        } : {
                                            width: '78px',
                                            height: '37px',
                                            backgroundColor: selectedTipOption === 'other' ? '#5260FE' : '#FFFFFF',
                                            border: '1px solid #E6E8EB'
                                        }}
                                    >
                                        <span className={`font-medium font-satoshi text-[14px] z-20 relative leading-none ${isDarkMode || selectedTipOption === 'other' ? 'text-white' : 'text-black'}`}>Other</span>
                                        {selectedTipOption === 'other' && (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClearCustomTip();
                                                }}
                                                className="z-30 cursor-pointer hover:opacity-80 flex items-center justify-center w-[10px] h-[10px]"
                                            >
                                                <img src={crossIconPng} alt="Remove" className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Other Tip Input Overlay - Not absolute anymore, follows OrderCashSummary style */}
                            {selectedTipOption === 'other' && (
                                <div className="w-full mb-[22px]">
                                    <div className={`h-[48px] w-full rounded-full border flex items-center px-4 ${isDarkMode ? 'bg-[#191919] border-white/10' : 'bg-white border-[#E6E8EB]'}`}>
                                        <span className={`font-medium font-satoshi mr-2 text-[14px] ${isDarkMode ? 'text-white' : 'text-black'}`}>₹</span>
                                        <input
                                            type="text"
                                            placeholder="Enter tip amount"
                                            value={customTipValue}
                                            onChange={handleCustomTipChange}
                                            className={`bg-transparent font-satoshi text-[14px] focus:outline-none flex-1 ${isDarkMode ? 'text-white placeholder:text-white/30' : 'text-black placeholder:text-black/30'}`}
                                            autoFocus
                                        />
                                        <button
                                            onClick={tipAmount > 0 ? handleClearCustomTip : handleApplyCustomTip}
                                            className="text-[#5260FE] text-[13px] font-medium font-satoshi ml-2"
                                        >
                                            {tipAmount > 0 ? "Clear" : "Apply"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Feedback Section */}
                            <div
                                className={`rounded-[12px] border overflow-hidden mb-[22px] ${isDarkMode ? 'border-white/10' : 'border-[#E6E8EB]'}`}
                                style={{ width: '332px', height: '111px' }}
                            >
                                <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-white/10' : 'border-[#E6E8EB]'}`}>
                                    <span className={`text-[12px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Feedback (Optional)</span>
                                </div>
                                <textarea
                                    className={`w-full h-[70px] bg-transparent p-4 text-[14px] font-satoshi outline-none resize-none ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-black/30'}`}
                                    placeholder="Driver was... (e.g. punctual, polite, helpful)"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                className={`rounded-full flex items-center justify-center text-[16px] font-bold active:scale-[0.98] transition-all border-none ${isDarkMode ? 'text-white' : 'text-white bg-black'}`}
                                style={{
                                    width: '332px',
                                    height: '48px',
                                    backgroundImage: isDarkMode ? `url(${darkCtaBg})` : 'none',
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                }}
                                onClick={onClose}
                            >
                                Submit
                            </button>
                        </div>
                    )}

                    {/* Repeat Order Button */}
                    {isSuccess && (
                        <button
                            className="mx-auto rounded-full bg-[#5260FE] flex items-center justify-center mb-[10px] active:scale-[0.98] transition-all"
                            style={{
                                width: '364px',
                                height: '48px',
                            }}
                            onClick={() => {
                                onClose();
                                navigate('/');
                            }}
                        >
                            <span className="text-white text-[16px] font-medium font-satoshi">Repeat Order</span>
                        </button>
                    )}

                    {/* Reason for Failure Box - Only for Failed/Cancelled state */}
                    {isFailed && (
                        <div
                            className="relative w-[362px] mx-auto rounded-[12px] mb-6 overflow-hidden"
                            style={{
                                height: 'auto',
                                minHeight: '230px',
                                backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF',
                                backgroundImage: isDarkMode ? `url(${transactionDetailsBg})` : 'none',
                                backgroundSize: '100% 100%',
                                padding: '10px 10px 17px 10px',
                                border: isDarkMode ? 'none' : '1px solid #E9EAEB'
                            }}
                        >
                            <h3 className={`text-[16px] font-medium font-satoshi px-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Reason for failure</h3>

                            <div className={`w-[338px] h-[1px] mt-[10px] mb-[15px] mx-auto ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E6E8EB]'}`} />

                            <div className="flex flex-col gap-[12px] px-1">
                                <p className={`text-[14px] font-satoshi font-normal leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {(order.meta_data as any)?.cancellation_reason || (order.meta_data as any)?.cancel_reason_text || (order.status === 'cancelled' ? 'Order was cancelled by the user.' : 'Payment was declined by your bank.')}
                                </p>

                                <div className="flex justify-between items-center">
                                    <span className={`text-[14px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Time</span>
                                    <span className={`text-[14px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className={`text-[14px] font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Payment Mode</span>
                                    <span className={`text-[14px] font-bold font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Wallet</span>
                                </div>

                                <div className={`w-full h-[1px] my-1 ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E6E8EB]'}`} />

                                <p className={`text-[13px] font-normal font-satoshi leading-tight ${isDarkMode ? 'text-white/40' : 'text-black/50'}`}>
                                    No amount has been deducted from your mode of payment. Any deducted amount will be refunded within 1-2 business days.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons - For Processing and Failed/Success Help */}
                    <div className="flex flex-col gap-3">
                        {isProcessing && (
                            <button
                                onClick={() => {
                                    hapticWarning();
                                    onCancel?.(order.id);
                                }}
                                className="mx-auto rounded-full flex items-center justify-center text-white text-[16px] font-bold active:scale-95 transition-transform mb-6"
                                style={{
                                    width: '364px',
                                    height: '48px',
                                    backgroundImage: isDarkMode ? `url(${darkCtaBg})` : 'none',
                                    backgroundColor: isDarkMode ? 'transparent' : '#000000',
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    border: 'none'
                                }}
                            >
                                Cancel Order
                            </button>
                        )}

                        {isFailed && (
                            <button
                                onClick={() => navigate('/help/report', { state: { order } })}
                                className="mx-auto rounded-full flex items-center justify-center text-[16px] font-bold active:scale-95 transition-transform mb-6"
                                style={{
                                    width: '364px',
                                    height: '48px',
                                    backgroundImage: isDarkMode ? `url(${darkCtaBg})` : 'none',
                                    backgroundColor: isDarkMode ? 'transparent' : '#000000',
                                    border: isDarkMode ? 'none' : 'none',
                                    color: 'white',
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            >
                                Need Help?
                            </button>
                        )}
                    </div>
                </div>

                {/* Delivery Tip Popup - Exact Implementation from OrderCashSummary */}
                {showDeliveryTipPopup && (
                    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
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
        </div>
    );
};

export default OrderDetailsSheet;
