import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probe() {
    const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'profiles' });
    // Since I don't know if get_table_constraints exists, I'll try to query information_schema if possible,
    // but Supabase usually restricts it. 
    // Let's try to just test the join syntax with a different name.

    const syntaxes = [
        'id, wallet_tiers!current_tier_id(name)',
        'id, wallet_tiers!scheduled_tier_id(name)',
        'id, wallet_tiers!profiles_current_tier_id_fkey(name)',
        'id, wallet_tiers!profiles_scheduled_tier_id_fkey(name)'
    ];

    for (const s of syntaxes) {
        const { error: sError } = await supabase.from('profiles').select(s).limit(1);
        console.log(`Syntax [${s}]: ${sError ? 'FAILED (' + sError.message + ')' : 'SUCCESS'}`);
    }
}

probe();
