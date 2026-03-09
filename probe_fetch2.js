import dotenv from 'dotenv';
dotenv.config();

const url = `${process.env.VITE_SUPABASE_URL}/functions/v1/create-order`;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function probe() {
    console.log('--- Probing create-order ---');
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            user_id: '414c977e-6f70-4f57-bfa1-af0a8a2053a4',
            amount: 500,
            address_id: '00000000-0000-0000-0000-000000000000',
            order_type: 'CASH_ORDER',
            delivery_fee: 30,
            platform_fee: 6.6,
            gst: 90,
            delivery_tip: 0,
            total_amount: 626.6,
            meta_data: { test: true }
        })
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text);
}

probe();
