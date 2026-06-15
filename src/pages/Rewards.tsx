
/*
STEP 1 — SQL INVESTIGATION RESULTS
 
Because the parent records don't exist, we must rely solely on the `reward_transactions` table natively.
*/
import { ROUTES } from '@/routes';
import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Share2, Flame, Star, History,
  ShoppingBag, Package, Zap, Crown, Trophy,
  Users, Award, Lock, CheckCircle, MapPin,
  Network, Target
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>> = {
  ShoppingBag, Package, Star, Zap, Crown,
  Flame, Trophy, Users, Award, Lock,
  CheckCircle, MapPin, Network, Target,
};
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

import { OrderMetadata } from '@/types';
import ButtonSpinner from '@/components/ui/ButtonSpinner';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

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
    meta_data: OrderMetadata | null;
  };
}
const POINTS_PER_RUPEE = 40;
const Rewards = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { profile, fetchProfileData, rewardPoints, streakDays, referredBy } = useUser();
  const userId = profile?.id;
  const { showToaster } = useCustomToaster();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [inviteExpanded, setInviteExpanded] = useState(false);

  useBodyScrollLock(showHowItWorks || !!selectedBadge);

  const referralLink = `https://gridpe.in/refer?ref=${profile?.referral_code || ''}`;

  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchGamification = async () => {
      setBadgesLoading(true);

      const [userBadgesRes, allBadgesRes] = await Promise.all([
        supabase
          .from("user_badges")
          .select("badge_id, earned_at, badges(slug, name, icon_name, tier, description)")
          .eq("user_id", userId),
        supabase
          .from("badges")
          .select("id, slug, name, icon_name, tier, description, points_reward")
      ]);

      if (userBadgesRes.data) setUserBadges(userBadgesRes.data);
      if (allBadgesRes.data) setAllBadges(allBadgesRes.data);

      setBadgesLoading(false);
    };

    fetchGamification();
  }, [userId]);
  const { data: rewardTransactions = [] } = useQuery({
    queryKey: ['rewards', userId || 'auth_pending'],
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      // 0. Use authenticated user ID definitively
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as RewardTransaction[];

      // 1. Fetch earned reward transactions linked to orders
      const { data: rewardData, error: rewardError } = await supabase
        .from('reward_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'earned')
        .not('reference_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
      if (rewardError) throw rewardError;
      if (rewardData && rewardData.length > 0) {
        return rewardData.map((rt: any) => ({
          ...rt,
          transaction_type: (rt.type === 'spent' ? 'debit' : 'credit') as 'credit' | 'debit',
          order_details: undefined, // Removed join dependency entirely
        })) as RewardTransaction[];
      }
      return [] as RewardTransaction[];
    },
    enabled: !!userId,
  });
  useEffect(() => {
    if (!userId) return;
    // Subscribe to profile changes for reward_points updates
    const channel = supabase
      .channel('profile-reward-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        payload => {
          if (payload.new && 'reward_points' in payload.new) {
            fetchProfileData();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  const totalPoints = rewardPoints;
  const latestExpiry = useMemo(() => {
    if (rewardTransactions.length === 0) return 'N/A';
    const expiries = rewardTransactions
      .filter(tx => tx.transaction_type === 'credit')
      .map(tx => new Date(tx.expires_at).getTime());
    if (expiries.length === 0) return 'N/A';
    const latest = new Date(Math.max(...expiries));
    return `${latest.getMonth() + 1}/${latest.getFullYear().toString().slice(-2)}`;
  }, [rewardTransactions]);
  const handleCopyLink = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: 'Join me on Grid.Pe!',
          text: `Use my referral code to sign up on Grid.Pe and get ₹2.50 welcome bonus! 🎉`,
          url: referralLink,
          dialogTitle: 'Share your referral link',
        });
      } catch {
        // User dismissed share sheet — not an error
      }
    } else {
      try {
        await navigator.clipboard.writeText(referralLink);
        showToaster('Referral link copied!', 'success');
      } catch {
        showToaster('Could not copy link', 'error');
      }
    }
  };

  const getTierGradient = (tier: string) => {
    if (tier === 'bronze') return 'from-amber-900/60 to-amber-700/30';
    if (tier === 'gold') return 'from-yellow-700/60 to-yellow-500/30';
    if (tier === 'platinum') return 'from-purple-800/60 to-purple-500/30';
    return 'from-slate-600/60 to-slate-400/30'; // silver
  };
  const getTierPillStyle = (tier: string) => {
    if (tier === 'bronze') return 'bg-amber-900/40 text-amber-400';
    if (tier === 'gold') return 'bg-yellow-700/40 text-yellow-400';
    if (tier === 'platinum') return 'bg-purple-800/40 text-purple-400';
    return 'bg-slate-600/40 text-slate-300';
  };

  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-y-auto overscroll-y-contain ${isDarkMode ? 'bg-brand-bg-dark' : 'bg-white'} scrollbar-hide`}
      style={{
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : `url(${ASSETS.BG_LIGHT})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'auto',
      }}
    >
      {/* Light Mode Purple Glow */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      <div className="flex-1 px-5 safe-top pt-4 pb-[calc(120px+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="mb-6 relative z-10 flex items-start justify-between">
          <div>
            <img loading="eager" decoding="async" src={ASSETS.GRIDPE_LOGO}
              alt="grid.pe"
              className="h-10 mb-2"
              style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
            />
            <p
              className={`text-[12px] font-bold ${isDarkMode ? 'text-white/40' : 'text-black/40'} font-satoshi tracking-wider uppercase`}
            >
              REFERRALS & REWARDS
            </p>
          </div>
          <button
            onClick={() => navigate(ROUTES.REWARDS_HISTORY)}
            className="ml-auto p-2 rounded-full mt-1"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            aria-label="Rewards History"
          >
            <History size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
          </button>
        </div>
        {/* Top Invite Card — tap to expand referral */}
        {/* Top Invite Card — tap to expand referral */}
        <div 
          className="mb-[16px] relative z-10 flex justify-center cursor-pointer" 
          onClick={() => setInviteExpanded(!inviteExpanded)}
          style={{ perspective: '1000px' }}
        >
          <div
            className="rounded-[20px] overflow-hidden relative transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              width: '320px',
              height: '210px',
              backgroundImage: `url(${ASSETS.REWARDS_CARD})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: inviteExpanded ? 'rotateY(360deg)' : 'rotateY(0deg)',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
            }}
          >
            {/* Always visible: Invite header */}
            <div className="pt-[22px] flex flex-col items-center px-4">
              <p className="font-satoshi font-bold text-[24px] text-white leading-tight text-center">
                Tap to invite friends!
              </p>
              <p className="font-satoshi font-normal text-[12px] text-white/70 leading-none mt-[2px] text-center">
                and get 10,000 points every referral (₹250)
              </p>
            </div>

            {/* Referral link + button — always visible */}
            <div
              className="absolute bottom-[21px] w-full px-[18px] flex flex-col gap-[10px]"
            >
              {/* Referral link row */}
              <div
                className="flex items-center justify-between px-[14px] h-[38px] rounded-full bg-black border border-white/10"
              >
                <p
                  className="font-satoshi text-[12px] text-[#5260FE] truncate flex-1 mr-2"
                  style={{ maxWidth: '80%' }}
                >
                  {referralLink}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                  className="text-white flex items-center justify-center shrink-0"
                >
                  {Capacitor.isNativePlatform() ? <Share2 size={15} /> : <Copy size={15} />}
                </button>
              </div>

              {/* Send Invite button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                className="w-full h-[38px] shadow-xl transition-all bg-[#5260FE] hover:bg-[#5260FE]/90 active:scale-[0.98] text-white rounded-full font-satoshi font-medium text-[14px] flex items-center justify-center border-none"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>

        {/* Wrap rewards container and button to shift them together */}
        <div 
          className="relative w-full flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" 
          style={{ top: inviteExpanded ? '2px' : '-130px', marginBottom: inviteExpanded ? '2px' : '-130px' }}
        >
          {/* Rewards Container — overlaps the top invite card */}
          <div
            className="relative z-20 w-full bg-black rounded-[22px] p-[18px] cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={() => setInviteExpanded(!inviteExpanded)}
          >
          {/* Reward Points Row */}
          <div className="flex items-center justify-between mb-[20px]">
            <div className="flex flex-col">
              <p className="font-satoshi text-[14px] text-[#C4C4C4] leading-none mb-[8px]">
                Reward points
              </p>
              <p className="font-satoshi font-bold text-[32px] text-white leading-none">
                {totalPoints.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            {/* Badge SVG showing streak days */}
            <div className="relative flex items-center justify-center">
              <img
                src={ASSETS.BADGE_ICON}
                alt="streak badge"
                className="w-[56px] h-[56px]"
              />
              <span
                className="absolute font-satoshi font-bold text-[14px] text-white leading-none"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', marginTop: '-1px' }}
              >
                {streakDays}
              </span>
            </div>
          </div>

          {/* Streak Progress Box */}
          <div
            className="w-full rounded-[16px] p-[16px] mb-[24px]"
            style={{ background: '#131313' }}
          >
            <p className="font-satoshi font-bold text-[18px] text-white leading-tight mb-[2px]">
              {streakDays} day streak
            </p>
            <p className="font-satoshi text-[13px] text-white/80 mb-[16px]">
              {streakDays === 0
                ? 'Place an order today to start your streak!'
                : streakDays >= 30
                  ? '🏆 Legendary streak! +50 bonus points per order'
                  : streakDays >= 7
                    ? '🔥🔥 On fire! +50 bonus points per order'
                    : streakDays >= 3
                      ? '🔥 Heating up! +20 bonus points per order'
                      : "You're on a roll. Keep going!"}
            </p>

            {/* Streak Progress Bar — 7 flames for Mon–Sun */}
            <div className="mt-[22px] relative w-full">
              {(() => {
                const totalDays = 7;
                const completedDays = Math.min(streakDays, totalDays);
                const fillPercentage = completedDays <= 1 ? 0 : ((completedDays - 1) / (totalDays - 1)) * 100;

                return (
                  <>
                    {/* Continuous Track Container perfectly aligned to icon centers */}
                    <div className="absolute top-1/2 left-[16px] right-[16px] -translate-y-1/2 h-[6px] bg-[#232323] rounded-full overflow-hidden">
                      {/* Filled Track */}
                      <div 
                        className="h-full bg-[#FF961C] transition-all duration-500 rounded-full" 
                        style={{ width: `${fillPercentage}%` }} 
                      />
                    </div>

                    {/* Icons on top */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      {Array.from({ length: totalDays }).map((_, i) => {
                        const isLit = i < completedDays;
                        return (
                          <div key={i} className="flex flex-col items-center justify-center shrink-0 w-[32px] h-[32px] rounded-full">
                            <img
                              src={ASSETS.FIRE_ICON}
                              alt="flame"
                              className="w-[24px] h-[24px]"
                              style={{
                                filter: isLit ? 'none' : 'grayscale(1) brightness(0.25)',
                                opacity: isLit ? 1 : 0.8,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Badges Showcase */}
          <div className="mb-[8px] relative z-10">
            <div className="flex items-center gap-2 mb-[16px]">
              <h3 className="text-[14px] font-medium text-[#C4C4C4]">
                Badges
              </h3>
            </div>

            <div className="relative w-full">
              <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: '140px' }}>
                <div className="grid grid-cols-3 gap-3 pb-[40px]">
              {badgesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-full h-[108px] rounded-[12px] bg-white/5 animate-pulse" />
                ))
              ) : (
                <>
                  {userBadges.map((ub) => {
                    const badge = ub.badges || {};
                    const IconComponent = ICON_MAP[badge.icon_name] || Star;

                    let bgGradient = 'from-slate-600/40 to-slate-400/20';
                    let dotColor = 'bg-slate-400';
                    if (badge.tier === 'bronze') {
                      bgGradient = 'from-amber-900/40 to-amber-700/20';
                      dotColor = 'bg-amber-700';
                    } else if (badge.tier === 'gold') {
                      bgGradient = 'from-yellow-700/40 to-yellow-500/20';
                      dotColor = 'bg-yellow-500';
                    } else if (badge.tier === 'platinum') {
                      bgGradient = 'from-purple-800/40 to-purple-500/20';
                      dotColor = 'bg-purple-500';
                    }

                    return (
                      <div
                        key={ub.badge_id}
                        className={`w-full h-[108px] rounded-[12px] bg-gradient-to-b ${bgGradient} flex flex-col items-center justify-center relative border border-white/10 cursor-pointer`}
                        onClick={(e) => { e.stopPropagation(); setSelectedBadge({ ...badge, earned: true, earned_at: ub.earned_at }); }}
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5 w-full px-2">
                          <IconComponent size={22} className="text-white shrink-0" />
                          <span className="text-[10px] text-white text-center font-medium leading-tight line-clamp-2 w-full">{badge.name}</span>
                        </div>
                        <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      </div>
                    );
                  })}

                  {allBadges
                    .filter((b: any) => !userBadges.some(ub => ub.badge_id === b.id))
                    .map((badge: any) => {
                      const IconComponent = ICON_MAP[badge.icon_name] || Star;
                      return (
                        <div
                          key={badge.id}
                          className="w-full h-[108px] rounded-[12px] bg-white/5 flex flex-col items-center justify-center relative border border-white/5 opacity-40 grayscale cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setSelectedBadge({ ...badge, earned: false }); }}
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5 w-full px-2">
                            <IconComponent size={22} className="text-white shrink-0" />
                            <span className="text-[10px] text-white text-center font-medium leading-tight line-clamp-2 w-full">{badge.name}</span>
                          </div>
                        </div>
                      );
                    })}
                </>
              )}
                </div>
              </div>
              {/* Fade overlay for bottom cutoff effect */}
              <div className="absolute bottom-0 left-0 right-0 h-[20px] bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
        {/* Badge Detail Bottom Sheet */}
        {selectedBadge && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center"
            onClick={() => setSelectedBadge(null)}
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <div
              className="w-full rounded-t-[24px] p-6 pb-10 mx-auto"
              style={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.08)', maxWidth: '480px' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              {/* Icon large */}
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-b ${getTierGradient(selectedBadge.tier)}`}>
                {(() => {
                  const Icon = ICON_MAP[selectedBadge.icon_name] || Star;
                  return <Icon size={32} className="text-white" />;
                })()}
              </div>

              {/* Tier pill */}
              <div className="flex justify-center mb-3">
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${getTierPillStyle(selectedBadge.tier)}`}>
                  {selectedBadge.tier}
                </span>
              </div>

              {/* Name + description */}
              <h3 className="text-white text-[20px] font-bold text-center mb-2">{selectedBadge.name}</h3>
              <p className="text-brand-text-muted text-[14px] text-center mb-6">{selectedBadge.description}</p>

              {/* Earned / Locked status */}
              {selectedBadge.earned ? (
                <div className="flex items-center justify-center gap-2 text-green-400 text-[13px]">
                  <CheckCircle size={16} />
                  <span>Earned on {new Date(selectedBadge.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 text-brand-text-muted text-[13px]">
                    <Lock size={16} />
                    <span>Not yet earned</span>
                  </div>
                  {selectedBadge.points_reward > 0 && (
                    <span className="text-[12px] text-[#5260FE] mt-1">+{selectedBadge.points_reward} pts on unlock</span>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
        {/* How does this work? */}
        <button
          onClick={() => setShowHowItWorks(true)}
          className="flex items-center gap-1 text-brand-primary text-[16px] font-medium mb-[50px] relative z-10 mt-[16px] self-start"
        >
          How does this work?
        </button>
        </div>
      </div>
      {!showHowItWorks && <BottomNavigation activeTab="rewards" />}
      {/* How It Works Pop-up */}
      {showHowItWorks && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-5 animate-in fade-in duration-200 pointer-events-none"
          onClick={() => setShowHowItWorks(false)}
        >
          {/* Full page blur backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[10px] pointer-events-auto" />
          {/* Pop-up Container */}
          <div
            className="relative z-10 w-[362px] h-[483px] flex flex-col items-center overflow-hidden pointer-events-auto"
            style={{
              backgroundImage: isDarkMode
                ? `url(${ASSETS.REWARDS_HOWITWORKS})`
                : `url(${ASSETS.REWARDS_POPUP})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              borderRadius: '12px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Details Icon */}
            <img loading="lazy" decoding="async" src={ASSETS.DETAILS}
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
              className={`mt-[26px] w-[318px] h-[343px] rounded-[16px] p-[14px_13px] flex flex-col overflow-y-auto overscroll-contain scrollbar-hide ${isDarkMode ? 'bg-[#000000E5]' : 'bg-white'}`}
            >
              <ul className="space-y-[3px]">
                {[
                  'Earn points by bringing in friends or, shockingly, by actually using the app.',
                  'Earn 50 points for every successful cash pickup above \u20B9500.',
                  '1 point = \u20B90.025. Translation: 10,000 points = \u20B9250 in your pocket. (Every 4 points \u2248 10 paise)',
                  'Redeem once you stop being broke enough to hit 500 points (\u20B912.50).',
                  'Points expire in 12 months. Just like gym memberships and New Year resolutions.',
                  'Try to cheat the system? Boom \u2014 disqualified.',
                  'Grid.Pe reserves the right to change stuff. Because we can.',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                    />
                    <span
                      className={`text-[14px] font-medium font-satoshi leading-[140%] ${isDarkMode ? 'text-white opacity-90' : 'text-black opacity-100'}`}
                    >
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
            className={`relative z-10 mt-[19px] w-[137px] h-[42px] flex items-center justify-center gap-[6px] active:scale-95 transition-transform shrink-0 rounded-full pointer-events-auto ${!isDarkMode ? 'bg-brand-primary' : ''}`}
            style={
              isDarkMode
                ? {
                  backgroundImage: `url(${ASSETS.POP_UP_CLOSE_BTN})`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }
                : {}
            }
          >
            <img loading="lazy" decoding="async" src={ASSETS.CLOSE}
              alt=""
              className="w-6 h-6"
              style={!isDarkMode ? { filter: 'brightness(0) invert(1)' } : {}}
            />
            <span className="text-white text-[16px] font-medium leading-[120%] font-satoshi">
              Close
            </span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};
export default Rewards;
