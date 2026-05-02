export const config = { auth: false };

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import crypto from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Your hardcoded user ID for testing
const userId = "414c977e-6f70-4f57-bfa1-af0a8a2053a4";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    // 1️⃣ Initialize Supabase Client
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 2️⃣ Verify Razorpay Signature
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ success: false, message: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3️⃣ Check if already processed
    const { data: existingTx } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("reference_id", razorpay_payment_id)
      .single();

    if (existingTx) {
      return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4️⃣ Fetch Pending Payment (including the user who created it)
    const { data: pendingData, error: pendingError } = await supabase
      .from("pending_payments")
      .select("amount, status, user_id")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    console.log("[DEBUG] Pending Payment Data:", JSON.stringify(pendingData, null, 2));

    if (pendingError || !pendingData) {
      console.error("Pending record not found for order:", razorpay_order_id);
      return new Response(JSON.stringify({ success: false, message: "Pending record not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = pendingData.amount;
    const effectiveUserId = pendingData.user_id || userId; // Fallback to hardcoded for legacy

    console.log(`[DEBUG] Verifying payment for effectiveUserId: ${effectiveUserId}, amount: ${amount}`);

    // 5️⃣ Atomic deposit: updates wallets.available_balance + inserts transaction in one DB transaction
    console.log(`[DEBUG] Calling wallet_deposit with p_user_id: ${effectiveUserId}, p_amount: ${amount}`);
    const { error: depositError } = await supabase.rpc("wallet_deposit", {
      p_user_id: effectiveUserId,
      p_amount: amount,
      p_description: "Wallet top-up via Razorpay",
      p_reference_id: razorpay_payment_id,
    });

    console.log(`[DEBUG] wallet_deposit response error:`, depositError);

    if (depositError) {
      console.error("wallet_deposit RPC failed:", depositError);
      throw depositError;
    }

    // 8️⃣ Mark Pending Payment as Completed
    await supabase
      .from("pending_payments")
      .update({ status: "completed" })
      .eq("razorpay_order_id", razorpay_order_id);

    return new Response(JSON.stringify({ success: true, credited: amount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Verification Error:", error);
    return new Response(JSON.stringify({ success: false, message: "Verification failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});