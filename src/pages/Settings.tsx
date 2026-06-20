import { ASSETS } from '@/constants/assets';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import BackButton from '@/components/ui/BackButton';
import AppDownloadSheet from '@/components/AppDownloadSheet';
import { cn } from '@/lib/utils';
import Skeleton from 'react-loading-skeleton';
import { ChevronRight, Pencil, Lock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { useAsset } from '@/hooks/useAsset';
import { useUser } from '@/contexts/UserContext';
import { getCards } from '@/utils/cardUtils';
import { fetchBankAccounts } from '@/lib/banking';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { useAuth } from '@/hooks/useAuth';
import { useWebScroll } from '@/hooks/useWebScroll';
import { useAppUpdateCheck } from '@/hooks/useAppUpdateCheck';

type SecurityStatus = 'verified' | 'in_review' | 'pending' | 'incomplete';

interface LocationState { originPath?: string }

const getSecurityConfig = (
  status: SecurityStatus,
  assets: { complete: string; pending: string; incomplete: string },
  isDarkMode: boolean
) => {
  // Base styles for the frame
  const baseFrame = 'w-10 h-10 rounded-full flex items-center justify-center border';

  // Shared Color Schema (21% opacity bg, 100% border)
  const colors = {
    verified: {
      bg: 'rgba(28, 185, 86, 0.21)', // #1CB956
      border: '#1CB956',
      text: 'text-green-700 dark:text-green-500',
    },
    pending: {
      bg: 'rgba(250, 204, 21, 0.21)', // #FACC15
      border: '#FACC15',
      text: 'text-yellow-700 dark:text-yellow-600',
    },
    incomplete: {
      bg: 'rgba(255, 30, 30, 0.21)', // #FF1E1E
      border: '#FF1E1E',
      text: 'text-red-600 dark:text-red-400',
    },
  };

  const state =
    status === 'verified'
      ? 'verified'
      : status === 'in_review' || status === 'pending'
        ? 'pending'
        : 'incomplete';
  const config = colors[state];

  return {
    bg: assets[
      status === 'verified'
        ? 'complete'
        : status === 'in_review' || status === 'pending'
          ? 'pending'
          : 'incomplete'
    ],
    label:
      status === 'verified'
        ? 'Account secured'
        : status === 'in_review' || status === 'pending'
          ? 'Pending'
          : 'Incomplete',
    textColor: config.text,
    bannerBg: config.bg,
    bannerBorder: config.border,
    frameClass: isDarkMode
      ? 'w-10 h-10 flex items-center justify-center'
      : `${baseFrame} border-[${config.border}]`,
    frameStyle: isDarkMode ? {} : { backgroundColor: config.bg, borderColor: config.border },
    blobColor: isDarkMode ? null : config.border,
  };
};

// 🔔 haptic helper (safe on all platforms)
const triggerHaptic = () => {
  if (navigator?.vibrate) {
    navigator.vibrate(10);
  }
};

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToaster } = useCustomToaster();
  const {
    profile,
    kycStatus,
    phoneNumber,
    email,
    name,
    profileImage,
    resetForDemo,
    isSecureStorageReady,
  } = useUser();

  // Ensure we have a default boolean for the switch (true for dark)
  const isDarkMode = useIsDarkMode();
  const { containerOverflow } = useWebScroll();
  const { updateStatus, storeUrl } = useAppUpdateCheck('customer');
  const [devForceUpdate, setDevForceUpdate] = useState(false);
  const effectiveUpdateStatus = import.meta.env?.DEV && devForceUpdate ? 'soft' : updateStatus;
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, hasDragged: false });

  // ... (keep previous lines)

  const userId = profile?.id;
  const originPath = (location.state as LocationState)?.originPath || ROUTES.SETTINGS;
  const [pushNotifications, setPushNotifications] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showAppDownloadSheet, setShowAppDownloadSheet] = useState(false);

  const mainBg = useAsset(ASSETS.BG_DARK_MODE, ASSETS.BG_LIGHT);
  const securityCompleteAsset = useAsset(ASSETS.SECURITY_COMPLETE, ASSETS.SECURITY_ACTIVE_LIGHT);
  const securityPendingAsset = useAsset(ASSETS.SECURITY_PENDING, ASSETS.SECURITY_PENDING_LIGHT);
  const securityIncompleteAsset = useAsset(
    ASSETS.SECURITY_INCOMPLETE,
    ASSETS.SECURITY_INCOMPLETE_LIGHT
  );

  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      App.getInfo()
        .then(info => {
          setAppVersion(info.version);
        })
        .catch(() => {
          setAppVersion('1.0.0');
        });
    }
  }, []);

  const iconEdit = useAsset('', ASSETS.EDITICON);
  const iconLinkedCards = useAsset(ASSETS.ICON_LINKED_CARDS, ASSETS.LINKED_CARDS);
  const iconBankAcc = useAsset(ASSETS.ICON_BANK_ACC, ASSETS.BANK_INFO);
  const iconNotifs = useAsset(ASSETS.ICON_NOTIFICATIONS, ASSETS.NOTIFS_LIGHT);
  const iconDarkMode = useAsset(ASSETS.ICON_DARK_MODE, ASSETS.LIGHT_MODE);
  const iconLogout = useAsset(ASSETS.ICON_LOGOUT, ASSETS.LOGOUT_ICON);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const { data: settingsCounts, isLoading } = useQuery({
    queryKey: ['settings-counts', userId],
    queryFn: async () => {
      let bankCount = 0;
      let cardCount = 0;

      try {
        const [accounts, localCards, dbCountResponse] = await Promise.all([
          fetchBankAccounts(userId || ''),
          getCards(userId || ''),
          supabase
            .from('bank_cards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
        ]);

        bankCount = accounts.length;
        
        const dbCount = dbCountResponse.count || 0;
        cardCount = localCards.length + dbCount;
      } catch (error) {
        console.error('Error loading settings counts:', error);
        // Robust fallback: try getting at least local cards if everything failed
        try {
          if (userId) {
            const fallbackCards = await getCards(userId);
            cardCount = fallbackCards.length;
          }
        } catch (e) {
          // ignore error
        }
      }

      return { bankCount, cardCount };
    },
    enabled: !!userId,
  });

  const handleLogoPress = () => {
    longPressTimer.current = setTimeout(() => {
      resetForDemo();
      showToaster('Demo reset! All data cleared.', 'success');
    }, 3000);
  };

  const handleLogoRelease = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const { logout: handleLogout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isSecureStorageReady) {
    return (
      <div
        className={`min-h-[100dvh] w-full flex flex-col`}
        style={{ backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF' }}
      >
        <div className="px-5 safe-top pt-4 flex items-center justify-between">
          <Skeleton width={100} height={32} />
        </div>
        <div className="px-5 mt-6 flex items-center gap-4">
          <Skeleton circle width={56} height={56} />
          <div className="flex flex-col gap-1">
            <Skeleton width={120} height={20} />
            <Skeleton width={150} height={14} />
          </div>
        </div>
        <div className="px-5 mt-8 space-y-6">
          <Skeleton height={100} />
          <Skeleton height={200} />
        </div>
      </div>
    );
  }

  const cardCount = settingsCounts?.cardCount ?? 0;
  const bankAccountCount = settingsCounts?.bankCount ?? 0;

  const securityConfig = getSecurityConfig(
    kycStatus as SecurityStatus,
    {
      complete: securityCompleteAsset,
      pending: securityPendingAsset,
      incomplete: securityIncompleteAsset,
    },
    isDarkMode
  );

  return (
    <div
      className={`min-h-[100dvh] w-full ${containerOverflow} overflow-y-auto flex flex-col relative`}
      style={{
        backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
        // Only show mainBg image in Dark Mode as requested (User wanted White in Light Mode)
        backgroundImage: isDarkMode ? `url(${mainBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Light Mode Status Blob (Top Glow) */}
      {!isDarkMode && securityConfig.blobColor && (
        <div
          className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-[166px] h-[40px] rounded-full pointer-events-none z-0"
          style={{
            backgroundColor: securityConfig.blobColor,
            filter: 'blur(60px)',
            opacity: 0.8,
            mixBlendMode: 'normal',
          }}
        />
      )}

      {/* Content Container */}
      <div className="relative z-10 flex flex-col w-full">
        {/* Header */}
        <div className="px-5 safe-top pt-4 flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <BackButton onClick={() => navigate(ROUTES.HOME)} />
            <h1 className="text-foreground text-[18px] font-semibold">Settings</h1>
          </div>

          <button
            onClick={() => navigate(ROUTES.HELP)}
            className={cn(
              'px-4 h-[36px] rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform overflow-hidden relative',
              isDarkMode ? 'glass-container glass-physics-clear grow-0' : 'bg-black'
            )}
            style={
              {
                ...(!isDarkMode ? { backgroundColor: '#000000' } : {}),
                '--glass-specular-intensity': '0.2',
              } as React.CSSProperties
            }
          >
            {isDarkMode && (
              <>
                <div className="glass-lens" />
                <div
                  className="absolute inset-0 z-[1] pointer-events-none"
                  style={{ backgroundColor: 'var(--glass-tint)' }}
                />
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
              <img loading="lazy" decoding="async"                 src={profileImage || ASSETS.AVATAR}
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
                  <h2 className="text-foreground text-[18px] font-medium">{name || 'Guest User'}</h2>
                  <div className="flex items-center gap-1">
                    <span className="text-black dark:text-muted-foreground text-[14px]">
                      {phoneNumber || email}
                    </span>
                    <img loading="lazy" decoding="async" src={ASSETS.VERIFIED} className="w-4 h-4 object-contain" alt="Verified" />
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(ROUTES.PROFILE_EDIT)}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center p-0"
          >
            {iconEdit ? (
              <img loading="lazy" decoding="async" src={iconEdit} className="w-full h-full object-cover" />
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
              borderWidth: '0.63px',
            }}
          >
            <div className="flex items-center gap-3">
              <div className={securityConfig.frameClass} style={securityConfig.frameStyle}>
                {isDarkMode ? (
                  <img loading="lazy" decoding="async" src={ASSETS.ICON_SECURITY} className="w-10 h-10 dark:filter-none" />
                ) : (
                  <Lock className="w-[14px] h-[14px] text-black" />
                )}
              </div>
              <div>
                <p className="text-foreground text-[14px] font-medium">Security & KYC</p>
                <p className={`${securityConfig.textColor} text-[12px]`}>{securityConfig.label}</p>
              </div>
            </div>
            <button
              onClick={() =>
                navigate(ROUTES.SECURITY_DASHBOARD, { state: { originPath: ROUTES.SETTINGS } })
              }
              className={cn(
                'px-4 h-[32px] flex items-center justify-center rounded-full text-[12px] text-white font-medium active:scale-95 transition-transform overflow-hidden relative',
                isDarkMode ? 'glass-container glass-physics-cta min-w-[120px]' : 'bg-black'
              )}
              style={!isDarkMode ? { backgroundColor: '#000000' } : {}}
            >
              {isDarkMode && (
                <>
                  <div className="glass-lens" />
                  <div
                    className="absolute inset-0 z-[1] pointer-events-none"
                    style={{ backgroundColor: 'var(--glass-tint)' }}
                  />
                  <span className="glass-rim-v2" />
                </>
              )}
              <span className="relative z-10">Check Security</span>
            </button>
          </div>
        </div>

        {/* Update Available Row */}
        {effectiveUpdateStatus === 'soft' && (Capacitor.getPlatform() !== 'web' || devForceUpdate) && (
          <div className="px-5 mt-4">
            <div 
              className={`flex justify-between items-center cursor-pointer p-3 rounded-xl active:scale-[0.98] transition-all ${isDarkMode ? 'border border-white/10' : ''}`}
              style={{
                border: !isDarkMode ? '0.5px solid rgba(82, 96, 254, 0.5)' : undefined,
                borderLeft: '3px solid #5260FE',
                backgroundColor: isDarkMode ? 'rgba(82,96,254,0.06)' : 'rgba(82,96,254,0.03)'
              }}
              onClick={() => {
                // @ts-ignore
                App.openUrl({ url: storeUrl });
              }}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(82,96,254,0.15)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5260FE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="16 12 12 8 8 12"></polyline>
                    <line x1="12" y1="16" x2="12" y2="8"></line>
                  </svg>
                </div>
                <div className="mx-3 flex-1 flex flex-col">
                  <span className="text-[15px] font-semibold text-[#5260FE]">Update Available</span>
                  <span className="text-[12px] font-normal" style={{ color: 'rgba(82,96,254,0.7)' }}>Tap to update to the latest version</span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5260FE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        )}

        {/* PAYMENT METHODS */}
        <div className="px-5 mt-6">
          <p className="mb-3.5 text-black dark:text-muted-foreground text-[14px] font-bold tracking-wider">
            PAYMENT METHODS
          </p>
          <div className="space-y-4">
            <div
              className="flex justify-between cursor-pointer"
              onClick={() => navigate(ROUTES.CARDS)}
            >
              <div className="flex items-start gap-3">
                <img loading="lazy" decoding="async" src={iconLinkedCards} className="w-[18px] mt-[2px]" />
                <div>
                  <p className="text-foreground text-[14px]">Linked Cards</p>
                  <p className="text-black dark:text-muted-foreground text-[12px]">
                    {cardCount === 0
                      ? '0 cards saved'
                      : cardCount === 1
                        ? '1 card linked'
                        : `${cardCount} cards linked`}
                  </p>
                </div>
              </div>
              <ChevronRight />
            </div>

          </div>
        </div>

        {/* MANAGE */}
        <div className="px-5 mt-6">
          <p className="mb-3.5 text-black dark:text-muted-foreground text-[14px] font-bold tracking-wider">
            MANAGE
          </p>
          <div className="space-y-4">
            <div
              className="flex justify-between cursor-pointer"
              onClick={() => navigate(ROUTES.SAVED_ADDRESSES)}
            >
              <div className="flex items-start gap-3">
                <img loading="lazy" decoding="async" src={ASSETS.ADDRESS} className="w-[18px] mt-[2px] filter brightness-0 dark:invert" />
                <div>
                  <p className="text-foreground text-[14px]">Saved Addresses</p>
                </div>
              </div>
              <ChevronRight />
            </div>


          </div>
        </div>

        {/* LEGAL */}
        <div className="px-5 mt-6">
          <p className="mb-3.5 text-black dark:text-muted-foreground text-[14px] font-bold tracking-wider">
            LEGAL
          </p>
          <div className="space-y-4">
            <div
              className="flex justify-between cursor-pointer"
              onClick={() => navigate(ROUTES.LEGAL_PRIVACY)}
            >
              <div className="flex items-start gap-3">
                <img loading="lazy" decoding="async" src={ASSETS.TERMS_PRIVACY} className="w-[18px] mt-[2px] filter brightness-0 dark:invert" />
                <div>
                  <p className="text-foreground text-[14px]">Privacy Policy</p>
                </div>
              </div>
              <ChevronRight />
            </div>

            <div
              className="flex justify-between cursor-pointer"
              onClick={() => navigate(ROUTES.LEGAL_TERMS)}
            >
              <div className="flex items-start gap-3">
                <img loading="lazy" decoding="async" src={ASSETS.TERMS_PRIVACY} className="w-[18px] mt-[2px] filter brightness-0 dark:invert" />
                <div>
                  <p className="text-foreground text-[14px]">Terms & Conditions</p>
                </div>
              </div>
              <ChevronRight />
            </div>
          </div>
        </div>

        {/* PREFERENCES & Footer Container */}
        <div className="flex-1 w-full bg-brand-bg-light dark:bg-transparent mt-6 pt-4 flex flex-col">
          <div className="px-5">
            <p className="mb-3.5 text-black dark:text-muted-foreground text-[14px] font-bold tracking-wider">
              PREFERENCES
            </p>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img loading="lazy" decoding="async" src={iconNotifs} className="w-[18px] filter brightness-0 dark:invert" />
                  <p className="text-foreground">Notifications</p>
                </div>
                <div className="space-y-4 ml-[30px]">
                  <div className="flex justify-between">
                    <span
                      className={`text-[14px] ${pushNotifications ? 'text-foreground' : 'text-black dark:text-muted-foreground'}`}
                    >
                      Push Notifications
                    </span>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={async val => {
                        triggerHaptic();
                        if (val) {
                          if (!Capacitor.isNativePlatform()) {
                            setShowAppDownloadSheet(true);
                            return;
                          }
                          try {
                            const permission = await PushNotifications.requestPermissions();
                            if (permission.receive !== 'granted') {
                              setPushNotifications(false);
                              showToaster('Enable notifications in your device settings to receive notifications.', 'error');
                            } else {
                              setPushNotifications(true);
                            }
                          } catch (e) {
                            if (import.meta.env.DEV) { console.error('Push notification permission error:', e); }
                            setPushNotifications(false);
                            showToaster('Enable notifications in your device settings to receive notifications.', 'error');
                          }
                        } else {
                          setPushNotifications(false);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACCOUNT */}
          <div className="px-5 mt-6">
            <p className="mb-3.5 text-black dark:text-muted-foreground text-[14px] font-bold tracking-wider">
              ACCOUNT
            </p>
            <div className="space-y-4">
              <div className="flex justify-between cursor-pointer" onClick={() => setShowLogoutConfirmation(true)}>
                <div className="flex items-center gap-3">
                  <img loading="lazy" decoding="async" src={iconLogout} className="w-[18px] filter brightness-0 dark:invert" />
                  <span className="text-foreground text-[14px]">Log Out</span>
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
            <p className="font-satoshi font-black text-[40px] text-foreground leading-none tracking-tight">
              grid.pe
            </p>
            <p className="text-sm mt-2">App Version v{appVersion} – 100% drama compatible.</p>
          </div>
        </div>
      </div>

      {/* Dev Simulate Update */}
      {import.meta.env?.DEV && (
        <button
          onPointerDown={(e) => {
            dragRef.current.isDragging = true;
            dragRef.current.startX = e.clientX - dragPos.x;
            dragRef.current.startY = e.clientY - dragPos.y;
            dragRef.current.hasDragged = false;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragRef.current.isDragging) {
              dragRef.current.hasDragged = true;
              setDragPos({
                x: e.clientX - dragRef.current.startX,
                y: e.clientY - dragRef.current.startY
              });
            }
          }}
          onPointerUp={(e) => {
            dragRef.current.isDragging = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
            if (!dragRef.current.hasDragged) {
              setDevForceUpdate(!devForceUpdate);
            }
          }}
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
            left: '16px',
            zIndex: 9999,
            backgroundColor: 'rgba(255,149,0,0.15)',
            border: '1px solid rgba(255,149,0,0.4)',
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#FF9500',
            cursor: 'grab',
            touchAction: 'none',
            transform: `translate(${dragPos.x}px, ${dragPos.y}px)`
          }}
        >
          {effectiveUpdateStatus === 'soft' ? "🔴 Reset Update" : "🟡 Simulate Update"}
        </button>
      )}

      {/* Logout Confirmation Bottom Sheet */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/50 backdrop-blur-[4px] pointer-events-auto"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowLogoutConfirmation(false); }}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 rounded-t-[36px] flex flex-col px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 pointer-events-auto z-20 transition-all duration-300 animate-slide-up"
            style={{
              backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.31)' : 'rgba(255, 255, 255, 0.95)',
              borderTop: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.1)',
              borderLeft: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.1)',
              borderRight: isDarkMode ? '0.63px solid rgba(255, 255, 255, 0.12)' : '0.63px solid rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              boxShadow: isDarkMode ? '0px -10px 40px rgba(0, 0, 0, 0.4)' : 'none',
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
          >
            {/* Drag Handle */}
            <div
              className={`w-10 h-1.5 rounded-full mx-auto mb-6 ${
                isDarkMode ? 'bg-white/20' : 'bg-black/20'
              }`}
            />

            {/* Premium Animated Icon */}
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mb-4 text-[#EF4444] animate-pulse"
            >
              <path
                d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 12H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 9L20 12L17 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Content */}
            <div className="flex flex-col text-center">
              <h2 className={`text-[22px] font-black font-satoshi leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Log out?
              </h2>
              <p className={`text-[13.5px] font-normal leading-relaxed font-satoshi mt-1.5 px-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                No worries, we’ll be here when you need cash again.
              </p>
            </div>

            {/* Subtle Divider */}
            <div className={`h-[1px] w-full my-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

            {/* Buttons stacked vertically */}
            <div className="flex flex-col gap-3.5">
              <button
                onClick={() => {
                  setIsLoggingOut(true);
                  setShowLogoutConfirmation(false);
                  // Defer the actual logout so the UI can update and avoid mid-flight state wipes
                  requestAnimationFrame(() => {
                    handleLogout();
                  });
                }}
                disabled={isLoggingOut}
                className={`w-full h-[52px] rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] active:scale-95 transition-all flex items-center justify-center font-bold text-white text-[16px] font-satoshi ${
                  isDarkMode ? 'shadow-lg shadow-red-950/20' : 'shadow-none'
                }`}
              >
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowLogoutConfirmation(false); }}
                className={`w-full h-[52px] rounded-full active:scale-95 transition-all flex items-center justify-center font-semibold text-[16px] font-satoshi border ${
                  isDarkMode 
                    ? 'bg-transparent text-white border-white/12 hover:bg-white/5' 
                    : 'bg-transparent text-slate-800 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AppDownloadSheet
        forceOpen={showAppDownloadSheet}
        onClose={() => setShowAppDownloadSheet(false)}
        description="Please download our app to enable push notifications."
      />
    </div>
  );
};

export default Settings;
