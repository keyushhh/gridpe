// @ts-nocheck
export const config = { auth: false };

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import crypto from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const timestamp = req.headers.get("x-webhook-timestamp");
    const signature = req.headers.get("x-webhook-signature");
    
    // Read raw body for signature verification
    const rawBody = await req.text();

    if (!timestamp || !signature) {
      console.warn("Missing Cashfree webhook headers");
      return new Response(JSON.stringify({ message: "Missing headers" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    if (!cashfreeSecretKey) {
      console.error("CASHFREE_SECRET_KEY not set");
      return new Response(JSON.stringify({ message: "Internal configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. SIGNATURE VERIFICATION
    const signedPayload = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac("sha256", cashfreeSecretKey)
      .update(signedPayload)
      .digest("base64");

    if (expectedSignature !== signature) {
      console.warn("Invalid Cashfree webhook signature");
      return new Response(JSON.stringify({ message: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Parse the webhook body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error("Failed to parse Cashfree webhook body");
      return new Response(JSON.stringify({ message: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { type, data } = body;

    // 4. Only process PAYMENT_SUCCESS_WEBHOOK
    if (type !== "PAYMENT_SUCCESS_WEBHOOK") {
      return new Response(JSON.stringify({ message: "Webhook received" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const order_id = data?.order?.order_id;
    if (!order_id) {
      console.error("Missing order_id in webhook data");
      return new Response(JSON.stringify({ message: "Missing order_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase Service Role client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 5. Check if order is already captured in the main orders table
    const { data: existingOrder, error: existingError } = await supabase
      .from("orders")
      .select("id")
      .eq("gateway_order_id", order_id)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Database error checking existing order:", existingError);
      return new Response(JSON.stringify({ message: "Database error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (existingOrder) {
      return new Response(JSON.stringify({ message: "Already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch the pending_payments row
    const { data: pendingPayment, error: pendingError } = await supabase
      .from("pending_payments")
      .select("status")
      .eq("gateway_order_id", order_id)
      .maybeSingle();

    if (pendingError) {
      console.error("Database error fetching pending payment:", pendingError);
      return new Response(JSON.stringify({ message: "Database error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (pendingPayment && pendingPayment.status === "pending") {
      // Update status to webhook_captured
      const { error: updateError } = await supabase
        .from("pending_payments")
        .update({ status: "webhook_captured" })
        .eq("gateway_order_id", order_id);

      if (updateError) {
        console.error("Failed to update pending payment status:", updateError);
      }
    }

    // 6. Always return 200 to Cashfree regardless of processing outcome
    return new Response(JSON.stringify({ message: "Webhook processed successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error processing cashfree webhook:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
