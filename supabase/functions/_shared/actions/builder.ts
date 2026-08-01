import type { ZingIntent, ZingEntities } from "../intent.ts";
import type { CustomerContext } from "../context.ts";
import type { ZingStructuredAction, ZingActionParameters } from "./types.ts";
import { INTENT_ACTION_MAP, mapMessageKeywordToAction } from "./mapper.ts";

/**
 * Pure TypeScript deterministic action builder.
 * Constructs structured AI actions with confidence scoring without LLM reasoning.
 */
export function buildAction(
  intent: ZingIntent,
  entities: ZingEntities,
  context?: CustomerContext,
  rawMessage?: string,
): ZingStructuredAction {
  // 1. Keyword check for specialized navigation overrides
  const keywordMapping = rawMessage ? mapMessageKeywordToAction(rawMessage) : null;
  const mapping = keywordMapping ?? INTENT_ACTION_MAP[intent] ?? {
    actionType: "general_chat",
    baseConfidence: 0.80,
  };

  const parameters: ZingActionParameters = {};
  let confidenceBonus = 0;

  // 2. Extract parameters & calculate confidence adjustments
  if (entities.amount) {
    parameters.amount = entities.amount.value;
    parameters.currency = entities.amount.currency;
    confidenceBonus += 0.03;

    if (mapping.actionType === "show_withdrawal_limits" || rawMessage?.toLowerCase().includes("withdraw")) {
      parameters.withdrawalAmount = entities.amount.value;
    }
  }

  if (entities.date) {
    parameters.date = entities.date.value;
    confidenceBonus += 0.01;
  }

  if (entities.time) {
    parameters.time = entities.time;
    confidenceBonus += 0.01;
  }

  // Set default orderType for cash order actions
  if (mapping.actionType === "prefill_cash_order") {
    parameters.orderType = "cash";
  }

  // Adjust confidence based on context availability
  if (context?.authenticated) {
    confidenceBonus += 0.01;
  }

  const finalConfidence = Math.min(1.0, Math.max(0.0, mapping.baseConfidence + confidenceBonus));

  return {
    type: mapping.actionType,
    confidence: Number(finalConfidence.toFixed(2)),
    parameters,
  };
}
