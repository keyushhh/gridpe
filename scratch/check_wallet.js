
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxvbmvnrggsgetqswmjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dmJtdm5yZ2dzZ2V0cXN3bWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjc0ODgsImV4cCI6MjA4NDEwMzQ4OH0.qxwDinews3GPFuPQxZaHB0wgSyM_S1PxuKvby3fhJAk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    console.log('Checking for user with phone: 9876543210');
    
    // 1. Find the user ID from profiles
    const phoneFormats = ['9876543210', '919876543210', '+919876543210'];
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, phone')
        .in('phone', phoneFormats);

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log('No user found with phone number 9876543210 (tried formats: ' + phoneFormats.join(', ') + ')');
        return;
    }

    for (const profile of profiles) {
        console.log('User found:', profile);

        // 2. Check for wallet
        console.log('Checking for wallet for user_id:', profile.id);
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', profile.id)
            .maybeSingle();

        if (walletError) {
            console.error('Error fetching wallet for user ' + profile.id + ':', walletError);
            continue;
        }

        if (!wallet) {
            console.log('No wallet found for user_id:', profile.id);
        } else {
            console.log('Wallet found for user_id ' + profile.id + ':', wallet);
        }
    }
}

checkUser();
