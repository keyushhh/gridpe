
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listWallets() {
    const { data, error } = await supabase.from('wallets').select('*').limit(5);
    if (error) {
        console.error('Error fetching wallets:', error);
    } else {
        console.log(`Found ${data.length} wallets.`);
        if (data.length > 0) {
            console.log('Wallets:', JSON.stringify(data, null, 2));
        } else {
            console.log('No wallets found in the table.');
        }
    }
}

listWallets();
