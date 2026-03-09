import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://xxvbmvnrggsgetqswmjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dmJtdm5yZ2dzZ2V0cXN3bWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc0ODgsImV4cCI6MjA4NDEwMzQ4OH0.qxwDinews3GPFuPQxZaHB0wgSyM_S1PxuKvby3fhJAk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tables = ['cash_orders', 'fx_orders', 'addresses'];
  for (const table of tables) {
    console.log(`--- Columns for ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
        // Use a trick to get columns if table is empty: select something guaranteed to fail
        const { error: colError } = await supabase.from(table).select('non_existent_column');
        // PostgREST errors often contain "Choices are ..."
        console.log(colError?.message);
    }
  }
}

run();
