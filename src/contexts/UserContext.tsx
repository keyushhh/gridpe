import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, USER_ID } from '@/lib/supabase';
import { calculateBalance, calculateHeldBalance, WalletTransaction as LibWalletTransaction, Payout } from '@/lib/wallet';

/* -------------------- Types -------------------- */

export type WalletTier = 'Starter' | 'Pro' | 'Elite' | 'Supreme';

interface UserProfile {
  id: string;
  phone: string | null;
  name: string | null;
  created_at?: string;
  mpin_set?: boolean;
  mpin_hash?: string | null;
  mpin_created_at?: string | null;
  reward_points?: number;
  subscription_status?: string;
}

export interface WalletTransaction extends LibWalletTransaction { }

interface UserState {
  phoneNumber: string;
  name: string;
  email: string;
  emailVerified: boolean;
  profileImage: string | null;
  kycStatus: 'incomplete' | 'pending' | 'complete';
  kycSubmittedAt: number | null;
  mpin: string | null;
  biometricEnabled: boolean;
  profile: UserProfile | null;
  isWalletActivated: boolean;

  /* Wallet Tier */
  walletTier: WalletTier;
  walletLimit: number;
  dailyLimit: number | null;
  maxWithdrawalLimit: number | null;
  upgradeTimestamp: number | null;
  isPassportVerified: boolean;
  scheduledDowngrade: { tier: WalletTier; effectiveDate: string } | null;
  lastDowngradeLoss: number | null;

  /* Wallet Balance */
  walletBalance: number;
  heldBalance: number;

  /* FX Stats */
  isFxEnabled: boolean;

  /* Tier Object */
  wallet_tiers: any | null;
  subscriptionPrice: number;
  paymentStatus: 'pending' | 'completed' | null;
  isRenewalPending: boolean;
  rewardPoints: number;
}

interface UserContextType extends UserState {
  setPhoneNumber: (phone: string) => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setEmailVerified: (verified: boolean) => void;
  setProfileImage: (image: string | null) => void;
  setKycStatus: (status: 'incomplete' | 'pending' | 'complete') => void;
  setMpin: (mpin: string) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setProfile: (profile: UserProfile | null) => void;
  submitKyc: (isPassport?: boolean) => void;
  resetForDemo: () => void;
  activateWallet: () => void;

  /* Wallet Tier */
  setWalletTier: (tier: WalletTier) => void;
  setPassportVerified: (verified: boolean) => void;
  scheduleDowngrade: (tier: WalletTier, effectiveDate: string) => void;
  cancelDowngrade: () => void;
  completeScheduledDowngrade: () => void;
  refreshBalance: (userId?: string) => Promise<void>;
  refreshTransactions: (userId?: string) => Promise<void>;
  fetchProfileData: (userId?: string) => Promise<void>;
  addMoney: (amount: number) => Promise<{ success: boolean; error?: any }>;
}

/* -------------------- Constants -------------------- */

const USER_STORAGE_KEY = 'gridpe_user_state';

const defaultState: UserState = {
  phoneNumber: '',
  name: '',
  email: '',
  emailVerified: false,
  profileImage: null,
  kycStatus: 'incomplete',
  kycSubmittedAt: null,
  mpin: null,
  biometricEnabled: false,
  profile: null,
  isWalletActivated: false,

  walletTier: 'Starter',
  walletLimit: 5000,
  dailyLimit: null,
  maxWithdrawalLimit: null,
  upgradeTimestamp: null,
  isPassportVerified: false,
  scheduledDowngrade: null,
  lastDowngradeLoss: null,
  walletBalance: 0,
  heldBalance: 0,
  isFxEnabled: false,
  wallet_tiers: null,
  subscriptionPrice: 0,
  paymentStatus: null,
  isRenewalPending: false,
  rewardPoints: 0,
};

/* -------------------- Context -------------------- */

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<UserState>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
  });

  /* Persist to localStorage */
  useEffect(() => {
    try {
      // Persist the entire state to ensure tier and limit data are available immediately on reload
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save user state to localStorage:", error);
    }
  }, [state]);

  /* Removed mock KYC auto-transition as per requirements to use real database status */


  /* Refetch Profile Data from Supabase */
  const fetchProfileData = useCallback(async (overrideUserId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = overrideUserId || session?.user?.id || USER_ID;

      // Optimized Consolidated Join Query
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id, name, avatar_url, kyc_status, email, is_fx_enabled, 
          current_tier_id, scheduled_tier_id, tier_change_date,
          payment_status, subscription_status, reward_points,
          wallet_tiers!current_tier_id(*, subscription_price),
          scheduled_tier:wallet_tiers!scheduled_tier_id(name)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        let tierData = profileData.wallet_tiers as any;
        if (Array.isArray(tierData)) {
          tierData = tierData[0];
        }

        let schedData = profileData.scheduled_tier as any;
        if (Array.isArray(schedData)) schedData = schedData[0];
        let schedParsedName: string | null = null;
        if (schedData && schedData.name) {
          schedParsedName = schedData.name.charAt(0).toUpperCase() + schedData.name.slice(1);
        }

        setState(prev => ({
          ...prev,
          name: profileData.name || prev.name,
          profileImage: profileData.avatar_url || prev.profileImage,
          kycStatus: profileData.kyc_status === 'verified' ? 'complete' : (profileData.kyc_status === 'pending' ? 'pending' : 'incomplete'),
          email: profileData.email || prev.email,
          isFxEnabled: !!profileData.is_fx_enabled,

          // Tier Hardening: Normalize limits to whole numbers (Math.floor)
          walletTier: tierData?.name
            ? (tierData.name.charAt(0).toUpperCase() + tierData.name.slice(1)) as WalletTier
            : (prev.walletTier || 'Starter'),
          walletLimit: tierData?.max_wallet_balance ? Math.floor(tierData.max_wallet_balance) : prev.walletLimit,
          dailyLimit: tierData?.daily_withdraw_limit != null ? Math.floor(tierData.daily_withdraw_limit) : null,
          maxWithdrawalLimit: tierData?.daily_withdraw_limit != null ? Math.floor(tierData.daily_withdraw_limit) : null,
          wallet_tiers: tierData,
          subscriptionPrice: tierData?.subscription_price ? Number(tierData.subscription_price) : 0,

          scheduledDowngrade: profileData.scheduled_tier_id ? {
            tier: (schedParsedName as WalletTier) || prev.scheduledDowngrade?.tier || 'Starter',
            effectiveDate: profileData.tier_change_date
          } : null,
          paymentStatus: profileData.payment_status as 'pending' | 'completed' | null,
          isRenewalPending: profileData.payment_status === 'pending' ||
            profileData.subscription_status === 'pending' ||
            (!!profileData.tier_change_date && new Date() >= new Date(profileData.tier_change_date)),
          profile: {
            ...prev.profile,
            id: profileData.id,
            name: profileData.name,
            subscription_status: profileData.subscription_status,
            reward_points: profileData.reward_points
          } as any,
          rewardPoints: Number(profileData.reward_points || 0),
        }));
        console.log('Profile and tier data refreshed via JOIN from Supabase');
      } else {
        console.warn('No profile found for user:', userId, '- Attempting to create one...');

        // Auto-create a minimal profile if missing
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: session?.user?.user_metadata?.full_name || 'Guest User',
            email: session?.user?.email || null,
            kyc_status: 'incomplete',
            mpin_set: false
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to auto-create profile:', createError);
        } else if (newProfile) {
          console.log('Minimal profile created for user:', userId);
          // Re-fetch to get joined tier data (the default tier should be there)
          return fetchProfileData();
        }
      }

      // Always recalculate balance from transactions, regardless of profile existence
      await fetchAndCalculateBalance(userId);

    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      // Fallback but still calculate balance
      const { data: { session } } = await supabase.auth.getSession();
      await fetchAndCalculateBalance(overrideUserId || session?.user?.id || USER_ID);
    }
  }, []);

  /* Initial Load */
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  /* Monitor Auth Changes to update session-based data */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchProfileData();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileData]);

  /* Mock-to-Real KYC Verification Timer (120 seconds) */
  useEffect(() => {
    if (state.kycStatus !== 'pending' || !state.kycSubmittedAt) return;

    const checkVerification = async () => {
      const elapsed = Date.now() - state.kycSubmittedAt;
      const remaining = 120000 - elapsed;

      if (remaining <= 0) {
        console.log('Verification timer hit zero. Updating database...');
        try {
          // 1. Update database status to 'verified'
          const { error } = await supabase
            .from('profiles')
            .update({ kyc_status: 'verified' })
            .eq('id', USER_ID);

          if (error) throw error;

          // 2. Refetch profile to update UI instantly
          await fetchProfileData();
          console.log('KYC Status verified and UI updated.');
        } catch (error) {
          console.error('Failed to update kyc_status persistently:', error);
        }
      } else {
        // Schedule the next check
        const timer = setTimeout(checkVerification, remaining);
        return () => clearTimeout(timer);
      }
    };

    checkVerification();
  }, [state.kycStatus, state.kycSubmittedAt, fetchProfileData]);

  /* Real-time Wallet Balance Reading */
  const fetchAndCalculateBalance = async (overrideUserId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = overrideUserId || user?.id || USER_ID;

      console.log('Reading balance for userId:', userId);

      // Read directly from the wallets table to avoid calculation drift
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('available_balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletError) {
        console.error('Error reading wallet balance:', walletError);
      }

      const balance = Number(walletData?.available_balance || 0);
      const flooredBalance = Math.floor(balance);

      // We can still calculate held balance from transactions if needed
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'held');

      const held = Math.floor(calculateHeldBalance(txData as LibWalletTransaction[] || []));

      console.log('Balance read from wallets (floored):', flooredBalance, 'Held:', held, 'for userId:', userId);
      setState(prev => ({ ...prev, walletBalance: flooredBalance, heldBalance: held }));
    } catch (err) {
      console.error('Error in fetchAndCalculateBalance:', err);
    }
  };

  const refreshTransactions = useCallback(async (overrideUserId?: string) => {
    let id = overrideUserId;
    if (!id) {
      const { data: { session } } = await supabase.auth.getSession();
      id = session?.user?.id;
    }
    const currentId = id || USER_ID;
    if (currentId) {
      window.dispatchEvent(new CustomEvent('refresh_wallet_transactions', { detail: { userId: currentId } }));
    }
  }, []);

  // 1. Initial Load & Visibility Changes (No userId filter needed for visibility)
  useEffect(() => {
    fetchAndCalculateBalance();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App focused, refreshing balance...');
        fetchAndCalculateBalance();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 2. Dynamic Realtime Sync (Dependent on userId)
  useEffect(() => {
    let channel: any;

    const setupSync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || USER_ID;

      if (!currentUserId) return;

      console.log('Setting up Realtime sync for userId:', currentUserId);

      channel = supabase.channel(`user-context-wallet-sync-${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${currentUserId}`
          },
          (payload) => {
            console.log('Wallet table updated, refreshing balance:', payload);
            fetchAndCalculateBalance(currentUserId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_transactions',
            filter: `user_id=eq.${currentUserId}`
          },
          () => {
            console.log('Wallet transactions updated, recalculating balance...');
            fetchAndCalculateBalance(currentUserId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payouts',
            filter: `user_id=eq.${currentUserId}`
          },
          () => {
            console.log('Payouts updated, recalculating balance...');
            fetchAndCalculateBalance(currentUserId);
          }
        )
        .subscribe();
    };

    setupSync();

    return () => {
      if (channel) {
        console.log('Cleaning up Realtime sync...');
        supabase.removeChannel(channel);
      }
    };
  }, [state.profile?.id]); // Re-subscribe when profile ID changes

  const refreshBalance = async (userId?: string) => {
    await fetchAndCalculateBalance(userId);
  };

  /* -------------------- Setters -------------------- */

  const setPhoneNumber = (phone: string) => {
    setState(prev => ({ ...prev, phoneNumber: phone }));
  };

  const setName = (name: string) => {
    setState(prev => ({ ...prev, name }));
  };

  const setEmail = (email: string) => {
    setState(prev => ({ ...prev, email }));
  };

  const setEmailVerified = (verified: boolean) => {
    setState(prev => ({ ...prev, emailVerified: verified }));
  };

  const setProfileImage = (image: string | null) => {
    setState(prev => ({ ...prev, profileImage: image }));
  };

  const setKycStatus = (status: 'incomplete' | 'pending' | 'complete') => {
    setState(prev => ({ ...prev, kycStatus: status }));
  };

  const setMpin = (mpin: string) => {
    setState(prev => ({ ...prev, mpin }));
  };

  const setBiometricEnabled = (enabled: boolean) => {
    setState(prev => ({ ...prev, biometricEnabled: enabled }));
  };

  const setProfile = (profile: UserProfile | null) => {
    setState(prev => ({ ...prev, profile }));
  };

  const submitKyc = (isPassport?: boolean) => {
    setState(prev => ({
      ...prev,
      kycStatus: 'pending',
      kycSubmittedAt: Date.now(),
      isPassportVerified: isPassport ? true : prev.isPassportVerified,
    }));
  };

  const resetForDemo = () => {
    setState(defaultState);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const activateWallet = () => {
    setState(prev => ({ ...prev, isWalletActivated: true }));
  };

  const setWalletTier = async (tier: WalletTier) => {
    try {
      // 1. Fetch the UUID for the tier
      const { data: tierData, error: tierError } = await supabase
        .from('wallet_tiers')
        .select('id')
        .ilike('name', tier)
        .single();

      if (tierError) throw tierError;

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || USER_ID;

      // 2. Update BOTH profiles and wallets tables for consistency
      const [profileUpdate, walletUpdate] = await Promise.all([
        supabase
          .from('profiles')
          .update({
            current_tier_id: tierData.id,
            scheduled_tier_id: null,
            tier_change_date: null
          })
          .eq('id', userId),
        supabase
          .from('wallets')
          .update({ tier_id: tierData.id })
          .eq('user_id', userId)
      ]);

      if (profileUpdate.error) throw profileUpdate.error;
      if (walletUpdate.error) throw walletUpdate.error;

      await fetchProfileData();
    } catch (err) {
      console.error('Failed to set wallet tier:', err);
    }
  };

  const setPassportVerified = (verified: boolean) => {
    setState(prev => ({ ...prev, isPassportVerified: verified }));
  };

  const scheduleDowngrade = async (tier: WalletTier, effectiveDate: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || USER_ID;

      console.log('[scheduleDowngrade] Calling RPC with:', {
        p_user_id: userId,
        p_tier_name: tier,
        p_tier_change_date: effectiveDate
      });

      const { data: rpcResult, error: rpcError } = await supabase.rpc('schedule_downgrade', {
        p_user_id: userId,
        p_tier_name: tier,
        p_tier_change_date: effectiveDate
      });

      if (rpcError) {
        console.error('[scheduleDowngrade] RPC ERROR:', rpcError);
        throw rpcError;
      }

      console.log('[scheduleDowngrade] RPC SUCCESS:', rpcResult);

      // Set optimistic local state immediately
      setState(prev => ({ ...prev, scheduledDowngrade: { tier, effectiveDate } }));

      // Re-fetch from DB to confirm the write actually persisted
      await fetchProfileData();
      console.log('[scheduleDowngrade] Profile data re-fetched from DB after RPC');
    } catch (error) {
      console.error('[scheduleDowngrade] Failed to schedule downgrade via RPC:', error);
    }
  };

  const cancelDowngrade = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          scheduled_tier_id: null,
          tier_change_date: null
        })
        .eq('id', USER_ID);

      if (error) throw error;
      setState(prev => ({ ...prev, scheduledDowngrade: null }));
    } catch (error) {
      console.error('Failed to cancel downgrade in Supabase:', error);
    }
  };

  const completeScheduledDowngrade = async () => {
    if (state.scheduledDowngrade) {
      const newTier = state.scheduledDowngrade.tier;

      try {
        // 1. Fetch the ID and limits for the new tier from wallet_tiers
        const { data: tierData, error: tierError } = await supabase
          .from('wallet_tiers')
          .select('id, max_wallet_balance')
          .ilike('name', newTier)
          .single();

        if (tierError) throw tierError;

        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || USER_ID;

        const newLimit = tierData.max_wallet_balance || 0;
        const currentBalance = state.walletBalance;

        console.log('[completeScheduledDowngrade] Calling apply_tier_forfeiture RPC:', {
          p_user_id: userId,
          p_new_tier_id: tierData.id,
          p_new_limit: newLimit,
          p_current_balance: currentBalance
        });

        // 2. Single atomic RPC: handles insert, balance cap, tier flip, and cleanup
        const { data: rpcResult, error: rpcError } = await supabase.rpc('apply_tier_forfeiture', {
          p_user_id: userId,
          p_new_tier_id: tierData.id,
          p_new_limit: newLimit,
          p_current_balance: currentBalance
        });

        if (rpcError) {
          console.error('[completeScheduledDowngrade] RPC ERROR:', rpcError);
          throw rpcError;
        }

        console.log('[completeScheduledDowngrade] RPC SUCCESS:', rpcResult);

        // 3. Refresh everything so the UI updates immediately
        await refreshBalance(userId);
        await fetchProfileData();

        console.log('[completeScheduledDowngrade] UI refreshed after forfeiture');
      } catch (err) {
        console.error('Failed to complete downgrade:', err);
      }
    }
  };

  const addMoney = async (amount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || USER_ID;

      // Atomic RPC: updates wallets.available_balance + inserts transaction in one DB transaction
      const { error: rpcError } = await supabase.rpc('wallet_deposit', {
        p_user_id: userId,
        p_amount: amount,
        p_description: 'Wallet Top-up',
        p_reference_id: 'razorpay'
      });

      if (rpcError) throw rpcError;

      await fetchAndCalculateBalance();

      return { success: true };
    } catch (error) {
      console.error('Failed to add money:', error);
      return { success: false, error };
    }
  };

  /* -------------------- Provider -------------------- */

  const contextValue: UserContextType = {
    ...state,
    setPhoneNumber,
    setName,
    setEmail,
    setEmailVerified,
    setProfileImage,
    setKycStatus,
    setMpin,
    setBiometricEnabled,
    setProfile,
    submitKyc,
    resetForDemo,
    activateWallet,
    setWalletTier,
    setPassportVerified,
    scheduleDowngrade,
    cancelDowngrade,
    completeScheduledDowngrade,
    refreshBalance,
    refreshTransactions,
    fetchProfileData,
    addMoney,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

/* -------------------- Hook -------------------- */

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
