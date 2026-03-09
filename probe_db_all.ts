import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://xxvbmvnrggsgetqswmjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dmJtdm5yZ2dzZ2V0cXN3bWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc0ODgsImV4cCI6MjA4NDEwMzQ4OH0.qxwDinews3GPFuPQxZaHB0wgSyM_S1PxuKvby3fhJAk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- PROBING TABLES ---");
  
  // Try common table names to see which one works
  const tables = ['cash_orders', 'fx_orders', 'orders', 'cash orders', 'fx orders'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table [${table}]: Error - ${error.message} (${error.code})`);
    } else {
      console.log(`Table [${table}]: Success! Data length: ${data?.length}`);
      if (data && data.length > 0) {
        console.log(`Columns in [${table}]:`, Object.keys(data[0]).join(', '));
      } else {
        // Try to get columns by selecting a non-existent column to trigger a "column not found" error which often lists columns
        const { error: colError } = await supabase.from(table).select('non_existent_column').limit(1);
        console.log(`Columns in [${table}] (via error):`, colError?.message);
      }
    }
  }
}

run();
