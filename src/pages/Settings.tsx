import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pencil, Lock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAsset } from "@/hooks/useAsset";
import { useUser } from "@/contexts/UserContext";
import { getCards } from "@/utils/cardUtils";
import { fetchBankAccounts } from "@/lib/banking";
import { supabase, USER_ID } from "@/lib/supabase";
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

type SecurityStatus = "verified" | "in_review" | "pending" | "incomplete";

const getSecurityConfig = (status: SecurityStatus, assets: { complete: string, pending: string, incomplete: string }, isDarkMode: boolean) => {
  // Base styles for the frame (Light Mode Only)
  const baseFrame = "w-10 h-10 rounded-full flex items-center justify-center border";

  if (isDarkMode) {
    // In Dark Mode, no frame styling (transparent/default)
    return {
      bg: status === "verified" ? assets.complete : (status === "in_review" || status === "pending" ? assets.pending : assets.incomplete),
      label: status === "verified" ? "Account secured" : (status === "in_review" || status === "pending" ? "Pending" : "Incomplete"),
      textColor: status === "verified" ? "text-green-500" : (status === "in_review" || status === "pending" ? "text-yellow-500" : "text-red-400"),
      frameClass: "w-10 h-10 flex items-center justify-center", // No border/bg
      frameStyle: {},
      blobColor: null
    };
  }

  // Light Mode Styles
  switch (status) {
    case "verified":
      return {
        bg: assets.complete,
        label: "Account secured",
        textColor: "text-[#0B902B]",
        frameClass: `${baseFrame} border-[#0B902B]`,
        frameStyle: { backgroundColor: "rgba(28, 185, 86, 0.21)" }, // #1CB956 @ 21%
        blobColor: "#1CB956"
      };
    case "in_review":
    case "pending":
      return {
        bg: assets.pending,
        label: "Pending",
        textColor: "text-[#FACC15]", // Or keep yellow-500? Using hex to match boundary
        frameClass: `${baseFrame} border-[#FACC15]`,
        frameStyle: { backgroundColor: "rgba(250, 204, 21, 0.21)" }, // #FACC15 @ 21%
        blobColor: "#FACC15"
      };
    default: // incomplete
      return {
        bg: assets.incomplete,
        label: "Incomplete",
        textColor: "text-[#FF1E1E]",
        frameClass: `${baseFrame} border-[#FF1E1E]`,
        frameStyle: { backgroundColor: "rgba(255, 30, 30, 0.21)" }, // #FF1E1E @ 21%
        blobColor: "#FF1E1E"
      };
  }
};

// 🔔 haptic helper (safe on all platforms)
const triggerHaptic = () => {
  if (navigator?.vibrate) {
    navigator.vibrate(10);
  }
};

const Settings = () => {
  const navigate = useNavigate();
  const { showToaster } = useCustomToaster();
  const { theme, setTheme } = useTheme();
  // Ensure we have a default boolean for the switch (true for dark)
  const isDarkMode = theme === 'dark' || theme === 'system';

  const { phoneNumber, email, kycStatus, resetForDemo, name, profileImage } = useUser();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [bankAccountCount, setBankAccountCount] = useState(0);

  const mainBg = useAsset("main-bg");
  const securityCompleteAsset = useAsset("security-complete");
  const securityPendingAsset = useAsset("security-pending");
  const securityIncompleteAsset = useAsset("security-incomplete");

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
        const accounts = await fetchBankAccounts();
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
          .eq('user_id', USER_ID);

        if (error) throw error;

        const dbCount = count || 0;
        setCardCount(localCards.length + dbCount);
      } catch (error) {
        console.error("Error loading card count:", error);
        setCardCount(getCards().length);
      }
    };

    loadCounts();
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

  const handleLogout = () => {
    // Purge Didit Cache & Destroy Instances securely
    const { DiditSDK } = window as any;
    if (DiditSDK?.DiditSdk?.shared?.destroy) {
      DiditSDK.DiditSdk.shared.destroy();
    }

    // Clear session/state
    localStorage.clear();
    // Navigate to authentication screen (Index)
    navigate("/");
  };

  const securityConfig = getSecurityConfig(kycStatus, {
    complete: securityCompleteAsset,
    pending: securityPendingAsset,
    incomplete: securityIncompleteAsset
  }, isDarkMode);

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col relative"
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
      <div className="relative z-10 flex flex-col h-full w-full overflow-y-auto touch-pan-y safe-area-top safe-area-bottom">
        {/* Header */}
        <div className="px-5 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="w-10 h-10 rounded-full border border-[#E6E8EB] dark:border-white/20 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-foreground text-[18px] font-semibold">Settings</h1>
          </div>
          <button
            onClick={() => navigate("/help")}
            className="px-4 py-2 rounded-full flex items-center gap-2 active:scale-95 transition-transform"
            style={{
              backgroundImage: isDarkMode ? `url(${darkbgCta})` : "none",
              backgroundColor: isDarkMode ? "transparent" : "#000000",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <span className="text-white text-[14px] font-medium">+ Support</span>
          </button>
        </div>

        {/* Profile */}
        <div className="px-5 mt-[42px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={profileImage || avatarImg}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <h2 className="text-foreground text-[18px] font-medium">
                {name || "No Name? Who are you?"}
              </h2>
              <div className="flex items-center gap-1">
                <span className="text-black dark:text-muted-foreground text-[14px]">{phoneNumber || email}</span>
                <img
                  src={verifiedPng}
                  className="w-4 h-4 object-contain"
                  alt="Verified"
                />
              </div>
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
            className="rounded-[13px] p-4 flex items-center justify-between"
            style={{
              backgroundImage: `url(${securityConfig.bg})`,
              backgroundSize: "cover",
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
              className="px-4 h-[32px] flex items-center justify-center rounded-full text-[12px] text-white font-medium active:scale-95 transition-transform"
              style={{
                backgroundImage: isDarkMode ? `url(${darkbgCta})` : "none",
                backgroundColor: isDarkMode ? "transparent" : "#000000",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              Check Security
            </button>
          </div>
        </div>

        {/* PAYMENT SETTINGS */}
        <div className="px-5 mt-8">
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
        <div className="flex-1 w-full bg-[#F7F8FA] dark:bg-transparent mt-8 pt-4 flex flex-col">
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

          {/* Footer */}
          <div
            className="px-5 mt-32 pb-20 opacity-40 cursor-pointer mt-auto"
            onMouseDown={handleLogoPress}
            onMouseUp={handleLogoRelease}
            onMouseLeave={handleLogoRelease}
            onTouchStart={handleLogoPress}
            onTouchEnd={handleLogoRelease}
          >
            <p className="font-satoshi font-black text-[40px] text-foreground leading-none tracking-tight">grid.pe</p>
            <p className="text-sm mt-2">App Version v1.0.2 — 100% drama compatible.</p>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Settings;
