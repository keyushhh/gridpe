export const config = { auth: false };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // 1. Immediate Preflight Response
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, tier_name, user_id } = await req.json();

    const SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    
    // 2. Ultra-fast Native Verification
    const data = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET);
    const msgData = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: "Signature mismatch" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 3. Database Upgrade Logic
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.3");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SERVICE_ROLE_KEY")!);

    const { data: tierData } = await supabase.from("wallet_tiers").select("id").ilike("name", tier_name).single();
    
    await supabase.from("wallets").update({ tier_id: tierData.id }).eq("user_id", user_id);
    await supabase.from("user_subscriptions").update({ status: 'active' }).eq("razorpay_subscription_id", razorpay_subscription_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});