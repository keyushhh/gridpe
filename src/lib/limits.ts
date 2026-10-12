/**
 * Delivery limits by plan tier.
 *
 * THE AUTHORITATIVE SOURCE IS THE SERVER, NOT THIS FILE.
 * `public.withdrawal_limits` holds the real values and
 * `check_withdrawal_limits()` enforces them on the order path
 * (see supabase/migrations/20260609134357_pro_subscription_system.sql).
 * An order that exceeds a limit is rejected server-side with `limit_exceeded`
 * regardless of what the client believes.
 *
 * These constants exist only so the UI can show a ceiling before the user
 * types. They are a mirror of the seeded rows and must be kept in step with
 * them. They previously drifted in two directions at once: OrderCash capped
 * Pro at 10,000/day (blocking Pro users the server would have allowed) and the
 * upgrade screen advertised 25,000/day (a number that existed nowhere else).
 *
 * TODO: read `withdrawal_limits` at runtime and delete these constants, so
 * there is one source of truth instead of a mirror that can drift again.
 */

export interface TierLimits {
  daily: number;
  monthly: number;
}

/** Mirrors the seeded rows of public.withdrawal_limits. */
export const TIER_LIMITS: Record<'free' | 'pro', TierLimits> = {
  free: { daily: 5_000, monthly: 25_000 },
  pro: { daily: 50_000, monthly: 200_000 },
};

/** Minimum order the app accepts. */
export const MIN_ORDER_AMOUNT = 500;

export function limitsForTier(planTier?: string | null): TierLimits {
  return planTier?.toLowerCase() === 'pro' ? TIER_LIMITS.pro : TIER_LIMITS.free;
}

/** "₹50,000/day • ₹2,00,000/month", for the upgrade screen. */
export function formatTierLimits(planTier: 'free' | 'pro'): string {
  const { daily, monthly } = TIER_LIMITS[planTier];
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  return `${inr(daily)}/day • ${inr(monthly)}/month`;
}
