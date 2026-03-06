export const config = { auth: false };

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import crypto from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // 1. Immediate Preflight Response
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, tier_name, user_id } = await req.json();
    const SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    console.log("[DEBUG] verify-subscription payload:", { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier_name, user_id });
    
    // 1. Signature Verification
    // Orders use: razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("[DEBUG] verify-subscription signature check:", { expected: expectedSignature, received: razorpay_signature });

    if (expectedSignature !== razorpay_signature) {
      console.error("[ERROR] Signature mismatch detected!");
      return new Response(JSON.stringify({ error: "Signature mismatch" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. Database Verify & Upgrade Logic
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get expected tier price
    const { data: tierData } = await supabase.from("wallet_tiers").select("id, subscription_price").ilike("name", tier_name).single();
    if (!tierData) throw new Error("Tier not found in database.");

    // Fetch the pending payment value and verify
    const { data: pendingData, error: pendingError } = await supabase
      .from("pending_payments")
      .select("amount, status")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (pendingError || !pendingData) {
        throw new Error("Pending transaction not found.");
    }
    
    if (pendingData.status === "completed") {
         return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
    }

    const expectedPrice = Number(tierData.subscription_price);
    if (pendingData.amount < expectedPrice) {
        throw new Error(`Amount paid (₹${pendingData.amount}) is less than expected subscription price (₹${expectedPrice})`);
    }

    // Calculate next billing date (+30 days)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    const nextBillingStr = nextDate.toISOString();

    // 3. Mark payment completed and sync wallets / profiles
    await supabase.from("pending_payments").update({ status: "completed" }).eq("razorpay_order_id", razorpay_order_id);

    await Promise.all([
      supabase.from("wallets").update({ tier_id: tierData.id }).eq("user_id", user_id),
      supabase.from("profiles").update({ 
          current_tier_id: tierData.id, 
          next_billing_date: nextBillingStr,
          scheduled_tier_id: null,
          payment_status: 'completed'
      }).eq("id", user_id),
      supabase.from("user_subscriptions").upsert({
          user_id: user_id,
          status: 'active',
          current_period_end: nextBillingStr
      }, { onConflict: 'user_id' })
    ]);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});