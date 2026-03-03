
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTiers() {
    const { data, error } = await supabase.from('wallet_tiers').select('*');
    if (error) {
        console.error('Error fetching tiers:', error);
    } else {
        console.log(`Found ${data.length} tiers.`);
        console.log('Tiers:', JSON.stringify(data, null, 2));
    }
}

listTiers();
