import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probe() {
    const syntaxes = [
        '*, addresses(*)',
        '*, addresses!address_id(*)',
        '*, addresses!cash_orders_address_id_fkey(*)'
    ];

    console.log('--- Testing cash_orders joins ---');
    for (const s of syntaxes) {
        const { error: sError } = await supabase.from('cash_orders').select(s).limit(1);
        console.log(`cash_orders Syntax [${s}]: ${sError ? 'FAILED (' + sError.message + ')' : 'SUCCESS'}`);
    }

    console.log('--- Testing fx_orders joins ---');
    for (const s of syntaxes) {
        const { error: sError } = await supabase.from('fx_orders').select(s).limit(1);
        console.log(`fx_orders Syntax [${s}]: ${sError ? 'FAILED (' + sError.message + ')' : 'SUCCESS'}`);
    }
}

probe();
