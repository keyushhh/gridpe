-- Fix complete_cash_order to look up transaction by order_id
CREATE OR REPLACE FUNCTION complete_cash_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_amount NUMERIC;
BEGIN
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

-- Also fix complete_fx_order if it follows the same pattern
CREATE OR REPLACE FUNCTION complete_fx_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_amount NUMERIC;
BEGIN
    SELECT amount INTO v_amount
    FROM wallet_transactions
    WHERE order_id = p_order_id 
      AND status = 'pending' 
      AND type = 'hold' 
      AND user_id = p_user_id;

    IF v_amount IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending FX hold found for this order ID');
    END IF;

    UPDATE wallet_transactions
    SET status = 'completed', 
        type = 'debit', 
        description = 'FX Exchange Confirmed'
    WHERE order_id = p_order_id 
      AND status = 'pending' 
      AND type = 'hold' 
      AND user_id = p_user_id;

    UPDATE wallets
    SET held_balance = held_balance - v_amount
    WHERE user_id = p_user_id;

    UPDATE orders SET status = 'success', updated_at = NOW() WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
END; $$;
