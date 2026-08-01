import type { KnowledgeModule } from "./types.ts";

export const orderLifecycleKnowledge: KnowledgeModule = {
  title: "Order Lifecycle & Support Knowledge",
  version: 1,
  sourceFiles: [
    "src/pages/OrderCashSummary.tsx",
    "src/pages/OrderDetails.tsx",
    "src/pages/OrderTracking.tsx",
    "src/pages/ViewRiderKyc.tsx",
    "src/pages/ReportRiderKyc.tsx",
    "src/lib/helpData.ts",
  ],
  lastValidated: "repository",
  content: `
- Order Lifecycle States:
  * pending / created: Order placed, awaiting payment authorization.
  * payment_captured: Payment successfully verified; order queued for dispatch.
  * rider_assigned: Delivery rider assigned to fulfill the cash delivery.
  * out_for_delivery: Rider is en route to customer location.
  * delivered: Cash handed over and order completed.
  * cancelled / failed: Order cancelled or payment failed.
- Order Tracking & Verification:
  * Order status can be tracked via '/order-tracking' or '/order-details/:orderId'.
  * Rider credentials can be verified via '/view-rider-kyc/:orderId'.
- Support & Issues:
  * For missing/delayed orders or rider issues, use the "Need Help" action on the order details page or report via '/report-rider-kyc'.
  * Failed or cancelled order payments automatically refund to the original payment source in 2–5 business days.
`,
};
