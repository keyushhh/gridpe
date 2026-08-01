import type { KnowledgeModule } from "./types.ts";

export const cashOrdersKnowledge: KnowledgeModule = {
  title: "Cash Orders Knowledge",
  version: 1,
  sourceFiles: [
    "src/pages/OrderCash.tsx",
    "src/pages/OrderCashSummary.tsx",
    "src/pages/Homepage.tsx",
    "supabase/functions/create-cash-order/index.ts",
  ],
  lastValidated: "repository",
  content: `
- Ordering Cash Delivery Flow:
  1. User selects desired cash amount on '/order-cash'.
  2. User selects or inputs delivery address.
  3. Delivery option can be instant or scheduled for a later time slot ('/schedule-delivery').
  4. System fetches dynamic fee quote (delivery fee, platform fee, GST).
  5. User completes payment via Cashfree payment gateway.
- Limits & Validations:
  * Orders check daily and monthly cash limits (e.g., daily limit exceeded error on exceeding caps).
  * Exceeding daily or monthly cash limits prevents checkout until caps reset or tier is upgraded.
`,
};
