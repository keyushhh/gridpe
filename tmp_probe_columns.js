
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesColumns() {
    // Select a non-existent column to see if it errors, or just select *
    const { data, error } = await supabase.from('profiles').select('*').limit(0);
    if (error) {
        console.error('Error:', error);
    } else {
        // Unfortunately, select('*') on empty table doesn't give columns in JS client easily
        // Let's try to select some specific ones and see which fail
        const columns = ['id', 'name', 'avatar_url', 'kyc_status', 'email', 'is_fx_enabled', 'tier_change_date', 'current_tier_id', 'scheduled_tier_id', 'wallet_limit', 'daily_limit'];
        for (const col of columns) {
            const { error: colError } = await supabase.from('profiles').select(col).limit(1);
            if (colError) {
                console.log(`Column ${col} DOES NOT EXIST or error:`, colError.message);
            } else {
                console.log(`Column ${col} EXISTS`);
            }
        }
    }
}

checkProfilesColumns();
