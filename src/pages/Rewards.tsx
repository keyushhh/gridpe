import { useState, useEffect, useMemo } from "react";
import { Coins, Copy, ChevronRight } from "lucide-react";
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
    order_id?: string;
    created_at: string;
    expires_at: string;
}

const POINTS_PER_RUPEE = 40;

const Rewards = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const { profile, fetchProfileData, rewardPoints } = useUser();
    const { showToaster } = useCustomToaster();
    const [rewardTransactions, setRewardTransactions] = useState<RewardTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [isRedeeming, setIsRedeeming] = useState(false);

    const referralLink = "http://sdp.apl/?ref=" + Math.random().toString(36).substring(2, 7).toUpperCase();

    useEffect(() => {
        const loadRewards = async () => {
            if (!profile?.id) return;
            try {
                const { data, error } = await supabase
                    .from('reward_transactions')
                    .select('*')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) {
                    setRewardTransactions(data);
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
            <div className="flex-1 px-5 pt-12 pb-[120px]">
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

                        <button
                            disabled={totalPoints < 500 || isRedeeming}
                            onClick={() => {
                                showToaster("Redemption logic coming soon!", 'success');
                            }}
                            className={`h-[25px] px-4 rounded-full text-[11px] font-bold font-satoshi transition-all ${totalPoints >= 500
                                ? 'bg-[#FFD700] text-black hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(255,215,0,0.5)]'
                                : 'bg-white/10 text-white/40 border border-white/10 cursor-not-allowed'
                                }`}
                        >
                            {isRedeeming ? 'Redeeming...' : 'REDEEM'}
                        </button>
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
                        <button className="text-[#5260FE] text-[14px]">View All</button>
                    </div>

                    <div className={`w-full h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-[#E9EAEB]'} mb-[15px]`} />

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5260FE]"></div>
                        </div>
                    ) : rewardTransactions.length > 0 ? (
                        <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[#7E7E7E] text-[12px] font-medium uppercase font-satoshi">Details</span>
                                <span className="text-[#7E7E7E] text-[12px] font-medium uppercase font-satoshi">Price</span>
                            </div>

                            <div className="flex flex-col space-y-[8px]">
                                {rewardTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-1">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                                <Coins
                                                    className={`w-5 h-5 ${tx.transaction_type === 'credit' ? 'text-[#FFD700]' : 'text-red-500'}`}
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-[15px] font-medium font-satoshi leading-tight`}>
                                                    {tx.description}
                                                </p>
                                                <p className="text-[#7E7E7E] text-[13px] font-normal font-satoshi mt-0.5 leading-tight">
                                                    {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-[15px] font-bold font-satoshi ${tx.transaction_type === 'credit' ? 'text-[#FFD700]' : 'text-red-500'}`}>
                                                {tx.transaction_type === 'credit' ? '+' : '-'}{Math.abs(tx.points_amount || tx.amount || 0)} P
                                            </p>
                                            {tx.transaction_type === 'credit' && (
                                                <p className="text-[10px] text-[#7E7E7E] mt-0.5">
                                                    Exp: {new Date(tx.expires_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
