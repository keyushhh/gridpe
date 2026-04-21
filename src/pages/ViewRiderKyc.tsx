import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getOrderById } from "@/lib/orders";
import BackButton from "@/components/ui/BackButton";
import { QRCodeSVG } from "qrcode.react";

import bgDarkMode from "@/assets/bg-dark-mode.png";
import darkbgCta from "@/assets/darkbg-cta.png";
import hideKycImg from "@/assets/hide-kyc.png";
import lightmodeKycCoverImg from "@/assets/lightmode-kyc-cover.png";
import closeIcon from "@/assets/close.svg";
import popupCloseBtnBg from "@/assets/pop-up-close-btn.png";
import verifiedIcon from "@/assets/verified.svg";

// KYC Backgrounds
import aadharBG from "@/assets/kyc_cards_riders/aadhar_bg.png";
import panBG from "@/assets/kyc_cards_riders/pan_bg.png";
import driversBG from "@/assets/kyc_cards_riders/drivers_bg.png";
import votersBG from "@/assets/kyc_cards_riders/voters_bg.png";

const ViewRiderKyc = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<any>(location.state?.order);
    const [rider, setRider] = useState<any>(order?.rider);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();

    const isDarkMode = theme === 'dark' || theme === 'system';
    const [isRevealed, setIsRevealed] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                let currentOrder = order;

                // 1. Fetch Order if missing
                if (!currentOrder && orderId) {
                    const fetchedOrder = await getOrderById(orderId);
                    if (fetchedOrder) {
                        setOrder(fetchedOrder);
                        currentOrder = fetchedOrder;
                    } else {
                        setError("Order not found");
                        setIsLoading(false);
                        return;
                    }
                }

                // 2. Fetch Rider if missing but we have rider_id
                if (!rider && currentOrder?.rider_id) {
                    const { data, error: riderError } = await supabase
                        .from('riders')
                        .select('id, full_name, phone_number, kyc_photo, kyc_id_url, kyc_type, kyc_dob, kyc_gender, kyc_number')
                        .eq('id', currentOrder.rider_id)
                        .single();

                    if (data && !riderError) {
                        setRider(data);
                    } else {
                        console.error("Rider fetch error:", riderError);
                        setError("Rider information not available");
                    }
                } else if (!rider && !currentOrder?.rider_id) {
                    setError("No rider assigned to this order yet");
                }
            } catch (err: any) {
                console.error("Data loading error:", err);
                setError("Failed to load identity data");
            } finally {
                setIsLoading(false);
            }
        };

        loadAllData();
    }, [orderId]);

    if (isLoading) {
        return (
            <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-t-[#5260FE] border-r-transparent border-b-[#5260FE] border-l-transparent rounded-full animate-spin"></div>
                    <p className={`text-[16px] font-medium font-satoshi ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                        Loading Identity Data...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !rider) {
        return (
            <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-center p-6 ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}>
                <div className="text-center">
                    <p className={`text-[18px] font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {error || "Rider Not Found"}
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-[#5260FE] text-white rounded-full font-medium"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "Not Available";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return as-is if already formatted
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '/');
        } catch (e) {
            return "Not Available";
        }
    };

    const toggleReveal = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setRotation(prev => prev + 360);

        // Slower animation (1000ms)
        setTimeout(() => {
            setIsRevealed(!isRevealed);
            setIsAnimating(false);
        }, 1000);
    };

    return (
        <div
            className={`fixed inset-0 w-full h-full flex flex-col safe-area-top safe-area-bottom overflow-hidden ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
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

            {/* Header */}
            <div
                className="safe-area-top px-5 flex items-center justify-between pb-6"
                style={{ paddingTop: "24px" }}
            >
                <BackButton onClick={() => navigate(-1)} />


                <h1 className={`text-[18px] font-medium font-satoshi flex-1 text-center pr-10 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Partner KYC
                </h1>
            </div>

            <div className="px-5 flex flex-col items-center">
                {/* KYC Image Container - 43px below header */}
                <div
                    onClick={toggleReveal}
                    className="mt-[43px] rounded-[13px] overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative transition-transform duration-1000 ease-in-out"
                    style={{
                        width: "316px",
                        height: "402px",
                        backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
                        border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #E9EAEB",
                        perspective: '1000px',
                        transform: `rotateY(${rotation}deg)`
                    }}
                >
                    {/* Dynamic KYC Card Layer */}
                    <div className={`absolute inset-0 w-full h-full transition-all duration-300 ${!isRevealed ? `blur-[20px] ${isDarkMode ? 'brightness-[0.25]' : 'brightness-[0.9]'}` : 'blur-0 brightness-100'}`}>
                        {/* Background */}
                        <img
                            src={
                                rider?.kyc_type === 'pan' ? panBG :
                                rider?.kyc_type === 'drivers' ? driversBG :
                                rider?.kyc_type === 'voters' ? votersBG :
                                aadharBG
                            }
                            alt="Background"
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Card Content Overlay */}
                        <div className="absolute inset-0 z-10 p-5 pt-[90px] font-satoshi text-black flex flex-col">
                            {/* Photo & Main Info Block */}
                            <div className="flex gap-4 mb-2">
                                {/* Rider Photo - Fixed 72x80px */}
                                <div className="w-[72px] h-[80px] rounded-[4px] overflow-hidden border border-black/5 shrink-0 shadow-sm">
                                    <img 
                                        src={rider?.kyc_photo || rider?.kyc_id_url || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=80"} 
                                        alt="Rider" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Text Details */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <p className="text-[18px] font-bold leading-tight mb-1">{rider?.full_name || "Verification Pending"}</p>
                                    <p className="text-[12px] font-medium opacity-80">DOB: {rider?.kyc_dob ? formatDate(rider.kyc_dob) : "Not Available"}</p>
                                    <p className="text-[12px] font-medium opacity-80">{rider?.kyc_gender || ""}</p>
                                </div>
                            </div>

                            {/* Spacing & Warning Box - Vertically Centered */}
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-end gap-3">
                                    <div className="flex-1 border border-red-500/40 bg-white/50 p-3 rounded-[4px] min-h-[95px] flex items-center">
                                        <p className="text-[13px] font-medium leading-tight">
                                            Please report any issues if you face while validating the KYC with the Delivery Partner.
                                        </p>
                                    </div>

                                    {/* DYNAMIC QR CODE - Functional & Scalable */}
                                    <div className="shrink-0 flex flex-col items-center justify-center p-[4px] bg-white rounded-[12px] shadow-sm border border-black/5 align-self-center overflow-hidden w-[80px] h-[80px]">
                                        <QRCodeSVG
                                            value={`https://grid.pe/report-kyc/${rider?.id || 'null'}`}
                                            size={72}
                                            level="H"
                                            includeMargin={false}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ID NUMBER - Footer Positioning */}
                            <div className={`mt-auto pb-4 transition-all ${
                                rider?.kyc_type === 'aadhar' 
                                ? 'flex justify-center w-full' 
                                : 'flex justify-start text-left'
                            }`}>
                                <p className={`font-bold tracking-[0.15em] ${rider?.kyc_type === 'aadhar' ? 'text-[24px] mb-[-5px]' : 'text-[18px]'}`}>
                                    {rider?.kyc_number || "PENDING"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Reveal Overlay */}
                    {!isRevealed && !isAnimating && (
                        <div className="absolute inset-0 z-20 transition-opacity duration-300">
                            <img
                                src={isDarkMode ? hideKycImg : lightmodeKycCoverImg}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex flex-col items-center">
                                <p className="mt-[162px] text-[18px] font-bold font-satoshi text-center flex items-center justify-center h-[22px] text-white">
                                    Tap to view verified KYC ID
                                </p>
                                <p className="mt-[19px] text-[16px] font-normal font-satoshi text-center leading-[120%] text-white">
                                    Yes, you’re allowed to<br />snoop responsibly.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Close Button - 17px below container */}
                <button
                    onClick={() => navigate(-1)}
                    className={`mt-[17px] w-[137px] h-[42px] flex items-center justify-center gap-[6px] active:scale-95 transition-transform shrink-0 ${!isDarkMode ? 'bg-[#5260FE] rounded-full' : ''}`}
                    style={{
                        backgroundImage: isDarkMode ? `url(${popupCloseBtnBg})` : 'none',
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <img src={closeIcon} alt="" className="w-6 h-6" />
                    <span
                        className="text-[16px] font-medium leading-[120%] font-satoshi text-white"
                    >
                        Close
                    </span>
                </button>

                {/* Need Help CTA - 75px below close button */}
                <div className="mt-[75px] w-[364px]">
                    <button
                        onClick={() => navigate('/report-rider-kyc')}
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

                {/* Footer Security Text - 55px below need help */}
                <p className={`mt-[55px] text-[16px] font-medium font-satoshi text-center ${isDarkMode ? 'text-[#9C9C9C]' : 'text-[#7E7E7E]'}`}>
                    (Optional – helps us keep things secure)
                </p>

                {/* Hyperlink - 10px below security text */}
                <button
                    onClick={() => navigate('/verify-rider-kyc')}
                    className={`mt-[10px] text-[16px] font-medium font-satoshi text-center underline pb-20 active:opacity-70 transition-opacity ${isDarkMode ? 'text-white' : 'text-[#5260FE]'}`}
                >
                    Does this KYC look correct?
                </button>
            </div>
        </div>
    );
};

export default ViewRiderKyc;
