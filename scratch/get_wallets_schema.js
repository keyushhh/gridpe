
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxvbmvnrggsgetqswmjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dmJtdm5yZ2dzZ2V0cXN3bWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc0ODgsImV4cCI6MjA4NDEwMzQ4OH0.qxwDinews3GPFuPQxZaHB0wgSyM_S1PxuKvby3fhJAk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getWalletsSchema() {
    console.log('Fetching schema for wallets table...');
    
    // We can't query information_schema directly via Postgrest easily unless there's a view.
    // However, we can use the 'rpc' to run a query if there is a generic exec rpc (unlikely)
    // or just fetch one row and infer types.
    
    const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Sample Row:', data[0]);
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('No data in wallets table yet.');
    }
}

getWalletsSchema();
