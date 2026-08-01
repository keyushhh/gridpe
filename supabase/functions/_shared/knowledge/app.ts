import type { KnowledgeModule } from "./types.ts";

export const appKnowledge: KnowledgeModule = {
  title: "App & Platform Knowledge",
  version: 1,
  sourceFiles: [
    "src/routes.ts",
    "src/lib/helpData.ts",
    "src/pages/DeleteAccount.tsx",
  ],
  lastValidated: "repository",
  content: `
- Navigation Routes in Grid.Pe Application:
  * Home Screen ('/home')
  * Settings & Profile ('/settings', '/profile-edit')
  * Security Dashboard ('/security-dashboard', '/security/mpin-settings', '/forgot-mpin')
  * KYC & Identity Verification ('/kyc-intro', '/kyc-form', '/kyc-status-complete')
  * Wallet & Banking ('/banking', '/banking/add', '/banking/linked-accounts', '/cards', '/cards/add')
  * Cash Delivery & Orders ('/order-cash', '/order-cash-summary', '/order-history', '/order-details/:orderId', '/schedule-delivery')
  * Foreign Exchange / FX ('/fx-exchange', '/fx-exchange-summary', '/live-rates', '/fx-intro', '/fx-passport-gate')
  * Subscriptions ('/pro-upgrade', '/pro-success')
  * Help & Support ('/help', '/help/chat')
- App Performance & Support Troubleshooting:
  * If app crashes or lags: Check internet connection, restart app, clear app cache.
  * If OTP is not received: Verify mobile number and SIM network activity before re-requesting OTP.
  * Account login: Login requires mobile number verification via OTP and MPIN/biometric authentication.
  * App Notifications: Enable notifications for Grid.Pe in device settings.
  * Location Services: Enable location permissions (GPS) for accurate delivery address tagging and delivery routing.
- Account Deletion Policy:
  * Account deletion can be requested via '/delete-account'.
  * Remaining wallet balance is refunded to the linked bank account before account deletion.
`,
};
