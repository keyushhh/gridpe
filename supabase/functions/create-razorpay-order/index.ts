export const config = { auth: false };

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded user ID for testing
const userId = "414c977e-6f70-4f57-bfa1-af0a8a2053a4";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, userId: bodyUserId } = await req.json();
    const effectiveUserId = bodyUserId || userId;
    console.log(`[DEBUG] Received request to create order. Amount: ${amount}, UserID: ${effectiveUserId}`);

    if (!amount || amount < 500) {
      console.log(`[DEBUG] 400: Minimum amount check failed. Amount: ${amount}`);
      return new Response(
        JSON.stringify({ error: "Minimum add amount is ₹500" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    // Initialize Supabase Admin Client
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
      console.log(`[DEBUG] 404/Error: Wallet not found for user ${effectiveUserId}. Error:`, walletError);
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
      console.log(`[DEBUG] 400: No wallet tier assigned for user ${effectiveUserId}. Data:`, walletData);
      return new Response(JSON.stringify({ error: "No wallet tier assigned to this user." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Precision Hardening: Use Math.floor on all server-side limit comparisons
    const currentBalance = Math.floor(Number(walletData.available_balance));
    const maxWalletBalance = Math.floor(Number(tierData.max_wallet_balance));
    const maxAddPerTxn = Math.floor(Number(tierData.max_add_per_txn));

    console.log(`[DEBUG] Hardened Limits check for user ${effectiveUserId}:`, { currentBalance, maxWalletBalance, maxAddPerTxn });

    // 2️⃣ SECURITY GATE 1: Check Per-Transaction Limit
    if (amount > maxAddPerTxn) {
       console.log(`[DEBUG] 400: Per-transaction limit hit. Amount: ${amount}, Limit: ${maxAddPerTxn}`);
       return new Response(
        JSON.stringify({ 
          error: `Amount exceeds your per-transaction limit of ₹${maxAddPerTxn}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3️⃣ SECURITY GATE 2: Block if Top-up + Balance exceeds Total Wallet Limit
    if (currentBalance + amount > maxWalletBalance) {
      console.log(`[DEBUG] 400: Max wallet balance limit hit. Balance: ${currentBalance}, Adding: ${amount}, Max: ${maxWalletBalance}`);
      return new Response(
        JSON.stringify({ 
          error: `Adding this amount exceeds your maximum wallet balance. You can only add up to ₹${maxWalletBalance - currentBalance}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      console.log("Razorpay error response:", data);
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