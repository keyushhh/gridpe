import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from "@capacitor/core";
import { CapacitorSwipeBackPlugin } from '@notnotsamuel/capacitor-swipe-back';
import { useEffect, useRef } from "react";
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

const LocationTracker = ({ currentPathRef }: { currentPathRef: React.MutableRefObject<string> }) => {
  const location = useLocation();
  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location]);
  return null;
};

const App = () => {
  const currentPathRef = useRef("/");

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

  // Hardware back button (Android). Route-allowlist so swipe/back from an
  // unauthenticated screen exits the app instead of re-entering authed screens.
  useEffect(() => {
    const LOCKED_ROUTES = ['/', '/onboarding', '/login', '/welcome'];
    const handler = CapacitorApp.addListener('backButton', () => {
      if (LOCKED_ROUTES.includes(currentPathRef.current)) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });
    return () => { handler.then(h => h.remove()); };
  }, []);

  // iOS swipe-back gesture block/exit logic
  useEffect(() => {
    const blockBack = () => {
      const LOCKED_ROUTES = ['/', '/onboarding', '/login', '/welcome'];
      if (LOCKED_ROUTES.includes(currentPathRef.current)) {
        CapacitorApp.exitApp();
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    };
    
    // On mount, push a state so there's always a forward entry
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', blockBack);
    
    return () => window.removeEventListener('popstate', blockBack);
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
      <div className="app-container">
        <GlobalCustomToaster />
        <LiquidGlassFilters />
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <LocationTracker currentPathRef={currentPathRef} />
          <NetworkBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Homepage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/kyc-intro" element={<KYCIntro />} />
            <Route path="/kyc-form" element={<KYCForm />} />
            <Route path="/kyc-success" element={<SuccessScreen />} />
            <Route path="/profile-edit" element={<ProfileEdit />} />
          <Route path="/cards" element={<MyCards />} />
          <Route path="/cards/add" element={<AddCard />} />
          <Route path="/card-remove-success" element={<CardRemoveSuccess />} />
          <Route path="/camera-page" element={<CameraPage />} />
          <Route path="/banking" element={<Banking />} />
          <Route path="/banking/add" element={<AddBank />} />
          <Route path="/banking/linked-accounts" element={<LinkedAccounts />} />
          <Route path="/bank-remove-success" element={<BankRemoveSuccess />} />
          <Route path="/security-dashboard" element={<SecurityDashboard />} />
          <Route path="/kyc-status-complete" element={<KYCStatusComplete />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/confirm-deactivation" element={<ConfirmDeactivation />} />
          <Route path="/account-deactivated" element={<AccountDeactivated />} />
          <Route path="/delete-account-reasons" element={<DeleteAccountReasons />} />
          <Route path="/delete-account-mobile" element={<DeleteAccountMobile />} />
          <Route path="/delete-account-otp" element={<DeleteAccountOTP />} />
          <Route path="/account-deleted" element={<AccountDeleted />} />
          <Route path="/account-retrieved" element={<AccountRetrieved />} />
          <Route path="/security/mpin-settings" element={<MpinSettings />} />
          <Route path="/forgot-mpin" element={<ForgotMpin />} />
          <Route path="/order-cash" element={<OrderCash />} />
          <Route path="/order-cash-summary" element={<OrderCashSummary />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/order-details/:orderId" element={<OrderDetails />} />
          <Route path="/schedule-delivery" element={<ScheduleDelivery />} />
          <Route path="/saved-addresses" element={<SavedAddresses />} />
          <Route path="/add-address" element={<AddAddress />} />
          <Route path="/add-address-details" element={<AddAddressDetails />} />
          <Route path="/order-cancelled" element={<OrderCancelled />} />
          <Route path="/order-tracking" element={<OrderTracking />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/wallet-created" element={<WalletCreated />} />
          <Route path="/wallet-transaction-history" element={<WalletTransactionHistory />} />
          <Route path="/wallet-settings" element={<WalletSettings />} />
          <Route path="/wallet-tier/:tierId" element={<WalletTierDetails />} />
          <Route path="/wallet-add-money" element={<WalletAddMoney />} />
          <Route path="/add-payment-method" element={<AddPaymentMethod />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/wallet-topup-success" element={<WalletTopUpSuccess />} />
          <Route path="/wallet-topup-failed" element={<WalletTopUpFailed />} />
          <Route path="/subscription-details" element={<SubscriptionSummary />} />
          <Route path="/wallet-upgrade-success" element={<WalletUpgradeSuccess />} />
          <Route path="/wallet-withdraw" element={<WalletWithdraw />} />
          <Route path="/wallet-withdraw-success" element={<WalletWithdrawSuccess />} />
          <Route path="/payment-missing" element={<PaymentMissing />} />
          <Route path="/select-payment-method" element={<SelectPaymentMethod />} />
          <Route path="/withdraw-otp" element={<WithdrawOTP />} />
          <Route path="/wallet-withdraw-failed" element={<WalletWithdrawFailed />} />
          <Route path="/view-rider-kyc/:orderId" element={<ViewRiderKyc />} />
          <Route path="/verify-rider-kyc" element={<VerifyRiderKyc />} />
          <Route path="/report-rider-kyc" element={<ReportRiderKyc />} />
          <Route path="/kyc-report-success" element={<KycReportSuccess />} />
          <Route path="/kyc-report-error" element={<KycReportError />} />
          <Route path="/report-rider-confirm" element={<ReportRiderConfirm />} />
          <Route path="/order-delivered" element={<OrderDelivered />} />
          <Route path="/help" element={<HelpSupport />} />
          <Route path="/help/report" element={<NeedHelp />} />
          <Route path="/help/category/:categoryId" element={<HelpCategoryPage />} />
          <Route path="/help/chat" element={<ZingChat />} />
          <Route path="/help/success" element={<HelpReportSuccess />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/legal/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/legal/terms" element={<LegalPage type="terms" />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="/fx-exchange" element={<FxExchange />} />
          <Route path="/fx-exchange-summary" element={<FxExchangeSummary />} />
          <Route path="/fx-success/:orderId" element={<FxSuccess />} />
          <Route path="/fx-intro" element={<FxIntro />} />
          <Route path="/fx-passport-gate" element={<FxPassportGate />} />
          <Route path="/fx-passport-kyc" element={<FxPassportKYC />} />
          <Route path="/fx-kyc-success" element={<FxKYCSuccess />} />
          <Route path="/live-rates" element={<LiveRates />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/manage-subscription" element={<ManageSubscription />} />
          <Route path="/downgrade-plan" element={<DowngradePlan />} />
          <Route path="/downgrade-summary" element={<DowngradeSummary />} />
          <Route path="/auth/v1/callback" element={<AuthCallback />} />
          <Route path="/delivery-caution" element={<DeliveryCaution />} />
          <Route path="/demo-glass" element={<DemoButtons />} />
          <Route path="/labs" element={<RefractionLab />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    </div>
    </SkeletonTheme>
  );
};

export default App;