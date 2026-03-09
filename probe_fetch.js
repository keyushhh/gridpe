import dotenv from 'dotenv';
dotenv.config();

const url = `${process.env.VITE_SUPABASE_URL}/functions/v1/create-order`;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function probeWithFetch() {
    const userId = '414c977e-6f70-4f57-bfa1-af0a8a2053a4';
    const dummyUUID = '00000000-0000-0000-0000-000000000000';

    console.log('--- Probing create-order with fetch ---');
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            user_id: userId,
            amount: 100,
            address_id: dummyUUID,
            order_type: 'CASH_ORDER'
        })
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response Body:', text);
}

probeWithFetch();
