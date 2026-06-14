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
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL") ?? "",
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { order_id, user_id, order_amount } = await req.json();

    if (!order_id || !user_id || order_amount === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("last_order_date, streak_days, plan_tier, subscription_tier, reward_points")
      .eq("id", user_id)
      .single();

    if (profileError) throw profileError;

    // 2. Points calculation
    let basePoints = Math.max(10, Math.floor(order_amount / 10));
    
    // Pro user bonus
    const isPro = profile.subscription_tier === "pro" || profile.plan_tier === "pro" || profile.plan_tier?.toLowerCase() === "pro";
    if (isPro) {
      basePoints = Math.floor(basePoints * 1.5);
    }

    // 3. Streak logic
    const now = new Date();
    const getISTDateString = (d: Date) => {
      const istTime = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
      return istTime.toISOString().split("T")[0];
    };
    
    const todayStr = getISTDateString(now);
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getISTDateString(yesterdayDate);

    let newStreakDays = profile.streak_days || 0;

    if (profile.last_order_date === todayStr) {
      // unchanged
    } else if (profile.last_order_date === yesterdayStr) {
      newStreakDays += 1;
    } else {
      newStreakDays = 1;
    }

    // Streak bonus
    let streakBonus = 0;
    if (newStreakDays >= 7) {
      streakBonus = 50;
    } else if (newStreakDays >= 3) {
      streakBonus = 20;
    }

    const totalPointsAwarded = basePoints + streakBonus;
    let newTotalPoints = (profile.reward_points || 0) + totalPointsAwarded;

    // 4. Update profile and order
    await supabaseClient
      .from("profiles")
      .update({
        reward_points: newTotalPoints,
        streak_days: newStreakDays,
        last_order_date: todayStr
      })
      .eq("id", user_id);

    await supabaseClient
      .from("orders")
      .update({
        reward_points_earned: totalPointsAwarded
      })
      .eq("id", order_id);

    // Write to reward_transactions
    await supabaseClient
      .from("reward_transactions")
      .insert({
        user_id: user_id,
        points_amount: totalPointsAwarded,
        type: "earned",
        reference_id: order_id,
        reference_type: "order",
        description: `Order reward (Base: ${basePoints}, Streak Bonus: ${streakBonus})`
      });

    // 5. Badge check logic
    const { data: userBadges } = await supabaseClient
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", user_id);
    const earnedBadgeIds = (userBadges || []).map((b: any) => b.badge_id);

    const { count: orderCount } = await supabaseClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("status", "delivered");

    const { count: referralCount } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", user_id);

    const { data: allBadges } = await supabaseClient
      .from("badges")
      .select("*");

    const newBadgeSlugs: string[] = [];
    let additionalBadgePoints = 0;

    for (const badge of (allBadges || [])) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      let qualifies = false;
      if (badge.slug === "first_order" && (orderCount || 0) >= 1) qualifies = true;
      if (badge.slug === "order_5" && (orderCount || 0) >= 5) qualifies = true;
      if (badge.slug === "order_10" && (orderCount || 0) >= 10) qualifies = true;
      if (badge.slug === "order_25" && (orderCount || 0) >= 25) qualifies = true;
      if (badge.slug === "order_50" && (orderCount || 0) >= 50) qualifies = true;
      if (badge.slug === "streak_7" && newStreakDays >= 7) qualifies = true;
      if (badge.slug === "streak_30" && newStreakDays >= 30) qualifies = true;
      if (badge.slug === "referral_1" && (referralCount || 0) >= 1) qualifies = true;
      if (badge.slug === "referral_5" && (referralCount || 0) >= 5) qualifies = true;

      if (qualifies) {
        newBadgeSlugs.push(badge.slug);
        additionalBadgePoints += badge.points_reward;
        
        await supabaseClient.from("user_badges").insert({
          user_id: user_id,
          badge_id: badge.id
        });

        await supabaseClient.from("reward_transactions").insert({
          user_id: user_id,
          points_amount: badge.points_reward,
          type: "badge_bonus",
          reference_id: badge.id,
          reference_type: "badge",
          description: `Earned badge: ${badge.name}`
        });
      }
    }

    // 6. Achievement logic
    const { data: userAchievements } = await supabaseClient
      .from("achievements")
      .select("achievement_type")
      .eq("user_id", user_id);
    const earnedAchTypes = (userAchievements || []).map((a: any) => a.achievement_type);

    const newAchievementTypes: string[] = [];
    const achievementsToCheck = [
      { type: "first_order", condition: (orderCount || 0) >= 1 },
      { type: "order_5", condition: (orderCount || 0) >= 5 },
      { type: "order_10", condition: (orderCount || 0) >= 10 },
      { type: "order_25", condition: (orderCount || 0) >= 25 },
      { type: "order_50", condition: (orderCount || 0) >= 50 },
      { type: "referral_1", condition: (referralCount || 0) >= 1 },
      { type: "referral_5", condition: (referralCount || 0) >= 5 },
      { type: "streak_7", condition: newStreakDays >= 7 },
      { type: "streak_30", condition: newStreakDays >= 30 }
    ];

    for (const ach of achievementsToCheck) {
      if (!earnedAchTypes.includes(ach.type) && ach.condition) {
        newAchievementTypes.push(ach.type);
        await supabaseClient.from("achievements").insert({
          user_id: user_id,
          achievement_type: ach.type,
          points_awarded: 0
        });
      }
    }

    if (additionalBadgePoints > 0) {
      newTotalPoints += additionalBadgePoints;
      await supabaseClient
        .from("profiles")
        .update({ reward_points: newTotalPoints })
        .eq("id", user_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        points_awarded: totalPointsAwarded,
        streak_days: newStreakDays,
        streak_bonus: streakBonus,
        new_badges: newBadgeSlugs,
        new_achievements: newAchievementTypes,
        total_reward_points: newTotalPoints
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
