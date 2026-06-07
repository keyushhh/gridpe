export const config = { auth: false };

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, Authorization, apikey, content-type, Content-Type, x-client-info",
};

// Hardcoded user ID for testing
const userId = "414c977e-6f70-4f57-bfa1-af0a8a2053a4";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(e => ({}));
    const { amount, userId: bodyUserId, type } = body;
    const effectiveUserId = bodyUserId || userId;

    // 🛠️ EXTREMELY ROBUST ORDER TYPE LOGIC
    const incomingType = (type || "").toString().trim().toLowerCase();
    const isSubscriptionOrder = incomingType === "subscription_renewal" || incomingType === "tier_upgrade";
    const isStandardTopupOrder = ["wallet_topup", "fx_exchange", "cash_order"].includes(incomingType);
    const isUnknownType = !incomingType;

    console.log(`[DEBUG] Decision Engine - Raw: "${type}", Trimmed: "${incomingType}", isSub: ${isSubscriptionOrder}, isTopup: ${isStandardTopupOrder}, Amount: ${amount}`);

    // 1️⃣ SECURITY GATE 0: Minimum Amount (ONLY for wallet_topup)
    if (incomingType === "wallet_topup") {
        if (!amount || Number(amount) < 500) {
            return new Response(JSON.stringify({ error: "Minimum add amount is ₹500" }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }

    // 2️⃣ SECURITY GATE 1: Subscription Price Whitelist
    if (isSubscriptionOrder) {
        const validPrices = [0, 25, 50, 100];
        const numAmount = Number(amount) || 0;
        if (!validPrices.includes(numAmount)) {
            return new Response(JSON.stringify({ error: `Invalid subscription amount. Expected ₹0, ₹25, ₹50, or ₹100.` }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    // Initialize Supabase Admin Client bypassing RLS and JWT checks explicitly per user
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: '' } }
    });

    // 1️⃣ Fetch the Wallet and its attached Tier Limits
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select(`
        available_balance,
        wallet_tiers (
          max_wallet_balance,
          max_add_per_txn
        )
      `)
      .eq("user_id", effectiveUserId)
      .single();

    if (walletError || !walletData) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle array response from JOIN
    let tierData = walletData.wallet_tiers as any;
    if (Array.isArray(tierData)) {
      tierData = tierData[0];
    }

    if (!tierData) {
      return new Response(JSON.stringify({ error: "No wallet tier assigned to this user." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Precision Hardening: Use Math.floor on all server-side limit comparisons
    const currentBalance = Math.floor(Number(walletData.available_balance));
    const maxWalletBalance = Math.floor(Number(tierData.max_wallet_balance));
    const maxAddPerTxn = Math.floor(Number(tierData.max_add_per_txn));


    // 3️⃣ SECURITY GATE 2: Transaction Limits (ONLY for top-ups)
    if (isStandardTopupOrder || isUnknownType) {
        if (amount > maxAddPerTxn) {
           return new Response(JSON.stringify({ error: `Amount exceeds your per-transaction limit of ₹${maxAddPerTxn}` }), {
               status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
           });
        }

        if (currentBalance + amount > maxWalletBalance) {
          return new Response(JSON.stringify({ error: `Adding this amount exceeds your maximum wallet balance.` }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
    }

    // 4️⃣ Create Razorpay order
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay expects paise
        currency: "INR",
        receipt: crypto.randomUUID(),
      }),
    });

    const data = await razorpayRes.json();

    if (!razorpayRes.ok) {
      return new Response(
        JSON.stringify({ error: "Razorpay API failed", razorpay_error: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5️⃣ Insert pending payment record
    const { error: insertError } = await supabase
      .from("pending_payments")
      .insert({
        user_id: effectiveUserId,
        razorpay_order_id: data.id,
        amount: amount,
        status: "pending",
      });

    if (insertError) {
      throw insertError;
    }

    // 6️⃣ Return successful order data to frontend
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});