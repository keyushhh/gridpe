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

const currencySymbols: Record<string, string> = {
    AUD: '$', BRL: 'R$', CAD: '$', CHF: 'Fr', CNY: '¥', CZK: 'Kč', DKK: 'kr', EUR: '€',
    GBP: '£', HKD: '$', HUF: 'Ft', IDR: 'Rp', ILS: '₪', INR: '₹', ISK: 'kr', JPY: '¥',
    KRW: '₩', MXN: '$', MYR: 'RM', NOK: 'kr', NZD: '$', PHP: '₱', PLN: 'zł', RON: 'lei',
    SEK: 'kr', SGD: '$', THB: '฿', TRY: '₺', USD: '$', ZAR: 'R'
};

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
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'cash_orders',
                            filter: `user_id=eq.${session.user.id}`
                        },
                        (payload) => {
                            console.log('Real-time cash order update:', payload);
                            loadOrders();
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'fx_orders',
                            filter: `user_id=eq.${session.user.id}`
                        },
                        (payload) => {
                            console.log('Real-time fx order update:', payload);
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
            const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
            const monthStr = date.toLocaleDateString('en-GB', { month: 'long' }).toLowerCase();

            const typeStr = order.metadata?.isFx ? "fx exchange" : "cash order".toLowerCase();
            const currencyStr = (order.metadata?.toCurrency as string || "").toLowerCase();
            const receiveAmountStr = order.metadata?.receiveAmount?.toString() || "";

            return amountStr.includes(query) ||
                dateStr.includes(query) ||
                monthStr.includes(query) ||
                typeStr.includes(query) ||
                currencyStr.includes(query) ||
                receiveAmountStr.includes(query);
        });
        setFilteredPastOrders(filtered);
    }, [searchQuery, pastOrders]);


    // Helper for formatting date/time
    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

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
                bgColor: '#1CB956',
                bgOpacity: 0.21,
                icon: successIcon,
                statusIcon: checkIcon,
                label: 'Success',
                iconFilter: !isDarkMode ? 'invert(53%) sepia(76%) saturate(446%) hue-rotate(92deg) brightness(94%) contrast(92%)' : undefined
            };
        } else if (s === 'failed' || s === 'cancelled') {
            return {
                color: '#FF1E1E',
                bgColor: '#FF1E1E',
                bgOpacity: 0.21,
                icon: failedIcon,
                statusIcon: crossIcon,
                label: s === 'cancelled' ? 'Cancelled' : 'Failed',
                iconFilter: !isDarkMode ? 'invert(27%) sepia(91%) saturate(7483%) hue-rotate(356deg) brightness(101%) contrast(106%)' : undefined
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
                                    {order.metadata?.isFx ? "FX Exchange" : (order.metadata?.item_value ? `Ordered ₹${order.metadata.item_value} Cash` : (order.addresses?.label ? `Order to ${order.addresses.label}` : "Cash Order"))}
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
                                {order.metadata?.isFx
                                    ? `${currencySymbols[order.metadata.toCurrency as string] || ''}${Number(order.metadata.receiveAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `₹${order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Helper to group orders while preserving order
    const groupedPastOrders = React.useMemo(() => {
        const groups: { title: string, orders: Order[] }[] = [];
        const groupIndexMap: Record<string, number> = {};

        filteredPastOrders.forEach(order => {
            const date = new Date(order.created_at);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            let groupName = "";
            if (date.toDateString() === today.toDateString()) {
                groupName = "Past orders";
            } else if (date.toDateString() === yesterday.toDateString()) {
                groupName = "Yesterday";
            } else {
                groupName = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
            }

            if (groupIndexMap[groupName] !== undefined) {
                groups[groupIndexMap[groupName]].orders.push(order);
            } else {
                groups.push({ title: groupName, orders: [order] });
                groupIndexMap[groupName] = groups.length - 1;
            }
        });
        return groups;
    }, [filteredPastOrders]);

    // Search Bar JSX
    const searchBar = (
        <div className="px-5 mb-[38px] relative z-10">
            <div className={`w-full h-[48px] rounded-full flex items-center px-[10px] transition-all ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-[#E9EAEB] shadow-sm'}`}>
                <div className="w-[16px] h-[16px] ml-[6px] mr-[16px] flex items-center justify-center">
                    <img src={searchIcon} alt="Search" className="w-full h-full" style={!isDarkMode ? { filter: 'brightness(0) opacity(0.5)' } : undefined} />
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
            {/* Light Mode Purple Glow */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
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
            <div className="pt-12 px-5 flex items-center justify-center relative mb-[26px] z-10 h-[88px]">
                <button
                    onClick={() => navigate(-1)}
                    className={`absolute left-5 w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full backdrop-blur-md z-20 ${isDarkMode ? 'bg-white/5 border border-white/10 active:bg-white/10' : 'bg-white border border-[#E9EAEB] active:bg-[#F7F8FA]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 flex-shrink-0 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>
                <h1 className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
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

            {/* Past Orders (Grouped by Date) */}
            {groupedPastOrders.length > 0 && (
                <div className="px-5 pb-10 relative z-10 flex flex-col gap-[24px]">
                    {groupedPastOrders.map((group) => (
                        <div key={group.title}>
                            <h2 className={`${showOnlyPast ? 'text-[#7E7E7E] text-[14px] font-medium uppercase' : (isDarkMode ? 'text-white' : 'text-black')} text-[16px] font-bold font-satoshi mb-[12px]`}>
                                {group.title}
                            </h2>
                            {group.orders.map(order => renderOrderCard(order, false))}
                        </div>
                    ))}
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
