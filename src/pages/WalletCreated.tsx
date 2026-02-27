import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser, WalletTier } from "@/contexts/UserContext";
import { tierIconMap, tierCardMap, tierCardMapLight } from "@/lib/walletTiers";
import { useAsset } from "@/hooks/useAsset";
import settingsIcon from "@/assets/settings.svg";
import successIcon from "@/assets/success.svg";
import processingIcon from "@/assets/processing.svg";
import failedIcon from "@/assets/failed.svg";
import addPaymentCta from "@/assets/add-payment-cta.png";
import { supabase, USER_ID } from "@/lib/supabase";

const WalletCreated = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || theme === 'system';
    const queryClient = useQueryClient();
    const { walletTier, upgradeTimestamp } = useUser();

    const { data: walletData, isLoading: isWalletLoading } = useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("wallets")
                .select("*, wallet_tiers(*)")
                .eq("user_id", USER_ID)
                .single();
            if (error) throw error;
            return data;
        }
    });

    const { data: walletTransactions = [], isLoading: isTxLoading } = useQuery({
        queryKey: ['wallet_transactions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("wallet_transactions")
                .select("*")
                .eq("user_id", USER_ID)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data?.map(tx => ({ ...tx, date: tx.created_at })) || [];
        }
    });

    useEffect(() => {
        const channel = supabase.channel('wallet-created-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${USER_ID}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['wallet'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${USER_ID}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['wallet_transactions'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const walletBalance = walletData?.available_balance || 0;
    const dbTier = (walletData?.wallet_tiers as any)?.tier_name as WalletTier || walletTier;
    const dbLimit = (walletData?.wallet_tiers as any)?.max_wallet_balance || 5000;

    const walletBg = useAsset("wallet-bg");

    // Get the latest transaction for the card status display
    const latestTx = walletTransactions.length > 0 ? walletTransactions[0] : null;

    const renderStatusIndicator = () => {
        // Prioritize showing transaction status if there is a balance and a transaction exists
        if (walletBalance > 0 && latestTx) {
            const absAmount = Math.abs(latestTx.amount);
            const formattedAmount = absAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            let statusColor = "";
            let strokeColor = "";
            let title = "";
            let description = "";

            if (latestTx.status === 'pending' || latestTx.transaction_type === 'held') {
                statusColor = "#FACC15"; // Yellow
                strokeColor = "rgba(250, 204, 21, 0.17)";
                const isWithdrawal = latestTx.description.toLowerCase().includes('withdrawal');
                title = isWithdrawal ? `Withdrawal Pending - ₹${formattedAmount}` : `On hold ₹${formattedAmount}`;
                description = isWithdrawal
                    ? `₹${formattedAmount} withdrawal is being processed by the bank.`
                    : `₹${formattedAmount} is currently on hold. It’ll be released after delivery confirmation.`;
            } else if (latestTx.transaction_type === 'debit') {
                statusColor = "#D33313"; // Red
                strokeColor = "rgba(211, 51, 19, 0.17)";
                title = `Amount debited - ₹${formattedAmount}`;
                description = `₹${formattedAmount} was debited from your wallet after successful delivery confirmation.`;
            } else if (latestTx.transaction_type === 'credit') {
                statusColor = "#5CFF00"; // Green
                strokeColor = "rgba(92, 255, 0, 0.17)";
                title = `Amount Credited + ₹${formattedAmount}`;
                description = `₹${formattedAmount} was added to your wallet via UPI.`;
            }

            return (
                <div className="mt-[16px]">
                    <div className="flex items-center">
                        {/* Circle Indicator */}
                        <div
                            style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: statusColor,
                                boxShadow: `0 0 0 5px ${strokeColor}`
                            }}
                        />
                        <span className={`ml-[13px] text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {title}
                        </span>
                    </div>
                    <p className={`mt-[10px] text-[12px] font-normal font-sans leading-snug ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {description}
                    </p>
                </div>
            );
        }

        // If no balance/transactions to show, fallback to Tier status for non-Starter tiers
        if (dbTier !== 'Starter') {
            const priceMap: Record<string, string> = {
                'Pro': '25',
                'Elite': '50',
                'Supreme': '100'
            };
            const price = priceMap[dbTier] || '0';

            return (
                <div className="mt-[16px]">
                    <div className="flex items-center">
                        <div
                            style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: '#5CFF00',
                                boxShadow: '0 0 0 5px rgba(92, 255, 0, 0.17)'
                            }}
                        />
                        <span className={`ml-[13px] text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Your wallet is upgraded to {dbTier}
                        </span>
                    </div>
                    <p className={`mt-[10px] text-[12px] font-normal font-sans leading-snug ${isDarkMode ? 'text-white/60' : 'text-black/80'}`}>
                        You will be charged ₹{price} / month
                    </p>
                </div>
            );
        }

        // Default Empty State (Starter Tier, 0 Balance)
        return (
            <div className="mt-[16px]">
                <p className={`text-[13px] font-medium font-sans leading-tight tracking-tight ${isDarkMode ? 'text-white/90' : 'text-black/90'}`}>
                    Uh ho! Looks like a little empty here, let’s fix that?<br />
                    Press the button below!
                </p>
            </div>
        );
    };

    if (isWalletLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#0a0a12]">
                <Loader2 className="w-8 h-8 animate-spin text-[#5260FE]" />
            </div>
        );
    }

    return (
        <div
            className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom"
            style={{
                backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
                backgroundImage: isDarkMode ? `url(${walletBg})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Purple Glow (Top Center) */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}
            {/* Header Container */}
            <div className="shrink-0 flex items-center justify-between w-full px-5 pt-12 pb-2 z-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/home')}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isDarkMode ? 'bg-white/10 backdrop-blur-md' : 'bg-white border border-[#E9EAEB]'}`}
                >
                    <ChevronLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </button>

                {/* Title */}
                <h1 className={`text-[20px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Wallet
                </h1>

                {/* Settings Button */}
                <button
                    onClick={() => navigate('/wallet-settings')}
                    className="w-10 h-10 flex items-center justify-center"
                >
                    <img
                        src={settingsIcon}
                        alt="Settings"
                        className="w-6 h-6"
                        style={{ filter: isDarkMode ? 'none' : 'invert(1) brightness(0)' }}
                    />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 w-full px-5 pt-4 overflow-y-auto no-scrollbar pb-[20px]">

                {/* Wallet Card */}
                {/* Dynamic height based on content */}
                <div className="w-full relative mx-auto shrink-0" style={{ width: '100%', maxWidth: '360px', minHeight: '200px' }}>
                    {/* Card Background */}
                    <div
                        className="absolute inset-0 w-full h-full"
                        style={{
                            backgroundImage: `url('${isDarkMode ? tierCardMap[dbTier as keyof typeof tierCardMap] : tierCardMapLight[dbTier as keyof typeof tierCardMapLight]}')`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            borderRadius: '20px',
                            border: isDarkMode ? 'none' : '1px solid #E9EAEB'
                        }}
                    />

                    {/* Card Content */}
                    <div className="relative w-full h-full px-5 pt-6 pb-[20px] flex flex-col">
                        <div className="flex justify-between items-center">
                            <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-sans uppercase`}>
                                Wallet Balance
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-[12px]">
                            <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[34px] font-bold font-sans`}>
                                ₹ {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="mt-auto">
                            <span className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[14px] font-medium font-sans`}>
                                Limit: {dbLimit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                        </div>

                        {/* Dynamic Status Indicator */}
                        {renderStatusIndicator()}
                    </div>
                </div>

                {/* Important Section - Only show if balance is 0 */}
                {walletBalance === 0 && (
                    <div
                        className="mt-5 w-full mx-auto relative flex flex-col justify-center px-[19px] py-[9px]"
                        style={{
                            maxWidth: '362px',
                            minHeight: '81px',
                            backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : 'rgba(82, 96, 254, 0.05)',
                            borderRadius: '13px',
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(82, 96, 254, 0.1)'
                        }}
                    >
                        <h3 className={`text-[14px] font-medium font-sans mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Important:
                        </h3>
                        <p className={`text-[14px] font-normal font-sans leading-snug ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            You need to add money to your wallet to place an order.
                        </p>
                    </div>
                )}

                {/* Transaction History */}
                <div className="mt-5 w-full mx-auto mb-[20px]" style={{ maxWidth: '362px' }}>
                    <div className="flex justify-between items-center mb-[12px]">
                        <h2 className={`text-[16px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Transaction History
                        </h2>
                        <button
                            onClick={() => navigate('/wallet-transaction-history')}
                            className="text-[#3B82F6] text-[14px] font-medium font-sans"
                        >
                            View All
                        </button>
                    </div>
                    {/* Divider */}
                    <div className="w-full mb-[12px]" style={{ borderTop: isDarkMode ? '2px solid rgba(255, 255, 255, 0.06)' : '2px solid #E9EAEB' }} />

                    {walletTransactions.length > 0 ? (
                        <div className="w-full flex flex-col">
                            {/* Headers Row */}
                            <div className="flex justify-between items-center px-0 mb-[12px]">
                                <div className="text-[#7E7E7E] text-[12px] font-normal font-sans">Details</div>
                                <div className="text-right text-[#7E7E7E] text-[12px] font-normal font-sans">Price</div>
                            </div>

                            <div className="flex flex-col gap-[16px]">
                                {walletTransactions.map(tx => {
                                    const icon = (tx.transaction_type === 'debit' || tx.status === 'failed') ? failedIcon :
                                        (tx.status === 'pending' || tx.transaction_type === 'held') ? processingIcon :
                                            successIcon;

                                    return (
                                        <div key={tx.id} className="flex justify-between items-center">
                                            <div className="flex items-center gap-[12px]">
                                                <img src={icon} alt="" className="w-[26px] h-[26px]" />
                                                <div className="flex flex-col">
                                                    <span className={`text-[13px] font-normal font-sans leading-none mb-[2px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                        {tx.description}
                                                    </span>
                                                    <span className={`text-[12px] font-normal font-sans leading-none ${isDarkMode ? 'text-[#7E7E7E]' : 'text-[#7E7E7E]'}`}>
                                                        {new Date(tx.date).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[13px] font-normal font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                    {tx.transaction_type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full py-10 flex items-center justify-center">
                            <p className="text-[#878787] text-[14px] font-normal font-sans text-center px-10">
                                This screen’s more empty than<br />
                                your promises to go to the gym.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer CTA */}
            <div className="shrink-0 px-5 pb-[30px] pt-4 w-full bg-transparent flex flex-col gap-[12px]">
                <button
                    onClick={() => navigate('/wallet-add-money', { state: { balance: walletBalance.toFixed(2), from: 'wallet' } })}
                    className="w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans rounded-full active:scale-95 transition-transform"
                    style={{
                        backgroundColor: '#5260FE',
                    }}
                >
                    Add Money
                </button>

                {walletBalance > 0 && (
                    <button
                        onClick={() => navigate('/wallet-withdraw')}
                        className={`w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans rounded-full active:scale-95 transition-transform ${isDarkMode ? '' : 'bg-black'}`}
                        style={{
                            backgroundImage: isDarkMode ? `url(${addPaymentCta})` : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat"
                        }}
                    >
                        Withdraw
                    </button>
                )}
            </div>
        </div>
    );
};

export default WalletCreated;
