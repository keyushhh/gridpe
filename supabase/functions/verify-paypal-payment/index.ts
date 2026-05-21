// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const config = { auth: false };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, Authorization, apikey, content-type, Content-Type, x-client-info, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderID, userId, type, tier_name, amount } = await req.json();

    if (!orderID || !userId || !type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox";
    const PAYPAL_BASE_URL = PAYPAL_MODE === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("Missing PayPal credentials");
    }

    // 1. Get Access Token
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
    const tokenRes = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      throw new Error("Failed to get PayPal token");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Capture Order
    const captureRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    });

    if (!captureRes.ok) {
      const errorText = await captureRes.text();
      console.error("PayPal capture error:", errorText);
      throw new Error("Failed to capture PayPal order");
    }

    const captureData = await captureRes.json();
    if (captureData.status !== "COMPLETED") {
      throw new Error(`Payment capture not completed. Status: ${captureData.status}`);
    }

    const captureID = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderID;

    // 3. Process DB Updates
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (type === "wallet_topup") {
      const { data: existingTx } = await supabase
        .from("wallet_transactions")
        .select("id")
        .eq("reference_id", captureID)
        .single();

      if (existingTx) {
        return new Response(JSON.stringify({ success: true, captureID, message: "Already processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const { data: pendingData, error: pendingError } = await supabase
        .from("pending_payments")
        .select("amount, status, user_id")
        .eq("razorpay_order_id", orderID)
        .single();
        
      if (pendingError || !pendingData) {
        throw new Error("Pending record not found");
      }
      
      const amount = pendingData.amount;
      const effectiveUserId = pendingData.user_id || userId;
      
      const { error: depositError } = await supabase.rpc("wallet_deposit", {
        p_user_id: effectiveUserId,
        p_amount: amount,
        p_description: "Wallet top-up via PayPal",
        p_reference_id: captureID,
      });

      if (depositError) {
        throw depositError;
      }
      
      await supabase
        .from("pending_payments")
        .update({ status: "completed" })
        .eq("razorpay_order_id", orderID);
        
      return new Response(JSON.stringify({ success: true, captureID }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
      
    } else if (type === "tier_upgrade") {
      const { data: tierData } = await supabase.from("wallet_tiers").select("id, subscription_price").ilike("name", tier_name).single();
      if (!tierData) throw new Error("Tier not found in database.");

      const { data: pendingData, error: pendingError } = await supabase
        .from("pending_payments")
        .select("amount, status")
        .eq("razorpay_order_id", orderID)
        .single();

      if (pendingError || !pendingData) {
          throw new Error("Pending transaction not found.");
      }
      
      if (pendingData.status === "completed") {
           return new Response(JSON.stringify({ success: true, captureID: orderID, message: "Already processed" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
      }

      const expectedPrice = Number(tierData.subscription_price);
      if (pendingData.amount < expectedPrice) {
          throw new Error(`Amount paid (₹${pendingData.amount}) is less than expected subscription price (₹${expectedPrice})`);
      }

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      const nextBillingStr = nextDate.toISOString();

      await supabase.from("pending_payments").update({ status: "completed" }).eq("razorpay_order_id", orderID);

      await Promise.all([
        supabase.from("wallets").update({ tier_id: tierData.id }).eq("user_id", userId),
        supabase.from("profiles").update({ 
            current_tier_id: tierData.id, 
            next_billing_date: nextBillingStr,
            scheduled_tier_id: null,
            payment_status: 'completed'
        }).eq("id", userId),
        supabase.from("user_subscriptions").upsert({
            user_id: userId,
            status: 'active',
            current_period_end: nextBillingStr
        }, { onConflict: 'user_id' })
      ]);
      
      return new Response(JSON.stringify({ success: true, captureID: orderID }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      throw new Error(`Unsupported type: ${type}`);
    }

  } catch (err: any) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
