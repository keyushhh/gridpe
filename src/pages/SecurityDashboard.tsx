import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackButton from "@/components/ui/BackButton";
import { ChevronRight } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import bgDarkMode from "@/assets/bg-dark-mode.png";
import bannerIncomplete from "@/assets/banner-incomplete.png";
import bannerPending from "@/assets/banner-pending.png";
import bannerComplete from "@/assets/banner-complete.png";
import kycAlertIcon from "@/assets/kyc-alert-icon.png";
import kycBadge from "@/assets/kyc-badge.png";
import kycIconMenu from "@/assets/kyc-icon-menu.png";
import biometricIcon from "@/assets/biometric-icon-menu.png";
import mpinIcon from "@/assets/mpin-icon.png";
import deleteAccountIcon from "@/assets/delete-account-icon.png";
import toggleActive from "@/assets/toggle-active.png";
import toggleInactive from "@/assets/toggle-inactive.png";
import Lottie from "lottie-react";
import { useTheme } from "next-themes";
import { useAsset } from "@/hooks/useAsset";
import gridpeRadarAnimation from "@/assets/gridpe-radar.json";
import errorRadarAnimation from "@/assets/error.json";
import inProgressRadarAnimation from "@/assets/in-progress.json";
import MpinSheet from "@/components/MpinSheet";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { hapticLight } from "@/utils/haptics";
import { Capacitor } from "@capacitor/core";
import { useWebScroll } from "@/hooks/useWebScroll";

const SecurityDashboard = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const location = useLocation();
  const originPath = (location.state as any)?.originPath || "/settings";
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme !== 'light';
  const { profile, kycStatus, biometricEnabled, setBiometricEnabled } = useUser();
  const [showMpinSheet, setShowMpinSheet] = useState(false);
  const [showMpinForBiometric, setShowMpinForBiometric] = useState(false);

  // Local device-level gate state, initialized from localStorage
  const [isDeviceEnabled, setIsDeviceEnabled] = useState(() => {
    return localStorage.getItem('biometrics_enabled') === 'true';
  });

  // Get assets via useAsset for theme support
  const securityCompleteAsset = useAsset("security-complete");
  const securityPendingAsset = useAsset("security-pending");
  const securityIncompleteAsset = useAsset("security-incomplete");
  const mainBg = useAsset("main-bg");

  const getStatusBanner = () => {
    // Shared Color Schema with Settings.tsx (21% opacity bg, 100% border)
    const colors: Record<string, string> = {
      incomplete: "#FF1E1E",
      pending: "#FF1E1E",
      in_review: "#FACC15",
      verified: "#1CB956"
    };

    const statusLabel = {
      incomplete: "Security Breach-ish.",
      pending: "Security Breach-ish.",
      in_review: "In Progress…",
      verified: "Looks Good!"
    };

    const statusSubtext = {
      incomplete: "Some settings need your attention. Give ‘em a tap.",
      pending: "Some settings need your attention. Give ‘em a tap.",
      in_review: "We’re working our magic. Check back soon.",
      verified: "Your security setup looks good and completed."
    };

    const currentColor = colors[kycStatus] || colors.incomplete;
    const bannerBg = `rgba(${parseInt(currentColor.slice(1, 3), 16)}, ${parseInt(currentColor.slice(3, 5), 16)}, ${parseInt(currentColor.slice(5, 7), 16)}, 0.21)`;

    return (
      <div
        className={`w-full min-h-[80px] rounded-xl flex items-center justify-between px-4 cursor-pointer relative ${containerOverflow} backdrop-blur-[25px] border transition-all duration-300`}
        style={{
          backgroundColor: bannerBg,
          borderColor: currentColor,
          borderWidth: '0.63px',
          paddingTop: '17px',
          paddingLeft: '17px',
          paddingBottom: '15px'
        }}
        onClick={kycStatus !== 'verified' ? () => navigate("/kyc-intro") : undefined}
      >
        <div className="flex flex-col justify-center w-full h-full relative z-10">
          <div className="flex items-center gap-2">
            {!isDarkMode ? (
              <div
                className="w-[24px] h-[24px]"
                style={{
                  backgroundColor: currentColor,
                  WebkitMaskImage: `url(${kycBadge})`,
                  maskImage: `url(${kycBadge})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
              />
            ) : (
              <img src={kycBadge} className="w-[24px] h-[24px] object-contain" alt="Badge" />
            )}
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-medium font-sans`}
            >
              {statusLabel[kycStatus]}
            </span>
          </div>
          <span className={`${isDarkMode ? 'text-[#7E7E7E]' : 'text-black/50'} text-[13px] font-normal font-sans mt-[2px]`}>
            {statusSubtext[kycStatus]}
          </span>
        </div>
      </div>
    );
  };

  const handleKycClick = () => {
    if (kycStatus !== 'verified') {
      navigate("/kyc-intro");
    } else {
      navigate("/kyc-status-complete");
    }
  };

  const handleBiometricToggle = async () => {
    try { await hapticLight(); } catch (_) { /* non-critical */ }
    
    if (isDeviceEnabled) {
      // Disable locally + sync to Supabase
      localStorage.setItem('biometrics_enabled', 'false');
      setIsDeviceEnabled(false);
      await setBiometricEnabled(false);
      toast.success("Biometric unlock disabled on this device");
    } else {
      // Enable
      try {
        const availability = await BiometricAuth.checkBiometry();
        console.log('Biometry check result:', JSON.stringify(availability, null, 2));
        console.log(`Platform: ${Capacitor.getPlatform()}, Available: ${availability.isAvailable}, Type: ${availability.biometryType}, Reason: ${availability.reason || 'none'}`);
        
        if (!availability.isAvailable) {
          const reason = availability.reason || "Biometric authentication is not available on this device";
          console.warn('Biometry unavailable:', reason);
          toast.error(reason);
          return;
        }
        // Collect MPIN first
        setShowMpinForBiometric(true);
      } catch (error: any) {
        console.error('Android Biometric Error:', JSON.stringify(error, null, 2));
        toast.error(error?.message || "Failed to check biometric availability");
      }
    }
  };

  const onMpinVerifySuccess = async (mpin?: string) => {
    if (!mpin) return;

    try {
      // Wrap authenticate() in a timeout so the UI doesn't hang
      // if the native biometric prompt fails to appear on Android
      const authPromise = BiometricAuth.authenticate({
        reason: "Confirm your identity to enable biometrics",
        cancelTitle: "Cancel"
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Biometric prompt timed out. Please try again.")), 30000)
      );

      await Promise.race([authPromise, timeoutPromise]);

      // On Success — persist to local, context state, Supabase, and secure storage
      localStorage.setItem('biometrics_enabled', 'true');
      setIsDeviceEnabled(true);
      await setBiometricEnabled(true);
      await SecureStorage.set('mpin', mpin);
      
      toast.success("Biometric unlock enabled!");
    } catch (error: any) {
      console.error('Biometric authentication failed:', JSON.stringify(error, null, 2));
      toast.error(error?.message || "Authentication failed or cancelled");
    } finally {
      setShowMpinForBiometric(false);
    }
  };

  const renderSubmenu = () => {
    // Menu Config
    const rowHeight = "h-[68px]";
    const paddingClass = "pt-[7px] pb-[7px] pl-[18px]"; // Padding: top 7, bottom 7, left 18
    const chevronClass = `${isDarkMode ? 'text-[#7E7E7E]' : 'text-black'} w-5 h-5 mr-[10px]`;
    const iconClass = `w-[20px] h-[20px] object-contain ${!isDarkMode ? 'filter brightness-0' : ''}`; // Icon 20x20
    const headerClass = `${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`; // Header Medium 14
    const subTextClass = `${isDarkMode ? 'text-[#7E7E7E]' : 'text-black/50'} text-[12px] font-normal font-sans leading-tight`; // Sub Regular 12
    const textGap = "gap-[5px]"; // Space between header and sub-text
    const textWrapperClass = "flex flex-col justify-center pr-[56px]"; // Line break 56px from right

    // KYC Row Logic
    let kycBg = isDarkMode ? "#0B0B0B" : "#FFFFFF";
    let kycBorder = isDarkMode ? "none" : "1px solid #E9EAEB";
    let kycIcon = kycIconMenu;

    // Override for light mode KYC
    if (!isDarkMode) {
      if (kycStatus === "incomplete" || kycStatus === "pending") {
        kycBg = "rgba(255, 30, 30, 0.15)";
        kycBorder = "none";
      } else if (kycStatus === "in_review") {
        kycBg = "rgba(250, 204, 21, 0.15)";
        kycBorder = "none";
      }
    } else {
      // Dark Mode logic
      if (kycStatus === "incomplete" || kycStatus === "pending") {
        kycBg = "rgba(255, 30, 30, 0.12)";
        kycIcon = kycAlertIcon;
      } else if (kycStatus === "in_review") {
        kycBg = "rgba(250, 204, 21, 0.12)";
      }
    }

    return (
      <div className="flex flex-col gap-[4px] w-full">

        {/* ROW 1: KYC */}
        <div
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} cursor-pointer rounded-t-xl rounded-b-none`}
          style={{ backgroundColor: kycBg, border: kycBorder }}
          onClick={handleKycClick}
        >
          <div className="flex items-center gap-4 w-full">
            <img src={kycIcon} alt="KYC" className={iconClass} />
            <div className={`${textWrapperClass} ${textGap} w-full`}>
              <span className={headerClass}>KYC</span>
              <span className={subTextClass}>KYC also unlocks wallet limits, faster refunds, and your inner peace.</span>
            </div>
          </div>
          <ChevronRight className={chevronClass} />
        </div>

        {/* ROW 2: MPIN */}
        <div
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} ${isDarkMode ? 'bg-[#0B0B0B]' : 'bg-white'} cursor-pointer`}
          style={!isDarkMode ? { border: '1px solid #E9EAEB' } : {}}
          onClick={() => setShowMpinSheet(true)}
        >
          <div className="flex items-center gap-4 w-full">
            <img src={mpinIcon} alt="MPIN" className={iconClass} />
            <div className={`${textWrapperClass} ${textGap} w-full`}>
              <span className={headerClass}>MPIN</span>
              <span className={subTextClass}>No birthdays, no 1234. We're judging you silently.</span>
            </div>
          </div>
          <ChevronRight className={chevronClass} />
        </div>

        {/* ROW 3: Biometric */}
        <div
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} ${isDarkMode ? 'bg-[#0B0B0B]' : 'bg-white'} cursor-pointer relative z-50`}
          style={!isDarkMode ? { border: '1px solid #E9EAEB' } : {}}
          onClick={handleBiometricToggle}
        >
          <div className="flex items-center gap-4 w-full">
            <img src={biometricIcon} alt="Biometric" className={iconClass} />
            <div className={`${textWrapperClass} ${textGap} w-full`}>
              <span className={headerClass}>Biometric Unlock</span>
              <span className={subTextClass}>
                Don’t worry, your face/finger data stays on your phone. We don’t want it. Promise!
              </span>
            </div>
          </div>
          {/* Toggle Switch — z-50 ensures it's above any transparent overlay on Android WebView */}
          <div className="mr-[10px] flex items-center justify-center shrink-0 relative z-50">
            <Switch
              checked={isDeviceEnabled}
              onCheckedChange={handleBiometricToggle}
            />
          </div>
        </div>

        {/* ROW 4: Delete Account */}
        <div
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} ${isDarkMode ? 'bg-[#0B0B0B]' : 'bg-white'} cursor-pointer rounded-t-none rounded-b-xl`}
          style={!isDarkMode ? { border: '1px solid #E9EAEB' } : {}}
          onClick={() => navigate("/delete-account", { state: { originPath } })}
        >
          <div className="flex items-center gap-4 w-full">
            <img src={deleteAccountIcon} alt="Delete" className={iconClass} />
            <div className={`${textWrapperClass} ${textGap} w-full`}>
              <span className={headerClass}>Delete Account</span>
              <span className={subTextClass}>Thinking of leaving? It's okay, we can handle heartbreak.</span>
            </div>
          </div>
          <ChevronRight className={chevronClass} />
        </div>

      </div>
    );
  };

  const getRadarAnimation = () => {
    switch (kycStatus) {
      case "incomplete":
      case "pending":
        return errorRadarAnimation;
      case "in_review":
        return inProgressRadarAnimation;
      case "verified":
        return gridpeRadarAnimation;
      default:
        return gridpeRadarAnimation;
    }
  };

  return (
    <div
      className={`h-full w-full ${containerOverflow} flex flex-col relative`}
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        backgroundImage: isDarkMode ? `url(${mainBg})` : 'none',
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Light Mode Status Blob (Top Glow) */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: kycStatus === "verified" ? "#1CB956" : kycStatus === "in_review" ? "#FACC15" : "#FF1E1E",
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}
      {/* Header - Fixed */}
      <div className="px-5 safe-top pt-4 flex items-center justify-between relative z-50 flex-none">
        <BackButton onClick={() => navigate(originPath)} />

        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans`}>Security & Kyc</h1>
        <div className="w-10 h-10" /> {/* Spacer for centering */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* Radar Animation Section */}
        <div className="shrink-0 h-[280px] mb-3 flex flex-col items-center justify-center relative">
          <div className="w-[254px] h-[254px] flex items-center justify-center relative">
            {/* Replicated 5-circle structure for both modes to ensure consistent size */}
            {/* 5th Circle (Outer) */}
            <div
              className="absolute w-[254px] h-[254px] rounded-full"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'radial-gradient(3608.4% 302.56% at 50% 50%, rgba(204, 208, 255, 0.04) 0%, rgba(255, 255, 255, 0) 100%) padding-box, radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(91, 64, 186, 0.17) 100%) border-box'
                  : 'rgba(255,255,255,0.02) padding-box, rgba(255,255,255,0.1) border-box',
              }}
            />
            {/* 4th Circle */}
            <div
              className="absolute w-[234px] h-[234px] rounded-full"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'radial-gradient(211.71% 133.97% at 50% 50%, #E8EAFF 0%, rgba(255, 255, 255, 0) 100%) padding-box, radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(91, 64, 186, 0.17) 100%) border-box'
                  : 'rgba(255,255,255,0.01) padding-box, rgba(255,255,255,0.08) border-box',
              }}
            />
            {/* 3rd Circle */}
            <div
              className="absolute w-[180px] h-[180px] rounded-full"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'radial-gradient(211.71% 133.97% at 50% 50%, #E4E6FF 0%, rgba(255, 255, 255, 0) 100%) padding-box, radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(91, 64, 186, 0.17) 100%) border-box'
                  : 'rgba(255,255,255,0.01) padding-box, rgba(255,255,255,0.06) border-box',
              }}
            />
            {/* 2nd Circle */}
            <div
              className="absolute w-[126px] h-[126px] rounded-full"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'radial-gradient(211.71% 133.97% at 50% 50%, #E8EAFF 0%, rgba(255, 255, 255, 0) 100%) padding-box, radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(91, 64, 186, 0.17) 100%) border-box'
                  : 'rgba(255,255,255,0.01) padding-box, rgba(255,255,255,0.04) border-box',
              }}
            />
            {/* 1st Circle */}
            <div
              className="absolute w-[72px] h-[72px] rounded-full"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'radial-gradient(50% 50% at 50% 50%, rgba(82, 96, 254, 0.2) 0%, rgba(82, 96, 254, 0.034) 100%) padding-box, radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(91, 64, 186, 0.17) 100%) border-box'
                  : 'rgba(82, 96, 254, 0.1) padding-box, rgba(255,255,255,0.05) border-box',
              }}
            />
            {/* Center Dot (5px) */}
            <div
              className="absolute w-[5px] h-[5px] rounded-full z-20"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'rgba(255, 255, 255, 1) padding-box, radial-gradient(50% 50% at 50% 50%, #5260FE 0%, rgba(82, 96, 254, 0.17) 100%) border-box'
                  : 'rgba(255,255,255,1) padding-box, #5260FE border-box',
              }}
            />
            <Lottie
              key={kycStatus}
              animationData={getRadarAnimation()}
              loop={true}
              className="w-full h-full relative z-10"
              style={{
                transform: "scale(1.1)",
              }}
            />
          </div>
        </div>

        {/* Content Container */}
        <div className="px-5 flex flex-col gap-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>

          {/* Dynamic KYC Banner */}
          {getStatusBanner()}

          {/* Submenu */}
          {renderSubmenu()}

        </div>
      </div>

      {/* MPIN Sheet Modal */}
      {showMpinSheet && (
        <MpinSheet
          onClose={() => setShowMpinSheet(false)}
          mode="verify"
          onSuccess={(mpin) => {
            setShowMpinSheet(false);
            navigate('/security/mpin-settings');
          }}
        />
      )}

      {/* MPIN Sheet for Biometric Enrollment */}
      {showMpinForBiometric && (
        <MpinSheet
          onClose={() => setShowMpinForBiometric(false)}
          mode="verify"
          onSuccess={onMpinVerifySuccess}
        />
      )}
    </div>
  );
};

export default SecurityDashboard;
