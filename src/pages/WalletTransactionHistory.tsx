import React, { useState, useEffect, useRef, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { createPortal } from "react-dom";
import { useNavigate , Link } from 'react-router-dom';
import BackButton from "@/components/ui/BackButton";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import searchIcon from "@/assets/search.svg";
import filterIcon from "@/assets/filter.svg";
import caretDownIcon from "@/assets/caret-down.svg";
import dateBg from "@/assets/date.png";
import typeBg from "@/assets/type.png";
import methodBg from "@/assets/method.png";
import debitedArrow from "@/assets/debited-arrow.svg";
import creditedArrow from "@/assets/credited-arrow.svg";
import walletDebited from "@/assets/wallet-debited.svg";
import closeIcon from "@/assets/close.svg";
import detailsIcon from "@/assets/details.svg";
import copyIcon from "@/assets/copy.svg";
import transactionDetailsLightBg from "@/assets/transaction-details-light.png";
import { useUser } from "@/contexts/UserContext";
import { WalletTransaction } from "@/types";
import { supabase } from "@/lib/supabase";
import { fetchUnifiedTransactionHistory } from "@/lib/wallet";
import { formatDate, formatINR } from "@/utils/format";

const currencySymbols: Record<string, string> = {
    AUD: '$', BRL: 'R$', CAD: '$', CHF: 'Fr', CNY: 'Â¥', CZK: 'KÄ', DKK: 'kr', EUR: 'â‚¬',
    GBP: 'Â£', HKD: '$', HUF: 'Ft', IDR: 'Rp', ILS: 'â‚ª', INR: '₹', ISK: 'kr', JPY: 'Â¥',
    KRW: 'â‚©', MXN: '$', MYR: 'RM', NOK: 'kr', NZD: '$', PHP: 'â‚±', PLN: 'zÅ‚', RON: 'lei',
    SEK: 'kr', SGD: '$', THB: 'à¸¿', TRY: 'â‚º', USD: '$', ZAR: 'R'
};

const WalletTransactionHistory = () => {
    const navigate = useNavigate();
    const { profile } = useUser();
    const userId = profile?.id;
    const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        date: "All Time",
        type: "All",
        method: "All"
    });
    const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Check if clicking inside the trigger row or inside a portal-rendered dropdown
            const isClickInsideTrigger = dropdownRef.current && dropdownRef.current.contains(target);
            const isClickInsidePortal = target.closest('[data-dropdown-portal="true"]');

            if (!isClickInsideTrigger && !isClickInsidePortal) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch transactions
    useEffect(() => {
        let channel: any;

        const loadTransactions = async () => {
            if (!userId) return;
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const currentUserId = session?.user?.id || userId;

                const mergedData = await fetchUnifiedTransactionHistory(currentUserId);
                setWalletTransactions(mergedData as WalletTransaction[]);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setTimeout(() => setIsLoading(false), 600);
            }
        };

        loadTransactions();

        // Refresh on focus
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadTransactions();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Setup channel matching currentUserId
        const setupChannel = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const cid = session?.user?.id || userId;
            channel = supabase.channel('wallet-history-sync')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${cid}` },
                    loadTransactions
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'payouts', filter: `user_id=eq.${cid}` },
                    loadTransactions
                )
                .subscribe();
        };
        setupChannel();

        const handleCustomRefresh = (e: CustomEvent<{ userId: string }>) => {
            if (e.detail?.userId === currentUserId) {
                loadTransactions();
            }
        };
        window.addEventListener('refresh_wallet_transactions' as any, handleCustomRefresh);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('refresh_wallet_transactions' as any, handleCustomRefresh);
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const toggleDropdown = (id: string) => {
        setActiveDropdown(activeDropdown === id ? null : id);
    };

    const handleSelect = (category: 'date' | 'type' | 'method', value: string) => {
        setFilters(prev => ({ ...prev, [category]: value }));
        setActiveDropdown(null);
    };

    const resetFilters = () => {
        setFilters({
            date: "All Time",
            type: "All",
            method: "All"
        });
    };

    const isAnyFilterActive = filters.date !== "All Time" || filters.type !== "All" || filters.method !== "All";

    const isNewUser = () => {
        if (!profile?.created_at) return true;
        const created = new Date(profile.created_at).getTime();
        const now = Date.now();
        const daysSinceCreation = (now - created) / (1000 * 60 * 60 * 24);
        return daysSinceCreation < 30;
    };

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        return walletTransactions.filter(tx => {
            // 1. Search Query
            const query = searchQuery.toLowerCase();
            const txDateObj = tx.created_at ? new Date(tx.created_at) : new Date(tx.date || Date.now());
            const formattedDate = formatDate(txDateObj).toLowerCase();
            const matchesSearch = (
                tx.description.toLowerCase().includes(query) ||
                tx.amount.toString().includes(query) ||
                formattedDate.includes(query) ||
                tx.id.toLowerCase().includes(query)
            );
            if (!matchesSearch) return false;

            // 2. Date Filter
            const txDate = tx.created_at ? new Date(tx.created_at) : new Date(tx.date || Date.now());
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            if (filters.date !== 'All Time') {
                if (filters.date === 'Today') {
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    if (txDate.getTime() < todayStart.getTime()) return false;
                } else if (filters.date === 'Past 7 Days') {
                    const sevenDaysAgo = new Date(now);
                    sevenDaysAgo.setDate(now.getDate() - 7);
                    if (txDate.getTime() < sevenDaysAgo.getTime()) return false;
                } else if (filters.date === 'Past 30 Days') {
                    const thirtyDaysAgo = new Date(now);
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    if (txDate.getTime() < thirtyDaysAgo.getTime()) return false;
                } else if (filters.date === 'Past 90 Days') {
                    const ninetyDaysAgo = new Date(now);
                    ninetyDaysAgo.setDate(now.getDate() - 90);
                    if (txDate.getTime() < ninetyDaysAgo.getTime()) return false;
                } else if (filters.date === 'Past Year') {
                    const oneYearAgo = new Date(now);
                    oneYearAgo.setFullYear(now.getFullYear() - 1);
                    if (txDate.getTime() < oneYearAgo.getTime()) return false;
                }
            }

            // 3. Type Filter
            if (filters.type !== 'All') {
                if (filters.type === 'Cash Order' && !tx.description.toLowerCase().includes('cash order')) return false;
                if (filters.type === 'Withdrawal' && !tx.description.toLowerCase().includes('withdrawal')) return false;
                if (filters.type === 'Wallet Top-Up' && !((tx.type === 'credit' || tx.transaction_type === 'credit') && tx.description.toLowerCase().includes('top up'))) return false;
            }

            // 4. Method Filter
            if (filters.method !== 'All') {
                if (filters.method === 'UPI' && !tx.description.toLowerCase().includes('upi')) return false;
                if (filters.method === 'Netbanking' && !(tx.description.toLowerCase().includes('netbanking') || tx.description.toLowerCase().includes('withdrawal'))) return false;
                if (filters.method === 'Cards' && !tx.description.toLowerCase().includes('card')) return false;
            }

            return true;
        });
    }, [walletTransactions, searchQuery, filters]);

    const Dropdown = ({ id, width, label, bgImage, selectedValue, items, onSelect, isActive }: {
        id: string,
        width: string,
        label: string,
        bgImage: string,
        selectedValue: string,
        items: string[],
        onSelect: (item: string) => void,
        isActive?: boolean
    }) => {
        const triggerRef = useRef<HTMLDivElement>(null);
        const [coords, setCoords] = useState({ top: 0, left: 0 });

        React.useLayoutEffect(() => {
            if (activeDropdown === id && triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setCoords({ top: rect.bottom, left: rect.left });
            }
        }, [activeDropdown, id]);

        return (
            <div className="relative" ref={triggerRef}>
                <div
                    onClick={() => toggleDropdown(id)}
                    className="flex items-center justify-between shrink-0 relative cursor-pointer"
                    style={{
                        width: width,
                        height: '34px',
                        backgroundColor: isActive ? '#5260FE' : (isDarkMode ? 'transparent' : '#000000'),
                        backgroundImage: (!isActive && isDarkMode) ? `url(${bgImage})` : 'none',
                        backgroundSize: 'cover',
                        borderRadius: '8px',
                        border: isActive ? '0.63px solid #5260FE' : '0.63px solid rgba(255, 255, 255, 0.12)',
                    }}
                >
                    <span className="text-white text-[12px] font-medium font-sans ml-[8px] leading-[120%] truncate pr-1">
                        {selectedValue !== 'All' && selectedValue !== 'All Time' ? selectedValue : label}
                    </span>
                    <img
                        src={caretDownIcon}
                        alt=""
                        className="mr-[4px] w-[12px] h-[12px] shrink-0"
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                </div>

                {/* Dropdown Content with Portal */}
                {activeDropdown === id && createPortal(
                    <div
                        data-dropdown-portal="true"
                        onClick={(e) => e.stopPropagation()}
                        className="fixed z-[999] flex flex-col pt-[12px] pb-[12px] pl-[8px]"
                        style={{
                            top: coords.top + 6,
                            left: coords.left,
                            width: width,
                            height: 'auto',
                            backgroundColor: '#000000',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div className="flex flex-col gap-[12px]">
                            {items.map((item, index) => (
                                <span
                                    key={index}
                                    onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                                    className={`text-[12px] font-medium font-sans leading-[120%] cursor-pointer transition-colors ${selectedValue === item ? 'text-[#5260FE]' : 'text-white hover:text-white/80'}`}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    const dateItems = isNewUser()
        ? ["All Time", "Today", "Past 7 Days"]
        : ["All Time", "Today", "Past 7 Days", "Past 30 Days", "Past 90 Days", "Past Year"];

    const getTransactionDisplay = (tx: WalletTransaction) => {
        const txType = tx.type || tx.transaction_type;
        const status = tx.status?.toLowerCase();
        let title = status === 'held' ? "Amount Held" : ((txType === 'credit' || txType === 'deposit') ? "Amount Credited" : "Amount Debited");
        let subtitle = tx.description;

        // Try mapping from metadata first (for newer transactions)
        const methodId = tx.metadata?.paymentMethodId as string | undefined;
        if (methodId && (tx.type === 'credit' || tx.transaction_type === 'credit')) {
            if (['cred', 'gpay', 'phonepe', 'upi-id'].includes(methodId)) {
                return { title, subtitle: "Added via UPI" };
            }
            if (methodId === 'hdfc-card') {
                return { title, subtitle: "Added via Cards" };
            }
            if (methodId === 'netbanking') {
                return { title, subtitle: "Added via Netbanking" };
            }
            if (methodId === 'amazon') {
                return { title, subtitle: "Added via Amazon Wallet" };
            }
        }

        // Fallback to pattern matching (for older or non-topup transactions)
        const desc = tx.description.toLowerCase();
        if (tx.metadata?.isFx) {
            title = status === 'held' ? "Amount Held" : (txType === 'credit' ? "Amount Credited" : "Amount Debited");
            subtitle = "FX Exchange";
        } else if (desc.includes("cash order")) {
            title = status === 'held' ? "Amount Held" : "Amount Debited";
            subtitle = tx.metadata?.item_value ? `Ordered ₹${tx.metadata.item_value} Cash` : "Cash Order";
        } else if (desc.includes("withdrawal")) {
            title = "Withdrawal";
            const methodNames: Record<string, string> = {
                'cred': 'CRED UPI',
                'gpay': 'Google Pay UPI',
                'phonepe': 'PhonePe UPI',
                'upi-id': 'UPI ID',
                'hdfc-card': 'HDFC Card',
                'amazon': 'Amazon Pay Wallet',
                'netbanking': 'HDFC Netbanking'
            };
            const methodLabel = methodId ? (methodNames[methodId as string] || "Bank") : "Netbanking";
            subtitle = `Withdrawn to ${methodLabel}`;
        } else if (desc.includes("withdrawal")) {
            const method = tx.payout_method || tx.metadata?.payout_method;
            const vpa = tx.vpa || tx.metadata?.vpa;
            title = "Withdrawal";
            if (method === 'upi') {
                subtitle = `Withdrawn to ${vpa || 'UPI'}`;
            } else if (method === 'card') {
                subtitle = `Withdrawn to Card`;
            } else {
                subtitle = `Withdrawn to Bank`;
            }
        } else if (desc.includes("cred") || desc.includes("google pay") || desc.includes("phone pe") || desc.includes("upi id") || desc.includes("upi")) {
            subtitle = "Added via UPI";
        } else if (desc.includes("cards") || desc.includes("card")) {
            subtitle = "Added via Cards";
        } else if (desc.includes("netbanking")) {
            subtitle = "Added via Netbanking";
        } else if (desc.includes("amazon wallet") || desc.includes("amazon")) {
            subtitle = "Added via Amazon Wallet";
        } else if (tx.type === 'credit' || tx.transaction_type === 'credit') {
            const cleanDesc = tx.description.replace(/^Added via\s+/i, '');
            subtitle = `Added via ${cleanDesc}`;
        }

        // User friendly description overrides
        if (subtitle && (subtitle.includes('Placement') || subtitle.includes('Order #'))) {
            // Trim UUID if present
            subtitle = subtitle.split('#')[0].trim();
        }

        return { title, subtitle };
    };

    const TransactionDetailsPopup = ({ tx, onClose }: { tx: WalletTransaction, onClose: () => void }) => {
        const { title } = getTransactionDisplay(tx);

        // Generate a pseudo-random 15 char ID if not present or use actual ID trimmed
        const displayId = (tx.id.replace(/-/g, '').substring(0, 15).toUpperCase()) || "TXN1234567890AB";

        const handleCopy = (e: React.MouseEvent) => {
            e.stopPropagation();
            navigator.clipboard.writeText(displayId);
        };

        return (
            <div
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-5"
                onClick={onClose}
            >
                {/* Full page blur backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[10px]" />

                {/* Pop-up Container */}
                <div
                    className="relative z-10 w-[362px] h-[436px] flex flex-col items-center"
                    style={{
                        backgroundImage: `url(${transactionDetailsLightBg})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        borderRadius: '13px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Details Icon */}
                    <img src={detailsIcon} alt="" className="w-[30px] h-[30px] mt-[22px] brightness-0" />

                    {/* Header */}
                    <h2
                        className="mt-[12px] text-black text-[16px] font-bold leading-[120%] tracking-[-0.3px] text-center"
                        style={{ fontFamily: "'Satoshi', sans-serif" }}
                    >
                        Transaction Details
                    </h2>

                    {/* Transaction ID Pill */}
                    <div
                        className="mt-[19px] w-[213px] h-[40px] flex items-center justify-center bg-[#F5F5F5] rounded-full border border-black/5"
                        onClick={handleCopy}
                    >
                        <span
                            className="text-black text-[17px] font-bold leading-[120%] tracking-[-0.3px]"
                            style={{ fontFamily: "'Satoshi', sans-serif" }}
                        >
                            {displayId}
                        </span>
                        <img src={copyIcon} alt="Copy" className="w-[14px] h-[14px] ml-[8px] cursor-pointer brightness-0" />
                    </div>

                    {/* Detail Container */}
                    <div
                        className="mt-[9px] w-[318px] min-h-[174px] rounded-[16px] p-[11px_15px] flex flex-col justify-between"
                        style={{
                            background: '#FFFFFF',
                            border: '1px solid #F0F0F0'
                        }}
                    >
                        {(() => {
                            const { title, subtitle } = getTransactionDisplay(tx);
                            const methodId = tx.metadata?.paymentMethodId as string | undefined;

                            const getPaymentMode = () => {
                                if (!methodId) {
                                    if (subtitle.includes("UPI")) return "UPI";
                                    if (subtitle.includes("Cards")) return "Credit/Debit Card";
                                    if (subtitle.includes("Netbanking")) return "Netbanking";
                                    if (subtitle.includes("Amazon")) return "Amazon Wallet";
                                    return subtitle.replace("Added via ", "");
                                }
                                if (['cred', 'gpay', 'phonepe', 'upi-id'].includes(methodId)) return "Google Pay (UPI)";
                                if (methodId === 'hdfc-card') return "Credit/Debit Card";
                                if (methodId === 'netbanking') return "Netbanking";
                                if (methodId === 'amazon') return "Amazon Wallet";
                                return "Netbanking";
                            };

                            const getStatusLabel = () => {
                                if (tx.status === 'success') return 'Completed';
                                if (tx.status === 'pending') return 'Processing';
                                if (tx.status === 'failed') return 'Failed';
                                return tx.status;
                            };

                            const rowData = [
                                { label: "Transaction Type", value: title },
                                { label: "Transaction Purpose", value: subtitle === "Wallet Top Up" ? "Wallet Top Up" : subtitle },
                                {
                                    ...(tx.metadata?.isFx ? [
                                        { label: "Converted Amount", value: `${currencySymbols[tx.metadata.toCurrency as string] || ''}${Number(tx.metadata.receiveAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                                        { label: "Exchange Rate", value: `1 ${tx.metadata.fromCurrency} = ${currencySymbols[tx.metadata.toCurrency as string] || ''}${Number(tx.metadata.fxRate || 0).toFixed(2)}` }
                                    ] : [])
                                },
                                { label: "Time", value: formatDate(tx.created_at, { type: 'time' }) },
                                { label: "Date", value: formatDate(tx.created_at, { type: 'long' }) },
                                { label: "Payment Mode", value: getPaymentMode() },
                                { label: "Status", value: getStatusLabel() }
                            ];

                            return rowData.map((row, i) => (
                                <div key={i} className="flex justify-between items-center" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '-0.3px', lineHeight: '120%' }}>
                                    <span style={{ color: '#000000', opacity: 0.8 }}>{row.label}</span>
                                    <span style={{ color: '#000000', opacity: 1 }}>{row.value}</span>
                                </div>
                            ));
                        })()}
                    </div>

                    {/* CTA */}
                    <button
                        className="mt-[10px] w-[318px] h-[44px] flex items-center justify-center rounded-full text-white text-[16px] font-medium active:scale-95 transition-transform"
                        style={{
                            backgroundColor: "#171717",
                            fontFamily: "'Satoshi', sans-serif"
                        }}
                    >
                        Download Receipt
                    </button>

                    {/* Help Link */}
                    <p
                        className="mt-[17px] text-black text-[12px] font-medium text-center"
                        style={{ fontFamily: "'Satoshi', sans-serif" }}
                    >
                        Need help with this transaction? <span className="underline text-[#148DFF] cursor-pointer">Click here.</span>
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="relative z-10 mt-[19px] w-[137px] h-[42px] flex items-center justify-center gap-[6px] active:scale-95 transition-transform shrink-0"
                    style={{
                        backgroundColor: '#5260FE',
                        borderRadius: '9999px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                >
                    <img src={closeIcon} alt="" className="w-6 h-6" />
                    <span
                        className="text-white text-[16px] font-medium leading-[120%]"
                        style={{ fontFamily: "'Satoshi', sans-serif" }}
                    >
                        Close
                    </span>
                </button>
            </div>
        );
    };


    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme !== 'light';

    return (
        <div
            className={`h-screen w-full overflow-hidden flex flex-col pt-4 safe-top relative ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'}`}
            style={{ willChange: 'transform', transform: 'translateZ(0)', backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none', backgroundSize: "cover", backgroundPosition: "top center", backgroundRepeat: "no-repeat" }}
        >
            {/* Light Mode Status Blob (Top Glow) */}
            {!isDarkMode && (
                <div
                    className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
                    style={{
                        backgroundColor: "#5260FE",
                        filter: "blur(60px)",
                        opacity: 0.8,
                        mixBlendMode: "normal"
                    }}
                />
            )}

            {/* Header Container */}
            <div className="shrink-0 flex items-center justify-between w-full px-5 pt-4 pb-2 z-10 relative">
                {/* Back Button */}
                <BackButton onClick={() => navigate(-1)} />


                {/* Title */}
                <h1 className="text-black dark:text-white text-[22px] font-medium leading-[120%] text-center">
                    Transaction History
                </h1>

                {/* Spacer for right side */}
                <div className="w-10"></div>
            </div>

            {/* Search Bar Container */}
            <div className="w-full px-[19px] mt-[28px] z-10">
                <div
                    className="w-full flex items-center px-[16px] rounded-full bg-white dark:bg-[#1A1C20] border border-[#E9EAEB] dark:border-[#2A2D35]"
                    style={{
                        height: '44px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Icon */}
                    <img
                        src={searchIcon}
                        alt="Search"
                        className="w-[24px] h-[24px] shrink-0"
                        style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'grayscale(1) brightness(0)' }}
                    />

                    {/* Input */}
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by amount, date, transaction id, etc..."
                        className="ml-[16px] w-full bg-transparent border-none outline-none text-black dark:text-white placeholder:text-[#666666] dark:placeholder:text-white/60 text-[14px] font-normal leading-[140%]"
                    />
                </div>
            </div>

            {/* Filter Row */}
            <div
                className="w-full mt-[15px] z-20 relative px-[27px]"
                ref={dropdownRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-[12px] overflow-x-auto overflow-y-visible scrollbar-hide py-[5px]">
                    {/* Filter Icon or Reset Button */}
                    <div className="shrink-0 pt-[5px]">
                        {isAnyFilterActive ? (
                            <div
                                onClick={resetFilters}
                                className="flex items-center gap-[6px] px-[12px] h-[34px] bg-black rounded-[8px] border border-white/10 cursor-pointer"
                            >
                                <span className="text-white text-[12px] font-medium leading-[120%]">Reset</span>
                                <img src={closeIcon} alt="Reset" className="w-[12px] h-[12px]" style={{ filter: 'brightness(0) invert(1)' }} />
                            </div>
                        ) : (
                            <img
                                src={filterIcon}
                                alt="Filter"
                                className="w-[24px] h-[24px]"
                                style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'grayscale(1) brightness(0)' }}
                            />
                        )}
                    </div>

                    {/* Dropdowns */}
                    <div className="flex items-center gap-[8px] pt-[5px]">
                        <Dropdown
                            id="date"
                            width="93px"
                            label="Date"
                            bgImage={dateBg}
                            selectedValue={filters.date}
                            items={dateItems}
                            onSelect={(val) => handleSelect('date', val)}
                            isActive={filters.date !== "All Time"}
                        />
                        <Dropdown
                            id="type"
                            width="93px"
                            label="Type"
                            bgImage={typeBg}
                            selectedValue={filters.type}
                            items={["All", "Cash Order", "Withdrawal", "Wallet Top-Up"]}
                            onSelect={(val) => handleSelect('type', val)}
                            isActive={filters.type !== "All"}
                        />
                        <Dropdown
                            id="method"
                            width="111px"
                            label="Method"
                            bgImage={methodBg}
                            selectedValue={filters.method}
                            items={["All", "UPI", "Netbanking", "Cards"]}
                            onSelect={(val) => handleSelect('method', val)}
                            isActive={filters.method !== "All"}
                        />
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div 
                className="px-5 mt-6 flex-1 min-0 overflow-y-auto no-scrollbar safe-bottom pb-4 flex flex-col gap-6 relative"
                style={{ willChange: 'transform', transform: 'translateZ(0)', WebkitOverflowScrolling: 'touch' }}
            >
                {(() => {
                    // Group by date (localized to avoid UTC shifts)
                    const grouped: { [key: string]: typeof walletTransactions } = {};
                    filteredTransactions.forEach(tx => {
                        const date = tx.created_at ? new Date(tx.created_at) : new Date(tx.date || Date.now());
                        // Use local date string as key for consistent local grouping
                        const dateKey = date.toLocaleDateString('en-IN');
                        if (!grouped[dateKey]) grouped[dateKey] = [];
                        grouped[dateKey].push(tx);
                    });

                    // Sort dates descending
                    const sortedDates = Object.keys(grouped).sort((a, b) => {
                        const aParts = a.split('/');
                        const bParts = b.split('/');
                        const aTime = new Date(Number(aParts[2]), Number(aParts[1]) - 1, Number(aParts[0])).getTime();
                        const bTime = new Date(Number(bParts[2]), Number(bParts[1]) - 1, Number(bParts[0])).getTime();
                        return bTime - aTime;
                    });

                    if (isLoading) {
                        return (
                          <div className="flex flex-col gap-4">
                            <Skeleton height={64} borderRadius={12} count={5} />
                          </div>
                        );
                    }

                    if (sortedDates.length === 0) {
                        return (
                            <div className="text-center mt-10">
                                <span className="text-black/50 dark:text-white/50 text-[14px] font-normal leading-[120%]">
                                    No transaction history found for the selected filter!
                                </span>
                            </div>
                        );
                    }

                    return sortedDates.map((dateKey, index) => {
                        const transactions = grouped[dateKey];
                        const dateKeyParts = dateKey.split('/'); // DD/MM/YYYY from en-IN
                        const dateObj = new Date(Number(dateKeyParts[2]), Number(dateKeyParts[1]) - 1, Number(dateKeyParts[0]));
                        const heading = formatDate(dateObj, { type: 'short', showTodayYesterday: true }).toUpperCase();

                        return (
                            <div key={dateKey} className={index === 0 ? "" : "mt-[24px]"}>
                                <h2 className="text-[#7E7E7E] dark:text-white/50 text-[13px] font-medium leading-[120%] tracking-[1px] uppercase ml-[4px]">
                                    {heading}
                                </h2>

                                <div
                                    className="mt-[12px] flex flex-col bg-white dark:bg-[#1A1C20] border border-[#E9EAEB] dark:border-[#2A2D35] rounded-[16px] p-[14px_16px]"
                                    style={{
                                        boxShadow: isDarkMode ? 'none' : '0px 2px 8px rgba(0, 0, 0, 0.04)'
                                    }}
                                >
                                    {transactions.map((tx, txIndex) => {
                                        const { title, subtitle } = getTransactionDisplay(tx);
                                        const type = (tx.type || tx.transaction_type)?.toLowerCase();
                                        const status = tx.status?.toLowerCase();
                                        const desc = tx.description?.toLowerCase() || '';
                                        const isTopUp = type === 'credit' || desc.includes('top-up') || desc.includes('top up');

                                        // Deduce Icon
                                        const isMoneyIn = type === 'credit' || type === 'deposit' || desc.includes('top-up') || desc.includes('top up');
                                        const isUPIWithdrawal = desc.includes('withdrawal') && (desc.includes('upi') || subtitle.includes('UPI'));
                                        const icon = isUPIWithdrawal ? walletDebited : (isMoneyIn ? creditedArrow : debitedArrow);

                                        // Deduce Color
                                        let amountColor = (type === 'credit' || type === 'deposit') ? '#1CB956' : '#FF1E1E';
                                        if (status === 'pending' || status === 'held' || type === 'held') {
                                            amountColor = '#F59E0B';
                                        } else if (status === 'failed') {
                                            amountColor = '#FF1E1E';
                                        }

                                        const time = new Date(tx.created_at).toLocaleTimeString('en-IN', {
                                            hour: '2-digit', minute: '2-digit', hour12: true
                                        });

                                        return (
                                            <div key={tx.id} onClick={() => setSelectedTx(tx)} className="cursor-pointer active:opacity-70 transition-opacity">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-start gap-[16px]">
                                                        <img
                                                            src={icon}
                                                            alt=""
                                                            className="w-[32px] h-[32px]"
                                                        />
                                                        <div className="flex flex-col gap-[2px]">
                                                            <span className="text-[#1A1A1A] dark:text-white text-[15px] font-bold leading-[120%] tracking-[-0.3px]">
                                                                {title}
                                                            </span>
                                                            <span className="text-[#4A4A4A] dark:text-white/50 text-[13px] font-normal leading-[120%]">
                                                                {subtitle}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-[4px]">
                                                        <span
                                                            className="text-[15px] font-bold leading-[120%] tracking-[-0.3px]"
                                                            style={{ color: amountColor }}
                                                        >
                                                            {(tx.type === 'credit' || tx.transaction_type === 'credit' || tx.type === 'deposit' || tx.transaction_type === 'deposit') ? '+' : '-'} {tx.metadata?.isFx
                                                                ? `${currencySymbols[tx.metadata.toCurrency as string] || ''}${Number(tx.metadata.receiveAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                : `₹${Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                            }
                                                        </span>
                                                        <span className="text-[#666666] dark:text-white/40 text-[12px] font-normal leading-[120%]">
                                                            {time} | {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Divider */}
                                                {txIndex < transactions.length - 1 && (
                                                    <div
                                                        className="h-[1px] bg-[#E9EAEB] dark:bg-[#202020] mt-[8px] mb-[12px]"
                                                        style={{ marginLeft: '48px' }}
                                                    ></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>
            {/* Transaction Details Pop-up */}
            {selectedTx && (
                <TransactionDetailsPopup
                    tx={selectedTx}
                    onClose={() => setSelectedTx(null)}
                />
            )}
        </div>
    );
};

export default WalletTransactionHistory;

