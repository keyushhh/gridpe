import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/PhoneInput";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { LockOpen } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAsset } from "@/hooks/useAsset";
import { Profile } from "@/types";
import logo from "@/assets/gridpe-logo.svg";
import otpInputField from "@/assets/otp-input-field.png";
import toggleOn from "@/assets/toggle-on.svg";
import toggleOff from "@/assets/toggle-off.svg";
import mpinInputSuccess from "@/assets/mpin-input-success.png";
import mpinInputError from "@/assets/mpin-input-error.png";
// import buttonBiometricBg from "@/assets/button-biometric-bg.png"; // Moved to registry
import biometricIcon from "@/assets/biometric-icon.png";
import { isWeakMpin } from "@/utils/validationUtils";
import { hashMpin } from "@/utils/cryptoUtils";
import { supabase } from "@/lib/supabase";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from '@capacitor/keyboard';
import { Provider, User } from "@supabase/supabase-js";

const OnboardingScreen = () => {

  const navigate = useNavigate();
  const { setPhoneNumber: savePhoneNumber, setBiometricEnabled: saveBiometricEnabled, setProfile, profile, resetForDemo } = useUser();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showMpinSetup, setShowMpinSetup] = useState(false);
  const [showMpinLogin, setShowMpinLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);


  // Validation State
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const mainBg = useAsset("main-bg");
  const iconGoogle = useAsset("icon-google");
  const iconApple = useAsset("icon-apple");
  const iconX = useAsset("icon-x");
  const otpInputBg = useAsset("otp-input-bg");
  const buttonBiometricBg = useAsset("button-biometric-bg");
  const mpinInputSuccessAsset = useAsset("mpin-input-success");

  // MPIN State
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [mpinError, setMpinError] = useState("");
  const [mpinSuccess, setMpinSuccess] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricFailCount, setBiometricFailCount] = useState(0);
  const [isBiometricPrompting, setIsBiometricPrompting] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // MPIN Masking State (mpin)
  const [maskedIndices, setMaskedIndices] = useState<Set<number>>(new Set());
  const maskingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // MPIN Masking State (confirmMpin)
  const [confirmMaskedIndices, setConfirmMaskedIndices] = useState<Set<number>>(new Set());
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
    if (mpin === "") {
      setMaskedIndices(new Set());
      if (maskingTimerRef.current) {
        clearTimeout(maskingTimerRef.current);
        maskingTimerRef.current = null;
      }
    }
  }, [mpin]);

  // Reset confirmMpin masking on reset
  useEffect(() => {
    if (confirmMpin === "") {
      setConfirmMaskedIndices(new Set());
      if (confirmMaskingTimerRef.current) {
        clearTimeout(confirmMaskingTimerRef.current);
        confirmMaskingTimerRef.current = null;
      }
    }
  }, [confirmMpin]);

  // Capture Referral Code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
    }
  }, []);

  // Android hardware back button is handled by the global listener in App.tsx
  // using a route allowlist (exits app on unauthenticated routes).



  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Check for existing session (e.g. returning from Google OAuth)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // 1. Initial Launch / Restore Session Check
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // App Launch: treat as Restore (isExplicitLogin = false)
          await handleSession(session.user, false);
        } else {
          // If no session, we can stop checking
          setIsAuthChecking(false);
        }
      } catch (e) {
        console.error("Session check failed", e);
        setIsAuthChecking(false);
      }
    };
    checkSession();
  }, []);

  // Supabase Auth Listener (Separate from initial check)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Explicit Login: treat as Login (isExplicitLogin = true)
        handleSession(session.user, true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthChecking(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reset success/error on change
    setMpinSuccess(false);

    // Predictable check
    if (mpin.length === 4) {
      const check = isWeakMpin(mpin);
      if (check.weak) {
        setMpinError("Let's stop you right there, try something less predictable?");
        return;
      }
    }

    if (confirmMpin.length === 4 && mpin.length === 4) {
      // Developer Bypass
      if (confirmMpin === '8787' || confirmMpin === '9999') {
        setMpinError("");
        setMpinSuccess(true);
        return;
      }

      if (mpin !== confirmMpin) {
        setMpinError("Bro... seriously? That's not even close.");
      } else {
        setMpinError("");
        setMpinSuccess(true);
      }
    } else {
      if (!isWeakMpin(mpin).weak) setMpinError("");
    }
  }, [mpin, confirmMpin]);

  const handleRequestOTP = async () => {
    if (isLoading) return;
    setPhoneError("");
    if (phoneNumber.length < 10) {
      setPhoneError("Don't ghost us, drop your number.");
      return;
    }
    setIsLoading(true);

    try {
      // Format to strict E.164 (+91XXXXXXXXXX)
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      const cleanNumber = digitsOnly.slice(-10); // Take last 10 digits
      const phoneToSend = `+91${cleanNumber}`;
      console.log("OTP REQUEST STARTING - phone:", phoneToSend);

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneToSend,
      });

      console.log("OTP REQUEST COMPLETE - error:", JSON.stringify(error));

      if (error) {
        setPhoneError(error.message);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setShowOtpInput(true);
      setResendTimer(20);
    } catch (err) {
      console.error(err);
      setPhoneError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      resetForDemo(); // Reset Context state
      localStorage.clear(); // Clear all local storage to be safe
      sessionStorage.clear();
      
      setPhoneNumber("");
      setOtp("");
      setMpin("");
      setConfirmMpin("");
      setShowMpinSetup(false);
      setShowOtpInput(false);
      setShowMpinLogin(false);
      setGeneralError("");

      // Force a full WebView reload that wipes the entire back stack.
      window.location.href = window.location.origin + window.location.pathname;
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/";
    }
  };

  const handleSession = async (user: User, isExplicitLogin: boolean) => {

    if (!user) {
      setIsAuthChecking(false);
      return;
    }

    let profileData = null;
    let profileError = null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      profileData = data;
      profileError = error;
    } catch (err: unknown) {
      console.error("HandleSession: Fetch threw", err);
      profileError = err instanceof Error ? err : new Error(String(err));
    }

    const socialName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.preferred_username;
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
          kyc_status: 'incomplete'
        })
        .select()
        .maybeSingle();

      if (createError) {
        console.error("Error creating profile in handleSession:", createError);
        // Fallback to minimal object to avoid blocking the user
        currentProfile = { id: user.id, mpin_set: false } as Profile;
      } else {
        currentProfile = newProfile;
      }
    } else if (profileError) {
      console.error("Non-missing-row error fetching profile:", profileError);
      // Fallback
      currentProfile = { id: user.id, mpin_set: false } as Profile;
    }

    // Profile Exists (or just created)
    if (profileData) {
      // Optional: Update name if social login provides newer info
      if (socialName && profileData.full_name !== socialName) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
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
    const isMpinSet = currentProfile?.mpin_set || false;

    if (isExplicitLogin) {
      // Login Mode
      if (isMpinSet) {
        // Existing User -> Enter MPIN
        setShowMpinLogin(true);
        setIsAuthChecking(false);
      } else {
        // New User (or incomplete) -> Create MPIN
        setShowOtpInput(false);
        setShowMpinSetup(true);
        setIsAuthChecking(false);
      }
    } else {
      // Restore Mode (App Launch)
      if (isMpinSet) {
        // Valid Session -> Enter MPIN
        setShowMpinLogin(true);
        setIsAuthChecking(false);
      } else {
        // User is logged in but has no MPIN. 
        // This happens after a fresh Social Login redirect.
        // Don't sign out! Just show the MPIN setup.
        setShowOtpInput(false);
        setShowMpinSetup(true);
        setIsAuthChecking(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    if (isLoading) return;
    setOtpError("");

    setIsLoading(true);

    try {
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
        setOtpError(error.message || "That code's off target. Double-check your SMS.");
        setIsLoading(false);
        return;
      }

      if (data.session) {
        await handleSession(data.user, true);
      } else {
        setOtpError("Session validation failed. Please try again.");
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      setOtpError(`${errorMessage} Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpinChange = (val: string) => {
    const numericOnly = val.replace(/\D/g, '').slice(0, 4);
    setMpin(numericOnly);

    // Debounce: Clear previous timer
    if (maskingTimerRef.current) clearTimeout(maskingTimerRef.current);

    if (numericOnly.length === 4) {
      dismissKeyboard();
      // Only trigger masking when full length is reached
      maskingTimerRef.current = setTimeout(() => {
        setMaskedIndices(new Set([0, 1, 2, 3]));
      }, 1000);
    } else {
      // Keep visible while typing
      setMaskedIndices(new Set());
    }

    if (generalError) setGeneralError("");
  };

  const handleConfirmMpinChange = (val: string) => {
    const numericOnly = val.replace(/\D/g, '').slice(0, 4);
    setConfirmMpin(numericOnly);

    // Debounce: Clear previous timer
    if (confirmMaskingTimerRef.current) clearTimeout(confirmMaskingTimerRef.current);

    if (numericOnly.length === 4) {
      dismissKeyboard();
      // Only trigger masking when full length is reached
      confirmMaskingTimerRef.current = setTimeout(() => {
        setConfirmMaskedIndices(new Set([0, 1, 2, 3]));
      }, 1000);
    } else {
      // Keep visible while typing
      setConfirmMaskedIndices(new Set());
    }

    if (generalError) setGeneralError("");
  };

  const handleSetupMpin = async () => {
    // Final validation before submit
    if (mpinError || !mpinSuccess) return;

    setIsLoading(true);
    setGeneralError("");

    try {
      // Update profile on server
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setGeneralError("Session expired. Please try logging in again.");
        setIsLoading(false);
        return;
      }

      // Hash the MPIN
      const hashedMpin = await hashMpin(mpin);

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          mpin_set: true,
          mpin_hash: hashedMpin,
          mpin_created_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error("Failed to update MPIN status:", error);
        setGeneralError("Failed to save MPIN. Please try again.");
        setIsLoading(false);
        return;
      }

      setProfile(updatedProfile);

      // Save biometric preference and secure MPIN if enabled
      if (biometricEnabled) {
        await SecureStorage.set('mpin', mpin);
        localStorage.setItem('biometrics_enabled', 'true');
      }
      saveBiometricEnabled(biometricEnabled);

      navigate("/home", { replace: true });
    } catch (err: unknown) {
      console.error("Unexpected error in MPIN setup:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setGeneralError(`${errorMessage} Please try again.`);
      setIsLoading(false);
    }
  };
  const handleLoginMpinVerification = async (mpinOverride?: string) => {
    const pinToVerify = mpinOverride || mpin;
    if (pinToVerify.length < 4) return;
    setGeneralError("");

    // Developer Bypass for Live Mode debugging
    if (pinToVerify === '8787' || pinToVerify === '9999') {
      navigate("/home", { replace: true });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setGeneralError("Session expired.");
        setIsLoading(false);
        return;
      }

      // Fetch hash if not in context (profile might be stale if page reloaded)
      let targetHash = profile?.mpin_hash;

      if (!targetHash) {
        const { data: fetchedProfile } = await supabase
          .from('profiles')
          .select('mpin_hash')
          .eq('id', user.id)
          .maybeSingle();
        targetHash = fetchedProfile?.mpin_hash ?? null;
      }

      if (!targetHash) {
        setGeneralError("MPIN not set for this account.");
        setIsLoading(false);
        return;
      }

      const hashedInput = await hashMpin(pinToVerify);

      if (hashedInput === targetHash) {
        setMpinSuccess(true);
        setTimeout(() => navigate("/home", { replace: true }), 500);
      } else {
        setMpinError("Wrong MPIN. Try again?");
        setMpin("");
        setIsLoading(false);
      }
    } catch (err: unknown) {
      console.error("Login verification error:", err);
      const errorMessage = err instanceof Error ? err.message : "Verification failed.";
      setGeneralError(`${errorMessage} Check connection.`);
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (isBiometricPrompting || biometricFailCount >= 3) return;

    // Device-level gate: only prompt if biometrics was enabled on THIS device
    const isDeviceEnabled = localStorage.getItem('biometrics_enabled') === 'true';
    if (!isDeviceEnabled) return;

    setIsBiometricPrompting(true);
    try {
      await BiometricAuth.authenticate({
        reason: "Log in to Grid.Pe",
        cancelTitle: "Cancel"
      });

      const storedMpin = await SecureStorage.get('mpin') as string;
      if (storedMpin) {
        // Silent verification - if success, navigate home
        await handleLoginMpinVerification(storedMpin);
      } else {
        console.warn("Biometric success but no MPIN in secure storage");
        setBiometricFailCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Biometric login failed:", error);
      setBiometricFailCount(prev => prev + 1);
    } finally {
      setIsBiometricPrompting(false);
    }
  };

  // Trigger biometric login automatically when screen appears
  useEffect(() => {
    const isDeviceEnabled = localStorage.getItem('biometrics_enabled') === 'true';
    if (showMpinLogin && isDeviceEnabled && biometricFailCount < 3) {
      handleBiometricLogin();
    }
  }, [showMpinLogin]);

  const handleSocialLogin = async (providerName: string) => {
    setIsLoading(true);
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
      console.error(`${providerName} login error:`, err);
      setGeneralError(`Failed to sign in with ${providerName}.`);
    } finally {
      setIsLoading(false);
    }
  };


  const dismissKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide();
    } else {
      // Web fallback — blur the active element
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  // Memoized so PhoneInput doesn't re-create the callback on every parent
  // re-render — Android WebView keystroke jank traces back to this.
  const handlePhoneChange = useCallback((val: string) => {
    const numericOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(numericOnly);
    if (numericOnly.length === 10) {
      dismissKeyboard();
    }
    setPhoneError((prev) => (prev ? "" : prev));
  }, []);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLDivElement>(null);
  const otpFocusRef = useRef<HTMLDivElement>(null);
  const mpinFocusRef = useRef<HTMLDivElement>(null);

  // Delayed focus for phone input — iOS needs 100ms for viewport handshake, Android needs 500ms to avoid layout jitter
  useEffect(() => {
    if (!showOtpInput && !showMpinSetup && !showMpinLogin && !isAuthChecking) {
      const delay = Capacitor.getPlatform() === 'ios' ? 100 : 500;
      const timer = setTimeout(() => {
        phoneInputRef.current?.focus();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [showOtpInput, showMpinSetup, showMpinLogin, isAuthChecking]);

  // Delayed focus for OTP input
  useEffect(() => {
    if (showOtpInput && !showMpinSetup && !showMpinLogin) {
      const timer = setTimeout(() => {
        otpFocusRef.current?.querySelector('input')?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showOtpInput, showMpinSetup, showMpinLogin]);

  // Delayed focus for MPIN input (both login and setup)
  useEffect(() => {
    if (showMpinSetup || showMpinLogin) {
      const timer = setTimeout(() => {
        mpinFocusRef.current?.querySelector('input')?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showMpinSetup, showMpinLogin]);



  const handleOtpChange = useCallback((val: string) => {
    const numericOnly = val.replace(/\D/g, '').slice(0, 6);
    setOtp(numericOnly);
    if (numericOnly.length === 6) {
      dismissKeyboard();
    }
    setOtpError((prev) => (prev ? "" : prev));
  }, []);

  // Determine which error type for styling
  const isPredictableError = mpinError.includes("predictable");
  const isMismatchError = mpinError.includes("close");


  if (isAuthChecking) {
    return (
      <div className="h-full w-full flex items-center justify-center safe-top"
        style={{
          backgroundColor: '#0a0a12',
          backgroundImage: `url(${mainBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="flex flex-col items-center animate-pulse">
          <img src={logo} alt="grid.pe" className="h-12 mb-3 dark:invert-0 invert" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 h-full w-full onboarding-container overflow-y-auto overscroll-y-none flex flex-col safe-top"
      style={{
        backgroundColor: '#0a0a12',
        backgroundImage: `url(${mainBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
      >
        {/* Logo Section - only show for phone/OTP screens */}
        {!showMpinSetup && !showMpinLogin && (
          <div className="flex flex-col items-center px-6 pt-16 pb-20">
            <div className="animate-fade-in flex flex-col items-center" style={{ animationDelay: "0.1s" }}>
              <img src={logo} alt="grid.pe" className="h-12 mb-3 dark:invert-0 invert" />
              <p className="text-foreground text-[18px] font-normal text-center">
                Cash access, reimagined.
              </p>
            </div>
          </div>
        )}

        {/* Form Section */}
        <div className={`px-6 safe-bottom pb-4 space-y-6 flex-1 flex flex-col ${(showMpinSetup || showMpinLogin) ? 'pt-4' : ''}`}>
          {/* Phone Input Screen */}
          {!showOtpInput && !showMpinSetup && !showMpinLogin && (
            <>
              <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <h2 className="text-[26px] font-medium text-foreground">Let's get started!</h2>
                <p className="text-muted-foreground text-[14px] font-normal">
                  We'll send a one-time code for instant access.
                </p>
              </div>

              <div 
                className="animate-fade-in space-y-2" 
                style={{ animationDelay: "0.3s" }}
                onPointerDown={() => phoneInputRef.current?.focus()}
                onTouchStart={() => phoneInputRef.current?.focus()}
              >
                <PhoneInput
                  ref={phoneInputRef}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  countryCode="+91"
                  placeholder="Enter your mobile number"
                  error={!!phoneError}
                />
                {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
              </div>

              <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <Button
                  variant="gradient"
                  className="w-full h-[48px] rounded-full text-[16px] font-medium font-sans"
                  onClick={handleRequestOTP}
                  disabled={isLoading || phoneNumber.length === 0}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : "Request OTP"}
                </Button>
              </div>

              <div className="flex items-center gap-4 animate-fade-in py-2" style={{ animationDelay: "0.5s" }}>
                <span className="text-muted-foreground text-sm w-full text-center">or</span>
              </div>

              <div className="flex justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
                <button
                  onClick={() => handleSocialLogin('google')}
                  className="w-[52px] h-[52px] opacity-80 hover:opacity-100 transition-opacity"
                  disabled={isLoading}
                >
                  <img src={iconGoogle} alt="Google" className="w-full h-full" />
                </button>
                <div className="w-[52px] h-[52px] opacity-80">
                  <img src={iconApple} alt="" className="w-full h-full" />
                </div>
                <div className="w-[52px] h-[52px] opacity-80">
                  <img src={iconX} alt="" className="w-full h-full" />
                </div>
              </div>


              {/* Legal text removed from here, moved to footer */}
            </>
          )}

          {/* OTP Input Screen */}
          {showOtpInput && !showMpinSetup && !showMpinLogin && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h2 className="text-[26px] font-medium text-foreground">Enter your OTP</h2>
                <p className="text-muted-foreground text-[14px] font-normal">
                  Code sent to <span className="text-link">+91 {phoneNumber}</span>
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 py-4" ref={otpInputRef}>
                <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} inputMode="numeric" pattern="[0-9]*" type="tel" ref={otpFocusRef as any}>
                  <InputOTPGroup className="gap-[8px]">
                    {[0, 1, 2, 3, 4, 5].map(index => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={`h-[48px] w-[48px] rounded-[7px] text-2xl font-semibold transition-all bg-cover bg-center
                        text-black dark:text-white
                        ${otpError
                            ? 'border border-red-500 ring-1 ring-red-500'
                            : 'bg-[#F7F8FA] border border-[#E6E8EB] dark:bg-transparent dark:border-none dark:ring-1 dark:ring-white/10'
                          }`}
                        style={{
                          backgroundImage: otpInputBg ? `url(${otpInputBg})` : 'none',
                          backgroundColor: otpInputBg ? 'transparent' : undefined // Fallback handled by class
                        }}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {otpError && (
                  <p className="text-red-500 text-[14px] font-normal self-start pl-2 w-full max-w-[360px] mx-auto text-left">
                    {otpError}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-sm px-1">
                <button
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp("");
                    setOtpError("");
                  }}
                  className="text-link hover:underline"
                >
                  Wrong number? Fix it here.
                </button>
                <button
                  onClick={() => {
                    if (resendTimer === 0) {
                      setOtp(""); // Clear previous OTP
                      handleRequestOTP();
                    }
                  }}
                  disabled={resendTimer > 0}
                  className={`${resendTimer > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-link hover:underline'}`}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <Button
                variant="gradient"
                className="w-full h-[48px] text-[16px] font-medium font-sans rounded-full"
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : "Continue"}
              </Button>

              <div className="flex items-center gap-4 py-2">
                <span className="text-muted-foreground text-sm w-full text-center">or</span>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleSocialLogin('google')}
                  className="w-[52px] h-[52px] opacity-80 hover:opacity-100 transition-opacity"
                  disabled={isLoading}
                >
                  <img src={iconGoogle} alt="Google" className="w-full h-full" />
                </button>
                <div className="w-[52px] h-[52px] opacity-80">
                  <img src={iconApple} alt="" className="w-full h-full" />
                </div>
                <div className="w-[52px] h-[52px] opacity-80">
                  <img src={iconX} alt="" className="w-full h-full" />
                </div>
              </div>


              {/* Legal text removed from here, moved to footer */}
            </div>
          )}

          {/* MPIN Login Screen */}
          {showMpinLogin && (
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
              <div className="space-y-3">
                <InputOTP
                  maxLength={4}
                  value={mpin}
                  onChange={handleMpinChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="tel"
                  ref={mpinFocusRef as any}
                >
                  <InputOTPGroup className="w-[364px] justify-between">
                    {[0, 1, 2, 3].map(index => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={`h-[54px] w-[81px] rounded-[12px] text-2xl font-semibold transition-all bg-cover bg-center 
                        text-black dark:text-white 
                        bg-[#F7F8FA] border border-[#E6E8EB] 
                        dark:bg-[#1a1a2e]/50 dark:border-none dark:ring-1 dark:ring-white/10`}
                        render={({ char, isActive }) => (
                          <div className="flex items-center justify-center w-full h-full">
                            {char
                              ? (maskedIndices.has(index) ? '•' : char)
                              : null
                            }
                            {isActive && <div className="w-px h-6 bg-white animate-pulse" />}
                          </div>
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* General Error Message */}
              {generalError && (
                <p className="text-red-500 text-[14px] font-normal text-center pb-2">
                  {generalError}
                </p>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Unlock Button */}
              <Button
                variant="gradient"
                className="w-full h-[48px] text-[16px] font-medium font-sans rounded-full"
                onClick={() => handleLoginMpinVerification()}
                disabled={isLoading || mpin.length < 4}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Unlocking...
                  </span>
                ) : "Unlock"}
              </Button>

              <div className="flex flex-col gap-2 items-center safe-bottom pb-4">
                <button
                  onClick={() => navigate('/forgot-mpin')}
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
          {import.meta.env.DEV && !showMpinSetup && !showOtpInput && !showMpinLogin && (
            <div className="px-6 pb-2 text-xs text-muted-foreground break-all opacity-50">
              <p>Project: {import.meta.env.VITE_SUPABASE_URL}</p>
              <p>Platform: {Capacitor.getPlatform()}</p>
            </div>
          )}

          {/* MPIN Setup Screen */}
          {showMpinSetup && (
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
              <div className="space-y-3">
                <p className="text-black dark:text-foreground text-[14px] font-normal">Create a secure 4 digit MPIN</p>
                <InputOTP
                  maxLength={4}
                  value={mpin}
                  onChange={handleMpinChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="tel"
                  ref={mpinFocusRef as any}
                >
                  <InputOTPGroup className="w-[364px] justify-between">
                    {[0, 1, 2, 3].map(index => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className={`h-[54px] w-[81px] rounded-[12px] text-2xl font-semibold transition-all bg-cover bg-center 
                        text-black dark:text-white 
                        ${isPredictableError ? 'border border-red-500 ring-1 ring-red-500' :
                            mpinSuccess ? 'bg-transparent border border-green-500 ring-1 ring-green-500 dark:bg-transparent' :
                              'bg-[#F7F8FA] border border-[#E6E8EB] dark:bg-[#1a1a2e]/50 dark:border-none dark:ring-1 dark:ring-white/10'
                          }`}
                        style={{
                          backgroundImage: isPredictableError ? `url(${mpinInputError})` :
                            mpinSuccess ? (mpinInputSuccessAsset ? `url(${mpinInputSuccessAsset})` : 'none') : undefined
                        }}
                        render={({ char, isActive }) => (
                          <div className="flex items-center justify-center w-full h-full">
                            {char
                              ? (maskedIndices.has(index) ? '•' : char)
                              : null
                            }
                            {isActive && <div className="w-px h-6 bg-white animate-pulse" />}
                          </div>
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {isPredictableError && (
                  <p className="text-red-500 text-[14px] font-normal">{mpinError}</p>
                )}
              </div>

              {/* Confirm MPIN */}
              <div className="space-y-3">
                <p className="text-black dark:text-foreground text-[14px] font-normal">Re-enter MPIN</p>
                <InputOTP
                  maxLength={4}
                  value={confirmMpin}
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
                        ${isMismatchError ? 'border border-red-500 ring-1 ring-red-500' :
                            mpinSuccess ? 'bg-transparent border border-green-500 ring-1 ring-green-500 dark:bg-transparent' :
                              'bg-[#F7F8FA] border border-[#E6E8EB] dark:bg-[#1a1a2e]/50 dark:border-none dark:ring-1 dark:ring-white/10'
                          }`}
                        style={{
                          backgroundImage: isMismatchError ? `url(${mpinInputError})` :
                            mpinSuccess ? (mpinInputSuccessAsset ? `url(${mpinInputSuccessAsset})` : 'none') : undefined
                        }}
                        render={({ char, isActive }) => (
                          <div className="flex items-center justify-center w-full h-full">
                            {char
                              ? (confirmMaskedIndices.has(index) ? '•' : char)
                              : null
                            }
                            {isActive && <div className="w-px h-6 bg-white animate-pulse" />}
                          </div>
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {isMismatchError && (
                  <p className="text-red-500 text-[14px] font-normal">{mpinError}</p>
                )}
              </div>

              {/* Biometric Toggle */}
              <div
                className={`flex items-center justify-between px-4 w-full h-[54px] rounded-2xl border-none bg-cover bg-center 
                bg-black dark:bg-transparent`}
                style={{
                  width: '364px', // Explicit width as requested
                  backgroundImage: buttonBiometricBg ? `url(${buttonBiometricBg})` : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <img src={biometricIcon} alt="Biometric" className="w-6 h-6" />
                  <span className="text-white text-[16px] font-medium">Biometric Unlock</span>
                </div>
                <button
                  onClick={() => setBiometricEnabled(!biometricEnabled)}
                  className="transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  <img
                    src={biometricEnabled ? toggleOn : toggleOff}
                    alt={biometricEnabled ? "Enabled" : "Disabled"}
                    className="w-12 h-6"
                  />
                </button>
              </div>

              {/* Note */}
              <p className="text-black dark:text-muted-foreground text-[14px] font-normal leading-relaxed">
                Note: While creating an MPIN is necessary, Biometric unlock can be enabled for an extra step of security. You can setup Biometric unlock later from Account Settings &gt; Biometric Unlock.
              </p>

              {/* Spacer */}
              <div className="flex-1" />

              {/* General Error Message */}
              {generalError && (
                <p className="text-red-500 text-[14px] font-normal text-center pb-2">
                  {generalError}
                </p>
              )}

              {/* Setup Button */}
              <Button
                variant="gradient"
                className="w-full h-[48px] text-[16px] font-medium font-sans rounded-full"
                onClick={handleSetupMpin}
                disabled={isLoading || mpin.length < 4 || confirmMpin.length < 4 || !!mpinError || !mpinSuccess}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Setting up...
                  </span>
                ) : "Setup"}
              </Button>

              <button
                onClick={handleLogout}
                className="w-full text-center text-muted-foreground text-sm hover:text-white transition-colors safe-bottom pb-4"
              >
                Not you? Use a different number
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Legal Footer */}
      {!showMpinSetup && !showMpinLogin && (
        <>
          <div style={{ flex: 1 }} />
          <div 
            className="text-center px-6 safe-bottom"
          >
            <p className="text-black dark:text-muted-foreground leading-relaxed font-normal text-[16px]">
              By continuing, you agree to Grid.Pe's<br />
              <button onClick={() => navigate('/legal/terms')} className="text-[#5260FE] font-bold">Terms & Conditions</button>{" "}
              and{" "}
              <button onClick={() => navigate('/legal/privacy')} className="text-[#5260FE] font-bold">Privacy Policy</button>
            </p>
          </div>
        </>
      )}
    </div >
  );
};

export default OnboardingScreen;