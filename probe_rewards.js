import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probeRewards() {
    console.log('--- Probing reward_transactions schema ---');
    // Attempt to select one row to see columns
    const { data, error } = await supabase.from('reward_transactions').select('*').limit(1);
    if (error) {
        console.log('Error selecting reward_transactions:', error.message);
    } else {
        console.log('Columns in reward_transactions:', data.length > 0 ? Object.keys(data[0]) : 'No data, trying insert to see error...');

        // If no data, try a dummy insert to trigger a column error and see available columns (if possible)
        // Or just try selecting from information_schema if we had a service key, but we don't here.
        const { error: insError } = await supabase.from('reward_transactions').insert({
            user_id: '414c977e-6f70-4f57-bfa1-af0a8a2053a4',
            amount: 100 // This is expected to fail based on user report
        });
        console.log('Insert error with "amount":', insError?.message);

        // Try "points"
        const { error: insPointsError } = await supabase.from('reward_transactions').insert({
            user_id: '414c977e-6f70-4f57-bfa1-af0a8a2053a4',
            points: 100
        });
        console.log('Insert error with "points":', insPointsError?.message);
    }
}

probeRewards();
