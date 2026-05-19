import { ASSETS } from '@/constants/assets';
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import BackButton from '@/components/ui/BackButton';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { supabase } from '@/lib/supabase';
import { fetchActiveOrders, fetchPastOrders, cancelOrder, dev_seedMockOrders } from '@/lib/orders';
import { Order } from '@/types';
import { ROUTES } from '@/routes';
import OrderDetailsSheet from '@/components/OrderDetailsSheet';
import { toast } from '@/components/ui/use-toast';
import BaseListSkeleton from '@/components/skeletons/BaseListSkeleton';

const OrderCard = React.memo(
  ({
    order,
    isActive,
    isDarkMode,
    showOnlyPast,
    onSelect,
  }: {
    order: Order;
    isActive: boolean;
    isDarkMode: boolean;
    showOnlyPast: boolean;
    onSelect: (order: Order) => void;
  }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const timeStr = date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const isToday = date.toDateString() === new Date().toDateString();
      if (isToday) {
        return `Today | ${timeStr}`;
      } else {
        return `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} | ${timeStr}`;
      }
    };

    const getStatusConfig = (status: string) => {
      const s = status.toLowerCase();
      if (
        s === 'pending' ||
        s === 'accepted' ||
        s === 'picked_up' ||
        s === 'at_store' ||
        s === 'processing' ||
        s === 'out_for_delivery' ||
        s === 'arrived'
      ) {
        return {
          textClass: 'text-yellow-700 dark:text-yellow-600',
          bgColor: '#FACC15',
          bgOpacity: 0.21,
          icon: ASSETS.PROCESSING,
          statusIcon: ASSETS.REFRESH,
          label: s === 'pending' ? 'pending' : (s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')),
          iconFilter: !isDarkMode
            ? 'brightness(0) saturate(100%) invert(54%) sepia(93%) saturate(2311%) hue-rotate(18deg) brightness(96%) contrast(101%)'
            : undefined,
        };
      } else if (s === 'success' || s === 'delivered') {
        return {
          textClass: 'text-green-700 dark:text-green-500',
          bgColor: '#1CB956',
          bgOpacity: 0.21,
          icon: ASSETS.SUCCESS,
          statusIcon: ASSETS.CHECK,
          label: 'Success',
          iconFilter: !isDarkMode
            ? 'invert(53%) sepia(76%) saturate(446%) hue-rotate(92deg) brightness(94%) contrast(92%)'
            : undefined,
        };
      } else if (s === 'failed' || s === 'cancelled') {
        return {
          textClass: 'text-red-600 dark:text-red-400',
          bgColor: '#FF1E1E',
          bgOpacity: 0.21,
          icon: ASSETS.FAILED,
          statusIcon: ASSETS.CROSS,
          label: s === 'cancelled' ? 'Cancelled' : 'Failed',
          iconFilter: !isDarkMode
            ? 'invert(27%) sepia(91%) saturate(7483%) hue-rotate(356deg) brightness(101%) contrast(106%)'
            : undefined,
        };
      }
      return {
        textClass: 'text-white',
        bgOpacity: 0.1,
        icon: ASSETS.PROCESSING,
        statusIcon: ASSETS.REFRESH,
        label: status,
      };
    };

    const config = getStatusConfig(order.status);

    return (
      <div
        role="button"
        tabIndex={0}
        className="w-full rounded-[12px] overflow-hidden mb-[16px] cursor-pointer active:opacity-90 transition-opacity relative outline-none focus:ring-2 focus:ring-primary/50"
        style={{
          height: '100px',
          background: isDarkMode
            ? `${config.bgColor}${Math.round(config.bgOpacity * 255)
                .toString(16)
                .padStart(2, '0')}`
            : `${config.bgColor}36`,
          border: isDarkMode ? '0.63px solid transparent' : '1px solid #E9EAEB',
        }}
        onClick={() => {
          if (showOnlyPast) {
            navigate('/help/report', { state: { order } });
            return;
          }
          const s = order.status.toLowerCase();
          const isCompleted = s === 'success' || s === 'delivered';
          const isFailedOrCancelled = s === 'failed' || s === 'cancelled';
          if (isActive || isCompleted || isFailedOrCancelled) {
            onSelect(order);
          } else {
            navigate(`/order-details/${order.id}`, { state: { order } });
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (showOnlyPast) {
              navigate('/help/report', { state: { order } });
              return;
            }
            const s = order.status.toLowerCase();
            const isCompleted = s === 'success' || s === 'delivered';
            const isFailedOrCancelled = s === 'failed' || s === 'cancelled';
            if (isActive || isCompleted || isFailedOrCancelled) {
              onSelect(order);
            } else {
              navigate(`/order-details/${order.id}`, { state: { order } });
            }
          }
        }}
      >
        {/* Top Container */}
        <div className="w-full h-[25px] flex items-center px-[18px] relative overflow-hidden">
          <div className="relative z-10 flex items-center mt-[2px]">
            <img
              src={config.statusIcon}
              alt=""
              className="w-3 h-3 mr-[4px]"
              style={{ filter: config.iconFilter }}
            />
            <span className={`text-[12px] font-bold font-satoshi ${config.textClass}`}>
              {config.label}
            </span>
          </div>
        </div>
        {/* Main Content Container */}
        <div
          className={`!absolute top-[25px] left-0 w-full glass-container glass-physics-clear z-10 rounded-b-[12px] ${!isDarkMode ? 'bg-white border-x border-b border-brand-border-light' : ''}`}
          style={
            {
              height: '75px',
              '--glass-radius': '0 0 12px 12px',
              '--glass-rim-mask': 'linear-gradient(to bottom, transparent 1px, #fff 1px)',
            } as React.CSSProperties
          }
        >
          {isDarkMode && (
            <>
              <div className="glass-lens" />
              <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{ backgroundColor: 'var(--glass-tint)' }}
              />
              <span className="glass-rim-v2" />
            </>
          )}
          <div className="relative z-10 flex items-start justify-between py-[14px] pl-[16px] pr-[14px]">
            <div className="flex items-start gap-[16px]">
              <img
                src={config.icon}
                alt={config.label}
                className="w-[35px] h-[35px]"
                width={35}
                height={35}
              />
              <div className="flex flex-col">
                <span
                  className={`text-[16px] font-regular font-satoshi leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  {order.order_type === 'REWARD'
                    ? (order.meta_data as any)?.item_value || 'Reward'
                    : order.meta_data?.type === 'FX_EXCHANGE'
                    ? 'FX Exchange'
                    : 'Cash Order'}
                </span>
                <span
                  className={`text-[12px] font-regular font-satoshi mt-1 ${isDarkMode ? 'text-brand-text-muted' : 'text-black/50'}`}
                >
                  {formatDate(order.created_at)} | ID: {order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              {order.order_type === 'REWARD' ? (
                <span className="text-[16px] font-bold font-satoshi text-green-600 leading-none">
                  +{order.amount || 0} pts
                </span>
              ) : (
                <span
                  className={`text-[16px] font-bold font-satoshi leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}
                >
                  ₹{(order.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
const currencySymbols: Record<string, string> = {
  AUD: '$',
  BRL: 'R$',
  CAD: '$',
  CHF: 'Fr',
  CNY: '¥',
  CZK: 'Kč',
  DKK: 'kr',
  EUR: '€',
  GBP: '£',
  HKD: '$',
  HUF: 'Ft',
  IDR: 'Rp',
  ILS: '₪',
  INR: '₹',
  ISK: 'kr',
  JPY: '¥',
  KRW: '₩',
  MXN: '$',
  MYR: 'RM',
  NOK: 'kr',
  NZD: '$',
  PHP: '₱',
  PLN: 'zł',
  RON: 'lei',
  SEK: 'kr',
  SGD: '$',
  THB: '฿',
  TRY: '₺',
  USD: '$',
  ZAR: 'R',
};
const EMPTY_ARRAY: Order[] = [];

const OrderHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useUser();
  const userId = profile?.id;
  const isDarkMode = useIsDarkMode();
  const showOnlyPast = location.state?.showOnlyPast || false;
  const searchParams = new URLSearchParams(location.search);
  const showOnlyRewards = location.state?.showOnlyRewards || searchParams.get('rewards') === 'true';
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPastOrders, setFilteredPastOrders] = useState<Order[]>([]);
  // Bottom Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedOrderForSheet, setSelectedOrderForSheet] = useState<Order | null>(null);
  const queryClient = useQueryClient();
  const { data: ordersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', userId || 'auth_pending', showOnlyRewards],
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('OrderHistory: Fetching orders. userId:', user?.id, 'showOnlyRewards:', showOnlyRewards);
      if (!user) return { active: [] as Order[], past: [] as Order[] };

      // Fetch Active Orders
      const active = await fetchActiveOrders(user.id);
      // Fetch Past Orders
      const past = await fetchPastOrders(user.id);
      console.log('OrderHistory: active fetched:', active.length, 'past fetched:', past.length);

      if (showOnlyRewards) {
        const { data: rewardData, error: rewardErr } = await supabase
          .from('reward_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'earned')
          .order('created_at', { ascending: false });

        console.log('OrderHistory: rewardData fetched:', rewardData?.length, 'error:', rewardErr);

        if (rewardData && rewardData.length > 0) {
          const sortedOrders = rewardData.map(rt => {
            return {
              id: rt.id,
              user_id: rt.user_id,
              amount: rt.points_amount || rt.amount || 0,
              total_amount: rt.points_amount || rt.amount || 0,
              status: 'delivered', // maps to 'completed' visually
              payment_mode: 'wallet',
              order_type: 'REWARD',
              meta_data: { type: 'REWARD', item_value: rt.description || 'Reward' },
              created_at: rt.created_at,
              updated_at: rt.created_at,
            } as unknown as Order;
          });

          console.log('OrderHistory: sortedOrders count:', sortedOrders.length);
          return { active: [] as Order[], past: sortedOrders };
        }
        return { active: [] as Order[], past: [] as Order[] };
      }
      return { active, past };
    },
    enabled: !!userId,
  });
  const activeOrders = ordersData?.active ?? EMPTY_ARRAY;
  const pastOrders = ordersData?.past ?? EMPTY_ARRAY;
  // Real-time subscription — invalidates query cache on changes
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('order-history-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', userId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]); // Add userId to dependencies
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
      const dateStr = date
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        .toLowerCase();
      const monthStr = date.toLocaleDateString('en-GB', { month: 'long' }).toLowerCase();
      const meta = order.meta_data;
      const typeStr = meta?.type === 'FX_EXCHANGE' ? 'fx exchange' : 'cash order'.toLowerCase();
      const currencyStr = (meta?.type === 'FX_EXCHANGE' ? (meta.to_currency || meta.toCurrency || '') : '').toLowerCase();
      const receiveAmountStr = meta?.type === 'FX_EXCHANGE' ? (meta.receive_amount || meta.receiveAmount || '').toString() : '';
      return (
        amountStr.includes(query) ||
        dateStr.includes(query) ||
        monthStr.includes(query) ||
        typeStr.includes(query) ||
        currencyStr.includes(query) ||
        receiveAmountStr.includes(query)
      );
    });
    setFilteredPastOrders(filtered);
  }, [searchQuery, pastOrders]);
  const handleSelectOrder = React.useCallback((order: Order) => {
    setSelectedOrderForSheet(order);
    setIsSheetOpen(true);
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId, 'User Request', 'Cancelled from history');
      setIsSheetOpen(false);
      // Refresh cache
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (e: unknown) {
      console.error('Failed to cancel order', e);
      const errorMessage = e instanceof Error ? e.message : 'Please try again later.';
      toast({
        variant: 'destructive',
        title: 'Cancellation Failed',
        description: errorMessage,
      });
    }
  };
  // Helper to group orders while preserving order
  const groupedPastOrders = React.useMemo(() => {
    const groups: { title: string; orders: Order[] }[] = [];
    const groupIndexMap: Record<string, number> = {};
    filteredPastOrders.forEach(order => {
      const date = new Date(order.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      let groupName = '';
      if (date.toDateString() === today.toDateString()) {
        groupName = 'Past orders';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupName = 'Yesterday';
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
      <div
        className={`w-full h-[48px] rounded-full flex items-center px-[10px] transition-all ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-brand-border-light shadow-sm'}`}
      >
        <div className="w-[16px] h-[16px] ml-[6px] mr-[16px] flex items-center justify-center">
          <img
            src={ASSETS.SEARCH}
            alt="Search"
            className="w-full h-full"
            style={!isDarkMode ? { filter: 'brightness(0) opacity(0.5)' } : undefined}
          />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search your orders: “₹2000”, “july”, etc..."
          className={`flex-1 bg-transparent border-none outline-none text-[14px] font-satoshi ${isDarkMode ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'}`}
        />
      </div>
    </div>
  );
  return (
    <div
      className="h-full w-full overflow-y-auto flex flex-col relative safe-top"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${ASSETS.BG_DARK_MODE})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        willChange: 'transform',
        transform: 'translateZ(0)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Light Mode Purple Glow */}
      {!isDarkMode && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-brand-primary rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
      )}
      {/* DEV SEEDER */}
      {import.meta.env.DEV && (
        <div className="px-5 py-2">
          <button
            onClick={async () => {
              try {
                if (userId) {
                  await dev_seedMockOrders(userId);
                  await refetch();
                  toast({
                    title: 'Mock Data Seeded',
                    description: '3 orders added to history.',
                  });
                } else {
                  toast({
                    variant: 'destructive',
                    title: 'Seeding Failed',
                    description: 'No active session found.',
                  });
                }
              } catch (error: unknown) {
                console.error('Seeding error:', error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                toast({
                  variant: 'destructive',
                  title: 'Seeding Failed',
                  description: errorMessage,
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
      <div className="pt-4 px-5 flex items-center relative mb-[26px] z-10 h-[88px] shrink-0">
        <BackButton onClick={() => navigate(-1)} />
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <h1
            className={`text-[18px] font-medium font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            {showOnlyRewards ? 'Reward History' : showOnlyPast ? 'Help & Support' : 'Order History'}
          </h1>
        </div>
      </div>
      {/* Search Bar */}
      {!showOnlyPast && !showOnlyRewards && searchBar}
      {/* Active Orders */}
      {!showOnlyPast && !showOnlyRewards && activeOrders.length > 0 && (
        <div className="px-5 mb-[35px] relative z-10">
          <h2
            className={`text-[16px] font-bold font-satoshi mb-[12px] ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            Active orders
          </h2>
          {activeOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              isActive={true}
              isDarkMode={isDarkMode}
              showOnlyPast={showOnlyPast}
              onSelect={handleSelectOrder}
            />
          ))}
        </div>
      )}

      {groupedPastOrders.length > 0 && !isLoading && (
        <div className="px-5 safe-bottom pb-4 relative z-10 flex flex-col gap-[24px]">
          {groupedPastOrders.map(group => (
            <div key={group.title}>
              <h2
                className={`${showOnlyPast ? 'text-brand-text-muted text-[14px] font-medium uppercase' : isDarkMode ? 'text-white' : 'text-black'} text-[16px] font-bold font-satoshi mb-[12px]`}
              >
                {group.title}
              </h2>
              {group.orders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isActive={false}
                  isDarkMode={isDarkMode}
                  showOnlyPast={showOnlyPast}
                  onSelect={handleSelectOrder}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {activeOrders.length === 0 && groupedPastOrders.length === 0 && !isLoading && !isError && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-10 relative z-20 pb-32">
          <div
            className={`w-[120px] h-[120px] rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}
          >
            {showOnlyRewards ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <polyline points="20 12 20 22 4 22 4 12"></polyline>
                <rect x="2" y="7" width="20" height="5"></rect>
                <line x1="12" y1="22" x2="12" y2="7"></line>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
              </svg>
            ) : (
              <img
                src={showOnlyPast ? ASSETS.HELP : ASSETS.ORDER_CASH}
                alt="No orders"
                className="w-12 h-12 opacity-40"
                style={!isDarkMode ? { filter: 'brightness(0)' } : undefined}
              />
            )}
          </div>
          <h2
            className={`text-[20px] font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            No orders yet
          </h2>
          <p
            className={`text-[14px] leading-relaxed mb-10 ${isDarkMode ? 'text-white/60' : 'text-black/40'}`}
          >
            Place your first cash order and it'll show up here.
          </p>
          <button
            onClick={() => navigate(ROUTES.ORDER_CASH)}
            className="w-full max-w-[240px] h-[48px] rounded-full text-white font-medium text-[16px] btn-gradient transition-all active:scale-95 shadow-xl shadow-brand-primary/20"
          >
            Withdraw Cash Now
          </button>
        </div>
      )}

      {isError && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-10 relative z-20 pb-32">
          <div className={`p-4 rounded-full mb-4 ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
            <img src={ASSETS.FAILED} alt="Error" className="w-8 h-8" />
          </div>
          <p className={`${isDarkMode ? 'text-white/60' : 'text-black/40'} text-[18px] mb-6`}>
            Failed to load orders. Please check your connection.
          </p>
          <button
            onClick={() => refetch()}
            className={`px-8 py-3 rounded-full font-medium transition-all active:scale-95 ${isDarkMode ? 'bg-white text-black' : 'bg-brand-primary text-white'}`}
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="mt-8 space-y-4 px-5 relative z-10">
          <BaseListSkeleton rows={5} />
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
