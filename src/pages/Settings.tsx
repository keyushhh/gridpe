import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { getCards } from "@/utils/cardUtils";
import { getBankAccounts } from "@/utils/bankUtils";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import avatarImg from "@/assets/avatar.png";
import gridPeLogo from "@/assets/grid.pe.svg";
import iconSecurity from "@/assets/icon-security.svg";
import iconLinkedCards from "@/assets/icon-linked-cards.svg";
import iconBankAcc from "@/assets/icon-bank-acc.svg";
import iconNotifications from "@/assets/icon-notifications.svg";
import iconDarkMode from "@/assets/icon-dark-mode.svg";
import iconLogout from "@/assets/icon-logout.svg";
import securityIncomplete from "@/assets/security-incomplete.png";
import securityComplete from "@/assets/security-complete.png";
import securityPending from "@/assets/security-pending.png";
import { Switch } from "@/components/ui/switch";
import { useCustomToaster } from "@/contexts/CustomToasterContext";
import darkbgCta from "@/assets/darkbg-cta.png";

type SecurityStatus = "incomplete" | "pending" | "complete";

const getSecurityConfig = (status: SecurityStatus) => {
  switch (status) {
    case "complete":
      return { bg: securityComplete, label: "Account secured", textColor: "text-green-500" };
    case "pending":
      return { bg: securityPending, label: "Pending", textColor: "text-yellow-500" };
    default:
      return { bg: securityIncomplete, label: "Incomplete", textColor: "text-red-400" };
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
  const { phoneNumber, kycStatus, resetForDemo, name, profileImage } = useUser();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [cardCount, setCardCount] = useState(0);
  const [bankAccountCount, setBankAccountCount] = useState(0);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCardCount(getCards().length);
    setBankAccountCount(getBankAccounts().length);
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
    // Clear session/state
    localStorage.clear();
    // Navigate to authentication screen (Index)
    navigate("/");
  };

  const securityConfig = getSecurityConfig(kycStatus);

  return (
    <div
      className="h-full w-full overflow-y-auto overscroll-y-none flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: "#0a0a12",
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-foreground text-[18px] font-semibold">Settings</h1>
        </div>
        <button
          onClick={() => navigate("/help")}
          className="px-4 py-2 rounded-full flex items-center gap-2 active:scale-95 transition-transform"
          style={{
            backgroundImage: `url(${darkbgCta})`,
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
              <span className="text-muted-foreground text-[14px]">{phoneNumber}</span>
              <span className="text-green-500">✓</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/profile-edit")}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Security */}
      <div className="mx-5 mt-3">
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{
            backgroundImage: `url(${securityConfig.bg})`,
            backgroundSize: "cover",
          }}
        >
          <div className="flex items-center gap-3">
            <img src={iconSecurity} className="w-10 h-10" />
            <div>
              <p className="text-foreground text-[14px] font-medium">Security & KYC</p>
              <p className={`${securityConfig.textColor} text-[12px]`}>
                {securityConfig.label}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/security-dashboard")}
            className="px-4 h-[32px] flex items-center justify-center rounded-full text-[12px] text-white font-medium active:scale-95 transition-transform"
            style={{
              backgroundImage: `url(${darkbgCta})`,
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
        <p className="mb-3.5 text-muted-foreground text-[14px] font-bold tracking-wider">
          PAYMENT SETTINGS
        </p>

        <div className="space-y-4">
          <div className="flex justify-between cursor-pointer" onClick={() => navigate('/cards')}>
            <div className="flex items-start gap-3">
              <img src={iconLinkedCards} className="w-[18px] mt-[2px]" />
              <div>
                <p className="text-foreground text-[14px]">Linked Cards</p>
                <p className="text-muted-foreground text-[12px]">
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
                <p className="text-muted-foreground text-[12px]">
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

      {/* APP PREFERENCES */}
      <div className="px-5 mt-8">
        <p className="mb-3.5 text-muted-foreground text-[14px] font-bold tracking-wider">
          APP PREFERENCES
        </p>

        <div className="space-y-6">
          <div>
            <p className="text-foreground mb-3">Notifications</p>
            <div className="space-y-4 ml-6">
              <div className="flex justify-between">
                <span
                  className={`text-[14px] ${pushNotifications ? "text-foreground" : "text-muted-foreground"
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
                  className={`text-[14px] ${transactionAlerts ? "text-foreground" : "text-muted-foreground"
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

          <div className="flex justify-between">
            <span className={darkMode ? "text-foreground" : "text-muted-foreground"}>
              Dark Mode
            </span>
            <Switch
              checked={darkMode}
              onCheckedChange={(val) => {
                triggerHaptic();
                setDarkMode(val);
              }}
            />
          </div>

          <div
            className="flex justify-between cursor-pointer"
            onClick={handleLogout}
          >
            <span>Log Out</span>
            <ChevronRight />
          </div>
        </div>
      </div>


      {/* Footer */}
      <div
        className="px-5 mt-14 pb-10 opacity-40 cursor-pointer"
        onMouseDown={handleLogoPress}
        onMouseUp={handleLogoRelease}
        onMouseLeave={handleLogoRelease}
        onTouchStart={handleLogoPress}
        onTouchEnd={handleLogoRelease}
      >
        <img src={gridPeLogo} className="h-8" />
        <p className="text-sm">This is not where you find love.</p>
      </div>
    </div>
  );
};

export default Settings;
