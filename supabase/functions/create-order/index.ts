export const config = { auth: false };
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { amount, address_id, order_type, user_id } = await req.json();

    // STRICT CHECK: The 400 error comes from here
    if (!amount || !address_id) {
      throw new Error("Invalid request. Amount and address_id are required.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Create the Order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user_id || '414c977e-6f70-4f57-bfa1-af0a8a2053a4',
        address_id,
        amount,
        order_type: order_type || 'CASH_ORDER',
        status: 'pending',
        payment_mode: 'wallet',
        currency: 'INR'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Place the HOLD on the wallet
    const { error: transactionError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user_id || '414c977e-6f70-4f57-bfa1-af0a8a2053a4',
        amount: -amount, // Negative for a hold
        transaction_type: 'held',
        order_id: order.id, // Maps to the new SQL column
        description: order_type === 'FX_EXCHANGE' ? 'FX Exchange Hold' : 'Cash Order Hold'
      });

    if (transactionError) throw transactionError;

    return new Response(JSON.stringify({ success: true, order }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});