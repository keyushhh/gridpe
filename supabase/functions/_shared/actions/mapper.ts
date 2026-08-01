import type { ZingIntent, ZingEntities } from "../intent.ts";
import type { CustomerContext } from "../context.ts";
import type { ZingActionType } from "./types.ts";

export interface IntentActionMapping {
  actionType: ZingActionType;
  baseConfidence: number;
}

export const INTENT_ACTION_MAP: Record<ZingIntent, IntentActionMapping> = {
  cash_order: {
    actionType: "prefill_cash_order",
    baseConfidence: 0.95,
  },
  wallet_balance: {
    actionType: "show_wallet_balance",
    baseConfidence: 0.95,
  },
  order_status: {
    actionType: "open_order_tracking",
    baseConfidence: 0.90,
  },
  order_problem: {
    actionType: "open_support",
    baseConfidence: 0.85,
  },
  kyc_status: {
    actionType: "open_kyc",
    baseConfidence: 0.95,
  },
  general_support: {
    actionType: "general_chat",
    baseConfidence: 0.80,
  },
};

/**
 * Custom keyword triggers for navigation/action overrides.
 */
export function mapMessageKeywordToAction(message: string): IntentActionMapping | null {
  const normalized = message.toLowerCase();
  
  if (/\b(withdraw|withdrawal limit|payout limit)\b/.test(normalized)) {
    return { actionType: "show_withdrawal_limits", baseConfidence: 0.90 };
  }
  if (/\b(bank|banking|linked account|bank account)\b/.test(normalized)) {
    return { actionType: "open_banking", baseConfidence: 0.92 };
  }
  if (/\b(wallet|stash|cash vault)\b/.test(normalized) && !/\bbalance\b/.test(normalized)) {
    return { actionType: "open_wallet", baseConfidence: 0.90 };
  }
  if (/\b(history|past orders|previous orders)\b/.test(normalized)) {
    return { actionType: "open_order_history", baseConfidence: 0.92 };
  }
  if (/\b(profile|edit profile|my info)\b/.test(normalized)) {
    return { actionType: "open_profile", baseConfidence: 0.90 };
  }
  if (/\b(notification|alerts)\b/.test(normalized)) {
    return { actionType: "open_notifications", baseConfidence: 0.90 };
  }
  if (/\b(settings|mpin|security)\b/.test(normalized)) {
    return { actionType: "open_settings", baseConfidence: 0.90 };
  }
  if (/\b(pro|gridpe pro|upgrade tier|upgrade plan)\b/.test(normalized)) {
    return { actionType: "open_pro_upgrade", baseConfidence: 0.95 };
  }

  return null;
}
