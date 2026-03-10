-- =============================================================================
-- REWARD SYSTEM LOGIC REFINEMENT
-- =============================================================================

-- 1. Updated RPC: complete_cash_order
-- Earn 50 points only if order value > 500
CREATE OR REPLACE FUNCTION public.complete_cash_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_amount NUMERIC;
    v_tx_amount NUMERIC;
BEGIN
    -- Get transaction amount first (if still held)
    SELECT amount INTO v_tx_amount 
    FROM public.wallet_transactions 
    WHERE order_id = p_order_id AND status = 'held'
    FOR UPDATE;

    -- Update order status if not already delivered
    UPDATE public.cash_orders 
    SET status = 'delivered', updated_at = now()
    WHERE id = p_order_id AND user_id = p_user_id AND status != 'delivered'
    RETURNING item_value INTO v_amount;

    IF v_amount IS NULL AND v_tx_amount IS NULL THEN
        RETURN jsonb_build_object('success', true, 'note', 'Already completed');
    END IF;

    -- If transaction is still held, deduct balance and complete it
    IF v_tx_amount IS NOT NULL THEN
        UPDATE public.wallets 
        SET available_balance = available_balance - v_tx_amount
        WHERE user_id = p_user_id;

        UPDATE public.wallet_transactions 
        SET status = 'completed', 
            description = 'Cash Order Completion'
        WHERE order_id = p_order_id AND status = 'held';
    END IF;

    -- Credit Rewards (only if amount > 500 and not already awarded)
    IF v_amount > 500 AND NOT EXISTS (SELECT 1 FROM public.reward_transactions WHERE reference_id = p_order_id AND activity_type = 'order_delivery') THEN
        INSERT INTO public.reward_transactions (user_id, points_amount, activity_type, type, transaction_type, description, reference_id)
        VALUES (p_user_id, 50, 'order_delivery', 'earned', 'credit', 'Order reward', p_order_id);
        
        UPDATE public.profiles SET reward_points = COALESCE(reward_points, 0) + 50 WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- 2. Updated RPC: complete_fx_order
CREATE OR REPLACE FUNCTION public.complete_fx_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_amount NUMERIC;
    v_tx_amount NUMERIC;
BEGIN
    -- Get transaction amount first (if still held)
    SELECT amount INTO v_tx_amount 
    FROM public.wallet_transactions 
    WHERE order_id = p_order_id AND status = 'held'
    FOR UPDATE;

    -- Update order status if not already delivered
    UPDATE public.fx_orders 
    SET status = 'delivered', updated_at = now()
    WHERE id = p_order_id AND user_id = p_user_id AND status != 'delivered'
    RETURNING amount_total INTO v_amount;

    IF v_amount IS NULL AND v_tx_amount IS NULL THEN
        RETURN jsonb_build_object('success', true, 'note', 'Already completed');
    END IF;

    -- If transaction is still held, deduct balance and complete it
    IF v_tx_amount IS NOT NULL THEN
        UPDATE public.wallets 
        SET available_balance = available_balance - v_tx_amount
        WHERE user_id = p_user_id;

        UPDATE public.wallet_transactions 
        SET status = 'completed', 
            description = 'FX Exchange Completion'
        WHERE order_id = p_order_id AND status = 'held';
    END IF;

    -- Credit Rewards (only if amount > 500 and not already awarded)
    IF v_amount > 500 AND NOT EXISTS (SELECT 1 FROM public.reward_transactions WHERE reference_id = p_order_id AND activity_type = 'fx_exchange') THEN
        INSERT INTO public.reward_transactions (user_id, points_amount, activity_type, type, transaction_type, description, reference_id)
        VALUES (p_user_id, 50, 'fx_exchange', 'earned', 'credit', 'FX Order reward', p_order_id);
        
        UPDATE public.profiles SET reward_points = COALESCE(reward_points, 0) + 50 WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- 3. New RPC: redeem_reward_points
CREATE OR REPLACE FUNCTION public.redeem_reward_points(
    p_user_id UUID,
    p_points_amount INTEGER,
    p_reference_id UUID,
    p_description TEXT DEFAULT 'Rewards redeemed for discount'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_points BIGINT;
BEGIN
    -- 1. Check current points
    SELECT reward_points INTO v_current_points FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    
    IF v_current_points IS NULL OR v_current_points < p_points_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient reward points');
    END IF;

    IF p_points_amount < 500 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Minimum 500 points required for redemption');
    END IF;

    -- 2. Deduct points
    UPDATE public.profiles 
    SET reward_points = reward_points - p_points_amount 
    WHERE id = p_user_id;

    -- 3. Log transaction
    INSERT INTO public.reward_transactions (
        user_id, points_amount, activity_type, type, transaction_type, description, reference_id
    ) VALUES (
        p_user_id, p_points_amount, 'redemption', 'redeemed', 'debit', p_description, p_reference_id
    );

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- Reload schema
NOTIFY pgrst, 'reload schema';
