import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import successBg from "@/assets/success-bg.png";
import checkIcon from "@/assets/check-icon.svg";
import checkIconLight from "@/assets/check-icon-light.svg";
import verifiedCircleIcon from "@/assets/verified-circle.svg";
import darkbgCta from "@/assets/darkbg-cta.png";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";
import { deliverOrder } from "@/lib/orders";

const OrderDelivered = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const { profile } = useUser();
    const [seconds, setSeconds] = useState(30);

    // Fallback amount if not passed in state
    const orderAmount = location.state?.order?.amount || 2000;
    const orderData = location.state?.order;

    useEffect(() => {
        // Redundancy check: ensure status is updated in Supabase via RPC to trigger rewards
        if (location.state?.order?.id && profile?.id) {
            deliverOrder(location.state.order.id, profile.id, location.state.isFx)
                .catch(err => console.error("Failed to mark order as delivered:", err));
        }

        const timer = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate("/home");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div
            className={`fixed inset-0 w-full h-full flex flex-col items-center overflow-hidden ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
            style={{
                backgroundImage: isDarkMode ? `url(${successBg})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Green Glowing Blob */}
            {!isDarkMode && (
                <div
                    className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(50% 50% at 50% 50%, rgba(28, 185, 86, 0.2) 0%, rgba(28, 185, 86, 0) 100%)',
                        filter: 'blur(40px)',
                        zIndex: 0
                    }}
                />
            )}

            <div className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom pb-20 relative z-10 w-full pt-4">
                {/* Heading: Satoshi - medium - 22px */}
                <h1 className={`text-[22px] font-medium font-satoshi text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Order Delivered
                </h1>

                {/* Icon: 62x62px, 21px below heading */}
                <div className="mt-[21px] flex items-center justify-center">
                    <img src={isDarkMode ? checkIcon : checkIconLight} alt="Success" className="w-[62px] h-[62px]" />
                </div>

                {/* Sub-text: Satoshi - bold - 18px, 35px below icon */}
                <p className={`mt-[35px] text-[18px] font-bold font-satoshi text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Wohoo! Your order was delivered 🎉
                </p>

                {/* Container: 362x187px, radius 12px, 75px below sub-text */}
                <div
                    className={`mt-[75px] rounded-[12px] border overflow-hidden relative ${isDarkMode ? 'border-white/10' : 'border-[#E9EAEB]'}`}
                    style={{
                        width: "362px",
                        height: "187px",
                        backgroundColor: isDarkMode ? "rgba(25, 25, 25, 0.31)" : "#FFFFFF",
                        backdropFilter: isDarkMode ? "blur(25px)" : "none",
                        paddingLeft: "14px",
                        paddingTop: "12px",
                        paddingRight: "16px"
                    }}
                >
                    {/* Amount heading: Satoshi - medium - 16px */}
                    <h2 className={`text-[16px] font-medium font-satoshi leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Your order for amount ₹{orderAmount.toLocaleString('en-IN')} has been delivered successfully.
                    </h2>

                    {/* Body text: Satoshi - regular - 16px, color #AFAFAF, 12px below heading */}
                    <p className={`mt-[12px] text-[16px] font-normal font-satoshi leading-[1.4] ${isDarkMode ? 'text-[#AFAFAF]' : 'text-[#7E7E7E]'}`}>
                        The amount held in your wallet for this order will be debited shortly. You will be notified for the same. Thank you for using Grid.Pe!
                    </p>

                    {/* Status: 20px below body */}
                    <div className="mt-[20px] flex items-center gap-[12px]">
                        <img src={verifiedCircleIcon} alt="Verified" className="w-[14px] h-[14px]" />
                        <span className={`text-[12px] font-normal font-satoshi ${isDarkMode ? 'text-[#D0D0D0]' : 'text-[#7E7E7E]'}`}>
                            Delivery confirmed
                        </span>
                    </div>
                </div>

                {/* Redirecting CTA: 362x48px, 29px below container */}
                <button
                    onClick={() => navigate("/home")}
                    className={`mt-[29px] flex items-center justify-center active:scale-95 transition-transform ${isDarkMode ? '' : 'bg-[#18181A] rounded-full'}`}
                    style={{
                        width: "362px",
                        height: "48px",
                        backgroundImage: isDarkMode ? `url(${darkbgCta})` : 'none',
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                    }}
                >
                    <span className="text-white text-[16px] font-medium font-satoshi">
                        Redirecting Home in {seconds}s...
                    </span>
                </button>
            </div>
        </div>
    );
};

export default OrderDelivered;
