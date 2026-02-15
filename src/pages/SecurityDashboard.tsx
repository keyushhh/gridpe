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
import gridpeRadarAnimation from "@/assets/gridpe-radar.json";
import errorRadarAnimation from "@/assets/error.json";
import inProgressRadarAnimation from "@/assets/in-progress.json";
import MpinSheet from "@/components/MpinSheet";

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const { kycStatus, biometricEnabled, setBiometricEnabled } = useUser();
  const [showMpinSheet, setShowMpinSheet] = useState(false);

  const getStatusBanner = () => {
    // Height 80px, Badge Icon, Centered Header, Secondary Text
    // Padding: top 17px, left 17px, bottom 15px
    const commonClasses = "w-full h-[80px] rounded-xl flex items-center justify-between px-4 cursor-pointer relative overflow-hidden pt-[17px] pl-[17px] pb-[15px]";
    const bgStyle = (img: string) => ({
      backgroundImage: `url(${img})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    });

    switch (kycStatus) {
      case "incomplete":
        return (
          <div
            className={commonClasses}
            style={bgStyle(bannerIncomplete)}
            onClick={() => navigate("/kyc-intro")}
          >
            {/* Flex Column for Text */}
            <div className="flex flex-col justify-center w-full h-full">
              <div className="flex items-center gap-2">
                <img src={kycBadge} className="w-[24px] h-[24px] object-contain" alt="Badge" />
                <span className="text-white text-[18px] font-medium font-sans">Security Breach-ish.</span>
              </div>
              <span className="text-[#7E7E7E] text-[13px] font-normal font-sans mt-[2px]">Some settings need your attention. Give ‘em a tap.</span>
            </div>
          </div>
        );
      case "pending":
        return (
          <div
            className={commonClasses}
            style={bgStyle(bannerPending)}
          >
            <div className="flex flex-col justify-center w-full h-full">
              <div className="flex items-center gap-2">
                <img src={kycBadge} className="w-[24px] h-[24px] object-contain" alt="Badge" />
                <span className="text-white text-[18px] font-medium font-sans">In Progress…</span>
              </div>
              <span className="text-[#7E7E7E] text-[13px] font-normal font-sans mt-[2px]">We’re working our magic. Check back soon.</span>
            </div>
          </div>
        );
      case "complete":
        return (
          <div
            className={commonClasses}
            style={bgStyle(bannerComplete)}
          >
            <div className="flex flex-col justify-center w-full h-full">
              <div className="flex items-center gap-2">
                <img src={kycBadge} className="w-[24px] h-[24px] object-contain" alt="Badge" />
                <span className="text-white text-[18px] font-medium font-sans">Looks Good!</span>
              </div>
              <span className="text-[#7E7E7E] text-[13px] font-normal font-sans mt-[2px]">Your security setup looks good and completed.</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderSubmenu = () => {
    // Menu Config
    const rowHeight = "h-[68px]";
    const paddingClass = "pt-[7px] pb-[7px] pl-[18px]"; // Padding: top 7, bottom 7, left 18
    const chevronClass = "text-[#7E7E7E] w-5 h-5 mr-[10px]";
    const iconClass = "w-[20px] h-[20px] object-contain"; // Icon 20x20
    const headerClass = "text-white text-[14px] font-medium font-sans"; // Header Medium 14
    const subTextClass = "text-[#7E7E7E] text-[12px] font-normal font-sans leading-tight"; // Sub Regular 12
    const textGap = "gap-[5px]"; // Space between header and sub-text
    const textWrapperClass = "flex flex-col justify-center pr-[56px]"; // Line break 56px from right

    // KYC Row Logic
    let kycBg = "#0B0B0B";
    let kycIcon = kycIconMenu;

    // Incomplete specific overrides
    if (kycStatus === "incomplete") {
      kycBg = "rgba(255, 30, 30, 0.12)";
      kycIcon = kycAlertIcon;
    } else if (kycStatus === "pending") {
      kycBg = "rgba(250, 204, 21, 0.12)";
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
          style={{ backgroundColor: kycBg }}
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
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} bg-[#0B0B0B] cursor-pointer`}
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
        <div className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} bg-[#0B0B0B]`}>
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
              className="w-full h-full object-contain"
              alt="Toggle"
            />
          </div>
        </div>

        {/* ROW 4: Delete Account */}
        <div
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} bg-[#0B0B0B] cursor-pointer rounded-t-none rounded-b-xl`}
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
      className="h-full w-full overflow-hidden flex flex-col safe-area-top safe-area-bottom"
      style={{
        backgroundColor: "#0a0a12",
        backgroundImage: `url(${bgDarkMode})`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header - Fixed */}
      <div className="px-5 pt-12 flex items-center gap-3 relative z-50 flex-none">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/20 backdrop-blur-md"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white text-[18px] font-semibold font-sans">Security & KYC</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-y-none flex flex-col">
        {/* Radar Animation Section */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] relative">
          <div className="w-[254px] h-[254px] flex items-center justify-center relative">
            <Lottie
              animationData={getRadarAnimation()}
              loop={true}
              className="w-full h-full"
              style={{ transform: "scale(2.0)" }}
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
