-- Enable RLS for bank_accounts, bank_cards, and pending_payments
ALTER TABLE IF EXISTS public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_payments ENABLE ROW LEVEL SECURITY;

-- bank_accounts policies
DROP POLICY IF EXISTS "Users can manage their own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can manage their own bank accounts"
ON public.bank_accounts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- bank_cards policies
DROP POLICY IF EXISTS "Users can manage their own bank cards" ON public.bank_cards;
CREATE POLICY "Users can manage their own bank cards"
ON public.bank_cards
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- pending_payments policies (allowing inserts from edge function using service role usually, 
-- but frontend might need to select)
DROP POLICY IF EXISTS "Users can view their own pending payments" ON public.pending_payments;
CREATE POLICY "Users can view their own pending payments"
ON public.pending_payments
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
