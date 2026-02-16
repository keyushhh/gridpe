import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import successBg from "@/assets/success-bg.png";
import checkIcon from "@/assets/check-icon.svg";
import verifiedCircleIcon from "@/assets/verified-circle.svg";
import darkbgCta from "@/assets/darkbg-cta.png";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";

const OrderDelivered = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addWalletBalance } = useUser();
    const [seconds, setSeconds] = useState(30);
    const [hasBeenDebited, setHasBeenDebited] = useState(false);

    // Fallback amount if not passed in state
    const orderAmount = location.state?.order?.amount || 2000;

    useEffect(() => {
        // Real-time debit simulation
        if (!hasBeenDebited) {
            addWalletBalance(-orderAmount);
            setHasBeenDebited(true);

            // Redundancy check: ensure status is updated in Supabase
            if (location.state?.order?.id) {
                supabase
                    .from('orders')
                    .update({ status: 'delivered' })
                    .eq('id', location.state.order.id)
                    .then(({ error }) => {
                        if (error) console.error("Failed to update status in OrderDelivered", error);
                    });
            }
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
    }, [navigate, orderAmount, hasBeenDebited, addWalletBalance]);

    return (
        <div
            className="fixed inset-0 w-full h-full flex flex-col items-center bg-[#0a0a12] overflow-hidden"
            style={{
                backgroundImage: `url(${successBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="flex flex-col items-center px-4 pt-[24px]">
                {/* Heading: Satoshi - medium - 22px */}
                <h1 className="text-white text-[22px] font-medium font-satoshi text-center">
                    Order Delivered
                </h1>

                {/* Icon: 62x62px, 21px below heading */}
                <div className="mt-[21px] flex items-center justify-center">
                    <img src={checkIcon} alt="Success" className="w-[62px] h-[62px]" />
                </div>

                {/* Sub-text: Satoshi - bold - 18px, 35px below icon */}
                <p className="mt-[35px] text-white text-[18px] font-bold font-satoshi text-center">
                    Wohoo! Your order was delivered 🎉
                </p>

                {/* Container: 362x187px, radius 12px, 75px below sub-text */}
                <div
                    className="mt-[75px] rounded-[12px] border border-white/10 overflow-hidden relative"
                    style={{
                        width: "362px",
                        height: "187px",
                        backgroundColor: "rgba(25, 25, 25, 0.31)",
                        backdropFilter: "blur(25px)",
                        paddingLeft: "14px",
                        paddingTop: "12px",
                        paddingRight: "16px"
                    }}
                >
                    {/* Amount heading: Satoshi - medium - 16px */}
                    <h2 className="text-white text-[16px] font-medium font-satoshi leading-tight">
                        Your order for amount ₹{orderAmount.toLocaleString('en-IN')} has been delivered successfully.
                    </h2>

                    {/* Body text: Satoshi - regular - 16px, color #AFAFAF, 12px below heading */}
                    <p className="mt-[12px] text-[#AFAFAF] text-[16px] font-normal font-satoshi leading-[1.4]">
                        The amount held in your wallet for this order will be debited shortly. You will be notified for the same. Thank you for using Grid.Pe!
                    </p>

                    {/* Status: 20px below body */}
                    <div className="mt-[20px] flex items-center gap-[12px]">
                        <img src={verifiedCircleIcon} alt="Verified" className="w-[14px] h-[14px]" />
                        <span className="text-[#D0D0D0] text-[12px] font-normal font-satoshi">
                            Delivery confirmed
                        </span>
                    </div>
                </div>

                {/* Redirecting CTA: 362x48px, 29px below container */}
                <button
                    onClick={() => navigate("/home")}
                    className="mt-[29px] flex items-center justify-center active:scale-95 transition-transform"
                    style={{
                        width: "362px",
                        height: "48px",
                        backgroundImage: `url(${darkbgCta})`,
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
