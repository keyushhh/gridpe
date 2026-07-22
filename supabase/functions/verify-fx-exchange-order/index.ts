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
    const { cashfree_order_id, cashfree_payment_id } = body;

    if (!cashfree_order_id) {
      return new Response(JSON.stringify({ success: false, message: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Server-side payment verification against Cashfree
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

    // Idempotency: has this Cashfree order already produced an order row?
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

    // Fetch the pending_payments row (written by create-fx-exchange-order) and
    // confirm it actually belongs to the caller before using its metadata.
    const { data: pendingPayment, error: pendingError } = await supabase
      .from("pending_payments")
      .select("status, user_id, metadata")
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

    const meta = pendingPayment.metadata || {};
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const orderPayload = {
      user_id,
      address_id: meta.address_id,
      zone_id: meta.zone_id,
      amount: meta.receive_amount,
      total_amount: meta.total_payable,
      payment_mode: 'CARD',
      order_type: 'FX_EXCHANGE',
      currency: 'INR',
      status: 'pending',
      type: 'fx',
      rider_earnings: meta.rider_earnings,
      hub_id: meta.hub_id,
      pickup_location: meta.pickup_location,
      delivery_address_text: meta.delivery_address_text,
      customer_phone_number: meta.customer_phone,
      delivery_location: `POINT(${meta.delivery_location_lng || 0} ${meta.delivery_location_lat || 0})`,
      otp_code: otpCode,
      delivery_fee: meta.delivery_fee,
      service_fee: meta.platform_fee,
      gst: meta.gst,
      delivery_tip: meta.tip,
      reward_points: meta.reward_points,
      gateway_order_id: cashfree_order_id,
      gateway_payment_id: cashfree_payment_id,
      meta_data: {
        is_fx: true,
        receive_amount: meta.receive_amount,
        hold_amount: meta.total_payable,
        from_currency: meta.from_currency,
        to_currency: meta.to_currency,
        fx_rate: meta.fx_rate,
        markup_amount: meta.markup_amount,
        flat_fee: meta.flat_fee,
        source_amount: meta.source_amount,
        base_rate: meta.fx_rate,
        markup: meta.markup_amount,
        delivery_fee: meta.delivery_fee,
        service_fee: meta.platform_fee,
        gst: meta.gst,
        delivery_tip: meta.tip,
        reward_points: meta.reward_points,
        delivery_address: meta.delivery_address_text,
        payment_gateway: 'cashfree',
        client_source: 'verify-fx-exchange-order'
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
        console.error("Failed to insert FX order:", insertError);
        throw insertError || new Error("Failed to insert FX order");
      }
    } catch (insertException) {
      console.error("[verify-fx-exchange-order] Exception during order insert:", insertException);
      throw insertException;
    }

    const { error: updateError } = await supabase
      .from("pending_payments")
      .update({ status: 'completed' })
      .eq("gateway_order_id", cashfree_order_id);

    if (updateError) {
      console.error("Failed to update pending_payments status:", updateError);
    }

    // Actually redeem the reward points now that payment succeeded and the
    // order exists. Never blocks the response — the discount was already
    // applied to what was charged; if this fails we log it rather than
    // undo an already-completed, already-paid order.
    const redeemedPoints = Number(meta.reward_points) || 0;
    if (redeemedPoints > 0) {
      const { error: redeemError } = await supabase.rpc('redeem_reward_points', {
        p_user_id: user_id,
        p_points_amount: redeemedPoints,
        p_reference_id: insertedOrder.id,
        p_description: 'Redeemed for FX Exchange discount'
      });
      if (redeemError) {
        console.error("Failed to redeem reward points:", redeemError);
      }
    }

    return new Response(JSON.stringify({ success: true, order_id: insertedOrder.id, status: 'pending' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error verifying FX exchange order:", error);
    return new Response(JSON.stringify({ success: false, message: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
