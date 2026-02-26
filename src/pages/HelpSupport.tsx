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
import walletWhiteIcon from "@/assets/wallet-whiteclr.svg";
import generalBlackIcon from "@/assets/general-black.svg";
import faqBlackIcon from "@/assets/faq-black.svg";
import walletBlackIcon from "@/assets/wallet-black.svg";
import partnerBlackIcon from "@/assets/partner-black.svg";
import chatBlackIcon from "@/assets/chat-black.svg";
import { useTheme } from "next-themes";

const HelpSupport = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
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
            className={`fixed inset-0 w-full flex flex-col safe-area-top overflow-y-auto no-scrollbar ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
            style={{
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
            <header className="px-5 pt-12 pb-4 flex items-center relative z-10 shrink-0 mb-[41px]">
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md relative z-20 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-[#E9EAEB]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`w-full text-center text-[22px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Help & Support</h1>
            </header>

            <main className="flex-1 px-5 relative z-10">
                {/* Hero Section */}
                <div className="mb-[18px]">
                    <h2 className={`text-[16px] font-bold font-satoshi mb-[5px] ${isDarkMode ? 'text-white' : 'text-black'}`}>How can we help?</h2>
                    <p className={`text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white/40' : 'text-[#7E7E7E]'}`}>We are happy to help you anytime</p>
                </div>

                {/* Search Bar */}
                <div
                    className={`w-full h-[44px] flex items-center px-4 mb-[32px] overflow-hidden rounded-full ${!isDarkMode ? 'bg-white border border-[#E9EAEB]' : ''}`}
                    style={isDarkMode ? {
                        backgroundImage: `url(${searchBg})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat'
                    } : {}}
                >
                    <input
                        type="text"
                        placeholder='Example: "Account delete"'
                        className={`bg-transparent font-satoshi text-[14px] w-full outline-none ${isDarkMode ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-[#7E7E7E]'}`}
                    />
                </div>

                {/* Recent Order Section */}
                {recentOrder && (
                    <div className="mb-[24px]">
                        <h3 className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black/60'} text-[14px] font-medium font-satoshi mb-[12px] uppercase`}>RECENT ORDER</h3>

                        <div
                            onClick={() => navigate('/help/report', { state: { order: recentOrder } })}
                            className="relative mb-[12px] mx-auto overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                            style={{
                                width: '363px',
                                height: '92px',
                                background: isDarkMode
                                    ? 'rgba(28, 185, 86, 0.21)'
                                    : '#1CB95636', // ~21% opacity
                                borderRadius: '13px',
                                backdropFilter: isDarkMode ? 'blur(25.02px)' : 'none',
                                border: isDarkMode ? '0.63px solid transparent' : '1px solid #E9EAEB',
                                backgroundImage: isDarkMode ? 'linear-gradient(rgba(28, 185, 86, 0.21), rgba(28, 185, 86, 0.21)), linear-gradient(to bottom, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.20))' : 'none',
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box'
                            }}
                        >
                            {/* Status Header */}
                            <div className="absolute top-[4px] left-[20px] z-20 flex items-center gap-[6px]">
                                <div className="w-[12px] h-[12px] flex items-center justify-center">
                                    <img src={checkIcon} alt="" className="w-full h-full" style={!isDarkMode ? { filter: 'invert(51%) sepia(96%) saturate(366%) hue-rotate(94deg) brightness(97%) contrast(87%)' } : { filter: 'brightness(0) saturate(100%) invert(62%) sepia(80%) saturate(415%) hue-rotate(91deg) brightness(92%) contrast(88%)' }} />
                                </div>
                                <span className={`text-[12px] font-bold font-satoshi ${isDarkMode ? 'text-[#1CB956]' : 'text-[#16B751]'}`}>
                                    Success
                                </span>
                            </div>

                            <div
                                className="absolute bottom-0 left-0 w-[362px] rounded-[13px]"
                                style={{
                                    height: '67px',
                                    backgroundImage: isDarkMode ? `url(${helpInnerBg})` : 'none',
                                    backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF',
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    border: !isDarkMode ? '1px solid #E9EAEB' : 'none'
                                }}
                            >
                                <div className="absolute top-[17px] left-[17px] w-[35px] h-[35px] flex items-center justify-center">
                                    <img src={successIcon} alt="" className="w-full h-full" />
                                </div>

                                <div className="absolute top-[17px] left-[65px] flex flex-col">
                                    <span className={`text-[14px] font-satoshi font-normal leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        {recentOrder.metadata?.item_value ? `Ordered ₹${recentOrder.metadata.item_value} Cash` : (recentOrder.addresses?.label ? `Order to ${recentOrder.addresses.label}` : "Cash Order")}
                                    </span>
                                    <span className={`text-[12px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-[#7E7E7E]'}`}>
                                        Today | 12:00 PM
                                    </span>
                                </div>

                                <span className={`absolute top-[25px] right-[17px] text-[16px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    ₹{recentOrder.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/order-history', { state: { showOnlyPast: true } })}
                            className={`w-[363px] h-[42px] rounded-[12px] flex items-center justify-between px-4 transition-all ${isDarkMode ? 'bg-black/20 border border-white/10' : 'bg-white border border-[#E9EAEB]'}`}
                        >
                            <span className={`text-[14px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>Need help with previous orders?</span>
                            <ChevronRight className={`${isDarkMode ? 'text-white/40' : 'text-[#7E7E7E]'} w-5 h-5`} />
                        </button>
                    </div>
                )}

                {/* Browse Categories */}
                <div className="mb-[20px]">
                    <h3 className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black/60'} text-[14px] font-medium font-satoshi mb-[12px] uppercase`}>BROWSE CATEGORIES</h3>
                    <div
                        className={`w-[363px] rounded-[12px] overflow-hidden flex flex-col gap-0 transition-colors ${isDarkMode ? 'bg-black/20 backdrop-blur-[25px] border border-white/10' : 'bg-white border border-[#E9EAEB]'}`}
                    >
                        {[
                            {
                                icon: isDarkMode ? generalIssuesIcon : generalBlackIcon,
                                label: "General Issues",
                                route: "/help/category/general-issues"
                            },
                            {
                                icon: isDarkMode ? faqsIcon : faqBlackIcon,
                                label: "FAQs",
                                route: "/help/category/faqs"
                            },
                            {
                                icon: isDarkMode ? walletWhiteIcon : walletBlackIcon,
                                label: "Grid.Pe Wallet FAQs",
                                route: "/help/category/wallet-faqs"
                            },
                            {
                                icon: isDarkMode ? onboardingIcon : partnerBlackIcon,
                                label: "Partner Onboarding",
                                route: "/help/category/onboarding"
                            },
                        ].map((cat, idx, arr) => (
                            <React.Fragment key={cat.label}>
                                <button
                                    onClick={() => navigate(cat.route)}
                                    className={`w-full flex items-center justify-between pl-3 pr-[14px] py-[10px] transition-colors ${isDarkMode ? 'active:bg-white/5' : 'active:bg-[#F7F8FA]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={cat.icon} alt="" className="w-[18px] h-[18px]" />
                                        <span className={`text-[14px] font-normal font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>{cat.label}</span>
                                    </div>
                                    <ChevronRight className={`${isDarkMode ? 'text-white/40' : 'text-[#7E7E7E]'} w-5 h-5`} />
                                </button>
                                {idx < arr.length - 1 && <div className={`w-full h-[1px] ${isDarkMode ? 'bg-white/5' : 'bg-[#E9EAEB]'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Contact Us */}
                <div className="mb-10">
                    <h3 className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black/60'} text-[14px] font-medium font-satoshi mb-[12px] uppercase`}>CONTACT US</h3>
                    <button
                        onClick={() => navigate('/help/chat')}
                        className={`w-[363px] h-[72px] rounded-[13px] flex items-center px-[14px] relative transition-colors overflow-hidden ${isDarkMode ? 'bg-black/20 backdrop-blur-[25px] border border-white/10 active:bg-white/5' : 'bg-white border border-[#E9EAEB] active:bg-[#F7F8FA]'}`}
                    >
                        <div className="absolute top-[12px] left-[12px] w-[25px] h-[25px] flex items-center justify-center">
                            <img src={isDarkMode ? chatIcon : chatBlackIcon} alt="" className="w-[18px] h-[18px]" />
                        </div>
                        <div className="flex flex-col items-start w-full pl-[36px]">
                            <h4 className={`text-[14px] font-regular font-satoshi mb-[2px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Chat with us</h4>
                            <p className={`text-[12px] font-medium font-satoshi leading-tight text-left ${isDarkMode ? 'text-white/50' : 'text-[#7E7E7E]'}`}>
                                Zing is here to help! Chat with Zing to clear your doubts.
                            </p>
                        </div>
                        <ChevronRight className={`absolute top-[12px] right-[14px] w-5 h-5 ${isDarkMode ? 'text-white/40' : 'text-[#7E7E7E]'}`} />
                    </button>
                </div>
            </main>
        </div>
    );
};

export default HelpSupport;
