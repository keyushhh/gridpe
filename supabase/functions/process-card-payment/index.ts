// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const config = { auth: false };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, Authorization, apikey, content-type, Content-Type, x-client-info",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      paymentMethodId,
      amount,
      currency = "USD",
      userId,
    } = body;

    if (!paymentMethodId || !amount || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY secret");
    }

    // Create and Confirm PaymentIntent
    const piParams = new URLSearchParams({
      amount: String(Math.round(Number(amount) * 100)),
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: "true",
      "automatic_payment_methods[enabled]": "true",
      "automatic_payment_methods[allow_redirects]": "never",
    });

    const piRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: piParams,
    });

    const piData = await piRes.json();

    if (!piRes.ok) {
      console.error("Stripe payment intent error:", piData);
      return new Response(
        JSON.stringify({ error: piData.error?.message || "Failed to process payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentIntentId = piData.id;

    if (piData.status === "succeeded") {
      // DB Updates (Mirror verify-payment & verify-paypal-payment)
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        global: { headers: { Authorization: '' } }
      });

      // Insert pending payment record
      const { error: insertError } = await supabase
        .from("pending_payments")
        .insert({
          user_id: userId,
          razorpay_order_id: paymentIntentId,
          amount: amount,
          status: "pending",
        });

      if (insertError) {
        throw insertError;
      }

      // Call wallet_deposit RPC
      const { error: depositError } = await supabase.rpc("wallet_deposit", {
        p_user_id: userId,
        p_amount: amount,
        p_description: "Wallet top-up via Card",
        p_reference_id: paymentIntentId,
      });

      if (depositError) {
        throw depositError;
      }

      // Update pending payment to completed
      const { error: updateError } = await supabase
        .from("pending_payments")
        .update({ status: "completed" })
        .eq("razorpay_order_id", paymentIntentId);

      if (updateError) {
        throw updateError;
      }

      return new Response(JSON.stringify({ success: true, paymentIntentId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (piData.status === "requires_action") {
      // Handle 3D Secure
      return new Response(
        JSON.stringify({ requires_action: true, client_secret: piData.client_secret }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: `Payment failed with status: ${piData.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (err: any) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
