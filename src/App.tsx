import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import { useTheme } from 'next-themes';
import GlobalCustomToaster from './components/GlobalCustomToaster';
import ErrorBoundary from './components/ErrorBoundary';
import { ROUTES } from './routes';
import { Loader2, AlertCircle } from 'lucide-react';
import { useOnlineStatus } from './hooks/useOnlineStatus';

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
const Banking = lazy(() => import('./pages/Banking'));
const AddBank = lazy(() => import('./pages/AddBank'));
const LinkedAccounts = lazy(() => import('./pages/LinkedAccounts'));
const BankRemoveSuccess = lazy(() => import('./pages/BankRemoveSuccess'));
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
const Wallet = lazy(() => import('./pages/Wallet'));
const WalletCreated = lazy(() => import('./pages/WalletCreated'));
const WalletTransactionHistory = lazy(() => import('./pages/WalletTransactionHistory'));
const WalletAddMoney = lazy(() => import('./pages/WalletAddMoney'));
const WalletSettings = lazy(() => import('./pages/WalletSettings'));
const WalletTierDetails = lazy(() => import('./pages/WalletTierDetails'));
const AddPaymentMethod = lazy(() => import('./pages/AddPaymentMethod'));
const OrderSummary = lazy(() => import('./pages/OrderSummary'));
const WalletTopUpSuccess = lazy(() => import('./pages/WalletTopUpSuccess'));
const WalletTopUpFailed = lazy(() => import('./pages/WalletTopUpFailed'));
const SubscriptionSummary = lazy(() => import('./pages/SubscriptionSummary'));
const WalletUpgradeSuccess = lazy(() => import('./pages/WalletUpgradeSuccess'));
const WalletWithdraw = lazy(() => import('./pages/WalletWithdraw'));
const WalletWithdrawSuccess = lazy(() => import('./pages/WalletWithdrawSuccess'));
const PaymentMissing = lazy(() => import('./pages/PaymentMissing'));
const SelectPaymentMethod = lazy(() => import('./pages/SelectPaymentMethod'));
const WithdrawOTP = lazy(() => import('./pages/WithdrawOTP'));
const WalletWithdrawFailed = lazy(() => import('./pages/WalletWithdrawFailed'));
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
const LegalPage = lazy(() => import('./pages/LegalPage'));
const MorePage = lazy(() => import('@/pages/MorePage'));
const FxExchange = lazy(() => import('./pages/FxExchange'));
const FxExchangeSummary = lazy(() => import('./pages/FxExchangeSummary'));
const FxSuccess = lazy(() => import('./pages/FxSuccess'));
const FxIntro = lazy(() => import('./pages/FxIntro'));
const FxPassportGate = lazy(() => import('./pages/FxPassportGate'));
const FxPassportKYC = lazy(() => import('./pages/FxPassportKYC'));
const FxKYCSuccess = lazy(() => import('./pages/FxKYCSuccess'));
const LiveRates = lazy(() => import('@/pages/LiveRates'));
const Subscriptions = lazy(() => import('@/pages/Subscriptions'));
const ManageSubscription = lazy(() => import('@/pages/ManageSubscription'));
const DowngradePlan = lazy(() => import('./pages/DowngradePlan'));
const DowngradeSummary = lazy(() => import('./pages/DowngradeSummary'));
const HelpCategoryPage = lazy(() => import('./pages/HelpCategoryPage'));
const ZingChat = lazy(() => import('./pages/ZingChat'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DeliveryCaution = lazy(() => import('./pages/DeliveryCaution'));
const NotAvailable = lazy(() => import('./pages/NotAvailable'));
import { Button } from '@/components/ui/button';

import { LiquidGlassFilters } from './components/ui/LiquidGlassFilters';
import { ProtectedRoute } from './components/ProtectedRoute';

const LocationTracker = ({
  currentPathRef,
}: {
  currentPathRef: React.MutableRefObject<string>;
}) => {
  const location = useLocation();
  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location]);
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

      // 1. HARD SECURITY CHECK: If no session, any back gesture on entry screens should EXIT.
      // This prevents "swiping back" into the history of a previous user session.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // If logged out, we don't allow any "back" navigation into history.
        // We either stay on the onboarding or exit the app.
        console.log('No session detected. Exiting app on back gesture.');
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

const App = () => {
  const { resolvedTheme } = useTheme();
  const [isReloading, setIsReloading] = useState(false);
  const isOnline = useOnlineStatus();

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

    // Hide splash screen after first paint
    if (Capacitor.isNativePlatform()) {
      const timer = setTimeout(() => {
        SplashScreen.hide().catch(err => {
          console.warn('Failed to hide splash screen:', err);
        });
      }, 500); // Give React enough time to mount the shell
      return () => clearTimeout(timer);
    }
  }, []);



  const currentPathRef = useRef(ROUTES.INDEX);
  const isWeb = Capacitor.getPlatform() === 'web';

  useEffect(() => {
    // Sync Supabase session from OAuth deep links
    const listener = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (url.startsWith('gridpe://')) {
        console.log('App opened with URL:', url); // Debug logging

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
            else console.log('Session set from tokens');
          }
        } else {
          // Alternative: exchange code for session
          const codeMatch = url.match(/[?#&]code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            const code = codeMatch[1];
            console.log('Exchanging code for session...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('Auth exchange error:', error);
            } else {
              console.log('Session exchanged successfully', data.session ? 'Active' : 'No Session');
            }
          } else {
            console.log('No code or tokens found in URL');
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



  const isDarkMode = resolvedTheme !== 'light';

  return (
    <>
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
      <ErrorBoundary>
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
            <div className="app-container h-full w-full flex flex-col overflow-y-auto relative">
              {!isOnline && (
                <div
                  className={`sticky top-0 z-[10000] w-full flex items-center justify-center gap-2 py-2 px-4 animate-in slide-in-from-top duration-300 ${isDarkMode ? 'bg-red-500/90 text-white' : 'bg-red-500 text-white shadow-md'}`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">No internet connection</span>
                </div>
              )}
              <GlobalCustomToaster />
              <LiquidGlassFilters />
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-screen bg-background">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  </div>
                }
              >
                <Router>
                  <LocationTracker currentPathRef={currentPathRef} />
                  <BackNavigationHandler currentPathRef={currentPathRef} />
                  <Routes>
                    <Route path={ROUTES.INDEX} element={<Index />} />
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
                    <Route
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
                    />
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
                      path={ROUTES.WALLET}
                      element={
                        <ProtectedRoute>
                          <Wallet />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_CREATED}
                      element={
                        <ProtectedRoute>
                          <WalletCreated />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_TRANSACTION_HISTORY}
                      element={
                        <ProtectedRoute>
                          <WalletTransactionHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_SETTINGS}
                      element={
                        <ProtectedRoute>
                          <WalletSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_TIER}
                      element={
                        <ProtectedRoute>
                          <WalletTierDetails />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_ADD_MONEY}
                      element={
                        <ProtectedRoute>
                          <WalletAddMoney />
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
                      path={ROUTES.WALLET_TOPUP_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <WalletTopUpSuccess />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_TOPUP_FAILED}
                      element={
                        <ProtectedRoute>
                          <WalletTopUpFailed />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.SUBSCRIPTION_DETAILS}
                      element={
                        <ProtectedRoute>
                          <SubscriptionSummary />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_UPGRADE_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <WalletUpgradeSuccess />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_WITHDRAW}
                      element={
                        <ProtectedRoute>
                          <WalletWithdraw />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_WITHDRAW_SUCCESS}
                      element={
                        <ProtectedRoute>
                          <WalletWithdrawSuccess />
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
                      path={ROUTES.WITHDRAW_OTP}
                      element={
                        <ProtectedRoute>
                          <WithdrawOTP />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.WALLET_WITHDRAW_FAILED}
                      element={
                        <ProtectedRoute>
                          <WalletWithdrawFailed />
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
                          <MorePage />
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
                      path={ROUTES.SUBSCRIPTIONS}
                      element={
                        <ProtectedRoute>
                          <Subscriptions />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.MANAGE_SUBSCRIPTION}
                      element={
                        <ProtectedRoute>
                          <ManageSubscription />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.DOWNGRADE_PLAN}
                      element={
                        <ProtectedRoute>
                          <DowngradePlan />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.DOWNGRADE_SUMMARY}
                      element={
                        <ProtectedRoute>
                          <DowngradeSummary />
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
                  </Routes>
                </Router>
              </Suspense>
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </SkeletonTheme>
    </>
  );
};

export default App;
