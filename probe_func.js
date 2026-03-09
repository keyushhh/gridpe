import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function probeEdgeFunction() {
    const userId = '414c977e-6f70-4f57-bfa1-af0a8a2053a4';
    const dummyUUID = '00000000-0000-0000-0000-000000000000';

    console.log('--- Probing create-order Edge Function ---');
    try {
        const { data, error } = await supabase.functions.invoke('create-order', {
            body: {
                user_id: userId,
                amount: 100, // item_value
                address_id: dummyUUID,
                order_type: 'CASH_ORDER',
                delivery_fee: 30,
                platform_fee: 6.6,
                gst: 18,
                delivery_tip: 0,
                total_amount: 154.6,
                meta_data: { test: true }
            }
        });

        if (error) {
            console.error('Edge Function returned error:', error);
            // In some cases error.getContext() or similar might have the body
        } else {
            console.log('Edge Function SUCCESS:', data);
        }
    } catch (e) {
        console.error('Invoke failed with exception:', e);
    }
}

probeEdgeFunction();
