import { useState, useEffect, useMemo } from "react";
import { Copy, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { useTheme } from "next-themes";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import bgLight from "@/assets/bg-light.png";
import gridpeLogo from "@/assets/gridpe-logo.svg";
import rewardsCardBg from "@/assets/rewards-card.png";
import rewardInfoIcon from "@/assets/reward-info.png";
import copyIcon from "@/assets/copy.svg";
import creditedArrow from "@/assets/rewards-credited.svg";
import debitedArrow from "@/assets/rewards-debited.svg";
import howItWorksBg from "@/assets/rewards-howitworks.png";
import rewardsPopup from "@/assets/rewards-popup.png";
import detailsIcon from "@/assets/details.svg";
import popupCloseBtnBg from "@/assets/pop-up-close-btn.png";
import closeIcon from "@/assets/close.svg";
import successIcon from "@/assets/success.svg";
import failedIcon from "@/assets/failed.svg";
import processingIcon from "@/assets/processing.svg";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import { useUser } from "@/contexts/UserContext";
import { supabase, USER_ID } from "@/lib/supabase";

interface RewardTransaction {
    id: string;
    user_id: string;
    amount?: number;
    points_amount?: number;
    transaction_type: 'credit' | 'debit';
    description: string;
    reference_id?: string;
    created_at: string;
    expires_at: string;
    // Joined order details
    order_details?: {
        amount: number;
        status: string;
        order_type: string;
        meta_data: any;
    };
}

const POINTS_PER_RUPEE = 40;

const Rewards = () => {
    const navigate = useNavigate();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme !== 'light';
    const { profile, fetchProfileData, rewardPoints } = useUser();
    const { showToaster } = useCustomToaster();
    const [rewardTransactions, setRewardTransactions] = useState<RewardTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    const referralLink = "http://sdp.apl/?ref=" + (profile?.referral_code || '');

    useEffect(() => {
        const loadRewards = async () => {
            if (!profile?.id) return;
            try {
                // 1. Fetch earned reward transactions linked to orders
                const { data: rewardData, error: rewardError } = await supabase
                    .from('reward_transactions')
                    .select('*')
                    .eq('user_id', profile.id)
                    .eq('type', 'earned')
                    .not('reference_id', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (rewardError) throw rewardError;

                if (rewardData && rewardData.length > 0) {
                    const orderIds = rewardData.map(rt => rt.reference_id);

                    // 2. Fetch associated orders from both tables
                    const [cashRes, fxRes] = await Promise.all([
                        supabase.from('cash_orders').select('*').in('id', orderIds),
                        supabase.from('fx_orders').select('*').in('id', orderIds)
                    ]);

                    const cashOrdersMap = new Map((cashRes.data || []).map(o => [o.id, { ...o, order_type: 'CASH_ORDER', amount: o.total_amount || o.item_value }]));
                    const fxOrdersMap = new Map((fxRes.data || []).map(o => [o.id, { ...o, order_type: 'FX_EXCHANGE', amount: o.total_amount || o.amount_total }]));

                    // 3. Combine
                    const fullTransactions = rewardData.map(rt => ({
                        ...rt,
                        order_details: cashOrdersMap.get(rt.reference_id) || fxOrdersMap.get(rt.reference_id)
                    }));

                    setRewardTransactions(fullTransactions);
                } else {
                    setRewardTransactions([]);
                }
            } catch (err) {
                console.error("Failed to load rewards", err);
                showToaster("Failed to load reward history", 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadRewards();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('reward-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reward_transactions', filter: `user_id=eq.${profile?.id}` },
                () => loadRewards()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id]);

    useEffect(() => {
        if (!profile?.id) return;

        // Subscribe to profile changes for reward_points updates
        const channel = supabase
            .channel('profile-reward-updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
                (payload) => {
                    if (payload.new && 'reward_points' in payload.new) {
                        fetchProfileData();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id]);

    const totalPoints = rewardPoints;

    const latestExpiry = useMemo(() => {
        if (rewardTransactions.length === 0) return "N/A";
        const expiries = rewardTransactions
            .filter(tx => tx.transaction_type === 'credit')
            .map(tx => new Date(tx.expires_at).getTime());
        if (expiries.length === 0) return "N/A";
        const latest = new Date(Math.max(...expiries));
        return `${latest.getMonth() + 1}/${latest.getFullYear().toString().slice(-2)}`;
    }, [rewardTransactions]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        showToaster("Referral link copied!", 'success');
    };

    const getStatusInfo = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'processing':
            case 'out_for_delivery':
            case 'arrived':
                return { text: 'Ongoing', color: '#FACC15' };
            case 'delivered':
            case 'success':
                return { text: 'Completed', color: '#16B751' };
            case 'cancelled':
            case 'failed':
            case 'rejected':
                return { text: 'Rejected', color: '#FF3B30' };
            default:
                return { text: status || 'Pending', color: '#FACC15' };
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'processing':
            case 'out_for_delivery':
            case 'arrived':
                return processingIcon;
            case 'delivered':
            case 'success':
                return successIcon;
            case 'cancelled':
            case 'failed':
            case 'rejected':
                return failedIcon;
            default:
                return processingIcon;
        }
    };

    const currencySymbols: Record<string, string> = {
        INR: '₹', USD: '$', EUR: '€', GBP: '£'
    };

    return (
        <div
            className={`absolute inset-0 flex flex-col overflow-y-auto overscroll-y-contain ${isDarkMode ? 'bg-[#0a0a12]' : 'bg-[#FFFFFF]'} scrollbar-hide`}
            style={{
                backgroundImage: isDarkMode ? `url(${bgDarkMode})` : `url(${bgLight})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Light Mode Purple Glow */}
            {!isDarkMode && (
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-[#5260FE] rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
            )}
            <div className="flex-1 px-5 pt-safe pt-4 pb-[calc(120px+env(safe-area-inset-bottom))]">
                {/* Header */}
                <div className="mb-6 relative z-10">
                    <img src={gridpeLogo} alt="grid.pe" className="h-10 mb-2" style={!isDarkMode ? { filter: 'brightness(0)' } : undefined} />
                    <p className={`text-[12px] font-bold ${isDarkMode ? 'text-white/40' : 'text-black/40'} font-satoshi tracking-wider uppercase`}>
                        REFERRALS & REWARDS
                    </p>
                </div>

                {/* Rewards Card */}
                <div
                    className="relative w-full rounded-[20px] flex flex-col overflow-hidden mb-[12px]"
                    style={{
                        height: "209px",
                        backgroundImage: `url(${rewardsCardBg})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        paddingLeft: "21px",
                        paddingRight: "21px",
                        paddingTop: "21px",
                        paddingBottom: "21px",
                    }}
                >
                    {/* Expiry Date Section */}
                    <div
                        className="absolute top-[21px] right-[21px] text-right"
                    >
                        <p
                            className="font-satoshi font-medium text-[12px] text-[#C4C4C4] leading-none"
                        >
                            Next Expiry
                        </p>
                        <p
                            className="font-satoshi font-bold text-[12px] text-[#FFFFFF] leading-none mt-[5px]"
                        >
                            {latestExpiry}
                        </p>
                    </div>

                    {/* Points Section */}
                    <div className="flex flex-col">
                        <p className="font-satoshi text-[12px] text-[#C4C4C4] leading-none">
                            Total Points
                        </p>
                        <p className="font-satoshi font-bold text-[20px] text-[#FFFFFF] leading-none mt-[6px]">
                            {totalPoints.toLocaleString()}
                        </p>
                    </div>

                    <div className="mt-[16px] flex items-center gap-3">
                        <div
                            className="flex items-center justify-center"
                            style={{
                                width: "174px",
                                height: "25px",
                                backgroundImage: `url(${rewardInfoIcon})`,
                                backgroundSize: "100% 100%",
                                backgroundPosition: "center",
                            }}
                        >
                            <span className="text-white text-[11px] font-satoshi">Min. 500 points to redeem</span>
                        </div>
                    </div>
                    <div className="mt-auto">
                        <p className="font-satoshi font-medium text-[14px] text-[#FFFFFF] leading-none">
                            Invite Friends
                        </p>
                        <p className="font-satoshi text-[12px] text-[#FFFFFF] leading-none mt-[6px]">
                            and get 10,000 points every referral (₹250)
                        </p>

                        <div className="flex items-center mt-[14px]">
                            <p className="font-satoshi font-medium text-[14px] text-[#848EFF]">
                                {referralLink}
                            </p>
                            <button
                                onClick={handleCopyLink}
                                className="ml-[12px] p-0"
                            >
                                <img src={copyIcon} alt="Copy" style={{ width: "15px", height: "15px" }} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* How does this work? */}
                <button
                    onClick={() => setShowHowItWorks(true)}
                    className="flex items-center gap-1 text-[#5260FE] text-[14px] font-medium mb-[50px] relative z-10"
                >
                    How does this work?
                </button>

                {/* Transaction History */}
                <div className="flex flex-col min-h-[300px] relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-[16px] font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Transaction History</h3>
                        <button onClick={() => navigate('/order-history?rewards=true')} className="text-[#5260FE] text-[14px]">
                            View All
                        </button>
                    </div>

                    <div className={`w-full h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-[#E9EAEB]'} mb-[15px]`} />

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5260FE]"></div>
                        </div>
                    ) : rewardTransactions.length > 0 ? (
                        <div className="flex flex-col">
                            {/* Headers - Homepage Style */}
                            <div className="grid grid-cols-[1fr_100px_80px] gap-x-6 mb-[12px] px-0">
                                <div>
                                    <span className="text-[#7E7E7E] text-[12px] font-normal font-sans">Details</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#7E7E7E] text-[12px] font-normal font-sans">Price</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#7E7E7E] text-[12px] font-normal font-sans">Status</span>
                                </div>
                            </div>

                            <div className="flex flex-col space-y-[16px]">
                                {rewardTransactions.map((tx) => {
                                    const order = tx.order_details;
                                    const status = order?.status || 'delivered';

                                    return (
                                        <div key={tx.id} className="grid grid-cols-[1fr_100px_80px] gap-x-6 items-start">
                                            {/* Details Column */}
                                            <div className="flex items-start">
                                                <img src={getStatusIcon(status)} alt="Status" className="w-[26px] h-[26px]" />
                                                <div className="ml-[7px] flex flex-col">
                                                    <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[13px] font-normal font-sans leading-none mb-[2px]`}>
                                                        {order ? (order.meta_data?.isFx ? "FX Exchange" : (order.meta_data?.item_value ? `Ordered ₹${order.meta_data.item_value} Cash` : "Cash Order")) : tx.description}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[#7E7E7E] text-[12px] font-normal font-sans leading-none">
                                                            {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'short'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price Column */}
                                            <div className="text-right">
                                                <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-[13px] font-normal font-sans`}>
                                                    {order ? (
                                                        order.meta_data?.isFx
                                                            ? `${currencySymbols[order.meta_data.toCurrency as string] || ''}${Number(order.meta_data.receiveAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                            : `₹${(order.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                                    ) : '-'}
                                                </span>
                                            </div>

                                            {/* Status Column */}
                                            <div className="text-right">
                                                <span
                                                    className="text-[13px] font-normal font-sans capitalize"
                                                    style={{ color: getStatusInfo(status).color }}
                                                >
                                                    {getStatusInfo(status).text}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center pt-8">
                            <p className="text-[#7E7E7E] text-[14px] font-medium w-[219px] leading-relaxed">
                                This screen’s more empty than your promises to go to the gym.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {!showHowItWorks && <BottomNavigation activeTab="rewards" />}

            {/* How It Works Pop-up */}
            {showHowItWorks && (
                <div
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-5 animate-in fade-in duration-200"
                    onClick={() => setShowHowItWorks(false)}
                >
                    {/* Full page blur backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[10px]" />

                    {/* Pop-up Container */}
                    <div
                        className="relative z-10 w-[362px] h-[483px] flex flex-col items-center overflow-hidden"
                        style={{
                            backgroundImage: isDarkMode ? `url(${howItWorksBg})` : `url(${rewardsPopup})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            borderRadius: '12px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Details Icon */}
                        <img
                            src={detailsIcon}
                            alt=""
                            className="w-[30px] h-[30px] mt-[22px]"
                            style={!isDarkMode ? { filter: 'brightness(0)' } : {}}
                        />

                        {/* Header */}
                        <h2
                            className={`mt-[12px] text-[16px] font-bold leading-[120%] tracking-[-0.3px] text-center font-satoshi ${isDarkMode ? 'text-white' : 'text-black'}`}
                        >
                            How does this work?
                        </h2>

                        {/* Detail Container */}
                        <div
                            className={`mt-[26px] w-[318px] h-[343px] rounded-[16px] p-[14px_13px] flex flex-col overflow-y-auto scrollbar-hide ${isDarkMode ? 'bg-[#000000E5]' : 'bg-white'}`}
                        >
                            <ul className="space-y-[3px]">
                                {[
                                    "Earn points by bringing in friends or, shockingly, by actually using the app.",
                                    "Earn 50 points for every successful cash pickup above \u20B9500.",
                                    "1 point = \u20B90.025. Translation: 10,000 points = \u20B9250 in your pocket. (Every 4 points \u2248 10 paise)",
                                    "Redeem once you stop being broke enough to hit 500 points (\u20B912.50).",
                                    "Points expire in 12 months. Just like gym memberships and New Year resolutions.",
                                    "Try to cheat the system? Boom \u2014 disqualified.",
                                    "Grid.Pe reserves the right to change stuff. Because we can."
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                                        <span className={`text-[14px] font-medium font-satoshi leading-[140%] ${isDarkMode ? 'text-white opacity-90' : 'text-black opacity-100'}`}>
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setShowHowItWorks(false)}
                        className={`relative z-10 mt-[19px] w-[137px] h-[42px] flex items-center justify-center gap-[6px] active:scale-95 transition-transform shrink-0 rounded-full ${!isDarkMode ? 'bg-[#5260FE]' : ''}`}
                        style={isDarkMode ? {
                            backgroundImage: `url(${popupCloseBtnBg})`,
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                        } : {}}
                    >
                        <img src={closeIcon} alt="" className="w-6 h-6" style={!isDarkMode ? { filter: 'brightness(0) invert(1)' } : {}} />
                        <span
                            className="text-white text-[16px] font-medium leading-[120%] font-satoshi"
                        >
                            Close
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Rewards;
