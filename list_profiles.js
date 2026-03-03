
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listSomeProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').limit(5);
    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log(`Found ${data.length} profiles.`);
        if (data.length > 0) {
            console.log('Profiles:', JSON.stringify(data, null, 2));
        } else {
            console.log('No profiles found in the table.');
        }
    }
}

listSomeProfiles();
