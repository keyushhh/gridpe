// 1. THIS IS THE MOST IMPORTANT PART FOR BYPASSING THE ERROR
export const config = { auth: false }; 

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, origin",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Max-Age": "86400", // Cache the preflight for 24 hours
};

Deno.serve(async (req) => {
  // 2. Handle the Preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RZP_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
    const RZP_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    if (!RZP_ID || !RZP_SECRET) {
        throw new Error("Razorpay credentials missing in Edge Function secrets.");
    }

    const { tier_name, user_id = "414c977e-6f70-4f57-bfa1-af0a8a2053a4" } = await req.json();

    const PLAN_MAPPING: Record<string, string> = {
      "pro": "plan_SKqsz0ETeZhdZz",
      "elite": "plan_SKqun9trHGYHLp",
      "supreme": "plan_SKqv9uz4b32Bzv"
    };

    const plan_id = PLAN_MAPPING[tier_name?.toLowerCase()];
    if (!plan_id) throw new Error(`Invalid tier name: ${tier_name}`);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get Tier UUID
    const { data: tierData } = await supabase
        .from("wallet_tiers")
        .select("id")
        .ilike("name", tier_name)
        .single();

    if (!tierData) throw new Error("Tier not found in database.");

    // Razorpay API Call
    const auth = btoa(`${RZP_ID}:${RZP_SECRET}`);
    const rzpRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ plan_id, total_count: 120, customer_notify: 1 }),
    });

    const rzpData = await rzpRes.json();
    if (!rzpRes.ok) throw new Error(rzpData.error?.description || "Razorpay error");

    // Insert Subscription Record
    await supabase.from("user_subscriptions").insert({
        user_id,
        tier_id: tierData.id,
        razorpay_subscription_id: rzpData.id,
        status: 'created'
    });

    return new Response(JSON.stringify({ subscription_id: rzpData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});