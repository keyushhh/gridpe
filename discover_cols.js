import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function discoverColumns() {
    const userId = '414c977e-6f70-4f57-bfa1-af0a8a2053a4';
    const cols = ['amount', 'points', 'reward_points', 'value', 'credits'];

    for (const col of cols) {
        console.log(`Trying insert with column: ${col}`);
        const obj = { user_id: userId, type: 'earned', description: 'test' };
        obj[col] = 10;

        const { error } = await supabase.from('reward_transactions').insert(obj);
        if (!error) {
            console.log(`SUCCESS! Column is: ${col}`);
            return;
        } else {
            console.log(`Failed for ${col}: ${error.message}`);
        }
    }
}

discoverColumns();
