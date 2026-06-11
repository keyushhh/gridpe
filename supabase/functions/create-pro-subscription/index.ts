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
    const { user_id, billing_cycle } = body;

    // Validate inputs
    if (!user_id || !billing_cycle || !['monthly', 'annual'].includes(billing_cycle)) {
      return new Response(JSON.stringify({ error: "Invalid request data: user_id and valid billing_cycle ('monthly' or 'annual') are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Determine amount
    const amount = billing_cycle === 'monthly' ? 99.00 : 999.00;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if user already has active Pro subscription
    const { data: existingSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .eq('plan_tier', 'pro')
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("Error checking existing subscription:", subError);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (existingSub) {
      return new Response(JSON.stringify({ 
        error: 'already_subscribed', 
        message: 'User already has an active Pro subscription' 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch customer details from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, phone, email')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Create Cashfree order
    const cashfreeOrderId = `PRO-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
    
    const cashfreeEnv = Deno.env.get("CASHFREE_ENV") || "sandbox";
    const baseUrl = cashfreeEnv === "sandbox"
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";
      
    const cashfreeAppId = Deno.env.get("CASHFREE_APP_ID");
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error("Cashfree credentials missing");
    }

    const returnUrl = `${supabaseUrl}/functions/v1/pro-subscription-return?order_id=${cashfreeOrderId}`;

    const cashfreePayload = {
      order_id: cashfreeOrderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: user_id,
        customer_phone: profile.phone || "9999999999",
        customer_name: profile.name || "Customer",
        customer_email: profile.email || "customer@gridpe.in"
      },
      order_meta: {
        return_url: returnUrl
      },
      order_note: `Grid.Pe Pro - ${billing_cycle}`
    };

    const cashfreeResponse = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey
      },
      body: JSON.stringify(cashfreePayload)
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
    const paymentSessionId = cashfreeData.payment_session_id;

    if (!paymentSessionId) {
      throw new Error("No payment_session_id returned from Cashfree");
    }

    // Insert into pending_payments table
    const pendingPaymentInsert = {
      user_id: user_id,
      amount: amount,
      type: 'pro_subscription',
      status: 'pending',
      gateway_order_id: cashfreeOrderId,
      metadata: {
        billing_cycle,
        plan_tier: 'pro',
        amount_paid: amount
      }
    };

    const { error: dbError } = await supabase
      .from("pending_payments")
      .insert(pendingPaymentInsert);

    if (dbError) {
      console.error("Failed to insert into pending_payments:", dbError);
      throw dbError;
    }

    return new Response(JSON.stringify({
      payment_session_id: paymentSessionId,
      order_id: cashfreeOrderId,
      amount,
      billing_cycle
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error creating pro subscription order:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
