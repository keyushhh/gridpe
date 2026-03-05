-- =============================================================================
-- FINAL DEFINITIVE FIX: Wallet History RLS + Forfeiture RPC
-- Run this ENTIRE block in the Supabase SQL Editor.
-- =============================================================================

-- 1. Ensure metadata column exists
ALTER TABLE wallet_transactions 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

-- 2. Grant SELECT access (Fixes empty history bug)
DROP POLICY IF EXISTS "Users can read own transactions" ON wallet_transactions;
CREATE POLICY "Users can read own transactions"
ON wallet_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 3. Grant INSERT access (Fixes adjustment insertion)
DROP POLICY IF EXISTS "Users can insert own transactions" ON wallet_transactions;
CREATE POLICY "Users can insert own transactions"
ON wallet_transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Grant Wallet READ access
DROP POLICY IF EXISTS "Users can read own wallet" ON wallets;
CREATE POLICY "Users can read own wallet"
ON wallets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 5. Grant Wallet UPDATE access
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
CREATE POLICY "Users can update own wallet"
ON wallets FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create Atomic Forfeiture RPC (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION apply_tier_forfeiture(
    p_user_id UUID, p_new_tier_id UUID, p_new_limit NUMERIC, p_current_balance NUMERIC
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF (p_current_balance - p_new_limit) > 0 THEN
        INSERT INTO wallet_transactions (user_id, transaction_type, amount, status, description)
        VALUES (p_user_id, 'tier_adjustment', p_current_balance - p_new_limit, 'completed', 'Tier Limit Adjustment');
        UPDATE wallets SET available_balance = p_new_limit WHERE user_id = p_user_id;
    END IF;
    UPDATE profiles SET current_tier_id = p_new_tier_id, scheduled_tier_id = NULL, tier_change_date = NULL WHERE id = p_user_id;
    UPDATE wallets SET tier_id = p_new_tier_id WHERE user_id = p_user_id;
    RETURN jsonb_build_object('success', true);
END; $$;

-- 7. Sync cache
NOTIFY pgrst, 'reload schema';
