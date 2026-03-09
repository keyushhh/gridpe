import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testRPC() {
    const userId = '414c977e-6f70-4f57-bfa1-af0a8a2053a4'; // Known user

    // 1. Get the latest non-delivered order
    const { data: orders, error } = await supabase
        .from('cash_orders')
        .select('id, status, item_value')
        .eq('user_id', userId)
        .neq('status', 'delivered')
        .order('updated_at', { ascending: false })
        .limit(1);

    if (error || !orders || orders.length === 0) {
        console.log("No pending orders found to test.");
        return;
    }

    const orderId = orders[0].id;
    console.log(`Testing RPC for Order ID: ${orderId}, Status: ${orders[0].status}`);

    // 2. Call the RPC (simulating frontend call)
    const { data: rpcData, error: rpcError } = await supabase.rpc('complete_cash_order', {
        p_order_id: orderId,
        p_user_id: userId
    });

    console.log('RPC Error (network/schema level):', rpcError);
    console.log('RPC Data (application level):', rpcData);
}

testRPC();
