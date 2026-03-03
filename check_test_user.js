
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const USER_ID = "414c977e-6f70-4f57-bfa1-af0a8a2053a4";

async function checkUser() {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', USER_ID);
    if (error) {
        console.error('Error fetching user:', error);
    } else {
        console.log(`User ${USER_ID} exists:`, data.length > 0);
        if (data.length > 0) {
            console.log('User Data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No record found for this USER_ID. Consider inserting one.');
        }
    }
}

checkUser();
