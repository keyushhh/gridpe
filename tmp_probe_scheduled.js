
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    const cols = ['current_tier_id', 'scheduled_tier_id', 'wallet_limit', 'daily_limit', 'tier_change_date'];
    for (const c of cols) {
        const { error } = await supabase.from('profiles').select(c).limit(1);
        console.log(`Column ${c}: ${error ? 'MISSING (' + error.message + ')' : 'EXISTS'}`);
    }
}

probe();
