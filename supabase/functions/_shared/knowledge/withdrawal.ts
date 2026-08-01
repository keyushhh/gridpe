import type { KnowledgeModule } from "./types.ts";

export const withdrawalKnowledge: KnowledgeModule = {
  title: "Withdrawals & Bank Payouts Knowledge",
  version: 1,
  sourceFiles: [
    "src/pages/Banking.tsx",
    "src/lib/banking.ts",
    "src/lib/helpData.ts",
  ],
  lastValidated: "repository",
  content: `
- Wallet Withdrawals / Payouts:
  * Users can withdraw wallet funds to a verified linked bank account (Wallet -> Withdraw -> Enter bank details).
  * Bank account verification is required before initiating withdrawal payouts.
- Fees & Processing:
  * Adding money is free. Outbound withdrawals or transfers may incur small processing fees disclosed upfront.
`,
};
