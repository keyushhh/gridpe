import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import searchIcon from "@/assets/search.svg";
import refreshIcon from "@/assets/refresh.svg";
import processingIcon from "@/assets/processing.svg";
import successIcon from "@/assets/success.svg";
import failedIcon from "@/assets/failed.svg";
import checkIcon from "@/assets/check.svg";
import crossIcon from "@/assets/cross.svg";
import { supabase } from "@/lib/supabase";
import { fetchActiveOrders, fetchPastOrders, Order, cancelOrder, dev_seedMockOrders } from "@/lib/orders";
import OrderDetailsSheet from "@/components/OrderDetailsSheet";
import { toast } from "@/components/ui/use-toast";

const OrderHistory = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const showOnlyPast = location.state?.showOnlyPast || false;

    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredPastOrders, setFilteredPastOrders] = useState<Order[]>([]);

    // Bottom Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedOrderForSheet, setSelectedOrderForSheet] = useState<Order | null>(null);

    const loadOrders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            try {
                // Fetch Active Orders
                const active = await fetchActiveOrders(session.user.id);
                setActiveOrders(active);

                // Fetch Past Orders
                const past = await fetchPastOrders(session.user.id);
                setPastOrders(past);
                setFilteredPastOrders(past);
            } catch (e) {
                console.error("Failed to load order history", e);
            }
        }
    };

    useEffect(() => {
        loadOrders();

        // Real-time subscription
        let channel: any;

        const setupSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                channel = supabase
                    .channel('order-history-sync')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE', // Use '*' for all events if needed
                            schema: 'public',
                            table: 'orders',
                            filter: `user_id=eq.${session.user.id}`
                        },
                        (payload) => {
                            console.log('Real-time order update:', payload);
                            loadOrders();
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
    }, []);

    // Search Logic
    useEffect(() => {
        if (!searchQuery) {
            setFilteredPastOrders(pastOrders);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = pastOrders.filter(order => {
            const amountStr = order.amount.toString();
            const date = new Date(order.created_at);
            const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase();
            const monthStr = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();

            return amountStr.includes(query) ||
                dateStr.includes(query) ||
                monthStr.includes(query);
        });
        setFilteredPastOrders(filtered);
    }, [searchQuery, pastOrders]);


    // Helper for formatting date/time
    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        if (isToday) {
            return `Today | ${timeStr}`;
        } else {
            return `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} | ${timeStr}`;
        }
    };

    // Helper for status styles
    const getStatusConfig = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'processing' || s === 'out_for_delivery' || s === 'arrived') {
            return {
                color: isDarkMode ? '#FACC15' : '#C09A00',
                bgColor: '#FACC15',
                bgOpacity: 0.21,
                icon: processingIcon,
                statusIcon: refreshIcon,
                label: 'Processing',
                iconFilter: !isDarkMode ? 'brightness(0) saturate(100%) invert(54%) sepia(93%) saturate(2311%) hue-rotate(18deg) brightness(96%) contrast(101%)' : undefined
            };
        } else if (s === 'success' || s === 'delivered') {
            return {
                color: '#1CB956',
                bgOpacity: 0.21,
                icon: successIcon,
                statusIcon: checkIcon,
                label: 'Success'
            };
        } else if (s === 'failed' || s === 'cancelled') {
            return {
                color: '#FF1E1E',
                bgOpacity: 0.21,
                icon: failedIcon,
                statusIcon: crossIcon,
                label: s === 'cancelled' ? 'Cancelled' : 'Failed'
            };
        }
        // Default fallback
        return {
            color: '#FFFFFF',
            bgOpacity: 0.1,
            icon: processingIcon,
            statusIcon: refreshIcon,
            label: status
        };
    };

    const handleCancelOrder = async (orderId: string) => {
        try {
            await cancelOrder(orderId);
            setIsSheetOpen(false);
            // Refresh counts
            loadOrders();
        } catch (e) {
            console.error("Failed to cancel order", e);
        }
    };

    const renderOrderCard = (order: Order, isActive: boolean) => {
        const config = getStatusConfig(order.status);

        return (
            <div
                key={order.id}
                className="w-full rounded-[13px] overflow-hidden mb-[16px] cursor-pointer active:opacity-90 transition-opacity"
                onClick={() => {
                    if (showOnlyPast) {
                        navigate('/help/report', { state: { order } });
                        return;
                    }
                    const s = order.status.toLowerCase();
                    const isCompleted = s === 'success' || s === 'delivered';
                    const isFailedOrCancelled = s === 'failed' || s === 'cancelled';

                    if (isActive || isCompleted || isFailedOrCancelled) {
                        setSelectedOrderForSheet(order);
                        setIsSheetOpen(true);
                    } else {
                        navigate(`/order-details/${order.id}`, { state: { order } });
                    }
                }}
            >
                {/* Top Container */}
                <div className="w-full h-[25px] flex items-center px-[18px] relative overflow-hidden">
                    <div
                        className="absolute top-0 left-0 w-full h-full"
                        style={{
                            backgroundColor: config.bgColor || config.color,
                            opacity: config.bgOpacity
                        }}
                    />
                    <div className="relative z-10 flex items-center mt-[2px]">
                        <img src={config.statusIcon} alt="" className="w-3 h-3 mr-[4px]" style={{ filter: config.iconFilter }} />
                        <span
                            className="text-[12px] font-bold font-satoshi"
                            style={{ color: config.color }}
                        >
                            {config.label}
                        </span>
                    </div>
                </div>

                {/* Main Content Container */}
                <div
                    className="w-full relative rounded-b-[13px]"
                    style={{
                        height: '67px',
                        backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
                        border: isDarkMode
                            ? ((order.status === 'success' || order.status === 'delivered')
                                ? '0.6px solid rgba(28, 185, 86, 0.3)'
                                : '0.6px solid rgba(255, 255, 255, 0.12)')
                            : '1px solid #E9EAEB',
                        marginTop: '-1px'
                    }}
                >
                    <div className="flex items-start justify-between py-[14px] pl-[16px] pr-[14px]">
                        <div className="flex items-start gap-[16px]">
                            <img src={config.icon} alt={config.label} className="w-[35px] h-[35px]" />
                            <div className="flex flex-col">
                                <span className={`text-[16px] font-regular font-satoshi leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    {order.addresses?.label ? `Order to ${order.addresses.label}` : "Cash Order"}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[12px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black/50'}`}>
                                        {formatDateTime(order.created_at)}
                                    </span>
                                    {(order.status === 'success' || order.status === 'delivered') && (
                                        <div className="w-[4px] h-[4px] rounded-full bg-[#1CB956]" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="h-[35px] flex items-center">
                            <span className={`text-[16px] font-medium font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                ₹{order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Search Bar JSX
    const searchBar = (
        <div className="px-5 mb-[38px] relative z-10">
            <div className={`w-full h-[48px] rounded-full flex items-center px-[10px] ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border-[#E6E8EB]'}`}>
                <div className="w-[16px] h-[16px] ml-[6px] mr-[16px] flex items-center justify-center">
                    <img src={searchIcon} alt="Search" className={`w-full h-full ${!isDarkMode ? 'filter brightness-0 opacity-50' : ''}`} />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your orders: “₹2000”, “july”, etc..."
                    className={`flex-1 bg-transparent border-none outline-none text-[14px] font-satoshi ${isDarkMode ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'}`}
                />
            </div>
        </div>
    );

    return (
        <div
            className="h-full w-full overflow-y-auto flex flex-col relative safe-area-top"
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Top Purple Glowing Blob (Light Mode) */}
            {!isDarkMode && (
                <div
                    className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
                    style={{
                        backgroundColor: "#5260FE",
                        filter: "blur(60px)",
                        opacity: 0.8,
                    }}
                />
            )}
            {/* DEV SEEDER */}
            {import.meta.env.DEV && (
                <div className="px-5 py-2">
                    <button
                        onClick={async () => {
                            try {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (session?.user) {
                                    await dev_seedMockOrders(session.user.id);
                                    await loadOrders();
                                    toast({
                                        title: "Mock Data Seeded",
                                        description: "3 orders added to history."
                                    });
                                } else {
                                    toast({
                                        variant: "destructive",
                                        title: "Seeding Failed",
                                        description: "No active session found."
                                    });
                                }
                            } catch (error: any) {
                                console.error("Seeding error:", error);
                                toast({
                                    variant: "destructive",
                                    title: "Seeding Failed",
                                    description: error.message || "An unknown error occurred"
                                });
                            }
                        }}
                        className="w-full h-8 bg-red-600/20 border border-red-500/50 rounded-lg text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-600/30 transition-colors"
                    >
                        Seed Dev Data (Secret Design Power)
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="px-5 pt-12 flex items-center relative mb-[26px] z-10">
                <button
                    onClick={() => navigate(-1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border ${isDarkMode ? 'border-white/20 active:bg-white/10' : 'border-[#E6E8EB] active:bg-black/5'} absolute left-5`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`w-full text-center text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {showOnlyPast ? "Help & Support" : "Order History"}
                </h1>
            </div>

            {/* Search Bar */}
            {!showOnlyPast && searchBar}

            {/* Active Orders */}
            {!showOnlyPast && activeOrders.length > 0 && (
                <div className="px-5 mb-[35px] relative z-10">
                    <h2 className={`text-[16px] font-bold font-satoshi mb-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Active orders
                    </h2>
                    {activeOrders.map(order => renderOrderCard(order, true))}
                </div>
            )}

            {/* Past Orders */}
            {filteredPastOrders.length > 0 && (
                <div className="px-5 pb-10 relative z-10">
                    <h2 className={`${showOnlyPast ? 'text-[#7E7E7E] text-[14px] font-medium uppercase' : (isDarkMode ? 'text-white' : 'text-black')} text-[16px] font-bold font-satoshi mb-[12px]`}>
                        Past orders
                    </h2>
                    {filteredPastOrders.map(order => renderOrderCard(order, false))}
                </div>
            )}

            <OrderDetailsSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                order={selectedOrderForSheet}
                onCancel={handleCancelOrder}
            />
        </div>
    );
};

export default OrderHistory;
