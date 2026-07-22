-- Fixes two issues found in a pre-launch security/stability audit:
--
-- 1. complete_fx_order had a check-then-act race: it SELECTed the held amount,
--    then separately UPDATEd the transaction to 'completed'. Two concurrent/retried
--    calls could both read the same 'pending' row before either write landed,
--    causing held_balance to be decremented twice for a single hold. Fixed to
--    match complete_cash_order's pattern: claim the row and read its amount in a
--    single atomic UPDATE ... RETURNING, so a second concurrent call finds no
--    'pending' row left to claim.
--
-- 2. Neither function checked that the caller (auth.uid()) actually matches
--    p_user_id. Since both are SECURITY DEFINER, any authenticated user could
--    call them directly (e.g. via the Supabase client) with someone else's
--    order_id + user_id and force-complete that person's order, releasing
--    their held balance. Added an explicit ownership check to both.

CREATE OR REPLACE FUNCTION complete_cash_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_amount NUMERIC;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- 1. Update order status and get amount in one go
    UPDATE public.orders
    SET status = 'delivered', updated_at = now()
    WHERE id = p_order_id AND user_id = p_user_id AND status != 'delivered'
    RETURNING total_amount INTO v_amount;

    IF v_amount IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found or already delivered');
    END IF;

    -- 2. Update transaction to 'completed' and 'debit'
    UPDATE wallet_transactions
    SET status = 'completed',
        type = 'debit',
        description = 'Cash Order Delivery Confirmed'
    WHERE order_id = p_order_id
      AND status = 'pending'
      AND type = 'hold'
      AND user_id = p_user_id;

    -- 3. Deduct from held_balance in wallets
    UPDATE wallets
    SET held_balance = held_balance - v_amount
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object('success', true);
END; $$;

CREATE OR REPLACE FUNCTION complete_fx_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_amount NUMERIC;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Atomically claim the pending hold transaction and read its amount in one
    -- step, exactly like complete_cash_order — closes the double-decrement race.
    UPDATE wallet_transactions
    SET status = 'completed',
        type = 'debit',
        description = 'FX Exchange Confirmed'
    WHERE order_id = p_order_id
      AND status = 'pending'
      AND type = 'hold'
      AND user_id = p_user_id
    RETURNING amount INTO v_amount;

    IF v_amount IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending FX hold found for this order ID');
    END IF;

    UPDATE wallets
    SET held_balance = held_balance - v_amount
    WHERE user_id = p_user_id;

    UPDATE orders SET status = 'success', updated_at = NOW() WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
END; $$;
