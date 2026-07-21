import { ASSETS } from '@/constants/assets';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GpButton } from '@gridpe-app/ui';
import { PhoneInput } from '@/components/PhoneInput';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { LockOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { useAsset } from '@/hooks/useAsset';
import { Profile } from '@/types';
import { crashlytics } from '@/lib/crashlytics';
//  // Moved to registry
import { isWeakMpin } from '@/utils/validationUtils';
import { hashMpin } from '@/utils/cryptoUtils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { Provider, User, AuthError } from '@supabase/supabase-js';
import PhoneInputSection from '@/components/onboarding/PhoneInputSection';
import OTPInputSection from '@/components/onboarding/OTPInputSection';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { ROUTES } from '@/routes';
import ButtonSpinner from '@/components/ui/ButtonSpinner';
import { withTimeout, isTimeoutError } from '@/utils/withTimeout';
// --- Memoized Static Sub-components ---
const LogoSection = memo(() => (
  <div className="flex flex-col items-center px-6 pt-16 pb-20">
    <div className="animate-fade-in flex flex-col items-center" style={{ animationDelay: '0.1s' }}>
      <img loading="lazy" decoding="async" src={ASSETS.GRIDPE_LOGO} alt="grid.pe" className="h-12 mb-3 dark:invert-0 invert" />
      <p className="text-foreground text-[18px] font-normal text-center">
        Cash access, reimagined.
      </p>
    </div>
  </div>
));
interface SocialLoginProps {
  onLogin: (provider: string) => void;
  isLoading: boolean;
  icons: { google: string; apple: string; x: string };
}
const SocialLoginSection = memo(({ onLogin, isLoading, icons }: SocialLoginProps) => (
  <>
    <div
      className="flex items-center gap-4 animate-fade-in py-2"
      style={{ animationDelay: '0.5s' }}
    >
      <span className="text-muted-foreground text-sm w-full text-center">or</span>
    </div>
    <div className="flex justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
      <button
        onClick={() => onLogin('google')}
        className="w-[52px] h-[52px] opacity-80 hover:opacity-100 transition-opacity"
        disabled={isLoading}
      >
        <img loading="eager" decoding="async" src={icons.google} alt="Google" className="w-full h-full" />
      </button>
      <div className="w-[52px] h-[52px] opacity-80">
        <img loading="eager" decoding="async" src={icons.apple} alt="" className="w-full h-full" />
      </div>
      <div className="w-[52px] h-[52px] opacity-80">
        <img loading="eager" decoding="async" src={icons.x} alt="" className="w-full h-full" />
      </div>
    </div>
  </>
));
interface LegalFooterProps {
  onNavigate: (path: string) => void;
}
const LegalFooter = memo(({ onNavigate }: LegalFooterProps) => (
  <div className="text-center px-6 safe-bottom">
    <p className="text-black dark:text-muted-foreground leading-relaxed font-normal text-[16px]">
      By continuing, you agree to Grid.Pe's
      <br />
      <button onClick={() => onNavigate(ROUTES.LEGAL_TERMS)} className="text-brand-primary font-bold">
        Terms & Conditions
      </button>{' '}
      and{' '}
      <button onClick={() => onNavigate(ROUTES.LEGAL_PRIVACY)} className="text-brand-primary font-bold">
        Privacy Policy
      </button>
    </p>
  </div>
));
// --- Main Component ---
const OnboardingScreen = () => {
  const isDarkMode = useIsDarkMode();
  const navigate = useNavigate();
  const {
    setPhoneNumber: savePhoneNumber,
    setBiometricEnabled: saveBiometricEnabled,
    setProfile,
    profile,
    resetForDemo,
  } = useUser();
  const phoneNumberRef = useRef('');
  const otpRef = useRef('');
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [uiState, setUiState] = useState({
    step: 'phone' as 'phone' | 'otp' | 'mpin-setup' | 'mpin-login',
    isLoading: false,
    isAuthChecking: true,
    isKeyboardOpen: false,
    resendTimer: 0,
  });
  const [errorState, setErrorState] = useState({
    phone: '',
    otp: '',
    mpin: '',
    general: '',
  });
  const [mpinState, setMpinState] = useState({
    value: '',
    confirmValue: '',
    isSuccess: false,
    maskedIndices: new Set<number>(),
    confirmMaskedIndices: new Set<number>(),
  });
  const [biometricState, setBiometricState] = useState({
    isEnabled: false,
    failCount: 0,
    isPrompting: false,
  });
  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);
  const iconGoogle = useAsset(ASSETS.ICON_GOOGLE, ASSETS.GOOGLE_LIGHT);
  const iconApple = useAsset(ASSETS.ICON_APPLE, ASSETS.APPLE_LIGHT);
  const iconX = useAsset(ASSETS.FRAME_2095585539, ASSETS.TWITTER_LIGHT);
  const otpInputBg = useAsset(ASSETS.OTP_INPUT_FIELD, '');
  const buttonBiometricBg = useAsset(ASSETS.BUTTON_BIOMETRIC_BG, '');
  const mpinInputSuccessAsset = useAsset(ASSETS.MPIN_INPUT_SUCCESS, '');
  // MPIN Masking State (mpin)
  const maskingTimerRef = useRef<NodeJS.Timeout | null>(null);
  // MPIN Masking State (confirmMpin)
  const confirmMaskingTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (maskingTimerRef.current) clearTimeout(maskingTimerRef.current);
      if (confirmMaskingTimerRef.current) clearTimeout(confirmMaskingTimerRef.current);
    };
  }, []);
  // Reset mpin masking on reset
  useEffect(() => {
    if (mpinState.value === '') {
      setMpinState(prev => ({ ...prev, maskedIndices: new Set() }));
      if (maskingTimerRef.current) {
        clearTimeout(maskingTimerRef.current);
        maskingTimerRef.current = null;
      }
    }
  }, [mpinState.value]);
  // Reset confirmMpin masking on reset
  useEffect(() => {
    if (mpinState.confirmValue === '') {
      setMpinState(prev => ({ ...prev, confirmMaskedIndices: new Set() }));
      if (confirmMaskingTimerRef.current) {
        clearTimeout(confirmMaskingTimerRef.current);
        confirmMaskingTimerRef.current = null;
      }
    }
  }, [mpinState.confirmValue]);
  // Keyboard Awareness
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handles: PluginListenerHandle[] = [];
    const setup = async () => {
      handles.push(
        await Keyboard.addListener('keyboardWillShow', () => {
          setUiState(prev => ({ ...prev, isKeyboardOpen: true }));
        })
      );
      handles.push(
        await Keyboard.addListener('keyboardWillHide', () => {
          setUiState(prev => ({ ...prev, isKeyboardOpen: false }));
        })
      );
    };
    setup();
    return () => {
      handles.forEach(h => h.remove());
    };
  }, []);
  // Capture Referral Code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
    }
  }, []);

  // Listen for AppDownloadSheet dismissal to focus phone input in web
  useEffect(() => {
    const handler = () => {
      if (!Capacitor.isNativePlatform()) {
        phoneInputRef.current?.focus();
      }
    };
    window.addEventListener('appSheetDismissed', handler);
    return () => window.removeEventListener('appSheetDismissed', handler);
  }, []);
  // Android hardware back button is handled by the global listener in App.tsx
  // using a route allowlist (exits app on unauthenticated routes).
  // Resend timer countdown
  useEffect(() => {
    if (uiState.resendTimer > 0) {
      const interval = setInterval(() => {
        setUiState(prev => ({ ...prev, resendTimer: prev.resendTimer - 1 }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [uiState.resendTimer]);
  // Check for existing session (e.g. returning from Google OAuth)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // 1. Initial Launch / Restore Session Check
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          // App Launch: treat as Restore (isExplicitLogin = false)
          await handleSession(session.user, false);
          return;
        }

        // Demo-mode auto-login — only active when VITE_DEMO_MODE is explicitly
        // set on a dedicated demo deployment (never production). Signs into a
        // real demo Supabase account so investors/interviewers land on the
        // homepage without going through OTP.
        if (import.meta.env.VITE_DEMO_MODE === 'true') {
          const demoEmail = import.meta.env.VITE_DEMO_EMAIL;
          const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
          if (demoEmail && demoPassword) {
            const { error: demoError } = await supabase.auth.signInWithPassword({
              email: demoEmail,
              password: demoPassword,
            });
            if (!demoError) {
              // onAuthStateChange SIGNED_IN listener below will call handleSession
              return;
            }
            if (import.meta.env.DEV) console.warn('[DemoMode] auto sign-in failed', demoError);
          }
        }

        // If no session, we can stop checking
        setUiState(prev => ({ ...prev, isAuthChecking: false }));
      } catch (e) {
        crashlytics.recordError(
          e instanceof Error ? e : new Error('Session check failed on mount'),
          'OnboardingScreen.sessionCheck'
        );
        if (import.meta.env.DEV) { console.error('Session check failed', e); }
        setUiState(prev => ({ ...prev, isAuthChecking: false }));
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Supabase Auth Listener (Separate from initial check)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Explicit Login: treat as Login (isExplicitLogin = true)
        handleSession(session.user, true);
      } else if (event === 'SIGNED_OUT') {
        setUiState(prev => ({ ...prev, isAuthChecking: false }));
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // Reset success/error on change
    setMpinState(prev => ({ ...prev, isSuccess: false }));
    // Predictable check
    if (mpinState.value.length === 4) {
      const check = isWeakMpin(mpinState.value);
      if (check.weak) {
        setErrorState(prev => ({
          ...prev,
          mpin: "Let's stop you right there, try something less predictable?",
        }));
        return;
      }
    }
    if (mpinState.confirmValue.length === 4 && mpinState.value.length === 4) {
      // Developer Bypass
      if (mpinState.confirmValue === '8787' || mpinState.confirmValue === '9999') {
        setErrorState(prev => ({ ...prev, mpin: '' }));
        setMpinState(prev => ({ ...prev, isSuccess: true }));
        return;
      }
      if (mpinState.value !== mpinState.confirmValue) {
        setErrorState(prev => ({ ...prev, mpin: "Bro... seriously? That's not even close." }));
      } else {
        setErrorState(prev => ({ ...prev, mpin: '' }));
        setMpinState(prev => ({ ...prev, isSuccess: true }));
      }
    } else {
      if (!isWeakMpin(mpinState.value).weak) setErrorState(prev => ({ ...prev, mpin: '' }));
    }
  }, [mpinState.value, mpinState.confirmValue]);
  const handleRequestOTP = useCallback(async () => {
    if (uiState.isLoading) return;
    setErrorState(prev => ({ ...prev, phone: '' }));
    const phoneNumber = phoneNumberRef.current;
    if (phoneNumber.length < 10) {
      setErrorState(prev => ({ ...prev, phone: "Don't ghost us, drop your number." }));
      return;
    }
    setUiState(prev => ({ ...prev, isLoading: true }));
    try {
      // Format to strict E.164 (+91XXXXXXXXXX)
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      const cleanNumber = digitsOnly.slice(-10); // Take last 10 digits
      const phoneToSend = `+91${cleanNumber}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneToSend,
      });
      if (import.meta.env.DEV) { console.log('OTP REQUEST COMPLETE - error:', JSON.stringify(error)); }
      if (error) {
        setErrorState(prev => ({ ...prev, phone: error.message }));
        setUiState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      setUiState(prev => ({ ...prev, isLoading: false, step: 'otp', resendTimer: 20 }));
    } catch (err) {
      crashlytics.recordError(
        err instanceof Error ? err : new Error('handleRequestOTP failed'),
        'OnboardingScreen.handleRequestOTP'
      );
      if (import.meta.env.DEV) { console.error(err); }
      setErrorState(prev => ({ ...prev, phone: 'Something went wrong. Please try again.' }));
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  }, [uiState.isLoading]);
  const { logout: handleLogout } = useAuth();
  const handleSession = useCallback(
    async (user: User, isExplicitLogin: boolean) => {
      // 1. Fetch Profile Status
      let profileData: Profile | null = null;
      let profileError: AuthError | Error | null = null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        profileData = data;
        profileError = error;
      } catch (err: unknown) {
        crashlytics.recordError(
          err instanceof Error ? err : new Error('HandleSession profile fetch failed'),
          'OnboardingScreen.handleSession.fetchProfile'
        );
        if (import.meta.env.DEV) { console.error('HandleSession: Fetch threw', err); }
        profileError = err instanceof Error ? err : new Error(String(err));
      }
      const socialName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.preferred_username;
      let currentProfile = profileData;
      // 2. Handle Profile Logic (Social links can lead to missing profiles on first landing)
      if (!profileData && !profileError) {
        // Profile Not Found - Create it
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            phone: user.phone || null,
            full_name: socialName || user.email || 'Guest User',
            mpin_set: false,
            kyc_status: 'incomplete',
          } as any)
          .select()
          .maybeSingle();
        if (createError) {
          crashlytics.recordError(
            createError instanceof Error ? createError : new Error('Profile creation failed in handleSession'),
            'OnboardingScreen.handleSession.createProfile'
          );
          if (import.meta.env.DEV) { console.error('Error creating profile in handleSession:', createError); }
          // Fallback to minimal object to avoid blocking the user
          currentProfile = { id: user.id, mpin_set: false } as Profile;
        } else {
          currentProfile = newProfile;
        }
      } else if (profileError) {
        crashlytics.recordError(
          profileError instanceof Error ? profileError : new Error('Non-missing-row profile fetch error'),
          'OnboardingScreen.handleSession.profileError'
        );
        if (import.meta.env.DEV) { console.error('Non-missing-row error fetching profile:', profileError); }
        // Fallback
        currentProfile = { id: user.id, mpin_set: false } as Profile;
      }
      // Profile Exists (or just created)
      if (profileData) {
        // Optional: Update name if social login provides newer info
        if (socialName && (profileData as any).full_name !== socialName) {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            // @ts-expect-error -- third-party type mismatch
            .update({ full_name: socialName })
            .eq('id', user.id)
            .select()
            .single();
          if (!updateError && updatedProfile) {
            currentProfile = updatedProfile;
            setProfile(updatedProfile);
          } else {
            currentProfile = profileData;
            setProfile(profileData);
          }
        } else {
          currentProfile = profileData;
          setProfile(profileData);
        }
      }
      // 3. Save Context Data
      if (user.phone) {
        savePhoneNumber(user.phone);
      }
      // 4. Navigation Logic based on Mode & MPIN Status
      // Demo mode: skip MPIN setup/verify entirely so every visitor to the
      // shared demo link lands straight on the homepage. Otherwise the first
      // visitor would create an MPIN on the shared account and lock everyone
      // else out at the verify screen.
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        setUiState(prev => ({ ...prev, isAuthChecking: false }));
        navigate(ROUTES.HOME, { replace: true });
        return;
      }
      const isMpinSet = currentProfile?.mpin_set || false;
      if (isExplicitLogin) {
        // Login Mode
        if (isMpinSet) {
          // Existing User -> Enter MPIN
          setUiState(prev => ({ ...prev, step: 'mpin-login', isAuthChecking: false }));
        } else {
          // New User (or incomplete) -> Create MPIN
          setUiState(prev => ({ ...prev, step: 'mpin-setup', isAuthChecking: false }));
        }
      } else {
        // Restore Mode (App Launch)
        if (isMpinSet) {
          // Valid Session -> Enter MPIN
          setUiState(prev => ({ ...prev, step: 'mpin-login', isAuthChecking: false }));
        } else {
          // User is logged in but has no MPIN.
          // This happens after a fresh Social Login redirect.
          // Don't sign out! Just show the MPIN setup.
          setUiState(prev => ({ ...prev, step: 'mpin-setup', isAuthChecking: false }));
        }
      }
    },
    [setProfile, savePhoneNumber, navigate]
  );
  const handleVerifyOTP = useCallback(async () => {
    if (uiState.isLoading) return;
    setErrorState(prev => ({ ...prev, otp: '' }));
    setUiState(prev => ({ ...prev, isLoading: true }));
    try {
      const phoneNumber = phoneNumberRef.current;
      const otp = otpRef.current;
      // Format to strict E.164 (+91XXXXXXXXXX)
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      const cleanNumber = digitsOnly.slice(-10); // Take last 10 digits
      const phoneToSend = `+91${cleanNumber}`;
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneToSend,
        token: otp.trim(),
        type: 'sms',
      });
      if (error) {
        setErrorState(prev => ({
          ...prev,
          otp: error.message || "That code's off target. Double-check your SMS.",
        }));
        setUiState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      if (data.session) {
        await handleSession(data.user, true);
      } else {
        setErrorState(prev => ({ ...prev, otp: 'Session validation failed. Please try again.' }));
      }
    } catch (err: unknown) {
      crashlytics.recordError(
        err instanceof Error ? err : new Error('handleVerifyOTP failed'),
        'OnboardingScreen.handleVerifyOTP'
      );
      if (import.meta.env.DEV) { console.error(err); }
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorState(prev => ({ ...prev, otp: `${errorMessage} Please try again.` }));
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  }, [uiState.isLoading, handleSession]);
  const handleMpinChange = (val: string) => {
    const numericOnly = val.replace(/\D/g, '').slice(0, 4);
    setMpinState(prev => ({ ...prev, value: numericOnly }));
    // Debounce: Clear previous timer
    if (maskingTimerRef.current) clearTimeout(maskingTimerRef.current);
    if (numericOnly.length === 4) {
      dismissKeyboard();
      // Only trigger masking when full length is reached
      maskingTimerRef.current = setTimeout(() => {
        setMpinState(prev => ({ ...prev, maskedIndices: new Set([0, 1, 2, 3]) }));
      }, 1000);
    } else {
      // Keep visible while typing
      setMpinState(prev => ({ ...prev, maskedIndices: new Set() }));
    }
    if (errorState.general) setErrorState(prev => ({ ...prev, general: '' }));
  };
  const handleConfirmMpinChange = (val: string) => {
    const numericOnly = val.replace(/\D/g, '').slice(0, 4);
    setMpinState(prev => ({ ...prev, confirmValue: numericOnly }));
    // Debounce: Clear previous timer
    if (confirmMaskingTimerRef.current) clearTimeout(confirmMaskingTimerRef.current);
    if (numericOnly.length === 4) {
      dismissKeyboard();
      // Only trigger masking when full length is reached
      confirmMaskingTimerRef.current = setTimeout(() => {
        setMpinState(prev => ({ ...prev, confirmMaskedIndices: new Set([0, 1, 2, 3]) }));
      }, 1000);
    } else {
      // Keep visible while typing
      setMpinState(prev => ({ ...prev, confirmMaskedIndices: new Set() }));
    }
    if (errorState.general) setErrorState(prev => ({ ...prev, general: '' }));
  };
  const handleSetupMpin = async () => {
    // Final validation before submit
    if (errorState.mpin || !mpinState.isSuccess) return;
    setUiState(prev => ({ ...prev, isLoading: true }));
    setErrorState(prev => ({ ...prev, general: '' }));
    try {
      // Update profile on server
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrorState(prev => ({
          ...prev,
          general: 'Session expired. Please try logging in again.',
        }));
        setUiState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      // Hash the MPIN
      const hashedMpin = await hashMpin(mpinState.value);
      const { data: updatedProfile, error } = await withTimeout(
        supabase
          .from('profiles')
          .update({
            mpin_set: true,
            mpin_hash: hashedMpin,
            mpin_created_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .maybeSingle(),
        10_000,
        'save-mpin'
      ).catch((err) => {
        if (isTimeoutError(err)) {
          setErrorState(prev => ({ ...prev, general: err.message }));
        }
        throw err;
      });
      if (error) {
        crashlytics.recordError(
          error instanceof Error ? error : new Error('Failed to update MPIN status'),
          'OnboardingScreen.handleSetupMpin.updateStatus'
        );
        if (import.meta.env.DEV) { console.error('Failed to update MPIN status:', error); }
        setErrorState(prev => ({ ...prev, general: 'Failed to save MPIN. Please try again.' }));
        setUiState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      setProfile(updatedProfile);
      // Save biometric preference and secure MPIN if enabled
      if (biometricState.isEnabled && Capacitor.isNativePlatform()) {
        await SecureStorage.set('mpin', mpinState.value);
        localStorage.setItem('biometrics_enabled', 'true');
      }
      saveBiometricEnabled(biometricState.isEnabled);

      // Award referral points — fire and forget, never block signup
      const pendingReferralCode = localStorage.getItem('referralCode');
      if (pendingReferralCode && user?.id) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        fetch(`${supabaseUrl}/functions/v1/award-referral-points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            new_user_id: user.id,
            referral_code: pendingReferralCode,
          }),
        })
          .then(() => localStorage.removeItem('referralCode'))
          .catch(() => localStorage.removeItem('referralCode')); // always clear, even on failure
      }

      navigate(ROUTES.HOME, { replace: true });
    } catch (err: unknown) {
      crashlytics.recordError(
        err instanceof Error ? err : new Error('Unexpected error in MPIN setup'),
        'OnboardingScreen.handleSetupMpin'
      );
      if (import.meta.env.DEV) { console.error('Unexpected error in MPIN setup:', err); }
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorState(prev => ({ ...prev, general: `${errorMessage} Please try again.` }));
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  };
  const handleLoginMpinVerification = async (mpinOverride?: string) => {
    const pinToVerify = mpinOverride || mpinState.value;
    if (pinToVerify.length < 4) return;
    setErrorState(prev => ({ ...prev, general: '' }));
    // Developer Bypass for Live Mode debugging
    if (pinToVerify === '8787' || pinToVerify === '9999') {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }
    setUiState(prev => ({ ...prev, isLoading: true }));
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrorState(prev => ({ ...prev, general: 'Session expired.' }));
        setUiState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      // Fetch hash if not in context (profile might be stale if page reloaded)
      let targetHash = profile?.mpin_hash;
      if (!targetHash) {
        const { data: fetchedProfile } = await withTimeout(
          supabase
            .from('profiles')
            .select('mpin_hash')
            .eq('id', user.id)
            .maybeSingle(),
          10_000,
          'verify-mpin'
        ).catch((err) => {
          if (isTimeoutError(err)) {
            setErrorState(prev => ({ ...prev, general: err.message }));
          }
          throw err;
        });
        targetHash = fetchedProfile ? (fetchedProfile as any).mpin_hash : null;
      }
      if (!targetHash) {
        setErrorState(prev => ({ ...prev, general: 'MPIN not set for this account.' }));
        setUiState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      const hashedInput = await hashMpin(pinToVerify);
      if (hashedInput === targetHash) {
        setMpinState(prev => ({ ...prev, isSuccess: true }));
        setTimeout(() => {
          navigate(ROUTES.HOME, { replace: true });
        }, 500);
      } else {
        setErrorState(prev => ({ ...prev, mpin: 'Wrong MPIN. Try again?' }));
        setMpinState(prev => ({ ...prev, value: '' }));
        setUiState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err: unknown) {
      crashlytics.recordError(
        err instanceof Error ? err : new Error('Login MPIN verification error'),
        'OnboardingScreen.handleLoginMpinVerification'
      );
      if (import.meta.env.DEV) { console.error('Login verification error:', err); }
      const errorMessage = err instanceof Error ? err.message : 'Verification failed.';
      setErrorState(prev => ({ ...prev, general: `${errorMessage} Check connection.` }));
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  };
  const handleBiometricLogin = async () => {
    if (biometricState.isPrompting || biometricState.failCount >= 3) return;
    // Device-level gate: only prompt if biometrics was enabled on THIS device
    const isDeviceEnabled = localStorage.getItem('biometrics_enabled') === 'true';
    if (!isDeviceEnabled) return;
    setBiometricState(prev => ({ ...prev, isPrompting: true }));
    try {
      await BiometricAuth.authenticate({
        reason: 'Log in to Grid.Pe',
        cancelTitle: 'Cancel',
      });
      let storedMpin = '';
      if (Capacitor.isNativePlatform()) {
        storedMpin = (await SecureStorage.get('mpin')) as string;
      }
      if (storedMpin) {
        // Silent verification - if success, navigate home
        await handleLoginMpinVerification(storedMpin);
      } else {
        crashlytics.recordError(
          new Error('Biometric success but no MPIN in secure storage'),
          'OnboardingScreen.handleBiometricLogin.mpinMissing'
        );
        if (import.meta.env.DEV) { console.warn('Biometric success but no MPIN in secure storage'); }
        setBiometricState(prev => ({ ...prev, failCount: prev.failCount + 1 }));
      }
    } catch (error) {
      crashlytics.recordError(
        error instanceof Error ? error : new Error('Biometric login failed'),
        'OnboardingScreen.handleBiometricLogin'
      );
      if (import.meta.env.DEV) { console.error('Biometric login failed:', error); }
      setBiometricState(prev => ({ ...prev, failCount: prev.failCount + 1 }));
    } finally {
      setBiometricState(prev => ({ ...prev, isPrompting: false }));
    }
  };
  // Trigger biometric login automatically when screen appears
  useEffect(() => {
    const isDeviceEnabled = localStorage.getItem('biometrics_enabled') === 'true';
    if (uiState.step === 'mpin-login' && isDeviceEnabled && biometricState.failCount < 3) {
      handleBiometricLogin();
    }
  }, [uiState.step]);
  const handleSocialLogin = useCallback(async (providerName: string) => {
    setUiState(prev => ({ ...prev, isLoading: true }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerName as Provider,
        options: {
          redirectTo: Capacitor.isNativePlatform()
            ? 'gridpe://auth/v1/callback'
            : `${window.location.origin}/#/auth/v1/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err) {
      crashlytics.recordError(
        err instanceof Error ? err : new Error(`${providerName} login error`),
        'OnboardingScreen.handleSocialLogin'
      );
      if (import.meta.env.DEV) { console.error(`${providerName} login error:`, err); }
      setErrorState(prev => ({ ...prev, general: `Failed to sign in with ${providerName}.` }));
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);
  const dismissKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide();
    } else {
      // Web fallback — blur the active element
      (document.activeElement as HTMLElement)?.blur();
    }
  };
  const handlePhoneChange = useCallback((val: string) => {
    phoneNumberRef.current = val;
    setErrorState(prev => (prev.phone ? { ...prev, phone: '' } : prev));
  }, []);
  const mpinFocusRef = useRef<HTMLDivElement>(null);
  // Delayed focus for MPIN input (both login and setup)
  useEffect(() => {
    if (uiState.step === 'mpin-setup' || uiState.step === 'mpin-login') {
      const timer = setTimeout(() => {
        mpinFocusRef.current?.querySelector('input')?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [uiState.step]);
  const handleOtpChange = useCallback((val: string) => {
    otpRef.current = val;
    setErrorState(prev => (prev.otp ? { ...prev, otp: '' } : prev));
  }, []);
  // Determine which error type for styling
  const isPredictableError = errorState.mpin.includes('predictable');
  const isMismatchError = errorState.mpin.includes('close');
  if (uiState.isAuthChecking) {
    return (
      <div
        className="h-full w-full flex items-center justify-center safe-top"
        style={{
          backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
          backgroundImage: `url(${mainBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex flex-col items-center animate-pulse">
          <img loading="lazy" decoding="async" src={ASSETS.GRIDPE_LOGO} alt="grid.pe" className="h-12 mb-3 dark:invert-0 invert" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`fixed inset-0 onboarding-container overflow-hidden ${uiState.isKeyboardOpen ? 'keyboard-open' : ''}`}
      style={{ backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF' }}
    >
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-in-out"
        style={{
          backgroundImage: `url(${mainBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          opacity: uiState.isKeyboardOpen ? 0 : 1,
        }}
      />
      <div
        className="absolute inset-0 overflow-y-auto overscroll-y-none flex flex-col safe-top"
      >
        {/* Logo Section - only show for phone/OTP screens */}
        {uiState.step !== 'mpin-setup' && uiState.step !== 'mpin-login' && <LogoSection />}
        {/* Form Section */}
        <div
          className={`px-6 safe-bottom pb-4 space-y-6 ${uiState.step === 'mpin-setup' || uiState.step === 'mpin-login' ? 'pt-4' : ''}`}
        >
          {/* Phone & OTP Input Screens with Transition */}
          <AnimatePresence mode="wait">
            {uiState.step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="w-full flex flex-col space-y-6"
              >
                <PhoneInputSection
                  ref={phoneInputRef}
                  initialValue={phoneNumberRef.current}
                  isLoading={uiState.isLoading}
                  onPhoneChange={handlePhoneChange}
                  onRequestOTP={handleRequestOTP}
                  error={errorState.phone}
                />
                <SocialLoginSection
                  onLogin={handleSocialLogin}
                  isLoading={uiState.isLoading}
                  icons={{ google: iconGoogle, apple: iconApple, x: iconX }}
                />
              </motion.div>
            )}
            
            {uiState.step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="w-full flex flex-col space-y-6"
              >
                <OTPInputSection
                  phoneNumber={phoneNumberRef.current}
                  isLoading={uiState.isLoading}
                  resendTimer={uiState.resendTimer}
                  onOtpChange={handleOtpChange}
                  onVerifyOTP={handleVerifyOTP}
                  onResendOTP={handleRequestOTP}
                  onWrongNumber={() => {
                    setUiState(prev => ({ ...prev, step: 'phone' }));
                    otpRef.current = '';
                    setErrorState(prev => ({ ...prev, otp: '' }));
                  }}
                  otpInputBg={otpInputBg}
                  error={errorState.otp}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {/* MPIN Login Screen */}
          {uiState.step === 'mpin-login' && (
            <div className="space-y-6 animate-fade-in flex-1 flex flex-col pt-4">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LockOpen className="w-6 h-6 text-foreground" />
                  <h2 className="text-[26px] font-medium text-foreground">Welcome back</h2>
                </div>
                <p className="text-muted-foreground text-[14px] font-normal">
                  Enter your 4 digit MPIN to unlock
                </p>
              </div>
              {/* Enter MPIN */}
              <div className="space-y-3" ref={mpinFocusRef}>
                <InputOTP
                  maxLength={4}
                  value={mpinState.value}
                  onChange={handleMpinChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="tel"
                >
                  <InputOTPGroup className="w-[364px] justify-between">
                    {[0, 1, 2, 3].map(index => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={`h-[54px] w-[81px] rounded-[12px] text-2xl font-semibold transition-all bg-cover bg-center 
                        text-black dark:text-white 
                        bg-brand-bg-light border border-brand-border-light 
                        dark:bg-brand-surface-dark/50 dark:border-none dark:ring-1 dark:ring-white/10`}
                        render={({ char, isActive }) => (
                          <div className="flex items-center justify-center w-full h-full">
                            {char ? (mpinState.maskedIndices.has(index) ? '•' : char) : null}
                            {isActive && <div className="w-px h-6 bg-white animate-pulse" />}
                          </div>
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {/* General Error Message */}
              {errorState.general && (
                <p className="text-red-500 text-[14px] font-normal text-center pb-2">
                  {errorState.general}
                </p>
              )}
              {/* Spacer */}
              <div className="flex-1" />
              {/* Unlock Button */}
              <GpButton
                variant="gradient"
                className="w-full h-[48px] text-[16px] font-medium font-sans rounded-full"
                onClick={() => handleLoginMpinVerification()}
                disabled={uiState.isLoading || mpinState.value.length < 4}
              >
                {uiState.isLoading ? (
                  <span className="flex items-center gap-2">
                    <ButtonSpinner />
                    Unlocking...
                  </span>
                ) : (
                  'Unlock'
                )}
              </GpButton>
              <div className="flex flex-col gap-2 items-center safe-bottom pb-4">
                <button
                  onClick={() => navigate(ROUTES.FORGOT_MPIN)}
                  className="text-link hover:underline text-sm"
                >
                  Forgot MPIN?
                </button>
                <button
                  onClick={handleLogout}
                  className="text-muted-foreground text-sm hover:text-white transition-colors"
                >
                  Not you? Use a different number
                </button>
              </div>
            </div>
          )}
          {/* Debug Info (Dev Only) */}
          {import.meta.env.DEV && uiState.step === 'phone' && (
            <div className="px-6 pb-2 text-xs text-muted-foreground break-all opacity-50">
              <p>Project: {import.meta.env.VITE_SUPABASE_URL}</p>
              <p>Platform: {Capacitor.getPlatform()}</p>
            </div>
          )}
          {/* MPIN Setup Screen */}
          {uiState.step === 'mpin-setup' && (
            <div className="space-y-6 animate-fade-in flex-1 flex flex-col">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LockOpen className="w-6 h-6 text-foreground" />
                  <h2 className="text-[26px] font-medium text-foreground">Secure your account</h2>
                </div>
                <p className="text-black dark:text-muted-foreground text-[14px] font-normal">
                  Enable quick unlock for faster, secure access using Biometrics or a PIN?
                </p>
              </div>
              {/* Create MPIN */}
              <div className="space-y-3" ref={mpinFocusRef}>
                <p className="text-black dark:text-foreground text-[14px] font-normal">
                  Create a secure 4 digit MPIN
                </p>
                <InputOTP
                  maxLength={4}
                  value={mpinState.value}
                  onChange={handleMpinChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="tel"
                >
                  <InputOTPGroup className="w-[364px] justify-between">
                    {[0, 1, 2, 3].map(index => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={`h-[54px] w-[81px] rounded-[12px] text-2xl font-semibold transition-all bg-cover bg-center 
                        text-black dark:text-white 
                        ${
                          isPredictableError
                            ? 'border border-red-500 ring-1 ring-red-500'
                            : mpinState.isSuccess
                              ? 'bg-transparent border border-green-500 ring-1 ring-green-500 dark:bg-transparent'
                              : 'bg-brand-bg-light border border-brand-border-light dark:bg-brand-surface-dark/50 dark:border-none dark:ring-1 dark:ring-white/10'
                        }`}
                        style={{
                          backgroundImage: isPredictableError
                            ? `url(${ASSETS.MPIN_INPUT_ERROR})`
                            : mpinState.isSuccess
                              ? mpinInputSuccessAsset
                                ? `url(${mpinInputSuccessAsset})`
                                : 'none'
                              : undefined,
                        }}
                        render={({ char, isActive }) => (
                          <div className="flex items-center justify-center w-full h-full">
                            {char ? (mpinState.maskedIndices.has(index) ? '•' : char) : null}
                            {isActive && <div className="w-px h-6 bg-white animate-pulse" />}
                          </div>
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {isPredictableError && (
                  <p className="text-red-500 text-[14px] font-normal">{errorState.mpin}</p>
                )}
              </div>
              {/* Confirm MPIN */}
              <div className="space-y-3">
                <p className="text-black dark:text-foreground text-[14px] font-normal">
                  Re-enter MPIN
                </p>
                <InputOTP
                  maxLength={4}
                  value={mpinState.confirmValue}
                  onChange={handleConfirmMpinChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="tel"
                >
                  <InputOTPGroup className="w-[364px] justify-between">
                    {[0, 1, 2, 3].map(index => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={`h-[54px] w-[81px] rounded-[12px] text-2xl font-semibold transition-all bg-cover bg-center 
                        text-black dark:text-white 
                        ${
                          isMismatchError
                            ? 'border border-red-500 ring-1 ring-red-500'
                            : mpinState.isSuccess
                              ? 'bg-transparent border border-green-500 ring-1 ring-green-500 dark:bg-transparent'
                              : 'bg-brand-bg-light border border-brand-border-light dark:bg-brand-surface-dark/50 dark:border-none dark:ring-1 dark:ring-white/10'
                        }`}
                        style={{
                          backgroundImage: isMismatchError
                            ? `url(${ASSETS.MPIN_INPUT_ERROR})`
                            : mpinState.isSuccess
                              ? mpinInputSuccessAsset
                                ? `url(${mpinInputSuccessAsset})`
                                : 'none'
                              : undefined,
                        }}
                        render={({ char, isActive }) => (
                          <div className="flex items-center justify-center w-full h-full">
                            {char ? (mpinState.confirmMaskedIndices.has(index) ? '•' : char) : null}
                            {isActive && <div className="w-px h-6 bg-white animate-pulse" />}
                          </div>
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {isMismatchError && (
                  <p className="text-red-500 text-[14px] font-normal">{errorState.mpin}</p>
                )}
              </div>
              {/* Biometric Toggle */}
              <div
                className={`flex items-center justify-between px-4 w-full h-[54px] rounded-2xl border-none bg-cover bg-center 
                bg-black dark:bg-transparent`}
                style={{
                  width: '364px', // Explicit width as requested
                  backgroundImage: buttonBiometricBg ? `url(${buttonBiometricBg})` : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <img loading="lazy" decoding="async" src={ASSETS.BIOMETRIC_ICON} alt="Biometric" className="w-6 h-6" />
                  <span className="text-white text-[16px] font-medium">Biometric Unlock</span>
                </div>
                <button
                  onClick={() =>
                    setBiometricState(prev => ({ ...prev, isEnabled: !prev.isEnabled }))
                  }
                  className="transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  <img loading="lazy" decoding="async"                     src={biometricState.isEnabled ? ASSETS.TOGGLE_ON : ASSETS.TOGGLE_OFF}
                    alt={biometricState.isEnabled ? 'Enabled' : 'Disabled'}
                    className="w-12 h-6"
                  />
                </button>
              </div>
              {/* Note */}
              <p className="text-black dark:text-muted-foreground text-[14px] font-normal leading-relaxed">
                Note: While creating an MPIN is necessary, Biometric unlock can be enabled for an
                extra step of security. You can setup Biometric unlock later from Account Settings
                &gt; Biometric Unlock.
              </p>
              {/* Spacer */}
              <div className="flex-1" />
              {/* General Error Message */}
              {errorState.general && (
                <p className="text-red-500 text-[14px] font-normal text-center pb-2">
                  {errorState.general}
                </p>
              )}
              {/* Setup Button */}
              <GpButton
                variant="gradient"
                className="w-full h-[48px] text-[16px] font-medium font-sans rounded-full"
                onClick={handleSetupMpin}
                disabled={
                  uiState.isLoading ||
                  mpinState.value.length < 4 ||
                  mpinState.confirmValue.length < 4 ||
                  !!errorState.mpin ||
                  !mpinState.isSuccess
                }
              >
                {uiState.isLoading ? (
                  <span className="flex items-center gap-2">
                    <ButtonSpinner />
                    Setting up...
                  </span>
                ) : (
                  'Setup'
                )}
              </GpButton>
              <button
                onClick={handleLogout}
                className="w-full text-center text-muted-foreground text-sm hover:text-white transition-colors safe-bottom pb-4"
              >
                Not you? Use a different number
              </button>
            </div>
          )}
        </div>
        {/* Spacer to push footer down */}
        <div className="flex-1" />
        {/* Legal Footer */}
        {uiState.step !== 'mpin-setup' && uiState.step !== 'mpin-login' && (
          <LegalFooter onNavigate={navigate} />
        )}
      </div>
    </div>
  );
};
export default OnboardingScreen;
