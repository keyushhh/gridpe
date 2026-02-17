import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Order, fetchRecentOrders } from "@/lib/orders";
import { supabase } from "@/lib/supabase";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import searchBg from "@/assets/search-bg.png";
import helpInnerBg from "@/assets/help-inner.png";
import checkIcon from "@/assets/check.svg";
import successIcon from "@/assets/success.svg";
import generalIssuesIcon from "@/assets/general-issues.svg";
import faqsIcon from "@/assets/faqs.svg";
import walletIcon from "@/assets/wallet.svg";
import onboardingIcon from "@/assets/onboarding.svg";
import chatIcon from "@/assets/chat.svg";

const HelpSupport = () => {
    const navigate = useNavigate();
    const [recentOrder, setRecentOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRecentOrder = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                try {
                    const orders = await fetchRecentOrders(session.user.id);
                    if (orders.length > 0) {
                        setRecentOrder(orders[0]);
                    }
                } catch (e) {
                    console.error("Failed to fetch recent order", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadRecentOrder();
    }, []);

    return (
        <div
            className="fixed inset-0 w-full flex flex-col bg-[#0a0a12] safe-area-top overflow-y-auto no-scrollbar"
            style={{
                backgroundImage: `url(${bgDarkMode})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Header */}
            <header className="px-5 pt-12 pb-4 flex items-center relative z-10 shrink-0 mb-[41px]">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 active:bg-white/10 absolute left-5"
                >
                    <ChevronLeft className="text-white w-6 h-6" />
                </button>
                <h1 className="w-full text-center text-white text-[22px] font-medium font-satoshi">Help & Support</h1>
            </header>

            <main className="flex-1 px-5 relative z-10">
                {/* Hero Section */}
                <div className="mb-[18px]">
                    <h2 className="text-white text-[16px] font-bold font-satoshi mb-[5px]">How can we help?</h2>
                    <p className="text-white/40 text-[14px] font-normal font-satoshi">We are happy to help you anytime</p>
                </div>

                {/* Search Bar */}
                <div
                    className="w-full h-[44px] flex items-center px-4 mb-[32px]"
                    style={{
                        backgroundImage: `url(${searchBg})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <input
                        type="text"
                        placeholder='Example: "Account delete"'
                        className="bg-transparent text-white font-satoshi text-[14px] w-full outline-none placeholder:text-white/20"
                    />
                </div>

                {/* Recent Order Section */}
                {recentOrder && (
                    <div className="mb-[24px]">
                        <h3 className="text-[#7E7E7E] text-[14px] font-medium font-satoshi mb-[12px] uppercase">RECENT ORDER</h3>

                        <div
                            onClick={() => navigate('/help/report', { state: { order: recentOrder } })}
                            className="relative mb-[12px] mx-auto overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                            style={{
                                width: '363px',
                                height: '92px',
                                background: 'rgba(28, 185, 86, 0.21)',
                                borderRadius: '13px',
                                backdropFilter: 'blur(25.02px)',
                                border: '0.63px solid transparent',
                                backgroundImage: 'linear-gradient(rgba(28, 185, 86, 0.21), rgba(28, 185, 86, 0.21)), linear-gradient(to bottom, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.20))',
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box'
                            }}
                        >
                            {/* Status Header */}
                            <div className="absolute top-[4px] left-[20px] z-20 flex items-center gap-[6px]">
                                <div className="w-[12px] h-[12px] flex items-center justify-center">
                                    <img src={checkIcon} alt="" className="w-full h-full" style={{ filter: 'invert(62%) sepia(80%) saturate(415%) hue-rotate(91deg) brightness(92%) contrast(88%)' }} />
                                </div>
                                <span className="text-[12px] font-bold font-satoshi text-[#1CB956]">
                                    Success
                                </span>
                            </div>

                            <div
                                className="absolute bottom-0 left-0 w-[362px] rounded-b-[13px]"
                                style={{
                                    height: '67px',
                                    backgroundImage: `url(${helpInnerBg})`,
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            >
                                <div className="absolute top-[17px] left-[17px] w-[35px] h-[35px] flex items-center justify-center">
                                    <img src={successIcon} alt="" className="w-full h-full" />
                                </div>

                                <div className="absolute top-[17px] left-[65px] flex flex-col">
                                    <span className="text-white text-[14px] font-satoshi font-normal leading-tight">
                                        {recentOrder.addresses?.label ? `Order to ${recentOrder.addresses.label}` : "Order to Home"}
                                    </span>
                                    <span className="text-white text-[12px] font-medium font-satoshi">
                                        Today | 12:00 PM
                                    </span>
                                </div>

                                <span className="absolute top-[25px] right-[17px] text-white text-[16px] font-medium font-satoshi">
                                    ₹{recentOrder.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/order-history', { state: { showOnlyPast: true } })}
                            className="w-[363px] h-[42px] rounded-[12px] flex items-center justify-between px-4 border border-white/10 active:scale-[0.98] transition-all bg-black/20"
                        >
                            <span className="text-white text-[14px] font-medium font-satoshi">Need help with previous orders?</span>
                            <ChevronRight className="text-white/40 w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Browse Categories */}
                <div className="mb-[20px]">
                    <h3 className="text-[#7E7E7E] text-[14px] font-medium font-satoshi mb-[12px] uppercase">BROWSE CATEGORIES</h3>
                    <div
                        className="w-[363px] rounded-[12px] overflow-hidden border border-white/10 flex flex-col gap-0"
                        style={{ background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(25px)' }}
                    >
                        {[
                            { icon: generalIssuesIcon, label: "General Issues", route: "/help/category/general-issues" },
                            { icon: faqsIcon, label: "FAQs", route: "/help/category/faqs" },
                            { icon: walletIcon, label: "Grid.Pe Wallet FAQs", route: "/help/category/wallet-faqs" },
                            { icon: onboardingIcon, label: "Partner Onboarding", route: "/help/category/onboarding" },
                        ].map((cat, idx, arr) => (
                            <React.Fragment key={cat.label}>
                                <button
                                    onClick={() => navigate(cat.route)}
                                    className="w-full flex items-center justify-between pl-3 pr-[14px] py-[10px] active:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={cat.icon} alt="" className="w-[18px] h-[18px]" />
                                        <span className="text-white text-[14px] font-normal font-satoshi">{cat.label}</span>
                                    </div>
                                    <ChevronRight className="text-white/40 w-5 h-5" />
                                </button>
                                {idx < arr.length - 1 && <div className="w-full h-[1px] bg-white/5" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Contact Us */}
                <div className="mb-10">
                    <h3 className="text-[#7E7E7E] text-[14px] font-medium font-satoshi mb-[12px] uppercase">CONTACT US</h3>
                    <button
                        onClick={() => navigate('/help/chat')}
                        className="w-[363px] h-[72px] rounded-[13px] border border-white/10 flex items-center px-[14px] relative active:bg-white/5 transition-colors overflow-hidden"
                        style={{ background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(25px)' }}
                    >
                        <div className="absolute top-[12px] left-[12px] w-[25px] h-[25px] flex items-center justify-center">
                            <img src={chatIcon} alt="" className="w-[18px] h-[18px]" />
                        </div>
                        <div className="flex flex-col items-start w-full pl-[36px]">
                            <h4 className="text-white text-[14px] font-regular font-satoshi mb-[2px]">Chat with us</h4>
                            <p className="text-white/50 text-[12px] font-medium font-satoshi leading-tight text-left">
                                Zing is here to help! Chat with Zing to clear your doubts.
                            </p>
                        </div>
                        <ChevronRight className="absolute top-[12px] right-[14px] text-white/40 w-5 h-5" />
                    </button>
                </div>
            </main>
        </div>
    );
};

export default HelpSupport;
