export const config = { auth: false };

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// @ts-ignore
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL") ?? "",
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { new_user_id, referral_code } = await req.json();

    if (!new_user_id || !referral_code) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Find the referrer by referral_code
    const { data: referrer, error: referrerError } = await supabase
      .from("profiles")
      .select("id, reward_points, referral_code")
      .eq("referral_code", referral_code.toUpperCase().trim())
      .single();

    if (!referrer || referrerError) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (referrer.id === new_user_id) {
      return new Response(JSON.stringify({ error: "Cannot use your own referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Check new user hasn't already been referred
    const { data: newUserProfile, error: newUserError } = await supabase
      .from("profiles")
      .select("id, reward_points, referred_by")
      .eq("id", new_user_id)
      .single();

    if (!newUserProfile || newUserError) {
      return new Response(JSON.stringify({ error: "New user profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (newUserProfile.referred_by) {
      return new Response(JSON.stringify({ error: "Referral already applied" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Set referred_by on new user
    await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", new_user_id);

    // Step 4: Award referrer 500 points
    const referrerNewPoints = (referrer.reward_points || 0) + 500;
    await supabase.from("profiles").update({ reward_points: referrerNewPoints }).eq("id", referrer.id);
    await supabase.from("reward_transactions").insert({
      user_id: referrer.id,
      points_amount: 500,
      type: "referral",
      reference_id: new_user_id,
      reference_type: "referral",
      description: "Referral bonus — friend joined Grid.Pe"
    });

    // Step 5: Award new user 100 welcome points
    const newUserNewPoints = (newUserProfile.reward_points || 0) + 100;
    await supabase.from("profiles").update({ reward_points: newUserNewPoints }).eq("id", new_user_id);
    await supabase.from("reward_transactions").insert({
      user_id: new_user_id,
      points_amount: 100,
      type: "referral",
      reference_id: referrer.id,
      reference_type: "referral",
      description: "Welcome bonus — joined via referral"
    });

    // Step 6: Badge check for referrer (referral_1 and referral_5 only)
    const { count: referralCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", referrer.id);

    const { data: referrerBadges } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", referrer.id);

    const earnedBadgeIds = (referrerBadges || []).map((b: any) => b.badge_id);

    const { data: referralBadges } = await supabase
      .from("badges")
      .select("*")
      .in("slug", ["referral_1", "referral_5"]);

    const newBadgeSlugs: string[] = [];
    let currentReferrerPoints = referrerNewPoints;

    for (const badge of (referralBadges || [])) {
      if (earnedBadgeIds.includes(badge.id)) continue;
      
      const qualifies =
        (badge.slug === "referral_1" && (referralCount || 0) >= 1) ||
        (badge.slug === "referral_5" && (referralCount || 0) >= 5);
        
      if (qualifies) {
        newBadgeSlugs.push(badge.slug);
        await supabase.from("user_badges").insert({ user_id: referrer.id, badge_id: badge.id });
        await supabase.from("reward_transactions").insert({
          user_id: referrer.id,
          points_amount: badge.points_reward,
          type: "badge_bonus",
          reference_id: badge.id,
          reference_type: "badge",
          description: `Earned badge: ${badge.name}`
        });
        
        currentReferrerPoints += badge.points_reward;
        await supabase.from("profiles")
          .update({ reward_points: currentReferrerPoints })
          .eq("id", referrer.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        referrer_points_awarded: 500,
        new_user_points_awarded: 100,
        new_badges_for_referrer: newBadgeSlugs,
        referral_code_applied: referral_code.toUpperCase().trim()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
