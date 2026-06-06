// @ts-nocheck
export const config = { auth: false };

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  console.log("[create-cash-order] invoked at:", new Date().toISOString());
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      user_id,
      amount,
      total_payable,
      delivery_fee,
      platform_fee,
      gst,
      tip,
      reward_discount,
      address_id,
      zone_id,
      city,
      customer_phone,
      customer_name,
      customer_email,
      scheduled_at
    } = body;

    // Validate request
    if (!user_id || !total_payable || total_payable <= 0) {
      return new Response(JSON.stringify({ error: "Invalid request data: user_id and total_payable > 0 are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

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
      order_amount: total_payable,
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
      order_note: `Grid.Pe cash delivery ₹${amount}`
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
    console.log("[create-cash-order] Cashfree response status:", cashfreeResponse.status);
    console.log("[create-cash-order] Cashfree response body:", JSON.stringify(cashfreeData));

    const paymentSessionId = cashfreeData.payment_session_id;
    console.log("[create-cash-order] payment_session_id:", paymentSessionId);
    console.log("[create-cash-order] order_id:", cashfreeOrderId);

    if (!paymentSessionId) {
      throw new Error("No payment_session_id returned from Cashfree");
    }

    // Initialize Supabase Service Role client
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert row into pending_payments table using service role client
    const pendingPaymentInsert = {
      user_id: user_id,
      gateway_order_id: cashfreeOrderId, // reusing column for cashfree order id
      amount: total_payable,
      status: "pending",
      payment_type: "CASH_ORDER",
      metadata: {
        cash_amount: amount,
        delivery_fee: delivery_fee,
        platform_fee: platform_fee,
        gst: gst,
        tip: tip,
        reward_discount: reward_discount,
        address_id: address_id,
        zone_id: zone_id,
        city: city,
        scheduled_at: scheduled_at,
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
      order_amount: total_payable,
      currency: "INR",
      cashfree_env: cashfreeEnv
    };

    return new Response(JSON.stringify(successResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error creating cash order:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
