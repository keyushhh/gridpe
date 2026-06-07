import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const today = new Date().toISOString().split('T')[0];

    // 1. Find users whose tier_change_date is today or in the past
    const { data: pendingDowngrades, error: fetchError } = await supabase
      .from('profiles')
      .select('id, scheduled_tier_id, tier_change_date')
      .lte('tier_change_date', today)
      .not('scheduled_tier_id', 'is', null);

    if (fetchError) throw fetchError;

    const results = [];

    for (const profile of (pendingDowngrades || [])) {
      // 2. Fetch the target tier's limits
      const { data: tierData, error: tierError } = await supabase
        .from('wallet_tiers')
        .select('id, name, max_wallet_balance, daily_limit, max_withdrawal_limit')
        .eq('id', profile.scheduled_tier_id)
        .single();

      if (tierError || !tierData) {
        console.error(`Tier data not found for ${profile.scheduled_tier_id}`);
        continue;
      }

      // 3. Fetch transactions and payouts to calculate balance
      const [txRes, payoutRes] = await Promise.all([
        supabase.from('wallet_transactions').select('amount, transaction_type, status, description').eq('user_id', profile.id),
        supabase.from('payouts').select('amount, status').eq('user_id', profile.id)
      ]);

      const transactions = txRes.data || [];
      const payouts = payoutRes.data || [];

      // Balance Calculation Logic (Sync with src/lib/wallet.ts)
      const credits = transactions.reduce((sum, tx) => {
        const type = tx.transaction_type?.toLowerCase();
        const desc = tx.description?.toLowerCase() || '';
        const status = tx.status?.toLowerCase();
        const isTopUp = type === 'credit' || desc.includes('top-up');
        if ((isTopUp || status === 'completed') && (type === 'credit' || type === 'deposit')) {
            return sum + (Number(tx.amount) || 0);
        }
        return sum;
      }, 0);

      const debits = transactions.reduce((sum, tx) => {
        const type = tx.transaction_type?.toLowerCase();
        const desc = tx.description?.toLowerCase() || '';
        const status = tx.status?.toLowerCase();
        if (type === 'debit' && status === 'completed' && !desc.includes('withdrawal')) {
            return sum + (Number(tx.amount) || 0);
        }
        return sum;
      }, 0);

      const withdrawals = payouts.reduce((sum, p) => {
        const status = p.status?.toLowerCase();
        if (status === 'completed' || status === 'success') {
            return sum + (Number(p.amount) || 0);
        }
        return sum;
      }, 0);

      const currentBalance = credits - (debits + withdrawals);
      const limit = tierData.max_wallet_balance;

      // 4. Clip balance if it exceeds the limit
      if (currentBalance > limit) {
        const excess = currentBalance - limit;
        await supabase.from('wallet_transactions').insert({
          user_id: profile.id,
          transaction_type: 'tier_adjustment',
          amount: excess,
          status: 'completed',
          description: 'Tier Limit Adjustment',
          metadata: { 
            scheduled_tier: tierData.name || profile.scheduled_tier_id, 
            limit_enforced: limit,
            burn_amount: excess,
            previous_balance: currentBalance
          }
        });

        // Cap the wallet balance to the new tier limit
        await supabase.from('wallets')
          .update({ available_balance: limit })
          .eq('user_id', profile.id);

      }

      // 5. Apply the final switch
      const { error: updateError } = await supabase.from('profiles').update({
        current_tier_id: tierData.id,
        daily_limit: tierData.daily_limit,
        max_withdrawal_limit: tierData.max_withdrawal_limit,
        scheduled_tier_id: null,
        tier_change_date: null
      }).eq('id', profile.id);

      if (updateError) {
        console.error(`Failed to update profile for ${profile.id}:`, updateError.message);
      } else {
        results.push({ user_id: profile.id, status: 'processed', clipped: currentBalance > limit });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, details: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
