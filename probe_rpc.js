import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probeRPC() {
    console.log('--- Probing RPC signatures ---');
    // Check function definitions in information_schema
    const { data, error } = await supabase.rpc('get_rpc_definition', { function_name: 'create_cash_order' });
    // Since I don't have get_rpc_definition, I'll use a raw query if I can, 
    // but I can't run raw SQL via rpc unless I have an existing proxy.
    // I'll try to call the 10-param version and see if it fails.

    const userId = '414c977e-6f70-4f57-bfa1-af0a8a2053a4';
    const dummyUUID = '00000000-0000-0000-0000-000000000000';

    console.log('Attempting 10-param call...');
    const res10 = await supabase.rpc('create_cash_order', {
        p_user_id: userId,
        p_address_id: dummyUUID,
        p_amount: 100,
        p_order_type: 'CASH_ORDER',
        p_delivery_fee: 0,
        p_platform_fee: 0,
        p_gst: 0,
        p_delivery_tip: 0,
        p_total_amount: 100,
        p_meta_data: {}
    });
    console.log('10-param result:', res10.error ? res10.error.message : 'SUCCESS');

    console.log('\n--- Checking cash_orders columns ---');
    const { data: cols, error: colErr } = await supabase.from('cash_orders').select('*').limit(0);
    if (colErr) {
        console.error('Column check failed:', colErr.message);
    } else {
        // We can't see columns if data is empty easily in console, 
        // but the error would trigger if we select non-existent columns.
        const { error: tipErr } = await supabase.from('cash_orders').select('delivery_tip').limit(0);
        console.log('Column "delivery_tip" exists:', !tipErr);
    }
}

probeRPC();
