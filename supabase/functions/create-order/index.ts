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

    // 1. Atomically create the Order and place the HOLD on the wallet
    const { data: orderResponse, error: rpcError } = await supabase.rpc('create_cash_order', {
      p_user_id: user_id || '414c977e-6f70-4f57-bfa1-af0a8a2053a4',
      p_address_id: address_id,
      p_amount: amount,
      p_order_type: order_type || 'CASH_ORDER',
      p_meta_data: {} // Default empty JSONB, real metadata isn't strictly requested in this edge function payload yet but added as parameter
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error(rpcError.message);
    }

    return new Response(JSON.stringify({ success: true, order: orderResponse }), {
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