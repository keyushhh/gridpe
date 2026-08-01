export type ZingActionType =
  | "prefill_cash_order"
  | "open_wallet"
  | "open_banking"
  | "open_kyc"
  | "open_support"
  | "open_order_tracking"
  | "open_order_history"
  | "open_profile"
  | "open_notifications"
  | "open_settings"
  | "open_pro_upgrade"
  | "show_withdrawal_limits"
  | "show_wallet_balance"
  | "show_order_status"
  | "general_chat";

export interface ZingActionParameters {
  amount?: number;
  currency?: "INR" | string;
  date?: string;
  time?: string;
  orderType?: "cash" | "fx" | string;
  withdrawalAmount?: number;
  destination?: string;
  [key: string]: unknown;
}

export interface ZingStructuredAction {
  type: ZingActionType;
  confidence: number; // 0.0 to 1.0
  parameters: ZingActionParameters;
}
