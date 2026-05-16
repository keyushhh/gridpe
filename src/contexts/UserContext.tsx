import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel, PostgrestError } from '@supabase/supabase-js';
import { calculateBalance, calculateHeldBalance } from '@/lib/wallet';
import { WalletTier, WalletTransaction, Profile as UserProfile, Tables } from '@/types';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';
import { useCustomToaster } from '@/contexts/CustomToasterContext';

export type { WalletTier };

interface UserState {
  phoneNumber: string;
  name: string;
  email: string;
  emailVerified: boolean;
  profileImage: string | null;
  kycStatus: 'incomplete' | 'pending' | 'in_review' | 'verified';
  kycSubmittedAt: number | null;
  biometricEnabled: boolean;
  profile: UserProfile | null;
  isWalletActivated: boolean;
  isInitializing: boolean;
  isSecureStorageReady: boolean;

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
  wallet_tiers: Tables['wallet_tiers'] | null;
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
  setKycStatus: (status: 'incomplete' | 'pending' | 'in_review' | 'verified') => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setProfile: (profile: UserProfile | null) => void;
  submitKyc: (isPassport?: boolean) => void;
  resetForDemo: () => void;
  activateWallet: () => void;
  deactivateWallet: () => void;

  /* Wallet Tier */
  setWalletTier: (tier: WalletTier) => void;
  setPassportVerified: (verified: boolean) => void;
  setPassportVerifiedInDb: (verified: boolean) => Promise<void>;
  scheduleDowngrade: (tier: WalletTier, effectiveDate: string) => void;
  cancelDowngrade: () => void;
  completeScheduledDowngrade: () => void;
  refreshBalance: (userId?: string) => Promise<void>;
  refreshTransactions: (userId?: string) => Promise<void>;
  fetchProfileData: (userId?: string) => Promise<void>;
  addMoney: (
    amount: number
  ) => Promise<{ success: boolean; error?: Error | PostgrestError | string }>;
  isInitializing: boolean;
  isSecureStorageReady: boolean;
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
  isInitializing: true,
  isSecureStorageReady: false,
};

/* -------------------- Context -------------------- */

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<UserState>(defaultState);
  const { showToaster } = useCustomToaster();

  // Load state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        // 1. Load non-sensitive state from localStorage (Synchronous-ish)
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        const parsedLocalStorage = stored ? JSON.parse(stored) : {};

        // Immediately unblock the UI with optimistic non-sensitive data
        setState(prev => ({
          ...prev,
          ...parsedLocalStorage,
          isInitializing: false,
        }));

        // 2. Load sensitive state from SecureStorage (Async)
        if (Capacitor.isNativePlatform()) {
          try {
            // Promise.all to parallelize future multiple keys if needed
            const [secureStored] = await Promise.all([
              SecureStorage.get('gridpe_secure_user_state'),
            ]);

            if (secureStored) {
              const secureData = JSON.parse(secureStored as string);
              setState(prev => ({
                ...prev,
                ...secureData,
                isSecureStorageReady: true,
              }));
            } else {
              setState(prev => ({ ...prev, isSecureStorageReady: true }));
            }
          } catch (e) {
            console.error('Failed to read from SecureStorage:', e);
            setState(prev => ({ ...prev, isSecureStorageReady: true }));
          }
        } else {
          // On web, SecureStorage isn't used, but we still trigger migration check
          // and set ready flag for consistency
          setState(prev => ({ ...prev, isSecureStorageReady: true }));
        }

        // 3. Migration: If we find profile in localStorage, move it and purge
        // We do this in the background
        if (parsedLocalStorage.profile || parsedLocalStorage.email) {
          console.warn('Security Migration: Moving PII to SecureStorage...');
          const pii = {
            profile: parsedLocalStorage.profile,
            phoneNumber: parsedLocalStorage.phoneNumber,
            name: parsedLocalStorage.name,
            email: parsedLocalStorage.email,
          };

          if (Capacitor.isNativePlatform()) {
            await SecureStorage.set('gridpe_secure_user_state', JSON.stringify(pii));
            // Immediately purge the legacy unencrypted copy after successful migration
            localStorage.removeItem(USER_STORAGE_KEY);
          }
          
          setState(prev => ({ ...prev, ...pii }));
        }
      } catch (error) {
        console.error('Failed to initialize user state:', error);
        setState(prev => ({ ...prev, isInitializing: false, isSecureStorageReady: true }));
      }
    };

    loadSavedState();
  }, []);

  /* Persist to localStorage and SecureStorage */
  useEffect(() => {
    if (state.isInitializing) return;

    try {
      // Split state into sensitive and non-sensitive
      const { profile, phoneNumber, name, email, ...nonSensitive } = state;
      
      // Persist non-sensitive to localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nonSensitive));

      // Persist sensitive to SecureStorage
      if (Capacitor.isNativePlatform()) {
        SecureStorage.set('gridpe_secure_user_state', JSON.stringify({
          profile,
          phoneNumber,
          name,
          email
        })).catch(err => console.error('SecureStorage persist failed:', err));
      }
    } catch (error) {
      console.error('Failed to save user state:', error);
      showToaster("Couldn't save your settings. Please try again.", 'error');
    }
  }, [state]);

  /* Removed mock KYC auto-transition as per requirements to use real database status */

  /* Real-time Wallet Balance Reading */
  const fetchAndCalculateBalance = useCallback(
    async (overrideUserId?: string) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session && !overrideUserId) return;

        const userId = overrideUserId || session?.user?.id;

        // Read directly from the wallets table to avoid calculation drift
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('available_balance')
          .eq('user_id', userId)
          .maybeSingle();

        if (walletError) {
          console.error('Error reading wallet balance:', walletError);
        }

        if (!walletData) {
          setState(prev => ({
            ...prev,
            walletBalance: 0,
            heldBalance: 0,
            isWalletActivated: false,
            isInitializing: false,
          }));
          return;
        }

        const balance = Number(walletData?.available_balance || 0);
        const flooredBalance = Math.floor(balance);

        // We can still calculate held balance from transactions if needed
        const { data: txData } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'held');

        const held = Math.floor(calculateHeldBalance((txData as WalletTransaction[]) || []));

        // Auto-activate if user has balance or held funds
        const shouldBeActivated = flooredBalance > 0 || held > 0;

        setState(prev => ({
          ...prev,
          walletBalance: flooredBalance,
          heldBalance: held,
          isWalletActivated: prev.isWalletActivated || shouldBeActivated,
          isInitializing: false,
        }));

        // If still not activated, check for ANY transaction history
        if (!state.isWalletActivated && !shouldBeActivated) {
          const { count, error: txError } = await supabase
            .from('wallet_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

          if (count && count > 0) {
            setState(prev => ({ ...prev, isWalletActivated: true }));
          }
          if (txError) {
            console.error('Error in fetchAndCalculateBalance (txHistory):', txError);
          }
        }
      } catch (err) {
        console.error('Error in fetchAndCalculateBalance:', err);
        setState(prev => ({ ...prev, isInitializing: false }));
      }
    },
    [supabase]
  );

  /* Refetch Profile Data from Supabase */
  const fetchProfileData = useCallback(
    async (overrideUserId?: string) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session && !overrideUserId) return;

        const userId = overrideUserId || session?.user?.id;

        // Optimized Consolidated Join Query
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(
            `
          id, name, avatar_url, kyc_status, email, phone, is_fx_enabled, is_passport_verified, 
          current_tier_id, scheduled_tier_id, tier_change_date,
          payment_status, subscription_status, reward_points, mpin_hash, biometric_on,
          wallet_tiers!current_tier_id(*, subscription_price),
          scheduled_tier:wallet_tiers!scheduled_tier_id(name)
        `
          )
          .eq('id', userId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData) {
          let tierData = profileData.wallet_tiers as unknown as
            | Tables['wallet_tiers']
            | Tables['wallet_tiers'][]
            | null;
          if (Array.isArray(tierData)) {
            tierData = tierData[0];
          }

          let schedData = profileData.scheduled_tier as unknown as
            | { name: string }
            | { name: string }[]
            | null;
          if (Array.isArray(schedData)) schedData = schedData[0];
          let schedParsedName: string | null = null;
          if (schedData && schedData.name) {
            schedParsedName = schedData.name.charAt(0).toUpperCase() + schedData.name.slice(1);
          }

          setState(prev => ({
            ...prev,
            name: profileData.name || prev.name,
            profileImage: profileData.avatar_url || prev.profileImage,
            kycStatus: profileData.kyc_status as
              | 'incomplete'
              | 'pending'
              | 'in_review'
              | 'verified',
            email: profileData.email || prev.email,
            phoneNumber: profileData.phone || prev.phoneNumber,
            isFxEnabled: !!profileData.is_fx_enabled,
            biometricEnabled: !!profileData.biometric_on,

            // Tier Hardening: Normalize limits to whole numbers (Math.floor)
            walletTier: tierData?.name
              ? ((tierData.name.charAt(0).toUpperCase() + tierData.name.slice(1)) as WalletTier)
              : prev.walletTier || 'Starter',
            walletLimit: tierData?.max_wallet_balance
              ? Math.floor(tierData.max_wallet_balance)
              : prev.walletLimit,
            dailyLimit:
              tierData?.daily_withdraw_limit != null
                ? Math.floor(tierData.daily_withdraw_limit)
                : null,
            maxWithdrawalLimit:
              tierData?.daily_withdraw_limit != null
                ? Math.floor(tierData.daily_withdraw_limit)
                : null,
            wallet_tiers: tierData,
            subscriptionPrice: tierData?.subscription_price
              ? Number(tierData.subscription_price)
              : 0,

            scheduledDowngrade: profileData.scheduled_tier_id
              ? {
                  tier:
                    (schedParsedName as WalletTier) || prev.scheduledDowngrade?.tier || 'Starter',
                  effectiveDate: profileData.tier_change_date,
                }
              : null,
            paymentStatus: profileData.payment_status as 'pending' | 'completed' | null,
            isRenewalPending:
              profileData.payment_status === 'pending' ||
              profileData.subscription_status === 'pending' ||
              (!!profileData.tier_change_date &&
                new Date() >= new Date(profileData.tier_change_date)),
            profile: {
              ...prev.profile,
              id: profileData.id,
              name: profileData.name,
              subscription_status: profileData.subscription_status,
              kyc_status: profileData.kyc_status,
              mpin_hash: profileData.mpin_hash,
              biometric_on: !!profileData.biometric_on,
            } as UserProfile,
            rewardPoints: Number(profileData.reward_points || 0),
            isPassportVerified: !!profileData.is_passport_verified,
            isWalletActivated:
              prev.isWalletActivated ||
              (tierData?.name && tierData.name.toLowerCase() !== 'starter') ||
              profileData.subscription_status === 'completed' ||
              !!profileData.is_passport_verified,
          }));
        } else {
          console.warn('No profile found for user:', userId, '- Attempting to create one...');

          // Auto-create a minimal profile if missing
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              name:
                session?.user?.user_metadata?.name ||
                session?.user?.user_metadata?.full_name ||
                'Guest User',
              email: session?.user?.email || null,
              phone: session?.user?.phone || session?.user?.user_metadata?.phone_number || null,
              kyc_status: 'incomplete',
              mpin_set: false,
            })
            .select()
            .single();

          if (createError) {
            console.error('Failed to auto-create profile:', createError);
          } else if (newProfile) {
            // Re-fetch to get joined tier data (the default tier should be there)
            return fetchProfileData();
          }
        }

        // Always recalculate balance from transactions, regardless of profile existence
        await fetchAndCalculateBalance(userId);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        // Fallback but still calculate balance
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id || overrideUserId) {
          await fetchAndCalculateBalance(overrideUserId || session?.user?.id);
        }
      }
    },
    [supabase, fetchAndCalculateBalance]
  );

  /* Initial Load */
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  /* Monitor Auth Changes to update session-based data */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchProfileData();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileData]);

  /* Real-time KYC Status Subscription */
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupKycSubscription = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) return;

      channel = supabase
        .channel(`kyc-status-sync-${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${currentUserId}`,
          },
          payload => {
            fetchProfileData(currentUserId);
          }
        )
        .subscribe();
    };

    setupKycSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [state.profile?.id]);

  const refreshTransactions = useCallback(async (overrideUserId?: string) => {
    let id = overrideUserId;
    if (!id) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      id = session?.user?.id;
    }
    const currentId = id;
    if (currentId) {
      window.dispatchEvent(
        new CustomEvent('refresh_wallet_transactions', { detail: { userId: currentId } })
      );
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
    let channel: RealtimeChannel | null = null;

    const setupSync = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) return;

      channel = supabase
        .channel(`user-context-wallet-sync-${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${currentUserId}`,
          },
          payload => {
            fetchAndCalculateBalance(currentUserId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_transactions',
            filter: `user_id=eq.${currentUserId}`,
          },
          () => {
            fetchAndCalculateBalance(currentUserId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payouts',
            filter: `user_id=eq.${currentUserId}`,
          },
          () => {
            fetchAndCalculateBalance(currentUserId);
          }
        )
        .subscribe();
    };

    setupSync();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [state.profile?.id]); // Re-subscribe when profile ID changes

  const refreshBalance = useCallback(
    async (userId?: string) => {
      await fetchAndCalculateBalance(userId);
    },
    [fetchAndCalculateBalance]
  );

  /* -------------------- Setters -------------------- */

  const setPhoneNumber = useCallback((phone: string) => {
    setState(prev => ({ ...prev, phoneNumber: phone }));
  }, []);

  const setName = useCallback((name: string) => {
    setState(prev => ({ ...prev, name }));
  }, []);

  const setEmail = useCallback((email: string) => {
    setState(prev => ({ ...prev, email }));
  }, []);

  const setEmailVerified = useCallback((verified: boolean) => {
    setState(prev => ({ ...prev, emailVerified: verified }));
  }, []);

  const setProfileImage = useCallback((image: string | null) => {
    setState(prev => ({ ...prev, profileImage: image }));
  }, []);

  const setKycStatus = useCallback(
    (status: 'incomplete' | 'pending' | 'in_review' | 'verified') => {
      setState(prev => ({ ...prev, kycStatus: status }));
    },
    []
  );

  const setBiometricEnabled = useCallback(
    async (enabled: boolean) => {
      setState(prev => ({ ...prev, biometricEnabled: enabled }));
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ biometric_on: enabled }).eq('id', user.id);
        }
      } catch (error) {
        console.error('Failed to sync biometric preference:', error);
        showToaster("Couldn't update your biometric settings. Please try again.", 'error');
      }
    },
    [supabase]
  );

  const setProfile = useCallback((profile: UserProfile | null) => {
    setState(prev => ({ ...prev, profile }));
  }, []);

  const submitKyc = useCallback((isPassport?: boolean) => {
    setState(prev => ({
      ...prev,
      kycStatus: 'pending',
      kycSubmittedAt: Date.now(),
      isPassportVerified: isPassport ? true : prev.isPassportVerified,
    }));
  }, []);

  const resetForDemo = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const activateWallet = useCallback(async () => {
    if (!state.profile?.id) throw new Error('No user ID found');

    const userId = state.profile.id;

    console.log('[WalletActivation] Initializing wallet for user:', userId);

    // Create wallet row if it doesn't exist
    const { error: walletError } = await supabase.from('wallets').upsert(
      {
        user_id: userId,
        available_balance: 0,
        held_balance: 0,
        tier_id: 'fbef1e55-688d-4916-91b5-2a44a2ff3380',
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );

    if (walletError) {
      console.error('[WalletActivation] Wallet record creation failed:', walletError);
      throw walletError;
    }

    // Mark onboarded
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_onboarded: true })
      .eq('id', userId);

    if (profileError) {
      console.error('[WalletActivation] Profile update failed:', profileError);
      throw profileError;
    }

    setState(prev => ({ ...prev, isWalletActivated: true }));

    // Refresh balance to ensure UI is in sync
    await fetchAndCalculateBalance(userId);
  }, [state.profile?.id, fetchAndCalculateBalance]);

  const deactivateWallet = useCallback(() => {
    setState(prev => ({ ...prev, isWalletActivated: false }));
  }, []);

  const setWalletTier = useCallback(
    async (tier: WalletTier) => {
      try {
        // 1. Fetch the UUID for the tier
        const { data: tierData, error: tierError } = await supabase
          .from('wallet_tiers')
          .select('id')
          .ilike('name', tier)
          .maybeSingle();

        if (tierError) throw tierError;
        if (!tierData) throw new Error(`Tier ${tier} not found`);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        // 2. Update BOTH profiles and wallets tables for consistency
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

        await fetchProfileData();
      } catch (err) {
        console.error('Failed to set wallet tier:', err);
        showToaster("Couldn't update your plan. Please try again.", 'error');
      }
    },
    [supabase, fetchProfileData]
  );

  const setPassportVerified = useCallback((verified: boolean) => {
    setState(prev => ({ ...prev, isPassportVerified: verified }));
  }, []);

  const setPassportVerifiedInDb = useCallback(
    async (verified: boolean) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        const { error } = await supabase
          .from('profiles')
          .update({
            is_passport_verified: verified,
            kyc_status: verified ? 'verified' : state.kycStatus,
          })
          .eq('id', userId);

        if (error) throw error;

        setState(prev => ({
          ...prev,
          isPassportVerified: verified,
          kycStatus: verified ? 'verified' : prev.kycStatus,
        }));

        // Immediate localStorage sync — closes the timing window where the app
        // could be killed before the batched useEffect persistence runs.
        const stored = localStorage.getItem('gridpe_user_state');
        const parsed = stored ? JSON.parse(stored) : {};
        localStorage.setItem(
          'gridpe_user_state',
          JSON.stringify({ ...parsed, isPassportVerified: verified })
        );
      } catch (err) {
        console.error('Failed to update passport verification in DB:', err);
        showToaster("Couldn't update your verification status. Please try again.", 'error');
      }
    },
    [supabase, state.kycStatus]
  );

  const scheduleDowngrade = useCallback(
    async (tier: WalletTier, effectiveDate: string) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        const { data: rpcResult, error: rpcError } = await supabase.rpc('schedule_downgrade', {
          p_user_id: userId,
          p_tier_name: tier,
          p_tier_change_date: effectiveDate,
        });

        if (rpcError) {
          console.error('[scheduleDowngrade] RPC ERROR:', rpcError);
          throw rpcError;
        }

        // Set optimistic local state immediately
        setState(prev => ({ ...prev, scheduledDowngrade: { tier, effectiveDate } }));

        // Re-fetch from DB to confirm the write actually persisted
        await fetchProfileData();
      } catch (error) {
        console.error('[scheduleDowngrade] Failed to schedule downgrade via RPC:', error);
        showToaster("Couldn't schedule your plan change. Please try again.", 'error');
      }
    },
    [supabase, fetchProfileData]
  );

  const cancelDowngrade = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          tier_change_date: null,
        })
        .eq('id', state.profile?.id);

      if (error) throw error;
      setState(prev => ({ ...prev, scheduledDowngrade: null }));
    } catch (error) {
      console.error('Failed to cancel downgrade in Supabase:', error);
      showToaster("Couldn't cancel your plan change. Please try again.", 'error');
    }
  }, [supabase]);

  const completeScheduledDowngrade = useCallback(async () => {
    if (state.scheduledDowngrade) {
      const newTier = state.scheduledDowngrade.tier;

      try {
        // 1. Fetch the ID and limits for the new tier from wallet_tiers
        const { data: tierData, error: tierError } = await supabase
          .from('wallet_tiers')
          .select('id, max_wallet_balance')
          .ilike('name', newTier)
          .maybeSingle();

        if (tierError) throw tierError;
        if (!tierData) throw new Error(`Tier ${newTier} not found`);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) throw new Error('Unauthorized');

        const newLimit = tierData.max_wallet_balance || 0;
        const currentBalance = state.walletBalance;

        console.log('[completeScheduledDowngrade] Calling apply_tier_forfeiture RPC:', {
          p_user_id: userId,
          p_new_tier_id: tierData.id,
          p_new_limit: newLimit,
          p_current_balance: currentBalance,
        });

        // 2. Single atomic RPC: handles insert, balance cap, tier flip, and cleanup
        const { data: rpcResult, error: rpcError } = await supabase.rpc('apply_tier_forfeiture', {
          p_user_id: userId,
          p_new_tier_id: tierData.id,
          p_new_limit: newLimit,
          p_current_balance: currentBalance,
        });

        if (rpcError) {
          console.error('[completeScheduledDowngrade] RPC ERROR:', rpcError);
          throw rpcError;
        }

        // 3. Refresh everything so the UI updates immediately
        await refreshBalance(userId);
        await fetchProfileData();
      } catch (err) {
        console.error('Failed to complete downgrade:', err);
        showToaster("Something went wrong while updating your plan. Please contact support.", 'error');
      }
    }
  }, [supabase, state.scheduledDowngrade, state.walletBalance, refreshBalance, fetchProfileData]);

  const addMoney = useCallback(
    async (amount: number) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        // Atomic RPC: updates wallets.available_balance + inserts transaction in one DB transaction
        const { error: rpcError } = await supabase.rpc('wallet_deposit', {
          p_user_id: userId,
          p_amount: amount,
          p_description: 'Wallet Top-up',
          p_reference_id: 'razorpay',
        });

        if (rpcError) throw rpcError;

        await fetchAndCalculateBalance();

        return { success: true };
      } catch (error) {
        console.error('Failed to add money:', error);
        return { success: false, error };
      }
    },
    [supabase, fetchAndCalculateBalance]
  );

  /* -------------------- Provider -------------------- */

  const contextValue: UserContextType = {
    ...state,
    setPhoneNumber,
    setName,
    setEmail,
    setEmailVerified,
    setProfileImage,
    setKycStatus,
    setBiometricEnabled,
    setProfile,
    submitKyc,
    resetForDemo,
    activateWallet,
    deactivateWallet,
    setWalletTier,
    setPassportVerified,
    scheduleDowngrade,
    cancelDowngrade,
    completeScheduledDowngrade,
    refreshBalance,
    refreshTransactions,
    fetchProfileData,
    setPassportVerifiedInDb,
    addMoney,
  };

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

/* -------------------- Hook -------------------- */

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
