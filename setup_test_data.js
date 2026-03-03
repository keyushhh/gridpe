
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const USER_ID = "414c977e-6f70-4f57-bfa1-af0a8a2053a4";
const TIER_ID = "fbef1e55-688d-4916-91b5-2a44a2ff3380"; // Starter

async function setupTestData() {
    console.log(`Setting up data for USER_ID: ${USER_ID}`);

    // Try normal insert first to see better error if it fails
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .insert({
            id: USER_ID,
            name: "Test User",
            kyc_status: "incomplete",
            mpin_set: false,
            current_tier_id: TIER_ID
        })
        .select()
        .maybeSingle();

    if (pError) {
        console.error('Error inserting profile:', JSON.stringify(pError, null, 2));
    } else {
        console.log('Profile created or existed:', profile?.id);
    }

    // Ensure Wallet exists and has the right tier
    const { data: wallet, error: wError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', USER_ID)
        .maybeSingle();

    if (wError) {
        console.error('Error fetching wallet:', wError);
    } else if (!wallet) {
        console.log('Creating missing wallet...');
        const { error: cwError } = await supabase
            .from('wallets')
            .insert({
                user_id: USER_ID,
                available_balance: 1000, // Give some balance for testing
                held_balance: 0,
                tier_id: TIER_ID
            });
        if (cwError) console.error('Error creating wallet:', cwError);
        else console.log('Wallet created.');
    } else {
        console.log('Wallet already exists. Updating tier...');
        const { error: uwError } = await supabase
            .from('wallets')
            .update({ tier_id: TIER_ID })
            .eq('user_id', USER_ID);
        if (uwError) console.error('Error updating wallet tier:', uwError);
        else console.log('Wallet tier updated.');
    }
}

setupTestData();
