import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://xxvbmvnrggsgetqswmjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dmJtdm5yZ2dzZ2V0cXN3bWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc0ODgsImV4cCI6MjA4NDEwMzQ4OH0.qxwDinews3GPFuPQxZaHB0wgSyM_S1PxuKvby3fhJAk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tables = ['cash_orders', 'fx_orders'];
  for (const table of tables) {
    console.log(`\n--- Probing columns for [${table}] ---`);
    const { error } = await supabase.from(table).select('non_existent_column');
    if (error) {
      // PostgREST error message usually looks like:
      // "Could not find the column non_existent_column in the schema cache. Choices are: id, user_id, ..."
      const match = error.message.match(/Choices are: (.+)/);
      if (match) {
        console.log(`Columns in ${table}:`, match[1]);
      } else {
        console.log(`Error message for ${table}:`, error.message);
      }
    }
  }
}

run();
