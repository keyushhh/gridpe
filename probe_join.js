
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeJoin() {
    // Try multiple join syntaxes
    const syntaxes = [
        'id, current_tier_id, wallet_tiers(*)',
        'id, current_tier_id, wallet_tiers!current_tier_id(*)',
        'id, current_tier_id, wallet_tier:current_tier_id(*)'
    ];

    for (const s of syntaxes) {
        const { data, error } = await supabase.from('profiles').select(s).limit(1);
        if (error) {
            console.log(`Syntax [${s}] FAILED: ${error.message}`);
        } else {
            console.log(`Syntax [${s}] SUCCESS`);
        }
    }
}

probeJoin();
