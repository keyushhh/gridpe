import type { KnowledgeModule } from "./types.ts";

export const walletKnowledge: KnowledgeModule = {
  title: "Wallet & Funding Knowledge",
  version: 1,
  sourceFiles: [
    "src/lib/helpData.ts",
    "supabase/migrations/20260721000000_fix_handle_new_user_wallet_tier.sql",
    "src/types/database.ts",
  ],
  lastValidated: "repository",
  content: `
- Grid.Pe Wallet Overview:
  * Digital cash vault within Grid.Pe for instant payments and cash orders.
  * Secured with MPIN and biometric authentication.
- Top-Up & Funding Methods:
  * Supported top-up payment methods: UPI, Debit/Credit cards, or Bank Transfer.
  * Adding money to the Grid.Pe wallet incurs no top-up fees.
- Account Limits & Regulations:
  * RBI regulations and limits apply to wallet balances and top-ups.
  * Daily and monthly limits depend on user KYC status and plan tier (Free vs. Pro).
- Discrepancy & Refund Rules:
  * If top-up payment fails but money is deducted from bank/card, auto-refund processes within 2–5 business days.
  * If wallet balance appears incorrect, users should refresh the wallet screen or contact support.
`,
};
