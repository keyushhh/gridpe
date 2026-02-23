import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import searchBg from "@/assets/search-bg.png";
import searchIcon from "@/assets/search.svg";
import filterIcon from "@/assets/filter.svg";
import caretDownIcon from "@/assets/caret-down.svg";
import dateBg from "@/assets/date.png";
import typeBg from "@/assets/type.png";
import methodBg from "@/assets/method.png";
import debitedArrow from "@/assets/debited-arrow.svg";
import creditedArrow from "@/assets/credited-arrow.svg";
import successIcon from "@/assets/success.svg";
import processingIcon from "@/assets/processing.svg";
import failedIcon from "@/assets/failed.svg";
import closeIcon from "@/assets/close.svg";
import detailsIcon from "@/assets/details.svg";
import copyIcon from "@/assets/copy.svg";
import transactionDetailsLightBg from "@/assets/transaction-details-light.png";
import { useUser, WalletTransaction } from "@/contexts/UserContext";

const WalletTransactionHistory = () => {
    const navigate = useNavigate();
    const { walletTransactions, profile } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        date: "All Time",
        type: "All",
        method: "All"
    });
    const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
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
            const formattedDate = new Date(tx.date).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            }).toLowerCase();
            const matchesSearch = (
                tx.description.toLowerCase().includes(query) ||
                tx.amount.toString().includes(query) ||
                formattedDate.includes(query) ||
                tx.id.toLowerCase().includes(query)
            );
            if (!matchesSearch) return false;

            // 2. Date Filter
            const txDate = new Date(tx.date);
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
                if (filters.type === 'Wallet Top-Up' && !(tx.type === 'credit' && tx.description.toLowerCase().includes('top up'))) return false;
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
        let title = tx.type === 'credit' ? "Amount Credited" : "Amount Debited";
        let subtitle = tx.description;

        // Try mapping from metadata first (for newer transactions)
        const methodId = tx.metadata?.paymentMethodId as string | undefined;
        if (methodId && tx.type === 'credit') {
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
        if (desc.includes("cash order")) {
            title = "Amount Debited";
            subtitle = "Cash Order";
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
        } else if (desc.includes("cred") || desc.includes("google pay") || desc.includes("phone pe") || desc.includes("upi id") || desc.includes("upi")) {
            subtitle = "Added via UPI";
        } else if (desc.includes("cards") || desc.includes("card")) {
            subtitle = "Added via Cards";
        } else if (desc.includes("netbanking")) {
            subtitle = "Added via Netbanking";
        } else if (desc.includes("amazon wallet") || desc.includes("amazon")) {
            subtitle = "Added via Amazon Wallet";
        } else if (tx.type === 'credit') {
            const cleanDesc = tx.description.replace(/^Added via\s+/i, '');
            subtitle = `Added via ${cleanDesc}`;
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
                        className="mt-[9px] w-[318px] h-[174px] rounded-[16px] p-[11px_15px] flex flex-col justify-between"
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
                                { label: "Time", value: new Date(tx.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) },
                                { label: "Date", value: new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
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


    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';

    return (
        <div
            className="min-h-screen flex flex-col relative overflow-hidden font-sans"
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
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
            <div className="shrink-0 flex items-center justify-between w-full px-5 pt-12 pb-2 z-10 relative">
                {/* Back Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F5F5] dark:bg-white/10 backdrop-blur-md border border-[#E9EAEB] dark:border-white/10"
                    style={{ zIndex: 20 }}
                >
                    <ChevronLeft className="w-6 h-6 text-black dark:text-white" />
                </button>

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
            <div className="flex-1 w-full overflow-y-auto px-5 pb-[20px] mt-4 z-0">
                {(() => {
                    // Group by date
                    const grouped: { [key: string]: typeof walletTransactions } = {};
                    filteredTransactions.forEach(tx => {
                        const date = new Date(tx.date);
                        // Normalize to midnight for grouping
                        const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
                        if (!grouped[dateKey]) grouped[dateKey] = [];
                        grouped[dateKey].push(tx);
                    });

                    // Sort dates descending
                    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

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
                        const dateObj = new Date(dateKey);
                        const today = new Date();
                        const isToday = dateObj.getDate() === today.getDate() &&
                            dateObj.getMonth() === today.getMonth() &&
                            dateObj.getFullYear() === today.getFullYear();

                        const heading = isToday ? "TODAY" : dateObj.toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        }).toUpperCase();

                        return (
                            <div key={dateKey} className={index === 0 ? "" : "mt-[20px]"}>
                                <h2 className="text-black/50 dark:text-white/50 text-[13px] font-medium leading-[120%] tracking-[1px]">
                                    {heading}
                                </h2>

                                <div
                                    className="mt-[10px] flex flex-col bg-white dark:bg-[#1A1C20] border border-[#E9EAEB] dark:border-[#2A2D35] rounded-[12px] p-[10px_13px]"
                                >
                                    {transactions.map((tx, txIndex) => {
                                        const { title, subtitle } = getTransactionDisplay(tx);
                                        const icon = tx.type === 'credit' ? creditedArrow : debitedArrow;
                                        const amountColor = tx.type === 'credit' ? '#1CB956' : '#FF1E1E';

                                        const time = new Date(tx.date).toLocaleTimeString('en-US', {
                                            hour: 'numeric', minute: '2-digit', hour12: true
                                        });

                                        return (
                                            <div key={tx.id} onClick={() => setSelectedTx(tx)} className="cursor-pointer active:opacity-70 transition-opacity">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-start gap-[16px]">
                                                        <img
                                                            src={icon}
                                                            alt=""
                                                            className="w-[32px] h-[32px]"
                                                            style={isDarkMode ? {} : { opacity: 0.31, filter: 'grayscale(1) brightness(0.1)' }}
                                                        />
                                                        <div className="flex flex-col gap-[2px]">
                                                            <span className="text-[#1A1A1A] dark:text-white text-[12px] font-bold leading-[120%]">
                                                                {title}
                                                            </span>
                                                            <span className="text-[#4A4A4A] dark:text-white/50 text-[12px] font-normal leading-[120%]">
                                                                {subtitle}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-[2px]">
                                                        <span
                                                            className="text-[12px] font-bold leading-[120%]"
                                                            style={{ color: amountColor }}
                                                        >
                                                            {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[#666666] dark:text-white/50 text-[12px] font-normal leading-[120%]">
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
