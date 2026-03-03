-- =====================================================
-- ATOMIC WALLET RPC FUNCTIONS
-- Copy-paste this ENTIRE script into Supabase SQL Editor
-- and click "Run". That's it.
-- =====================================================

-- 1. wallet_deposit: Atomically credits the wallet
--    Adds amount to wallets.available_balance
--    Inserts a 'credit' row into wallet_transactions
--    Returns the new balance
CREATE OR REPLACE FUNCTION wallet_deposit(
  p_user_id      UUID,
  p_amount       NUMERIC,
  p_description  TEXT DEFAULT 'Wallet top-up',
  p_reference_id TEXT DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  UPDATE wallets
     SET available_balance = available_balance + p_amount
   WHERE user_id = p_user_id
  RETURNING available_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  INSERT INTO wallet_transactions (user_id, type, amount, status, description, reference_id)
  VALUES (p_user_id, 'credit', p_amount, 'completed', p_description, p_reference_id);

  RETURN v_new_balance;
END;
$$;


-- 2. wallet_withdraw: Atomically debits the wallet
--    Locks the row (FOR UPDATE) to prevent race conditions
--    Checks sufficient balance (raises exception if not)
--    Deducts amount from wallets.available_balance
--    Inserts a row into payouts
--    Returns the new balance
CREATE OR REPLACE FUNCTION wallet_withdraw(
  p_user_id       UUID,
  p_amount        NUMERIC,
  p_payout_method TEXT DEFAULT 'upi',
  p_vpa           TEXT DEFAULT NULL,
  p_description   TEXT DEFAULT 'Wallet Withdrawal'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance     NUMERIC;
BEGIN
  -- Lock the row to prevent concurrent withdrawals
  SELECT available_balance INTO v_current_balance
    FROM wallets
   WHERE user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', v_current_balance, p_amount;
  END IF;

  -- Deduct balance
  UPDATE wallets
     SET available_balance = available_balance - p_amount
   WHERE user_id = p_user_id
  RETURNING available_balance INTO v_new_balance;

  -- Insert payout record
  INSERT INTO payouts (user_id, amount, payout_method, vpa, status, description)
  VALUES (p_user_id, p_amount, p_payout_method, p_vpa, 'completed', p_description);

  RETURN v_new_balance;
END;
$$;


-- =====================================================
-- CLEAN HELD TRANSACTIONS
-- These are the rows causing the -₹3,150.10 ghost.
-- Preview first, then run the UPDATE if you agree.
-- =====================================================

-- Preview what will be cancelled:
SELECT id, user_id, amount, description, status, created_at
FROM wallet_transactions
WHERE status = 'held';

-- Cancel all orphaned held rows so they stop inflating held_balance:
UPDATE wallet_transactions SET status = 'cancelled' WHERE status = 'held';
