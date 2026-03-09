-- =============================================================================
-- FINAL REWARDS & ORDER SYSTEM FIX (CONSOLIDATED)
-- =============================================================================

-- 1. Profiles Sync System
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reward_points BIGINT DEFAULT 0;

-- 2. Ensure Order Tables match Frontend Model
-- For cash_orders
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id);
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0;
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS gst NUMERIC DEFAULT 0;
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS delivery_tip NUMERIC DEFAULT 0;
ALTER TABLE public.cash_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;

-- For fx_orders
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id);
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0;
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS gst NUMERIC DEFAULT 0;
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS delivery_tip NUMERIC DEFAULT 0;
ALTER TABLE public.fx_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;

-- 3. Reward Transactions Ledger
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'earned', 'redeemed'
    description TEXT,
    reference_id UUID, -- order_id or redemption_id
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '12 months')
);

-- 4. Enable RLS and Set Policies with DROP guards
ALTER TABLE public.cash_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

-- Cash Orders Policies
DROP POLICY IF EXISTS "Users can view their own cash orders" ON public.cash_orders;
CREATE POLICY "Users can view their own cash orders" 
ON public.cash_orders FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- FX Orders Policies
DROP POLICY IF EXISTS "Users can view their own fx orders" ON public.fx_orders;
CREATE POLICY "Users can view their own fx orders" 
ON public.fx_orders FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Reward Transactions Policies
DROP POLICY IF EXISTS "Users can view their own reward transactions" ON public.reward_transactions;
CREATE POLICY "Users can view their own reward transactions" 
ON public.reward_transactions FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reward transactions" ON public.reward_transactions;
CREATE POLICY "Users can insert their own reward transactions" 
ON public.reward_transactions FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 5. Updated RPC: create_cash_order
CREATE OR REPLACE FUNCTION create_cash_order(
    p_user_id UUID,
    p_address_id UUID,
    p_amount NUMERIC, -- This is the item_value
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

-- 6. Updated RPC: create_fx_order
CREATE OR REPLACE FUNCTION create_fx_order(
    p_user_id UUID,
    p_address_id UUID,
    p_amount NUMERIC, -- This is the amount_total
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

-- 7. Atomic Completion & Reward Movement
CREATE OR REPLACE FUNCTION complete_cash_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_amount NUMERIC;
BEGIN
    UPDATE public.cash_orders SET status = 'delivered', updated_at = now()
    WHERE id = p_order_id AND user_id = p_user_id AND status != 'delivered'
    RETURNING item_value INTO v_amount;

    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;

    UPDATE public.wallet_transactions SET status = 'completed' WHERE order_id = p_order_id;

    IF v_amount >= 500 THEN
        INSERT INTO public.reward_transactions (user_id, amount, type, description, reference_id)
        VALUES (p_user_id, 50, 'earned', 'Order reward', p_order_id);
        
        UPDATE public.profiles SET reward_points = COALESCE(reward_points, 0) + 50 WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END; $$;

CREATE OR REPLACE FUNCTION complete_fx_order(p_order_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_amount NUMERIC;
BEGIN
    UPDATE public.fx_orders SET status = 'delivered', updated_at = now()
    WHERE id = p_order_id AND user_id = p_user_id AND status != 'delivered'
    RETURNING amount_total INTO v_amount;

    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found'); END IF;

    UPDATE public.wallet_transactions SET status = 'completed' WHERE order_id = p_order_id;

    IF v_amount >= 500 THEN
        INSERT INTO public.reward_transactions (user_id, amount, type, description, reference_id)
        VALUES (p_user_id, 50, 'earned', 'FX Order reward', p_order_id);
        
        UPDATE public.profiles SET reward_points = COALESCE(reward_points, 0) + 50 WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END; $$;
