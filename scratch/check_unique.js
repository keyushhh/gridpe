
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxvbmvnrggsgetqswmjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dmJtdm5yZ2dzZ2V0cXN3bWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc0ODgsImV4cCI6MjA4NDEwMzQ4OH0.qxwDinews3GPFuPQxZaHB0wgSyM_S1PxuKvby3fhJAk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    console.log('Checking constraints on wallets table...');
    const { data, error } = await supabase.rpc('get_constraints', { table_name: 'wallets' });
    
    if (error) {
        // If RPC doesn't exist, try a direct query to information_schema
        console.log('RPC get_constraints failed, trying direct query...');
        const { data: schemaData, error: schemaError } = await supabase
            .from('information_schema.table_constraints')
            .select('*')
            .eq('table_name', 'wallets');
        
        if (schemaError) {
            console.error('Error:', schemaError);
        } else {
            console.log('Constraints:', schemaData);
        }
    } else {
        console.log('Constraints:', data);
    }
}

// Alternatively, just try to insert two rows with same user_id and see if it fails.
// But that's destructive. Let's try to fetch the table definition if possible.
// Supabase doesn't allow direct selection from information_schema easily via anon key.

async function checkUnique() {
    // We can try to upsert and see if it works. If it works, there is a unique constraint or primary key.
    // Upsert REQUIRES a unique constraint or primary key.
    console.log('Testing upsert on wallets...');
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supabase
        .from('wallets')
        .upsert({ user_id: testUserId, tier_id: 'fbef1e55-688d-4916-91b5-2a44a2ff3380' }, { onConflict: 'user_id' });
    
    if (error) {
        console.log('Upsert failed (onConflict user_id):', error.message);
    } else {
        console.log('Upsert succeeded! user_id has a unique constraint or is the PK.');
        // Clean up
        await supabase.from('wallets').delete().eq('user_id', testUserId);
    }
}

checkUnique();
