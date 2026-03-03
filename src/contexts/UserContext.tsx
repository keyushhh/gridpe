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
  upgradeTimestamp: number | null;
  isPassportVerified: boolean;
  scheduledDowngrade: { tier: WalletTier; effectiveDate: string } | null;
  lastDowngradeLoss: number | null;

  /* Wallet Balance */
  walletBalance: number;
  heldBalance: number;

  /* FX Stats */
  isFxEnabled: boolean;
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
  refreshBalance: () => Promise<void>;
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
  upgradeTimestamp: null,
  isPassportVerified: false,
  scheduledDowngrade: null,
  lastDowngradeLoss: null,
  walletBalance: 0,
  heldBalance: 0,
  isFxEnabled: false,
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
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save user state to localStorage:", error);
      // Fallback: If quota exceeded (likely due to image), save without profile image
      if (state.profileImage) {
        try {
          const stateWithoutImage = { ...state, profileImage: null };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(stateWithoutImage));
          console.warn("User state saved without profile image due to storage limits.");
        } catch (retryError) {
          console.error("Failed to save fallback user state:", retryError);
        }
      }
    }
  }, [state]);

  /* Removed mock KYC auto-transition as per requirements to use real database status */


  /* Refetch Profile Data from Supabase */
  const fetchProfileData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url, kyc_status, email, is_fx_enabled')
        .eq('id', USER_ID)
        .single();

      if (error) throw error;

      if (data) {
        setState(prev => ({
          ...prev,
          name: data.name || prev.name,
          profileImage: data.avatar_url || prev.profileImage,
          kycStatus: data.kyc_status === 'verified' ? 'complete' : (data.kyc_status === 'pending' ? 'pending' : 'incomplete'),
          email: data.email || prev.email,
          isFxEnabled: !!data.is_fx_enabled,
        }));
        console.log('Profile data refreshed from Supabase');
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  }, []);

  /* Initial Load */
  useEffect(() => {
    fetchProfileData();
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

  /* Real-time Wallet Balance Calculation */
  const fetchAndCalculateBalance = async () => {
    const [txResult, payoutResult] = await Promise.all([
      supabase.from('wallet_transactions').select('*').eq('user_id', USER_ID),
      supabase.from('payouts').select('*').eq('user_id', USER_ID)
    ]);

    if (!txResult.error && txResult.data) {
      const transactions = txResult.data as LibWalletTransaction[];
      const payouts = payoutResult.data as Payout[] || [];

      const balance = calculateBalance(transactions, payouts);
      const held = calculateHeldBalance(transactions);
      setState(prev => ({ ...prev, walletBalance: balance, heldBalance: held }));
    }
  };

  useEffect(() => {
    fetchAndCalculateBalance();

    // Refresh on focus/visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App focused, refreshing balance...');
        fetchAndCalculateBalance();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const channel = supabase.channel('user-context-wallet-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${USER_ID}`
        },
        () => {
          console.log('Wallet transactions updated, recalculating balance...');
          fetchAndCalculateBalance();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payouts',
          filter: `user_id=eq.${USER_ID}`
        },
        () => {
          console.log('Payouts updated, recalculating balance...');
          fetchAndCalculateBalance();
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshBalance = fetchAndCalculateBalance;

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

  const setWalletTier = (tier: WalletTier) => {
    let limit = 5000;
    switch (tier) {
      case 'Starter': limit = 5000; break;
      case 'Pro': limit = 15000; break;
      case 'Elite': limit = 50000; break;
      case 'Supreme': limit = 150000; break;
    }
    setState(prev => ({ ...prev, walletTier: tier, walletLimit: limit, upgradeTimestamp: Date.now() }));
  };

  const setPassportVerified = (verified: boolean) => {
    setState(prev => ({ ...prev, isPassportVerified: verified }));
  };

  const scheduleDowngrade = (tier: WalletTier, effectiveDate: string) => {
    setState(prev => ({ ...prev, scheduledDowngrade: { tier, effectiveDate } }));
  };

  const cancelDowngrade = () => {
    setState(prev => ({ ...prev, scheduledDowngrade: null }));
  };

  const completeScheduledDowngrade = () => {
    if (state.scheduledDowngrade) {
      const newTier = state.scheduledDowngrade.tier;
      let newLimit = 5000;
      switch (newTier) {
        case 'Starter': newLimit = 5000; break;
        case 'Pro': newLimit = 15000; break;
        case 'Elite': newLimit = 50000; break;
        case 'Supreme': newLimit = 150000; break;
      }

      setState(prev => ({
        ...prev,
        walletTier: newTier,
        walletLimit: newLimit,
        lastDowngradeLoss: null,
        scheduledDowngrade: null,
        upgradeTimestamp: Date.now()
      }));
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
