import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { crashlytics } from '@/lib/crashlytics';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel, PostgrestError } from '@supabase/supabase-js';
import { Profile as UserProfile, Tables } from '@/types';

import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { purgeOtherUsersStorage, readStorage, writeStorage, removeStorage } from '@/utils/storage';
import { SavedAddress } from '@/types';
import { useNetworkStatus } from '@/utils/useNetworkStatus';



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
  isResetting: boolean;

  /* FX Stats */
  isFxEnabled: boolean;

  rewardPoints: number;
  streakDays: number;
  referredBy: string | null;
  isPassportVerified: boolean;
  isInitializing: boolean;
  isSecureStorageReady: boolean;
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
  setPassportVerified: (verified: boolean) => void;
  setPassportVerifiedInDb: (verified: boolean) => Promise<void>;
  fetchProfileData: (userId?: string) => Promise<void>;
  isInitializing: boolean;
  isSecureStorageReady: boolean;
  isResetting: boolean;
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
  isPassportVerified: false,
  isFxEnabled: false,

  rewardPoints: 0,
  streakDays: 0,
  referredBy: null,
  isInitializing: true,
  isSecureStorageReady: false,
  isResetting: false,
};

/* -------------------- Context -------------------- */

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<UserState>(defaultState);
  const { showToaster } = useCustomToaster();
  const { isConnected } = useNetworkStatus();
  const wasOffline = useRef(!isConnected);

  // Ref to track activation status without triggering re-renders or stale closures in callbacks

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
            crashlytics.recordError(e instanceof Error ? e : new Error(String(e)), 'Failed to read from SecureStorage');
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
        crashlytics.recordError(error instanceof Error ? error : new Error(String(error)), 'Failed to initialize user state');
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
        })).catch(err => {
          if (import.meta.env.DEV) console.warn('[non-critical]', err);
        });
      }
    } catch (error) {
      console.error('Failed to save user state:', error);
      crashlytics.recordError(error instanceof Error ? error : new Error(String(error)), 'Failed to save user state');
      showToaster("Couldn't save your settings. Please try again.", 'error');
    }
  }, [state, showToaster]);

  /* Removed mock KYC auto-transition as per requirements to use real database status */

  /* Refetch Profile Data from Supabase */
  const fetchProfileData = useCallback(
    async (overrideUserId?: string) => {
      try {
        if (state.isResetting) return;
        const sessionPromise = supabase.auth.getSession();
        let timer: any;
        const timeoutPromise = new Promise((_, reject) => 
          timer = setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );
        let session: any;
        try {
          const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
          clearTimeout(timer);
          session = data?.session;
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn('[UserContext] Session check failed or timed out:', err);
          }
          session = null;
        }

        if (!session && !overrideUserId) {
          setState(prev => ({ ...prev, isInitializing: false }));
          return;
        }

        const userId = overrideUserId || session?.user?.id;

        // Optimized Consolidated Join Query
        let queryResult = await supabase
          .from('profiles')
          .select(
            `
          id, name, avatar_url, kyc_status, email, phone, is_fx_enabled, is_passport_verified, 
          plan_tier,
          payment_status, subscription_status, reward_points, mpin_hash, biometric_on,
          terms_accepted_at, terms_version, streak_days, referred_by
        `
          )
          .eq('id', userId)
          .abortSignal(AbortSignal.timeout(10000))
          .maybeSingle();

        // Defensive fallback: If database columns do not exist yet (code 42703), fallback to query without terms columns
        if (queryResult.error && (queryResult.error.code === '42703' || queryResult.error.message?.includes('terms_accepted_at'))) {
          console.warn('UserContext: terms columns do not exist in profiles table yet, falling back to defensive schema query.');
          queryResult = await supabase
            .from('profiles')
            .select(
              `
            id, name, avatar_url, kyc_status, email, phone, is_fx_enabled, is_passport_verified, 
            plan_tier,
            payment_status, subscription_status, reward_points, mpin_hash, biometric_on,
            streak_days, referred_by
          `
            )
            .eq('id', userId)
            .abortSignal(AbortSignal.timeout(10000))
            .maybeSingle();
        }

        const { data: profileData, error: profileError } = queryResult as any;
        if (profileError) throw profileError;

        if (profileData) {


          setState(prev => ({
            ...prev,
            profile: profileData as any,
            name: profileData.name || prev.name,
            profileImage: profileData.avatar_url || prev.profileImage,
            kycStatus: profileData.kyc_status as
              | 'incomplete'
              | 'pending'
              | 'in_review'
              | 'verified',
            email: profileData.email || prev.email,
            phoneNumber: profileData.phone || prev.phoneNumber,
            streakDays: profileData.streak_days ?? 0,
            referredBy: profileData.referred_by ?? null,
            isFxEnabled: !!profileData.is_fx_enabled,
            biometricEnabled: !!profileData.biometric_on,
            isPassportVerified: !!profileData.is_passport_verified,
          }));
        } else {
          if (import.meta.env.DEV) console.warn('No profile found for user - Attempting to create one...');

          // Auto-create a minimal profile if missing
          const { data: newProfile, error: createError } = await (supabase
            .from('profiles') as any)
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
            .select('id')
            .single();

          if (createError) {
            console.error('Failed to auto-create profile:', createError);
          } else if (newProfile) {
            // Re-fetch to get joined tier data (the default tier should be there)
            return fetchProfileData();
          }
        }

      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        crashlytics.recordError(error instanceof Error ? error : new Error(String(error)), 'Failed to fetch profile data');
      }
    },
    [supabase, state.isResetting]
  );

  /* Initial Load */
  useEffect(() => {
    const INIT_TIMEOUT_MS = 12000 // 12 seconds max

    let initTimer: any;
    const initWithTimeout = Promise.race([
      fetchProfileData(), // existing init logic
      new Promise<void>((resolve) => 
        initTimer = setTimeout(() => {
          if (import.meta.env.DEV) {
            console.warn('[UserContext] Init timed out — forcing ready state')
          }
          resolve()
        }, INIT_TIMEOUT_MS)
      )
    ])
    initWithTimeout.finally(() => clearTimeout(initTimer))

    initWithTimeout.finally(() => {
      // Always set isInitializing to false after this, regardless of outcome
      setState(prev => ({ ...prev, isInitializing: false }))
    })
  }, [fetchProfileData]);

  // Re-initialization when network returns
  useEffect(() => {
    if (isConnected && wasOffline.current) {
      if (!state.profile) {
        fetchProfileData();
      }
    }
    wasOffline.current = !isConnected;
  }, [isConnected, state.profile, fetchProfileData]);

  /* Monitor Auth Changes to update session-based data */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.id) {
        crashlytics.setUser(session.user.id);
      } else {
        crashlytics.clearUser();
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Purge any localStorage keys that belong to other users to avoid cross-account pollution
        try {
          purgeOtherUsersStorage(session?.user?.id);
        } catch (e) {
          console.warn('Failed to purge other user storage on sign-in:', e);
        }
        fetchProfileData();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileData, supabase]);

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
  }, [state.profile?.id, fetchProfileData, supabase]);



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
          await (supabase.from('profiles') as any).update({ biometric_on: enabled }).eq('id', user.id);
        }
      } catch (error) {
        console.error('Failed to sync biometric preference:', error);
        crashlytics.recordError(error instanceof Error ? error : new Error(String(error)), 'Failed to sync biometric preference');
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
    // Mark resetting to prevent in-flight requests from mutating shared state
    setState(prev => ({ ...prev, isResetting: true }));

    // Small delay to allow pending requests to observe isResetting and abort
    const resetTimer = setTimeout(() => {
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[UserContext] cleanup error:', err);
      }
      setState(defaultState);
    }, 50);
    if (false) clearTimeout(resetTimer);
  }, []);

  const setPassportVerified = useCallback((verified: boolean) => {
    setState(prev => ({ ...prev, isPassportVerified: verified }));
  }, []);

  const setPassportVerifiedInDb = useCallback(
    async (verified: boolean) => {
      setState(prev => ({ ...prev, isPassportVerified: verified }));
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await (supabase.from('profiles') as any).update({ is_passport_verified: verified }).eq('id', user.id);
        }
      } catch (error) {
        console.error('Failed to sync passport verified:', error);
        crashlytics.recordError(error instanceof Error ? error : new Error(String(error)), 'Failed to sync passport verified');
      }
    },
    [supabase]
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
    setPassportVerified,
    fetchProfileData,
    setPassportVerifiedInDb,
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
