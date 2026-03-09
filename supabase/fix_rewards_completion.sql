-- =============================================================================
-- DEFINITIVE SCHEMA FIX: Rewards & Order Completion
-- =============================================================================

-- 1. Correct reward_transactions columns
-- We ensure all expected columns exist to support both legacy and new logic
ALTER TABLE IF EXISTS public.reward_transactions 
ADD COLUMN IF NOT EXISTS points_amount INTEGER,
ADD COLUMN IF NOT EXISTS activity_type TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS transaction_type TEXT, -- used in some frontend interfaces
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '12 months');

-- 2. Ensure wallet_transactions is consistent
-- Some RPCs use 'type', others use 'transaction_type'
ALTER TABLE IF EXISTS public.wallet_transactions
ADD COLUMN IF NOT EXISTS transaction_type TEXT;

-- 3. Fix complete_cash_order RPC
CREATE OR REPLACE FUNCTION public.complete_cash_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_amount NUMERIC;
BEGIN
    -- 1. Mark order as delivered
    UPDATE public.cash_orders 
    SET status = 'delivered', updated_at = now()
    WHERE id = p_order_id AND user_id = p_user_id AND status != 'delivered'
    RETURNING item_value INTO v_amount;

    IF NOT FOUND THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Order not found or already delivered'); 
    END IF;

    -- 2. Finalize wallet transaction status
    UPDATE public.wallet_transactions 
    SET status = 'completed' 
    WHERE order_id = p_order_id;

    -- 3. Credit Rewards (if amount >= 500)
    IF v_amount >= 500 THEN
        INSERT INTO public.reward_transactions (user_id, points_amount, activity_type, type, transaction_type, description, reference_id)
        VALUES (p_user_id, 50, 'order_delivery', 'earned', 'credit', 'Order reward', p_order_id);
        
        UPDATE public.profiles 
        SET reward_points = COALESCE(reward_points, 0) + 50 
        WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- 4. Fix complete_fx_order RPC
CREATE OR REPLACE FUNCTION public.complete_fx_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_amount NUMERIC;
BEGIN
    -- 1. Mark order as delivered
    UPDATE public.fx_orders 
    SET status = 'delivered', updated_at = now()
    WHERE id = p_order_id AND user_id = p_user_id AND status != 'delivered'
    RETURNING amount_total INTO v_amount;

    IF NOT FOUND THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Order not found or already delivered'); 
    END IF;

    -- 2. Finalize wallet transaction status
    UPDATE public.wallet_transactions 
    SET status = 'completed' 
    WHERE order_id = p_order_id;

    -- 3. Credit Rewards (if amount >= 500)
    IF v_amount >= 500 THEN
        INSERT INTO public.reward_transactions (user_id, points_amount, activity_type, type, transaction_type, description, reference_id)
        VALUES (p_user_id, 50, 'fx_exchange', 'earned', 'credit', 'FX Order reward', p_order_id);
        
        UPDATE public.profiles 
        SET reward_points = COALESCE(reward_points, 0) + 50 
        WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
