import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser, WalletTier } from "@/contexts/UserContext";
import { tierIconMap, tierCardMap, tierCardMapLight } from "@/lib/walletTiers";
import { useAsset } from "@/hooks/useAsset";
import settingsIcon from "@/assets/settings.svg";
import successIcon from "@/assets/success.svg";
import processingIcon from "@/assets/processing.svg";
import failedIcon from "@/assets/failed.svg";
import walletCreditedIcon from "@/assets/wallet-credited.svg";
import walletDebitedIcon from "@/assets/wallet-debited.svg";
import addPaymentCta from "@/assets/add-payment-cta.png";
import { supabase, USER_ID } from "@/lib/supabase";
import BalanceAlert from "@/components/BalanceAlert";

const WalletCreated = () => {
    const navigate = useNavigate();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme !== 'light';
    const queryClient = useQueryClient();
    const { profile, walletTier, upgradeTimestamp, walletBalance, heldBalance, walletLimit, dailyLimit, wallet_tiers, isRenewalPending, scheduledDowngrade, isInitializing, deactivateWallet, isWalletActivated } = useUser();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id || USER_ID;
            setUserId(currentUserId);
            
        };
        getSession();
    }, [navigate]);

    const { data: realWalletData, isLoading: isRealWalletLoading } = useQuery({
        queryKey: ['real_wallet', userId],
        enabled: !!userId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
            
            if (error) throw error;
            return data;
        }
    });

    useEffect(() => {
        // Conditional Lock: Only show the WalletIntro screen if the API explicitly returns a 404 or an empty array.
        // Guard: Only fire if we are NOT loading and the wallet is null, AND if the wallet is currently marked as activated.
        if (!isRealWalletLoading && realWalletData === null) {
            if (isWalletActivated) {
                deactivateWallet();
                navigate('/wallet', { replace: true });
            }
        }
    }, [isRealWalletLoading, realWalletData, navigate, deactivateWallet, isWalletActivated]);

    const { data: walletData, isLoading: isWalletLoading } = useQuery({
        queryKey: ['wallet', userId],
        enabled: !!userId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*, wallet_tiers!current_tier_id(*)")
                .eq("id", userId)
                .single();
            if (error) throw error;
            return data;
        }
    });

    const { data: walletTransactions = [], isLoading: isTxLoading } = useQuery({
        queryKey: ['wallet_transactions', userId],
        enabled: !!userId,
        queryFn: async () => {
            const [txRes, payoutRes] = await Promise.all([
                supabase.from("wallet_transactions").select("*").eq("user_id", userId),
                supabase.from("payouts").select("*").eq("user_id", userId)
            ]);

            let merged: any[] = [];
            if (txRes.data) {
                merged = txRes.data.map(tx => ({ ...tx, date: tx.created_at }));
            }

            if (payoutRes.data) {
                payoutRes.data.forEach(p => {
                    // Avoid double counting if already bridged in wallet_transactions
                    const exists = merged.some(m =>
                        m.description?.toLowerCase().includes('withdrawal') &&
                        Math.abs(m.amount) === Math.abs(p.amount) &&
                        new Date(m.created_at).getTime() === new Date(p.created_at).getTime()
                    );

                    if (!exists) {
                        merged.push({
                            id: p.id,
                            user_id: p.user_id,
                            amount: p.amount,
                            transaction_type: 'debit',
                            status: p.status,
                            created_at: p.created_at,
                            date: p.created_at,
                            description: 'Wallet Withdrawal',
                            payout_method: p.payout_method,
                            vpa: p.vpa
                        });
                    }
                });
            }

            return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
    });

    useEffect(() => {
        if (!userId) return;

        const channel = supabase.channel('wallet-created-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${userId}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['wallet_transactions', userId] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts', filter: `user_id=eq.${userId}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['wallet_transactions', userId] });
                queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient, userId]);

    useEffect(() => {
        const handleRefresh = (e: any) => {
            if (e.detail?.userId === userId) {
                queryClient.invalidateQueries({ queryKey: ['wallet_transactions', userId] });
                queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
            }
        };
        window.addEventListener('refresh_wallet_transactions', handleRefresh);
        return () => window.removeEventListener('refresh_wallet_transactions', handleRefresh);
    }, [queryClient, userId]);

    const dbTier = walletTier;
    const dbLimit = wallet_tiers?.max_wallet_balance || walletLimit;
    const dbDailyLimit = wallet_tiers?.daily_withdraw_limit ?? dailyLimit;

    const getTransactionDisplay = (tx: any) => {
        const txType = tx.transaction_type || tx.type;
        const status = tx.status?.toLowerCase();
        let title = status === 'held' ? "Amount Held" : ((txType === 'credit' || txType === 'deposit') ? "Amount Credited" : "Amount Debited");
        let subtitle = tx.description;

        const methodId = tx.metadata?.paymentMethodId as string | undefined;

        // Try mapping from metadata first
        if (methodId && (txType === 'credit')) {
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

        // Specific subtitle for withdrawals
        if (tx.description?.toLowerCase().includes('withdrawal')) {
            const method = tx.payout_method || tx.metadata?.payout_method;
            const vpa = tx.vpa || tx.metadata?.vpa;

            if (method === 'upi') {
                return { title: "Withdrawn", subtitle: `Withdrawn to ${vpa || 'UPI'}` };
            } else if (method === 'bank_transfer') {
                return { title: "Withdrawn", subtitle: `Withdrawn to Bank` };
            } else if (method === 'card') {
                return { title: "Withdrawn", subtitle: `Withdrawn to Card` };
            }
            return { title: "Withdrawn", subtitle: "Withdrawn to Bank Account" };
        }

        // Fallback to pattern matching
        const desc = tx.description.toLowerCase();
        if (tx.metadata?.isFx || desc.includes("fx exchange")) {
            title = status === 'held' ? "Amount Held" : ((txType === 'credit' || txType === 'deposit') ? "Amount Credited" : "Amount Debited");
            subtitle = "FX Exchange";
        } else if (desc.includes("cash order") || desc.includes("cash delivery")) {
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
            const methodLabel = methodId ? (methodNames[methodId as string] || "Bank") : "Bank Transfer";
            subtitle = `Withdrawn to ${methodLabel}`;
        } else if (desc.includes("top-up") || desc.includes("top up")) {
            subtitle = "Wallet Top-up";
            if (desc.includes("upi")) subtitle = "Added via UPI";
            else if (desc.includes("card")) subtitle = "Added via Cards";
            else if (desc.includes("netbanking")) subtitle = "Added via Netbanking";
        } else if (txType === 'tier_adjustment') {
            title = "Tier Adjustment";
            subtitle = "Balance adjusted for tier limit";
        }

        // User friendly description overrides
        if (subtitle && (subtitle.includes('Placement') || subtitle.includes('Order #'))) {
            // Trim UUID if present
            subtitle = subtitle.split('#')[0].trim();
        }

        return { title, subtitle };
    };

    const walletBg = useAsset("wallet-bg");

    // Get the latest transaction for the card status display
    const latestTx = walletTransactions.length > 0 ? walletTransactions[0] : null;

    const renderStatusIndicator = () => {
        // PERMANENT FIXTURE FOR UPGRADED TIERS: 
        // Always show the "Upgraded to" badge on the card for non-Starter tiers.
        if (dbTier !== 'Starter') {
            const priceMap: Record<string, string> = {
                'Pro': '25',
                'Elite': '50',
                'Supreme': '100'
            };
            const price = priceMap[dbTier] || '0';
            const isDowngradePending = isRenewalPending || (profile as any)?.subscription_status === 'pending';
            const showWarning = isDowngradePending;
            const hasScheduledDowngrade = !!scheduledDowngrade;
            const transitionSuccess = (location as any).state?.transitionSuccess;

            return (
                <div className="mt-[16px]">
                    <div className="flex items-center">
                        <div
                            style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: showWarning ? '#FACC15' : '#5CFF00',
                                boxShadow: `0 0 0 5px ${showWarning ? 'rgba(250, 204, 21, 0.17)' : 'rgba(92, 255, 0, 0.17)'}`
                            }}
                        />
                        <span className={`ml-[13px] text-[14px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {isDowngradePending
                                ? `Downgrade Payment Pending`
                                : (transitionSuccess
                                    ? `Your wallet has been ${transitionSuccess.type}d to ${transitionSuccess.tier} tier`
                                    : (hasScheduledDowngrade
                                        ? `Downgrade Scheduled to ${scheduledDowngrade.tier}`
                                        : `Your wallet is active on ${dbTier} tier`))}
                        </span>
                    </div>
                    <p className={`mt-[10px] text-[12px] font-normal font-sans leading-snug ${isDarkMode ? 'text-white/60' : 'text-black/80'}`}>
                        {showWarning
                            ? "Wallet features are locked until renewal is paid."
                            : `You will be charged ₹${price} / month`}
                    </p>
                </div>
            );
        }

        // For Starter Tier: Show the latest transaction if balance > 0
        if (Number(walletBalance) > 0 && latestTx) {
            const absAmount = Math.abs(latestTx.amount);
            const formattedAmount = absAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            let statusColor = "";
            let strokeColor = "";
            let title = "";
            let description = "";

            const type = latestTx.transaction_type?.toLowerCase();
            const txDescription = latestTx.description?.toLowerCase() || '';
            const status = latestTx.status?.toLowerCase();

            const isTopUp = type === 'credit' || txDescription.includes('top-up');
            const isFxOrCash = txDescription.includes('fx exchange') || txDescription.includes('cash delivery') || txDescription.includes('cash order');
            const isOnHold = status === 'held' && isFxOrCash;

            if (isOnHold) {
                statusColor = "#FACC15";
                strokeColor = "rgba(250, 204, 21, 0.17)";
                title = `On hold ₹${formattedAmount}`;
                description = `₹${formattedAmount} is currently on hold. It’ll be released after delivery confirmation.`;
            } else if (txDescription.includes('cancelled') || txDescription.includes('failed') || txDescription.includes('released')) {
                statusColor = "#5CFF00";
                strokeColor = "rgba(92, 255, 0, 0.17)";
                title = `Funds Returned + ₹${formattedAmount}`;
                description = `₹${formattedAmount} was returned to your wallet for a cancelled/failed order.`;
            } else if (type === 'debit') {
                const isWithdrawal = txDescription.includes('withdrawal');
                statusColor = "#D33313";
                strokeColor = "rgba(211, 51, 19, 0.17)";

                if (isWithdrawal) {
                    const method = latestTx.payout_method || latestTx.metadata?.payout_method;
                    let mode = "Bank Account";
                    if (method === 'upi') {
                        mode = latestTx.vpa || latestTx.metadata?.vpa || "UPI";
                    } else if (method === 'card') {
                        mode = "Card";
                    } else if (method === 'bank_transfer') {
                        mode = "Bank Account";
                    }

                    title = `Amount Withdrawn - ₹${formattedAmount}`;
                    description = `₹${formattedAmount} withdrawn to ${mode}`;
                } else {
                    title = `Amount debited - ₹${formattedAmount}`;
                    description = `₹${formattedAmount} was debited from your wallet after successful delivery confirmation.`;
                }
            } else if (isTopUp || type === 'credit' || type === 'deposit') {
                statusColor = "#5CFF00";
                strokeColor = "rgba(92, 255, 0, 0.17)";
                title = `Amount Credited + ₹${formattedAmount}`;
                description = txDescription.includes('top-up')
                    ? `₹${formattedAmount} was added to your wallet via top-up.`
                    : `₹${formattedAmount} was added to your wallet via UPI.`;
            } else if (type === 'tier_adjustment') {
                statusColor = "#3B82F6"; // Keep blue for administrative adjustment
                strokeColor = "rgba(59, 130, 246, 0.17)";
                title = `Balance adjusted to ${dbTier} limit`;
                description = `₹${formattedAmount} adjustment processed.`;
            } else {
                statusColor = "#3B82F6";
                strokeColor = "rgba(59, 130, 246, 0.17)";
                title = `Transaction ₹${formattedAmount}`;
                description = `₹${formattedAmount} transaction processed.`;
            }

            return (
                <div className="mt-[16px]">
                    <div className="flex items-center">
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

        // Default Empty State (Starter Tier, 0 Balance)
        if (Number(walletBalance) > 0) return null;
        return (
            <div className="mt-[16px]">
                <p className={`text-[13px] font-medium font-sans leading-tight tracking-tight ${isDarkMode ? 'text-white/90' : 'text-black/90'}`}>
                    Uh ho! Looks like a little empty here, let’s fix that?<br />
                    Press the button below!
                </p>
            </div>
        );
    };

    if (isWalletLoading || isTxLoading || isInitializing || isRealWalletLoading || (realWalletData === null)) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#0a0a12]">
                <Loader2 className="w-8 h-8 animate-spin text-[#5260FE]" />
            </div>
        );
    }

    return (
        <div
            key={userId || 'wallet'}
            className="h-full w-full overflow-y-auto overscroll-auto flex flex-col safe-area-top relative"
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
            <div className="shrink-0 flex items-center justify-between w-full px-5 pt-4 pb-2 z-10">
                {/* Back Button */}
                <BackButton onClick={() => navigate('/home')} />


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
                    <div className="relative w-full h-full px-5 pt-4 pb-[20px] flex flex-col">
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

                        <div className="mt-auto flex flex-col gap-1">
                            <span className={`${isDarkMode ? 'text-white/80' : 'text-black/80'} text-[14px] font-medium font-sans`}>
                                Wallet Limit: {dbLimit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                            {dbDailyLimit != null ? (
                                <span className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[12px] font-medium font-sans`}>
                                    Daily Limit: {dbDailyLimit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </span>
                            ) : dbTier === 'Supreme' ? (
                                <span className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-[12px] font-medium font-sans`}>
                                    Daily Limit: No Limit
                                </span>
                            ) : null}
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

                {/* Balance Alert Banner */}
                <BalanceAlert className="mt-[14px] mb-5" />

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
                                {walletTransactions.slice(0, 10).map(tx => {
                                    const status = tx.status?.toLowerCase();
                                    const type = tx.transaction_type?.toLowerCase();
                                    const desc = tx.description?.toLowerCase() || '';

                                    const isMoneyIn = type === 'credit' || type === 'deposit' || desc.includes('top-up');
                                    const icon = isMoneyIn ? walletCreditedIcon : walletDebitedIcon;

                                    const { title, subtitle } = getTransactionDisplay(tx);

                                    return (
                                        <div key={tx.id} className="flex justify-between items-center gap-3">
                                            <div className="flex items-center gap-[12px] flex-1 min-w-0">
                                                <img src={icon} alt="" className="w-[26px] h-[26px] shrink-0" />
                                                <div className="flex flex-col min-w-0 overflow-hidden">
                                                    <span className={`text-[13px] font-medium font-sans leading-none mb-[2px] truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                        {title}
                                                    </span>
                                                    <span className={`text-[11px] font-normal font-sans leading-none mb-[4px] truncate ${isDarkMode ? 'text-[#7E7E7E]' : 'text-[#7E7E7E]'}`}>
                                                        {subtitle}
                                                    </span>
                                                    <span className={`text-[11px] font-normal font-sans leading-none ${isDarkMode ? 'text-[#7E7E7E]/60' : 'text-[#7E7E7E]/60'}`}>
                                                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} | {new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`text-[13px] font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                    {(type === 'credit' || type === 'deposit') ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            <div className="shrink-0 px-5 mt-auto pb-safe pb-4 pt-4 w-full bg-transparent flex flex-col gap-[12px]">
                <button
                    disabled={isRenewalPending || (profile as any)?.subscription_status === 'pending'}
                    onClick={() => !isRenewalPending && (profile as any)?.subscription_status !== 'pending' && navigate('/wallet-add-money')}
                    className={`w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans rounded-full active:scale-95 transition-transform ${(isRenewalPending || (profile as any)?.subscription_status === 'pending') ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-[#5260FE]'}`}
                >
                    Add Money
                </button>

                {walletBalance > 0 && (
                    <button
                        onClick={() => navigate('/wallet-withdraw')}
                        disabled={isRenewalPending || (profile as any)?.subscription_status === 'pending'}
                        className={`w-full h-[48px] flex items-center justify-center text-white text-[16px] font-medium font-sans rounded-full active:scale-95 transition-transform ${(isRenewalPending || (profile as any)?.subscription_status === 'pending') ? 'bg-gray-500 cursor-not-allowed opacity-50' : (isDarkMode ? '' : 'bg-black')}`}
                        style={(isRenewalPending || (profile as any)?.subscription_status === 'pending') ? {} : {
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
