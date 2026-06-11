// @ts-nocheck
export const config = { auth: false };

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { order_id, user_id } = body;

    // Validate inputs
    if (!order_id || !user_id) {
      return new Response(JSON.stringify({ error: "Invalid request data: order_id and user_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const cashfreeEnv = Deno.env.get("CASHFREE_ENV") || "sandbox";
    const baseUrl = cashfreeEnv === "sandbox"
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";
      
    const cashfreeAppId = Deno.env.get("CASHFREE_APP_ID");
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error("Cashfree credentials missing");
    }

    // Verify payment with Cashfree
    const cashfreeResponse = await fetch(`${baseUrl}/orders/${order_id}`, {
      method: "GET",
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey
      }
    });

    if (!cashfreeResponse.ok) {
      const errorText = await cashfreeResponse.text();
      console.error("Cashfree API error:", cashfreeResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Cashfree API request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const cashfreeData = await cashfreeResponse.json();

    if (cashfreeData.order_status !== 'PAID') {
      return new Response(JSON.stringify({ error: "payment_not_completed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get pending_payment record
    const { data: pendingPayment, error: pendingError } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('gateway_order_id', order_id)
      .eq('user_id', user_id)
      .eq('type', 'pro_subscription')
      .maybeSingle();

    if (pendingError) {
      console.error("Database error fetching pending payment:", pendingError);
      throw pendingError;
    }

    if (!pendingPayment) {
      return new Response(JSON.stringify({ error: "order_not_found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (pendingPayment.status === 'completed') {
       return new Response(JSON.stringify({
        success: true,
        plan_tier: pendingPayment.metadata?.plan_tier || 'pro',
        billing_cycle: pendingPayment.metadata?.billing_cycle,
        message: 'Pro subscription already activated successfully'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Extract billing cycle and amount
    const billing_cycle = pendingPayment.metadata?.billing_cycle || 'monthly';
    const amount_paid = pendingPayment.amount;

    // Calculate expires_at
    const expiresAt = new Date();
    if (billing_cycle === 'monthly') {
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else if (billing_cycle === 'annual') {
      expiresAt.setDate(expiresAt.getDate() + 365);
    }

    // Upsert into user_subscriptions
    const subscriptionData = {
      user_id,
      plan_tier: 'pro',
      status: 'active',
      billing_cycle,
      amount_paid,
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      gateway_order_id: order_id,
      gateway_payment_id: cashfreeData.order_id // Note: could be payment ID if fetching payments, but we have order data
    };

    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' });

    if (upsertError) {
      console.error("Database error upserting subscription:", upsertError);
      throw upsertError;
    }

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ plan_tier: 'pro' })
      .eq('id', user_id);

    if (profileError) {
      console.error("Database error updating profile plan_tier:", profileError);
      // We continue as the subscription table holds the source of truth, though we should probably rollback or retry.
    }

    // Update pending_payments status to 'completed'
    const { error: updatePendingError } = await supabase
      .from('pending_payments')
      .update({ status: 'completed' })
      .eq('id', pendingPayment.id);

    if (updatePendingError) {
      console.error("Database error updating pending payment status:", updatePendingError);
    }

    return new Response(JSON.stringify({
      success: true,
      plan_tier: 'pro',
      billing_cycle,
      expires_at: expiresAt.toISOString(),
      message: 'Pro subscription activated successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error verifying pro subscription:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
