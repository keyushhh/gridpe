import type { KnowledgeModule } from "./types.ts";

export const pricingKnowledge: KnowledgeModule = {
  title: "Pricing, Fees & Subscriptions Knowledge",
  version: 1,
  sourceFiles: [
    "supabase/migrations/20260609134357_pro_subscription_system.sql",
    "src/pages/OrderCashSummary.tsx",
    "src/pages/ProUpgrade.tsx",
    "src/pages/ProSuccess.tsx",
  ],
  lastValidated: "repository",
  content: `
- Fee Calculation:
  * Total Payable = Order Base Amount + Delivery Fee + Platform Fee + GST.
  * Fee components are calculated dynamically from tier-based fee slabs in the database.
- Grid.Pe Pro Subscription:
  * Upgraded delivery limits: ₹25,000/day and ₹1,00,000/month.
  * Benefits include priority deliveries, lower service fees, scheduled delivery windows, and FX access.
  * To manage or cancel Pro subscription, users contact support at support@gridpe.in.
- Rewards & Discounts:
  * Reward points can be applied at checkout (1 reward point = ₹0.025 discount).
`,
};
