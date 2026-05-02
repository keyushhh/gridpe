import { useNavigate , Navigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import BackButton from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import Skeleton from 'react-loading-skeleton';
import { ChevronRight, Pencil, Lock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAsset } from "@/hooks/useAsset";
import { useUser } from "@/contexts/UserContext";
import { getCards } from "@/utils/cardUtils";
import { fetchBankAccounts } from "@/lib/banking";
import { supabase } from "@/lib/supabase";
import avatarImg from "@/assets/avatar.png";
import gridPeLogo from "@/assets/grid.pe.svg";
import iconSecurity from "@/assets/icon-security.svg";
import iconLinkedCards from "@/assets/icon-linked-cards.svg";
import iconBankAcc from "@/assets/icon-bank-acc.svg";
import iconNotifications from "@/assets/icon-notifications.svg";
import iconDarkMode from "@/assets/icon-dark-mode.svg";
import iconLogout from "@/assets/icon-logout.svg";
import verifiedPng from "@/assets/verified.png";
// import securityIncomplete from "@/assets/security-incomplete.png";
// import securityComplete from "@/assets/security-complete.png";
// import securityPending from "@/assets/security-pending.png";
import { Switch } from "@/components/ui/switch";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import darkbgCta from "@/assets/darkbg-cta.png";
import DiditSDK from '@didit-protocol/sdk-web';
import { useWebScroll } from "@/hooks/useWebScroll";

type SecurityStatus = "verified" | "in_review" | "pending" | "incomplete";

const getSecurityConfig = (status: SecurityStatus, assets: { complete: string, pending: string, incomplete: string }, isDarkMode: boolean) => {
  
  // Base styles for the frame
  const baseFrame = "w-10 h-10 rounded-full flex items-center justify-center border";

  // Shared Color Schema (21% opacity bg, 100% border)
  const colors = {
    verified: { 
      bg: "rgba(28, 185, 86, 0.21)", // #1CB956
      border: "#1CB956",
      text: isDarkMode ? "text-green-500" : "text-[#0B902B]"
    },
    pending: { 
      bg: "rgba(250, 204, 21, 0.21)", // #FACC15
      border: "#FACC15",
      text: isDarkMode ? "text-yellow-500" : "text-[#FACC15]"
    },
    incomplete: { 
      bg: "rgba(255, 30, 30, 0.21)", // #FF1E1E
      border: "#FF1E1E",
      text: isDarkMode ? "text-red-400" : "text-[#FF1E1E]"
    }
  };

  const state = status === "verified" ? "verified" : (status === "in_review" || status === "pending" ? "pending" : "incomplete");
  const config = colors[state];

  return {
    bg: assets[status === "verified" ? "complete" : (status === "in_review" || status === "pending" ? "pending" : "incomplete")],
    label: status === "verified" ? "Account secured" : (status === "in_review" || status === "pending" ? "Pending" : "Incomplete"),
    textColor: config.text,
    bannerBg: config.bg,
    bannerBorder: config.border,
    frameClass: isDarkMode ? "w-10 h-10 flex items-center justify-center" : `${baseFrame} border-[${config.border}]`,
    frameStyle: isDarkMode ? {} : { backgroundColor: config.bg, borderColor: config.border },
    blobColor: isDarkMode ? null : config.border
  };
};

// ðŸ”” haptic helper (safe on all platforms)
const triggerHaptic = () => {
  if (navigator?.vibrate) {
    navigator.vibrate(10);
  }
};

const Settings = () => {
  const navigate = useNavigate();
  const { showToaster } = useCustomToaster();
  const { resolvedTheme, setTheme } = useTheme();
  // Ensure we have a default boolean for the switch (true for dark)
  const isDarkMode = resolvedTheme !== 'light';
  const { containerOverflow } = useWebScroll();

  const { phoneNumber, email, kycStatus, resetForDemo, name, profileImage, profile } = useUser();
  const userId = profile?.id;
  const [pushNotifications, setPushNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [bankAccountCount, setBankAccountCount] = useState(0);

  const mainBg = useAsset("main-bg");
  const securityCompleteAsset = useAsset("security-complete");
  const securityPendingAsset = useAsset("security-pending");
  const securityIncompleteAsset = useAsset("security-incomplete");
  const [isLoading, setIsLoading] = useState(true);
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      App.getInfo().then(info => {
        setAppVersion(info.version);
      }).catch(() => {
        setAppVersion('1.0.0');
      });
    }
  }, []);

  const iconEdit = useAsset("icon-edit");
  const iconLinkedCards = useAsset("icon-linked-cards");
  const iconBankAcc = useAsset("icon-bank-acc");
  const iconNotifs = useAsset("icon-notifs");
  const iconDarkMode = useAsset("icon-dark-mode");
  const iconLogout = useAsset("icon-logout");
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadCounts = async () => {
      // 1. Bank Accounts
      try {
        const accounts = await fetchBankAccounts(userId || "");
        setBankAccountCount(accounts.length);
      } catch (error) {
        console.error("Error loading bank count:", error);
      }

      // 2. Cards (Local + DB)
      try {
        const localCards = getCards();
        const { count, error } = await supabase
          .from('bank_cards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (error) throw error;

        const dbCount = count || 0;
        setCardCount(localCards.length + dbCount);
      } catch (error) {
        console.error("Error loading card count:", error);
        setCardCount(getCards().length);
      }
    };

    loadCounts().finally(() => {
      setTimeout(() => setIsLoading(false), 500);
    });
  }, []);

  const handleLogoPress = () => {
    longPressTimer.current = setTimeout(() => {
      resetForDemo();
      showToaster("Demo reset! All data cleared.", 'success');
    }, 3000);
  };

  const handleLogoRelease = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Clear Supabase session
      await supabase.auth.signOut();
      
      // 2. Clear Context state
      resetForDemo();

      // 3. Purge Didit Cache & Destroy Instances securely
      if (DiditSDK?.shared?.destroy) {
        DiditSDK.shared.destroy();
      }

      // 4. Clear all storage to ensure zero persistence
      localStorage.clear();
      sessionStorage.clear();
      
      // 5. HARD RESET: Force a full WebView reload to the base origin.
      // This strips the HashRouter history (#/home) and resets the JS environment.
      // After reload, the app starts at / with NO session, ensuring total isolation.
      window.location.href = window.location.origin + window.location.pathname;
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback reload if everything fails
      window.location.href = "/";
    }
  };

  const securityConfig = getSecurityConfig(kycStatus, {
    complete: securityCompleteAsset,
    pending: securityPendingAsset,
    incomplete: securityIncompleteAsset
  }, isDarkMode);

  return (
    <div
      className={`min-h-[100dvh] w-full ${containerOverflow} flex flex-col relative`}
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        // Only show mainBg image in Dark Mode as requested (User wanted White in Light Mode)
        backgroundImage: isDarkMode ? `url(${mainBg})` : 'none',
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light Mode Status Blob (Top Glow) */}
      {!isDarkMode && securityConfig.blobColor && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: securityConfig.blobColor,
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 safe-top pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton onClick={() => navigate("/home")} />
            <h1 className="text-foreground text-[18px] font-semibold">Settings</h1>
          </div>
            <button
            onClick={() => navigate("/help")}
            className={cn(
              "px-4 h-[36px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform overflow-hidden relative",
              isDarkMode ? "glass-container glass-physics-clear grow-0" : "bg-black"
            )}
            style={{
              ...(!isDarkMode ? { backgroundColor: "#000000" } : {}),
              '--glass-specular-intensity': '0.2'
            } as any}
          >
            {isDarkMode && (
              <>
                <div className="glass-lens" />
                <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: 'var(--glass-tint)' }} />
                <span className="glass-rim-v2" />
              </>
            )}
            <span className="relative z-10 text-white text-[14px] font-medium">+ Support</span>
          </button>
        </div>

        {/* Profile */}
        <div className="px-5 mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isLoading ? (
              <Skeleton circle width={56} height={56} />
            ) : (
              <img
                src={profileImage || avatarImg}
                className="w-14 h-14 rounded-full object-cover"
              />
            )}
            <div>
              {isLoading ? (
                <div className="flex flex-col gap-1 w-[160px]">
                  <Skeleton height={20} width="100%" />
                  <Skeleton height={14} width="60%" />
                </div>
              ) : (
                <>
                  <h2 className="text-foreground text-[18px] font-medium">
                    {name || "Guest User"}
                  </h2>
                  <div className="flex items-center gap-1">
                    <span className="text-black dark:text-muted-foreground text-[14px]">{phoneNumber || email}</span>
                    <img
                      src={verifiedPng}
                      className="w-4 h-4 object-contain"
                      alt="Verified"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate("/profile-edit")}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center p-0"
          >
            {iconEdit ? (
              <img src={iconEdit} className="w-full h-full object-cover" />
            ) : (
              <Pencil className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Security */}
        <div className="mx-5 mt-3">
          <div 
            className="rounded-[13px] border backdrop-blur-[25px] min-h-[72px] flex items-center justify-between p-4 transition-all duration-300"
            style={{
              backgroundColor: securityConfig.bannerBg,
              borderColor: securityConfig.bannerBorder,
              borderWidth: '0.63px'
            }}
          >
            <div className="flex items-center gap-3">
              <div className={securityConfig.frameClass} style={securityConfig.frameStyle}>
                {isDarkMode ? (
                  <img src={iconSecurity} className="w-10 h-10 dark:filter-none" />
                ) : (
                  <Lock className="w-[14px] h-[14px] text-black" />
                )}
              </div>
              <div>
                <p className="text-foreground text-[14px] font-medium">Security & KYC</p>
                <p className={`${securityConfig.textColor} text-[12px]`}>
                  {securityConfig.label}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/security-dashboard", { state: { originPath: "/settings" } })}
              className={cn(
                "px-4 h-[32px] flex items-center justify-center rounded-full text-[12px] text-white font-medium active:scale-95 transition-transform overflow-hidden relative",
                isDarkMode ? "glass-container glass-physics-cta min-w-[120px]" : "bg-black"
              )}
              style={!isDarkMode ? { backgroundColor: "#000000" } : {}}
            >
              {isDarkMode && (
                <>
                  <div className="glass-lens" />
                  <div className="absolute inset-0 z-[1] pointer-events-none" style={{ backgroundColor: 'var(--glass-tint)' }} />
                  <span className="glass-rim-v2" />
                </>
              )}
              <span className="relative z-10">Check Security</span>
            </button>
          </div>
        </div>

        {/* PAYMENT SETTINGS */}
        <div className="px-5 mt-6">
          <p className="mb-3.5 text-black dark:text-muted-foreground text-[14px] font-bold tracking-wider">
            PAYMENT SETTINGS
          </p>

          <div className="space-y-4">
            <div className="flex justify-between cursor-pointer" onClick={() => navigate('/cards')}>
              <div className="flex items-start gap-3">
                <img src={iconLinkedCards} className="w-[18px] mt-[2px]" />
                <div>
                  <p className="text-foreground text-[14px]">Linked Cards</p>
                  <p className="text-black dark:text-muted-foreground text-[12px]">
                    {cardCount === 0
                      ? "0 cards saved"
                      : cardCount === 1
                        ? "1 card linked"
                        : `${cardCount} cards linked`}
                  </p>
                </div>
              </div>
              <ChevronRight />
            </div>

            <div className="flex justify-between cursor-pointer" onClick={() => navigate('/banking')}>
              <div className="flex items-start gap-3">
                <img src={iconBankAcc} className="w-[18px] mt-[2px]" />
                <div>
                  <p className="text-foreground text-[14px]">Bank Account Info</p>
                  <p className="text-black dark:text-muted-foreground text-[12px]">
                    {bankAccountCount === 0
                      ? "0 bank accounts linked"
                      : bankAccountCount === 1
                        ? "1 bank account linked"
                        : `${bankAccountCount} bank accounts linked`}
                  </p>
                </div>
              </div>
              <ChevronRight />
            </div>
          </div>
        </div>

        {/* APP PREFERENCES & Footer Container */}
        <div className="flex-1 w-full bg-[#F7F8FA] dark:bg-transparent mt-6 pt-4 flex flex-col">
          <div className="px-5">
            <p className="mb-3.5 text-black dark:text-muted-foreground text-[14px] font-bold tracking-wider">
              APP PREFERENCES
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src={iconNotifs} className="w-[18px] filter brightness-0 dark:invert" />
                  <p className="text-foreground">Notifications</p>
                </div>
                <div className="space-y-4 ml-[30px]">
                  <div className="flex justify-between">
                    <span
                      className={`text-[14px] ${pushNotifications ? "text-foreground" : "text-black dark:text-muted-foreground"
                        }`}
                    >
                      Push Notifications
                    </span>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={(val) => {
                        triggerHaptic();
                        setPushNotifications(val);
                      }}
                    />
                  </div>

                  <div className="flex justify-between">
                    <span
                      className={`text-[14px] ${transactionAlerts ? "text-foreground" : "text-black dark:text-muted-foreground"
                        }`}
                    >
                      Transaction Alerts
                    </span>
                    <Switch
                      checked={transactionAlerts}
                      onCheckedChange={(val) => {
                        triggerHaptic();
                        setTransactionAlerts(val);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={iconDarkMode} className="w-[18px] filter brightness-0 dark:invert" />
                  <span className={isDarkMode ? "text-foreground" : "text-black dark:text-muted-foreground"}>
                    Dark Mode
                  </span>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={(val) => {
                    triggerHaptic();
                    // Handled by onClick for animation, but kept for accessibility/keyboard
                  }}
                  onClick={(e) => {
                    const x = e.clientX;
                    const y = e.clientY;

                    // Set CSS variables for the expansion center
                    document.documentElement.style.setProperty('--x', `${x}px`);
                    document.documentElement.style.setProperty('--y', `${y}px`);

                    // Use View Transition API if available
                    if (document.startViewTransition) {
                      document.startViewTransition(() => {
                        setTheme(isDarkMode ? "light" : "dark");
                      });
                    } else {
                      // Fallback for browsers that don't support View Transitions
                      setTheme(isDarkMode ? "light" : "dark");
                    }
                  }}
                />
              </div>

              <div
                className="flex justify-between cursor-pointer"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-3">
                  <img src={iconLogout} className="w-[18px] filter brightness-0 dark:invert" />
                  <span>Log Out</span>
                </div>
                <ChevronRight />
              </div>
            </div>
          </div>

          {/* Spacer to push footer down */}
          <div className="flex-1 min-h-[40px]" />

          {/* Footer */}
          <div
            className="px-5 safe-bottom pb-4 opacity-40 cursor-pointer"
            onMouseDown={handleLogoPress}
            onMouseUp={handleLogoRelease}
            onMouseLeave={handleLogoRelease}
            onTouchStart={handleLogoPress}
            onTouchEnd={handleLogoRelease}
          >
            <p className="font-satoshi font-black text-[40px] text-foreground leading-none tracking-tight">grid.pe</p>
            <p className="text-sm mt-2">App Version v{appVersion} – 100% drama compatible.</p>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Settings;

