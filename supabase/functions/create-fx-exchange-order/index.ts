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

    // Identify the caller from their own session JWT — never trust a client-supplied user_id.
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
    const user_id = user.id;

    const body = await req.json();
    const {
      address_id,
      zone_id,
      receive_amount,
      total_payable,
      delivery_fee,
      platform_fee,
      gst,
      tip,
      reward_points,
      reward_discount,
      rider_earnings,
      hub_id,
      pickup_location,
      delivery_address_text,
      customer_phone,
      customer_name,
      customer_email,
      delivery_location_lng,
      delivery_location_lat,
      from_currency,
      to_currency,
      fx_rate,
      markup_amount,
      flat_fee,
      source_amount,
      service_amount,
    } = body;

    // Validate request
    if (!address_id || !zone_id || !total_payable || total_payable <= 0) {
      return new Response(JSON.stringify({ error: "Invalid request data: address_id, zone_id, and total_payable > 0 are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate server-side fees (mirrors create-cash-order's fee_mismatch guard).
    // FX conversion figures (receive_amount, fx_rate, markup, flat_fee) are trusted
    // client-side inputs — same as the "amount" a customer chooses in a cash order —
    // only the delivery/platform/gst fee structure is independently recomputed here.
    const { data: quoteData, error: quoteError } = await supabase.rpc('get_order_quote', {
      p_amount: receive_amount,
      p_order_type: 'fx',
      p_distance_km: 0,
      p_service_amount: service_amount || 0,
      p_user_id: user_id
    });

    if (quoteError || !quoteData) {
      console.error("Fee calculation error:", quoteError);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (Math.abs(quoteData.total_payable - total_payable) > 1) {
      return new Response(JSON.stringify({
        error: 'fee_mismatch',
        message: 'Fee calculation mismatch detected'
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Generate a unique order_id string
    const cashfreeOrderId = `gridpe_fx_${Date.now()}_${user_id.slice(0, 8)}`;

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

    const notifyUrl = `${supabaseUrl}/functions/v1/cashfree-webhook`;
    const returnUrl = `${supabaseUrl}/functions/v1/cashfree-return?order_id=${cashfreeOrderId}`;

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
      order_note: `Grid.Pe FX Exchange ${from_currency}->${to_currency}`
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

    // Store everything needed to reconstruct the order at verification time —
    // mirrors create-cash-order's use of pending_payments.metadata.
    const pendingPaymentInsert = {
      user_id: user_id,
      gateway_order_id: cashfreeOrderId,
      amount: total_payable,
      status: "pending",
      payment_type: "FX_EXCHANGE",
      metadata: {
        address_id,
        zone_id,
        receive_amount,
        total_payable,
        delivery_fee,
        platform_fee,
        gst,
        tip,
        reward_points,
        reward_discount,
        rider_earnings,
        hub_id,
        pickup_location,
        delivery_address_text,
        customer_phone,
        delivery_location_lng,
        delivery_location_lat,
        from_currency,
        to_currency,
        fx_rate,
        markup_amount,
        flat_fee,
        source_amount,
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
    console.error("Error creating FX exchange order:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
