export type TrackingEvents = {
  'screen_view': { screen_name: string; path?: string };
  'onboarding_started': Record<string, never>;
  'onboarding_completed': { duration_seconds?: number };
  'kyc_started': { method?: string };
  'kyc_completed': { status: 'success' | 'failed'; error_message?: string };
  'order_created': { order_id: string; amount: number; currency: string };
  'order_delivered': { order_id: string };
  'payment_initiated': { order_id: string; amount: number; method: string };
  'payment_completed': { order_id: string; amount: number; status: 'success' | 'failed' };
  'pro_upgrade_initiated': Record<string, never>;
  'pro_upgrade_completed': { plan_id: string; amount: number };
  'app_opened': { source?: 'notification' | 'deeplink' | 'organic' };
};
