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
        console.log('Sample row from cash_orders:', data[0]);
    } else {
        console.log('No rows in cash_orders');
    }
}

probe();
