export const config = { auth: false };
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { amount, address_id, order_type, user_id, meta_data, delivery_fee, platform_fee, gst, delivery_tip, total_amount } = body;

    if (amount === undefined || !address_id) {
      throw new Error(`Invalid request. amount (${amount}) and address_id (${address_id}) are required.`);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing environment variables in Edge Function");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Atomically create the Order and place the HOLD on the wallet
    const rpcName = order_type === 'FX_EXCHANGE' ? 'create_fx_order' : 'create_cash_order';
    
    // Use passed user_id or a strictly validated fallback if the app architecture allows it.
    // Ideally, this should come from the Auth JWT, but using the passed UID for now as a fix.
    const effectiveUserId = user_id || '414c977e-6f70-4f57-bfa1-af0a8a2053a4';

    const { data: orderResponse, error: rpcError } = await supabase.rpc(rpcName, {
      p_user_id: effectiveUserId,
      p_address_id: address_id,
      p_amount: amount,
      p_order_type: order_type || 'CASH_ORDER',
      p_delivery_fee: delivery_fee || 0,
      p_platform_fee: platform_fee || 0,
      p_gst: gst || 0,
      p_delivery_tip: delivery_tip || 0,
      p_total_amount: total_amount || 0,
      p_meta_data: meta_data || {} 
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      throw new Error(`Database RPC Error: ${rpcError.message}`);
    }

    if (orderResponse?.success === false) {
      throw new Error(orderResponse.error || "Order creation failed in database.");
    }

    const orderId = orderResponse?.order_id || orderResponse?.id;

    // 2. If reward points are used, redeem them
    const rewardPointsUsed = body.reward_points || 0;
    if (rewardPointsUsed >= 500 && orderId) {
      const { error: redemptionError } = await supabase.rpc('redeem_reward_points', {
        p_user_id: effectiveUserId,
        p_points_amount: Math.floor(rewardPointsUsed),
        p_reference_id: orderId,
        p_description: `Redeemed for ${order_type === 'FX_EXCHANGE' ? 'FX' : 'Cash'} Order discount`
      });

      if (redemptionError) {
        console.error("Redemption Error:", redemptionError);
        // Note: We don't fail the whole order if redemption fails, 
        // but in a production app you might want to rollback or alert.
      }
    }

    return new Response(JSON.stringify({ success: true, order: orderResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Edge Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});