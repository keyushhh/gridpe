import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY_ENV, SUPABASE_URL_ENV } from "./constants.ts";

export type CustomerContextResource = "profile" | "wallet" | "limits" | "currentOrder";
type ContextAvailability = "available" | "not_found" | "unavailable";

export interface CustomerContext {
  authenticated: boolean;
  profile?: {
    kycStatus: string | null;
    planTier: string;
    preferredLanguage: string;
    onboardingComplete: boolean | null;
  };
  wallet?: {
    availableBalance: number;
  };
  limits?: {
    planTier: string;
    dailyLimit: number;
    monthlyLimit: number;
  };
  currentOrder?: {
    status: string;
    type: string | null;
    totalAmount: number | null;
    currency: string;
    scheduledFor: string | null;
  };
  availability?: Partial<Record<CustomerContextResource, ContextAvailability>>;
}

export interface CustomerContextOptions {
  include: CustomerContextResource[];
}

interface ProfileRow {
  kyc_status: string | null;
  plan_tier: string;
  preferred_language: string;
  is_onboarded: boolean | null;
}

interface WalletRow {
  available_balance: number;
}

interface WithdrawalLimitRow {
  daily_limit: number;
  monthly_limit: number;
}

interface OrderRow {
  status: string;
  order_type: string | null;
  total_amount: number | null;
  currency: string;
  scheduled_at: string | null;
}

/**
 * Builds a minimal, RLS-scoped customer context. The access token is used only
 * for verification and database authorization; it is never included in output.
 */
export async function getCustomerContext(
  authorizationHeader?: string | null,
  options: CustomerContextOptions = { include: [] },
): Promise<CustomerContext> {
  const accessToken = getBearerToken(authorizationHeader);
  const supabaseUrl = Deno.env.get(SUPABASE_URL_ENV);
  const supabaseAnonKey = Deno.env.get(SUPABASE_ANON_KEY_ENV);
  if (!accessToken || !supabaseUrl || !supabaseAnonKey) {
    return { authenticated: false };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  let userId: string;
  try {
    const { data, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !data.user) return { authenticated: false };
    userId = data.user.id;
  } catch {
    return { authenticated: false };
  }

  const requested = new Set(options.include);
  const needsProfile = requested.has("profile") || requested.has("limits");
  const availability: CustomerContext["availability"] = {};
  const context: CustomerContext = { authenticated: true, availability };
  const activeOrderStatuses = ["payment_captured", "processing", "out_for_delivery", "arrived", "pending", "accepted", "picked_up"];

  try {
    const [profileResult, walletResult, orderResult] = await Promise.all([
      needsProfile
        ? supabase.from("profiles").select("kyc_status, plan_tier, preferred_language, is_onboarded").eq("id", userId).maybeSingle()
        : Promise.resolve(null),
      requested.has("wallet")
        ? supabase.from("wallets").select("available_balance").eq("user_id", userId).maybeSingle()
        : Promise.resolve(null),
      requested.has("currentOrder")
        ? supabase.from("orders").select("status, order_type, total_amount, currency, scheduled_at").eq("user_id", userId).in("status", activeOrderStatuses).order("updated_at", { ascending: false }).limit(1).maybeSingle()
        : Promise.resolve(null),
    ]);

    if (profileResult) {
      const profile = profileResult.data as ProfileRow | null;
      if (requested.has("profile")) {
        availability.profile = profileResult.error ? "unavailable" : profile ? "available" : "not_found";
      }
      if (profile && requested.has("profile")) {
        context.profile = {
          kycStatus: profile.kyc_status,
          planTier: profile.plan_tier,
          preferredLanguage: profile.preferred_language,
          onboardingComplete: profile.is_onboarded,
        };
      }

      if (requested.has("limits")) {
        if (profileResult.error) {
          availability.limits = "unavailable";
        } else if (!profile) {
          availability.limits = "not_found";
        } else {
          const { data, error } = await supabase
            .from("withdrawal_limits")
            .select("daily_limit, monthly_limit")
            .eq("plan_tier", profile.plan_tier)
            .eq("is_active", true)
            .maybeSingle();
          const limits = data as WithdrawalLimitRow | null;
          availability.limits = error ? "unavailable" : limits ? "available" : "not_found";
          if (limits) {
            context.limits = {
              planTier: profile.plan_tier,
              dailyLimit: limits.daily_limit,
              monthlyLimit: limits.monthly_limit,
            };
          }
        }
      }
    }

    if (walletResult) {
      const wallet = walletResult.data as WalletRow | null;
      availability.wallet = walletResult.error ? "unavailable" : wallet ? "available" : "not_found";
      if (wallet) context.wallet = { availableBalance: wallet.available_balance };
    }

    if (orderResult) {
      const order = orderResult.data as OrderRow | null;
      availability.currentOrder = orderResult.error ? "unavailable" : order ? "available" : "not_found";
      if (order) {
        context.currentOrder = {
          status: order.status,
          type: order.order_type,
          totalAmount: order.total_amount,
          currency: order.currency,
          scheduledFor: order.scheduled_at,
        };
      }
    }
    return context;
  } catch {
    for (const resource of requested) availability[resource] = "unavailable";
    return context;
  }
}

function getBearerToken(authorizationHeader?: string | null): string | undefined {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

export interface RiderContext {
  riderId: string;
}

export interface WalletContext {
  customerId: string;
}

export interface OrderContext {
  orderId: string;
}

export async function getRiderContext(riderId: string): Promise<RiderContext> {
  return { riderId };
}

export async function getWalletContext(customerId: string): Promise<WalletContext> {
  return { customerId };
}

export async function getOrderContext(orderId: string): Promise<OrderContext> {
  return { orderId };
}
