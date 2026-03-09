-- =============================================================================
-- Atomic Order Creation RPCs (CORRECTED)
-- =============================================================================

-- 1. Create Cash Order RPC
CREATE OR REPLACE FUNCTION create_cash_order(
    p_user_id UUID,
    p_address_id UUID,
    p_amount NUMERIC,
    p_order_type TEXT,
    p_meta_data JSONB DEFAULT '{}'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- 1. Insert into cash_orders instead of orders
    INSERT INTO public.cash_orders (
        user_id, 
        address_id, 
        item_value, -- Using item_value as per user's hint for cash orders
        status, 
        payment_mode,
        metadata
    ) VALUES (
        p_user_id, 
        p_address_id, 
        p_amount, 
        'pending', 
        'wallet',
        p_meta_data
    ) RETURNING id INTO v_order_id;

    -- 2. Place HOLD on wallet
    INSERT INTO public.wallet_transactions (
        user_id, 
        type, 
        amount, 
        status, 
        description, 
        order_id
    ) VALUES (
        p_user_id, 
        'debit', 
        p_amount, 
        'held', 
        'Hold for Cash Order #' || v_order_id, 
        v_order_id
    );

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- 2. Create FX Order RPC
CREATE OR REPLACE FUNCTION create_fx_order(
    p_user_id UUID,
    p_address_id UUID,
    p_amount NUMERIC, -- Total amount to be held
    p_order_type TEXT,
    p_meta_data JSONB DEFAULT '{}'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- 1. Insert into fx_orders instead of orders
    INSERT INTO public.fx_orders (
        user_id, 
        address_id, 
        amount_total, -- Using amount_total as per user's hint for FX orders
        status, 
        payment_mode,
        metadata
    ) VALUES (
        p_user_id, 
        p_address_id, 
        p_amount, 
        'pending', 
        'wallet',
        p_meta_data
    ) RETURNING id INTO v_order_id;

    -- 2. Place HOLD on wallet
    INSERT INTO public.wallet_transactions (
        user_id, 
        type, 
        amount, 
        status, 
        description, 
        order_id
    ) VALUES (
        p_user_id, 
        'debit', 
        p_amount, 
        'held', 
        'Hold for FX Order #' || v_order_id, 
        v_order_id
    );

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;
