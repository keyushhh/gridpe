import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probe() {
    const columns = ['id', 'user_id', 'address_id', 'status', 'created_at'];
    for (const col of columns) {
        const { error: colError } = await supabase.from('fx_orders').select(col).limit(1);
        console.log(`fx_orders Column ${col}: ${colError ? 'MISSING (' + colError.message + ')' : 'EXISTS'}`);
    }
}

probe();
