import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { supabase } from '@/lib/supabase';
import { ASSETS } from '@/constants/assets';
import BaseListSkeleton from '@/components/skeletons/BaseListSkeleton';
import { ShoppingBag, Users, Award, Flame, Gift, ArrowUpRight, Clock } from 'lucide-react';
import { crashlytics } from '@/lib/crashlytics';

const RewardsHistory = () => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  const { profile } = useUser();
  const userId = profile?.id;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['rewards_history', userId],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
          .from('reward_transactions')
          .select('id, type, points_amount, description, created_at, reference_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        crashlytics.recordError(err instanceof Error ? err : new Error('RewardsHistory failed to load transactions'), 'RewardsHistory.queryFn');
        throw err;
      }
    },
    enabled: !!userId,
  });

  const totalPointsEarned = useMemo(() => {
    return transactions
      .filter(tx => ['earned', 'referral', 'badge_bonus', 'streak_bonus', 'bonus'].includes(tx.type))
      .reduce((sum, tx) => sum + (tx.points_amount || 0), 0);
  }, [transactions]);

  const groupedTransactions = useMemo(() => {
    const groups: { month: string; txs: Record<string, unknown>[] }[] = [];
    const map: Record<string, number> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.created_at);
      const monthStr = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); // e.g. "Jun '26"
      const formattedMonth = `${monthStr.split(' ')[0]} '${monthStr.split(' ')[1]}`;
      
      if (map[formattedMonth] !== undefined) {
        groups[map[formattedMonth]].txs.push(tx);
      } else {
        groups.push({ month: formattedMonth, txs: [tx] });
        map[formattedMonth] = groups.length - 1;
      }
    });
    return groups;
  }, [transactions]);

  const getTransactionUI = (tx: Record<string, unknown>) => {
    const desc = (tx.description as string) || '';
    const type = tx.type as string;
    
    let Icon = Gift;
    let bgColor = 'bg-blue-500/20';
    let iconColor = 'text-blue-500';
    let title = desc;
    let amountColor = 'text-green-600';
    let amountPrefix = '+';

    if (type === 'earned') {
      Icon = ShoppingBag;
      bgColor = 'bg-green-500/20';
      iconColor = 'text-green-500';
      title = desc.includes('FX') ? 'FX Order reward' : 'Cash Order reward';
    } else if (type === 'referral') {
      Icon = Users;
      bgColor = 'bg-purple-500/20';
      iconColor = 'text-purple-500';
      title = desc.includes('Welcome') ? 'Welcome bonus' : 'Referral bonus';
    } else if (type === 'badge_bonus') {
      Icon = Award;
      bgColor = 'bg-amber-500/20';
      iconColor = 'text-amber-500';
      title = desc.replace('Earned badge: ', '');
    } else if (type === 'streak_bonus') {
      Icon = Flame;
      bgColor = 'bg-orange-500/20';
      iconColor = 'text-orange-500';
      title = 'Streak bonus';
    } else if (type === 'bonus') {
      Icon = Gift;
      bgColor = 'bg-blue-500/20';
      iconColor = 'text-blue-500';
    } else if (type === 'redeemed') {
      Icon = ArrowUpRight;
      bgColor = 'bg-red-500/20';
      iconColor = 'text-red-500';
      title = 'Redeemed';
      amountColor = isDarkMode ? 'text-white/60' : 'text-black/60';
      amountPrefix = '-';
    } else if (type === 'expired') {
      Icon = Clock;
      bgColor = isDarkMode ? 'bg-white/10' : 'bg-gray-200';
      iconColor = isDarkMode ? 'text-white/60' : 'text-gray-500';
      title = 'Points expired';
      amountColor = isDarkMode ? 'text-white/60' : 'text-black/60';
      amountPrefix = '-';
    }

    return { Icon, bgColor, iconColor, title, amountColor, amountPrefix };
  };

  return (
    <div
      className="h-full w-full overflow-y-auto flex flex-col relative safe-top"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}

      {/* Header */}
      <div className="pt-4 px-5 flex items-center relative mb-[26px] z-10 h-[88px] shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <h1 className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Rewards History
          </h1>
        </div>
      </div>

      <div className="flex-1 px-5 relative z-10 pb-10">
        {/* Total Points */}
        <div className="flex flex-col items-center justify-center mb-8">
          <span className="text-brand-text-muted text-[13px] font-medium mb-1">Total Points Earned</span>
          <span className={`text-[32px] font-bold font-satoshi leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {totalPointsEarned.toLocaleString()}
          </span>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="mt-8 space-y-4">
            <BaseListSkeleton rows={5} />
          </div>
        ) : transactions.length > 0 ? (
          <div className="flex flex-col gap-[24px]">
            {groupedTransactions.map(group => (
              <div key={group.month}>
                <h2 className={`text-[16px] font-bold font-satoshi mb-[16px] ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {group.month}
                </h2>
                <div className="flex flex-col space-y-[20px]">
                  {group.txs.map(tx => {
                    const ui = getTransactionUI(tx);
                    const dateStr = new Date(tx.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    
                    return (
                      <div key={tx.id as string} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center ${ui.bgColor}`}>
                            <ui.Icon size={20} className={ui.iconColor} />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[15px] font-medium font-satoshi leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                              {ui.title}
                            </span>
                            <span className="text-brand-text-muted text-[12px] font-normal mt-0.5">
                              {dateStr}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[15px] font-bold font-satoshi ${ui.amountColor}`}>
                          {ui.amountPrefix}{(tx.points_amount as number) || 0} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center pt-10">
            <p className="text-brand-text-muted text-[15px] font-medium max-w-[220px] leading-relaxed">
              No rewards history yet. Place your first order to start earning!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsHistory;
