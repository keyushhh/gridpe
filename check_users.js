import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkUsers() {
    const { data, error } = await supabase.from('profiles').select('id, email').limit(5);
    if (error) {
        console.error('Error fetching profiles:', error.message);
    } else {
        console.log('Existing profiles:', data);
    }

    const hardcodedId = '414c977e-6f70-4f57-bfa1-af0a8a2053a4';
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', hardcodedId).maybeSingle();
    console.log('Hardcoded ID exists in profiles:', !!profile);
}

checkUsers();
