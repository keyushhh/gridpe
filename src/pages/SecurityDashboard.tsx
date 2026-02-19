import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark' || theme === 'system';
  const { kycStatus, setKycStatus, biometricEnabled, setBiometricEnabled } = useUser();
  const [showMpinSheet, setShowMpinSheet] = useState(false);

  // Get assets via useAsset for theme support
  const securityCompleteAsset = useAsset("security-complete");
  const securityPendingAsset = useAsset("security-pending");
  const securityIncompleteAsset = useAsset("security-incomplete");
  const mainBg = useAsset("main-bg");

  const getStatusBanner = () => {
    // Height 80px, Badge Icon, Centered Header, Secondary Text
    // Padding: top 17px, left 17px, bottom 15px
    const commonClasses = "w-full h-[80px] rounded-xl flex items-center justify-between px-4 cursor-pointer relative overflow-hidden pt-[17px] pl-[17px] pb-[15px]";
    const bgStyle = (img: string) => ({
      backgroundImage: `url(${img})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF'
    });

    const bannerAssets = {
      complete: securityCompleteAsset,
      pending: securityPendingAsset,
      incomplete: securityIncompleteAsset
    };

    const statusLabel = {
      incomplete: "Security Breach-ish.",
      pending: "In Progress…",
      complete: "Looks Good!"
    };

    const statusSubtext = {
      incomplete: "Some settings need your attention. Give ‘em a tap.",
      pending: "We’re working our magic. Check back soon.",
      complete: "Your security setup looks good and completed."
    };

    const statusColor = {
      incomplete: "#FF1E1E",
      pending: "#FACC15",
      complete: "#1CB956"
    };

    return (
      <div
        className={commonClasses}
        style={bgStyle(bannerAssets[kycStatus])}
        onClick={kycStatus === 'incomplete' ? () => navigate("/kyc-intro") : undefined}
      >
        <div className="flex flex-col justify-center w-full h-full">
          <div className="flex items-center gap-2">
            {!isDarkMode ? (
              <div
                className="w-[24px] h-[24px]"
                style={{
                  backgroundColor: statusColor[kycStatus],
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
      if (kycStatus === "incomplete") {
        kycBg = "rgba(255, 30, 30, 0.15)";
        kycBorder = "none";
      } else if (kycStatus === "pending") {
        kycBg = "rgba(250, 204, 21, 0.15)";
        kycBorder = "none";
      }
    } else {
      // Dark Mode logic
      if (kycStatus === "incomplete") {
        kycBg = "rgba(255, 30, 30, 0.12)";
        kycIcon = kycAlertIcon;
      } else if (kycStatus === "pending") {
        kycBg = "rgba(250, 204, 21, 0.12)";
      }
    }

    const handleKycClick = () => {
      if (kycStatus === 'incomplete' || kycStatus === 'pending') {
        navigate("/kyc-intro");
      } else if (kycStatus === 'complete') {
        navigate("/kyc-status-complete");
      }
    };

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
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} ${isDarkMode ? 'bg-[#0B0B0B]' : 'bg-white'}`}
          style={!isDarkMode ? { border: '1px solid #E9EAEB' } : {}}
        >
          <div className="flex items-center gap-4 w-full">
            <img src={biometricIcon} alt="Biometric" className={iconClass} />
            <div className={`flex flex-col justify-center ${textGap} w-full`}>
              <span className={headerClass}>Biometric Unlock</span>
              <span className={subTextClass}>Don’t worry, your face/finger data stays on your phone. We don’t want it. Promise</span>
            </div>
          </div>
          {/* Toggle Wrapper: Increased size and adjusted margin */}
          <div
            className="mr-[10px] cursor-pointer w-[34px] h-[20px] flex items-center justify-center shrink-0"
            onClick={() => setBiometricEnabled(!biometricEnabled)}
          >
            <img
              src={biometricEnabled ? toggleActive : toggleInactive}
              className={`w-full h-full object-contain ${!isDarkMode && !biometricEnabled ? 'filter brightness-0' : ''}`}
              alt="Toggle"
            />
          </div>
        </div>

        {/* ROW 4: Delete Account */}
        <div
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} ${isDarkMode ? 'bg-[#0B0B0B]' : 'bg-white'} cursor-pointer rounded-t-none rounded-b-xl`}
          style={!isDarkMode ? { border: '1px solid #E9EAEB' } : {}}
          onClick={() => navigate("/delete-account", { state: { originPath: "/security-dashboard" } })}
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
        return errorRadarAnimation;
      case "pending":
        return inProgressRadarAnimation;
      case "complete":
        return gridpeRadarAnimation;
      default:
        return gridpeRadarAnimation;
    }
  };

  return (
    <div
      className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom relative"
      style={{
        backgroundColor: isDarkMode ? "#0a0a12" : "#FFFFFF",
        // Remove background image in Dark Mode as requested to fix the "frame" issue.
        backgroundImage: isDarkMode ? 'none' : 'none',
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
            backgroundColor: kycStatus === "complete" ? "#1CB956" : kycStatus === "pending" ? "#FACC15" : "#FF1E1E",
            filter: "blur(60px)",
            opacity: 0.8,
            mixBlendMode: "normal"
          }}
        />
      )}
      {/* Header - Fixed */}
      <div className="px-5 pt-12 flex items-center justify-between relative z-50 flex-none">
        <button
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full border ${isDarkMode ? 'border-white/20 bg-black/20' : 'border-[#E6E8EB] bg-white'} flex items-center justify-center backdrop-blur-md`}
        >
          <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
        </button>
        <h1 className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans`}>Security & Kyc</h1>
        <button
          onClick={() => setKycStatus('incomplete')}
          className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 transition-colors uppercase font-bold tracking-wider"
        >
          Reset KYC
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-y-none flex flex-col">
        {/* Radar Animation Section */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] relative">
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
              animationData={getRadarAnimation()}
              loop={true}
              className="w-full h-full relative z-10"
              style={{
                transform: "scale(2.0)",
                // Removed brightness/contrast/opacity filters as they cause the "grey" washout in light mode inversion.
                filter: !isDarkMode ? "invert(1) hue-rotate(180deg)" : "none"
              }}
            />
          </div>
        </div>

        {/* Content Container */}
        <div className="px-5 pb-10 flex flex-col gap-6">

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
          onSuccess={() => {
            setShowMpinSheet(false);
            navigate('/security/mpin-settings');
          }}
        />
      )}
    </div>
  );
};

export default SecurityDashboard;
