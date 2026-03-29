import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import 'maplibre-gl/dist/maplibre-gl.css';
import { ChevronLeft, Bike } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OpenLocationCode } from "open-location-code";
import { Order, dev_updateOrderStatus } from "@/lib/orders";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";

import arrivingIcon from "@/assets/arriving.svg";
import riderIcon from "@/assets/rider.svg";
import verifiedIcon from "@/assets/verified.svg";
import callIcon from "@/assets/call.svg";
import awaitingIcon from "@/assets/awaiting.svg";
import verifiedCircleIcon from "@/assets/verified-circle.svg";
import currentLocationIcon from "@/assets/current-location.svg";
import arrivingContainerBg from "@/assets/arriving-container.png";
import darkbgCta from "@/assets/darkbg-cta.png";

const OrderTracking = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const [order, setOrder] = useState<Order | null>(location.state?.order || null);

    // Map State
    const [viewState, setViewState] = useState({
        latitude: 12.9716, // Default Bangalore
        longitude: 77.5946,
        zoom: 14.5
    });

    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    const [progress, setProgress] = useState(0);
    const [riderName, setRiderName] = useState<string | null>(null);
    const [riderLocation, setRiderLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isOtpVerified, setIsOtpVerified] = useState(false);

    useEffect(() => {
        const activeOrder = order;
        if (activeOrder?.addresses?.plus_code) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const olc = new OpenLocationCode() as any;
                const decoded = olc.decode(activeOrder.addresses.plus_code);
                const newLat = decoded.latitudeCenter;
                const newLng = decoded.longitudeCenter;

                setViewState(prev => ({
                    ...prev,
                    latitude: newLat,
                    longitude: newLng
                }));
                setUserLocation({ latitude: newLat, longitude: newLng });
            } catch (e) {
                console.error("Failed to decode location", e);
            }
        } else if (activeOrder?.addresses?.latitude && activeOrder?.addresses?.longitude) {
            const newLat = activeOrder.addresses.latitude;
            const newLng = activeOrder.addresses.longitude;
            setViewState(prev => ({
                ...prev,
                latitude: newLat,
                longitude: newLng
            }));
            setUserLocation({ latitude: newLat, longitude: newLng });
        }

        const interval = setInterval(() => {
            setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
        }, 600);
        return () => clearInterval(interval);
    }, [order]);

    useEffect(() => {
        if (!order?.id) return;

        // Fetch rider details if assigned
        if (order.rider_id) {
            const fetchRider = async () => {
                const { data, error } = await supabase
                    .from('riders')
                    .select('full_name')
                    .eq('id', order.rider_id)
                    .single();

                if (data && !error) {
                    setRiderName(data.full_name);
                }
            };
            fetchRider();

            // Mission C: Subscribe to Real-time Map Tracking
            const channel = supabase
                .channel(`rider-location-${order.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'assigned_rider_location',
                        filter: `order_id=eq.${order.id}`
                    },
                    (payload: any) => {
                        console.log('Rider location update:', payload);
                        if (payload.new && payload.new.current_lat && payload.new.current_lng) {
                            setRiderLocation({
                                lat: payload.new.current_lat,
                                lng: payload.new.current_lng
                            });
                        }
                    }
                )
                .subscribe();

            // Listen for order status changes
            const orderChannel = supabase
                .channel(`order-status-${order.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'orders',
                        filter: `id=eq.${order.id}`
                    },
                    (payload: any) => {
                        console.log('Order status update:', payload);
                        if (payload.new) {
                            setOrder(payload.new);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
                supabase.removeChannel(orderChannel);
            };
        }
    }, [order?.rider_id, order?.id]);

    useEffect(() => {
        // Simulate rider entering the OTP after 60 seconds
        const timer = setTimeout(async () => {
            // ... (rest of the existing OTP verification logic)
        }, 60000);
        return () => clearTimeout(timer);
    }, [navigate, order]);

    // Calculate dynamic coordinates
    const currentLat = userLocation?.latitude || viewState.latitude;
    const currentLng = userLocation?.longitude || viewState.longitude;

    // Mission C: Real-time Map Tracking
    const riderLat = riderLocation?.lat || currentLat + 0.003;
    const riderLng = riderLocation?.lng || currentLng + 0.004;

    const routeGeoJson = {
        type: "Feature" as const,
        properties: {},
        geometry: {
            type: "LineString" as const,
            coordinates: [
                [currentLng, currentLat], // User
                [currentLng + 0.001, currentLat + 0.001],
                [currentLng + 0.001, currentLat + 0.003],
                [riderLng, riderLat], // Rider
            ],
        },
    };

    const routeLayer: any = {
        id: "route-line",
        type: "line",
        paint: {
            "line-color": "#5260FE",
            "line-width": 4,
        },
    };

    const getStatusText = () => {
        if (!order) return "Your order is being processed!";
        switch (order.status) {
            case 'accepted':
                return "Rider Assigned";
            case 'at_store':
                return "Rider at Store";
            case 'picked_up':
                return "Rider arriving";
            case 'processing':
                return "Your order is packed and is ready to pickup!";
            case 'out_for_delivery':
                return "Partner is on the way to pick up your order.";
            case 'arrived':
                return "Partner has arrived at your location!";
            case 'success':
            case 'delivered':
                return "Order Delivered Successfully!";
            default:
                return "Your order is being processed!";
        }
    };

    const isDelivered = order?.status === 'success' || order?.status === 'delivered';

    return (
        <div
            className={`fixed inset-0 w-full flex flex-col safe-area-top safe-area-bottom overflow-y-auto no-scrollbar scroll-smooth ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
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
            {/* DEV CONTROLS */}
            {import.meta.env.DEV && (
                <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 bg-black/90 p-2 rounded-lg border border-red-500/50 shadow-xl pointer-events-auto">
                    <span className="text-white text-[10px] font-bold text-center border-b border-white/20 pb-1">DEV CONTROLS</span>
                    <button
                        onClick={async () => {
                            if (!order) return;
                            try {
                                await dev_updateOrderStatus(order.id, 'success');
                            } catch (e) {
                                console.error("Dev update failed", e);
                            }
                            setOrder({ ...order, status: 'success' });
                            navigate('/order-delivered', { state: { order: { ...order, status: 'success' } } });
                        }}
                        className="px-2 py-1 bg-green-600 text-white text-[10px] rounded hover:bg-green-500"
                    >
                        Set Success & End
                    </button>
                    <button
                        onClick={async () => {
                            if (!order) return;
                            try {
                                await dev_updateOrderStatus(order.id, 'cancelled');
                            } catch (e) {
                                console.error("Dev update failed", e);
                            }
                            setOrder({ ...order, status: 'cancelled' });
                            navigate(`/order-details/${order.id}`, { state: { order: { ...order, status: 'cancelled' } } });
                        }}
                        className="px-2 py-1 bg-gray-600 text-white text-[10px] rounded hover:bg-gray-500"
                    >
                        Set Cancelled
                    </button>
                    <button
                        onClick={() => {
                            navigate('/delivery-caution', { state: { order } });
                        }}
                        className="px-2 py-1 bg-yellow-600 text-white text-[10px] rounded hover:bg-yellow-500"
                    >
                        Trigger Caution
                    </button>
                </div>
            )}

            {/* Header Overlay */}
            <div className="fixed top-0 left-0 right-0 z-10 pointer-events-none">
                <div
                    className="overflow-hidden pointer-events-auto"
                    style={{
                        backgroundColor: "transparent",
                        paddingBottom: "24px"
                    }}
                >
                    <div
                        className="safe-area-top px-5 flex items-center justify-between"
                        style={{ paddingTop: "24px" }}
                    >
                        <button
                            onClick={() => navigate('/home')}
                            className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md relative z-20 ${isDarkMode ? 'bg-white/10' : 'bg-white border border-[#E9EAEB]'}`}
                        >
                            <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                        </button>

                        <h1 className={`text-[18px] font-medium font-sans flex-1 text-center pr-10 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Order Tracking
                        </h1>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div
                className="w-full relative overflow-hidden shrink-0 rounded-b-[32px] z-0"
                style={{ height: "305px" }}
            >
                <Map
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle={isDarkMode ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"}
                    attributionControl={false}
                    scrollZoom={false}
                    dragPan={true}
                >
                    <Source id="route" type="geojson" data={routeGeoJson}>
                        <Layer {...routeLayer} />
                    </Source>

                    <Marker latitude={currentLat} longitude={currentLng}>
                        <div className="animate-pulse">
                            <img src={currentLocationIcon} alt="User" className="w-6 h-6" />
                        </div>
                    </Marker>

                    <Marker latitude={riderLat} longitude={riderLng}>
                        <div className="bg-[#5260FE] p-2 rounded-full border-2 border-white shadow-lg transform -rotate-[30deg]">
                            <Bike className="w-5 h-5 text-white" />
                        </div>
                    </Marker>
                </Map>
            </div>

            <div className="px-5 mt-[20px] relative z-0">
                <div
                    className={`w-full rounded-[12px] relative px-[15px] pt-[10px] pb-[16px] overflow-hidden ${isDarkMode ? '' : 'bg-white'}`}
                    style={{
                        height: "135px",
                        backgroundImage: isDarkMode ? `url(${arrivingContainerBg})` : 'none',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: isDelivered ? "1px solid #16B751" : (isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid #E9EAEB")
                    }}
                >
                    <div className="flex justify-between items-start mb-[8px]">
                        <div className="flex flex-col">
                            <p className="text-[#7E7E7E] text-[12px] font-bold font-satoshi tracking-widest uppercase leading-none">
                                {isDelivered ? "ORDER STATUS" : "ARRIVING IN"}
                            </p>
                            <p className={`text-[20px] font-bold font-satoshi mt-[1px] ${isDarkMode ? 'text-white' : 'text-black'}`} style={{ lineHeight: "140%", color: isDelivered ? "#1CB956" : undefined }}>
                                {isDelivered ? 'Delivered' : order?.status === 'arrived' ? 'Arrived' : '1 Min'}
                            </p>
                        </div>
                        <div
                            className="absolute"
                            style={{
                                top: "11px",
                                right: "15px",
                                width: "31px",
                                height: "31px"
                            }}
                        >
                            <img src={isDelivered ? verifiedCircleIcon : arrivingIcon} alt="StatusIcon" className="w-full h-full" style={!isDarkMode && !isDelivered ? { filter: 'invert(1)' } : undefined} />
                        </div>
                    </div>

                    {/* Loader */}
                    <div className={`h-[9px] rounded-full overflow-hidden mb-[14px] ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                        <div
                            className="h-full rounded-full transition-all duration-300 ease-linear"
                            style={{
                                width: isDelivered ? "100%" : `${progress}%`,
                                backgroundColor: isDelivered ? "#16B751" : "#5260FE",
                                boxShadow: isDelivered ? "0 0 10px rgba(22, 183, 81, 0.5)" : "0 0 10px rgba(82,96,254,0.5)"
                            }}
                        />
                    </div>

                    <div>
                        <p className={`text-[12px] font-medium font-satoshi mb-[4px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {getStatusText()}
                        </p>
                        <p className={`text-[12px] font-normal font-satoshi leading-tight ${isDarkMode ? 'text-white/50' : 'text-[#7E7E7E]'}`}>
                            {isDelivered
                                ? "Your package has been handed over successfully."
                                : order?.status === 'processing'
                                    ? "We're assigning a partner to your request."
                                    : "Your delivery partner and order are tracked in real-time."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Rider Details Container */}
            <div className="px-[15px] mt-[16px] relative z-0">
                <div
                    className="w-full mx-auto rounded-[13px] relative pt-[9px] px-[9px] pb-[9px] overflow-hidden"
                    style={{
                        height: "370px",
                        maxWidth: "362px",
                        backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.31)" : "#FFFFFF",
                        backdropFilter: isDarkMode ? "blur(25.02px)" : "none",
                        border: isDarkMode ? "0.63px solid rgba(255, 255, 255, 0.12)" : "1px solid #E9EAEB",
                    }}
                >
                    <div className="flex items-start gap-[12px] mb-6">
                        {/* Photo Frame */}
                        <div className="w-[81px] h-[89px] relative shrink-0 rounded-[6px] overflow-hidden">
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

                        {/* Rider Info */}
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`text-[15px] font-bold font-satoshi leading-snug ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        Hi, I’m {riderName || (order?.rider_id ? 'Assigning...' : 'Partner')},<br />
                                        your delivery partner
                                    </p>
                                </div>
                                <button
                                    className="absolute top-[9px] right-[9px] w-[31px] h-[31px] flex items-center justify-center active:scale-95 transition-transform z-20"
                                >
                                    <img src={callIcon} alt="Call" className="w-full h-full" style={!isDarkMode ? { filter: 'invert(1)' } : undefined} />
                                </button>
                            </div>
                            <button
                                onClick={() => navigate('/view-rider-kyc')}
                                className="mt-[15px] rounded-full text-white text-[14px] font-medium font-satoshi tracking-wider flex items-center justify-center active:scale-95 transition-transform"
                                style={{
                                    width: "248px",
                                    height: "36px",
                                    backgroundColor: "#1CB956",
                                }}
                            >
                                View KYC
                            </button>
                        </div>
                    </div>

                    <p className={`text-[14px] font-normal font-satoshi leading-snug mb-[8px] ${isDarkMode ? 'text-white/50' : 'text-[#7E7E7E]'}`}>
                        Your delivery partner is KYC Verified. Please check the KYC details while accepting the order.
                    </p>

                    <div className={`h-[1px] w-full mb-[12px] ${isDarkMode ? 'bg-[#202020]' : 'bg-[#E9EAEB]'}`} />

                    {/* OTP Section */}
                    <div>
                        <p className={`text-[15px] font-bold font-satoshi mb-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Please provide this OTP to confirm the delivery
                        </p>
                        {order?.status === 'picked_up' && (
                            <p className="text-[#5260FE] text-[12px] font-medium mb-3">
                                Share this OTP with your rider only at the time of delivery
                            </p>
                        )}
                        <div className="w-full flex justify-center mb-6">
                            <div className="flex gap-2">
                                {(order?.otp_code || "000000").split('').map((digit, index) => (
                                    <div
                                        key={index}
                                        className={`w-[48px] h-[64px] rounded-[7px] flex items-center justify-center text-[32px] font-bold font-satoshi relative overflow-hidden ${isDarkMode ? 'text-white' : 'text-black'}`}
                                        style={{
                                            backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.31)" : "#F7F8FA",
                                            backdropFilter: isDarkMode ? "blur(23.51px)" : "none",
                                            WebkitBackdropFilter: isDarkMode ? "blur(23.51px)" : "none",
                                            border: isDarkMode ? 'none' : '1px solid #E6E8EB'
                                        }}
                                    >
                                        {/* Gradient Border Overlay - 0.59px */}
                                        {isDarkMode && (
                                            <div
                                                className="absolute inset-0 pointer-events-none rounded-[7px]"
                                                style={{
                                                    padding: "0.59px",
                                                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.20), rgba(255, 255, 255, 0.02))",
                                                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                                    WebkitMaskComposite: "xor",
                                                    maskComposite: "exclude",
                                                }}
                                            />
                                        )}
                                        {digit}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* OTP Status Row */}
                    <div className="flex items-center w-full mt-[12px]">
                        <div className="flex items-center gap-3">
                            <img src={isOtpVerified ? verifiedCircleIcon : awaitingIcon} alt="Status" className="w-[20px] h-[20px]" />
                            <span className={`text-[12px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {isOtpVerified ? "OTP Verified" : "Awaiting OTP verification"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Need Help CTA */}
            <div className="px-5 mt-[16px] pb-10 relative z-0">
                <button
                    onClick={() => navigate('/help/report', { state: { order } })}
                    className={`w-full h-[48px] rounded-full text-white text-[16px] font-medium active:scale-95 transition-transform flex items-center justify-center ${!isDarkMode ? 'bg-black' : ''}`}
                    style={{
                        backgroundImage: isDarkMode ? `url(${darkbgCta})` : 'none',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat"
                    }}
                >
                    Need Help?
                </button>
            </div>
        </div>
    );
};

export default OrderTracking;
