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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Identify the caller from their own session JWT — never trust a client-supplied userId.
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const userId = user.id;

    const body = await req.json();
    const { billingCycle } = body;

    // Validate inputs
    if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
      return new Response(JSON.stringify({ error: "Invalid request data: valid billingCycle ('monthly' or 'annual') is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Determine amount dynamically based on the cycle (processed as decimal strings)
    const amount = billingCycle === 'monthly' ? "99.00" : "990.00";

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
      order_amount: amount, // Passed as decimal string
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_phone: "9999999999",
        customer_name: "Customer",
        customer_email: "customer@gridpe.in"
      },
      order_meta: {
        return_url: returnUrl
      },
      // In Cashfree metadata, securely include user_id, requested_tier: "pro", and billing_cycle
      order_tags: {
        user_id: userId,
        requested_tier: "pro",
        billing_cycle: billingCycle
      },
      order_note: `Grid.Pe Pro - ${billingCycle}`
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

    // Insert a tracking row into the pending_payments table with status 'pending'
    const pendingPaymentInsert = {
      user_id: userId,
      gateway_order_id: cashfreeOrderId,
      amount: amount,
      status: 'pending',
      metadata: { billing_cycle: billingCycle }
    };

    const { error: dbError } = await supabase
      .from("pending_payments")
      .insert(pendingPaymentInsert);

    if (dbError) {
      console.error("Failed to insert into pending_payments:", dbError);
      throw dbError;
    }

    // Returning payment details to the client
    return new Response(JSON.stringify({
      payment_session_id: paymentSessionId,
      order_id: cashfreeOrderId,
      amount: amount,
      billing_cycle: billingCycle
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Error creating pro subscription order:", error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
