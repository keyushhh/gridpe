import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probeOrderStatus() {
    const userId = '414c977e-6f70-4f57-bfa1-af0a8a2053a4'; // known user ID from previous tests

    console.log('--- Probing Cash Orders ---');
    const { data: cashOrders, error: cashError } = await supabase
        .from('cash_orders')
        .select('id, status, item_value, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(3);

    if (cashError) console.error(cashError);
    console.log(JSON.stringify(cashOrders, null, 2));

    console.log('\n--- Probing FX Orders ---');
    const { data: fxOrders, error: fxError } = await supabase
        .from('fx_orders')
        .select('id, status, amount_total, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(3);

    if (fxError) console.error(fxError);
    console.log(JSON.stringify(fxOrders, null, 2));

    console.log('\n--- Probing Wallet Transactions (latest) ---');
    const { data: walletTx, error: wError } = await supabase
        .from('wallet_transactions')
        .select('id, type, transaction_type, status, amount, description')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (wError) console.error(wError);
    console.log(JSON.stringify(walletTx, null, 2));

    console.log('\n--- Probing Reward Points ---');
    const { data: profile } = await supabase.from('profiles').select('id, reward_points').eq('id', userId).single();
    console.log('Profile:', profile);

    const { data: rewards } = await supabase.from('reward_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3);
    console.log('Recent Rewards:', rewards);
}

probeOrderStatus();
