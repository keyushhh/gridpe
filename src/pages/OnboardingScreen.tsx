import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/PhoneInput";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { LockOpen } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import logo from "@/assets/gridpe-logo.svg";
import iconGoogle from "@/assets/icon-google.svg";
import iconApple from "@/assets/icon-apple.svg";
import iconX from "@/assets/frame-2095585539.svg";
import otpInputField from "@/assets/otp-input-field.png";
import toggleOn from "@/assets/toggle-on.svg";
import toggleOff from "@/assets/toggle-off.svg";
import mpinInputSuccess from "@/assets/mpin-input-success.png";
import mpinInputError from "@/assets/mpin-input-error.png";
import buttonBiometricBg from "@/assets/button-biometric-bg.png";
import biometricIcon from "@/assets/biometric-icon.png";
import { isWeakMpin } from "@/utils/validationUtils";
import { hashMpin } from "@/utils/cryptoUtils";
import { supabase } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";
import { Provider, User } from "@supabase/supabase-js";
import { useSignIn, useUser as useClerkUser } from "@clerk/clerk-react";

const OnboardingScreen = () => {

  const navigate = useNavigate();
  const { setPhoneNumber: savePhoneNumber, setMpin: saveMpin, setBiometricEnabled: saveBiometricEnabled, setProfile, profile, mpin: storedMpin, resetForDemo } = useUser();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showMpinSetup, setShowMpinSetup] = useState(false);
  const [showMpinLogin, setShowMpinLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { signIn } = useSignIn();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();


  // Validation State
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // MPIN State
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [mpinError, setMpinError] = useState("");
  const [mpinSuccess, setMpinSuccess] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [generalError, setGeneralError] = useState("");

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
          // If no Supabase session, check if Clerk is still loading
          if (!isClerkLoaded) {
            console.log("Onboarding: No Supabase session, waiting for Clerk...");
            return;
          }

          // If Clerk is loaded and no user, then we can stop checking
          if (!clerkUser) {
            console.log("Onboarding: No active sessions found.");
            setIsAuthChecking(false);
          }
        }
      } catch (e) {
        console.error("Session check failed", e);
        setIsAuthChecking(false);
      }
    };
    checkSession();
  }, [isClerkLoaded, clerkUser]);

  // Supabase Auth Listener (Separate from initial check)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth Event: ${event}`);
      if (event === 'SIGNED_IN' && session?.user) {
        // Explicit Login: treat as Login (isExplicitLogin = true)
        handleSession(session.user, true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Clerk Session Handling
  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      const handleClerkSession = async () => {
        console.log("Clerk User found in Onboarding:", clerkUser.id, clerkUser.primaryEmailAddress?.emailAddress);

        // Map Clerk User to a format similar to Supabase User for handleSession
        const mappedUser: any = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          user_metadata: {
            full_name: clerkUser.fullName,
            name: clerkUser.fullName,
          },
          // Clerk users might not have phone numbers if logged in via Google
          phone: clerkUser.primaryPhoneNumber?.phoneNumber || null
        };

        console.log("Passing mapped Clerk user to handleSession...");
        try {
          await handleSession(mappedUser, true);
        } catch (err) {
          console.error("Error in handleSession for Clerk user:", err);
          setIsAuthChecking(false);
        }
      };

      handleClerkSession();
    }
  }, [clerkUser, isClerkLoaded]);
  // Validation Logic


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

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneToSend,
      });

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
    resetForDemo(); // Reset Context state
    await supabase.auth.signOut();
    localStorage.clear(); // Clear all local storage to be safe
    setPhoneNumber("");
    setOtp("");
    setMpin("");
    setConfirmMpin("");
    setShowMpinSetup(false);
    setShowOtpInput(false);
    setShowMpinLogin(false);
    setGeneralError("");
    navigate("/");
  };

  const handleSession = async (user: User, isExplicitLogin: boolean) => {
    console.log(`handleSession started for user: ${user?.id}, mode: ${isExplicitLogin ? 'LOGIN' : 'RESTORE'}`);

    if (!user) {
      setIsAuthChecking(false);
      return;
    }

    let currentProfile = null;

    // 1. Fetch existing profile
    // Clerk IDs are not UUIDs, which might cause Supabase to error if the id column is UUID.
    // We try to fetch the profile, but catch any "invalid input syntax for type uuid" error.
    let initialProfileData = null;
    let profileError: any = null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      initialProfileData = data;
      profileError = error;
    } catch (err) {
      console.error("HandleSession: Profile fetch threw an error (is user.id a UUID?)", err);
      profileError = { code: 'UNKNOWN', message: 'Profile fetch failed' };
    }


    let profileData = initialProfileData;
    const socialName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.preferred_username;

    // 2. Handle Profile Logic based on Mode
    if (profileError && profileError.code === 'PGRST116') {
      // Profile Not Found
      if (!isExplicitLogin) {
        // Restore Mode: If profile is missing, state is corrupted or incomplete.
        // Sign out to force clean login.
        console.warn("Restore Mode: Profile missing. Signing out to force re-auth.");
        await supabase.auth.signOut();
        setIsAuthChecking(false);
        return;
      }

      // Login Mode: Create new profile (New User)
      console.log("Login Mode: Profile not found, creating new profile...");
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          phone: user.phone || null,
          name: socialName || user.email || null,
          mpin_set: false
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        setIsAuthChecking(false);
        // If we fail to create profile on login, better show error or stay on login
        return;
      }

      profileData = newProfile;
      currentProfile = newProfile;
      setProfile(newProfile);
      console.log('Profile created:', newProfile);
    } else if (profileError) {
      console.error("Error fetching profile:", profileError);
      setIsAuthChecking(false);
      return;
    }

    // Profile Exists (or just created)
    if (profileData) {
      // Optional: Update name if social login provides newer info
      if (socialName && profileData.name !== socialName) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ name: socialName })
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
        console.log("Login Mode: MPIN set. Requesting MPIN.");
        setShowMpinLogin(true);
        setIsAuthChecking(false);
      } else {
        // New User (or incomplete) -> Create MPIN
        console.log("Login Mode: MPIN not set. Showing Setup.");
        setShowOtpInput(false);
        setShowMpinSetup(true);
        setIsAuthChecking(false);
      }
    } else {
      // Restore Mode (App Launch)
      if (isMpinSet) {
        // Valid Session -> Enter MPIN
        console.log("Restore Mode: MPIN set. Requesting MPIN.");
        setShowMpinLogin(true);
        setIsAuthChecking(false);
      } else {
        // Invalid State (Zombie session) -> Sign Out -> Login Screen
        console.log("Restore Mode: MPIN NOT set. Force Sign Out.");
        resetForDemo();
        await supabase.auth.signOut();
        // UI is already on Login Screen (default state), so just ensure cleanup
        setPhoneNumber("");
        setOtp("");
        setShowOtpInput(false);
        setShowMpinSetup(false);
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

      console.log(`Verifying OTP for ${phoneToSend}`);

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
    } catch (err) {
      console.error(err);
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpinChange = (val: string) => {
    const numericOnly = val.replace(/\D/g, '');
    setMpin(numericOnly);
    if (generalError) setGeneralError("");
  };

  const handleConfirmMpinChange = (val: string) => {
    const numericOnly = val.replace(/\D/g, '');
    setConfirmMpin(numericOnly);
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
        .single();

      if (error) {
        console.error("Failed to update MPIN status:", error);
        setGeneralError("Failed to save MPIN. Please try again.");
        setIsLoading(false);
        return;
      }

      console.log("MPIN status updated on server:", updatedProfile);
      setProfile(updatedProfile);

      // Save MPIN to context/storage
      saveMpin(mpin);
      saveBiometricEnabled(biometricEnabled);

      console.log("MPIN Setup Complete!", { biometricEnabled });
      navigate("/home");
    } catch (err) {
      console.error("Unexpected error in MPIN setup:", err);
      setGeneralError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };
  const handleLoginMpinVerification = async () => {
    if (mpin.length < 4) return;
    setIsLoading(true);
    setGeneralError("");

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
          .single();
        targetHash = fetchedProfile?.mpin_hash;
      }

      if (!targetHash) {
        setGeneralError("MPIN not set. Please reset app data.");
        setIsLoading(false);
        return;
      }

      const hashedInput = await hashMpin(mpin);

      if (hashedInput === targetHash) {
        console.log("MPIN Verified. Entering Home.");
        // Only save context if successful
        saveMpin(mpin);
        navigate("/home");
      } else {
        setGeneralError("Incorrect MPIN.");
        setMpin(""); // Clear input
      }
    } catch (e) {
      console.error("Login Verification Error", e);
      setGeneralError("Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: string) => {
    // Social logins are temporarily disabled
    console.log(`${providerName} Login clicked (disabled)`);
  };


  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (phoneError) setPhoneError("");
  };

  const handleOtpChange = (val: string) => {
    setOtp(val);
    if (otpError) setOtpError("");
  };

  // Determine which error type for styling
  const isPredictableError = mpinError.includes("predictable");
  const isMismatchError = mpinError.includes("close");


  if (isAuthChecking) {
    return (
      <div className="h-full w-full flex items-center justify-center safe-area-top safe-area-bottom"
        style={{
          backgroundColor: '#0a0a12',
          backgroundImage: `url(${bgDarkMode})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="flex flex-col items-center animate-pulse">
          <img src={logo} alt="grid.pe" className="h-12 mb-3" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: '#0a0a12',
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Logo Section - only show for phone/OTP screens */}
      {!showMpinSetup && !showMpinLogin && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
          <div className="animate-fade-in flex flex-col items-center" style={{ animationDelay: "0.1s" }}>
            <img src={logo} alt="grid.pe" className="h-12 mb-3" />
            <p className="text-white-foreground text-[18px] font-normal text-center">
              Cash access, reimagined.
            </p>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className={`px-6 pb-8 space-y-6 ${(showMpinSetup || showMpinLogin) ? 'flex-1 flex flex-col pt-12' : ''}`}>
        {/* Phone Input Screen */}
        {!showOtpInput && !showMpinSetup && !showMpinLogin && (
          <>
            <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-[26px] font-medium text-foreground">Let's get started!</h2>
              <p className="text-muted-foreground text-[14px] font-normal">
                We'll send a one-time code for instant access.
              </p>
            </div>

            <div className="animate-fade-in space-y-2" style={{ animationDelay: "0.3s" }}>
              <PhoneInput
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
                className="w-full h-[48px] rounded-full text-[18px] font-medium"
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

            <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-muted-foreground text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="w-[52px] h-[52px] opacity-80">
                <img src={iconGoogle} alt="" className="w-full h-full" />
              </div>
              <div className="w-[52px] h-[52px] opacity-80">
                <img src={iconApple} alt="" className="w-full h-full" />
              </div>
              <div className="w-[52px] h-[52px] opacity-80">
                <img src={iconX} alt="" className="w-full h-full" />
              </div>
            </div>


            <p style={{ animationDelay: "0.7s" }} className="text-center text-white-foreground leading-relaxed animate-fade-in px-4 text-[16px] font-normal">
              By continuing, you agree to Grid.Pe's<br />
              <button onClick={() => navigate('/legal/terms')} className="text-[#5260FE] font-bold">Terms & Conditions</button>{" "}
              and{" "}
              <button onClick={() => navigate('/legal/privacy')} className="text-[#5260FE] font-bold">Privacy Policy</button>
            </p>
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

            <div className="flex flex-col items-center gap-2 py-4">
              <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} autoFocus>
                <InputOTPGroup className="gap-[8px]">
                  {[0, 1, 2, 3, 4, 5].map(index => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={`h-[48px] w-[48px] rounded-[7px] border-none text-2xl font-semibold text-white transition-all bg-cover bg-center ${otpError ? 'border border-red-500 ring-1 ring-red-500' : 'ring-1 ring-white/10'}`}
                      style={{ backgroundImage: `url(${otpInputField})`, backgroundColor: 'transparent' }}
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
                    console.log("Resend OTP");
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
              className="w-full h-[48px] text-[18px] font-medium rounded-full"
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
              <div className="w-[52px] h-[52px] opacity-80">
                <img src={iconGoogle} alt="" className="w-full h-full" />
              </div>
              <div className="w-[52px] h-[52px] opacity-80">
                <img src={iconApple} alt="" className="w-full h-full" />
              </div>
              <div className="w-[52px] h-[52px] opacity-80">
                <img src={iconX} alt="" className="w-full h-full" />
              </div>
            </div>


            <p className="text-center text-muted-foreground leading-relaxed px-4 pt-2 font-normal text-[16px]">
              By continuing, you agree to Grid.Pe's<br />
              <button onClick={() => navigate('/legal/terms')} className="text-[#5260FE] font-bold">Terms & Conditions</button>{" "}
              &{" "}
              <button onClick={() => navigate('/legal/privacy')} className="text-[#5260FE] font-bold">Privacy Policy</button>
            </p>
          </div>
        )}

        {/* MPIN Login Screen */}
        {showMpinLogin && (
          <div className="space-y-6 animate-fade-in flex-1 flex flex-col pt-12">
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
              <InputOTP maxLength={4} value={mpin} onChange={handleMpinChange} autoFocus>
                <InputOTPGroup className="w-[364px] justify-between">
                  {[0, 1, 2, 3].map(index => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={`h-[54px] w-[81px] rounded-[12px] border-none text-2xl font-semibold text-white transition-all bg-cover bg-center ring-1 ring-white/10`}
                      style={{
                        backgroundColor: 'rgba(26, 26, 46, 0.5)'
                      }}
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
              className="w-full h-[48px] text-[18px] font-medium rounded-full"
              onClick={handleLoginMpinVerification}
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

            <div className="flex flex-col gap-2 items-center pb-4">
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
              <p className="text-muted-foreground text-[14px] font-normal">
                Enable quick unlock for faster, secure access using Biometrics or a PIN?
              </p>
            </div>

            {/* Create MPIN */}
            <div className="space-y-3">
              <p className="text-foreground text-[14px] font-normal">Create a secure 4 digit MPIN</p>
              <InputOTP maxLength={4} value={mpin} onChange={handleMpinChange} autoFocus>
                <InputOTPGroup className="w-[364px] justify-between">
                  {[0, 1, 2, 3].map(index => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={`h-[54px] w-[81px] rounded-[12px] border-none text-2xl font-semibold text-white transition-all bg-cover bg-center ${isPredictableError ? 'border border-red-500 ring-1 ring-red-500' :
                        mpinSuccess ? 'ring-1 ring-green-500' : 'ring-1 ring-white/10'
                        }`}
                      style={{
                        backgroundImage: isPredictableError ? `url(${mpinInputError})` :
                          mpinSuccess ? `url(${mpinInputSuccess})` : undefined,
                        backgroundColor: (isPredictableError || mpinSuccess) ? 'transparent' : 'rgba(26, 26, 46, 0.5)'
                      }}
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
              <p className="text-foreground text-[14px] font-normal">Re-enter MPIN</p>
              <InputOTP maxLength={4} value={confirmMpin} onChange={handleConfirmMpinChange}>
                <InputOTPGroup className="w-[364px] justify-between">
                  {[0, 1, 2, 3].map(index => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={`h-[54px] w-[81px] rounded-[12px] border-none text-2xl font-semibold text-white transition-all bg-cover bg-center ${isMismatchError ? 'border border-red-500 ring-1 ring-red-500' :
                        mpinSuccess ? 'ring-1 ring-green-500' : 'ring-1 ring-white/10'
                        }`}
                      style={{
                        backgroundImage: isMismatchError ? `url(${mpinInputError})` :
                          mpinSuccess ? `url(${mpinInputSuccess})` : undefined,
                        backgroundColor: (isMismatchError || mpinSuccess) ? 'transparent' : 'rgba(26, 26, 46, 0.5)'
                      }}
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
              className="flex items-center justify-between px-4 w-full h-[54px] rounded-2xl border-none bg-cover bg-center"
              style={{
                width: '364px', // Explicit width as requested
                backgroundImage: `url(${buttonBiometricBg})`
              }}
            >
              <div className="flex items-center gap-3">
                <img src={biometricIcon} alt="Biometric" className="w-6 h-6" />
                <span className="text-foreground text-[16px] font-medium">Biometric Unlock</span>
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
            <p className="text-muted-foreground text-[14px] font-normal leading-relaxed">
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
              className="w-full h-[48px] text-[18px] font-medium rounded-full"
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
              className="w-full text-center text-muted-foreground text-sm hover:text-white transition-colors pb-4"
            >
              Not you? Use a different number
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;