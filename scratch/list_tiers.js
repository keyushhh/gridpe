
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxvbmvnrggsgetqswmjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dmJtdm5yZ2dzZ2V0cXN3bWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc0ODgsImV4cCI6MjA4NDEwMzQ4OH0.qxwDinews3GPFuPQxZaHB0wgSyM_S1PxuKvby3fhJAk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTiers() {
    console.log('Listing all wallet tiers...');
    const { data, error } = await supabase
        .from('wallet_tiers')
        .select('*');

    if (error) {
        console.error('Error fetching tiers:', error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

listTiers();
