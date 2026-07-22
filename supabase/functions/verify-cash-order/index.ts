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
    const authUrl = Deno.env.get("SUPABASE_URL")!;
    const authServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(authUrl, authServiceRoleKey);

    // Identify the caller from their own session JWT — never trust a client-supplied user_id.
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: "No authorization header provided" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser(authHeader);
    if (authError || !authUser) {
      return new Response(JSON.stringify({ success: false, message: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user_id = authUser.id;

    const body = await req.json();
    const {
      cashfree_order_id,
      cashfree_payment_id,
      address_id,
      zone_id,
      city,
      cash_amount,
      total_amount,
      delivery_fee,
      platform_fee,
      gst,
      tip,
      reward_points,
      rider_earnings,
      hub_id,
      pickup_location,
      delivery_address_text,
      customer_phone_number,
      delivery_location_lng,
      delivery_location_lat,
      scheduled_at
    } = body;


    if (!cashfree_order_id) {
      return new Response(JSON.stringify({ success: false, message: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. SERVER-SIDE PAYMENT VERIFICATION
    const cashfreeEnv = Deno.env.get("CASHFREE_ENV") || "sandbox";
    const baseUrl = cashfreeEnv === "sandbox"
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";
      
    const cashfreeAppId = Deno.env.get("CASHFREE_APP_ID");
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!cashfreeAppId || !cashfreeSecretKey) {
      throw new Error("Cashfree credentials missing");
    }

    const verifyResponse = await fetch(`${baseUrl}/orders/${cashfree_order_id}`, {
      method: "GET",
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey
      }
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error("Cashfree verification error:", verifyResponse.status, errorText);
      return new Response(JSON.stringify({ success: false, message: "Failed to contact Cashfree API" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const verifyData = await verifyResponse.json();
    
    if (verifyData.order_status !== "PAID") {
      return new Response(JSON.stringify({ success: false, message: "Payment not confirmed by Cashfree" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = authClient;

    // 3. Check idempotency
    const { data: existingOrder, error: existingError } = await supabase
      .from("orders")
      .select("id")
      .eq("gateway_order_id", cashfree_order_id)
      .limit(1)
      .maybeSingle();


    if (existingError) {
      console.error("Database error checking existing order:", existingError);
      throw existingError;
    }

    if (existingOrder) {
      return new Response(JSON.stringify({ success: true, order_id: existingOrder.id, already_processed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Validate pending_payments row
    const { data: pendingPayment, error: pendingError } = await supabase
      .from("pending_payments")
      .select("status, user_id")
      .eq("gateway_order_id", cashfree_order_id)
      .single();


    if (pendingError || !pendingPayment) {
      console.error("Pending payment not found for order:", cashfree_order_id);
      return new Response(JSON.stringify({ success: false, message: "Pending payment record not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if ((pendingPayment.status !== "pending" && pendingPayment.status !== "webhook_captured") || pendingPayment.user_id !== user_id) {
      return new Response(JSON.stringify({ success: false, message: "Invalid pending payment state or user mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 5. Insert into orders table
    const orderPayload = {
      user_id,
      address_id,
      zone_id,
      city,
      amount: cash_amount,
      total_amount,
      payment_mode: 'CASHFREE',
      order_type: 'CASH_ORDER',
      currency: 'INR',
      status: 'payment_captured',
      type: 'cash',
      rider_earnings,
      hub_id,
      pickup_location,
      delivery_address_text,
      customer_phone_number,
      delivery_location: `POINT(${delivery_location_lng} ${delivery_location_lat})`,
      otp_code: Math.floor(100000 + Math.random() * 900000).toString(),
      delivery_fee,
      service_fee: platform_fee,
      gst,
      delivery_tip: tip,
      reward_points,
      scheduled_at,
      gateway_order_id: cashfree_order_id,
      gateway_payment_id: cashfree_payment_id,
      meta_data: {
        item_value: cash_amount,
        delivery_fee,
        delivery_tip: tip,
        gst,
        service_fee: platform_fee,
        reward_points,
        delivery_address: delivery_address_text,
        payment_gateway: 'cashfree',
        client_source: 'direct_checkout_v2'
      }
    };

    let insertedOrder;
    try {
      const { data, error: insertError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id")
        .single();
      
      insertedOrder = data;

      if (insertError || !insertedOrder) {
        console.error("Failed to insert order:", insertError);
        throw insertError || new Error("Failed to insert order");
      }
    } catch (insertException) {
      console.error("[verify] Exception during order insert:", insertException);
      throw insertException;
    }

    // 6. Mark pending_payments as completed
    const { error: updateError } = await supabase
      .from("pending_payments")
      .update({ status: 'completed' })
      .eq("gateway_order_id", cashfree_order_id);

    if (updateError) {
      console.error("Failed to update pending_payments status:", updateError);
      // We don't fail the response here since the order itself was successfully created
    }

    // Award reward points — fire and forget, never block payment confirmation
    const awardPointsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/award-reward-points`;
    fetch(awardPointsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        order_id: insertedOrder.id,
        user_id: user_id,
        order_amount: cash_amount,
      }),
    }).catch(() => {});

    // 7. Return success
    return new Response(JSON.stringify({ success: true, order_id: insertedOrder.id, status: 'payment_captured' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error verifying cash order:", error);
    return new Response(JSON.stringify({ success: false, message: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
