import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probe() {
    const { data, error } = await supabase.from('cash_orders').select('*').limit(1);
    if (error) {
        console.error('Probe failed:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('Columns in cash_orders:', Object.keys(data[0]));
    } else {
        const columns = ['id', 'user_id', 'address_id', 'status', 'created_at'];
        for (const col of columns) {
            const { error: colError } = await supabase.from('cash_orders').select(col).limit(1);
            console.log(`Column ${col}: ${colError ? 'MISSING (' + colError.message + ')' : 'EXISTS'}`);
        }
    }
}

probe();
