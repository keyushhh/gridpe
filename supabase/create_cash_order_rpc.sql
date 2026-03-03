-- =======================================================================================
-- Atomic RPC: create_cash_order
-- Bundles creating an order and holding the wallet balance into a single transaction
-- =======================================================================================

CREATE OR REPLACE FUNCTION create_cash_order(
    p_user_id UUID,
    p_address_id UUID,
    p_amount NUMERIC,
    p_order_type TEXT,
    p_meta_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_available_balance NUMERIC;
    v_result JSONB;
BEGIN
    -- 1. Lock the wallet row to prevent race conditions and check balance
    SELECT available_balance INTO v_available_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_available_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found for user_id: %', p_user_id;
    END IF;

    IF v_available_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Available: %, Required: %', v_available_balance, p_amount;
    END IF;

    -- 2. Insert into orders table
    INSERT INTO orders (
        user_id,
        address_id,
        amount,
        order_type,
        status,
        payment_mode,
        currency,
        metadata
    ) VALUES (
        p_user_id,
        p_address_id,
        p_amount,
        p_order_type,
        'pending',
        'wallet',
        'INR',
        p_meta_data
    )
    RETURNING id INTO v_order_id;

    -- 3. Insert into wallet_transactions to hold the amount
    INSERT INTO wallet_transactions (
        user_id,
        amount,
        transaction_type,
        status,
        order_id,
        description
    ) VALUES (
        p_user_id,
        -p_amount, -- Negative amount for held sum
        'held',
        'held',
        v_order_id,
        CASE WHEN p_order_type = 'FX_EXCHANGE' THEN 'FX Exchange Hold' ELSE 'Cash Order Hold' END
    );

    -- Note: DO NOT manually deduct from wallets.available_balance here if your triggers
    -- already calculate 'held' statuses or if the transaction history is enough.
    -- Wait, the user previously had a "held ghost" problem because they subtracted and then triggers didn't release it.
    -- If the wallet system considers 'held' in wallet_transactions as part of the total deducted sum (which we saw in the previous session), we just insert the transaction.
    -- Actually, in wallet_withdraw we updated the available_balance directly safely.
    -- BUT for orders, the user's previous code ONLY did:
    --   insert into orders
    --   insert into wallet_transactions (-amount, 'held', 'held', order_id)
    -- So we just replicate that atomically.
    
    -- Format return JSON exactly as requested
    SELECT jsonb_build_object(
        'id', v_order_id,
        'user_id', p_user_id,
        'address_id', p_address_id,
        'amount', p_amount,
        'order_type', p_order_type,
        'status', 'pending'
    ) INTO v_result;

    RETURN v_result;
END;
$$;
