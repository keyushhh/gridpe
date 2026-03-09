-- CLEANUP: Drop all existing overloads of create_cash_order and create_fx_order to resolve ambiguity
DROP FUNCTION IF EXISTS public.create_cash_order(UUID, UUID, NUMERIC, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.create_cash_order(UUID, UUID, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS public.create_cash_order(UUID, UUID, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS public.create_cash_order(UUID, UUID, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB);

DROP FUNCTION IF EXISTS public.create_fx_order(UUID, UUID, NUMERIC, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.create_fx_order(UUID, UUID, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS public.create_fx_order(UUID, UUID, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB);

-- FIX: Drop the problematic FK constraint on wallet_transactions
ALTER TABLE IF EXISTS public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_order_id_fkey;

-- RE-CREATE: The 10-parameter versions (latest)

-- 1. Create Cash Order RPC
CREATE OR REPLACE FUNCTION create_cash_order(
    p_user_id UUID,
    p_address_id UUID,
    p_amount NUMERIC, -- item_value
    p_order_type TEXT,
    p_delivery_fee NUMERIC DEFAULT 0,
    p_platform_fee NUMERIC DEFAULT 0,
    p_gst NUMERIC DEFAULT 0,
    p_delivery_tip NUMERIC DEFAULT 0,
    p_total_amount NUMERIC DEFAULT 0,
    p_meta_data JSONB DEFAULT '{}'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order_id UUID;
BEGIN
    INSERT INTO public.cash_orders (
        user_id, address_id, item_value, delivery_fee, platform_fee, gst, delivery_tip, total_amount, status, payment_mode, metadata
    ) VALUES (
        p_user_id, p_address_id, p_amount, p_delivery_fee, p_platform_fee, p_gst, p_delivery_tip,
        COALESCE(NULLIF(p_total_amount, 0), p_amount + p_delivery_fee + p_platform_fee + p_gst + p_delivery_tip),
        'processing', 'wallet', p_meta_data
    ) RETURNING id INTO v_order_id;

    INSERT INTO public.wallet_transactions (
        user_id, type, amount, status, description, order_id
    ) VALUES (
        p_user_id, 'debit', COALESCE(NULLIF(p_total_amount, 0), p_amount + p_delivery_fee + p_platform_fee + p_gst + p_delivery_tip), 
        'held', 'Hold for Cash Order #' || v_order_id, v_order_id
    );

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- 2. Create FX Order RPC
CREATE OR REPLACE FUNCTION create_fx_order(
    p_user_id UUID,
    p_address_id UUID,
    p_amount NUMERIC, -- amount_total
    p_order_type TEXT,
    p_delivery_fee NUMERIC DEFAULT 0,
    p_platform_fee NUMERIC DEFAULT 0,
    p_gst NUMERIC DEFAULT 0,
    p_delivery_tip NUMERIC DEFAULT 0,
    p_meta_data JSONB DEFAULT '{}'
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order_id UUID;
BEGIN
    INSERT INTO public.fx_orders (
        user_id, address_id, amount_total, delivery_fee, platform_fee, gst, delivery_tip, status, payment_mode, metadata
    ) VALUES (
        p_user_id, p_address_id, p_amount, p_delivery_fee, p_platform_fee, p_gst, p_delivery_tip,
        'processing', 'wallet', p_meta_data
    ) RETURNING id INTO v_order_id;

    INSERT INTO public.wallet_transactions (
        user_id, type, amount, status, description, order_id
    ) VALUES (
        p_user_id, 'debit', p_amount, 'held', 'Hold for FX Order #' || v_order_id, v_order_id
    );

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- Final Schema Cache Refresh
NOTIFY pgrst, 'reload schema';
