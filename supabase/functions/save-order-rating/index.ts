export const config = { auth: false };
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get User ID from JWT manually
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error("Invalid or expired token");
    }
    const user_id = user.id;

    // 2. Parse and Validate Body
    const body = await req.json();
    const { order_id, rider_id, stars, recommend_solo, feedback, tip_amount = 0 } = body;

    if (!order_id || !rider_id || stars === undefined) {
      throw new Error("order_id, rider_id, and stars are required");
    }

    if (stars < 1 || stars > 5) {
      throw new Error("stars must be between 1 and 5");
    }

    // 3. Validate Order Ownership and Status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or database error checking order");
    }

    if (order.user_id !== user_id) {
      throw new Error("Unauthorized: Order does not belong to you");
    }

    if (!['success', 'delivered'].includes(order.status)) {
      throw new Error(`Order status must be 'success' or 'delivered' to provide a rating. Current status: ${order.status}`);
    }

    // 4. Check for existing rating to prevent duplicates
    const { data: existingRating } = await supabase
      .from('order_ratings')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle();

    if (existingRating) {
      throw new Error("Order already has a rating");
    }

    // 5. Insert into order_ratings table
    const { error: insertError } = await supabase
      .from('order_ratings')
      .insert({
        order_id,
        user_id,
        rider_id,
        stars,
        recommend_solo,
        feedback,
        tip_amount
      });

    if (insertError) {
      throw new Error(`Failed to save rating: ${insertError.message}`);
    }

    // 6. Update Riders Table Statistics
    // Fetch all ratings for this rider to recalculate averages
    const { data: ratings, error: ratingsError } = await supabase
      .from('order_ratings')
      .select('stars, recommend_solo')
      .eq('rider_id', rider_id);

    if (ratingsError) {
      console.error("Error fetching ratings for rider update:", ratingsError);
      // We proceed even if stats update fails to ensure the rating itself is saved
    } else {
      const total_ratings = ratings.length;
      const total_stars = ratings.reduce((acc, curr) => acc + curr.stars, 0);
      const average_stars = total_stars / total_ratings;

      const nonNullRecommendSolo = ratings.filter(r => r.recommend_solo !== null);
      let solo_delivery_score = null;
      if (nonNullRecommendSolo.length > 0) {
        const trueCount = nonNullRecommendSolo.filter(r => r.recommend_solo === true).length;
        solo_delivery_score = trueCount / nonNullRecommendSolo.length;
      }

      const { error: updateError } = await supabase
        .from('riders')
        .update({
          average_stars,
          total_ratings,
          solo_delivery_score
        })
        .eq('id', rider_id);

      if (updateError) {
        console.error("Error updating rider stats:", updateError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
