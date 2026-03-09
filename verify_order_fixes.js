import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Mock the normalizeOrder and fetch functions from src/lib/orders.ts logic
const normalizeOrder = (o, type) => ({
    ...o,
    amount: type === 'CASH_ORDER' ? o.item_value : o.amount_total,
    order_type: type,
    created_at: o.created_at || o.updated_at
});

async function verifyQueries() {
    const userId = '414c977e-6f70-4f57-bfa1-af0a8a2053a4'; // Example user ID from verify-payment

    console.log('--- Testing fetchRecentOrders logic ---');
    try {
        const [cashRes, fxRes] = await Promise.all([
            supabase.from('cash_orders').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(5),
            supabase.from('fx_orders').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(5)
        ]);
        console.log('fetchRecentOrders: SUCCESS');
        console.log('Cash count:', cashRes.data?.length);
        console.log('FX count:', fxRes.data?.length);
    } catch (e) {
        console.error('fetchRecentOrders: FAILED', e);
    }

    console.log('\n--- Testing fetchActiveOrders logic ---');
    try {
        const [cashRes, fxRes] = await Promise.all([
            supabase.from('cash_orders').select('*').eq('user_id', userId).in('status', ['processing', 'out_for_delivery', 'arrived', 'pending']).order('updated_at', { ascending: false }),
            supabase.from('fx_orders').select('*').eq('user_id', userId).in('status', ['processing', 'out_for_delivery', 'arrived', 'pending']).order('updated_at', { ascending: false })
        ]);
        console.log('fetchActiveOrders: SUCCESS');
    } catch (e) {
        console.error('fetchActiveOrders: FAILED', e);
    }

    console.log('\n--- Testing fetchPastOrders logic ---');
    try {
        const [cashRes, fxRes] = await Promise.all([
            supabase.from('cash_orders').select('*').eq('user_id', userId).in('status', ['delivered', 'success', 'failed', 'cancelled']).order('updated_at', { ascending: false }),
            supabase.from('fx_orders').select('*').eq('user_id', userId).in('status', ['delivered', 'success', 'failed', 'cancelled']).order('updated_at', { ascending: false })
        ]);
        console.log('fetchPastOrders: SUCCESS');
    } catch (e) {
        console.error('fetchPastOrders: FAILED', e);
    }
}

verifyQueries();
