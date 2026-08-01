export const config = { auth: false };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SARVAM_DEFAULT_CHAT_MODEL } from "../_shared/constants.ts";
import { getCustomerContext } from "../_shared/context.ts";
import type { CustomerContext } from "../_shared/context.ts";
import { analyzeZingIntent } from "../_shared/intent.ts";
import type { ZingIntentAnalysis } from "../_shared/intent.ts";
import { createRequestLogger } from "../_shared/logger.ts";
import { definePrompt } from "../_shared/prompts.ts";
import { SarvamClient } from "../_shared/sarvam.ts";
import type { SarvamChatMessage } from "../_shared/types.ts";

import { buildKnowledgePrompt } from "../_shared/knowledge/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_REPLY = "I’m sorry, I can’t help with that right now. Please try again shortly or contact Grid.Pe support for assistance.";

const FAQ_DB = [
  { keywords: ["crash", "bug", "stopped", "working", "slow", "lag"], answer: "For app performance issues, check your internet connection, restart the app, and clear its cache. If the issue continues, contact support." },
  { keywords: ["otp", "code", "sms"], answer: "If you did not receive an OTP, check your network connection and confirm that your SIM is active. You can then request a new OTP." },
  { keywords: ["login", "sign in", "log in", "access"], answer: "Check that you are using the correct mobile number. If you changed your number or still cannot sign in, contact support for help recovering access." },
  { keywords: ["notification", "alert", "message"], answer: "Enable Grid.Pe notifications in your device settings to receive important updates." },
  { keywords: ["location", "gps", "map"], answer: "Enable location services for Grid.Pe in device settings so location-based features can work correctly." },
  { keywords: ["order", "missing", "late", "food", "delivery", "item"], answer: "For a missing or delayed order, first review Order History. If you still need help, use the Need Help option on that order." },
  { keywords: ["rider", "driver", "delivery partner"], answer: "For rider or delivery updates, check the order details and use the Need Help option if further assistance is needed." },
  { keywords: ["refund", "money back", "return"], answer: "Refunds generally take 2–5 business days to return to the original payment method." },
  { keywords: ["fail", "payment failed", "transaction"], answer: "If a payment failed but money was deducted, it is generally auto-refunded within 2–5 business days. Check your payment history for status." },
  { keywords: ["limit", "kyc"], answer: "Wallet limits may apply until KYC is completed, in line with applicable RBI requirements." },
  { keywords: ["partner", "join", "drive", "earn"], answer: "To become a delivery partner, download the Partner app, submit the required documents, and wait for approval. There is no joining fee." },
  { keywords: ["zing", "who are you", "what are you"], answer: "Zing is Grid.Pe’s in-app assistant, here to help with common product and support questions." },
  { keywords: ["hello", "hi", "hey", "greetings"], answer: "Zing can help with orders, payments, wallet questions, account access, and app support." },
] as const;

type FaqEntry = typeof FAQ_DB[number];

const systemBehavior = definePrompt({
  id: "zing-system-behavior",
  version: 3,
  render: () => [
    "You are Zing, the Grid.Pe customer language engine and assistant.",
    "Strictly follow the KNOWLEDGE PRIORITY rules:",
    "  Priority 1: Verified Customer Context (If context conflicts with general knowledge, Customer Context wins).",
    "  Priority 2: Official Grid.Pe Knowledge Engine (Supplied knowledge modules).",
    "  Priority 3: General Model Knowledge (Only for natural language formatting and grammar).",
    "CRITICAL RULES:",
    "- Never invent product behaviour, features, or UI screens (e.g., do NOT mention 'Cash Out' or 'Withdraw page').",
    "- Never invent customer journeys, order states, pricing, or refund rules.",
    "- If knowledge or customer context is unavailable, explicitly state that the information is unavailable. Never guess.",
    "- Keep answers concise, accurate, and direct.",
  ].join("\n"),
});

const personality = definePrompt({
  id: "zing-personality",
  version: 1,
  render: () => [
    "Use a friendly, trustworthy, and professional fintech tone.",
    "Be confident and approachable, without sarcasm, jokes at the customer’s expense, or ChatGPT-style self-reference.",
  ].join("\n"),
});

const LANGUAGE_NAMES: Record<string, string> = {
  hi: "Hindi",
  kn: "Kannada",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  gu: "Gujarati",
  bn: "Bengali",
  ml: "Malayalam",
  pa: "Punjabi",
  or: "Odia",
};

const languageInstruction = definePrompt<{ preferredLanguage?: string }>({
  id: "zing-language-instruction",
  version: 1,
  render: ({ preferredLanguage }) => {
    if (!preferredLanguage || preferredLanguage.toLowerCase() === "en") return "";
    const langName = LANGUAGE_NAMES[preferredLanguage.toLowerCase()] ?? preferredLanguage;
    return `CRITICAL LANGUAGE REQUIREMENT: You MUST respond in ${langName}. Write all user-facing explanations and responses directly in ${langName}.`;
  },
});

const faqContext = definePrompt<{ entries: readonly FaqEntry[] }>({
  id: "zing-faq-context",
  version: 1,
  render: ({ entries }) => entries.length === 0
    ? "No directly relevant Grid.Pe FAQ entry was retrieved. Answer naturally without inventing product facts."
    : `Relevant Grid.Pe FAQ guidance:\n${entries.map((entry, index) => `${index + 1}. ${entry.answer}`).join("\n")}`,
});

const customerContext = definePrompt<{ context: CustomerContext }>({
  id: "zing-customer-context",
  version: 1,
  render: ({ context }) => {
    if (!context.authenticated) return "No verified customer context is available for this request.";
    const sections = ["Verified customer context:"];
    if (context.profile) {
      sections.push(`Profile: KYC status is ${context.profile.kycStatus ?? "not available"}; plan tier is ${context.profile.planTier}; preferred language is ${context.profile.preferredLanguage}; onboarding is ${context.profile.onboardingComplete ? "complete" : "incomplete or not confirmed"}.`);
    }
    if (context.wallet) sections.push(`Wallet: available balance is ${context.wallet.availableBalance}.`);
    if (context.limits) sections.push(`Cash-order limits: plan tier is ${context.limits.planTier}; daily limit is ${context.limits.dailyLimit}; monthly limit is ${context.limits.monthlyLimit}.`);
    if (context.currentOrder) {
      sections.push(`Current order: status is ${context.currentOrder.status}; type is ${context.currentOrder.type ?? "not available"}; total is ${context.currentOrder.totalAmount ?? "not available"} ${context.currentOrder.currency}; scheduled for ${context.currentOrder.scheduledFor ?? "not scheduled"}.`);
    }
    for (const [resource, status] of Object.entries(context.availability ?? {})) {
      if (status !== "available") sections.push(`${resource} information is ${status.replace("_", " ")}.`);
    }
    return sections.join("\n");
  },
});

const intentContext = definePrompt<{ analysis: ZingIntentAnalysis }>({
  id: "zing-intent-context",
  version: 1,
  render: ({ analysis }) => [
    `Detected intent: ${analysis.intent}.`,
    `Extracted entities: ${JSON.stringify(analysis.entities)}.`,
    `Required context: ${analysis.requiredContext.join(", ") || "none"}.`,
    "This is planning context only. Do not create an order, move money, or trigger any business action.",
  ].join("\n"),
});

function retrieveRelevantFaqs(message: string): FaqEntry[] {
  const normalizedMessage = message.toLowerCase();
  return FAQ_DB
    .map((entry, index) => ({ entry, index, score: entry.keywords.reduce(
      (score, keyword) => score + (containsKeyword(normalizedMessage, keyword) ? 1 : 0),
      0,
    ) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 3)
    .map(({ entry }) => entry);
}

function containsKeyword(message: string, keyword: string): boolean {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s|[.,!?])${escapedKeyword}(?=$|\\s|[.,!?])`, "i").test(message);
}

function jsonReply(reply: string): Response {
  return new Response(JSON.stringify({ reply }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

import { buildAction } from "../_shared/actions/index.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const logger = createRequestLogger("zing-ai", { model: SARVAM_DEFAULT_CHAT_MODEL });
  try {
    const payload = await req.json() as { message?: unknown; hasImage?: unknown };
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const hasImage = payload.hasImage === true;

    if (!message && !hasImage) {
      logger.success();
      return jsonReply("Please share your question and I’ll be happy to help.");
    }

    const intent = analyzeZingIntent(message);
    const customer = await getCustomerContext(
      req.headers.get("authorization"),
      { include: intent.requiredContext },
    );

    // Build internal structured action (NOT exposed in API contract)
    const internalAction = buildAction(intent.intent, intent.entities, customer, message);
    // Log only action type and confidence for telemetry; NEVER log messages, prompts, or user info
    console.log(JSON.stringify({
      event: "zing_structured_action_built",
      actionType: internalAction.type,
      confidence: internalAction.confidence,
    }));

    const userQuestion = hasImage
      ? `${message || "The customer attached an image."}\n\nAn image was attached, but its contents are not available in this request. Ask what they need help with and do not claim to have reviewed it.`
      : message;
    const langPrompt = languageInstruction.render({ preferredLanguage: customer.profile?.preferredLanguage });
    const systemPromptContent = [
      systemBehavior.render({}),
      personality.render({}),
      ...(langPrompt ? [langPrompt] : []),
      `## OFFICIAL GRID.PE KNOWLEDGE MODULES\n${buildKnowledgePrompt(intent.intent)}`,
      faqContext.render({ entries: retrieveRelevantFaqs(message) }),
      intentContext.render({ analysis: intent }),
      customerContext.render({ context: customer }),
    ].join("\n\n");

    const messages: SarvamChatMessage[] = [
      { role: "system", content: systemPromptContent },
      { role: "user", content: userQuestion },
    ];

    const completion = await new SarvamClient().chatCompletion({
      model: SARVAM_DEFAULT_CHAT_MODEL,
      messages,
      temperature: 0.2,
      maxTokens: 1024,
      reasoningEffort: "none",
    });
    logger.success();
    // Return strictly { reply: string } to preserve current API contract
    return jsonReply(completion.content);
  } catch (error) {
    logger.failure(error);
    // The shared client classifies upstream failures, but the client contract always
    // receives the same safe response shape regardless of the failure source.
    return jsonReply(FALLBACK_REPLY);
  }
});
