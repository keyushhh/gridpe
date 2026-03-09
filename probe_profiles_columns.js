import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probe() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.error('Probe failed:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('Columns in profiles:', Object.keys(data[0]));
    } else {
        // If no data, try to select specific columns one by one
        const columns = [
            'id', 'name', 'avatar_url', 'kyc_status', 'email', 'is_fx_enabled',
            'current_tier_id', 'scheduled_tier_id', 'tier_change_date',
            'payment_status', 'subscription_status', 'reward_points'
        ];
        for (const col of columns) {
            const { error: colError } = await supabase.from('profiles').select(col).limit(1);
            console.log(`Column ${col}: ${colError ? 'MISSING (' + colError.message + ')' : 'EXISTS'}`);
        }
    }
}

probe();
