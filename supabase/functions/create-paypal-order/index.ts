// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const config = { auth: false };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, Authorization, apikey, content-type, Content-Type, x-client-info",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { amount, userId, type, tier_name, currency = "USD" } = body;
    
    if (!amount || !userId || !type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox";
    const PAYPAL_BASE_URL = PAYPAL_MODE === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("Missing PayPal credentials");
    }

    // 1. Get Access Token
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
    const tokenRes = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      const errorData = await tokenRes.text();
      console.error("PayPal token error:", errorData);
      throw new Error("Failed to get PayPal token");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Create PayPal Order
    const orderRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: Number(amount).toFixed(2)
          },
          payee: {
            email_address: "sb-rqkgx51276436@business.example.com"
          },
          description: type
        }],
        application_context: {
          brand_name: "Grid.Pe",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: "com.gridpe.customer://paypal-return",
          cancel_url: "com.gridpe.customer://paypal-cancel"
        }
      })
    });

    if (!orderRes.ok) {
      const errorData = await orderRes.text();
      console.error("PayPal create order error:", errorData);
      throw new Error("Failed to create PayPal order");
    }

    const orderData = await orderRes.json();
    const approveLink = orderData.links.find((link: any) => link.rel === "approve");

    if (!approveLink) {
      throw new Error("No approve link in PayPal response");
    }

    // 3. Insert pending payment
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: '' } }
    });

    const { error: insertError } = await supabase
      .from("pending_payments")
      .insert({
        user_id: userId,
        razorpay_order_id: orderData.id,
        amount: amount,
        status: "pending",
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ orderID: orderData.id, approvalUrl: approveLink.href }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
