import type { CustomerContextResource } from "./context.ts";

export type ZingIntent =
  | "cash_order"
  | "order_problem"
  | "order_status"
  | "wallet_balance"
  | "kyc_status"
  | "general_support";

export interface ZingEntities {
  amount?: { value: number; currency: "INR" };
  date?: { value: string; kind: "relative" | "absolute" };
  time?: string;
}

export interface ZingIntentAnalysis {
  intent: ZingIntent;
  entities: ZingEntities;
  requiredContext: CustomerContextResource[];
}

const CONTEXT_BY_INTENT: Record<ZingIntent, CustomerContextResource[]> = {
  cash_order: ["wallet", "limits", "profile"],
  order_problem: ["wallet", "limits", "profile", "currentOrder"],
  order_status: ["currentOrder"],
  wallet_balance: ["wallet"],
  kyc_status: ["profile"],
  general_support: [],
};

/**
 * A deliberately small local classifier. It selects context before any model
 * call and never initiates an order or other business action.
 */
export function analyzeZingIntent(message: string): ZingIntentAnalysis {
  const normalized = message.toLowerCase();
  const entities = extractZingEntities(normalized);
  const intent = detectIntent(normalized, entities);
  return { intent, entities, requiredContext: CONTEXT_BY_INTENT[intent] };
}

function detectIntent(message: string, entities: ZingEntities): ZingIntent {
  if (/\b(can(?:not|['’]t)|unable to|cannot|won['’]t|will not)\s+(place|create|make).{0,24}\border\b/.test(message)
    || /\border\b.{0,24}\b(problem|issue|error|fail(?:ed)?|not working)\b/.test(message)) {
    return "order_problem";
  }
  if (/\b(where is|track|tracking|status of|late|delayed)\b.*\b(order|cash|delivery)\b/.test(message)
    || /\b(order|cash|delivery)\b.*\b(where is|track|tracking|late|delayed)\b/.test(message)) {
    return "order_status";
  }
  if (/\b(wallet|balance|available funds)\b/.test(message)) return "wallet_balance";
  if (/\bkyc\b|\bverification level\b/.test(message)) return "kyc_status";
  if (entities.amount && (/\b(need|cash|deliver|withdraw|tomorrow|today)\b/.test(message) || entities.time || entities.date)) {
    return "cash_order";
  }
  return "general_support";
}

function extractZingEntities(message: string): ZingEntities {
  const entities: ZingEntities = {};
  const amountMatch = message.match(/(?:₹|\brs\.?\b|\binr\b)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i)
    ?? message.match(/\b([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:rupees|rs\.?|inr)\b/i);
  if (amountMatch) {
    const value = Number(amountMatch[1].replaceAll(",", ""));
    if (Number.isFinite(value) && value > 0) entities.amount = { value, currency: "INR" };
  }

  const relativeDate = message.match(/\b(today|tomorrow)\b/);
  const absoluteDate = message.match(/\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/);
  if (relativeDate) entities.date = { value: relativeDate[1], kind: "relative" };
  else if (absoluteDate) entities.date = { value: absoluteDate[0], kind: "absolute" };

  const meridiemTime = message.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (meridiemTime) {
    let hour = Number(meridiemTime[1]);
    const minute = meridiemTime[2] ?? "00";
    if (hour >= 1 && hour <= 12 && Number(minute) <= 59) {
      if (meridiemTime[3] === "pm" && hour !== 12) hour += 12;
      if (meridiemTime[3] === "am" && hour === 12) hour = 0;
      entities.time = `${String(hour).padStart(2, "0")}:${minute}`;
    }
  } else {
    const twentyFourHourTime = message.match(/\bat\s+(\d{1,2}):(\d{2})\b/);
    if (twentyFourHourTime && Number(twentyFourHourTime[1]) <= 23 && Number(twentyFourHourTime[2]) <= 59) {
      entities.time = `${String(Number(twentyFourHourTime[1])).padStart(2, "0")}:${twentyFourHourTime[2]}`;
    }
  }

  return entities;
}
