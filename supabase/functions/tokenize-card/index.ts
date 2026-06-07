export const config = { auth: false };
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function is called by Cashfree webhook after successful 
// card verification payment to save the instrument
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const {
      user_id,
      cashfree_order_id,
      cashfree_instrument_id,
      cashfree_customer_id,
      card_holder_name,
      last_four,
      card_type,
      expiry_month,
      expiry_year,
    } = await req.json();

    if (!user_id || !last_four) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if card already exists (idempotency)
    const { data: existing } = await supabase
      .from("bank_cards")
      .select("id")
      .eq("user_id", user_id)
      .eq("last_four", last_four)
      .eq("expiry_month", expiry_month)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, card_id: existing.id, already_exists: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is user's first card — make it default
    const { count } = await supabase
      .from("bank_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user_id);

    const isFirstCard = (count ?? 0) === 0;

    const { data: card, error } = await supabase
      .from("bank_cards")
      .insert({
        user_id,
        card_holder_name,
        last_four,
        card_type,
        expiry_month,
        expiry_year,
        cashfree_instrument_id: cashfree_instrument_id || null,
        cashfree_customer_id: cashfree_customer_id || null,
        gateway_token_id: cashfree_order_id || null,
        is_default: isFirstCard,
        gateway: "cashfree",
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, card_id: card.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Save card error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});