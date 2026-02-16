import React, { useState } from "react";
import { X, Info, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import { Order } from "@/lib/orders";
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
import transactionDetailsBg from "@/assets/transaction-details.png";
import darkCtaBg from "@/assets/darkbg-cta.png";
import deliveryTipInfo from "@/assets/delivery-tip-info.svg";
import verifiedIcon from "@/assets/verified.svg";
import pillBg from "@/assets/pill.png";
import selectedPillBg from "@/assets/selected-pill.png";
import crossIconPng from "@/assets/cross-icon.png";
import popupBg from "@/assets/popup-bg.png";
import buttonCloseBg from "@/assets/button-close.png";
import popupCardIcon from "@/assets/card-ico.svg";

interface OrderDetailsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onCancel?: (orderId: string) => void;
}

const OrderDetailsSheet: React.FC<OrderDetailsSheetProps> = ({ isOpen, onClose, order, onCancel }) => {
    const navigate = useNavigate();
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

            const timeStr = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            if (isToday) {
                return `Today | ${timeStr}`;
            } else {
                const day = date.getDate().toString().padStart(2, '0');
                const month = date.toLocaleString('en-GB', { month: 'short' });
                return `${day} ${month} | ${timeStr}`;
            }
        } catch (e) {
            return "Today | 12:00 PM";
        }
    };

    const getStatusConfig = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'processing' || s === 'out_for_delivery' || s === 'arrived') {
            return {
                color: '#FACC15',
                bgOpacity: 0.21,
                icon: processingIcon,
                statusIcon: refreshIcon,
                label: 'Processing'
            };
        } else if (s === 'success' || s === 'delivered') {
            return {
                color: '#1CB956',
                bgOpacity: 0.21,
                icon: successIcon,
                statusIcon: checkIcon,
                label: 'Success'
            };
        } else {
            return {
                color: '#FF1E1E',
                bgOpacity: 0.21,
                icon: failedIcon,
                statusIcon: crossIcon,
                label: s === 'cancelled' ? 'Cancelled' : 'Failed'
            };
        }
    };

    const config = getStatusConfig(order.status);
    const s = order.status.toLowerCase();
    const isProcessing = ['processing', 'out_for_delivery', 'arrived'].includes(s);
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

            {/* Sheet */}
            <div
                className="relative w-full h-auto min-h-[50vh] max-h-[90vh] rounded-t-[32px] pt-4 pb-10 px-5 overflow-y-auto custom-scrollbar transition-all duration-300 shadow-2xl mt-[100px]"
                style={{
                    background: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)) padding-box, linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.20) 100%) border-box',
                    border: '0.63px solid transparent',
                    borderTopLeftRadius: '32px',
                    borderTopRightRadius: '32px',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                }}
            >
                {/* Drag Handle Container (approx 40px padding top/bottom equivalent) */}
                <div className="w-full flex justify-center pb-6">
                    <div className="w-[48px] h-[5px] bg-[#313033] rounded-full" />
                </div>

                {/* Order Summary Card */}
                <div
                    className="relative mb-[13px] mx-auto overflow-hidden"
                    style={{
                        width: '362px',
                        height: '137px',
                        background: `linear-gradient(${config.color}${Math.round(config.bgOpacity * 255).toString(16).padStart(2, '0')}, ${config.color}${Math.round(config.bgOpacity * 255).toString(16).padStart(2, '0')}) padding-box, linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.20) 100%) border-box`,
                        border: '0.63px solid transparent',
                        borderRadius: '13px',
                        backdropFilter: 'blur(25.02px)',
                        WebkitBackdropFilter: 'blur(25.02px)',
                    }}
                >
                    {/* Status Frame */}
                    <div className="h-[25px] flex items-center pl-[13.5px]">
                        <div className="flex items-center gap-[6px]">
                            <img src={config.statusIcon} alt="" className="w-[14px] h-[14px]" />
                            <span className="text-[12px] font-bold font-satoshi tracking-wide" style={{ color: config.color }}>
                                {config.label}
                            </span>
                        </div>
                    </div>

                    {/* Inner Frame */}
                    <div
                        className="absolute top-[25px] left-0 w-full rounded-[13px]"
                        style={{
                            height: '112px',
                            backgroundImage: `url(${innerFrameBg})`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    >
                        <img src={config.icon} alt="" className="absolute top-[17px] left-[17px] w-[35px] h-[35px]" />

                        <div className="absolute top-[17px] left-[65px] flex flex-col">
                            <span className="text-white text-[16px] font-satoshi leading-tight">
                                {order.addresses?.label ? `Order to ${order.addresses.label}` : "Cash Order"}
                            </span>
                            <span className="text-white text-[12px] font-medium font-satoshi mt-1">
                                {formatOrderDate(order.created_at)}
                            </span>
                        </div>

                        <span className="absolute top-[25px] right-[17px] text-white text-[16px] font-medium font-satoshi">
                            ₹{order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>

                        <div className="absolute left-[12px] h-[1px]" style={{ top: '65px', width: '338px', backgroundColor: '#363636' }} />

                        <div className="absolute left-[17px] right-[17px] flex justify-between items-center px-0" style={{ top: '78px' }}>
                            <span className="text-white text-[12px] font-satoshi font-medium">Order ID</span>
                            <span className="text-white text-[12px] font-bold font-satoshi tracking-wider uppercase">
                                DTP{order.id.substring(0, 8).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Separator */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-[0.6px] bg-white/10" />
                    <span className="text-white/40 text-[12px] font-bold tracking-[0.2em]">DETAILS</span>
                    <div className="flex-1 h-[0.6px] bg-white/10" />
                </div>

                {/* Delivery Container - Processing/Success only */}
                {(isProcessing || isSuccess) && (
                    <div
                        className="relative rounded-[13px] overflow-hidden mb-6 mx-auto"
                        style={{
                            width: '362px',
                            height: '128px',
                            background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.20) 100%) border-box',
                            border: '0.63px solid transparent',
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
                                <div className="rounded-[13px] bg-[#191919]/34 border-t-[1px] border-white/5 h-[95px] relative">
                                    <div className="p-[14px]">
                                        <div className="max-w-[180px]">
                                            <p className="text-white text-[14px] font-medium font-satoshi leading-tight mb-[12px]">
                                                We’re assigning a delivery <br /> partner soon!
                                            </p>
                                            <p className="text-white text-[12px] font-light font-satoshi">Assigning a delivery partner in the next 2 minutes.</p>
                                        </div>
                                        <div className="absolute top-[14px] right-[14px] w-[110px] h-[82px] rounded-[6px] overflow-hidden">
                                            <Map
                                                {...viewState}
                                                style={{ width: "100%", height: "100%" }}
                                                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
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
                                <div className="rounded-[13px] bg-[#191919]/34 border-t-[1px] border-white/5 h-[95px] relative">
                                    <div className="p-[14px]">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-[64px] h-[70px] relative shrink-0 rounded-[6px] overflow-hidden">
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
                                            <div className="flex-1">
                                                <p className="text-white text-[14px] font-medium font-satoshi leading-tight mb-2 mt-1">
                                                    Your order was successfully delivered by Rohit Khandelwal.
                                                </p>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            size={20}
                                                            fill={rating >= s ? "#FACC15" : "none"}
                                                            stroke={rating >= s ? "#FACC15" : "#4A4A4A"}
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
                            backgroundImage: `url(${transactionDetailsBg})`,
                            backgroundSize: '100% 100%',
                            padding: '10px 10px 17px 10px'
                        }}
                    >
                        <h3 className="text-white text-[16px] font-medium font-satoshi px-1">Transaction Details</h3>

                        <div className="w-[338px] h-[1px] bg-[#202020] mt-[10px] mb-[15px] mx-auto" />

                        <div className="flex flex-col gap-[8px] px-1">
                            <div className="flex justify-between items-center">
                                <span className="text-white text-[14px] font-satoshi">Transaction Number</span>
                                <span className="text-white text-[14px] font-bold font-satoshi uppercase">
                                    201239AHSUBW234
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white text-[14px] font-satoshi">Date & Time</span>
                                <span className="text-white text-[14px] font-bold font-satoshi">
                                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, {new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white text-[14px] font-satoshi">Payment Mode</span>
                                <span className="text-white text-[14px] font-bold font-satoshi">Grid.Pe Wallet</span>
                            </div>

                            <div className="mt-2 flex flex-col gap-4">
                                <p className="text-white/40 text-[13px] font-normal font-satoshi leading-tight">
                                    No charges yet — your wallet will only be debited after you confirm the delivery.
                                </p>
                                <p className="text-white text-[13px] font-normal font-satoshi leading-tight">
                                    If you need to cancel, you can do so within 30 seconds or before a delivery partner is assigned, whichever is earlier.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isSuccess && (
                    <>
                        {/* Tip Section - Exact Implementation from OrderCashSummary */}
                        <div className="mb-6 px-1">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-white text-[16px] font-medium font-satoshi">Delivery Tip</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeliveryTipPopup(true);
                                    }}
                                    className="flex items-center justify-center w-[14px] h-[14px]"
                                >
                                    <img src={deliveryTipInfo} alt="Info" className="w-full h-full" />
                                </button>
                            </div>
                            <p className="text-white/80 text-[13px] font-normal font-sans mb-5 leading-snug">
                                A small tip, goes a big way! Totally optional — but your rider will appreciate it ❤️
                            </p>
                            <div className="flex items-center gap-3">
                                {['10', '20', '30'].map((val) => (
                                    <div key={val} className="relative shrink-0" style={{ width: '74px', height: '38px' }}>
                                        <button
                                            onClick={() => handleTipSelect(val)}
                                            className={`relative block w-full h-full transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none ${val === '20' ? 'rounded-[19px]' : ''}`}
                                            style={{
                                                backgroundImage: `url(${selectedTipOption === val ? selectedPillBg : pillBg})`,
                                                backgroundSize: '100% 100%',
                                                backgroundRepeat: 'no-repeat',
                                                boxSizing: 'border-box'
                                            }}
                                        >
                                            <div
                                                className={`absolute left-0 right-0 flex justify-center items-center gap-[10px] z-20 ${val === '20' ? 'top-[2px]' : 'top-1/2 -translate-y-1/2'}`}
                                            >
                                                <span className="text-white font-medium font-satoshi text-[15px] leading-none">
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
                                <div className="relative shrink-0" style={{ width: '74px', height: '38px' }}>
                                    <button
                                        onClick={() => handleTipSelect('other')}
                                        className={`relative flex items-center justify-center transition-all z-10 overflow-hidden p-0 m-0 border-none outline-none ${selectedTipOption === 'other' ? 'flex-row gap-[10px]' : ''}`}
                                        style={{
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
                                        }}
                                    >
                                        <span className="text-white font-medium font-satoshi text-[15px] z-20 relative leading-none">Other</span>
                                        {selectedTipOption === 'other' && (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClearCustomTip();
                                                }}
                                                className="z-30 cursor-pointer hover:opacity-80 flex items-center justify-center w-[12px] h-[12px]"
                                            >
                                                <img src={crossIconPng} alt="Remove" className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {selectedTipOption === 'other' && (
                                <div className="mt-[15px] h-[48px] w-full bg-[#191919] rounded-full border border-white/10 flex items-center pl-4 pr-4">
                                    <span className="text-white font-medium font-satoshi mr-2">₹</span>
                                    <input
                                        type="text"
                                        placeholder="Enter tip amount"
                                        value={customTipValue}
                                        onChange={handleCustomTipChange}
                                        className="bg-transparent text-white font-satoshi text-[14px] placeholder:text-white/30 focus:outline-none flex-1"
                                    />
                                    <button
                                        onClick={tipAmount > 0 ? handleClearCustomTip : handleApplyCustomTip}
                                        className="text-[#5260FE] text-[13px] font-medium font-satoshi ml-2"
                                    >
                                        {tipAmount > 0 ? "Clear" : "Apply"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Feedback Section */}
                        <div className="mb-6 px-1">
                            <div className="rounded-[16px] border border-white/10 overflow-hidden">
                                <div className="px-4 py-2 border-b border-white/10">
                                    <span className="text-white text-[12px] font-medium font-satoshi">Feedback (Optional)</span>
                                </div>
                                <textarea
                                    className="w-full h-[90px] bg-transparent p-4 text-white text-[14px] font-satoshi placeholder:text-white/20 outline-none resize-none"
                                    placeholder="Driver was... (e.g. punctual, polite, helpful)"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="mx-auto rounded-full flex items-center justify-center text-white text-[16px] font-bold active:scale-[0.98] transition-all border-none mb-6"
                            style={{
                                width: '364px',
                                height: '48px',
                                backgroundImage: `url(${darkCtaBg})`,
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                            }}
                            onClick={onClose}
                        >
                            Submit
                        </button>

                        {/* Repeat Order Button */}
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
                    </>
                )}



                {/* Reason for Failure Box - Only for Failed/Cancelled state */}
                {isFailed && (
                    <div
                        className="relative w-[362px] mx-auto rounded-[12px] mb-6 overflow-hidden"
                        style={{
                            height: 'auto',
                            minHeight: '230px',
                            backgroundImage: `url(${transactionDetailsBg})`,
                            backgroundSize: '100% 100%',
                            padding: '10px 10px 17px 10px'
                        }}
                    >
                        <h3 className="text-white text-[16px] font-medium font-satoshi px-1">Reason for failure</h3>

                        <div className="w-[338px] h-[1px] bg-[#202020] mt-[10px] mb-[15px] mx-auto" />

                        <div className="flex flex-col gap-[12px] px-1">
                            <p className="text-white text-[14px] font-satoshi font-normal leading-tight">
                                {order.metadata?.cancellation_reason || (order.status === 'cancelled' ? 'Order was cancelled by the user.' : 'Payment was declined by your bank.')}
                            </p>

                            <div className="flex justify-between items-center">
                                <span className="text-white text-[14px] font-satoshi">Time</span>
                                <span className="text-white text-[14px] font-bold font-satoshi">
                                    {new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-white text-[14px] font-satoshi">Payment Mode</span>
                                <span className="text-white text-[14px] font-bold font-satoshi">Wallet</span>
                            </div>

                            <div className="w-full h-[1px] bg-[#202020] my-1" />

                            <p className="text-white/40 text-[13px] font-normal font-satoshi leading-tight">
                                No amount has been deducted from your mode of payment. Any deducted amount will be refunded within 1-2 business days.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons - For Processing and Failed/Success Help */}
                <div className="flex flex-col gap-3">
                    {isProcessing && (
                        <button
                            onClick={() => onCancel?.(order.id)}
                            className="mx-auto rounded-full flex items-center justify-center text-white text-[16px] font-bold active:scale-95 transition-transform border-none mb-6"
                            style={{
                                width: '364px',
                                height: '48px',
                                backgroundImage: `url(${darkCtaBg})`,
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                            }}
                        >
                            Cancel Order
                        </button>
                    )}

                    {(isFailed || isSuccess) && (
                        <button
                            className="mx-auto rounded-full flex items-center justify-center text-white text-[16px] font-medium active:scale-95 transition-transform border border-white/10 mb-6"
                            style={{
                                width: '364px',
                                height: '48px',
                                backgroundImage: `url(${darkCtaBg})`,
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                            }}
                            onClick={() => navigate('/help/report', { state: { order } })}
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
                        className="relative rounded-2xl p-6 max-w-[320px] w-full z-10 flex flex-col items-center text-center border border-white/10"
                        style={{
                            backgroundImage: `url(${popupBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <img src={popupCardIcon} alt="Delivery Tip" className="w-8 h-8 mb-4 object-contain" />
                        <h2 className="text-white text-[18px] font-medium mb-4 font-satoshi">Delivery Tip</h2>
                        <div className="bg-black rounded-xl w-full px-[12px] py-[11px]">
                            <p className="text-white text-[13px] font-normal font-satoshi leading-relaxed text-left mb-[6px]">
                                Our delivery partners ride through traffic, harsh weather, and long distances to bring your cash safely to your door.
                            </p>
                            <p className="text-white text-[13px] font-normal font-satoshi leading-relaxed text-left">
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
                        <X className="w-4 h-4 text-white" />
                        <span className="text-white text-[14px] font-satoshi">Close</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrderDetailsSheet;
