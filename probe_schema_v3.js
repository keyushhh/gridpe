import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probeSchema() {
    console.log('--- Probing wallet_transactions constraints ---');
    // We can't easily query information_schema.referential_constraints via RPC without a proxy
    // But we can try to insert a row with a random UUID to see the error message detail if it mentions the table
    const { error } = await supabase.from('wallet_transactions').insert({
        user_id: '414c977e-6f70-4f57-bfa1-af0a8a2053a4',
        type: 'debit',
        amount: 0.01,
        status: 'held',
        description: 'Schema Probe',
        order_id: '00000000-0000-0000-0000-000000000000'
    });

    if (error) {
        console.log('Constraint Error:', error.message);
        console.log('Error Details:', error.details);
    } else {
        console.log('No constraint error for random UUID? That is unexpected.');
    }

    console.log('\n--- Checking profiles for reward_points ---');
    const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('reward_points')
        .eq('id', '414c977e-6f70-4f57-bfa1-af0a8a2053a4')
        .maybeSingle();

    if (pErr) console.error(pErr);
    else console.log('Current user reward points:', profile?.reward_points);
}

probeSchema();
