import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit' | 'hold';
  amount: number;
  status: 'success' | 'failed' | 'pending';
  date: string;
  description: string;
  metadata?: Record<string, unknown>;
}

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
  walletBalance: number;
  walletTransactions: WalletTransaction[];
  isWalletActivated: boolean;

  /* Wallet Tier */
  walletTier: WalletTier;
  walletLimit: number;
  upgradeTimestamp: number | null;
  isPassportVerified: boolean;
  isWalletLimitReached: boolean;
  scheduledDowngrade: { tier: WalletTier; effectiveDate: string } | null;
  lastDowngradeLoss: number | null;
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
  addWalletBalance: (amount: number) => void;
  addTransaction: (transaction: WalletTransaction) => void;
  activateWallet: () => void;

  /* Wallet Tier */
  setWalletTier: (tier: WalletTier) => void;
  setPassportVerified: (verified: boolean) => void;
  scheduleDowngrade: (tier: WalletTier, effectiveDate: string) => void;
  cancelDowngrade: () => void;
  completeScheduledDowngrade: () => void;
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
  walletBalance: 0,
  walletTransactions: [],
  isWalletActivated: false,

  walletTier: 'Starter',
  walletLimit: 5000,
  upgradeTimestamp: null,
  isPassportVerified: false,
  isWalletLimitReached: false,
  scheduledDowngrade: null,
  lastDowngradeLoss: null,
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

  /* Auto-transition KYC */
  useEffect(() => {
    if (state.kycStatus === 'pending' && state.kycSubmittedAt) {
      const elapsed = Date.now() - state.kycSubmittedAt;
      const twoMinutes = 2 * 60 * 1000;

      if (elapsed >= twoMinutes) {
        setState(prev => ({ ...prev, kycStatus: 'complete' }));
      } else {
        const remaining = twoMinutes - elapsed;
        const timer = setTimeout(() => {
          setState(prev => ({ ...prev, kycStatus: 'complete' }));
        }, remaining);
        return () => clearTimeout(timer);
      }
    }
  }, [state.kycStatus, state.kycSubmittedAt]);

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

  const addWalletBalance = (amount: number) => {
    setState(prev => ({ ...prev, walletBalance: prev.walletBalance + amount }));
  };

  const addTransaction = (transaction: WalletTransaction) => {
    setState(prev => ({
      ...prev,
      walletTransactions: [transaction, ...prev.walletTransactions],
    }));
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

      let loss = 0;
      let newBalance = state.walletBalance;
      if (state.walletBalance > newLimit) {
        loss = state.walletBalance - newLimit;
        newBalance = newLimit;
      }

      setState(prev => ({
        ...prev,
        walletTier: newTier,
        walletLimit: newLimit,
        walletBalance: newBalance,
        lastDowngradeLoss: loss > 0 ? loss : null,
        scheduledDowngrade: null,
        upgradeTimestamp: Date.now()
      }));
    }
  };

  /* -------------------- Provider -------------------- */

  const contextValue: UserContextType & { isWalletLimitReached: boolean } = {
    ...state,
    isWalletLimitReached: state.walletBalance >= state.walletLimit,
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
    addWalletBalance,
    addTransaction,
    activateWallet,
    setWalletTier,
    setPassportVerified,
    scheduleDowngrade,
    cancelDowngrade,
    completeScheduledDowngrade,
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
