import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import { UserProvider } from "./contexts/UserContext";
import { CustomToasterProvider } from "./contexts/CustomToasterContext";
import GlobalCustomToaster from "./components/GlobalCustomToaster";
import Index from "./pages/Index";
import Homepage from "./pages/Homepage";
import Settings from "./pages/Settings";
import KYCIntro from "./pages/KYCIntro";
import KYCForm from "./pages/KYCForm";
import KYCUpload from "./pages/KYCUpload";
import KYCSelfie from "./pages/KYCSelfie";
import KYCReview from "./pages/KYCReview";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Handle deep links for OAuth
    const listener = CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (url.startsWith('gridpe://')) {
        console.log("App opened with URL:", url); // Debug logging

        // Extract params from fragment (#) or query (?)
        // Supabase usually sends params in fragment for implicit flow
        // But for PKCE flow (default in v2) it sends 'code' in query?
        // Let's handle generic case:

        // Check for #access_token=...
        if (url.includes('access_token') && url.includes('refresh_token')) {
          // Parse fragment
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
        }
        // Check for ?code=... (PKCE) or #code=...
        else {
          // Robust parsing for code in query or fragment
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

    return () => {
      listener.then(handle => handle.remove());
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <CustomToasterProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <GlobalCustomToaster />
            <HashRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Homepage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/kyc-intro" element={<KYCIntro />} />
                <Route path="/kyc-form" element={<KYCForm />} />
                <Route path="/kyc-upload" element={<KYCUpload />} />
                <Route path="/kyc-selfie" element={<KYCSelfie />} />
                <Route path="/kyc-review" element={<KYCReview />} />
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
                <Route path="/view-rider-kyc" element={<ViewRiderKyc />} />
                <Route path="/verify-rider-kyc" element={<VerifyRiderKyc />} />
                <Route path="/report-rider-kyc" element={<ReportRiderKyc />} />
                <Route path="/kyc-report-success" element={<KycReportSuccess />} />
                <Route path="/kyc-report-error" element={<KycReportError />} />
                <Route path="/report-rider-confirm" element={<ReportRiderConfirm />} />
                <Route path="/order-delivered" element={<OrderDelivered />} />
                <Route path="/help" element={<HelpSupport />} />
                <Route path="/help/report" element={<NeedHelp />} />
                <Route path="/help/success" element={<HelpReportSuccess />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/legal/privacy" element={<LegalPage type="privacy" />} />
                <Route path="/legal/terms" element={<LegalPage type="terms" />} />
                <Route path="/more" element={<MorePage />} />
                <Route path="/fx-exchange" element={<FxExchange />} />
                <Route path="/auth/v1/callback" element={<AuthCallback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </CustomToasterProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

export default App;