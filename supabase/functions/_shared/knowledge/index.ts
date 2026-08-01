import type { ZingIntent } from "../intent.ts";
import type { KnowledgeModule } from "./types.ts";
import { appKnowledge } from "./app.ts";
import { walletKnowledge } from "./wallet.ts";
import { cashOrdersKnowledge } from "./cashOrders.ts";
import { orderLifecycleKnowledge } from "./orderLifecycle.ts";
import { kycKnowledge } from "./kyc.ts";
import { withdrawalKnowledge } from "./withdrawal.ts";
import { pricingKnowledge } from "./pricing.ts";
import { faqKnowledge } from "./faq.ts";
import { glossaryKnowledge } from "./glossary.ts";

export type { KnowledgeModule };
export {
  appKnowledge,
  walletKnowledge,
  cashOrdersKnowledge,
  orderLifecycleKnowledge,
  kycKnowledge,
  withdrawalKnowledge,
  pricingKnowledge,
  faqKnowledge,
  glossaryKnowledge,
};

const INTENT_KNOWLEDGE_MAP: Record<ZingIntent, KnowledgeModule[]> = {
  wallet_balance: [walletKnowledge, withdrawalKnowledge],
  kyc_status: [kycKnowledge, walletKnowledge],
  cash_order: [walletKnowledge, cashOrdersKnowledge, pricingKnowledge, kycKnowledge],
  order_status: [orderLifecycleKnowledge],
  order_problem: [orderLifecycleKnowledge, walletKnowledge, kycKnowledge, faqKnowledge],
  general_support: [appKnowledge, faqKnowledge, glossaryKnowledge],
};

/**
 * Builds a compact knowledge context string tailored strictly to the user's intent.
 * Automatically deduplicates module inclusions.
 */
export function buildKnowledgePrompt(intent: ZingIntent): string {
  const rawModules = INTENT_KNOWLEDGE_MAP[intent] ?? [appKnowledge, faqKnowledge];
  const uniqueModules = Array.from(new Set(rawModules));
  
  return uniqueModules
    .map((mod) => `### ${mod.title}\n${mod.content.trim()}`)
    .join("\n\n");
}
