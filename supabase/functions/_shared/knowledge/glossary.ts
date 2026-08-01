import type { KnowledgeModule } from "./types.ts";

export const glossaryKnowledge: KnowledgeModule = {
  title: "Grid.Pe Product Terminology & Glossary",
  version: 1,
  sourceFiles: [
    "src/routes.ts",
    "src/lib/helpData.ts",
    "src/pages/ProUpgrade.tsx",
    "src/pages/KYCForm.tsx",
    "src/pages/OrderCashSummary.tsx",
  ],
  lastValidated: "repository",
  content: `
- Zing: Official Grid.Pe AI customer support assistant.
- Grid.Pe Wallet: Digital cash stored securely in user account for instant order payments and withdrawals.
- MPIN: 4-digit security PIN used to authenticate sensitive wallet transactions.
- Cash Order: Customer request for cash delivery to a designated location.
- Grid.Pe Pro: Subscription plan offering higher transaction limits (₹25,000/day), lower fees, priority dispatch, and early feature access.
- Didit: Third-party automated identity verification SDK for customer KYC processing.
- Cashfree: Integrated payment gateway handling card, UPI, and online checkout payments.
`,
};
