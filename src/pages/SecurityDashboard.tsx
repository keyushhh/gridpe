import { ASSETS } from '@/constants/assets';
import { crashlytics } from '@/lib/crashlytics';
import React, { useState, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import BackButton from '@/components/ui/BackButton';
import { ChevronRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
const Lottie = React.lazy(() => import('lottie-react'));
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useAsset } from '@/hooks/useAsset';
import MpinSheet from '@/components/MpinSheet';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { Switch } from '@/components/ui/switch';
import { hapticLight } from '@/utils/haptics';
import { Capacitor } from '@capacitor/core';
import { useWebScroll } from '@/hooks/useWebScroll';
import AppDownloadSheet from '@/components/AppDownloadSheet';
interface LocationState { originPath?: string }

const SecurityDashboard = () => {
  const { containerOverflow } = useWebScroll();
  const navigate = useNavigate();
  const { showToaster } = useCustomToaster();
  const location = useLocation();
  const originPath = (location.state as LocationState)?.originPath || '/settings';
  const isDarkMode = useIsDarkMode();
  const { profile, kycStatus, biometricEnabled, setBiometricEnabled } = useUser();
  const [showMpinSheet, setShowMpinSheet] = useState(false);
  const [showMpinForBiometric, setShowMpinForBiometric] = useState(false);
  const [biometricAction, setBiometricAction] = useState<'enable' | 'disable'>('enable');
  // Local device-level gate state, initialized from localStorage
  const [isDeviceEnabled, setIsDeviceEnabled] = useState(() => {
    return localStorage.getItem('biometrics_enabled') === 'true';
  });
  const [showAppDownloadSheet, setShowAppDownloadSheet] = useState(false);
  // Get assets via useAsset for theme support
  const securityCompleteAsset = useAsset(ASSETS.SECURITY_COMPLETE, ASSETS.SECURITY_ACTIVE_LIGHT);
  const securityPendingAsset = useAsset(ASSETS.SECURITY_PENDING, ASSETS.SECURITY_PENDING_LIGHT);
  const securityIncompleteAsset = useAsset(
    ASSETS.SECURITY_INCOMPLETE,
    ASSETS.SECURITY_INCOMPLETE_LIGHT
  );
  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);
  const getStatusBanner = () => {
    // Shared Color Schema with Settings.tsx (21% opacity bg, 100% border)
    const colors: Record<string, string> = {
      incomplete: '#FF1E1E',
      pending: '#FF1E1E',
      in_review: '#FACC15',
      verified: '#1CB956',
    };
    const statusLabel = {
      incomplete: 'Security Breach-ish.',
      pending: 'Security Breach-ish.',
      in_review: 'In Progress…',
      verified: 'Looks Good!',
    };
    const statusSubtext = {
      incomplete: 'Some settings need your attention. Give ‘em a tap.',
      pending: 'Some settings need your attention. Give ‘em a tap.',
      in_review: 'We’re working our magic. Check back soon.',
      verified: 'Your security setup looks good and completed.',
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
          paddingBottom: '15px',
        }}
        onClick={kycStatus !== 'verified' ? () => navigate(ROUTES.KYC_INTRO) : undefined}
      >
        <div className="flex flex-col justify-center w-full h-full relative z-10">
          <div className="flex items-center gap-2">
            {!isDarkMode ? (
              <div
                className="w-[24px] h-[24px]"
                style={{
                  backgroundColor: currentColor,
                  WebkitMaskImage: `url(${ASSETS.KYC_BADGE})`,
                  maskImage: `url(${ASSETS.KYC_BADGE})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
              />
            ) : (
              <img loading="lazy" decoding="async"                 src={ASSETS.KYC_BADGE}
                className="w-[24px] h-[24px] object-contain"
                alt="Badge"
              />
            )}
            <span
              className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-medium font-sans`}
            >
              {statusLabel[kycStatus]}
            </span>
          </div>
          <span
            className={`${isDarkMode ? 'text-brand-text-muted' : 'text-black/50'} text-[13px] font-normal font-sans mt-[2px]`}
          >
            {statusSubtext[kycStatus]}
          </span>
        </div>
      </div>
    );
  };
  const handleKycClick = () => {
    if (kycStatus !== 'verified') {
      navigate(ROUTES.KYC_INTRO);
    } else {
      navigate(ROUTES.KYC_STATUS_COMPLETE);
    }
  };
  const handleBiometricToggle = async (nextState?: boolean) => {
    if (!Capacitor.isNativePlatform()) {
      setShowAppDownloadSheet(true);
      return;
    }
    try {
      await hapticLight();
    } catch (_) {
      /* non-critical */
    }

    const shouldEnable = typeof nextState === 'boolean' ? nextState : !isDeviceEnabled;
    if (!shouldEnable) {
      // Disable — require MPIN verification first
      setBiometricAction('disable');
      setShowMpinForBiometric(true);
      return;
    }

    // Enable — check biometric availability, then require MPIN
    try {
      const availability = await BiometricAuth.checkBiometry();
      if (!availability.isAvailable) {
        const reason =
          availability.reason || 'Biometric authentication is not available on this device';
        showToaster(reason, 'error');
        return;
      }
      setBiometricAction('enable');
      setShowMpinForBiometric(true);
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Android Biometric Error:', JSON.stringify(error, null, 2));
      crashlytics.recordError(error instanceof Error ? error : new Error('SecurityDashboard Android biometric error'), 'SecurityDashboard.biometricEnable');
      const errorMessage = error instanceof Error ? error.message : 'Failed to check biometric availability';
      showToaster(errorMessage, 'error');
    }
  };
  const onMpinVerifySuccess = async (mpin?: string) => {
    if (!mpin) return;

    if (biometricAction === 'disable') {
      // MPIN verified — disable biometrics
      try {
        localStorage.setItem('biometrics_enabled', 'false');
        setIsDeviceEnabled(false);
        await setBiometricEnabled(false);
        if (Capacitor.isNativePlatform()) {
          await SecureStorage.remove('mpin');
        }
        showToaster('Biometric unlock disabled on this device', 'success');
      } catch (error: unknown) {
        if (import.meta.env.DEV) console.error('Failed to disable biometrics:', error);
        crashlytics.recordError(error instanceof Error ? error : new Error('SecurityDashboard failed to disable biometrics'), 'SecurityDashboard.biometricDisable');
        showToaster('Failed to disable biometrics. Please try again.', 'error');
      } finally {
        setShowMpinForBiometric(false);
      }
      return;
    }

    // Enable flow — authenticate biometrics after MPIN
    try {
      // Wrap authenticate() in a timeout so the UI doesn't hang
      // if the native biometric prompt fails to appear on Android
      const authPromise = BiometricAuth.authenticate({
        reason: 'Confirm your identity to enable biometrics',
        cancelTitle: 'Cancel',
      });
      let timer: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, reject) =>
        timer = setTimeout(() => reject(new Error('Biometric prompt timed out. Please try again.')), 30000)
      );
      await Promise.race([authPromise, timeoutPromise]);
      clearTimeout(timer);
      // On Success — persist to local, context state, Supabase, and secure storage
      localStorage.setItem('biometrics_enabled', 'true');
      setIsDeviceEnabled(true);
      await setBiometricEnabled(true);
      if (Capacitor.isNativePlatform()) {
        await SecureStorage.set('mpin', mpin);
      }
      showToaster('Biometric unlock enabled!', 'success');
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Biometric authentication failed:', JSON.stringify(error, null, 2));
      crashlytics.recordError(error instanceof Error ? error : new Error('SecurityDashboard biometric authentication failed'), 'SecurityDashboard.biometricAuth');
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed or cancelled';
      showToaster(errorMessage, 'error');
    } finally {
      setShowMpinForBiometric(false);
    }
  };
  const renderSubmenu = () => {
    // Menu Config
    const rowHeight = 'min-h-[68px]';
    const paddingClass = 'pt-[7px] pb-[7px] pl-[18px]'; // Padding: top 7, bottom 7, left 18
    const chevronClass = `${isDarkMode ? 'text-brand-text-muted' : 'text-black'} w-5 h-5 mr-[10px]`;
    const iconClass = `w-[20px] h-[20px] object-contain ${!isDarkMode ? 'filter brightness-0' : ''}`; // Icon 20x20
    const headerClass = `${isDarkMode ? 'text-white' : 'text-black'} text-[14px] font-medium font-sans`; // Header Medium 14
    const subTextClass = `${isDarkMode ? 'text-brand-text-muted' : 'text-black/50'} text-[12px] font-normal font-sans leading-tight`; // Sub Regular 12
    const textGap = 'gap-[5px]'; // Space between header and sub-text
    const textWrapperClass = 'flex flex-col justify-center pr-[56px]'; // Line break 56px from right
    // KYC Row Logic
    let kycBg = isDarkMode ? '#0B0B0B' : '#FFFFFF';
    let kycBorder = isDarkMode ? 'none' : '1px solid #E9EAEB';
    let kycIcon = ASSETS.KYC_ICON_MENU;
    // Override for light mode KYC
    if (!isDarkMode) {
      if (kycStatus === 'incomplete' || kycStatus === 'pending') {
        kycBg = 'rgba(255, 30, 30, 0.15)';
        kycBorder = 'none';
      } else if (kycStatus === 'in_review') {
        kycBg = 'rgba(250, 204, 21, 0.15)';
        kycBorder = 'none';
      }
    } else {
      // Dark Mode logic
      if (kycStatus === 'incomplete' || kycStatus === 'pending') {
        kycBg = 'rgba(255, 30, 30, 0.12)';
        kycIcon = ASSETS.KYC_ALERT_ICON;
      } else if (kycStatus === 'in_review') {
        kycBg = 'rgba(250, 204, 21, 0.12)';
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
            <img loading="lazy" decoding="async" src={kycIcon} alt="KYC" className={iconClass} />
            <div className={`${textWrapperClass} ${textGap} w-full`}>
              <span className={headerClass}>KYC</span>
              <span className={subTextClass}>
                KYC also unlocks faster refunds and your inner peace.
              </span>
            </div>
          </div>
          <ChevronRight className={chevronClass} />
        </div>
        {/* ROW 2: MPIN */}
        <div
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} ${isDarkMode ? 'bg-brand-surface-mid' : 'bg-white'} cursor-pointer`}
          style={!isDarkMode ? { border: '1px solid #E9EAEB' } : {}}
          onClick={() => setShowMpinSheet(true)}
        >
          <div className="flex items-center gap-4 w-full">
            <img loading="lazy" decoding="async" src={ASSETS.MPIN_ICON} alt="MPIN" className={iconClass} />
            <div className={`${textWrapperClass} ${textGap} w-full`}>
              <span className={headerClass}>MPIN</span>
              <span className={subTextClass}>
                No birthdays, no 1234. We're judging you silently.
              </span>
            </div>
          </div>
          <ChevronRight className={chevronClass} />
        </div>
        {/* ROW 3: Biometric */}
        <div
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} ${isDarkMode ? 'bg-brand-surface-mid' : 'bg-white'} cursor-pointer relative z-50`}
          style={!isDarkMode ? { border: '1px solid #E9EAEB' } : {}}
          onClick={() => handleBiometricToggle()}
        >
          <div className="flex items-center gap-4 w-full">
            <img loading="lazy" decoding="async" src={ASSETS.BIOMETRIC_ICON_MENU} alt="Biometric" className={iconClass} />
            <div className={`${textWrapperClass} ${textGap} w-full`}>
              <span className={headerClass}>Biometric Unlock</span>
              <span className={subTextClass}>
                Don’t worry, your face/finger data stays on your phone. We don’t want it. Promise!
              </span>
            </div>
          </div>
          {/* Toggle Switch — z-50 ensures it's above any transparent overlay on Android WebView */}
          <div className="mr-[10px] flex items-center justify-center shrink-0 relative z-50">
            <Switch checked={isDeviceEnabled} onCheckedChange={handleBiometricToggle} />
          </div>
        </div>
        {/* ROW 4: Delete Account */}
        <div
          className={`w-full ${rowHeight} flex items-center justify-between ${paddingClass} ${isDarkMode ? 'bg-brand-surface-mid' : 'bg-white'} cursor-pointer rounded-t-none rounded-b-xl`}
          style={!isDarkMode ? { border: '1px solid #E9EAEB' } : {}}
          onClick={() => navigate(ROUTES.DELETE_ACCOUNT, { state: { originPath } })}
        >
          <div className="flex items-center gap-4 w-full">
            <img loading="lazy" decoding="async" src={ASSETS.DELETE_ACCOUNT_ICON} alt="Delete" className={iconClass} />
            <div className={`${textWrapperClass} ${textGap} w-full`}>
              <span className={headerClass}>Delete Account</span>
              <span className={subTextClass}>
                Thinking of leaving? It's okay, we can handle heartbreak.
              </span>
            </div>
          </div>
          <ChevronRight className={chevronClass} />
        </div>
      </div>
    );
  };
  const getRadarAnimation = () => {
    // Light mode logic (using dark assets + opacity fallback since light assets are missing)
    if (!isDarkMode) {
      switch (kycStatus) {
        case 'incomplete':
        case 'pending':
          return ASSETS.ERROR;
        case 'in_review':
          return ASSETS.IN_PROGRESS;
        case 'verified':
          return ASSETS.GRIDPE_RADAR;
        default:
          return ASSETS.GRIDPE_RADAR;
      }
    }
    switch (kycStatus) {
      case 'incomplete':
      case 'pending':
        return ASSETS.ERROR;
      case 'in_review':
        return ASSETS.IN_PROGRESS;
      case 'verified':
        return ASSETS.GRIDPE_RADAR;
      default:
        return ASSETS.GRIDPE_RADAR;
    }
  };
  return (
    <div
      className="h-full w-full min-h-screen flex flex-col relative"
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        backgroundImage: isDarkMode ? `url(${mainBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Status Blob (Top Glow) */}
      {!isDarkMode && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor:
              kycStatus === 'verified'
                ? '#1CB956'
                : kycStatus === 'in_review'
                  ? '#FACC15'
                  : '#FF1E1E',
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}
      {/* Header - Fixed */}
      <div className="px-5 safe-top pt-4 flex items-center justify-between relative z-50 flex-none">
        <BackButton onClick={() => navigate(originPath)} />
        <h1
          className={`${isDarkMode ? 'text-white' : 'text-black'} text-[18px] font-semibold font-sans`}
        >
          Security & Kyc
        </h1>
        <div className="w-10 h-10" /> {/* Spacer for centering */}
      </div>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* Radar Animation Section */}
        <div className="shrink-0 h-[380px] mb-3 flex flex-col items-center justify-center relative">
          <div className="max-w-[310px] w-full aspect-square flex items-center justify-center relative">
            {/* Replicated 5-circle structure for both modes to ensure consistent size */}
            {/* 5th Circle (Outer) */}
            <div
              className="absolute w-[304px] h-[304px] rounded-full"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'radial-gradient(3608.4% 302.56% at 50% 50%, rgba(204, 208, 255, 0.04) 0%, rgba(255, 255, 255, 0) 100%) padding-box, radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(91, 64, 186, 0.17) 100%) border-box'
                  : 'rgba(255,255,255,0.02) padding-box, rgba(255,255,255,0.1) border-box',
              }}
            />
            {/* 4th Circle */}
            <div
              className="absolute w-[280px] h-[280px] rounded-full"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'radial-gradient(211.71% 133.97% at 50% 50%, #E8EAFF 0%, rgba(255, 255, 255, 0) 100%) padding-box, radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(91, 64, 186, 0.17) 100%) border-box'
                  : 'rgba(255,255,255,0.01) padding-box, rgba(255,255,255,0.08) border-box',
              }}
            />
            {/* 3rd Circle */}
            <div
              className="absolute w-[215px] h-[215px] rounded-full"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'radial-gradient(211.71% 133.97% at 50% 50%, #E4E6FF 0%, rgba(255, 255, 255, 0) 100%) padding-box, radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(91, 64, 186, 0.17) 100%) border-box'
                  : 'rgba(255,255,255,0.01) padding-box, rgba(255,255,255,0.06) border-box',
              }}
            />
            {/* 2nd Circle */}
            <div
              className="absolute w-[150px] h-[150px] rounded-full"
              style={{
                border: '1px solid transparent',
                background: !isDarkMode
                  ? 'radial-gradient(211.71% 133.97% at 50% 50%, #E8EAFF 0%, rgba(255, 255, 255, 0) 100%) padding-box, radial-gradient(50% 50% at 50% 50%, #FFFFFF 0%, rgba(91, 64, 186, 0.17) 100%) border-box'
                  : 'rgba(255,255,255,0.01) padding-box, rgba(255,255,255,0.04) border-box',
              }}
            />
            {/* 1st Circle */}
            <div
              className="absolute w-[86px] h-[86px] rounded-full"
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
            <Suspense fallback={
              <div 
                style={{ width: '100%', height: '200px', background: 'rgba(255,255,255,0.03)' }}
                className="rounded-[16px] animate-pulse"
              />
            }>
              <Lottie
                key={kycStatus}
                animationData={getRadarAnimation()}
                loop={true}
                className={`w-full h-full relative z-10 ${isDarkMode ? '' : 'opacity-70'}`}
              />
            </Suspense>
          </div>
        </div>
        {/* Content Container */}
        <div className="px-5 pb-8 flex flex-col gap-4">
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
          onSuccess={mpin => {
            setShowMpinSheet(false);
            navigate(ROUTES.MPIN_SETTINGS);
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
      <AppDownloadSheet
        forceOpen={showAppDownloadSheet}
        onClose={() => setShowAppDownloadSheet(false)}
        description="Please download our app for proper security features."
      />
    </div>
  );
};
export default SecurityDashboard;
