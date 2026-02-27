export const config = {
  auth: false
};
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const PROJECT_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const userId = "414c977e-6f70-4f57-bfa1-af0a8a2053a4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
Deno.serve(async (req)=>{
  // 🔥 Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }
    console.log("REQUEST BODY:", await req.clone().json());
    const { amount, address_id, user_id, order_type, meta_data } = await req.json();

    const targetUserId = user_id || userId; // Use passed id or fallback to default

    if (!amount || !address_id) {
      return new Response(JSON.stringify({
        error: "Invalid request body: amount and address_id are required"
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 0️⃣ Verify Address exists (and log details for debugging/delivery integration)
    const addrRes = await fetch(`${PROJECT_URL}/rest/v1/addresses?id=eq.${address_id}`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`
      }
    });
    const addrData = await addrRes.json();
    const address = addrData[0];
    if (!address) {
       return new Response(JSON.stringify({ error: "Address not found" }), { status: 404, headers: corsHeaders });
    }
    console.log("Verified Delivery Address:", {
      apartment: address.apartment,
      area: address.area,
      city: address.city,
      plus_code: address.plus_code
    });

    // 1️⃣ Fetch wallet
    const walletRes = await fetch(`${PROJECT_URL}/rest/v1/wallets?user_id=eq.${targetUserId}`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`
      }
    });
    const walletData = await walletRes.json();
    const wallet = walletData[0];
    if (!wallet) {
      return new Response(JSON.stringify({
        error: "Wallet not found"
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    if (wallet.available_balance < amount) {
      return new Response(JSON.stringify({
        error: "Insufficient balance"
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // 2️⃣ Create order
    const orderRes = await fetch(`${PROJECT_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        user_id: targetUserId,
        address_id,
        amount,
        currency: "INR",
        payment_mode: "wallet",
        status: "processing",
        order_type: order_type || "CASH_ORDER",
        metadata: meta_data || {}
      })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(JSON.stringify(orderData));
    }
    const order = orderData[0];
    // 3️⃣ Move funds to held
    await fetch(`${PROJECT_URL}/rest/v1/wallets?id=eq.${wallet.id}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        available_balance: wallet.available_balance - amount,
        held_balance: wallet.held_balance + amount
      })
    });
    // 4️⃣ Insert ledger entry
    await fetch(`${PROJECT_URL}/rest/v1/wallet_transactions`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: targetUserId,
        type: "hold",
        amount,
        reference_id: order.id,
        description: `Amount held for ${order_type || 'order'}`
      })
    });
    return new Response(JSON.stringify({
      success: true,
      order_id: order.id
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
