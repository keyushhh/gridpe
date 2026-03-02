import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { card_number, expiry_month, expiry_year, cvv, card_holder_name } = await req.json()

  // 1. In a real app, you'd call Razorpay's Tokenization API here.
  // For your prototype, we will generate a "Mock Token" to keep the flow moving.
  const mockToken = `tok_${Math.random().toString(36).slice(2, 11)}`;
  const lastFour = card_number.slice(-4);

  // 2. Initialize Supabase Client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 3. Save to the bank_cards table
  const { data, error } = await supabase
    .from('bank_cards')
    .insert([{
      card_holder_name,
      last_four: lastFour,
      expiry_month,
      expiry_year,
      razorpay_token_id: mockToken,
      user_id: (await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] ?? '')).data.user?.id
    }])

  return new Response(JSON.stringify({ success: true, lastFour }), { 
    headers: { "Content-Type": "application/json" } 
  })
})