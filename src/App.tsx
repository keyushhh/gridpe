import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from "@capacitor/core";
import { CapacitorSwipeBackPlugin } from '@notnotsamuel/capacitor-swipe-back';
import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { fetchActiveOrders } from "./lib/orders";
import { setBadge } from "./utils/badge";
import { registerPushNotifications } from "./utils/pushNotifications";
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTheme } from "next-themes";
import GlobalCustomToaster from "./components/GlobalCustomToaster";
import NetworkBanner from "./components/NetworkBanner";
import Index from "./pages/Index";
import Homepage from "./pages/Homepage";
import Settings from "./pages/Settings";
import KYCIntro from "./pages/KYCIntro";
import KYCForm from "./pages/KYCForm";
import SuccessScreen from "./pages/SuccessScreen";
import ProfileEdit from "./pages/ProfileEdit";
import MyCards from "./pages/MyCards";
import AddCard from "./pages/AddCard";
import CardRemoveSuccess from "./pages/CardRemoveSuccess";
import CameraPage from "./pages/CameraPage";
import Banking from "./pages/Banking";
import AddBank from "./pages/AddBank";
import LinkedAccounts from "./pages/LinkedAccounts";
import BankRemoveSuccess from "./pages/BankRemoveSuccess";
import SecurityDashboard from "./pages/SecurityDashboard";
import KYCStatusComplete from "./pages/KYCStatusComplete";
import DeleteAccount from "./pages/DeleteAccount";
import ConfirmDeactivation from "./pages/ConfirmDeactivation";
import AccountDeactivated from "./pages/AccountDeactivated";
import DeleteAccountReasons from "./pages/DeleteAccountReasons";
import DeleteAccountMobile from "./pages/DeleteAccountMobile";
import DeleteAccountOTP from "./pages/DeleteAccountOTP";
import AccountDeleted from "./pages/AccountDeleted";
import AccountRetrieved from "./pages/AccountRetrieved";
import MpinSettings from "./pages/MpinSettings";
import ForgotMpin from "./pages/ForgotMpin";
import OrderCash from "./pages/OrderCash";
import OrderCashSummary from "./pages/OrderCashSummary";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";
import ScheduleDelivery from "./pages/ScheduleDelivery";
import SavedAddresses from "./pages/SavedAddresses";
import AddAddress from "./pages/AddAddress";
import AddAddressDetails from "./pages/AddAddressDetails";
import OrderCancelled from "./pages/OrderCancelled";
import OrderTracking from "./pages/OrderTracking";
import AuthCallback from "./pages/AuthCallback";
import Wallet from "./pages/Wallet";
import WalletCreated from "./pages/WalletCreated";
import WalletTransactionHistory from "./pages/WalletTransactionHistory";
import WalletAddMoney from "./pages/WalletAddMoney";
import WalletSettings from "./pages/WalletSettings";
import WalletTierDetails from "./pages/WalletTierDetails";
import AddPaymentMethod from "./pages/AddPaymentMethod";
import OrderSummary from "./pages/OrderSummary";
import WalletTopUpSuccess from "./pages/WalletTopUpSuccess";
import WalletTopUpFailed from "./pages/WalletTopUpFailed";
import SubscriptionSummary from "./pages/SubscriptionSummary";
import WalletUpgradeSuccess from "./pages/WalletUpgradeSuccess";
import WalletWithdraw from "./pages/WalletWithdraw";
import WalletWithdrawSuccess from "./pages/WalletWithdrawSuccess";
import PaymentMissing from "./pages/PaymentMissing";
import SelectPaymentMethod from "./pages/SelectPaymentMethod";
import WithdrawOTP from "./pages/WithdrawOTP";
import WalletWithdrawFailed from "./pages/WalletWithdrawFailed";
import ViewRiderKyc from "./pages/ViewRiderKyc";
import VerifyRiderKyc from "./pages/VerifyRiderKyc";
import ReportRiderKyc from "./pages/ReportRiderKyc";
import KycReportSuccess from "./pages/KycReportSuccess";
import KycReportError from "./pages/KycReportError";
import ReportRiderConfirm from "./pages/ReportRiderConfirm";
import OrderDelivered from "./pages/OrderDelivered";
import HelpSupport from "./pages/HelpSupport";
import NeedHelp from "./pages/NeedHelp";
import HelpReportSuccess from "./pages/HelpReportSuccess";
import Rewards from "./pages/Rewards";
import LegalPage from "./pages/LegalPage";
import MorePage from "@/pages/MorePage";
import FxExchange from "./pages/FxExchange";
import FxExchangeSummary from "./pages/FxExchangeSummary";
import FxSuccess from "./pages/FxSuccess";
import FxIntro from "./pages/FxIntro";
import FxPassportGate from "./pages/FxPassportGate";
import FxPassportKYC from "./pages/FxPassportKYC";
import FxKYCSuccess from "./pages/FxKYCSuccess";
import LiveRates from "@/pages/LiveRates";
import Subscriptions from "@/pages/Subscriptions";
import ManageSubscription from "@/pages/ManageSubscription";
import DowngradePlan from "./pages/DowngradePlan";
import DowngradeSummary from "./pages/DowngradeSummary";
import HelpCategoryPage from "./pages/HelpCategoryPage";
import ZingChat from "./pages/ZingChat";
import NotFound from "./pages/NotFound";
import DeliveryCaution from "./pages/DeliveryCaution";
import NotAvailable from "./pages/NotAvailable";
import { Button } from "@/components/ui/button";
import DemoButtons from "./pages/DemoButtons";
import RefractionLab from "./labs/RefractionLab";
import { LiquidGlassFilters } from "./components/ui/LiquidGlassFilters";
import { ProtectedRoute } from "./components/ProtectedRoute";

const LocationTracker = ({ currentPathRef }: { currentPathRef: React.MutableRefObject<string> }) => {
  const location = useLocation();
  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location]);
  return null;
};

/** Handles Android hardware back button + system gesture back.
 *  Lives INSIDE <MemoryRouter> so useNavigate() works correctly. */
const BackNavigationHandler = ({ currentPathRef }: { currentPathRef: React.MutableRefObject<string> }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Routes where the back button should exit the app instead of going back
    const ROOT_ROUTES = ['/', '/home', '/login', '/onboarding'];
    
    const handler = CapacitorApp.addListener('backButton', async ({ canGoBack }) => {
      const currentPath = currentPathRef.current;
      
      // 1. HARD SECURITY CHECK: If no session, any back gesture on entry screens should EXIT.
      // This prevents "swiping back" into the history of a previous user session.
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If logged out, we don't allow any "back" navigation into history.
        // We either stay on the onboarding or exit the app.
        console.log("No session detected. Exiting app on back gesture.");
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
  const currentPathRef = useRef("/");
  const isWeb = Capacitor.getPlatform() === 'web';

  useEffect(() => {
    // Sync Supabase session from OAuth deep links
    const listener = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (url.startsWith('gridpe://')) {
        console.log("App opened with URL:", url); // Debug logging

        // Handle PKCE/Implicit flow tokens from URL fragments or queries
        if (url.includes('access_token') && url.includes('refresh_token')) {
          const fragment = url.split('#')[1];
          const params = new URLSearchParams(fragment);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });
            if (error) console.error("Set session error:", error);
            else console.log("Session set from tokens");
          }
        } else {
          // Alternative: exchange code for session
          const codeMatch = url.match(/[?#&]code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            const code = codeMatch[1];
            console.log("Exchanging code for session...");
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error("Auth exchange error:", error);
            } else {
              console.log("Session exchanged successfully", data.session ? "Active" : "No Session");
            }
          } else {
            console.log("No code or tokens found in URL");
          }
        }
      }
    });

    try {
      if (Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('CapacitorSwipeBackPlugin')) {
        CapacitorSwipeBackPlugin.enable();
      }
    } catch (e) {
      console.warn('Swipe back plugin failed to load', e);
    }

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        registerPushNotifications();
      }
    });

    return () => {
      listener.then(handle => handle.remove());
    };
  }, []);



  useEffect(() => {
    const checkActiveOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const activeOrders = await fetchActiveOrders(session.user.id);
        if (activeOrders.length > 0) {
          setBadge(1);
        } else {
          setBadge(0);
        }
      }
    };

    checkActiveOrders();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkActiveOrders();
      } else if (event === 'SIGNED_OUT') {
        setBadge(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  return (
    <SkeletonTheme
      baseColor={isDarkMode ? "#1A1C20" : "#F3F4F6"}
      highlightColor={isDarkMode ? "#2A2D35" : "#E5E7EB"}
    >
      {/* ── Desktop wallpaper backdrop ── */}
      <div className="desktop-backdrop min-h-screen bg-[#06060C] pb-safe">
        {/* ── Mobile simulator frame — all child w-full resolves to this 430px cap ── */}
        <main
          className="mobile-frame w-full max-w-[430px] mx-auto relative shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 bg-[#0a0a12]"
          style={{ 
            transform: 'translateZ(0)', 
            height: '100dvh',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <div 
            className="app-container overflow-y-auto" 
            style={{ 
              height: '100%', 
              minHeight: '100dvh'
            }}
          >
            <GlobalCustomToaster />
            <LiquidGlassFilters />
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <LocationTracker currentPathRef={currentPathRef} />
              <BackNavigationHandler currentPathRef={currentPathRef} />
              <NetworkBanner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/kyc-intro" element={<ProtectedRoute><KYCIntro /></ProtectedRoute>} />
                <Route path="/kyc-form" element={<ProtectedRoute><KYCForm /></ProtectedRoute>} />
                <Route path="/kyc-success" element={<ProtectedRoute><SuccessScreen /></ProtectedRoute>} />
                <Route path="/profile-edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
                <Route path="/cards" element={<ProtectedRoute><MyCards /></ProtectedRoute>} />
                <Route path="/cards/add" element={<ProtectedRoute><AddCard /></ProtectedRoute>} />
                <Route path="/card-remove-success" element={<ProtectedRoute><CardRemoveSuccess /></ProtectedRoute>} />
                <Route path="/banking" element={<ProtectedRoute><Banking /></ProtectedRoute>} />
                <Route path="/banking/add" element={<ProtectedRoute><AddBank /></ProtectedRoute>} />
                <Route path="/banking/linked-accounts" element={<ProtectedRoute><LinkedAccounts /></ProtectedRoute>} />
                <Route path="/bank-remove-success" element={<ProtectedRoute><BankRemoveSuccess /></ProtectedRoute>} />
                <Route path="/security-dashboard" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
                <Route path="/kyc-status-complete" element={<ProtectedRoute><KYCStatusComplete /></ProtectedRoute>} />
                <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />
                <Route path="/security/mpin-settings" element={<ProtectedRoute><MpinSettings /></ProtectedRoute>} />
                <Route path="/order-cash" element={<ProtectedRoute><OrderCash /></ProtectedRoute>} />
                <Route path="/order-cash-summary" element={<ProtectedRoute><OrderCashSummary /></ProtectedRoute>} />
                <Route path="/order-history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                <Route path="/order-details/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                <Route path="/schedule-delivery" element={<ProtectedRoute><ScheduleDelivery /></ProtectedRoute>} />
                <Route path="/saved-addresses" element={<ProtectedRoute><SavedAddresses /></ProtectedRoute>} />
                <Route path="/add-address" element={<ProtectedRoute><AddAddress /></ProtectedRoute>} />
                <Route path="/add-address-details" element={<ProtectedRoute><AddAddressDetails /></ProtectedRoute>} />
                <Route path="/order-tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                <Route path="/wallet-created" element={<ProtectedRoute><WalletCreated /></ProtectedRoute>} />
                <Route path="/wallet-transaction-history" element={<ProtectedRoute><WalletTransactionHistory /></ProtectedRoute>} />
                <Route path="/wallet-settings" element={<ProtectedRoute><WalletSettings /></ProtectedRoute>} />
                <Route path="/wallet-tier/:tierId" element={<ProtectedRoute><WalletTierDetails /></ProtectedRoute>} />
                <Route path="/wallet-add-money" element={<ProtectedRoute><WalletAddMoney /></ProtectedRoute>} />
                <Route path="/add-payment-method" element={<ProtectedRoute><AddPaymentMethod /></ProtectedRoute>} />
                <Route path="/order-summary" element={<ProtectedRoute><OrderSummary /></ProtectedRoute>} />
                <Route path="/wallet-topup-success" element={<ProtectedRoute><WalletTopUpSuccess /></ProtectedRoute>} />
                <Route path="/wallet-topup-failed" element={<ProtectedRoute><WalletTopUpFailed /></ProtectedRoute>} />
                <Route path="/subscription-details" element={<ProtectedRoute><SubscriptionSummary /></ProtectedRoute>} />
                <Route path="/wallet-upgrade-success" element={<ProtectedRoute><WalletUpgradeSuccess /></ProtectedRoute>} />
                <Route path="/wallet-withdraw" element={<ProtectedRoute><WalletWithdraw /></ProtectedRoute>} />
                <Route path="/wallet-withdraw-success" element={<ProtectedRoute><WalletWithdrawSuccess /></ProtectedRoute>} />
                <Route path="/payment-missing" element={<ProtectedRoute><PaymentMissing /></ProtectedRoute>} />
                <Route path="/select-payment-method" element={<ProtectedRoute><SelectPaymentMethod /></ProtectedRoute>} />
                <Route path="/withdraw-otp" element={<ProtectedRoute><WithdrawOTP /></ProtectedRoute>} />
                <Route path="/wallet-withdraw-failed" element={<ProtectedRoute><WalletWithdrawFailed /></ProtectedRoute>} />
                <Route path="/view-rider-kyc/:orderId" element={<ProtectedRoute><ViewRiderKyc /></ProtectedRoute>} />
                <Route path="/verify-rider-kyc" element={<ProtectedRoute><VerifyRiderKyc /></ProtectedRoute>} />
                <Route path="/report-rider-kyc" element={<ProtectedRoute><ReportRiderKyc /></ProtectedRoute>} />
                <Route path="/kyc-report-success" element={<ProtectedRoute><KycReportSuccess /></ProtectedRoute>} />
                <Route path="/kyc-report-error" element={<ProtectedRoute><KycReportError /></ProtectedRoute>} />
                <Route path="/report-rider-confirm" element={<ProtectedRoute><ReportRiderConfirm /></ProtectedRoute>} />
                <Route path="/order-delivered" element={<ProtectedRoute><OrderDelivered /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
                <Route path="/help/report" element={<ProtectedRoute><NeedHelp /></ProtectedRoute>} />
                <Route path="/help/category/:categoryId" element={<ProtectedRoute><HelpCategoryPage /></ProtectedRoute>} />
                <Route path="/help/chat" element={<ProtectedRoute><ZingChat /></ProtectedRoute>} />
                <Route path="/help/success" element={<ProtectedRoute><HelpReportSuccess /></ProtectedRoute>} />
                <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
                <Route path="/more" element={<ProtectedRoute><MorePage /></ProtectedRoute>} />
                <Route path="/fx-exchange" element={<ProtectedRoute><FxExchange /></ProtectedRoute>} />
                <Route path="/fx-exchange-summary" element={<ProtectedRoute><FxExchangeSummary /></ProtectedRoute>} />
                <Route path="/fx-success/:orderId" element={<ProtectedRoute><FxSuccess /></ProtectedRoute>} />
                <Route path="/fx-intro" element={<ProtectedRoute><FxIntro /></ProtectedRoute>} />
                <Route path="/fx-passport-gate" element={<ProtectedRoute><FxPassportGate /></ProtectedRoute>} />
                <Route path="/fx-passport-kyc" element={<ProtectedRoute><FxPassportKYC /></ProtectedRoute>} />
                <Route path="/fx-kyc-success" element={<ProtectedRoute><FxKYCSuccess /></ProtectedRoute>} />
                <Route path="/live-rates" element={<ProtectedRoute><LiveRates /></ProtectedRoute>} />
                <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
                <Route path="/manage-subscription" element={<ProtectedRoute><ManageSubscription /></ProtectedRoute>} />
                <Route path="/downgrade-plan" element={<ProtectedRoute><DowngradePlan /></ProtectedRoute>} />
                <Route path="/downgrade-summary" element={<ProtectedRoute><DowngradeSummary /></ProtectedRoute>} />
                <Route path="/delivery-caution" element={<ProtectedRoute><DeliveryCaution /></ProtectedRoute>} />
                <Route path="/not-available" element={<ProtectedRoute><NotAvailable /></ProtectedRoute>} />
                <Route path="/auth/v1/callback" element={<AuthCallback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </div>
        </main>
      </div>
    </SkeletonTheme>
  );
};

export default App;