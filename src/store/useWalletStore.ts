import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { calculateHeldBalance } from '@/lib/wallet';
import { WalletTier, WalletTransaction, Tables } from '@/types';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface WalletState {
  isWalletInitializing: boolean;
  isWalletActivated: boolean;
  walletTier: WalletTier;
  walletLimit: number;
  dailyLimit: number | null;
  maxWithdrawalLimit: number | null;
  upgradeTimestamp: number | null;
  scheduledDowngrade: { tier: WalletTier; effectiveDate: string } | null;
  lastDowngradeLoss: number | null;
  walletBalance: number;
  heldBalance: number;
  wallet_tiers: Tables['wallet_tiers'] | null;
  subscriptionPrice: number;
  paymentStatus: 'pending' | 'completed' | null;
  isRenewalPending: boolean;

  // Actions
  activateWallet: () => Promise<void>;
  deactivateWallet: () => void;
  setWalletTier: (tier: WalletTier) => Promise<void>;
  scheduleDowngrade: (tier: WalletTier, effectiveDate: string) => Promise<void>;
  cancelDowngrade: () => Promise<void>;
  completeScheduledDowngrade: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addMoney: (amount: number) => Promise<{ success: boolean; error?: Error | PostgrestError | string }>;
  fetchProfileDataForWallet: () => Promise<void>;
  initializeWallet: () => Promise<void>;
}

const defaultState = {
  isWalletInitializing: true,
  isWalletActivated: false,
  walletTier: 'Starter' as WalletTier,
  walletLimit: 5000,
  dailyLimit: null,
  maxWithdrawalLimit: null,
  upgradeTimestamp: null,
  scheduledDowngrade: null,
  lastDowngradeLoss: null,
  walletBalance: 0,
  heldBalance: 0,
  wallet_tiers: null,
  subscriptionPrice: 0,
  paymentStatus: null as 'pending' | 'completed' | null,
  isRenewalPending: false,
};

export const useWalletStore = create<WalletState>((set, get) => ({
  ...defaultState,

  initializeWallet: async () => {
    set({ isWalletInitializing: true });
    await Promise.all([
      get().fetchProfileDataForWallet(),
      get().refreshBalance()
    ]);
  },

  activateWallet: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('No user ID found');

      const { error: walletError } = await supabase.from('wallets').upsert(
        {
          user_id: userId,
          available_balance: 0,
          held_balance: 0,
          tier_id: 'fbef1e55-688d-4916-91b5-2a44a2ff3380',
        },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );

      if (walletError) throw walletError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_onboarded: true })
        .eq('id', userId);

      if (profileError) throw profileError;

      set({ isWalletActivated: true });
      await get().refreshBalance();
    } catch (error) {
      console.error('[WalletActivation] Failed:', error);
      throw error;
    }
  },

  deactivateWallet: () => {
    set({ isWalletActivated: false });
  },

  setWalletTier: async (tier: WalletTier) => {
    try {
      const { data: tierData, error: tierError } = await supabase
        .from('wallet_tiers')
        .select('id')
        .ilike('name', tier)
        .maybeSingle();

      if (tierError) throw tierError;
      if (!tierData) throw new Error(`Tier ${tier} not found`);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Unauthorized');

      const [profileUpdate, walletUpdate] = await Promise.all([
        supabase
          .from('profiles')
          .update({
            current_tier_id: tierData.id,
            scheduled_tier_id: null,
            tier_change_date: null,
          })
          .eq('id', userId),
        supabase.from('wallets').update({ tier_id: tierData.id }).eq('user_id', userId),
      ]);

      if (profileUpdate.error) throw profileUpdate.error;
      if (walletUpdate.error) throw walletUpdate.error;

      await get().fetchProfileDataForWallet();
    } catch (err) {
      console.error('Failed to set wallet tier:', err);
      toast.error("Couldn't update your plan. Please try again.");
    }
  },

  scheduleDowngrade: async (tier: WalletTier, effectiveDate: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Unauthorized');

      const { error: rpcError } = await supabase.rpc('schedule_downgrade', {
        p_user_id: userId,
        p_tier_name: tier,
        p_tier_change_date: effectiveDate,
      });

      if (rpcError) throw rpcError;

      set({ scheduledDowngrade: { tier, effectiveDate } });
      await get().fetchProfileDataForWallet();
    } catch (error) {
      console.error('[scheduleDowngrade] Failed:', error);
      toast.error("Couldn't schedule your plan change. Please try again.");
    }
  },

  cancelDowngrade: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('profiles')
        .update({ tier_change_date: null })
        .eq('id', userId);

      if (error) throw error;
      set({ scheduledDowngrade: null });
    } catch (error) {
      console.error('Failed to cancel downgrade in Supabase:', error);
      toast.error("Couldn't cancel your plan change. Please try again.");
    }
  },

  completeScheduledDowngrade: async () => {
    const scheduled = get().scheduledDowngrade;
    if (scheduled) {
      const newTier = scheduled.tier;
      try {
        const { data: tierData, error: tierError } = await supabase
          .from('wallet_tiers')
          .select('id, max_wallet_balance')
          .ilike('name', newTier)
          .maybeSingle();

        if (tierError) throw tierError;
        if (!tierData) throw new Error(`Tier ${newTier} not found`);

        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) throw new Error('Unauthorized');

        const newLimit = tierData.max_wallet_balance || 0;
        const currentBalance = get().walletBalance;

        const { error: rpcError } = await supabase.rpc('apply_tier_forfeiture', {
          p_user_id: userId,
          p_new_tier_id: tierData.id,
          p_new_limit: newLimit,
          p_current_balance: currentBalance,
        });

        if (rpcError) throw rpcError;

        await get().refreshBalance();
        await get().fetchProfileDataForWallet();
      } catch (err) {
        console.error('Failed to complete downgrade:', err);
        toast.error("Something went wrong while updating your plan. Please contact support.");
      }
    }
  },

  refreshBalance: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        set({ isWalletInitializing: false });
        return;
      }

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('available_balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletError) console.error('Error reading wallet balance:', walletError);

      if (!walletData) {
        set({
          walletBalance: 0,
          heldBalance: 0,
          isWalletActivated: false,
          isWalletInitializing: false,
        });
        return;
      }

      const balance = Number(walletData?.available_balance || 0);
      const flooredBalance = Math.floor(balance);

      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'held');

      const held = Math.floor(calculateHeldBalance((txData as WalletTransaction[]) || []));

      const shouldBeActivated = flooredBalance > 0 || held > 0;
      
      let isWalletActivated = get().isWalletActivated || shouldBeActivated;

      if (!isWalletActivated && !shouldBeActivated) {
        const { count, error: txError } = await supabase
          .from('wallet_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (count && count > 0) {
          isWalletActivated = true;
        }
        if (txError) console.error('Error in fetchAndCalculateBalance (txHistory):', txError);
      }

      set({
        walletBalance: flooredBalance,
        heldBalance: held,
        isWalletActivated,
        isWalletInitializing: false,
      });
    } catch (err) {
      console.error('Error in refreshBalance:', err);
      set({ isWalletInitializing: false });
    }
  },

  refreshTransactions: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      window.dispatchEvent(
        new CustomEvent('refresh_wallet_transactions', { detail: { userId } })
      );
    }
  },

  addMoney: async (amount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Unauthorized');

      const { error: rpcError } = await supabase.rpc('wallet_deposit', {
        p_user_id: userId,
        p_amount: amount,
        p_description: 'Wallet Top-up',
        p_reference_id: 'razorpay',
      });

      if (rpcError) throw rpcError;

      await get().refreshBalance();
      return { success: true };
    } catch (error) {
      console.error('Failed to add money:', error);
      return { success: false, error: error as string | Error };
    }
  },

  fetchProfileDataForWallet: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          payment_status, subscription_status, current_tier_id, scheduled_tier_id, tier_change_date, is_passport_verified,
          wallet_tiers!current_tier_id(*, subscription_price),
          scheduled_tier:wallet_tiers!scheduled_tier_id(name)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        let tierData = profileData.wallet_tiers as unknown as Tables['wallet_tiers'] | Tables['wallet_tiers'][] | null;
        if (Array.isArray(tierData)) tierData = tierData[0];

        let schedData = profileData.scheduled_tier as unknown as { name: string } | { name: string }[] | null;
        if (Array.isArray(schedData)) schedData = schedData[0];
        let schedParsedName: string | null = null;
        if (schedData && schedData.name) {
          schedParsedName = schedData.name.charAt(0).toUpperCase() + schedData.name.slice(1);
        }

        const currentWalletActivated = get().isWalletActivated;
        const newIsWalletActivated = currentWalletActivated || 
          (tierData?.name && tierData.name.toLowerCase() !== 'starter') ||
          profileData.subscription_status === 'completed' ||
          !!profileData.is_passport_verified;

        set({
          walletTier: tierData?.name ? ((tierData.name.charAt(0).toUpperCase() + tierData.name.slice(1)) as WalletTier) : 'Starter',
          walletLimit: tierData?.max_wallet_balance ? Math.floor(tierData.max_wallet_balance) : 5000,
          dailyLimit: tierData?.daily_withdraw_limit != null ? Math.floor(tierData.daily_withdraw_limit) : null,
          maxWithdrawalLimit: tierData?.daily_withdraw_limit != null ? Math.floor(tierData.daily_withdraw_limit) : null,
          wallet_tiers: tierData,
          subscriptionPrice: tierData?.subscription_price ? Number(tierData.subscription_price) : 0,
          scheduledDowngrade: profileData.scheduled_tier_id ? {
            tier: (schedParsedName as WalletTier) || get().scheduledDowngrade?.tier || 'Starter',
            effectiveDate: profileData.tier_change_date,
          } : null,
          paymentStatus: profileData.payment_status as 'pending' | 'completed' | null,
          isRenewalPending: profileData.payment_status === 'pending' || profileData.subscription_status === 'pending' || (!!profileData.tier_change_date && new Date() >= new Date(profileData.tier_change_date)),
          isWalletActivated: newIsWalletActivated,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile data for wallet:', error);
    }
  },

}));
