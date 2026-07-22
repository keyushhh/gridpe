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
    const supabaseUrlEarly = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKeyEarly = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(supabaseUrlEarly, serviceRoleKeyEarly);

    // Identify the caller from their own session JWT — never trust a client-supplied user_id.
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const { data: { user }, error: authError } = await authClient.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user_id = user.id;

    const body = await req.json();
    const {
      customer_phone,
      customer_name,
      customer_email,
      card_last_four,
      card_holder_name,
      card_type,
      expiry_month,
      expiry_year
    } = body;

    // Generate a unique order_id string
    const cashfreeOrderId = `gridpe_${Date.now()}_${user_id.slice(0, 8)}`;
    
    // Determine Cashfree environment and URLs
    const cashfreeEnv = Deno.env.get("CASHFREE_ENV") || "sandbox";
    const baseUrl = cashfreeEnv === "sandbox"
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";
      
    const cashfreeAppId = Deno.env.get("CASHFREE_APP_ID");
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error("Cashfree credentials missing");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const notifyUrl = `${supabaseUrl}/functions/v1/cashfree-webhook`;
    const returnUrl = `${supabaseUrl}/functions/v1/cashfree-return?order_id=${cashfreeOrderId}`;

    // Construct Cashfree API payload
    const cashfreePayload = {
      order_id: cashfreeOrderId,
      order_amount: 1.00,
      order_currency: "INR",
      customer_details: {
        customer_id: user_id,
        customer_phone: customer_phone,
        customer_name: customer_name,
        customer_email: customer_email || "customer@gridpe.in"
      },
      order_meta: {
        notify_url: notifyUrl,
        return_url: returnUrl
      },
      order_note: "Grid.Pe card verification (₹1 refundable)"
    };

    // Call Cashfree Orders API
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

    // Insert row into pending_payments table using service role client
    const supabase = authClient;
    const pendingPaymentInsert = {
      user_id: user_id,
      gateway_order_id: cashfreeOrderId,
      amount: 1.00,
      status: "pending",
      payment_type: "CARD_VERIFICATION",
      metadata: {
        purpose: "card_verification",
        card_last_four: card_last_four,
        card_holder_name: card_holder_name || null,
        card_type: card_type,
        expiry_month: expiry_month,
        expiry_year: expiry_year,
        gateway: "cashfree"
      }
    };

    const { error: dbError } = await supabase
      .from("pending_payments")
      .insert(pendingPaymentInsert);

    if (dbError) {
      console.error("Failed to insert into pending_payments:", dbError);
      throw dbError;
    }

    // Return success response
    const successResponse = {
      success: true,
      cashfree_order_id: cashfreeOrderId,
      payment_session_id: paymentSessionId,
      order_amount: 1.00,
      currency: "INR",
      cashfree_env: cashfreeEnv
    };

    return new Response(JSON.stringify(successResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error creating card verification order:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
