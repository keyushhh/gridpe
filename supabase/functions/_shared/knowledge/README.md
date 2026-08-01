# Grid.Pe AI Knowledge Engine Developer Guide

## Overview

The Grid.Pe AI Knowledge Engine modularizes domain product knowledge used by Zing (the Customer Zing AI assistant). Instead of placing a monolithic hardcoded string inside the system prompt, knowledge is split into isolated, single-responsibility TypeScript modules under `supabase/functions/_shared/knowledge/`.

Knowledge modules are composed dynamically based on the customer's detected intent (`analyzeZingIntent`), keeping the prompt concise, token-efficient, and free from hallucinations of unreleased or fictitious features.

---

## Directory Structure

```text
supabase/functions/_shared/knowledge/
├── types.ts           # Defines the KnowledgeModule interface
├── app.ts             # Application navigation, troubleshooting & security
├── wallet.ts          # Wallet top-up, funding methods & limits
├── cashOrders.ts      # Ordering cash, delivery options & scheduling
├── orderLifecycle.ts  # Order tracking, rider verification & states
├── kyc.ts             # Identity document rules & Didit verification
├── withdrawal.ts      # Bank payouts, withdrawal steps & limits
├── pricing.ts         # Dynamic fee quotes, slabs, Pro benefits & rewards
├── faq.ts             # Operating hours, rider signup & common FAQs
├── glossary.ts        # Grid.Pe product terminology & definitions
├── index.ts           # Exports modules and buildKnowledgePrompt composer
└── README.md          # This documentation
```

---

## How to Add a New Knowledge Module

To add a new product domain (e.g. `referrals.ts` or `fxExchange.ts`):

### Step 1: Create the Knowledge Module File

Create a new file in `supabase/functions/_shared/knowledge/` (e.g. `referrals.ts`):

```typescript
import type { KnowledgeModule } from "./types.ts";

export const referralsKnowledge: KnowledgeModule = {
  title: "Referral & Rewards Program",
  content: `
- Referral Program Overview:
  * Users invite friends using their unique referral link.
  * Bonus reward points are awarded when the referred friend completes their first cash order.
  * Points can be redeemed for fee discounts during order checkout.
`,
};
```

> **Rules for Content:**
> 1. Only include factual information that exists in the Grid.Pe codebase (UI screens, constants, backend procedures, or documentation).
> 2. Do **NOT** fabricate business rules, fees, or features.
> 3. If information is unavailable in the codebase, insert a clear `TODO: Knowledge not found in repository.` comment.

### Step 2: Export Module in `index.ts`

Open `supabase/functions/_shared/knowledge/index.ts`:

1. Import your module:
   ```typescript
   import { referralsKnowledge } from "./referrals.ts";
   ```
2. Re-export it from `index.ts`:
   ```typescript
   export { referralsKnowledge };
   ```

### Step 3: Map Module to Relevant Intents

In `supabase/functions/_shared/knowledge/index.ts`, update `INTENT_KNOWLEDGE_MAP` to map your module to relevant `ZingIntent` categories:

```typescript
const INTENT_KNOWLEDGE_MAP: Record<ZingIntent, KnowledgeModule[]> = {
  wallet_balance: [walletKnowledge, withdrawalKnowledge],
  kyc_status: [kycKnowledge, walletKnowledge],
  cash_order: [walletKnowledge, cashOrdersKnowledge, pricingKnowledge, kycKnowledge],
  order_status: [orderLifecycleKnowledge],
  order_problem: [orderLifecycleKnowledge, walletKnowledge, kycKnowledge, faqKnowledge],
  general_support: [appKnowledge, faqKnowledge, glossaryKnowledge, referralsKnowledge],
};
```

---

## Knowledge Composer Architecture

The primary entry point used by `zing-ai` edge function is `buildKnowledgePrompt(intent: ZingIntent)`.

```typescript
import { buildKnowledgePrompt } from "../_shared/knowledge/index.ts";

// In zing-ai handler:
const knowledgePrompt = buildKnowledgePrompt(intent.intent);
```

When invoked:
1. `buildKnowledgePrompt` retrieves only the `KnowledgeModule[]` mapped to the specified `intent`.
2. It concatenates the title and markdown content for those specific modules.
3. Modules not relevant to the intent are omitted, reducing system prompt token count and avoiding off-topic hallucinations.

---

## Best Practices & Guidelines

- **Read-Only / Isolated**: Knowledge modules contain plain static text structures. They must never make database queries, fetch external network APIs, or import UI/React components.
- **Single Source of Truth**: When changing fees, navigation routes, or limits, update the corresponding knowledge module file directly.
- **Validation**: After modifying or adding knowledge modules, run TypeScript type-checks (`npx tsc --noEmit`) to verify clean syntax across edge function imports.
