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
    const { cashfree_order_id, user_id } = body;

    if (!cashfree_order_id || !user_id) {
      return new Response(JSON.stringify({ success: false, message: "Missing required fields" }), {
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

    // 1. Verify the order was actually PAID
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
      console.error("Cashfree order verify error:", verifyResponse.status, errorText);
      return new Response(JSON.stringify({ success: false, message: "Failed to verify payment with Cashfree" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const verifyData = await verifyResponse.json();
    console.log("[verify-card-order] order_status:", verifyData?.order_status);

    if (verifyData.order_status !== "PAID") {
      return new Response(JSON.stringify({ success: false, message: "Payment not confirmed by Cashfree" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 2. Check idempotency — card already saved for this order?
    const { data: existing } = await supabase
      .from("bank_cards")
      .select("id")
      .eq("gateway_token_id", cashfree_order_id)
      .maybeSingle();

    if (existing) {
      console.log("[verify-card-order] Card already saved for order:", cashfree_order_id);
      return new Response(JSON.stringify({ success: true, card_id: existing.id, already_exists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Fetch pending_payments to get card metadata
    const { data: pendingPayment, error: pendingError } = await supabase
      .from("pending_payments")
      .select("user_id, metadata, status")
      .eq("gateway_order_id", cashfree_order_id)
      .single();

    if (pendingError || !pendingPayment) {
      console.error("[verify-card-order] Pending payment not found:", cashfree_order_id);
      return new Response(JSON.stringify({ success: false, message: "Pending payment record not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (pendingPayment.user_id !== user_id) {
      return new Response(JSON.stringify({ success: false, message: "User mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Fetch payment details from Cashfree to get instrument_id
    const paymentsResponse = await fetch(`${baseUrl}/orders/${cashfree_order_id}/payments`, {
      method: "GET",
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey
      }
    });

    let cashfree_instrument_id: string | null = null;
    let cashfree_customer_id: string | null = user_id;

    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      console.log("[verify-card-order] payments:", JSON.stringify(paymentsData));
      const payment = Array.isArray(paymentsData) ? paymentsData[0] : paymentsData;
      cashfree_instrument_id = payment?.payment_method?.card?.instrument_id || null;
    } else {
      console.warn("[verify-card-order] Could not fetch payment instruments, continuing without instrument_id");
    }

    // 5. Read card metadata stored at order creation time
    const meta = pendingPayment.metadata || {};
    const card_last_four = meta.card_last_four || null;
    const card_holder_name = meta.card_holder_name || null;
    const card_type = meta.card_type || null;
    const expiry_month = meta.expiry_month || null;
    const expiry_year = meta.expiry_year || null;

    // 6. Check if card already exists by last_four + expiry (idempotency)
    if (card_last_four && expiry_month) {
      const { data: existingByCard } = await supabase
        .from("bank_cards")
        .select("id")
        .eq("user_id", user_id)
        .eq("last_four", card_last_four)
        .eq("expiry_month", expiry_month)
        .maybeSingle();

      if (existingByCard) {
        await supabase
          .from("pending_payments")
          .update({ status: "completed" })
          .eq("gateway_order_id", cashfree_order_id);

        return new Response(JSON.stringify({ success: true, card_id: existingByCard.id, already_exists: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 7. Check if this is the user's first card
    const { count } = await supabase
      .from("bank_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user_id);

    const isFirstCard = (count ?? 0) === 0;

    // 8. Insert into bank_cards
    const { data: card, error: insertError } = await supabase
      .from("bank_cards")
      .insert({
        user_id,
        card_holder_name,
        last_four: card_last_four,
        card_type,
        expiry_month,
        expiry_year,
        cashfree_instrument_id,
        cashfree_customer_id,
        gateway_token_id: cashfree_order_id,
        is_default: isFirstCard,
        gateway: "cashfree",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[verify-card-order] Insert error:", insertError);
      throw insertError;
    }

    // 9. Mark pending_payment as completed
    await supabase
      .from("pending_payments")
      .update({ status: "completed" })
      .eq("gateway_order_id", cashfree_order_id);

    console.log("[verify-card-order] Card saved successfully:", card.id);

    return new Response(JSON.stringify({ success: true, card_id: card.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[verify-card-order] Error:", error);
    return new Response(JSON.stringify({ success: false, message: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
