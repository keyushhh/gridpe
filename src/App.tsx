/*
 * LOGIC FLOW (Three Network States):
 * 1. ONLINE: App renders normally, all routes accessible. (isConnected = true, isAirplaneMode = false)
 * 2. OFFLINE (NoInternet Screen): Full screen blocking view. (isConnected = false)
 * 3. AIRPLANE MODE (Overlay Banner): App remains accessible but banner drops down over UI. (isAirplaneMode = true)
 */
import { HashRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

import { useEffect, useRef, useState, lazy, Suspense, useLayoutEffect } from 'react';
import { supabase } from './lib/supabase';
import { fetchActiveOrders } from './lib/orders';
import { setBadge } from './utils/badge';
import { registerPushNotifications } from './utils/pushNotifications';
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import GlobalCustomToaster from './components/GlobalCustomToaster';
import ErrorBoundary, { RouteErrorBoundary } from './components/ErrorBoundary';
import { ROUTES } from './routes';

import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { handleBackButtonGesture } from '@/hooks/useBackButtonHandler';
import { useUser } from '@/contexts/UserContext';

// Lazy-load page components
const Index = lazy(() => import('./pages/Index'));
const Homepage = lazy(() => import('./pages/Homepage'));
const Settings = lazy(() => import('./pages/Settings'));
const KYCIntro = lazy(() => import('./pages/KYCIntro'));
const KYCForm = lazy(() => import('./pages/KYCForm'));
const SuccessScreen = lazy(() => import('./pages/SuccessScreen'));
const ProfileEdit = lazy(() => import('./pages/ProfileEdit'));
const MyCards = lazy(() => import('./pages/MyCards'));
const AddCard = lazy(() => import('./pages/AddCard'));
const CardRemoveSuccess = lazy(() => import('./pages/CardRemoveSuccess'));
const CameraPage = lazy(() => import('./pages/CameraPage'));
// const Banking = lazy(() => import('./pages/Banking'));
// const AddBank = lazy(() => import('./pages/AddBank'));
// const LinkedAccounts = lazy(() => import('./pages/LinkedAccounts'));
// const BankRemoveSuccess = lazy(() => import('./pages/BankRemoveSuccess'));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'));
const KYCStatusComplete = lazy(() => import('./pages/KYCStatusComplete'));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'));
const ConfirmDeactivation = lazy(() => import('./pages/ConfirmDeactivation'));
const AccountDeactivated = lazy(() => import('./pages/AccountDeactivated'));
const DeleteAccountReasons = lazy(() => import('./pages/DeleteAccountReasons'));
const DeleteAccountMobile = lazy(() => import('./pages/DeleteAccountMobile'));
const DeleteAccountOTP = lazy(() => import('./pages/DeleteAccountOTP'));
const AccountDeleted = lazy(() => import('./pages/AccountDeleted'));
const AccountRetrieved = lazy(() => import('./pages/AccountRetrieved'));
const MpinSettings = lazy(() => import('./pages/MpinSettings'));
const ForgotMpin = lazy(() => import('./pages/ForgotMpin'));
const OrderCash = lazy(() => import('./pages/OrderCash'));
const OrderCashSummary = lazy(() => import('./pages/OrderCashSummary'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const ScheduleDelivery = lazy(() => import('./pages/ScheduleDelivery'));
const SavedAddresses = lazy(() => import('./pages/SavedAddresses'));
const AddAddress = lazy(() => import('./pages/AddAddress'));
const AddAddressDetails = lazy(() => import('./pages/AddAddressDetails'));
const OrderCancelled = lazy(() => import('./pages/OrderCancelled'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

const AddPaymentMethod = lazy(() => import('./pages/AddPaymentMethod'));
const OrderSummary = lazy(() => import('./pages/OrderSummary'));

const PaymentMissing = lazy(() => import('./pages/PaymentMissing'));
const SelectPaymentMethod = lazy(() => import('./pages/SelectPaymentMethod'));
const ViewRiderKyc = lazy(() => import('./pages/ViewRiderKyc'));
const VerifyRiderKyc = lazy(() => import('./pages/VerifyRiderKyc'));
const ReportRiderKyc = lazy(() => import('./pages/ReportRiderKyc'));
const KycReportSuccess = lazy(() => import('./pages/KycReportSuccess'));
const KycReportError = lazy(() => import('./pages/KycReportError'));
const ReportRiderConfirm = lazy(() => import('./pages/ReportRiderConfirm'));
const OrderDelivered = lazy(() => import('./pages/OrderDelivered'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const NeedHelp = lazy(() => import('./pages/NeedHelp'));
const HelpReportSuccess = lazy(() => import('./pages/HelpReportSuccess'));
const Rewards = lazy(() => import('./pages/Rewards'));
const RewardsHistory = lazy(() => import('./pages/RewardsHistory'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const SafetyPromisePage = lazy(() => import('./pages/SafetyPromisePage'));
const FxExchange = lazy(() => import('./pages/FxExchange'));
const FxExchangeSummary = lazy(() => import('./pages/FxExchangeSummary'));
const FxSuccess = lazy(() => import('./pages/FxSuccess'));
const FxIntro = lazy(() => import('./pages/FxIntro'));
const FxPassportGate = lazy(() => import('./pages/FxPassportGate'));
const FxPassportKYC = lazy(() => import('./pages/FxPassportKYC'));
const FxKYCSuccess = lazy(() => import('./pages/FxKYCSuccess'));
// const InternationalPayment = lazy(() => import('./pages/InternationalPayment')); // Hidden: awaiting Stripe/PayPal backend validation
const LiveRates = lazy(() => import('@/pages/LiveRates'));

const HelpCategoryPage = lazy(() => import('./pages/HelpCategoryPage'));
const ZingChat = lazy(() => import('./pages/ZingChat'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DeliveryCaution = lazy(() => import('./pages/DeliveryCaution'));
const NotAvailable = lazy(() => import('./pages/NotAvailable'));
const RideAndEarn = lazy(() => import('./pages/RideAndEarn'));
const ProUpgrade = lazy(() => import('./pages/ProUpgrade'));
const ProSuccess = lazy(() => import('./pages/ProSuccess'));

import { useNotificationNavigation } from './hooks/useNotificationNavigation';
import { InAppNotificationBanner } from './components/InAppNotificationBanner';

const NotificationSetup = () => {
  useNotificationNavigation();
  return null;
};

import { LiquidGlassFilters } from './components/ui/LiquidGlassFilters';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TermsAcceptanceGate } from './components/TermsAcceptanceGate';
import DevModeOverlay from './components/DevModeOverlay';
import AppDownloadSheet from './components/AppDownloadSheet';
import { useNetworkStatus } from './utils/useNetworkStatus';
import NoInternet from './pages/NoInternet';

import { useAppUpdateCheck } from './hooks/useAppUpdateCheck';
import UpdatePrompt from './components/UpdatePrompt';
import ForceUpdateSheet from './components/ForceUpdateSheet';
import { PrivacyScreen } from './components/PrivacyScreen';
import { useLocationStore } from '@/store/useLocationStore';
const ReactSplashScreen = lazy(() => import('@/components/ReactSplashScreen'));
import { track, capturePageview } from '@/lib/analytics';
import { crashlytics } from '@/lib/crashlytics';


const DevSheetPreview = () => {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" replace />;
  }
  return <AppDownloadSheet forceOpen={true} />;
};

const LocationBootstrapper = () => {
  const initializeLocation = useLocationStore((state) => state.initializeLocation);
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);
  return null;
};

const LocationTracker = ({
  currentPathRef,
}: {
  currentPathRef: React.MutableRefObject<string>;
}) => {
  const location = useLocation();
  useEffect(() => {
    currentPathRef.current = location.pathname;
    capturePageview(location.pathname);
  }, [location, currentPathRef]);
  return null;
};

/** Handles Android hardware back button + system gesture back.
 *  Lives INSIDE <MemoryRouter> so useNavigate() works correctly. */
const BackNavigationHandler = ({
  currentPathRef,
}: {
  currentPathRef: React.MutableRefObject<string>;
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Routes where the back button should exit the app instead of going back
    const ROOT_ROUTES = [ROUTES.INDEX, ROUTES.HOME, '/login', '/onboarding'];

    const handler = CapacitorApp.addListener('backButton', async ({ canGoBack }) => {
      const currentPath = currentPathRef.current;

      // 0. ACTIVE OVERLAY/MODAL CHECK: If there is an active bottom sheet or modal, dismiss it first!
      if (handleBackButtonGesture()) {
        return;
      }

      // 1. HARD SECURITY CHECK: If no session, any back gesture on entry screens should EXIT.
      // This prevents "swiping back" into the history of a previous user session.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // If logged out, we don't allow any "back" navigation into history.
        // We either stay on the onboarding or exit the app.
        CapacitorApp.exitApp();
        return;
      }

      // 2. ROOT ROUTE CHECK: If on a main "hub" page, exit the app.
      if (ROOT_ROUTES.includes(currentPath)) {
        CapacitorApp.exitApp();
      }
      // 3. NATIVE HISTORY: If WebView has internal history, use it.
      else if (canGoBack) {
        window.history.back();
      }
      // 4. REACT ROUTER FALLBACK
      else {
        navigate(-1);
      }
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, [navigate, currentPathRef]);

  return null;
};

interface AppContentProps {
  updateStatus: any;
  storeUrl: string;
  setUpdateStatus: (status: any) => void;
}

const AppContent = ({ updateStatus, storeUrl, setUpdateStatus }: AppContentProps) => {
  const isDarkMode = useIsDarkMode();
  const [isReloading, setIsReloading] = useState(false);
  useOnlineStatus();
  
  const { isConnected } = useNetworkStatus();
  const [simulateOffline, setSimulateOffline] = useState(false);

  

  const effectivelyConnected = isConnected && !simulateOffline;

  const { isInitializing } = useUser();
  const [, setFontsReady] = useState(false);
  const [, setAuthReady] = useState(false);
  const hasHiddenSplash = useRef<boolean>(false);

  // Fonts ready signal
  useEffect(() => {
    const el = document.documentElement;
    if (!el.classList.contains('font-pending')) {
      setFontsReady(true);
      return;
    }
    const observer = new MutationObserver(() => {
      if (!el.classList.contains('font-pending')) {
        setFontsReady(true);
        observer.disconnect();
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Auth ready signal
  useEffect(() => {
    if (!isInitializing) {
      setAuthReady(true);
    }
  }, [isInitializing]);

  // If offline, auth will never resolve — mark as ready immediately
  useEffect(() => {
    if (!isConnected) {
      setAuthReady(true);
    }
  }, [isConnected]);

  // Safety timeout
  useEffect(() => {
    const safety = setTimeout(() => {
      setAuthReady(true);
    }, 4000);
    return () => clearTimeout(safety);
  }, []);

  useLayoutEffect(() => {
    const reloading = localStorage.getItem('gridpe_reloading') === '1';
    if (reloading) {
      setIsReloading(true);
      localStorage.removeItem('gridpe_reloading');
      // Clear after one frame — just long enough to prevent flash
      requestAnimationFrame(() => {
        setIsReloading(false);
      });
    }
  }, []);

  // Instantly hide native splash so ReactSplashScreen takes over
  useLayoutEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (hasHiddenSplash.current) return;
    hasHiddenSplash.current = true;
    requestAnimationFrame(() => {
      SplashScreen.hide({ fadeOutDuration: 0 }).catch(console.warn);
    });
  }, []);



  const currentPathRef = useRef(ROUTES.INDEX);
  const isWeb = Capacitor.getPlatform() === 'web';

  useEffect(() => {
    // Sync Supabase session from OAuth deep links
    const listener = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (url.startsWith('gridpe://') || url.startsWith('com.gridpe.customer://')) {

        // Handle PKCE/Implicit flow tokens from URL fragments or queries
        if (url.includes('access_token') && url.includes('refresh_token')) {
          const fragment = url.split('#')[1];
          const params = new URLSearchParams(fragment);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) console.error('Set session error:', error);
          }
        } else {
          // Alternative: exchange code for session
          const codeMatch = url.match(/[?#&]code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            const code = codeMatch[1];
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              if (import.meta.env.DEV) { console.error('Auth exchange error:', error); }
            }
          }
        }
      }
    });



    return () => {
      listener.then(handle => handle.remove());
    };
  }, []);

  // Secondary Initialization (Heavy / Non-critical)
  useEffect(() => {
    crashlytics.initialize();

    track('app_opened', { source: 'organic' });
    const timer = setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        registerPushNotifications();
      }

      const checkActiveOrders = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const activeOrders = await fetchActiveOrders(session.user.id);
          setBadge(activeOrders.length > 0 ? 1 : 0);
        }
      };

      checkActiveOrders();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(event => {
        if (event === 'SIGNED_IN') {
          checkActiveOrders();
        } else if (event === 'SIGNED_OUT') {
          setBadge(0);
        }
      });

      const appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          registerPushNotifications();
        }
      });

      return () => {
        subscription.unsubscribe();
        appStateListener.then(h => h.remove());
      };
    }, 1000); // 1s delay to let the app settle

    return () => clearTimeout(timer);
  }, []);

  // Custom Event Listeners for Dev Controls
  useEffect(() => {
    const handleForceUpdate = () => setUpdateStatus('force');
    const handleSimulateOffline = () => setSimulateOffline(true);
    
    window.addEventListener('dev-force-update', handleForceUpdate);
    window.addEventListener('dev-simulate-offline', handleSimulateOffline);
    
    return () => {
      window.removeEventListener('dev-force-update', handleForceUpdate);
      window.removeEventListener('dev-simulate-offline', handleSimulateOffline);
    };
  }, [setUpdateStatus]);



  return (
    <ErrorBoundary>
      <UpdatePrompt status={updateStatus} storeUrl={storeUrl} onDismiss={() => setUpdateStatus('none')} />

      {isReloading && (
        <div 
          className="fixed inset-0 z-[99999]" 
          style={{ backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF' }} 
        />
      )}
      <SkeletonTheme
      baseColor={isDarkMode ? '#1A1C20' : '#F3F4F6'}
      highlightColor={isDarkMode ? '#2A2D35' : '#E5E7EB'}
    >
        {/* ── Desktop wallpaper backdrop ── */}
        <div
          className="desktop-backdrop fixed inset-0 w-full h-full"
          style={{ backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF' }}
        >
          {/* ── Mobile simulator frame — all child w-full resolves to this 430px cap on desktop ── */}
          <main
            className={`mobile-frame h-full w-full flex flex-col mx-auto relative ${isWeb ? 'sm:max-w-[430px] sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] sm:ring-1 sm:ring-white/10' : ''}`}
            style={{
              backgroundColor: isDarkMode ? '#0a0a12' : '#FFFFFF',
              transform: 'translateZ(0)',
            }}
          >
              <div className="app-container h-full w-full flex flex-col overflow-hidden relative scrollbar-hide">
              <LiquidGlassFilters />
              <TermsAcceptanceGate />
              <Suspense
                fallback={
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'var(--splash-bg, #0A0A12)',
                      zIndex: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.15)',
                        borderTopColor: 'rgba(255,255,255,0.8)',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    <style>{`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                }
              >
                <Router>
                  <GlobalCustomToaster />
                  <NotificationSetup />
                  <InAppNotificationBanner />
                  <LocationTracker currentPathRef={currentPathRef} />
                  <BackNavigationHandler currentPathRef={currentPathRef} />
                  <DevModeOverlay />
                  <AppDownloadSheet forceOpen={false} />
                  {!effectivelyConnected ? (
                    <NoInternet />
                  ) : (
                  <Routes>
                    <Route element={<RouteErrorBoundary />}>
                      <Route path="/dev/sheet-preview" element={<DevSheetPreview />} />
                      <Route path={ROUTES.INDEX} element={<Index />} />
                    <Route path={ROUTES.RIDE_AND_EARN} element={<RideAndEarn />} />
                    <Route
                      path={ROUTES.PRO_UPGRADE}
                      element={
                        <ProtectedRoute>
                          <ProUpgrade />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PRO_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <ProSuccess />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.HOME}
                      element={
                        <ProtectedRoute>
                          <Homepage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.SETTINGS}
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.KYC_INTRO}
                      element={
                        <ProtectedRoute>
                          <KYCIntro />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.KYC_FORM}
                      element={
                        <ProtectedRoute>
                          <KYCForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.KYC_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <SuccessScreen />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.PROFILE_EDIT}
                      element={
                        <ProtectedRoute>
                          <ProfileEdit />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.CARDS}
                      element={
                        <ProtectedRoute>
                          <MyCards />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.CARDS_ADD}
                      element={
                        <ProtectedRoute>
                          <AddCard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.CARD_REMOVE_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <CardRemoveSuccess />
                        </ProtectedRoute>
                      }
                    />
                    {/* <Route
                      path={ROUTES.BANKING}
                      element={
                        <ProtectedRoute>
                          <Banking />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.BANKING_ADD}
                      element={
                        <ProtectedRoute>
                          <AddBank />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.BANKING_LINKED_ACCOUNTS}
                      element={
                        <ProtectedRoute>
                          <LinkedAccounts />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.BANK_REMOVE_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <BankRemoveSuccess />
                        </ProtectedRoute>
                      }
                    /> */}
                    <Route
                      path={ROUTES.SECURITY_DASHBOARD}
                      element={
                        <ProtectedRoute>
                          <SecurityDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.KYC_STATUS_COMPLETE}
                      element={
                        <ProtectedRoute>
                          <KYCStatusComplete />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.DELETE_ACCOUNT}
                      element={
                        <ProtectedRoute>
                          <DeleteAccount />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.CONFIRM_DEACTIVATION}
                      element={
                        <ProtectedRoute>
                          <ConfirmDeactivation />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ACCOUNT_DEACTIVATED}
                      element={
                        <ProtectedRoute>
                          <AccountDeactivated />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.DELETE_ACCOUNT_REASONS}
                      element={
                        <ProtectedRoute>
                          <DeleteAccountReasons />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.DELETE_ACCOUNT_MOBILE}
                      element={
                        <ProtectedRoute>
                          <DeleteAccountMobile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.DELETE_ACCOUNT_OTP}
                      element={
                        <ProtectedRoute>
                          <DeleteAccountOTP />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ACCOUNT_DELETED}
                      element={
                        <ProtectedRoute>
                          <AccountDeleted />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ACCOUNT_RETRIEVED}
                      element={
                        <ProtectedRoute>
                          <AccountRetrieved />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.CAMERA_PAGE}
                      element={
                        <ProtectedRoute>
                          <CameraPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.MPIN_SETTINGS}
                      element={
                        <ProtectedRoute>
                          <MpinSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.FORGOT_MPIN}
                      element={
                        <ProtectedRoute>
                          <ForgotMpin />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ORDER_CASH}
                      element={
                        <ProtectedRoute>
                          <OrderCash />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ORDER_CASH_SUMMARY}
                      element={
                        <ProtectedRoute>
                          <OrderCashSummary />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ORDER_HISTORY}
                      element={
                        <ProtectedRoute>
                          <OrderHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ORDER_DETAILS}
                      element={
                        <ProtectedRoute>
                          <OrderDetails />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.SCHEDULE_DELIVERY}
                      element={
                        <ProtectedRoute>
                          <ScheduleDelivery />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.SAVED_ADDRESSES}
                      element={
                        <ProtectedRoute>
                          <SavedAddresses />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ADD_ADDRESS}
                      element={
                        <ProtectedRoute>
                          <AddAddress />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ADD_ADDRESS_DETAILS}
                      element={
                        <ProtectedRoute>
                          <AddAddressDetails />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ORDER_TRACKING}
                      element={
                        <ProtectedRoute>
                          <OrderTracking />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ADD_PAYMENT_METHOD}
                      element={
                        <ProtectedRoute>
                          <AddPaymentMethod />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ORDER_SUMMARY}
                      element={
                        <ProtectedRoute>
                          <OrderSummary />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.REWARDS}
                      element={
                        <ProtectedRoute>
                          <Rewards />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.REWARDS_HISTORY}
                      element={
                        <ProtectedRoute>
                          <RewardsHistory />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path={ROUTES.PAYMENT_MISSING}
                      element={
                        <ProtectedRoute>
                          <PaymentMissing />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.SELECT_PAYMENT_METHOD}
                      element={
                        <ProtectedRoute>
                          <SelectPaymentMethod />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path={ROUTES.VIEW_RIDER_KYC}
                      element={
                        <ProtectedRoute>
                          <ViewRiderKyc />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.VERIFY_RIDER_KYC}
                      element={
                        <ProtectedRoute>
                          <VerifyRiderKyc />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.REPORT_RIDER_KYC}
                      element={
                        <ProtectedRoute>
                          <ReportRiderKyc />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.KYC_REPORT_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <KycReportSuccess />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.KYC_REPORT_ERROR}
                      element={
                        <ProtectedRoute>
                          <KycReportError />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.REPORT_RIDER_CONFIRM}
                      element={
                        <ProtectedRoute>
                          <ReportRiderConfirm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ORDER_DELIVERED}
                      element={
                        <ProtectedRoute>
                          <OrderDelivered />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.ORDER_CANCELLED}
                      element={
                        <ProtectedRoute>
                          <OrderCancelled />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.HELP}
                      element={
                        <ProtectedRoute>
                          <HelpSupport />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.HELP_REPORT}
                      element={
                        <ProtectedRoute>
                          <NeedHelp />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.HELP_CATEGORY}
                      element={
                        <ProtectedRoute>
                          <HelpCategoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.HELP_CHAT}
                      element={
                        <ProtectedRoute>
                          <ZingChat />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.HELP_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <HelpReportSuccess />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.REWARDS}
                      element={
                        <ProtectedRoute>
                          <Rewards />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.MORE}
                      element={
                        <ProtectedRoute>
                          <ExplorePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.SAFETY_PROMISE}
                      element={
                        <ProtectedRoute>
                          <SafetyPromisePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.FX_EXCHANGE}
                      element={
                        <ProtectedRoute>
                          <FxExchange />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.FX_EXCHANGE_SUMMARY}
                      element={
                        <ProtectedRoute>
                          <FxExchangeSummary />
                        </ProtectedRoute>
                      }
                    />
                    {/* <Route
                      path={ROUTES.INTERNATIONAL_PAYMENT}
                      element={
                        <ProtectedRoute>
                          <InternationalPayment />
                        </ProtectedRoute>
                      }
                    /> */}
                    {/* <Route
                      path={ROUTES.INTERNATIONAL_PAYMENT}
                      element={
                        <ProtectedRoute>
                          <InternationalPayment />
                        </ProtectedRoute>
                      }
                    /> */}
                    <Route
                      path={ROUTES.FX_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <FxSuccess />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.FX_INTRO}
                      element={
                        <ProtectedRoute>
                          <FxIntro />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.FX_PASSPORT_GATE}
                      element={
                        <ProtectedRoute>
                          <FxPassportGate />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.FX_PASSPORT_KYC}
                      element={
                        <ProtectedRoute>
                          <FxPassportKYC />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.FX_KYC_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <FxKYCSuccess />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.LIVE_RATES}
                      element={
                        <ProtectedRoute>
                          <LiveRates />
                        </ProtectedRoute>
                      }
                    />


                    <Route
                      path={ROUTES.DELIVERY_CAUTION}
                      element={
                        <ProtectedRoute>
                          <DeliveryCaution />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.NOT_AVAILABLE}
                      element={
                        <ProtectedRoute>
                          <NotAvailable />
                        </ProtectedRoute>
                      }
                    />
                    <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
                    <Route path={ROUTES.LEGAL_TERMS} element={<LegalPage type="terms" />} />
                    <Route path={ROUTES.LEGAL_PRIVACY} element={<LegalPage type="privacy" />} />
                      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                  )}
                </Router>
              </Suspense>
            </div>
          </main>
        </div>
      </SkeletonTheme>
    </ErrorBoundary>
  );
};

const App = () => {
  const { updateStatus, storeUrl, setUpdateStatus } = useAppUpdateCheck('customer');
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ErrorBoundary>
      <LocationBootstrapper />
      {showSplash && <ReactSplashScreen onComplete={() => setShowSplash(false)} />}
      {updateStatus === 'force' && <ForceUpdateSheet storeUrl={storeUrl} onClose={() => setUpdateStatus('none')} />}
      <PrivacyScreen />
      <AppContent updateStatus={updateStatus} storeUrl={storeUrl} setUpdateStatus={setUpdateStatus} />
    </ErrorBoundary>
  );
};

export default App;
